using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Controllers;
using TerraFusion.Core.DTOs.CanonicalTf;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Data;
using TerraFusion.Data.Services.CanonicalTf;
using Xunit;

namespace TerraFusion.Unit.Tests.CanonicalTf;

/// <summary>
/// Slice B5' controller tests for
/// <c>GET /api/parcels/{tfParcelId}/wsdor-roll?taxYear=...</c>.
/// Pattern: real EF InMemory, claims principal injection, no
/// network. Asserts auth gating, county isolation (cross-county
/// returns 404, not 403), ordering by AssessedVal desc, aggregate
/// totals, and that canonical PII redaction round-trips through.
/// </summary>
public sealed class ParcelWsdorControllerTests : IDisposable
{
    private static readonly Guid CountyA =
        Guid.Parse("19190019-1919-1919-1919-191919191919");
    private static readonly Guid CountyB =
        Guid.Parse("20200020-2020-2020-2020-202020202020");

    private readonly TerraFusionDbContext _db;

    public ParcelWsdorControllerTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"b5p-{Guid.NewGuid():N}")
            .Options;
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "InMemory",
            })
            .Build();
        _db = new TerraFusionDbContext(options, configuration);
        _db.Database.EnsureCreated();
    }

    public void Dispose() => _db.Dispose();

    private ParcelWsdorController BuildController(Guid? principalCountyClaim)
    {
        var reader = new TfParcelWsdorReader(_db);
        var ctrl = new ParcelWsdorController(
            reader, NullLogger<ParcelWsdorController>.Instance);

        var identity = new ClaimsIdentity(
            authenticationType: principalCountyClaim is null ? null : "Test");
        if (principalCountyClaim is not null)
        {
            identity.AddClaim(new Claim("countyId", principalCountyClaim.Value.ToString()));
        }
        ctrl.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(identity),
            },
        };
        return ctrl;
    }

    private async Task<TfParcel> SeedParcelAsync(Guid countyId)
    {
        var p = new TfParcel
        {
            CountyId = countyId,
            ParcelNumber = "P1",
            ParcelStatus = "ACTIVE",
            PropertyType = "R",
        };
        _db.TfParcels.Add(p);
        await _db.SaveChangesAsync();
        return p;
    }

    private async Task<TfOwner> SeedOwnerAsync(
        Guid countyId, long acctId, string displayName, bool confidential = false)
    {
        var o = new TfOwner
        {
            CountyId = countyId,
            AcctId = acctId,
            DisplayName = displayName,
            ConfidentialFlag = confidential,
            PromotionLoadBatchId = Guid.NewGuid(),
        };
        _db.TfOwners.Add(o);
        await _db.SaveChangesAsync();
        return o;
    }

    private async Task SeedAssessmentAsync(
        Guid parcelId, Guid ownerId, Guid countyId,
        short year,
        decimal? assessed = 250_000m,
        decimal? market = 300_000m,
        string? boe = "F",
        decimal? snrFrz = null,
        string? era = null)
    {
        _db.TfAssessmentWsdors.Add(new TfAssessmentWsdor
        {
            CountyId = countyId,
            TfParcelId = parcelId,
            TfOwnerId = ownerId,
            AssessmentYear = year,
            SupNum = 0,
            AssessedVal = assessed,
            MarketVal = market,
            AppraisedVal = assessed,
            TaxableClassified = assessed,
            BoeStatus = boe,
            SnrFrzImprvHs = snrFrz,
            PromotionLoadBatchId = Guid.NewGuid(),
            // G3 (v1.12): default seed era to POST_CONVERSION so the new
            // default era filter on the read endpoint surfaces these rows.
            ConversionEra = era ?? TerraFusion.Core.Entities.TruthPacs.ConversionEras.PostConversion,
        });
        await _db.SaveChangesAsync();
    }

    private static ParcelWsdorRollResponse AssertOk(IActionResult result)
    {
        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        return ok.Value.Should().BeOfType<ParcelWsdorRollResponse>().Subject;
    }

    [Fact]
    public async Task Returns_200_WithSingleEntry_OnHappyPath()
    {
        var parcel = await SeedParcelAsync(CountyA);
        var owner = await SeedOwnerAsync(CountyA, acctId: 1, displayName: "Smith, John");
        await SeedAssessmentAsync(parcel.TfParcelId, owner.TfOwnerId, CountyA,
            year: 2026, assessed: 250_000m, market: 300_000m, boe: "F");

        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetWsdorRoll(parcel.TfParcelId, taxYear: 2026);

        var body = AssertOk(result);
        body.TfParcelId.Should().Be(parcel.TfParcelId);
        body.CountyId.Should().Be(CountyA);
        body.AssessmentYear.Should().Be(2026);
        body.Entries.Should().HaveCount(1);
        body.Entries[0].OwnerDisplayName.Should().Be("Smith, John");
        body.Entries[0].AssessedVal.Should().Be(250_000m);
        body.Entries[0].MarketVal.Should().Be(300_000m);
        body.Entries[0].BoeStatus.Should().Be("F");
        body.AssessedValTotal.Should().Be(250_000m);
        body.MarketValTotal.Should().Be(300_000m);
    }

    [Fact]
    public async Task CoOwnership_Aggregates_AcrossOwners_OrdersByAssessedDesc()
    {
        var parcel = await SeedParcelAsync(CountyA);
        var primary = await SeedOwnerAsync(CountyA, acctId: 1, displayName: "Smith, John");
        var minor = await SeedOwnerAsync(CountyA, acctId: 2, displayName: "Smith, Jane");

        // Insert in non-ordered order to verify reader sorts.
        await SeedAssessmentAsync(parcel.TfParcelId, minor.TfOwnerId, CountyA,
            year: 2026, assessed: 100_000m, market: 120_000m);
        await SeedAssessmentAsync(parcel.TfParcelId, primary.TfOwnerId, CountyA,
            year: 2026, assessed: 200_000m, market: 240_000m);

        var ctrl = BuildController(CountyA);
        var body = AssertOk(await ctrl.GetWsdorRoll(parcel.TfParcelId, 2026));

        body.Entries.Should().HaveCount(2);
        body.Entries[0].OwnerDisplayName.Should().Be("Smith, John",
            "200k > 100k → John first");
        body.Entries[1].OwnerDisplayName.Should().Be("Smith, Jane");
        body.AssessedValTotal.Should().Be(300_000m);
        body.MarketValTotal.Should().Be(360_000m);
    }

    [Fact]
    public async Task ConfidentialOwner_DisplayName_IsRedactedAlready()
    {
        // Doctrine: B3 already redacted the display name. B5' just
        // surfaces what's in canonical.
        var parcel = await SeedParcelAsync(CountyA);
        var owner = await SeedOwnerAsync(CountyA, acctId: 1,
            displayName: "[Confidential]", confidential: true);
        await SeedAssessmentAsync(parcel.TfParcelId, owner.TfOwnerId, CountyA, 2026);

        var ctrl = BuildController(CountyA);
        var body = AssertOk(await ctrl.GetWsdorRoll(parcel.TfParcelId, 2026));

        body.Entries.Single().OwnerDisplayName.Should().Be("[Confidential]");
    }

    [Fact]
    public async Task NullValueColumns_AreExcluded_FromAggregateTotals()
    {
        var parcel = await SeedParcelAsync(CountyA);
        var ownerA = await SeedOwnerAsync(CountyA, acctId: 1, displayName: "A");
        var ownerB = await SeedOwnerAsync(CountyA, acctId: 2, displayName: "B");

        await SeedAssessmentAsync(parcel.TfParcelId, ownerA.TfOwnerId, CountyA, 2026,
            assessed: 100_000m, market: null);
        await SeedAssessmentAsync(parcel.TfParcelId, ownerB.TfOwnerId, CountyA, 2026,
            assessed: null, market: 250_000m);

        var ctrl = BuildController(CountyA);
        var body = AssertOk(await ctrl.GetWsdorRoll(parcel.TfParcelId, 2026));

        body.AssessedValTotal.Should().Be(100_000m, "NULL excluded");
        body.MarketValTotal.Should().Be(250_000m, "NULL excluded");
    }

    [Fact]
    public async Task AllNullColumn_TotalIsNull_NotZero()
    {
        // Doctrine: the audit signal "not yet valued" is distinct
        // from "valued at zero." Total of all-NULL → null total.
        var parcel = await SeedParcelAsync(CountyA);
        var owner = await SeedOwnerAsync(CountyA, acctId: 1, displayName: "X");
        await SeedAssessmentAsync(parcel.TfParcelId, owner.TfOwnerId, CountyA, 2026,
            assessed: 100_000m, market: null);

        var ctrl = BuildController(CountyA);
        var body = AssertOk(await ctrl.GetWsdorRoll(parcel.TfParcelId, 2026));

        body.MarketValTotal.Should().BeNull(
            "no entry had a market value → total is null, not 0");
    }

    [Fact]
    public async Task Returns_404_WhenParcelMissing()
    {
        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetWsdorRoll(Guid.NewGuid(), 2026);
        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Returns_404_WhenParcelHasNoEntriesForYear()
    {
        var parcel = await SeedParcelAsync(CountyA);
        var owner = await SeedOwnerAsync(CountyA, acctId: 1, displayName: "X");
        // Assessment exists for 2026; caller asks for 2024.
        await SeedAssessmentAsync(parcel.TfParcelId, owner.TfOwnerId, CountyA, 2026);

        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetWsdorRoll(parcel.TfParcelId, 2024);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Returns_404_OnCrossCountyAccess_NotForbid()
    {
        var parcel = await SeedParcelAsync(CountyA);
        var owner = await SeedOwnerAsync(CountyA, acctId: 1, displayName: "X");
        await SeedAssessmentAsync(parcel.TfParcelId, owner.TfOwnerId, CountyA, 2026);

        var ctrl = BuildController(CountyB);
        var result = await ctrl.GetWsdorRoll(parcel.TfParcelId, 2026);

        result.Should().BeOfType<NotFoundResult>(
            "cross-county must NOT be distinguishable from a missing parcel");
    }

    [Fact]
    public async Task Returns_404_OnCrossCountyAccess_EvenWhenNoEntries()
    {
        var parcel = await SeedParcelAsync(CountyA);

        var ctrl = BuildController(CountyB);
        var result = await ctrl.GetWsdorRoll(parcel.TfParcelId, 2026);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Returns_400_OnEmptyGuid()
    {
        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetWsdorRoll(Guid.Empty, 2026);
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Theory]
    [InlineData((short)0)]
    [InlineData((short)-1)]
    public async Task Returns_400_OnNonPositiveTaxYear(short badYear)
    {
        var parcel = await SeedParcelAsync(CountyA);
        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetWsdorRoll(parcel.TfParcelId, badYear);
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Returns_403_WhenNoCountyClaim()
    {
        var parcel = await SeedParcelAsync(CountyA);
        var owner = await SeedOwnerAsync(CountyA, acctId: 1, displayName: "X");
        await SeedAssessmentAsync(parcel.TfParcelId, owner.TfOwnerId, CountyA, 2026);

        var ctrl = BuildController(principalCountyClaim: null);
        var result = await ctrl.GetWsdorRoll(parcel.TfParcelId, 2026);

        result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task EntriesFromOtherYears_AreNotIncluded()
    {
        var parcel = await SeedParcelAsync(CountyA);
        var ownerA = await SeedOwnerAsync(CountyA, acctId: 1, displayName: "Year2026");
        var ownerB = await SeedOwnerAsync(CountyA, acctId: 2, displayName: "Year2024");

        await SeedAssessmentAsync(parcel.TfParcelId, ownerA.TfOwnerId, CountyA, 2026);
        await SeedAssessmentAsync(parcel.TfParcelId, ownerB.TfOwnerId, CountyA, 2024);

        var ctrl = BuildController(CountyA);
        var body = AssertOk(await ctrl.GetWsdorRoll(parcel.TfParcelId, 2026));

        body.Entries.Should().HaveCount(1);
        body.Entries[0].OwnerDisplayName.Should().Be("Year2026");
    }

    [Fact]
    public async Task EntriesFromOtherParcels_AreNotIncluded()
    {
        var parcelA = await SeedParcelAsync(CountyA);
        var parcelB = await SeedParcelAsync(CountyA);
        var ownerA = await SeedOwnerAsync(CountyA, acctId: 1, displayName: "ForParcelA");
        var ownerB = await SeedOwnerAsync(CountyA, acctId: 2, displayName: "ForParcelB");

        await SeedAssessmentAsync(parcelA.TfParcelId, ownerA.TfOwnerId, CountyA, 2026);
        await SeedAssessmentAsync(parcelB.TfParcelId, ownerB.TfOwnerId, CountyA, 2026);

        var ctrl = BuildController(CountyA);
        var body = AssertOk(await ctrl.GetWsdorRoll(parcelA.TfParcelId, 2026));

        body.Entries.Should().HaveCount(1);
        body.Entries[0].OwnerDisplayName.Should().Be("ForParcelA");
    }

    [Fact]
    public async Task FullValueShape_RoundTripsThroughEnvelope()
    {
        var parcel = await SeedParcelAsync(CountyA);
        var owner = await SeedOwnerAsync(CountyA, acctId: 1, displayName: "Owner");

        _db.TfAssessmentWsdors.Add(new TfAssessmentWsdor
        {
            CountyId = CountyA,
            TfParcelId = parcel.TfParcelId,
            TfOwnerId = owner.TfOwnerId,
            AssessmentYear = 2026, SupNum = 0,
            AssessedVal = 350_000m, MarketVal = 425_500m, AppraisedVal = 360_000m,
            TaxableClassified = 200_000m, TaxableNonClassified = 50_000m,
            LandTaxableClassified = 80_000m, LandTaxableNonClassified = 20_000m,
            ImprvTaxableClassified = 120_000m, ImprvTaxableNonClassified = 30_000m,
            StateValueClassified = 150_000m, StateValueNonClassified = 0m,
            BoeStatus = "F",
            DisasterProrationPct = 50.5m,
            SnrFrzImprvHs = 100_000m, SnrFrzLandHs = 25_000m,
            PromotionLoadBatchId = Guid.NewGuid(),
        });
        await _db.SaveChangesAsync();

        var ctrl = BuildController(CountyA);
        var body = AssertOk(await ctrl.GetWsdorRoll(parcel.TfParcelId, 2026));

        var e = body.Entries.Single();
        e.AssessedVal.Should().Be(350_000m);
        e.AppraisedVal.Should().Be(360_000m);
        e.TaxableClassified.Should().Be(200_000m);
        e.LandTaxableClassified.Should().Be(80_000m);
        e.ImprvTaxableClassified.Should().Be(120_000m);
        e.StateValueClassified.Should().Be(150_000m);
        e.BoeStatus.Should().Be("F");
        e.DisasterProrationPct.Should().Be(50.5m);
        e.SnrFrzImprvHs.Should().Be(100_000m);
        e.SnrFrzLandHs.Should().Be(25_000m);
    }
}

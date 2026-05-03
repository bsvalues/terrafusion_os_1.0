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
/// Slice B5 controller tests for
/// <c>GET /api/parcels/{tfParcelId}/owner-current?taxYear=...</c>.
/// Pattern: real EF InMemory, claims principal injection, no
/// network. Asserts auth gating, county isolation (cross-county
/// returns 404, not 403), ordering by primary then pct, and that
/// canonical PII redaction round-trips through the API unchanged.
/// </summary>
public sealed class ParcelOwnerControllerTests : IDisposable
{
    private static readonly Guid CountyA =
        Guid.Parse("19190019-1919-1919-1919-191919191919");
    private static readonly Guid CountyB =
        Guid.Parse("20200020-2020-2020-2020-202020202020");

    private readonly TerraFusionDbContext _db;

    public ParcelOwnerControllerTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"b5-{Guid.NewGuid():N}")
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

    private ParcelOwnerController BuildController(Guid? principalCountyClaim)
    {
        var reader = new TfParcelOwnerReader(_db);
        var ctrl = new ParcelOwnerController(
            reader, NullLogger<ParcelOwnerController>.Instance);

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
        Guid countyId, long acctId, string displayName,
        bool confidential = false, bool webSupp = false)
    {
        var o = new TfOwner
        {
            CountyId = countyId,
            AcctId = acctId,
            DisplayName = displayName,
            ConfidentialFlag = confidential,
            WebSuppression = webSupp,
            PromotionLoadBatchId = Guid.NewGuid(),
        };
        _db.TfOwners.Add(o);
        await _db.SaveChangesAsync();
        return o;
    }

    private async Task SeedLinkAsync(
        Guid parcelId, Guid ownerId, short year, decimal pct, bool isPrimary)
    {
        _db.TfParcelOwnerLinks.Add(new TfParcelOwnerLink
        {
            TfParcelId = parcelId,
            TfOwnerId = ownerId,
            OwnerTaxYr = year,
            PctOwnership = pct,
            IsPrimary = isPrimary,
            SourceTruthOwnerCurrentId = Guid.NewGuid(),
            PromotionLoadBatchId = Guid.NewGuid(),
        });
        await _db.SaveChangesAsync();
    }

    private static ParcelOwnerCurrentResponse AssertOk(IActionResult result)
    {
        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        return ok.Value.Should().BeOfType<ParcelOwnerCurrentResponse>().Subject;
    }

    [Fact]
    public async Task Returns_200_WithSingleOwner_OnHappyPath()
    {
        var parcel = await SeedParcelAsync(CountyA);
        var owner = await SeedOwnerAsync(CountyA, acctId: 1, displayName: "Smith, John");
        await SeedLinkAsync(parcel.TfParcelId, owner.TfOwnerId, year: 2026, pct: 100m, isPrimary: true);

        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetOwnerCurrent(parcel.TfParcelId, taxYear: 2026);

        var body = AssertOk(result);
        body.TfParcelId.Should().Be(parcel.TfParcelId);
        body.CountyId.Should().Be(CountyA);
        body.TaxYear.Should().Be(2026);
        body.Owners.Should().HaveCount(1);
        body.Owners[0].AcctId.Should().Be(1);
        body.Owners[0].DisplayName.Should().Be("Smith, John");
        body.Owners[0].PctOwnership.Should().Be(100m);
        body.Owners[0].IsPrimary.Should().BeTrue();
    }

    [Fact]
    public async Task Returns_200_WithCoOwners_OrderedByPrimaryThenPct()
    {
        var parcel = await SeedParcelAsync(CountyA);
        var primary = await SeedOwnerAsync(CountyA, acctId: 1, displayName: "Smith, John");
        var minor = await SeedOwnerAsync(CountyA, acctId: 2, displayName: "Smith, Jane");
        var sliver = await SeedOwnerAsync(CountyA, acctId: 3, displayName: "Smith, Junior");

        // Insert in non-ordered order to verify reader sorts.
        await SeedLinkAsync(parcel.TfParcelId, sliver.TfOwnerId, 2026, 1m, isPrimary: false);
        await SeedLinkAsync(parcel.TfParcelId, primary.TfOwnerId, 2026, 60m, isPrimary: true);
        await SeedLinkAsync(parcel.TfParcelId, minor.TfOwnerId, 2026, 39m, isPrimary: false);

        var ctrl = BuildController(CountyA);
        var body = AssertOk(await ctrl.GetOwnerCurrent(parcel.TfParcelId, 2026));

        body.Owners.Should().HaveCount(3);
        body.Owners[0].AcctId.Should().Be(1, "primary owner first");
        body.Owners[0].IsPrimary.Should().BeTrue();
        body.Owners[1].AcctId.Should().Be(2, "non-primary by pct desc");
        body.Owners[2].AcctId.Should().Be(3);
    }

    [Fact]
    public async Task ConfidentialOwner_DisplayName_ShowsRedacted()
    {
        // The canonical PII redaction policy is the responsibility of
        // B3; B5 simply reflects what's in the canonical row.
        var parcel = await SeedParcelAsync(CountyA);
        var owner = await SeedOwnerAsync(CountyA, acctId: 1,
            displayName: "[Confidential]", confidential: true);
        await SeedLinkAsync(parcel.TfParcelId, owner.TfOwnerId, 2026, 100m, isPrimary: true);

        var ctrl = BuildController(CountyA);
        var body = AssertOk(await ctrl.GetOwnerCurrent(parcel.TfParcelId, 2026));

        body.Owners.Single().DisplayName.Should().Be("[Confidential]");
        body.Owners.Single().ConfidentialFlag.Should().BeTrue();
    }

    [Fact]
    public async Task WebSuppressionFlag_IsSurfaced_NotHonoredAtThisLayer()
    {
        // Doctrine: web_suppression is a downstream concern. The API
        // surfaces the flag; downstream public-facing services filter.
        var parcel = await SeedParcelAsync(CountyA);
        var owner = await SeedOwnerAsync(CountyA, acctId: 1,
            displayName: "Doe, Jane", webSupp: true);
        await SeedLinkAsync(parcel.TfParcelId, owner.TfOwnerId, 2026, 100m, isPrimary: true);

        var ctrl = BuildController(CountyA);
        var body = AssertOk(await ctrl.GetOwnerCurrent(parcel.TfParcelId, 2026));

        body.Owners.Single().DisplayName.Should().Be("Doe, Jane",
            "web-suppression does not redact at canonical or API layer");
        body.Owners.Single().WebSuppression.Should().BeTrue(
            "but the flag must be surfaced for downstream policy");
    }

    [Fact]
    public async Task Returns_404_WhenParcelMissing()
    {
        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetOwnerCurrent(Guid.NewGuid(), 2026);
        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Returns_404_WhenParcelHasNoLinksForYear()
    {
        var parcel = await SeedParcelAsync(CountyA);
        var owner = await SeedOwnerAsync(CountyA, acctId: 1, displayName: "Smith, John");
        // Link exists for 2026 but caller asks for 2024.
        await SeedLinkAsync(parcel.TfParcelId, owner.TfOwnerId, 2026, 100m, isPrimary: true);

        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetOwnerCurrent(parcel.TfParcelId, 2024);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Returns_404_OnCrossCountyAccess_NotForbid()
    {
        // Doctrine: cross-county must look identical to "missing
        // parcel" so existence cannot be probed.
        var parcel = await SeedParcelAsync(CountyA);
        var owner = await SeedOwnerAsync(CountyA, acctId: 1, displayName: "Smith, John");
        await SeedLinkAsync(parcel.TfParcelId, owner.TfOwnerId, 2026, 100m, isPrimary: true);

        var ctrl = BuildController(CountyB);
        var result = await ctrl.GetOwnerCurrent(parcel.TfParcelId, 2026);

        result.Should().BeOfType<NotFoundResult>(
            "cross-county must NOT be distinguishable from a missing parcel");
    }

    [Fact]
    public async Task Returns_404_OnCrossCountyAccess_EvenWhenNoLinksForYear()
    {
        // The cross-county check fires before "no links" so we still
        // see 404, not a leak via differential timing.
        var parcel = await SeedParcelAsync(CountyA);

        var ctrl = BuildController(CountyB);
        var result = await ctrl.GetOwnerCurrent(parcel.TfParcelId, 2026);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Returns_400_OnEmptyGuid()
    {
        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetOwnerCurrent(Guid.Empty, 2026);
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Theory]
    [InlineData((short)0)]
    [InlineData((short)-1)]
    [InlineData(short.MinValue)]
    public async Task Returns_400_OnNonPositiveTaxYear(short badYear)
    {
        var parcel = await SeedParcelAsync(CountyA);
        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetOwnerCurrent(parcel.TfParcelId, badYear);
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Returns_403_WhenNoCountyClaim()
    {
        var parcel = await SeedParcelAsync(CountyA);
        var owner = await SeedOwnerAsync(CountyA, acctId: 1, displayName: "Smith, John");
        await SeedLinkAsync(parcel.TfParcelId, owner.TfOwnerId, 2026, 100m, isPrimary: true);

        var ctrl = BuildController(principalCountyClaim: null);
        var result = await ctrl.GetOwnerCurrent(parcel.TfParcelId, 2026);

        result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task LinksFromOtherYears_AreNotIncluded()
    {
        var parcel = await SeedParcelAsync(CountyA);
        var o2026 = await SeedOwnerAsync(CountyA, acctId: 1, displayName: "Year 2026");
        var o2024 = await SeedOwnerAsync(CountyA, acctId: 2, displayName: "Year 2024");

        await SeedLinkAsync(parcel.TfParcelId, o2026.TfOwnerId, 2026, 100m, isPrimary: true);
        await SeedLinkAsync(parcel.TfParcelId, o2024.TfOwnerId, 2024, 100m, isPrimary: true);

        var ctrl = BuildController(CountyA);
        var body = AssertOk(await ctrl.GetOwnerCurrent(parcel.TfParcelId, 2026));

        body.Owners.Should().HaveCount(1);
        body.Owners[0].AcctId.Should().Be(1);
    }

    [Fact]
    public async Task LinksFromOtherParcels_AreNotIncluded()
    {
        // Defense-in-depth: the reader filters by TfParcelId.
        var parcelA = await SeedParcelAsync(CountyA);
        var parcelB = await SeedParcelAsync(CountyA);

        var ownerA = await SeedOwnerAsync(CountyA, acctId: 1, displayName: "Owner A");
        var ownerB = await SeedOwnerAsync(CountyA, acctId: 2, displayName: "Owner B");
        await SeedLinkAsync(parcelA.TfParcelId, ownerA.TfOwnerId, 2026, 100m, isPrimary: true);
        await SeedLinkAsync(parcelB.TfParcelId, ownerB.TfOwnerId, 2026, 100m, isPrimary: true);

        var ctrl = BuildController(CountyA);
        var body = AssertOk(await ctrl.GetOwnerCurrent(parcelA.TfParcelId, 2026));

        body.Owners.Should().HaveCount(1);
        body.Owners[0].AcctId.Should().Be(1);
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Controllers;
using TerraFusion.Abstractions.DTOs.CanonicalTf;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Data;
using TerraFusion.Data.Services.CanonicalTf;
using Xunit;

namespace TerraFusion.Unit.Tests.CanonicalTf;

/// <summary>
/// Slice F1 controller tests for
/// <c>GET /api/parcels/open-work?year=...&amp;maxResults=...</c>.
///
/// Pattern: real EF InMemory + claims principal injection, no
/// network. Asserts:
///   - empty wsdor → all parcels surface as pending
///   - parcels with a wsdor row for the requested year are excluded
///   - county isolation (other county's parcels never returned)
///   - maxResults caps the result and surfaces a Truncated flag
///   - missing countyId claim → 403
///   - bad year / out-of-range maxResults → 400
///   - ordering by GeoId asc with NULL last
/// </summary>
public sealed class OpenWorkQueueControllerTests : IDisposable
{
    private static readonly Guid CountyA =
        Guid.Parse("19190019-1919-1919-1919-191919191919");
    private static readonly Guid CountyB =
        Guid.Parse("20200020-2020-2020-2020-202020202020");

    private readonly TerraFusionDbContext _db;

    public OpenWorkQueueControllerTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"f1-{Guid.NewGuid():N}")
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

    private OpenWorkQueueController BuildController(Guid? principalCountyClaim)
    {
        var reader = new OpenWorkReader(_db);
        var ctrl = new OpenWorkQueueController(
            reader, NullLogger<OpenWorkQueueController>.Instance);

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

    private async Task<TfParcel> SeedParcelAsync(
        Guid countyId, string? parcelNumber)
    {
        var p = new TfParcel
        {
            CountyId = countyId,
            ParcelNumber = parcelNumber,
            ParcelStatus = "ACTIVE",
            PropertyType = "R",
        };
        _db.TfParcels.Add(p);
        await _db.SaveChangesAsync();
        return p;
    }

    private async Task SeedWsdorAsync(Guid parcelId, Guid countyId, short year)
    {
        // Each WSDOR row needs an owner FK. Seed a throwaway owner.
        var owner = new TfOwner
        {
            CountyId = countyId,
            AcctId = Random.Shared.NextInt64(),
            DisplayName = "owner-" + Guid.NewGuid().ToString("N")[..8],
            ConfidentialFlag = false,
            PromotionLoadBatchId = Guid.NewGuid(),
        };
        _db.TfOwners.Add(owner);
        await _db.SaveChangesAsync();

        _db.TfAssessmentWsdors.Add(new TfAssessmentWsdor
        {
            CountyId = countyId,
            TfParcelId = parcelId,
            TfOwnerId = owner.TfOwnerId,
            AssessmentYear = year,
            SupNum = 0,
            AssessedVal = 100_000m,
            PromotionLoadBatchId = Guid.NewGuid(),
        });
        await _db.SaveChangesAsync();
    }

    private static OpenWorkResponse AssertOk(IActionResult result)
    {
        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        return ok.Value.Should().BeOfType<OpenWorkResponse>().Subject;
    }

    [Fact]
    public async Task EmptyWsdor_ReturnsAllParcelsAsPending()
    {
        await SeedParcelAsync(CountyA, "001");
        await SeedParcelAsync(CountyA, "002");
        await SeedParcelAsync(CountyA, "003");

        var ctrl = BuildController(CountyA);
        var body = AssertOk(await ctrl.GetOpenWork(year: 2026));

        body.CountyId.Should().Be(CountyA);
        body.AssessmentYear.Should().Be(2026);
        body.Count.Should().Be(3);
        body.Truncated.Should().BeFalse();
        body.Items.Select(i => i.GeoId)
            .Should().ContainInOrder("001", "002", "003");
        body.Items.Should().OnlyContain(
            i => i.PendingReason == "MISSING_WSDOR_FOR_YEAR");
    }

    [Fact]
    public async Task ParcelsWithWsdorForRequestedYear_AreExcluded()
    {
        var pending = await SeedParcelAsync(CountyA, "001");
        var done = await SeedParcelAsync(CountyA, "002");
        await SeedWsdorAsync(done.TfParcelId, CountyA, year: 2026);

        var ctrl = BuildController(CountyA);
        var body = AssertOk(await ctrl.GetOpenWork(year: 2026));

        body.Count.Should().Be(1);
        body.Items.Single().TfParcelId.Should().Be(pending.TfParcelId);
        body.Items.Single().GeoId.Should().Be("001");
    }

    [Fact]
    public async Task WsdorForOtherYear_DoesNotSatisfyRequestedYear()
    {
        // Parcel has a WSDOR row for 2024 — it's still open work for 2026.
        var p = await SeedParcelAsync(CountyA, "001");
        await SeedWsdorAsync(p.TfParcelId, CountyA, year: 2024);

        var ctrl = BuildController(CountyA);
        var body = AssertOk(await ctrl.GetOpenWork(year: 2026));

        body.Count.Should().Be(1);
        body.Items.Single().TfParcelId.Should().Be(p.TfParcelId);
    }

    [Fact]
    public async Task CountyIsolation_DoesNotLeakOtherCountyParcels()
    {
        // CountyA has 1 pending; CountyB has 5 pending. CountyA's
        // caller must only see their own.
        await SeedParcelAsync(CountyA, "A-001");
        for (var i = 0; i < 5; i++)
        {
            await SeedParcelAsync(CountyB, $"B-{i:000}");
        }

        var ctrl = BuildController(CountyA);
        var body = AssertOk(await ctrl.GetOpenWork(year: 2026));

        body.Count.Should().Be(1);
        body.Items.Single().GeoId.Should().Be("A-001");
        body.CountyId.Should().Be(CountyA);
    }

    [Fact]
    public async Task MaxResults_CapsResultAndFlagsTruncated()
    {
        for (var i = 0; i < 10; i++)
        {
            await SeedParcelAsync(CountyA, $"{i:000}");
        }

        var ctrl = BuildController(CountyA);
        var body = AssertOk(await ctrl.GetOpenWork(year: 2026, maxResults: 4));

        body.Count.Should().Be(4);
        body.Truncated.Should().BeTrue("10 pending parcels > maxResults=4");
        body.Items.Select(i => i.GeoId)
            .Should().ContainInOrder("000", "001", "002", "003");
    }

    [Fact]
    public async Task MaxResults_ExactMatch_DoesNotFlagTruncated()
    {
        await SeedParcelAsync(CountyA, "001");
        await SeedParcelAsync(CountyA, "002");

        var ctrl = BuildController(CountyA);
        var body = AssertOk(await ctrl.GetOpenWork(year: 2026, maxResults: 2));

        body.Count.Should().Be(2);
        body.Truncated.Should().BeFalse();
    }

    [Fact]
    public async Task DefaultMaxResults_AppliesWhenCallerOmitsIt()
    {
        // Seed exactly DefaultMaxResults+1 to prove the default actually engages.
        var n = OpenWorkQueueController.DefaultMaxResults + 1;
        for (var i = 0; i < n; i++)
        {
            await SeedParcelAsync(CountyA, $"{i:0000}");
        }

        var ctrl = BuildController(CountyA);
        var body = AssertOk(await ctrl.GetOpenWork(year: 2026));

        body.Count.Should().Be(OpenWorkQueueController.DefaultMaxResults);
        body.Truncated.Should().BeTrue();
    }

    [Fact]
    public async Task NullParcelNumber_SortsLast()
    {
        await SeedParcelAsync(CountyA, parcelNumber: null);
        await SeedParcelAsync(CountyA, parcelNumber: "002");
        await SeedParcelAsync(CountyA, parcelNumber: "001");

        var ctrl = BuildController(CountyA);
        var body = AssertOk(await ctrl.GetOpenWork(year: 2026));

        body.Count.Should().Be(3);
        body.Items[0].GeoId.Should().Be("001");
        body.Items[1].GeoId.Should().Be("002");
        body.Items[2].GeoId.Should().BeNull();
    }

    [Fact]
    public async Task MissingCountyClaim_Returns403()
    {
        await SeedParcelAsync(CountyA, "001");

        var ctrl = BuildController(principalCountyClaim: null);
        var result = await ctrl.GetOpenWork(year: 2026);

        result.Should().BeOfType<ForbidResult>();
    }

    [Theory]
    [InlineData((short)0)]
    [InlineData((short)-1)]
    public async Task NonPositiveYear_Returns400(short badYear)
    {
        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetOpenWork(year: badYear);
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    [InlineData(1001)]
    public async Task OutOfRangeMaxResults_Returns400(int badMax)
    {
        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetOpenWork(year: 2026, maxResults: badMax);
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task NoParcelsInCounty_Returns200WithEmptyItems()
    {
        // CountyB has parcels; CountyA has none.
        await SeedParcelAsync(CountyB, "B-001");

        var ctrl = BuildController(CountyA);
        var body = AssertOk(await ctrl.GetOpenWork(year: 2026));

        body.Count.Should().Be(0);
        body.Items.Should().BeEmpty();
        body.Truncated.Should().BeFalse();
        body.CountyId.Should().Be(CountyA);
    }

    [Fact]
    public async Task ResponseEnvelope_PopulatesYearAndCountyFromCallerClaim()
    {
        await SeedParcelAsync(CountyA, "001");

        var ctrl = BuildController(CountyA);
        var body = AssertOk(await ctrl.GetOpenWork(year: 2027, maxResults: 50));

        body.AssessmentYear.Should().Be(2027);
        body.CountyId.Should().Be(CountyA);
    }
}

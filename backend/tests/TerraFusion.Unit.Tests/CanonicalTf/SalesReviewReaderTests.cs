using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.SalesReview;
using TerraFusion.Data;
using TerraFusion.Data.Services.CanonicalTf;
using Xunit;

namespace TerraFusion.Unit.Tests.CanonicalTf;

/// <summary>
/// Slice F2 acceptance tests for <see cref="SalesReviewReader"/>.
///
/// <para>The "needs review" predicate is
/// <c>!DorRatioReviewed || !CountyRatioReviewed</c>; rows where
/// both flags are true are excluded. The lookback window is
/// applied against an injected "now" so the tests are independent
/// of wall-clock drift.</para>
/// </summary>
public sealed class SalesReviewReaderTests : IDisposable
{
    /// <summary>Frozen "now" used by every test. Pick a date well
    /// inside the post-conversion era so the default era filter
    /// admits seeded rows.</summary>
    private static readonly DateTime FrozenNow =
        new(2025, 6, 15, 12, 0, 0, DateTimeKind.Utc);

    private readonly TerraFusionDbContext _db;

    public SalesReviewReaderTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"f2-{Guid.NewGuid():N}")
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

    private SalesReviewReader Build() => new(_db, () => FrozenNow);

    private async Task<Guid> SeedSaleAsync(
        Guid countyId,
        DateTime? slDt,
        bool dorQualified = false,
        bool countyReviewed = false,
        bool countyQualified = false,
        string? era = ConversionEras.PostConversion,
        decimal? slPrice = 250_000m)
    {
        var id = Guid.NewGuid();
        _db.TfSales.Add(new TfSale
        {
            TfSaleId = id,
            CountyId = countyId,
            TfParcelId = Guid.NewGuid(),
            ChgOfOwnerId = id.GetHashCode(),
            SlDt = slDt,
            SlPrice = slPrice,
            AdjSlPrice = slPrice,
            SaleQualified = dorQualified || countyQualified,
            DorRatioQualified = dorQualified,
            CountyRatioReviewed = countyReviewed,
            CountyRatioQualified = countyQualified,
            PromotionLoadBatchId = Guid.NewGuid(),
            ConversionEra = era,
        });
        await _db.SaveChangesAsync();
        return id;
    }

    // ─────────────────────────────────────────────────────────────────
    // Predicate: review-pending coverage
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ReturnsSalesWhereDorNotQualified()
    {
        // F2 surfaces "DOR review pending" as DorRatioQualified=false:
        // the always-on DOR rule has not produced a qualifying outcome
        // for this row, so the analyst should look at it.
        var county = Guid.NewGuid();
        var saleId = await SeedSaleAsync(county,
            slDt: FrozenNow.AddYears(-1),
            dorQualified: false, countyReviewed: true);

        var rows = await Build().GetReviewQueueAsync(county);

        rows.Should().ContainSingle()
            .Which.TfSaleId.Should().Be(saleId);
        rows[0].ReviewReason.Should().Be("DOR_REVIEW_PENDING");
    }

    [Fact]
    public async Task ReturnsSalesWhereCountyReviewedFalse()
    {
        var county = Guid.NewGuid();
        var saleId = await SeedSaleAsync(county,
            slDt: FrozenNow.AddYears(-1),
            dorQualified: true, countyReviewed: false);

        var rows = await Build().GetReviewQueueAsync(county);

        rows.Should().ContainSingle()
            .Which.TfSaleId.Should().Be(saleId);
        rows[0].ReviewReason.Should().Be("COUNTY_REVIEW_PENDING");
    }

    [Fact]
    public async Task ReturnsSalesWhereBothReviewsFalse_WithBothPendingReason()
    {
        var county = Guid.NewGuid();
        await SeedSaleAsync(county,
            slDt: FrozenNow.AddYears(-1),
            dorQualified: false, countyReviewed: false);

        var rows = await Build().GetReviewQueueAsync(county);

        rows.Should().ContainSingle()
            .Which.ReviewReason.Should().Be("BOTH_REVIEWS_PENDING");
    }

    [Fact]
    public async Task ExcludesSalesWhereBothReviewsComplete()
    {
        var county = Guid.NewGuid();
        await SeedSaleAsync(county,
            slDt: FrozenNow.AddYears(-1),
            dorQualified: true, countyReviewed: true);

        var rows = await Build().GetReviewQueueAsync(county);

        rows.Should().BeEmpty(
            "rows with both reviews complete are not in the queue");
    }

    // ─────────────────────────────────────────────────────────────────
    // Lookback window
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task LookbackYears_ExcludesOldSales()
    {
        var county = Guid.NewGuid();
        await SeedSaleAsync(county,
            slDt: FrozenNow.AddYears(-2),
            dorQualified: false, countyReviewed: true); // in window
        await SeedSaleAsync(county,
            slDt: FrozenNow.AddYears(-5),
            dorQualified: false, countyReviewed: true); // outside window

        var rows = await Build().GetReviewQueueAsync(county, lookbackYears: 3);

        rows.Should().HaveCount(1, "default lookback=3 excludes the 5-year-old row");
    }

    [Fact]
    public void LookbackYears_DefaultIsThree()
    {
        ISalesReviewReader.DefaultLookbackYears.Should().Be(3);
    }

    [Fact]
    public async Task LookbackYears_NegativeOrZero_ClampsToOne()
    {
        var county = Guid.NewGuid();
        await SeedSaleAsync(county,
            slDt: FrozenNow.AddMonths(-6), // within last year
            dorQualified: false, countyReviewed: true);
        await SeedSaleAsync(county,
            slDt: FrozenNow.AddYears(-2), // outside 1-year window
            dorQualified: false, countyReviewed: true);

        var rowsZero = await Build().GetReviewQueueAsync(county, lookbackYears: 0);
        var rowsNeg = await Build().GetReviewQueueAsync(county, lookbackYears: -10);

        rowsZero.Should().HaveCount(1);
        rowsNeg.Should().HaveCount(1);
    }

    // ─────────────────────────────────────────────────────────────────
    // Era filter
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task EraFilter_DefaultsToPostConversion()
    {
        var county = Guid.NewGuid();
        await SeedSaleAsync(county,
            slDt: FrozenNow.AddYears(-1),
            dorQualified: false, countyReviewed: true,
            era: ConversionEras.PostConversion);
        await SeedSaleAsync(county,
            slDt: FrozenNow.AddYears(-1),
            dorQualified: false, countyReviewed: true,
            era: ConversionEras.Unknown);

        var rows = await Build().GetReviewQueueAsync(county);
        rows.Should().HaveCount(1, "default era=POST excludes UNKNOWN");
    }

    [Fact]
    public async Task EraFilter_All_BypassesFilter()
    {
        var county = Guid.NewGuid();
        await SeedSaleAsync(county,
            slDt: FrozenNow.AddYears(-1),
            dorQualified: false, countyReviewed: true,
            era: ConversionEras.PostConversion);
        await SeedSaleAsync(county,
            slDt: FrozenNow.AddYears(-1),
            dorQualified: false, countyReviewed: true,
            era: ConversionEras.Unknown);

        var rows = await Build().GetReviewQueueAsync(
            county, era: ISalesReviewReader.EraAll);
        rows.Should().HaveCount(2);
    }

    [Fact]
    public async Task EraFilter_Invalid_Throws()
    {
        var county = Guid.NewGuid();

        var act = async () =>
            await Build().GetReviewQueueAsync(county, era: "BOGUS");

        await act.Should().ThrowAsync<ArgumentException>()
            .Where(e => e.Message.Contains("Unrecognized era"));
    }

    // ─────────────────────────────────────────────────────────────────
    // County isolation + ordering + cap
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task CountyIsolation_DoesNotMixCounties()
    {
        var benton = Guid.NewGuid();
        var franklin = Guid.NewGuid();
        await SeedSaleAsync(benton,
            slDt: FrozenNow.AddYears(-1),
            dorQualified: false, countyReviewed: true);
        await SeedSaleAsync(franklin,
            slDt: FrozenNow.AddYears(-1),
            dorQualified: false, countyReviewed: true);

        (await Build().GetReviewQueueAsync(benton)).Should().HaveCount(1);
        (await Build().GetReviewQueueAsync(franklin)).Should().HaveCount(1);
    }

    [Fact]
    public async Task OrderedBySlDtDescending()
    {
        var county = Guid.NewGuid();
        var older = await SeedSaleAsync(county,
            slDt: new DateTime(2023, 1, 15, 0, 0, 0, DateTimeKind.Utc),
            dorQualified: false, countyReviewed: true);
        var newer = await SeedSaleAsync(county,
            slDt: new DateTime(2024, 11, 30, 0, 0, 0, DateTimeKind.Utc),
            dorQualified: false, countyReviewed: true);
        var middle = await SeedSaleAsync(county,
            slDt: new DateTime(2024, 5, 1, 0, 0, 0, DateTimeKind.Utc),
            dorQualified: false, countyReviewed: true);

        var rows = await Build().GetReviewQueueAsync(county);

        rows.Select(r => r.TfSaleId).Should().ContainInOrder(newer, middle, older);
    }

    [Fact]
    public async Task NullSaleDt_Excluded()
    {
        var county = Guid.NewGuid();
        await SeedSaleAsync(county,
            slDt: null,
            dorQualified: false, countyReviewed: true);

        var rows = await Build().GetReviewQueueAsync(county);
        rows.Should().BeEmpty(
            "null SlDt cannot be evaluated against the lookback window");
    }

    [Fact]
    public async Task MaxResults_ClampsToHardCap()
    {
        var county = Guid.NewGuid();
        for (var i = 0; i < 5; i++)
        {
            await SeedSaleAsync(county,
                slDt: FrozenNow.AddYears(-1).AddDays(-i),
                dorQualified: false, countyReviewed: true);
        }

        var rows = await Build().GetReviewQueueAsync(county, maxResults: 3);
        rows.Should().HaveCount(3);

        var rowsOverCap = await Build().GetReviewQueueAsync(
            county, maxResults: ISalesReviewReader.MaxResultsHardCap + 999);
        rowsOverCap.Should().HaveCount(5,
            "above-cap requests still return real rows, just up to the cap");
    }
}

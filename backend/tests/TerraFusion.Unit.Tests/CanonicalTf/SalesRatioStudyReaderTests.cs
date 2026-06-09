using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.SalesRatioStudy;
using TerraFusion.Data;
using TerraFusion.Data.Services.CanonicalTf;
using Xunit;

namespace TerraFusion.Unit.Tests.CanonicalTf;

/// <summary>
/// Slice F5 acceptance tests for
/// <see cref="SalesRatioStudyReader"/>. Per
/// <c>docs/sync/operator-sql-regression/sales-ratio-queries.md</c>:
/// proves the reader's three methods (Q1 valid count, Q2 by year,
/// Q3 aggregate price) return correct canonical aggregates over
/// <c>canonical_tf.tf_sale</c>.
///
/// <para>The canonical-vs-PACS equivalence is already proven by
/// <c>OperatorSalesRegressionTests</c>. These tests prove the
/// reader correctly applies the documented filters
/// (SaleQualified, SlDt cutoff, SlPrice not-null for Q3) and
/// shapes the result types.</para>
/// </summary>
public sealed class SalesRatioStudyReaderTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public SalesRatioStudyReaderTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"f5-{Guid.NewGuid():N}")
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

    private SalesRatioStudyReader Build() => new(_db);

    private async Task SeedSaleAsync(
        Guid countyId,
        long chgOfOwnerId,
        DateTime? slDt,
        decimal? slPrice,
        bool qualified = true,
        string? era = null)
    {
        _db.TfSales.Add(new TfSale
        {
            CountyId = countyId,
            TfParcelId = Guid.NewGuid(),
            ChgOfOwnerId = chgOfOwnerId,
            SlDt = slDt,
            SlPrice = slPrice,
            AdjSlPrice = slPrice,
            SaleQualified = qualified,
            PromotionLoadBatchId = Guid.NewGuid(),
            // G3 (v1.12): era stamping mirrors what the canonical
            // projector does. Tests that seed without an era are
            // deliberately exercising the NULL-fallback path per
            // doctrine v1.10 §0.5.
            ConversionEra = era,
        });
        await _db.SaveChangesAsync();
    }

    // ─────────────────────────────────────────────────────────────────
    // Q1 — valid sale count
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Q1_CountsOnlyQualifiedPostCutoffSales()
    {
        var benton = Guid.NewGuid();

        // Mix of conditions: some valid, some excluded for various reasons.
        await SeedSaleAsync(benton, 1, new DateTime(2020, 6, 1, 0, 0, 0, DateTimeKind.Utc), 250_000m);
        await SeedSaleAsync(benton, 2, new DateTime(2021, 3, 15, 0, 0, 0, DateTimeKind.Utc), 300_000m);
        await SeedSaleAsync(benton, 3, new DateTime(2017, 8, 1, 0, 0, 0, DateTimeKind.Utc), 100_000m); // pre-cutoff
        await SeedSaleAsync(benton, 4, new DateTime(2022, 1, 1, 0, 0, 0, DateTimeKind.Utc), 400_000m, qualified: false); // unqualified
        await SeedSaleAsync(benton, 5, slDt: null, slPrice: 500_000m); // null sale date

        var count = await Build().GetValidSaleCountAsync(benton);
        count.Should().Be(2,
            "only the two qualified post-2018 sales with non-null SlDt count");
    }

    [Fact]
    public async Task Q1_RespectsExplicitFromDateOverride()
    {
        var benton = Guid.NewGuid();
        await SeedSaleAsync(benton, 1, new DateTime(2018, 6, 1, 0, 0, 0, DateTimeKind.Utc), 100_000m);
        await SeedSaleAsync(benton, 2, new DateTime(2022, 6, 1, 0, 0, 0, DateTimeKind.Utc), 200_000m);

        var fullCount = await Build().GetValidSaleCountAsync(benton);
        fullCount.Should().Be(2);

        var recent = await Build().GetValidSaleCountAsync(
            benton, fromDate: new DateTime(2021, 1, 1, 0, 0, 0, DateTimeKind.Utc));
        recent.Should().Be(1, "only the 2022 sale passes the 2021 cutoff");
    }

    [Fact]
    public async Task Q1_CountyIsolation_DoesNotMixCounties()
    {
        var benton = Guid.NewGuid();
        var franklin = Guid.NewGuid();
        await SeedSaleAsync(benton, 1, new DateTime(2020, 6, 1, 0, 0, 0, DateTimeKind.Utc), 100_000m);
        await SeedSaleAsync(franklin, 2, new DateTime(2020, 6, 1, 0, 0, 0, DateTimeKind.Utc), 200_000m);

        (await Build().GetValidSaleCountAsync(benton)).Should().Be(1);
        (await Build().GetValidSaleCountAsync(franklin)).Should().Be(1);
    }

    [Fact]
    public async Task Q1_EmptyCounty_ReturnsZero()
    {
        var benton = Guid.NewGuid();
        var count = await Build().GetValidSaleCountAsync(benton);
        count.Should().Be(0);
    }

    // ─────────────────────────────────────────────────────────────────
    // Q2 — by-year aggregation
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Q2_GroupsByYear_DescendingOrder()
    {
        var benton = Guid.NewGuid();
        await SeedSaleAsync(benton, 1, new DateTime(2020, 6, 1, 0, 0, 0, DateTimeKind.Utc), 100_000m);
        await SeedSaleAsync(benton, 2, new DateTime(2020, 9, 15, 0, 0, 0, DateTimeKind.Utc), 200_000m);
        await SeedSaleAsync(benton, 3, new DateTime(2021, 3, 1, 0, 0, 0, DateTimeKind.Utc), 300_000m);
        await SeedSaleAsync(benton, 4, new DateTime(2022, 11, 10, 0, 0, 0, DateTimeKind.Utc), 400_000m);

        var rows = await Build().GetValidSalesByYearAsync(benton);

        rows.Should().HaveCount(3);
        rows.Select(r => r.SaleYear).Should().BeInDescendingOrder();
        rows[0].SaleYear.Should().Be(2022);
        rows[0].Count.Should().Be(1);
        rows[1].SaleYear.Should().Be(2021);
        rows[1].Count.Should().Be(1);
        rows[2].SaleYear.Should().Be(2020);
        rows[2].Count.Should().Be(2);
    }

    [Fact]
    public async Task Q2_PreCutoff_NotIncluded()
    {
        var benton = Guid.NewGuid();
        await SeedSaleAsync(benton, 1, new DateTime(2017, 6, 1, 0, 0, 0, DateTimeKind.Utc), 100_000m);
        await SeedSaleAsync(benton, 2, new DateTime(2020, 6, 1, 0, 0, 0, DateTimeKind.Utc), 200_000m);

        var rows = await Build().GetValidSalesByYearAsync(benton);
        rows.Should().HaveCount(1);
        rows[0].SaleYear.Should().Be(2020);
    }

    [Fact]
    public async Task Q2_Unqualified_NotIncluded()
    {
        var benton = Guid.NewGuid();
        await SeedSaleAsync(benton, 1, new DateTime(2020, 6, 1, 0, 0, 0, DateTimeKind.Utc), 100_000m,
            qualified: false);

        var rows = await Build().GetValidSalesByYearAsync(benton);
        rows.Should().BeEmpty();
    }

    // ─────────────────────────────────────────────────────────────────
    // Q3 — aggregate price
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Q3_AggregatesSumAndAverage()
    {
        var benton = Guid.NewGuid();
        await SeedSaleAsync(benton, 1, new DateTime(2020, 6, 1, 0, 0, 0, DateTimeKind.Utc), 100_000m);
        await SeedSaleAsync(benton, 2, new DateTime(2021, 3, 1, 0, 0, 0, DateTimeKind.Utc), 250_000m);
        await SeedSaleAsync(benton, 3, new DateTime(2022, 9, 1, 0, 0, 0, DateTimeKind.Utc), 400_000m);

        var aggregate = await Build().GetAggregateSalePriceAsync(benton);

        aggregate.Count.Should().Be(3);
        aggregate.TotalPrice.Should().Be(750_000m);
        aggregate.AveragePrice.Should().Be(250_000m);
    }

    [Fact]
    public async Task Q3_NullPrice_NotIncluded()
    {
        var benton = Guid.NewGuid();
        await SeedSaleAsync(benton, 1, new DateTime(2020, 6, 1, 0, 0, 0, DateTimeKind.Utc), 100_000m);
        await SeedSaleAsync(benton, 2, new DateTime(2021, 3, 1, 0, 0, 0, DateTimeKind.Utc), null);

        var aggregate = await Build().GetAggregateSalePriceAsync(benton);
        aggregate.Count.Should().Be(1,
            "null SlPrice rows are excluded by the documented Q3 filter");
        aggregate.TotalPrice.Should().Be(100_000m);
        aggregate.AveragePrice.Should().Be(100_000m);
    }

    [Fact]
    public async Task Q3_EmptyResult_ReturnsZeroCountWithNullAggregates()
    {
        var benton = Guid.NewGuid();

        var aggregate = await Build().GetAggregateSalePriceAsync(benton);
        aggregate.Count.Should().Be(0);
        aggregate.TotalPrice.Should().BeNull();
        aggregate.AveragePrice.Should().BeNull();
    }

    [Fact]
    public void DefaultFromDate_IsLockedToCutoverConvention()
    {
        // Per v1.9 §2: the cutover is 2018-01-01 UTC.
        ISalesRatioStudyReader.DefaultFromDate.Should()
            .Be(new DateTime(2018, 1, 1, 0, 0, 0, DateTimeKind.Utc));
    }

    // ─────────────────────────────────────────────────────────────────
    // G3 (v1.12) — era filter
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task EraFilter_DefaultsToPostConversion_WhenOmitted()
    {
        // v1.12 §2: omitting era resolves to POST_CONVERSION.
        var benton = Guid.NewGuid();
        await SeedSaleAsync(benton, 1, new DateTime(2020, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            100_000m, era: ConversionEras.PostConversion);
        await SeedSaleAsync(benton, 2, new DateTime(2021, 3, 1, 0, 0, 0, DateTimeKind.Utc),
            200_000m, era: ConversionEras.Unknown);

        var defaultCount = await Build().GetValidSaleCountAsync(benton);
        var explicitCount = await Build().GetValidSaleCountAsync(
            benton, era: ConversionEras.PostConversion);

        defaultCount.Should().Be(1, "only the POST row matches the default");
        explicitCount.Should().Be(defaultCount,
            "explicit POST_CONVERSION matches the default behavior");
    }

    [Fact]
    public async Task EraFilter_PostConversion_FallsBackToYearForNullEra()
    {
        // v1.10 §0.5 + v1.12 §2: rows whose ConversionEra is NULL
        // fall back to their SlDt year. A 2020 sale with NULL era
        // is treated as POST under era=POST.
        var benton = Guid.NewGuid();
        await SeedSaleAsync(benton, 1, new DateTime(2020, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            100_000m, era: null); // pre-G2 NULL era

        var count = await Build().GetValidSaleCountAsync(
            benton, era: ConversionEras.PostConversion);
        count.Should().Be(1,
            "v1.10 §0.5: NULL era falls back to SlDt year (2020 ⇒ POST)");
    }

    [Fact]
    public async Task EraFilter_PreConversion_RequiresExplicitFromDateOverride()
    {
        // PRE-conversion sales have SlDt < 2018 by definition. The
        // default fromDate of 2018-01-01 excludes them. To query the
        // pre-conversion era, callers must pass fromDate explicitly.
        var benton = Guid.NewGuid();
        await SeedSaleAsync(benton, 1, new DateTime(2010, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            50_000m, era: ConversionEras.PreConversion2017);
        await SeedSaleAsync(benton, 2, new DateTime(2015, 8, 1, 0, 0, 0, DateTimeKind.Utc),
            75_000m, era: null); // NULL era, pre-2018 date

        var count = await Build().GetValidSaleCountAsync(
            benton,
            fromDate: new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            era: ConversionEras.PreConversion2017);

        count.Should().Be(2,
            "explicit PRE row + NULL-era row whose SlDt year derives PRE");
    }

    [Fact]
    public async Task EraFilter_Unknown_RequiresExactColumnMatch()
    {
        // v1.12 §2: UNKNOWN does not fall back to year — by doctrine
        // v1.10 §2 the truth-layer never emits UNKNOWN, and
        // canonical-layer UNKNOWN is the explicit "contributors
        // disagree" signal. NULL rows do NOT satisfy era=UNKNOWN.
        var benton = Guid.NewGuid();
        await SeedSaleAsync(benton, 1, new DateTime(2020, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            100_000m, era: ConversionEras.Unknown);
        await SeedSaleAsync(benton, 2, new DateTime(2020, 9, 1, 0, 0, 0, DateTimeKind.Utc),
            200_000m, era: null);

        var count = await Build().GetValidSaleCountAsync(
            benton, era: ConversionEras.Unknown);
        count.Should().Be(1, "only the explicit UNKNOWN row matches");
    }

    [Fact]
    public async Task EraFilter_All_BypassesEraEntirely()
    {
        var benton = Guid.NewGuid();
        await SeedSaleAsync(benton, 1, new DateTime(2020, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            100_000m, era: ConversionEras.PostConversion);
        await SeedSaleAsync(benton, 2, new DateTime(2021, 3, 1, 0, 0, 0, DateTimeKind.Utc),
            200_000m, era: ConversionEras.Unknown);
        await SeedSaleAsync(benton, 3, new DateTime(2022, 9, 1, 0, 0, 0, DateTimeKind.Utc),
            300_000m, era: null);

        var count = await Build().GetValidSaleCountAsync(
            benton, era: ISalesRatioStudyReader.EraAll);
        count.Should().Be(3, "EraAll bypasses the era filter");
    }

    [Fact]
    public async Task EraFilter_Q2_ByYear_HonorsEraFilter()
    {
        var benton = Guid.NewGuid();
        await SeedSaleAsync(benton, 1, new DateTime(2020, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            100_000m, era: ConversionEras.PostConversion);
        await SeedSaleAsync(benton, 2, new DateTime(2020, 7, 1, 0, 0, 0, DateTimeKind.Utc),
            150_000m, era: ConversionEras.Unknown);

        var defaultRows = await Build().GetValidSalesByYearAsync(benton);
        defaultRows.Should().ContainSingle()
            .Which.Count.Should().Be(1, "default era=POST excludes UNKNOWN row");

        var allRows = await Build().GetValidSalesByYearAsync(
            benton, era: ISalesRatioStudyReader.EraAll);
        allRows.Should().ContainSingle()
            .Which.Count.Should().Be(2, "EraAll includes both rows");
    }

    [Fact]
    public async Task EraFilter_Q3_PriceAggregate_HonorsEraFilter()
    {
        var benton = Guid.NewGuid();
        await SeedSaleAsync(benton, 1, new DateTime(2020, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            100_000m, era: ConversionEras.PostConversion);
        await SeedSaleAsync(benton, 2, new DateTime(2021, 3, 1, 0, 0, 0, DateTimeKind.Utc),
            300_000m, era: ConversionEras.Unknown);

        var defaultAgg = await Build().GetAggregateSalePriceAsync(benton);
        defaultAgg.Count.Should().Be(1);
        defaultAgg.TotalPrice.Should().Be(100_000m);

        var allAgg = await Build().GetAggregateSalePriceAsync(
            benton, era: ISalesRatioStudyReader.EraAll);
        allAgg.Count.Should().Be(2);
        allAgg.TotalPrice.Should().Be(400_000m);
        allAgg.AveragePrice.Should().Be(200_000m);
    }

    [Fact]
    public async Task EraFilter_InvalidToken_Throws()
    {
        var benton = Guid.NewGuid();

        var act = async () => await Build().GetValidSaleCountAsync(
            benton, era: "BOGUS_ERA");

        await act.Should().ThrowAsync<ArgumentException>()
            .Where(e => e.Message.Contains("Unrecognized era"));
    }
}

using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Controllers;
using TerraFusion.Core.Entities;
using Xunit;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.R2Wave42;

/// <summary>
/// R2Wave42 — ratio-study and comps-pool endpoints in TerraForgeController.
///
/// Invariants under test:
///   WF42-01: ratio-study returns 200 with populated stats when qualified sales with PacsComputedRatio exist
///   WF42-02: ratio-study computes median/mean/COD/PRD correctly for three known ratios
///   WF42-03: ratio-study excludes non-arms-length sales from the population
///   WF42-04: ratio-study excludes SuppressOnRatioRptCd="T" and IncludeNoCalc=true sales
///   WF42-05: ratio-study hood filter narrows results to matching neighborhood only
///   WF42-06: ratio-study Layer 3 decision="qualified" included (wins over null recommendation)
///   WF42-07: ratio-study returns null stats when no sales have PacsComputedRatio
///   WF42-08: comps-pool returns 200 with qualified sales, all fields populated
///   WF42-09: comps-pool minPrice/maxPrice filter narrows results correctly
///   WF42-10: comps-pool minGla/maxGla filter narrows results correctly
///   WF42-11: comps-pool hood filter narrows to matching neighborhood only
///   WF42-12: comps-pool excludes non-arms-length sales
/// </summary>
[Trait("Category", "R2Wave42")]
[Trait("Category", "RatioStudyEndpoint")]
public sealed class R2Wave42RatioStudyEndpointTests
{
    // Use the real Benton County GUID — controller has it hardcoded.
    private static readonly Guid BentonCountyId = Guid.Parse("19190019-1919-1919-1919-191919191919");

    private static DataDbContext CreateDbContext(string name)
    {
        var options = new DbContextOptionsBuilder<DataDbContext>()
            .UseInMemoryDatabase(name)
            .Options;
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();
        return new DataDbContext(options, config);
    }

    private static TerraForgeController CreateController(DataDbContext db)
        => new(db, NullLogger<TerraForgeController>.Instance);

    private static async Task SeedCountyAsync(DataDbContext db)
    {
        if (!await db.Counties.AnyAsync(c => c.Id == BentonCountyId))
        {
            db.Counties.Add(new County
            {
                Id       = BentonCountyId,
                Name     = "Benton",
                State    = "WA",
                FipsCode = "003"
            });
            await db.SaveChangesAsync();
        }
    }

    /// <summary>Seeds a ComparableSale in the 2024 window with the given recommendation/decision.</summary>
    private static async Task<ComparableSale> SeedSaleAsync(
        DataDbContext db,
        decimal salePrice,
        decimal? pacsRatio              = null,
        string? recommendation          = "qualified",
        string? decision                = null,
        string? neighborhood            = null,
        string? suppressOnRatioRptCd    = null,
        bool?   includeNoCalc           = null,
        decimal? gla                    = null,
        string? propertyType            = "residential")
    {
        var sale = new ComparableSale
        {
            Id                          = Guid.NewGuid(),
            ParcelId                    = $"TEST{Guid.NewGuid():N}"[..15],
            SaleDate                    = new DateTime(2024, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            SalePrice                   = salePrice,
            PropertyType                = propertyType ?? "residential",
            QualificationRecommendation = recommendation,
            QualificationDecision       = decision,
            PacsComputedRatio           = pacsRatio,
            Neighborhood                = neighborhood,
            SuppressOnRatioRptCd        = suppressOnRatioRptCd,
            IncludeNoCalc               = includeNoCalc,
            SlLivingArea                = gla,
            CountyId                    = BentonCountyId
        };
        db.ComparableSales.Add(sale);
        await db.SaveChangesAsync();
        return sale;
    }

    // ── WF42-01 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF42_01_RatioStudy_Returns200_WithStats_WhenQualifiedSalesExist()
    {
        await using var db = CreateDbContext(nameof(WF42_01_RatioStudy_Returns200_WithStats_WhenQualifiedSalesExist));
        await SeedCountyAsync(db);
        await SeedSaleAsync(db, 400_000m, pacsRatio: 92m); // ratio = 0.92
        await SeedSaleAsync(db, 300_000m, pacsRatio: 88m); // ratio = 0.88
        var ctrl = CreateController(db);

        var result = await ctrl.GetRatioStudy(taxYear: 2026);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        ((int)body.total).Should().Be(2);
        ((int)body.countWithRatio).Should().Be(2);
        ((double?)body.stats.medianRatio).Should().NotBeNull();
        ((double?)body.stats.meanRatio).Should().NotBeNull();
        ((double?)body.stats.cod).Should().NotBeNull();
    }

    // ── WF42-02 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF42_02_RatioStudy_ComputesCorrectStats_ForThreeKnownRatios()
    {
        // Ratios: 0.80, 0.90, 1.00 → median=0.90, mean=0.90, COD=~11.11%
        await using var db = CreateDbContext(nameof(WF42_02_RatioStudy_ComputesCorrectStats_ForThreeKnownRatios));
        await SeedCountyAsync(db);
        await SeedSaleAsync(db, 100_000m, pacsRatio: 80m);   // ratio=0.80
        await SeedSaleAsync(db, 100_000m, pacsRatio: 90m);   // ratio=0.90
        await SeedSaleAsync(db, 100_000m, pacsRatio: 100m);  // ratio=1.00
        var ctrl = CreateController(db);

        var result = await ctrl.GetRatioStudy(taxYear: 2026);

        var ok   = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        double median = (double)body.stats.medianRatio;
        double mean   = (double)body.stats.meanRatio;
        double cod    = (double)body.stats.cod;

        median.Should().BeApproximately(0.9000, precision: 0.0001);
        mean.Should().BeApproximately(0.9000, precision: 0.0001);
        // COD = mean(|0.80-0.90|, |0.90-0.90|, |1.00-0.90|) / 0.90 * 100
        //     = mean(0.10, 0.00, 0.10) / 0.90 * 100 = 0.0667 / 0.90 * 100 ≈ 7.41%
        cod.Should().BeApproximately(7.41, precision: 0.1);
    }

    // ── WF42-03 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF42_03_RatioStudy_ExcludesNonArmsLength_FromPopulation()
    {
        await using var db = CreateDbContext(nameof(WF42_03_RatioStudy_ExcludesNonArmsLength_FromPopulation));
        await SeedCountyAsync(db);
        await SeedSaleAsync(db, 400_000m, pacsRatio: 90m, recommendation: "qualified");
        await SeedSaleAsync(db, 250_000m, pacsRatio: 110m, recommendation: "non-arms-length");
        var ctrl = CreateController(db);

        var result = await ctrl.GetRatioStudy(taxYear: 2026);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        ((int)body.total).Should().Be(1, "non-arms-length sales must not enter the ratio study population");
        ((int)body.countWithRatio).Should().Be(1);
    }

    // ── WF42-04 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF42_04_RatioStudy_ExcludesSuppressedAndNoCalcSales()
    {
        await using var db = CreateDbContext(nameof(WF42_04_RatioStudy_ExcludesSuppressedAndNoCalcSales));
        await SeedCountyAsync(db);
        await SeedSaleAsync(db, 400_000m, pacsRatio: 90m, recommendation: "qualified");
        await SeedSaleAsync(db, 350_000m, pacsRatio: 88m, recommendation: "qualified",
            suppressOnRatioRptCd: "T");                         // suppressed
        await SeedSaleAsync(db, 320_000m, pacsRatio: 92m, recommendation: "qualified",
            includeNoCalc: true);                               // no-calc
        var ctrl = CreateController(db);

        var result = await ctrl.GetRatioStudy(taxYear: 2026);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        ((int)body.total).Should().Be(1,
            "suppressed (SuppressOnRatioRptCd=T) and no-calc (IncludeNoCalc=true) sales must be excluded");
    }

    // ── WF42-05 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF42_05_RatioStudy_HoodFilter_NarrowsToMatchingNeighborhood()
    {
        await using var db = CreateDbContext(nameof(WF42_05_RatioStudy_HoodFilter_NarrowsToMatchingNeighborhood));
        await SeedCountyAsync(db);
        await SeedSaleAsync(db, 400_000m, pacsRatio: 90m, recommendation: "qualified", neighborhood: "1234");
        await SeedSaleAsync(db, 350_000m, pacsRatio: 88m, recommendation: "qualified", neighborhood: "5678");
        var ctrl = CreateController(db);

        var result = await ctrl.GetRatioStudy(taxYear: 2026, hood: "1234");

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        ((int)body.total).Should().Be(1);
        foreach (var item in body.items)
            ((string)item.hood).Should().Be("1234");
    }

    // ── WF42-06 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF42_06_RatioStudy_Layer3Decision_Qualified_IncludedInPopulation()
    {
        // Layer 3 decision="qualified" should be included even if recommendation is null.
        await using var db = CreateDbContext(nameof(WF42_06_RatioStudy_Layer3Decision_Qualified_IncludedInPopulation));
        await SeedCountyAsync(db);
        await SeedSaleAsync(db, 500_000m, pacsRatio: 95m,
            recommendation: null, decision: "qualified");   // L3 wins
        await SeedSaleAsync(db, 400_000m, pacsRatio: 90m,
            recommendation: "qualified", decision: null);   // L2 fallback
        var ctrl = CreateController(db);

        var result = await ctrl.GetRatioStudy(taxYear: 2026);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        ((int)body.total).Should().Be(2, "both Layer 3 decision and Layer 2 fallback qualified sales must be included");
    }

    // ── WF42-07 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF42_07_RatioStudy_NullStats_WhenNoSalesHavePacsRatio()
    {
        await using var db = CreateDbContext(nameof(WF42_07_RatioStudy_NullStats_WhenNoSalesHavePacsRatio));
        await SeedCountyAsync(db);
        await SeedSaleAsync(db, 400_000m, pacsRatio: null, recommendation: "qualified");
        var ctrl = CreateController(db);

        var result = await ctrl.GetRatioStudy(taxYear: 2026);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        ((int)body.total).Should().Be(1);
        ((int)body.countWithRatio).Should().Be(0);
        ((double?)body.stats.medianRatio).Should().BeNull("no ratios available to compute stats");
        ((double?)body.stats.cod).Should().BeNull();
        ((double?)body.stats.prd).Should().BeNull();
    }

    // ── WF42-08 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF42_08_CompsPool_Returns200_WithQualifiedSales_AllFieldsPresent()
    {
        await using var db = CreateDbContext(nameof(WF42_08_CompsPool_Returns200_WithQualifiedSales_AllFieldsPresent));
        await SeedCountyAsync(db);
        await SeedSaleAsync(db, 400_000m, recommendation: "qualified", neighborhood: "1234",
            gla: 1500m, propertyType: "residential");
        var ctrl = CreateController(db);

        var result = await ctrl.GetCompsPool(taxYear: 2026);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        ((int)body.total).Should().Be(1);
        var item = body.items[0];
        ((decimal)item.salePrice).Should().Be(400_000m);
        ((decimal?)item.gla).Should().Be(1500m);
        ((string)item.propertyType).Should().Be("residential");
        ((string)item.hood).Should().Be("1234");
        ((string)item.qualificationSource).Should().Be("recommendation");
    }

    // ── WF42-09 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF42_09_CompsPool_PriceRangeFilter_NarrowsResults()
    {
        await using var db = CreateDbContext(nameof(WF42_09_CompsPool_PriceRangeFilter_NarrowsResults));
        await SeedCountyAsync(db);
        await SeedSaleAsync(db, 200_000m, recommendation: "qualified");
        await SeedSaleAsync(db, 400_000m, recommendation: "qualified");
        await SeedSaleAsync(db, 600_000m, recommendation: "qualified");
        var ctrl = CreateController(db);

        var result = await ctrl.GetCompsPool(taxYear: 2026, minPrice: 300_000m, maxPrice: 500_000m);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        ((int)body.total).Should().Be(1, "only the $400k sale should be in the price range");
        ((decimal)body.items[0].salePrice).Should().Be(400_000m);
    }

    // ── WF42-10 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF42_10_CompsPool_GlaRangeFilter_NarrowsResults()
    {
        await using var db = CreateDbContext(nameof(WF42_10_CompsPool_GlaRangeFilter_NarrowsResults));
        await SeedCountyAsync(db);
        await SeedSaleAsync(db, 300_000m, recommendation: "qualified", gla: 1000m);
        await SeedSaleAsync(db, 350_000m, recommendation: "qualified", gla: 1500m);
        await SeedSaleAsync(db, 400_000m, recommendation: "qualified", gla: 2200m);
        var ctrl = CreateController(db);

        var result = await ctrl.GetCompsPool(taxYear: 2026, minGla: 1200m, maxGla: 1800m);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        ((int)body.total).Should().Be(1, "only the 1500 sqft sale should be in the GLA range");
        ((decimal?)body.items[0].gla).Should().Be(1500m);
    }

    // ── WF42-11 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF42_11_CompsPool_HoodFilter_NarrowsToMatchingNeighborhood()
    {
        await using var db = CreateDbContext(nameof(WF42_11_CompsPool_HoodFilter_NarrowsToMatchingNeighborhood));
        await SeedCountyAsync(db);
        await SeedSaleAsync(db, 300_000m, recommendation: "qualified", neighborhood: "A100");
        await SeedSaleAsync(db, 350_000m, recommendation: "qualified", neighborhood: "B200");
        await SeedSaleAsync(db, 400_000m, recommendation: "qualified", neighborhood: "A100");
        var ctrl = CreateController(db);

        var result = await ctrl.GetCompsPool(taxYear: 2026, hood: "A100");

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        ((int)body.total).Should().Be(2, "only A100 neighborhood sales");
        foreach (var item in body.items)
            ((string)item.hood).Should().Be("A100");
    }

    // ── WF42-12 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF42_12_CompsPool_ExcludesNonArmsLength_Sales()
    {
        await using var db = CreateDbContext(nameof(WF42_12_CompsPool_ExcludesNonArmsLength_Sales));
        await SeedCountyAsync(db);
        await SeedSaleAsync(db, 400_000m, recommendation: "qualified");
        await SeedSaleAsync(db, 150_000m, recommendation: "non-arms-length");
        await SeedSaleAsync(db, 200_000m, recommendation: "exempt: 458-61A-205(2)");
        var ctrl = CreateController(db);

        var result = await ctrl.GetCompsPool(taxYear: 2026);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        ((int)body.total).Should().Be(1,
            "comps pool must contain only qualified sales — non-arms-length and exempt excluded");
        ((decimal)body.items[0].salePrice).Should().Be(400_000m);
    }
}

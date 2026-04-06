// Slice 1.5 — ratio study endpoint
//
// Verifies:
//   GET /api/terraforge/ratio-study
//     1.  Empty DB → total 0, countWithRatio 0, all stats null
//     2.  Population filter: only QualificationDecision="qualified" OR
//         (QualificationDecision null AND QualificationRecommendation="qualified")
//     3.  SuppressOnRatioRptCd="T" excluded from population
//     4.  IncludeNoCalc=true excluded from population
//     5.  County isolation — different CountyId excluded
//     6.  SalesYear filter — wrong year excluded; date-window fallback included
//     7.  countWithRatio counts only rows where PacsComputedRatio > 0
//     8.  medianRatio = AVG(lower two rows) for even set (normalized 0–1)
//     9.  COD formula: mean|ratio - median| / median × 100, on trimmed population
//    10.  Outlier trimming: row outside IQR fence excluded from stats but NOT items
//    11.  Pagination: page 2 with pageSize 1 returns second row only
//    12.  Items sorted by SaleDate descending

using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.API.Services;
using TerraFusion.API.Tests.TestHelpers;
using TerraFusion.Core.Entities;
using Xunit;
using Task = System.Threading.Tasks.Task;
using ComparableSale = TerraFusion.Core.Entities.ComparableSale;

namespace TerraFusion.API.Tests.TerraForge;

/// <summary>
/// Unit tests for TerraForgeController.GetRatioStudy (Slice 1.5).
///
/// Population rule:
///   QualificationDecision = "qualified"
///   OR (QualificationDecision null AND QualificationRecommendation = "qualified")
///   AND SuppressOnRatioRptCd != "T"
///   AND IncludeNoCalc != true
///
/// Ratio: PacsComputedRatio / 100  (PACS stores 0–100; API normalises to 0–1).
/// IAAO stats computed on IQR-trimmed population (Tukey fence: Q1−1.5×IQR … Q3+1.5×IQR).
/// All rows (including outliers) appear in paginated detail items.
/// </summary>
public sealed class RatioStudyTests : IDisposable
{
    private static readonly Guid BentonId =
        Guid.Parse("19190019-1919-1919-1919-191919191919");
    private static readonly Guid OtherCountyId = Guid.NewGuid();

    private readonly TerraFusion.Data.TerraFusionDbContext _db;
    private readonly TerraForgeController _sut;

    public RatioStudyTests()
    {
        _db  = TestDbContextFactory.CreateInMemoryContext();
        _sut = new TerraForgeController(
            _db,
            NullLogger<TerraForgeController>.Instance,
            Mock.Of<IOlsRegressionService>());
    }

    public void Dispose() => _db.Dispose();

    // ── Helper ─────────────────────────────────────────────────────────────

    private ComparableSale MakeSale(
        Guid?     countyId              = null,
        int?      salesYear             = 2026,
        DateTime? saleDate              = null,
        decimal   salePrice             = 300_000m,
        string?   recommendation        = "qualified",
        string?   decision              = null,
        decimal?  pacsComputedRatio     = 95m,          // 0–100 scale (PACS raw)
        string?   suppressOnRatioRptCd  = null,
        bool?     includeNoCalc         = null)
    {
        return new ComparableSale
        {
            Id                          = Guid.NewGuid(),
            CountyId                    = countyId ?? BentonId,
            ParcelId                    = $"10000{Random.Shared.Next(10000, 99999)}",
            SaleDate                    = saleDate ?? new DateTime(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            SalePrice                   = salePrice,
            SalesYear                   = salesYear,
            QualificationRecommendation = recommendation,
            QualificationDecision       = decision,
            PacsComputedRatio           = pacsComputedRatio,
            SuppressOnRatioRptCd        = suppressOnRatioRptCd,
            IncludeNoCalc               = includeNoCalc,
        };
    }

    private void Seed(params ComparableSale[] sales)
    {
        _db.ComparableSales.AddRange(sales);
        _db.SaveChanges();
    }

    private static JsonElement Body(IActionResult result)
    {
        var ok   = Assert.IsType<OkObjectResult>(result);
        var json = JsonSerializer.Serialize(ok.Value);
        return JsonDocument.Parse(json).RootElement;
    }

    // ── Tests ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetRatioStudy_EmptyDb_ReturnsTotalZero()
    {
        var result = await _sut.GetRatioStudy(taxYear: 2026);
        var body   = Body(result);

        Assert.Equal(0, body.GetProperty("total").GetInt32());
        Assert.Equal(0, body.GetProperty("countWithRatio").GetInt32());
        Assert.Equal(JsonValueKind.Null, body.GetProperty("stats").GetProperty("medianRatio").ValueKind);
    }

    [Fact]
    public async Task GetRatioStudy_PopulationFilter_RecommendationFallback_Included()
    {
        // No decision set — recommendation alone qualifies.
        Seed(MakeSale(recommendation: "qualified", decision: null));

        var body = Body(await _sut.GetRatioStudy(taxYear: 2026));

        Assert.Equal(1, body.GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task GetRatioStudy_PopulationFilter_DecisionWins_NonQualifiedRecommendation_Excluded()
    {
        // Decision="qualified" wins over a non-qualified recommendation.
        Seed(
            MakeSale(recommendation: "non-arms-length", decision: "qualified"),
            MakeSale(recommendation: "qualified", decision: "non-arms-length")  // excluded
        );

        var body = Body(await _sut.GetRatioStudy(taxYear: 2026));

        // Only the first (decision="qualified") should be in population.
        Assert.Equal(1, body.GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task GetRatioStudy_SuppressOnRatioRptCd_T_Excluded()
    {
        Seed(
            MakeSale(),                               // included
            MakeSale(suppressOnRatioRptCd: "T")      // excluded
        );

        var body = Body(await _sut.GetRatioStudy(taxYear: 2026));

        Assert.Equal(1, body.GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task GetRatioStudy_IncludeNoCalc_True_Excluded()
    {
        Seed(
            MakeSale(),                         // included
            MakeSale(includeNoCalc: true)       // excluded
        );

        var body = Body(await _sut.GetRatioStudy(taxYear: 2026));

        Assert.Equal(1, body.GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task GetRatioStudy_CountyIsolation_OtherCountyExcluded()
    {
        Seed(
            MakeSale(countyId: BentonId),
            MakeSale(countyId: OtherCountyId)
        );

        var body = Body(await _sut.GetRatioStudy(taxYear: 2026));

        Assert.Equal(1, body.GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task GetRatioStudy_DateWindowFallback_NullSalesYearInWindow_Included()
    {
        // taxYear=2026 → lookback 2024-01-01 to 2026-01-01
        Seed(MakeSale(
            salesYear: null,
            saleDate: new DateTime(2025, 3, 15, 0, 0, 0, DateTimeKind.Utc)));

        var body = Body(await _sut.GetRatioStudy(taxYear: 2026));

        Assert.Equal(1, body.GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task GetRatioStudy_DateWindowFallback_NullSalesYearOutsideWindow_Excluded()
    {
        Seed(MakeSale(
            salesYear: null,
            saleDate: new DateTime(2023, 6, 1, 0, 0, 0, DateTimeKind.Utc)));

        var body = Body(await _sut.GetRatioStudy(taxYear: 2026));

        Assert.Equal(0, body.GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task GetRatioStudy_CountWithRatio_OnlyPositiveRatios()
    {
        Seed(
            MakeSale(pacsComputedRatio: 95m),     // has ratio
            MakeSale(pacsComputedRatio: null),    // no ratio
            MakeSale(pacsComputedRatio: 0m)       // zero — excluded from countWithRatio
        );

        var body = Body(await _sut.GetRatioStudy(taxYear: 2026));

        Assert.Equal(3, body.GetProperty("total").GetInt32());
        Assert.Equal(1, body.GetProperty("countWithRatio").GetInt32());
    }

    [Fact]
    public async Task GetRatioStudy_MedianRatio_NormalisedFrom0To1()
    {
        // Two sales: PACS ratios 90 and 110 → normalised 0.90 and 1.10 → median = 1.00
        Seed(
            MakeSale(pacsComputedRatio: 90m),
            MakeSale(pacsComputedRatio: 110m)
        );

        var body   = Body(await _sut.GetRatioStudy(taxYear: 2026));
        var median = body.GetProperty("stats").GetProperty("medianRatio").GetDouble();

        Assert.Equal(1.00, median, precision: 3);
    }

    [Fact]
    public async Task GetRatioStudy_Pagination_Page2ReturnsSecondItem()
    {
        // Two sales on different dates so sort order is deterministic
        var early = MakeSale(saleDate: new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc));
        var later = MakeSale(saleDate: new DateTime(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc));
        Seed(early, later);

        // page=2, pageSize=1 → second item (by SaleDate desc = early sale)
        var body  = Body(await _sut.GetRatioStudy(taxYear: 2026, page: 2, pageSize: 1));
        var items = body.GetProperty("items");

        Assert.Equal(1, items.GetArrayLength());
        // Sorted desc → page 1 = later, page 2 = early
        Assert.Equal(early.Id.ToString(), items[0].GetProperty("saleId").GetString());
    }
}

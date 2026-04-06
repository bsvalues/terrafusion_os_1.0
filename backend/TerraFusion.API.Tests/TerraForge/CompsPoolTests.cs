// Slice 1.6 — comps pool browser endpoint
//
// Verifies:
//   GET /api/terraforge/comps-pool
//     1.  Empty DB → total 0, items empty
//     2.  Population: QualificationDecision="qualified" included
//     3.  Population: QualificationDecision null + Recommendation="qualified" included
//     4.  Population: non-qualified recommendation with no decision excluded
//     5.  County isolation — different CountyId excluded
//     6.  SalesYear filter — wrong year excluded
//     7.  DateWindow fallback — null SalesYear in lookback window included
//     8.  Hood filter narrows results
//     9.  PropertyType filter narrows results
//    10.  MinPrice filter (uses AdjustedSalePrice when present)
//    11.  MaxPrice filter
//    12.  MinGla filter (uses SlLivingArea when present)
//    13.  MaxGla filter
//    14.  Pagination: page 2 with pageSize 1 returns second item (SaleDate desc)
//    15.  SuppressOnRatioRptCd="T" is NOT filtered here (comps pool excludes only ratio-study flags)
//
// Note: unlike ratio-study, comps-pool does NOT filter on SuppressOnRatioRptCd or IncludeNoCalc.
// The effective qualified pool is qualification decision/recommendation only.

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
/// Unit tests for TerraForgeController.GetCompsPool (Slice 1.6).
///
/// Population: qualified decision wins; qualified recommendation is the fallback.
/// Unlike GetRatioStudy, SuppressOnRatioRptCd and IncludeNoCalc are NOT filters here.
/// </summary>
public sealed class CompsPoolTests : IDisposable
{
    private static readonly Guid BentonId =
        Guid.Parse("19190019-1919-1919-1919-191919191919");
    private static readonly Guid OtherCountyId = Guid.NewGuid();

    private readonly TerraFusion.Data.TerraFusionDbContext _db;
    private readonly TerraForgeController _sut;

    public CompsPoolTests()
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
        Guid?     countyId             = null,
        int?      salesYear            = 2026,
        DateTime? saleDate             = null,
        decimal   salePrice            = 300_000m,
        decimal?  adjustedSalePrice    = null,
        string?   recommendation       = "qualified",
        string?   decision             = null,
        string?   hood                 = null,
        string?   propertyType         = null,
        decimal?  slLivingArea         = null,
        decimal?  grossLivingArea      = null,
        string?   suppressOnRatioRptCd = null,
        bool?     includeNoCalc        = null)
    {
        return new ComparableSale
        {
            Id                          = Guid.NewGuid(),
            CountyId                    = countyId ?? BentonId,
            ParcelId                    = $"10000{Random.Shared.Next(10000, 99999)}",
            SaleDate                    = saleDate ?? new DateTime(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            SalePrice                   = salePrice,
            AdjustedSalePrice           = adjustedSalePrice,
            SalesYear                   = salesYear,
            QualificationRecommendation = recommendation,
            QualificationDecision       = decision,
            Neighborhood                = hood,
            PropertyType                = propertyType ?? "residential",
            SlLivingArea                = slLivingArea,
            GrossLivingArea             = grossLivingArea,
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
    public async Task GetCompsPool_EmptyDb_ReturnsTotalZero()
    {
        var body = Body(await _sut.GetCompsPool(taxYear: 2026));
        Assert.Equal(0, body.GetProperty("total").GetInt32());
        Assert.Equal(0, body.GetProperty("items").GetArrayLength());
    }

    [Fact]
    public async Task GetCompsPool_PopulationFilter_DecisionQualified_Included()
    {
        Seed(MakeSale(decision: "qualified", recommendation: "non-arms-length"));

        var body = Body(await _sut.GetCompsPool(taxYear: 2026));
        Assert.Equal(1, body.GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task GetCompsPool_PopulationFilter_RecommendationFallback_Included()
    {
        Seed(MakeSale(recommendation: "qualified", decision: null));

        var body = Body(await _sut.GetCompsPool(taxYear: 2026));
        Assert.Equal(1, body.GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task GetCompsPool_PopulationFilter_NonQualifiedRecommendation_Excluded()
    {
        // No decision AND recommendation is not qualified → excluded
        Seed(MakeSale(recommendation: "non-arms-length", decision: null));

        var body = Body(await _sut.GetCompsPool(taxYear: 2026));
        Assert.Equal(0, body.GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task GetCompsPool_CountyIsolation_OtherCountyExcluded()
    {
        Seed(
            MakeSale(countyId: BentonId),
            MakeSale(countyId: OtherCountyId)
        );

        var body = Body(await _sut.GetCompsPool(taxYear: 2026));
        Assert.Equal(1, body.GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task GetCompsPool_SalesYearFilter_WrongYearExcluded()
    {
        Seed(
            MakeSale(salesYear: 2026),   // included
            MakeSale(salesYear: 2025)    // excluded
        );

        var body = Body(await _sut.GetCompsPool(taxYear: 2026));
        Assert.Equal(1, body.GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task GetCompsPool_DateWindowFallback_NullSalesYearInWindow_Included()
    {
        Seed(MakeSale(
            salesYear: null,
            saleDate: new DateTime(2025, 3, 15, 0, 0, 0, DateTimeKind.Utc)));

        var body = Body(await _sut.GetCompsPool(taxYear: 2026));
        Assert.Equal(1, body.GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task GetCompsPool_HoodFilter_NarrowsResults()
    {
        Seed(
            MakeSale(hood: "1A"),
            MakeSale(hood: "2B")
        );

        var body = Body(await _sut.GetCompsPool(taxYear: 2026, hood: "1A"));
        Assert.Equal(1, body.GetProperty("total").GetInt32());
        Assert.Equal("1A", body.GetProperty("items")[0].GetProperty("hood").GetString());
    }

    [Fact]
    public async Task GetCompsPool_PropertyTypeFilter_NarrowsResults()
    {
        Seed(
            MakeSale(propertyType: "residential"),
            MakeSale(propertyType: "commercial")
        );

        var body = Body(await _sut.GetCompsPool(taxYear: 2026, propertyType: "commercial"));
        Assert.Equal(1, body.GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task GetCompsPool_MinPriceFilter_ExcludesBelowThreshold()
    {
        Seed(
            MakeSale(salePrice: 200_000m),   // excluded
            MakeSale(salePrice: 400_000m)    // included
        );

        var body = Body(await _sut.GetCompsPool(taxYear: 2026, minPrice: 300_000m));
        Assert.Equal(1, body.GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task GetCompsPool_MaxPriceFilter_ExcludesAboveThreshold()
    {
        Seed(
            MakeSale(salePrice: 200_000m),   // included
            MakeSale(salePrice: 600_000m)    // excluded
        );

        var body = Body(await _sut.GetCompsPool(taxYear: 2026, maxPrice: 400_000m));
        Assert.Equal(1, body.GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task GetCompsPool_MinGlaFilter_UsesSlLivingAreaWhenPresent()
    {
        Seed(
            MakeSale(slLivingArea: 1_000m),   // excluded (< 1500)
            MakeSale(slLivingArea: 2_000m)    // included
        );

        var body = Body(await _sut.GetCompsPool(taxYear: 2026, minGla: 1_500m));
        Assert.Equal(1, body.GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task GetCompsPool_MaxGlaFilter_ExcludesAboveThreshold()
    {
        Seed(
            MakeSale(slLivingArea: 1_000m),   // included
            MakeSale(slLivingArea: 3_000m)    // excluded
        );

        var body = Body(await _sut.GetCompsPool(taxYear: 2026, maxGla: 2_000m));
        Assert.Equal(1, body.GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task GetCompsPool_Pagination_Page2ReturnsSecondItemBySaleDateDesc()
    {
        var early = MakeSale(saleDate: new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc));
        var later = MakeSale(saleDate: new DateTime(2025, 9, 1, 0, 0, 0, DateTimeKind.Utc));
        Seed(early, later);

        // Sorted desc: later first → page 1; early → page 2
        var body  = Body(await _sut.GetCompsPool(taxYear: 2026, page: 2, pageSize: 1));
        var items = body.GetProperty("items");

        Assert.Equal(1, items.GetArrayLength());
        Assert.Equal(early.Id.ToString(), items[0].GetProperty("saleId").GetString());
    }

    [Fact]
    public async Task GetCompsPool_SuppressOnRatioRptCd_T_IsNotFiltered()
    {
        // comps-pool does NOT filter suppress flag — only ratio-study does.
        Seed(MakeSale(suppressOnRatioRptCd: "T"));

        var body = Body(await _sut.GetCompsPool(taxYear: 2026));
        Assert.Equal(1, body.GetProperty("total").GetInt32());
    }
}

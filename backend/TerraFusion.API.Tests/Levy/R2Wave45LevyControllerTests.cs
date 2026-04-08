using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.API.Tests.TestHelpers;
using TerraFusion.Core.Entities.Pacs;
using Xunit;

namespace TerraFusion.API.Tests.Levy;

/// <summary>
/// R2Wave45 — TerraLevy Phase 2.1 controller tests.
///
/// Verifies LevyController endpoints:
///   GET /api/levy/rates         — shape, count, field presence
///   GET /api/levy/tax-areas     — grouping, search filter
///   GET /api/levy/calculate     — WA levy arithmetic, 404, zero-AV guard
///
/// All arithmetic uses decimal throughout (WA State standard).
/// Data is seeded into InMemory EF Core for isolation — no PACS dependency.
/// </summary>
public class R2Wave45LevyControllerTests
{
    // ── Helpers ────────────────────────────────────────────────────────────

    private static LevyController BuildController(string dbName)
    {
        var db     = TestDbContextFactory.CreateInMemoryContext(dbName);
        var logger = Mock.Of<ILogger<LevyController>>();
        return new LevyController(db, logger);
    }

    private static TerraFusion.Data.TerraFusionDbContext BuildDb(string dbName)
        => TestDbContextFactory.CreateInMemoryContext(dbName);

    private static PacsLevyRate Rate(int year, int districtId, string levyCd, decimal rate,
        string? desc = null, bool cert = true)
        => new()
        {
            Id                     = Guid.NewGuid(),
            Year                   = year,
            TaxDistrictId          = districtId,
            LevyCd                 = levyCd,
            LevyRate               = rate,
            LevyDescription        = desc ?? levyCd + " fund",
            LevyTypeCd             = "RG",
            IncludeInCertification = cert,
            CreatedAt              = DateTime.UtcNow,
            UpdatedAt              = DateTime.UtcNow,
        };

    private static PacsLevyTaxAreaAssoc Assoc(int year, int districtId, string levyCd,
        int taxAreaId, string taxAreaNumber)
        => new()
        {
            Id            = Guid.NewGuid(),
            Year          = year,
            TaxDistrictId = districtId,
            LevyCd        = levyCd,
            TaxAreaId     = taxAreaId,
            TaxAreaNumber = taxAreaNumber,
            CreatedAt     = DateTime.UtcNow,
            UpdatedAt     = DateTime.UtcNow,
        };

    // ── GET /api/levy/rates ────────────────────────────────────────────────

    [Fact]
    public async Task GetRates_ReturnsOk_WithCorrectYear()
    {
        var db = BuildDb("R2W45_Rates_Year");
        await db.PacsLevyRates.AddRangeAsync(
            Rate(2026, 1, "COUNTY", 0.7317m),
            Rate(2026, 2, "STATE",  1.4151m),
            Rate(2025, 1, "COUNTY", 0.7200m));
        await db.SaveChangesAsync();

        var ctrl   = new LevyController(db, Mock.Of<ILogger<LevyController>>());
        var result = await ctrl.GetRates(year: 2026) as OkObjectResult;

        Assert.NotNull(result);
        Assert.Equal(200, result!.StatusCode);
    }

    [Fact]
    public async Task GetRates_FiltersToRequestedYear()
    {
        var db = BuildDb("R2W45_Rates_Filter");
        await db.PacsLevyRates.AddRangeAsync(
            Rate(2026, 1, "COUNTY", 0.7317m),
            Rate(2026, 2, "STATE",  1.4151m),
            Rate(2025, 1, "COUNTY", 0.7200m));
        await db.SaveChangesAsync();

        var ctrl   = new LevyController(db, Mock.Of<ILogger<LevyController>>());
        var result = await ctrl.GetRates(year: 2026) as OkObjectResult;

        dynamic body  = result!.Value!;
        int count     = (int)body!.GetType().GetProperty("count")!.GetValue(body)!;
        int year      = (int)body!.GetType().GetProperty("year")!.GetValue(body)!;

        Assert.Equal(2, count);
        Assert.Equal(2026, year);
    }

    [Fact]
    public async Task GetRates_EmptyYear_ReturnsZeroCount()
    {
        var db = BuildDb("R2W45_Rates_Empty");
        await db.PacsLevyRates.AddAsync(Rate(2026, 1, "COUNTY", 0.7317m));
        await db.SaveChangesAsync();

        var ctrl   = new LevyController(db, Mock.Of<ILogger<LevyController>>());
        var result = await ctrl.GetRates(year: 2024) as OkObjectResult;

        dynamic body = result!.Value!;
        int count    = (int)body!.GetType().GetProperty("count")!.GetValue(body)!;

        Assert.Equal(0, count);
    }

    // ── GET /api/levy/tax-areas ────────────────────────────────────────────

    [Fact]
    public async Task GetTaxAreas_ReturnsDistinctTaxAreaNumbers()
    {
        var db = BuildDb("R2W45_TaxAreas_Distinct");
        await db.PacsLevyTaxAreaAssocs.AddRangeAsync(
            Assoc(2026, 1, "COUNTY", 100, "1210"),
            Assoc(2026, 2, "STATE",  100, "1210"),  // same area, second code
            Assoc(2026, 3, "ROAD",   200, "1220"));
        await db.SaveChangesAsync();

        var ctrl   = new LevyController(db, Mock.Of<ILogger<LevyController>>());
        var result = await ctrl.GetTaxAreas(year: 2026, search: "") as OkObjectResult;

        dynamic body = result!.Value!;
        int count    = (int)body!.GetType().GetProperty("count")!.GetValue(body)!;

        Assert.Equal(2, count);  // "1210" and "1220" — 1210 grouped
    }

    [Fact]
    public async Task GetTaxAreas_SearchFilter_NarrowsResults()
    {
        var db = BuildDb("R2W45_TaxAreas_Search");
        await db.PacsLevyTaxAreaAssocs.AddRangeAsync(
            Assoc(2026, 1, "COUNTY", 100, "1210"),
            Assoc(2026, 2, "STATE",  200, "1220"),
            Assoc(2026, 3, "ROAD",   300, "2100"));
        await db.SaveChangesAsync();

        var ctrl   = new LevyController(db, Mock.Of<ILogger<LevyController>>());
        var result = await ctrl.GetTaxAreas(year: 2026, search: "12") as OkObjectResult;

        dynamic body = result!.Value!;
        int count    = (int)body!.GetType().GetProperty("count")!.GetValue(body)!;

        Assert.Equal(2, count);  // "1210" and "1220" match "12"
    }

    // ── GET /api/levy/calculate ────────────────────────────────────────────

    [Fact]
    public async Task Calculate_UnknownTaxArea_Returns404()
    {
        var db = BuildDb("R2W45_Calc_404");
        // no assocs seeded
        var ctrl   = new LevyController(db, Mock.Of<ILogger<LevyController>>());
        var result = await ctrl.Calculate("9999", 300_000m, 2026);

        Assert.IsType<NotFoundObjectResult>(result);
        Assert.Equal(404, ((NotFoundObjectResult)result).StatusCode);
    }

    [Fact]
    public async Task Calculate_ZeroAssessedValue_Returns200WithZeroAmounts()
    {
        var db = BuildDb("R2W45_Calc_ZeroAV");
        await db.PacsLevyTaxAreaAssocs.AddAsync(Assoc(2026, 1, "COUNTY", 100, "1210"));
        await db.PacsLevyRates.AddAsync(Rate(2026, 1, "COUNTY", 0.7317m));
        await db.SaveChangesAsync();

        var ctrl   = new LevyController(db, Mock.Of<ILogger<LevyController>>());
        var result = await ctrl.Calculate("1210", 0m, 2026) as OkObjectResult;

        Assert.NotNull(result);
        Assert.Equal(200, result!.StatusCode);

        dynamic body = result.Value!;
        decimal total = (decimal)body!.GetType().GetProperty("totalLevy")!.GetValue(body)!;
        Assert.Equal(0m, total);
    }

    [Fact]
    public async Task Calculate_SingleLevyCode_ReturnsCorrectArithmetic()
    {
        // COUNTY levy: 0.7317 per $1,000 AV
        // AV = $300,000 → amount = 300 × 0.7317 = $219.51
        var db = BuildDb("R2W45_Calc_Single");
        await db.PacsLevyTaxAreaAssocs.AddAsync(Assoc(2026, 1, "COUNTY", 100, "1210"));
        await db.PacsLevyRates.AddAsync(Rate(2026, 1, "COUNTY", 0.7317m));
        await db.SaveChangesAsync();

        var ctrl   = new LevyController(db, Mock.Of<ILogger<LevyController>>());
        var result = await ctrl.Calculate("1210", 300_000m, 2026) as OkObjectResult;

        Assert.NotNull(result);
        dynamic body  = result!.Value!;
        decimal total = (decimal)body!.GetType().GetProperty("totalLevy")!.GetValue(body)!;

        // 300 × 0.7317 = 219.51
        Assert.Equal(219.51m, total);
    }

    [Fact]
    public async Task Calculate_MultipleLevyCodes_TotalIsSum()
    {
        // AV = $300,000
        // COUNTY 0.7317 → 300 × 0.7317 = 219.51
        // STATE  1.4151 → 300 × 1.4151 = 424.53
        // Total = 644.04
        var db = BuildDb("R2W45_Calc_Multi");
        await db.PacsLevyTaxAreaAssocs.AddRangeAsync(
            Assoc(2026, 1, "COUNTY", 100, "1210"),
            Assoc(2026, 2, "STATE",  100, "1210"));
        await db.PacsLevyRates.AddRangeAsync(
            Rate(2026, 1, "COUNTY", 0.7317m),
            Rate(2026, 2, "STATE",  1.4151m));
        await db.SaveChangesAsync();

        var ctrl   = new LevyController(db, Mock.Of<ILogger<LevyController>>());
        var result = await ctrl.Calculate("1210", 300_000m, 2026) as OkObjectResult;

        Assert.NotNull(result);
        dynamic body  = result!.Value!;
        decimal total = (decimal)body!.GetType().GetProperty("totalLevy")!.GetValue(body)!;

        Assert.Equal(644.04m, total);
    }

    [Fact]
    public async Task Calculate_TaxAreaNumberTrimmed_MatchesWithWhitespace()
    {
        var db = BuildDb("R2W45_Calc_Trim");
        await db.PacsLevyTaxAreaAssocs.AddAsync(Assoc(2026, 1, "COUNTY", 100, "1210"));
        await db.PacsLevyRates.AddAsync(Rate(2026, 1, "COUNTY", 0.7317m));
        await db.SaveChangesAsync();

        var ctrl   = new LevyController(db, Mock.Of<ILogger<LevyController>>());
        var result = await ctrl.Calculate("  1210  ", 300_000m, 2026);

        // Should match, not 404
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Calculate_MissingRateForAssoc_LineAmountIsZero()
    {
        // Assoc exists for ROAD but no matching rate row
        var db = BuildDb("R2W45_Calc_MissingRate");
        await db.PacsLevyTaxAreaAssocs.AddAsync(Assoc(2026, 5, "ROAD", 100, "1210"));
        // deliberately no rate row for district 5 / ROAD
        await db.SaveChangesAsync();

        var ctrl   = new LevyController(db, Mock.Of<ILogger<LevyController>>());
        var result = await ctrl.Calculate("1210", 300_000m, 2026) as OkObjectResult;

        Assert.NotNull(result);
        dynamic body  = result!.Value!;
        decimal total = (decimal)body!.GetType().GetProperty("totalLevy")!.GetValue(body)!;

        // No rate → amount = 0, total = 0
        Assert.Equal(0m, total);
    }

    [Fact]
    public async Task Calculate_EmptyTaxAreaNumber_ReturnsBadRequest()
    {
        var db   = BuildDb("R2W45_Calc_BadReq");
        var ctrl = new LevyController(db, Mock.Of<ILogger<LevyController>>());
        var result = await ctrl.Calculate("   ", 300_000m, 2026);

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal(400, ((BadRequestObjectResult)result).StatusCode);
    }
}

// Slice 1.3 — county-stats endpoint
//
// Verifies:
//   1. Empty DB → totalParcels = 0, no throw
//   2. Three parcels (SupNum=0, PropValYear=2026) → totalParcels = 3
//   3. Only SupNum=0 and requested year are counted — other years/supplements excluded
//   4. averageAssessedValue = AVG(AssessedVal) of qualifying rows  ← uses AssessedVal, not Market
//   5. averageAssessedValue falls back to Market when AssessedVal is null
//   6. averageAssessedValue reads AssessedVal even when Market holds a different value (column guard)
//   7. pendingAssessments = COUNT WHERE NewVal > 0
//   8. assessmentCompletionPercent = 100 when all rows have AssessedVal > 0
//   9. assessmentCompletionPercent is proportional when some rows are missing AssessedVal

using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.API.Services;
using TerraFusion.API.Tests.TestHelpers;
using TerraFusion.Core.Entities.Pacs;
using Xunit;

namespace TerraFusion.API.Tests.TerraForge;

/// <summary>
/// Unit tests for TerraForgeController.GetCountyStats (Slice 1.3).
///
/// Source: pacs_valuations WHERE PropValYear = taxYear AND SupNum = 0
/// (working layer only — SupNum > 0 are supplemental layers, excluded from KPIs).
///
/// averageAssessedValue uses AssessedVal (tax-roll value), falling back to Market
/// only when AssessedVal is absent.  Market and AssessedVal differ for ag/timber
/// current-use parcels and partial-exemption parcels.
/// </summary>
public sealed class CountyStatsTests : IDisposable
{
    private readonly TerraFusion.Data.TerraFusionDbContext _db;
    private readonly TerraForgeController _sut;

    public CountyStatsTests()
    {
        _db  = TestDbContextFactory.CreateInMemoryContext();
        _sut = new TerraForgeController(
            _db,
            NullLogger<TerraForgeController>.Instance,
            Mock.Of<IOlsRegressionService>());
    }

    public void Dispose() => _db.Dispose();

    // ── Helpers ────────────────────────────────────────────────────────────

    /// <summary>
    /// Seeds pacs_valuations rows.
    /// Tuple: (year, supNum, assessedVal, market, newVal)
    /// Pass null for assessedVal to simulate a row where only Market is populated.
    /// </summary>
    private void SeedValuations(
        IEnumerable<(int year, int sup, decimal? assessedVal, decimal? market, decimal? newVal)> rows)
    {
        foreach (var (year, sup, assessedVal, market, newVal) in rows)
        {
            _db.PacsValuations.Add(new PacsValuation
            {
                Id          = Guid.NewGuid(),
                PacsPropId  = Random.Shared.Next(1, 999_999),
                ParcelId    = Guid.NewGuid(),   // InMemory DB does not enforce FK
                PropValYear = year,
                SupNum      = sup,
                AssessedVal = assessedVal,
                Market      = market,
                NewVal      = newVal,
            });
        }
        _db.SaveChanges();
    }

    private static JsonElement ParseOkBody(IActionResult result)
    {
        var ok   = Assert.IsType<OkObjectResult>(result);
        var json = JsonSerializer.Serialize(ok.Value);
        return JsonDocument.Parse(json).RootElement;
    }

    // ── Tests ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetCountyStats_EmptyDb_ReturnsTotalParcelsZero()
    {
        var result = await _sut.GetCountyStats(taxYear: 2026);
        var body   = ParseOkBody(result);

        Assert.Equal(0, body.GetProperty("totalParcels").GetInt32());
    }

    [Fact]
    public async Task GetCountyStats_ThreeParcels_ReturnsTotalParcelsThree()
    {
        SeedValuations(new (int, int, decimal?, decimal?, decimal?)[]
        {
            (2026, 0, 500_000m, 500_000m, null),
            (2026, 0, 600_000m, 600_000m, null),
            (2026, 0, 700_000m, 700_000m, null),
        });

        var body = ParseOkBody(await _sut.GetCountyStats(taxYear: 2026));

        Assert.Equal(3, body.GetProperty("totalParcels").GetInt32());
    }

    [Fact]
    public async Task GetCountyStats_ExcludesOtherYearAndSupRows_OnlyCountsWorkingLayer()
    {
        SeedValuations(new (int, int, decimal?, decimal?, decimal?)[]
        {
            (2026, 0, 500_000m, 500_000m, null),   // ← in (working layer, correct year)
            (2025, 0, 400_000m, 400_000m, null),   // ← out: wrong year
            (2026, 1, 500_000m, 500_000m, null),   // ← out: supplemental layer (SupNum=1)
        });

        var body = ParseOkBody(await _sut.GetCountyStats(taxYear: 2026));

        Assert.Equal(1, body.GetProperty("totalParcels").GetInt32());
    }

    [Fact]
    public async Task GetCountyStats_AverageAssessedValue_IsAverageOfAssessedVal()
    {
        SeedValuations(new (int, int, decimal?, decimal?, decimal?)[]
        {
            (2026, 0, 400_000m, 400_000m, null),
            (2026, 0, 600_000m, 600_000m, null),
        });

        var body = ParseOkBody(await _sut.GetCountyStats(taxYear: 2026));

        Assert.Equal(500_000m, body.GetProperty("averageAssessedValue").GetDecimal());
    }

    /// <summary>
    /// When AssessedVal differs from Market (ag/timber current-use, partial exemption),
    /// averageAssessedValue must reflect AssessedVal — NOT Market.
    /// This is the column-source guard test.
    /// </summary>
    [Fact]
    public async Task GetCountyStats_AverageAssessedValue_UsesAssessedVal_NotMarket()
    {
        // AssessedVal = 200_000 (current-use reduction), Market = 600_000 (true & fair)
        SeedValuations(new (int, int, decimal?, decimal?, decimal?)[]
        {
            (2026, 0, 200_000m, 600_000m, null),
            (2026, 0, 400_000m, 800_000m, null),
        });

        var body = ParseOkBody(await _sut.GetCountyStats(taxYear: 2026));

        // Expected: AVG(AssessedVal) = (200k + 400k) / 2 = 300k
        // Wrong if Market used: (600k + 800k) / 2 = 700k
        Assert.Equal(300_000m, body.GetProperty("averageAssessedValue").GetDecimal());
    }

    /// <summary>
    /// When AssessedVal is null, falls back to Market so legacy/incomplete rows
    /// still contribute rather than silently drop from the average.
    /// </summary>
    [Fact]
    public async Task GetCountyStats_AverageAssessedValue_FallsBackToMarket_WhenAssessedValNull()
    {
        SeedValuations(new (int, int, decimal?, decimal?, decimal?)[]
        {
            (2026, 0, null,     400_000m, null),   // ← no AssessedVal → use Market
            (2026, 0, 600_000m, 800_000m, null),   // ← has AssessedVal → use AssessedVal
        });

        var body = ParseOkBody(await _sut.GetCountyStats(taxYear: 2026));

        // Expected: (400k + 600k) / 2 = 500k
        Assert.Equal(500_000m, body.GetProperty("averageAssessedValue").GetDecimal());
    }

    [Fact]
    public async Task GetCountyStats_PendingAssessments_CountsRowsWithPositiveNewVal()
    {
        SeedValuations(new (int, int, decimal?, decimal?, decimal?)[]
        {
            (2026, 0, 500_000m, 500_000m, 50_000m),   // ← pending: NewVal > 0
            (2026, 0, 600_000m, 600_000m, null),       // ← not pending: no NewVal
            (2026, 0, 700_000m, 700_000m, 0m),         // ← not pending: NewVal == 0
        });

        var body = ParseOkBody(await _sut.GetCountyStats(taxYear: 2026));

        Assert.Equal(1, body.GetProperty("pendingAssessments").GetInt32());
    }

    [Fact]
    public async Task GetCountyStats_CompletionPercent_Is100WhenAllHaveAssessedVal()
    {
        SeedValuations(new (int, int, decimal?, decimal?, decimal?)[]
        {
            (2026, 0, 500_000m, 500_000m, null),
            (2026, 0, 600_000m, 600_000m, null),
        });

        var body = ParseOkBody(await _sut.GetCountyStats(taxYear: 2026));

        Assert.Equal(100.0, body.GetProperty("assessmentCompletionPercent").GetDouble());
    }

    [Fact]
    public async Task GetCountyStats_CompletionPercent_IsPartialWhenSomeMissingAssessedVal()
    {
        SeedValuations(new (int, int, decimal?, decimal?, decimal?)[]
        {
            (2026, 0, 500_000m, 500_000m, null),   // ← has assessed value
            (2026, 0, null,     null,     null),   // ← missing both (no fallback either)
        });

        var body = ParseOkBody(await _sut.GetCountyStats(taxYear: 2026));

        Assert.Equal(50.0, body.GetProperty("assessmentCompletionPercent").GetDouble());
    }
}

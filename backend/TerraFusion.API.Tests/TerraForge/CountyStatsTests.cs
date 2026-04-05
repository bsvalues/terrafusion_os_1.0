// Slice 1.3 — county-stats endpoint
//
// Verifies:
//   1. Empty DB → totalParcels = 0, no throw
//   2. Three parcels (SupNum=0, PropValYear=2026) → totalParcels = 3
//   3. Only SupNum=0 and requested year are counted — other years/supplements excluded
//   4. averageAssessedValue = AVG(Market) of qualifying rows
//   5. pendingAssessments = COUNT WHERE NewVal > 0
//   6. assessmentCompletionPercent = 100 when all rows have Market > 0
//   7. assessmentCompletionPercent is proportional when some rows are missing Market

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

    private void SeedValuations(IEnumerable<(int year, int sup, decimal? market, decimal? newVal)> rows)
    {
        foreach (var (year, sup, market, newVal) in rows)
        {
            _db.PacsValuations.Add(new PacsValuation
            {
                Id          = Guid.NewGuid(),
                PacsPropId  = Random.Shared.Next(1, 999_999),
                ParcelId    = Guid.NewGuid(),   // InMemory DB does not enforce FK
                PropValYear = year,
                SupNum      = sup,
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
        SeedValuations(new (int, int, decimal?, decimal?)[]
        {
            (2026, 0, 500_000m, null),
            (2026, 0, 600_000m, null),
            (2026, 0, 700_000m, null),
        });

        var body = ParseOkBody(await _sut.GetCountyStats(taxYear: 2026));

        Assert.Equal(3, body.GetProperty("totalParcels").GetInt32());
    }

    [Fact]
    public async Task GetCountyStats_ExcludesOtherYearAndSupRows_OnlyCountsWorkingLayer()
    {
        SeedValuations(new (int, int, decimal?, decimal?)[]
        {
            (2026, 0, 500_000m, null),   // ← in (working layer, correct year)
            (2025, 0, 400_000m, null),   // ← out: wrong year
            (2026, 1, 500_000m, null),   // ← out: supplemental layer (SupNum=1)
        });

        var body = ParseOkBody(await _sut.GetCountyStats(taxYear: 2026));

        Assert.Equal(1, body.GetProperty("totalParcels").GetInt32());
    }

    [Fact]
    public async Task GetCountyStats_AverageAssessedValue_IsAverageOfMarket()
    {
        SeedValuations(new (int, int, decimal?, decimal?)[]
        {
            (2026, 0, 400_000m, null),
            (2026, 0, 600_000m, null),
        });

        var body = ParseOkBody(await _sut.GetCountyStats(taxYear: 2026));

        Assert.Equal(500_000m, body.GetProperty("averageAssessedValue").GetDecimal());
    }

    [Fact]
    public async Task GetCountyStats_PendingAssessments_CountsRowsWithPositiveNewVal()
    {
        SeedValuations(new (int, int, decimal?, decimal?)[]
        {
            (2026, 0, 500_000m, 50_000m),   // ← pending: NewVal > 0
            (2026, 0, 600_000m, null),       // ← not pending: no NewVal
            (2026, 0, 700_000m, 0m),         // ← not pending: NewVal == 0
        });

        var body = ParseOkBody(await _sut.GetCountyStats(taxYear: 2026));

        Assert.Equal(1, body.GetProperty("pendingAssessments").GetInt32());
    }

    [Fact]
    public async Task GetCountyStats_CompletionPercent_Is100WhenAllHaveMarket()
    {
        SeedValuations(new (int, int, decimal?, decimal?)[]
        {
            (2026, 0, 500_000m, null),
            (2026, 0, 600_000m, null),
        });

        var body = ParseOkBody(await _sut.GetCountyStats(taxYear: 2026));

        Assert.Equal(100.0, body.GetProperty("assessmentCompletionPercent").GetDouble());
    }

    [Fact]
    public async Task GetCountyStats_CompletionPercent_IsPartialWhenSomeMissingMarket()
    {
        SeedValuations(new (int, int, decimal?, decimal?)[]
        {
            (2026, 0, 500_000m, null),   // ← has market
            (2026, 0, null,     null),   // ← missing market
        });

        var body = ParseOkBody(await _sut.GetCountyStats(taxYear: 2026));

        Assert.Equal(50.0, body.GetProperty("assessmentCompletionPercent").GetDouble());
    }
}

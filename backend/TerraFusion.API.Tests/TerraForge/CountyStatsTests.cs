// Slice 1.3 — county-stats endpoint
//
// Verifies:
//   1. Empty DB → totalParcels = 0, no throw
//   2. Three parcels (TaxYear=2026, Benton county) → totalParcels = 3
//   3. Only requested year is counted — wrong-year parcels excluded
//   4. averageAssessedValue = AVG(AssessedValue) of qualifying rows
//   5. averageAssessedValue falls back to MarketValue when AssessedValue is 0
//   6. averageAssessedValue reads AssessedValue even when MarketValue holds a different value
//   7. pendingAssessments = COUNT of distinct parcels with draft ValuationRecords
//   8. assessmentCompletionPercent = 100 when all rows have AssessedValue > 0
//   9. assessmentCompletionPercent is proportional when some rows are missing AssessedValue

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

namespace TerraFusion.API.Tests.TerraForge;

/// <summary>
/// Unit tests for TerraForgeController.GetCountyStats (Slice 1.3).
///
/// Source: Properties WHERE CountyId = Benton AND TaxYear = taxYear
/// pendingAssessments: ValuationRecords WHERE Status = "draft" AND CountyId = Benton AND TaxYear = taxYear
///
/// averageAssessedValue uses AssessedValue (tax-roll value), falling back to MarketValue
/// only when AssessedValue is 0.
/// </summary>
public sealed class CountyStatsTests : IDisposable
{
    private static readonly Guid BentonId =
        Guid.Parse("19190019-1919-1919-1919-191919191919");

    private readonly TerraFusion.Data.TerraFusionDbContext _db;
    private readonly TerraForgeController _sut;

    public CountyStatsTests()
    {
        _db  = TestDbContextFactory.CreateInMemoryContext();
        _sut = new TerraForgeController(
            _db,
            NullLogger<TerraForgeController>.Instance,
            Mock.Of<IOlsRegressionService>(), Mock.Of<ISaleQualificationService>());
    }

    public void Dispose() => _db.Dispose();

    // ── Helpers ────────────────────────────────────────────────────────────

    /// <summary>
    /// Seeds Property rows for county-stats tests.
    /// Tuple: (taxYear, assessedValue, marketValue)
    /// Pass 0 for assessedValue to simulate a row where only MarketValue is populated.
    /// </summary>
    private void SeedProperties(
        IEnumerable<(int taxYear, decimal assessedValue, decimal marketValue)> rows)
    {
        foreach (var (taxYear, assessedValue, marketValue) in rows)
        {
            _db.Properties.Add(new Property
            {
                Id             = Guid.NewGuid(),
                ParcelNumber   = Guid.NewGuid().ToString("N"),
                CountyId       = BentonId,
                TaxYear        = taxYear,
                AssessedValue  = assessedValue,
                MarketValue    = marketValue,
            });
        }
        _db.SaveChanges();
    }

    /// <summary>
    /// Seeds draft ValuationRecord rows to drive pendingAssessments count.
    /// </summary>
    private void SeedDraftValuations(int taxYear, int count)
    {
        for (var i = 0; i < count; i++)
        {
            _db.ValuationRecords.Add(new ValuationRecord
            {
                Id        = Guid.NewGuid(),
                ParcelId  = Guid.NewGuid().ToString("N"),
                CountyId  = BentonId,
                TaxYear   = taxYear,
                Status    = "draft",
                FinalReconciledValue = null,
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
        SeedProperties(new (int, decimal, decimal)[]
        {
            (2026, 500_000m, 500_000m),
            (2026, 600_000m, 600_000m),
            (2026, 700_000m, 700_000m),
        });

        var body = ParseOkBody(await _sut.GetCountyStats(taxYear: 2026));

        Assert.Equal(3, body.GetProperty("totalParcels").GetInt32());
    }

    [Fact]
    public async Task GetCountyStats_ExcludesOtherYearAndSupRows_OnlyCountsWorkingLayer()
    {
        SeedProperties(new (int, decimal, decimal)[]
        {
            (2026, 500_000m, 500_000m),   // ← in (correct year)
            (2025, 400_000m, 400_000m),   // ← out: wrong year
        });

        var body = ParseOkBody(await _sut.GetCountyStats(taxYear: 2026));

        Assert.Equal(1, body.GetProperty("totalParcels").GetInt32());
    }

    [Fact]
    public async Task GetCountyStats_AverageAssessedValue_IsAverageOfAssessedVal()
    {
        SeedProperties(new (int, decimal, decimal)[]
        {
            (2026, 400_000m, 400_000m),
            (2026, 600_000m, 600_000m),
        });

        var body = ParseOkBody(await _sut.GetCountyStats(taxYear: 2026));

        Assert.Equal(500_000m, body.GetProperty("averageAssessedValue").GetDecimal());
    }

    /// <summary>
    /// When AssessedValue differs from MarketValue (ag/timber current-use, partial exemption),
    /// averageAssessedValue must reflect AssessedValue — NOT MarketValue.
    /// </summary>
    [Fact]
    public async Task GetCountyStats_AverageAssessedValue_UsesAssessedVal_NotMarket()
    {
        // AssessedValue = 200k (current-use reduction), MarketValue = 600k (true & fair)
        SeedProperties(new (int, decimal, decimal)[]
        {
            (2026, 200_000m, 600_000m),
            (2026, 400_000m, 800_000m),
        });

        var body = ParseOkBody(await _sut.GetCountyStats(taxYear: 2026));

        // Expected: AVG(AssessedValue) = (200k + 400k) / 2 = 300k
        // Wrong if Market used: (600k + 800k) / 2 = 700k
        Assert.Equal(300_000m, body.GetProperty("averageAssessedValue").GetDecimal());
    }

    /// <summary>
    /// When AssessedValue is 0, falls back to MarketValue so incomplete rows
    /// still contribute rather than silently drop from the average.
    /// </summary>
    [Fact]
    public async Task GetCountyStats_AverageAssessedValue_FallsBackToMarket_WhenAssessedValNull()
    {
        SeedProperties(new (int, decimal, decimal)[]
        {
            (2026, 0m,       400_000m),   // ← no AssessedValue → use MarketValue
            (2026, 600_000m, 800_000m),   // ← has AssessedValue → use AssessedValue
        });

        var body = ParseOkBody(await _sut.GetCountyStats(taxYear: 2026));

        // Expected: (400k + 600k) / 2 = 500k
        Assert.Equal(500_000m, body.GetProperty("averageAssessedValue").GetDecimal());
    }

    [Fact]
    public async Task GetCountyStats_PendingAssessments_CountsRowsWithPositiveNewVal()
    {
        SeedProperties(new (int, decimal, decimal)[]
        {
            (2026, 500_000m, 500_000m),
            (2026, 600_000m, 600_000m),
            (2026, 700_000m, 700_000m),
        });
        // One parcel has a draft valuation (pending)
        SeedDraftValuations(taxYear: 2026, count: 1);

        var body = ParseOkBody(await _sut.GetCountyStats(taxYear: 2026));

        Assert.Equal(1, body.GetProperty("pendingAssessments").GetInt32());
    }

    [Fact]
    public async Task GetCountyStats_CompletionPercent_Is100WhenAllHaveAssessedVal()
    {
        SeedProperties(new (int, decimal, decimal)[]
        {
            (2026, 500_000m, 500_000m),
            (2026, 600_000m, 600_000m),
        });

        var body = ParseOkBody(await _sut.GetCountyStats(taxYear: 2026));

        Assert.Equal(100.0, body.GetProperty("assessmentCompletionPercent").GetDouble());
    }

    [Fact]
    public async Task GetCountyStats_CompletionPercent_IsPartialWhenSomeMissingAssessedVal()
    {
        SeedProperties(new (int, decimal, decimal)[]
        {
            (2026, 500_000m, 500_000m),   // ← has assessed value
            (2026, 0m,       0m),         // ← missing both (no fallback either)
        });

        var body = ParseOkBody(await _sut.GetCountyStats(taxYear: 2026));

        Assert.Equal(50.0, body.GetProperty("assessmentCompletionPercent").GetDouble());
    }
}

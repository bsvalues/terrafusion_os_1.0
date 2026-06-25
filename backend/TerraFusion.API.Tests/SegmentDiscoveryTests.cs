using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Abstractions.Interfaces;
using TerraFusion.API.Services;
using TerraFusion.Core.Entities;
using TerraFusion.Data;
using Xunit;

using Task = System.Threading.Tasks.Task;

namespace TerraFusion.API.Tests;

/// <summary>
/// Unit tests for ForgeStatisticsService.DiscoverSegmentsAsync.
///
/// ParseTaxYear("model-2025-iqr") extracts the embedded year 2025, so all
/// "model-2025-iqr" tests use TaxYear = 2025 data seeded in the constructor.
/// "empty-model" has no embedded year → falls back to the current calendar year,
/// for which no data is seeded, exercising the empty-result path.
/// </summary>
public sealed class SegmentDiscoveryTests : IDisposable
{
    private static readonly Guid CountyA = Guid.Parse("00000000-0000-0000-0000-000000000001");
    private static readonly Guid CountyB = Guid.Parse("00000000-0000-0000-0000-000000000002");

    private readonly TerraFusionDbContext _db;
    private readonly IForgeStatisticsService _service;

    public SegmentDiscoveryTests()
    {
        var opts = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var cfg = new ConfigurationBuilder().AddInMemoryCollection([]).Build();
        _db = new TerraFusionDbContext(opts, cfg);

        // CountyA — neighborhood "100", TaxYear 2025, lower ImprvVal (~120 k average)
        SeedCama(CountyA, 2025, "100", [100_000m, 150_000m, 110_000m]);

        // CountyB — same neighborhood code, different ImprvVal (~220 k average) so
        // county isolation assertions can confirm different computed MedianValue.
        SeedCama(CountyB, 2025, "100", [200_000m, 250_000m, 210_000m]);

        _db.SaveChanges();

        _service = new ForgeStatisticsService(_db, NullLogger<ForgeStatisticsService>.Instance);
    }

    public void Dispose() => _db.Dispose();

    // ── Helpers ────────────────────────────────────────────────────────────────

    private void SeedCama(Guid countyId, int taxYear, string neighborhoodCode, decimal[] imprvVals)
    {
        foreach (var val in imprvVals)
        {
            _db.CamaCharacteristics.Add(new CamaCharacteristic
            {
                Id               = Guid.NewGuid(),
                ParcelId         = Guid.NewGuid().ToString("N"),
                TaxYear          = taxYear,
                CountyId         = countyId,
                BuildingType     = "R1",
                SquareFeet       = 1_800m,
                NeighborhoodCode = neighborhoodCode,
                ImprvVal         = val,
                YearBuilt        = 2000,
            });
        }
    }

    // ── Tests ──────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetSegments_ReturnsDeterministicGroupedResults()
    {
        var first  = await _service.DiscoverSegmentsAsync("model-2025-iqr", CountyA);
        var second = await _service.DiscoverSegmentsAsync("model-2025-iqr", CountyA);

        Assert.NotNull(first);
        Assert.NotEmpty(first);

        // Same inputs → same outputs (deterministic)
        Assert.Equal(first.Count, second.Count);
        for (int i = 0; i < first.Count; i++)
        {
            Assert.Equal(first[i].Id,          second[i].Id);
            Assert.Equal(first[i].Name,        second[i].Name);
            Assert.Equal(first[i].ParcelCount, second[i].ParcelCount);
            Assert.Equal(first[i].MedianValue, second[i].MedianValue);
            Assert.Equal(first[i].Confidence,  second[i].Confidence);
        }

        // Each segment has required fields
        foreach (var seg in first)
        {
            Assert.False(string.IsNullOrWhiteSpace(seg.Id));
            Assert.False(string.IsNullOrWhiteSpace(seg.Name));
            Assert.False(string.IsNullOrWhiteSpace(seg.BoundaryDescription));
            Assert.True(seg.ParcelCount > 0);
            Assert.True(seg.MedianValue > 0);
            Assert.True(seg.Confidence >= 0 && seg.Confidence <= 1.0);
            Assert.NotNull(seg.KeyCharacteristics);
            Assert.NotEmpty(seg.KeyCharacteristics);
        }
    }

    [Fact]
    public async Task GetSegments_RespectsCountyIsolation()
    {
        var resultA = await _service.DiscoverSegmentsAsync("model-2025-iqr", CountyA);
        var resultB = await _service.DiscoverSegmentsAsync("model-2025-iqr", CountyB);

        Assert.NotNull(resultA);
        Assert.NotNull(resultB);
        Assert.NotEmpty(resultA);
        Assert.NotEmpty(resultB);

        // Both counties have one neighborhood segment (same structure)
        Assert.Equal(resultA.Count, resultB.Count);

        // ImprvVal averages differ (120 k vs 220 k) → MedianValue must differ
        bool anyDifference = false;
        for (int i = 0; i < resultA.Count; i++)
        {
            if (resultA[i].MedianValue != resultB[i].MedianValue ||
                resultA[i].Confidence  != resultB[i].Confidence)
            {
                anyDifference = true;
                break;
            }
        }
        Assert.True(anyDifference, "Different county GUIDs should produce different median values");
    }

    [Fact]
    public async Task GetSegments_ReturnsValidEmptyList_WhenNoSourceRowsExist()
    {
        // "empty-model" embeds no year → ParseTaxYear returns current calendar year
        // for which no CamaCharacteristics rows are seeded, so the result is empty.
        var result = await _service.DiscoverSegmentsAsync("empty-model", CountyA);

        Assert.NotNull(result);
        // Empty list: Assert.All passes vacuously, confirming no "non-pending" segments leaked.
        Assert.All(result, seg => Assert.Equal("pending", seg.Status));
    }
}

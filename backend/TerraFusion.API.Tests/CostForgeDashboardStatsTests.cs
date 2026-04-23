// Phase A2 — Physical Depreciation data-integrity warning
//
// Tests for CostForgeController.GetDashboardStats:
//   1. When avg PhysicalDepreciationPct > 95 → dataIntegrityWarning is non-null,
//      references "PhysicalDepreciationPct" and "source" (not "PACS"), and the raw
//      avg value is still reported (not suppressed).
//   2. When avg PhysicalDepreciationPct is within normal range (~40%) →
//      dataIntegrityWarning is null and the raw avg is reported.
//
// These assertions protect the credibility fix described in
// docs/superpowers/specs/2026-04-15-statistics-studio-phd-polish-design.md §A2.

using System;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.Abstractions.Interfaces;
using TerraFusion.API.Controllers;
using TerraFusion.API.Tests.TestHelpers;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using Xunit;

namespace TerraFusion.API.Tests;

public sealed class CostForgeDashboardStatsTests : IDisposable
{
    private readonly TerraFusion.Data.TerraFusionDbContext _db;
    private readonly CostForgeController _sut;
    private const int TaxYear = 2026;
    private static readonly Guid CountyId = Guid.Parse("00000000-0000-0000-0000-000000000001");

    public CostForgeDashboardStatsTests()
    {
        _db = TestDbContextFactory.CreateInMemoryContext();
        _sut = new CostForgeController(
            Mock.Of<ICostForgeService>(),
            Mock.Of<ICostForgeAIService>(),
            _db,
            Mock.Of<TerraFusion.Abstractions.Interfaces.IAuditLogger>(),
            NullLogger<CostForgeController>.Instance);
    }

    public void Dispose() => _db.Dispose();

    // ── Helpers ──────────────────────────────────────────────────────────

    private void SeedCamaRows(int count, decimal physicalDepPct)
    {
        for (int i = 0; i < count; i++)
        {
            _db.CamaCharacteristics.Add(new CamaCharacteristic
            {
                Id = Guid.NewGuid(),
                ParcelId = $"TEST-PARCEL-{i:D6}",
                TaxYear = TaxYear,
                BuildingType = "R1",
                SquareFeet = 1800,
                CountyId = CountyId,
                PhysicalDepreciationPct = physicalDepPct,
                DepreciationPct = physicalDepPct,
                UpdatedAt = DateTime.UtcNow,
                UpdatedBy = "test",
            });
        }
        _db.SaveChanges();
    }

    private static JsonElement ToJsonElement(object payload)
    {
        var json = JsonSerializer.Serialize(payload);
        return JsonDocument.Parse(json).RootElement;
    }

    // ── Tests ────────────────────────────────────────────────────────────

    [Fact]
    public async System.Threading.Tasks.Task DashboardStats_HighPhysicalDep_ReturnsDataIntegrityWarning()
    {
        // Seed CAMA rows with avg physical depreciation pegged at 100% —
        // mimics the real-world PhysicalDepreciationPct mis-scaled scenario.
        SeedCamaRows(count: 20, physicalDepPct: 100m);

        var result = await _sut.GetDashboardStats(TaxYear);

        var ok = Assert.IsType<OkObjectResult>(result);
        var root = ToJsonElement(ok.Value!);

        // Warning must be present and human-readable.
        Assert.True(root.TryGetProperty("dataIntegrityWarning", out var warnEl));
        Assert.Equal(JsonValueKind.String, warnEl.ValueKind);
        var warning = warnEl.GetString()!;
        Assert.Contains("PhysicalDepreciationPct", warning);
        // Spec §A2 line — warning string must not leak legacy "PACS" branding.
        Assert.DoesNotContain("PACS", warning);

        // Raw avg must still be visible to the assessor (never hidden by the flag).
        Assert.True(root.TryGetProperty("depreciationSummary", out var deprEl));
        var physical = deprEl.EnumerateArray()
            .Single(d => d.GetProperty("category").GetString() == "Physical");
        Assert.True(physical.GetProperty("avg").GetDouble() > 95.0);
    }

    [Fact]
    public async System.Threading.Tasks.Task DashboardStats_NormalPhysicalDep_NoWarning()
    {
        // Normal range — county-wide average depreciation around 40% is plausible.
        SeedCamaRows(count: 20, physicalDepPct: 40m);

        var result = await _sut.GetDashboardStats(TaxYear);

        var ok = Assert.IsType<OkObjectResult>(result);
        var root = ToJsonElement(ok.Value!);

        // Property must exist but be null (not emitted as a string).
        Assert.True(root.TryGetProperty("dataIntegrityWarning", out var warnEl));
        Assert.Equal(JsonValueKind.Null, warnEl.ValueKind);

        // Raw avg still reported.
        Assert.True(root.TryGetProperty("depreciationSummary", out var deprEl));
        var physical = deprEl.EnumerateArray()
            .Single(d => d.GetProperty("category").GetString() == "Physical");
        Assert.InRange(physical.GetProperty("avg").GetDouble(), 39.0, 41.0);
    }
}

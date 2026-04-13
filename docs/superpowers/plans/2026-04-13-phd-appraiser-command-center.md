# PhD Appraiser Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing CalibrationWorkbench with four new panels — RevalAreaNavigator, AiCopilotBand, ParcelEvidenceViewer, AdjustmentSimulator, and StratifiedEquityPanel — giving the chief appraiser a PhD-level IAAO ratio study audit loop.

**Architecture:** Shared `useCalibrationContext` hook holds selectedRevalArea, selectedBuildingType, proposedAdjustments, excludedSaleIds. Client-side `useRatioProjection` computes PRD/PRB/COD projections with 300ms debounce. Backend adds SaleRecord + OutlierExclusion entities, seven new endpoints, and a dev seeder.

**Tech Stack:** .NET 8 EF Core (backend), React 18 + TypeScript + TanStack Query + Recharts (frontend), existing `packages/terrabuild/client/src/` patterns.

---

## File Map

### New Backend Files
- `backend/src/TerraFusion.Core/Entities/SaleRecord.cs`
- `backend/src/TerraFusion.Core/Entities/OutlierExclusion.cs`
- `backend/src/TerraFusion.API/Seeds/SaleRecordSeeder.cs`

### Modified Backend Files
- `backend/src/TerraFusion.Data/TerraFusionDbContext.cs` — add two DbSets
- `backend/src/TerraFusion.API/Controllers/CalibrationDiagnosticController.cs` — add 6 new endpoints
- `backend/src/TerraFusion.API/Controllers/MatrixVersionController.cs` — add apply-adjustment endpoint
- `backend/src/TerraFusion.API/Program.cs` — register seeder call

### New Frontend Files
- `packages/terrabuild/client/src/hooks/calibration/useCalibrationContext.ts`
- `packages/terrabuild/client/src/hooks/calibration/useRatioProjection.ts`
- `packages/terrabuild/client/src/components/calibration/RevalAreaNavigator.tsx`
- `packages/terrabuild/client/src/components/calibration/AiCopilotBand.tsx`
- `packages/terrabuild/client/src/components/calibration/ParcelEvidenceViewer.tsx`
- `packages/terrabuild/client/src/components/calibration/AdjustmentSimulator.tsx`
- `packages/terrabuild/client/src/components/calibration/StratifiedEquityPanel.tsx`

### Modified Frontend Files
- `packages/terrabuild/client/src/components/calibration/index.ts` — add new exports
- `packages/terrabuild/client/src/pages/CalibrationWorkbench.tsx` — integrate all new panels

---

## Task 1: SaleRecord + OutlierExclusion Entities

**Files:**
- Create: `backend/src/TerraFusion.Core/Entities/SaleRecord.cs`
- Create: `backend/src/TerraFusion.Core/Entities/OutlierExclusion.cs`
- Modify: `backend/src/TerraFusion.Data/TerraFusionDbContext.cs`

- [ ] **Step 1: Create SaleRecord entity**

```csharp
// backend/src/TerraFusion.Core/Entities/SaleRecord.cs
using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

public class SaleRecord
{
    public int Id { get; set; }
    public int MatrixVersionId { get; set; }
    public MatrixVersion MatrixVersion { get; set; } = null!;

    [Required][StringLength(50)]
    public string ParcelId { get; set; } = string.Empty;

    [StringLength(50)]
    public string RevalArea { get; set; } = string.Empty;

    [StringLength(100)]
    public string BuildingType { get; set; } = string.Empty;

    public DateTime SaleDate { get; set; }
    public decimal SalePrice { get; set; }
    public decimal AssessedValue { get; set; }
    public decimal Ratio { get; set; }           // AssessedValue / SalePrice

    public bool IsOutlierIqr { get; set; }

    [StringLength(50)]
    public string? AiClassification { get; set; } // ESTATE_SALE | RENOVATION | RELATED_PARTY | NEW_CONSTRUCTION

    [StringLength(500)]
    public string? PacsFlags { get; set; }

    public int ValueQuintile { get; set; }        // 1–5 computed on import
    public int AgeBand { get; set; }              // 1=Pre-1960 … 5=Post-2015

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [StringLength(100)]
    public string CreatedBy { get; set; } = "system";

    [StringLength(100)]
    public string UpdatedBy { get; set; } = "system";
}
```

- [ ] **Step 2: Create OutlierExclusion entity**

```csharp
// backend/src/TerraFusion.Core/Entities/OutlierExclusion.cs
using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

public class OutlierExclusion
{
    public int Id { get; set; }
    public int MatrixVersionId { get; set; }
    public int SaleRecordId { get; set; }
    public SaleRecord SaleRecord { get; set; } = null!;

    [Required][StringLength(30)]
    public string DispositionType { get; set; } = string.Empty; // EXCLUDED | FLAGGED_DATA | ACCEPTED

    [StringLength(500)]
    public string? AppraiserNote { get; set; }

    public bool DataProblemFlagged { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [StringLength(100)]
    public string CreatedBy { get; set; } = "system";
}
```

- [ ] **Step 3: Add DbSets to TerraFusionDbContext**

Find the block where `CalibrationFindings` is declared and add after it:

```csharp
  public DbSet<SaleRecord> SaleRecords { get; set; }
  public DbSet<OutlierExclusion> OutlierExclusions { get; set; }
```

- [ ] **Step 4: Create EF migration**

```bash
cd backend
dotnet ef migrations add AddSaleRecordOutlierExclusion \
  --project src/TerraFusion.Data \
  --startup-project src/TerraFusion.API
dotnet ef database update \
  --project src/TerraFusion.Data \
  --startup-project src/TerraFusion.API
```

Expected: migration file created, database updated with two new tables.

- [ ] **Step 5: Build to verify**

```bash
cd backend
dotnet build TerraFusion.sln -c Release
```

Expected: 0 errors, 0 warnings.

- [ ] **Step 6: Commit**

```bash
git add backend/src/TerraFusion.Core/Entities/SaleRecord.cs \
        backend/src/TerraFusion.Core/Entities/OutlierExclusion.cs \
        backend/src/TerraFusion.Data/TerraFusionDbContext.cs \
        backend/src/TerraFusion.Data/Migrations/
git commit -m "feat(calibration): SaleRecord + OutlierExclusion entities + migration"
```

---

## Task 2: Dev Sale Record Seeder

**Files:**
- Create: `backend/src/TerraFusion.API/Seeds/SaleRecordSeeder.cs`
- Modify: `backend/src/TerraFusion.API/Program.cs`

- [ ] **Step 1: Create SaleRecordSeeder**

```csharp
// backend/src/TerraFusion.API/Seeds/SaleRecordSeeder.cs
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities;
using TerraFusion.Data;

namespace TerraFusion.API.Seeds;

/// <summary>
/// Dev-only seeder: creates 120 synthetic sale records across three reval areas
/// and two building types so all new PhD Appraiser panels have data to render.
/// Only runs when SaleRecords table is empty (idempotent).
/// </summary>
public sealed class SaleRecordSeeder
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<SaleRecordSeeder> _logger;

    public SaleRecordSeeder(TerraFusionDbContext db, ILogger<SaleRecordSeeder> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task SeedAsync(CancellationToken ct = default)
    {
        if (await _db.SaleRecords.AnyAsync(ct))
        {
            _logger.LogInformation("[SaleRecordSeeder] SaleRecords already populated — skipping.");
            return;
        }

        // Require at least one MatrixVersion to FK against
        var version = await _db.MatrixVersions.FirstOrDefaultAsync(ct);
        if (version is null)
        {
            _logger.LogWarning("[SaleRecordSeeder] No MatrixVersion found — skipping sale record seed.");
            return;
        }

        var revalAreas = new[] { "REVAL-1", "REVAL-2", "REVAL-3" };
        var buildingTypes = new[] { "S1", "S2" };
        var rng = new Random(42);
        var records = new List<SaleRecord>();

        int seq = 1;
        foreach (var area in revalAreas)
        {
            foreach (var bt in buildingTypes)
            {
                // 20 sales per area/type combination = 120 total
                var salePrices = Enumerable.Range(0, 20)
                    .Select(_ => 180_000m + rng.Next(-60_000, 120_000))
                    .OrderBy(p => p).ToList();

                // Sort for quintile assignment (rank within this group)
                var sorted = salePrices.OrderBy(p => p).ToList();
                var quintileBoundaries = new[]
                {
                    sorted[(int)(sorted.Count * 0.20)],
                    sorted[(int)(sorted.Count * 0.40)],
                    sorted[(int)(sorted.Count * 0.60)],
                    sorted[(int)(sorted.Count * 0.80)],
                };

                // Compute ratios with slight regressivity baked in
                var ratios = salePrices.Select(sp =>
                {
                    var baseRatio = 0.97m + (decimal)rng.NextDouble() * 0.10m;
                    // Low-value houses slightly over-assessed (regressivity)
                    if (sp < 200_000) baseRatio += 0.03m;
                    return baseRatio;
                }).ToList();

                // IQR outlier detection
                var sortedRatios = ratios.OrderBy(r => r).ToList();
                var q1 = sortedRatios[(int)(sortedRatios.Count * 0.25)];
                var q3 = sortedRatios[(int)(sortedRatios.Count * 0.75)];
                var iqr = q3 - q1;
                var lowerFence = q1 - 1.5m * iqr;
                var upperFence = q3 + 1.5m * iqr;

                // Inject 2 deliberate outliers
                ratios[0] = lowerFence - 0.05m;
                ratios[19] = upperFence + 0.05m;

                for (int i = 0; i < salePrices.Count; i++)
                {
                    var sp = salePrices[i];
                    var ratio = ratios[i];
                    var av = sp * ratio;
                    var yearBuilt = 1950 + rng.Next(0, 75);
                    var saleDate = DateTime.UtcNow.AddMonths(-rng.Next(1, 13));

                    int quintile = 1;
                    for (int q = 0; q < quintileBoundaries.Length; q++)
                        if (sp >= quintileBoundaries[q]) quintile = q + 2;

                    int ageBand = yearBuilt < 1960 ? 1
                        : yearBuilt < 1980 ? 2
                        : yearBuilt < 2000 ? 3
                        : yearBuilt < 2015 ? 4 : 5;

                    bool isOutlier = ratio < lowerFence || ratio > upperFence;
                    string? classification = isOutlier
                        ? (i == 0 ? "ESTATE_SALE" : "RENOVATION")
                        : null;

                    records.Add(new SaleRecord
                    {
                        MatrixVersionId = version.Id,
                        ParcelId = $"B-{area}-{bt}-{seq++:D4}",
                        RevalArea = area,
                        BuildingType = bt,
                        SaleDate = saleDate,
                        SalePrice = Math.Round(sp, 0),
                        AssessedValue = Math.Round(av, 0),
                        Ratio = Math.Round(ratio, 4),
                        IsOutlierIqr = isOutlier,
                        AiClassification = classification,
                        ValueQuintile = quintile,
                        AgeBand = ageBand,
                    });
                }
            }
        }

        _db.SaleRecords.AddRange(records);
        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("[SaleRecordSeeder] Seeded {Count} sale records.", records.Count);
    }
}
```

- [ ] **Step 2: Register seeder in Program.cs**

Find the block where `DevPropertySeeder` is called (in the development-only seeding section). Add after it:

```csharp
// In the development seeding block, after DevPropertySeeder:
using (var scope = app.Services.CreateScope())
{
    var seeder = scope.ServiceProvider.GetRequiredService<SaleRecordSeeder>();
    await seeder.SeedAsync();
}
```

Also register the seeder as a scoped service in the services section:

```csharp
builder.Services.AddScoped<SaleRecordSeeder>();
```

- [ ] **Step 3: Build and run seeder**

```bash
cd backend
dotnet build TerraFusion.sln -c Release
dotnet run --project src/TerraFusion.API
```

Expected: log line `[SaleRecordSeeder] Seeded 120 sale records.`

- [ ] **Step 4: Commit**

```bash
git add backend/src/TerraFusion.API/Seeds/SaleRecordSeeder.cs \
        backend/src/TerraFusion.API/Program.cs
git commit -m "feat(calibration): SaleRecordSeeder — 120 synthetic sale records with IQR outliers"
```

---

## Task 3: Backend — reval-area-summary + parcel-evidence Endpoints

**Files:**
- Modify: `backend/src/TerraFusion.API/Controllers/CalibrationDiagnosticController.cs`

- [ ] **Step 1: Add endpoints to CalibrationDiagnosticController**

Add these methods to the existing `CalibrationDiagnosticController` class (after the existing endpoints):

```csharp
    // ── PhD Appraiser Command Center endpoints ─────────────────────────────

    /// <summary>
    /// Reval Area Navigator health summary.
    /// Returns PRD/PRB/COD per reval-area+building-type combination
    /// with IAAO health status (GREEN/YELLOW/RED).
    /// </summary>
    [HttpGet("reval-area-summary")]
    public async Task<IActionResult> GetRevalAreaSummary([FromQuery] int matrixVersionId)
    {
        var sales = await _db.SaleRecords
            .Where(s => s.MatrixVersionId == matrixVersionId)
            .AsNoTracking()
            .ToListAsync();

        var groups = sales
            .GroupBy(s => new { s.RevalArea, s.BuildingType })
            .Select(g =>
            {
                var ratios = g.Select(s => (double)s.Ratio).ToList();
                var prd = ComputePrd(g.Select(s => ((double)s.AssessedValue, (double)s.SalePrice)));
                var prb = ComputePrb(g.Select(s => ((double)s.SalePrice, (double)s.Ratio)));
                var cod = ComputeCod(ratios);
                var healthStatus = GetHealthStatus(prd, prb, cod);
                return new
                {
                    revalArea = g.Key.RevalArea,
                    buildingType = g.Key.BuildingType,
                    prd = Math.Round(prd, 4),
                    prb = Math.Round(prb, 4),
                    cod = Math.Round(cod, 2),
                    saleCount = g.Count(),
                    healthStatus,
                };
            })
            .OrderBy(x => x.revalArea).ThenBy(x => x.buildingType)
            .ToList();

        return Ok(groups);
    }

    /// <summary>
    /// Full sale records for the Evidence Viewer scatter plot.
    /// Filters by reval area and building type.
    /// </summary>
    [HttpGet("parcel-evidence")]
    public async Task<IActionResult> GetParcelEvidence(
        [FromQuery] int matrixVersionId,
        [FromQuery] string? revalArea,
        [FromQuery] string? buildingType)
    {
        var q = _db.SaleRecords
            .Where(s => s.MatrixVersionId == matrixVersionId);

        if (!string.IsNullOrEmpty(revalArea))
            q = q.Where(s => s.RevalArea == revalArea);
        if (!string.IsNullOrEmpty(buildingType))
            q = q.Where(s => s.BuildingType == buildingType);

        var records = await q.AsNoTracking().ToListAsync();

        // Get current exclusions for this version
        var excludedIds = await _db.OutlierExclusions
            .Where(e => e.MatrixVersionId == matrixVersionId)
            .Select(e => e.SaleRecordId)
            .ToHashSetAsync();

        var ratios = records.Select(s => (double)s.Ratio).ToList();
        double medianRatio = Median(ratios);
        double cod = ComputeCod(ratios);

        var result = new
        {
            medianRatio = Math.Round(medianRatio, 4),
            cod = Math.Round(cod, 2),
            saleCount = records.Count,
            outlierCount = records.Count(s => s.IsOutlierIqr),
            parcels = records.Select(s => new
            {
                s.Id, s.ParcelId, s.RevalArea, s.BuildingType,
                saleDate = s.SaleDate.ToString("yyyy-MM-dd"),
                s.SalePrice, s.AssessedValue, s.Ratio,
                s.IsOutlierIqr, s.AiClassification, s.PacsFlags,
                s.ValueQuintile, s.AgeBand,
                isExcluded = excludedIds.Contains(s.Id),
            }),
        };

        return Ok(result);
    }

    // ── Math helpers ───────────────────────────────────────────────────────

    private static double ComputePrd(IEnumerable<(double av, double sp)> sales)
    {
        var list = sales.ToList();
        if (list.Count == 0) return 1.0;
        double meanRatio = list.Average(x => x.av / x.sp);
        double weightedMean = list.Sum(x => x.av) / list.Sum(x => x.sp);
        return weightedMean == 0 ? 1.0 : meanRatio / weightedMean;
    }

    private static double ComputePrb(IEnumerable<(double sp, double ratio)> sales)
    {
        var list = sales.Where(x => x.sp > 0).ToList();
        if (list.Count < 2) return 0.0;
        var xs = list.Select(x => Math.Log(x.sp)).ToList();
        var ys = list.Select(x => x.ratio - 1.0).ToList();
        double xMean = xs.Average();
        double yMean = ys.Average();
        double cov = xs.Zip(ys, (x, y) => (x - xMean) * (y - yMean)).Sum();
        double varX = xs.Sum(x => (x - xMean) * (x - xMean));
        return varX == 0 ? 0.0 : cov / varX;
    }

    private static double ComputeCod(IEnumerable<double> ratios)
    {
        var list = ratios.ToList();
        if (list.Count == 0) return 0.0;
        double med = Median(list);
        if (med == 0) return 0.0;
        return list.Average(r => Math.Abs(r - med)) / med * 100.0;
    }

    private static double Median(List<double> values)
    {
        if (values.Count == 0) return 0.0;
        var sorted = values.OrderBy(v => v).ToList();
        int mid = sorted.Count / 2;
        return sorted.Count % 2 == 0
            ? (sorted[mid - 1] + sorted[mid]) / 2.0
            : sorted[mid];
    }

    private static string GetHealthStatus(double prd, double prb, double cod)
    {
        if (prd > 1.03 || prd < 0.98 || cod > 15 || Math.Abs(prb) > 0.05)
            return "RED";
        if (prd > 1.02 || cod > 12)
            return "YELLOW";
        return "GREEN";
    }
```

- [ ] **Step 2: Build and verify**

```bash
cd backend
dotnet build TerraFusion.sln -c Release
```

Expected: 0 errors.

- [ ] **Step 3: Smoke test the endpoints**

```bash
# Requires the API running with seeded data
curl "http://localhost:5000/api/calibrationdiagnostic/reval-area-summary?matrixVersionId=1"
curl "http://localhost:5000/api/calibrationdiagnostic/parcel-evidence?matrixVersionId=1&revalArea=REVAL-1&buildingType=S1"
```

Expected: JSON arrays with PRD/PRB/COD values and parcel lists.

- [ ] **Step 4: Commit**

```bash
git add backend/src/TerraFusion.API/Controllers/CalibrationDiagnosticController.cs
git commit -m "feat(calibration): reval-area-summary + parcel-evidence endpoints with IAAO math"
```

---

## Task 4: Backend — simulate + solve-for-rate + stratified-equity Endpoints

**Files:**
- Modify: `backend/src/TerraFusion.API/Controllers/CalibrationDiagnosticController.cs`

- [ ] **Step 1: Add simulate, solve-for-rate, stratified-equity endpoints**

Add these methods to `CalibrationDiagnosticController` (after Task 3 additions):

```csharp
    [HttpPost("simulate")]
    public async Task<IActionResult> Simulate([FromBody] SimulateRequest req)
    {
        var q = _db.SaleRecords.Where(s => s.MatrixVersionId == req.MatrixVersionId);
        if (!string.IsNullOrEmpty(req.RevalArea)) q = q.Where(s => s.RevalArea == req.RevalArea);
        if (!string.IsNullOrEmpty(req.BuildingType)) q = q.Where(s => s.BuildingType == req.BuildingType);

        var all = await q.AsNoTracking().ToListAsync();
        var active = all.Where(s => !req.ExcludedSaleIds.Contains(s.Id)).ToList();

        if (active.Count == 0) return BadRequest("No active sales after exclusions.");

        double factor = 1.0 + req.AdjustmentPct / 100.0;
        var projected = active.Select(s => new
        {
            AV = (double)s.AssessedValue * factor,
            SP = (double)s.SalePrice,
        }).ToList();

        double projPrd = ComputePrd(projected.Select(x => (x.AV, x.SP)));
        double projPrb = ComputePrb(projected.Select(x => (x.SP, x.AV / x.SP)));
        double projCod = ComputeCod(projected.Select(x => x.AV / x.SP).ToList());
        double projMedian = Median(projected.Select(x => x.AV / x.SP).ToList());
        decimal avImpact = active.Sum(s => s.AssessedValue) * (decimal)(factor - 1.0);

        // Cross-area impact: apply same adjustment to other areas
        var allSales = await _db.SaleRecords
            .Where(s => s.MatrixVersionId == req.MatrixVersionId)
            .AsNoTracking().ToListAsync();
        var crossArea = allSales
            .GroupBy(s => s.RevalArea)
            .Select(g =>
            {
                var activeSales = g.Where(s => !req.ExcludedSaleIds.Contains(s.Id)).ToList();
                if (activeSales.Count == 0) return new { revalArea = g.Key, projectedPrd = 1.0 };
                double prd = ComputePrd(activeSales.Select(s => ((double)s.AssessedValue * factor, (double)s.SalePrice)));
                return new { revalArea = g.Key, projectedPrd = Math.Round(prd, 4) };
            }).ToList();

        return Ok(new
        {
            projectedPrd = Math.Round(projPrd, 4),
            projectedPrb = Math.Round(projPrb, 4),
            projectedCod = Math.Round(projCod, 2),
            projectedMedianRatio = Math.Round(projMedian, 4),
            estimatedAvImpact = Math.Round(avImpact, 0),
            crossAreaImpact = crossArea,
        });
    }

    [HttpPost("solve-for-rate")]
    public async Task<IActionResult> SolveForRate([FromBody] SolveForRateRequest req)
    {
        var q = _db.SaleRecords.Where(s => s.MatrixVersionId == req.MatrixVersionId);
        if (!string.IsNullOrEmpty(req.RevalArea)) q = q.Where(s => s.RevalArea == req.RevalArea);
        if (!string.IsNullOrEmpty(req.BuildingType)) q = q.Where(s => s.BuildingType == req.BuildingType);

        var all = await q.AsNoTracking().ToListAsync();
        var active = all.Where(s => !req.ExcludedSaleIds.Contains(s.Id)).ToList();
        if (active.Count == 0) return BadRequest("No active sales.");

        // Binary search for adjustment% that achieves targetPrd
        double lo = -50.0, hi = 100.0;
        double bestAdj = 0.0;
        for (int iter = 0; iter < 60; iter++)
        {
            double mid = (lo + hi) / 2.0;
            double factor = 1.0 + mid / 100.0;
            var proj = active.Select(s => ((double)s.AssessedValue * factor, (double)s.SalePrice));
            double prd = ComputePrd(proj);
            if (prd < req.TargetPrd) lo = mid; else hi = mid;
            bestAdj = mid;
            if (Math.Abs(hi - lo) < 0.001) break;
        }

        double bestFactor = 1.0 + bestAdj / 100.0;
        var bestProj = active.Select(s => new { AV = (double)s.AssessedValue * bestFactor, SP = (double)s.SalePrice });
        return Ok(new
        {
            suggestedAdjustmentPct = Math.Round(bestAdj, 3),
            projectedPrd = Math.Round(ComputePrd(bestProj.Select(x => (x.AV, x.SP))), 4),
            projectedCod = Math.Round(ComputeCod(bestProj.Select(x => x.AV / x.SP).ToList()), 2),
            projectedPrb = Math.Round(ComputePrb(bestProj.Select(x => (x.SP, x.AV / x.SP))), 4),
        });
    }

    [HttpGet("stratified-equity")]
    public async Task<IActionResult> GetStratifiedEquity(
        [FromQuery] int matrixVersionId,
        [FromQuery] string? revalArea,
        [FromQuery] string? buildingType)
    {
        var q = _db.SaleRecords.Where(s => s.MatrixVersionId == matrixVersionId);
        if (!string.IsNullOrEmpty(revalArea)) q = q.Where(s => s.RevalArea == revalArea);
        if (!string.IsNullOrEmpty(buildingType)) q = q.Where(s => s.BuildingType == buildingType);

        var records = await q.AsNoTracking().ToListAsync();

        var cells = records
            .GroupBy(s => new { s.ValueQuintile, s.AgeBand })
            .Select(g =>
            {
                var ratios = g.Select(s => (double)s.Ratio).ToList();
                return new
                {
                    quintile = g.Key.ValueQuintile,
                    ageBand = g.Key.AgeBand,
                    medianRatio = Math.Round(Median(ratios), 4),
                    cod = Math.Round(ComputeCod(ratios), 2),
                    saleCount = g.Count(),
                    parcelIds = g.Select(s => s.ParcelId).ToList(),
                };
            })
            .OrderBy(c => c.quintile).ThenBy(c => c.ageBand)
            .ToList();

        return Ok(cells);
    }
```

Also add the request record types at the bottom of the file (alongside existing `ResolveFindingRequest`):

```csharp
public record SimulateRequest(
    int MatrixVersionId,
    string? RevalArea,
    string? BuildingType,
    double AdjustmentPct,
    List<int> ExcludedSaleIds);

public record SolveForRateRequest(
    int MatrixVersionId,
    string? RevalArea,
    string? BuildingType,
    double TargetPrd,
    List<int> ExcludedSaleIds);
```

- [ ] **Step 2: Build and verify**

```bash
cd backend && dotnet build TerraFusion.sln -c Release
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add backend/src/TerraFusion.API/Controllers/CalibrationDiagnosticController.cs
git commit -m "feat(calibration): simulate + solve-for-rate + stratified-equity endpoints"
```

---

## Task 5: Backend — outlier-exclusions + apply-adjustment Endpoints

**Files:**
- Modify: `backend/src/TerraFusion.API/Controllers/CalibrationDiagnosticController.cs`
- Modify: `backend/src/TerraFusion.API/Controllers/MatrixVersionController.cs`

- [ ] **Step 1: Add outlier-exclusions endpoint to CalibrationDiagnosticController**

```csharp
    [HttpPost("outlier-exclusions")]
    public async Task<IActionResult> RecordOutlierExclusion([FromBody] OutlierExclusionRequest req)
    {
        var sale = await _db.SaleRecords.FindAsync(req.SaleRecordId);
        if (sale is null) return NotFound($"SaleRecord {req.SaleRecordId} not found.");

        // Remove any prior disposition for this sale in this version
        var prior = await _db.OutlierExclusions
            .Where(e => e.MatrixVersionId == req.MatrixVersionId && e.SaleRecordId == req.SaleRecordId)
            .ToListAsync();
        _db.OutlierExclusions.RemoveRange(prior);

        var exclusion = new OutlierExclusion
        {
            MatrixVersionId = req.MatrixVersionId,
            SaleRecordId = req.SaleRecordId,
            DispositionType = req.DispositionType,
            AppraiserNote = req.AppraiserNote,
            DataProblemFlagged = req.DispositionType == "FLAGGED_DATA",
            CreatedBy = "appraiser",
        };
        _db.OutlierExclusions.Add(exclusion);

        // If data problem — create a PropertyWorkbenchFlag for the parcel
        if (exclusion.DataProblemFlagged)
        {
            _db.PropertyWorkbenchFlags.Add(new PropertyWorkbenchFlag
            {
                ParcelId = sale.ParcelId,
                Reason = $"Outlier flagged as DATA_PROBLEM in ratio study. Note: {req.AppraiserNote}",
                Status = "PENDING",
                CreatedBy = "calibration-workbench",
                UpdatedBy = "calibration-workbench",
            });
        }

        await _db.SaveChangesAsync();
        return Ok(new { exclusion.Id, exclusion.DispositionType, exclusion.DataProblemFlagged });
    }
```

Add the request record type at the bottom of the file:

```csharp
public record OutlierExclusionRequest(
    int MatrixVersionId,
    int SaleRecordId,
    string DispositionType,
    string? AppraiserNote);
```

- [ ] **Step 2: Add apply-adjustment endpoint to MatrixVersionController**

Find `MatrixVersionController.cs` and add after the existing endpoints:

```csharp
    [HttpPost("{id:int}/apply-adjustment")]
    public async Task<IActionResult> ApplyAdjustment(int id, [FromBody] ApplyAdjustmentRequest req)
    {
        var version = await _db.MatrixVersions.FindAsync(id);
        if (version is null) return NotFound($"MatrixVersion {id} not found.");
        if (version.Status == "LOCKED")
            return BadRequest("Cannot adjust a LOCKED matrix version.");

        // Parse current rate snapshot
        var snapshot = version.RateSnapshot is string s
            ? System.Text.Json.JsonSerializer.Deserialize<List<RateCellDto>>(s) ?? new()
            : new List<RateCellDto>();

        double factor = 1.0 + req.AdjustmentPct / 100.0;
        bool changed = false;
        foreach (var cell in snapshot)
        {
            bool matchArea = string.IsNullOrEmpty(req.RevalArea) || cell.RevalArea == req.RevalArea;
            bool matchType = string.IsNullOrEmpty(req.BuildingType) || cell.BuildingType == req.BuildingType;
            if (matchArea && matchType)
            {
                cell.BaseRate = Math.Round(cell.BaseRate * (decimal)factor, 4);
                changed = true;
            }
        }

        if (!changed) return BadRequest("No rate cells matched the specified area/type.");

        version.RateSnapshot = System.Text.Json.JsonSerializer.Serialize(snapshot);
        version.UpdatedAt = DateTime.UtcNow;

        // Bump patch version (e.g. "1.0.0" → "1.0.1")
        var parts = version.Version.Split('.');
        if (parts.Length == 3 && int.TryParse(parts[2], out var patch))
            version.Version = $"{parts[0]}.{parts[1]}.{patch + 1}";

        // Append audit entry to AppraiserNote
        var auditEntry = $"\n[{DateTime.UtcNow:yyyy-MM-dd HH:mm}] {req.AppraiserNote ?? "Adjustment applied."} " +
                         $"Area={req.RevalArea ?? "ALL"} Type={req.BuildingType ?? "ALL"} " +
                         $"Pct={req.AdjustmentPct:+0.###;-0.###;0}% IAAO={req.IaaoReference}";
        version.AppraiserNote = (version.AppraiserNote ?? "") + auditEntry;

        await _db.SaveChangesAsync();
        return Ok(new { version.Id, version.Version, version.Status, auditEntry });
    }
```

Add at the bottom of MatrixVersionController.cs file (or alongside its other record types):

```csharp
public record ApplyAdjustmentRequest(
    string? RevalArea,
    string? BuildingType,
    double AdjustmentPct,
    List<int> ExcludedSaleIds,
    string? AppraiserNote,
    string? IaaoReference);

// Local DTO for deserialization — mirrors the frontend RateCell shape
public class RateCellDto
{
    public string BuildingType { get; set; } = string.Empty;
    public string RevalArea { get; set; } = string.Empty;
    public decimal BaseRate { get; set; }
}
```

- [ ] **Step 3: Build**

```bash
cd backend && dotnet build TerraFusion.sln -c Release
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add backend/src/TerraFusion.API/Controllers/CalibrationDiagnosticController.cs \
        backend/src/TerraFusion.API/Controllers/MatrixVersionController.cs
git commit -m "feat(calibration): outlier-exclusions + apply-adjustment endpoints"
```

---

## Task 6: Frontend — useCalibrationContext Hook

**Files:**
- Create: `packages/terrabuild/client/src/hooks/calibration/useCalibrationContext.ts`

- [ ] **Step 1: Create the context + hook**

```typescript
// packages/terrabuild/client/src/hooks/calibration/useCalibrationContext.ts
import { createContext, useContext, useState, useCallback } from "react";

export interface CalibrationContextValue {
  matrixVersionId: number | null;
  setMatrixVersionId: (id: number | null) => void;

  selectedRevalArea: string | null;
  setSelectedRevalArea: (area: string | null) => void;

  selectedBuildingType: string | null;
  setSelectedBuildingType: (type: string | null) => void;

  // key: `${revalArea}:${buildingType}`, value: adjustment %
  proposedAdjustments: Record<string, number>;
  setAdjustment: (revalArea: string, buildingType: string, pct: number) => void;
  clearAdjustments: () => void;

  excludedSaleIds: number[];
  addExclusion: (saleId: number) => void;
  removeExclusion: (saleId: number) => void;
}

export const CalibrationContext = createContext<CalibrationContextValue | null>(null);

export function useCalibrationContext(): CalibrationContextValue {
  const ctx = useContext(CalibrationContext);
  if (!ctx) throw new Error("useCalibrationContext must be used inside CalibrationContextProvider");
  return ctx;
}

/** Call this in the component that owns state (CalibrationWorkbench) */
export function useCalibrationContextState(
  matrixVersionId: number | null
): CalibrationContextValue {
  const [mvId, setMvId] = useState<number | null>(matrixVersionId);
  const [selectedRevalArea, setSelectedRevalArea] = useState<string | null>(null);
  const [selectedBuildingType, setSelectedBuildingType] = useState<string | null>(null);
  const [proposedAdjustments, setProposedAdjustments] = useState<Record<string, number>>({});
  const [excludedSaleIds, setExcludedSaleIds] = useState<number[]>([]);

  const setAdjustment = useCallback((area: string, type: string, pct: number) => {
    setProposedAdjustments((prev) => ({ ...prev, [`${area}:${type}`]: pct }));
  }, []);

  const clearAdjustments = useCallback(() => setProposedAdjustments({}), []);

  const addExclusion = useCallback((id: number) => {
    setExcludedSaleIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const removeExclusion = useCallback((id: number) => {
    setExcludedSaleIds((prev) => prev.filter((x) => x !== id));
  }, []);

  return {
    matrixVersionId: mvId,
    setMatrixVersionId: setMvId,
    selectedRevalArea,
    setSelectedRevalArea,
    selectedBuildingType,
    setSelectedBuildingType,
    proposedAdjustments,
    setAdjustment,
    clearAdjustments,
    excludedSaleIds,
    addExclusion,
    removeExclusion,
  };
}
```

- [ ] **Step 2: Type-check**

```bash
cd packages/terrabuild && npm run check
```

Expected: 0 errors related to the new file.

- [ ] **Step 3: Commit**

```bash
git add packages/terrabuild/client/src/hooks/calibration/useCalibrationContext.ts
git commit -m "feat(calibration): useCalibrationContext shared state hook"
```

---

## Task 7: Frontend — useRatioProjection Hook

**Files:**
- Create: `packages/terrabuild/client/src/hooks/calibration/useRatioProjection.ts`

- [ ] **Step 1: Create the client-side projection engine**

```typescript
// packages/terrabuild/client/src/hooks/calibration/useRatioProjection.ts
import { useMemo } from "react";

export interface ParcelSale {
  id: number;
  salePrice: number;
  assessedValue: number;
  ratio: number;
  valueQuintile: number;
  ageBand: number;
}

export interface RatioProjection {
  prd: number;
  prb: number;
  cod: number;
  medianRatio: number;
  saleCount: number;
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function computePrd(sales: { av: number; sp: number }[]): number {
  if (!sales.length) return 1;
  const meanRatio = sales.reduce((s, x) => s + x.av / x.sp, 0) / sales.length;
  const sumAv = sales.reduce((s, x) => s + x.av, 0);
  const sumSp = sales.reduce((s, x) => s + x.sp, 0);
  const weightedMean = sumSp === 0 ? 1 : sumAv / sumSp;
  return weightedMean === 0 ? 1 : meanRatio / weightedMean;
}

function computePrb(sales: { sp: number; ratio: number }[]): number {
  const valid = sales.filter((x) => x.sp > 0);
  if (valid.length < 2) return 0;
  const xs = valid.map((x) => Math.log(x.sp));
  const ys = valid.map((x) => x.ratio - 1);
  const xMean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const yMean = ys.reduce((a, b) => a + b, 0) / ys.length;
  const cov = xs.reduce((s, x, i) => s + (x - xMean) * (ys[i] - yMean), 0);
  const varX = xs.reduce((s, x) => s + (x - xMean) ** 2, 0);
  return varX === 0 ? 0 : cov / varX;
}

function computeCod(ratios: number[]): number {
  if (!ratios.length) return 0;
  const med = median(ratios);
  if (med === 0) return 0;
  const mad = ratios.reduce((s, r) => s + Math.abs(r - med), 0) / ratios.length;
  return (mad / med) * 100;
}

/**
 * Given raw sale records, an adjustment %, and a set of excluded IDs,
 * returns current and projected PRD/PRB/COD/median.
 *
 * All computation is client-side and synchronous — called with useMemo.
 */
export function useRatioProjection(
  sales: ParcelSale[],
  adjustmentPct: number,
  excludedSaleIds: number[]
): { current: RatioProjection; projected: RatioProjection } {
  return useMemo(() => {
    const active = sales.filter((s) => !excludedSaleIds.includes(s.id));

    const currentRatios = active.map((s) => s.ratio);
    const current: RatioProjection = {
      prd: computePrd(active.map((s) => ({ av: s.assessedValue, sp: s.salePrice }))),
      prb: computePrb(active.map((s) => ({ sp: s.salePrice, ratio: s.ratio }))),
      cod: computeCod(currentRatios),
      medianRatio: median(currentRatios),
      saleCount: active.length,
    };

    const factor = 1 + adjustmentPct / 100;
    const projectedSales = active.map((s) => ({
      av: s.assessedValue * factor,
      sp: s.salePrice,
      ratio: (s.assessedValue * factor) / s.salePrice,
    }));
    const projRatios = projectedSales.map((s) => s.ratio);
    const projected: RatioProjection = {
      prd: computePrd(projectedSales),
      prb: computePrb(projectedSales.map((s) => ({ sp: s.sp, ratio: s.ratio }))),
      cod: computeCod(projRatios),
      medianRatio: median(projRatios),
      saleCount: active.length,
    };

    return { current, projected };
  }, [sales, adjustmentPct, excludedSaleIds]);
}
```

- [ ] **Step 2: Type-check**

```bash
cd packages/terrabuild && npm run check
```

- [ ] **Step 3: Commit**

```bash
git add packages/terrabuild/client/src/hooks/calibration/useRatioProjection.ts
git commit -m "feat(calibration): useRatioProjection — client-side PRD/PRB/COD engine"
```

---

## Task 8: Frontend — RevalAreaNavigator Component

**Files:**
- Create: `packages/terrabuild/client/src/components/calibration/RevalAreaNavigator.tsx`

- [ ] **Step 1: Create RevalAreaNavigator**

```tsx
// packages/terrabuild/client/src/components/calibration/RevalAreaNavigator.tsx
import { useQuery } from "@tanstack/react-query";
import { useCalibrationContext } from "@/hooks/calibration/useCalibrationContext";

interface AreaSummary {
  revalArea: string;
  buildingType: string;
  prd: number;
  prb: number;
  cod: number;
  saleCount: number;
  healthStatus: "GREEN" | "YELLOW" | "RED";
}

const HEALTH_DOT: Record<string, string> = {
  GREEN: "bg-green-500",
  YELLOW: "bg-yellow-400",
  RED: "bg-red-500",
};

interface Props {
  matrixVersionId: number;
}

export function RevalAreaNavigator({ matrixVersionId }: Props) {
  const { selectedRevalArea, selectedBuildingType, setSelectedRevalArea, setSelectedBuildingType } =
    useCalibrationContext();

  const { data: summaries = [] } = useQuery<AreaSummary[]>({
    queryKey: ["reval-area-summary", matrixVersionId],
    queryFn: () =>
      fetch(`/api/calibrationdiagnostic/reval-area-summary?matrixVersionId=${matrixVersionId}`)
        .then((r) => r.json()),
    staleTime: 30_000,
  });

  // Group by revalArea
  const grouped = summaries.reduce<Record<string, AreaSummary[]>>((acc, s) => {
    if (!acc[s.revalArea]) acc[s.revalArea] = [];
    acc[s.revalArea].push(s);
    return acc;
  }, {});

  // Area-level health = worst of its building types
  function areaHealth(types: AreaSummary[]): string {
    if (types.some((t) => t.healthStatus === "RED")) return "RED";
    if (types.some((t) => t.healthStatus === "YELLOW")) return "YELLOW";
    return "GREEN";
  }

  return (
    <div className="flex flex-col gap-1 p-2 min-w-[160px]">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
        Reval Areas
      </p>

      {Object.entries(grouped).map(([area, types]) => {
        const areaSelected = selectedRevalArea === area && !selectedBuildingType;
        return (
          <div key={area}>
            <button
              className={`flex items-center gap-2 w-full text-left px-2 py-1 rounded text-sm font-medium transition-colors ${
                areaSelected
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
              onClick={() => {
                setSelectedRevalArea(area);
                setSelectedBuildingType(null);
              }}
            >
              <span className={`h-2 w-2 rounded-full flex-shrink-0 ${HEALTH_DOT[areaHealth(types)]}`} />
              {area}
            </button>

            <div className="ml-4 flex flex-col gap-0.5 mt-0.5">
              {types.map((t) => {
                const isSelected =
                  selectedRevalArea === area && selectedBuildingType === t.buildingType;
                return (
                  <button
                    key={t.buildingType}
                    className={`flex items-center gap-2 w-full text-left px-2 py-0.5 rounded text-xs transition-colors ${
                      isSelected
                        ? "bg-primary/80 text-primary-foreground"
                        : "hover:bg-muted text-muted-foreground"
                    }`}
                    onClick={() => {
                      setSelectedRevalArea(area);
                      setSelectedBuildingType(t.buildingType);
                    }}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${HEALTH_DOT[t.healthStatus]}`} />
                    {t.buildingType}
                    <span className="ml-auto opacity-60">{t.saleCount}s</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <hr className="my-2 border-border" />
      <button
        className={`text-xs px-2 py-1 rounded transition-colors ${
          !selectedRevalArea ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
        }`}
        onClick={() => {
          setSelectedRevalArea(null);
          setSelectedBuildingType(null);
        }}
      >
        County-Wide
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd packages/terrabuild && npm run check
```

- [ ] **Step 3: Commit**

```bash
git add packages/terrabuild/client/src/components/calibration/RevalAreaNavigator.tsx
git commit -m "feat(calibration): RevalAreaNavigator — health-dot tree sidebar"
```

---

## Task 9: Frontend — AiCopilotBand Component

**Files:**
- Create: `packages/terrabuild/client/src/components/calibration/AiCopilotBand.tsx`

- [ ] **Step 1: Create AiCopilotBand**

```tsx
// packages/terrabuild/client/src/components/calibration/AiCopilotBand.tsx
import { useCalibrationContext } from "@/hooks/calibration/useCalibrationContext";
import type { RatioProjection } from "@/hooks/calibration/useRatioProjection";

interface Props {
  current: RatioProjection;
  projected: RatioProjection;
  adjustmentPct: number;
  isSimulating: boolean;
}

const IAAO = { prdLo: 0.98, prdHi: 1.03, prbMax: 0.05, codMax: 15 };

function metricColor(value: number, lo: number, hi: number): string {
  if (value < lo || value > hi) return "text-red-500";
  const margin = Math.min(value - lo, hi - value) / ((hi - lo) / 2);
  if (margin < 0.2) return "text-yellow-400";
  return "text-green-400";
}

function absColor(value: number, max: number): string {
  if (Math.abs(value) > max) return "text-red-500";
  if (Math.abs(value) > max * 0.8) return "text-yellow-400";
  return "text-green-400";
}

function aiNarrative(current: RatioProjection, isSimulating: boolean, adjPct: number, projected: RatioProjection): string {
  if (!isSimulating) {
    const prdOk = current.prd >= IAAO.prdLo && current.prd <= IAAO.prdHi;
    const codOk = current.cod <= IAAO.codMax;
    const prbOk = Math.abs(current.prb) <= IAAO.prbMax;
    if (prdOk && codOk && prbOk) return `All IAAO metrics within standard. Study appears equitable with ${current.saleCount} sales.`;
    const issues: string[] = [];
    if (!prdOk) issues.push(`PRD ${current.prd.toFixed(3)} indicates ${current.prd > 1.03 ? "regressivity" : "progressivity"}`);
    if (!codOk) issues.push(`COD ${current.cod.toFixed(1)}% exceeds 15% threshold — high variability`);
    if (!prbOk) issues.push(`PRB ${current.prb.toFixed(3)} ${current.prb > 0 ? "favors high-value" : "favors low-value"} properties`);
    return issues.join(". ") + ".";
  }
  const projPrdOk = projected.prd >= IAAO.prdLo && projected.prd <= IAAO.prdHi;
  const projCodOk = projected.cod <= IAAO.codMax;
  const projPrbOk = Math.abs(projected.prb) <= IAAO.prbMax;
  if (projPrdOk && projCodOk && projPrbOk)
    return `Simulation: ${adjPct > 0 ? "+" : ""}${adjPct.toFixed(2)}% adjustment achieves IAAO compliance. Recommend proceeding.`;
  return `Simulation: ${adjPct > 0 ? "+" : ""}${adjPct.toFixed(2)}% adjustment does not fully achieve compliance. Review metrics below.`;
}

function MetricPair({ label, current, projected, lo, hi, isAbs = false }: {
  label: string; current: number; projected: number; lo: number; hi: number; isAbs?: boolean;
}) {
  const currColor = isAbs ? absColor(current, hi) : metricColor(current, lo, hi);
  const projColor = isAbs ? absColor(projected, hi) : metricColor(projected, lo, hi);
  const delta = projected - current;
  return (
    <div className="flex flex-col items-center min-w-[80px]">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-lg font-mono font-bold ${currColor}`}>{current.toFixed(3)}</span>
      <span className={`text-xs font-mono ${projColor}`}>
        → {projected.toFixed(3)}{" "}
        <span className={delta < 0 ? "text-green-400" : "text-red-400"}>
          ({delta >= 0 ? "+" : ""}{delta.toFixed(3)})
        </span>
      </span>
    </div>
  );
}

export function AiCopilotBand({ current, projected, adjustmentPct, isSimulating }: Props) {
  const narrative = aiNarrative(current, isSimulating, adjustmentPct, projected);

  return (
    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 flex flex-col gap-2">
      <div className="flex items-center gap-3 flex-wrap">
        {isSimulating && (
          <span className="text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-400/30 px-2 py-0.5 rounded-full animate-pulse">
            LIVE SIMULATION
          </span>
        )}

        {isSimulating ? (
          <>
            <MetricPair label="PRD" current={current.prd} projected={projected.prd} lo={IAAO.prdLo} hi={IAAO.prdHi} />
            <MetricPair label="PRB" current={current.prb} projected={projected.prb} lo={-IAAO.prbMax} hi={IAAO.prbMax} isAbs />
            <MetricPair label="COD" current={current.cod} projected={projected.cod} lo={0} hi={IAAO.codMax} />
            <MetricPair label="Median" current={current.medianRatio} projected={projected.medianRatio} lo={0.95} hi={1.05} />
          </>
        ) : (
          <div className="flex gap-6 flex-wrap">
            {[
              { label: "PRD", value: current.prd, color: metricColor(current.prd, IAAO.prdLo, IAAO.prdHi) },
              { label: "PRB", value: current.prb, color: absColor(current.prb, IAAO.prbMax) },
              { label: "COD", value: current.cod, color: metricColor(current.cod, 0, IAAO.codMax) },
              { label: "Median", value: current.medianRatio, color: metricColor(current.medianRatio, 0.95, 1.05) },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex flex-col items-center">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className={`text-xl font-mono font-bold ${color}`}>{value.toFixed(3)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="ml-auto text-xs text-muted-foreground max-w-xs text-right hidden lg:block">
          {narrative}
        </div>
      </div>
      <p className="text-xs text-muted-foreground lg:hidden">{narrative}</p>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd packages/terrabuild && npm run check
```

- [ ] **Step 3: Commit**

```bash
git add packages/terrabuild/client/src/components/calibration/AiCopilotBand.tsx
git commit -m "feat(calibration): AiCopilotBand — monitor + simulation modes with AI narrative"
```

---

## Task 10: Frontend — ParcelEvidenceViewer Component

**Files:**
- Create: `packages/terrabuild/client/src/components/calibration/ParcelEvidenceViewer.tsx`

- [ ] **Step 1: Create ParcelEvidenceViewer**

```tsx
// packages/terrabuild/client/src/components/calibration/ParcelEvidenceViewer.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ScatterChart, Scatter, XAxis, YAxis, ReferenceLine, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useCalibrationContext } from "@/hooks/calibration/useCalibrationContext";

interface ParcelData {
  id: number;
  parcelId: string;
  saleDate: string;
  salePrice: number;
  assessedValue: number;
  ratio: number;
  isOutlierIqr: boolean;
  aiClassification: string | null;
  isExcluded: boolean;
  valueQuintile: number;
  ageBand: number;
}

interface EvidenceResponse {
  medianRatio: number;
  cod: number;
  saleCount: number;
  outlierCount: number;
  parcels: ParcelData[];
}

const QUARTER_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444"];

function getQuarterColor(dateStr: string): string {
  const month = new Date(dateStr).getMonth();
  return QUARTER_COLORS[Math.floor(month / 3)];
}

const AI_CLASS_LABEL: Record<string, string> = {
  ESTATE_SALE: "Estate/below-market",
  RENOVATION: "Unreported renovation",
  RELATED_PARTY: "Related-party/non-arm's-length",
  NEW_CONSTRUCTION: "New construction lag",
};

export function ParcelEvidenceViewer() {
  const { matrixVersionId, selectedRevalArea, selectedBuildingType, excludedSaleIds, addExclusion } =
    useCalibrationContext();

  const queryClient = useQueryClient();

  const params = new URLSearchParams();
  if (matrixVersionId) params.set("matrixVersionId", String(matrixVersionId));
  if (selectedRevalArea) params.set("revalArea", selectedRevalArea);
  if (selectedBuildingType) params.set("buildingType", selectedBuildingType);

  const { data, isLoading } = useQuery<EvidenceResponse>({
    queryKey: ["parcel-evidence", matrixVersionId, selectedRevalArea, selectedBuildingType],
    queryFn: () => fetch(`/api/calibrationdiagnostic/parcel-evidence?${params}`).then((r) => r.json()),
    enabled: !!matrixVersionId,
    staleTime: 30_000,
  });

  const exclusionMutation = useMutation({
    mutationFn: (req: { saleRecordId: number; dispositionType: string; appraiserNote?: string }) =>
      fetch("/api/calibrationdiagnostic/outlier-exclusions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matrixVersionId,
          saleRecordId: req.saleRecordId,
          dispositionType: req.dispositionType,
          appraiserNote: req.appraiserNote ?? null,
        }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parcel-evidence"] });
    },
  });

  if (!matrixVersionId) return <p className="text-sm text-muted-foreground p-4">Select a matrix version.</p>;
  if (isLoading) return <p className="text-sm text-muted-foreground p-4">Loading evidence…</p>;
  if (!data) return null;

  const active = data.parcels.filter((p) => !excludedSaleIds.includes(p.id) && !p.isExcluded);
  const excluded = data.parcels.filter((p) => excludedSaleIds.includes(p.id) || p.isExcluded);
  const outliers = data.parcels.filter((p) => p.isOutlierIqr);

  const scatterData = active.map((p) => ({
    x: p.salePrice / 1000,
    y: p.ratio,
    id: p.id,
    color: getQuarterColor(p.saleDate),
    isOutlier: p.isOutlierIqr,
  }));

  return (
    <div className="flex flex-col gap-4">
      {/* Summary stats row */}
      <div className="flex gap-6 text-sm">
        {[
          { label: "Median Ratio", value: data.medianRatio.toFixed(3) },
          { label: "COD", value: `${data.cod.toFixed(1)}%` },
          { label: "Sales", value: active.length },
          { label: "Outliers (IQR)", value: data.outlierCount },
          { label: "Excluded", value: excluded.length },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="font-mono font-semibold">{value}</span>
          </div>
        ))}
      </div>

      {/* Scatter plot */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 8, bottom: 16, left: 0 }}>
            <XAxis
              dataKey="x"
              name="Sale Price"
              unit="k"
              label={{ value: "Sale Price ($k)", position: "insideBottom", offset: -8, fontSize: 10 }}
              tick={{ fontSize: 10 }}
            />
            <YAxis
              dataKey="y"
              name="Ratio"
              domain={[0.7, 1.3]}
              label={{ value: "Ratio", angle: -90, position: "insideLeft", fontSize: 10 }}
              tick={{ fontSize: 10 }}
            />
            <ReferenceLine y={1.0} stroke="#888" strokeDasharray="4 2" />
            <Tooltip
              formatter={(value: number, name: string) =>
                name === "x" ? [`$${value}k`, "Sale Price"] : [value.toFixed(4), "Ratio"]
              }
            />
            <Scatter data={scatterData}>
              {scatterData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.isOutlier ? "#ef4444" : entry.color}
                  stroke={entry.isOutlier ? "#b91c1c" : "none"}
                  strokeWidth={entry.isOutlier ? 2 : 0}
                  r={entry.isOutlier ? 6 : 4}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Outlier cards */}
      {outliers.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            IQR Outliers ({outliers.length})
          </p>
          {outliers.map((p) => {
            const isEx = excludedSaleIds.includes(p.id) || p.isExcluded;
            return (
              <div
                key={p.id}
                className={`rounded border p-3 text-sm flex flex-col gap-2 ${
                  isEx ? "opacity-50 border-dashed" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold">{p.parcelId}</span>
                  <span className="text-xs text-muted-foreground">Ratio: {p.ratio.toFixed(4)}</span>
                </div>
                <div className="text-xs text-muted-foreground flex gap-4">
                  <span>SP: ${p.salePrice.toLocaleString()}</span>
                  <span>AV: ${p.assessedValue.toLocaleString()}</span>
                  <span>{p.saleDate}</span>
                  {p.aiClassification && (
                    <span className="text-yellow-400">
                      AI: {AI_CLASS_LABEL[p.aiClassification] ?? p.aiClassification}
                    </span>
                  )}
                </div>
                {!isEx && (
                  <div className="flex gap-2">
                    <button
                      className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-400/30 hover:bg-red-500/30"
                      onClick={() => {
                        addExclusion(p.id);
                        exclusionMutation.mutate({
                          saleRecordId: p.id,
                          dispositionType: "EXCLUDED",
                          appraiserNote: "Excluded from study",
                        });
                      }}
                    >
                      Exclude from Study
                    </button>
                    <button
                      className="text-xs px-2 py-1 rounded bg-orange-500/20 text-orange-400 border border-orange-400/30 hover:bg-orange-500/30"
                      onClick={() => {
                        addExclusion(p.id);
                        exclusionMutation.mutate({
                          saleRecordId: p.id,
                          dispositionType: "FLAGGED_DATA",
                          appraiserNote: "Data problem — flagged to workbench",
                        });
                      }}
                    >
                      Flag as Data Problem
                    </button>
                    <button
                      className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground"
                      onClick={() =>
                        exclusionMutation.mutate({
                          saleRecordId: p.id,
                          dispositionType: "ACCEPTED",
                          appraiserNote: "Accepted as valid sale",
                        })
                      }
                    >
                      Accept as Valid
                    </button>
                  </div>
                )}
                {isEx && (
                  <p className="text-xs text-muted-foreground italic">Excluded from study</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify Recharts is available**

```bash
cd packages/terrabuild && cat package.json | grep recharts
```

If missing: `npm install recharts`

- [ ] **Step 3: Type-check**

```bash
cd packages/terrabuild && npm run check
```

- [ ] **Step 4: Commit**

```bash
git add packages/terrabuild/client/src/components/calibration/ParcelEvidenceViewer.tsx
git commit -m "feat(calibration): ParcelEvidenceViewer — scatter plot + outlier disposition cards"
```

---

## Task 11: Frontend — AdjustmentSimulator Component

**Files:**
- Create: `packages/terrabuild/client/src/components/calibration/AdjustmentSimulator.tsx`

- [ ] **Step 1: Create AdjustmentSimulator**

```tsx
// packages/terrabuild/client/src/components/calibration/AdjustmentSimulator.tsx
import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useCalibrationContext } from "@/hooks/calibration/useCalibrationContext";
import type { RatioProjection } from "@/hooks/calibration/useRatioProjection";

interface Props {
  matrixVersionId: number;
  current: RatioProjection;
  projected: RatioProjection;
  onAdjustmentChange: (pct: number) => void;
}

const IAAO_OK = (prd: number, prb: number, cod: number) =>
  prd >= 0.98 && prd <= 1.03 && Math.abs(prb) <= 0.05 && cod <= 15;

export function AdjustmentSimulator({ matrixVersionId, current, projected, onAdjustmentChange }: Props) {
  const { selectedRevalArea, selectedBuildingType, excludedSaleIds, clearAdjustments } =
    useCalibrationContext();

  const [inputMode, setInputMode] = useState<"pct" | "flat" | "targetPrd">("pct");
  const [adjustmentInput, setAdjustmentInput] = useState("");
  const [appraiserNote, setAppraiserNote] = useState("");
  const [showAuditPreview, setShowAuditPreview] = useState(false);

  const pct = parseFloat(adjustmentInput) || 0;

  const handleInputChange = useCallback(
    (value: string) => {
      setAdjustmentInput(value);
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) onAdjustmentChange(parsed);
    },
    [onAdjustmentChange]
  );

  const applyMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/matrixversion/${matrixVersionId}/apply-adjustment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          revalArea: selectedRevalArea,
          buildingType: selectedBuildingType,
          adjustmentPct: pct,
          excludedSaleIds,
          appraiserNote,
          iaaoReference: "IAAO Standard on Ratio Studies §6",
        }),
      }).then((r) => r.json()),
    onSuccess: () => {
      setAdjustmentInput("");
      setShowAuditPreview(false);
      setAppraiserNote("");
      clearAdjustments();
      onAdjustmentChange(0);
    },
  });

  const isCompliant = IAAO_OK(projected.prd, projected.prb, projected.cod);
  const isActive = Math.abs(pct) > 0.001;

  return (
    <div className="flex flex-col gap-4">
      {/* Input mode tabs */}
      <div className="flex gap-1 text-xs">
        {(["pct", "flat", "targetPrd"] as const).map((mode) => (
          <button
            key={mode}
            className={`px-3 py-1.5 rounded transition-colors ${
              inputMode === mode ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
            }`}
            onClick={() => setInputMode(mode)}
          >
            {mode === "pct" ? "% Adjustment" : mode === "flat" ? "Flat Rate" : "Target PRD"}
          </button>
        ))}
      </div>

      {/* Rate input */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-muted-foreground w-32">
          {inputMode === "pct" ? "Adjustment %" : inputMode === "flat" ? "Rate ($/sqft)" : "Target PRD"}
        </label>
        <input
          type="number"
          step={inputMode === "pct" ? "0.1" : inputMode === "flat" ? "0.5" : "0.001"}
          value={adjustmentInput}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={inputMode === "pct" ? "e.g. -6.5" : inputMode === "flat" ? "e.g. 85.00" : "e.g. 1.00"}
          className="w-36 px-3 py-1.5 text-sm rounded border border-border bg-background font-mono"
        />
        {inputMode === "pct" && (
          <span className="text-sm text-muted-foreground">%</span>
        )}
      </div>

      {/* Live projection stats */}
      {isActive && (
        <div className="rounded border border-border p-3 bg-muted/20 flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Projected Stats ({selectedRevalArea ?? "County-Wide"} / {selectedBuildingType ?? "All Types"})
          </p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "PRD", curr: current.prd, proj: projected.prd, ok: projected.prd >= 0.98 && projected.prd <= 1.03 },
              { label: "PRB", curr: current.prb, proj: projected.prb, ok: Math.abs(projected.prb) <= 0.05 },
              { label: "COD", curr: current.cod, proj: projected.cod, ok: projected.cod <= 15 },
              { label: "Median", curr: current.medianRatio, proj: projected.medianRatio, ok: projected.medianRatio >= 0.95 && projected.medianRatio <= 1.05 },
            ].map(({ label, curr, proj, ok }) => (
              <div key={label} className="flex flex-col">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-mono text-muted-foreground">{curr.toFixed(3)}</span>
                <span className={`text-sm font-mono font-bold ${ok ? "text-green-400" : "text-red-400"}`}>
                  → {proj.toFixed(3)}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {isCompliant
              ? "✓ All IAAO metrics within standard after adjustment."
              : "⚠ One or more metrics remain outside IAAO standard. Document override note."}
          </p>
        </div>
      )}

      {/* Apply button */}
      {isActive && (
        <div className="flex flex-col gap-2">
          {!showAuditPreview ? (
            <button
              className="w-full py-2 text-sm font-medium rounded bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setShowAuditPreview(true)}
            >
              Apply Adjustment…
            </button>
          ) : (
            <div className="rounded border border-border p-3 flex flex-col gap-3 bg-muted/10">
              <p className="text-xs font-semibold">Audit Trail Preview</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Area: <strong>{selectedRevalArea ?? "County-Wide"}</strong> | Type: <strong>{selectedBuildingType ?? "All"}</strong></div>
                <div>Adjustment: <strong>{pct > 0 ? "+" : ""}{pct.toFixed(3)}%</strong></div>
                <div>IAAO: Standard on Ratio Studies §6</div>
                <div>Excluded sales: {excludedSaleIds.length}</div>
              </div>
              <textarea
                value={appraiserNote}
                onChange={(e) => setAppraiserNote(e.target.value)}
                placeholder={isCompliant ? "Optional appraiser note…" : "Override note required (metrics not in range)…"}
                rows={3}
                className="w-full px-3 py-2 text-xs rounded border border-border bg-background resize-none"
              />
              <div className="flex gap-2">
                <button
                  className="flex-1 py-2 text-sm font-medium rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  disabled={(!isCompliant && !appraiserNote.trim()) || applyMutation.isPending}
                  onClick={() => applyMutation.mutate()}
                >
                  {applyMutation.isPending ? "Applying…" : "Confirm & Apply"}
                </button>
                <button
                  className="px-4 py-2 text-sm rounded bg-muted hover:bg-muted/80"
                  onClick={() => setShowAuditPreview(false)}
                >
                  Cancel
                </button>
              </div>
              {applyMutation.isError && (
                <p className="text-xs text-red-400">Apply failed. Check console.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd packages/terrabuild && npm run check
```

- [ ] **Step 3: Commit**

```bash
git add packages/terrabuild/client/src/components/calibration/AdjustmentSimulator.tsx
git commit -m "feat(calibration): AdjustmentSimulator — rate input + live projection + audit commit flow"
```

---

## Task 12: Frontend — StratifiedEquityPanel Component

**Files:**
- Create: `packages/terrabuild/client/src/components/calibration/StratifiedEquityPanel.tsx`

- [ ] **Step 1: Create StratifiedEquityPanel**

```tsx
// packages/terrabuild/client/src/components/calibration/StratifiedEquityPanel.tsx
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useCalibrationContext } from "@/hooks/calibration/useCalibrationContext";

interface StratumCell {
  quintile: number;
  ageBand: number;
  medianRatio: number;
  cod: number;
  saleCount: number;
}

const AGE_BAND_LABELS = ["Pre-1960", "1960-1980", "1980-2000", "2000-2015", "Post-2015"];
const QUINTILE_LABELS = ["Q1 (low)", "Q2", "Q3", "Q4", "Q5 (high)"];

function ratioColor(ratio: number): string {
  if (ratio > 1.15) return "bg-red-700 text-white";
  if (ratio > 1.10) return "bg-orange-500 text-white";
  if (ratio > 1.05) return "bg-yellow-400 text-black";
  if (ratio >= 0.97) return "bg-green-500 text-white";
  if (ratio >= 0.90) return "bg-sky-400 text-black";
  return "bg-blue-700 text-white";
}

function projectedRatio(ratio: number, adjustmentPct: number): number {
  return ratio * (1 + adjustmentPct / 100);
}

export function StratifiedEquityPanel() {
  const { matrixVersionId, selectedRevalArea, selectedBuildingType, proposedAdjustments } =
    useCalibrationContext();

  const [showAfter, setShowAfter] = useState(false);

  const params = new URLSearchParams();
  if (matrixVersionId) params.set("matrixVersionId", String(matrixVersionId));
  if (selectedRevalArea) params.set("revalArea", selectedRevalArea);
  if (selectedBuildingType) params.set("buildingType", selectedBuildingType);

  const { data: cells = [], isLoading } = useQuery<StratumCell[]>({
    queryKey: ["stratified-equity", matrixVersionId, selectedRevalArea, selectedBuildingType],
    queryFn: () =>
      fetch(`/api/calibrationdiagnostic/stratified-equity?${params}`).then((r) => r.json()),
    enabled: !!matrixVersionId,
    staleTime: 30_000,
  });

  const hasSimulation = Object.keys(proposedAdjustments).length > 0;
  const adjKey = `${selectedRevalArea ?? ""}:${selectedBuildingType ?? ""}`;
  const adjPct = proposedAdjustments[adjKey] ?? 0;

  function getCell(q: number, ab: number): StratumCell | undefined {
    return cells.find((c) => c.quintile === q && c.ageBand === ab);
  }

  function displayRatio(cell: StratumCell): number {
    return showAfter && hasSimulation ? projectedRatio(cell.medianRatio, adjPct) : cell.medianRatio;
  }

  if (!matrixVersionId) return null;
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading equity data…</p>;

  // AI insight cards
  const worstCell = [...cells].sort((a, b) => Math.abs(b.medianRatio - 1) - Math.abs(a.medianRatio - 1))[0];
  const equitableCells = cells.filter((c) => c.medianRatio >= 0.97 && c.medianRatio <= 1.03);

  return (
    <div className="flex flex-col gap-4">
      {/* Before/After toggle */}
      {hasSimulation && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">View:</span>
          <button
            className={`px-3 py-1 rounded ${!showAfter ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            onClick={() => setShowAfter(false)}
          >
            Before
          </button>
          <button
            className={`px-3 py-1 rounded ${showAfter ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            onClick={() => setShowAfter(true)}
          >
            After ({adjPct > 0 ? "+" : ""}{adjPct.toFixed(1)}%)
          </button>
        </div>
      )}

      {/* Heatmap grid */}
      <div className="overflow-x-auto">
        <table className="border-collapse text-xs w-full">
          <thead>
            <tr>
              <th className="p-1 text-left text-muted-foreground font-normal w-24">Age \ Value</th>
              {QUINTILE_LABELS.map((q) => (
                <th key={q} className="p-1 text-center text-muted-foreground font-normal">{q}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AGE_BAND_LABELS.map((label, abIdx) => {
              const ab = abIdx + 1;
              return (
                <tr key={ab}>
                  <td className="p-1 text-muted-foreground font-normal">{label}</td>
                  {QUINTILE_LABELS.map((_, qIdx) => {
                    const q = qIdx + 1;
                    const cell = getCell(q, ab);
                    if (!cell) {
                      return (
                        <td key={q} className="p-1 text-center">
                          <div className="h-12 rounded bg-muted/20 flex items-center justify-center text-muted-foreground">
                            —
                          </div>
                        </td>
                      );
                    }
                    const ratio = displayRatio(cell);
                    return (
                      <td key={q} className="p-1">
                        <div className={`h-12 rounded flex flex-col items-center justify-center ${ratioColor(ratio)}`}>
                          <span className="font-mono font-bold">{ratio.toFixed(3)}</span>
                          <span className="opacity-70 text-[10px]">{cell.saleCount}s</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Color scale legend */}
      <div className="flex gap-2 text-xs items-center flex-wrap">
        <span className="text-muted-foreground">Scale:</span>
        {[
          { label: ">1.15 Over-assessed", cls: "bg-red-700 text-white" },
          { label: "1.10-1.15", cls: "bg-orange-500 text-white" },
          { label: "1.05-1.10", cls: "bg-yellow-400 text-black" },
          { label: "0.97-1.03 IAAO", cls: "bg-green-500 text-white" },
          { label: "<0.97 Under-assessed", cls: "bg-blue-700 text-white" },
        ].map(({ label, cls }) => (
          <span key={label} className={`px-2 py-0.5 rounded text-[10px] ${cls}`}>{label}</span>
        ))}
      </div>

      {/* AI insight cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {worstCell && (
          <div className="rounded border border-border p-3 text-xs">
            <p className="font-semibold mb-1">Pattern Classification</p>
            <p className="text-muted-foreground">
              {worstCell.medianRatio > 1.05
                ? `Regressivity confirmed — Q${worstCell.quintile}/${AGE_BAND_LABELS[worstCell.ageBand - 1]} is worst stratum at ${worstCell.medianRatio.toFixed(3)}.`
                : worstCell.medianRatio < 0.95
                ? `Progressivity detected — Q${worstCell.quintile}/${AGE_BAND_LABELS[worstCell.ageBand - 1]} is under-assessed at ${worstCell.medianRatio.toFixed(3)}.`
                : "No significant regressivity or progressivity detected in this study set."}
            </p>
          </div>
        )}
        <div className="rounded border border-border p-3 text-xs">
          <p className="font-semibold mb-1">Interaction Alert</p>
          <p className="text-muted-foreground">
            {cells.filter((c) => c.ageBand === 1 && c.medianRatio > 1.05).length > 0
              ? "Pre-1960 homes show over-assessment across multiple value quintiles — age × value interaction present. Consider age-banded adjustment."
              : "No significant age × value interaction detected in current study set."}
          </p>
        </div>
        {equitableCells.length > 0 && (
          <div className="rounded border border-border p-3 text-xs">
            <p className="font-semibold mb-1">Clean Strata</p>
            <p className="text-muted-foreground">
              {equitableCells.length} strata within IAAO target range (0.97–1.03). 
              {equitableCells.filter((c) => c.ageBand === 5).length > 0
                ? " Post-2015 new construction is equitable — do not adjust."
                : ""}
            </p>
          </div>
        )}
      </div>

      {/* Export buttons */}
      <div className="flex gap-2 text-xs pt-1">
        <button
          className="px-3 py-1.5 rounded border border-border hover:bg-muted"
          onClick={() => alert("DOR export — connect to /api/calibrationdiagnostic/export-dor")}
        >
          DOR Ratio Study Package
        </button>
        <button
          className="px-3 py-1.5 rounded border border-border hover:bg-muted"
          onClick={() => {
            const csv = ["quintile,ageBand,medianRatio,cod,saleCount",
              ...cells.map((c) => `${c.quintile},${c.ageBand},${c.medianRatio},${c.cod},${c.saleCount}`)
            ].join("\n");
            const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
            const a = document.createElement("a"); a.href = url; a.download = "strata.csv"; a.click();
          }}
        >
          Strata CSV
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd packages/terrabuild && npm run check
```

- [ ] **Step 3: Commit**

```bash
git add packages/terrabuild/client/src/components/calibration/StratifiedEquityPanel.tsx
git commit -m "feat(calibration): StratifiedEquityPanel — 5×5 heatmap + before/after toggle + AI insights"
```

---

## Task 13: Integrate All Panels into CalibrationWorkbench

**Files:**
- Modify: `packages/terrabuild/client/src/components/calibration/index.ts`
- Modify: `packages/terrabuild/client/src/pages/CalibrationWorkbench.tsx`

- [ ] **Step 1: Update calibration index.ts**

Add new exports to `packages/terrabuild/client/src/components/calibration/index.ts`:

```typescript
export { RevalAreaNavigator } from "./RevalAreaNavigator";
export { AiCopilotBand } from "./AiCopilotBand";
export { ParcelEvidenceViewer } from "./ParcelEvidenceViewer";
export { AdjustmentSimulator } from "./AdjustmentSimulator";
export { StratifiedEquityPanel } from "./StratifiedEquityPanel";
```

- [ ] **Step 2: Rewrite CalibrationWorkbench.tsx**

Replace the entire file with the integrated version:

```tsx
// packages/terrabuild/client/src/pages/CalibrationWorkbench.tsx
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LiveDiagnosticsBar,
  AIFindingQueue,
  MatrixDiffView,
  MassAdjustmentControls,
  VersionTimeline,
  CalibrationMemoPanel,
  RevalAreaNavigator,
  AiCopilotBand,
  ParcelEvidenceViewer,
  AdjustmentSimulator,
  StratifiedEquityPanel,
} from "@/components/calibration";
import {
  CalibrationContext,
  useCalibrationContextState,
} from "@/hooks/calibration/useCalibrationContext";
import { useRatioProjection } from "@/hooks/calibration/useRatioProjection";

interface RateCell { buildingType: string; revalArea: string; baseRate: number; }
interface MatrixVersion {
  id: number;
  version: string;
  status: string;
  rateSnapshot: RateCell[] | string | null;
}

function normalizeCell(c: Record<string, unknown>): RateCell {
  return {
    buildingType: (c.buildingType ?? c.BuildingType) as string,
    revalArea: (c.revalArea ?? c.RevalArea) as string,
    baseRate: (c.baseRate ?? c.BaseRate) as number,
  };
}

function parseSnapshot(raw: RateCell[] | string | null): RateCell[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    try { return (JSON.parse(raw) as Record<string, unknown>[]).map(normalizeCell); } catch { return []; }
  }
  return (raw as unknown as Record<string, unknown>[]).map(normalizeCell);
}

type PhDTab = "evidence" | "simulator" | "equity";

export default function CalibrationWorkbench() {
  const [activeDraftId, setActiveDraftId] = useState<number | null>(null);
  const [activePhDTab, setActivePhDTab] = useState<PhDTab>("evidence");
  const [simulatorAdjPct, setSimulatorAdjPct] = useState(0);

  // Shared calibration context state
  const ctx = useCalibrationContextState(activeDraftId);

  // Fetch raw sale data for client-side projection
  const parcelEvidenceParams = new URLSearchParams();
  if (activeDraftId) parcelEvidenceParams.set("matrixVersionId", String(activeDraftId));
  if (ctx.selectedRevalArea) parcelEvidenceParams.set("revalArea", ctx.selectedRevalArea);
  if (ctx.selectedBuildingType) parcelEvidenceParams.set("buildingType", ctx.selectedBuildingType);

  const { data: evidenceData } = useQuery<{ parcels: Array<{ id: number; salePrice: number; assessedValue: number; ratio: number; valueQuintile: number; ageBand: number }> }>({
    queryKey: ["parcel-evidence-raw", activeDraftId, ctx.selectedRevalArea, ctx.selectedBuildingType],
    queryFn: () =>
      fetch(`/api/calibrationdiagnostic/parcel-evidence?${parcelEvidenceParams}`).then((r) => r.json()),
    enabled: !!activeDraftId,
    staleTime: 30_000,
  });

  const sales = useMemo(() =>
    (evidenceData?.parcels ?? []).map((p) => ({
      id: p.id,
      salePrice: p.salePrice,
      assessedValue: p.assessedValue,
      ratio: p.ratio,
      valueQuintile: p.valueQuintile,
      ageBand: p.ageBand,
    })), [evidenceData]);

  const { current, projected } = useRatioProjection(sales, simulatorAdjPct, ctx.excludedSaleIds);

  // Existing queries
  const { data: draft } = useQuery<MatrixVersion>({
    queryKey: ["matrix-version", activeDraftId],
    queryFn: () => fetch(`/api/matrixversion/${activeDraftId}`).then((r) => r.json()),
    enabled: !!activeDraftId,
  });
  const { data: versions } = useQuery<MatrixVersion[]>({
    queryKey: ["matrix-versions"],
    queryFn: () => fetch("/api/matrixversion").then((r) => r.json()),
  });

  const lockedVersion = versions?.find((v) => v.status === "LOCKED") ?? null;
  const draftCells = parseSnapshot(draft?.rateSnapshot ?? null);
  const buildingTypes = Array.from(new Set(draftCells.map((c) => c.buildingType))).sort();
  const revalAreas = Array.from(new Set(draftCells.map((c) => c.revalArea))).sort();

  const isSimulating = Math.abs(simulatorAdjPct) > 0.001;

  return (
    <CalibrationContext.Provider value={ctx}>
      <div className="flex h-full overflow-hidden">
        {/* Left sidebar: Reval Area Navigator */}
        {activeDraftId && (
          <div className="w-44 flex-shrink-0 border-r border-border overflow-y-auto">
            <RevalAreaNavigator matrixVersionId={activeDraftId} />
          </div>
        )}

        {/* Main content */}
        <div className="flex flex-col flex-1 min-w-0 overflow-y-auto gap-4 p-4">
          {/* AI Co-pilot Band — always visible when a draft is selected */}
          {activeDraftId && (
            <AiCopilotBand
              current={current}
              projected={projected}
              adjustmentPct={simulatorAdjPct}
              isSimulating={isSimulating}
            />
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Left: PhD tabs + existing panels */}
            <div className="xl:col-span-2 space-y-4">
              {activeDraftId ? (
                <>
                  {/* PhD Appraiser tabs */}
                  <Card>
                    <CardHeader className="py-3 px-4 pb-0">
                      <div className="flex gap-1 text-xs">
                        {(["evidence", "simulator", "equity"] as PhDTab[]).map((tab) => (
                          <button
                            key={tab}
                            className={`px-3 py-1.5 rounded-t transition-colors capitalize ${
                              activePhDTab === tab
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80 text-muted-foreground"
                            }`}
                            onClick={() => setActivePhDTab(tab)}
                          >
                            {tab === "evidence" ? "Evidence & Outliers" : tab === "simulator" ? "Adjustment Simulator" : "Stratified Equity"}
                          </button>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 pb-4">
                      {activePhDTab === "evidence" && <ParcelEvidenceViewer />}
                      {activePhDTab === "simulator" && (
                        <AdjustmentSimulator
                          matrixVersionId={activeDraftId}
                          current={current}
                          projected={projected}
                          onAdjustmentChange={setSimulatorAdjPct}
                        />
                      )}
                      {activePhDTab === "equity" && <StratifiedEquityPanel />}
                    </CardContent>
                  </Card>

                  {/* Existing panels */}
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <AIFindingQueue matrixVersionId={activeDraftId} />
                    </CardContent>
                  </Card>

                  <MatrixDiffView
                    lockedVersionId={lockedVersion?.id ?? null}
                    draftVersionId={activeDraftId}
                  />

                  {buildingTypes.length > 0 && (
                    <Card>
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm">Mass Adjustment Controls</CardTitle>
                      </CardHeader>
                      <CardContent className="pb-4 px-4">
                        <MassAdjustmentControls
                          draftVersionId={activeDraftId}
                          buildingTypes={buildingTypes}
                          revalAreas={revalAreas}
                        />
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground text-sm">
                    Select or create a draft version on the right to begin calibration.
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right: Version timeline + memo */}
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-4 pb-4">
                  <VersionTimeline
                    activeDraftId={activeDraftId}
                    onDraftSelected={(id) => {
                      setActiveDraftId(id);
                      ctx.setMatrixVersionId(id);
                    }}
                  />
                </CardContent>
              </Card>

              {activeDraftId && (
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm">Calibration Memo (SOP §5.3)</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4 px-4">
                    <CalibrationMemoPanel matrixVersionId={activeDraftId} />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </CalibrationContext.Provider>
  );
}
```

- [ ] **Step 3: Type-check**

```bash
cd packages/terrabuild && npm run check
```

Expected: 0 errors.

- [ ] **Step 4: Build**

```bash
cd packages/terrabuild && npm run build
```

Expected: clean build.

- [ ] **Step 5: Backend build**

```bash
cd backend && dotnet build TerraFusion.sln -c Release
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add packages/terrabuild/client/src/components/calibration/index.ts \
        packages/terrabuild/client/src/pages/CalibrationWorkbench.tsx
git commit -m "feat(calibration): integrate RevalAreaNavigator + AiCopilotBand + PhD tabs into CalibrationWorkbench"
```

---

## Final Verification

- [ ] Start API: `dotnet run --project backend/src/TerraFusion.API` → confirm `[SaleRecordSeeder] Seeded 120 sale records.`
- [ ] `GET /api/calibrationdiagnostic/reval-area-summary?matrixVersionId=1` → JSON with GREEN/YELLOW/RED per area
- [ ] `GET /api/calibrationdiagnostic/parcel-evidence?matrixVersionId=1&revalArea=REVAL-1` → parcels + outlier flags
- [ ] `POST /api/calibrationdiagnostic/simulate` body `{"matrixVersionId":1,"revalArea":"REVAL-1","buildingType":"S1","adjustmentPct":-5.0,"excludedSaleIds":[]}` → projected stats
- [ ] Open CalibrationWorkbench in browser → select draft → navigator appears left, co-pilot band appears top, PhD tabs visible
- [ ] Select REVAL-1 in navigator → evidence scatter renders with red outlier dots
- [ ] Exclude an outlier → co-pilot band metrics update
- [ ] Switch to Simulator tab → type `-5` → projected stats update live
- [ ] Switch to Stratified Equity tab → 5×5 heatmap renders with color cells

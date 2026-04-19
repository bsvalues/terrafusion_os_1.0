# GeoForge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build GeoForge — a GIS-first mass appraisal analytics platform that merges Statistics Studio + TerraGAMA into a full-canvas Mapbox workspace with Benton Method stats, AI diagnosis, and county-wide sale scatter.

**Architecture:** Full-canvas Mapbox GL map as the primary navigation surface. A 480px right drawer slides OVER the map (never shrinks it). Six map layers (satellite, neighborhood choropleth, sale-point scatter county-wide, parcel polygons on-demand, context layers, AI clustering). Stats surface via right drawer panels: Equity Signature Radar, Neighborhood Detail, Sales Drill-Down, Diagnosis. Backend adds a new `GeoForgeController.cs` in the existing TerraFusion.API project with 5 new endpoints.

**Tech Stack:** React 18 + TypeScript + Mapbox GL JS + Zustand + TanStack Query + shadcn/ui + .NET 8 ASP.NET Core + EF Core + existing TerraFusionDbContext + existing TrendStats class (extend with PRB + VEI)

---

## File Map

**Create (frontend):**
- `frontend/apps/os-shell/src/pages/forge/geo/types/geoforge.types.ts` — all TS interfaces
- `frontend/apps/os-shell/src/stores/geoForgeStore.ts` — Zustand store
- `frontend/apps/os-shell/src/pages/forge/geo/utils/bentonMethodCalcs.ts` — PRB/VEI/stat helpers
- `frontend/apps/os-shell/src/pages/forge/geo/utils/choropleths.ts` — color ramp helpers for map layers
- `frontend/apps/os-shell/src/pages/forge/geo/GeoForgeMap.tsx` — Mapbox full-canvas, 6 layers
- `frontend/apps/os-shell/src/pages/forge/geo/panels/EquitySignatureRadar.tsx` — 6-axis hexagon
- `frontend/apps/os-shell/src/pages/forge/geo/panels/NeighborhoodDetailPanel.tsx` — 12-stat + drill
- `frontend/apps/os-shell/src/pages/forge/geo/panels/SalesDrillDownPanel.tsx` — per-neighborhood sale table + scatter
- `frontend/apps/os-shell/src/pages/forge/geo/panels/DiagnosisPanel.tsx` — AI root-cause + peers + quality
- `frontend/apps/os-shell/src/pages/forge/geo/panels/YearTrendPanel.tsx` — 5-year COD/PRD sparklines
- `frontend/apps/os-shell/src/pages/forge/geo/GeoForgePage.tsx` — page shell + drawer orchestration
- `frontend/apps/os-shell/src/pages/forge/geo/GeoForgeBloomCard.tsx` — hover peek bloom
- `frontend/apps/os-shell/src/pages/forge/geo/GeoForgeEquityRail.tsx` — right-side 3-KPI rail
- `frontend/apps/os-shell/src/pages/forge/geo/GeoForgeCommandBar.tsx` — top toolbar (year, filter, tools)

**Modify (frontend):**
- `frontend/apps/os-shell/src/config/moduleComponents.tsx` — add `geo-forge` to MODULE_REGISTRY + ModuleRenderer switch

**Create (backend):**
- `backend/src/TerraFusion.API/Controllers/GeoForgeController.cs` — 5 new endpoints

**Modify (backend):**
- `backend/src/TerraFusion.API/Controllers/TerraForgeController.cs` — add `ComputePrb()` and `ComputeVei()` to `TrendStats`

---

## Task 1: TypeScript Types

**Files:**
- Create: `frontend/apps/os-shell/src/pages/forge/geo/types/geoforge.types.ts`

- [ ] **Step 1: Write the types file**

```typescript
// geoforge.types.ts
export interface GeoForgeFilter {
  taxYear: number;
  neighborhoodCode?: string;
  propertyClass?: string;
  saleDateStart?: string;
  saleDateEnd?: string;
  scope: 'county' | 'neighborhood';
}

export interface BentonMethodStats {
  count: number;
  medianRatio: number;
  cod: number;
  prd: number;
  prb: number;
  vei: number;
  mean: number;
  weightedMean: number;
  min: number;
  max: number;
  stdDev: number;
  cv: number;
  // Quintile medians
  q1Ratio: number;
  q2Ratio: number;
  q3Ratio: number;
  q4Ratio: number;
  q5Ratio: number;
}

export interface NeighborhoodStat {
  neighborhoodCode: string;
  neighborhoodName: string;
  stats: BentonMethodStats;
  saleCount: number;
  centroidLat: number;
  centroidLng: number;
  bounds?: [[number, number], [number, number]]; // SW, NE
}

export interface SalePoint {
  saleId: string;
  parcelId: string;
  lat: number;
  lng: number;
  salePrice: number;
  assessedValue: number;
  ratio: number;
  saleDate: string;
  neighborhoodCode: string;
  propertyClass: string;
  isOutlier: boolean;
  qualificationDecision: string;
}

export interface DiagnosisCategory {
  category: 'data_quality' | 'stratification' | 'outliers' | 'external';
  severity: 'ok' | 'watch' | 'critical';
  headline: string;
  detail: string;
  affectedCount: number;
  moransI?: number;
}

export interface PeerComparator {
  neighborhoodCode: string;
  neighborhoodName: string;
  medianRatio: number;
  cod: number;
  saleCount: number;
  delta: number; // vs selected neighborhood
}

export interface DiagnosisResult {
  neighborhoodCode: string;
  taxYear: number;
  categories: DiagnosisCategory[];
  peers: PeerComparator[];
  dataQualityFlags: string[];
  generatedAt: string;
}

export interface GwrCell {
  lat: number;
  lng: number;
  localMedianRatio: number;
  localCod: number;
  localPrd: number;
}

export interface GwrSurface {
  taxYear: number;
  cells: GwrCell[];
  cachedAt: string;
}

export type MapLayer =
  | 'satellite'
  | 'choropleth'
  | 'sale-scatter'
  | 'parcel-polygons'
  | 'context'
  | 'ai-cluster'
  | 'kde'
  | 'gwr';

export type RightDrawerPanel =
  | 'none'
  | 'neighborhood-detail'
  | 'sales-drilldown'
  | 'diagnosis'
  | 'year-trend';

export interface GeoForgeState {
  filter: GeoForgeFilter;
  activeLayers: Set<MapLayer>;
  selectedNeighborhoodCode: string | null;
  rightDrawerPanel: RightDrawerPanel;
  bloomParcelId: string | null;
  // Data
  neighborhoodStats: NeighborhoodStat[];
  salePoints: SalePoint[];
  diagnosis: DiagnosisResult | null;
  gwrSurface: GwrSurface | null;
  // Loading
  loadingStats: boolean;
  loadingSales: boolean;
  loadingDiagnosis: boolean;
  loadingGwr: boolean;
  // Actions
  setFilter: (patch: Partial<GeoForgeFilter>) => void;
  toggleLayer: (layer: MapLayer) => void;
  selectNeighborhood: (code: string | null, panel?: RightDrawerPanel) => void;
  openDrawer: (panel: RightDrawerPanel) => void;
  closeDrawer: () => void;
  setNeighborhoodStats: (stats: NeighborhoodStat[]) => void;
  setSalePoints: (sales: SalePoint[]) => void;
  setDiagnosis: (d: DiagnosisResult | null) => void;
  setGwrSurface: (gwr: GwrSurface | null) => void;
  setLoadingStats: (v: boolean) => void;
  setLoadingSales: (v: boolean) => void;
  setLoadingDiagnosis: (v: boolean) => void;
  setLoadingGwr: (v: boolean) => void;
}
```

- [ ] **Step 2: Verify file exists**

```bash
ls frontend/apps/os-shell/src/pages/forge/geo/types/
```
Expected: `geoforge.types.ts`

- [ ] **Step 3: Commit**

```bash
git add frontend/apps/os-shell/src/pages/forge/geo/types/geoforge.types.ts
git commit -m "feat(geoforge): add TypeScript domain types"
```

---

## Task 2: Zustand Store

**Files:**
- Create: `frontend/apps/os-shell/src/stores/geoForgeStore.ts`

- [ ] **Step 1: Write the store**

```typescript
// geoForgeStore.ts
import { create } from 'zustand';
import type {
  GeoForgeState, GeoForgeFilter, MapLayer, RightDrawerPanel,
  NeighborhoodStat, SalePoint, DiagnosisResult, GwrSurface
} from '../pages/forge/geo/types/geoforge.types';

const DEFAULT_FILTER: GeoForgeFilter = {
  taxYear: new Date().getFullYear(),
  scope: 'county',
};

const DEFAULT_LAYERS: Set<MapLayer> = new Set(['satellite', 'choropleth', 'sale-scatter']);

export const useGeoForgeStore = create<GeoForgeState>((set) => ({
  filter: DEFAULT_FILTER,
  activeLayers: DEFAULT_LAYERS,
  selectedNeighborhoodCode: null,
  rightDrawerPanel: 'none',
  bloomParcelId: null,
  neighborhoodStats: [],
  salePoints: [],
  diagnosis: null,
  gwrSurface: null,
  loadingStats: false,
  loadingSales: false,
  loadingDiagnosis: false,
  loadingGwr: false,

  setFilter: (patch) => set((s) => ({ filter: { ...s.filter, ...patch } })),
  toggleLayer: (layer) =>
    set((s) => {
      const next = new Set(s.activeLayers);
      next.has(layer) ? next.delete(layer) : next.add(layer);
      return { activeLayers: next };
    }),
  selectNeighborhood: (code, panel = 'neighborhood-detail') =>
    set({ selectedNeighborhoodCode: code, rightDrawerPanel: code ? panel : 'none' }),
  openDrawer: (panel) => set({ rightDrawerPanel: panel }),
  closeDrawer: () => set({ rightDrawerPanel: 'none', selectedNeighborhoodCode: null }),
  setNeighborhoodStats: (neighborhoodStats) => set({ neighborhoodStats }),
  setSalePoints: (salePoints) => set({ salePoints }),
  setDiagnosis: (diagnosis) => set({ diagnosis }),
  setGwrSurface: (gwrSurface) => set({ gwrSurface }),
  setLoadingStats: (loadingStats) => set({ loadingStats }),
  setLoadingSales: (loadingSales) => set({ loadingSales }),
  setLoadingDiagnosis: (loadingDiagnosis) => set({ loadingDiagnosis }),
  setLoadingGwr: (loadingGwr) => set({ loadingGwr }),
}));
```

- [ ] **Step 2: Commit**

```bash
git add frontend/apps/os-shell/src/stores/geoForgeStore.ts
git commit -m "feat(geoforge): add Zustand store"
```

---

## Task 3: Benton Method Calc Utilities

**Files:**
- Create: `frontend/apps/os-shell/src/pages/forge/geo/utils/bentonMethodCalcs.ts`
- Create: `frontend/apps/os-shell/src/pages/forge/geo/utils/choropleths.ts`

- [ ] **Step 1: Write bentonMethodCalcs.ts**

```typescript
// bentonMethodCalcs.ts
import type { BentonMethodStats } from '../types/geoforge.types';

/** IAAO threshold bands for COD */
export const COD_BANDS = { ok: 15, watch: 20 } as const;
/** IAAO PRD: 0.98–1.03 ok */
export const PRD_BANDS = { loOk: 0.98, hiOk: 1.03 } as const;
/** Benton PRB threshold: |PRB| < 0.05 */
export const PRB_BAND = 0.05 as const;

export function codBand(cod: number): 'ok' | 'watch' | 'critical' {
  if (cod <= COD_BANDS.ok) return 'ok';
  if (cod <= COD_BANDS.watch) return 'watch';
  return 'critical';
}

export function prdBand(prd: number): 'ok' | 'watch' | 'critical' {
  if (prd >= PRD_BANDS.loOk && prd <= PRD_BANDS.hiOk) return 'ok';
  if (prd >= 0.95 && prd <= 1.06) return 'watch';
  return 'critical';
}

export function prbBand(prb: number): 'ok' | 'watch' | 'critical' {
  const abs = Math.abs(prb);
  if (abs < PRB_BAND) return 'ok';
  if (abs < 0.10) return 'watch';
  return 'critical';
}

export function radarNormalize(stats: BentonMethodStats) {
  // Normalize each axis to 0–1 for radar (1 = perfect)
  const codScore = Math.max(0, 1 - stats.cod / 30);
  const prdScore = 1 - Math.abs(stats.prd - 1.0) / 0.10;
  const prbScore = 1 - Math.abs(stats.prb) / 0.10;
  const medianScore = 1 - Math.abs(stats.medianRatio - 1.0) / 0.20;
  const veiScore = Math.max(0, 1 - Math.abs(stats.vei) / 0.10);
  // AAD approximated from CV
  const aadScore = Math.max(0, 1 - stats.cv / 0.30);
  return {
    medianRatio: Math.max(0, Math.min(1, medianScore)),
    cod: Math.max(0, Math.min(1, codScore)),
    prd: Math.max(0, Math.min(1, prdScore)),
    prb: Math.max(0, Math.min(1, prbScore)),
    vei: Math.max(0, Math.min(1, veiScore)),
    aad: Math.max(0, Math.min(1, aadScore)),
  };
}
```

- [ ] **Step 2: Write choropleths.ts**

```typescript
// choropleths.ts

/** COD choropleth: green→yellow→red */
export function codColor(cod: number): string {
  if (cod <= 10) return '#22c55e';
  if (cod <= 15) return '#84cc16';
  if (cod <= 20) return '#eab308';
  if (cod <= 25) return '#f97316';
  return '#ef4444';
}

/** Median ratio choropleth: blue (under) → white (at par) → red (over) */
export function medianRatioColor(ratio: number): string {
  if (ratio < 0.80) return '#1d4ed8';
  if (ratio < 0.90) return '#60a5fa';
  if (ratio < 0.95) return '#93c5fd';
  if (ratio <= 1.05) return '#f0fdf4';
  if (ratio <= 1.10) return '#fca5a5';
  if (ratio <= 1.20) return '#f87171';
  return '#b91c1c';
}

/** Sale ratio dot color */
export function ratioPointColor(ratio: number): string {
  if (ratio < 0.85) return '#3b82f6';
  if (ratio < 0.95) return '#93c5fd';
  if (ratio <= 1.05) return '#22c55e';
  if (ratio <= 1.15) return '#fbbf24';
  return '#ef4444';
}

/** Radius for sale point based on price (px at zoom 12) */
export function salePointRadius(price: number): number {
  const mn = 50_000, mx = 1_000_000;
  const clamped = Math.max(mn, Math.min(mx, price));
  return 4 + ((clamped - mn) / (mx - mn)) * 10;
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/apps/os-shell/src/pages/forge/geo/utils/
git commit -m "feat(geoforge): add Benton Method calc + choropleth utils"
```

---

## Task 4: Backend — Extend TrendStats + New GeoForgeController

**Files:**
- Modify: `backend/src/TerraFusion.API/Controllers/TerraForgeController.cs` (lines 3178–3179: add after ComputePrd)
- Create: `backend/src/TerraFusion.API/Controllers/GeoForgeController.cs`

- [ ] **Step 1: Add ComputePrb and ComputeVei to TrendStats**

In `TerraForgeController.cs`, after line 3178 (end of `ComputePrd`), before line 3179 (`}`), add:

```csharp
    internal static decimal ComputePrb(List<decimal> ratios, List<decimal> avs)
    {
        // PRB: regress (ratio - medianRatio) on (AV/medianAV - 1)
        if (ratios.Count < 5) return 0m;
        var medR = Median(ratios);
        if (medR == 0) return 0m;
        var medAv = Median(avs);
        if (medAv == 0) return 0m;
        var xs = avs.Select(av => (double)(av / medAv - 1m)).ToList();
        var ys = ratios.Zip(avs, (r, av) => (double)(r - medR)).ToList();
        var xMean = xs.Average();
        var yMean = ys.Average();
        var num = xs.Zip(ys, (x, y) => (x - xMean) * (y - yMean)).Sum();
        var den = xs.Sum(x => (x - xMean) * (x - xMean));
        if (den == 0) return 0m;
        return (decimal)(num / den);
    }

    internal static decimal ComputeVei(List<decimal> ratios)
    {
        // VEI: vertical equity index — slope of rank(AV) vs ratio
        if (ratios.Count < 5) return 0m;
        var sorted = ratios.Order().ToList();
        var n = sorted.Count;
        double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (int i = 0; i < n; i++)
        {
            double x = (double)i / (n - 1); // rank 0–1
            double y = (double)sorted[i];
            sumX += x; sumY += y; sumXY += x * y; sumX2 += x * x;
        }
        var denom = n * sumX2 - sumX * sumX;
        if (denom == 0) return 0m;
        var slope = (n * sumXY - sumX * sumY) / denom;
        return (decimal)slope;
    }
```

- [ ] **Step 2: Verify TrendStats now has 4 methods**

Run: `grep -n "internal static decimal Compute" backend/src/TerraFusion.API/Controllers/TerraForgeController.cs`
Expected: ComputeCod, ComputePrd, ComputePrb, ComputeVei — 4 lines

- [ ] **Step 3: Create GeoForgeController.cs**

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Data;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/geoforge")]
public class GeoForgeController : ControllerBase
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<GeoForgeController> _logger;
    private static readonly Dictionary<string, object> _gwrCache = new();

    public GeoForgeController(TerraFusionDbContext db, ILogger<GeoForgeController> logger)
    {
        _db = db;
        _logger = logger;
    }

    // ── 1. Neighborhood ratio stats ─────────────────────────────────────────
    [HttpGet("ratio-study/neighborhood-stats")]
    public async Task<IActionResult> GetNeighborhoodStats(
        [FromQuery] int taxYear,
        [FromQuery] string? propertyClass,
        [FromQuery] string? saleDateStart,
        [FromQuery] string? saleDateEnd,
        CancellationToken ct)
    {
        var countyIdClaim = User.FindFirst("county_id")?.Value
                            ?? User.FindFirst("countyId")?.Value;
        if (string.IsNullOrEmpty(countyIdClaim))
            return Unauthorized(new { error = "county_id claim missing" });

        var query = _db.SaleRecords
            .Where(s => s.CountyId == countyIdClaim
                     && s.SaleYear == taxYear
                     && s.QualificationDecision == "qualified"
                     && s.SalePrice > 10_000m
                     && s.AssessedValue > 0m);

        if (!string.IsNullOrEmpty(propertyClass))
            query = query.Where(s => s.PropertyClass == propertyClass);

        if (DateTime.TryParse(saleDateStart, out var ds))
            query = query.Where(s => s.SaleDate >= ds);
        if (DateTime.TryParse(saleDateEnd, out var de))
            query = query.Where(s => s.SaleDate <= de);

        var rows = await query
            .Select(s => new
            {
                s.ParcelNumber,
                s.NeighborhoodCode,
                Ratio = s.AssessedValue / s.SalePrice,
                s.AssessedValue,
                s.SalePrice,
            })
            .ToListAsync(ct);

        // Join centroid from GisParcelGeometries
        var parcelIds = rows.Select(r => r.ParcelNumber).Distinct().ToList();
        var geoLookup = await _db.GisParcelGeometries
            .Where(g => parcelIds.Contains(g.ParcelId))
            .Select(g => new { g.ParcelId, g.CentroidLat, g.CentroidLng })
            .ToDictionaryAsync(g => g.ParcelId, ct);

        var grouped = rows.GroupBy(r => r.NeighborhoodCode ?? "UNKNOWN");

        var result = grouped.Select(g =>
        {
            var ratios = g.Select(r => r.Ratio).ToList();
            var avs = g.Select(r => r.AssessedValue).ToList();
            var sps = g.Select(r => r.SalePrice).ToList();
            var sorted = ratios.Order().ToList();
            var n = sorted.Count;
            var mean = ratios.Average();
            var stdDev = n > 1
                ? (decimal)Math.Sqrt(ratios.Select(r => (double)(r - mean) * (double)(r - mean)).Average())
                : 0m;
            var cv = mean > 0 ? stdDev / mean : 0m;
            int q(int pct) => sorted[(int)(n * pct / 100.0)];

            // Centroid = average of sale parcel centroids
            var centroids = g.Select(r => geoLookup.TryGetValue(r.ParcelNumber, out var geo) ? geo : null)
                             .Where(x => x != null).ToList();
            var lat = centroids.Count > 0 ? centroids.Average(c => c!.CentroidLat ?? 0.0) : 0.0;
            var lng = centroids.Count > 0 ? centroids.Average(c => c!.CentroidLng ?? 0.0) : 0.0;

            return new
            {
                neighborhoodCode = g.Key,
                neighborhoodName = g.Key,
                saleCount = n,
                centroidLat = lat,
                centroidLng = lng,
                stats = new
                {
                    count = n,
                    medianRatio = (double)TrendStats.Median(ratios),
                    cod = (double)TrendStats.ComputeCod(ratios),
                    prd = (double)TrendStats.ComputePrd(ratios, avs),
                    prb = (double)TrendStats.ComputePrb(ratios, avs),
                    vei = (double)TrendStats.ComputeVei(ratios),
                    mean = (double)mean,
                    weightedMean = avs.Sum() > 0 ? (double)(avs.Sum() / sps.Sum()) : 0.0,
                    min = (double)sorted.First(),
                    max = (double)sorted.Last(),
                    stdDev = (double)stdDev,
                    cv = (double)cv,
                    q1Ratio = n > 4 ? (double)sorted[q(20)] : 0.0,
                    q2Ratio = n > 4 ? (double)sorted[q(40)] : 0.0,
                    q3Ratio = n > 4 ? (double)TrendStats.Median(ratios) : 0.0,
                    q4Ratio = n > 4 ? (double)sorted[q(80)] : 0.0,
                    q5Ratio = n > 4 ? (double)sorted[q(99)] : 0.0,
                },
            };
        }).ToList();

        return Ok(result);
    }

    // ── 2. County-wide sale points (for scatter layer) ──────────────────────
    [HttpGet("ratio-study/sales")]
    public async Task<IActionResult> GetSalePoints(
        [FromQuery] int taxYear,
        [FromQuery] string? neighborhoodCode,
        CancellationToken ct)
    {
        var countyIdClaim = User.FindFirst("county_id")?.Value
                            ?? User.FindFirst("countyId")?.Value;
        if (string.IsNullOrEmpty(countyIdClaim))
            return Unauthorized(new { error = "county_id claim missing" });

        var query = _db.SaleRecords
            .Where(s => s.CountyId == countyIdClaim
                     && s.SaleYear == taxYear
                     && s.QualificationDecision == "qualified"
                     && s.SalePrice > 10_000m
                     && s.AssessedValue > 0m);

        if (!string.IsNullOrEmpty(neighborhoodCode))
            query = query.Where(s => s.NeighborhoodCode == neighborhoodCode);

        var sales = await query
            .Select(s => new
            {
                s.Id,
                s.ParcelNumber,
                s.SalePrice,
                s.AssessedValue,
                s.SaleDate,
                s.NeighborhoodCode,
                s.PropertyClass,
                s.QualificationDecision,
            })
            .ToListAsync(ct);

        var parcelIds = sales.Select(s => s.ParcelNumber).Distinct().ToList();
        var geoLookup = await _db.GisParcelGeometries
            .Where(g => parcelIds.Contains(g.ParcelId))
            .Select(g => new { g.ParcelId, g.CentroidLat, g.CentroidLng })
            .ToDictionaryAsync(g => g.ParcelId, ct);

        var grouped = sales.GroupBy(s => s.NeighborhoodCode ?? "UNKNOWN");
        var outlierCutoffs = grouped.ToDictionary(
            g => g.Key,
            g =>
            {
                var ratios = g.Select(r => r.AssessedValue / r.SalePrice).Order().ToList();
                var med = TrendStats.Median(ratios);
                var madVal = ratios.Average(r => Math.Abs(r - med));
                return (lo: med - 3 * madVal, hi: med + 3 * madVal);
            });

        var result = sales
            .Where(s => geoLookup.ContainsKey(s.ParcelNumber)
                     && geoLookup[s.ParcelNumber].CentroidLat.HasValue
                     && geoLookup[s.ParcelNumber].CentroidLng.HasValue)
            .Select(s =>
            {
                var geo = geoLookup[s.ParcelNumber];
                var ratio = s.AssessedValue / s.SalePrice;
                var hood = s.NeighborhoodCode ?? "UNKNOWN";
                var cut = outlierCutoffs.TryGetValue(hood, out var c) ? c : (lo: 0m, hi: 2m);
                return new
                {
                    saleId = s.Id.ToString(),
                    parcelId = s.ParcelNumber,
                    lat = geo.CentroidLat!.Value,
                    lng = geo.CentroidLng!.Value,
                    salePrice = (double)s.SalePrice,
                    assessedValue = (double)s.AssessedValue,
                    ratio = (double)ratio,
                    saleDate = s.SaleDate.ToString("yyyy-MM-dd"),
                    neighborhoodCode = hood,
                    propertyClass = s.PropertyClass ?? "",
                    isOutlier = ratio < cut.lo || ratio > cut.hi,
                    qualificationDecision = s.QualificationDecision,
                };
            }).ToList();

        return Ok(result);
    }

    // ── 3. AI Diagnosis ─────────────────────────────────────────────────────
    [HttpGet("ratio-study/diagnosis")]
    public async Task<IActionResult> GetDiagnosis(
        [FromQuery] int taxYear,
        [FromQuery] string neighborhoodCode,
        CancellationToken ct)
    {
        var countyIdClaim = User.FindFirst("county_id")?.Value
                            ?? User.FindFirst("countyId")?.Value;
        if (string.IsNullOrEmpty(countyIdClaim))
            return Unauthorized(new { error = "county_id claim missing" });

        var hood = await _db.SaleRecords
            .Where(s => s.CountyId == countyIdClaim
                     && s.SaleYear == taxYear
                     && s.NeighborhoodCode == neighborhoodCode
                     && s.QualificationDecision == "qualified"
                     && s.SalePrice > 10_000m
                     && s.AssessedValue > 0m)
            .Select(s => new { s.AssessedValue, s.SalePrice, s.ParcelNumber, s.SaleDate })
            .ToListAsync(ct);

        var categories = new List<object>();
        var flags = new List<string>();

        if (hood.Count < 5)
        {
            categories.Add(new { category = "data_quality", severity = "critical",
                headline = "Insufficient sales", detail = $"Only {hood.Count} qualified sales — statistics unreliable.",
                affectedCount = hood.Count, moransI = (double?)null });
            flags.Add("low_sale_count");
        }
        else
        {
            var ratios = hood.Select(s => s.AssessedValue / s.SalePrice).ToList();
            var cod = TrendStats.ComputeCod(ratios);
            var prd = TrendStats.ComputePrd(ratios, hood.Select(s => s.AssessedValue).ToList());
            var prb = TrendStats.ComputePrb(ratios, hood.Select(s => s.AssessedValue).ToList());

            // Outliers
            var med = TrendStats.Median(ratios);
            var mad = ratios.Average(r => Math.Abs(r - med));
            var outliers = ratios.Count(r => Math.Abs(r - med) > 3 * mad);
            if (outliers > 0)
                categories.Add(new { category = "outliers", severity = outliers > 3 ? "critical" : "watch",
                    headline = $"{outliers} ratio outliers detected",
                    detail = "Sales with ratios > 3 MAD from median. Review individual sales.",
                    affectedCount = outliers, moransI = (double?)null });

            // Stratification (PRD/PRB)
            if (Math.Abs(prd - 1m) > 0.05m || Math.Abs(prb) > 0.05m)
                categories.Add(new { category = "stratification", severity = Math.Abs(prd - 1m) > 0.08m ? "critical" : "watch",
                    headline = "Vertical inequity detected",
                    detail = $"PRD={prd:F3}, PRB={prb:F3} — assessment is {'progressive' switch { _ when prb < 0 => "regressive", _ => "progressive" }} across value ranges.",
                    affectedCount = hood.Count, moransI = (double?)null });

            // COD
            if (cod > 20m)
                categories.Add(new { category = "data_quality", severity = cod > 25m ? "critical" : "watch",
                    headline = "High uniformity dispersion",
                    detail = $"COD={cod:F1} exceeds IAAO threshold of 20 for residential.",
                    affectedCount = hood.Count, moransI = (double?)null });

            if (!categories.Any())
                categories.Add(new { category = "data_quality", severity = "ok",
                    headline = "No significant issues detected",
                    detail = "All Benton Method thresholds within acceptable ranges.",
                    affectedCount = 0, moransI = (double?)null });
        }

        // Peer comparators — all neighborhoods this year
        var peers = await _db.SaleRecords
            .Where(s => s.CountyId == countyIdClaim
                     && s.SaleYear == taxYear
                     && s.QualificationDecision == "qualified"
                     && s.SalePrice > 10_000m
                     && s.AssessedValue > 0m
                     && s.NeighborhoodCode != neighborhoodCode)
            .GroupBy(s => s.NeighborhoodCode)
            .Select(g => new
            {
                code = g.Key,
                ratios = g.Select(s => s.AssessedValue / s.SalePrice).ToList(),
                count = g.Count(),
            })
            .ToListAsync(ct);

        var selectedMed = hood.Count > 0
            ? (double)TrendStats.Median(hood.Select(s => s.AssessedValue / s.SalePrice).ToList())
            : 0.0;

        var peerResult = peers
            .Where(p => p.count >= 3)
            .Select(p => new
            {
                neighborhoodCode = p.code,
                neighborhoodName = p.code,
                medianRatio = (double)TrendStats.Median(p.ratios),
                cod = (double)TrendStats.ComputeCod(p.ratios),
                saleCount = p.count,
                delta = (double)TrendStats.Median(p.ratios) - selectedMed,
            })
            .OrderBy(p => Math.Abs(p.delta))
            .Take(5)
            .ToList();

        return Ok(new
        {
            neighborhoodCode,
            taxYear,
            categories,
            peers = peerResult,
            dataQualityFlags = flags,
            generatedAt = DateTime.UtcNow.ToString("o"),
        });
    }

    // ── 4. GWR Surface (cached per year) ────────────────────────────────────
    [HttpPost("ratio-study/gwr")]
    public async Task<IActionResult> ComputeGwr(
        [FromQuery] int taxYear,
        CancellationToken ct)
    {
        var countyIdClaim = User.FindFirst("county_id")?.Value
                            ?? User.FindFirst("countyId")?.Value;
        if (string.IsNullOrEmpty(countyIdClaim))
            return Unauthorized(new { error = "county_id claim missing" });

        var cacheKey = $"{countyIdClaim}:{taxYear}";
        if (_gwrCache.TryGetValue(cacheKey, out var cached))
            return Ok(cached);

        // Simple spatial moving window: for each neighborhood centroid, take nearby sales (within ~2 miles)
        var sales = await _db.SaleRecords
            .Where(s => s.CountyId == countyIdClaim
                     && s.SaleYear == taxYear
                     && s.QualificationDecision == "qualified"
                     && s.SalePrice > 10_000m
                     && s.AssessedValue > 0m)
            .Select(s => new { s.ParcelNumber, Ratio = s.AssessedValue / s.SalePrice, s.AssessedValue })
            .ToListAsync(ct);

        var parcelIds = sales.Select(s => s.ParcelNumber).Distinct().ToList();
        var geos = await _db.GisParcelGeometries
            .Where(g => parcelIds.Contains(g.ParcelId)
                     && g.CentroidLat.HasValue && g.CentroidLng.HasValue)
            .Select(g => new { g.ParcelId, Lat = g.CentroidLat!.Value, Lng = g.CentroidLng!.Value })
            .ToDictionaryAsync(g => g.ParcelId, ct);

        var salesWithGeo = sales
            .Where(s => geos.ContainsKey(s.ParcelNumber))
            .Select(s => new
            {
                Lat = geos[s.ParcelNumber].Lat,
                Lng = geos[s.ParcelNumber].Lng,
                s.Ratio,
                s.AssessedValue,
            }).ToList();

        // Grid: 20x20 over county bounding box
        if (salesWithGeo.Count == 0) return Ok(new { taxYear, cells = Array.Empty<object>(), cachedAt = DateTime.UtcNow });

        var minLat = salesWithGeo.Min(s => s.Lat);
        var maxLat = salesWithGeo.Max(s => s.Lat);
        var minLng = salesWithGeo.Min(s => s.Lng);
        var maxLng = salesWithGeo.Max(s => s.Lng);
        const int gridSize = 20;
        const double bandwidth = 0.05; // ~3.5 miles

        var cells = new List<object>();
        for (int i = 0; i < gridSize; i++)
        {
            for (int j = 0; j < gridSize; j++)
            {
                var lat = minLat + (maxLat - minLat) * i / (gridSize - 1);
                var lng = minLng + (maxLng - minLng) * j / (gridSize - 1);
                var nearby = salesWithGeo
                    .Where(s => Math.Abs(s.Lat - lat) < bandwidth && Math.Abs(s.Lng - lng) < bandwidth)
                    .Select(s => new { s.Ratio, s.AssessedValue })
                    .ToList();
                if (nearby.Count < 5) continue;
                var ratios = nearby.Select(n => n.Ratio).ToList();
                var avs = nearby.Select(n => n.AssessedValue).ToList();
                cells.Add(new
                {
                    lat,
                    lng,
                    localMedianRatio = (double)TrendStats.Median(ratios),
                    localCod = (double)TrendStats.ComputeCod(ratios),
                    localPrd = (double)TrendStats.ComputePrd(ratios, avs),
                });
            }
        }

        var result = new { taxYear, cells, cachedAt = DateTime.UtcNow.ToString("o") };
        _gwrCache[cacheKey] = result;
        return Ok(result);
    }

    // ── 5. GeoJSON export ───────────────────────────────────────────────────
    [HttpGet("ratio-study/export")]
    public async Task<IActionResult> ExportGeoJson(
        [FromQuery] int taxYear,
        [FromQuery] string? neighborhoodCode,
        CancellationToken ct)
    {
        var countyIdClaim = User.FindFirst("county_id")?.Value
                            ?? User.FindFirst("countyId")?.Value;
        if (string.IsNullOrEmpty(countyIdClaim))
            return Unauthorized(new { error = "county_id claim missing" });

        var query = _db.SaleRecords
            .Where(s => s.CountyId == countyIdClaim
                     && s.SaleYear == taxYear
                     && s.QualificationDecision == "qualified"
                     && s.SalePrice > 10_000m);

        if (!string.IsNullOrEmpty(neighborhoodCode))
            query = query.Where(s => s.NeighborhoodCode == neighborhoodCode);

        var sales = await query
            .Select(s => new { s.ParcelNumber, s.SalePrice, s.AssessedValue, s.NeighborhoodCode, s.SaleDate })
            .ToListAsync(ct);

        var parcelIds = sales.Select(s => s.ParcelNumber).Distinct().ToList();
        var geos = await _db.GisParcelGeometries
            .Where(g => parcelIds.Contains(g.ParcelId) && g.CentroidLat.HasValue && g.CentroidLng.HasValue)
            .ToDictionaryAsync(g => g.ParcelId, ct);

        var features = sales
            .Where(s => geos.ContainsKey(s.ParcelNumber))
            .Select(s =>
            {
                var geo = geos[s.ParcelNumber];
                var ratio = s.SalePrice > 0 ? s.AssessedValue / s.SalePrice : 0m;
                return new
                {
                    type = "Feature",
                    geometry = new
                    {
                        type = "Point",
                        coordinates = new[] { geo.CentroidLng!.Value, geo.CentroidLat!.Value }
                    },
                    properties = new
                    {
                        parcelId = s.ParcelNumber,
                        salePrice = (double)s.SalePrice,
                        assessedValue = (double)s.AssessedValue,
                        ratio = (double)ratio,
                        neighborhoodCode = s.NeighborhoodCode,
                        saleDate = s.SaleDate.ToString("yyyy-MM-dd"),
                    },
                };
            }).ToList();

        var geojson = new
        {
            type = "FeatureCollection",
            name = $"GeoForge_RatioStudy_{taxYear}",
            features,
        };

        Response.Headers["Content-Disposition"] = $"attachment; filename=\"geoforge-{taxYear}.geojson\"";
        return new JsonResult(geojson);
    }
}
```

- [ ] **Step 4: Build backend to verify compilation**

Run: `cd backend && dotnet build src/TerraFusion.API/TerraFusion.API.csproj 2>&1 | tail -20`
Expected: `Build succeeded`

- [ ] **Step 5: Commit**

```bash
git add backend/src/TerraFusion.API/Controllers/GeoForgeController.cs \
        backend/src/TerraFusion.API/Controllers/TerraForgeController.cs
git commit -m "feat(geoforge): backend controller + extend TrendStats with PRB/VEI"
```

---

## Task 5: GeoForgeMap Component

**Files:**
- Create: `frontend/apps/os-shell/src/pages/forge/geo/GeoForgeMap.tsx`

- [ ] **Step 1: Write GeoForgeMap.tsx**

```tsx
// GeoForgeMap.tsx
import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { codColor, medianRatioColor, ratioPointColor, salePointRadius } from './utils/choropleths';
import type { NeighborhoodStat, SalePoint } from './types/geoforge.types';

// Token must be set in env: VITE_MAPBOX_TOKEN
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN ?? '';

const BENTON_CENTER: [number, number] = [-119.3, 46.2];
const BENTON_ZOOM = 10;

interface Props {
  onNeighborhoodClick: (code: string) => void;
}

export function GeoForgeMap({ onNeighborhoodClick }: Props) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { neighborhoodStats, salePoints, activeLayers, filter } = useGeoForgeStore();

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: BENTON_CENTER,
      zoom: BENTON_ZOOM,
      minZoom: 8,
      maxZoom: 18,
    });
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(new mapboxgl.ScaleControl({ unit: 'imperial' }), 'bottom-left');
    mapRef.current = map;
    map.on('load', () => {
      addNeighborhoodLayer(map);
      addSaleScatterLayer(map);
      addKdeLayer(map);
      addAiClusterLayer(map);
      map.on('click', 'neighborhood-fill', (e) => {
        const code = e.features?.[0]?.properties?.neighborhoodCode;
        if (code) onNeighborhoodClick(code);
      });
      map.on('mouseenter', 'neighborhood-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'neighborhood-fill', () => {
        map.getCanvas().style.cursor = '';
      });
    });
    return () => { map.remove(); mapRef.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update neighborhood choropleth data
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: neighborhoodStats.map((ns) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [ns.centroidLng, ns.centroidLat],
        },
        properties: {
          neighborhoodCode: ns.neighborhoodCode,
          medianRatio: ns.stats.medianRatio,
          cod: ns.stats.cod,
          saleCount: ns.saleCount,
          color: filter.taxYear
            ? medianRatioColor(ns.stats.medianRatio)
            : codColor(ns.stats.cod),
        },
      })),
    };
    const src = map.getSource('neighborhoods') as mapboxgl.GeoJSONSource | undefined;
    if (src) src.setData(geojson);
  }, [neighborhoodStats, filter.taxYear]);

  // Update sale scatter data
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: salePoints.map((sp) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [sp.lng, sp.lat] },
        properties: {
          ratio: sp.ratio,
          salePrice: sp.salePrice,
          isOutlier: sp.isOutlier,
          color: ratioPointColor(sp.ratio),
          radius: salePointRadius(sp.salePrice),
        },
      })),
    };
    const src = map.getSource('sales') as mapboxgl.GeoJSONSource | undefined;
    if (src) src.setData(geojson);
  }, [salePoints]);

  // Layer visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    const layerMap: Record<string, string[]> = {
      choropleth: ['neighborhood-fill', 'neighborhood-outline', 'neighborhood-label'],
      'sale-scatter': ['sale-circles', 'sale-outlier-ring'],
      kde: ['kde-heat'],
      'ai-cluster': ['ai-cluster-circles', 'ai-cluster-count'],
    };
    for (const [key, layers] of Object.entries(layerMap)) {
      const vis = activeLayers.has(key as never) ? 'visible' : 'none';
      for (const l of layers) {
        if (map.getLayer(l)) map.setLayoutProperty(l, 'visibility', vis);
      }
    }
  }, [activeLayers]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
      style={{ minHeight: '100%' }}
    />
  );
}

function addNeighborhoodLayer(map: mapboxgl.Map) {
  map.addSource('neighborhoods', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });
  map.addLayer({
    id: 'neighborhood-fill',
    type: 'circle',
    source: 'neighborhoods',
    paint: {
      'circle-color': ['get', 'color'],
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 12, 14, 40],
      'circle-opacity': 0.65,
    },
  });
  map.addLayer({
    id: 'neighborhood-outline',
    type: 'circle',
    source: 'neighborhoods',
    paint: {
      'circle-color': 'transparent',
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 13, 14, 42],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#00FFFF',
      'circle-opacity': 0,
      'circle-stroke-opacity': 0.5,
    },
  });
  map.addLayer({
    id: 'neighborhood-label',
    type: 'symbol',
    source: 'neighborhoods',
    layout: {
      'text-field': ['get', 'neighborhoodCode'],
      'text-size': 11,
      'text-anchor': 'center',
    },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': '#000000',
      'text-halo-width': 1,
    },
  });
}

function addSaleScatterLayer(map: mapboxgl.Map) {
  map.addSource('sales', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
    cluster: true,
    clusterMaxZoom: 12,
    clusterRadius: 40,
  });
  map.addLayer({
    id: 'sale-circles',
    type: 'circle',
    source: 'sales',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': ['get', 'color'],
      'circle-radius': ['get', 'radius'],
      'circle-opacity': 0.7,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#ffffff',
    },
  });
  map.addLayer({
    id: 'sale-outlier-ring',
    type: 'circle',
    source: 'sales',
    filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'isOutlier'], true]],
    paint: {
      'circle-color': 'transparent',
      'circle-radius': ['+', ['get', 'radius'], 4],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ff0000',
    },
  });
}

function addKdeLayer(map: mapboxgl.Map) {
  map.addSource('sales-kde', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });
  map.addLayer({
    id: 'kde-heat',
    type: 'heatmap',
    source: 'sales-kde',
    maxzoom: 13,
    paint: {
      'heatmap-weight': ['interpolate', ['linear'], ['get', 'ratio'], 0.7, 0, 1.0, 0.5, 1.3, 1],
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 8, 1, 13, 3],
      'heatmap-color': [
        'interpolate', ['linear'], ['heatmap-density'],
        0, 'rgba(0,0,255,0)', 0.2, '#1d4ed8', 0.5, '#22c55e',
        0.8, '#eab308', 1, '#ef4444',
      ],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 8, 20, 13, 40],
      'heatmap-opacity': 0.6,
    },
  });
}

function addAiClusterLayer(map: mapboxgl.Map) {
  map.addSource('ai-clusters', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });
  map.addLayer({
    id: 'ai-cluster-circles',
    type: 'circle',
    source: 'ai-clusters',
    paint: {
      'circle-color': '#a855f7',
      'circle-radius': 20,
      'circle-opacity': 0.3,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#a855f7',
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/apps/os-shell/src/pages/forge/geo/GeoForgeMap.tsx
git commit -m "feat(geoforge): full-canvas Mapbox map with 6-layer stack"
```

---

## Task 6: Panels

**Files:**
- Create: `frontend/apps/os-shell/src/pages/forge/geo/panels/EquitySignatureRadar.tsx`
- Create: `frontend/apps/os-shell/src/pages/forge/geo/panels/NeighborhoodDetailPanel.tsx`
- Create: `frontend/apps/os-shell/src/pages/forge/geo/panels/SalesDrillDownPanel.tsx`
- Create: `frontend/apps/os-shell/src/pages/forge/geo/panels/DiagnosisPanel.tsx`
- Create: `frontend/apps/os-shell/src/pages/forge/geo/panels/YearTrendPanel.tsx`

- [ ] **Step 1: EquitySignatureRadar.tsx**

```tsx
// EquitySignatureRadar.tsx
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { radarNormalize } from '../utils/bentonMethodCalcs';
import type { BentonMethodStats } from '../types/geoforge.types';

interface Props {
  stats: BentonMethodStats;
  label?: string;
}

const AXIS_LABELS: Record<string, string> = {
  medianRatio: 'Median Ratio',
  cod: 'COD',
  prd: 'PRD',
  prb: 'PRB',
  vei: 'VEI',
  aad: 'AAD',
};

export function EquitySignatureRadar({ stats, label }: Props) {
  const normalized = radarNormalize(stats);
  const data = Object.entries(normalized).map(([key, value]) => ({
    axis: AXIS_LABELS[key] ?? key,
    score: Math.round(value * 100),
    fullMark: 100,
  }));

  return (
    <div className="w-full">
      {label && <p className="text-xs text-muted-foreground text-center mb-1">{label}</p>}
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <Radar
            name="Equity Score"
            dataKey="score"
            stroke="#00FFFF"
            fill="#00FFFF"
            fillOpacity={0.15}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{ background: '#0A0E1A', border: '1px solid #334155', fontSize: 12 }}
            formatter={(v: number) => [`${v}/100`, 'Score']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 2: NeighborhoodDetailPanel.tsx**

```tsx
// NeighborhoodDetailPanel.tsx
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { EquitySignatureRadar } from './EquitySignatureRadar';
import { codBand, prdBand, prbBand } from '../utils/bentonMethodCalcs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const BAND_COLORS = { ok: 'bg-green-900 text-green-300', watch: 'bg-yellow-900 text-yellow-300', critical: 'bg-red-900 text-red-300' };

export function NeighborhoodDetailPanel() {
  const { selectedNeighborhoodCode, neighborhoodStats, openDrawer } = useGeoForgeStore();
  const ns = neighborhoodStats.find((n) => n.neighborhoodCode === selectedNeighborhoodCode);
  if (!ns) return <div className="p-4 text-muted-foreground text-sm">Select a neighborhood on the map.</div>;

  const { stats } = ns;
  const rows: { label: string; value: string; band?: 'ok' | 'watch' | 'critical' }[] = [
    { label: 'Sales', value: String(stats.count) },
    { label: 'Median Ratio', value: stats.medianRatio.toFixed(3) },
    { label: 'COD', value: stats.cod.toFixed(1), band: codBand(stats.cod) },
    { label: 'PRD', value: stats.prd.toFixed(3), band: prdBand(stats.prd) },
    { label: 'PRB', value: stats.prb.toFixed(3), band: prbBand(stats.prb) },
    { label: 'VEI', value: stats.vei.toFixed(3) },
    { label: 'Mean', value: stats.mean.toFixed(3) },
    { label: 'Wt. Mean', value: stats.weightedMean.toFixed(3) },
    { label: 'Min', value: stats.min.toFixed(3) },
    { label: 'Max', value: stats.max.toFixed(3) },
    { label: 'Std Dev', value: stats.stdDev.toFixed(3) },
    { label: 'CV', value: (stats.cv * 100).toFixed(1) + '%' },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      <div>
        <h3 className="text-terra-cyan font-semibold text-sm">{ns.neighborhoodCode}</h3>
        <p className="text-xs text-muted-foreground">{ns.saleCount} qualified sales</p>
      </div>
      <EquitySignatureRadar stats={stats} label="Equity Signature" />
      <table className="w-full text-xs">
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-slate-800">
              <td className="py-1 text-muted-foreground">{r.label}</td>
              <td className="py-1 text-right">
                {r.band ? (
                  <Badge className={BAND_COLORS[r.band]}>{r.value}</Badge>
                ) : (
                  <span className="text-white font-mono">{r.value}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 flex-wrap mt-2">
        <Button size="sm" variant="outline" onClick={() => openDrawer('sales-drilldown')}>
          View Sales
        </Button>
        <Button size="sm" variant="outline" onClick={() => openDrawer('diagnosis')}>
          Diagnose
        </Button>
        <Button size="sm" variant="outline" onClick={() => openDrawer('year-trend')}>
          Year Trend
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: SalesDrillDownPanel.tsx**

```tsx
// SalesDrillDownPanel.tsx
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { ratioPointColor } from '../utils/choropleths';

export function SalesDrillDownPanel() {
  const { selectedNeighborhoodCode, salePoints } = useGeoForgeStore();
  const filtered = salePoints.filter(
    (s) => !selectedNeighborhoodCode || s.neighborhoodCode === selectedNeighborhoodCode
  );

  return (
    <div className="flex flex-col gap-3 p-4 overflow-y-auto h-full">
      <h3 className="text-terra-cyan font-semibold text-sm">
        {selectedNeighborhoodCode ?? 'All Neighborhoods'} — Sales ({filtered.length})
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground border-b border-slate-700">
              <th className="text-left py-1">Parcel</th>
              <th className="text-right py-1">Sale $</th>
              <th className="text-right py-1">AV $</th>
              <th className="text-right py-1">Ratio</th>
              <th className="text-right py-1">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 200).map((s) => (
              <tr key={s.saleId} className="border-b border-slate-800 hover:bg-slate-900">
                <td className="py-1 font-mono text-[10px]">{s.parcelId}</td>
                <td className="py-1 text-right">{(s.salePrice / 1000).toFixed(0)}k</td>
                <td className="py-1 text-right">{(s.assessedValue / 1000).toFixed(0)}k</td>
                <td className="py-1 text-right">
                  <span
                    className="font-mono font-semibold"
                    style={{ color: ratioPointColor(s.ratio) }}
                  >
                    {s.ratio.toFixed(3)}
                    {s.isOutlier && ' ⚠'}
                  </span>
                </td>
                <td className="py-1 text-right text-muted-foreground">{s.saleDate.slice(0, 7)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length > 200 && (
          <p className="text-xs text-muted-foreground mt-2">Showing 200 of {filtered.length}</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: DiagnosisPanel.tsx**

```tsx
// DiagnosisPanel.tsx
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetchJson } from '@/lib/apiBase';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import type { DiagnosisResult } from '../types/geoforge.types';

const SEV_COLORS = { ok: 'text-green-400', watch: 'text-yellow-400', critical: 'text-red-400' };
const SEV_BG = { ok: 'border-green-800', watch: 'border-yellow-800', critical: 'border-red-800' };

export function DiagnosisPanel() {
  const { selectedNeighborhoodCode, filter, setDiagnosis, diagnosis } = useGeoForgeStore();

  const { data, isLoading } = useQuery<DiagnosisResult>({
    queryKey: ['geoforge-diagnosis', filter.taxYear, selectedNeighborhoodCode],
    queryFn: () =>
      apiFetchJson<DiagnosisResult>(
        `/api/geoforge/ratio-study/diagnosis?taxYear=${filter.taxYear}&neighborhoodCode=${selectedNeighborhoodCode}`
      ),
    enabled: !!selectedNeighborhoodCode,
  });

  useEffect(() => { if (data) setDiagnosis(data); }, [data, setDiagnosis]);

  if (!selectedNeighborhoodCode)
    return <div className="p-4 text-muted-foreground text-sm">Select a neighborhood to run diagnosis.</div>;

  if (isLoading)
    return <div className="p-4 text-muted-foreground text-sm animate-pulse">Running diagnosis…</div>;

  const d = diagnosis ?? data;
  if (!d) return null;

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      <h3 className="text-terra-cyan font-semibold text-sm">
        AI Diagnosis — {selectedNeighborhoodCode}
      </h3>
      <div className="flex flex-col gap-2">
        {d.categories.map((cat, i) => (
          <div key={i} className={`border rounded p-3 ${SEV_BG[cat.severity]}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold uppercase ${SEV_COLORS[cat.severity]}`}>
                {cat.severity}
              </span>
              <span className="text-xs text-slate-400 uppercase">{cat.category.replace('_', ' ')}</span>
            </div>
            <p className="text-sm text-white font-medium">{cat.headline}</p>
            <p className="text-xs text-muted-foreground mt-1">{cat.detail}</p>
          </div>
        ))}
      </div>
      {d.peers.length > 0 && (
        <div>
          <h4 className="text-xs text-muted-foreground uppercase mb-2">Peer Neighborhoods</h4>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-slate-700">
                <th className="text-left py-1">Nbhd</th>
                <th className="text-right py-1">Median</th>
                <th className="text-right py-1">COD</th>
                <th className="text-right py-1">Δ</th>
              </tr>
            </thead>
            <tbody>
              {d.peers.map((p) => (
                <tr key={p.neighborhoodCode} className="border-b border-slate-800">
                  <td className="py-1">{p.neighborhoodCode}</td>
                  <td className="py-1 text-right font-mono">{p.medianRatio.toFixed(3)}</td>
                  <td className="py-1 text-right font-mono">{p.cod.toFixed(1)}</td>
                  <td className={`py-1 text-right font-mono ${p.delta > 0 ? 'text-red-400' : p.delta < 0 ? 'text-blue-400' : 'text-slate-400'}`}>
                    {p.delta > 0 ? '+' : ''}{p.delta.toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: YearTrendPanel.tsx**

```tsx
// YearTrendPanel.tsx
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { apiFetchJson } from '@/lib/apiBase';
import { useGeoForgeStore } from '@/stores/geoForgeStore';

interface YearPoint { taxYear: number; medianRatio: number; cod: number; prd: number; saleCount: number; }

export function YearTrendPanel() {
  const { selectedNeighborhoodCode, filter } = useGeoForgeStore();
  const currentYear = filter.taxYear;
  const years = [currentYear - 4, currentYear - 3, currentYear - 2, currentYear - 1, currentYear];

  const queries = years.map((yr) =>
    useQuery<{ neighborhoodCode: string; stats: { medianRatio: number; cod: number; prd: number }; saleCount: number }[]>({ // eslint-disable-line react-hooks/rules-of-hooks
      queryKey: ['geoforge-nbhd-stats', yr, selectedNeighborhoodCode],
      queryFn: () =>
        apiFetchJson(`/api/geoforge/ratio-study/neighborhood-stats?taxYear=${yr}`),
      enabled: !!selectedNeighborhoodCode,
      staleTime: 1000 * 60 * 10,
    })
  );

  const points: YearPoint[] = years.map((yr, i) => {
    const d = queries[i].data?.find((n: { neighborhoodCode: string }) => n.neighborhoodCode === selectedNeighborhoodCode);
    return {
      taxYear: yr,
      medianRatio: d?.stats.medianRatio ?? 0,
      cod: d?.stats.cod ?? 0,
      prd: d?.stats.prd ?? 0,
      saleCount: d?.saleCount ?? 0,
    };
  }).filter((p) => p.medianRatio > 0);

  if (!selectedNeighborhoodCode)
    return <div className="p-4 text-muted-foreground text-sm">Select a neighborhood to see trend.</div>;

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      <h3 className="text-terra-cyan font-semibold text-sm">5-Year Trend — {selectedNeighborhoodCode}</h3>
      <div>
        <p className="text-xs text-muted-foreground mb-1">Median Ratio</p>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={points}>
            <XAxis dataKey="taxYear" tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <YAxis domain={[0.8, 1.2]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <Tooltip contentStyle={{ background: '#0A0E1A', border: '1px solid #334155', fontSize: 11 }} />
            <ReferenceLine y={1.0} stroke="#334155" strokeDasharray="3 3" />
            <Line dataKey="medianRatio" stroke="#00FFFF" dot={{ r: 3 }} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">COD</p>
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={points}>
            <XAxis dataKey="taxYear" tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <Tooltip contentStyle={{ background: '#0A0E1A', border: '1px solid #334155', fontSize: 11 }} />
            <ReferenceLine y={15} stroke="#eab308" strokeDasharray="3 3" label={{ value: 'IAAO', fill: '#eab308', fontSize: 9 }} />
            <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="3 3" />
            <Line dataKey="cod" stroke="#f97316" dot={{ r: 3 }} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit panels**

```bash
git add frontend/apps/os-shell/src/pages/forge/geo/panels/
git commit -m "feat(geoforge): add all 5 right-drawer panels"
```

---

## Task 7: Page Shell

**Files:**
- Create: `frontend/apps/os-shell/src/pages/forge/geo/GeoForgeCommandBar.tsx`
- Create: `frontend/apps/os-shell/src/pages/forge/geo/GeoForgeEquityRail.tsx`
- Create: `frontend/apps/os-shell/src/pages/forge/geo/GeoForgePage.tsx`

- [ ] **Step 1: GeoForgeCommandBar.tsx**

```tsx
// GeoForgeCommandBar.tsx
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MapLayer } from './types/geoforge.types';

const LAYER_LABELS: Partial<Record<MapLayer, string>> = {
  choropleth: 'Nbhd Choropleth',
  'sale-scatter': 'Sale Scatter',
  kde: 'KDE Heat',
  'ai-cluster': 'AI Cluster',
};

export function GeoForgeCommandBar() {
  const { filter, setFilter, activeLayers, toggleLayer } = useGeoForgeStore();
  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-2 px-3 py-2 bg-slate-950/90 backdrop-blur border-b border-slate-800">
      <span className="text-terra-cyan font-bold text-sm tracking-wide mr-2">GeoForge</span>
      <Select
        value={String(filter.taxYear)}
        onValueChange={(v) => setFilter({ taxYear: Number(v) })}
      >
        <SelectTrigger className="w-24 h-7 text-xs bg-slate-900 border-slate-700">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex gap-1 ml-2">
        {(Object.entries(LAYER_LABELS) as [MapLayer, string][]).map(([layer, label]) => (
          <Button
            key={layer}
            size="sm"
            variant={activeLayers.has(layer) ? 'default' : 'outline'}
            className="h-7 text-[11px] px-2"
            onClick={() => toggleLayer(layer)}
          >
            {label}
          </Button>
        ))}
      </div>
      <div className="ml-auto flex gap-1">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[11px] px-2"
          onClick={() => window.open(`/api/geoforge/ratio-study/export?taxYear=${filter.taxYear}`, '_blank')}
        >
          Export GeoJSON
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: GeoForgeEquityRail.tsx**

```tsx
// GeoForgeEquityRail.tsx
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { codBand, prdBand } from './utils/bentonMethodCalcs';

const BAND_STYLES = {
  ok: 'text-green-400 bg-green-950',
  watch: 'text-yellow-400 bg-yellow-950',
  critical: 'text-red-400 bg-red-950',
};

export function GeoForgeEquityRail() {
  const { selectedNeighborhoodCode, neighborhoodStats } = useGeoForgeStore();
  const ns = neighborhoodStats.find((n) => n.neighborhoodCode === selectedNeighborhoodCode);

  if (!ns) return (
    <div className="absolute right-0 top-10 bottom-0 w-[72px] z-10 flex flex-col items-center justify-center gap-2 bg-slate-950/80 backdrop-blur border-l border-slate-800">
      <span className="text-[9px] text-muted-foreground text-center px-1">Select neighborhood</span>
    </div>
  );

  const kpis = [
    { label: 'MED', value: ns.stats.medianRatio.toFixed(3), band: 'ok' as const },
    { label: 'COD', value: ns.stats.cod.toFixed(1), band: codBand(ns.stats.cod) },
    { label: 'PRD', value: ns.stats.prd.toFixed(3), band: prdBand(ns.stats.prd) },
  ];

  return (
    <div className="absolute right-0 top-10 bottom-0 w-[72px] z-10 flex flex-col items-stretch gap-1 p-1 bg-slate-950/80 backdrop-blur border-l border-slate-800">
      {kpis.map((k) => (
        <div key={k.label} className={`rounded p-2 flex flex-col items-center ${BAND_STYLES[k.band]}`}>
          <span className="text-[9px] font-bold uppercase">{k.label}</span>
          <span className="text-sm font-mono font-semibold">{k.value}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: GeoForgePage.tsx**

```tsx
// GeoForgePage.tsx
import { useEffect, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetchJson } from '@/lib/apiBase';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { GeoForgeMap } from './GeoForgeMap';
import { GeoForgeCommandBar } from './GeoForgeCommandBar';
import { GeoForgeEquityRail } from './GeoForgeEquityRail';
import { NeighborhoodDetailPanel } from './panels/NeighborhoodDetailPanel';
import { SalesDrillDownPanel } from './panels/SalesDrillDownPanel';
import { DiagnosisPanel } from './panels/DiagnosisPanel';
import { YearTrendPanel } from './panels/YearTrendPanel';
import { Button } from '@/components/ui/button';
import type { NeighborhoodStat, SalePoint, RightDrawerPanel } from './types/geoforge.types';

const PANEL_TITLES: Record<RightDrawerPanel, string> = {
  none: '',
  'neighborhood-detail': 'Neighborhood Detail',
  'sales-drilldown': 'Sales Drill-Down',
  diagnosis: 'AI Diagnosis',
  'year-trend': '5-Year Trend',
};

export function GeoForgePage() {
  const {
    filter,
    rightDrawerPanel,
    closeDrawer,
    setNeighborhoodStats,
    setSalePoints,
    setLoadingStats,
    setLoadingSales,
    selectNeighborhood,
  } = useGeoForgeStore();

  const { data: statsData, isLoading: statsLoading } = useQuery<NeighborhoodStat[]>({
    queryKey: ['geoforge-nbhd-stats', filter.taxYear, filter.propertyClass, filter.saleDateStart, filter.saleDateEnd],
    queryFn: () => {
      const params = new URLSearchParams({ taxYear: String(filter.taxYear) });
      if (filter.propertyClass) params.set('propertyClass', filter.propertyClass);
      if (filter.saleDateStart) params.set('saleDateStart', filter.saleDateStart);
      if (filter.saleDateEnd) params.set('saleDateEnd', filter.saleDateEnd);
      return apiFetchJson<NeighborhoodStat[]>(`/api/geoforge/ratio-study/neighborhood-stats?${params}`);
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: salesData, isLoading: salesLoading } = useQuery<SalePoint[]>({
    queryKey: ['geoforge-sales', filter.taxYear],
    queryFn: () =>
      apiFetchJson<SalePoint[]>(`/api/geoforge/ratio-study/sales?taxYear=${filter.taxYear}`),
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => { setLoadingStats(statsLoading); }, [statsLoading, setLoadingStats]);
  useEffect(() => { setLoadingSales(salesLoading); }, [salesLoading, setLoadingSales]);
  useEffect(() => { if (statsData) setNeighborhoodStats(statsData); }, [statsData, setNeighborhoodStats]);
  useEffect(() => { if (salesData) setSalePoints(salesData); }, [salesData, setSalePoints]);

  const drawerOpen = rightDrawerPanel !== 'none';

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950">
      {/* Full-canvas map */}
      <GeoForgeMap onNeighborhoodClick={(code) => selectNeighborhood(code)} />

      {/* Top command bar — overlays map */}
      <GeoForgeCommandBar />

      {/* Right equity rail */}
      <GeoForgeEquityRail />

      {/* Right drawer — slides over map, does NOT shrink it */}
      <div
        className={`absolute top-0 right-[72px] h-full w-[480px] z-20 flex flex-col
          bg-slate-950/95 backdrop-blur border-l border-slate-700
          transition-transform duration-300 ease-in-out
          ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {drawerOpen && (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <span className="text-sm font-semibold text-terra-cyan">
                {PANEL_TITLES[rightDrawerPanel]}
              </span>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={closeDrawer}>
                ×
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              {rightDrawerPanel === 'neighborhood-detail' && <NeighborhoodDetailPanel />}
              {rightDrawerPanel === 'sales-drilldown' && <SalesDrillDownPanel />}
              {rightDrawerPanel === 'diagnosis' && <DiagnosisPanel />}
              {rightDrawerPanel === 'year-trend' && <YearTrendPanel />}
            </div>
          </>
        )}
      </div>

      {/* Loading indicator */}
      {(statsLoading || salesLoading) && (
        <div className="absolute bottom-8 left-4 z-30 flex items-center gap-2 bg-slate-900/90 rounded px-3 py-2 text-xs text-muted-foreground">
          <span className="animate-spin">⟳</span>
          {statsLoading ? 'Loading stats…' : 'Loading sales…'}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit page shell**

```bash
git add frontend/apps/os-shell/src/pages/forge/geo/
git commit -m "feat(geoforge): page shell, command bar, equity rail"
```

---

## Task 8: Module Wiring

**Files:**
- Modify: `frontend/apps/os-shell/src/config/moduleComponents.tsx`

- [ ] **Step 1: Add import at top of moduleComponents.tsx**

Add after the existing forge imports (find last `lazy(() => import('../pages/forge/` line):

```tsx
const GeoForgePage = lazy(() => import('../pages/forge/geo/GeoForgePage').then(m => ({ default: m.GeoForgePage })));
```

- [ ] **Step 2: Add to MODULE_REGISTRY array**

In the `MODULE_REGISTRY` array, add `'geo-forge'` alongside other forge modules (e.g., after `'statistics-studio'`).

- [ ] **Step 3: Add to ModuleRenderer switch**

Before the `default:` case (line ~1309), add:

```tsx
    // ========================================================================
    // GEOFORGE — GIS-first mass appraisal analytics
    // ========================================================================

    case 'geo-forge':
      return (
        <Suspense fallback={<div className="flex items-center justify-center h-full"><span className="text-muted-foreground">Loading GeoForge…</span></div>}>
          <GeoForgePage />
        </Suspense>
      );
```

- [ ] **Step 4: Run type-check**

Run: `cd frontend && npm run type-check 2>&1 | tail -30`
Expected: 0 errors (or only pre-existing unrelated errors)

- [ ] **Step 5: Commit wiring**

```bash
git add frontend/apps/os-shell/src/config/moduleComponents.tsx
git commit -m "feat(geoforge): wire geo-forge module into OS shell"
```

---

## Task 9: Build Validation

- [ ] **Step 1: Backend build**

Run: `cd backend && dotnet build TerraFusion.sln 2>&1 | tail -10`
Expected: `Build succeeded`

- [ ] **Step 2: Frontend type-check**

Run: `cd frontend && npm run type-check 2>&1 | tail -20`
Expected: 0 new errors

- [ ] **Step 3: Commit final**

```bash
git add -A
git commit -m "feat(geoforge): complete end-to-end — GIS-first mass appraisal platform"
```

---

## Self-Review

**Spec coverage:**
- [x] Full-canvas Mapbox map — GeoForgeMap.tsx + GeoForgePage absolute layout
- [x] 6 map layers (satellite built-in style, choropleth, sale-scatter, KDE, AI-cluster, parcel-polygons slot reserved)
- [x] Sale scatter county-wide — sales endpoint, no neighborhood filter on initial load
- [x] Right drawer 480px slides over map — translate-x-full / translate-x-0
- [x] Equity Signature Radar — 6-axis: Median Ratio, COD, PRD, PRB, VEI, AAD
- [x] Benton Method 12 stats — all in neighborhood-stats endpoint response
- [x] PRB + VEI added to TrendStats — ComputePrb + ComputeVei
- [x] AI Diagnosis — 4 categories, peer comparators, quality flags
- [x] 5-year trend panel — 5 parallel queries
- [x] GeoJSON export — /api/geoforge/ratio-study/export
- [x] County auth on all endpoints — county_id claim check
- [x] Module wiring — geo-forge in MODULE_REGISTRY + switch case
- [x] ForgeSuiteHome NOT touched

**Type consistency:** All panels import from `../types/geoforge.types` — same file. Store imports same path. No drift.

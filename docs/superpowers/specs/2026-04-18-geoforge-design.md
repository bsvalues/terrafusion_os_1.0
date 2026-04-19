# GeoForge Design Spec

**Date:** 2026-04-18  
**Status:** Approved — Ready for Implementation Planning  
**Replaces:** Statistics Studio (`statistics-studio` module) + TerraGAMA (`terra-gama` module)  
**Suite:** TerraForge (Forge suite, port 5000 backend)

---

## What GeoForge Is

GeoForge is a GIS-driven mass appraisal analytics platform — the full merger of Statistics Studio and TerraGAMA into one surface. It is the primary tool the Benton County Assessor uses to conduct, review, and certify the annual ratio study.

The core design principle: **the map IS the navigation**. You do not switch between a GIS view and a stats view. Both are always live, always synchronized, always one surface.

GeoForge implements the **Benton Method** — a ratio study framework that exceeds IAAO standards. It measures 12 statistics per neighborhood plus PRB and VEI (J. Wayne Moore's Vertical Equity Index), at granularities that CAMA software does not support: neighborhood, city rollup, and county-wide.

---

## Architecture

### What GeoForge consumes

| Data source | What it provides | How accessed |
|---|---|---|
| **TerraAtlas ArcGIS Layer 3** | Neighborhood polygon GeoJSON (NEIGHBORHOOD_CODE, NEIGHBORHOOD_NAME, MARKET_AREA, LAND_CLASS) | `GET /api/atlas/gis/spatial-query?layer=Neighborhoods` |
| **TerraForge neighborhood stats** | All 12 Benton Method stats + PRB + VEI per neighborhood | `GET /api/terraforge/ratio-study/neighborhood-stats?taxYear=Y` (**new endpoint — see below**) |
| **TerraForge existing endpoints** | County-wide COD/PRD/trends/diagnostics/calibration | `GET /api/terraforge/ratio-study/*` (existing — preserved from Statistics Studio) |
| **ComparableSales table** | Individual qualifying sale records (address, sale price, AV, ratio, date, quintile) | `GET /api/terraforge/ratio-study/sales?neighborhood=KW-302&taxYear=2025` (**new endpoint**) |
| **TerraAtlas AssessorPropVal FeatureServer** | Parcel polygon GeoJSON for individual sale drill-down | Existing `atlasService.searchMassAppraisalParcels()` |

### What GeoForge retires

- `TerraGamaPage.tsx` — SVG fake map, 8 hardcoded parcels, zero API calls. Deleted.
- `GamaMap.tsx` — SVG map component. Deleted.
- `SmartFilterBar.tsx` — TerraGAMA filter bar. Deleted.
- `StatisticsStudio.tsx` — 11-tab orchestrator. Retired; its real API connections are preserved and re-wired into GeoForge.
- Module registrations for `terra-gama` and `statistics-studio` replaced by `geo-forge`.

### Map library

**Mapbox GL JS** (v3.20.0) — already installed, already used in `PropertyAtlas.tsx` and `BentonCountyMap.tsx`. GeoForge uses Mapbox GL for the neighborhood choropleth layer. No new map dependency required.

### Module registration

```json
{
  "id": "geo-forge",
  "displayName": "GeoForge",
  "status": "beta",
  "suite": "forge",
  "icon": "MapPin",
  "type": "route",
  "route": "/forge/geoforge",
  "autostart": false,
  "runnable": true
}
```

---

## The Canvas — Primary Surface

GeoForge has one surface with four zones. No tabs. No mode switching.

```
┌─ titlebar (36px) ──────────────────────────────────────────────┐
├─ command bar (44px) ───────────────────────────────────────────┤
│  ⌘K input │ metric pills │ year scrubber │ ✦ Draft Report     │
├──┬─────────────────────────────────────┬──────────────────────┤
│  │                                     │                      │
│tb│         MAP  (choropleth)           │   STATS TABLE        │
│  │         neighborhood polygons       │   sortable · synced  │
│  │         bloom card on click         │   city rollups       │
│  │         legend · scale · N arrow   │   (320px fixed)      │
│  │                                     │                      │
├──┴─────────────────────────────────────┴──────────────────────┤
│  EQUITY RAIL (44px) — all neighborhoods as bars · IAAO line   │
└────────────────────────────────────────────────────────────────┘
```

### Zone 1: Command Bar

- **⌘K input** — natural language command bar (see Command Intelligence section)
- **Metric pills** — COD · PRD · PRB · VEI · Median Ratio. Clicking any pill repaints the entire map choropleth using that metric. Active pill is cyan. PRD shows a count of failing neighborhoods in the pill label.
- **Year scrubber** — pills for 2021 · 2022 · 2023 · 2024 · 2025. Clicking a year re-fetches all ratio data for that tax year and repaints map + table simultaneously.
- **✦ Draft Report button** — triggers AI narrative generation (see Report section).

### Zone 2: Left Toolbar (40px)

Icon buttons selecting secondary map modes:
- Choropleth metric selector (mirrors metric pills)
- Outlier flag overlay (highlights neighborhoods with flagged sales)
- Time animation (plays 2021→2025 year scrubber as animation)
- Layer selector (toggle neighborhood boundaries, parcel polygons, city boundaries)
- Side-by-side compare mode (splits map for year-over-year)

### Zone 3: Map (choropleth + bloom)

**Choropleth layer:** Neighborhood polygon GeoJSON from TerraAtlas Layer 3, colored by the active metric using a 6-stop scale:

| COD range | Color | Label |
|---|---|---|
| < 8 | `#064e3b` | Excellent |
| 8–10 | `#065f46` | Good |
| 10–12 | `#166534` | OK |
| 12–15 | `#78350f` | Watch |
| 15–18 | `#7f1d1d` | Fail IAAO |
| > 18 | `#991b1b` | Critical |

PRD, VEI, Median Ratio each have their own 6-stop scale keyed to Benton Method thresholds.

**Neighborhood Bloom Card:** Clicking any polygon triggers a floating card that appears over the map at the click location. The card shows:
- Neighborhood code + name (header, cyan)
- Meta: n sales · tax year
- Equity Signature radar (54×54px hexagonal, 6-axis)
- 5 key stats with threshold bar and IAAO badge: Median Ratio, COD, PRD, PRB, VEI
- "+ 7 more →" link expands to full 12-stat panel
- Footer: sale count · date range · "View all sales →" link

Clicking outside the card or another polygon closes current bloom and opens new one.

**Map decorations:** Legend (bottom-left), Scale bar (bottom-right), N arrow (top-right), Columbia River and city boundary labels as static SVG overlays.

**Sync:** Clicking a polygon highlights the corresponding row in the stats table and scrolls it into view.

### Zone 4: Stats Table (320px right panel)

Always-visible sortable table of all neighborhoods. Structure:

- **City rollup rows** (bold, slightly elevated background): one per city (Kennewick, Richland, West Richland, Benton City, Prosser, rural). Show aggregated stats for the city.
- **Neighborhood rows**: one per neighborhood, indented under city.
- **Columns**: Neighborhood name · COD · PRD · VEI · n. Clicking any column header sorts ascending/descending; the map repaints to match sorted order.
- **Highlighted row**: currently selected neighborhood shown with cyan left border and background tint.
- **Sync**: clicking any row pans + highlights the corresponding polygon on the map.
- **Expand row**: clicking a neighborhood row expands an inline drawer showing the full 12-stat breakdown + individual sales table.

### Zone 5: Equity Rail (44px bottom)

A horizontal strip showing every neighborhood as a proportional colored bar, sorted left-to-right by the active metric (best → worst). The IAAO threshold is drawn as a vertical red line dividing passing from failing neighborhoods. Benton Method threshold shown as a second line (tighter).

- Hovering a bar shows a tooltip with neighborhood name + metric value.
- Clicking a bar selects that neighborhood (syncs map + table).
- Dragging to select a range filters the table and dims non-selected polygons on the map.
- "Compare Years" button and "Export" button are right-aligned in the rail.

---

## The Benton Method Analytics

### 12 Core Statistics (computed per neighborhood, city rollup, county-wide)

| # | Stat | Definition | Benton threshold | IAAO threshold |
|---|---|---|---|---|
| 1 | **Lo Range** | Minimum ratio observed | — | — |
| 2 | **Hi Range** | Maximum ratio observed | — | — |
| 3 | **Mean** | Arithmetic mean of ratios | — | — |
| 4 | **Median Ratio** | Middle value of sorted ratios | 0.95–1.05 | 0.90–1.10 |
| 5 | **Aggregate Mean** | Total AV ÷ Total Sale Price (weighted) | 0.95–1.05 | — |
| 6 | **Variance** | σ² of ratio distribution | — | — |
| 7 | **Std Deviation** | σ | — | — |
| 8 | **Coeff of Variation** | σ ÷ mean × 100 | — | — |
| 9 | **AAD** | Average Absolute Deviation from median | — | — |
| 10 | **COD** | AAD ÷ Median × 100 | **≤ 12** | ≤ 15 |
| 11 | **PRD** | Mean ÷ Weighted Mean | **0.99–1.02** | 0.98–1.03 |
| 12 | **Count** | Qualifying arms-length sales | min 5 | min 5 |

### Beyond-IAAO Benton Metrics

**PRB (Price-Related Bias)**  
Regression-based test of vertical equity. Regresses (ratio − median) against ln(sale price / 2). Coefficient = PRB. Pass: |PRB| ≤ 0.05.

**VEI — Vertical Equity Index (J. Wayne Moore)**  
Sales sorted ascending by sale price, divided into 5 equal quintiles. QMR (Quintile Mean Ratio) = mean ratio within each quintile.

```
VEI = |max(QMR) − min(QMR)| / mean(5 QMRs) × 100
```

Pass: VEI < 10. Lower = better vertical equity (no differential treatment by value tier).

The quintile breakdown table is shown in the full neighborhood detail panel: 5 QMR values with bar visualization, trend direction (low-value vs high-value slope), and VEI result box with formula.

### IAAO vs Benton pass/fail display

Every stat in every panel shows two badge states:
- `IAAO ✓` / `IAAO ✗` — IAAO standard
- `BENTON ✓` / `BENTON ✗` — Benton Method threshold (tighter)

A neighborhood can pass IAAO but fail Benton. Both are shown. The choropleth coloring uses the **Benton** threshold.

---

## Equity Signature Radar

Every neighborhood has a hexagonal radar chart with 6 axes — the 6 **equity indicators** from the 12-stat set. The remaining 6 (Lo Range, Hi Range, Mean, Aggregate Mean, Variance, SD, CV) are descriptive/distributional stats shown in the stat block grid, but are not equity indicators and would clutter the radar without adding signal.

**6 radar axes:**
- Median Ratio (12 o'clock)
- COD (2 o'clock)
- PRD (4 o'clock)
- PRB (6 o'clock, purple — Benton-only)
- VEI (8 o'clock, purple — Benton-only)
- AAD (10 o'clock)

Each axis is normalized: center = worst possible value for that metric, outer ring = best. A perfect neighborhood draws a regular hexagon. Distorted shape = inequity. Purple axes visually distinguish Benton Method metrics from IAAO metrics.

Shown in two sizes:
- **Mini (54×54px)**: inside the bloom card, floating over the map
- **Full (160×160px)**: in the expanded neighborhood detail panel

---

## Individual Sales Drill-Down

Accessible from the bloom card footer ("View all sales →") or by expanding a table row.

Panel shows:
- **Ratio distribution histogram** — bars colored green/yellow/red by ratio range, median line marked
- **Qualifying sales table** columns: Address · Sale Date · Sale Price · Assessed Value · Ratio · Flag
- **Flags**: OUTLIER (ratio < 0.75 or > 1.25), LO (ratio 0.75–0.85), HI (ratio 1.15–1.25), OK
- Outlier rows highlighted with red background tint
- Clicking any sale row navigates to that parcel in the TerraAtlas suite (cross-module link — opens TerraAtlas parcel view in a new window, does not navigate away from GeoForge)
- Sales sortable by any column
- Filter controls: date range, ratio range, show/hide outliers

---

## Year-Over-Year / Time Dimension

The year scrubber in the command bar controls what tax year all data is displayed for. Switching years:
1. Re-fetches ratio statistics for all neighborhoods for the selected year
2. Repaints the map choropleth with smooth color-morph transition
3. Updates the stats table
4. Updates the equity rail

The 5-year trend table (accessible via the toolbar time button) shows COD, PRD, VEI, Median Ratio, and failing neighborhood count for all 5 years simultaneously — delta arrows between years. This is the table the assessor brings to county commissioners to demonstrate revaluation cycle impact.

Year animation (toolbar ⏱ button): plays 2021 → 2025 automatically at 1.5s per year, repainting the map to show equity improvement over time.

---

## Command Intelligence (⌘K)

⌘K opens a command bar overlay. Supported commands (first implementation):

| Command | Map response | Table response |
|---|---|---|
| `show PRD failures` | Highlights failing polygons red, dims others | Filters to failing neighborhoods |
| `show [neighborhood] failures` | Same for any metric name | — |
| `compare [year] vs [year]` | Splits map left/right | Side-by-side columns in table |
| `compare KW-302 vs RP-401` | Zooms to both polygons, highlights | Shows both rows expanded |
| `highlight east market` / `north market` | Dims non-market polygons | Filters to market area |
| `find outlier sales in [neighborhood]` | Zooms to neighborhood | Opens sales drill-down with outliers highlighted |
| `rank by equity signature distortion` | Reorders choropleth by composite distortion | Sorts table by composite score |
| `draft ratio study narrative` | — | Opens report panel |
| `animate [year range]` | Plays year animation | — |

Commands are matched by keyword, not strict syntax. Implementation uses a simple keyword-to-action dispatch map (no LLM required for v1).

---

## Draft Report Generation

"✦ Draft Report" button (command bar, top-right) generates a formatted ratio study narrative section.

Output includes:
- **Assessment level** section: median ratio, comparison to IAAO standard, year-over-year trend
- **Uniformity** section: county-wide COD, neighborhood count by pass/fail tier, improvement from prior year
- **Vertical equity** section: PRD value and interpretation, PRB coefficient, VEI score per Moore methodology, neighborhoods flagged for calibration
- **Neighborhood detail** table: all neighborhoods with all 12 stats
- **Recommendations**: neighborhoods prioritized for next revaluation cycle (sorted by composite equity score)

Output rendered in a side panel. Actions: Copy · Export .docx · Print.

All numbers are live — pulled from the currently selected tax year's data. The narrative text uses template strings with real values interpolated.

---

## Tech Stack

| Concern | Technology |
|---|---|
| Map rendering | Mapbox GL JS 3.20.0 (already installed) |
| Neighborhood polygons | TerraAtlas ArcGIS Layer 3 → `/api/atlas/gis/spatial-query?layer=Neighborhoods` |
| Ratio statistics | TerraForge `/api/terraforge/ratio-study/*` endpoints (existing) |
| Individual sales | New endpoint: `GET /api/terraforge/ratio-study/sales?neighborhood=X&taxYear=Y` |
| State management | Zustand store: `useGeoForgeStore` (active metric, active year, selected neighborhood, filter state) |
| Data fetching | TanStack Query (existing pattern) |
| Charting (radar, histogram) | Recharts (existing) or SVG-native for radar |
| UI components | shadcn/ui + Radix (existing) |
| Styling | Tailwind CSS 4.1, Terra dark theme (`bg-terra-midnight`, `text-terra-cyan`) |

---

## New Backend Endpoints Required

Two endpoints not yet in the backend are needed. The existing `comparison-snapshots` endpoint only returns `{neighborhood_code, parcel_count, median_ratio, cod, prd, sale_count}` — insufficient for the Benton Method.

### Endpoint 1: Neighborhood Stats (all 12 Benton Method stats per neighborhood)

```
GET /api/terraforge/ratio-study/neighborhood-stats
  ?taxYear=2025
  &minSales=5          // minimum qualifying sales to include neighborhood

Response:
{
  "taxYear": 2025,
  "countyId": "19190019-1919-1919-1919-191919191919",
  "neighborhoods": [
    {
      "neighborhoodCode": "KW-302",
      "neighborhoodName": "Kennewick Central",
      "cityRollup": "KENNEWICK",
      "count": 124,
      "loRange": 0.741,
      "hiRange": 1.291,
      "mean": 0.981,
      "median": 0.973,
      "aggregateMean": 0.969,        // total AV / total sale price
      "variance": 0.00712,
      "stdDev": 0.0844,
      "coeffOfVariation": 8.61,
      "aad": 0.0637,
      "cod": 8.4,
      "prd": 1.031,
      "prb": -0.041,
      "vei": 4.2,
      "quintileMeanRatios": [0.988, 0.974, 0.972, 0.971, 0.961],
      "iaaoPassCod": true,
      "iaaoPassPrd": true,
      "bentonPassCod": true,         // Benton threshold ≤12
      "bentonPassPrd": true,         // Benton threshold 0.99–1.02
      "bentonPassPrb": true,
      "bentonPassVei": true
    }
  ]
}
```

Implementation: computed from `ComparableSales` table using existing `IPacsAdapter` pattern. PRB via OLS regression on qualifying sales. VEI per Moore formula.

### Endpoint 2: Individual Sales per Neighborhood

```
GET /api/terraforge/ratio-study/sales
  ?neighborhood=KW-302
  &taxYear=2025
  &includeOutliers=true

Response:
{
  "neighborhood": "KW-302",
  "taxYear": 2025,
  "totalSales": 124,
  "qualifyingSales": 121,
  "sales": [
    {
      "parcelId": "...",
      "address": "1104 W 4th Ave, Kennewick WA",
      "saleDate": "2024-04-15",
      "salePrice": 412000,
      "assessedValue": 401300,
      "ratio": 0.974,
      "flag": "OK",           // OK | LO | HI | OUTLIER
      "isOutlier": false,
      "quintile": 3
    }
  ]
}
```

All other required endpoints already exist in `TerraForgeController.cs` and `TerraFusionSyncController.cs`.

---

## File Structure

### New files (create)

```
frontend/apps/os-shell/src/pages/forge/geoforge/
  GeoForgePage.tsx                    — root component, layout grid
  GeoForgeMap.tsx                     — Mapbox GL choropleth, bloom card trigger
  GeoForgeBloomCard.tsx               — floating neighborhood detail card
  GeoForgeStatsTable.tsx              — right panel sortable table
  GeoForgeEquityRail.tsx              — bottom equity bar strip
  GeoForgeCommandBar.tsx              — ⌘K command overlay
  GeoForgeReportPanel.tsx             — draft report side panel
  GeoForgeYearScrubber.tsx            — year pill strip
  panels/
    NeighborhoodDetailPanel.tsx       — expanded 12-stat + quintile + sales
    SalesDrillDownPanel.tsx           — individual sales table + histogram
    YearTrendPanel.tsx                — 5-year comparison table
    EquitySignatureRadar.tsx          — hexagonal radar (mini + full sizes)
  hooks/
    useGeoForgeData.ts                — TanStack Query fetcher for all ratio data
    useNeighborhoodGeoJSON.ts         — fetches + caches TerraAtlas polygon layer
    useGeoForgeCommands.ts            — ⌘K command dispatch
  store/
    geoForgeStore.ts                  — Zustand: active metric, year, selection, filters
  utils/
    bentonMethodCalcs.ts              — VEI, PRB, equity signature normalization
    choropleths.ts                    — metric → color scale mappings
    reportTemplates.ts                — ratio study narrative template strings
  types/
    geoforge.types.ts                 — NeighborhoodStats, SaleRecord, GeoForgeMetric, etc.

backend/src/TerraFusion.API/Controllers/
  (extend TerraForgeController.cs)    — add /ratio-study/sales endpoint
```

### Modified files

```
frontend/apps/os-shell/src/
  Router.tsx                          — add /forge/geoforge route
  components/moduleComponents.tsx     — add geo-forge case, remove terra-gama + statistics-studio

terrafusion.app.json                  — add geo-forge module, mark terra-gama + statistics-studio deprecated
```

### Deleted files

```
frontend/apps/os-shell/src/pages/atlas/TerraGamaPage.tsx
frontend/apps/os-shell/src/components/atlas/GamaMap.tsx
frontend/apps/os-shell/src/components/atlas/SmartFilterBar.tsx
frontend/apps/os-shell/src/pages/forge/statistics/StatisticsStudio.tsx
  (and all child panels — preserved only if individual panels have reuse value)
```

---

## What GeoForge Does NOT Replace

- **TerraAtlas suite** — parcel browsing, sketch viewer, GIS layers, parcel search. GeoForge consumes TerraAtlas data but does not replace TerraAtlas.
- **TerraAtlas Mass Appraisal GIS module** — parcel-level GIS. GeoForge is neighborhood-level analytics.
- **TerraAtlas Geo Equity module** — geographic equity surface in the Atlas suite. Different audience, different granularity. GeoForge is the Forge suite tool; Geo Equity is the Atlas suite tool.
- **SalesForge AI Audit** — sale qualification and AI diagnosis. GeoForge consumes qualified sales; it does not re-implement the audit workflow.
- **CostForge** — cost approach analytics. GeoForge is the ratio study tool.

---

## Success Criteria

1. Benton County neighborhood polygons render on the Mapbox choropleth from real ArcGIS Layer 3 data
2. All 12 Benton Method stats compute correctly per neighborhood from real `ComparableSales` data
3. VEI computed per Moore's exact formula (`|max(QMR) − min(QMR)| / mean(QMRs) × 100`)
4. PRB computed via regression on qualifying sales
5. Clicking a polygon opens bloom card with correct stats + equity signature
6. Switching metric repaints map with correct color scale
7. Year scrubber switches all data to the selected tax year
8. Stats table and map stay in sync on all interactions (click polygon → highlight row, click row → highlight polygon)
9. Equity rail shows all neighborhoods sorted by active metric with IAAO and Benton threshold lines
10. Individual sales drill-down shows real Benton County sale addresses, prices, ratios, and outlier flags
11. Draft Report generates correct narrative with all live statistics interpolated
12. Statistics Studio and TerraGAMA modules are retired (no broken imports, no dead routes)

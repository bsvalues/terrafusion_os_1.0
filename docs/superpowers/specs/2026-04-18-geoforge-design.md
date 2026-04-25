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
| **ComparableSales table** | Individual qualifying sale records with parcel coordinates — county-wide | `GET /api/terraforge/ratio-study/sales?taxYear=2025&scope=county` (**new endpoint, county-wide**) |
| **Spatial query engine** | Buffer, transect, polygon, adjacency queries returning ad-hoc sale sets | `GET /api/terraforge/ratio-study/sales?scope=spatial&lat=&lng=&radiusMiles=` (**new**) |
| **GWR endpoint** | Geographically Weighted Regression surface (PRD/COD at every interpolated point) | `POST /api/terraforge/ratio-study/gwr` (**new, cached per year**) |
| **GIS export** | GeoJSON / Shapefile of neighborhoods + stats | `GET /api/terraforge/ratio-study/export?format=geojson|shapefile&taxYear=Y` (**new**) |
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

GeoForge has one surface. **The map is the workspace.** Stats are contextual surfaces that float over the map or anchor to the right edge — they do not permanently partition the canvas. No fixed side panels. No tabs. No mode switching.

```
┌─ titlebar (36px) ──────────────────────────────────────────────────┐
├─ command bar (44px) ───────────────────────────────────────────────┤
│  ⌘K input │ metric pills │ year scrubber │ ✦ Draft Report         │
├──┬─────────────────────────────────────────────────────────────────┤
│  │                                                                  │
│tb│    MAP  — full canvas, edge to edge                             │
│  │    neighborhood choropleth · sale-point scatter                 │
│  │    parcel polygons · context layers · clustering overlay        │
│  │                                                                  │
│  │   ┌──────────────────────┐   floating bloom card on click      │
│  │   │ KW-302 · Bloom Card  │   dismisses on click-away           │
│  │   │ radar · 5 stats      │                                      │
│  │   │ Details / Diagnose / │                                      │
│  │   │ View sales →         │                                      │
│  │   └──────────────────────┘                                      │
│  │                                                                  │
│  │                        ┌─ right drawer (480px, slides in) ────┐ │
│  │                        │ NeighborhoodDetailPanel              │ │
│  │                        │ OR SalesDrillDownPanel               │ │
│  │                        │ OR DiagnosisPanel                    │ │
│  │                        │ OR StatsTablePanel (default)         │ │
│  │                        │ OR ReportPanel                       │ │
│  │                        └──────────────────────────────────────┘ │
├──┴─────────────────────────────────────────────────────────────────┤
│  EQUITY RAIL (44px) — all neighborhoods as bars · IAAO/Benton line│
└────────────────────────────────────────────────────────────────────┘
```

**Right drawer** (480px) slides in from the right edge and overlays the map — it does not shrink the map canvas. The map remains fully interactive underneath. Default content is the stats table. Switching panels slides new content in; closing the drawer returns to full-canvas map view. This is what "the map IS the navigation" actually means.

### Zone 1: Command Bar

- **⌘K input** — natural language command bar (see Command Intelligence section)
- **Metric pills** — COD · PRD · PRB · VEI · Median Ratio. Clicking any pill repaints the entire map choropleth using that metric. Active pill is cyan. PRD shows a count of failing neighborhoods in the pill label.
- **Year scrubber** — pills for 2021 · 2022 · 2023 · 2024 · 2025. Clicking a year re-fetches all ratio data for that tax year and repaints map + table simultaneously.
- **✦ Draft Report button** — triggers AI narrative generation (see Report section).

### Zone 2: Left Toolbar (40px)

Icon buttons selecting secondary map modes:

| Button | What it does |
|---|---|
| **Metric** | Cycles through COD / PRD / PRB / VEI / Median Ratio as the active choropleth metric — mirrors command bar pills |
| **Sales** | Toggles the sale-point scatter layer on/off over the choropleth |
| **Parcels** | Toggles the parcel-polygon layer (pulled from TerraAtlas AssessorPropVal FeatureServer) for the selected neighborhood |
| **Layers** | Opens a layer-management drawer — full layer stack with toggles, opacity sliders, and source labels (see GIS Layer Stack section below) |
| **Time** | Plays 2021→2025 year animation at 1.5s/year, repaint-morphing the choropleth. Pre-fetches all 5 years before playing |
| **Compare** | Activates side-by-side split: two choropleth panels, independent year selectors |
| **Draw** | (v2 reserved, disabled in v1) Boundary draw tool for neighborhood split / reassign operations |

### Zone 3: Map — GIS Layer Stack

**The map is a live GIS layer stack, not a single choropleth.** Layers render from bottom to top. Each layer is independently toggleable. The assessor composes the view they need by toggling layers — the typical diagnostic view starts with choropleth + scatter to immediately see whether ratio failures are spatially clustered.

---

#### Layer 1 (base): Satellite / Basemap
Mapbox Satellite Streets basemap. Shows physical geography — Columbia River, irrigation canals, highway network, terrain — which is often the explanatory variable for spatial ratio clustering.

---

#### Layer 2: Neighborhood Polygons (choropleth)
**Source:** TerraAtlas ArcGIS Layer 3 — `GET /api/atlas/gis/spatial-query?layer=Neighborhoods`
**Fields used:** `NEIGHBORHOOD_CODE`, `NEIGHBORHOOD_NAME`, `MARKET_AREA`, `LAND_CLASS`

Fill color driven by active metric using 6-stop scale. Always on by default.

| COD range | Color | Label |
|---|---|---|
| < 8 | `#064e3b` | Excellent |
| 8–10 | `#065f46` | Good |
| 10–12 | `#166534` | OK |
| 12–15 | `#78350f` | Watch |
| 15–18 | `#7f1d1d` | Fail IAAO |
| > 18 | `#991b1b` | Critical |

PRD, VEI, Median Ratio, PRB each have their own 6-stop scale keyed to Benton Method thresholds. Polygon stroke is dim by default; brightens on hover and selection.

---

#### Layer 3: Sale-Point Scatter *(the critical GIS layer — county-wide)*

**Source:** `GET /api/terraforge/ratio-study/sales?taxYear=Y&scope=county&includeCoordinates=true`

**County-wide, not neighborhood-scoped.** All ~2,000 qualifying sales in the county are loaded on mount. At low zoom (county view), Mapbox cluster circles show sale count + dominant flag color per cluster. At street zoom, individual points render. This is essential — the assessor must be able to see cross-neighborhood patterns (e.g., outliers clustering along the I-82 corridor across KW-302, KW-303, and RP-205 simultaneously).

**Point color by ratio flag:**

| Flag | Color | Ratio range |
|---|---|---|
| OUTLIER | `#dc2626` red | < 0.75 or > 1.25 |
| HI | `#f97316` orange | 1.15–1.25 |
| OK | `#22c55e` green | 0.90–1.10 |
| LO | `#facc15` yellow | 0.75–0.85 |

Point radius encodes sale price (larger = higher sale price) — immediately visualizes whether high-value sales cluster geographically (stratification evidence).

**Interaction:**
- Hover: tooltip showing address, sale price, AV, ratio, date, neighborhood
- Click: opens a parcel mini-card with full sale record + "Open in TerraAtlas" link
- **Lasso across neighborhood boundaries**: drag-select any region, even one that spans multiple neighborhoods — the stats drawer updates to show computed stats for only the lassoed sales (ad-hoc submarket analysis without pre-defined boundaries)
- **Right-click any map location**: context menu shows "What's here?" — neighborhood code, market area, land class, nearest sale within 500ft with its ratio

**Toggle behavior:** When scatter is on, choropleth opacity drops to 0.4. When a single neighborhood is selected, non-selected neighborhood sales dim to 20% opacity, selected neighborhood sales stay full opacity.

---

#### Layer 3.5: KDE Ratio Surface (continuous heat map)

**Mode selector:** In the scatter toggle button, a sub-option switches between "Points" and "Heat." Heat mode replaces individual dots with a **Kernel Density Estimation surface** — a continuous color gradient showing ratio density across the county, not bounded by neighborhood polygons.

The KDE surface reveals what the choropleth cannot: ratio gradients that cross neighborhood lines, smooth transition zones vs. sharp discontinuities (sharp = likely boundary artifact; smooth = real market gradient), and areas of high sale density vs. sparse coverage.

KDE computed client-side from the loaded sale coordinates using Mapbox's built-in heatmap layer type — no additional backend call. Color scale: green (ratios near 1.0) → amber → red (ratios diverging from 1.0 in either direction), weighted by ratio deviation from 1.0.

---

#### Layer 4: Parcel Polygons (selected neighborhood only)
**Source:** TerraAtlas AssessorPropVal FeatureServer — existing `atlasService.searchMassAppraisalParcels()`
**Performance:** Only fetched and rendered for the currently-selected neighborhood — not county-wide. Loads on demand when user clicks a neighborhood polygon or selects from the table.

Parcel polygons can be colored by:
- **Ratio** (of most recent qualifying sale on that parcel) — if sold
- **AV** — assessed value heat
- **Land class** — from parcel feature data
- **"Not sold"** — gray, for parcels with no qualifying sale in the study period

This layer answers "which specific parcels drove the ratio failure?" It's the zoom level below neighborhood aggregates.

---

#### Layer 5: Context / Reference Layers (toggleable)
All toggled via the Layers drawer. Sources from TerraAtlas existing endpoints or static GeoJSON.

| Layer | Source | Value |
|---|---|---|
| **City boundaries** | TerraAtlas political boundary layer | Visualizes city rollup groupings |
| **Market areas** | `MARKET_AREA` field from Layer 3 — rendered as bold boundary strokes | Shows super-neighborhood groupings; equity issues sometimes follow market areas, not neighborhoods |
| **Land class** | `LAND_CLASS` from Layer 3 — color-coded fill | Reveals if ratio failures stratify along land-class lines |
| **FEMA flood zones** | FEMA NFHL public WMS | Flood-zone parcels often have differential ratio patterns |
| **New construction** (2022–2025) | Filter on `YearBuilt` from AssessorPropVal | Recent construction skews ratios; spatial cluster of new construction = likely ratio distortion |
| **Permit activity** | (future) county permit layer | |

---

#### Layer 5.5: Spatial Query Results (on-demand)

Activated by spatial query tools (see Spatial Query section below) or ⌘K spatial commands. Renders the results of a spatial query — buffer polygons, selected parcel sets, transect lines — as a temporary overlay. Cleared by pressing Escape or running a new query.

---

#### Layer 6: Geographic Clustering Overlay (AI-generated)
Rendered only when DiagnosisPanel is open for a neighborhood. The AI root-cause classifier computes spatial concentration of outlier/LO/HI sales using a simple convex hull or Moran's I spatial autocorrelation over the sale points. The result is rendered as:

- A **heat zone polygon** (translucent red) showing where outlier/failing sales cluster
- An **annotation pin** citing the clustering score: *"81% of outlier sales within 0.3 mi radius — NW quadrant near irrigation canal"*
- A **line annotation** if correlation with a linear feature (highway, canal, railway) is detected

This is the GIS layer that turns "COD is 14.5" into "the problem is spatially concentrated here, likely this external feature." It surfaces automatically when Diagnose is invoked; can be dismissed.

---

#### Parcel Coordinates in API responses

Sales endpoints must return `parcelLat`, `parcelLng` (parcel centroid from AssessorPropVal join) so the scatter layer can plot without a second client-side lookup:

```
// Extended sale record (add to both /sales and /diagnosis endpoints)
{
  "parcelId": "...",
  "parcelLat": 46.2112,
  "parcelLng": -119.1372,
  "address": "1104 W 4th Ave, Kennewick WA",
  ...
}
```

Backend resolves centroid once at query time from the spatial index — not per-client-request. Cached per parcel.

---

**Neighborhood Bloom Card:** Clicking any neighborhood polygon triggers a floating card that appears over the map at the click location. The card shows:
- Neighborhood code + name (header, cyan)
- Meta: n sales · tax year
- Equity Signature radar (54×54px hexagonal, 6-axis)
- 5 key stats with threshold bar and IAAO badge: Median Ratio, COD, PRD, PRB, VEI
- "Details →" link opens the full Neighborhood Detail Panel (same panel reached by expanding the stats-table row, described in Zone 4)
- "Diagnose →" link opens the AI Diagnosis Panel for this neighborhood (see AI Superpower Layer section)
- Footer: sale count · date range · "View sales →" link opens the Sales Drill-Down Panel

Clicking outside the card or another polygon closes current bloom and opens new one. The bloom card itself is a **peek** — the three deep links (Details / Diagnose / View sales) all transition into the right panel, which pins (replacing the stats table when open), allowing the map to remain interactive underneath.

**Map decorations:** Legend (bottom-left), Scale bar (bottom-right), N arrow (top-right), Columbia River and city boundary labels as static SVG overlays.

**Sync:** Clicking a polygon highlights the corresponding row in the stats table and scrolls it into view.

### Zone 4: Stats Table (320px right panel)

Always-visible sortable table of all neighborhoods. Structure:

- **City rollup rows** (bold, slightly elevated background): one per city (Kennewick, Richland, West Richland, Benton City, Prosser, rural). Show aggregated stats for the city.
- **Neighborhood rows**: one per neighborhood, indented under city.
- **Columns**: Neighborhood name · COD · PRD · VEI · n. Clicking any column header sorts ascending/descending; the map repaints to match sorted order.
- **Highlighted row**: currently selected neighborhood shown with cyan left border and background tint.
- **Sync**: clicking any row pans + highlights the corresponding polygon on the map.
- **Expand row**: clicking a neighborhood row opens the **Neighborhood Detail Panel** — the single canonical deep-dive surface (same panel opened by bloom-card "Details →"). The detail panel pins as a right drawer over the stats table; stats table re-appears when detail panel is dismissed.

**Panel hierarchy (one source of truth per content type):**

| Content | Panel component | Opened by |
|---|---|---|
| Full 12-stat + quintile breakdown + radar (full size) | `NeighborhoodDetailPanel` | Bloom "Details →" OR table row expand |
| Ratio histogram + sales list with flags | `SalesDrillDownPanel` | Bloom "View sales →" OR inside NeighborhoodDetailPanel tab |
| AI root-cause diagnosis + recommended actions | `DiagnosisPanel` | Bloom "Diagnose →" OR ⌘K "diagnose \[neighborhood]" |
| Report narrative | `ReportPanel` | Command bar "✦ Draft Report" |

All panels are mutually exclusive within the right-panel slot. Only one is mounted at a time to keep the interaction surface legible.

### Zone 5: Equity Rail (44px bottom)

A horizontal strip showing every neighborhood as a proportional colored bar, sorted left-to-right by the active metric (best → worst). The IAAO threshold is drawn as a vertical red line dividing passing from failing neighborhoods. Benton Method threshold shown as a second line (tighter).

- Hovering a bar shows a tooltip with neighborhood name + metric value.
- Clicking a bar selects that neighborhood (syncs map + table).
- Dragging to select a range filters the table and dims non-selected polygons on the map.
- "Compare Years" button and "Export" button are right-aligned in the rail.

---

## Spatial Query Tools

The map accepts direct spatial input — not just clicks on pre-defined polygons. These tools are in the left toolbar below the layer buttons.

### Buffer Query
Click the buffer tool, then click any point on the map. A radius slider appears (0.1 mi → 5 mi). GeoForge selects all sales within that radius and computes Benton Method stats for that ad-hoc spatial sample. The buffer circle renders on the map as Layer 5.5. Stats appear in the right drawer.

Use case: *"Show me all sales within 0.5 miles of the new I-82 interchange — are their ratios systematically different from the rest of the neighborhood?"*

```
GET /api/terraforge/ratio-study/sales
  ?taxYear=2025&scope=spatial
  &lat=46.2112&lng=-119.1372&radiusMiles=0.5
```

### Transect / Cross-Section
Click the transect tool, draw a line across the map (two-point click). GeoForge plots ratio values along that transect — a small line chart showing ratio on Y-axis and distance along transect on X-axis, with sale dots plotted at their projected positions. Shows how ratio changes spatially along any axis (e.g., downtown → suburban fringe).

Reveals: abrupt ratio discontinuities (sharp = likely neighborhood boundary artifact, may need boundary revision), smooth gradients (real market gradient, neighborhood boundary is arbitrary), convergence or divergence toward corridor endpoints.

### Adjacency Highlight
Right-click any neighborhood polygon → "Show adjacent neighborhoods." Highlights all neighborhoods sharing a boundary edge with the selected one, expands their stats in the right drawer for comparison. Checks whether equity problems respect or cross neighborhood boundaries — a key test for whether the boundary is correctly drawn.

### Free-Polygon Lasso
Draw any polygon on the map — not constrained to existing neighborhood boundaries. GeoForge computes Benton Method stats for all sales inside the polygon. This is the core tool for submarket hypothesis testing: *"What if I drew the boundary like this instead?"*

⌘K spatial commands (extends earlier table):

| Command | Action |
|---|---|
| `buffer [address or intersection] [distance]` | Buffer query at location |
| `transect [start address] to [end address]` | Cross-section between two points |
| `select sales near [feature type]` | Proximity query (e.g., "near flood zone", "near I-82") |
| `adjacent to [neighborhood]` | Adjacency highlight |
| `compare east vs west [neighborhood]` | Split polygon in half on east-west axis, compute stats per half |

---

## GIS Exports

The assessor presents spatial evidence to county commissioners, the Washington DOR, and IAAO peer review. GeoForge produces cartographic-quality exports — not just data tables.

### Map Export (PDF / PNG)
"Export Map" button in command bar (or ⌘K `export map`). Opens an export dialog:
- **Format**: PDF (print) or PNG (presentation)
- **Paper size**: 8.5×11, 11×17, custom
- **Content options**: include/exclude legend, scale bar, north arrow, title block with county name + tax year + "Prepared by Benton County Assessor's Office"
- **Which layers**: current layer state, or predefined presets (Ratio Study Overview, Equity Failures, Outlier Sales)

The exported map is a print-quality rasterization of the current Mapbox canvas at 300 DPI. Uses Mapbox's static image API with the current viewport and style.

### GeoJSON Export
"Export GeoJSON" — downloads the neighborhood polygon layer with the full Benton Method stats for the current tax year attached as feature properties. Assessors and other agencies can open this in ArcGIS, QGIS, or any GIS tool that speaks GeoJSON.

```json
// Example exported feature
{
  "type": "Feature",
  "geometry": { "type": "Polygon", "coordinates": [...] },
  "properties": {
    "neighborhoodCode": "KW-302",
    "neighborhoodName": "Kennewick Central",
    "taxYear": 2025,
    "cod": 14.5,
    "prd": 1.043,
    "prb": -0.041,
    "vei": 12.8,
    "medianRatio": 0.973,
    "count": 124,
    "bentonPassAll": false,
    "iaaoPassAll": false
  }
}
```

### Shapefile Export
Same as GeoJSON but packaged as `.zip` containing `.shp`, `.dbf`, `.prj`, `.shx` — the standard format for state agency reporting. Washington DOR ratio study submission requires spatial data in this format.

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

### GWR — Geographically Weighted Regression *(the PhD-level differentiator)*

Standard ratio study analysis computes one PRD per neighborhood — a single number that masks internal spatial variation. **Geographically Weighted Regression (GWR)** computes a PRD-equivalent (and COD-equivalent) at every point in the county, producing a continuous spatial surface rather than discrete neighborhood buckets. The result reveals:

- Where exactly PRD transitions from passing to failing — the "equity fault line"
- Whether the neighborhood boundary is in the right place or is cutting across a real market gradient
- Which parcels are driving a neighborhood's failure (those in the high-PRD zone vs. well-priced ones pulling it toward passing)

**v1 implementation:** GWR results surface as a new optional layer (Layer 2.5, between choropleth and scatter). Toggled from the Layers drawer. The layer renders as a continuous color ramp (same scale as the choropleth) but without polygon boundaries — a smooth gradient.

The GWR computation runs server-side on demand (not on every load — it's expensive):
```
POST /api/terraforge/ratio-study/gwr
  body: { taxYear: 2025, metric: "prd", bandwidth: "adaptive" }
  returns: GeoJSON FeatureCollection of interpolated grid points with metric value
```

Bandwidth is adaptive (bisquare kernel, k=50 nearest sales per estimation point). Results are cached by tax year — one computation per year covers all sessions.

**Why this matters:** No CAMA software, no IAAO-standard tool, and no commercial mass appraisal software computes GWR for ratio study analysis. This is the PhD-level capability that makes GeoForge not just better than competitors — it makes them irrelevant.

---

### IAAO vs Benton pass/fail display

Every stat in every panel shows two badge states:
- `IAAO ✓` / `IAAO ✗` — IAAO standard
- `BENTON ✓` / `BENTON ✗` — Benton Method threshold (tighter)

A neighborhood can pass IAAO but fail Benton. Both are shown. The choropleth coloring uses the **Benton** threshold.

---

## Equity Signature Radar

Every neighborhood has a hexagonal radar chart with 6 axes — the 6 **equity indicators** most diagnostic of assessment fairness. Of these 6 axes, 4 are drawn from the core 12-stat set (Median Ratio, AAD, COD, PRD) and 2 are from the beyond-IAAO Benton Method set (PRB, VEI). The other 8 stats in the full panel (Lo Range, Hi Range, Mean, Aggregate Mean, Variance, SD, CV, Count) are descriptive / distributional and shown in the stat block grid, but are not equity indicators and would clutter the radar without adding signal.

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
| Neighborhood polygons (Layer 2) | TerraAtlas ArcGIS Layer 3 → `/api/atlas/gis/spatial-query?layer=Neighborhoods` (NEIGHBORHOOD_CODE, MARKET_AREA, LAND_CLASS) |
| Sale-point scatter (Layer 3) | New endpoint: sales with `parcelLat`/`parcelLng` from AssessorPropVal centroid join |
| Parcel polygons (Layer 4) | TerraAtlas AssessorPropVal FeatureServer — existing `atlasService.searchMassAppraisalParcels()`, on-demand per selected neighborhood |
| Context layers (Layer 5) | City boundaries: TerraAtlas political layer · FEMA NFHL: public WMS tile · Land class / Market area: fields from Layer 3 |
| Clustering overlay (Layer 6) | Computed in DiagnosisPanel from sale coordinates — Moran's I + convex hull, rendered as Mapbox GeoJSON fill layer |
| Spatial autocorrelation | Moran's I computed server-side in `/diagnosis` endpoint from sale lat/lng |
| Ratio statistics | TerraForge `/api/terraforge/ratio-study/*` endpoints (existing) |
| Individual sales | New endpoint: `GET /api/terraforge/ratio-study/sales?neighborhood=X&taxYear=Y` (includes parcel coordinates) |
| State management | Zustand store: `useGeoForgeStore` (active metric, active year, selected neighborhood, filter state) |
| Data fetching | TanStack Query (existing pattern) |
| Charting (radar, histogram) | Recharts (existing) or SVG-native for radar |
| UI components | shadcn/ui + Radix (existing) |
| Styling | Tailwind CSS 4.1, Terra dark theme (`bg-terra-midnight`, `text-terra-cyan`) |

---

## New Backend Endpoints Required

Two endpoints not yet in the backend are needed. The existing `comparison-snapshots` endpoint only returns `{neighborhood_code, parcel_count, median_ratio, cod, prd, sale_count}` — insufficient for the Benton Method.

**All new endpoints follow existing Kernel security contract:**
- `[Authorize]` attribute (JWT required)
- `CountyId` resolved from authenticated user's claims — never accepted as a query parameter or body field
- All LINQ queries filter by `.Where(x => x.CountyId == currentUser.CountyId)` before any neighborhood or year filter
- Responses echo `countyId` for client-side verification but server discards any client-supplied value
- Per FISMA-HIGH audit requirements, every request is logged with user ID, neighborhood scope, tax year, and response row count via existing `AuditableEntityInterceptor`

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
      "parcelLat": 46.2112,       // parcel centroid from AssessorPropVal spatial index
      "parcelLng": -119.1372,     // required for sale-point scatter layer
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

### Endpoint 3: Neighborhood Diagnosis (AI root-cause classifier + peer match)

```
GET /api/terraforge/ratio-study/diagnosis
  ?neighborhood=KW-302
  &taxYear=2025
  &includePeers=true           // top 5 structural peers, default true
  &includeDataQuality=true     // integrity flags, default true

Response:
{
  "neighborhood": "KW-302",
  "taxYear": 2025,
  "rootCauses": [
    {
      "category": "stratification",         // data_quality | stratification | outliers | external
      "confidence": 0.62,
      "summary": "Ratio distribution is bimodal; quintile 1 mean ratio 0.94 vs quintile 5 mean ratio 1.08 indicates differential treatment by value tier.",
      "evidence": { "modes": [0.94, 1.08], "quintileMeans": [0.94, 0.98, 0.99, 1.02, 1.08] }
    },
    {
      "category": "data_quality",
      "confidence": 0.23,
      "summary": "6 sales flagged with missing improvement records.",
      "evidence": { "suspectParcelIds": ["...","..."] }
    }
  ],
  "peers": [
    {
      "neighborhoodCode": "RP-401",
      "similarity": 0.87,
      "delta": "COD 8.4 (vs your 14.5); 73% more basement-finish coded; mean sale $42k higher",
      "stats": { /* full NeighborhoodStats */ }
    }
  ],
  "dataQualityFlags": [
    {
      "parcelId": "...",
      "flagType": "lot_area_mismatch",       // lot_area_mismatch | missing_improvement | sketch_living_area_delta | qualification_inconsistent
      "cama": 8712,
      "gis": 9840,
      "deltaPct": 11.5,
      "severity": "medium"                    // low | medium | high
    }
  ]
}
```

Implementation: root-cause scoring uses rule-based classifiers over the `ComparableSales` distribution and `PropertyAssessments` feature fields — no LLM in v1. Peer similarity is cosine over a fixed feature vector (stock age distribution, value range, count, improvement class mix). Data quality flags use existing GIS+CAMA cross-checks already present in `terra-forge-rebuild` module.

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
    NeighborhoodDetailPanel.tsx       — expanded 12-stat + quintile + radar (canonical)
    SalesDrillDownPanel.tsx           — individual sales table + histogram
    YearTrendPanel.tsx                — 5-year comparison table + attribution tab
    DiagnosisPanel.tsx                — AI root-cause, peers, data-quality scanner
    EquitySignatureRadar.tsx          — hexagonal radar (mini + full, overlay-capable)
  hooks/
    useGeoForgeData.ts                — TanStack Query fetcher for all ratio data
    useNeighborhoodGeoJSON.ts         — fetches + caches TerraAtlas Layer 3 neighborhood polygons + MARKET_AREA + LAND_CLASS fields
    useSaleScatter.ts                 — fetches + caches sale points with parcelLat/Lng for scatter layer; handles county-wide pre-fetch on load
    useParcelLayer.ts                 — on-demand parcel polygon fetch from AssessorPropVal for selected neighborhood
    useContextLayers.ts               — FEMA flood zones, city boundaries, new-construction filter
    useGeoForgeCommands.ts            — ⌘K command dispatch
    useDiagnosis.ts                   — fetches root-cause classification + peers + spatial clustering
    useDataQualityScan.ts             — runs integrity sweep for a neighborhood
  store/
    geoForgeStore.ts                  — Zustand: metric, year, selection, filters,
                                         activeLayers (Set<LayerId>), layerOpacities (Map<LayerId, number>),
                                         scatterVisible, clusteringOverlayActive,
                                         + adjustmentProposals (v2-reserved, always []),
                                         + activeAdjustmentSetId (v2-reserved, always null)
  utils/
    bentonMethodCalcs.ts              — VEI, PRB, equity signature normalization
    choropleths.ts                    — metric → color scale mappings
    reportTemplates.ts                — ratio study narrative template strings
    rootCauseClassifier.ts            — client-side ranking logic over endpoint output
    peerSimilarity.ts                 — cosine similarity over feature vectors
    attributionDecomposer.ts          — year-over-year delta decomposition
  types/
    geoforge.types.ts                 — NeighborhoodStats, SaleRecord, GeoForgeMetric,
                                         DiagnosisResult, PeerMatch, DataQualityFlag, etc.

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

## AI Superpower Layer (v1 — read-only sensing)

The elite assessor's workflow is a loop: **See → Diagnose → Adjust → Verify → Certify**. The v1 map, stats table, bloom card, radar, and draft report serve *See* and *Certify*. The AI layer in v1 closes the gap between them — it answers *"why is this failing?"* without yet answering *"what do I change?"*. All v1 AI features are read-only explainers. No write-back. No model mutation. The assessor remains the decision-maker; AI amplifies sensing.

### The Diagnosis Panel (`DiagnosisPanel`)

Opened from the bloom card's "Diagnose →" link or ⌘K `diagnose [neighborhood]`. For the selected neighborhood and tax year, the panel runs a **root-cause classifier** that inspects the ratio distribution shape, the sales composition, the per-parcel feature coding, and the geographic/temporal distribution of sales, then returns a ranked diagnosis with evidence.

The classifier assigns weights across four root-cause categories:

| Category | Trigger signals | Evidence shown |
|---|---|---|
| **Data quality** | AVs without improvement records, sketch-area mismatches, parcel-area mismatches between CAMA and GIS, year-built vs permit-record drift, sale price outside ±3σ | List of suspect parcel IDs, suspect fields, confidence per row |
| **Stratification / submarket** | Bimodal or multimodal ratio distribution, quintile mean ratios diverging monotonically, **geographic clustering of high/low-ratio sales in a sub-region of the neighborhood** | Histogram with detected modes, quintile chart, **sub-region convex hull polygon highlighted on map**, split-neighborhood suggestion |
| **True outliers** | One or two sales in extreme tails with verified arms-length status, COD driven by <5% of sales | Ranked outlier list, impact delta (COD/PRD if removed), **outlier sale dots pulsing on map** |
| **External factor / temporal** | Recent ratio trend differs significantly from county trend, **spatial autocorrelation of failing sales (Moran's I > 0.4)**, sales cluster near new infrastructure/zoning change, value tier diverging over time | 5-year trend overlay, **geographic heat zone polygon over the clustered area**, distance-to-feature correlation if detectable, suggested external event |

**Spatial clustering is computed for every category** using sale-point coordinates (`parcelLat`, `parcelLng`). The classifier checks: are the failing/flagged sales geographically concentrated (Moran's I, convex hull area / neighborhood area ratio) or uniformly distributed? Concentrated = likely external factor or submarket. Uniform = model calibration or data quality. This is the GIS signal that no stat table can provide.

When the DiagnosisPanel is open, Layer 6 (Geographic Clustering Overlay) activates automatically on the map — heat zone polygon + clustering annotation, no toggle needed.

For each category, the panel shows a confidence bar, one-paragraph plain-language explanation, and an evidence drawer. The assessor is always the decision-maker — the panel never auto-applies anything.

**AI framing discipline:** All v1 copy uses honest verbs — *suggests*, *flags*, *classifies*, *surfaces*, *ranks*. No copy claims the AI *diagnoses*, *fixes*, or *decides*. Subject to `ui-honesty-pass` review.

### The Peer Comparator

Inside the Diagnosis Panel, a **"Similar neighborhoods"** strip shows 3–5 peer neighborhoods ranked by structural similarity (housing stock age distribution, value range, sale count, improvement class mix). For each peer:

- Peer equity signature radar, overlaid on subject's radar (subject in cyan, peer in amber)
- 1-line delta summary: *"RP-401 is structurally similar but has COD 8.4 (vs. your 14.5). Biggest differences: 73% more basement-finish coded, mean sale price $42k higher, 2.3× more view-coded parcels."*
- Click-through pans the map to the peer and opens its Diagnosis Panel

Peer similarity is computed from feature vectors already in `ComparableSales` and `PropertyAssessments` — no new data required. The similarity model (cosine over normalized feature vector) runs server-side as part of the stats endpoint response when `?includePeers=true`.

### The Data Quality Scanner

⌘K `scan data quality [neighborhood]` runs a lightweight integrity sweep across the neighborhood's parcels and sales:

- **Geometric cross-check**: parcel polygon area (GIS) vs. recorded lot size (CAMA) — flag >5% delta
- **Improvement sanity**: AV < land value only (missing improvement record)
- **Sketch-vs-record**: sketch SF vs living area SF — flag >3% delta
- **Sale qualification audit**: arms-length flag consistency vs sale-price-to-AV ratio outside 0.6–1.6

Result is a sortable table of suspect records with a **"Confirm/Dismiss"** toggle (local state only in v1 — v2 will persist). Scanner runs via existing `ComparableSales` + `PropertyAssessments` queries; no new data.

### Time-Trend Attribution

In the YearTrendPanel, a new **"What changed"** section surfaces the top three factors that moved the equity metrics year-over-year. E.g.:

*"COD improved from 14.2 → 11.8 between 2023 and 2024. Largest contributors: 18 sales in East Kennewick with corrected basement-finish coding (−1.6 COD), time-trend adjustment +3.2% applied in Q3 2023 (−0.5 COD), 4 sales now disqualified (−0.3 COD)."*

Attribution is rule-based (no ML) — it replays the delta decomposition against known adjustment runs and data-correction log entries. Requires that adjustment runs are logged (this is where v1 touches v2 infrastructure — see Forward Compatibility).

### ⌘K AI commands (extends the earlier command table)

| Command | Panel opened |
|---|---|
| `diagnose [neighborhood]` | DiagnosisPanel |
| `compare to peers [neighborhood]` | DiagnosisPanel → Peer strip focused |
| `scan data quality [neighborhood]` | DiagnosisPanel → Data Quality tab |
| `what changed [neighborhood] [year] vs [year]` | YearTrendPanel → Attribution tab |
| `explain report [section]` | ReportPanel → AI rationale overlay |

---

## Forward Compatibility — v2 Adjustment Workbench

GeoForge v2 closes the loop: **Adjust → Verify** with actual write-back to assessed values under audit. Full v2 design lives in a companion spec (`docs/superpowers/specs/2026-04-18-geoforge-v2-adjustment-workbench.md`) to keep v1 scope tight. v1 must not paint us into a corner. Two v1 choices make v2 cheap to add later:

1. **Stats endpoint takes an optional `proposedAdjustmentSetId`.** In v1 this is always null. In v2 it layers staged adjustments into recomputed stats for live simulation without touching base data.

   ```
   GET /api/terraforge/ratio-study/neighborhood-stats
     ?taxYear=2025
     &proposedAdjustmentSetId=<uuid>   // v1: ignored/null, v2: applies overlay
   ```

2. **Zustand store reserves `adjustmentProposals` and `activeAdjustmentSetId` slots from day one.** v1 never writes to them; v2 populates them. This prevents a cross-cutting refactor later.

3. **All stat-display components accept a `mode: 'live' | 'simulated'` prop.** In v1 the prop is always `'live'`; in v2 it drives the ghost-overlay rendering.

No other v1 work is gated on v2. v2 is additive.

---

## What GeoForge Does NOT Replace

- **TerraAtlas suite** — parcel browsing, sketch viewer, GIS layers, parcel search. GeoForge consumes TerraAtlas data but does not replace TerraAtlas.
- **TerraAtlas Mass Appraisal GIS module** — parcel-level GIS. GeoForge is neighborhood-level analytics.
- **TerraAtlas Geo Equity module** — geographic equity surface in the Atlas suite. Different audience, different granularity. GeoForge is the Forge suite tool; Geo Equity is the Atlas suite tool.
- **SalesForge AI Audit** — sale qualification and AI diagnosis. GeoForge consumes qualified sales; it does not re-implement the audit workflow.
- **CostForge** — cost approach analytics. GeoForge is the ratio study tool.

---

## Success Criteria

1. Benton County neighborhood polygons render on the Mapbox choropleth from real ArcGIS Layer 3 data, colored by active metric
2. Sale-point scatter layer plots individual qualifying sales as color-coded dots at real parcel centroids — toggleable over the choropleth
3. Parcel polygon layer loads on demand for the selected neighborhood, colored by sale ratio (sold parcels) or gray (unsold)
4. Context layers toggle correctly: city boundaries, market areas, land class, FEMA flood zones, new construction filter
5. All 12 Benton Method stats compute correctly per neighborhood from real `ComparableSales` data
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
13. Lasso selection on sale-point scatter filters the stats table and updates visible stats for the selected sub-region
14. DiagnosisPanel returns ranked root-cause classification for a failing neighborhood, with evidence for each category
15. DiagnosisPanel activates geographic clustering overlay (Layer 6) on the map automatically — heat zone polygon shows where failing sales concentrate spatially
16. Spatial clustering score (Moran's I) is computed server-side and returned in the `/diagnosis` response
17. Peer comparator returns top-5 structurally similar neighborhoods with overlaid radar + delta summary
15. Data Quality Scanner surfaces real GIS/CAMA mismatches from Benton County data (not synthetic)
16. Time-trend attribution decomposes year-over-year COD/PRD/VEI deltas into contributing factors from the adjustment run log
17. All AI-layer copy passes `ui-honesty-pass` — verbs are *suggests / flags / ranks / surfaces*, never *diagnoses / fixes / decides*
18. Every new endpoint filters by `CountyId` from JWT claims before any other filter; query-param county values are rejected
19. Initial choropleth paints within 2500ms (LCP gate); metric pill switch repaints within 300ms
20. Zustand store reserves `adjustmentProposals` and `activeAdjustmentSetId` slots; stat endpoints accept optional `proposedAdjustmentSetId` param (v2 forward-compat, v1 always null/ignored)

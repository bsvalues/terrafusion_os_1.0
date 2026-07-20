# WO-ATLAS-X-001 — Atlas Implementation Inventory (source-side, on sovereign base)

> Atlas pilot inventory. **Inventory + disposition only** — no code moved, no repo, no credential.
> Architectural/boundary resolutions flagged for **WO-ATLAS-X-002**.

**Date:** 2026-06-25 · **Source of truth:** `origin/main` @ `2ae013561` · **Contracts:** `atlas.gis@1.0.0` (frozen, Atlas-owned) + consumes `canonical.parcel@1.0.0`
**Dispositions:** `RETAIN_IN_OS · EXTRACT_EXACT · REWRITE_FOR_SUITE · SHARE_AS_CONTRACT · MINE_PATTERN · DEFER · REJECT`

## 0. Two load-bearing findings
1. **"Atlas" is overloaded across THREE domains — only one is the TerraAtlas GIS suite:**
   - **(A) TerraAtlas GIS suite** (real): `API/Controllers/AtlasGisController.cs`, `API/Services/GisDataService.cs`
     (implements the frozen `IGisDataService`), GIS geometry entities, true-GIS frontend surfaces. → **EXTRACT to `terrafusion-atlas`.**
   - **(B) `SystemGptAtlas*` + `Spatial/*`** in `TerraFusion.AI` (forecast/anomaly/classifier/GAMA-zoning,
     SpatialRegression, RTreeIndex, autocorrelation) → **AI spatial analytics → GPT/DEFER**, not the GIS suite.
   - **(C) `TerraFusion.Sync/Workbench/Atlas/*`** (DeepProfilePersistence, ISecretResolver) → **Sync
     data-profiling** merely named "Atlas" → **RETAIN_IN_OS/Sync**.
2. **Maps are entirely unrendered.** **No `atlas/` page imports any map library** (grep for
   maplibre/leaflet/mapbox = 0 hits); `MapContainer.tsx` is an explicit placeholder ("When Leaflet is
   integrated…"). So PR #942 "terraatlas-full-production" is broadly aspirational. **#1073 (maps render)
   is a HARD cutover precondition** — Atlas source-of-truth must not transfer until maps are real.

## 1. Backend inventory (TerraAtlas GIS suite = A only)
| Source path | Capability | Disposition | Dep | Tests |
|---|---|---|---|---|
| `API/Controllers/AtlasGisController.cs` | Atlas GIS HTTP surface | **EXTRACT_EXACT** (controller-cut) | atlas.gis, canonical.parcel, crosscut.audit | BentonGisTests |
| `API/Services/GisDataService.cs` (impl of `IGisDataService`) | GIS data service | **EXTRACT_EXACT** | atlas.gis | — |
| `Core/Entities/{GisTf/TfParcelGeom,GisParcelGeometry,SpatialAnalysis,CanonicalTf/DictNeighborhood,CountySpatialArtifact}` | Atlas-owned geometry/neighborhood | **REWRITE_FOR_SUITE** → AtlasDbContext (EF-coupled, mirror of Forge) | atlas.gis | — |
| `Core/Entities/{TruthArcGis/TruthArcGisParcelGeomCurrent,LegacyArcGisRaw/LegacyArcGisRawParcelGeom}` | **PACS/Sync-ingested** raw geometry | **RETAIN_IN_OS/Sync** (SHARE via contract) | atlas.gis | — |
| `TerraFusion.AI/{SystemGptAtlas*,Spatial/*,Regression/SpatialRegressionModel,Metrics/AtlasMetricsCollector,Extensions/AtlasForecast*}` | AI spatial forecast/anomaly/GAMA | **DEFER → GPT** (reconcile at GPT inv) | — | Phase32/33/35 SystemGptAtlas tests |
| `TerraFusion.Sync/Workbench/Atlas/*` (DeepProfile) | Sync data-profiling | **RETAIN_IN_OS/Sync** | — | Sync/Atlas DeepProfile tests |

## 2. Frontend inventory (`pages/atlas`, 20 files) — split three ways
| File(s) | Disposition | Notes |
|---|---|---|
| `components/{MapContainer,AddressMap,AnimatedTrendMap,SchoolDistrictMap}`, `GeometryHealth`, `NeighborhoodDelineationPanel`, `SpatialDiagnosticsPanel`, `neighborhood/NeighborhoodComparison` | **EXTRACT to Atlas** | true GIS: base map, geometry, neighborhood delineation, spatial diagnostics — **but all map-render is placeholder (#1073)** |
| `MassAppraisalGIS`, `ResidualMapPanel`, `GeoEquityDashboard`, `TerraGamaPage`(+`terraGamaStore`+tests), `MarketHeatMapPage`, `components/MarketHeatMap` | **REASSIGN → Forge (GeoForge)** | valuation/GAMA/ratio rendered on maps — consistent w/ WO-FORGE-X-002 (Forge consumes `atlas.gis`) |
| `neighborhood/{SentimentDashboard,SentimentWidget}`, `components/SentimentHeatMap` | **DEFER → GPT** | sentiment analytics = AI/GPT, not GIS |

## 3. Ownership line (mirror of Forge)
```text
Atlas owns:   GIS layers/symbology/geometry/base-map, parcel geometry (Atlas-authored),
              neighborhood definitions, spatial diagnostics, map bookmarks — persisted in a
              NEW AtlasDbContext; PRODUCES the atlas.gis contract.
OS/Sync owns: PACS-ingested raw geometry (TruthArcGis, LegacyArcGisRaw) — Atlas reads via contract.
Not Atlas:    SystemGptAtlas AI analytics (→ GPT), Sync Atlas-profiling (→ OS/Sync), map-rendered
              valuation (→ Forge/GeoForge), sentiment (→ GPT).
```

## 4. Contracts + feeders
- **Owns/produces:** `atlas.gis@1.0.0` (`ParcelGeometryResponse`, `ParcelNeighborResponse`, `IGisDataService`).
- **Consumes:** `canonical.parcel@1.0.0`, `shared.envelopes`, `crosscut.audit`.
- **Feeder provenance (out-of-session):** `BCBSGISPRO`→gis-pro, `GeospatialAnalyzerBS`→spatial, `TerraGama`→GAMA (note: TerraGama feeds the GeoForge/GAMA surfaces now assigned to Forge — reconcile at X-002).

## 5. Flagged for WO-ATLAS-X-002 (not decided here)
1. **SystemGptAtlas ownership** — Atlas spatial-analytics vs GPT AI. Large surface (~18 files + Phase32/33/35 tests). Reconcile with GPT inventory.
2. **AtlasDbContext carve** — which geometry entities are Atlas-authored vs Sync-ingested (per-entity reader scan, like Forge).
3. **GeoForge reassignment reconciliation** — confirm MassAppraisalGIS/TerraGama/ResidualMap belong to Forge (they consume `atlas.gis`); ensure no Atlas-layer ownership leaks.
4. **Sentiment surfaces → GPT** confirm.
5. **#1073 maps-render** — precondition sequencing; Atlas cannot pass its cutover gate unrendered.

## 6. Proven vs unverifiable
- **Proven:** AtlasGisController + GisDataService (real IGisDataService impl), GIS geometry entities, GIS tests (BentonGisTests).
- **Weak/aspirational:** entire frontend map layer unrendered (no map lib imported) — Atlas is the **least extraction-ready** suite; #1073 gates it.
- **Unverifiable in-session:** build/test greenness (no `dotnet`); feeder repos.

## 7. Status
**WO-ATLAS-X-001 COMPLETE.** Load-bearing: "Atlas" spans 3 domains (GIS suite / SystemGptAtlas AI / Sync
profiling) — the real suite is narrow; and the map layer is unrendered (#1073 = hard cutover precondition).
Next: **WO-ATLAS-X-002** (SystemGptAtlas ownership, AtlasDbContext carve, GeoForge reconciliation, per-entity
geometry cut). Sequenced after Forge; extraction execution-gated on the Atlas repo. No code moved.

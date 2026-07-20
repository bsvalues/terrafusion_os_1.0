# WO-ATLAS-X-002 — Atlas Exact Disposition, Dependency & Provenance

> Resolves the decisions flagged by `WO-ATLAS-X-001-INVENTORY.md` with source evidence. **Decision-layer;
> no code moved, no repo, no credential.** Extraction/bootstrap gated on the Atlas repo **+ #1073**.

**Date:** 2026-06-25 · **Source of truth:** `origin/main` @ `2ae013561` · **Contracts:** owns `atlas.gis@1.0.0`; consumes `canonical.parcel`/`shared.envelopes`/`crosscut.audit`

## 1. Flagged decisions — RESOLVED (evidence)
1. **AtlasDbContext carve — Atlas owns almost NO authored data.** Geometry is **Sync-populated**:
   `GisParcelGeometry` + `TfParcelGeom` are written by `ArcGisSyncService` (`API/Services` + `Data/Services/GisTf`);
   `SpatialAnalysis` is **read by `CostForgeController`** (shared with Forge). `TruthArcGis`/`LegacyArcGisRaw`
   are PACS/ArcGIS raw (already RETAIN). ⇒ **AtlasDbContext holds only user-authored map artifacts**
   (`CountySpatialArtifact` + layers/symbology/bookmarks/neighborhood-definitions per suites.json).
   **Atlas is a presentation/layer suite over Sync-ingested geometry**, not a geometry owner.
2. **SystemGptAtlas → Atlas (confirmed, from GPT X-001).** Spatial forecast/anomaly analytics; domain = spatial.
   Extract to Atlas, consuming OS AI services (Muse/embeddings) via contract — NOT GPT.
3. **GeoForge reassignment confirmed** — valuation-on-map (MassAppraisalGIS/ResidualMap/GeoEquity/TerraGama)
   stays **Forge**, consuming `atlas.gis`. No Atlas-layer ownership leaks.
4. **Sentiment surfaces → GPT** (SentimentHeatMap/Dashboard/Widget) — AI, not GIS.
5. **#1073 = HARD cutover precondition** — Atlas maps are unrendered; source-of-truth cannot transfer until maps render.

## 2. Ownership line
```text
Atlas owns:   map layers/symbology/bookmarks/annotations, neighborhood definitions, CountySpatialArtifact,
              the GIS presentation surface (AtlasGisController, GisDataService) + SystemGptAtlas spatial
              analytics — persisted in a small AtlasDbContext; PRODUCES atlas.gis.
OS/Sync owns: ALL parcel geometry (GisParcelGeometry/TfParcelGeom/TruthArcGis/LegacyArcGisRaw — ArcGisSync);
              SpatialAnalysis (shared w/ Forge). Atlas reads geometry via atlas.gis contract.
```

## 3. Exact disposition matrix
| Source path | Action | Dep | Provenance | Cutover gate |
|---|---|---|---|---|
| `API/Controllers/AtlasGisController` + `API/Services/GisDataService` | **EXTRACT_EXACT** | atlas.gis, canonical.parcel | `2ae013561` | builds green; renders via contract |
| `Core/Entities/CountySpatialArtifact` (+ layer/symbology/bookmark/neighborhood entities) | **REWRITE_FOR_SUITE** → AtlasDbContext | atlas.gis | `2ae013561` | AtlasDbContext migration applies |
| `Core/Entities/{GisParcelGeometry,GisTf/TfParcelGeom,TruthArcGis/*,LegacyArcGisRaw/*}` | **RETAIN_IN_OS/Sync** (ArcGisSync-populated) | atlas.gis | `2ae013561` | Atlas reads via contract, no entity ref |
| `Core/Entities/SpatialAnalysis` | **RETAIN_IN_OS** (shared w/ Forge) | atlas.gis | `2ae013561` | both read via contract |
| `TerraFusion.AI/{SystemGptAtlas*,Spatial/*,Regression/SpatialRegressionModel,Metrics/AtlasMetricsCollector}` (23) | **EXTRACT** (Atlas analytics, type-cut) | atlas.gis + OS-AI tool contract | `2ae013561` | compiles; GPT/swarm left in OS |
| `frontend/.../pages/atlas` true-GIS surfaces (MapContainer/AddressMap/GeometryHealth/NeighborhoodDelineation/SpatialDiagnostics + `hooks/useSystemGptAtlasLive`) | **EXTRACT_EXACT** | atlas.gis | `2ae013561` | **maps render (#1073)** |
| `frontend/.../pages/atlas` valuation-on-map (MassAppraisalGIS/ResidualMap/GeoEquity/TerraGama/MarketHeatMap) | **→ Forge (GeoForge)** | atlas.gis | `2ae013561` | Forge suite |
| `frontend/.../pages/atlas` sentiment (SentimentHeatMap/Dashboard/Widget) | **→ GPT** | — | `2ae013561` | GPT suite |
| `TerraFusion.Sync/Workbench/Atlas/*` (DeepProfile) | **RETAIN_IN_OS/Sync** | — | — | — |

## 4. Dependency inventory
Consumes `canonical.parcel` (parcels) + **its own `atlas.gis`** (produces) + OS-AI tool contract (for SystemGptAtlas) + `crosscut.audit`. New small **AtlasDbContext** (authored artifacts only). Reads geometry via contract. Feeders (out-of-session): BCBSGISPRO, GeospatialAnalyzerBS, TerraGama(→GeoForge).

## 5. Confirm at X-003 / status
Per-entity: confirm the layer/symbology/bookmark/neighborhood entity set is the full Atlas-authored surface; confirm SystemGptAtlas writes go to AtlasDbContext (not shared). **#1073 maps-render precedes cutover.**
**WO-ATLAS-X-002 COMPLETE** — Atlas is a thin presentation suite over Sync geometry; AtlasDbContext holds only authored artifacts; SystemGptAtlas folded in. Extraction gated on Atlas repo + #1073. No code moved.

# TerraAtlas Suite Apps Runtime Proof

**WO**: `WO-TERRAATLAS-SUITE-APPS-RUNTIME-TRUTH`  
**Branch**: `feat/terraatlas-full-production`  
**Date**: 2026-06-11  
**Terminal status**: `PRODUCTION READY WITH EXTERNAL ENRICHMENT GAPS — TERRAATLAS SUITE APPS PARTIAL`

This PR proves the TerraAtlas Suite and TerraAtlas in-suite apps under `/atlas`.

## Scope

| In scope |
|----------|
| `/atlas` Suite shell |
| TerraAtlas in-suite app truth |
| Existing Atlas GIS API consumption |
| Real parcel `119802030006001` |
| `GisParcelGeometries`-backed boundary proof |
| Mapbox missing-token fallback classification |
| FEMA and zoning enrichment classification |

## Runtime Source

```text
/atlas UI
-> useParcelGis(119802030006001)
-> GET /api/atlas/gis/parcels/119802030006001
-> AtlasGisController
-> GisDataService
-> Postgres terrafusion
-> GisParcelGeometries
```

The preferred runtime endpoint is the combined Atlas GIS endpoint:

```text
GET /api/atlas/gis/parcels/119802030006001
```

## App Status Matrix

| App | Status | Proof |
|-----|--------|-------|
| TerraGIS | `PARTIAL` | Uses the live Atlas GIS parcel endpoint; boundary source is live. Mapbox tiles remain an external configuration gap. |
| ParcelLens | `PARTIAL` | Shows owner `COX DONNA M`, situs, centroid, area, and RingJson presence for parcel `119802030006001`. |
| LayerWorks | `PARTIAL` | Shows tax area `K1` source live, land class `11` source live, flood `source: unavailable`, and zoning `null`. |
| TerraQuery | `READ_ONLY` | Read-only posture only; no spatial mutation or export is claimed. |
| TerraSketch | `NOT_IMPLEMENTED` | No geometry editing is exposed or claimed. |
| TerraPrint | `NOT_IMPLEMENTED` | No print pipeline is exposed or claimed. |
| TerraExport | `NOT_IMPLEMENTED` | No Shapefile, GeoJSON, or KML export is exposed or claimed. |
| TerraGIS Pro | `QUEUED` | Advanced GIS remains queued. |
| Geo Equity | `QUEUED` | Equity analytics remain queued. |
| Appraisal GIS | `QUEUED` | Appraisal-specific GIS workflow proof remains queued. |

## Data-Count Truth

| Label | Value | Use in TerraAtlas Suite |
|-------|-------|-------------------------|
| GIS geometry rows | `80,084` | May be shown as `GisParcelGeometries` row coverage. |
| RingJson geometries | `80,083` | May be shown as parcel geometry coverage. |
| Active parcel count | Not verified | Must not be displayed as a numeric total. |
| PACS rows | `128,950` | Hidden from the Suite UI unless explicitly labeled as PACS rows. |
| Legacy aggregate count | `128,784` | Must not be displayed as `Total Parcels`. |

## Canonical Parcel Evidence

| Field | Value |
|-------|-------|
| Parcel ID | `119802030006001` |
| Situs | `203 E 47TH PL, KENNEWICK, WA 99337-5905` |
| Owner | `COX DONNA M` |
| Centroid | `46.1669718650024, -119.115612775675`, `derivedFrom: arcgis-centroid` |
| Area | `0.3271 ac`, `14,250 sqft` |
| Ring geometry | 15-point RingJson polygon |
| Tax area | `K1`, source live |
| Land class | `primaryUseCd: 11`, source live |
| Flood | `source: unavailable` |
| Zoning | `null` |

## Required Gates

| Gate | Scope |
|------|-------|
| `pnpm run type-check` | core boundary |
| `node --test os-platform/core/tests/phase83-tools.test.mjs` | existing governance gate only, no repair in this WO |
| `pnpm --dir frontend run type-check` | frontend type safety |
| focused TerraAtlas Suite tests | `/atlas` suite app truth only |
| `dotnet build backend/src/TerraFusion.API/TerraFusion.API.csproj` | API build |
| `scripts/smoke/terraatlas-runtime-smoke.ps1 -ParcelId 119802030006001` | live Atlas GIS API contract |
| Browser proof | `/atlas` only |

## External Enrichment Gaps

| Gap | Classification |
|-----|----------------|
| Mapbox live tiles | `EXTERNAL_REQUIRED`: no token is configured. |
| FEMA flood enrichment | `EXTERNAL_REQUIRED`: backend returns flood data as `source: unavailable`. |
| Zoning enrichment | `EXTERNAL_REQUIRED`: backend returns zoning as `null`. |

# TerraAtlas Suite API Truth

**Branch**: `feat/terraatlas-full-production`  
**Date**: 2026-06-10  
**Terminal status**: `PRODUCTION READY WITH EXTERNAL ENRICHMENT GAPS - TERRAATLAS SUITE ONLY`

This is the shared frontend/backend Atlas GIS contract used as TerraAtlas Suite
runtime proof. It supports the `/atlas` sprint boundary only.

This document is not Property Workbench proof. `/property/:parcelId/atlas` is
`OUT_OF_SCOPE_PROPERTY_WORKBENCH`.

## Canonical Runtime Parcel

| Field | Value |
|-------|-------|
| Parcel ID / GeoId | `119802030006001` |
| Situs | `203 E 47TH PL, KENNEWICK, WA 99337-5905` |
| Owner | `COX DONNA M` |
| Centroid | `46.1669718650024, -119.115612775675` |
| Area | `0.3271 ac`, `14,250 sqft` |
| Geometry | 15-point `ringJson` polygon |

Do not use placeholder/demo parcel IDs such as `00AA00001129049` or `12345-001`
as runtime proof.

## Backend Contract

Source: `backend/src/TerraFusion.API/Controllers/AtlasGisController.cs`

Route prefix: `api/atlas/gis`

| Method + path | Auth | Runtime result |
|---------------|------|----------------|
| `GET parcels/{parcelId}/boundary` | `[AllowAnonymous]` | `200`, `source: live` for `119802030006001`; `404` only when boundary is unavailable. |
| `GET parcels/{parcelId}/layers` | `[AllowAnonymous]` | Returns parcel layers; live tax area and land class for the proof parcel. |
| `GET parcels/{parcelId}` | `[AllowAnonymous]` | Combined boundary + layers response used by frontend Atlas GIS consumers. |
| `GET geocode` | `[Authorize]` | Address geocode via geospatial enricher. Not part of this unauthenticated proof. |
| `GET spatial-query` | `[Authorize]` | Bounding-box query. Not part of this proof. |
| `GET layers/{layerName}/features` | `[Authorize]` | Layer feature retrieval. Not part of this proof. |
| `POST upload-shapefile` | `[Authorize]` | Upload route. Not part of this proof. |

## Frontend Suite Contract

Source: `frontend/apps/os-shell/src/pages/suites/AtlasSuiteHome.tsx`

| Surface | Runtime expectation |
|---------|---------------------|
| `/atlas` | Loads TerraAtlas Suite workspace. |
| `suite-atlas-root` | Stable root selector for Suite rendering. |
| `atlas-breadth-posture-note` | Discloses queued breadth modules honestly. |
| `atlas-source-disclosure` | Appears when county aggregates are not live backend metrics. |
| Appraisal GIS module | Classified as the live Suite GIS path backed by Benton geometry/stats. |

The shared GIS API is also available to Atlas GIS consumers through:

Source: `frontend/apps/os-shell/src/hooks/useAtlasGis.ts`

| Hook | Method + path | Notes |
|------|---------------|-------|
| `useParcelGis(parcelId)` | `GET /api/atlas/gis/parcels/{parcelId}` | Preferred single round trip; returns `{ boundary, layers }`. |
| `useParcelBoundary(parcelId)` | wrapper | Deprecated wrapper over `useParcelGis().boundary`. |
| `useParcelLayers(parcelId)` | wrapper | Deprecated wrapper over `useParcelGis().layers`. |

These hooks are API proof only in this sprint. Any Property Workbench consumer is
out of scope for PR acceptance.

## Live Data Source

| Item | Value |
|------|-------|
| Postgres container | `terrafusion-postgres-dev` |
| Host/port | `localhost:5432` |
| Database | `terrafusion` |
| GIS table | `GisParcelGeometries` |
| PACS table | `PacsParcel` |
| Geometry source | ArcGIS-derived geometry in Postgres |

## Response Shape

Boundary:

```json
{
  "parcelId": "119802030006001",
  "source": "live",
  "centroid": {
    "lat": 46.1669718650024,
    "lng": -119.115612775675,
    "derivedFrom": "arcgis-centroid"
  },
  "areaAcres": 0.3271,
  "areaSqFt": 14250,
  "situsDisplay": "203 E 47TH PL KENNEWICK, WA 99337-5905",
  "ringJson": "[...]",
  "ownerName": "COX DONNA M"
}
```

Layers:

```json
{
  "parcelId": "119802030006001",
  "source": "live",
  "zoning": null,
  "flood": { "source": "stub" },
  "taxArea": { "taxAreaNumber": "K1", "source": "live" },
  "landClass": { "primaryUseCd": "11", "source": "live" }
}
```

## Reproduction Commands

Run the API from the repository root:

```powershell
dotnet build backend/src/TerraFusion.API/TerraFusion.API.csproj

$env:ASPNETCORE_ENVIRONMENT='Development'
$env:DatabaseProvider='Postgres'
$env:ConnectionStrings__DefaultConnection='Host=localhost;Database=terrafusion;Username=postgres;Password=devpassword123;Port=5432'
dotnet run --project backend/src/TerraFusion.API/TerraFusion.API.csproj --no-build --no-launch-profile --urls http://127.0.0.1:5047 --skip-dev-seeders
```

In a second shell from the repository root:

```powershell
Invoke-WebRequest http://127.0.0.1:5047/health -UseBasicParsing
powershell -ExecutionPolicy Bypass -File scripts/smoke/terraatlas-runtime-smoke.ps1 `
  -ApiBaseUrl http://127.0.0.1:5047 `
  -ParcelId 119802030006001
```

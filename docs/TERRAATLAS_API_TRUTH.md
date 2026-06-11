# TerraAtlas Suite API Truth

**WO**: `WO-TERRAATLAS-SUITE-APPS-RUNTIME-TRUTH`  
**Branch**: `feat/terraatlas-full-production`  
**Date**: 2026-06-11  
**Terminal status**: `PRODUCTION READY WITH EXTERNAL ENRICHMENT GAPS — TERRAATLAS SUITE APPS PARTIAL`

This document describes the existing Atlas GIS API contract used by `/atlas`.

## Runtime Path

```text
/atlas UI
-> useParcelGis(119802030006001)
-> GET /api/atlas/gis/parcels/119802030006001
-> AtlasGisController
-> GisDataService
-> Postgres terrafusion
-> GisParcelGeometries
```

## Endpoint Contract

Source: `backend/src/TerraFusion.API/Controllers/AtlasGisController.cs`

| Method + path | Runtime result |
|---------------|----------------|
| `GET /api/atlas/gis/parcels/119802030006001/boundary` | `200`, `source: live` |
| `GET /api/atlas/gis/parcels/119802030006001/layers` | `200`, live tax area and land class; flood unavailable external enrichment; zoning null |
| `GET /api/atlas/gis/parcels/119802030006001` | Preferred combined response for Suite app proof |

## Canonical Runtime Parcel

| Field | Value |
|-------|-------|
| Parcel ID / GeoId | `119802030006001` |
| Situs | `203 E 47TH PL, KENNEWICK, WA 99337-5905` |
| Owner | `COX DONNA M` |
| Centroid | `46.1669718650024, -119.115612775675` |
| Area | `0.3271 ac`, `14,250 sqft` |
| Geometry | 15-point RingJson polygon |
| Tax area | `K1`, source live |
| Land class | `primaryUseCd: 11`, source live |
| Flood | `source: unavailable` |
| Zoning | `null` |

## Data-Count Truth

| Source | Count | Truth label |
|--------|-------|-------------|
| `GisParcelGeometries` | `80,084` | GIS geometry rows |
| `GisParcelGeometries` with RingJson | `80,083` | RingJson geometries |
| Active Benton parcels | Not verified | Active parcel count: not verified |
| `PacsParcel` | `128,950` | PACS rows, not Suite parcel truth |
| Legacy aggregate display | `128,784` | Must not be labeled as total parcels |

The TerraAtlas Suite must not collapse these counts into one parcel total.

## Reproduction Commands

```powershell
dotnet build backend/src/TerraFusion.API/TerraFusion.API.csproj

$env:ASPNETCORE_ENVIRONMENT='Development'
$env:DatabaseProvider='Postgres'
$env:ConnectionStrings__DefaultConnection='Host=localhost;Database=terrafusion;Username=postgres;Password=devpassword123;Port=5432'
dotnet run --project backend/src/TerraFusion.API/TerraFusion.API.csproj --no-build --no-launch-profile --urls http://127.0.0.1:5047 --skip-dev-seeders
```

In a second shell:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/smoke/terraatlas-runtime-smoke.ps1 `
  -ApiBaseUrl http://127.0.0.1:5047 `
  -ParcelId 119802030006001
```

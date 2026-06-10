# TerraAtlas API Truth

**Branch**: `feat/terraatlas-full-production`  
**Verified SHA**: `cab511d4cb81ed285783cea0dd771493e940b014`  
**Date**: 2026-06-10  
**Terminal status**: `PRODUCTION READY WITH EXTERNAL ENRICHMENT GAPS`

This is the current frontend/backend contract for the Atlas GIS runtime proof.

## Canonical Runtime Parcel

| Field | Value |
|-------|-------|
| Parcel ID / GeoId | `119802030006001` |
| Situs | `203 E 47TH PL, KENNEWICK, WA 99337-5905` |
| Owner | `COX DONNA M` |
| Centroid | `46.1669718650024, -119.115612775675` |
| Area | `0.3271 ac`, `14,250 sqft` |
| Geometry | 15-point `RingJson` polygon |

Do not use placeholder/demo parcel IDs such as `00AA00001129049` or `12345-001` as
runtime proof.

## Frontend Contract

Source: `frontend/apps/os-shell/src/hooks/useAtlasGis.ts`

| Hook | Method + path | Notes |
|------|---------------|-------|
| `useParcelGis(parcelId)` | `GET /api/atlas/gis/parcels/{parcelId}` | Preferred single round trip; returns `{ boundary, layers }`. |
| `useParcelBoundary(parcelId)` | wrapper | Deprecated wrapper over `useParcelGis().boundary`. |
| `useParcelLayers(parcelId)` | wrapper | Deprecated wrapper over `useParcelGis().layers`. |

Browser calls use `buildApiUrl('/atlas/gis' + path)`, which returns `/api/...` and relies on
the Vite proxy. For this proof, Vite was launched with `VITE_API_URL=http://127.0.0.1:5047`.

## Backend Contract

Source: `backend/src/TerraFusion.API/Controllers/AtlasGisController.cs`  
Route prefix: `api/atlas/gis`

| Method + path | Auth | Runtime result |
|---------------|------|----------------|
| `GET parcels/{parcelId}/boundary` | `[AllowAnonymous]` | `200`, `source: live` for `119802030006001`; `404` only when boundary is unavailable. |
| `GET parcels/{parcelId}/layers` | `[AllowAnonymous]` | Returns parcel layers; live tax area/land class for the proof parcel. |
| `GET parcels/{parcelId}` | `[AllowAnonymous]` | Combined boundary + layers; frontend uses this route. |
| `GET geocode` | `[Authorize]` | Address geocode via geospatial enricher. Not part of the unauthenticated parcel proof. |
| `GET spatial-query` | `[Authorize]` | Bounding-box query. Not part of this proof. |
| `GET layers/{layerName}/features` | `[Authorize]` | Layer feature retrieval. Not part of this proof. |
| `POST upload-shapefile` | `[Authorize]` | Upload route. Not part of this proof. |

## Live Data Source

| Item | Value |
|------|-------|
| Postgres container | `terrafusion-postgres-dev` |
| Host/port | `localhost:5432` |
| Database | `terrafusion` |
| GIS table | `GisParcelGeometries`, `80,084` rows |
| PACS table | `PacsParcel`, `128,950` rows |
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

```powershell
docker exec terrafusion-postgres-dev psql -U postgres -d terrafusion -At `
  -c 'select count(*) from "GisParcelGeometries";'

docker exec terrafusion-postgres-dev psql -U postgres -d terrafusion -At `
  -c 'select count(*) from "PacsParcel";'

dotnet build backend/src/TerraFusion.API/TerraFusion.API.csproj

cd backend/src/TerraFusion.API
$env:ASPNETCORE_ENVIRONMENT='Development'
$env:DatabaseProvider='Postgres'
$env:ConnectionStrings__DefaultConnection='Host=localhost;Database=terrafusion;Username=postgres;Password=devpassword123;Port=5432'
dotnet bin/Debug/net8.0/TerraFusion.API.dll --urls http://127.0.0.1:5047 --skip-dev-seeders

Invoke-WebRequest http://127.0.0.1:5047/health -UseBasicParsing
Invoke-WebRequest http://127.0.0.1:5047/api/atlas/gis/parcels/119802030006001/boundary -UseBasicParsing
Invoke-WebRequest http://127.0.0.1:5047/api/atlas/gis/parcels/119802030006001 -UseBasicParsing
```

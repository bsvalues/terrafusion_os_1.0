# TerraAtlas API Truth

**Branch**: feat/june10-dev39-runtime-truth
**Date**: 2026-06-10
**Final status**: ✅ **PROVEN CORE RUNTIME** — Atlas GIS core API proven with live Benton County data.

This document is the ground-truth map of the frontend↔backend Atlas GIS contract, the
actual backend routes, the live data source, and the launch contract required to reproduce
the proof.

---

## Canonical runtime smoke parcel

| Field | Value |
|-------|-------|
| Parcel ID (GeoId) | **`119802030006001`** |
| Situs | **203 E 47TH PL, KENNEWICK, WA 99337-5905** |
| Owner | COX DONNA M |
| Centroid | `46.16697186500235, -119.11561277567466` (`derivedFrom: arcgis-centroid`) |
| Area | `0.3271 ac` / `14,250 sqft` |
| Geometry | Real 15-point `RingJson` polygon |

> **Placeholder correction:** `00AA00001129049` and `12345-001` are placeholder/demo IDs
> with **no GIS geometry** and must **not** be used as runtime proof.

---

## Frontend requested endpoints

Source: `frontend/apps/os-shell/src/hooks/useAtlasGis.ts`

| Hook | Method + Path | Notes |
|------|---------------|-------|
| `useParcelGis(parcelId)` | `GET /api/atlas/gis/parcels/{parcelId}` | **Preferred** — single round-trip, returns `{ boundary, layers }` |
| `useParcelBoundary(parcelId)` | (wrapper) | Deprecated wrapper over `useParcelGis().boundary` |
| `useParcelLayers(parcelId)` | (wrapper) | Deprecated wrapper over `useParcelGis().layers` |

URL is built via `buildApiUrl('/atlas/gis' + path)`. A bearer token is attached via
`getToken()` when present, but the backend GIS routes are `[AllowAnonymous]` (see below),
so GIS data does not depend on a valid JWT.

---

## Backend existing endpoints

Source: `backend/src/TerraFusion.API/Controllers/AtlasGisController.cs`
Route prefix: `[Route("api/atlas/gis")]`, controller-level `[Authorize]`.

| Method + Path | Attribute | Behavior |
|---------------|-----------|----------|
| `GET parcels/{parcelId}/boundary` | `[AllowAnonymous]` | `GisDataService.GetParcelBoundaryAsync`; `404` if `source == "unavailable"` |
| `GET parcels/{parcelId}/layers` | `[AllowAnonymous]` | `GisDataService.GetParcelLayersAsync` |
| `GET parcels/{parcelId}` (combined) | `[AllowAnonymous]` | boundary + layers in one round-trip; `404` if boundary unavailable. **This is the route the frontend calls.** |
| `GET geocode` | `[Authorize]` | Address geocode via `IGeospatialEnricher` |
| `GET spatial-query` | `[Authorize]` | Bounding-box spatial query via `IGisConnector` |
| `GET layers/{layerName}/features` | `[Authorize]` | Layer feature retrieval |
| `POST upload-shapefile` | `[Authorize]` | Shapefile/GeoJSON/KML upload |

**Missing endpoints:** none. Every endpoint the frontend calls already exists. The earlier
"missing endpoint / 404" diagnosis was incorrect — see *Runtime Launch Truth*.

---

## DTO contract

Boundary (`ParcelBoundaryData` / backend `ParcelBoundaryResult`):

```jsonc
{
  "parcelId": "119802030006001",
  "source": "live",            // "live" | "fallback" | "unavailable"
  "centroid": { "lat": 46.16697, "lng": -119.11561, "derivedFrom": "arcgis-centroid" },
  "dimensions": null,
  "areaAcres": 0.3271,
  "areaSqFt": 14250,
  "situsDisplay": "203 E 47TH PL \r\nKENNEWICK, WA 99337-5905",
  "ringJson": "[[-119.1154,46.1672], ...]",  // JSON array of [lng,lat]; null until ArcGIS seeds
  "ownerName": "COX DONNA M",
  "imageUrl": "1819/1080160.jpg",
  "sketchUrl": " "
}
```

Layers (`ParcelLayersData` / backend `ParcelLayersResult`):

```jsonc
{
  "parcelId": "119802030006001",
  "source": "live",
  "zoning": null,                                  // enrichment gap (honest)
  "flood": { "zone": "X", "risk": "...", "source": "stub" },  // FEMA enrichment gap
  "taxArea": { "taxAreaNumber": "K1", "taxAreaDescription": "K1", "taxYear": null, "source": "live" },
  "landClass": { "landTypeCode": null, "landClassCode": null, "primaryUseCd": "11", "subUseCd": null, "source": "live" }
}
```

Combined (`GET parcels/{parcelId}`): `{ "boundary": <ParcelBoundaryData>, "layers": <ParcelLayersData> }`.

`source` semantics: `"canonical"`/`"arcgis"` → `live`; `"stub"`/`""`/`"unavailable"` → `unavailable`/`fallback`.

---

## Live data source

| Item | Value |
|------|-------|
| Postgres container | `terrafusion-postgres-dev` (`pgvector/pgvector:pg16`) |
| Host/port | `localhost:5432` |
| Database | `terrafusion` |
| GIS table | `GisParcelGeometries` — **80,014 rows**, all with `RingJson` + centroids |
| PACS table | `PacsParcel` — **128,950 rows** |
| Upstream | ArcGIS-sourced geometry; PACS SQL Server (`:1433`) is offline but already converted into Postgres |

---

## Auth requirement

- The Atlas GIS parcel routes (`boundary`, `layers`, combined) are **`[AllowAnonymous]`** —
  proven independent of JWT.
- Geocode / spatial-query / layer-features / upload routes remain `[Authorize]`.
- The frontend attaches a bearer token when available but does not require one for GIS reads.

---

## Dev fallback strategy

When GIS data is genuinely unavailable for a parcel, the service returns `source: "unavailable"`
and the controller responds `404` (boundary/combined) — the UI renders an honest
"Parcel not found / GIS unavailable" state rather than fabricating geometry. No fake county
geometry is ever synthesized.

---

## Runtime Launch Truth (root-cause record)

| Defect | Cause | Fix |
|--------|-------|-----|
| `401` on `[AllowAnonymous]` GIS routes | **Stale API binary** predating the `[AllowAnonymous]` attribute | Rebuilt (`dotnet build`, 0 errors) + restarted; `401` → `200` |
| Apparent "missing endpoint" | Mislabeled — routes already exist in `AtlasGisController.cs` | Confirmed via `401` (route registered), not `404` |
| DB DNS failure (`SocketException 11001 No such host is known`) | `--no-launch-profile` defaulted env to **Production**; `appsettings.Production.json` `DefaultConnection` uses unsubstituted `Host=${TF_DB_HOST}` | Relaunched `ASPNETCORE_ENVIRONMENT=Development` + explicit `ConnectionStrings__DefaultConnection=Host=localhost;Database=terrafusion;Username=postgres;Password=devpassword123;Port=5432` |
| GIS data "missing" | **Wrong parcel ID** (`00AA00001129049` placeholder) | Used real GeoId `119802030006001` |

**Launch contract:**
- Production launch must explicitly set `ASPNETCORE_ENVIRONMENT=Development` **or** provide a
  valid `TF_DB_HOST` / `ConnectionStrings__DefaultConnection`.
- Do **not** use `dotnet run --no-launch-profile` without an explicit environment /
  connection-string override for local runtime proof.

---

## Proof commands (reproducible)

```powershell
# 1. Ensure local Postgres has the data
docker exec terrafusion-postgres-dev psql -U postgres -d terrafusion -At `
  -c 'select count(*) from "GisParcelGeometries";'   # -> 80014

# 2. Launch API against local Postgres in Development
cd backend/src/TerraFusion.API
$env:ASPNETCORE_ENVIRONMENT='Development'
$env:DatabaseProvider='Postgres'
$env:ConnectionStrings__DefaultConnection='Host=localhost;Database=terrafusion;Username=postgres;Password=devpassword123;Port=5432'
dotnet run --no-launch-profile --urls http://localhost:5046

# 3. Prove live GIS data
Invoke-WebRequest http://127.0.0.1:5046/health -UseBasicParsing                                           # 200
Invoke-WebRequest http://127.0.0.1:5046/api/atlas/gis/parcels/119802030006001/boundary -UseBasicParsing   # 200 source:live
Invoke-WebRequest http://127.0.0.1:5046/api/atlas/gis/parcels/119802030006001 -UseBasicParsing            # 200 boundary+layers
```

---

**Final status**: ✅ PROVEN CORE RUNTIME with live Benton County GIS data.

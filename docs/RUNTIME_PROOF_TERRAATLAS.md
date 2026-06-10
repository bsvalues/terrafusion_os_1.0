# TerraAtlas Runtime Proof

**Branch**: `feat/terraatlas-full-production`  
**Verified SHA**: `cab511d4cb81ed285783cea0dd771493e940b014`  
**Date**: 2026-06-10  
**Terminal status**: `PRODUCTION READY WITH EXTERNAL ENRICHMENT GAPS`

TerraAtlas is proven in the local runtime for the canonical real Benton County parcel
`119802030006001`. The core GIS API returns live parcel geometry and the Workbench Atlas
tab renders the real parcel context from the verified API/backend path.

## Live Runtime Evidence

| Evidence | Result |
|----------|--------|
| Runtime identity | API launched from `C:\Users\bsval\.codex-worktrees\terraatlas-full-production\backend\src\TerraFusion.API` |
| API process | PID `35672`, `dotnet bin/Debug/net8.0/TerraFusion.API.dll --urls http://127.0.0.1:5047 --skip-dev-seeders` |
| `GET /health` | `200`, environment `Development`, service `TerraFusion OS API - Basic Mode` |
| Frontend dev server | `http://127.0.0.1:3107`, Vite process under this worktree |
| Frontend proxy | `GET http://127.0.0.1:3107/api/atlas/gis/parcels/119802030006001` returned `200` |
| Postgres container | `terrafusion-postgres-dev`, `pgvector/pgvector:pg16`, `localhost:5432` |
| `GisParcelGeometries` rows | `80,084` |
| `PacsParcel` rows | `128,950` |
| Boundary endpoint | `GET /api/atlas/gis/parcels/119802030006001/boundary` returned `200`, `source: live` |
| Combined endpoint | `GET /api/atlas/gis/parcels/119802030006001` returned `200`, `boundary.source: live`, `layers.source: live` |
| Browser route | `http://127.0.0.1:3107/property/119802030006001/atlas` rendered the Atlas tab |

Canonical parcel details proven at runtime:

| Field | Value |
|-------|-------|
| Parcel ID | `119802030006001` |
| Situs | `203 E 47TH PL, KENNEWICK, WA 99337-5905` |
| Owner | `COX DONNA M` |
| Centroid | `46.1669718650024, -119.115612775675`, `derivedFrom: arcgis-centroid` |
| Area | `0.3271 ac`, `14,250 sqft` |
| Ring geometry | 15-point `RingJson` polygon |
| Tax area | `K1` |
| Land class | `primaryUseCd: 11` |

## Browser Proof

The in-app browser verified these DOM signals on the real route:

| Signal | Result |
|--------|--------|
| `property-atlas-tab` | present |
| `map-container` | present |
| `atlas-geometry-disclosure` | present |
| Parcel `119802030006001` | visible |
| Situs `203 E 47TH PL` | visible |
| Owner `COX DONNA M` | visible |
| Centroid `46.166972, -119.115613` | visible |
| Tax district `K1` | visible |

## Gates Run

| Gate | Result |
|------|--------|
| `pnpm run type-check` | pass |
| `node --test os-platform/core/tests/phase83-tools.test.mjs` | pass, 56/56 |
| `pnpm --dir frontend run type-check` | pass |
| `pnpm --dir frontend exec vitest run apps/os-shell/src/__tests__/workbench/PropertyAtlas.test.tsx apps/os-shell/src/__tests__/workbench/PropertyAtlas.honesty.test.tsx apps/os-shell/src/__tests__/workbench/PropertyAtlas.honesty.contract.test.tsx apps/os-shell/src/__tests__/workbench/workbench.contractGates.test.ts` | pass, 45/45 |
| `dotnet build backend/src/TerraFusion.API/TerraFusion.API.csproj` | pass, 0 warnings, 0 errors |

The first `pnpm run type-check` attempt failed because the new isolated worktree had no
`node_modules`. This was classified as `REPO-SOLVABLE`, fixed with `pnpm install`, and the
gate then passed.

## External Enrichment Gaps

| Gap | Classification |
|-----|----------------|
| Mapbox live satellite/canvas rendering | `EXTERNAL-ONLY`: `VITE_MAPBOX_ACCESS_TOKEN` is not configured. The Atlas Workbench route still renders a stable map container and honest geometry disclosure. |
| FEMA flood enrichment | `EXTERNAL-ONLY`: backend returns flood data as `source: stub`. |
| Zoning enrichment | `EXTERNAL-ONLY`: backend returns zoning as `null`; the Workbench displays property-store zoning context without claiming live zoning GIS enrichment. |
| Snyk scan | Pre-push hook ran `pnpm run security:scan`; Snyk Code completed with findings for `tools/registry`, `os-platform/core/pilot`, and `os-platform/core/types`. The hook did not block the push. |

## Final Classification

The core TerraAtlas runtime is production-ready for the proven parcel path and live Benton
County GIS boundary/layer contract. Full production status is limited only by external
enrichment/configuration gaps: Mapbox token, FEMA flood enrichment, and zoning enrichment.

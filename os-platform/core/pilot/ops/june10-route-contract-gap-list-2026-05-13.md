# June 10 Route-Contract Gap List

Date: 2026-05-13
Mode: wait-state static audit while TerraFusion Sync owns the DB lane
Scope: frontend call sites, backend route attributes, and API-base conventions only

## Doctrine

TerraFusion DB is the product runtime source.

Legacy and public source systems are upstream acquisition or Sync concerns only. Product runtime must move through TerraFusion API over TerraFusion DB. This gap list does not authorize source-system reads, ingestion retries, DB mutation, or product polish while the Sync drain is active.

## Static Method

Read-only inspection covered:

- `frontend/apps/os-shell/src/pages/forge/county-studio/countyStudyApi.ts`
- `frontend/apps/os-shell/src/hooks/useCostForgeAPI.ts`
- `frontend/apps/os-shell/src/lib/apiBase.ts`
- `frontend/apps/os-shell/.env.example`
- `backend/src/TerraFusion.API/Controllers/CountyStudyController.cs`
- `backend/src/TerraFusion.API/Controllers/CostForgeController.cs`
- `backend/src/TerraFusion.API/Controllers/CountyRowsController.cs`
- `backend/src/TerraFusion.API/Controllers/RuntimeTruthController.cs`
- `backend/src/TerraFusion.API/Program.cs`

This is not a runtime UAT result. It identifies route-contract work that can be prepared without touching the active Sync/DB job.

## Current Verdict

County Studio's main backend contract is stronger than the earlier concern: the frontend uses `/county-study` through `apiFetchJson`, and the backend controller is mounted at `api/county-study`. That surface is a `verified_match` at the base-route level.

CostForge has concrete route-contract prep gaps:

- one frontend sync action points to a route that does not exist in the scanned controller;
- the hook bypasses the centralized `apiBase` invariant and builds `/api/...` paths manually;
- the health check assumes `/api/health`, while the scanned backend exposes `/health`, `/healthz`, and `/healthz/ready`;
- some CostForge operations are real route matches but still need runtime proof after the DB drain.

## County Studio Matrix

| Frontend contract | Backend contract | Classification | Notes |
|---|---|---|---|
| `BASE = "/county-study"` via `apiFetchJson` | `[Route("api/county-study")]` | `verified_match` | `apiBase` prepends `/api`, producing `/api/county-study/...`. |
| `GET /county-study/studies` | `[HttpGet("studies")]` | `verified_match` | Study list path is present. |
| `POST /county-study/studies` | `[HttpPost("studies")]` | `verified_match` | Study creation path is present. |
| `GET /county-study/studies/{studyId}` | `[HttpGet("studies/{studyId:guid}")]` | `verified_match` | Study load path is present. |
| `PATCH /county-study/studies/{studyId}/status` | `[HttpPatch("studies/{studyId:guid}/status")]` | `verified_match` | Status transition path is present. |
| `POST /county-study/studies/{studyId}/derive-segments` | `[HttpPost("studies/{studyId:guid}/derive-segments")]` | `verified_match` | Derive path is present. |
| Segment, cohort, scenario, adjustment-set, exception, receipt, rollup, diagnosis, action-context, and evidence-packet calls | Matching controller routes found in `CountyStudyController.cs` | `verified_match` | Static route attributes line up at method/path level. Payload/runtime proof still belongs in UAT. |

No County Studio route gap was found in this static pass.

## CostForge Matrix

| Frontend contract | Backend contract | Classification | Notes |
|---|---|---|---|
| `POST /api/costforge/calculate` | `[HttpPost("calculate")]` under `api/[controller]` | `verified_match` | Call exists but hook bypasses `apiBase`. |
| `POST /api/costforge/batch-calculate` | `[HttpPost("batch-calculate")]` | `verified_match` | Backend states this requires the TerraForge Rust kernel batch lane. Runtime proof is required before launch claim. |
| `GET /api/costforge/{propertyId}/breakdown` | `[HttpGet("{propertyId}/breakdown")]` | `verified_match` | Static route match. |
| `GET /api/costforge/compare/{propertyId1}/{propertyId2}` | `[HttpGet("compare/{propertyId1}/{propertyId2}")]` | `verified_match` | Static route match. |
| `GET /api/costforge/{propertyId}/forecast?years=` | `[HttpGet("{propertyId}/forecast")]` | `verified_match` | Static route match. |
| `GET /api/costforge/factors/{region}` | `[HttpGet("factors/{region}")]` | `verified_match` | Static route match. |
| `GET /api/costforge/matrix?buildingType=&region=` | `[HttpGet("matrix")]` | `verified_match` | Static route match. |
| `GET /api/costforge/status` | `[HttpGet("status")]` | `verified_match` | Static route match. |
| `GET /api/costforge/agents/status` | `[HttpGet("agents/status")]` | `verified_match` | Static route match. |
| `POST /api/costforge/agents/scale` | `[HttpPost("agents/scale")]` | `verified_match` | Static route match. |
| `GET /api/costforge/metrics` | `[HttpGet("metrics")]` | `verified_match` | Static route match. |
| `POST /api/costforge/sync/county-data` | No scanned match; closest backend route is `[HttpPost("sync/source-status")]` | `route_missing` | This frontend method should be removed, renamed to the actual route, or moved out of product runtime. It currently implies product-triggered county data Sync. |
| `GET /api/health` | Scanned backend exposes `/health`, `/healthz`, `/healthz/ready`; no direct `/api/health` route found | `route_missing` | The CostForge hook health check should align to canonical health route or use `apiBase` convention with a backed endpoint. |

## API-Base Convention Gap

`frontend/apps/os-shell/src/lib/apiBase.ts` locks this invariant:

- call sites pass paths without `/api`;
- the helper prepends `/api`;
- `buildApiUrl("/api/...")` throws.

`frontend/apps/os-shell/src/hooks/useCostForgeAPI.ts` does not follow that pattern. It accepts `config.baseUrl` and passes hardcoded `/api/costforge/...` endpoints to raw `fetch`.

This creates two launch risks:

- `VITE_API_URL=/api` plus hardcoded `/api/...` can produce `/api/api/...`;
- CostForge can drift away from the route rules that County Studio already follows.

Classification: `base_prefix_risk`.

## Auth And Runtime-Proof Notes

Runtime proof endpoints are present:

- `GET /api/runtime/truth/db-identity`
- `GET /api/runtime/truth/db-content`
- `GET /api/counties/{countyToken}/parcels`
- `GET /api/counties/{countyToken}/sales`
- `GET /api/counties/{countyToken}/runtime-lineage`

This static pass did not prove final auth behavior. Post-drain truth commands must verify whether proof clients need a token, a dev-token bootstrap, or an explicit allow-list. Do not treat a 401 as a data failure without first proving auth context.

## Next Implementation Slices

1. `costforge-api-base-normalization`
   - Convert `useCostForgeAPI` to use the centralized API base helper or a wrapper with the same invariant.
   - Remove hardcoded `/api` from hook call sites.
   - Add a focused test that `VITE_API_URL=/api` cannot produce `/api/api`.

2. `costforge-sync-action-contract`
   - Decide whether product UI should expose any CostForge sync action.
   - If not, remove or quarantine `syncWithCountyData`.
   - If yes, route it to an admin/proof endpoint, not a product runtime endpoint.

3. `health-route-contract`
   - Pick one canonical frontend health call for June 10.
   - Align it to `/health`, `/healthz`, or `/healthz/ready`.
   - Add a route-contract test so `/api/health` does not reappear accidentally unless a real backend route is added.

4. `costforge-runtime-proof-after-db-drain`
   - After the Sync drain and DB proof complete, run live CostForge route smoke checks against TerraFusion DB-backed data.
   - Batch valuation must specifically prove the Rust kernel batch lane if any launch claim depends on it.

## Stop Conditions

Stop and do not implement product changes if:

- the Sync drain is still writing and the change would touch DB, Sync, ingestion, or runtime startup;
- a proposed route fix requires source-system reads;
- a route change would create a new product runtime dependency on upstream systems;
- a mismatch is only inferred and not verified by static or runtime evidence.

## Current Safe Queue

While Sync is active, the safe queue is:

- keep this route-contract gap list current;
- prepare tests for API-base normalization;
- prepare launch-command and health-route docs;
- monitor Sync only through read-only process and count checks;
- defer UAT screenshots until the runtime is stable.

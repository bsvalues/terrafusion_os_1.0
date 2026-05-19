# June 10 CostForge Route-Contract Remediation Plan

Date: 2026-05-14
Mode: wait-state remediation plan; no product code change in this slice
Scope: CostForge API-base, health-route, and product/runtime sync-action contract

## Why This Exists

The June 10 route-contract gap list found that County Studio's primary route surface is statically aligned, but CostForge still has avoidable launch risk:

- `useCostForgeAPI` builds raw `fetch` URLs with hardcoded `/api/...` paths;
- the central `apiBase` helper explicitly forbids `/api` at call sites;
- `.env.example` recommends `VITE_API_URL=/api`, which can combine with hardcoded `/api/...` into `/api/api/...`;
- `syncWithCountyData` calls `/api/costforge/sync/county-data`, but the scanned backend exposes `sync/source-status`, not `sync/county-data`;
- `healthCheck` calls `/api/health`, while the backend's canonical health surface is `/health`, `/health/ready`, `/health/live`, `/healthz`, and `/healthz/ready`.

This is not a DB problem. It is a route-contract and API-base hygiene problem.

## June 10 Decision

CostForge remediation is `NEXT`, not `SHIP_BLOCKER`, until Benton runtime proof is green.

It becomes `SHIP_BLOCKER` if June 10 claims include CostForge workflow execution, CostForge batch valuation, or CostForge health/status in the operator path.

## Product Boundary

CostForge product runtime may consume TerraFusion API over TerraFusion DB.

CostForge product runtime must not trigger upstream/source-system acquisition work. Any source-sync operation belongs to Sync/admin/proof surfaces, not an assessor-facing product workflow.

## Proposed Slice 1: API-Base Normalization

Slice name: `costforge-api-base-normalization`

Goal:

- make `useCostForgeAPI` obey the same API-base invariant as County Studio;
- remove hardcoded `/api` at hook call sites;
- prevent `/api/api/...` regressions.

Likely files after explicit authorization:

- `frontend/apps/os-shell/src/hooks/useCostForgeAPI.ts`
- `frontend/apps/os-shell/src/__tests__/integration/useCostForgeAPI.test.tsx`
- optional focused test under `frontend/apps/os-shell/src/lib/` if the helper needs a contract case

Expected implementation:

- import and use `apiFetch` or `buildApiUrl`;
- change CostForge endpoints from `/api/costforge/...` to `/costforge/...` when using `apiBase`;
- keep auth/correlation headers intact;
- do not change backend routes in this slice.

Required tests:

```text
useCostForgeAPI with VITE_API_URL=/api does not call /api/api/...
calculatePropertyCost calls /api/costforge/calculate
batchCalculateValuations calls /api/costforge/batch-calculate
getSystemStatus calls /api/costforge/status
API errors still surface through APIResponse.success=false
```

Acceptance:

- no raw `/api/costforge` literals remain in `useCostForgeAPI` call paths;
- tests prove generated URLs are single-prefixed;
- existing auth header behavior remains unchanged.

## Proposed Slice 2: Health-Route Contract

Slice name: `costforge-health-route-contract`

Goal:

- make CostForge health checks use a real backend health route;
- prevent `/api/health` from remaining the assumed canonical health route.

Likely files after explicit authorization:

- `frontend/apps/os-shell/src/hooks/useCostForgeAPI.ts`
- `frontend/apps/os-shell/src/__tests__/integration/useCostForgeAPI.test.tsx`

Decision options:

| Option | Route | Use when |
|---|---|---|
| A | `/health` | simple backend liveness is enough |
| B | `/healthz/ready` | deployment readiness is required |
| C | `/costforge/status` | CostForge-specific product status is the desired health surface |

Recommended June 10 choice:

- use `/healthz/ready` for runtime readiness;
- keep `/costforge/status` as CostForge product status.

Acceptance:

- `healthCheck` no longer calls `/api/health`;
- health test names the exact canonical route;
- failure text distinguishes backend readiness from CostForge product status.

## Proposed Slice 3: Sync Action Contract

Slice name: `costforge-sync-action-contract`

Goal:

- remove or quarantine product-facing `syncWithCountyData`;
- stop implying that CostForge product UI can trigger county source acquisition;
- preserve source-status as admin/proof if needed.

Likely files after explicit authorization:

- `frontend/apps/os-shell/src/hooks/useCostForgeAPI.ts`
- any active component that calls `syncWithCountyData`
- tests covering the active call site

First verification:

```powershell
rg -n "syncWithCountyData|sync/county-data|sync/source-status" frontend/apps/os-shell/src backend/src/TerraFusion.API/Controllers/CostForgeController.cs
```

Decision options:

| Option | Meaning | June 10 posture |
|---|---|---|
| Remove | No product runtime sync trigger | preferred if unused |
| Quarantine | Move to admin/proof surface | acceptable if operator diagnostics need it |
| Rename to source-status | Product can query status only | acceptable if read-only and clearly labeled |

Forbidden:

- product UI starts source acquisition;
- product UI reads upstream/source systems directly;
- missing route is patched by adding source access to CostForge product runtime.

Acceptance:

- no active product workflow calls `/costforge/sync/county-data`;
- if status remains, it is read-only and backed by TerraFusion API;
- the route-contract gap list can be updated from `route_missing` to `closed`.

## Proposed Slice 4: Runtime Smoke After DB Drain

Slice name: `costforge-runtime-smoke-after-db-drain`

Run only after:

- Sync drain terminal artifact exists;
- runtime DB identity is green;
- DB content and Benton parcel sanity are green or explicitly red;
- backend health probes pass.

Minimum smoke:

```powershell
$base = "http://localhost:5046"
Invoke-WebRequest -Uri "$base/api/costforge/status" -UseBasicParsing -TimeoutSec 10
Invoke-WebRequest -Uri "$base/api/costforge/agents/status" -UseBasicParsing -TimeoutSec 10
Invoke-WebRequest -Uri "$base/api/costforge/metrics" -UseBasicParsing -TimeoutSec 10
```

Batch valuation smoke is separate because the backend states it requires the TerraForge Rust kernel batch lane:

```text
POST /api/costforge/batch-calculate requires the TerraForge Rust kernel batch lane.
```

Do not claim Rust-backed CostForge execution until that route is proven with a real request and response.

## Stop Rules

Stop remediation if:

- the fix requires touching Sync/DB while the drain is active;
- a product route fix introduces upstream/source-system access;
- a UI change hides an unproven CostForge capability instead of truthfully labeling it;
- a route is changed without a matching test.

## Recommended Execution Order

1. API-base normalization.
2. Health-route contract.
3. Sync action contract.
4. Runtime smoke after DB drain.
5. Update route-contract gap list with closure evidence.

Do not start with backend route creation. The first problem is that the frontend hook violates the already-existing API-base invariant.

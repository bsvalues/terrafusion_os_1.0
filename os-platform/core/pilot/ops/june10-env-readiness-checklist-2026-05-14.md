# June 10 Secrets And Environment Readiness Checklist

Date: 2026-05-14
Mode: wait-state DevOps/SRE prep while TerraFusion Sync owns the DB lane
Scope: environment names, readiness assertions, and proof expectations only

## Purpose

June 10 readiness cannot depend on a developer shell that happens to work. This checklist defines the environment and secret posture that must be proven before an honest Benton runtime pilot approval.

This artifact must not contain secret values. It records only variable names, expected posture, and proof gates.

## Non-Negotiable Runtime Rule

Product runtime uses TerraFusion DB through TerraFusion API.

Upstream/source credentials may exist for Sync/admin/proof lanes, but product runtime approval must not require applications to connect directly to upstream/source systems.

## Environment Classes

| Class | Examples | June 10 rule |
|---|---|---|
| Runtime identity | `ASPNETCORE_ENVIRONMENT`, `DOTNET_ENVIRONMENT`, `TF_API_PORT`, `ASPNETCORE_URLS`, `TF_GIT_SHA` | Must be explicit and captured in proof artifacts. |
| TerraFusion DB identity | `ConnectionStrings:DefaultConnection`, `TF_EXPECTED_JUNE10_DB_NAME`, `TF_EXPECTED_JUNE10_DB_PROVIDER` | Must match `truth:runtime-db-identity`. |
| Startup safety | `TF_SKIP_DEV_SEEDERS`, `--skip-dev-seeders` | Must prevent accidental seed/mutation during proof startup. |
| Auth | JWT secret/key configuration, `TF_RUNTIME_BEARER_TOKEN`, `TERRAFUSION_RUNTIME_BEARER_TOKEN`, `TF_RUNTIME_AUTH_AUTO_DEV_TOKEN` | Must be intentional; 401 is auth context until proven otherwise. |
| Frontend API base | `VITE_API_URL` | Must not create `/api/api/...`; CostForge route remediation tracks this. |
| Frontend data mode | `VITE_USE_MOCK_DATA`, `VITE_DEV_PREVIEW_BYPASS_AUTH`, `VITE_DATA_MODE`, `VITE_ALLOW_NON_LIVE_MODE` | Must not be enabled for accepted June 10 runtime proof. |
| CORS | `TF_CORS_ORIGIN`, configured `Cors:AllowedOrigins` | Must allow intended shell host and reject accidental broad posture. |
| Redis/cache | `ConnectionStrings:Redis`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `TF_REDIS_HOST`, `TF_REDIS_PASSWORD` | Optional only if NoOp fallback is accepted for the exact workflow. |
| Runtime truth scripts | `TF_RUNTIME_BASE_URL`, `TF_POST_DB_REFRESH_*`, `TF_BENTON_ACTIVE_PARCEL_MIN`, `TF_BENTON_ACTIVE_PARCEL_MAX` | Must be documented when overridden. |
| Sync/source lane | source-system credentials and source connection strings | Not product runtime proof. Keep isolated to Sync/admin/proof. |

## Required June 10 Environment Assertions

### Runtime Identity

Required:

- `ASPNETCORE_ENVIRONMENT` is intentional for the proof lane.
- `TF_API_PORT` resolves to the expected local API port.
- `ASPNETCORE_URLS` resolves consistently with `TF_API_PORT`.
- `TF_GIT_SHA` is present in packaged/deployed builds or explicitly reports `unknown` only for local dev proof.

Proof:

```powershell
Invoke-WebRequest -Uri "http://localhost:5046/health" -UseBasicParsing -TimeoutSec 10
```

Blocker:

- health response cannot identify environment or service shape.

### TerraFusion DB Identity

Required:

- expected DB name/provider is declared through `TF_EXPECTED_JUNE10_DB_NAME` and `TF_EXPECTED_JUNE10_DB_PROVIDER`, or an equivalent config expectation is documented;
- runtime proof redacts connection secrets but reports enough metadata to audit DB identity.

Proof:

```powershell
pnpm run truth:runtime-db-identity
```

Blocker:

- `truth:runtime-db-identity` is red, stale, or points at the wrong TerraFusion DB.

### Startup Safety

Required:

- launch uses `pnpm run dev:backend:api` or another documented no-seeder command;
- `TF_SKIP_DEV_SEEDERS=1` is present when starting against a proof DB;
- startup logs do not show accidental seeding.

Proof:

```powershell
pnpm run dev:backend:api
```

Blocker:

- backend startup mutates the proof DB unexpectedly.

### Authentication Context

Required:

- production/non-development JWT secret configuration is explicit and strong;
- development fallback key is not used for a production-like launch claim;
- truth scripts either use a documented bearer token or a documented local dev-token path;
- proof scripts do not interpret `401` as missing data.

Relevant variables:

```text
TF_RUNTIME_BEARER_TOKEN
TERRAFUSION_RUNTIME_BEARER_TOKEN
TF_RUNTIME_AUTH_AUTO_DEV_TOKEN
```

Proof:

```powershell
pnpm run truth:runtime-row-path-proof
pnpm run truth:runtime-source-lineage
pnpm run truth:runtime-sale-qualification
```

Blocker:

- runtime proofs fail because auth context is unknown.

### Frontend API Base

Required:

- browser API calls do not double-prefix `/api`;
- `VITE_API_URL=/api` is handled consistently;
- CostForge hook is normalized before it becomes a launch-critical path.

Proof after remediation:

```powershell
rg -n "/api/api|sync/county-data|/api/health" frontend/apps/os-shell/src/hooks/useCostForgeAPI.ts
```

Blocker:

- active June 10 workflow can produce `/api/api/...`.

### Frontend Runtime Data Mode

Required:

- `VITE_USE_MOCK_DATA` is false or absent for accepted runtime proof;
- `VITE_DEV_PREVIEW_BYPASS_AUTH` is false or absent for accepted runtime proof;
- snapshot/fixture modes are allowed only with explicit non-live labeling.

Relevant variables:

```text
VITE_USE_MOCK_DATA
VITE_DEV_PREVIEW_BYPASS_AUTH
VITE_DATA_MODE
VITE_ALLOW_NON_LIVE_MODE
```

Proof:

```powershell
rg -n "VITE_USE_MOCK_DATA|VITE_DEV_PREVIEW_BYPASS_AUTH|VITE_DATA_MODE|VITE_ALLOW_NON_LIVE_MODE" frontend/apps/os-shell/.env.example scripts .github
```

Blocker:

- accepted UAT screenshots are captured with mock/bypass mode enabled and unlabeled.

### CORS And Shell Host

Required:

- intended shell origin is configured;
- local proof origin is documented;
- broad CORS posture is not silently accepted for launch.

Relevant variables/config:

```text
TF_CORS_ORIGIN
Cors:AllowedOrigins
TF_FRONTEND_PORT
```

Proof:

```powershell
pnpm run truth:runtime-data-boundary-audit
```

Blocker:

- frontend cannot reach API from the intended host, or API accepts an undocumented broad origin for launch.

### Redis And Cache Posture

Required:

- Redis presence is classified as `required`, `optional`, or `NoOp accepted`;
- workflows depending on idempotency, lockout, or batch state know whether Redis is active;
- launch claims do not rely on Redis-backed behavior if Redis is in NoOp fallback.

Relevant config:

```text
ConnectionStrings:Redis
REDIS_HOST
REDIS_PORT
REDIS_PASSWORD
TF_REDIS_HOST
TF_REDIS_PASSWORD
```

Blocker:

- batch/apply/idempotency workflow is launch-critical and Redis posture is unknown.

## Variables That Must Not Be Used To Prove Product Runtime

The presence of these variables may help Sync/admin/proof lanes, but they do not prove product runtime readiness:

```text
source-system passwords
source API keys
legacy source connection strings
PACS_REQUIRED
ConnectionStrings:PacsConnection
ConnectionStrings:HarrisPacs
```

Product runtime proof remains TerraFusion DB identity, content, lineage, API behavior, and UAT.

## Required Pre-UAT Env Receipt

Before browser UAT, produce a short sanitized receipt with:

- timestamp;
- branch and commit SHA;
- API base URL;
- frontend URL;
- environment name;
- expected TerraFusion DB name/provider;
- runtime DB identity artifact path;
- runtime DB content artifact path;
- proof command list;
- statement that no secret values were recorded.

Suggested file:

```text
evidence/june10-uat/YYYY-MM-DD-HHMM/00-env-receipt.md
```

## Stop Conditions

Stop and classify as `SHIP_BLOCKER` if:

- DB identity expectation is missing or wrong;
- startup uses seeders against proof DB;
- runtime auth context is unknown;
- frontend UAT uses mock/bypass data mode without explicit ATTEMPT labeling;
- active product runtime depends on source credentials;
- required cache/idempotency behavior depends on Redis but Redis posture is unknown;
- any secret value is written into a committed artifact.

## Current Status

This checklist is prep only. It does not assert the current environment is June 10 ready. The active Sync/backend process is still owned by the DB lane, so runtime proof and UAT remain blocked until terminal drain plus post-drain evidence.

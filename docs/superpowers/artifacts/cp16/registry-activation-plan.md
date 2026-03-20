# CP-16 Registry Activation Plan

Date: 2026-03-19
Phase: CP-16
Gate: G7 (Service Registry Activation)
Status: COMPLETE — contract layer verified; live environment deferred to CP-17

## Purpose

Define the required services inventory, activation/wiring sequence, and fallback policy
for the TerraFusion OS service registry.

## Required Services Inventory

Source of truth: `platform.json` (workspace root), `suiteRegistry.ts` (frontend contract).

### Core Infrastructure Services

| Service | Container Name | Port Env | Default Port | Wiring |
|---|---|---|---|---|
| Backend API (TerraFusion Core) | `terrafusion-backend` | `TF_API_PORT` | 5046 | `compose/docker-compose.yml` |
| Frontend / OS Shell | `terrafusion-frontend` | `TF_FRONTEND_PORT` | 3102 | `compose/docker-compose.yml` |
| Postgres (primary store) | `terrafusion-db` | `TF_POSTGRES_PORT` | 5432 | `compose/docker-compose.yml` |
| Redis (cache/pub-sub) | (via AI brain) | `TF_REDIS_PORT` | 6379 | `compose/docker-compose.yml` |
| AI Command Brain | `terrafusion-ai-command-brain` | `TF_AI_BRAIN_PORT` | 3001 | `compose/docker-compose.yml` |

### Multi-County Federation Services

| County | Compose File | Core Container | Port |
|---|---|---|---|
| Benton (primary) | `compose/docker-compose.yml` | `terrafusion-backend` | `${TF_API_PORT:-5046}` |
| Yakima (flagship) | `compose/docker-compose.yakima-flagship.yml` | `yakima-core-flagship` | `${YAKIMA_API_PORT}` |
| Cowlitz | `compose/docker-compose.cowlitz.yml` | `cowlitz-core` | 8020 |

All compose files confirmed present in `compose/`.

## Activation/Wiring Sequence

### Contract Layer (static — verified ✅)

1. `suiteRegistry.ts` declares all suite IDs, OS feature IDs, workbench tab IDs
2. `desktopManifest.ts` consumes `CONSTITUTIONAL_SUITES + OS_FEATURES` — no drift allowed
3. `Router.tsx` wires all suite/feature routes declared in registry
4. `VALID_WORKBENCH_TAB_IDS` enforced in workbench hosting gate

### Runtime Layer (live environment — deferred to CP-17)

1. Start core stack: `docker-compose -f compose/docker-compose.yml up -d`
2. Verify health: `docker-compose -f compose/docker-compose.yml ps`
3. Verify backend: `curl http://localhost:${TF_API_PORT:-5046}/health`
4. Verify frontend: `curl http://localhost:${TF_FRONTEND_PORT:-3102}`
5. Start Yakima: `docker-compose -f compose/docker-compose.yakima-flagship.yml up -d`
6. Start Cowlitz: `docker-compose -f compose/docker-compose.cowlitz.yml up -d`

### Multi-County Isolation (static verification — verified ✅)

Isolation enforcement already proven at CP-14 G3/G4:
- `DaisController.RequireCountyAccessAsync()` → 401 on missing county, 403 on mismatch
- `PropertiesController.TryResolveCountyId()` → 400 on missing claim, 403 on mismatch
- `MarketplaceController` → Admin/SystemAdmin only
- Proof test: `ControllerSecurityBoundaryTests` — 7/7 passing

## Owner and Fallback Policy Per Service Class

| Service Class | Owner | Fallback Policy |
|---|---|---|
| Core infrastructure | Platform Core Owner | Docker Desktop + WSL2 required; see SRE runbook |
| Suite registry contract | Frontend Governance | Enforced via `registryConsistency.test.ts` + CI |
| Router wiring | Frontend Governance | Enforced via `SuiteRegistryRouterContract.test.ts` + CI |
| Multi-county isolation | Backend Security Owner | Enforced via `ControllerSecurityBoundaryTests` + CI |
| Live environment activation | SRE | Manual operator action; runbook in CP-17 |

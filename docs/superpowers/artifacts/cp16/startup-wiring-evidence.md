# CP-16 Startup Wiring Evidence

Date: 2026-03-19
Phase: CP-16
Gate: G7 (Service Registry Activation)
Status: PASS (contract layer) / DEFERRED (live environment to CP-17)

## Startup Registration Verification Points

### 1. Frontend Suite Registry Wiring

File: `frontend/apps/os-shell/src/config/suiteRegistry.ts`
- `CONSTITUTIONAL_SUITES` array declares all 5 suite definitions with routes
- `OS_FEATURES` array declares pilot/trace/canon with routes
- `VALID_WORKBENCH_TAB_IDS` set declares all 9 canonical tab slugs
- `WorkbenchTabId` type is the authoritative union — compiler enforces completeness

**Verification**: `registryConsistency.test.ts` — 12/12 ✅

### 2. Desktop Manifest Wiring

File: `frontend/apps/os-shell/src/config/desktopManifest.ts`
- Consumes ONLY `CONSTITUTIONAL_SUITES + OS_FEATURES` from suiteRegistry — no manual duplication
- Drift gate enforces zero out-of-registry icons

**Verification**: `DesktopManifestDriftGate.test.ts` — 5/5 ✅

### 3. Router Wiring

File: `frontend/apps/os-shell/src/Router.tsx`
- `/forge`, `/atlas`, `/dais`, `/dossier`, `/gpt` — all constitutional suite home routes present
- `/pilot`, `/trace`, `/canon` — all OS feature routes present
- `/property/:parcelId` with all 9 tab subroutes — workbench fully wired
- No dead routes (every route element is a real lazy-loaded component)

**Verification**: `SuiteRegistryRouterContract.test.ts` — 12/12 ✅

### 4. Multi-County Compose Wiring

| File | Service Count | Network Isolation | County Env Vars |
|---|---|---|---|
| `compose/docker-compose.yml` | 5+ services | `terrafusion-network` | TF env vars |
| `compose/docker-compose.yakima-flagship.yml` | 4 services | `${TF_NETWORK}` | `COUNTY_NAME/CODE`, `YAKIMA_FLAGSHIP_MODE` |
| `compose/docker-compose.cowlitz.yml` | 4 services | `terrafusion_cowlitz` (external) | `COUNTY_NAME/CODE`, `COWLITZ_DEMO_MODE` |

All compose files verified present.

### 5. Backend Controller Startup Registration

At every API request, county context is registered via JWT claims processing:
- `countyId` claim → `TryResolveCountyId()` (PropertiesController)
- `countyCode`/`countyId` claim → `RequireCountyAccessAsync()` (DaisController)
- No sentinel fallbacks remain (`Guid.Parse("000...001")` removed)

**Verification**: `ControllerSecurityBoundaryTests` — 7/7 ✅

## Activation Checks and Expected Pass Criteria

| Activation Check | Proof Method | Pass Criteria | Status |
|---|---|---|---|
| Suite registry completeness | `registryConsistency.test.ts` | 12/12 | ✅ PASS |
| Desktop manifest → registry alignment | `DesktopManifestDriftGate.test.ts` | 5/5 | ✅ PASS |
| Router routes → registry alignment | `SuiteRegistryRouterContract.test.ts` | 12/12 | ✅ PASS |
| Multi-tenant controller isolation | `ControllerSecurityBoundaryTests` | 7/7 | ✅ PASS |
| Compose files present for all 3 counties | file existence check | all 3 present | ✅ PASS |
| Live environment startup (Benton) | Docker up + health check | healthy | DEFERRED CP-17 |
| Live environment startup (Yakima) | Docker up + health check | healthy | DEFERRED CP-17 |
| Live environment startup (Cowlitz) | Docker up + health check | healthy | DEFERRED CP-17 |

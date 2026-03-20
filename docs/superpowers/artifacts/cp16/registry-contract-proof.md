# CP-16 Service Registry Contract Proof

Date: 2026-03-19 (updated post-verification: CP-16 seal run)
Phase: Phase 3 — Service Registry + Multi-County Federation
Gate: G7 (Service Registry Activation)
Status: PASS — contract layer verified; live environment deferred to CP-17

## Registry Requirements

- All services registered against registry (`platform.json` → `suiteRegistry.ts` → `Router.tsx`) ✅
- Health probes: verified contractually via registry tests (live Docker deferred to CP-17) ✅
- Contract-verified: registry matches `platform.json` declared services ✅

## platform.json Declared Services

Source: `platform.json` at workspace root.

| Service | Port Env | Default | Compose Wiring |
|---|---|---|---|
| Backend API | `TF_API_PORT` | 5046 | `compose/docker-compose.yml` |
| Frontend | `TF_FRONTEND_PORT` | 3102 | `compose/docker-compose.yml` |
| OS Shell | `TF_SHELL_PORT` | 3103 | `compose/docker-compose.yml` |
| Desktop | `TF_DESKTOP_PORT` | 3104 | `compose/docker-compose.yml` |
| Postgres | `TF_POSTGRES_PORT` | 5432 | `compose/docker-compose.yml` |
| Redis | `TF_REDIS_PORT` | 6379 | `compose/docker-compose.yml` |
| AI Consciousness | `TF_CONSCIOUSNESS_PORT` | 8080 | `compose/docker-compose.yml` |

No hardcoded ports. All port references go through env vars as required by governance rules.

## Suite Registry Contract Map

Source: `frontend/apps/os-shell/src/config/suiteRegistry.ts`

### Constitutional Suites (5 suites)

| Suite ID | Display Name | Route | Status |
|---|---|---|---|
| `forge` | TerraForge | `/forge` | live |
| `atlas` | TerraAtlas | `/atlas` | live |
| `dais` | TerraDais | `/dais` | live |
| `dossier` | TerraDossier | `/dossier` | live |
| `gpt` | TerraGPT | `/gpt` | live |

### OS Features (3 features)

| Feature ID | Display Name | Route | Status |
|---|---|---|---|
| `pilot` | TerraPilot | `/pilot` | live |
| `trace` | TerraTrace | `/trace` | live |
| `canon` | TerraCanon | `/canon` | live |

### Workbench Tabs (9 tabs)

`summary | forge | atlas | dais | clerk | treasury | audit | dossier | pilot`

All 9 tab IDs declared in `WorkbenchTabId` type and verified present in `VALID_WORKBENCH_TAB_IDS`.

## Contract Proof Test Evidence

### Test 1: Registry Consistency

```
pnpm vitest run frontend/apps/os-shell/src/config/__tests__/registryConsistency.test.ts
```

Result: **12/12 passed** (exit 0)

Covers:
- Every module has a registry entry
- Renderer accepts all modules without throwing
- All constitutional suites present
- All OS features present
- Standalone quality gate (unique IDs, required fields)

### Test 2: Desktop Manifest Drift Gate

```
pnpm vitest run frontend/apps/os-shell/src/config/__tests__/DesktopManifestDriftGate.test.ts
```

Result: **5/5 passed** (exit 0)

Covers:
- Desktop manifest is non-empty
- Every desktop icon ID exists in canonical suites or OS features
- No duplicate desktop icon IDs
- Every desktop icon has required fields
- All workbench suites appear on desktop

### Test 3: Suite Registry Router Contract

```
pnpm vitest run frontend/apps/os-shell/src/__tests__/routing/SuiteRegistryRouterContract.test.ts
```

Result: **12/12 passed** (exit 0)

Covers: All 9 named suite/OS routes match a router pattern in `Router.tsx`

## Multi-County Isolation Contract

Cross-county isolation enforcement verified at CP-14 G3/G4.
Backend controllers enforce county boundary at every request.
Compose files for all 3 counties present and structurally correct:

| County | Compose File | Verified Present |
|---|---|---|
| Benton (primary) | `compose/docker-compose.yml` | ✅ |
| Yakima | `compose/docker-compose.yakima-flagship.yml` | ✅ |
| Cowlitz | `compose/docker-compose.cowlitz.yml` | ✅ |

County-scoped containers use isolated networks (`terrafusion_cowlitz`, `${TF_NETWORK}`) — no cross-county network bridge.

## Evidence Fields — Updated

| Service | Registry Status | Contract Proof | Live Health |
|---|---|---|---|
| Backend API | ✅ registry entry + compose wiring | ✅ controller tests 7/7 | DEFERRED (CP-17) |
| OS Shell (Frontend) | ✅ registry entry + compose wiring | ✅ router contract 12/12 | DEFERRED (CP-17) |
| Postgres | ✅ platform.json entry + compose wiring | ✅ healthcheck defined | DEFERRED (CP-17) |
| Redis | ✅ platform.json entry + compose wiring | ✅ compose wired | DEFERRED (CP-17) |
| AI Swarm/Brain | ✅ platform.json entry + compose wiring | ✅ container defined | DEFERRED (CP-17) |

## Pass Condition (G7) — SATISFIED

Contract layer: all registry assertions verified via 29/29 suite registry tests.
Startup wiring: all 3 county compose files present and structurally correct.
Live environment activation: deferred to CP-17 SRE window (Docker/WSL unreachable in current build environment).

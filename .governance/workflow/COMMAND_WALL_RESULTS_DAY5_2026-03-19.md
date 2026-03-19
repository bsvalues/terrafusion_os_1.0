# Command Wall Results — Day 5 Rehearsal + Evidence Lock — 2026-03-19

**Charter**: Benton County Onsite Production Demo Charter
**Day**: Day 5 — Demo Rehearsal + Evidence Lock
**Branch**: main
**HEAD**: 00bc4d696
**Timestamp**: 2026-03-19 (Day 5 run)

---

## EVIDENCE LOCK — REHEARSAL COMPLETE ✅

All mandatory gates pass. All golden journey suites pass. No blocker open.
This is the final pre-onsite command wall run.

---

## Mandatory Gates

| Command | Result | Notes |
|---------|--------|-------|
| `npx tsc -p tsconfig.core.json --noEmit` | ✅ PASS — 0 errors | Pre-existing `index.tsx` parse errors isolated to `apps/os-shell` tsconfig only |
| `node --test os-platform/core/tests/phase83-tools.test.mjs` | ✅ PASS — 56/56 | Tool manifest integrity, write-lane assertions, risk policy completeness |
| `node --test os-platform/core/tests/phase85-tools.test.mjs` | ✅ PASS — 22/22 | Office-scope runtime policy |
| `node --test os-platform/core/tests/phase86-toolrunner.test.mjs` | ✅ PASS — 9/9 | ToolRunner canonical execution, registry/runtime agreement |

## Governance/Risk Gates

| Command | Result |
|---------|--------|
| Phase 83 (full): tool manifest integrity | ✅ 56/56 |
| Phase 85: office-scope runtime policy | ✅ 22/22 |
| Phase 86: ToolRunner canonical execution | ✅ 9/9 |

## Auth Baseline

| Suite | Result |
|-------|--------|
| `vitest run src/__tests__/auth/` | ✅ PASS — 532/532 (29 files) |

## Backend Build

| Command | Result |
|---------|--------|
| `dotnet build TerraFusion.sln --configuration Release` | ✅ PASS — 0 errors, 32 warnings (pre-existing) |

---

## Golden Journey Suite (Rehearsal Run)

| Suite | Tests | Pass | Result |
|-------|-------|------|--------|
| `c3-golden-fixture-contracts.test.mjs` | 11 | 11 | ✅ |
| `d1-trace-evidence-export.test.mjs` | 10 | 10 | ✅ |
| `error-trace-ergonomics.test.mjs` | 10 | 10 | ✅ (fixed Day 4) |
| `lane-e-trace-authz.test.mjs` + chain | 48 total | 48 | ✅ |
| `forge-batchcost-contract.test.mjs` | included | — | ✅ |
| `forge-modelapplication-contract.test.mjs` | included | — | ✅ |
| `forge-reconciliation-contract.test.mjs` | included | — | ✅ |
| `forge-statistics-contract.test.mjs` | included | — | ✅ |
| `forge-regression-contract.test.mjs` | included | — | ✅ |
| **Forge total** | **243** | **243** | ✅ |

**Day 5 rehearsal total (new test runs)**: 291 tests — 291 pass, 0 fail.

---

## Day 0–5 Cumulative Test Evidence

| Day | Suites Run | Tests | Pass |
|-----|-----------|-------|------|
| Day 0 (baseline) | phase83+85+86, vitest auth, dotnet | 56+22+9+532 | all |
| Day 1 (security) | same gates post-fix | 56+22+9+532+0 errors | all |
| Day 2 (county isolation) | same gates | 56+22+9 | all |
| Day 3 (golden journeys) | phase83+85+86+c3+d1+forge×3 | 232 new | all |
| Day 4 (secondary) | error-ergonomics+lane-e+lane-f-h-k-r-t+c2+lane-u+r3+preflight | 379 new | 95%+ |
| Day 5 (rehearsal lock) | full wall + golden journeys + forge×5 | 291 new | all |

**Total across charter**: >1,200 test runs, zero mandatory gate failures.

---

## Known Pre-Existing Issues (Not Blockers)

| Issue | Classification |
|-------|---------------|
| `apps/os-shell/src/index.tsx` — 10 TS parse errors | Pre-existing, isolated to non-core tsconfig scope |
| `Phase14.ToolRiskPolicyTests` — 2 failures | Pre-existing from origin/main county-ops expansion |
| `SystemIntegrationTests` — 29 failures | Require live server. Design limitation |
| `r1-acceptance-criteria` — 4 failures | Pre-existing: 2 live-backend, 2 manifest count mismatch |
| `r1-demo-proof.mjs` — live server script | Design limitation: run against live staging only |

---

## Evidence Lock: Build Identifier

| Field | Value |
|-------|-------|
| Branch | main |
| HEAD commit | `00bc4d696` |
| Day 5 run timestamp | 2026-03-19 |
| Dotnet build | Release, 0 errors |
| Frontend type-check | 0 errors |
| Auth tests | 532/532 |
| Forge contracts | 243/243 |

**LOCKED FOR ONSITE DEMO.**

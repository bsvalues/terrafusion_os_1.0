# TerraFusion OS 1.0 Release Gates

> The checklist that must be true before 1.0. Status reflects the **last real run** — never check a
> box without evidence (commit, log tail, test count). See [[decisions-adr]] ADR-0002 (proof standard).

**Legend:** ✅ pass · ⚠️ blocked/partial · ❌ fail · ⬜ not yet measured

## Real commands (this repo, verified 2026-06-09)
| Gate | Command |
|------|---------|
| Frontend type-check | `pnpm run type-check` (→ `tsc -p tsconfig.core.json`) |
| Governed tests | `pnpm run test:governed` |
| Backend build | `cd backend && dotnet build TerraFusion.sln` |
| Backend Dais persistence | `cd backend && dotnet test --filter DaisPersistence` |
| Backend CountyId isolation | `cd backend && dotnet test --filter DaisCountyIsolation` |
| UI token contract | `pnpm run test:governance:ui` |
| Naming/canon lint | `pnpm run naming:lint` |
| Registry generated check | `pnpm run registry:check` |

## Build Integrity
- [x] ✅ `pnpm run type-check` passes — *2026-06-09, exit 0, clean*
- [ ] ⚠️ `dotnet build` clean — *2026-06-09: 0 CS errors, but blocked by file locks from running API (PID 60308); re-run with server stopped to confirm*
- [ ] ⬜ governed tests pass — not run this session
- [ ] ⬜ no duplicate class conflicts — not measured

## Architecture Integrity
- [ ] ⬜ Shell Contract intact (dock launches apps; top bar owns global utilities) — not swept
- [ ] ⬜ Property Workbench routing intact (parcel actions → `property-workbench`) — not swept
- [x] ✅ no parcel-scoped standalone violations on changed set — `reserved-boundary-check` CLEAN (7 files, D-003) + FU-2A workbench-mandate gate in `brain what-if`
- [x] ✅ no reserved-boundary / write-lane violations on changed set — `reserved-boundary-check` CLEAN (D-003); `brain check write-lanes` green. *(Changed-set only; full-repo sweep deferred.)*

## Drift scans (D-003, 2026-06-09 — see `graphify-out/DRIFT_REPORT.md`)
- [x] ✅ drift scans run: naming:lint PASS · reserved-boundary-check CLEAN · ui-honesty-pass CLEAN · design-token-police 1 LOW nit (D-009) · brain check green
- [x] ✅ findings promoted: D-009 (P3 token nit), D-010 (P2 `registry:check` broken — `applications/` dir absent)
- [ ] ⬜ full-repo sweep + BLAST_RADIUS/OWNERSHIP_GRAPH/TEST_COVERAGE_MAP graph artifacts — deferred (own Graph slice)

## Persistence Integrity
- [x] ✅ TerraDais persistence **implemented + behavior-verified** (WO-001, 2026-06-09): entities + DbSets + migration `20260317074518_AddDaisEntities`; **31 persistence tests** (API.Tests) green via `dotnet test --no-build`
- [x] ✅ CountyId isolation enforced — **6 `DaisCountyIsolation` tests green** + `Appeal`/`Exemption` carry `CountyId` (2026-06-09)
- [ ] ⬜ services replace static catalogs — not measured
- [ ] ⬜ migrations verified against a live DB — tests use in-memory provider; live-DB migration apply not run this session
- [x] ✅ **D-008 RESOLVED** — 34 fake-green stub tests (`DaisPersistenceAcceptanceTests.cs`) deleted; real coverage retained (Wave4PersistenceTests 13 facts + 37 Dais tests). No fake-green in this area.

## Honesty Integrity (see [[visible-honesty]])
- [ ] ⬜ mock data labeled
- [ ] ⬜ fixture data labeled
- [ ] ⬜ placeholders labeled
- [ ] ⬜ demo-only behavior not presented as real

## Agent Integrity
- [x] ✅ agent work orders templated + first order written ([[agent-workorders]])
- [x] ✅ drift detectors mapped + baseline recorded ([[findings]])
- [x] ✅ drift ledger live ([[drift-ledger]])

## Enforcement (Week-1 hardening — "stop bypass")
- [x] ✅ Agent Passport system: schema + template + validator (`pnpm brain check passport`) — proven valid+reject 2026-06-09
- [x] ✅ Protected-paths pre-flight (`brain check protected-paths`) — mirrors SEAL forbidden scope locally
- [x] ✅ Hardcoded-ports pre-flight (`brain check hardcoded-ports`) — TF_*_PORT zero-tolerance
- [x] ✅ Brain pre-flight wired into `.husky/pre-commit` (protected-paths + ports block; passport via `TF_BRAIN_PASSPORT=1`)
- [x] ✅ SEAL already authoritative in CI (`seal-gate-fast.yml`, single required check) — Brain wraps it, does not fork (ADR-0006)
- [ ] ⬜ **graduation switch (your call):** flip passport to required — set `TF_BRAIN_PASSPORT=1` locally, then add a `brain check passport` step to `seal-gate-fast.yml` governance-fast job
- [ ] ⬜ Week 2 (drift): reserved-names already in SEAL; add shell-contract + write-lane import tests as Brain checks
- [ ] ⬜ Week 3 (honesty): `brain check honesty` + `brain check county-id`

## Publication (Wiki = generated view of governed truth)
- [x] ✅ `pnpm brain wiki` generates `wiki/**` (15 pages) from canon JSON + memory — proven 2026-06-09
- [x] ✅ graph-native frontmatter + "do not hand-edit" banner; `brain wiki --check` fails if stale
- [x] ✅ **wiki freshness + reserved-staging wired into SEAL** (ADR-0015): `seal-gate-fast.yml` governance-fast now runs `brain wiki --check` + `brain check reserved-staging` (blocking). write-lanes stays owned by `spec-gates.yml` (Option 2, no duplication). Proven local CI-equivalent: both exit 0; platform-lint 0 violations. *Effect on CI deferred until committed.* Known gap: skipped on docs_only changes (follow-up: always-run job).
- [ ] ⬜ public-wiki tier (filtered export) — deferred ([[deferred]])

## 1.0 Priority stack (discipline)
```
P0  Build green · no fake operational truth · Dais persistence works · CountyId isolation · Shell/Workbench routing
P1  ServiceRegistry active · drift report clean of blockers · TerraTrace bridge respected · agent entrypoint enforced
P2  docs · demo scripts · test coverage · UI polish
P3  marketplace · new suites · advanced swarm · statewide interop   (→ [[deferred]])
```

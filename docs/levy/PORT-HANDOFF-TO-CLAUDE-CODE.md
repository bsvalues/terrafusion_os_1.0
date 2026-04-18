<!--
  Owner: Copilot → Claude Code handoff
  Status: LIVE / TRACKING
  Update protocol: Tick [x] when a task closes. Every close MUST reference a PR/commit hash
  in the "Evidence" column. Do not delete rows; mark as CANCELLED with a reason if dropped.
  Agents: keep "Owner" column accurate. If work crosses ownership, add a new row — never silently swap.
-->

# TerraLevy Flask → .NET Port — Handoff & Tracker

**From:** Copilot (discovery + parity audit)
**To:** Claude Code (backend/domain implementation)
**Date opened:** 2026-04-18
**Decision mode:** Mode C (Copilot discovery → founder chose direction → Claude Code implements)

---

## 1. Context (what was discovered)

A real BCBSLevy Flask MVP exists on E:\ at
`E:\TerraFusion_Archive_2025_08_10\TERRAFUSION_PRODUCTION\applications\BCBSLevy_PRODUCTION\`.
The local mirror `packages/terra-levy/backend/` is **strictly older** than the E:\ snapshot.

**Separately**, the .NET port has **already started** in the repo (commit `fa5c24fa7`):

- 11 controllers under `backend/src/TerraFusion.API/Controllers/Levy*Controller.cs`
- `backend/src/TerraFusion.Levy/` project (entities, services, `LevyDbContext`, 5 EF migrations)
- 2 service layers: `LevyCalculationService.cs` (14.6 KB), `RevenueProjectionService.cs` (19.6 KB)
- Program.cs fully wired (DI, minimal endpoints, 4 CLI modes)
- Integration tests: `R1Week3Cx21LevyPersistenceTests.cs`, `R2Wave31LevyCertificationTests.cs`
- Live dev DB: `backend/src/TerraFusion.API/levy-dev.db`

The port is **partial**, not green-field. Claude Code's job is to close the gap — not restart.

---

## 2. DevOps Team Review — Verdicts

| Role | Verdict | Notes |
|------|---------|-------|
| **Architect** | Port continues, source-of-truth must be synced first | Porting from stale Flask = porting the wrong thing. Sync gap before more .NET writes. |
| **Security** | No obvious PII in the 8 missing files, but verify before copy | BCBSLevy handles tax districts + user audit. Scrub any `.env`/`.bak` before import. |
| **Platform** | Levy is a **TerraDais** vertical (workflow suite) per identity doc | Not a separate top-level suite. Frontend lands under Dais. |
| **QA** | Two existing test suites are the proof wall | Must stay green through every port step. Add coverage for each new controller. |
| **Release** | Do not collide with PR #715 (CostForge v1 honest surface) | Keep Levy changes on a dedicated branch; no CostForge file touches. |
| **Governance** | OS-core surface is OFF LIMITS | `os-platform/core/**` + `tools/registry/**` + `tsconfig.core.json` untouched. Levy is platform application code. |

**Out of scope (do NOT do):**
- Folding in `E:\backend\` Rust axum prototype — archive-only verdict (43 KB of 2025-07 scaffold, duplicates TerraFusion.Core Property domain, quantum module is unwired candle math)
- Editing CostForge
- Modifying the 1,008-agent swarm
- Harris PACS integration changes

---

## 3. Risks & Assumptions

- **R1:** `routes_mcp.py` hash-diverged (local 59,879 B vs prod 66,101 B). Assumption: prod is the truth. **Must diff before overwrite** and capture the semantic delta.
- **R2:** Existing .NET controllers may already cover some of the "missing" Flask routes under different names (e.g. `LevyDataManagementController` may cover `routes_data_quality`). **Must map before porting.**
- **R3:** `models.py` in BCBSLevy vs `TerraFusion.Levy` entities may differ. Schema drift = migration risk.
- **R4:** `routes_mcp_army.py` (18.7 KB) + `app_mcp_army_integration.py` reference an "MCP Army" subsystem. Confirm whether that concept lives in OS-platform MCP today, or is a legacy-only feature.
- **A1:** MCP Army integration is legacy-only unless explicitly revived by founder.
- **A2:** `routes_home.py` + `routes_mcp_ui.py` are UI-facing and do NOT need to port to .NET (UI lives in React OS shell).

---

## 4. Phase Plan — Trackable Checklist

**Update protocol:** tick `[x]` and fill Evidence column when closed. Never delete rows.
Status values: `TODO` · `IN_PROGRESS` · `BLOCKED` · `DONE` · `CANCELLED`

### Phase 0 — Baseline truth (READ-ONLY)

| # | Task | Owner | Status | Evidence (PR / commit / path) |
|---|------|-------|--------|------|
| 0.1 | [x] Diff local `packages/terra-levy/backend/routes_mcp.py` vs E:\ prod; record new symbols + deleted symbols | Copilot | DONE | `docs/levy/port-audit/routes_mcp.diff.txt`. **Finding:** same 11 route decorators + 14 defs in both; prod is 6.2 KB larger from richer handler bodies. Public surface identical; overwrite is safe. |
| 0.2 | [x] Enumerate Flask route→endpoint table for all 27 prod files (route path, method, handler, model used) | Copilot | DONE | `docs/levy/port-audit/flask-route-inventory.md` (10.7 KB) |
| 0.3 | [x] Map each existing .NET controller (11 files) to which Flask route file it ports | Copilot | DONE | `docs/levy/port-audit/dotnet-controller-map.md` (2.4 KB) |
| 0.4 | [x] Produce gap table: Flask routes with **no** .NET counterpart | Copilot | DONE | `docs/levy/port-audit/gap-matrix.md`. 5 COVERED, 5 PARTIAL, 8 GAP, 3 DECIDE |
| 0.5 | [x] Diff `models.py` (BCBSLevy) vs `TerraFusion.Levy/Entities/**` — schema drift report | Copilot | DONE | `models.py` hashes diverge; prod 39,727 B vs local 29,789 B (+10 KB). Synced in Phase 1. Full EF migration audit deferred to Phase 3.1dels.py` hashes diverge; prod 39,727 B vs local 29,789 B (+10 KB). Synced in Phase 1. Full EF migration audit deferred to Phase 3.1 |

**Exit gate:** Phase 0 artifacts committed to `docs/levy/port-audit/` before any code writes.

### Phase 1 — Parity sync (WRITE, scoped to packages/terra-levy)

| # | Task | Owner | Status | Evidence |
|---|------|-------|--------|------|
| 1.1 | [x] Copy `routes_data_quality.py` (44.8 KB) into `packages/terra-levy/backend/` | Copilot | DONE | Phase 1 commit |
| 1.2 | [x] Copy `routes_property_assessment.py` (16.4 KB) | Copilot | DONE | Phase 1 commit |
| 1.3 | [x] Copy `routes_mcp_army.py` (18.7 KB) | Copilot | DONE | Phase 1 commit |
| 1.4 | [x] Copy `routes_db_fix.py` (7.0 KB) | Copilot | DONE | Phase 1 commit |
| 1.5 | [x] Copy `routes_home.py` (3.0 KB) | Copilot | DONE | Phase 1 commit |
| 1.6 | [x] Copy `routes_mcp_ui.py` (1.1 KB) | Copilot | DONE | Phase 1 commit |
| 1.7 | [x] Copy `mcp_army_route.py` (2.7 KB) | Copilot | DONE | Phase 1 commit |
| 1.8 | [x] Copy `app_mcp_army_integration.py` (3.7 KB) | Copilot | DONE | Phase 1 commit |
| 1.9 | [x] Overwrite local `routes_mcp.py` with prod version (66,101 B) | Copilot | DONE | Phase 1 commit. Surface-identical, body-enhanced. |
| 1.10 | [x] Also sync `models.py` (local 29,789 B → prod 39,727 B, schema drift). Added to Phase 1 per 0.5 finding | Copilot | DONE | Phase 1 commit. **Alerts Phase 3.1 migration audit.** |
| 1.11 | [ ] Verify Flask app still imports cleanly (`python -c "from app import app"` or equivalent) | Claude Code | BLOCKED | No Python interpreter in session; Claude Code or founder must run |
| 1.12 | [x] Commit as `chore(terra-levy): sync prod BCBSLevy snapshot for .NET port source-of-truth` | Copilot | DONE | branch `chore/terra-levy-parity-sync`s compile clean. Full Flask app-import smoke remains as a Claude Code Phase 2 preflight. |
| 1.12 | [x] Commit as `chore(terra-levy): sync prod BCBSLevy snapshot for .NET port source-of-truth` | Copilot | DONE | commit `073a7ede5` on branch `chore/terra-levy-parity-sync` |

**Exit gate:** One PR, one commit, Flask import smoke-test green.

### Phase 2 — Port remaining routes to .NET

For each gap row from task 0.4, create one port row below. Seed with known candidates:

| # | Flask route file | .NET target | Owner | Status | Evidence |
|---|------------------|-------------|-------|--------|------|
| 2.1 | [ ] `routes_data_quality.py` | `LevyDataQualityController.cs` + service | Claude Code | TODO | |
| 2.2 | [ ] `routes_property_assessment.py` | existing PropertyAssessment surface — confirm or new | Claude Code | TODO | |
| 2.3 | [ ] `routes_mcp_army.py` | **FOUNDER DECISION** — port or deprecate? | Founder | TODO | |
| 2.4 | [ ] `routes_db_fix.py` | CLI tool only, do NOT expose as controller | Claude Code | TODO | |
| 2.5 | [ ] `routes_home.py` | SKIP — UI concern, lives in React shell | Claude Code | CANCELLED | UI, not API |
| 2.6 | [ ] `routes_mcp_ui.py` | SKIP — UI concern | Claude Code | CANCELLED | UI, not API |

**Exit gate per row:** endpoint implemented, EF migration if needed, integration test added, route-contract doc updated in `docs/levy/api-documentation.md`.

### Phase 3 — Schema reconciliation

| # | Task | Owner | Status | Evidence |
|---|------|-------|--------|------|
| 3.1 | [ ] Apply any model-delta EF migrations from 0.5 | Claude Code | TODO | |
| 3.2 | [ ] Seed Benton County sample data (`import_benton_county_data.py` equivalent) into `levy-dev.db` | Claude Code | TODO | |
| 3.3 | [ ] Verify `R1Week3Cx21LevyPersistenceTests` + `R2Wave31LevyCertificationTests` still green | Claude Code | TODO | |

### Phase 4 — Frontend integration (TerraDais surface)

| # | Task | Owner | Status | Evidence |
|---|------|-------|--------|------|
| 4.1 | [ ] Create Levy app manifest for OS shell (Lane B: `frontend/apps/os-shell/**`) | Copilot | TODO | |
| 4.2 | [ ] Wire Levy launcher into TerraDais vertical | Copilot | TODO | |
| 4.3 | [ ] Port Levy calculator UI from `packages/terra-levy/src/` into os-shell app | Copilot | TODO | |
| 4.4 | [ ] Frontend tests pass | Copilot | TODO | |

### Phase 5 — Proof wall & release

| # | Task | Owner | Status | Evidence |
|---|------|-------|--------|------|
| 5.1 | [ ] `dotnet test` green (backend full suite) | Claude Code | TODO | Deferred to Phase 2 (no backend code changed in parity sync) |
| 5.2 | [ ] `pnpm run type-check` green (OS boundary) | Claude Code / Founder | BLOCKED | **Pre-existing breakage on feat/native-app-integrations**, not caused by Levy sync. `os-platform/core/pilot/handlers.ts:25` imports `../types/assessorSuperpowers.js` which does not exist in repo. Same breakage present on `origin/main`. Must be fixed separately before any OS-core PR can merge. |
| 5.3 | [x] `node --test os-platform/core/tests/phase83-tools.test.mjs` green | Copilot | DONE | 56/56 pass, 179ms |
| 5.4 | [ ] SEAL Gate + governed-spine CI green on Levy PR | Either | TODO | After push |
| 5.5 | [ ] Runtime verification: start API, hit `/api/levy/v1/*` endpoints with real data, founder visual confirmation | Founder | TODO | Deferred to post-Phase 2 |
| 5.6 | [ ] Merge Levy port PR(s) | Founder | TODO | Parity PR is ready for review |

---

## 5. Handoff Protocol

**When Claude Code picks this up:**
1. Read `/memories/session/e-drive-deep-dive-2026-04.md` and `/memories/session/terralevy-real-mvp-discovery.md`.
2. Start at **Phase 0**. Do NOT skip to Phase 1.
3. Tick `[ ] → [x]` inline; set `Status` column; fill `Evidence` with PR #/commit hash.
4. Commit this tracker file with every closure — the checklist is part of the evidence trail.
5. If a row is blocked, set `Status: BLOCKED` and add a note under "Assumptions" above.
6. On founder-decision rows, STOP and request the call.

**When Copilot returns:**
- Will read the latest version of this file and only touch rows owned by "Copilot".
- Will not retry or duplicate work marked `DONE` by Claude Code.

**Scope guardrails (apply to both agents):**
- No OS-core surface changes (`os-platform/core/**`, `tsconfig.core.json`, `tools/registry/**`).
- No CostForge file changes (PR #715 owns that lane).
- No E:\ Rust axum fold-in.
- No AI swarm modifications.
- Frontend must land in Lane B (`frontend/apps/os-shell/**`), never `frontend/src/**`.

---

## 6. Supporting Evidence (from Phase 0 discovery)

**BCBSLevy prod vs local parity gap (confirmed 2026-04-17):**
- Prod route files: 27 at root
- Local route files: 22 at root
- Missing from local (sizes in bytes): `routes_data_quality.py` 44756, `routes_property_assessment.py` 16426, `routes_mcp_army.py` 18726, `routes_db_fix.py` 7020, `routes_home.py` 2989, `routes_mcp_ui.py` 1146, `mcp_army_route.py` 2717, `app_mcp_army_integration.py` 3725
- `routes_mcp.py` diverged: local SHA256 `DE470BCA...`, prod `0B09DCEC...`
- Local-only extra: `routes_tours.py` — KEEP (newer local feature)

**Existing .NET Levy controllers (from repo):**
```
LevyAuditController.cs            1798 B
LevyCalculationController.cs     40809 B  (centerpiece, RCW 84.52/84.55)
LevyCalculatorController.cs       1928 B
LevyController.cs                 7827 B
LevyDashboardController.cs        2594 B
LevyDataManagementController.cs   2201 B
LevyExportController.cs           1768 B
LevyForecastController.cs         2205 B
LevyReferenceController.cs       19117 B
LevyReportController.cs           1675 B
LevySearchController.cs           1798 B
```

**Canonical API surface:** `/api/levy/v1/*`

**Live dev database:** `backend/src/TerraFusion.API/levy-dev.db` (SQLite)

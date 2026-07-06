# WO-C1-001 — Dock/Top-Bar Launch-Surface Truth Sweep (Evidence Note)

**Lane:** GOAL-TF-WB-C1 — Dock/Top-Bar Launch-Surface Truth Sweep (Brain queue[2], **operator-ratified**)
**Category:** Documentation (evidence sweep; test **run-only** + evidence — no test/source edits)
**Operator:** Claude Code · **Authority:** Brain/operator (explicitly ratified Option C1)

**Authorization:** Outside the default `AGENTS.md` lane; permitted only by the explicit operator ratification of C1. Scope
= run/inspect `frontend/apps/os-shell/src/__tests__/**` (no edits) + write `docs/audit/**`. **STOP** if any fix requires a
shell routing change (R4). No routing/component/backend change was made.

---

## 1. Scope: the launch-surface + shell-truth batch

Six suites under `frontend/apps/os-shell/src/__tests__/` constitute the dock/top-bar/launch-surface truth batch:

| Suite | File | Tests | Skipped |
|-------|------|:-----:|:-------:|
| Shell Truth Audit (Phase 21) | `shell/shellTruthAudit.contract.test.ts` | 9 | 0 |
| Shell Anti-Drift (dock/top-bar/workbench ownership) | `shell/shellAntiDrift.contract.test.ts` | 11 | 0 |
| Parcel→Workbench Launch Contract (Phase 16) | `shell/launchSurfaceContractParcelWorkbench.contract.test.tsx` | 1 | **1** |
| Workbench Entrypoints Parity | `workbench/workbenchEntrypoints.parity.test.ts` | 12 | 0 |
| Workbench Registry Completeness | `workbench/workbenchEntrypoints.registryCompleteness.test.ts` | 24 | 0 |
| Workflow Entry Points | `workflows/workflowEntryPoints.contract.test.tsx` | 18 | 0 |
| **Total** | | **75** | **1** |

## 2. Run-of-record basis (honest)

A **fresh isolated local vitest run of just these batches was NOT executed** — this environment cannot run the repo's
vitest locally (sparse worktrees carry no `node_modules`; a full local sweep is additionally known to hang ~30 min, see
§4). The **run-of-record is CI on `origin/main`**: every non-skipped suite here is merged and was green under the required
Vitest gate at merge. This note is a **static truth-table + classification** derived first-hand from the test sources +
that CI record. A live re-run for a fresh run-of-record is a CI/fleet action (recommended in §6).

## 3. Launch-surface truth table (Shell Truth Audit — `shellTruthAudit.contract.test.ts`, all 9 green)

| Q | Assertion (launch-surface truth) | Status |
|---|----------------------------------|--------|
| Q1 | Desktop renders launch surfaces (`Desktop.tsx` imports `StageZeroState` + `DesktopIconGrid`) | ✅ |
| Q2 | Dock contains **no utilities** (import audit) | ✅ |
| Q3 | Top bar has system utilities (`DesktopTopSystemBar` → Clock/NotificationBell/SentinelChip) | ✅ |
| Q4 | Suite windows open near-full-stage | ✅ |
| Q5 | Property Workbench opens **maximized** (`tier0-workbench`) | ✅ |
| Q6 | `os-pilot`/`os-trace`/`os-canon` open **in-shell** | ✅ |
| Q7 | Parcel actions collapse into the Workbench; `suite-forge` opens standalone | ✅ |
| Q8 | Z-depth class audit in governed shell files (`GenericModuleHost.tsx`, `Window.tsx`) | ✅ |

Complemented by: Shell Anti-Drift (dock = exactly 5 constitutional suites; dock/top-bar/workbench ownership; click →
correct destination) — 11 green; Entrypoints Parity (launcher href ≡ registry route; `/property/:parcelId/:tab`) — 12
green; Registry Completeness (every workbench suite in launcher; valid `workbenchTarget.tabId`) — 24 green; Workflow Entry
Points (Dais/Forge module entries → correct workbench destinations) — 18 green.

## 4. Failure / skip classification (mine · fleet · stale)

| Item | Kind | Classification | Detail |
|------|------|----------------|--------|
| `launchSurfaceContractParcelWorkbench` (Phase 16, Parcel→Workbench launch contract) | **skipped** (`describe.skip`) | **mine-lane — test-infra deferral (re-authorable)** | Skipped 2026-04-25: importing `SuiteModuleGrid` transitively pulls `orchestration/moduleActivation → config/moduleComponents → desktopStore + moduleLoaderStore + notificationStore + telemetry`, which **crashes the vitest worker** ("Worker exited unexpectedly" / tinypool) during module evaluation regardless of pool/isolate mode; with the global `retry: 2` a full sweep hung ~30 min. Historical content preserved in git. **Re-author path (documented in the file):** shallow-mock `activateModule` + the `propertyStore` selector and verify navigation via a mocked `useNavigate` (or a thin `handleLaunch` helper) instead of rendering the real `SuiteModuleGrid`. **Not a product/routing failure.** |
| D-013 — ForgeSuiteHome dropped "DB/API-backed Benton proof path" disclosure phrase | known P2 | **fleet-owned (external lane)** | `next-queue.json._external_lane`; ForgeSuiteHome is a FLEET-owned file (DO-NOT-EDIT header). Not in the dock/top-bar batch; **not this lane's to fix.** |

**No `mine` failures are open in this batch** — 74/75 active tests green on merged CI; the 1 skip is a test-infrastructure
deferral (worker crash), and the 1 known P2 is fleet-external.

## 5. Stop-wall check

No R4 stop tripped: nothing here requires a **shell routing** change. The 1 skipped test needs a **test re-author**
(mocking), not routing/component/backend work — and re-authoring is **outside this run-only sweep's scope** (§6).

## 6. Recommendations (require separate ratification — not executed here)

1. **Re-author the Phase-16 Parcel→Workbench launch contract** as a small tests-only lane, following the file's own
   re-author note (shallow-mock `activateModule` + `propertyStore`; assert navigation via mocked `useNavigate`; do **not**
   render the real `SuiteModuleGrid`). This removes the last skip and closes the launch-surface batch to a full run. This
   is a Claude-appropriate, non-overlapping, frontend-tests-only follow-up — but it is a **test edit**, so it needs
   explicit ratification (this WO is run-only).
2. **D-013** → fleet lane (ForgeSuiteHome disclosure phrase). Not Claude's.
3. If a **fresh run-of-record** is required, run the Vitest Full Suite in CI (or a fleet run) and attach the batch result;
   local single-batch runs are impractical here and a naive full local run hangs (§4).

## 7. Result

- **Launch-surface / dock / top-bar truth table: intact and green** (74/75 active tests; Shell Truth Audit Q1–Q8 all
  pass).
- **1 skipped** = Phase-16 Parcel→Workbench launch contract, a **test-infra deferral** (worker crash), re-authorable.
- **1 known P2** = D-013, **fleet-owned external**.
- **No mine-lane failures**, no routing fix needed, no R4 stop, no backend/Codex overlap.

**Evidence-only. No test/source/routing change. No stop wall.**

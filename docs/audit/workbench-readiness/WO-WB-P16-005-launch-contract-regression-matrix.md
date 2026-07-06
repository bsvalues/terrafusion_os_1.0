# WO-WB-P16-005 — Launch-Contract Regression Matrix

**Goal:** GOAL-TF-WB-PHASE16-LAUNCH-CONTRACT-001 — Re-author Parcel-to-Workbench Launch Contract
**WO:** WO-WB-P16-005 — Regression Matrix
**Category:** Documentation (coverage matrix)
**Operator:** Claude Code · ratified tests-only follow-up

**Authorization:** Operator-ratified Phase-16 lane (tests-only / shallow mocks / no product behavior change).

---

## 1. Purpose

Map each re-authored test to the launch-contract invariant it locks, so the coverage is auditable and future regressions
have a named guard.

## 2. Invariant → test map

| # | Test | Invariant enforced | Product path guarded |
|---|------|--------------------|----------------------|
| 1 | Forge → workbench | Parcel action routes into Workbench, not a standalone Forge window | `workbench` + parcel → `/property/:id/forge` |
| 2 | Atlas → workbench | Same, Atlas tab | `/property/:id/atlas` |
| 3 | Dossier → workbench | Same, Dossier tab | `/property/:id/dossier` |
| 4 | Same parcel+tab re-entry | Window reuse: identical URL ⇒ React Router reuses the mounted component (no window multiplication) | URL identity |
| 5 | Structural URL proof | `parcelId` + `tab` encoded in path; `countyId` travels in header, not path (FISMA isolation) | `/property/:id/:tab` shape |
| 6 | Broken module (no `workbenchTab`) | Guard: malformed workbench def no-ops instead of routing to `/property/:id/undefined` | `if (!mod.workbenchTab) return;` |
| 7 | Standalone tools (ratio / batch / calibration) | Cross-parcel tools open standalone via `activateModule`, never touch `/property/` | `standalone → activateModule(moduleId, {source:'system'})` |
| bonus | No active parcel | Workbench tile falls back to `/property?openTab=:tab`, not a standalone window | no-parcel branch |

## 3. Behavior-truth note (test 7)

Test 7 asserts the **current** standalone behavior (`activateModule`), which diverged from the original test's
`navigate('/:moduleId')` at **WO-SUITE-ROUTING-001**. The matrix records this as an intentional test correction; no
product behavior changed in this lane.

## 4. Run of record

Vitest cannot run in the sparse worktree (no `node_modules`; a full local sweep hangs ~30 min). **CI is the run of
record** — Frontend Gate + Vitest full suite on the PR. This matrix is verified green there before merge; local static
review (`git diff --check`, mock-path/type check against `SuiteModuleGrid` source) is the pre-push gate.

## 5. Coverage honesty

No redundant tests were added. Each row above is a distinct branch or invariant of `handleLaunch`. The re-author restores
the original coverage and corrects a single stale assertion; it does not manufacture additional cases beyond the eight
the contract requires.

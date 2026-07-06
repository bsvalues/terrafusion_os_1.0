# WO-WB-P16-006 — Launch-Contract Evidence Rollup

**Goal:** GOAL-TF-WB-PHASE16-LAUNCH-CONTRACT-001 — Re-author Parcel-to-Workbench Launch Contract
**WO:** WO-WB-P16-006 — Evidence Rollup + Next-Lane Decision
**Category:** Documentation (closure)
**Operator:** Claude Code · ratified tests-only follow-up
**Status:** COMPLETE — skipped Phase-16 contract test re-authored and un-skipped; no product behavior change.

**Authorization:** Operator-ratified Phase-16 lane. **MODE: tests-only / shallow mocks / no product behavior change.**
Allowed writes: `frontend/apps/os-shell/src/__tests__/**`, `docs/audit/workbench-readiness/**`; read-only elsewhere.
AGENTS.md out-of-lane write is under this ratified authorization; no governance-surface / product / backend / registry
file was touched.

---

## 1. WOs completed

| WO | Deliverable |
|----|-------------|
| P16-001 | Current-state audit (skipped stub + product `handleLaunch` behavior) |
| P16-002 | Skip root-cause confirmation (missing `moduleActivation` mock, eager evaluation) |
| P16-003 | Shallow-mock design (four boundaries; `vi.hoisted` activateModule spy) |
| P16-004 | Re-authored contract test (un-skipped) |
| P16-005 | Regression matrix (invariant → test map) |
| P16-006 | This rollup |

## 2. What changed

**One test file** — `frontend/apps/os-shell/src/__tests__/shell/launchSurfaceContractParcelWorkbench.contract.test.tsx`:
the 36-line `describe.skip` stub was replaced with the re-authored contract test (8 cases). The fix that removed the skip
is a single added shallow mock:

```ts
const { mockActivateModule } = vi.hoisted(() => ({ mockActivateModule: vi.fn() }));
vi.mock('../../orchestration/moduleActivation', () => ({
  activateModule: mockActivateModule,
  default: mockActivateModule,
}));
```

The real `SuiteModuleGrid` is imported and rendered — it is the actual unit under test, not mocked.

**Five docs** — P16-001/002/003/005/006 in `docs/audit/workbench-readiness/`.

## 3. Behavior-truth corrections (test-only; no product file edited)

1. **Standalone behavior (test 7).** Original test 7 asserted standalone tiles call `navigate('/:moduleId')`. Since
   WO-SUITE-ROUTING-001 the product calls `activateModule(mod.moduleId ?? mod.id, { source: 'system' })`. Test 7 now
   asserts the shipped behavior (`activateModule` with the moduleId + `source: 'system'`; `navigate` NOT called).
2. **False Forge/Atlas workbench cases (codex #1237 P2).** The original/first-draft test asserted **Forge → workbench**
   and **Atlas → workbench**. Verified first-hand against the suite homes: the shipped **Atlas suite is all standalone**
   and **Forge does not use `SuiteModuleGrid`** — so those cases claimed launches the app does not perform. Removed; the
   workbench cases now mirror the real **Dais** (`certification` → `dais`) and **Dossier** (`documents` → `dossier`;
   `defense` → `dais`) tiles, and standalone cases mirror real tiles (`atlas`, `terra-levy`, `management-dashboard`).

Both are test-only corrections aligning the test with already-shipped behavior — no product file was edited.

**Known coverage gap (flagged, not closed):** the test guards the grid routing *mechanism*, not the literal shipped tile
arrays (`DAIS_MODULES`/`DOSSIER_MODULES`/`ATLAS_MODULES` are module-private; suite-home deeplink tests stub the grid).
Closing it needs a product `export` (outside this tests-only lane) → recommended small follow-up lane.

## 4. What was intentionally NOT touched

`SuiteModuleGrid.tsx` and all product code; `Router.tsx`; `pages/workbench/**`; tool registry; backend; API/service;
package / build / CI config; deploy / migrations; PACS / county data; Codex Backend OE files. No new route, no new
registry entry, no behavior change.

## 5. CI validation

Vitest cannot run in the sparse worktree (no `node_modules`); **CI is the run of record**. Frontend Gate + Vitest full
suite + required branch-protection contexts must be green on the PR; review threads resolved; `git diff --check` clean;
scope = allowed files only; no `--admin` / no break-glass.

## 6. Coverage honesty

No redundant tests were manufactured. The re-author restores the eight cases the contract requires, corrects two stale
assertions (standalone behavior + false Forge/Atlas workbench cases), and binds every fixture to a real shipped launch
mode. The skipped test is now a live guard against parcel actions leaking into standalone windows (and vice versa), with
the residual real-tile-array coverage gap explicitly flagged for follow-up.

## 7. Next lane

Phase-16 is closed. Per posture, **Claude Code parks** after this lane. Codex Backend OE remains the priority lane; G1
(0/117 tool backend integration) remains the separate Codex/backend surface. No further Claude Code Workbench work is
self-queued — any next lane is ratified through the Brain/operator.

# WO-WB-G2-004 — Window Aliasing Implementation Playbook (future lane — not executed here)

**Goal:** GOAL-TF-WB-G2-WINDOW-ALIASING-001
**WO:** WO-WB-G2-004 — Operator Note / Future Implementation Playbook
**Category:** Documentation (playbook only — **do not implement**)
**Implements decision:** WO-WB-G2-003 → Option D (mount the real Clerk/Treasury/Audit in the window)

> **This is a playbook, not an execution.** It exists so the fix can be run later under explicit authorization without
> re-deriving scope. Nothing in this WO changes code.

---

## 1. Change (when authorized)

In `frontend/apps/os-shell/src/pages/workbench/PropertyWorkbenchWindow.tsx`:

1. Add three lazy imports mirroring the existing pattern (`:50-67`):
   ```
   const PropertyClerk = lazy(() => import('./tabs/PropertyClerk').then((m) => ({ default: m.PropertyClerk })));
   const PropertyTreasury = lazy(() => import('./tabs/PropertyTreasury').then((m) => ({ default: m.PropertyTreasury })));
   const PropertyAudit = lazy(() => import('./tabs/PropertyAudit').then((m) => ({ default: m.PropertyAudit })));
   ```
   (Confirm the export shape of each tab module — default vs named — at implementation time.)
2. Re-point `TAB_COMPONENTS` (`:73-83`):
   ```
   clerk:    PropertyClerk,      // was PropertyDossier
   treasury: PropertyTreasury,   // was PropertyDais
   audit:    PropertyAudit,      // was PropertyDossier
   ```
3. **Remove the initial-tab (launch) alias** in `resolvedInitialTab` (`:727-731`) — delete these two branches so a
   `metadata.tabId` of `clerk`/`audit`/`treasury` resolves to itself (validated against `TABS`) instead of being
   remapped:
   ```
   -  if (initialTab === 'clerk' || initialTab === 'audit') return 'dossier';
   -  if (initialTab === 'treasury') return 'dais';
   ```
   (The subsequent `TABS.find(...)` already validates the slug and falls back to `summary` for unknown ones, so removing
   the two branches is sufficient and safe.)

**Both** changes are required. Fixing only step 2 would leave a `tabId=clerk` launch opening the Dossier tab (step 3
governs the launch path; step 2 governs tab-switching). The tab bar (`TABS`), context provider
(`WorkbenchTabCtx.Provider`), and reserved-boundary host-violation guard are otherwise unaffected.

## 2. Allowed files (future lane)

- `frontend/apps/os-shell/src/pages/workbench/PropertyWorkbenchWindow.tsx`
- `frontend/apps/os-shell/src/__tests__/workbench/**` (tests)
- `docs/audit/workbench-readiness/**`

## 3. Blocked files (future lane)

- Router.tsx / any route change (the route path is already correct — do not touch)
- the tab components themselves (`PropertyClerk/Treasury/Audit.tsx` — no change needed; they are window-compatible)
- `context/workbenchTabContext.tsx`
- backend/**, tools/registry/**, API/service, package/build/CI, DB/migrations, deploy, PACS/county data, Codex Backend OE.

## 4. Expected tests

- Add a window-mapping contract test in `__tests__/workbench/` covering **both** paths:
  - **Tab-switch path:** activating `clerk`/`treasury`/`audit` renders the **real** component (assert a stable testid
    unique to each — `property-clerk-tab` / `property-treasury-tab` / `property-audit-tab` — appears when that tab is
    active) and does **not** render the Dossier/Dais testid under those labels.
  - **Launch path:** rendering `PropertyWorkbenchWindow` with `metadata.tabId` = `clerk`/`treasury`/`audit` opens that
    real tab (not `dossier`/`dais`) — i.e. the `resolvedInitialTab` remap is gone.
- Re-verify `PropertyWorkbenchWindow.segmentContext.test.tsx` still passes. (Note: that test exercises only the
  segment-context bridge and does **not** reference `TAB_COMPONENTS` or the alias, so it is not expected to be affected;
  confirm at implementation time.)

## 5. Acceptance criteria

- Window "Clerk"/"Treasury"/"Audit" tabs mount `PropertyClerk`/`PropertyTreasury`/`PropertyAudit` respectively (tab-switch path).
- Launching the window with `metadata.tabId` = clerk/treasury/audit opens that real tab, not dossier/dais (launch path).
- Route path unchanged; both hosts now render 9/9 real surfaces.
- Each tab's honesty badge (slice-aware, from the completed provenance program) renders in the window path too.
- Frontend Gate + Vitest Full Suite + required contexts green; no --admin / no break-glass.

## 6. Rollback plan

Single-file, single-commit change → revert the commit (restore the three `TAB_COMPONENTS` entries to
Dossier/Dais/Dossier, restore the two `resolvedInitialTab` alias branches, and drop the three imports). No data or schema
involved; rollback is instantaneous and side-effect-free.

## 7. Stop walls (future lane)

Stop and escalate if, at implementation time: a real component turns out **not** to mount under `WorkbenchTabCtx` (would
contradict this audit — re-verify `useWorkbenchTab`); the reserved-boundary host-violation guard rejects the real
component as unauthorized for the window host; or a test genuinely pins the alias as intended behavior (would require a
product decision, not a code fix).

## 8. Dependency on Backend OE

**None.** The real components are pure frontend and already merged. This fix is independent of Codex Backend OE, tool
integration, and G1. It can be scheduled whenever the Workbench pause is briefly lifted or as the first item of the next
Workbench UI lane.

**Playbook only. Nothing implemented in this WO.**

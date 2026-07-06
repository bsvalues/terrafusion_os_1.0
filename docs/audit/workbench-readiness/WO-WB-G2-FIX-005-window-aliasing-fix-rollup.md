# WO-WB-G2-FIX-005 — Window Aliasing Fix Evidence Rollup

**Goal:** GOAL-TF-WB-G2-WINDOW-ALIASING-FIX-001 — Workbench Window Adapter Aliasing Fix
**WO:** WO-WB-G2-FIX-005 — Evidence Rollup + Next Lane Decision
**Category:** Documentation (closure)
**Status:** COMPLETE — G2 Option D implemented; the desktop/window Workbench now mounts the real Clerk/Treasury/Audit
**Governing decision:** GOAL-TF-WB-G2-WINDOW-ALIASING-001 → Option D (packet #1221 `3c92adee`)

**Authorization:** Operator authorized GOAL-TF-WB-G2-WINDOW-ALIASING-FIX-001. Allowed writes (full repo-relative paths):
`frontend/apps/os-shell/src/pages/workbench/PropertyWorkbenchWindow.tsx`,
`frontend/apps/os-shell/src/pages/workbench/tabs/**`, `frontend/apps/os-shell/src/__tests__/workbench/**`,
`docs/audit/workbench-readiness/**`. AGENTS.md out-of-lane write under this authorization; no governance-surface files touched.

---

## 1. WOs completed

| WO | Deliverable | PR | Squash commit |
|----|-------------|-----|---------------|
| FIX-001 | Implementation scope confirmation (docs) | #1222 | `92688de8` |
| FIX-002 | `TAB_COMPONENTS` map → real components | #1223 | `ff5f5356` |
| FIX-003 | `resolvedInitialTab` launch remap removed | #1223 | `ff5f5356` |
| FIX-004 | Window tab-mapping tests | #1223 | `ff5f5356` |
| FIX-005 | this rollup | (this PR) | (this doc) |

## 2. Exact alias mechanisms fixed

Both mechanisms in `frontend/apps/os-shell/src/pages/workbench/PropertyWorkbenchWindow.tsx`:

1. **`TAB_COMPONENTS` map** — `clerk: PropertyDossier / treasury: PropertyDais / audit: PropertyDossier` →
   `clerk: PropertyClerk / treasury: PropertyTreasury / audit: PropertyAudit` (3 lazy imports added, named-export pattern).
2. **`resolvedInitialTab` remap** — deleted `clerk|audit → 'dossier'` and `treasury → 'dais'`; a deep-launch
   (`metadata.tabId`) into those tabs now opens the real tab (`TABS.find` still validates + falls back to `summary`).

**Result:** the window path now renders the same 9/9 real tab surfaces as the route-based Workbench.

## 3. Files changed

- `frontend/apps/os-shell/src/pages/workbench/PropertyWorkbenchWindow.tsx` — 3 lazy imports, 3 `TAB_COMPONENTS` lines,
  removed 2 `resolvedInitialTab` branches, and `filteredTabs` now always includes the active tab (see §7.1).
- `frontend/apps/os-shell/src/__tests__/workbench/PropertyWorkbenchWindow.tabMapping.test.tsx` — new.
- `docs/audit/workbench-readiness/WO-WB-G2-FIX-001-*.md`, this rollup.

## 4. Tests added

`PropertyWorkbenchWindow.tabMapping.test.tsx` (tab modules stubbed to test-id markers → targets the window mapping):
- **Launch path** (proves remap removal): `tabId=clerk/treasury/audit` opens the real tab, not dossier/dais.
- **Tab-switch path** (proves the map): clicking Clerk/Treasury/Audit renders the real component, not dossier/dais.
- **Role-hidden deep-launch** (proves §7.1 regression fix): launching `tabId=clerk` while clerk is role-hidden still
  mounts the real Clerk tab (no blank workbench).
- **Regression**: Summary/Forge/Atlas/Dais/Dossier/Pilot still render their real components.

## 5. Safety / host-boundary verification

- Window-compatible: `useWorkbenchTab` reads both `WorkbenchTabCtx` (window) + Outlet (route); the window already provides
  `WorkbenchTabCtx.Provider` and mounts its other tabs the same way.
- **Host-boundary guard passes:** `contracts/objectPlacement.ts` classifies `clerk`/`treasury`/`audit` as
  `parcel-scoped-app` on `tier0-workbench` (identical to the other tabs), so `validateWorkbenchHost(activeTab)` returns
  null for them — no host-violation notice. Verified before implementing.

## 6. CI validation

Both PRs: Frontend Gate + Vitest Full Suite + required branch-protection contexts green; review threads verified and
resolved; `git diff --check` clean; scope = allowed files only; no `--admin` / no break-glass.

## 7. Review corrections

1. **codex P2 (real regression, #1223):** removing the `resolvedInitialTab` remap meant a deep-launch into a tab hidden by
   the current role's defaults set `activeTab` to a slug absent from `filteredTabs`, so the render loop mounted no panel →
   **blank workbench**. Fixed: `filteredTabs` now always includes the active tab (forces the *requested* deep-linked tab
   into the visible set; role hiding is a UX declutter with a show-all toggle, not the host-boundary gate). Added a
   regression test for the role-hidden deep-launch.
2. **copilot (#1223):** removed an unused `waitFor` import (noUnusedLocals/eslint).
3. **codex + copilot (#1222):** the FIX-001 authorization list used shortened paths; replaced with full repo-relative
   paths so the implementation lane's authorization is unambiguous.

## 8. What was intentionally NOT touched

`Router.tsx` / route-based Workbench (already correct); the tab components themselves; tool registry; backend;
API/service; package/build/CI; deploy/migrations; PACS/county data; Codex Backend OE files. **G1 (0/117 tool backend
integration) remains separate.**

## 9. Remaining Workbench gaps + next lane

- **G2 is now fully closed** (decision packet + implementation). The window and route hosts render identical 9/9 real
  surfaces, and deep-launch behavior reaches the real Clerk/Treasury/Audit tabs.
- **Recommended next lane:** return Workbench to **paused** pending Codex Backend OE (posture-consistent). G1 remains the
  Codex/backend/TerraPilot lane. No further Claude Code Workbench work is queued.

## 10. Non-goals (explicit)

No backend integration; no tool-registry promotion; no route-based Workbench change; no Sync work; no deployment; G1
remains separate.

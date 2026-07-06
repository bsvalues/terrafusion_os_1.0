# WO-WB-G2-FIX-001 — Implementation Scope Confirmation

**Goal:** GOAL-TF-WB-G2-WINDOW-ALIASING-FIX-001 — Workbench Window Adapter Aliasing Fix
**WO:** WO-WB-G2-FIX-001 — Implementation Scope Confirmation
**Category:** Documentation (pre-implementation checkpoint; no code change)
**Governing decision:** GOAL-TF-WB-G2-WINDOW-ALIASING-001 → Option D (merged, PR #1221, `3c92adee`)

**Authorization:** Operator authorized GOAL-TF-WB-G2-WINDOW-ALIASING-FIX-001. Allowed writes (full repo-relative paths):
`frontend/apps/os-shell/src/pages/workbench/PropertyWorkbenchWindow.tsx`,
`frontend/apps/os-shell/src/pages/workbench/tabs/**`, `frontend/apps/os-shell/src/__tests__/workbench/**`,
`docs/audit/workbench-readiness/**`. AGENTS.md out-of-lane write proceeds under this explicit authorization. No
backend/registry/route(outside window)/API/deploy/PACS.

---

## 1. Purpose

Re-verify — against **current `origin/main`** (main may have moved since the decision packet merged) — the exact edits the
Option D fix requires, before touching code. Confirms both alias mechanisms are still present as documented, the real
components are importable and window-compatible, and no stop wall applies.

## 2. Current state (re-verified first-hand)

**Alias mechanism #1 — `TAB_COMPONENTS` map** (`PropertyWorkbenchWindow.tsx:73-80`):
```
clerk:    PropertyDossier,   // :78  → must become PropertyClerk
treasury: PropertyDais,      // :79  → must become PropertyTreasury
audit:    PropertyDossier,   // :80  → must become PropertyAudit
```

**Alias mechanism #2 — `resolvedInitialTab` launch remap** (`PropertyWorkbenchWindow.tsx:728-731`):
```
if (initialTab === 'clerk' || initialTab === 'audit') return 'dossier';   // :730 → remove
if (initialTab === 'treasury') return 'dais';                             // :731 → remove
```
`resolvedInitialTab` feeds both `activeTab` init (`:737`) and `setCompanionTabOnMount` (`:742`); removing the two branches
lets a `clerk`/`treasury`/`audit` launch resolve to itself (the subsequent `TABS.find` still validates + falls back to
`summary` for unknown slugs).

## 3. Real components — importable & window-compatible (confirmed)

- Exports (verified): `PropertyClerk`, `PropertyTreasury`, `PropertyAudit` each provide **both** a named export
  (`export const PropertyX`) and a default. The window's existing lazy pattern uses the **named** form
  (`import('./tabs/PropertyX').then((m) => ({ default: m.PropertyX }))`) — mirror that.
- Compatibility (from G2-001, still valid): the three components consume `useWorkbenchTab()`
  (`context/workbenchTabContext.tsx:77-84`, dual-source: `WorkbenchTabCtx` + Outlet); the window already provides
  `<WorkbenchTabCtx.Provider value={tabContextValue}>` (`:919`) with `{ parcelId, propertyData }`. The window's other tabs
  (Dais/Dossier/Pilot) already mount through this exact context using the same hook + `usePropertyStore` selectors — so
  Clerk/Treasury/Audit require **no props/context the window cannot already provide**.

## 4. Test targets (for WO-WB-G2-FIX-004)

- New window-mapping contract test under `__tests__/workbench/` covering both paths:
  - tab-switch: activating clerk/treasury/audit renders `property-clerk-tab`/`property-treasury-tab`/`property-audit-tab`
    (their real root test-ids, added in the honesty programs) and **not** the Dossier/Dais tab under those labels;
  - launch: rendering the window with `metadata.tabId` = clerk/treasury/audit opens that real tab (not dossier/dais).
  - regression: Summary/Forge/Atlas/Dais/Dossier/Pilot still render their real components.
- `PropertyWorkbenchWindow.segmentContext.test.tsx` is unaffected (it does not reference `TAB_COMPONENTS` or the alias) —
  re-verify green.

## 5. Scope decision

- **Confirmed edits** (WO-FIX-002 + FIX-003): single file `PropertyWorkbenchWindow.tsx` — add 3 lazy imports, re-point 3
  `TAB_COMPONENTS` entries, delete 2 `resolvedInitialTab` branches.
- **No** Router/route change; **no** change to the tab components themselves; **no** backend/registry/API/build/deploy.
- **Stop-wall check:** none triggered — the real components mount in the window with no broader runtime change.

## 6. Execution plan

- PR 1 (this WO): scope confirmation (docs-only).
- PR 2 (WO-FIX-002 + 003 + 004): the single-file fix + window-mapping tests.
- PR 3 (WO-FIX-005): evidence rollup.

**Docs-only. No implementation in this WO. No stop wall.**

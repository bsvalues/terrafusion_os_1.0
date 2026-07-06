# WO-WB-PARITY-004 — Route/Window Parity Contract

**Goal:** GOAL-TF-WB-PARITY-PROOF-001
**WO:** WO-WB-PARITY-004 — Parity Contract Documentation
**Category:** Documentation (contract)
**Depends on:** WO-WB-PARITY-001/002/003

---

## 1. The parity contract

> **Every Property Workbench tab MUST render the same real component in both host paths — the route host
> (`Router.tsx` child routes under `/property/:parcelId`) and the window host (`PropertyWorkbenchWindow.tsx`
> `TAB_COMPONENTS`). Neither host may alias a tab to a different tab's component, and neither may remap a tab at
> launch/initial-selection time.**

There are exactly **9** tabs (`VALID_WORKBENCH_TAB_IDS`): `summary, forge, atlas, dais, clerk, treasury, audit, dossier,
pilot`. Each maps to its own `Property<Tab>` component in both hosts.

## 2. Why the contract exists

The two hosts are independent structures with no shared source of truth (JSX child routes vs a `Record` map). Matching
values today do not guarantee matching values tomorrow. G2 is the proof: the window host had drifted (aliasing
clerk/treasury/audit to Dossier/Dais via both `TAB_COMPONENTS` and a `resolvedInitialTab` launch remap) while the route
host stayed correct. This contract + its tests make a future drift fail CI instead of shipping silently.

## 3. What enforces the contract (tests on `origin/main`)

- **Component realness (both hosts' target):** `workbenchRealHosting.gate.test.tsx` renders each of the 9 tab components
  in a route-shaped wrapper and asserts its real `property-<tab>-tab` surface with an interactive control
  (Forge/Atlas/Dais/Dossier/Pilot + Clerk/Treasury/Audit promoted in WO-WB-PARITY-003) — i.e. every tab's component is a
  real surface, not a placeholder.
- **Window host mapping (test-locked):** `PropertyWorkbenchWindow.tabMapping.test.tsx` asserts the window's
  `TAB_COMPONENTS` (and launch `resolvedInitialTab`) map each tab to its real component and that no tab renders another
  tab's surface (e.g. clerk ≠ dossier). This is the one host whose path→component mapping is directly rendered-through.
- **Registry invariant:** exactly 9 valid tab IDs (`workbenchRealHosting.gate` WORKBENCH-LEVEL + registry-completeness).
- **Entrypoint routing:** `workbenchEntrypoints.parity.test.ts` keeps launcher hrefs aligned with registry routes.

### Known limitation (honest scope)

No test renders **through** `Router.tsx`'s literal path→element binding for workbench tabs — the real-hosting gate (both
the pre-existing Forge/Atlas/Dais gates and the new promoted ones) renders each component in a hand-built route, not the
real app router, and the route contract tests only assert that route path strings exist, not which element is mounted. So
a future edit that re-aliased a `Router.tsx` child route (e.g. `clerk → <PropertyDossier/>`) would not be caught by these
tests. Route-host mapping parity is therefore maintained by **(a)** the window-mapping test (which pins the canonical
tab→component map), **(b)** this contract + the WO-WB-PARITY-001 audit, and **(c)** code review. Rendering the full
`Router.tsx` in a focused unit test is out of scope (it pulls the whole-app provider tree); a future lane could add a
route-integration test if desired.

## 4. Change rules (for future edits)

- Adding/removing a tab: update **both** hosts + `VALID_WORKBENCH_TAB_IDS`, and extend both the real-hosting gate and the
  window `tabMapping` test.
- Never point a window `TAB_COMPONENTS` entry (or a `resolvedInitialTab` branch) at a different tab's component. If a real
  component does not yet exist for a tab, do **not** alias it to another tab's surface under that tab's label — show an
  explicit unavailable/placeholder state instead (honesty posture).
- The `validateWorkbenchHost` object-placement guard must classify any new parcel-scoped tab as `parcel-scoped-app` on
  `tier0-workbench` (as clerk/treasury/audit already are), or it will render a host-violation notice.

## 5. Current status

**Contract satisfied.** Both hosts render 9/9 identical real surfaces; all four enforcement axes above are covered on
`origin/main` (with Clerk/Treasury/Audit render-gating added by WO-WB-PARITY-003).

**Docs-only in this WO.**

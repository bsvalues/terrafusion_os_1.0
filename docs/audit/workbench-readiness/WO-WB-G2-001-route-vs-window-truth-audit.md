# WO-WB-G2-001 — Route-vs-Window Truth Audit

**Goal:** GOAL-TF-WB-G2-WINDOW-ALIASING-001 — Workbench Window Adapter Aliasing Decision
**WO:** WO-WB-G2-001 — Route-vs-Window Truth Audit
**Category:** Documentation (read-only source audit; no implementation)
**Owner:** Claude Code (operator) · William / TerraFusion OS Engineering (authority)

**Authorization:** Operator authorized GOAL-TF-WB-G2-WINDOW-ALIASING-001 (decision-only, docs-only). Allowed writes:
`docs/audit/workbench-readiness/**`. Read-only inspection of `pages/workbench/**`, `__tests__/workbench/**`,
`Router.tsx`, `tools/registry/**` (context only). No component/route/window/backend change. AGENTS.md out-of-lane write
proceeds under this explicit authorization.

---

## 1. Question

The Property Workbench exposes 9 tab surfaces. There are **two** host paths that render those tabs: the **route-based**
Workbench and the desktop **window** adapter. G2 (from `WO-WB-005` gap register) asserts the window adapter *aliases*
Clerk/Treasury/Audit into other components. This WO verifies the exact behavior of each path, first-hand, with file/line
evidence — no extrapolation.

## 2. Route-based path — renders the REAL components

**Entry:** `Router.tsx` → `<Route path='property/:parcelId' element={<PropertyWorkbench />}>` with child routes.
**Layout:** `PropertyWorkbench.tsx` renders `<Outlet>` (`PropertyWorkbench.tsx:587`); tab content is resolved by the
matched React-Router child route (`PropertyWorkbench.tsx:115-116`).

Child routes (`Router.tsx:217-226`), verified verbatim:

```
<Route path='property/:parcelId' element={<PropertyWorkbench />}>
  <Route index element={<PropertySummary />} />
  <Route path='forge'    element={<PropertyForge />} />
  <Route path='atlas'    element={<PropertyAtlas />} />
  <Route path='dais'     element={<PropertyDais />} />
  <Route path='clerk'    element={<PropertyClerk />} />       // REAL
  <Route path='treasury' element={<PropertyTreasury />} />    // REAL
  <Route path='audit'    element={<PropertyAudit />} />       // REAL
  <Route path='dossier'  element={<PropertyDossier />} />
  <Route path='pilot'    element={<PropertyPilot />} />
</Route>
```

`Router.tsx:60-62` lazy-imports the real `PropertyClerk`/`PropertyTreasury`/`PropertyAudit`. **Route path = 9 distinct
real tab surfaces.**

## 3. Window path — aliases 3 tabs via TWO mechanisms

**Entry:** `PropertyWorkbenchWindow.tsx` — the desktop app-window adapter. It uses **state-based** tab switching +
`WorkbenchTabCtx` (not React Router) because a Router cannot be nested inside the app-window's Router
(`PropertyWorkbenchWindow.tsx:9-11`).

### 3a. Alias mechanism #1 — the tab→component map

`TAB_COMPONENTS` (`PropertyWorkbenchWindow.tsx:73-83`), verified verbatim:

```
const TAB_COMPONENTS: Record<WorkbenchTabSlug, React.LazyExoticComponent<React.FC>> = {
  summary:  PropertySummary,
  forge:    PropertyForge,
  atlas:    PropertyAtlas,
  dais:     PropertyDais,
  clerk:    PropertyDossier,   // ALIAS → Dossier
  treasury: PropertyDais,      // ALIAS → Dais
  audit:    PropertyDossier,   // ALIAS → Dossier
  dossier:  PropertyDossier,
  pilot:    PropertyPilot,
};
```

The window's lazy imports (`PropertyWorkbenchWindow.tsx:50-67`) include only Summary/Forge/Atlas/Dais/Dossier/Pilot —
**`PropertyClerk`, `PropertyTreasury`, and `PropertyAudit` are not imported at all** (grep: 0 matches).

### 3b. Alias mechanism #2 — the initial-tab remap (launch path)

`resolvedInitialTab` (`PropertyWorkbenchWindow.tsx:727-731`), verified verbatim:

```
const resolvedInitialTab = useMemo<WorkbenchTabSlug>(() => {
  if (!initialTab || initialTab === '/' as string) return 'summary';
  if (initialTab === 'clerk' || initialTab === 'audit') return 'dossier';   // ALIAS at launch
  if (initialTab === 'treasury') return 'dais';                             // ALIAS at launch
  const valid = TABS.find((t) => t.id === initialTab);
  return valid?.id ?? 'summary';
}, [initialTab]);
```

When the window is **launched** with `metadata.tabId` = `clerk`/`audit`/`treasury` (the deep-link/launch path), the
active tab is remapped to `dossier`/`dais` *before* first render. So the alias is enforced in **two** places: the
component map (mechanism #1) and the initial-tab resolution (mechanism #2). **Both must be corrected to actually close
G2** — fixing only `TAB_COMPONENTS` would still land a `tabId=clerk` launch on the Dossier tab.

The tab bar (`TABS`, `PropertyWorkbenchWindow.tsx:105-114`) still lists all nine labels including "Clerk", "Treasury",
"Audit".

**Net window behavior:** selecting (or launching into) **Clerk** renders **Dossier**; **Treasury** renders **Dais**;
**Audit** renders **Dossier**. Six distinct components are mounted across nine labels.

## 4. Are the real components window-compatible? — YES

`useWorkbenchTab()` (`context/workbenchTabContext.tsx:77-84`) reads from **both** `WorkbenchTabCtx` (`useContext`,
line 79) **and** `useOutletContext` (line 84) — "checks both sources" (:9). The window provides
`<WorkbenchTabCtx.Provider value={tabContextValue}>` (`PropertyWorkbenchWindow.tsx:919`) with `{ parcelId, propertyData }`
(:714). The real `PropertyClerk`/`PropertyTreasury`/`PropertyAudit` consume `useWorkbenchTab()` — so they would mount and
function correctly under the window's context **with no code change to the components themselves**.

**Implication:** the aliasing is not a compatibility constraint. It is **stale/vestigial** — it predates the real
Clerk/Treasury/Audit components (built during PROPERTY-WORKBENCH readiness + honesty instrumentation) and was never
re-pointed at them.

## 5. Test coverage

- `__tests__/workbench/PropertyWorkbenchWindow.segmentContext.test.tsx` exercises only the **segment-context bridge**; it
  does **not** reference `TAB_COMPONENTS`, the `resolvedInitialTab` remap, or the `clerk`/`treasury`/`audit` labels at all
  (grep: 0 matches). So **neither** alias mechanism is pinned or covered by a test — the mislabel is entirely uncovered,
  and re-pointing the map/remap would not break this test.
- No test asserts that the window's "Clerk"/"Treasury"/"Audit" labels render their real components.

## 6. Truth summary

| Tab | Route path renders | Window path renders | Diverges? |
|-----|-------------------|---------------------|-----------|
| Summary | PropertySummary | PropertySummary | no |
| Forge | PropertyForge | PropertyForge | no |
| Atlas | PropertyAtlas | PropertyAtlas | no |
| Dais | PropertyDais | PropertyDais | no |
| **Clerk** | **PropertyClerk** | **PropertyDossier** | **YES** |
| **Treasury** | **PropertyTreasury** | **PropertyDais** | **YES** |
| **Audit** | **PropertyAudit** | **PropertyDossier** | **YES** |
| Dossier | PropertyDossier | PropertyDossier | no |
| Pilot | PropertyPilot | PropertyPilot | no |

**Confirmed:** the route path is honest (9/9 real); the window path mislabels 3 tabs via **two** mechanisms
(`TAB_COMPONENTS` map at :73-83 and the `resolvedInitialTab` launch remap at :727-731). The real components exist and are
window-compatible, so the gap is a stale mapping, not a missing surface. Impact classification → WO-WB-G2-002.

**Docs-only. No implementation. No stop wall.**

# WO-WB-001 — Property Workbench Current-State Audit

**Program:** PROPERTY-WORKBENCH-READINESS (WO-WB-001 → 008)
**Owner agent:** Claude Code · **Mode:** read-only discovery, docs/audit artifacts only
**Repo:** `terrafusion_os_1.0` · **Base:** `origin/main` @ `df2f6085` · **Worktree:** dedicated sparse worktree (read-only)
**Output root:** `docs/audit/workbench-readiness/`
**Method:** `git ls-tree`/`git show`/`git grep` on `origin/main` + three parallel read-only exploration passes, cross-checked against a first-hand read of the entry component. Every claim below is cited `file:line`; unproven items are listed as **Unknowns**, not asserted.

---

## 1. Executive truth baseline

The Property Workbench is a **mature, heavily-tested, honest-by-construction UI surface** — not a skeleton. The **primary, systemic** readiness gap is **tool → backend integration maturity** (which the repo already tracks and discloses), layered under an already-honest UI — **not** a data-honesty problem. There are also **localized UI gaps** that must be tracked, not waved away: the `DcfPanel` income stub (§4.2) and a **route-vs-window tab-parity gap** where the window adapter renders only 6 distinct components and aliases Clerk/Treasury/Audit (§2.1). Both are logged for the Gap Register (WO-WB-005).

Two layers, stated precisely:

1. **UI + honesty layer — built.** Nine suite surfaces exist, are routed, and are wired to real data hooks / governed tools. A suite of "honesty" contract tests enforces that surfaces disclose their data source and never render fabricated data.
2. **Tool/backend layer — largely immature.** `tools/registry/tool-maturity.json` marks most workbench tools `L1 / stub-contract / liveIntegration:false / disclosureRequired:true`. So at runtime the surfaces honestly render *unavailable* states until tools are promoted to `backend-integrated`.

This distinction is the spine of the whole readiness program: the completion work is tool/data integration + promotion, layered under an already-honest UI.

---

## 2. What exists

### 2.1 Entry surfaces (dual path)

| Surface | File | Kind |
|---------|------|------|
| `PropertyWorkbench` | `frontend/apps/os-shell/src/pages/workbench/PropertyWorkbench.tsx:156` | Route-based hub — `/property/:parcelId/*`; ContextRibbon → WorkbenchRail + `<Outlet>` → ActivityFeed |
| `PropertyWorkbenchWindow` | `frontend/apps/os-shell/src/pages/workbench/PropertyWorkbenchWindow.tsx` (≈717–1015) | Desktop window adapter — state-driven tabs (no nested router); adds `WorkbenchStartScene`, `SegmentHandoffBanner`, `TabBar`, `WorkbenchTabCtx.Provider` |

The two entry paths declare the **same 9 tab labels**, but they are **not** at parity in what they render:

> **Route-vs-window tab-parity gap (verified).** The route path (`Router.tsx:217-226`) mounts the real `PropertyClerk`, `PropertyTreasury`, and `PropertyAudit` components. The window adapter, however, lazy-loads only **six** distinct components (`PropertyWorkbenchWindow.tsx:50-67`) and its `TAB_COMPONENTS` map (`PropertyWorkbenchWindow.tsx:73-83`) **aliases** `clerk → PropertyDossier`, `treasury → PropertyDais`, and `audit → PropertyDossier`. So in the window path, the Clerk/Treasury/Audit tabs render Dossier/Dais content, not their own surfaces. This is a genuine **UI gap** in the window adapter (Clerk/Treasury/Audit unimplemented there), logged for WO-WB-005. Later WOs must treat the two entry paths as **route = 9 real surfaces, window = 6 real + 3 aliased**, not "the same 9 tabs".

> **Correction to the WO brief:** the brief's named file `frontend/apps/os-shell/src/pages/workbench/PropertyWorkbenchSurface.tsx` **does not exist** on `origin/main`. The actual entry components are `PropertyWorkbench.tsx` and `PropertyWorkbenchWindow.tsx`. All later WOs use the real names.

### 2.2 The 9 suite tabs (locked order)

Defined at `PropertyWorkbench.tsx:98-108` (`WORKBENCH_TABS`) and mirrored in `PropertyWorkbenchWindow.tsx:103-113` and `Router.tsx:217-226`.

| # | Tab id | Component | File | Role (per source docstring) |
|---|--------|-----------|------|------|
| 1 | summary | PropertySummary | `tabs/PropertySummary.tsx:96` | High-density CAMA overview (identity, admin, valuation, physical, sale, history, exemptions) |
| 2 | forge | PropertyForge | `tabs/PropertyForge.tsx:99` | AI valuation hub w/ sub-tab switcher (Cost/Sales/Income/Reconciliation/Sketch) |
| 3 | atlas | PropertyAtlas | `tabs/PropertyAtlas.tsx` | GIS/mapping (boundary, zoning, flood, aerial) from live GIS endpoints |
| 4 | dais | PropertyDais | `tabs/PropertyDais.tsx` | Workflow/appeals (cert roll, PILT, exemptions, levies, BOE, notices) |
| 5 | clerk | PropertyClerk | `tabs/PropertyClerk.tsx` | Recording & title (doc search, title chain, fees, record, lien release) |
| 6 | treasury | PropertyTreasury | `tabs/PropertyTreasury.tsx` | Tax/payment (statements, payments, delinquency, tax sale) |
| 7 | audit | PropertyAudit | `tabs/PropertyAudit.tsx` | Audit roll, levy compliance, findings, reconciliation, reports |
| 8 | dossier | PropertyDossier | `tabs/PropertyDossier.tsx` | Document mgmt & evidence packet (details, chain-of-custody, narrative) |
| 9 | pilot | PropertyPilot | `tabs/PropertyPilot.tsx` | Governed tool invocation hub (Muse read-only tools in R3 shell slice) |

> **Doc-vs-code drift:** the `PropertyWorkbench.tsx:13-20` header comment declares **6** "locked" tabs (Summary, Forge, Atlas, Dais, Dossier, Pilot); the code ships **9** — Clerk, Treasury, Audit were added as "R3 Extensions" but the header was not updated. Logged as a finding (see the Gap Register, WO-WB-005).

### 2.3 Forge sub-surface (the most built-out tab)

`tabs/forge/` — `PropertyForge.tsx:50-57` declares a nested sub-tab switcher:

| Sub-tab | File |
|---------|------|
| Overview | `tabs/forge/ForgeOverview.tsx` |
| Cost | `tabs/forge/CostApproach.tsx` |
| Sales | `tabs/forge/SalesComparison.tsx` |
| Income | `tabs/forge/IncomeApproach.tsx` |
| Reconciliation | `tabs/forge/Reconciliation.tsx` |
| Sketch | (SketchModule, referenced from `PropertyForge.tsx`) |

Plus editors (`forge/components/CostScheduleEditor.tsx`, `DepreciationCurveEditor.tsx`), year-context panels (`ForgeYearSelector.tsx`, `ForgeYearContextPanel.tsx`, `ForgeSubjectParcelSnapshot.tsx`), and `forge/types.ts`.

### 2.4 Operator-only sync surfaces (not parcel tabs)

`pages/workbench/` also hosts six **operator** surfaces that are *not* parcel-scoped tabs (each ties to a shipped WO):

| Subdir | Files | Origin WO | Role |
|--------|-------|-----------|------|
| `sync-commits/` | 15 | SYNC-UX-1B | Decision-commit sealing; recent commits, manifest, signed evidence ZIP |
| `sync-corpus/` | 19 | SYNC-UX-1C | Full-corpus sync runner (multi-hour PACS drains); `/api/sync/corpus/*` |
| `sync-doctrine/` | 3 | DASHBOARD-1 | Read-only doctrine-pipeline status board; polls `/api/sync/doctrine/state` |
| `sync-quarantine/` | 10 | SYNC-UX-1A | Read-write triage of imprv-attr quarantine cohort |
| `sync-readiness/` | 6 | OPS-1-B | Read-only ops control surface over the OPS-1-A backend facade |
| `income/` | 1 | — | `DcfPanel.tsx` — **the one true stub** (see §4) |

---

## 3. Routes / tabs (reality)

`frontend/apps/os-shell/src/Router.tsx`:

- **Parent (line 217):** `<Route path='property/:parcelId' element={<PropertyWorkbench />}>`
- **Index (line 218):** `<Route index element={<PropertySummary />}>` (Summary is the index route, not `path='summary'`)
- **Nested (lines 219-226):** `forge`, `atlas`, `dais`, `clerk`, `treasury`, `audit`, `dossier`, `pilot` → their components.
- **Lazy imports (lines 53-62):** all 10 workbench components are `lazy()`-loaded.

**Launch:** from `components/suites/SuiteModuleGrid.tsx:71` — a module with `launchMode:'workbench'` + a `workbenchTab` navigates to `/property/${parcelId}/${mod.workbenchTab}`. The window adapter is wired at `config/moduleComponents.tsx:448-449`. `route_to_parcel` (registry, "Navigate user to Property Workbench for a given parcel") is the OS-suite entry into this surface.

**Truth:** every one of the 9 tabs is routed and enabled — there are **no** disabled or unrouted tabs. URL is the single source of truth for tab activation (`useParams` in `PropertyWorkbench.tsx:157`).

---

## 4. Live vs stub vs mock

### 4.1 UI surfaces — wired LIVE, honest at idle

Every suite surface calls **real** data hooks / governed tools and derives a source of `'live' | 'partial'/'fallback' | 'unavailable'`. Representative evidence:

- Forge aggregates approach hooks (`useCostApproach`/`useSalesComparison`/`useIncomeApproach`/`useReconciliation`) → `overviewSource` at `ForgeOverview.tsx:78-89`.
- Atlas: `useParcelBoundary`/`useParcelLayers` → `source==='live'` conditional render (`PropertyAtlas.tsx:674-742`).
- Summary: badge from `propertyData.source` (`'live'|'polled'→live`, else fallback) (`PropertySummary.tsx:100-104`).
- Dais/Clerk/Audit/Treasury: "Real MWUX with governed tool invocations" via `invokeTool()` from pilotApi (e.g. `PropertyClerk.tsx:18`, `PropertyAudit.tsx:17`, `PropertyTreasury.tsx:19`); idle renders an `unavailable` badge.
- Dossier: "All primary data … fetched from the live backend. No fixture fallback exists" (`PropertyDossier.tsx:5-21`).

**The workbench refuses to fabricate.** When parcel evidence cannot load, `PropertyWorkbench.tsx:367-482` renders a hard **"Property Evidence Unavailable / Review blocked until authenticated parcel evidence loads from the live property feed"** blocker rather than any placeholder data.

### 4.2 The one true stub

`pages/workbench/income/DcfPanel.tsx:4-10` — labelled "(stub)", renders an empty-state ("Full implementation pending income approach backend endpoints"). This is the only source-level placeholder surface found. (Note: `IncomeApproach.tsx:236` also *detects* a `source==='stub'` state to show an N/A notice for residential — that is honest state-handling, not a stub surface.)

### 4.3 Tool layer — mostly stub-contract (the real gap)

`tools/registry/terrapilot.tools.json` (v2.0.0, 117 tools; os 28 / forge 26 / dais 21 / pilot 15 / treasury 7 / dossier 6 / clerk 6 / audit 6 / atlas 2). `tools/registry/tool-maturity.json` (WO-TERRAPILOT-P8, 2026-07-02) classifies maturity as `declared → stub-contract → contract-covered → backend-integrated → promoted`. Sampled workbench tools:

- `route_to_parcel`, `run_valuation_model`, `summarize_dossier`, `export_audit_bundle`, `audit_roll_summary` → **L1, stub-contract, liveIntegration:false, disclosureRequired:true**.
- `summarize_levy_rate_components` → **L2, contract-covered** (adds backing-service + verification-command + trace evidence).

**So:** the surfaces are wired-live and honest, but **most of the sampled** tools they call are not yet backend-integrated — so runtime output is honestly *unavailable* until promotion. This is a **sample, not a census**: a minority are already further along (e.g. `summarize_levy_rate_components` is `L2 / contract-covered`), and the full per-state distribution across all 117 tools is deferred to WO-WB-004. The claim here is therefore "most sampled workbench tools are pre-integration", not "all tools".

---

## 5. What the tests prove (53 tests under `__tests__/workbench/` + shell contracts)

The workbench is guarded by an unusually strong test suite. Categories:

- **Honesty contracts** (`Property{Forge,Atlas,Dais,Summary}.honesty.contract.test.tsx`, `Reconciliation.honesty.contract.test.ts`): every data element must carry a `WorkbenchSourceBadge`; idle badges must be `unavailable`/`fallback` (never misleading); **no hardcoded/fabricated data** at idle; **no tool invocation on mount**; **no aspirational "AI-powered" language** — governed-tool disclosure wording required. Reconciliation must render an explicit `forge-reconciliation-unavailable` state ("Live cost, sales, and income indications are required for this lane") and its hook must expose `source:'live'|'unavailable'`, never a demo fallback.
- **Host integrity** (`__tests__/shell/workbenchHostIntegrity.contract.test.ts`, Phase 22-B): `PropertyWorkbench` must render `<Outlet context>` and must **not** contain "Coming soon"/"Tab under construction"; all 9 tab components must be lazy-imported; Summary via index route.
- **Governance gates** (`workbench.contractGates`, `workbench.writeLaneGates`, `workbench.riskPolicy`, `workbench.traceImmutability`): write-lane + risk + trace-immutability enforcement.
- **Registry/entrypoint parity** (`workbenchEntrypoints.parity`, `workbenchEntrypoints.registryCompleteness`, `workbenchRealHosting.gate`): the tab entrypoints stay in parity with the registry and are really hosted.
- **Routing contracts** (`dais*Routing`, `dossier*Routing`, `parcelContext.navigation`, `propertySearch.contract`): appeal/notice/dossier navigation is contract-tested.
- **Smoke/regression** (`PropertyWorkbench.productionSmoke`, `workbench.regression`, `WorkbenchSourceBadge`).

> **Known coverage gap:** `__tests__/shell/launchSurfaceContractParcelWorkbench.contract.test.tsx` (Phase-16 launch contract) is **skipped** since 2026-04-25 — it imported `SuiteModuleGrid`, which crashed the vitest worker; the file records a recommended shallow-mock re-authoring. This is a real, documented hole (see WO-WB-005).

---

## 6. Corrections to the WO brief (truth over brief)

| Brief claim | Reality |
|-------------|---------|
| Entry file `PropertyWorkbenchSurface.tsx` | Does not exist; actual = `PropertyWorkbench.tsx` + `PropertyWorkbenchWindow.tsx` |
| (implicit) workbench = a set of tabs | Also hosts 6 operator-only `sync-*` surfaces that are not parcel tabs |
| Header comment "6 locked tabs" | Code ships 9 (Clerk/Treasury/Audit added, header stale) |

---

## 7. Unknowns / to verify in later WOs (not asserted here)

1. **Which tools actually return live data today** vs `unavailable` at runtime — needs the maturity cross-reference per surface (WO-WB-004).
2. **Exact per-tab data-source wiring** (hook → service → API route → backend controller) for each of the 9 tabs (WO-WB-002/003).
3. **The full maturity distribution** across all 117 tools (counts per state) — only sampled here (WO-WB-004).
4. **`PropertyWorkbenchWindow.tsx` internals** beyond the structural outline (WO-WB-002/003).
5. **Whether the 6 sync-* operator surfaces are in scope** for "Property Workbench readiness" or are a separate lane — needs operator confirmation (flagged, not assumed).
6. **Backend endpoint reality** for the surfaces (`/api/atlas/*`, `/api/sync/*`, pilotApi handlers) — out of this program's read-only frontend scope; noted as a dependency.

---

## 8. Verdict

The Property Workbench is **substantially complete and honest at the route-based UI layer**, with strong contract-test coverage. The path to "ready" is **tool promotion + backend integration** under the existing honest UI, plus closing a small set of documented gaps: the skipped launch-surface test (§5), the stale 6-vs-9 tab-count header (§2.2), the `DcfPanel` income stub (§4.2), and the **window-adapter tab-parity gap** where Clerk/Treasury/Audit are aliased rather than implemented (§2.1). This baseline anchors WO-WB-002 (route/tab reality matrix) through WO-WB-008 (rollup).

**STOP_TYPE:** `WB_CURRENT_STATE_AUDIT_COMPLETE`

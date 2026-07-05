# WO-WB-002 — Workbench Route / Tab Reality Matrix

**Program:** PROPERTY-WORKBENCH-READINESS (step 2) · **Owner:** Claude Code · **Mode:** read-only discovery, docs/audit only
**Repo:** `terrafusion_os_1.0` · **Base:** `origin/main` @ `85c101a6` · **Method:** `git grep`/`git show` on `origin/main` + WO-WB-001 discovery, cited `file:line`.
**Builds on:** `WO-WB-001-property-workbench-current-state-audit.md`.

This matrix pins, per surface, the **route reality**: path, the component actually mounted on each entry path (route vs window), enabled state, and test coverage. It is the factual grid the later classification/provenance/gap WOs read from.

---

## 1. Parcel-tab route matrix (`/property/:parcelId/*`)

Source of truth: `frontend/apps/os-shell/src/Router.tsx:217-226` (route registrations), `PropertyWorkbench.tsx:98-108` (tab list), `PropertyWorkbenchWindow.tsx:73-83` (window component map).

| # | Tab | Route path | Route component (Router.tsx) | Window component (Window:73-83) | Parity | Enabled |
|---|-----|-----------|------------------------------|----------------------------------|--------|---------|
| 1 | summary | `` (index) | `PropertySummary` | `PropertySummary` | ✅ same | yes |
| 2 | forge | `forge` | `PropertyForge` | `PropertyForge` | ✅ same | yes |
| 3 | atlas | `atlas` | `PropertyAtlas` | `PropertyAtlas` | ✅ same | yes |
| 4 | dais | `dais` | `PropertyDais` | `PropertyDais` | ✅ same | yes |
| 5 | clerk | `clerk` | `PropertyClerk` | **`PropertyDossier`** | ❌ **aliased** | yes |
| 6 | treasury | `treasury` | `PropertyTreasury` | **`PropertyDais`** | ❌ **aliased** | yes |
| 7 | audit | `audit` | `PropertyAudit` | **`PropertyDossier`** | ❌ **aliased** | yes |
| 8 | dossier | `dossier` | `PropertyDossier` | `PropertyDossier` | ✅ same | yes |
| 9 | pilot | `pilot` | `PropertyPilot` | `PropertyPilot` | ✅ same | yes |

- **Index route:** Summary is registered as `<Route index>` (not `path='summary'`) — `Router.tsx:218`, enforced by the host-integrity contract.
- **Lazy loading:** all route components are `lazy()` (`Router.tsx:53-62`); the window adapter lazy-loads only **6** distinct components (`PropertyWorkbenchWindow.tsx:50-67`).
- **Parity verdict:** **route path = 9 real surfaces; window path = 6 real + 3 aliased** (clerk→Dossier, treasury→Dais, audit→Dossier). The 3 aliased tabs are a UI gap in the window adapter, carried from WO-WB-001 §2.1 for the Gap Register.

## 2. Forge sub-tab matrix (state-based, **not routed**)

`PropertyForge.tsx` is a **sub-tab switcher**, not a nested router: `useState<ForgeSubTab>` (`PropertyForge.tsx:110`), all sub-tabs stay mounted via `display:none` to preserve state (`PropertyForge.tsx:14`), each owns its own tool-invocation state (`PropertyForge.tsx:16`).

| Sub-tab id | Label | Component | File |
|-----------|-------|-----------|------|
| overview | Overview | `ForgeOverview` | `tabs/forge/ForgeOverview.tsx` |
| cost | Cost | `CostApproach` | `tabs/forge/CostApproach.tsx` |
| sales | Sales | `SalesComparison` | `tabs/forge/SalesComparison.tsx` |
| income | Income | `IncomeApproach` | `tabs/forge/IncomeApproach.tsx` |
| reconcile | Reconciliation | `Reconciliation` | `tabs/forge/Reconciliation.tsx` |
| (sketch) | Sketch | SketchModule | referenced from `PropertyForge.tsx` |

Imports at `PropertyForge.tsx:34-38`; sub-tab list at `PropertyForge.tsx:50-57`. **Implication for deep-linking:** Forge sub-tabs have **no URL** — they cannot be reached by route, only by in-tab state. (DcfPanel, the income stub from WO-WB-001 §4.2, lives under `income/` and is surfaced via the Income sub-tab.)

## 3. Operator sync-surface route matrix (separate namespace — **not parcel tabs**)

Registered as top-level `workbench/sync-*` routes (`Router.tsx:241-254+`), **not** under `/property/:parcelId`. Each is an operator surface, not a parcel-scoped tab.

| Route path | Component | File | Origin WO | Router.tsx |
|-----------|-----------|------|-----------|-----------|
| `workbench/sync-readiness` | `SyncReadinessConsole` | `sync-readiness/SyncReadinessConsole.tsx` | OPS-1-B | `:241` |
| `workbench/sync-doctrine` | `SyncDoctrineConsole` | `sync-doctrine/SyncDoctrineConsole.tsx` | DASHBOARD-1 | `:247` |
| `workbench/sync-quarantine` | `SyncQuarantinePage` | `sync-quarantine/SyncQuarantinePage.tsx` | SYNC-UX-1A | `:253` |
| `workbench/sync-commits` | `SyncCommitsPage` | `sync-commits/SyncCommitsPage.tsx` | SYNC-UX-1B | (near `:91` import) |
| `workbench/sync-corpus` | `SyncCorpusPage` | `sync-corpus/SyncCorpusPage.tsx` | SYNC-UX-1C | (near `:98` import) |

> **Scope flag (carried from WO-WB-001 §7):** these five sync surfaces live under `pages/workbench/` but are a **distinct operator lane** (Sync ops), not the parcel workbench. Whether they belong in "Property Workbench readiness" needs operator confirmation. This matrix records them for completeness but treats them as out-of-primary-scope pending that call.

## 4. Test-coverage cross-reference (per parcel tab)

From `frontend/apps/os-shell/src/__tests__/workbench/` (53 files). "Honesty contract" = a `*.honesty.contract.test.*` file enforcing source-badge/disclosure/no-fabrication.

| Tab | Base test | Honesty contract test | Extra coverage |
|-----|-----------|----------------------|----------------|
| summary | `PropertySummary.test.tsx` | ✅ `PropertySummary.honesty.contract.test.tsx` (+ `.honesty.test.tsx`) | — |
| forge | `PropertyForge.test.tsx` | ✅ `PropertyForge.honesty.contract.test.tsx` (+ `.honesty.test.tsx`) | `PropertyForge.income.test.tsx`; forge sub-tests: `SalesComparison`, `IncomeApproach`, `IncomeValuationPanel`, `ForgeSubjectParcelSnapshot`, `ComparableSalesForgeHost`, `EvidenceSnapshotPanel`, `Reconciliation.honesty.contract` |
| atlas | `PropertyAtlas.test.tsx` | ✅ `PropertyAtlas.honesty.contract.test.tsx` (+ `.honesty.test.tsx`) | — |
| dais | `PropertyDais.test.tsx` | ✅ `PropertyDais.honesty.contract.test.tsx` | `daisAppeal{Certification,Deadline,Hearing,Notice}Routing.contract` (4) |
| clerk | `PropertyClerk.test.tsx` | ❌ none | — |
| treasury | `PropertyTreasury.test.tsx` | ❌ none | — |
| audit | `PropertyAudit.test.tsx` | ❌ none | — |
| dossier | `PropertyDossier.test.tsx` | ❌ none | `dossier{Finalization,Narrative}Routing`, `dossierToDaisAppealRouting` (3) |
| pilot | `PropertyPilot.museFirst.test.tsx` | ❌ none | — |

Workbench-wide gates (not per-tab): `workbench.contractGates`, `workbench.writeLaneGates`, `workbench.riskPolicy`, `workbench.traceImmutability`, `workbenchEntrypoints.parity`, `workbenchEntrypoints.registryCompleteness`, `workbenchRealHosting.gate`, `WorkbenchSourceBadge`, `PropertyWorkbench.productionSmoke`, `PropertyWorkbenchWindow.segmentContext`, `workbench.regression`, `parcelContext.navigation`, `propertySearch.contract`, `r3cxComponentWiring.contract`, `R2Wave40IaaoStatsPanelTests.contract`.

> **Coverage observation (finding):** the honesty **contract** is enforced on **4 of 9** parcel tabs (Summary, Forge, Atlas, Dais) plus Forge/Reconciliation. **Clerk, Treasury, Audit, Dossier, Pilot have a base test but no honesty-contract test.** Given these are governed-tool surfaces that display tool output, the absence of a honesty-contract gate on them is a coverage gap → Gap Register (WO-WB-005). (Note the skipped Phase-16 launch-surface contract test from WO-WB-001 §5 is also still a hole.)

---

## 5. Reality summary

- **9 parcel tabs, all routed + enabled** on the route path; **the window adapter aliases 3** (Clerk/Treasury/Audit).
- **Forge** is the deepest surface: 5 state-based sub-tabs (+ Sketch), no per-sub-tab URL.
- **5 sync operator surfaces** are separately routed under `workbench/sync-*` and are a distinct lane (scope TBD).
- **Honesty-contract test coverage is partial** (4/9 tabs); base tests exist for all 9.

## 6. Unknowns (deferred)

1. Exact `Router.tsx` line numbers for `sync-commits`/`sync-corpus` route elements (imports confirmed near `:91`/`:98`; element registrations follow the `:241-254` block — not individually pinned here).
2. Whether any tab is further gated by role visibility at runtime (`useWorkbenchRoles`) beyond the static `enabled:true` — flagged for WO-WB-003.
3. Per-tab data-source/maturity mapping (which tool each tab calls, and its maturity state) — that is WO-WB-003 (surface classification) + WO-WB-004 (mock/live/stub provenance).

**STOP_TYPE:** `WB_ROUTE_TAB_MATRIX_COMPLETE`

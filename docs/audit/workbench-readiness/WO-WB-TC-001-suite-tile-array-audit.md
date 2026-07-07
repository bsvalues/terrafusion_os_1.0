# WO-WB-TC-001 — Suite Tile-Array Audit + Import-Safety Decision

**Goal:** GOAL-TF-WB-SUITE-TILE-CONTRACT-001 — Real Suite Tile-Array Launch Contract
**WO:** WO-WB-TC-001 — Current-state audit + import-safety decision
**Category:** Documentation (audit) · **Operator:** Claude Code · ratified follow-up to Phase-16

**Authorization:** Ratified lane. Product edit limited to adding `export` to the three arrays; test + docs otherwise.
Read-only elsewhere. Observed against `origin/main` 2026-07-07.

---

## 1. Purpose

Enumerate the real shipped suite tile arrays first-hand and decide whether they can be tested through the real
`SuiteModuleGrid` within the ratified "export-only" product scope (SUP-004 §4 flagged import weight as the key risk).

## 2. Tile enumeration (first-hand)

| Suite | Array (file) | Workbench tiles (→ tab) | Standalone tiles (→ moduleId) |
|-------|--------------|-------------------------|-------------------------------|
| Atlas | `ATLAS_MODULES` (`AtlasSuiteHome.tsx:32`) | **none** | 10 — all `moduleId: 'atlas'` (gis, parcel-lens, layer-works, terra-query, terra-sketch, terra-print, terra-export, terra-gis-pro, geo-equity-dashboard, mass-appraisal-gis) |
| Dais | `DAIS_MODULES` (`DaisSuiteHome.tsx:81`) | 3 → `dais` (certification, appeals, calendar) | 9 (terra-levy, terra-pilt, terra-permit, vei, property-tax-ai, management-dashboard, terra-queue, terra-cert, terra-notice) |
| Dossier | `DOSSIER_MODULES` (`DossierSuiteHome.tsx:44`) | 6 — 5 → `dossier` (documents, evidence, chain, photos, search) + **`defense` → `dais`** (cross-suite) | 3 (assessment-data-bridge, terra-sync, terra-flow) |

Confirms the Phase-16 finding: **Atlas is all standalone; Forge does not use `SuiteModuleGrid`.** The real workbench-launch
surface is Dais + Dossier (incl. one cross-suite Dossier→Dais tile). Every standalone tile declares an explicit `moduleId`.

## 3. Import-safety decision (the crux)

Importing any suite-home evaluates its full module graph — `SuiteModuleGrid` (→ `orchestration/moduleActivation`, the
Phase-16 worker-crash vector), `pilotApi`, `countyStudyHandoffApi`, panels, hooks. **Decision: strategy A (import the
arrays + mock the heavy deps in the test) is viable and low-fragility** — because the sibling deeplink tests
(`DaisSuiteHome.deeplink.test.tsx`, `DossierSuiteHome.deeplink.test.tsx`) already import + render these suite-homes and
thereby prove the exact minimal mock set. The contract test reuses that set with two changes:

- **Keep `SuiteModuleGrid` REAL** (it is the unit under test; the deeplink tests stub it).
- **Add the grid's own deps:** `stores/propertyStore` selector + `react-router-dom` `useNavigate`; `orchestration/moduleActivation`
  is already mocked (crash vector + standalone-call spy).

Modules the deeplink tests import **unmocked** (`DaisWorkflowDraftPanel`, `DossierEvidenceDraftPanel`, academy panel/button,
the zustand draft stores) are eval-safe and left real. **No product refactor is required** — the arrays only needed an
`export` keyword. The STOP condition ("arrays cannot be exported without a broader refactor") does not fire.

## 4. Outcome

Proceed: TC-002 adds `export` (3 lines, verified export-only); TC-003 writes the contract test at
`pages/suites/__tests__/suiteTileArrayLaunch.contract.test.tsx`; TC-004 records the matrix + rollup.

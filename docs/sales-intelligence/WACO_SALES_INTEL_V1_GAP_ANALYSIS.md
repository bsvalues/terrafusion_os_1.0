# Washington Sales Intelligence V1 — Gap Analysis & Execution Plan

**Work order lane:** WACO lane C (parent `WO-TERRAFUSION-WACO-PARALLEL-EXECUTION-001`)
**Scope:** Advisory-only sales-ratio / sales-intelligence capability for Washington counties.
**Claims discipline:** Advisory outputs only. No production mutation, no assessed-value changes, no FISMA-HIGH / 39-county-production claims.
**Status:** V1 gap analysis (evidence-backed, repo @ `8208c94a7`).

---

## 1. What exists today

All findings verified against `origin/main` (`8208c94a7`, PR #1533).

### 1.1 Ratio-study analytics — `TerraForgeController` (backend/src/TerraFusion.API/Controllers/TerraForgeController.cs, 3,643 LOC)

Mature, read-mostly IAAO analytics already exist under `GET /api/terraforge/`:

| Endpoint | Capability |
|---|---|
| `ratio-study` | IAAO stats on IQR-trimmed population: median/mean/weighted-mean, COD, PRD, PRB, COV, tier medians, tier slope, compliance notes (COD<15, PRD 0.98–1.03, \|PRB\|<0.05, median 0.90–1.10). TF computes its own ratio (`Properties.AssessedValue / SalePrice`); PACS-computed ratios are never consumed. |
| `ratio-study/trends`, `/stratified`, `/confidence-intervals`, `/vertical-equity`, `/influence-diagnostics`, `/time-trend`, `/spatial-autocorrelation`, `/hedonic-regression`, `/variance-decomposition`, `/sale-chasing`, `/cross-validation`, `/ks-shift-test`, `/driver-analysis` | Extended diagnostics. |
| `sale-qualification*` (GET) + `compute-qualifications`, `apply-recommendations`, `PATCH sale-qualification` (POST/PATCH) | Three-layer qualification: recommendation → decision → population. **These are mutation surfaces** and out of advisory scope. |
| `comps-pool`, `regression`, `county-stats`, `comparison-snapshots` | Supporting analytics. |

Population rule (used consistently): `QualificationDecision="qualified"` OR (decision null AND recommendation qualified/null), excluding `SuppressOnRatioRptCd="T"` and `IncludeNoCalc=true`; county-scoped via authenticated county claim.

### 1.2 Doctrine ratio-qualification policy — `IRatioQualificationPolicy`

`backend/src/TerraFusion.Core/Sync/Doctrine/IRatioQualificationPolicy.cs` (+ `TerraFusion.Data/Services/Doctrine/RatioQualificationPolicy.cs`): year-aware `(county, studyName, saleYear, code)` evaluation against `doctrine_tf.tf_doctrine_ratio_policy`. Closed study vocab: `DOR_RATIO` (Washington DoR study), `COUNTY_INTERNAL_RATIO`, `LEGACY_CODEBOOK_VALID` (historical reference only). Used by the sale truth promoter to stamp `dor_ratio_qualified` / `county_ratio_qualified`.

### 1.3 SalesAudit (Doctrine)

`SalesAuditController`, `IDoctrineSalesAuditService`, `DoctrineSalesAuditService`, `SalesAuditAdjustmentProposal` entity + EF configurations + migration `20260419014701_AddSalesAuditEntities`. AI diagnostic service present (`SalesAiDiagnosticServiceTests`).

### 1.4 Tests

`backend/TerraFusion.API.Tests/TerraForge/` (RatioStudyTests, SaleQualificationTests, CompsPoolTests, CountyStatsTests), `SalesAudit/` (3 suites), `Doctrine/RatioQualificationPolicyTests.cs`, `Doctrine/PacsSaleTruthPromoterDualSurfaceTests.cs`, `Valuation/EquityMetricServiceTests.cs`.

### 1.5 Legacy reference (non-canonical)

QUARANTINE contains PACS `SalesRatioReport*.sql`, `DORReportSales*.sql` stored procedures — evidence of the legacy Washington DoR reporting shape, not production code.

## 2. Gap analysis — what V1 lacks

| # | Gap | Evidence |
|---|---|---|
| G1 | **No sample-size adequacy advisory.** Ratio stats are computed regardless of n; nothing warns when a stratum is below IAAO §5.2 minimums (n<30 marginal, n<10 unreliable). Small Washington counties will silently get COD/PRD on 5 sales. | `GetRatioStudy` computes stats for any `countWithRatio > 0`. |
| G2 | **No WA DoR study-calendar awareness in the advisory layer.** Doctrine policy knows `DOR_RATIO` qualification rules per year, but no read-only endpoint answers "is this county's current study year complete enough to report to DoR". | `IRatioQualificationPolicy` is promoter-facing, not advisory-facing. |
| G3 | **No single advisory surface.** A county analyst must hand-assemble ratio-study + trends + qualification counts to answer "are we ratio-study ready". No aggregated, explicitly-advisory DTO/endpoint exists. | Endpoints are fragmented across 3,643-LOC controller. |
| G4 | **No docs consolidating the WA sales-intelligence surface** or its advisory-only contract. | No `docs/sales*/**` content exists. |

## 3. V1 execution plan (advisory-only)

**Contract:** every V1 output is read-only, labelled `advisoryOnly: true`, and documented as non-mutating. No writes to `ComparableSales`, `Properties`, doctrine tables, or qualification decisions.

1. **V1a — Sample-size advisory (this lane's intended code slice).** `GET /api/terraforge/ratio-study/sample-size-advisory?taxYear=` returning per-neighborhood strata with `qualifiedSales`, `countWithRatio`, and IAAO §5.2 classification (`adequate` ≥30 / `marginal` 10–29 / `insufficient` <10 / `noRatioData`). Same population rule as `ratio-study`. Status: **implemented but unshippable under current reservation** — the endpoint lives in `TerraForgeController.cs`, which is outside the corrected mutation reservation (`backend/src/sales*/**`, `backend/src/**/sales*/**`). A controller edit was prepared, then reverted per reservation correction. To land it, either (a) the reservation widens to include `backend/src/TerraFusion.API/Controllers/TerraForgeController.cs`, or (b) the endpoint is re-homed in a new `backend/src/**/sales*/` controller — feasible but duplicates county-scope plumbing; recommended as V1 follow-up under its own WO.
2. **V1b — Study-readiness advisory** (V1a + doctrine policy join): per `(county, taxYear)`, report qualified-sale counts against `DOR_RATIO` policy coverage and flag years where doctrine rules are absent. Read-only over `tf_doctrine_ratio_policy`.
3. **V1c — Advisory docs** (`docs/sales-intelligence/`): this gap analysis + endpoint contract + IAAO/IAAO-WA references + explicit "advisory only, no production mutation" claims language. **Shipped in this PR.**

Explicit non-goals for V1: no mutation endpoints, no assessed-value changes, no DoR submission/file generation, no frontend, no Docker/CI changes.

## 4. What shipped in this PR

Docs-only, per binding reservation correction (code slice did not fit the reserved paths):

- `docs/sales-intelligence/WACO_SALES_INTEL_V1_GAP_ANALYSIS.md` (this file).

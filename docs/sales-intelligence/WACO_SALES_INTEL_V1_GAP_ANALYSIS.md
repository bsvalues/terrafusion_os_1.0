# Washington Sales Intelligence V1 — Gap Analysis & Execution Plan

**Work order lane:** WACO lane C (parent `WO-TERRAFUSION-WACO-PARALLEL-EXECUTION-001`)
**Scope:** Advisory-only sales-ratio / sales-intelligence capability for Washington counties.
**Claims discipline:** Advisory outputs only. No production mutation, no assessed-value changes, no FISMA-HIGH / 39-county-production claims.
**Status:** V1 gap analysis (evidence-backed against current `origin/main` @
`0355ca78f`; docs shipped in merged PR #1556; V1a code is in open PR #1557).

---

## 1. What exists today

The baseline findings below were refreshed against current `origin/main`
(`0355ca78f`, PR #1556). PR #1557 is intentionally described separately as an
open delivery candidate, not as already merged mainline behavior.

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
| G1 | **No sample-size adequacy advisory on current main.** Ratio stats are computed regardless of n. Small Washington counties can receive COD/PRD on small samples without additive advisory metadata. | `GetRatioStudy` computes stats for any `countWithRatio > 0`; the proposed additive advisory is in open PR #1557. |
| G2 | **No WA DoR study-calendar awareness in the advisory layer.** Doctrine policy knows `DOR_RATIO` qualification rules per year, but no read-only endpoint answers "is this county's current study year complete enough to report to DoR". | `IRatioQualificationPolicy` is promoter-facing, not advisory-facing. |
| G3 | **No single advisory surface.** A county analyst must hand-assemble ratio-study + trends + qualification counts to answer "are we ratio-study ready". No aggregated, explicitly-advisory DTO/endpoint exists. | Endpoints are fragmented across 3,643-LOC controller. |
| G4 | **Documentation consolidation was missing from the pre-#1556 baseline.** | The docs slice is now present under `docs/sales-intelligence/`; future gaps are tracked here. |

## 3. V1 execution plan (advisory-only)

**Contract:** every V1 output is read-only, labelled `advisoryOnly: true`, and documented as non-mutating. No writes to `ComparableSales`, `Properties`, doctrine tables, or qualification decisions.

1. **V1a — Sample-size advisory.** PR #1557 adds a `sampleSizeAdequacy` object to the existing `GET /api/terraforge/ratio-study` response inside `TerraForgeController.GetRatioStudy`. The metadata is additive-only, derives from the existing untrimmed `countWithRatio`, and preserves the existing statistics path. Its states are `adequate`, `marginal`, `insufficient`, `noRatioData`, and `unavailable`. The 30/10 thresholds are explicitly labeled `terraFusionPolicy`; they are not presented as IAAO §5.2 compliance because no exact current authoritative provision is cited. Status: **open PR #1557, awaiting normal review/merge**.
2. **V1b — Study-readiness advisory** (V1a + doctrine policy join): per `(county, taxYear)`, report qualified-sale counts against `DOR_RATIO` policy coverage and flag years where doctrine rules are absent. Read-only over `tf_doctrine_ratio_policy`.
3. **V1c — Advisory docs** (`docs/sales-intelligence/`): this gap analysis + endpoint contract + explicit "advisory only, no production mutation" claims language. **Shipped in merged PR #1556; this reconciliation keeps the current-state labels accurate.**

Explicit non-goals for V1: no mutation endpoints, no assessed-value changes, no DoR submission/file generation, no frontend, no Docker/CI changes.

## 4. What shipped in this PR

Docs-only, per binding reservation correction (code slice did not fit the original
docs-only reservation):

- `docs/sales-intelligence/WACO_SALES_INTEL_V1_GAP_ANALYSIS.md` (this file).

Current state: the documentation slice is merged (#1556); the corrected V1a
implementation is delivering in #1557. The open PR remains subject to review
and merge gates, so current mainline still has the G1 gap described above.

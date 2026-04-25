# CostForge Benton Method v2 — Design Spec

**Date:** 2026-04-16
**Author:** TerraFusion Elite Government OS Engineering Agent Cloud Coach (orchestrator) + Benton County WA assessor (owner)
**Status:** Approved, ready for plan
**Target release:** CostForge v2 (Benton Method full-fidelity)

---

## 1. Strategic Goal

Transform CostForge from alpha-grade viewer into production-grade **audit → diagnose → fix → verify** loop that implements the **full Benton Method**:

1. **IAAO compliance baseline** — median ratio, COD, PRD, PRB
2. **Benton custom metrics beyond IAAO** — decile equity analysis, stratified COD, WAC condition bias, ImprvDetTypeCd drift, quality-grade drift
3. **Deep stratification** — every metric computable at parcel → neighborhood → city → county → property-type → vintage-decade level
4. **Closed-loop calibration** — simulate adjustment, preview impact on every metric at every stratum, commit, verify

The goal is production-grade: a PhD chief appraiser can open CostForge, find the worst-offending neighborhood stratified by any dimension, diagnose the root cause via custom Benton metrics, simulate a segment-specific fix, commit it, and verify the fix moved every relevant metric in the right direction — all in a single session against live Benton County data (CAMA characteristics, comparable sales, cost matrices) persisted in the TerraFusion PostgreSQL database.

---

## 2. Architecture Principles

1. **Backend computes, frontend displays.** No client-side IAAO or Benton-metric math. All ratios, COD, PRD, PRB, decile bias, stratified COD computed server-side from a single canonical `EquityMetricService`. Frontend renders.
2. **Canonical data boundary.** CostForge v2 reads **only** from TerraFusion canonical entities:
   - `CamaCharacteristics` (per-parcel CAMA: GLA, grade, condition, year-built, neighborhood, etc.)
   - `CamaImprovementDetails` (per-segment secondary features: `SegmentType` in {MA, CovPatio, BSMT, Shop, Garage, Patio, ...})
   - `ComparableSales` (3-layer qualified sales with `AdjustedSalePrice`, `QualificationDecision` ?? `QualificationRecommendation` ?? `SaleQualification`)
   - `CostMatrices` (cost schedules: `BaseRate`, `Region`, `BuildingType`, `Grade`, `Condition`, `MatrixYear`)
   - `PropertyAssessments` (assessed value, market value, by `AssessmentYear`)
   - `Properties`, `Counties`, `CountyRatioCodes`, `SaleRatioTypes`, `OutlierExclusions`
   - `CalibrationMemos`, `CalibrationFindings`, `RevalAreaEvidenceAges` (audit + tracking)

   **CostForge v2 never queries `Pacs*` staging tables, and never touches Harris PACS MSSQL.** PACS is upstream of our boundary — `PacsCanonicalizer` is the sole bridge and runs as a separate ingest concern.
3. **Fix what's not right.** If a canonical entity is missing a field CostForge v2 needs (e.g., `City` for city-rollups), we extend the entity via EF migration as part of Track 0 and ensure `PacsCanonicalizer` populates it. We do not work around schema gaps.
4. **Stratum-first API design.** Every metric endpoint accepts `?by={neighborhood|city|county|type|vintage|condition|grade}` and `?segment={code}`. One endpoint shape, many analytical cuts.
5. **Real data only.** No stub endpoints, no placeholder numbers. If the canonical data isn't populated for a parcel, the endpoint returns `null` with a `provenance` flag so the UI renders "—" with an explanatory tooltip.
6. **Workflow-first UX.** Triage (morning priority view) and Calibration Workbench (fix surface) are primary. Audit (drill-down) and Data Quality (foundation check) are secondary. Parcel, Depreciation, Schedule, Calc Trace are lookup utilities.
7. **Swarm-parallel build.** Seven independent tracks (T0–T6) in isolated worktrees; dispatched by the orchestrator using subagent-driven-development; QA at each ship boundary.
8. **TypeScript strict, 0 errors, 0 raw fetch.** All frontend API calls go through `apiFetch`/`apiFetchJson`. All hooks use `AbortController`.
9. **Audit fields sacred.** Every canonical write respects the FISMA auto-populated `CreatedAt/UpdatedAt/CreatedBy/UpdatedBy` contract. Calibration commits land in `CalibrationFindings` + `CalibrationMemos` for full audit trail.

---

## 3. Scope Decomposition (Seven Tracks)

### Track 0 — Canonical Data Foundation (Backend + EF migration)
**Sub-project:** Prerequisite

**Purpose:** Verify canonical entities hold live Benton data and extend schema where CostForge v2 needs fields that don't yet exist.

**Files to create / modify:**
- `backend/src/TerraFusion.Core/Entities/CamaCharacteristic.cs` — add `City` field (VARCHAR 50, nullable; one of Kennewick, Richland, Pasco, Prosser, Benton City, West Richland, Unincorporated)
- `backend/src/TerraFusion.Core/Entities/CamaCharacteristic.cs` — add `PropertyUseStratum` field (enum: `R` residential SFR, `M` manufactured, `C` commercial, `A` agricultural, `V` vacant, `X` exempt) — derived from `BuildingType` during canonicalization
- `backend/src/TerraFusion.Data/Configurations/CamaCharacteristicConfiguration.cs` — index on `(CountyId, TaxYear, City)` and `(CountyId, TaxYear, PropertyUseStratum)` and `(CountyId, TaxYear, NeighborhoodCode)` for stratum query performance
- `backend/src/TerraFusion.Data/Migrations/AddCityAndStratumToCama.cs` — EF migration adding the two new columns
- `backend/src/TerraFusion.Data/Canonicalizers/PacsCanonicalizer.cs` (modify or create) — populate `City` from `PacsSitus.SitusCity` and `PropertyUseStratum` from `BuildingType` during canonicalization runs
- `backend/src/TerraFusion.API/Controllers/AdminController.cs` (extend) — add `POST /api/admin/canonical/populate` endpoint to run `PacsCanonicalizer` against existing data
- `backend/tests/TerraFusion.Data.Tests/Canonicalizers/PacsCanonicalizerTests.cs` — verify canonicalization idempotency and field population

**Verification steps (must pass before T0 ships):**
- `SELECT COUNT(*) FROM cama_characteristics WHERE county_id = <benton>` returns > 70,000
- `SELECT COUNT(*) FROM cama_improvement_details WHERE county_id = <benton>` returns > 0
- `SELECT COUNT(*) FROM comparable_sales WHERE county_id = <benton> AND tax_year >= 2024` returns > 0
- Every `CamaCharacteristic` in Benton has non-null `City` after canonicalization run
- Every `CamaCharacteristic` has non-null `PropertyUseStratum`

**Depends on:** Nothing. Wave 0. Blocks T1, T2, T3, T4, T5, T6.

---

### Track 1 — Equity Metric Service (Backend foundation)
**Sub-project:** A

**Files to create:**
- `backend/src/TerraFusion.AI/Valuation/EquityMetricService.cs`
- `backend/src/TerraFusion.Core/Interfaces/IEquityMetricService.cs`
- `backend/src/TerraFusion.Core/DTOs/EquityMetricsDto.cs`
- `backend/src/TerraFusion.API/Controllers/EquityController.cs`
- `backend/tests/TerraFusion.API.Tests/Controllers/EquityControllerTests.cs`

**Responsibilities:**
- Build `SaleRatio[]` from canonical sources:
  - FROM `ComparableSales` cs JOIN `PropertyAssessments` pa ON `cs.ParcelId = p.ParcelNumber AND cs.CountyId = pa.CountyId AND pa.AssessmentYear = taxYear`
  - Effective qualification: `COALESCE(cs.QualificationDecision, cs.QualificationRecommendation, cs.SaleQualification)` — include only `qualified`
  - Exclude: `cs.IncludeNoCalc = true`, `cs.SuppressOnRatioRptCd = 'T'`, `cs.LandOnlySale = true` (unless land-only study)
  - Exclude: parcels in `OutlierExclusions` for the tax year
  - Ratio = `pa.AssessedValue / cs.AdjustedSalePrice` (use `AdjustedSalePrice` — NOT `SalePrice` — this is the ratio-study-adjusted figure)
- Compute all IAAO metrics from the `SaleRatio[]` collection:
  - `medianRatio`
  - `weightedMeanRatio` (sum of assessedValues / sum of adjustedSalePrices)
  - `arithmeticMeanRatio`
  - `cod` (Coefficient of Dispersion, IAAO standard formula)
  - `prd` (Price-Related Differential = mean / weighted mean)
  - `prb` (Price-Related Bias, regression of `ln(ratio)` on `ln(value/median)`)
- Compute Benton custom metrics from the same collection:
  - `decileMedianRatios` — array of 10 medians, one per sale-price decile
  - `stratifiedCod` — COD within each segment of a chosen stratum (used by Track 3)
- Surface via single endpoint: `GET /api/equity/metrics?by={stratum}&segment={code}&taxYear={year}`
  - `by=none` returns county-wide single bucket
  - `by=neighborhood` returns dict keyed by `CamaCharacteristic.NeighborhoodCode`
  - `by=city` returns dict keyed by `CamaCharacteristic.City` (requires T0)
  - `by=type` returns dict keyed by `CamaCharacteristic.PropertyUseStratum` (requires T0)
  - `by=vintage` returns dict keyed by `vintage_decade` computed from `CamaCharacteristic.YearBuilt`
  - `by=condition` returns dict keyed by `CamaCharacteristic.ConditionGrade`
  - `by=grade` returns dict keyed by `CamaCharacteristic.QualityGrade`

**Depends on:** Track 0 (needs `City`, `PropertyUseStratum` on `CamaCharacteristic`).

**Out of scope for T1:** Any UI changes. Those come in T3/T5/etc.

---

### Track 2 — Geographic + Stratum Rollups (Backend + contract types)
**Sub-project:** B

**Files to create / modify:**
- `backend/src/TerraFusion.AI/Valuation/RollupService.cs` (new)
- `backend/src/TerraFusion.API/Controllers/EquityController.cs` (extend with `/rollup` endpoint)
- `backend/src/TerraFusion.Core/DTOs/StratumRollupDto.cs` (new)
- `frontend/apps/os-shell/src/pages/forge/cost/types/rollup.ts` (new)

**Responsibilities:**
- City rollups for the six Benton cities + unincorp, using `CamaCharacteristic.City`:
  - Kennewick, Richland, Pasco, Prosser, Benton City, West Richland, Unincorporated
- Property-type strata using `CamaCharacteristic.PropertyUseStratum`:
  - R (Residential SFR), M (Manufactured), C (Commercial), A (Agricultural), V (Vacant), X (Exempt)
- Vintage decade buckets from `CamaCharacteristic.YearBuilt`: `1900s`, `1910s`, ..., `2020s`
- Endpoint: `GET /api/equity/rollup?by={city|type|vintage|grade}&taxYear={year}`
- Returns `{ strata: [{ key, name, parcelCount, saleCount, metrics: EquityMetrics, iaaoCompliant, bentonCompliant }] }`
- Integration: TriageTab sidebar adds "City Rollup" and "Type Rollup" accordions

**Depends on:** Track 0 (for `City`, `PropertyUseStratum`) and Track 1 (for `EquityMetricService`).

---

### Track 3 — Benton Custom Metrics (Backend compute + Frontend surface)
**Sub-project:** C

**The five custom metrics beyond IAAO:**
1. **Decile equity analysis** — sort sales by `AdjustedSalePrice` into 10 equal-count buckets, compute median ratio per decile. Flags regressive pattern (low-value overassessed, high-value underassessed: D1 median > D10 median) vs. progressive at decile granularity PRD/PRB miss.
2. **Stratified COD** — COD computed within each vintage decade, condition class, and grade; surfaces "1970s homes have 22% COD while overall county is 14%" type patterns.
3. **WAC condition bias** — median ratio per `CamaCharacteristic.ConditionGrade` (POOR/FAIR/GOOD/EXCELLENT). Detects "poor condition parcels systematically overassessed" failures.
4. **Secondary-segment drift** — median ratio for parcels with specific `CamaImprovementDetail.SegmentType` codes (POLEBLDG, BSMT, POOL, CovPatio, ATTGAR, DETGAR) vs. parcels without. Detects "pole barns are overvaluing ag properties" issues.
5. **Quality-grade drift** — median ratio per `CamaCharacteristic.QualityGrade` (ECONOMY/FAIR/STANDARD/GOOD/EXCELLENT/LUXURY). Detects systematic mis-calibration of a specific grade tier.

**Files to create:**
- `backend/src/TerraFusion.AI/Valuation/BentonCustomMetricService.cs`
- Extend `EquityController` with routes:
  - `GET /api/equity/deciles?by={stratum}&segment={code}&taxYear={year}`
  - `GET /api/equity/stratified-cod?by={stratum}&segment={code}&splitBy={vintage|condition|grade}&taxYear={year}`
  - `GET /api/equity/condition-bias?by={stratum}&segment={code}&taxYear={year}`
  - `GET /api/equity/segment-drift?by={stratum}&segment={code}&taxYear={year}`
  - `GET /api/equity/grade-drift?by={stratum}&segment={code}&taxYear={year}`
- Frontend new panel: `frontend/apps/os-shell/src/pages/forge/cost/panels/BentonDiagnosticsPanel.tsx`
- Integrate into NeighborhoodAuditTab (new "Benton Diagnostics" collapsible section)
- Integrate into TriageTab (decile indicator icon column — red if D1/D10 median spread > 0.15)

**Depends on:** Track 0, Track 1.

---

### Track 4 — Data Quality Engine (Backend compute + Frontend surface)
**Sub-project:** D

**Files:**
- `backend/src/TerraFusion.AI/DataQuality/CamaDataQualityService.cs` (new)
- `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` (full impl of `/costforge/analytics/data-quality/assess`)
- Extend `frontend/apps/os-shell/src/pages/forge/cost/tabs/DataQualityTab.tsx` with issue drill-in
- Modify `frontend/apps/os-shell/src/pages/forge/cost/tabs/NeighborhoodAuditTab.tsx` — add IQR outlier column with visual flag

**The 8 real checks (all on canonical entities):**
1. **Missing quality codes** — `CamaCharacteristic.QualityGrade IS NULL OR ConditionGrade IS NULL`
2. **Stale effective age** — parcels where `CamaCharacteristic.UpdatedAt` > 24 months ago AND has improvement activity
3. **Missing segment types** — parcels in `CamaCharacteristics` but no corresponding `CamaImprovementDetails` rows, or `SegmentType IS NULL` on rows
4. **Missing sale pairs** — neighborhoods in `CamaCharacteristics` with no `ComparableSales` rows in the last 4 years (blocks ratio studies)
5. **IQR ratio outliers** — parcels with ratio > Q3 + 1.5×IQR or < Q1 − 1.5×IQR within their neighborhood (compute from `ComparableSales` ⋈ `PropertyAssessments`)
6. **Quality/grade cross-field mismatches** — e.g., `ConditionGrade = 'POOR' AND QualityGrade = 'LUXURY'` (impossible)
7. **Year-built inconsistency** — `YearBuilt > current_year` OR `EffectiveAge > (current_year - YearBuilt) + 20`
8. **GLA / land conflicts** — `CamaCharacteristic.SquareFeet > CamaCharacteristic.LandAreaSqft` (impossible for SFR)

Each check returns `{category, field, affectedCount, description, severity, parcelSample: string[]}` so appraiser can drill in.

**IQR outlier UI:** NeighborhoodAuditTab parcel rows gain a flag badge when parcel's ratio is outside Q1−1.5×IQR..Q3+1.5×IQR for that hood.

**Depends on:** Track 0. Parallel wave 1 alongside T1, T6.

---

### Track 5 — Calibration v2 (Backend + Frontend polish)
**Sub-project:** E

**Files:**
- `backend/src/TerraFusion.AI/Valuation/CalibrationService.cs` (extend)
- `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` (extend calibration endpoints)
- `frontend/apps/os-shell/src/pages/forge/cost/tabs/CalibrationWorkbenchTab.tsx` (extend)
- `frontend/apps/os-shell/src/pages/forge/cost/CostApproachRunner.tsx` (add condition→effective-age)
- `frontend/apps/os-shell/src/pages/forge/cost/DepreciationCalculator.tsx` (condition picker)

**Responsibilities:**
- **Effective-age derivation:** Backend endpoint `POST /api/costforge/effective-age` — takes `actualAge, conditionGrade, functionalObsAmount, externalObsAmount` — returns derived `effectiveAge` based on Benton's adjustment table:
  - `EXCELLENT`: actualAge − 3
  - `GOOD`: actualAge + 0
  - `FAIR`: actualAge + 2
  - `POOR`: actualAge + 5
  - (table is WAC-aligned; verified during implementation against Benton's published schedule)
- **Segment-specific mass adjust:** New param `segmentSplit: {dimension: "vintage_decade" | "property_type" | "condition", segments: [{code, adjustmentPct}]}`. Instead of flat % for a hood, apply different % per decade/type/condition within hood.
- **Full-metric preview:** Preview endpoint returns before/after for: `medianRatio`, `weightedMeanRatio`, `cod`, `prd`, `prb`, `decileMedianRatios[10]`. UI renders side-by-side sparkline per metric.
- **Post-commit verification snapshot:** After commit, auto-invoke `GET /api/equity/metrics?by=neighborhood&segment={hoodCd}` and write result to `CalibrationMemos` (audit trail). UI displays "Verified: median moved 0.92 → 0.998, COD 19.3 → 14.1" success panel.
- **Audit trail:** Every commit writes `CalibrationFinding` row linking `hoodCd`, `adjustmentPct`, `segmentSplit` (JSON), `parcelCount`, `before/after metrics`, `committedBy`, `committedAt`.

**Depends on:** Track 0, Track 1, Track 2.

---

### Track 6 — Secondary Feature %-of-BIV Wiring (Backend + Frontend end-to-end)
**Sub-project:** F

**Files:**
- `backend/src/TerraFusion.Core/Entities/CostMatrix.cs` (extend with a `SecondaryFeaturePctOfBiv` column, nullable decimal — set only for secondary-feature rows)
- `backend/src/TerraFusion.Data/Migrations/AddSecondaryFeaturePctToCostMatrix.cs` (EF migration)
- `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` (extend `/costforge/schedule` response to include secondary feature rows)
- `backend/src/TerraFusion.AI/Valuation/CostApproachCalculator.cs` (ensure RCN calc uses `CamaImprovementDetail.SegmentType` → `CostMatrix.SecondaryFeaturePctOfBiv` × BIV)
- `frontend/apps/os-shell/src/pages/forge/cost/CostApproachRunner.tsx` (BIV section renders real %-of-BIV values from `CamaImprovementDetail` rows)
- `frontend/apps/os-shell/src/pages/forge/cost/CostManual.tsx` (add secondary-features table/section)
- `backend/src/TerraFusion.Data/Seeders/BentonSecondaryFeatureRatesSeeder.cs` (new) — seeds canonical Benton rates

**The Benton rates (seed into `CostMatrix` where `MatrixType = 'SecondaryFeature'`):**
- `CovPatio` (covered patio) — 3% of BIV
- `BSMT` (basement) — 13% of BIV
- `POLEBLDG` (pole building) — 18% of BIV
- `ATTGAR` (attached garage) — ~12% of BIV
- `DETGAR` (detached garage) — ~8% of BIV
- `POOL` (pool) — starter rate 5% of BIV; refined during implementation from real Benton data
- `MA` (main area) — 100% of BIV (the base, not a feature)

End-to-end path:
1. `CostForgeController.GET /costforge/schedule` returns rates per building class/grade AND secondary features
2. CostManual tab shows secondary-feature rate table
3. Parcel Inspector BIV section queries `CamaImprovementDetail` for the parcel's segments and displays: `MA 2,400sf × $135/sf = BIV $324,000`, then each feature with its %-of-BIV and $ value
4. RCNLD calc on backend: `RCN = BIV + Σ(feature_pctOfBiv × BIV) + refinements` → `RCN × (percent_good / 100)`

**Depends on:** Track 0. Parallel wave 1 alongside T1, T4.

---

## 4. Dispatch Strategy

### Wave 0 (sequential first, all else blocked):
- **T0** — Canonical Data Foundation (schema + canonicalizer + verification)

### Wave 1 (parallel, after T0 ships):
- **T1** — EquityMetricService (backend) — blocks T2, T3, T5
- **T4** — Data Quality Engine (backend + frontend) — independent
- **T6** — Secondary Feature %-of-BIV (backend + frontend) — independent

### Wave 2 (parallel, after T1 ships):
- **T2** — Geographic + Stratum Rollups
- **T3** — Benton Custom Metrics

### Wave 3 (after T1 + T2 ship):
- **T5** — Calibration v2

### Orchestration
- Each track runs in an isolated git worktree: `trees/cf-v2-t{0..6}-{shortname}`
- Orchestrator dispatches subagents per task using subagent-driven-development: implementer → spec reviewer → code quality reviewer
- Each track ships to integration branch `integration/costforge-v2`
- Orchestrator runs cross-track QA at integration; merges to main only after all 7 tracks green

---

## 5. QA Gates (orchestrator-run)

### Per-task gate
- Subagent-driven: implementer completes, spec reviewer confirms compliance, code quality reviewer approves
- TypeScript: 0 errors on changed files
- Tests: backend gets xUnit tests; frontend gets contract tests where relevant

### Per-track ship gate
- Integration test against live Benton canonical data (target: > 70,000 `CamaCharacteristics`, populated `CamaImprovementDetails`, populated `ComparableSales`)
- Screenshot capture of every affected UI surface (before/after)
- No raw `fetch`, no double `/api` prefix, all calls via `apiFetch`/`apiFetchJson`
- All async hooks use `AbortController`
- Zero queries against `Pacs*` tables in CostForge v2 code (grep gate)
- Zero references to "Marshall & Swift" (grep gate, already clean, enforce)

### Cross-track gate (at integration branch)
- Metric numerical consistency: PRD reported in TriageTab for neighborhood X == PRD returned by `/api/equity/metrics?by=neighborhood&segment=X`
- Decile arrays match across Triage drill-in summary vs. NeighborhoodAuditTab detail view
- City rollup totals = sum of neighborhood totals within that city
- Stratified COD sums back to overall COD within tolerance
- No regression in existing ForgeSuiteHome contract tests (21 tests must still pass)

### Final release gate
- Full 8-tab screenshot suite captured
- TypeScript 0 errors
- All 8 data-quality checks surface ≥1 real issue from live Benton canonical data (or 0 legitimately)
- Benton cost schedule fully populated with secondary feature rates in `CostMatrices`
- Calibration v2 demo: pick worst hood from Triage → open Audit → identify vintage decade driver → open Calibration → apply segment-specific adjust → commit → verify metrics moved → `CalibrationFinding` row written

---

## 6. Data Model Contracts

### EquityMetrics (shared across tracks)
```typescript
interface EquityMetrics {
  saleCount: number;
  medianRatio: number | null;
  weightedMeanRatio: number | null;
  arithmeticMeanRatio: number | null;
  cod: number | null;           // Coefficient of Dispersion, %
  prd: number | null;           // Price-Related Differential
  prb: number | null;           // Price-Related Bias
  decileMedianRatios: (number | null)[]; // length 10, null for empty deciles
  iaaoCompliant: boolean;       // median in [0.9, 1.1] AND cod ≤ 15 AND prd in [0.98, 1.03] AND |prb| ≤ 0.05
  bentonCompliant: boolean;     // IAAO-compliant AND max |decileMedian - overallMedian| ≤ 0.10
  provenance: 'real' | 'insufficient-sales' | 'no-data';
}
```

### StratumRollup (Track 2)
```typescript
interface StratumRollup {
  key: string;               // e.g., "KENNEWICK" or "R" or "1970s"
  name: string;              // display label
  parcelCount: number;
  saleCount: number;
  totalAv: number | null;
  metrics: EquityMetrics;
  childCount?: number;       // for hierarchical rollups
}
```

### PreviewResponse (Track 5, extended)
```typescript
interface PreviewResponse {
  parcelCount: number;
  matchedSales: number;
  totalAvBefore: number;
  totalAvAfter: number;
  metricsBefore: EquityMetrics;
  metricsAfter: EquityMetrics;
  segmentBreakdown?: Array<{
    segmentCode: string;
    segmentName: string;
    parcelCount: number;
    metricsBefore: EquityMetrics;
    metricsAfter: EquityMetrics;
  }>;
  estimatedImpactOnFundingLevel: number | null;
}
```

---

## 7. Out of Scope (explicitly deferred)

- **Harris PACS direct queries** — forbidden. CostForge v2 never touches PACS MSSQL or the `Pacs*` canonical staging tables. `PacsCanonicalizer` is the only bridge.
- Consciousness service (port 3004) integration with CostForge — deferred to next phase
- Multi-county support beyond Benton — Sovereign County model means Benton-first
- Real-time PACS sync — existing canonicalization cadence is sufficient; CostForge v2 does not trigger sync
- Quantum / gauge-theory / 3-6-9 codex integration — no dependencies from CostForge v2
- AI swarm (1,008 agent) coordination — CostForge v2 is deterministic compute; no swarm dependency
- Mobile / tablet UI — desktop-only for v2
- Income Approach integration — separate IncomeForge module
- Sales Comparison integration — separate SalesForge module

---

## 8. Success Criteria Checklist

- [ ] Canonical entities populated: `CamaCharacteristics` > 70K, `CamaImprovementDetails` > 0, `ComparableSales` ≥ recent years for Benton
- [ ] `CamaCharacteristic.City` and `CamaCharacteristic.PropertyUseStratum` non-null for every Benton parcel
- [ ] `EquityMetricService` computes median, weighted mean, COD, PRD, PRB, deciles from canonical data in < 2 seconds per stratum
- [ ] `/api/equity/metrics` endpoint returns real values for all 6 Benton cities, all property-type strata, all vintage decades
- [ ] TriageTab priority ranking includes PRB weighting; PRB column shows real values
- [ ] NeighborhoodAuditTab shows decile breakdown + IQR outlier flags
- [ ] Data Quality tab surfaces real counts for all 8 checks
- [ ] CalibrationWorkbenchTab preview shows before/after for every equity metric (not just median/COD)
- [ ] Parcel Inspector BIV section shows real %-of-BIV from `CamaImprovementDetail` rows for every segment the parcel has
- [ ] Cost Manual has secondary-features rate table sourced from `CostMatrices`
- [ ] Effective-age derivation works: enter actualAge=30 + condition=FAIR → returns effectiveAge=32
- [ ] Every commit in CalibrationWorkbench writes `CalibrationFinding` + `CalibrationMemo`
- [ ] Full 8-tab screenshot suite captured, all data live
- [ ] TypeScript 0 errors, 0 raw fetch, all `AbortController`
- [ ] ForgeSuiteHome 21 contract tests still pass
- [ ] 0 `Pacs*` entity queries in CostForge v2 code
- [ ] 0 "Marshall & Swift" references anywhere in active code

---

## 9. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Parallel worktrees create merge conflicts on `CostForgeController.cs` | High | T4, T5, T6 all touch this file. Serialize controller edits — merge order: T1 first, T4 second, T5 third, T6 last. Orchestrator resolves. |
| Equity metrics differ numerically from existing `neighborhood-matrix` endpoint | Medium | T1 replaces existing metric computation. Contract test: existing `neighborhood-matrix` must delegate to `EquityMetricService` and numerical values unchanged for existing hoods. |
| Canonical `CamaCharacteristic.City` not yet populated | High (T0 task) | T0 verification gate blocks T1–T6. If canonicalizer is incomplete, extend `PacsCanonicalizer` to source `City` from `PacsSitus.SitusCity` or equivalent. |
| Canonical `ComparableSales` empty or stale for some neighborhoods | Medium | Mark hoods with < 3 qualified sales in last 4 years as `provenance: 'insufficient-sales'`. Display "—" in UI with tooltip. Surface in Data Quality tab (check #4). |
| PRB regression needs enough sales per stratum (min n=10) | Medium | Strata with < 10 sales return `prb: null` with `provenance: 'insufficient-sales'`. |
| Decile buckets unstable for small sale samples | Medium | Require saleCount ≥ 30 for decile analysis; below that, return `decileMedianRatios: []` with note. |
| Secondary feature rates vary by reval cycle / region | Low | `CostMatrix` already has `Region` and `MatrixYear` columns; seeder + endpoint filter by these. |
| Qualification logic subtle (3-layer fallback) | Medium | Centralize in a single `SaleRatioQueryBuilder` helper used by all tracks — no duplication. Unit test the fallback order: `QualificationDecision` ?? `QualificationRecommendation` ?? `SaleQualification`. |
| T0 migration affects existing queries | Medium | Nullable columns with defaults; migration is additive only. No existing code breaks. |

---

## 10. Glossary (for consistency across tracks)

- **BIV** — Base Indicated Value. `GLA × $/sqft` of the main area (`SegmentType = 'MA'`). Foundation of Benton Method.
- **RCN** — Replacement Cost New. `BIV + Σ(secondary feature values) + refinements`.
- **RCNLD** — Replacement Cost New Less Depreciation. `RCN × (percent_good / 100)`.
- **%-of-BIV** — Secondary features priced as a percentage of BIV (CovPatio 3%, BSMT 13%, POLEBLDG 18%, etc), stored in `CostMatrix.SecondaryFeaturePctOfBiv`.
- **COD** — Coefficient of Dispersion. Measures uniformity; IAAO target ≤ 15%.
- **PRD** — Price-Related Differential. `mean ratio / weighted mean ratio`. IAAO target 0.98–1.03.
- **PRB** — Price-Related Bias. Regression slope of `ln(ratio)` on `ln(value / median_value)`. IAAO target `|PRB| ≤ 0.05`.
- **Decile Equity** — Benton custom metric. Sort qualified sales by `AdjustedSalePrice` into 10 equal-count buckets; compute median ratio per decile.
- **Stratified COD** — COD computed within each segment of a stratum (e.g., COD for 1970s homes separately from 2000s homes).
- **WAC** — Washington Administrative Code. Governs condition codes, grade codes, depreciation schedules for WA state assessors. Reflected in `CamaCharacteristic.ConditionGrade` / `QualityGrade` canonical values.
- **SegmentType** — `CamaImprovementDetail.SegmentType` code. Identifies per-segment features: MA, CovPatio, BSMT, POLEBLDG, ATTGAR, DETGAR, POOL, Shop, Patio, etc. Direct canonical equivalent of PACS `ImprvDetTypeCd`, populated by `PacsCanonicalizer`.
- **Stratum** — An analytical dimension for cutting the portfolio: `neighborhood`, `city`, `type`, `vintage`, `condition`, `grade`.
- **Segment (in Equity API)** — A specific value within a stratum: e.g., `segment="KENNEWICK"` within `stratum="city"`. (Note: "segment" is overloaded — in `CamaImprovementDetail` it means a building section; in API query params it means a stratum value. Context-specific.)
- **Canonical entity** — A TerraFusion-owned, vendor-neutral EF entity (e.g., `CamaCharacteristic`, `ComparableSale`). CostForge v2 reads exclusively from these.
- **Pacs\* entity** — TerraFusion-owned staging entity populated by `PacsDataSeeder` from the PACS MSSQL source. Written by the seeder, consumed by `PacsCanonicalizer`. CostForge v2 never reads these.
- **PacsCanonicalizer** — The sole bridge from `Pacs*` staging entities to canonical entities (`CamaCharacteristic`, `CamaImprovementDetail`, `ComparableSale`). Runs as a separate ingest concern.

---

**End of spec.**

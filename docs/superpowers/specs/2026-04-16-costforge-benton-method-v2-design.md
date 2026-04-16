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

The goal is production-grade: a PhD chief appraiser can open CostForge, find the worst-offending neighborhood stratified by any dimension, diagnose the root cause via custom Benton metrics, simulate a segment-specific fix, commit it, and verify the fix moved every relevant metric in the right direction — all in a single session against live Benton County data (75,907 parcels, 89,247 total CAMA records).

---

## 2. Architecture Principles

1. **Backend computes, frontend displays.** No client-side IAAO or Benton-metric math. All ratios, COD, PRD, PRB, decile bias, stratified COD computed server-side from a single canonical `EquityMetricService`. Frontend renders.
2. **Stratum-first API design.** Every metric endpoint accepts `?by={neighborhood|city|county|type|vintage|condition|grade}` and `?segment={code}`. One endpoint shape, many analytical cuts. No bespoke per-dimension endpoints.
3. **Real data only.** No stub endpoints, no placeholder numbers. If the data isn't in PACS/CAMA, the endpoint returns `null` with a provenance flag so the UI can render "—" with an explanatory tooltip.
4. **Workflow-first UX.** Eight tabs are not equal. Triage (morning priority view) and Calibration Workbench (fix surface) are the primary. Audit (drill-down) and Data Quality (foundation check) are secondary. Parcel, Depreciation, Schedule, Calc Trace are lookup utilities.
5. **Swarm-parallel build.** Six independent tracks in isolated worktrees; dispatched by the orchestrator (me) using subagent-driven-development; QA at each ship boundary.
6. **TypeScript strict, 0 errors, 0 raw fetch.** All frontend API calls go through `apiFetch` or `apiFetchJson`. All hooks use `AbortController`.

---

## 3. Scope Decomposition (Six Tracks)

### Track 1 — Equity Metric Service (Backend foundation)
**Sub-project:** A

**Files to create:**
- `backend/src/TerraFusion.AI/Valuation/EquityMetricService.cs`
- `backend/src/TerraFusion.Core/Interfaces/IEquityMetricService.cs`
- `backend/src/TerraFusion.Core/DTOs/EquityMetricsDto.cs`
- `backend/src/TerraFusion.API/Controllers/EquityController.cs`
- `backend/tests/TerraFusion.API.Tests/Controllers/EquityControllerTests.cs`

**Responsibilities:**
- Compute all IAAO metrics from a `SaleRatio[]` collection:
  - `medianRatio`
  - `weightedMeanRatio` (sum of assessedValues / sum of salePrices)
  - `arithmeticMeanRatio`
  - `cod` (Coefficient of Dispersion, IAAO formula)
  - `prd` (Price-Related Differential = mean / weighted mean)
  - `prb` (Price-Related Bias, regression of ln(ratio) on ln(value/median))
- Compute Benton custom metrics from the same collection:
  - `decileMedianRatios` — array of 10 medians, one per sale-price decile
  - `stratifiedCod` — COD within each segment of a chosen stratum
- Surface via single endpoint: `GET /api/equity/metrics?by={stratum}&segment={code}&taxYear={year}`
  - `by=none` returns county-wide single bucket
  - `by=neighborhood` returns dict keyed by hoodCd
  - `by=city` returns dict keyed by city name
  - etc.

**Depends on:** Nothing. First in the dispatch wave.

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
- Parcel→city mapping table for the six Benton cities + unincorp:
  - Kennewick, Richland, Pasco, Prosser, Benton City, West Richland, Unincorporated
  - Derived from PACS `situs_city` or `tax_area_id` mapping
- Property-type strata from PACS `property_use_cd`:
  - R (Residential SFR), M (Manufactured Home), C (Commercial), A (Agricultural), V (Vacant), X (Exempt)
- Vintage decade buckets: `1900s`, `1910s`, ..., `2020s`
- Endpoint: `GET /api/equity/rollup?by={city|type|vintage|grade}&taxYear={year}`
- Returns `{ strata: [{ key, name, saleCount, metrics: EquityMetrics, iaaoCompliant }] }`
- Integration: Triage tab sidebar adds "City Rollup" and "Type Rollup" accordions

**Depends on:** Track 1 (needs `EquityMetricService` to compute per-stratum metrics).

---

### Track 3 — Benton Custom Metrics (Backend compute + Frontend surface)
**Sub-project:** C

**The five custom metrics beyond IAAO:**
1. **Decile equity analysis** — sort sales by price into 10 equal-count buckets, compute median ratio per decile. Flags regressive pattern (low-value overassessed, high-value underassessed — D1 median > D10 median) vs. progressive pattern (reverse) at decile granularity that PRD/PRB miss.
2. **Stratified COD** — COD computed within each vintage decade, condition class, and grade; surfaces "1970s homes have 22% COD while overall county is 14%" type patterns.
3. **WAC condition bias** — median ratio per Benton WAC condition code (A/B/C/D/E or 1-5 scale depending on PACS schema), detects "poor condition parcels systematically overassessed" type failures.
4. **ImprvDetTypeCd drift** — median ratio for parcels bearing specific secondary feature codes (POLEBLDG, BSMT, POOL, CovPatio, ATTGAR, DETGAR, MA). Compared to parcels without. Detects "pole barns are overvaluing ag properties" type issues.
5. **Quality-grade drift** — median ratio per quality grade 1–9 (or Low/Fair/Average/Good/Excellent depending on PACS). Detects systematic mis-calibration of a specific grade tier.

**Files to create:**
- `backend/src/TerraFusion.AI/Valuation/BentonCustomMetricService.cs`
- Extend `EquityController` with routes:
  - `GET /api/equity/deciles?by={stratum}&segment={code}&taxYear={year}`
  - `GET /api/equity/stratified-cod?by={stratum}&segment={code}&splitBy={vintage|condition|grade}&taxYear={year}`
  - `GET /api/equity/condition-bias?by={stratum}&segment={code}&taxYear={year}`
  - `GET /api/equity/improvtype-drift?by={stratum}&segment={code}&taxYear={year}`
  - `GET /api/equity/grade-drift?by={stratum}&segment={code}&taxYear={year}`
- Frontend new panel: `frontend/apps/os-shell/src/pages/forge/cost/panels/BentonDiagnosticsPanel.tsx`
- Integrate into NeighborhoodAuditTab (new "Benton Diagnostics" collapsible section)
- Integrate into TriageTab (decile indicator icon column)

**Depends on:** Track 1 (needs `EquityMetricService` foundation).

---

### Track 4 — Data Quality Engine (Backend compute + Frontend surface)
**Sub-project:** D

**Files:**
- `backend/src/TerraFusion.AI/DataQuality/DataQualityService.cs` (new or extend existing)
- `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` (full impl of `/costforge/analytics/data-quality/assess`)
- Extend `frontend/apps/os-shell/src/pages/forge/cost/tabs/DataQualityTab.tsx` with issue drill-in
- New: `frontend/apps/os-shell/src/pages/forge/cost/tabs/NeighborhoodAuditTab.tsx` — add IQR outlier column with visual flag

**The 8 real checks:**
1. Missing WAC codes — parcels with improvements but null/empty `condition_cd` or `grade_cd`
2. Stale effective age — parcels where `effective_age_updated_at` > 24 months ago AND property has undergone improvements since
3. ImprvDetTypeCd gaps — parcels with improvements but no `imprv_det_type_cd` populated
4. Missing sale pairs — parcels in qualified neighborhoods with no qualifying sales in the last 4 years (blocks ratio studies)
5. IQR ratio outliers — parcels with ratio > Q3 + 1.5×IQR or < Q1 − 1.5×IQR within their neighborhood
6. Quality/grade cross-field mismatches — e.g., `condition_cd` = 'E' (poor) but `grade_cd` = 9 (excellent quality)
7. Year-built vs effective-age inconsistency — `actual_year_built > current_year` OR `effective_age > actual_age + 20`
8. GLA / lot-size conflicts — `living_area_sqft` > `land_sqft` (impossible)

Each check returns `{category, field, affectedCount, description, severity, parcelSample[]}` so appraiser can drill in.

**IQR outlier UI:** NeighborhoodAuditTab parcel rows gain a flag badge when parcel's ratio is outside Q1−1.5×IQR..Q3+1.5×IQR for that hood.

**Depends on:** Nothing. Parallel wave 1 alongside T1, T6.

---

### Track 5 — Calibration v2 (Backend + Frontend polish)
**Sub-project:** E

**Files:**
- `backend/src/TerraFusion.AI/Valuation/CalibrationService.cs` (extend)
- `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` (extend calibration endpoints)
- `frontend/apps/os-shell/src/pages/forge/cost/tabs/CalibrationWorkbenchTab.tsx` (extend)
- `frontend/apps/os-shell/src/pages/forge/cost/CostApproachRunner.tsx` (add WAC condition→effective-age)
- `frontend/apps/os-shell/src/pages/forge/cost/DepreciationCalculator.tsx` (condition picker)

**Responsibilities:**
- **Effective-age derivation:** Backend endpoint `POST /api/costforge/effective-age` — takes actualAge, conditionCode, functionalObsAmount, externalObsAmount — returns derived effectiveAge based on Benton's adjustment table (condition A: −3 yrs, B: 0, C: +2, D: +5, E: +8).
- **Segment-specific mass adjust:** New param `segmentSplit: {dimension: "vintage_decade" | "property_type" | "condition", segments: [{code, adjustmentPct}]}`. Instead of flat % for hood, apply different % per decade within hood.
- **Full-metric preview:** Preview endpoint returns before/after for: medianRatio, weightedMean, COD, PRD, PRB, decileMedianRatios[10]. UI renders side-by-side sparkline per metric.
- **Post-commit verification snapshot:** After commit, auto-invoke `GET /api/equity/metrics?by=neighborhood&segment={hoodCd}` and display "Verified: median moved 0.92 → 0.998, COD 19.3 → 14.1" as success panel.

**Depends on:** Track 1 (equity metrics), Track 2 (rollups for cross-stratum verify).

---

### Track 6 — Secondary Feature %-of-BIV Wiring (Backend + Frontend end-to-end)
**Sub-project:** F

**Files:**
- `backend/src/TerraFusion.Core/Entities/CostSchedule.cs` (extend with `secondaryFeatures: Dict<code, pctOfBiv>`)
- `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` (extend `/costforge/schedule` response)
- `backend/src/TerraFusion.AI/Valuation/CostApproachCalculator.cs` (ensure RCN calc uses schedule rates)
- `frontend/apps/os-shell/src/pages/forge/cost/CostApproachRunner.tsx` (BIV section renders real %-of-BIV values)
- `frontend/apps/os-shell/src/pages/forge/cost/CostManual.tsx` (add secondary-features table/section)

**The real Benton rates from PACS ImprvDetTypeCd counts** (per memory `project_pacs_imprv_type_codes.md`):
- `CovPatio` (covered patio) — 3% of BIV
- `BSMT` (basement) — 13% of BIV
- `POLEBLDG` (pole building) — 18% of BIV
- `ATTGAR` (attached garage) — ~12% of BIV
- `DETGAR` (detached garage) — ~8% of BIV
- `POOL` (pool) — varies by size; starter rate 5% of BIV
- `MA` (main area) — 100% of BIV (this is the base, not a feature)

End-to-end path:
1. Schedule returns these rates per building class/grade
2. Cost Manual tab shows secondary-feature rate table
3. Parcel Inspector BIV section displays: `MA 2,400sf × $135/sf = BIV $324,000`, then each feature with its %-of-BIV and $ value
4. RCNLD calc on backend: `RCN = BIV + Σ(feature_pctOfBiv × BIV) + refinements`

**Depends on:** Nothing. Parallel wave 1 alongside T1, T4.

---

## 4. Dispatch Strategy

### Wave 1 (parallel, day 0):
- **T1** — EquityMetricService (backend) — blocks 2, 3, 5
- **T4** — Data Quality Engine (backend + frontend) — independent
- **T6** — Secondary Feature %-of-BIV (backend + frontend) — independent

### Wave 2 (parallel, after T1 ships):
- **T2** — Geographic + Stratum Rollups
- **T3** — Benton Custom Metrics

### Wave 3 (after T1 + T2 ship):
- **T5** — Calibration v2

### Orchestration
- Each track runs in an isolated git worktree: `trees/cf-v2-t{1..6}-{shortname}`
- Orchestrator (me) dispatches subagents per task in a track using subagent-driven-development pattern: implementer → spec reviewer → code quality reviewer
- Each track ships to integration branch `integration/costforge-v2`
- Orchestrator runs cross-track QA at integration; merges to main only after all 6 tracks green

---

## 5. QA Gates (orchestrator-run)

### Per-task gate
- Subagent-driven: implementer completes, spec reviewer confirms compliance, code quality reviewer approves
- TypeScript: 0 errors on changed files
- Tests: if backend, xUnit tests added; if frontend, contract tests added where relevant

### Per-track ship gate
- Integration test against live Benton CAMA data (75,907 records)
- Screenshot capture of every affected UI surface (before/after)
- No raw `fetch`, no double `/api` prefix, all calls via `apiFetch`/`apiFetchJson`
- All async hooks use `AbortController`

### Cross-track gate (at integration branch)
- Metric numerical consistency: PRD reported in TriageTab for neighborhood X === PRD reported by `/api/equity/metrics?by=neighborhood&segment=X`
- Decile arrays match across Triage drill-in summary vs. NeighborhoodAuditTab detail view
- City rollup totals = sum of neighborhood totals within that city
- No regression in existing ForgeSuiteHome contract tests (21 tests must still pass)

### Final release gate
- Full 8-tab screenshot suite captured
- TypeScript 0 errors
- All data-quality checks surface ≥1 real issue from live Benton data (or 0 legitimately)
- Benton cost schedule fully populated with secondary feature rates
- Calibration v2 demo: pick worst hood from Triage → open Audit → identify vintage decade driver → open Calibration → apply segment-specific adjust → commit → verify metrics moved

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
  iaaoCompliant: boolean;       // true iff median in [0.9, 1.1] AND cod ≤ 15 AND prd in [0.98, 1.03] AND |prb| ≤ 0.05
  bentonCompliant: boolean;     // IAAO-compliant AND max |decile median - overall median| ≤ 0.10
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

- Consciousness service (port 3004) integration with CostForge — deferred to next phase
- Multi-county support beyond Benton — Sovereign County model means Benton-first, others post-v2
- Harris PACS real-time sync — current sync stub remains; v2 uses the existing seeded CAMA data (75,907 records)
- Quantum / gauge-theory / 3-6-9 codex integration — no dependencies from CostForge v2
- AI swarm (1,008 agent) coordination — CostForge v2 is deterministic compute; no swarm dependency
- Mobile / tablet UI — desktop-only for v2
- Income Approach integration — separate IncomeForge module
- Sales Comparison integration — separate SalesForge module

---

## 8. Success Criteria Checklist

- [ ] `EquityMetricService` computes median, weighted mean, COD, PRD, PRB, deciles from live CAMA data in < 2 seconds per stratum
- [ ] `/api/equity/metrics` endpoint returns real values for all 6 Benton cities, all property-type strata, all vintage decades
- [ ] TriageTab priority ranking includes PRB weighting; PRB column shows real values
- [ ] NeighborhoodAuditTab shows decile breakdown + IQR outlier flags
- [ ] Data Quality tab surfaces real counts for all 8 checks
- [ ] CalibrationWorkbenchTab preview shows before/after for every equity metric (not just median/COD)
- [ ] Parcel Inspector BIV section shows real %-of-BIV for every ImprvDetTypeCd the parcel has
- [ ] Cost Manual has secondary-features rate table
- [ ] Effective-age derivation works: enter actualAge=30 + condition=C → get effectiveAge=32
- [ ] Full 8-tab screenshot suite captured, all data live
- [ ] TypeScript 0 errors, 0 raw fetch, all AbortController
- [ ] ForgeSuiteHome 21 contract tests still pass
- [ ] 0 "Marshall & Swift" references anywhere in active code

---

## 9. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Parallel worktrees create merge conflicts on CostForgeController.cs | High | T4, T5, T6 all touch this file. Serialize controller edits — merge order: T1 first, T4 second, T5 third, T6 last. Orchestrator resolves. |
| Equity metrics differ numerically from existing neighborhood-matrix endpoint | Medium | T1 replaces existing metric computation. Contract test: existing `neighborhood-matrix` must delegate to `EquityMetricService` and numerical values unchanged for existing hoods. |
| PACS schema mismatch on WAC condition codes | Medium | T4 validates against real PACS data first; if schema differs from A/B/C/D/E scale, adapt or document. |
| PRB regression needs enough sales per stratum (min n=10) | Medium | Mark strata with < 10 sales as `provenance: 'insufficient-sales'`, display "—" in UI with tooltip. |
| Decile buckets unstable for small sale samples | Medium | Require saleCount ≥ 30 for decile analysis; below that, report "insufficient data for decile analysis." |
| Secondary feature rates vary by reval cycle | Low | Schedule endpoint filters by `revalArea` (already supported in existing response). |

---

## 10. Glossary (for consistency across tracks)

- **BIV** — Base Indicated Value. `GLA × $/sqft` of the main area. Foundation of Benton Method.
- **RCN** — Replacement Cost New. `BIV + Σ(secondary feature values) + refinements`.
- **RCNLD** — Replacement Cost New Less Depreciation. `RCN × (% good / 100)`.
- **%-of-BIV** — Secondary features priced as a percentage of BIV (CovPatio 3%, BSMT 13%, POLEBLDG 18%, etc).
- **COD** — Coefficient of Dispersion. Measures uniformity of assessment; IAAO target ≤ 15%.
- **PRD** — Price-Related Differential. `mean ratio / weighted mean ratio`. IAAO target 0.98–1.03.
- **PRB** — Price-Related Bias. Regression slope of `ln(ratio)` on `ln(value / median_value)`. IAAO target |PRB| ≤ 0.05.
- **Decile Equity** — Benton custom metric. Sort sales by price into 10 equal-count buckets; compute median ratio per decile.
- **Stratified COD** — COD computed within each segment of a stratum (e.g., COD for 1970s homes separately from 2000s homes).
- **WAC** — Washington Administrative Code. Governs condition codes, grade codes, depreciation schedules for WA state assessors.
- **ImprvDetTypeCd** — PACS improvement-detail-type code. Identifies secondary features: CovPatio, BSMT, POLEBLDG, ATTGAR, DETGAR, MA, POOL, etc.
- **Stratum** — An analytical dimension for cutting the portfolio: `neighborhood`, `city`, `type`, `vintage`, `condition`, `grade`.
- **Segment** — A specific value within a stratum: e.g., `segment="KENNEWICK"` within `stratum="city"`.

---

**End of spec.**

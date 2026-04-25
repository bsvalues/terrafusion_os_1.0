# Statistics Studio & CostForge — PhD-Level Mass Appraisal Analytics
## Design Specification v1.0 — 2026-04-15

**Scope:** Four-phase upgrade of Statistics Studio and CostForgeDashboard to meet IAAO Standards 5 & 6, Washington State DOR stratified study requirements, and credentialed mass appraisal professional expectations.

**Audience:** Benton County WA assessor staff — senior appraisers, sales auditors, assessment supervisors.

**Principle:** Every number on screen is either live from PACS data or explicitly labeled as a fallback. No silent hardcodes. No aspirational displays. If the data isn't there, say so.

---

## Problem Statement

Current Statistics Studio and CostForgeDashboard fail the PhD practitioner on four dimensions:

1. **Credibility errors** — PRB displays as 0 (hardcoded), Physical Depreciation shows 100% (data integrity gap), $148/sqft is a hardcoded stub, SCHEDULE_STATUS labels "Residential/Commercial" as if they were quality classes when they are property use types.

2. **Missing stratification** — IAAO Standard 5 and DOR require COD/PRD/PRB reported by strata (Property Type × Quality Class). A single county-wide median hides equity problems. A supervisor cannot sign off on a study that doesn't show stratum-level compliance.

3. **No value driver attribution** — Assessors cannot calibrate cost schedules without knowing which physical features (basement, garage, pool, outbuilding) are driving ratio deviation. The current Calibration Matrix tab has no feature-level breakdown.

4. **No inferential statistics** — Ratios are reported as point estimates with no confidence intervals, no variance decomposition, no temporal trending, no spatial autocorrelation, no influence diagnostics. Any challenge to an assessment can attack the study on these grounds.

---

## Phase A — Credibility Fixes (Ship First)

These are blockers. They must land before any new analytical work.

### A1 — PRB Fix (Statistics Studio)

**Problem:** `StatisticsStudio.tsx` line ~115 hardcodes `prb: 0, tierSlope: 0` in `liveVeiMetrics`. The VEI Dashboard and any PRB-consuming component displays 0 regardless of backend data.

**Fix:**
- Remove the hardcoded stub from `liveVeiMetrics`.
- Wire `prb` and `tierSlope` from the live ratio-study API response (`/api/terraforge/ratio-study?taxYear=2026`).
- Backend must return `prb` (Price-Related Bias coefficient from weighted regression of ratio on ½(SP+AV)) and `tierSlope` (regression coefficient of ln(ratio) on ln(value) — the PRB slope).
- IAAO Standard 5 PRB compliance range: –0.05 to +0.05.
- Display format: four decimal places (e.g., `–0.0142`), not rounded to integer.

**Backend PRB formula:**
```
PRB = Σ[wᵢ(Rᵢ - R̄)(Vᵢ - V̄)] / Σ[wᵢ(Vᵢ - V̄)²]
where Vᵢ = ½(SalePriceᵢ + AssessedValueᵢ), wᵢ = 1/Rᵢ
```

### A2 — Physical Depreciation 100% Flag (CostForgeDashboard)

**Problem:** `PhysicalDepreciationPct` in PACS `CamaCharacteristics` appears to store values on a 0-100 scale, but the county-wide average returns 100.0% — indicating a seeding or interpretation error, not that every building is fully depreciated.

**Fix (two-part):**
- Backend: Add a data integrity check in `/api/costforge/dashboard-stats`. If `AvgPhysicalDepreciationPct > 95`, return a `dataIntegrityWarning: "PhysicalDepreciationPct may be mis-scaled or uninitialized in PACS source"` field alongside the stat.
- Frontend: When `dataIntegrityWarning` is present, render the Physical Dep KPI with an amber warning indicator and a tooltip: "Data integrity flag — verify PACS PhysicalDepreciationPct column scale before relying on this figure."
- Do NOT suppress the value — show it with the flag. Assessors need to see the raw number to diagnose the source issue.

### A3 — Replace $148/sqft Hardcode (CostForgeDashboard)

**Problem:** KPI card "Avg Res. Cost/sqft" shows $148 unconditionally — this is a stub value from development, never connected to PACS data.

**Fix:**
- Backend: Add `avgResCostPerSqft` to the `/api/costforge/dashboard-stats` response. Compute as:
  ```sql
  SELECT AVG(ImprovementValue / NullIf(GrossLivingArea, 0))
  FROM Properties p
  JOIN CamaCharacteristics cc ON cc.ParcelNumber = p.ParcelNumber
  WHERE p.PropertyType = 'Residential'
    AND cc.GrossLivingArea > 200
    AND p.ImprovementValue > 0
  ```
- Frontend: Render from `stats.avgResCostPerSqft` with `$` formatting. Fall back to `—` (not `$148`) when null.
- Add `source` field: if `stats.source === 'live'`, show "(Live)" label; if fixture/snapshot, show "(Estimate)".

### A4 — SCHEDULE_STATUS Label Correction (CostForgeDashboard)

**Problem:** The Cost Schedule Status table uses row labels "Residential", "Commercial", "Industrial", "Agricultural", "Multi-Family" — these are **Property Types** (use categories), not **Quality Classes** (A/B/C/D improvement grades). Mislabeling these as "cost schedules" confuses the meaning.

**Fix:**
- Rename the card title from "Cost Schedule Status" to "Cost Schedule Coverage by Property Type".
- Add a header note: "Schedules are organized by use category. Quality class (A–D) differentials are applied within each type via the depreciation matrix."
- Long term (Phase B): replace `SCHEDULE_STATUS` static array with a live query from the cost matrix tables.

---

## Phase B — Stratified Ratio Study Tab

**New 8th tab in Statistics Studio:** "Stratified Study"

This is the core DOR submission surface. Washington DOR requires strata-level reporting. IAAO Standard 5 Section 9 requires minimum 5 sales per stratum for COD/PRD/PRB to be reported; strata with fewer sales are shown with sample count and "Insufficient sample" instead of statistics.

### B1 — Tab Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Stratified Ratio Study — 2026 Tax Year          [Export DOR CSV]│
├──────────────────────────────────────────────────────────────────┤
│  Filter: [Property Type ▾] [Quality Class ▾] [Min Sales: 5]     │
│                                                                  │
│  Stratum           N    Median  COD    PRD    PRB    IAAO Status │
│  ────────────────────────────────────────────────────────────── │
│  Residential · A  412   0.961  10.2   1.002  –0.012  ✓ ✓ ✓ ✓  │
│  Residential · B  891   0.974   9.8   1.004  –0.008  ✓ ✓ ✓ ✓  │
│  Residential · C  203   0.988  14.7   1.011  –0.021  ✓ ✓ ✓ ✓  │
│  Residential · D   31   1.012  22.1   1.019  +0.004  ✓ ✗ ✓ ✓  │
│  Commercial · A    18   0.943  18.4   1.024  –0.031  ✗ ✓ ✓ ✓  │
│  Commercial · B     3   —      —      —      —       Insuff.   │
│  ...                                                             │
├──────────────────────────────────────────────────────────────────┤
│  Summary: 12 strata with ≥5 sales · 3 strata insufficient        │
│  County aggregate: Median 0.974 · COD 11.2 · PRD 1.003 · PRB –0.018│
└──────────────────────────────────────────────────────────────────┘
```

### B2 — IAAO Status Column Logic

Each stratum's IAAO Status shows four compliance dots (Median / COD / PRD / PRB):

| Metric   | Pass Range                           | Source                    |
|----------|--------------------------------------|---------------------------|
| Median   | 0.90 – 1.10                          | IAAO Standard 5 §4        |
| COD      | ≤15.0 (residential), ≤20.0 (income) | IAAO Standard 5 §5.1      |
| PRD      | 0.98 – 1.03                          | IAAO Standard 5 §6.2      |
| PRB      | –0.05 to +0.05                       | IAAO Standard 5 §6.3      |

Color coding: green checkmark (pass), red X (fail), gray dash (insufficient N).

### B3 — Click-Through to SalesForge

Clicking any stratum row navigates to SalesForge with that stratum pre-filtered (`propertyType=Residential&qualityClass=B`). This creates a direct audit path: supervisor sees COD=22 → clicks → reviews every sale in that stratum.

### B4 — DOR Export

"Export DOR CSV" button generates a CSV matching Washington State DOR stratified ratio study format:
- Columns: StratumCode, PropertyType, QualityClass, SaleCount, MedianRatio, COD, PRD, PRB, IAOAMedianPass, IAAOCodPass, IAOAPrdPass, IAOAPrbPass, TaxYear
- Filename: `BentonCounty_DOR_StratifiedStudy_2026.csv`
- Client-side CSV generation (blob download) — no backend needed for the export itself.

### B5 — Backend Endpoint: `GET /api/terraforge/ratio-study/stratified`

**Query params:** `taxYear` (required), `minSales` (default 5), `propertyType?`, `qualityClass?`

**Query logic:**
```sql
SELECT
    cs.PropertyType,
    cc.QualityClass,
    COUNT(*) AS SaleCount,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ratio) AS MedianRatio,
    -- COD: median absolute deviation / median * 100
    -- PRD: mean ratio / (sum(ratio*value) / sum(value))
    -- PRB: weighted regression coefficient
FROM ComparableSales cs
JOIN Properties p ON cs.ParcelId = p.ParcelNumber
LEFT JOIN CamaCharacteristics cc ON cc.ParcelNumber = p.ParcelNumber
WHERE cs.TaxYear = @taxYear
  AND cs.QualificationDecision = 'qualified'
  AND (cs.AssessedValue / NULLIF(cs.AdjustedSalePrice, cs.SalePrice)) IS NOT NULL
GROUP BY cs.PropertyType, cc.QualityClass
```

**Response DTO:**
```csharp
public record StratifiedStratumDto(
    string PropertyType,
    string? QualityClass,
    int SaleCount,
    decimal? MedianRatio,
    decimal? Cod,
    decimal? Prd,
    decimal? Prb,
    bool IaaoMedianPass,
    bool IaaoCodPass,
    bool IaaoPrdPass,
    bool IaaoPrbPass,
    bool InsufficientSample
);
```

---

## Phase C — Value Driver Attribution Panel

**Location:** New panel inside the existing "Calibration Matrix" tab in Statistics Studio.

### C1 — Purpose

A senior appraiser calibrating the cost schedule needs to know which physical improvement features are pulling ratios up or down county-wide. If parcels with basements have a median ratio of 1.08 while the county median is 0.974, the basement schedule is undervalued and needs a positive adjustment. This panel makes those signals explicit.

### C2 — Panel Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Value Driver Attribution — Ratio Deviation by Feature  2026    │
│  County median ratio: 0.974                                      │
├──────────────────────────────────────────────────────────────────┤
│  Feature           N (sales)  Median Ratio  Deviation  Signal   │
│  ──────────────────────────────────────────────────────────────  │
│  Basement (BSMT)   1,847      1.082         +0.108     ↑ Under  │
│  Pool (POOL)         312      0.921         –0.053     ↓ Over   │
│  Att. Garage       4,201      0.968         –0.006       OK     │
│  Cov. Patio (Cov…)   872      1.041         +0.067     ↑ Under  │
│  Pole Building       389      0.884         –0.090     ↓ Over   │
│  Det. Garage         814      1.014         +0.040       OK     │
│  Manufactured (MA)   203      0.941         –0.033       OK     │
├──────────────────────────────────────────────────────────────────┤
│  Signal: ↑ Under = feature likely under-scheduled (raise adj)   │
│          ↓ Over  = feature likely over-scheduled (lower adj)    │
│  Threshold: |deviation| > 0.04 triggers signal                  │
└──────────────────────────────────────────────────────────────────┘
```

### C3 — Signal Logic

- "Under" signal (↑): median ratio for feature-present parcels > county median + 0.04 → cost schedule for this feature is below market, assessment trails market value.
- "Over" signal (↓): median ratio < county median – 0.04 → cost schedule for this feature is above market.
- "OK": deviation within ±0.04.
- Threshold is user-configurable via a `Threshold` input (default 0.04, range 0.01–0.15).

### C4 — Backend Endpoint: `GET /api/terraforge/ratio-study/driver-analysis`

**Query params:** `taxYear`, `propertyType?` (optional filter)

**Query logic:**
For each feature type in `[BSMT, POOL, ATTGAR, CovPatio, POLEBLDG, DETGAR, MA]`:
```sql
SELECT
    @featureType AS FeatureType,
    COUNT(DISTINCT cs.ParcelId) AS SaleCount,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ratio) AS MedianRatio
FROM ComparableSales cs
JOIN Properties p ON cs.ParcelId = p.ParcelNumber
JOIN ImprovementDetails id ON id.ParcelNumber = p.ParcelNumber
  AND id.ImprvDetTypeCd = @featureType
WHERE cs.TaxYear = @taxYear
  AND cs.QualificationDecision = 'qualified'
GROUP BY @featureType
```

**Response DTO:**
```csharp
public record DriverAttributionDto(
    string FeatureCode,
    string FeatureLabel,
    int SaleCount,
    decimal? MedianRatio,
    decimal? DeviationFromCountyMedian,
    string Signal  // "under" | "over" | "ok" | "insufficient"
);
```

Return list of all configured features, even those with SaleCount < 5 (shown as "insufficient" with N displayed).

---

## Phase D — Deep Analysis Layer

Gated behind a **"Show Advanced Analysis"** toggle (prominent button, not buried in settings). Default: off. When enabled, three new tabs appear: **Diagnostics**, **Spatial & Temporal**, **Calibration Engine**.

These tabs are for credentialed staff — senior appraisers, assessment supervisors, methodology reviewers — not daily use surfaces.

---

### D1 — Confidence Intervals (P0)

**Surface:** Statistics Rail (all tabs), Stratified Study table columns.

**P0 priority** — bootstrapped CIs are the minimum credibility requirement for any published ratio study.

**Method:** Non-parametric bootstrap (1,000 resamples) for Median, COD, PRD, PRB at both county and stratum level.

**Display:**
- Median: `0.974 [0.961 – 0.987]` (95% CI)
- COD: `11.2 [9.8 – 12.6]`
- PRD: `1.003 [0.999 – 1.007]`
- PRB: `–0.018 [–0.031 – –0.005]`

**Backend implementation:**
- `GET /api/terraforge/ratio-study/confidence-intervals?taxYear=2026&stratumId=res-B`
- C# bootstrap loop: sample with replacement, compute statistic, sort, take 2.5th and 97.5th percentiles.
- Cache result (10 minutes) — 1,000 resamples on 4,000+ sales is ~200ms, acceptable.
- Also offer closed-form approximations as a faster fallback: COD CI via chi-squared distribution, PRD CI via F-distribution (Gloudemans 2011).

---

### D2 — Vertical Equity by Value Decile (P0)

**Surface:** "Diagnostics" tab — first panel.

**P0 priority** — vertical inequity (regressive/progressive assessment) is the primary legal challenge vector. Must be visible to assessment staff at all times.

**Method:** Sort all qualified sales by sale price. Divide into 10 equal deciles. For each decile compute: N, Median Ratio, COD, deviation from county median.

**Display:** Horizontal bar chart — x-axis is deviation from county median (-20% to +20%), y-axis is decile (D1=lowest value to D10=highest). Each bar colored: green if within ±4%, amber if ±4–8%, red if >±8%.

**IAAO interpretation panel** adjacent to chart:
- "Regressive" pattern: high-value properties (D8-D10) below median ratio → wealthy properties under-assessed relative to low-value.
- "Progressive" pattern: reverse.
- PRB shown as summary coefficient alongside chart.

**Backend endpoint:** `GET /api/terraforge/ratio-study/vertical-equity?taxYear=2026`

Returns array of 10 objects: `{ decile, minSalePrice, maxSalePrice, saleCount, medianRatio, cod, deviationFromCountyMedian }`.

---

### D3 — Influence Diagnostics — Cook's Distance (P1)

**Surface:** "Diagnostics" tab — second panel.

**P1 priority** — Cook's D identifies sales that disproportionately pull ratio statistics. Removing a single high-Cook's-D sale should never flip a stratum from passing to failing (or vice versa).

**Method:** OLS regression of `ratio ~ 1` (intercept only). Cook's D for observation i:
```
Dᵢ = (ê'ᵢ eᵢ) / (p * MSE)  ≈  (Rᵢ - R̄)² / (p * s²)
```

Display: scatter plot of Cook's D vs sale price. Threshold line at `4/N`. Any sale above threshold flagged as "Influential — verify sale circumstances."

Click on a flagged point → opens SalesForge detail panel for that sale.

**Backend endpoint:** `GET /api/terraforge/ratio-study/influence-diagnostics?taxYear=2026&stratumId?`

Returns: `{ saleId, parcelId, address, salePrice, ratio, cookD, threshold, isInfluential }[]`

---

### D4 — Sale-Date Trending — Repeat Sales Index (P1)

**Surface:** "Spatial & Temporal" tab — first panel.

**P1 priority** — assessment lien date is January 1. Sales occurring through the study period must be time-adjusted to the lien date. Without a validated time-trend, all ratios are biased toward the market conditions at the sale date.

**Method:** Modified Case-Shiller repeat-sales methodology:
1. Identify parcels with 2+ sales in rolling 48-month window.
2. Regress `ln(P₂/P₁) ~ Σ Dₜ * βₜ` where Dₜ are month dummy variables.
3. Exponentiate coefficients → monthly price index relative to January 1 lien date.
4. All ratios in the study are adjusted by the applicable monthly index factor before COD/PRD/PRB computation.

**Display:** Line chart — x-axis: month (Jan 2024 – Jan 2026), y-axis: index value (1.00 = lien date). Bands for 95% CI. Overlay: sale count per month as bar chart.

**Indicator:** "Time adjustment applied: +N% for sales in [month range]" badge in the Statistics Rail when time-adjustments are active.

**Backend endpoint:** `GET /api/terraforge/ratio-study/time-trend?taxYear=2026&propertyType?`

---

### D5 — Spatial Autocorrelation — Moran's I (P1)

**Surface:** "Spatial & Temporal" tab — second panel.

**P1 priority** — if ratio residuals cluster geographically (positive Moran's I), there is a systematic neighborhood effect not captured in the cost schedule. This is both a legal vulnerability and a calibration signal.

**Method:**
1. Join qualified sales to parcel centroid coordinates (from GIS or PACS lat/lon fields).
2. Build spatial weight matrix W using k-nearest neighbors (k=8) or inverse distance.
3. Compute: `I = (N/S₀) * (z'Wz / z'z)` where z = ratio residuals.
4. Permutation test (999 permutations) for significance.

**Display:**
- Moran's I statistic: `I = 0.34 (p < 0.001)` — significant spatial autocorrelation detected.
- Map (static choropleth or quartile map using parcel centroids): color-coded ratio quartiles.
- Interpretation: "Positive Moran's I indicates that similar ratios cluster together. Consider neighborhood-level adjustments or geographically weighted regression."

**Backend endpoint:** `GET /api/terraforge/ratio-study/spatial-autocorrelation?taxYear=2026`

Note: Requires parcel centroid data. If lat/lon not in current PACS seeding, compute from ArcGIS parcel layer or approximate from address geocoding.

---

### D6 — Hedonic Regression vs Cost Schedule (P1)

**Surface:** "Calibration Engine" tab.

**P1 priority** — hedonic OLS regression provides an independent market-derived estimate of feature values. Comparing hedonic coefficients to cost schedule adjustment amounts reveals where the schedule diverges from current market.

**Method:**
```
ln(SalePrice) = β₀ + β₁*GLA + β₂*YearBuilt + β₃*BSMT_sqft + β₄*POOL + β₅*ATTGAR + ... + ε
```

Where YearBuilt is transformed as `Age = 2026 - YearBuilt` (or `AgeSquared` for non-linear depreciation curve).

**Display:** Coefficient table:
| Feature | Hedonic β | Implied $ | Cost Schedule $ | Gap | Signal |
|---------|-----------|-----------|-----------------|-----|--------|
| GLA (per sqft) | 0.00212 | $148/sqft | $148 | $0 | OK |
| Basement (per sqft) | 0.00089 | $62/sqft | $45/sqft | +$17 | Schedule low |
| Pool | 0.031 | $14,200 | $18,000 | –$3,800 | Schedule high |

**Backend:** ML.NET OLS regression on `ComparableSales` + `CamaCharacteristics` join. Expose coefficients via `GET /api/terraforge/ratio-study/hedonic-regression?taxYear=2026&propertyType=Residential`.

---

### D7 — Variance Decomposition (P2)

**Surface:** "Diagnostics" tab — third panel.

**P2 priority** — decomposes COD into between-neighborhood and within-neighborhood components. If 80% of variance is between-neighborhood, the problem is neighborhood-level schedule calibration. If within-neighborhood, the problem is parcel-level characteristic errors.

**Method:** One-way ANOVA / hierarchical mixed-effects model:
```
Rᵢⱼ = μ + αⱼ + εᵢⱼ
where αⱼ ~ N(0, σ²_between), εᵢⱼ ~ N(0, σ²_within)
```

ICC (Intraclass Correlation Coefficient) = σ²_between / (σ²_between + σ²_within)

High ICC → most variation is between neighborhoods → calibrate neighborhood multipliers.
Low ICC → variation is within neighborhoods → look at parcel-level data quality.

**Display:** Donut chart: "Between-neighborhood: 62% / Within-neighborhood: 38%". ICC value. Recommendation text derived from thresholds.

---

### D8 — Sale Chasing Detection — ΔR² Test (P2)

**Surface:** "Diagnostics" tab — fourth panel.

**P2 priority** — sale chasing is the practice of selectively adjusting assessed values toward sale prices after the sale, inflating the apparent study quality. The ΔR² test detects this.

**Method:**
- Model 1: Regress AV on characteristics (GLA, Age, quality, etc.) for non-sale parcels only → R² baseline.
- Model 2: Same model with sale parcels included → R² inflated if chasing.
- ΔR² = R²₂ – R²₁. Any ΔR² > 0.05 is suspicious; > 0.10 is strong evidence of sale chasing.

**Display:** Before/after R² comparison table. Traffic light indicator. If flagged: "ΔR² = 0.082 — elevated. Review whether recent sales triggered selective reappraisals."

**Note:** This test requires assessed values from the working roll (SupNum=0), not finalized roll. Already available via existing PACS seeding.

---

### D9 — Cross-Validation — Hold-Out Test (P2)

**Surface:** "Calibration Engine" tab — second panel.

**P2 priority** — tests whether the hedonic model generalizes. Randomly hold out 20% of sales, train hedonic on 80%, predict on held-out set, compare RMSE.

**Method:** 5-fold cross-validation:
1. Shuffle qualified sales randomly.
2. Partition into 5 folds.
3. For each fold: train OLS on remaining 4 folds, predict held-out.
4. Aggregate: mean RMSE, mean MAE, mean MAPE across folds.

**Display:** Cross-validation table showing RMSE per fold and aggregate. "Model generalizes well: MAPE = 8.4%" or "High variance across folds: model may be overfit to specific neighborhoods."

---

### D10 — KS Distributional Shift Test (P3)

**Surface:** "Spatial & Temporal" tab — third panel.

**P3 priority** — detects whether the distribution of ratios has shifted significantly between the current study year and prior year. A significant KS shift when no major reappraisal occurred indicates data quality issues or market disruption.

**Method:** Two-sample Kolmogorov-Smirnov test:
```
D = max|F₁(x) – F₂(x)|
```
Compare ratio distributions between `taxYear=2025` and `taxYear=2026` (same property type strata).

**Display:** Overlapping density curves (2025 vs 2026) with shaded area for distribution shift. KS D-statistic and p-value. If significant (p < 0.05): "Distributional shift detected — review reappraisal cycle or market conditions."

---

## New Tab Structure

**Current Statistics Studio tabs (7):**
1. Overview
2. Ratio Study
3. VEI Dashboard
4. Assessment Equity
5. Time Trends
6. Calibration Matrix
7. Reports

**Post-implementation (10, with Phase B+D):**
1. Overview
2. Ratio Study *(enhanced with CIs)*
3. **Stratified Study** *(new — Phase B)*
4. VEI Dashboard *(PRB fix — Phase A)*
5. Assessment Equity
6. Time Trends
7. Calibration Matrix *(value driver panel added — Phase C)*
8. **Diagnostics** *(new — Phase D: vertical equity, Cook's D, variance decomp, sale chasing)*
9. **Spatial & Temporal** *(new — Phase D: Moran's I, time-trend, KS test)*
10. **Calibration Engine** *(new — Phase D: hedonic regression, cross-validation)*

Tabs 8–10 are hidden until "Show Advanced Analysis" toggle is enabled.

---

## Backend Endpoint Summary

| Endpoint | Phase | Priority |
|----------|-------|----------|
| `PATCH /api/costforge/dashboard-stats` — add avgResCostPerSqft + dataIntegrityWarning | A | P0 |
| `GET /api/terraforge/ratio-study` — add prb, tierSlope to response | A | P0 |
| `GET /api/terraforge/ratio-study/stratified` | B | P0 |
| `GET /api/terraforge/ratio-study/driver-analysis` | C | P0 |
| `GET /api/terraforge/ratio-study/confidence-intervals` | D1 | P0 |
| `GET /api/terraforge/ratio-study/vertical-equity` | D2 | P0 |
| `GET /api/terraforge/ratio-study/influence-diagnostics` | D3 | P1 |
| `GET /api/terraforge/ratio-study/time-trend` | D4 | P1 |
| `GET /api/terraforge/ratio-study/spatial-autocorrelation` | D5 | P1 |
| `GET /api/terraforge/ratio-study/hedonic-regression` | D6 | P1 |
| `GET /api/terraforge/ratio-study/variance-decomposition` | D7 | P2 |
| `GET /api/terraforge/ratio-study/sale-chasing` | D8 | P2 |
| `GET /api/terraforge/ratio-study/cross-validation` | D9 | P2 |
| `GET /api/terraforge/ratio-study/ks-shift-test` | D10 | P3 |

---

## Frontend Files to Create / Modify

### Modified Files
| File | Change |
|------|--------|
| `StatisticsStudio.tsx` | PRB fix; add 3 new tabs (Diagnostics, Spatial & Temporal, Calibration Engine) gated by toggle |
| `RatioStudyPanel.tsx` | Add CI display alongside all statistics |
| `VEIDashboard.tsx` | Wire prb from live API, remove hardcode |
| `CostForgeDashboard.tsx` | Replace $148 stub; add dataIntegrityWarning amber flag |

### New Files
```
frontend/apps/os-shell/src/pages/forge/statistics/
├── StratifiedStudyPanel.tsx       Phase B — strata table + DOR export
├── ValueDriverPanel.tsx           Phase C — feature attribution table
├── panels/
│   ├── DiagnosticsTab.tsx         Phase D — vertical equity + Cook's D + variance + sale chasing
│   ├── SpatialTemporalTab.tsx     Phase D — Moran's I + time trend + KS test
│   └── CalibrationEngineTab.tsx   Phase D — hedonic regression + cross-validation
└── components/
    ├── ConfidenceIntervalBadge.tsx  Shared CI display component
    ├── VerticalEquityChart.tsx      Decile bar chart
    ├── InfluencePlot.tsx            Cook's D scatter
    └── HedonicCoeffTable.tsx        Regression coefficient table
```

---

## Data Requirements

| Analysis | Tables Needed | Columns Needed |
|----------|---------------|----------------|
| Stratified study | ComparableSales, Properties, CamaCharacteristics | PropertyType, QualityClass, SalePrice, AssessedValue |
| Value driver | ComparableSales, ImprovementDetails | ImprvDetTypeCd, ratio |
| Vertical equity | ComparableSales | SalePrice, ratio (sorted) |
| Cook's D | ComparableSales | ratio |
| Time trend | ComparableSales | SaleDate, SalePrice, ParcelId (repeat sales) |
| Moran's I | ComparableSales, parcels | Latitude, Longitude, ratio |
| Hedonic | ComparableSales, CamaCharacteristics | GLA, YearBuilt, feature sqft/presence |
| Sale chasing | Properties, CamaCharacteristics, ComparableSales | AssessedValue (pre/post sale), characteristics |
| KS shift | ComparableSales (two years) | ratio, TaxYear |

**Coordinate data:** Parcel lat/lon is required for Moran's I (D5). If not currently in PACS seeding, will need to be sourced from the county GIS parcel layer (ArcGIS REST endpoint) or geocoded from address. This is a dependency — D5 may ship later than other D1 items if coordinate data is unavailable.

---

## Implementation Phase Order

```
Phase A  (1–2 days)     PRB fix, Physical Dep flag, $148 replacement, label fix
Phase B  (3–4 days)     Stratified Study tab + backend strata endpoint
Phase C  (2–3 days)     Value Driver Attribution panel + backend driver endpoint
Phase D-P0 (3–4 days)  CIs + vertical equity decile chart + endpoints
Phase D-P1 (5–7 days)  Cook's D, time trend, Moran's I, hedonic regression
Phase D-P2 (4–5 days)  Variance decomp, sale chasing, cross-validation
Phase D-P3 (2–3 days)  KS distributional shift test
```

Total estimated: 20–28 development days for full scope.
Phase A alone is 1–2 days and removes all credibility blockers.

---

## Success Criteria

### Phase A
- [ ] PRB displays a real computed value (not 0) for Benton County 2026 study
- [ ] Physical Dep shows amber flag when data integrity issue detected — not a silent wrong number
- [ ] "Avg Res. Cost/sqft" shows live computed value or `—` — never `$148` hardcoded
- [ ] Cost Schedule table header clarifies "Property Type" not "Class"

### Phase B
- [ ] Stratified Study tab shows all Property Type × Quality Class strata
- [ ] Strata with N < 5 show "Insufficient" not statistics
- [ ] IAAO Status column shows four compliance dots per stratum
- [ ] DOR CSV export matches WA DOR format and downloads successfully
- [ ] Click-through to SalesForge with pre-populated filter works

### Phase C
- [ ] Value Driver panel shows all 7 feature types with N, median ratio, deviation, signal
- [ ] Features with N < 5 show "Insufficient" — no fabricated signals
- [ ] Signal threshold is user-adjustable (0.01–0.15)

### Phase D-P0
- [ ] All statistics in Ratio Study tab show 95% CI brackets
- [ ] Vertical equity decile chart shows 10 deciles with color-coded deviation bars
- [ ] PRB displayed alongside decile chart with IAAO compliance indicator

### Phase D-P1+
- [ ] Cook's D scatter plot flags influential sales, clicking opens SalesForge detail
- [ ] Time trend chart shows monthly index with CI bands
- [ ] Moran's I statistic with p-value and spatial map
- [ ] Hedonic coefficient table with cost schedule comparison and gap column

---

## Design Constraints

1. **No fabricated statistics.** Every displayed value is either live API data, clearly labeled estimate/fallback, or "—". This constraint is absolute.

2. **IAAO standards are hardcoded constants, not configurable.** PRD pass range 0.98–1.03 is specified in IAAO Standard 5; it is not a user setting. The only configurable threshold is the Value Driver signal threshold (D-P0).

3. **Minimum sample size = 5** for any COD/PRD/PRB computation. Below 5, show N and "Insufficient sample" — no statistics.

4. **Advanced Analysis gated.** Tabs 8–10 (Diagnostics, Spatial & Temporal, Calibration Engine) appear only when the toggle is enabled. They are not default-visible. Assessors using the system daily should not see unfamiliar methodology panels unless they ask for them.

5. **SalesForge integration is the audit path.** Every table row in the stratified study, every flagged Cook's D point, every value driver row — clicking navigates to SalesForge filtered to that stratum/sale/feature. The analytics surface is read-only; decisions happen in SalesForge.

6. **DOR export is client-side.** No server-side CSV generation required. The frontend constructs the blob from the already-loaded data.

---

*Spec written: 2026-04-15. Covers all four design sections approved in brainstorming session. Ready for implementation plan.*

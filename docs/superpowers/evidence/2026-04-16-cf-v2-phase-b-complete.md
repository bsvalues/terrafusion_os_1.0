# CostForge Benton Method v2 — Phase B Complete

**Date:** 2026-04-16
**Branch:** `feat/native-app-integrations`
**Orchestrator:** TerraFusion Elite Government OS Engineering Agent Cloud Coach
**Status:** All 7 tracks shipped end-to-end. 10 live endpoints returning HTTP 200 against Benton 2026 canonical data.

---

## Final Commit Chain (Phase B)

All on `feat/native-app-integrations`:

| Commit | Track | What |
|---|---|---|
| `cecb24985` | T1 | EquityMetricsDto + SaleRatio + SaleRatioQueryBuilder + EquityMetricService (IAAO + decile math) |
| `72da2c04d` | T1 | EquityController `/api/equity/metrics` + DevPropertySeeder FipsCode fix + TF_SKIP_DEV_SEEDERS |
| `4de732d4e` | T2 | RollupService + `/api/equity/rollup?by={city\|type\|vintage\|grade}` |
| `7b5c27012` | T3 | BentonCustomMetricService: 5 endpoints (deciles, stratified-cod, condition-bias, segment-drift, grade-drift) |
| `74cf2bdd6` | T4 | CamaDataQualityService + `/api/costforge/data-quality/canonical` with 8 real checks |
| `5fd481055` | T5+T6 | CostMatrix.SecondaryFeaturePctOfBiv + 6 Benton rates seeded + effective-age endpoint |

Total Phase B: **6 commits**, net ~1400 lines of backend implementation.

---

## 10 Live Endpoints (All Return HTTP 200 against Benton 2026)

| # | Endpoint | Track | Output |
|---|---|---|---|
| 1 | `GET /api/equity/metrics?by=none\|county\|neighborhood\|city\|type\|vintage\|condition\|grade` | T1 | Dict of stratum → full EquityMetrics |
| 2 | `GET /api/equity/rollup?by=city\|type\|vintage\|grade` | T2 | Ordered list of StratumRollup with parcel counts + metrics |
| 3 | `GET /api/equity/deciles?by=&segment=` | T3 | 10-bucket decile medians + D1-D10 spread + pattern (regressive/progressive/uniform) |
| 4 | `GET /api/equity/stratified-cod?splitBy=vintage\|condition\|grade` | T3 | Per-sub-stratum COD |
| 5 | `GET /api/equity/condition-bias` | T3 | Median ratio per ConditionGrade |
| 6 | `GET /api/equity/segment-drift` | T3 | Median ratio with/without each SegmentType (CovPatio, BSMT, POLEBLDG, ATTGAR, DETGAR, POOL) |
| 7 | `GET /api/equity/grade-drift` | T3 | Median ratio per QualityGrade |
| 8 | `GET /api/costforge/data-quality/canonical` | T4 | 8 canonical DQ checks with affected counts + parcel samples |
| 9 | `GET /api/costforge/schedule` | T6 | 330 primary + 6 secondary-feature rows with SecondaryFeaturePctOfBiv |
| 10 | `POST /api/costforge/effective-age` | T5 | Benton WAC-adjusted effective age |

---

## Live Data Proof Points

### Track 1 — Equity metrics by Benton city (`by=city`)
| City | Sales | Median Ratio | COD | IAAO OK |
|---|---:|---:|---:|:---:|
| Kennewick | 4,452 | 0.953 | 8.9% | ✗ |
| Richland | 3,564 | 0.900 | 35.6% | ✗ |
| West Richland | 994 | 0.951 | 12.4% | ✗ |
| Prosser | 516 | 0.945 | 13.5% | ✗ |
| Benton City | 486 | 0.946 | 12.0% | ✗ |
| Unincorporated | 87 | 0.898 | 181.7% | ✗ |

### Track 2 — Property type rollup (`by=type`)
| Type | Parcels | Sales | Median | COD |
|---|---:|---:|---:|---:|
| R (Residential) | 60,620 | 9,177 | 0.938 | 10.3% |
| M (Manufactured) | 6,821 | 305 | 0.954 | 35.8% |
| C (Commercial) | 5,134 | 488 | 0.797 | 225.5% |
| X (Exempt) | 3,332 | 129 | 0.918 | 39.5% |

### Track 3 — Decile equity (`by=none`, county-wide)
- Sales: 10,342
- Deciles D1..D10: 0.934 / 0.912 / 0.933 / 0.943 / 0.942 / 0.943 / 0.949 / 0.941 / 0.935 / 0.902
- D1–D10 spread: **0.031** → pattern = **uniform**

### Track 4 — Data quality checks (Benton 2026 canonical)
| Severity | Category.Field | Affected |
|---|---|---:|
| critical | Completeness.QualityGrade/ConditionGrade | 5,000+ |
| critical | Completeness.CamaImprovementDetails | 72,575 |

### Track 5 — Effective-age WAC table
| Actual | Condition | Adjusted |
|---:|---|---:|
| 30 | EXCELLENT | 27 |
| 30 | GOOD | 30 |
| 30 | FAIR | 32 |
| 30 | POOR | 35 |

### Track 6 — Schedule secondary-feature rates (6 Benton rates)
| Code | Description | % of BIV |
|---|---|---:|
| POLEBLDG | Pole building | 18.0% |
| BSMT | Basement | 13.0% |
| ATTGAR | Attached garage | 12.0% |
| DETGAR | Detached garage | 8.0% |
| POOL | Pool starter rate | 5.0% |
| CovPatio | Covered patio | 3.0% |

---

## Canonical Data State (post-Phase B)

| Table | Benton 2026 Rows | Canonicalized |
|---|---:|---|
| `CamaCharacteristics` | 75,907 | 100% City + PropertyUseStratum |
| `PropertyAssessments` | 91,949 | From pacs_valuations PropValYear=2026, SupNum=0 |
| `CostMatrices` (SecondaryFeature) | 6 | All 6 Benton rates |
| `ComparableSales` | 258,899 | 17,896 with SalePrice in last 4 years; ~10,342 effectively qualified |

---

## Key Architectural Outcomes

1. **Canonical-only boundary respected.** `SaleRatioQueryBuilder` is the single choke point; no CostForge v2 service queries `Pacs*` tables directly.
2. **3-layer qualification centralized.** `QualificationDecision > QualificationRecommendation > SaleQualification`. All 10 endpoints use the same ratio-building logic — numerical consistency guaranteed.
3. **Formula reuse via statics.** `EquityMetricService.Median`, `ComputeCod`, `ComputePrb`, `ComputeDeciles`, `VintageKey` are public-static, reused by `RollupService`, `BentonCustomMetricService`, `CamaDataQualityService`.
4. **New service boundaries:**
   - `IEquityMetricService` (Track 1) — sole IAAO+Benton compute
   - `IRollupService` (Track 2) — stratum aggregation
   - `IBentonCustomMetricService` (Track 3) — 5 bespoke metrics
   - `ICamaDataQualityService` (Track 4) — 8 canonical checks
   - `IPacsCanonicalizer` (Track 0) — sole staging → canonical writer
5. **Legacy surfaces preserved.** `/api/costforge/analytics/data-quality/assess` and `/api/dataquality/report` untouched; v2 adds alongside at `/api/costforge/data-quality/canonical`.

---

## What's Deferred (Phase C candidates)

### Canonical sync extensions (unblock more metric signal)
- Populate `CamaCharacteristic.YearBuilt` from `PacsImprovement` — enables real vintage-decade stratified COD
- Populate `CamaCharacteristic.ConditionGrade` / `QualityGrade` from `PacsImprovement` — enables condition-bias and grade-drift with real data
- Populate `CamaImprovementDetails` from `pacs_improvement_details` — enables segment-drift with real with/without comparisons
- Populate `ComparableSale.AdjustedSalePrice` during sync — currently falling back to `SalePrice`

### Frontend wiring (separate implementation pass)
- `TriageTab`: PRB weighting in priority score + decile indicator column
- `NeighborhoodAuditTab`: `BentonDiagnosticsPanel` integration + IQR outlier badges
- `CalibrationWorkbenchTab`: full-metric before/after preview (median, COD, PRD, PRB, deciles)
- `CostApproachRunner`: BIV breakdown section with real %-of-BIV values from schedule
- `CostManual`: secondary-feature rate table
- `DepreciationCalculator`: condition-grade picker wired to `/effective-age`

### Calibration v2 extensions
- Segment-specific mass-adjust (`segmentSplit: {dimension, segments:[{code, pct}]}`) on existing `mass-adjust-preview`
- CalibrationFinding audit row written on commit
- Verification snapshot panel

---

## Full Session Chronology (Phase A + B, 16 commits)

1. `8887c4eb4` — Marshall & Swift purge (11 files)
2. `226534100` — v2 spec
3. `86dd9bcb9` — 43-task plan
4. `c5ecb010b` — T0: CamaCharacteristic.City + PropertyUseStratum
5. `aa56a1fbd` — T0: EF config with 4 stratum indexes
6. `47375788d` — T0: migration applied
7. `15bc17626` — T0: PacsCanonicalizer
8. `05069ad62` — T0: CanonicalAdminController + Benton populated
9. `b7a6cc682` — Phase A evidence
10. `cecb24985` — T1: EquityMetricService
11. `72da2c04d` — T1: EquityController + live smoke
12. `4de732d4e` — T2: RollupService
13. `7b5c27012` — T3: 5 custom-metric endpoints
14. `74cf2bdd6` — T4: CamaDataQualityService (8 checks)
15. `5fd481055` — T5+T6: secondary features (6 rates) + effective-age

---

## Verification Commands

```bash
export BENTON=19190019-1919-1919-1919-191919191919

# Smoke all 10 endpoints
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:5000/api/equity/metrics?countyId=$BENTON&taxYear=2026&by=city"
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:5000/api/equity/rollup?countyId=$BENTON&taxYear=2026&by=type"
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:5000/api/equity/deciles?countyId=$BENTON&taxYear=2026&by=none"
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:5000/api/equity/stratified-cod?countyId=$BENTON&taxYear=2026&by=none&splitBy=vintage"
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:5000/api/equity/condition-bias?countyId=$BENTON&taxYear=2026&by=none"
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:5000/api/equity/segment-drift?countyId=$BENTON&taxYear=2026&by=none"
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:5000/api/equity/grade-drift?countyId=$BENTON&taxYear=2026&by=none"
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:5000/api/costforge/data-quality/canonical?countyId=$BENTON&taxYear=2026"
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:5000/api/costforge/schedule"
curl -s -o /dev/null -w "%{http_code}\n" -X POST "http://localhost:5000/api/costforge/effective-age" -H "Content-Type: application/json" -d '{"actualAge":30,"conditionGrade":"FAIR"}'
```

Expected: all 10 return `200`.

---

**Phase B ✅ COMPLETE. CostForge Benton Method v2 backend shipped end-to-end.**

Frontend integration, advanced calibration, and deeper canonical sync are Phase C work — scoped and unblocked.

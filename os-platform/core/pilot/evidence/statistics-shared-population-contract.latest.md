# Statistics Shared Population Contract

Checked: 2026-04-30T18:53:23.232Z

Status: PASS
Decision: PATH_A_IMPLEMENTED_SHARED_PARITY_MODE_PROVEN
Study: `52eb120f-99d3-4790-a69c-49b6de80cd5e`
County: `19190019-1919-1919-1919-191919191919` (Benton County)
Tax year: `2026`

## Shared Parity Contract

Contract: `statistics_ratio_study_compat_v1`

| Field | Value | Reason |
| --- | --- | --- |
| county | Exact countyId 19190019-1919-1919-1919-191919191919 | Avoid Benton/default/fallback contamination. |
| tax year | Exact taxYear 2026 | Both surfaces must use the same assessment year. |
| comparison unit | qualified sale ratio row | Statistics Studio ratio-study is sale-row based; County Studio health is parcel-rollup based and must not be used as the parity comparator. |
| assessed value join | ComparableSales.ParcelId resolved to the canonical parcel identity used for Properties assessed value; report ParcelId vs ParcelNumber mapping and unmatched counts. | Current surfaces disagree: County Studio health joins through Properties.ParcelId while TerraForge ratio-study joins through Properties.ParcelNumber. |
| sale window | SalesYear=2026, or null SalesYear with SaleDate >= Jan 1 2024 and < Jan 1 2026 | Matches the current Statistics/TerraForge ratio-study lens for immediate parity compatibility. |
| qualification rule | QualificationDecision == qualified, or null decision with QualificationRecommendation == qualified/null; additionally report SaleQualification-only inclusions as conversion-sensitive, not silent truth. | Matches current ratio-study compatibility while making 2017 conversion-sensitive fallback risk visible. |
| suppression/no-calc | Exclude SuppressOnRatioRptCd=T and IncludeNoCalc=true. | Matches current Statistics/TerraForge ratio-study and avoids known non-ratio-report rows. |
| outlier policy | Report countWithRatio before trimming; compute stats on Tukey/IQR-trimmed rows; report outliersExcluded. | Matches current ratio-study statistics semantics. |
| segment/cohort scope | County-wide by default; optional activeSegmentSetId/segmentId/cohortId filters may be added, but every response must echo the applied scope. | Keeps Statistics parity county-wide while allowing County Studio scoped drilldowns without changing metric meaning. |
| trust posture | Benton Production Provisional / Sync-Derived / Converted Legacy Sensitive until qualification lineage is closed. | Prevents 2017 conversion-sensitive qualified-sale fields from being treated as production-verified proof. |

## Existing Surface Assessment

| Surface | Implements shared contract? | Notes |
| --- | --- | --- |
| TerraForge ratio-study | partial | Implements the ratio-study lens and current countWithRatio population, but does not emit a contract id, parcel identity reconciliation counts, or conversion-sensitive qualification classifications. |
| County Studio health summary | no | Uses segment-set parcel health rollup semantics. It is intentionally not the comparator for statistics parity. |
| County Studio statistics workbench | yes | Declares an explicit Statistics Compat mode and renders the statistics_ratio_study_compat_v1 contract fields as first-class data. |
| County Studio statistics-compat endpoint | yes | Backend endpoint and DTO surface contract id, countWithRatio, outliersExcluded, conversion-sensitive counts, parcel identity reconciliation, and trust posture. |

## Current Counts

County Studio health ratioCount: 5559
TerraForge ratio-study countWithRatio: 36
Overlap: {"sharedSaleRows":36,"healthSaleRowsNotInTerraForge":5686,"terraForgeSaleRowsNotInHealth":0}

## API Same-Population Parity

API base: `http://localhost:5046/api`
API status: PASS
Contract echoed: true

| Metric | County Studio Compat | TerraForge Ratio Study | Tolerance | Pass? |
| --- | --- | --- | --- | --- |
| countWithRatio | 36 | 36 | 0 | yes |
| outliersExcluded | 1 | 1 | 0 | yes |
| medianRatio | 0.7224 | 0.7224 | 0.0001 | yes |
| cod | 40.24 | 40.24 | 0.01 | yes |
| prd | 2.1352 | 2.1352 | 0.0001 | yes |
| prb | -0.1672 | -0.1672 | 0.0001 | yes |
| weightedMeanRatio | 0.3053 | 0.3053 | 0.0001 | yes |

## Blockers

- County Studio health summary remains a different analytical surface and must not be used as the Statistics parity comparator.
- Benton qualification fields remain conversion-sensitive until row-level sync lineage closes the 2017 risk.

## Required Closure

- Keep the live same-population parity proof attached to this artifact.
- Only upgrade the Statistics superset claim when both surfaces agree on the shared contract and Benton reference lanes remain reference-only.
- Keep Statistics Studio visible until the shared-population parity mode passes against live Benton data.

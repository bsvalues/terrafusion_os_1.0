# Statistics Parity Scope Alignment

Checked: 2026-04-30T17:18:30.976Z

Status: BLOCKED_SCOPE_MISMATCH
Study: `52eb120f-99d3-4790-a69c-49b6de80cd5e`
County: `19190019-1919-1919-1919-191919191919` (Benton County)
Tax year: `2026`
Root cause: `scope_mismatch_different_population_definitions`

## Population Counts

| Surface | Population concept | Count label | Count |
| --- | --- | --- | ---: |
| County Studio health | Active segment-set parcel-weighted health rollup | ratioCount | 5559 |
| TerraForge ratio-study | County-wide effective qualified sale ratio study | countWithRatio | 36 |

Count difference: 5559 vs 36 (5523 delta).

## Scope Differences

| Field | County Studio health | TerraForge ratio-study |
| --- | --- | --- |
| Population concept | Active segment-set parcel rollup for the study. | County-wide effective qualified sale pool. |
| Parcel/sale identifier join | ComparableSales.ParcelId joins Properties.ParcelId. | ComparableSales.ParcelId maps to Properties.ParcelNumber for assessed value. |
| Study/segment scope | Requires parcels matching active CountySegments rule keys. | No active segment set required; optional hood/propertyType filters only. |
| Sale date window | SaleDate from Jan 1 2024 through Dec 31 2026. | SalesYear=2026, or null SalesYear with SaleDate from Jan 1 2024 through Dec 31 2025. |
| Qualification rule | coalesce(QualificationDecision, QualificationRecommendation, SaleQualification) == qualified. | QualificationDecision == qualified, or null decision with qualified/null recommendation. |
| Suppression/no-calc handling | No SuppressOnRatioRptCd or IncludeNoCalc exclusion in health summary loader. | Excludes SuppressOnRatioRptCd=T and IncludeNoCalc=true. |
| Outlier handling | No IQR trim in health summary rollup. | Computes stats after Tukey/IQR trim; countWithRatio remains pre-trim. |

## Conversion-Sensitive Fields

- `QualificationDecision`
- `QualificationRecommendation`
- `SaleQualification`
- `RawCountyRatioCd`
- `RawRatioTypeCd`
- `RawRatioCd`
- `SuppressOnRatioRptCd`
- `IncludeNoCalc`

## Conclusion

County Studio health and TerraForge ratio-study are both ratio surfaces, but they are not currently measuring the same population. The observed mismatch is therefore not proof that either metric is mathematically wrong; it blocks parity until a shared comparison contract is implemented.

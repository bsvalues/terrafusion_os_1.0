# County Studio Full Statistics Superset Proof

Checked: 2026-04-29T20:18:00Z

Verdict: PASS_FULL_STATISTICS_SUPERSET by direct embedding, with native-decomposition work still open.

The prior proof was too weak. It only proved a County Studio command-metric subset and incorrectly treated that as enough to hide Statistics Studio. The corrected product law is stricter:

- County Studio must contain every Statistics Studio capability.
- Statistics Studio remains available as a temporary parity source until the embedded County Studio path is visually and operationally trusted.
- Reduced IAAO summary metrics are not parity.

## Implemented Now

County Studio now has a `Full Statistics Lab` workspace mode. That mode renders the same Statistics Studio surface inside County Studio, with the active County Studio study county and tax year passed into the statistics county scope.

This means County Studio now contains the complete current Statistics Studio tab set:

- Ratio Study
- Stratified Study
- Calibration Matrix
- Trends
- Equity (VEI)
- Outliers
- Comparison
- Cost Analytics
- Diagnostics
- Spatial & Temporal
- Calibration Engine

## Statistics Studio Capability Inventory

| Statistics capability | County Studio status |
| --- | --- |
| Median ratio, weighted mean, COD, PRD, PRB, tier slope, sample size | Embedded through Full Statistics Lab and partially native in command panels |
| Stratified study by DOR/statistical strata | Embedded through Full Statistics Lab |
| Quarterly COD/PRD trends | Embedded through Full Statistics Lab |
| VEI/neighborhood equity dashboard | Embedded through Full Statistics Lab and partially native in segment inspector |
| Outlier review | Embedded through Full Statistics Lab |
| Model comparison | Embedded through Full Statistics Lab |
| Cost ratio analysis and value-driver analysis | Embedded through Full Statistics Lab |
| CostForge dashboard analytics | Embedded through Full Statistics Lab |
| Bootstrap confidence intervals | Embedded through Full Statistics Lab |
| Vertical equity by sale-price decile | Embedded through Full Statistics Lab |
| Cook's D influence diagnostics | Embedded through Full Statistics Lab |
| Variance decomposition by neighborhood | Embedded through Full Statistics Lab |
| Sale-chasing detection | Embedded through Full Statistics Lab |
| Monthly median-ratio trend | Embedded through Full Statistics Lab |
| KS distributional shift test | Embedded through Full Statistics Lab |
| Moran's I spatial autocorrelation | Embedded through Full Statistics Lab |
| Hedonic regression vs cost schedule | Embedded through Full Statistics Lab |
| 5-fold cross-validation | Embedded through Full Statistics Lab |

## Launcher Posture

Statistics Studio is restored to the Forge specialist launcher as a temporary parity source. That is intentional. It should not be removed again until County Studio's embedded Full Statistics Lab has browser proof and the native command panels have absorbed the workflows cleanly.

## Remaining Native-Decomposition Work

The functionality is now present inside County Studio, but some advanced functions are still rendered by the reused Statistics Studio surface rather than fully decomposed into native County Studio command panels. That is acceptable as an immediate functionality repair, but it is not the final UX.

Next native slices should migrate these into County Studio panels without losing power:

- Diagnostics: confidence intervals, vertical equity deciles, Cook's D, variance decomposition, sale chasing
- Spatial/temporal: monthly trend, KS shift, Moran's I
- Calibration: hedonic regression, cross-validation, value-driver analytics
- Outlier and model-comparison workflow

## Evidence Files

- `frontend/apps/os-shell/src/pages/forge/county-studio/CountyStudyPage.tsx`
- `frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx`
- `frontend/apps/os-shell/src/pages/forge/statistics/StatisticsStudio.tsx`
- `frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx`
- `frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CountyStudyPage.test.tsx`
- `frontend/apps/os-shell/src/pages/suites/__tests__/ForgeSuiteHome.moduleList.test.tsx`

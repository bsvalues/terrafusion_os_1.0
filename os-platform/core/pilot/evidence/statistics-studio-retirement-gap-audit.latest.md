# Statistics Studio Retirement Gap Audit

Checked: 2026-04-30T19:19:02.465Z
Status: PASS_WITH_PRODUCT_GAPS
Decision: DEMOTE_STATISTICS_STUDIO_KEEP_TEMPORARILY_FOR_STANDALONE_SHELL_ONLY

## Prerequisite Proofs

- Shared contract: PASS / PASS
- Dev-data truth: PASS_WITH_WARNINGS; failures=0

## Gap Matrix

| Capability | County Studio equivalent | UI proof | Parity status | Recommendation |
| --- | --- | --- | --- | --- |
| Ratio-study metrics and IAAO status | Statistics Compat mode uses County Studio statistics-compat endpoint and renders the same RatioStudyPanel. | `frontend/apps/os-shell/src/pages/forge/statistics/StatisticsStudio.tsx:290`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:592`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:889` | proven | retire-or-demote-standalone |
| Stratified/DOR study table and CSV export | County Studio imports the same StratifiedStudyPanel with active study county scope. | `frontend/apps/os-shell/src/pages/forge/statistics/StatisticsStudio.tsx:301`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:902`<br>`frontend/apps/os-shell/src/pages/forge/statistics/StratifiedStudyPanel.tsx:50` | shared-component | retire-or-demote-standalone |
| COD/PRD trend charts | County Studio calls the same trends endpoint and renders the same COD/PRD charts. | `frontend/apps/os-shell/src/pages/forge/statistics/StatisticsStudio.tsx:127`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:760`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:911`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:923` | covered-same-endpoint | retire-or-demote-standalone |
| Valuation Equity Index | County Studio renders VEIDashboard with ad hoc tax-year exploration while preserving the active study scope for non-VEI statistics. | `frontend/apps/os-shell/src/pages/forge/statistics/StatisticsStudio.tsx:346`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:939`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:941` | covered-in-county-studio | retire-or-demote-standalone |
| Outlier review | County Studio renders the same OutlierReviewPanel in its analytics modes. | `frontend/apps/os-shell/src/pages/forge/statistics/StatisticsStudio.tsx:355`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:1037` | shared-component | retire-or-demote-standalone |
| Model comparison | County Studio renders the same ModelComparisonPanel. | `frontend/apps/os-shell/src/pages/forge/statistics/StatisticsStudio.tsx:358`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:1039` | shared-component | retire-or-demote-standalone |
| Calibration matrix and value-driver attribution | County Studio renders CostRatioAnalysis and ValueDriverPanel with active county scope override. | `frontend/apps/os-shell/src/pages/forge/statistics/StatisticsStudio.tsx:363`<br>`frontend/apps/os-shell/src/pages/forge/statistics/StatisticsStudio.tsx:364`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:1043`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:1044` | shared-component | retire-or-demote-standalone |
| Cost analytics | County Studio renders the same CostForgeDashboard. | `frontend/apps/os-shell/src/pages/forge/statistics/StatisticsStudio.tsx:369`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:1048` | shared-component | retire-or-demote-standalone |
| Advanced diagnostics, spatial/temporal, and calibration engine | County Studio renders the same advanced panels and applies the same advanced certification guard. | `frontend/apps/os-shell/src/pages/forge/statistics/StatisticsStudio.tsx:254`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:1049`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:835` | shared-component | retire-or-demote-standalone |
| Market context and economics | County Studio adds a reference-only certified market lane plus MarketAnalyticsDashboard, MarketDashboard, and EconomicIndicators. | `frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:972`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:989`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:1010` | county-studio-only-reference-context | keep-in-county-studio |
| Assessment intelligence and quality control | County Studio derives AssessmentIntelligence and QualityControlPanel from active study health and segment data. | `frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:441`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:321`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:952`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:965` | county-studio-only | keep-in-county-studio |
| Standalone module entrypoint | County Studio requires an active study for its workbench-native statistics surface. | `frontend/apps/os-shell/src/config/moduleComponents.tsx:826`<br>`frontend/apps/os-shell/src/config/generatedModules.ts:431`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:854` | unique-shell-not-unique-analytics | demote-keep-temporarily |

## Required Closure Before Hiding

- Decide whether standalone Statistics Studio ad hoc tax-year exploration is still required.
- If not required, demote the statistics-studio module entrypoint to legacy/specialist or redirect users to County Studio study selection.
- Do not remove shared statistics panels; County Studio still imports them as native workbench capabilities.


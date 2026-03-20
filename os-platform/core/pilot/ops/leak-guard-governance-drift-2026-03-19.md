# Leak-Guard Governance Drift

Date: 2026-03-19
Status: OPEN
Lane: Separate governance remediation
Scope: Documentation and triage only. No changes to leak-guard tests or component coverage map in this slice.

## Summary

Full-root Vitest remains non-green due to pre-existing governance drift in:

- `os-platform/core/tests/leak-guard-strict-components-coverage.test.ts`

This failure is unrelated to the scoped frontend contract repair lane that fixed:

- `TerraCanonCrossTabSyncContract`
- `WorkbenchTabBar`
- `DesktopIntentContract`
- `AuthBoundaryIntent`

That repair lane was already proved separately and must not be used to claim leak-guard remediation.

## Failing Test

| Item | Value |
|---|---|
| Test file | `os-platform/core/tests/leak-guard-strict-components-coverage.test.ts` |
| Test name | `Leak guard STRICT coverage (components narrow root) — Phase 203 > every eligible file in os-shell components has a corresponding leak guard` |
| Result | FAIL |
| Exit code | 1 |
| Error | `Unguarded eligible files in narrow root (frontend/apps/os-shell/src/components): 63` |

## Reproduction

```powershell
pnpm exec vitest run os-platform/core/tests/leak-guard-strict-components-coverage.test.ts --reporter=verbose 2>&1
```

## First 20 Reported Unguarded Files

1. `frontend/apps/os-shell/src/components/atlas/AddressMapWidget.tsx`
2. `frontend/apps/os-shell/src/components/atlas/GamaMap.tsx`
3. `frontend/apps/os-shell/src/components/atlas/GisVisualization.tsx`
4. `frontend/apps/os-shell/src/components/atlas/MapContainerWidget.tsx`
5. `frontend/apps/os-shell/src/components/atlas/MarketHeatMapWidget.tsx`
6. `frontend/apps/os-shell/src/components/atlas/SchoolDistrictWidget.tsx`
7. `frontend/apps/os-shell/src/components/atlas/SentimentHeatMapWidget.tsx`
8. `frontend/apps/os-shell/src/components/atlas/SmartFilterBar.tsx`
9. `frontend/apps/os-shell/src/components/canon/CanonMinimapPanel.tsx`
10. `frontend/apps/os-shell/src/components/canon/CanonSnippetsPanel.tsx`
11. `frontend/apps/os-shell/src/components/dais/AppealCertificationPanel.tsx`
12. `frontend/apps/os-shell/src/components/dais/AppealDeadlinePanel.tsx`
13. `frontend/apps/os-shell/src/components/dais/AppealHearingPanel.tsx`
14. `frontend/apps/os-shell/src/components/dais/AppealNoticePanel.tsx`
15. `frontend/apps/os-shell/src/components/dais/AuditTab.tsx`
16. `frontend/apps/os-shell/src/components/dais/CertRollPanel.tsx`
17. `frontend/apps/os-shell/src/components/dais/ManagementDashboardPanel.tsx`
18. `frontend/apps/os-shell/src/components/dais/NoticeBatchQueuePanel.tsx`
19. `frontend/apps/os-shell/src/components/dais/WorkQueuePanel.tsx`
20. `frontend/apps/os-shell/src/components/datamining/EtlStatusPanel.tsx`

## Full Inventory Summary

Total unguarded eligible files: `63`

Grouped by first folder under `frontend/apps/os-shell/src/components`:

| Area | Count |
|---|---:|
| `forge` | 26 |
| `dais` | 9 |
| `atlas` | 8 |
| `dossier` | 5 |
| `levy` | 3 |
| `canon` | 2 |
| `pilot` | 2 |
| `suites` | 2 |
| `workbench` | 2 |
| `datamining` | 1 |
| `forms` | 1 |
| `governance` | 1 |
| `gpt` | 1 |

## Full Unguarded List

1. `frontend/apps/os-shell/src/components/atlas/AddressMapWidget.tsx`
2. `frontend/apps/os-shell/src/components/atlas/GamaMap.tsx`
3. `frontend/apps/os-shell/src/components/atlas/GisVisualization.tsx`
4. `frontend/apps/os-shell/src/components/atlas/MapContainerWidget.tsx`
5. `frontend/apps/os-shell/src/components/atlas/MarketHeatMapWidget.tsx`
6. `frontend/apps/os-shell/src/components/atlas/SchoolDistrictWidget.tsx`
7. `frontend/apps/os-shell/src/components/atlas/SentimentHeatMapWidget.tsx`
8. `frontend/apps/os-shell/src/components/atlas/SmartFilterBar.tsx`
9. `frontend/apps/os-shell/src/components/canon/CanonMinimapPanel.tsx`
10. `frontend/apps/os-shell/src/components/canon/CanonSnippetsPanel.tsx`
11. `frontend/apps/os-shell/src/components/dais/AppealCertificationPanel.tsx`
12. `frontend/apps/os-shell/src/components/dais/AppealDeadlinePanel.tsx`
13. `frontend/apps/os-shell/src/components/dais/AppealHearingPanel.tsx`
14. `frontend/apps/os-shell/src/components/dais/AppealNoticePanel.tsx`
15. `frontend/apps/os-shell/src/components/dais/AuditTab.tsx`
16. `frontend/apps/os-shell/src/components/dais/CertRollPanel.tsx`
17. `frontend/apps/os-shell/src/components/dais/ManagementDashboardPanel.tsx`
18. `frontend/apps/os-shell/src/components/dais/NoticeBatchQueuePanel.tsx`
19. `frontend/apps/os-shell/src/components/dais/WorkQueuePanel.tsx`
20. `frontend/apps/os-shell/src/components/datamining/EtlStatusPanel.tsx`
21. `frontend/apps/os-shell/src/components/dossier/PacketAppealHandoffPanel.tsx`
22. `frontend/apps/os-shell/src/components/dossier/PacketFinalizationPanel.tsx`
23. `frontend/apps/os-shell/src/components/dossier/PacketNarrativeEditor.tsx`
24. `frontend/apps/os-shell/src/components/dossier/PacketProvenance.tsx`
25. `frontend/apps/os-shell/src/components/dossier/ParcelEvidencePacket.tsx`
26. `frontend/apps/os-shell/src/components/forge/AdvancedPropertyComparison.tsx`
27. `frontend/apps/os-shell/src/components/forge/CompGridDropzone.tsx`
28. `frontend/apps/os-shell/src/components/forge/CompImpactVisualizer.tsx`
29. `frontend/apps/os-shell/src/components/forge/ComparisonContextComponent.tsx`
30. `frontend/apps/os-shell/src/components/forge/CostManualComponent.tsx`
31. `frontend/apps/os-shell/src/components/forge/DepreciationCalcComponent.tsx`
32. `frontend/apps/os-shell/src/components/forge/EconomicIndicatorsDashboard.tsx`
33. `frontend/apps/os-shell/src/components/forge/IncomeApproachComponent.tsx`
34. `frontend/apps/os-shell/src/components/forge/MarketAnalyticsDashboard.tsx`
35. `frontend/apps/os-shell/src/components/forge/MarketCyclePredictor.tsx`
36. `frontend/apps/os-shell/src/components/forge/MarketMetricsChartComponent.tsx`
37. `frontend/apps/os-shell/src/components/forge/ModelDetailsComponent.tsx`
38. `frontend/apps/os-shell/src/components/forge/ModelsListComponent.tsx`
39. `frontend/apps/os-shell/src/components/forge/NaturalHazardRisk.tsx`
40. `frontend/apps/os-shell/src/components/forge/NeighborhoodComparisonWizard.tsx`
41. `frontend/apps/os-shell/src/components/forge/NeighborhoodTrendCard.tsx`
42. `frontend/apps/os-shell/src/components/forge/NeighborhoodTrendsGrid.tsx`
43. `frontend/apps/os-shell/src/components/forge/PriceHistoryChartComponent.tsx`
44. `frontend/apps/os-shell/src/components/forge/PropertyRecommendationCarousel.tsx`
45. `frontend/apps/os-shell/src/components/forge/PropertyValuationDisplay.tsx`
46. `frontend/apps/os-shell/src/components/forge/PropertyValuationWidget.tsx`
47. `frontend/apps/os-shell/src/components/forge/QualityControlPanel.tsx`
48. `frontend/apps/os-shell/src/components/forge/RatioStudyPanel.tsx`
49. `frontend/apps/os-shell/src/components/forge/RetrainStatusWidget.tsx`
50. `frontend/apps/os-shell/src/components/forge/SalesCompGridComponent.tsx`
51. `frontend/apps/os-shell/src/components/forge/SmartCompTray.tsx`
52. `frontend/apps/os-shell/src/components/forms/URARForm.tsx`
53. `frontend/apps/os-shell/src/components/governance/DemoDataBanner.tsx`
54. `frontend/apps/os-shell/src/components/gpt/GPTTraceDetails.tsx`
55. `frontend/apps/os-shell/src/components/levy/Map/DistrictMap.tsx`
56. `frontend/apps/os-shell/src/components/levy/Map/PolygonGenerator.tsx`
57. `frontend/apps/os-shell/src/components/levy/visualizations/LevyCharts.tsx`
58. `frontend/apps/os-shell/src/components/pilot/DraftReviewPanel.tsx`
59. `frontend/apps/os-shell/src/components/pilot/TerraPilotPanel.tsx`
60. `frontend/apps/os-shell/src/components/suites/OperationalQueue.tsx`
61. `frontend/apps/os-shell/src/components/suites/SuiteModuleGrid.tsx`
62. `frontend/apps/os-shell/src/components/workbench/ComparableSalesPanel.tsx`
63. `frontend/apps/os-shell/src/components/workbench/IncomeValuationPanel.tsx`

## Truth Boundary

- Scoped frontend contract regressions are fixed and verified.
- Full Vitest is not green.
- The blocking condition is pre-existing leak-guard governance drift outside that change set.
- Any remediation here must be tracked and proved as a separate slice.

## Diagnosis

- The strict test is a narrow-root filesystem coverage check over `frontend/apps/os-shell/src/components`.
- The current 63 failures are real missing guard coverage, not a known parser false positive from an existing matching guard file.
- The heaviest uncovered cluster is `forge` with 26 files, followed by `dais` with 9 and `atlas` with 8.
- The likely remediation is a bounded wave of new leak-guard tests under `os-platform/core/tests`, with possible secondary work only if some components need eligibility review.

## Current Scope Constraint

- Under the current TerraFusion Copilot working rules for this lane, the obvious remediation surface is outside the allowed modification scope.
- The most direct fixes would require edits under `os-platform/core/tests` and possibly `frontend/apps/os-shell/src/components/**`.
- This note therefore advances diagnosis and inventory only; it does not claim that the governance blocker is fixable inside the currently authorized edit boundary without an explicit lane/scope expansion.

## Recommended Next Steps

1. Open or authorize a dedicated governance remediation lane that may modify `os-platform/core/tests`.
2. Generate guard tests in bounded waves by area, starting with `forge`, `dais`, and `atlas`.
3. Re-run `os-platform/core/tests/leak-guard-strict-components-coverage.test.ts` after each wave.
4. Re-run full-root Vitest only after the governance lane has independent evidence.
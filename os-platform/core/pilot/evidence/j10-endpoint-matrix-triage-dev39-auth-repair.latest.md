# Endpoint Matrix Triage Wave 1

- Generated: 2026-05-31T20:10:53.540Z
- Verdict: TRIAGE_ONLY_NO_FIXES
- Reprobe enabled: false
- Production binding touched: false
- DB mutation touched: false
- Feature fixes touched: false
- Packet hash: 827bcc8931c03b690e49e7d91386db11bf1df220cfe679205dc404a31c09516b

## Summary

| Metric | Count |
| --- | ---: |
| Broken GET endpoints triaged | 175 |

## Likely Cause Counts

- unknown: 175

## Priority Counts

- production blocker: 137
- module blocker: 38

## Status Code Counts

- 400: 48
- 500: 126
- 503: 1

## Broken Endpoint Triage

- GET /api/adjustment/proposals -> 500; cause=unknown; priority=production blocker; controller=AdjustmentController; correlation=none
- GET /api/adjustment/sets -> 500; cause=unknown; priority=production blocker; controller=AdjustmentController; correlation=none
- GET /api/adjustment/runs -> 500; cause=unknown; priority=production blocker; controller=AdjustmentController; correlation=none
- GET /api/adjustment/recommend -> 400; cause=unknown; priority=production blocker; controller=AdjustmentController; correlation=none
- GET /api/aiorchestration/health -> 500; cause=unknown; priority=production blocker; controller=AIOrchestrationController; correlation=none
- GET /api/aiorchestration/performance-analytics -> 500; cause=unknown; priority=production blocker; controller=AIOrchestrationController; correlation=none
- GET /api/aisuperiority/swarm/status -> 500; cause=unknown; priority=production blocker; controller=AISuperiorityController; correlation=none
- GET /api/aisuperiority/performance/comparison -> 500; cause=unknown; priority=production blocker; controller=AISuperiorityController; correlation=none
- GET /api/aisuperiority/scenarios -> 500; cause=unknown; priority=production blocker; controller=AISuperiorityController; correlation=none
- GET /api/aisuperiority/battalions -> 500; cause=unknown; priority=production blocker; controller=AISuperiorityController; correlation=none
- GET /api/atlas/gis/geocode -> 500; cause=unknown; priority=module blocker; controller=AtlasGisController; correlation=none
- GET /api/atlas/gis/spatial-query -> 500; cause=unknown; priority=module blocker; controller=AtlasGisController; correlation=none
- GET /api/levy/v1/banked-capacity -> 400; cause=unknown; priority=module blocker; controller=BankedCapacityController; correlation=none
- GET /api/levy/budget/visualization -> 500; cause=unknown; priority=module blocker; controller=BudgetImpactController; correlation=none
- GET /api/levy/budget/scenarios -> 500; cause=unknown; priority=module blocker; controller=BudgetImpactController; correlation=none
- GET /api/costforge/data-quality/canonical -> 400; cause=unknown; priority=production blocker; controller=CanonicalDataQualityController; correlation=none
- GET /api/codex/collaboration/health -> 500; cause=unknown; priority=production blocker; controller=CodexCollaborationController; correlation=none
- GET /api/codex/performance/system-wide -> 500; cause=unknown; priority=production blocker; controller=CodexPerformanceController; correlation=none
- GET /api/codex/performance/foundation -> 500; cause=unknown; priority=production blocker; controller=CodexPerformanceController; correlation=none
- GET /api/codex/performance/amplification -> 500; cause=unknown; priority=production blocker; controller=CodexPerformanceController; correlation=none
- GET /api/codex/performance/ultimate-power -> 500; cause=unknown; priority=production blocker; controller=CodexPerformanceController; correlation=none
- GET /api/codex/performance/alerts -> 500; cause=unknown; priority=production blocker; controller=CodexPerformanceController; correlation=none
- GET /api/codex/performance/metrics -> 500; cause=unknown; priority=production blocker; controller=CodexPerformanceController; correlation=none
- GET /api/codex/performance/cache/statistics -> 500; cause=unknown; priority=production blocker; controller=CodexPerformanceController; correlation=none
- GET /api/codex/performance/health -> 500; cause=unknown; priority=production blocker; controller=CodexPerformanceController; correlation=none
- GET /api/codex/reports/daily -> 500; cause=unknown; priority=production blocker; controller=CodexReportsController; correlation=none
- GET /api/codex/reports/weekly -> 500; cause=unknown; priority=production blocker; controller=CodexReportsController; correlation=none
- GET /api/codex/reports/monthly -> 500; cause=unknown; priority=production blocker; controller=CodexReportsController; correlation=none
- GET /api/codex/reports/quarterly -> 500; cause=unknown; priority=production blocker; controller=CodexReportsController; correlation=none
- GET /api/codex/reports/annual -> 500; cause=unknown; priority=production blocker; controller=CodexReportsController; correlation=none
- GET /api/collaboration/users -> 500; cause=unknown; priority=production blocker; controller=CollaborationController; correlation=none
- GET /api/collaboration/teams -> 500; cause=unknown; priority=production blocker; controller=CollaborationController; correlation=none
- GET /api/collaboration/projects -> 500; cause=unknown; priority=production blocker; controller=CollaborationController; correlation=none
- GET /api/collaboration/metrics/teams -> 500; cause=unknown; priority=production blocker; controller=CollaborationController; correlation=none
- GET /api/collaboration/metrics/tasks -> 500; cause=unknown; priority=production blocker; controller=CollaborationController; correlation=none
- GET /api/costforge/matrix -> 400; cause=unknown; priority=production blocker; controller=CostForgeController; correlation=none
- GET /api/costforge/traces -> 400; cause=unknown; priority=production blocker; controller=CostForgeController; correlation=none
- GET /api/county-study/studies -> 400; cause=unknown; priority=production blocker; controller=CountyStudyController; correlation=none
- GET /api/dataquality/report -> 500; cause=unknown; priority=production blocker; controller=DataQualityController; correlation=none
- GET /api/dataquality/issues -> 500; cause=unknown; priority=production blocker; controller=DataQualityController; correlation=none
- GET /api/sync/doctrine/policy/ratio -> 500; cause=unknown; priority=module blocker; controller=DoctrinePolicyController; correlation=none
- GET /api/sync/doctrine/policy/ratio/evaluate -> 400; cause=unknown; priority=module blocker; controller=DoctrinePolicyController; correlation=none
- GET /api/sync/doctrine/policy/universe -> 500; cause=unknown; priority=module blocker; controller=DoctrinePolicyController; correlation=none
- GET /api/sync/doctrine/policy/universe/classify -> 400; cause=unknown; priority=module blocker; controller=DoctrinePolicyController; correlation=none
- GET /api/sync/doctrine/policy/universe/attribute-dictionary -> 500; cause=unknown; priority=module blocker; controller=DoctrinePolicyController; correlation=none
- GET /api/sync/doctrine/policy/sales-qualification -> 500; cause=unknown; priority=module blocker; controller=DoctrinePolicyController; correlation=none
- GET /api/sync/doctrine/policy/sales-qualification/audit -> 500; cause=unknown; priority=module blocker; controller=DoctrinePolicyController; correlation=none
- GET /api/sync/doctrine/state -> 500; cause=unknown; priority=module blocker; controller=DoctrineStatusController; correlation=none
- GET /api/sync/doctrine/lanes -> 500; cause=unknown; priority=module blocker; controller=DoctrineStatusController; correlation=none
- GET /api/performance/elite/dashboard -> 500; cause=unknown; priority=production blocker; controller=ElitePerformanceMonitoringController; correlation=none
- GET /api/performance/elite/quantum-visualization -> 500; cause=unknown; priority=production blocker; controller=ElitePerformanceMonitoringController; correlation=none
- GET /api/performance/elite/predictive-health -> 500; cause=unknown; priority=production blocker; controller=ElitePerformanceMonitoringController; correlation=none
- GET /api/performance/elite/ai-agents/performance -> 500; cause=unknown; priority=production blocker; controller=ElitePerformanceMonitoringController; correlation=none
- GET /api/performance/elite/production-pacs/performance -> 500; cause=unknown; priority=production blocker; controller=ElitePerformanceMonitoringController; correlation=none
- GET /api/performance/elite/championship-metrics -> 500; cause=unknown; priority=production blocker; controller=ElitePerformanceMonitoringController; correlation=none
- GET /api/performance/elite/anomaly-detection -> 500; cause=unknown; priority=production blocker; controller=ElitePerformanceMonitoringController; correlation=none
- GET /api/performance/elite/optimization-recommendations -> 500; cause=unknown; priority=production blocker; controller=ElitePerformanceMonitoringController; correlation=none
- GET /api/performance/elite/real-time-metrics -> 500; cause=unknown; priority=production blocker; controller=ElitePerformanceMonitoringController; correlation=none
- GET /api/performance/elite/comparison-analysis -> 500; cause=unknown; priority=production blocker; controller=ElitePerformanceMonitoringController; correlation=none
- GET /api/performance/elite/health-status -> 500; cause=unknown; priority=production blocker; controller=ElitePerformanceMonitoringController; correlation=none
- GET /api/ecosystem/enhancement-modules -> 500; cause=unknown; priority=production blocker; controller=EnhancementModuleController; correlation=none
- GET /api/equity/metrics -> 400; cause=unknown; priority=production blocker; controller=EquityController; correlation=none
- GET /api/equity/rollup -> 400; cause=unknown; priority=production blocker; controller=EquityController; correlation=none
- GET /api/fismacompliance/status -> 500; cause=unknown; priority=production blocker; controller=FISMAComplianceController; correlation=none
- GET /api/fismacompliance/missing-controls -> 500; cause=unknown; priority=production blocker; controller=FISMAComplianceController; correlation=none
- GET /api/fismacompliance/metrics -> 500; cause=unknown; priority=production blocker; controller=FISMAComplianceController; correlation=none
- GET /api/fismacompliance/dashboard -> 500; cause=unknown; priority=production blocker; controller=FISMAComplianceController; correlation=none
- GET /api/fismacompliance/export -> 500; cause=unknown; priority=production blocker; controller=FISMAComplianceController; correlation=none
- GET /api/geoforge/ratio-study/neighborhood-stats -> 500; cause=unknown; priority=production blocker; controller=GeoForgeController; correlation=none
- GET /api/geoforge/ratio-study/sales -> 500; cause=unknown; priority=production blocker; controller=GeoForgeController; correlation=none
- GET /api/geoforge/ratio-study/diagnosis -> 400; cause=unknown; priority=production blocker; controller=GeoForgeController; correlation=none
- GET /api/geoforge/ratio-study/export -> 500; cause=unknown; priority=production blocker; controller=GeoForgeController; correlation=none
- GET /api/geoforge/ratio-study/monthly-trend -> 500; cause=unknown; priority=production blocker; controller=GeoForgeController; correlation=none
- GET /api/geoforge/certification/summary -> 500; cause=unknown; priority=production blocker; controller=GeoForgeController; correlation=none
- GET /api/geoforge/parcel/search -> 400; cause=unknown; priority=production blocker; controller=GeoForgeController; correlation=none
- GET /api/geoforge/sales/outliers -> 500; cause=unknown; priority=production blocker; controller=GeoForgeController; correlation=none
- GET /api/geoforge/neighborhoods/boundaries -> 500; cause=unknown; priority=production blocker; controller=GeoForgeController; correlation=none
- GET /api/geoforge/neighborhoods/av-change -> 500; cause=unknown; priority=production blocker; controller=GeoForgeController; correlation=none
- GET /api/geoforge/v2/neighborhoods/outline -> 500; cause=unknown; priority=production blocker; controller=GeoForgeController; correlation=none
- GET /api/gis/geocode -> 500; cause=unknown; priority=production blocker; controller=GisController; correlation=none
- GET /api/gis/parcels/spatial -> 500; cause=unknown; priority=production blocker; controller=GisController; correlation=none
- GET /api/gis/layers -> 500; cause=unknown; priority=production blocker; controller=GisController; correlation=none
- GET /api/gis/proximity -> 500; cause=unknown; priority=production blocker; controller=GisController; correlation=none
- GET /api/compliance/certification -> 503; cause=unknown; priority=module blocker; controller=GovernmentComplianceController; correlation=none
- GET /api/gpt/search -> 400; cause=unknown; priority=production blocker; controller=GPTController; correlation=none
- GET /api/harrispacsenhancement/sessions -> 500; cause=unknown; priority=production blocker; controller=HarrisPACSEnhancementController; correlation=none
- GET /api/levy/historical/trends -> 500; cause=unknown; priority=module blocker; controller=HistoricalAnalysisController; correlation=none
- GET /api/levy/historical/anomalies -> 500; cause=unknown; priority=module blocker; controller=HistoricalAnalysisController; correlation=none
- GET /api/knowledgebase/search -> 500; cause=unknown; priority=production blocker; controller=KnowledgeBaseController; correlation=none
- GET /api/knowledgebase/categories -> 500; cause=unknown; priority=production blocker; controller=KnowledgeBaseController; correlation=none
- GET /api/knowledgebase/popular -> 500; cause=unknown; priority=production blocker; controller=KnowledgeBaseController; correlation=none
- GET /api/knowledgebase/recent -> 500; cause=unknown; priority=production blocker; controller=KnowledgeBaseController; correlation=none
- GET /api/knowledgebase/bookmarks -> 500; cause=unknown; priority=production blocker; controller=KnowledgeBaseController; correlation=none
- GET /api/knowledgebase/suggestions -> 500; cause=unknown; priority=production blocker; controller=KnowledgeBaseController; correlation=none
- GET /api/knowledgebase/tags -> 500; cause=unknown; priority=production blocker; controller=KnowledgeBaseController; correlation=none
- GET /api/knowledgebase/analytics -> 500; cause=unknown; priority=production blocker; controller=KnowledgeBaseController; correlation=none
- GET /api/knowledgebase/export -> 500; cause=unknown; priority=production blocker; controller=KnowledgeBaseController; correlation=none
- GET /api/levy/audit/dashboard -> 500; cause=unknown; priority=module blocker; controller=LevyAuditController; correlation=none
- GET /api/levy/calculate -> 400; cause=unknown; priority=module blocker; controller=LevyController; correlation=none
- GET /api/levy/dashboard/summary -> 500; cause=unknown; priority=module blocker; controller=LevyDashboardController; correlation=none
- GET /api/levy/dashboard/metrics -> 500; cause=unknown; priority=module blocker; controller=LevyDashboardController; correlation=none
- GET /api/levy/dashboard/districts-overview -> 500; cause=unknown; priority=module blocker; controller=LevyDashboardController; correlation=none
- GET /api/levy/data/districts -> 500; cause=unknown; priority=module blocker; controller=LevyDataManagementController; correlation=none
- GET /api/levy/v1/data-quality/district-risk-summary -> 500; cause=unknown; priority=module blocker; controller=LevyDataQualityController; correlation=none
- GET /api/levy/forecast/dashboard -> 500; cause=unknown; priority=module blocker; controller=LevyForecastController; correlation=none
- GET /api/levy/forecast/compare -> 400; cause=unknown; priority=module blocker; controller=LevyForecastController; correlation=none
- GET /api/levy/search/search -> 400; cause=unknown; priority=module blocker; controller=LevySearchController; correlation=none
- GET /api/levy/search/autocomplete -> 500; cause=unknown; priority=module blocker; controller=LevySearchController; correlation=none
- GET /api/market/metrics -> 500; cause=unknown; priority=production blocker; controller=MarketController; correlation=none
- GET /api/market/trends -> 500; cause=unknown; priority=production blocker; controller=MarketController; correlation=none
- GET /api/market/conditions -> 500; cause=unknown; priority=production blocker; controller=MarketController; correlation=none
- GET /api/migrationpathways/active -> 500; cause=unknown; priority=production blocker; controller=MigrationPathwaysController; correlation=none
- GET /api/migrationpathways/health -> 500; cause=unknown; priority=production blocker; controller=MigrationPathwaysController; correlation=none
- GET /api/monitoring/report -> 500; cause=unknown; priority=production blocker; controller=MonitoringController; correlation=none
- GET /api/monitoring/health -> 500; cause=unknown; priority=production blocker; controller=MonitoringController; correlation=none
- GET /api/monitoring/health/detailed -> 500; cause=unknown; priority=production blocker; controller=MonitoringController; correlation=none
- GET /api/monitoring/alerts -> 500; cause=unknown; priority=production blocker; controller=MonitoringController; correlation=none
- GET /api/monitoring/performance -> 500; cause=unknown; priority=production blocker; controller=MonitoringController; correlation=none
- GET /api/monitoring/metrics -> 500; cause=unknown; priority=production blocker; controller=MonitoringController; correlation=none
- GET /api/monitoring/metrics/history -> 500; cause=unknown; priority=production blocker; controller=MonitoringController; correlation=none
- GET /api/monitoring/metrics/statistics -> 500; cause=unknown; priority=production blocker; controller=MonitoringController; correlation=none
- GET /api/monitoring/status -> 500; cause=unknown; priority=production blocker; controller=MonitoringController; correlation=none
- GET /api/parcels/open-work -> 400; cause=unknown; priority=production blocker; controller=OpenWorkQueueController; correlation=none
- GET /api/pilot/drafts -> 400; cause=unknown; priority=production blocker; controller=PilotController; correlation=none
- GET /api/playground/scenarios -> 500; cause=unknown; priority=module blocker; controller=PlaygroundController; correlation=none
- GET /api/production/pacs/ciaps/properties -> 500; cause=unknown; priority=production blocker; controller=ProductionPACSIntegrationController; correlation=none
- GET /api/production/pacs/building-permits -> 500; cause=unknown; priority=production blocker; controller=ProductionPACSIntegrationController; correlation=none
- GET /api/production/pacs/analytics/historical-patterns -> 500; cause=unknown; priority=production blocker; controller=ProductionPACSIntegrationController; correlation=none
- GET /api/production/pacs/status/comprehensive -> 500; cause=unknown; priority=production blocker; controller=ProductionPACSIntegrationController; correlation=none
- GET /api/propertyvaluation/health -> 500; cause=unknown; priority=production blocker; controller=PropertyValuationController; correlation=none
- GET /api/levy/public/tax-estimate -> 400; cause=unknown; priority=module blocker; controller=PublicLevyPortalController; correlation=none
- GET /api/realdata/connection-status -> 500; cause=unknown; priority=production blocker; controller=RealDataController; correlation=none
- GET /api/realdata/property-stats -> 500; cause=unknown; priority=production blocker; controller=RealDataController; correlation=none
- GET /api/realdata/properties -> 500; cause=unknown; priority=production blocker; controller=RealDataController; correlation=none
- GET /api/realdata/permits -> 500; cause=unknown; priority=production blocker; controller=RealDataController; correlation=none
- GET /api/realdata/database-health -> 500; cause=unknown; priority=production blocker; controller=RealDataController; correlation=none
- GET /api/realdata/health -> 500; cause=unknown; priority=production blocker; controller=RealDataController; correlation=none
- GET /api/research/cross-workspace -> 500; cause=unknown; priority=production blocker; controller=ResearchAnalyticsController; correlation=none
- GET /api/research/sync-status -> 500; cause=unknown; priority=module blocker; controller=ResearchAnalyticsController; correlation=none
- GET /api/salesaudit/strata -> 400; cause=unknown; priority=production blocker; controller=SalesAuditController; correlation=none
- GET /api/spatial-analytics/hotspots -> 500; cause=unknown; priority=production blocker; controller=SpatialAnalyticsController; correlation=none
- GET /api/swarmintelligence/status -> 500; cause=unknown; priority=production blocker; controller=SwarmIntelligenceController; correlation=none
- GET /api/sync/comps/eligible -> 400; cause=unknown; priority=module blocker; controller=SyncController; correlation=none
- GET /api/sync/active-workbook -> 400; cause=unknown; priority=module blocker; controller=SyncController; correlation=none
- GET /api/sync/comps/stale -> 400; cause=unknown; priority=module blocker; controller=SyncController; correlation=none
- GET /api/sync/comps/stale/summary -> 400; cause=unknown; priority=module blocker; controller=SyncController; correlation=none
- GET /api/terraforge/sale-qualification -> 400; cause=unknown; priority=production blocker; controller=TerraForgeController; correlation=none
- GET /api/terraforge/sale-qualification/running-stats -> 400; cause=unknown; priority=production blocker; controller=TerraForgeController; correlation=none
- GET /api/terraforge/sale-qualification/neighborhood-stats -> 400; cause=unknown; priority=production blocker; controller=TerraForgeController; correlation=none
- GET /api/terraforge/sale-qualification/code-audit -> 400; cause=unknown; priority=production blocker; controller=TerraForgeController; correlation=none
- GET /api/terraforge/ratio-study -> 400; cause=unknown; priority=production blocker; controller=TerraForgeController; correlation=none
- GET /api/terraforge/comps-pool -> 400; cause=unknown; priority=production blocker; controller=TerraForgeController; correlation=none
- GET /api/terraforge/regression -> 400; cause=unknown; priority=production blocker; controller=TerraForgeController; correlation=none
- GET /api/terraforge/county-stats -> 400; cause=unknown; priority=production blocker; controller=TerraForgeController; correlation=none
- GET /api/terraforge/ratio-study/trends -> 400; cause=unknown; priority=production blocker; controller=TerraForgeController; correlation=none
- GET /api/terraforge/ratio-study/stratified -> 400; cause=unknown; priority=production blocker; controller=TerraForgeController; correlation=none
- GET /api/terraforge/ratio-study/confidence-intervals -> 400; cause=unknown; priority=production blocker; controller=TerraForgeController; correlation=none
- GET /api/terraforge/ratio-study/vertical-equity -> 400; cause=unknown; priority=production blocker; controller=TerraForgeController; correlation=none
- GET /api/terraforge/ratio-study/influence-diagnostics -> 400; cause=unknown; priority=production blocker; controller=TerraForgeController; correlation=none
- GET /api/terraforge/ratio-study/time-trend -> 400; cause=unknown; priority=production blocker; controller=TerraForgeController; correlation=none
- GET /api/terraforge/ratio-study/spatial-autocorrelation -> 400; cause=unknown; priority=production blocker; controller=TerraForgeController; correlation=none
- GET /api/terraforge/ratio-study/hedonic-regression -> 400; cause=unknown; priority=production blocker; controller=TerraForgeController; correlation=none
- GET /api/terraforge/ratio-study/variance-decomposition -> 400; cause=unknown; priority=production blocker; controller=TerraForgeController; correlation=none
- GET /api/terraforge/ratio-study/sale-chasing -> 400; cause=unknown; priority=production blocker; controller=TerraForgeController; correlation=none
- GET /api/terraforge/ratio-study/cross-validation -> 400; cause=unknown; priority=production blocker; controller=TerraForgeController; correlation=none
- GET /api/terraforge/ratio-study/ks-shift-test -> 400; cause=unknown; priority=production blocker; controller=TerraForgeController; correlation=none
- GET /api/terraforge/ratio-study/driver-analysis -> 400; cause=unknown; priority=production blocker; controller=TerraForgeController; correlation=none
- GET /api/terraforge/comparison-snapshots -> 400; cause=unknown; priority=production blocker; controller=TerraForgeController; correlation=none
- GET /api/sales -> 400; cause=unknown; priority=production blocker; controller=TfSalesController; correlation=none
- GET /api/timeseries/market -> 500; cause=unknown; priority=production blocker; controller=TimeseriesController; correlation=none
- GET /api/valuationagent/status -> 500; cause=unknown; priority=production blocker; controller=ValuationAgentController; correlation=none
- GET /api/what-if-scenarios -> 500; cause=unknown; priority=production blocker; controller=WhatIfScenariosController; correlation=none
- GET /api/sync/workbench/f/quarantine/imprv-attr -> 500; cause=unknown; priority=module blocker; controller=WorkbenchFController; correlation=none
- GET /api/sync/workbench/g/commits -> 500; cause=unknown; priority=module blocker; controller=WorkbenchGController; correlation=none
- GET /api/workbench/sync-readiness -> 400; cause=unknown; priority=module blocker; controller=WorkbenchSyncReadinessController; correlation=none

## Hard Stop

Classification only. No endpoint fixes, no production binding, no DB mutation.

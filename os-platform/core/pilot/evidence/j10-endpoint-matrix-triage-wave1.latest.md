# Endpoint Matrix Triage Wave 1

- Generated: 2026-05-31T18:10:35.955Z
- Verdict: TRIAGE_ONLY_NO_FIXES
- Reprobe enabled: true
- Production binding touched: false
- DB mutation touched: false
- Feature fixes touched: false
- Packet hash: 3282ca66f3288edd7f7358b8bcdca8ecf1ddaf28713c730109d0dc445aeb4626

## Summary

| Metric | Count |
| --- | ---: |
| Broken GET endpoints triaged | 167 |

## Likely Cause Counts

- missing DB table: 116
- not applicable to dev39: 45
- unknown: 5
- bad config: 1

## Priority Counts

- production blocker: 128
- module blocker: 39

## Status Code Counts

- 0: 1
- 400: 47
- 500: 118
- 503: 1

## Broken Endpoint Triage

- GET /api/adjustment/proposals -> 500; cause=missing DB table; priority=production blocker; controller=AdjustmentController; correlation=none
- GET /api/adjustment/sets -> 500; cause=missing DB table; priority=production blocker; controller=AdjustmentController; correlation=none
- GET /api/adjustment/runs -> 500; cause=missing DB table; priority=production blocker; controller=AdjustmentController; correlation=none
- GET /api/adjustment/recommend -> 400; cause=not applicable to dev39; priority=production blocker; controller=AdjustmentController; correlation=tf-9b7d13295e1346e0a3db025cdc009340
- GET /api/aiorchestration/health -> 500; cause=missing DB table; priority=production blocker; controller=AIOrchestrationController; correlation=none
- GET /api/aiorchestration/performance-analytics -> 500; cause=missing DB table; priority=production blocker; controller=AIOrchestrationController; correlation=none
- GET /api/aisuperiority/swarm/status -> 500; cause=missing DB table; priority=production blocker; controller=AISuperiorityController; correlation=none
- GET /api/aisuperiority/performance/comparison -> 500; cause=missing DB table; priority=production blocker; controller=AISuperiorityController; correlation=none
- GET /api/aisuperiority/scenarios -> 500; cause=missing DB table; priority=production blocker; controller=AISuperiorityController; correlation=none
- GET /api/aisuperiority/battalions -> 500; cause=missing DB table; priority=production blocker; controller=AISuperiorityController; correlation=none
- GET /api/atlas/gis/geocode -> 500; cause=missing DB table; priority=module blocker; controller=AtlasGisController; correlation=none
- GET /api/atlas/gis/spatial-query -> 500; cause=missing DB table; priority=module blocker; controller=AtlasGisController; correlation=none
- GET /api/levy/v1/banked-capacity -> 400; cause=not applicable to dev39; priority=module blocker; controller=BankedCapacityController; correlation=tf-9069e21532ef4bffb50f49717659dae5
- GET /api/levy/budget/visualization -> 500; cause=missing DB table; priority=module blocker; controller=BudgetImpactController; correlation=none
- GET /api/levy/budget/scenarios -> 500; cause=missing DB table; priority=module blocker; controller=BudgetImpactController; correlation=none
- GET /api/costforge/data-quality/canonical -> 400; cause=not applicable to dev39; priority=production blocker; controller=CanonicalDataQualityController; correlation=tf-7d391770fc7f46ca97148555befe8543
- GET /api/codex/performance/system-wide -> 500; cause=missing DB table; priority=production blocker; controller=CodexPerformanceController; correlation=none
- GET /api/codex/performance/foundation -> 500; cause=missing DB table; priority=production blocker; controller=CodexPerformanceController; correlation=none
- GET /api/codex/performance/amplification -> 500; cause=missing DB table; priority=production blocker; controller=CodexPerformanceController; correlation=none
- GET /api/codex/performance/ultimate-power -> 500; cause=missing DB table; priority=production blocker; controller=CodexPerformanceController; correlation=none
- GET /api/codex/performance/alerts -> 500; cause=missing DB table; priority=production blocker; controller=CodexPerformanceController; correlation=none
- GET /api/collaboration/users -> 500; cause=missing DB table; priority=production blocker; controller=CollaborationController; correlation=none
- GET /api/collaboration/teams -> 500; cause=missing DB table; priority=production blocker; controller=CollaborationController; correlation=none
- GET /api/collaboration/projects -> 500; cause=missing DB table; priority=production blocker; controller=CollaborationController; correlation=none
- GET /api/collaboration/metrics/teams -> 500; cause=missing DB table; priority=production blocker; controller=CollaborationController; correlation=none
- GET /api/collaboration/metrics/tasks -> 500; cause=missing DB table; priority=production blocker; controller=CollaborationController; correlation=none
- GET /api/costforge/traces -> 400; cause=not applicable to dev39; priority=production blocker; controller=CostForgeController; correlation=tf-ed0304b30c5e4b9dac5e9a0a2f2ae350
- GET /api/county-study/studies -> 400; cause=not applicable to dev39; priority=production blocker; controller=CountyStudyController; correlation=tf-25e5e1bf6e434b9e82f9f0dec025dc77
- GET /api/dataquality/report -> 500; cause=missing DB table; priority=production blocker; controller=DataQualityController; correlation=none
- GET /api/dataquality/issues -> 500; cause=missing DB table; priority=production blocker; controller=DataQualityController; correlation=none
- GET /api/sync/doctrine/policy/ratio -> 500; cause=missing DB table; priority=module blocker; controller=DoctrinePolicyController; correlation=none
- GET /api/sync/doctrine/policy/ratio/evaluate -> 400; cause=not applicable to dev39; priority=module blocker; controller=DoctrinePolicyController; correlation=tf-710a5d0fd7924e3b829eac536644552a
- GET /api/sync/doctrine/policy/universe -> 500; cause=missing DB table; priority=module blocker; controller=DoctrinePolicyController; correlation=none
- GET /api/sync/doctrine/policy/universe/classify -> 400; cause=not applicable to dev39; priority=module blocker; controller=DoctrinePolicyController; correlation=tf-e87056f0d16c418384acad5da321dedd
- GET /api/sync/doctrine/policy/universe/attribute-dictionary -> 500; cause=missing DB table; priority=module blocker; controller=DoctrinePolicyController; correlation=none
- GET /api/sync/doctrine/policy/sales-qualification -> 500; cause=missing DB table; priority=module blocker; controller=DoctrinePolicyController; correlation=none
- GET /api/sync/doctrine/policy/sales-qualification/audit -> 500; cause=missing DB table; priority=module blocker; controller=DoctrinePolicyController; correlation=none
- GET /api/sync/doctrine/state -> 500; cause=missing DB table; priority=module blocker; controller=DoctrineStatusController; correlation=tf-b00738371b8849afa106b740f603846e
- GET /api/sync/doctrine/lanes -> 500; cause=missing DB table; priority=module blocker; controller=DoctrineStatusController; correlation=tf-28f35e3aee1a4546985edf9b3b1a4c8d
- GET /api/performance/elite/dashboard -> 500; cause=missing DB table; priority=production blocker; controller=ElitePerformanceMonitoringController; correlation=none
- GET /api/performance/elite/quantum-visualization -> 500; cause=missing DB table; priority=production blocker; controller=ElitePerformanceMonitoringController; correlation=none
- GET /api/performance/elite/predictive-health -> 500; cause=missing DB table; priority=production blocker; controller=ElitePerformanceMonitoringController; correlation=none
- GET /api/performance/elite/ai-agents/performance -> 500; cause=missing DB table; priority=production blocker; controller=ElitePerformanceMonitoringController; correlation=none
- GET /api/performance/elite/production-pacs/performance -> 500; cause=missing DB table; priority=production blocker; controller=ElitePerformanceMonitoringController; correlation=none
- GET /api/performance/elite/championship-metrics -> 500; cause=missing DB table; priority=production blocker; controller=ElitePerformanceMonitoringController; correlation=none
- GET /api/performance/elite/anomaly-detection -> 500; cause=missing DB table; priority=production blocker; controller=ElitePerformanceMonitoringController; correlation=none
- GET /api/performance/elite/optimization-recommendations -> 500; cause=missing DB table; priority=production blocker; controller=ElitePerformanceMonitoringController; correlation=none
- GET /api/performance/elite/real-time-metrics -> 500; cause=missing DB table; priority=production blocker; controller=ElitePerformanceMonitoringController; correlation=none
- GET /api/performance/elite/comparison-analysis -> 500; cause=missing DB table; priority=production blocker; controller=ElitePerformanceMonitoringController; correlation=none
- GET /api/performance/elite/health-status -> 500; cause=missing DB table; priority=production blocker; controller=ElitePerformanceMonitoringController; correlation=none
- GET /api/equity/metrics -> 400; cause=not applicable to dev39; priority=production blocker; controller=EquityController; correlation=tf-43b3fe6bb03a4fb2b2afd0b3c14d172e
- GET /api/equity/rollup -> 400; cause=not applicable to dev39; priority=production blocker; controller=EquityController; correlation=tf-4dbc093420ca4a21a5c5eef0d0cdcb5d
- GET /api/fismacompliance/status -> 500; cause=missing DB table; priority=production blocker; controller=FISMAComplianceController; correlation=none
- GET /api/fismacompliance/missing-controls -> 500; cause=missing DB table; priority=production blocker; controller=FISMAComplianceController; correlation=none
- GET /api/fismacompliance/metrics -> 500; cause=missing DB table; priority=production blocker; controller=FISMAComplianceController; correlation=none
- GET /api/fismacompliance/dashboard -> 500; cause=missing DB table; priority=production blocker; controller=FISMAComplianceController; correlation=none
- GET /api/fismacompliance/export -> 500; cause=missing DB table; priority=production blocker; controller=FISMAComplianceController; correlation=none
- GET /api/geoforge/ratio-study/neighborhood-stats -> 500; cause=missing DB table; priority=production blocker; controller=GeoForgeController; correlation=none
- GET /api/geoforge/ratio-study/sales -> 500; cause=missing DB table; priority=production blocker; controller=GeoForgeController; correlation=none
- GET /api/geoforge/ratio-study/diagnosis -> 400; cause=not applicable to dev39; priority=production blocker; controller=GeoForgeController; correlation=tf-58f494e4055a469eaf3100626b9a69bb
- GET /api/geoforge/ratio-study/export -> 500; cause=missing DB table; priority=production blocker; controller=GeoForgeController; correlation=none
- GET /api/geoforge/ratio-study/monthly-trend -> 500; cause=missing DB table; priority=production blocker; controller=GeoForgeController; correlation=none
- GET /api/geoforge/certification/summary -> 500; cause=missing DB table; priority=production blocker; controller=GeoForgeController; correlation=none
- GET /api/geoforge/parcel/search -> 400; cause=not applicable to dev39; priority=production blocker; controller=GeoForgeController; correlation=tf-22666219ddfb46b08398286801ee30c7
- GET /api/geoforge/sales/outliers -> 500; cause=missing DB table; priority=production blocker; controller=GeoForgeController; correlation=none
- GET /api/geoforge/neighborhoods/boundaries -> 500; cause=missing DB table; priority=production blocker; controller=GeoForgeController; correlation=none
- GET /api/geoforge/neighborhoods/av-change -> 500; cause=missing DB table; priority=production blocker; controller=GeoForgeController; correlation=none
- GET /api/geoforge/v2/neighborhoods/outline -> 500; cause=missing DB table; priority=production blocker; controller=GeoForgeController; correlation=none
- GET /api/gis/geocode -> 500; cause=missing DB table; priority=production blocker; controller=GisController; correlation=none
- GET /api/gis/parcels/spatial -> 500; cause=missing DB table; priority=production blocker; controller=GisController; correlation=none
- GET /api/gis/layers -> 500; cause=missing DB table; priority=production blocker; controller=GisController; correlation=none
- GET /api/gis/proximity -> 500; cause=missing DB table; priority=production blocker; controller=GisController; correlation=none
- GET /api/compliance/certification -> 503; cause=unknown; priority=module blocker; controller=GovernmentComplianceController; correlation=tf-5e565d02383f4f1aae24c1484b0be9b4
- GET /api/gpt -> 500; cause=unknown; priority=production blocker; controller=GPTController; correlation=tf-6566b504b4964a3c8c17546ae62681ec
- GET /api/gpt/search -> 400; cause=not applicable to dev39; priority=production blocker; controller=GPTController; correlation=tf-bb0a76eee2994205b0cbf0470c7f0a23
- GET /api/gpt/conversations -> 500; cause=unknown; priority=production blocker; controller=GPTController; correlation=tf-1c704974972c4687b35dff378a70cca1
- GET /api/gpt/system/atlas/live -> 0; cause=bad config; priority=module blocker; controller=GPTController; correlation=none
- GET /api/harrispacsenhancement/sessions -> 500; cause=missing DB table; priority=production blocker; controller=HarrisPACSEnhancementController; correlation=none
- GET /api/levy/historical/trends -> 500; cause=missing DB table; priority=module blocker; controller=HistoricalAnalysisController; correlation=none
- GET /api/levy/historical/anomalies -> 500; cause=missing DB table; priority=module blocker; controller=HistoricalAnalysisController; correlation=none
- GET /api/knowledgebase/search -> 500; cause=missing DB table; priority=production blocker; controller=KnowledgeBaseController; correlation=none
- GET /api/knowledgebase/categories -> 500; cause=missing DB table; priority=production blocker; controller=KnowledgeBaseController; correlation=none
- GET /api/knowledgebase/popular -> 500; cause=missing DB table; priority=production blocker; controller=KnowledgeBaseController; correlation=none
- GET /api/knowledgebase/recent -> 500; cause=missing DB table; priority=production blocker; controller=KnowledgeBaseController; correlation=none
- GET /api/knowledgebase/bookmarks -> 500; cause=missing DB table; priority=production blocker; controller=KnowledgeBaseController; correlation=none
- GET /api/knowledgebase/suggestions -> 500; cause=missing DB table; priority=production blocker; controller=KnowledgeBaseController; correlation=none
- GET /api/knowledgebase/tags -> 500; cause=missing DB table; priority=production blocker; controller=KnowledgeBaseController; correlation=none
- GET /api/knowledgebase/analytics -> 500; cause=missing DB table; priority=production blocker; controller=KnowledgeBaseController; correlation=none
- GET /api/knowledgebase/export -> 500; cause=missing DB table; priority=production blocker; controller=KnowledgeBaseController; correlation=none
- GET /api/levy/audit/dashboard -> 500; cause=missing DB table; priority=module blocker; controller=LevyAuditController; correlation=none
- GET /api/levy/calculate -> 400; cause=not applicable to dev39; priority=module blocker; controller=LevyController; correlation=tf-7bd184a255c442e69c5d90bed75dcb6b
- GET /api/levy/dashboard/summary -> 500; cause=missing DB table; priority=module blocker; controller=LevyDashboardController; correlation=none
- GET /api/levy/dashboard/metrics -> 500; cause=missing DB table; priority=module blocker; controller=LevyDashboardController; correlation=none
- GET /api/levy/dashboard/districts-overview -> 500; cause=missing DB table; priority=module blocker; controller=LevyDashboardController; correlation=none
- GET /api/levy/data/districts -> 500; cause=missing DB table; priority=module blocker; controller=LevyDataManagementController; correlation=none
- GET /api/levy/v1/data-quality/district-risk-summary -> 500; cause=missing DB table; priority=module blocker; controller=LevyDataQualityController; correlation=none
- GET /api/levy/forecast/dashboard -> 500; cause=missing DB table; priority=module blocker; controller=LevyForecastController; correlation=none
- GET /api/levy/forecast/compare -> 400; cause=not applicable to dev39; priority=module blocker; controller=LevyForecastController; correlation=tf-0e89aecbd64048558ead9b7d8027d399
- GET /api/levy/search/search -> 400; cause=not applicable to dev39; priority=module blocker; controller=LevySearchController; correlation=tf-bf503f614bc345e7a95c8a13866a8bbc
- GET /api/levy/search/autocomplete -> 500; cause=missing DB table; priority=module blocker; controller=LevySearchController; correlation=none
- GET /api/market/metrics -> 500; cause=missing DB table; priority=production blocker; controller=MarketController; correlation=none
- GET /api/market/trends -> 500; cause=missing DB table; priority=production blocker; controller=MarketController; correlation=none
- GET /api/market/conditions -> 500; cause=missing DB table; priority=production blocker; controller=MarketController; correlation=none
- GET /api/migrationpathways/active -> 500; cause=missing DB table; priority=production blocker; controller=MigrationPathwaysController; correlation=none
- GET /api/migrationpathways/health -> 500; cause=missing DB table; priority=production blocker; controller=MigrationPathwaysController; correlation=none
- GET /api/monitoring/report -> 500; cause=missing DB table; priority=production blocker; controller=MonitoringController; correlation=none
- GET /api/monitoring/health -> 500; cause=missing DB table; priority=production blocker; controller=MonitoringController; correlation=none
- GET /api/monitoring/health/detailed -> 500; cause=missing DB table; priority=production blocker; controller=MonitoringController; correlation=none
- GET /api/monitoring/alerts -> 500; cause=missing DB table; priority=production blocker; controller=MonitoringController; correlation=none
- GET /api/monitoring/performance -> 500; cause=missing DB table; priority=production blocker; controller=MonitoringController; correlation=none
- GET /api/monitoring/metrics -> 500; cause=missing DB table; priority=production blocker; controller=MonitoringController; correlation=none
- GET /api/monitoring/metrics/history -> 500; cause=missing DB table; priority=production blocker; controller=MonitoringController; correlation=none
- GET /api/monitoring/metrics/statistics -> 500; cause=missing DB table; priority=production blocker; controller=MonitoringController; correlation=none
- GET /api/monitoring/status -> 500; cause=missing DB table; priority=production blocker; controller=MonitoringController; correlation=none
- GET /api/parcels/open-work -> 400; cause=unknown; priority=production blocker; controller=OpenWorkQueueController; correlation=tf-b9e1f1bb53d3435b99fed5da1c7db7ed
- GET /api/pilot/drafts -> 400; cause=not applicable to dev39; priority=production blocker; controller=PilotController; correlation=tf-5c5030a8cc264d219e97356d519bac2c
- GET /api/playground/scenarios -> 500; cause=missing DB table; priority=module blocker; controller=PlaygroundController; correlation=none
- GET /api/production/pacs/ciaps/properties -> 500; cause=missing DB table; priority=production blocker; controller=ProductionPACSIntegrationController; correlation=none
- GET /api/production/pacs/building-permits -> 500; cause=missing DB table; priority=production blocker; controller=ProductionPACSIntegrationController; correlation=none
- GET /api/production/pacs/analytics/historical-patterns -> 500; cause=missing DB table; priority=production blocker; controller=ProductionPACSIntegrationController; correlation=none
- GET /api/production/pacs/status/comprehensive -> 500; cause=missing DB table; priority=production blocker; controller=ProductionPACSIntegrationController; correlation=none
- GET /api/propertyvaluation/health -> 500; cause=missing DB table; priority=production blocker; controller=PropertyValuationController; correlation=none
- GET /api/levy/public/tax-estimate -> 400; cause=unknown; priority=module blocker; controller=PublicLevyPortalController; correlation=tf-d3853e8b7ac74738a30035f6f9f752c4
- GET /api/realdata/connection-status -> 500; cause=missing DB table; priority=production blocker; controller=RealDataController; correlation=none
- GET /api/realdata/property-stats -> 500; cause=missing DB table; priority=production blocker; controller=RealDataController; correlation=none
- GET /api/realdata/properties -> 500; cause=missing DB table; priority=production blocker; controller=RealDataController; correlation=none
- GET /api/realdata/permits -> 500; cause=missing DB table; priority=production blocker; controller=RealDataController; correlation=none
- GET /api/realdata/database-health -> 500; cause=missing DB table; priority=production blocker; controller=RealDataController; correlation=none
- GET /api/realdata/health -> 500; cause=missing DB table; priority=production blocker; controller=RealDataController; correlation=none
- GET /api/research/cross-workspace -> 500; cause=missing DB table; priority=production blocker; controller=ResearchAnalyticsController; correlation=none
- GET /api/research/sync-status -> 500; cause=missing DB table; priority=module blocker; controller=ResearchAnalyticsController; correlation=none
- GET /api/salesaudit/strata -> 400; cause=not applicable to dev39; priority=production blocker; controller=SalesAuditController; correlation=tf-e434562ef8e74f7c99475aa78eb4dc12
- GET /api/spatial-analytics/hotspots -> 500; cause=missing DB table; priority=production blocker; controller=SpatialAnalyticsController; correlation=none
- GET /api/swarmintelligence/status -> 500; cause=missing DB table; priority=production blocker; controller=SwarmIntelligenceController; correlation=none
- GET /api/sync/comps/eligible -> 400; cause=not applicable to dev39; priority=module blocker; controller=SyncController; correlation=tf-906129a727254f86867db4b3f5fd6d0d
- GET /api/sync/active-workbook -> 400; cause=not applicable to dev39; priority=module blocker; controller=SyncController; correlation=tf-c771e27d2035474ab873e43f27823ab2
- GET /api/sync/comps/stale -> 400; cause=not applicable to dev39; priority=module blocker; controller=SyncController; correlation=tf-5a093bad1f774ebb8cb5aaa62e5ef6e3
- GET /api/sync/comps/stale/summary -> 400; cause=not applicable to dev39; priority=module blocker; controller=SyncController; correlation=tf-e9e4c5a449d54c8791af73eebafc77d6
- GET /api/terraforge/sale-qualification -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-f0f5a51222c044f38b1cb8eac6b0125b
- GET /api/terraforge/sale-qualification/running-stats -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-5656cca2bad541de8d8225544eaf4283
- GET /api/terraforge/sale-qualification/neighborhood-stats -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-c8f3ff7b5fcb4f8a8cab3378ef16d0c3
- GET /api/terraforge/sale-qualification/code-audit -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-e133b7a15acb4c17bd2a245fe4bffa7f
- GET /api/terraforge/ratio-study -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-73eeda2987e842d19a31e9e5c32a85e8
- GET /api/terraforge/comps-pool -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-4f64d3499db74cd69e604437f62da716
- GET /api/terraforge/regression -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-a4ecf736a5084382b1c5ba6b883164b3
- GET /api/terraforge/county-stats -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-a78ae289a5de44ca850cd419bccc7118
- GET /api/terraforge/ratio-study/trends -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-d66d4316ce124b99b8fbed7a11a4549f
- GET /api/terraforge/ratio-study/stratified -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-afcdc73749714e9dade9e8255efd77ea
- GET /api/terraforge/ratio-study/confidence-intervals -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-a08ea26db00a44d6863b61a9b5c8bbd3
- GET /api/terraforge/ratio-study/vertical-equity -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-d21ebe83f45c4d949b20c584ebafcfd7
- GET /api/terraforge/ratio-study/influence-diagnostics -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-5c05ff327c3f4ac5bb05320d831d6a01
- GET /api/terraforge/ratio-study/time-trend -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-0cb821ee843b453cbe48c89194d8a399
- GET /api/terraforge/ratio-study/spatial-autocorrelation -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-b3aff7b31eed4a2bac5a5755baedfc08
- GET /api/terraforge/ratio-study/hedonic-regression -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-a47ed6e2b26b4a77a89e6803c2d257c2
- GET /api/terraforge/ratio-study/variance-decomposition -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-2cec897500c2468192bce1f31da85bcc
- GET /api/terraforge/ratio-study/sale-chasing -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-49b401ab6f16413c82f3886bd7e6a376
- GET /api/terraforge/ratio-study/cross-validation -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-f57468ae5cd044bd81bd52a8f597ad6d
- GET /api/terraforge/ratio-study/ks-shift-test -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-76d45d9b5e1b43799407ba2a9aadc4ca
- GET /api/terraforge/ratio-study/driver-analysis -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-98855461018943d9b37e90ae26a9671d
- GET /api/terraforge/comparison-snapshots -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-cadd42db962b433cad1b5acc01b09478
- GET /api/sales -> 400; cause=not applicable to dev39; priority=production blocker; controller=TfSalesController; correlation=tf-2bb96aa0a06f4f51ad0d53fa022e8ff1
- GET /api/timeseries/market -> 500; cause=missing DB table; priority=production blocker; controller=TimeseriesController; correlation=none
- GET /api/valuationagent/status -> 500; cause=missing DB table; priority=production blocker; controller=ValuationAgentController; correlation=none
- GET /api/what-if-scenarios -> 500; cause=missing DB table; priority=production blocker; controller=WhatIfScenariosController; correlation=none
- GET /api/sync/workbench/f/quarantine/imprv-attr -> 500; cause=missing DB table; priority=module blocker; controller=WorkbenchFController; correlation=none
- GET /api/sync/workbench/g/commits -> 500; cause=missing DB table; priority=module blocker; controller=WorkbenchGController; correlation=none
- GET /api/workbench/sync-readiness -> 400; cause=not applicable to dev39; priority=module blocker; controller=WorkbenchSyncReadinessController; correlation=tf-976a356e7b9247a690337a800eed5afa

## Hard Stop

Classification only. No endpoint fixes, no production binding, no DB mutation.

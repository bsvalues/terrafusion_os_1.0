# Endpoint Matrix Triage Wave 1

- Generated: 2026-05-31T19:16:09.771Z
- Verdict: TRIAGE_ONLY_NO_FIXES
- Reprobe enabled: true
- Production binding touched: false
- DB mutation touched: false
- Feature fixes touched: false
- Packet hash: fa3ef016f193dfbd2702ff167d2c13ebb16522ed9bb7e5acf93c2b30f35d2af9

## Summary

| Metric | Count |
| --- | ---: |
| Broken GET endpoints triaged | 166 |

## Likely Cause Counts

- missing DB table: 116
- not applicable to dev39: 45
- unknown: 5

## Priority Counts

- production blocker: 128
- module blocker: 38

## Status Code Counts

- 400: 47
- 500: 118
- 503: 1

## Broken Endpoint Triage

- GET /api/adjustment/proposals -> 500; cause=missing DB table; priority=production blocker; controller=AdjustmentController; correlation=none
- GET /api/adjustment/sets -> 500; cause=missing DB table; priority=production blocker; controller=AdjustmentController; correlation=none
- GET /api/adjustment/runs -> 500; cause=missing DB table; priority=production blocker; controller=AdjustmentController; correlation=none
- GET /api/adjustment/recommend -> 400; cause=not applicable to dev39; priority=production blocker; controller=AdjustmentController; correlation=tf-24e3c21a3cb14d6d9d1f40752ab59651
- GET /api/aiorchestration/health -> 500; cause=missing DB table; priority=production blocker; controller=AIOrchestrationController; correlation=none
- GET /api/aiorchestration/performance-analytics -> 500; cause=missing DB table; priority=production blocker; controller=AIOrchestrationController; correlation=none
- GET /api/aisuperiority/swarm/status -> 500; cause=missing DB table; priority=production blocker; controller=AISuperiorityController; correlation=none
- GET /api/aisuperiority/performance/comparison -> 500; cause=missing DB table; priority=production blocker; controller=AISuperiorityController; correlation=none
- GET /api/aisuperiority/scenarios -> 500; cause=missing DB table; priority=production blocker; controller=AISuperiorityController; correlation=none
- GET /api/aisuperiority/battalions -> 500; cause=missing DB table; priority=production blocker; controller=AISuperiorityController; correlation=none
- GET /api/atlas/gis/geocode -> 500; cause=missing DB table; priority=module blocker; controller=AtlasGisController; correlation=none
- GET /api/atlas/gis/spatial-query -> 500; cause=missing DB table; priority=module blocker; controller=AtlasGisController; correlation=none
- GET /api/levy/v1/banked-capacity -> 400; cause=not applicable to dev39; priority=module blocker; controller=BankedCapacityController; correlation=tf-8f5b374ebfd347438c7f6d4e846cf833
- GET /api/levy/budget/visualization -> 500; cause=missing DB table; priority=module blocker; controller=BudgetImpactController; correlation=none
- GET /api/levy/budget/scenarios -> 500; cause=missing DB table; priority=module blocker; controller=BudgetImpactController; correlation=none
- GET /api/costforge/data-quality/canonical -> 400; cause=not applicable to dev39; priority=production blocker; controller=CanonicalDataQualityController; correlation=tf-35dfde6bafb24efaa212423d08c5e0bc
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
- GET /api/costforge/traces -> 400; cause=not applicable to dev39; priority=production blocker; controller=CostForgeController; correlation=tf-0dcf132617924a61a1cc7666f6f5315a
- GET /api/county-study/studies -> 400; cause=not applicable to dev39; priority=production blocker; controller=CountyStudyController; correlation=tf-a8f1ab9b891b48c3a7c819f38123dd63
- GET /api/dataquality/report -> 500; cause=missing DB table; priority=production blocker; controller=DataQualityController; correlation=none
- GET /api/dataquality/issues -> 500; cause=missing DB table; priority=production blocker; controller=DataQualityController; correlation=none
- GET /api/sync/doctrine/policy/ratio -> 500; cause=missing DB table; priority=module blocker; controller=DoctrinePolicyController; correlation=none
- GET /api/sync/doctrine/policy/ratio/evaluate -> 400; cause=not applicable to dev39; priority=module blocker; controller=DoctrinePolicyController; correlation=tf-b075adcf4fb843279da12ba1da788b01
- GET /api/sync/doctrine/policy/universe -> 500; cause=missing DB table; priority=module blocker; controller=DoctrinePolicyController; correlation=none
- GET /api/sync/doctrine/policy/universe/classify -> 400; cause=not applicable to dev39; priority=module blocker; controller=DoctrinePolicyController; correlation=tf-1c98518733b64ea19ad72c18e66e9761
- GET /api/sync/doctrine/policy/universe/attribute-dictionary -> 500; cause=missing DB table; priority=module blocker; controller=DoctrinePolicyController; correlation=none
- GET /api/sync/doctrine/policy/sales-qualification -> 500; cause=missing DB table; priority=module blocker; controller=DoctrinePolicyController; correlation=none
- GET /api/sync/doctrine/policy/sales-qualification/audit -> 500; cause=missing DB table; priority=module blocker; controller=DoctrinePolicyController; correlation=none
- GET /api/sync/doctrine/state -> 500; cause=missing DB table; priority=module blocker; controller=DoctrineStatusController; correlation=tf-9e00c84c86ef435d9626f7db69e05603
- GET /api/sync/doctrine/lanes -> 500; cause=missing DB table; priority=module blocker; controller=DoctrineStatusController; correlation=tf-2148a3a779714e118864d79e4d6f4225
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
- GET /api/equity/metrics -> 400; cause=not applicable to dev39; priority=production blocker; controller=EquityController; correlation=tf-c31d7e642d214896831468455c6870ab
- GET /api/equity/rollup -> 400; cause=not applicable to dev39; priority=production blocker; controller=EquityController; correlation=tf-6e414f86bed045e69c2b8cac546055c2
- GET /api/fismacompliance/status -> 500; cause=missing DB table; priority=production blocker; controller=FISMAComplianceController; correlation=none
- GET /api/fismacompliance/missing-controls -> 500; cause=missing DB table; priority=production blocker; controller=FISMAComplianceController; correlation=none
- GET /api/fismacompliance/metrics -> 500; cause=missing DB table; priority=production blocker; controller=FISMAComplianceController; correlation=none
- GET /api/fismacompliance/dashboard -> 500; cause=missing DB table; priority=production blocker; controller=FISMAComplianceController; correlation=none
- GET /api/fismacompliance/export -> 500; cause=missing DB table; priority=production blocker; controller=FISMAComplianceController; correlation=none
- GET /api/geoforge/ratio-study/neighborhood-stats -> 500; cause=missing DB table; priority=production blocker; controller=GeoForgeController; correlation=none
- GET /api/geoforge/ratio-study/sales -> 500; cause=missing DB table; priority=production blocker; controller=GeoForgeController; correlation=none
- GET /api/geoforge/ratio-study/diagnosis -> 400; cause=not applicable to dev39; priority=production blocker; controller=GeoForgeController; correlation=tf-d9c0b1c0cb094c9faa402a10e857bf9f
- GET /api/geoforge/ratio-study/export -> 500; cause=missing DB table; priority=production blocker; controller=GeoForgeController; correlation=none
- GET /api/geoforge/ratio-study/monthly-trend -> 500; cause=missing DB table; priority=production blocker; controller=GeoForgeController; correlation=none
- GET /api/geoforge/certification/summary -> 500; cause=missing DB table; priority=production blocker; controller=GeoForgeController; correlation=none
- GET /api/geoforge/parcel/search -> 400; cause=not applicable to dev39; priority=production blocker; controller=GeoForgeController; correlation=tf-2a4bb081513f4c4d936d6c106e161adc
- GET /api/geoforge/sales/outliers -> 500; cause=missing DB table; priority=production blocker; controller=GeoForgeController; correlation=none
- GET /api/geoforge/neighborhoods/boundaries -> 500; cause=missing DB table; priority=production blocker; controller=GeoForgeController; correlation=none
- GET /api/geoforge/neighborhoods/av-change -> 500; cause=missing DB table; priority=production blocker; controller=GeoForgeController; correlation=none
- GET /api/geoforge/v2/neighborhoods/outline -> 500; cause=missing DB table; priority=production blocker; controller=GeoForgeController; correlation=none
- GET /api/gis/geocode -> 500; cause=missing DB table; priority=production blocker; controller=GisController; correlation=none
- GET /api/gis/parcels/spatial -> 500; cause=missing DB table; priority=production blocker; controller=GisController; correlation=none
- GET /api/gis/layers -> 500; cause=missing DB table; priority=production blocker; controller=GisController; correlation=none
- GET /api/gis/proximity -> 500; cause=missing DB table; priority=production blocker; controller=GisController; correlation=none
- GET /api/compliance/certification -> 503; cause=unknown; priority=module blocker; controller=GovernmentComplianceController; correlation=tf-19a76a0819094587a1560bbe0b981107
- GET /api/gpt -> 500; cause=unknown; priority=production blocker; controller=GPTController; correlation=tf-d4717633645c49ac97fe5e604cd045a9
- GET /api/gpt/search -> 400; cause=not applicable to dev39; priority=production blocker; controller=GPTController; correlation=tf-c26e9dae05bb49919309ded9d12a41ad
- GET /api/gpt/conversations -> 500; cause=unknown; priority=production blocker; controller=GPTController; correlation=tf-619bd1ee942746aa814c8cc7475624d4
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
- GET /api/levy/calculate -> 400; cause=not applicable to dev39; priority=module blocker; controller=LevyController; correlation=tf-8eca1376559d4dd89a8f08c0feeba3c7
- GET /api/levy/dashboard/summary -> 500; cause=missing DB table; priority=module blocker; controller=LevyDashboardController; correlation=none
- GET /api/levy/dashboard/metrics -> 500; cause=missing DB table; priority=module blocker; controller=LevyDashboardController; correlation=none
- GET /api/levy/dashboard/districts-overview -> 500; cause=missing DB table; priority=module blocker; controller=LevyDashboardController; correlation=none
- GET /api/levy/data/districts -> 500; cause=missing DB table; priority=module blocker; controller=LevyDataManagementController; correlation=none
- GET /api/levy/v1/data-quality/district-risk-summary -> 500; cause=missing DB table; priority=module blocker; controller=LevyDataQualityController; correlation=none
- GET /api/levy/forecast/dashboard -> 500; cause=missing DB table; priority=module blocker; controller=LevyForecastController; correlation=none
- GET /api/levy/forecast/compare -> 400; cause=not applicable to dev39; priority=module blocker; controller=LevyForecastController; correlation=tf-24df5a87e8344bc89278349649b32ad1
- GET /api/levy/search/search -> 400; cause=not applicable to dev39; priority=module blocker; controller=LevySearchController; correlation=tf-982c70bbca3d4d93975ad023561b30e8
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
- GET /api/parcels/open-work -> 400; cause=unknown; priority=production blocker; controller=OpenWorkQueueController; correlation=tf-28812ade76674fe3bd8cf1e76d9b328b
- GET /api/pilot/drafts -> 400; cause=not applicable to dev39; priority=production blocker; controller=PilotController; correlation=tf-e2825d17d91344b39ff5a888c3ea3c6f
- GET /api/playground/scenarios -> 500; cause=missing DB table; priority=module blocker; controller=PlaygroundController; correlation=none
- GET /api/production/pacs/ciaps/properties -> 500; cause=missing DB table; priority=production blocker; controller=ProductionPACSIntegrationController; correlation=none
- GET /api/production/pacs/building-permits -> 500; cause=missing DB table; priority=production blocker; controller=ProductionPACSIntegrationController; correlation=none
- GET /api/production/pacs/analytics/historical-patterns -> 500; cause=missing DB table; priority=production blocker; controller=ProductionPACSIntegrationController; correlation=none
- GET /api/production/pacs/status/comprehensive -> 500; cause=missing DB table; priority=production blocker; controller=ProductionPACSIntegrationController; correlation=none
- GET /api/propertyvaluation/health -> 500; cause=missing DB table; priority=production blocker; controller=PropertyValuationController; correlation=none
- GET /api/levy/public/tax-estimate -> 400; cause=unknown; priority=module blocker; controller=PublicLevyPortalController; correlation=tf-5fb4243e5b0b4826a615cab11d1a3c65
- GET /api/realdata/connection-status -> 500; cause=missing DB table; priority=production blocker; controller=RealDataController; correlation=none
- GET /api/realdata/property-stats -> 500; cause=missing DB table; priority=production blocker; controller=RealDataController; correlation=none
- GET /api/realdata/properties -> 500; cause=missing DB table; priority=production blocker; controller=RealDataController; correlation=none
- GET /api/realdata/permits -> 500; cause=missing DB table; priority=production blocker; controller=RealDataController; correlation=none
- GET /api/realdata/database-health -> 500; cause=missing DB table; priority=production blocker; controller=RealDataController; correlation=none
- GET /api/realdata/health -> 500; cause=missing DB table; priority=production blocker; controller=RealDataController; correlation=none
- GET /api/research/cross-workspace -> 500; cause=missing DB table; priority=production blocker; controller=ResearchAnalyticsController; correlation=none
- GET /api/research/sync-status -> 500; cause=missing DB table; priority=module blocker; controller=ResearchAnalyticsController; correlation=none
- GET /api/salesaudit/strata -> 400; cause=not applicable to dev39; priority=production blocker; controller=SalesAuditController; correlation=tf-4e664ead931845469ea3d518db04f9cf
- GET /api/spatial-analytics/hotspots -> 500; cause=missing DB table; priority=production blocker; controller=SpatialAnalyticsController; correlation=none
- GET /api/swarmintelligence/status -> 500; cause=missing DB table; priority=production blocker; controller=SwarmIntelligenceController; correlation=none
- GET /api/sync/comps/eligible -> 400; cause=not applicable to dev39; priority=module blocker; controller=SyncController; correlation=tf-7292708c7c914a5280f18e10732873f1
- GET /api/sync/active-workbook -> 400; cause=not applicable to dev39; priority=module blocker; controller=SyncController; correlation=tf-06a86c41b49d4de9a7975ae6d57ce8da
- GET /api/sync/comps/stale -> 400; cause=not applicable to dev39; priority=module blocker; controller=SyncController; correlation=tf-f0a6f4ac5acf4355882b8db832bff7db
- GET /api/sync/comps/stale/summary -> 400; cause=not applicable to dev39; priority=module blocker; controller=SyncController; correlation=tf-4625ecac8ce74f429e60bb61137ba571
- GET /api/terraforge/sale-qualification -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-dbeef5b1a6ce4ae2bc49d5a766eb381b
- GET /api/terraforge/sale-qualification/running-stats -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-287d5d20cf854fd387265e8df8180d00
- GET /api/terraforge/sale-qualification/neighborhood-stats -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-1cdcafe2cde146268c89838e7d73cc93
- GET /api/terraforge/sale-qualification/code-audit -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-99b8fe1453344352b543409250924bd5
- GET /api/terraforge/ratio-study -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-c01732ae2a1249f4999d0716e03b2bc2
- GET /api/terraforge/comps-pool -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-b4688b91606148d0897ffa46aff1c5e5
- GET /api/terraforge/regression -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-814317f6f43347b3a31816821c4013ba
- GET /api/terraforge/county-stats -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-a203daf17f1a42f5a89bfd0991cb6ffc
- GET /api/terraforge/ratio-study/trends -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-685a674dccd948b181b8da2167a24515
- GET /api/terraforge/ratio-study/stratified -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-41f8647f4b4f4bcbb1f041c0fc7060ce
- GET /api/terraforge/ratio-study/confidence-intervals -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-4039ed14bf84488aaa06c11cc358615d
- GET /api/terraforge/ratio-study/vertical-equity -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-a15ce3c4a42d4efeaf3521893879e0d1
- GET /api/terraforge/ratio-study/influence-diagnostics -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-76b306fa3f9a4d42baeec95aa6643946
- GET /api/terraforge/ratio-study/time-trend -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-0c63dcabd21d45acb2463c66fd6938ad
- GET /api/terraforge/ratio-study/spatial-autocorrelation -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-1e338ace7eb0406d83bd87cf020c8c86
- GET /api/terraforge/ratio-study/hedonic-regression -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-503739f246ae4da0b63525c6e384f1fe
- GET /api/terraforge/ratio-study/variance-decomposition -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-0f70852946ff4cae9e803b46d41e0802
- GET /api/terraforge/ratio-study/sale-chasing -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-594dbba19ad24be78bacd8ebc6e1d55b
- GET /api/terraforge/ratio-study/cross-validation -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-c4f1f8afcf1f49638f730ec10a3e490f
- GET /api/terraforge/ratio-study/ks-shift-test -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-00b7592efafa40c2a482743331ca60e8
- GET /api/terraforge/ratio-study/driver-analysis -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-60c1ce3132d64b51a9b2e6277c5ce7d7
- GET /api/terraforge/comparison-snapshots -> 400; cause=not applicable to dev39; priority=production blocker; controller=TerraForgeController; correlation=tf-66b04877833642dbbf91ef0094ee16e3
- GET /api/sales -> 400; cause=not applicable to dev39; priority=production blocker; controller=TfSalesController; correlation=tf-5fd35bdaf316462a90a7d81003393352
- GET /api/timeseries/market -> 500; cause=missing DB table; priority=production blocker; controller=TimeseriesController; correlation=none
- GET /api/valuationagent/status -> 500; cause=missing DB table; priority=production blocker; controller=ValuationAgentController; correlation=none
- GET /api/what-if-scenarios -> 500; cause=missing DB table; priority=production blocker; controller=WhatIfScenariosController; correlation=none
- GET /api/sync/workbench/f/quarantine/imprv-attr -> 500; cause=missing DB table; priority=module blocker; controller=WorkbenchFController; correlation=none
- GET /api/sync/workbench/g/commits -> 500; cause=missing DB table; priority=module blocker; controller=WorkbenchGController; correlation=none
- GET /api/workbench/sync-readiness -> 400; cause=not applicable to dev39; priority=module blocker; controller=WorkbenchSyncReadinessController; correlation=tf-d13409c5928744c68e2d7d8da8a1ab85

## Hard Stop

Classification only. No endpoint fixes, no production binding, no DB mutation.

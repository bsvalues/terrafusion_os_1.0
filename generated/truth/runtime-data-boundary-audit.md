# Runtime Data Boundary Audit

Generated: 2026-05-02T05:47:16.592Z

Passed: **yes**

## Summary

- Product endpoints scanned: 36
- Sync/admin/test endpoints scanned: 7
- Product legacy violations: 0
- Product canonical endpoints: 26
- Product unproven truth-bearing endpoints: 0
- Product unproven non-blocking endpoints: 10
- Active frontend legacy terminology violations: 0
- Deferred/package frontend legacy terminology warnings: 60

## Product Runtime Endpoints

| File | Routes | Relevance | Source Class | Direct Legacy Terms | Route Legacy Terms | Legacy/Provenance Terms | Canonical Terms | Blockers | Warnings |
|---|---|---|---|---|---|---|---|---|---|
`backend/src/TerraFusion.AI/Controllers/SystemGptAtlasAnomalyController.cs` | `api/gpt/system/atlas/anomalies`<br>`summary`<br>`{countyId}/summary` | operational_diagnostic_state | unproven | - | - | - | - | - | No TerraFusion canonical/runtime data evidence; classified as operational_diagnostic_state, not an active county data-truth endpoint.
`backend/src/TerraFusion.AI/Controllers/SystemGptAtlasForecastController.cs` | `api/gpt/system/atlas/forecasts`<br>`summary` | operational_diagnostic_state | unproven | - | - | - | - | - | No TerraFusion canonical/runtime data evidence; classified as operational_diagnostic_state, not an active county data-truth endpoint.
`backend/src/TerraFusion.API/Controllers/AIModulesController.cs` | `api/[controller]`<br>`status`<br>`modules`<br>`execute`<br>`{moduleName}/start`<br>`{moduleName}/stop`<br>`revenue/hunt`<br>`mcp/orchestrate`<br>`predict-cost`<br>`metrics` | ai_orchestration_or_reference | unproven | - | - | - | - | - | No TerraFusion canonical/runtime data evidence; classified as ai_orchestration_or_reference, not an active county data-truth endpoint.
`backend/src/TerraFusion.API/Controllers/AnalyticsController.cs` | `api/[controller]`<br>`market`<br>`trends`<br>`regional-comparison`<br>`building-type-comparison`<br>`property/{parcelId}`<br>`time-series`<br>`cost-breakdown`<br>`regional-costs`<br>`hierarchical-costs`<br>`statistical-correlations` | truth_bearing_runtime | terrafusion_canonical | - | - | - | `assessment`<br>`parcel`<br>`TerraFusionDbContext` | - | -
`backend/src/TerraFusion.API/Controllers/AtlasController.cs` | `api/atlas`<br>`layers`<br>`parcels/search`<br>`zoning`<br>`flood-zones`<br>`stats`<br>`parcels/{parcelId}`<br>`parcels/{parcelId}/layers`<br>`arcgis-layers`<br>`benton/service-endpoints`<br>`benton/reference`<br>`parcels/{parcelId}/arcgis`<br>`arcgis/query/parcel/{parcelId}`<br>`mass-appraisal/parcels`<br>`geo-equity/areas`<br>`geometry-health`<br>`arcgis/query/search`<br>`arcgis/taxing-districts`<br>`arcgis/city-boundaries`<br>`arcgis/flood-zone/{parcelId}`<br>`arcgis/neighboring-parcels/{parcelId}`<br>`arcgis/query/spatial`<br>`arcgis/layer-configs`<br>`arcgis/field-mapping`<br>`arcgis/convert-coordinates`<br>`parcels/{parcelId}/geometry`<br>`parcels/{parcelId}/spatial-profile`<br>`map/identify`<br>`parcels/{parcelId}/district-membership`<br>`zoning/{code}/details`<br>`map/valuation-heat-map`<br>`map/selection`<br>`map/basemaps`<br>`map/bookmarks`<br>`map/parcel-comparison`<br>`map/measurement-tools`<br>`spatial` | truth_bearing_runtime | terrafusion_canonical | - | - | - | `assessment`<br>`canonical`<br>`Parcel`<br>`TerraFusionDbContext` | - | -
`backend/src/TerraFusion.API/Controllers/AtlasGisController.cs` | `api/atlas/gis`<br>`geocode`<br>`spatial-query`<br>`layers/{layerName}/features`<br>`upload-shapefile`<br>`parcels/{parcelId}/boundary`<br>`parcels/{parcelId}/layers`<br>`parcels/{parcelId}` | truth_bearing_runtime | terrafusion_canonical | - | - | `PACS` | `Parcel` | - | Legacy/provenance terminology detected without direct source dependency evidence.
`backend/src/TerraFusion.API/Controllers/BenchmarkingController.cs` | `api/[controller]`<br>`counties`<br>`statistical-data`<br>`regional-costs`<br>`hierarchical-costs`<br>`ratio-study` | demo_reference_static | unproven | - | - | `PACS` | - | - | No TerraFusion canonical/runtime data evidence; classified as demo_reference_static, not an active county data-truth endpoint.<br>Legacy/provenance terminology detected without direct source dependency evidence.
`backend/src/TerraFusion.API/Controllers/CalibrationDiagnosticController.cs` | `api/[controller]`<br>`run`<br>`findings`<br>`findings/{id:int}/resolve`<br>`summary`<br>`findings/{id:int}/flag-to-workbench`<br>`reval-area-summary`<br>`parcel-evidence`<br>`simulate`<br>`solve-for-rate`<br>`stratified-equity`<br>`outlier-exclusions` | truth_bearing_runtime | terrafusion_canonical | - | - | - | `parcel`<br>`TerraFusionDbContext` | - | -
`backend/src/TerraFusion.API/Controllers/CanonicalDataQualityController.cs` | `api/costforge/data-quality`<br>`canonical` | truth_bearing_runtime | terrafusion_canonical | - | - | - | `assessment`<br>`canonical` | - | -
`backend/src/TerraFusion.API/Controllers/CostForgeController.cs` | `api/[controller]`<br>`calculate`<br>`batch-calculate`<br>`{propertyId}/breakdown`<br>`compare/{propertyId1}/{propertyId2}`<br>`{propertyId}/forecast`<br>`factors/{region}`<br>`matrix`<br>`status`<br>`agents/status`<br>`agents/scale`<br>`metrics`<br>`sync/source-status`<br>`cost-estimate`<br>`cost-matrix/benton`<br>`depreciation-schedule`<br>`depreciation-calculate`<br>`income-approach/cap-rates`<br>`income-approach/market-data/benton`<br>`income-approach/expense-ratios`<br>`income-approach/location-premiums/benton`<br>`income-approach/calculate-noi`<br>`income-approach/calculate-valuation`<br>`sales-comparison/adjustment-factors`<br>`sales-comparison/market-areas/benton`<br>`sales-comparison/confidence-thresholds`<br>`sales-comparison/adjust-comparable`<br>`sales-comparison/reconcile`<br>`valuation-reconciliation/weight-guidelines`<br>`valuation-reconciliation/reconcile`<br>`valuation-lineage/depreciation-model`<br>`valuation-lineage/land-rates/benton`<br>`valuation-lineage/site-improvements`<br>`valuation-lineage/compute-full`<br>`valuations`<br>`valuations/{id:guid}`<br>`parcels/{parcelId}/valuations`<br>`valuations/{id:guid}/status`<br>`valuations/{id:guid}/certify`<br>`comparables`<br>`parcels/{parcelId}/comparables`<br>`characteristics`<br>`parcels/{parcelId}/characteristics`<br>`models/{modelId}`<br>`comps/{subjectId}`<br>`building-types`<br>`regions`<br>`neighborhoods`<br>`calibration/neighborhood-matrix`<br>`calibration/mass-adjust-preview`<br>`ratio-study/by-stratum`<br>`quality-grades`<br>`condition-grades`<br>`feature-factors`<br>`cost-breakdown`<br>`analytics/bayesian`<br>`analytics/bayesian/{id:guid}`<br>`analytics/montecarlo`<br>`analytics/montecarlo/{id:guid}`<br>`analytics/montecarlo/history`<br>`analytics/regression`<br>`analytics/regression/{id:guid}`<br>`analytics/regression/{id:guid}/diagnostics`<br>`analytics/regression/history`<br>`analytics/spatial/moran`<br>`analytics/spatial/geary`<br>`analytics/spatial/{id:guid}`<br>`analytics/spatial/history`<br>`analytics/market/comparable-sales`<br>`analytics/market/time-trend`<br>`analytics/market/ratio-study`<br>`analytics/market/{id:int}`<br>`analytics/market/history`<br>`analytics/rcw/84-34`<br>`analytics/rcw/84-26`<br>`analytics/rcw/84-36-381`<br>`analytics/rcw/{id:int}`<br>`analytics/rcw/history`<br>`analytics/levy/calculate`<br>`analytics/levy/balance-test`<br>`analytics/levy/{id}/certify`<br>`analytics/levy/{id}`<br>`analytics/levy/history`<br>`analytics/data-quality/assess`<br>`analytics/data-quality/{id}`<br>`analytics/data-quality/history`<br>`analytics/etl/sync`<br>`analytics/etl/{id}`<br>`analytics/etl/history`<br>`analytics/ml/predict`<br>`analytics/ml/{id}`<br>`analytics/ml/history`<br>`pipeline/start`<br>`pipeline/{id}`<br>`pipeline/history`<br>`dashboard-stats`<br>`neighborhoods/{hoodCd}/parcels`<br>`traces`<br>`improvement-type-codes`<br>`schedule`<br>`effective-age`<br>`depreciation/calculate`<br>`calibration/mass-adjust-apply`<br>`batch/preview`<br>`batch/apply`<br>`batch/status/{jobId}`<br>`batch/cancel/{jobId}` | truth_bearing_runtime | terrafusion_canonical | - | - | `cama`<br>`Harris`<br>`PACS` | `assessment`<br>`CamaCharacteristics`<br>`CamaImprovementDetails`<br>`canonical`<br>`ComparableSales`<br>`parcel`<br>`runtime`<br>`TerraFusionDbContext` | - | Legacy/provenance terminology detected without direct source dependency evidence.
`backend/src/TerraFusion.API/Controllers/CountyRowsController.cs` | `api/counties/{countyToken}`<br>`parcels`<br>`sales`<br>`runtime-lineage` | truth_bearing_runtime | terrafusion_canonical | - | - | - | `ComparableSales`<br>`runtime`<br>`TerraFusionDbContext` | - | -
`backend/src/TerraFusion.API/Controllers/CountyStudyController.cs` | `api/county-study`<br>`studies`<br>`studies/{studyId:guid}/derive-segments`<br>`studies/{studyId:guid}`<br>`studies/{studyId:guid}/status`<br>`studies/{studyId:guid}/city-rollup`<br>`studies/{studyId:guid}/neighborhood-rollup`<br>`studies/{studyId:guid}/health-summary`<br>`studies/{studyId:guid}/statistics-compat`<br>`segments/{segmentId:guid}/detail`<br>`segments/{segmentId:guid}/action-context`<br>`segments/{segmentId:guid}/diagnosis`<br>`studies/{studyId:guid}/diagnosis`<br>`studies/{studyId:guid}/segment-sets`<br>`segment-sets/{segmentSetId:guid}/segments`<br>`cohorts`<br>`studies/{studyId:guid}/cohorts`<br>`cohorts/{cohortId:guid}`<br>`scenarios`<br>`studies/{studyId:guid}/scenarios`<br>`scenarios/{scenarioId:guid}`<br>`scenarios/{scenarioId:guid}/save`<br>`scenarios/{scenarioId:guid}/preview`<br>`scenarios/{scenarioIdA:guid}/compare`<br>`scenarios/promote`<br>`studies/{studyId:guid}/adjustment-sets`<br>`studies/{studyId:guid}/apply-handoff-receipts`<br>`adjustment-sets/{id:guid}/approval-state`<br>`adjustment-sets/{id:guid}/apply-handoff-receipt`<br>`adjustment-sets/{id:guid}/apply-handoff-receipt/status`<br>`exceptions`<br>`studies/{studyId:guid}/exceptions`<br>`exceptions/{id:guid}/status`<br>`exceptions/{id:guid}/assign`<br>`exceptions/{id:guid}/notes`<br>`studies/{studyId:guid}/downstream-receipts`<br>`exceptions/{id:guid}/downstream-receipt`<br>`segments/{segmentId:guid}/downstream-receipt`<br>`exceptions/{id:guid}/downstream-receipt/status`<br>`downstream-receipts/{receiptId:guid}/status`<br>`studies/{studyId:guid}/evidence-packet` | truth_bearing_runtime | terrafusion_canonical | - | - | - | `CamaCharacteristics`<br>`canonical`<br>`ComparableSales`<br>`parcel` | - | -
`backend/src/TerraFusion.API/Controllers/DossierController.cs` | `api/dossier`<br>`documents/search`<br>`documents/{id}`<br>`evidence/search`<br>`evidence/{evidenceId}/chain`<br>`stats`<br>`{parcelId}/notes`<br>`parcels/{parcelId}/casefile`<br>`{parcelId}`<br>`parcels/{parcelId}/details`<br>`parcels/{parcelId}/evidence`<br>`document-types`<br>`retention-schedule`<br>`evidence-categories`<br>`packet-templates`<br>`classify-document`<br>`parcels/{parcelId}/packet/{packetType}`<br>`documents`<br>`documents/persistent/{id}`<br>`documents/persistent/{id}/status`<br>`parcels/{parcelId}/documents`<br>`evidence`<br>`evidence/persistent/{id}`<br>`parcels/{parcelId}/evidence/persistent`<br>`evidence/persistent/{id}/custody`<br>`evidence/persistent/{id}/chain`<br>`packets`<br>`packets/{id}`<br>`parcels/{parcelId}/packets`<br>`notices/drafts`<br>`notices`<br>`appeals/{appealId}/drafts`<br>`boe/{caseId}/response-drafts`<br>`memos/drafts`<br>`boe/{caseId}/packet`<br>`{parcelId}/evidence` | truth_bearing_runtime | terrafusion_canonical | - | - | `CAMA` | `assessment`<br>`parcel`<br>`TerraFusionDbContext` | - | Legacy/provenance terminology detected without direct source dependency evidence.
`backend/src/TerraFusion.API/Controllers/EliteSystemReportController.cs` | `api/[controller]`<br>`mission-completion`<br>`agent-status`<br>`architecture-overview` | demo_or_advanced_not_v1 | unproven | - | - | - | - | - | No TerraFusion canonical/runtime data evidence; classified as demo_or_advanced_not_v1, not an active county data-truth endpoint.
`backend/src/TerraFusion.API/Controllers/EquityController.cs` | `api/equity`<br>`metrics`<br>`rollup`<br>`deciles`<br>`stratified-cod`<br>`condition-bias`<br>`segment-drift`<br>`grade-drift` | v1_deferred_equity | unproven | - | - | - | - | - | No TerraFusion canonical/runtime data evidence; classified as v1_deferred_equity, not an active county data-truth endpoint.
`backend/src/TerraFusion.API/Controllers/FieldController.cs` | `api/field`<br>`assignments`<br>`assignments/{id}/status`<br>`assignments/{id}/assessment-review-flag` | truth_bearing_runtime | terrafusion_canonical | - | - | - | `assessment`<br>`canonical`<br>`parcel`<br>`TerraFusionDbContext` | - | -
`backend/src/TerraFusion.API/Controllers/ForgeController.cs` | `api/forge`<br>`{parcelId}/years`<br>`{parcelId}/cost`<br>`{parcelId}/sales`<br>`{parcelId}/income`<br>`{parcelId}/reconciliation`<br>`cost/batch/preview`<br>`cost/batch/history`<br>`sales/{saleId}/qualification`<br>`sales/recompute-recommendations`<br>`{parcelId}/reconciliation/commit` | truth_bearing_runtime | terrafusion_canonical | - | - | `CAMA`<br>`PACS` | `ComparableSales`<br>`parcel`<br>`TerraFusionDbContext` | - | Legacy/provenance terminology detected without direct source dependency evidence.
`backend/src/TerraFusion.API/Controllers/GeoForgeController.cs` | `api/geoforge`<br>`ratio-study/neighborhood-stats`<br>`ratio-study/sales`<br>`ratio-study/diagnosis`<br>`ratio-study/gwr`<br>`ratio-study/export`<br>`ratio-study/csv`<br>`ratio-study/monthly-trend`<br>`certification/summary`<br>`parcel/search`<br>`parcel/{parcelNumber}/bloom`<br>`parcel/{parcelNumber}/comps`<br>`certification/print`<br>`sales/outliers`<br>`sales/{saleId}/qualification`<br>`neighborhoods/boundaries`<br>`stratification`<br>`neighborhoods/av-change`<br>`neighborhoods/sale-price-trend`<br>`ratio-study/county-trend`<br>`neighborhoods/ratio-drift`<br>`parcels/points` | truth_bearing_runtime | terrafusion_canonical | - | - | - | `assessment`<br>`ComparableSales`<br>`parcel`<br>`TerraFusionDbContext` | - | -
`backend/src/TerraFusion.API/Controllers/GeoForgeController.V2.cs` | `v2/parcels/tiles`<br>`v2/neighborhoods/outline`<br>`v2/audit/ranked`<br>`v2/mass-adjust/simulate` | truth_bearing_runtime | terrafusion_canonical | - | - | - | `ComparableSales`<br>`parcel` | - | -
`backend/src/TerraFusion.API/Controllers/GisController.cs` | `api/gis`<br>`geocode`<br>`parcels/spatial`<br>`parcels/{id}/boundary`<br>`layers`<br>`proximity` | truth_bearing_runtime | terrafusion_canonical | - | - | - | `parcel` | - | -
`backend/src/TerraFusion.API/Controllers/GPTController.cs` | `api/[controller]`<br>`system`<br>`featured`<br>`popular`<br>`search`<br>`{id}`<br>`conversations`<br>`conversations/{id}`<br>`{gptId}/conversations`<br>`conversations/{id}/history`<br>`conversations/{conversationId}/messages`<br>`conversations/{id}/archive`<br>`conversations/{id}/rate`<br>`{id}/statistics`<br>`statistics/county`<br>`rag/health`<br>`rag/index/{datasetId}`<br>`conversations/{conversationId}/trace`<br>`system/diagnostics`<br>`system/diagnostics/download`<br>`system/safe-mode`<br>`rag/benton-assessment-basics/export`<br>`system/events`<br>`system/metrics`<br>`system/federated-overview`<br>`system/policy`<br>`system/policy/evaluate`<br>`system/policy/all`<br>`system/fleet/rag-readiness`<br>`system/fleet/rag-readiness/{countyId}`<br>`system/atlas`<br>`system/atlas/live`<br>`system/atlas/live/snapshot`<br>`explain` | truth_bearing_runtime | terrafusion_canonical | - | - | `cama` | `assessment` | - | Legacy/provenance terminology detected without direct source dependency evidence.
`backend/src/TerraFusion.API/Controllers/LevyController.cs` | `api/levy`<br>`rates`<br>`tax-areas`<br>`calculate` | truth_bearing_runtime | terrafusion_canonical | - | - | `PACS` | `parcel`<br>`TerraFusionDbContext` | - | Legacy/provenance terminology detected without direct source dependency evidence.
`backend/src/TerraFusion.API/Controllers/MatrixVersionController.cs` | `api/[controller]`<br>`{id:int}`<br>`{id:int}/transition`<br>`{id:int}/rates`<br>`export/dor`<br>`export/audit`<br>`export/provenance`<br>`{id:int}/apply-adjustment` | truth_bearing_runtime | terrafusion_canonical | - | - | - | `TerraFusionDbContext` | - | -
`backend/src/TerraFusion.API/Controllers/PropertyValuationController.cs` | `api/[controller]`<br>`enhance`<br>`performance/{countyCode}`<br>`health`<br>`enhance/bulk` | truth_bearing_runtime | terrafusion_canonical | - | - | - | `assessment`<br>`Canonical`<br>`parcel`<br>`TerraFusionDbContext` | - | -
`backend/src/TerraFusion.API/Controllers/ResearchAnalyticsController.cs` | `api/research`<br>`initialize`<br>`analytics`<br>`models`<br>`cross-workspace`<br>`sync-status`<br>`train-model`<br>`predict`<br>`sync-cross-workspace` | demo_or_advanced_not_v1 | unproven | - | - | - | - | - | No TerraFusion canonical/runtime data evidence; classified as demo_or_advanced_not_v1, not an active county data-truth endpoint.
`backend/src/TerraFusion.API/Controllers/SalesAuditController.cs` | `api/[controller]`<br>`strata`<br>`strata/{stratumKey}/sales`<br>`strata/{stratumKey}/diagnosis`<br>`strata/{stratumKey}/diagnose`<br>`diagnose-county`<br>`sales/bulk-decision`<br>`strata/{stratumKey}/simulate`<br>`strata/{stratumKey}/propose-adjustment` | truth_bearing_runtime | terrafusion_canonical | - | - | - | `ComparableSales`<br>`TerraFusionDbContext` | - | -
`backend/src/TerraFusion.API/Controllers/ServiceRegistryController.cs` | `api/service-registry` | operational_control | unproven | - | - | - | - | - | No TerraFusion canonical/runtime data evidence; classified as operational_control, not an active county data-truth endpoint.
`backend/src/TerraFusion.API/Controllers/SpatialAnalyticsController.cs` | `api/spatial-analytics`<br>`autocorrelation`<br>`spatial-filter`<br>`features/{parcelId}`<br>`hotspots` | truth_bearing_runtime | terrafusion_canonical | - | - | - | `parcel` | - | -
`backend/src/TerraFusion.API/Controllers/SwarmController.cs` | `api/[controller]`<br>`status`<br>`modules`<br>`execute`<br>`modules/{moduleName}/start`<br>`modules/{moduleName}/stop`<br>`mcp-tools` | ai_orchestration_or_reference | terrafusion_canonical | - | - | - | `assessment`<br>`canonical`<br>`Parcel` | - | -
`backend/src/TerraFusion.API/Controllers/TerraForgeController.cs` | `api/terraforge`<br>`sale-qualification`<br>`sale-qualification/{saleId:guid}`<br>`sale-qualification/running-stats`<br>`sale-qualification/neighborhood-stats`<br>`sale-qualification/code-audit`<br>`ratio-study`<br>`comps-pool`<br>`regression`<br>`county-stats`<br>`compute-qualifications`<br>`apply-recommendations`<br>`sale-qualification/bulk`<br>`ratio-study/trends`<br>`ratio-study/stratified`<br>`ratio-study/confidence-intervals`<br>`ratio-study/vertical-equity`<br>`ratio-study/influence-diagnostics`<br>`ratio-study/time-trend`<br>`ratio-study/spatial-autocorrelation`<br>`ratio-study/hedonic-regression`<br>`ratio-study/variance-decomposition`<br>`ratio-study/sale-chasing`<br>`ratio-study/cross-validation`<br>`ratio-study/ks-shift-test`<br>`ratio-study/driver-analysis`<br>`comparison-snapshots` | truth_bearing_runtime | terrafusion_canonical | - | - | `cama`<br>`PACS` | `assessment`<br>`CamaCharacteristics`<br>`CamaImprovementDetails`<br>`canonical`<br>`ComparableSales`<br>`parcel`<br>`TerraFusionDbContext` | - | Legacy/provenance terminology detected without direct source dependency evidence.
`backend/src/TerraFusion.API/Controllers/TranscendenceController.cs` | `api/v1/[controller]`<br>`initialize`<br>`quantum-valuation`<br>`achieve-transcendence`<br>`metrics`<br>`health` | demo_or_advanced_not_v1 | unproven | - | - | - | - | - | No TerraFusion canonical/runtime data evidence; classified as demo_or_advanced_not_v1, not an active county data-truth endpoint.
`backend/src/TerraFusion.API/Controllers/WhatIfScenariosController.cs` | `api/what-if-scenarios`<br>`{id}` | truth_bearing_runtime | terrafusion_canonical | - | - | - | `assessment` | - | -
`backend/src/TerraFusion.API/Controllers/WorkbenchFlagsController.cs` | `api/workbench/flags`<br>`{id:int}`<br>`{id:int}/status` | truth_bearing_runtime | terrafusion_canonical | - | - | - | `parcel`<br>`TerraFusionDbContext` | - | -
`backend/src/TerraFusion.API/Program.cs` | - | operational_control | terrafusion_canonical | - | - | `CAMA`<br>`Harris`<br>`legacy SOURCE`<br>`PACS` | `assessment`<br>`CamaCharacteristics`<br>`canonical`<br>`ComparableSales`<br>`parcel`<br>`Repository`<br>`runtime`<br>`TerraFusionDbContext` | - | Legacy/provenance terminology detected without direct source dependency evidence.
`backend/src/TerraFusion.CostForge/Controllers/UltimateCostForgeController.cs` | `api/[controller]`<br>`activate-ultimate`<br>`ultimate-valuation`<br>`ultimate-market-intelligence`<br>`ultimate-status`<br>`ultimate-batch-valuation`<br>`ultimate-analytics`<br>`ultimate-health` | demo_or_advanced_not_v1 | unproven | - | - | - | - | - | No TerraFusion canonical/runtime data evidence; classified as demo_or_advanced_not_v1, not an active county data-truth endpoint.
`backend/TerraFusion.QuantumLab/Controllers/QuantumResearchController.cs` | `api/quantum-lab`<br>`research-environment/initialize`<br>`statistical-analysis/advanced`<br>`consciousness-monitoring/real-time/{environmentId}`<br>`cross-workspace/synchronize`<br>`research-report/generate` | demo_or_advanced_not_v1 | terrafusion_canonical | - | - | - | `assessment` | - | -

## Sync/Admin/Test Legacy Zones

| File | Zone | Source Class | Legacy Terms |
|---|---|---|---|
`backend/src/TerraFusion.API/Controllers/CostForgeTestController.cs` | allowed_tests | terrafusion_canonical | `Harris`<br>`PACS`
`backend/src/TerraFusion.API/Controllers/SyncController.cs` | allowed_sync_ingest | mixed_canonical_and_legacy | `PACS`<br>`SourceConnectionId`
`backend/src/TerraFusion.API/Controllers/TerraFusionSyncController.cs` | allowed_sync_ingest | unproven | `Harris`<br>`PACS`
`backend/src/TerraFusion.API/Controllers/WorkbenchSyncReadinessController.cs` | allowed_admin_proof | mixed_canonical_and_legacy | `PACS`<br>`sourceConnectionId`
`backend/tests/TerraFusion.Unit.Tests/Sync/Comps/Api/SyncControllerCompsEligibleTests.cs` | allowed_tests | terrafusion_canonical | -
`backend/tests/TerraFusion.Unit.Tests/Sync/Comps/Api/SyncControllerHeadMethodTests.cs` | allowed_tests | mixed_canonical_and_legacy | `PACS`<br>`pacs_oltp`<br>`SourceConnectionId`<br>`SyncSourceConnection`
`backend/tests/TerraFusion.Unit.Tests/Sync/Mapping/Api/SyncControllerActiveWorkbookTests.cs` | allowed_tests | mixed_canonical_and_legacy | `PACS`<br>`pacs_oltp`<br>`SourceConnectionId`<br>`SyncSourceConnection`

## Frontend API Calls

| File | Scope | Surface | Endpoint | Legacy Terms | Blockers | Warnings |
|---|---|---|---|---|---|---|
`frontend/apps/os-shell/src/__tests__/shell/swarmTruth.contract.test.tsx` | test_only | unknown | `/api/ai/orchestration/agents/performance` | - | - | -
`frontend/apps/os-shell/src/__tests__/shell/swarmTruth.contract.test.tsx` | test_only | unknown | `/api/ai/orchestration/status` | - | - | -
`frontend/apps/os-shell/src/__tests__/shell/swarmTruth.contract.test.tsx` | test_only | unknown | `/api/swarm/status` | - | - | -
`frontend/apps/os-shell/src/api/explainApi.ts` | active_june10 | unknown | `${API_BASE_URL}/api/gpt/explain` | - | - | -
`frontend/apps/os-shell/src/api/gptClient.ts` | active_june10 | unknown | `${API_BASE_URL}/api/gpt/conversations` | - | - | -
`frontend/apps/os-shell/src/api/gptClient.ts` | active_june10 | unknown | `${API_BASE_URL}/api/gpt/conversations?${params}` | - | - | -
`frontend/apps/os-shell/src/api/gptClient.ts` | active_june10 | unknown | `${API_BASE_URL}/api/gpt/conversations/${conversationId}` | - | - | -
`frontend/apps/os-shell/src/api/gptClient.ts` | active_june10 | unknown | `${API_BASE_URL}/api/gpt/conversations/${conversationId}/messages` | - | - | -
`frontend/apps/os-shell/src/api/gptClient.ts` | active_june10 | unknown | `${API_BASE_URL}/api/gpt/conversations/${conversationId}/messages` | - | - | -
`frontend/apps/os-shell/src/api/gptClient.ts` | active_june10 | unknown | `${API_BASE_URL}/api/gpt/rag/datasets/${datasetId}/index` | - | - | -
`frontend/apps/os-shell/src/api/gptClient.ts` | active_june10 | unknown | `${API_BASE_URL}/api/gpt/rag/health` | - | - | -
`frontend/apps/os-shell/src/api/gptClient.ts` | active_june10 | unknown | `${API_BASE_URL}/api/gpt/system` | - | - | -
`frontend/apps/os-shell/src/api/gptClient.ts` | active_june10 | unknown | `${API_BASE_URL}/api/gpt/system` | - | - | -
`frontend/apps/os-shell/src/api/gptClient.ts` | active_june10 | unknown | `${API_BASE_URL}/api/gpt/system/${key}` | - | - | -
`frontend/apps/os-shell/src/api/systemDiagnosticsApi.ts` | active_june10 | atlas | `${API_BASE_URL}/api/gpt/rag/benton-assessment-basics/export` | - | - | -
`frontend/apps/os-shell/src/api/systemDiagnosticsApi.ts` | active_june10 | atlas | `${API_BASE_URL}/api/gpt/rag/health` | - | - | -
`frontend/apps/os-shell/src/api/systemDiagnosticsApi.ts` | active_june10 | atlas | `${API_BASE_URL}/api/gpt/rag/index/${datasetKey}` | - | - | -
`frontend/apps/os-shell/src/api/systemDiagnosticsApi.ts` | active_june10 | atlas | `${API_BASE_URL}/api/gpt/system/diagnostics/download` | - | - | -
`frontend/apps/os-shell/src/api/systemDiagnosticsApi.ts` | active_june10 | atlas | `${API_BASE_URL}/api/gpt/system/safe-mode` | - | - | -
`frontend/apps/os-shell/src/api/systemDiagnosticsApi.ts` | active_june10 | atlas | `${API_BASE_URL}/api/gpt/system/safe-mode` | - | - | -
`frontend/apps/os-shell/src/auth/AuthProvider.tsx` | active_june10 | unknown | `/api/auth/dev-token` | - | - | -
`frontend/apps/os-shell/src/components/ai/AICodeCompletion.tsx` | active_june10 | unknown | `/api/ai/completions` | - | - | -
`frontend/apps/os-shell/src/components/ai/AIDebuggingPanel.tsx` | active_june10 | unknown | `/api/ai/debug/analyze` | - | - | -
`frontend/apps/os-shell/src/components/ai/AIInsightsPanel.tsx` | active_june10 | unknown | `/api/ai/insights?${params.toString()}` | - | - | -
`frontend/apps/os-shell/src/components/ai/AIWorkflowAutomation.tsx` | active_june10 | unknown | `/api/ai/workflows?${params.toString()}` | - | - | -
`frontend/apps/os-shell/src/components/ai/AIWorkflowAutomation.tsx` | active_june10 | unknown | `/api/ai/workflows/${workflowId}/execute` | - | - | -
`frontend/apps/os-shell/src/components/ai/AnalyticsDashboard.tsx` | active_june10 | unknown | `/api/ai/analytics` | - | - | -
`frontend/apps/os-shell/src/components/ai/CodeOptimizationPanel.tsx` | active_june10 | unknown | `/api/ai/optimize` | - | - | -
`frontend/apps/os-shell/src/components/ai/ErrorPredictionPanel.tsx` | active_june10 | unknown | `/api/ai/predict-errors` | - | - | -
`frontend/apps/os-shell/src/components/ai/IntelligentCellSuggestions.tsx` | active_june10 | unknown | `/api/ai/cell-suggestions` | - | - | -
`frontend/apps/os-shell/src/components/AISuperiorityDashboard.tsx` | active_june10 | unknown | `/api/aisuperiority/${EVALUATION_ROUTE_SEGMENT}/${evaluationRunId}/dashboard` | `harris` | - | -
`frontend/apps/os-shell/src/components/AISuperiorityDashboard.tsx` | active_june10 | unknown | `/api/aisuperiority/${EVALUATION_ROUTE_SEGMENT}/${evaluationRunId}/stop` | `harris` | - | -
`frontend/apps/os-shell/src/components/AISuperiorityLauncher.tsx` | active_june10 | unknown | `/api/aisuperiority/launch` | - | - | -
`frontend/apps/os-shell/src/components/AISuperiorityLauncher.tsx` | active_june10 | unknown | `/api/aisuperiority/scenarios` | - | - | -
`frontend/apps/os-shell/src/components/analytics/AnalyticsDashboard.tsx` | active_june10 | unknown | `/api/analytics/aggregations?groupBy=county&timeRange=${selectedTimeRange}` | - | - | -
`frontend/apps/os-shell/src/components/analytics/AnalyticsDashboard.tsx` | active_june10 | unknown | `/api/analytics/insights/${selectedMetric}` | - | - | -
`frontend/apps/os-shell/src/components/analytics/AnalyticsDashboard.tsx` | active_june10 | unknown | `/api/analytics/reports` | - | - | -
`frontend/apps/os-shell/src/components/analytics/AnalyticsDashboard.tsx` | active_june10 | unknown | `/api/analytics/summary?timeRange=${selectedTimeRange}` | - | - | -
`frontend/apps/os-shell/src/components/analytics/AnalyticsDashboard.tsx` | active_june10 | unknown | `/api/analytics/system/usage?timeRange=${selectedTimeRange}` | - | - | -
`frontend/apps/os-shell/src/components/analytics/AnalyticsDashboard.tsx` | active_june10 | unknown | `/api/analytics/trends/${selectedMetric}?timeRange=${selectedTimeRange}` | - | - | -
`frontend/apps/os-shell/src/components/analytics/AnalyticsDashboard.tsx` | active_june10 | unknown | `/api/analytics/users/activity?timeRange=${selectedTimeRange}` | - | - | -
`frontend/apps/os-shell/src/components/app-frame/AppFrame.tsx` | active_june10 | costforge | `/api/service-registry` | - | - | -
`frontend/apps/os-shell/src/components/autonomous/AutonomousOperationsDashboard.tsx` | active_june10 | unknown | `/api/autonomous/anomalies` | - | - | -
`frontend/apps/os-shell/src/components/autonomous/AutonomousOperationsDashboard.tsx` | active_june10 | unknown | `/api/autonomous/predictions` | - | - | -
`frontend/apps/os-shell/src/components/autonomous/AutonomousOperationsDashboard.tsx` | active_june10 | unknown | `/api/autonomous/recover` | - | - | -
`frontend/apps/os-shell/src/components/autonomous/AutonomousOperationsDashboard.tsx` | active_june10 | unknown | `/api/autonomous/self-healing` | - | - | -
`frontend/apps/os-shell/src/components/autonomous/AutonomousOperationsDashboard.tsx` | active_june10 | unknown | `/api/autonomous/status` | - | - | -
`frontend/apps/os-shell/src/components/autonomous/AutonomousOperationsDashboard.tsx` | active_june10 | unknown | `/api/predictive-maintenance/actions/execute` | - | - | -
`frontend/apps/os-shell/src/components/autonomous/AutonomousOperationsDashboard.tsx` | active_june10 | unknown | `/api/predictive-maintenance/report` | - | - | -
`frontend/apps/os-shell/src/components/codex/CodexEmailNotificationPanel.tsx` | active_june10 | unknown | `/api/codex/notifications/send-alert` | - | - | -
`frontend/apps/os-shell/src/components/codex/CodexEmailNotificationPanel.tsx` | active_june10 | unknown | `/api/codex/notifications/send-daily-digest?countyId=${countyId || ` | - | - | -
`frontend/apps/os-shell/src/components/codex/CodexEmailNotificationPanel.tsx` | active_june10 | unknown | `/api/codex/notifications/send-weekly-summary?countyId=${countyId || ` | - | - | -
`frontend/apps/os-shell/src/components/codex/CodexEmailNotificationPanel.tsx` | active_june10 | unknown | `/api/codex/notifications/test` | - | - | -
`frontend/apps/os-shell/src/components/codex/NotificationPreferences.tsx` | active_june10 | unknown | `/api/codex/collaboration/${platform}/test` | - | - | -
`frontend/apps/os-shell/src/components/codex/NotificationPreferences.tsx` | active_june10 | unknown | `/api/codex/notifications/preferences` | - | - | -
`frontend/apps/os-shell/src/components/codex/NotificationPreferences.tsx` | active_june10 | unknown | `/api/codex/notifications/preferences` | - | - | -
`frontend/apps/os-shell/src/components/CodexDashboard.tsx` | active_june10 | unknown | `/api/codex369/realtime` | - | - | -
`frontend/apps/os-shell/src/components/collaboration/CollaborationProvider.tsx` | active_june10 | unknown | `/api/collaboration/sessions` | - | - | -
`frontend/apps/os-shell/src/components/common/ErrorBoundary.tsx` | active_june10 | unknown | `/api/errors` | - | - | -
`frontend/apps/os-shell/src/components/common/ModuleErrorBoundary.tsx` | active_june10 | unknown | `/api/errors/ai` | - | - | -
`frontend/apps/os-shell/src/components/common/ModuleErrorBoundary.tsx` | active_june10 | unknown | `/api/errors/module` | - | - | -
`frontend/apps/os-shell/src/components/dais/AuditTab.tsx` | active_june10 | unknown | `/api/audit/trail?parcelId=${encodeURIComponent(parcelId)}` | - | - | -
`frontend/apps/os-shell/src/components/datamining/EtlStatusPanel.tsx` | active_june10 | unknown | `/api/datamining/etl/status` | - | - | -
`frontend/apps/os-shell/src/components/deployment/MultiCountyDeploymentDashboard.tsx` | active_june10 | unknown | `/api/multi-county/${deploymentId}/rollback` | - | - | -
`frontend/apps/os-shell/src/components/deployment/MultiCountyDeploymentDashboard.tsx` | active_june10 | unknown | `/api/multi-county/counties` | - | - | -
`frontend/apps/os-shell/src/components/deployment/MultiCountyDeploymentDashboard.tsx` | active_june10 | unknown | `/api/multi-county/deploy` | - | - | -
`frontend/apps/os-shell/src/components/deployment/ProductionDeploymentDashboard.tsx` | active_june10 | unknown | `/api/deployment` | - | - | -
`frontend/apps/os-shell/src/components/deployment/ProductionDeploymentDashboard.tsx` | active_june10 | unknown | `/api/deployment/${deploymentId}/rollback` | - | - | -
`frontend/apps/os-shell/src/components/deployment/ProductionDeploymentDashboard.tsx` | active_june10 | unknown | `/api/deployment/${deploymentStatus.deploymentId}/status` | - | - | -
`frontend/apps/os-shell/src/components/deployment/ProductionDeploymentDashboard.tsx` | active_june10 | unknown | `/api/deployment/${result.deploymentId}/status` | - | - | -
`frontend/apps/os-shell/src/components/deployment/ProductionDeploymentDashboard.tsx` | active_june10 | unknown | `/api/deployment/health/${env}` | - | - | -
`frontend/apps/os-shell/src/components/deployment/ProductionDeploymentDashboard.tsx` | active_june10 | unknown | `/api/deployment/history` | - | - | -
`frontend/apps/os-shell/src/components/documentation/DocumentationPanel.tsx` | active_june10 | unknown | `/api/ai/docs` | - | - | -
`frontend/apps/os-shell/src/components/errors/ErrorBoundary.tsx` | active_june10 | unknown | `/api/errors/boundary` | - | - | -
`frontend/apps/os-shell/src/components/field/FieldStudioDashboard.tsx` | active_june10 | workbench | `http://localhost:${API_PORT}/api/field/assignments` | - | - | -
`frontend/apps/os-shell/src/components/field/PostInspectionReview.tsx` | active_june10 | unknown | `${API_BASE}/api/field/assignments/${assignment.id}/assessment-review-flag` | - | - | -
`frontend/apps/os-shell/src/components/field/PostInspectionReview.tsx` | active_june10 | unknown | `${API_BASE}/api/properties/parcel/${encodeURIComponent(assignment.parcelNumber)}/sketch` | - | - | -
`frontend/apps/os-shell/src/components/field/PreVisitBriefingPanel.tsx` | active_june10 | unknown | `http://localhost:${API_PORT}/api/properties/parcel/${encodeURIComponent(parcelNumber)}` | - | - | -
`frontend/apps/os-shell/src/components/integration/IntegrationDashboard.tsx` | active_june10 | unknown | `/api/integration/connectors` | - | - | -
`frontend/apps/os-shell/src/components/integration/IntegrationDashboard.tsx` | active_june10 | unknown | `/api/integration/health` | - | - | -
`frontend/apps/os-shell/src/components/integration/IntegrationDashboard.tsx` | active_june10 | unknown | `/api/integration/metrics?timeRange=${selectedTimeRange}` | - | - | -
`frontend/apps/os-shell/src/components/integration/IntegrationDashboard.tsx` | active_june10 | unknown | `/api/integration/status` | - | - | -
`frontend/apps/os-shell/src/components/integration/IntegrationDashboard.tsx` | active_june10 | unknown | `/api/integration/sync` | - | - | -
`frontend/apps/os-shell/src/components/integration/IntegrationDashboard.tsx` | active_june10 | unknown | `/api/integration/sync/history` | - | - | -
`frontend/apps/os-shell/src/components/layout/ProfessionalDashboard.tsx` | active_june10 | costforge | `/api/modules` | - | - | -
`frontend/apps/os-shell/src/components/layout/ProfessionalDashboard.tsx` | active_june10 | costforge | `/api/quantum-performance` | - | - | -
`frontend/apps/os-shell/src/components/layout/ProfessionalDashboard.tsx` | active_june10 | costforge | `/api/system-orchestration/health` | - | - | -
`frontend/apps/os-shell/src/components/layout/ProfessionalDashboard.tsx` | active_june10 | costforge | `/api/system-orchestration/info` | - | - | -
`frontend/apps/os-shell/src/components/marketplace/MarketplaceApp.tsx` | active_june10 | unknown | `/api/marketplace/categories` | - | - | -
`frontend/apps/os-shell/src/components/marketplace/MarketplaceApp.tsx` | active_june10 | unknown | `/api/marketplace/plugins?${params.toString()}` | - | - | -
`frontend/apps/os-shell/src/components/marketplace/MarketplaceApp.tsx` | active_june10 | unknown | `/api/marketplace/plugins/${plugin.id}/download` | - | - | -
`frontend/apps/os-shell/src/components/monitoring/AdvancedMonitoringDashboard.tsx` | active_june10 | unknown | `/api/monitoring/dashboard` | - | - | -
`frontend/apps/os-shell/src/components/performance/PerformanceDashboard.tsx` | active_june10 | unknown | `/api/performance/cache/invalidate` | - | - | -
`frontend/apps/os-shell/src/components/performance/PerformanceDashboard.tsx` | active_june10 | unknown | `/api/performance/cache/statistics` | - | - | -
`frontend/apps/os-shell/src/components/performance/PerformanceDashboard.tsx` | active_june10 | unknown | `/api/performance/optimize` | - | - | -
`frontend/apps/os-shell/src/components/performance/PerformanceDashboard.tsx` | active_june10 | unknown | `/api/performance/queries` | - | - | -
`frontend/apps/os-shell/src/components/performance/PerformanceDashboard.tsx` | active_june10 | unknown | `/api/performance/recommendations` | - | - | -
`frontend/apps/os-shell/src/components/performance/PerformanceDashboard.tsx` | active_june10 | unknown | `/api/performance/resources` | - | - | -
`frontend/apps/os-shell/src/components/performance/PerformanceDashboard.tsx` | active_june10 | unknown | `/api/performance/status` | - | - | -
`frontend/apps/os-shell/src/components/performance/PerformanceProfileDashboard.tsx` | active_june10 | unknown | `/api/ai/profile` | - | - | -
`frontend/apps/os-shell/src/components/PWAShell.tsx` | active_june10 | workbench | `/api/modules` | - | - | -
`frontend/apps/os-shell/src/components/PWAShell.tsx` | active_june10 | workbench | `/api/system-orchestration/health` | - | - | -
`frontend/apps/os-shell/src/components/PWAShell.tsx` | active_june10 | workbench | `/api/system-orchestration/health` | - | - | -
`frontend/apps/os-shell/src/components/PWAShell.tsx` | active_june10 | workbench | `/api/system-orchestration/info` | - | - | -
`frontend/apps/os-shell/src/components/research/InfinitePrecisionAnalyticsPanel.tsx` | active_june10 | workbench | `/api/quantum-research/bayesian-inference` | - | - | -
`frontend/apps/os-shell/src/components/research/InfinitePrecisionAnalyticsPanel.tsx` | active_june10 | workbench | `/api/quantum-research/correlation-matrix` | - | - | -
`frontend/apps/os-shell/src/components/research/InfinitePrecisionAnalyticsPanel.tsx` | active_june10 | workbench | `/api/quantum-research/hypothesis-test` | - | - | -
`frontend/apps/os-shell/src/components/research/InfinitePrecisionAnalyticsPanel.tsx` | active_june10 | workbench | `/api/quantum-research/infinite-precision-measurement` | - | - | -
`frontend/apps/os-shell/src/components/research/InfinitePrecisionAnalyticsPanel.tsx` | active_june10 | workbench | `/api/quantum-research/power-analysis` | - | - | -
`frontend/apps/os-shell/src/components/research/ResearchPortal.tsx` | active_june10 | workbench | `/api/research-export/generate` | - | - | -
`frontend/apps/os-shell/src/components/research/StatisticalValidationWorkbench.tsx` | active_june10 | workbench | `/api/iaao-validation/accuracy-time-series` | - | - | -
`frontend/apps/os-shell/src/components/research/StatisticalValidationWorkbench.tsx` | active_june10 | workbench | `/api/iaao-validation/certification-analysis` | - | - | -
`frontend/apps/os-shell/src/components/research/StatisticalValidationWorkbench.tsx` | active_june10 | workbench | `/api/iaao-validation/generate-report` | - | - | -
`frontend/apps/os-shell/src/components/research/StatisticalValidationWorkbench.tsx` | active_june10 | workbench | `/api/iaao-validation/sales-ratio-analysis` | - | - | -
`frontend/apps/os-shell/src/components/research/StatisticalValidationWorkbench.tsx` | active_june10 | workbench | `/api/iaao-validation/validate-compliance` | - | - | -
`frontend/apps/os-shell/src/components/security/SecurityDashboard.tsx` | active_june10 | unknown | `/api/security/access-control` | - | - | -
`frontend/apps/os-shell/src/components/security/SecurityDashboard.tsx` | active_june10 | unknown | `/api/security/audit-trail?limit=50` | - | - | -
`frontend/apps/os-shell/src/components/security/SecurityDashboard.tsx` | active_june10 | unknown | `/api/security/compliance` | - | - | -
`frontend/apps/os-shell/src/components/security/SecurityDashboard.tsx` | active_june10 | unknown | `/api/security/events` | - | - | -
`frontend/apps/os-shell/src/components/security/SecurityDashboard.tsx` | active_june10 | unknown | `/api/security/recommendations` | - | - | -
`frontend/apps/os-shell/src/components/security/SecurityDashboard.tsx` | active_june10 | unknown | `/api/security/status` | - | - | -
`frontend/apps/os-shell/src/components/security/SecurityDashboard.tsx` | active_june10 | unknown | `/api/security/vulnerabilities` | - | - | -
`frontend/apps/os-shell/src/components/system/SystemOrchestrationDashboard.tsx` | active_june10 | unknown | `/api/system/analysis` | - | - | -
`frontend/apps/os-shell/src/components/system/SystemOrchestrationDashboard.tsx` | active_june10 | unknown | `/api/system/diagnostics` | - | - | -
`frontend/apps/os-shell/src/components/system/SystemOrchestrationDashboard.tsx` | active_june10 | unknown | `/api/system/metrics` | - | - | -
`frontend/apps/os-shell/src/components/system/SystemOrchestrationDashboard.tsx` | active_june10 | unknown | `/api/system/optimization` | - | - | -
`frontend/apps/os-shell/src/components/system/SystemOrchestrationDashboard.tsx` | active_june10 | unknown | `/api/system/status` | - | - | -
`frontend/apps/os-shell/src/components/ui/Toast.stories.tsx` | active_june10 | unknown | `/api/data` | - | - | -
`frontend/apps/os-shell/src/components/visualization/VisualizationDashboard.tsx` | active_june10 | unknown | `/api/ai/visualize` | - | - | -
`frontend/apps/os-shell/src/contexts/ErrorContext.tsx` | active_june10 | unknown | `/api/errors/report` | - | - | -
`frontend/apps/os-shell/src/hooks/forge/useForgeValuation.ts` | active_june10 | unknown | `/api/forge/${encodeURIComponent(parcelId!)}/reconciliation/commit` | - | - | -
`frontend/apps/os-shell/src/hooks/forge/useForgeValuation.ts` | active_june10 | unknown | `/api/forge/${encodeURIComponent(parcelId!)}/years` | - | - | -
`frontend/apps/os-shell/src/hooks/forge/useForgeValuation.ts` | active_june10 | unknown | `/api/forge/${encodeURIComponent(parcelId)}/${approach}?taxYear=${taxYear}` | - | - | -
`frontend/apps/os-shell/src/hooks/forge/useForgeValuation.ts` | active_june10 | unknown | `/api/forge/sales/${encodeURIComponent(saleId)}/qualification` | - | - | -
`frontend/apps/os-shell/src/hooks/forge/useForgeValuation.ts` | active_june10 | unknown | `/api/forge/sales/recompute-recommendations` | - | - | -
`frontend/apps/os-shell/src/hooks/forge/useMarketData.ts` | active_june10 | unknown | `/api/market/metrics?${params}` | - | - | -
`frontend/apps/os-shell/src/hooks/forge/useMarketData.ts` | active_june10 | unknown | `/api/market/segments` | - | - | -
`frontend/apps/os-shell/src/hooks/forge/useMarketData.ts` | active_june10 | unknown | `/api/market/trends?${params}` | - | - | -
`frontend/apps/os-shell/src/hooks/forge/usePropertyData.ts` | active_june10 | unknown | `/api/properties/${parcelId}` | - | - | -
`frontend/apps/os-shell/src/hooks/forge/usePropertyData.ts` | active_june10 | unknown | `/api/properties/search?${queryString}` | - | - | -
`frontend/apps/os-shell/src/hooks/forge/useValuationData.ts` | active_june10 | unknown | `/api/valuation/${parcelId}` | - | - | -
`frontend/apps/os-shell/src/hooks/forge/useValuationData.ts` | active_june10 | unknown | `/api/valuation/${parcelId}/history` | - | - | -
`frontend/apps/os-shell/src/hooks/useAppealsQueue.ts` | active_june10 | unknown | `/api/dais/appeals` | - | - | -
`frontend/apps/os-shell/src/hooks/useErrorHandler.ts` | active_june10 | unknown | `/api/errors/frontend` | - | - | -
`frontend/apps/os-shell/src/hooks/useModuleEcosystem.ts` | active_june10 | unknown | `/api/ecosystem/communication/logs?count=${count}` | - | - | -
`frontend/apps/os-shell/src/hooks/useModuleEcosystem.ts` | active_june10 | unknown | `/api/ecosystem/initialize` | - | - | -
`frontend/apps/os-shell/src/hooks/useModuleEcosystem.ts` | active_june10 | unknown | `/api/ecosystem/modules/${moduleId}/health` | - | - | -
`frontend/apps/os-shell/src/hooks/useModuleEcosystem.ts` | active_june10 | unknown | `/api/ecosystem/modules/${moduleId}/metrics` | - | - | -
`frontend/apps/os-shell/src/hooks/useModuleEcosystem.ts` | active_june10 | unknown | `/api/ecosystem/modules/register` | - | - | -
`frontend/apps/os-shell/src/hooks/useModuleEcosystem.ts` | active_june10 | unknown | `/api/ecosystem/performance/summary` | - | - | -
`frontend/apps/os-shell/src/hooks/useModuleEcosystem.ts` | active_june10 | unknown | `/api/ecosystem/status` | - | - | -
`frontend/apps/os-shell/src/hooks/useModuleEcosystem.ts` | active_june10 | unknown | `/api/ecosystem/status` | - | - | -
`frontend/apps/os-shell/src/hooks/usePropertyLookup.ts` | active_june10 | unknown | `/api/properties/parcel/${encodeURIComponent(id)}` | - | - | -
`frontend/apps/os-shell/src/hooks/useWorkloadSummary.ts` | active_june10 | unknown | `/api/dais/queue` | - | - | -
`frontend/apps/os-shell/src/lib/api/gptClient.ts` | active_june10 | unknown | `${API_BASE_URL}/api/gpt/conversations/${encodeURIComponent(conversationId)}/messages` | - | - | -
`frontend/apps/os-shell/src/lib/api/gptClient.ts` | active_june10 | unknown | `${API_BASE_URL}/api/gpt/conversations/${encodeURIComponent(conversationId)}/messages` | - | - | -
`frontend/apps/os-shell/src/lib/api/gptClient.ts` | active_june10 | unknown | `${API_BASE_URL}/api/gpt/conversations/${encodeURIComponent(conversationId)}/trace` | - | - | -
`frontend/apps/os-shell/src/lib/api/gptClient.ts` | active_june10 | unknown | `${API_BASE_URL}/api/gpt/rag/health` | - | - | -
`frontend/apps/os-shell/src/lib/api/gptClient.ts` | active_june10 | unknown | `${API_BASE_URL}/api/gpt/rag/index/${encodeURIComponent(datasetId)}` | - | - | -
`frontend/apps/os-shell/src/lib/api/gptClient.ts` | active_june10 | unknown | `${API_BASE_URL}/api/gpt/system` | - | - | -
`frontend/apps/os-shell/src/lib/api/gptClient.ts` | active_june10 | unknown | `${API_BASE_URL}/api/gpt/system/${encodeURIComponent(gptKey)}/conversations` | - | - | -
`frontend/apps/os-shell/src/modules/pilt/pages/BulkImport.tsx` | active_june10 | unknown | `/api/pilt/payments/bulk` | - | - | -
`frontend/apps/os-shell/src/pages/dais/AuditTrailPage.tsx` | active_june10 | unknown | `/api/audit/search?${params.toString()}` | - | - | -
`frontend/apps/os-shell/src/pages/experiments/CreateExperiment.tsx` | active_june10 | unknown | `/api/experiments` | - | - | -
`frontend/apps/os-shell/src/pages/experiments/ExperimentsList.tsx` | active_june10 | unknown | `/api/experiments` | - | - | -
`frontend/apps/os-shell/src/pages/experiments/ExperimentsList.tsx` | active_june10 | unknown | `/api/experiments/${experimentId}/runs` | - | - | -
`frontend/apps/os-shell/src/pages/experiments/ExperimentsList.tsx` | active_june10 | unknown | `/api/experiments/${experimentId}/runs/start` | - | - | -
`frontend/apps/os-shell/src/pages/forge/batch/CoefficientPreview.tsx` | active_june10 | unknown | `/api/MassAppraisal/compare` | - | - | -
`frontend/apps/os-shell/src/pages/forge/batch/CoefficientPreview.tsx` | active_june10 | unknown | `/api/MassAppraisal/models` | - | - | -
`frontend/apps/os-shell/src/pages/forge/charts/MarketMetricsChart.tsx` | active_june10 | unknown | `/api/market/metrics/trends?${params}` | - | - | -
`frontend/apps/os-shell/src/pages/forge/charts/MarketPredictionChart.tsx` | active_june10 | unknown | `/api/market/predictions?${params}` | - | - | -
`frontend/apps/os-shell/src/pages/forge/charts/MarketTrendChart.tsx` | active_june10 | unknown | `/api/market/trends?${params}` | - | - | -
`frontend/apps/os-shell/src/pages/forge/charts/PriceHistoryChart.tsx` | active_june10 | unknown | `/api/properties/${parcelId}/sale-history` | - | - | -
`frontend/apps/os-shell/src/pages/forge/charts/PropertyMarketTrends.tsx` | active_june10 | unknown | `/api/properties/${parcelId}/market-trends` | - | - | -
`frontend/apps/os-shell/src/pages/forge/charts/SegmentComparisonChart.tsx` | active_june10 | unknown | `/api/market/segments` | - | - | -
`frontend/apps/os-shell/src/pages/forge/comparison/AdvancedComparison.tsx` | active_june10 | unknown | `/api/properties/${parcelIdA}` | - | - | -
`frontend/apps/os-shell/src/pages/forge/comparison/AdvancedComparison.tsx` | active_june10 | unknown | `/api/properties/${parcelIdB}` | - | - | -
`frontend/apps/os-shell/src/pages/forge/comparison/ParcelComparison.tsx` | active_june10 | unknown | `/api/properties/${id}` | - | - | -
`frontend/apps/os-shell/src/pages/forge/geo/GeoForgeMap.tsx` | active_june10 | unknown | `/api/geoforge/neighborhoods/av-change?taxYear=${filter.taxYear}` | - | - | -
`frontend/apps/os-shell/src/pages/forge/geo/GeoForgeMap.tsx` | active_june10 | unknown | `/api/geoforge/neighborhoods/boundaries?taxYear=${filter.taxYear}` | - | - | -
`frontend/apps/os-shell/src/pages/forge/geo/GeoForgeMap.tsx` | active_june10 | unknown | `/api/geoforge/neighborhoods/ratio-drift?taxYear=${filter.taxYear}` | - | - | -
`frontend/apps/os-shell/src/pages/forge/geo/GeoForgeMap.tsx` | active_june10 | unknown | `/api/geoforge/neighborhoods/sale-price-trend?taxYear=${filter.taxYear}` | - | - | -
`frontend/apps/os-shell/src/pages/forge/geo/panels/AdjustmentWorkbenchPanel.tsx` | active_june10 | workbench | `/api/adjustment/proposals` | - | - | -
`frontend/apps/os-shell/src/pages/forge/geo/panels/AdjustmentWorkbenchPanel.tsx` | active_june10 | workbench | `/api/adjustment/proposals/${proposalId}/simulate` | - | - | -
`frontend/apps/os-shell/src/pages/forge/geo/panels/AdjustmentWorkbenchPanel.tsx` | active_june10 | workbench | `/api/adjustment/recommend?taxYear=${taxYear}&neighborhoodCode=${selectedNeighborhoodCode}` | - | - | -
`frontend/apps/os-shell/src/pages/forge/geo/panels/AdjustmentWorkbenchPanel.tsx` | active_june10 | workbench | `/api/adjustment/sets` | - | - | -
`frontend/apps/os-shell/src/pages/forge/geo/panels/AdjustmentWorkbenchPanel.tsx` | active_june10 | workbench | `/api/adjustment/sets?taxYear=${taxYear}` | - | - | -
`frontend/apps/os-shell/src/pages/forge/geo/panels/AdjustmentWorkbenchPanel.tsx` | active_june10 | workbench | `/api/adjustment/sets/${setId}/submit` | - | - | -
`frontend/apps/os-shell/src/pages/forge/geo/panels/OutlierReviewPanel.tsx` | active_june10 | unknown | `/api/geoforge/sales/${saleId}/qualification` | - | - | -
`frontend/apps/os-shell/src/pages/forge/geo/panels/SalesDrillDownPanel.tsx` | active_june10 | unknown | `/api/geoforge/sales/${saleId}/qualification` | - | - | -
`frontend/apps/os-shell/src/pages/forge/mass-appraisal/MassAppraisalOverview.tsx` | active_june10 | unknown | `/api/models` | - | - | -
`frontend/apps/os-shell/src/pages/forge/mass-appraisal/MassAppraisalOverview.tsx` | active_june10 | unknown | `/api/models/${model.modelId}` | - | - | -
`frontend/apps/os-shell/src/pages/forge/mass-appraisal/MassAppraisalOverview.tsx` | active_june10 | unknown | `/api/quality-control` | - | - | -
`frontend/apps/os-shell/src/pages/forge/mass-appraisal/MassAppraisalOverview.tsx` | active_june10 | unknown | `/api/ratio-study` | - | - | -
`frontend/apps/os-shell/src/pages/forge/parcel/ParcelDetails.tsx` | active_june10 | unknown | `/api/properties/${parcelId}` | - | - | -
`frontend/apps/os-shell/src/pages/forge/property/BatchProcessingTool.tsx` | active_june10 | unknown | `/api/batch/status/${jobId}` | - | - | -
`frontend/apps/os-shell/src/pages/forge/property/BatchProcessingTool.tsx` | active_june10 | unknown | `/api/batch/upload` | - | - | -
`frontend/apps/os-shell/src/pages/forge/property/HazardAssessment.tsx` | active_june10 | unknown | `/api/properties/${parcelId}/hazard-assessment` | - | - | -
`frontend/apps/os-shell/src/pages/forge/property/HazardRiskAssessment.tsx` | active_june10 | unknown | `/api/properties/${parcelId}/hazards` | - | - | -
`frontend/apps/os-shell/src/pages/forge/property/PropertyDataPage.tsx` | active_june10 | unknown | `/api/properties?search=${encodeURIComponent(search)}` | - | - | -
`frontend/apps/os-shell/src/pages/forge/property/PropertyEnrichmentWidget.tsx` | active_june10 | unknown | `/api/properties/${parcelId}/enrichment` | - | - | -
`frontend/apps/os-shell/src/pages/forge/property/PropertySearch.tsx` | active_june10 | unknown | `/api/properties/search?${params}` | - | - | -
`frontend/apps/os-shell/src/pages/forge/property/RecommendationCarousel.tsx` | active_june10 | unknown | `/api/properties/${parcelId}/recommendations` | - | - | -
`frontend/apps/os-shell/src/pages/forge/regression/ModelDetails.tsx` | active_june10 | unknown | `/api/regression/models/${modelId}` | - | - | -
`frontend/apps/os-shell/src/pages/forge/regression/ModelsList.tsx` | active_june10 | unknown | `/api/regression/models` | - | - | -
`frontend/apps/os-shell/src/pages/forge/sales/audit/AuditCommandCenter.tsx` | active_june10 | salesforge | `/api/terraforge/sale-qualification/running-stats?taxYear=${taxYear}${countyScope.countyId ? ` | - | - | -
`frontend/apps/os-shell/src/pages/forge/sales/SalesComparisonGrid.tsx` | active_june10 | unknown | `/api/valuation/comparable-sales` | - | - | -
`frontend/apps/os-shell/src/pages/forge/scenarios/ScenarioMode.tsx` | active_june10 | unknown | `/api/forge/scenarios/run` | - | - | -
`frontend/apps/os-shell/src/pages/forge/sketch/SketchModule.tsx` | active_june10 | unknown | `${API_BASE}/api/properties/parcel/${encodeURIComponent(parcelId)}/sketch` | - | - | -
`frontend/apps/os-shell/src/pages/forge/tax/TaxAssessmentDashboard.tsx` | active_june10 | unknown | `/api/tax/assessment/${parcelId}` | - | - | -
`frontend/apps/os-shell/src/pages/forge/tax/TaxCalculatorWidget.tsx` | active_june10 | unknown | `/api/tax/calculate` | - | - | -
`frontend/apps/os-shell/src/pages/MuseChat.tsx` | active_june10 | unknown | `/api/pilot/explain` | - | - | -
`frontend/apps/os-shell/src/pages/workbench/tabs/forge/components/CostScheduleEditor.tsx` | active_june10 | workbench | `/api/cost-schedules/${countyId}/${taxYear}` | - | - | -
`frontend/apps/os-shell/src/pages/workbench/tabs/forge/components/DepreciationCurveEditor.tsx` | active_june10 | workbench | `/api/depreciation-curves/${countyId}` | - | - | -
`frontend/apps/os-shell/src/pages/workbench/tabs/forge/components/DepreciationCurveEditor.tsx` | active_june10 | workbench | `/api/depreciation-curves/${encodeURIComponent(countyId)}?${query.toString()}` | - | - | -
`frontend/apps/os-shell/src/services/api/activityApi.ts` | active_june10 | atlas | `/api/properties/parcel/${encodeURIComponent(parcelId)}/activity` | - | - | -
`frontend/apps/os-shell/src/services/BackendIntegrationService.ts` | active_june10 | unknown | `${this.config.baseUrl}/api/ai/analytics` | - | - | -
`frontend/apps/os-shell/src/services/BackendIntegrationService.ts` | active_june10 | unknown | `${this.config.baseUrl}/api/health` | - | - | -
`frontend/apps/os-shell/src/services/BackendIntegrationService.ts` | active_june10 | unknown | `${this.config.baseUrl}/api/properties/${countyId}` | - | - | -
`frontend/apps/os-shell/src/services/BackendIntegrationService.ts` | active_june10 | unknown | `${this.config.baseUrl}/api/security/metrics` | - | - | -
`frontend/apps/os-shell/src/services/EliteSystemMonitor.ts` | active_june10 | costforge | `/api/health` | - | - | -
`frontend/apps/os-shell/src/services/fieldStore.ts` | active_june10 | unknown | `/api/field/observations` | - | - | -
`frontend/apps/os-shell/src/services/fieldSyncV2.ts` | active_june10 | unknown | `http://localhost:${apiPort}/api/field/observations` | - | - | -
`frontend/apps/os-shell/src/services/forge/ratioAnalysisService.ts` | active_june10 | unknown | `/api/terraforge/ratio-study?${query.toString()}` | - | - | -
`frontend/apps/os-shell/src/services/performance.ts` | active_june10 | unknown | `/api/performance/frontend-metrics` | - | - | -
`frontend/apps/os-shell/src/services/PerformanceOptimizationService.tsx` | active_june10 | unknown | `${this.baseURL}/api/valuationoptimization/${propertyId}` | - | - | -
`frontend/apps/os-shell/src/services/PerformanceOptimizationService.tsx` | active_june10 | unknown | `${this.baseURL}/api/valuationoptimization/cache/statistics` | - | - | -
`frontend/apps/os-shell/src/services/pilotApi.ts` | active_june10 | unknown | `/api/pilot/drafts` | - | - | -
`frontend/apps/os-shell/src/services/pilotApi.ts` | active_june10 | unknown | `/api/pilot/drafts/${draftId}/approve` | - | - | -
`frontend/apps/os-shell/src/services/pilotApi.ts` | active_june10 | unknown | `/api/pilot/drafts/${draftId}/reject` | - | - | -
`frontend/apps/os-shell/src/services/pilotApi.ts` | active_june10 | unknown | `/api/pilot/explain` | - | - | -
`frontend/apps/os-shell/src/services/pilotClient.ts` | active_june10 | unknown | `${baseUrl}/api/tools` | - | - | -
`frontend/apps/os-shell/src/services/pilotClient.ts` | active_june10 | unknown | `${baseUrl}/api/tools/execute` | - | - | -
`frontend/apps/os-shell/src/services/terraTrace.ts` | active_june10 | unknown | `/api/trace/events` | - | - | -
`frontend/apps/os-shell/src/shell/desktop/BentonCountyMap.tsx` | active_june10 | workbench | `/api/benton-county/parcels?limit=500` | - | - | -
`frontend/apps/os-shell/src/tests/performance/PerformanceBenchmarks.test.tsx` | test_only | workbench | `/api/test` | - | - | -
`frontend/apps/os-shell/src/tests/performance/PerformanceBenchmarks.test.tsx` | test_only | workbench | `/api/test` | - | - | -
`frontend/components-enhanced/cost-matrix/CostMatrixDashboard.tsx` | unknown | unknown | `/api/costmatrix?${params}` | - | - | -
`frontend/components-enhanced/cost-matrix/CostMatrixDashboard.tsx` | unknown | unknown | `/api/costmatrix/calculate` | - | - | -
`frontend/components-enhanced/cost-matrix/CostMatrixDashboard.tsx` | unknown | unknown | `/api/costmatrix/metadata` | - | - | -
`frontend/components-enhanced/cost-matrix/CostMatrixDashboard.tsx` | unknown | unknown | `/api/costmatrix/refresh` | - | - | -
`frontend/components-enhanced/government-dashboards/CacheOptimizationDashboard.tsx` | unknown | unknown | `/api/cache/cdn/edge-locations` | - | - | -
`frontend/components-enhanced/government-dashboards/CacheOptimizationDashboard.tsx` | unknown | unknown | `/api/cache/items` | - | - | -
`frontend/components-enhanced/government-dashboards/CacheOptimizationDashboard.tsx` | unknown | unknown | `/api/cache/statistics` | - | - | -
`frontend/components-enhanced/government-dashboards/ComplianceDashboard.tsx` | unknown | unknown | `/api/compliance/dashboard` | - | - | -
`frontend/components-enhanced/government-dashboards/ComplianceDashboard.tsx` | unknown | unknown | `/api/compliance/reports` | - | - | -
`frontend/components-enhanced/government-dashboards/HarrisPACSIntegrationDashboard.tsx` | unknown | unknown | `/api/harrispacsintegration/jurisdictions` | `Harris`<br>`PACS` | - | -
`frontend/components-enhanced/government-dashboards/HarrisPACSIntegrationDashboard.tsx` | unknown | unknown | `/api/harrispacsintegration/jurisdictions/${jurisdictionId}/properties?page=${propertyPage}&pageSize=${propertyPageSize}` | `Harris`<br>`PACS` | - | -
`frontend/components-enhanced/government-dashboards/HarrisPACSIntegrationDashboard.tsx` | unknown | unknown | `/api/harrispacsintegration/jurisdictions/${jurisdictionId}/sync` | `Harris`<br>`PACS` | - | -
`frontend/components-enhanced/government-dashboards/HarrisPACSIntegrationDashboard.tsx` | unknown | unknown | `/api/harrispacsintegration/jurisdictions/${jurisdictionId}/sync/status` | `Harris`<br>`PACS` | - | -
`frontend/components-enhanced/government-dashboards/HarrisPACSIntegrationDashboard.tsx` | unknown | unknown | `/api/harrispacsintegration/system/status` | `Harris`<br>`PACS` | - | -
`frontend/components-enhanced/government-dashboards/TylerIntegrationDashboard.tsx` | unknown | unknown | `/api/harris-pacs/jurisdictions` | `Harris`<br>`PACS` | - | -
`frontend/components-enhanced/government-dashboards/TylerIntegrationDashboard.tsx` | unknown | unknown | `/api/harris-pacs/jurisdictions/${jurisdiction.id}/sync/status` | `Harris`<br>`PACS` | - | -
`frontend/components-enhanced/government-dashboards/TylerIntegrationDashboard.tsx` | unknown | unknown | `/api/harris-pacs/jurisdictions/${jurisdictionId}/properties?pageSize=50` | `Harris`<br>`PACS` | - | -
`frontend/components-enhanced/government-dashboards/TylerIntegrationDashboard.tsx` | unknown | unknown | `/api/harris-pacs/jurisdictions/${jurisdictionId}/sync` | `Harris`<br>`PACS` | - | -
`frontend/components-enhanced/government-dashboards/TylerIntegrationDashboard.tsx` | unknown | unknown | `/api/harris-pacs/system/status` | `Harris`<br>`PACS` | - | -
`frontend/components-enhanced/MCPVisualizationController.tsx` | unknown | unknown | `/api/analytics/hierarchical-costs?${params.toString()}` | - | - | -
`frontend/components-enhanced/MCPVisualizationController.tsx` | unknown | unknown | `/api/analytics/regional-costs?${params.toString()}` | - | - | -
`frontend/components-enhanced/MCPVisualizationController.tsx` | unknown | unknown | `/api/analytics/statistical-correlations?${params.toString()}` | - | - | -
`frontend/components-enhanced/MCPVisualizations.tsx` | unknown | unknown | `/api/mcp/dashboard` | - | - | -
`frontend/public/sw.js` | unknown | unknown | `/api/ecosystem/status` | - | - | -
`frontend/tests/frontend.test.ts` | test_only | unknown | `/api/frontend/${i}` | - | - | -
`packages/commercial/modules/08-costforge-ai/src/components/CostPredictionInsights.tsx` | unknown | costforge | `/api/ai/openai-status` | - | - | -
`packages/commercial/modules/08-costforge-ai/src/components/CostPredictionInsights.tsx` | unknown | costforge | `/api/ai/predict-cost` | - | - | -
`packages/commercial/modules/08-costforge-ai/src/components/CostPredictionWizard.tsx` | unknown | costforge | `/api/mcp/enhanced-predict-cost` | - | - | -
`packages/gis-pro/client/src/components/TerraFusionMap.tsx` | unknown | unknown | `/api/benton-county/parcels?limit=500` | - | - | -
`packages/gis-pro/client/src/pages/SimpleGISDashboard.tsx` | unknown | unknown | `/api/benton-county/config` | - | - | -
`packages/gis-pro/client/src/pages/SimpleGISDashboard.tsx` | unknown | unknown | `/api/benton-county/parcels?limit=20` | - | - | -
`packages/gis-pro/client/src/pages/SimpleGISDashboard.tsx` | unknown | unknown | `/api/benton-county/statistics` | - | - | -
`packages/gis-pro/client/src/pages/TerraFusionWorkflow.tsx` | unknown | unknown | `/api/terrafusion/bla` | - | - | -
`packages/gis-pro/client/src/pages/TerraFusionWorkflow.tsx` | unknown | unknown | `/api/terrafusion/sm00` | - | - | -
`packages/gis-pro/client/src/pages/TerraFusionWorkflow.tsx` | unknown | unknown | `/api/terrafusion/workflow` | - | - | -
`packages/gis-pro/tests/api.test.js` | test_only | unknown | `${serverUrl}/api/dev-login` | - | - | -
`packages/gis-pro/tests/api.test.js` | test_only | unknown | `${serverUrl}/api/user` | - | - | -
`packages/government-edition-enhanced-MARKED-FOR-REVIEW/08-costforge-ai/src/components/CostPredictionInsights.tsx` | unknown | costforge | `/api/ai/openai-status` | - | - | -
`packages/government-edition-enhanced-MARKED-FOR-REVIEW/08-costforge-ai/src/components/CostPredictionInsights.tsx` | unknown | costforge | `/api/ai/predict-cost` | - | - | -
`packages/government-edition-enhanced-MARKED-FOR-REVIEW/08-costforge-ai/src/components/CostPredictionWizard.tsx` | unknown | costforge | `/api/mcp/enhanced-predict-cost` | - | - | -
`packages/government-edition/Modules/migrated/08-costforge-ai/components/CostPredictionInsights.tsx` | unknown | costforge | `/api/ai/openai-status` | - | - | -
`packages/government-edition/Modules/migrated/08-costforge-ai/components/CostPredictionInsights.tsx` | unknown | costforge | `/api/ai/predict-cost` | - | - | -
`packages/government-edition/Modules/migrated/08-costforge-ai/components/CostPredictionWizard.tsx` | unknown | costforge | `/api/mcp/enhanced-predict-cost` | - | - | -
`packages/property-tax-ai/client/src/components/agent-system/agent-control-panel.tsx` | unknown | unknown | `/api/ai-agents` | - | - | -
`packages/property-tax-ai/client/src/components/agent-system/agent-control-panel.tsx` | unknown | unknown | `/api/tasks` | - | - | -
`packages/property-tax-ai/client/src/components/agent-system/agent-system-status.tsx` | unknown | unknown | `/api/ai-agents` | - | - | -
`packages/property-tax-ai/client/src/components/market/FutureValuePrediction.tsx` | unknown | unknown | `/api/market/future-value/${propertyId}` | - | - | -
`packages/property-tax-ai/client/src/components/master-development/ApplicationManagerPanel.tsx` | unknown | unknown | `/api/agents/master-development/applications/${id}/${action}` | - | - | -
`packages/property-tax-ai/client/src/components/master-development/ApplicationManagerPanel.tsx` | unknown | unknown | `/api/agents/master-development/applications/deploy` | - | - | -
`packages/property-tax-ai/client/src/components/master-development/ApplicationManagerPanel.tsx` | unknown | unknown | `/api/agents/master-development/integrations/${id}/toggle` | - | - | -
`packages/property-tax-ai/client/src/components/master-development/ApplicationManagerPanel.tsx` | unknown | unknown | `/api/agents/master-development/integrations/create` | - | - | -
`packages/property-tax-ai/client/src/components/master-development/CodeAssistantPanel.tsx` | unknown | unknown | `/api/gis/neighborhoods` | `CAMA`<br>`PACS` | - | -
`packages/property-tax-ai/client/src/components/master-development/CodeAssistantPanel.tsx` | unknown | unknown | `/api/gis/parcels` | `CAMA`<br>`PACS` | - | -
`packages/property-tax-ai/client/src/components/master-development/CodeAssistantPanel.tsx` | unknown | unknown | `/api/gis/parcels` | `CAMA`<br>`PACS` | - | -
`packages/property-tax-ai/client/src/components/master-development/RealTimeMonitoringDashboard.tsx` | unknown | unknown | `/api/agents/master-development-status` | - | - | -
`packages/property-tax-ai/client/src/components/risk/RiskAssessmentPanel.tsx` | unknown | unknown | `/api/risk-assessment/${propertyId}` | - | - | -
`packages/property-tax-ai/client/src/hooks/use-pacs-modules.ts` | unknown | unknown | `/api/pacs-modules/initialize` | `PACS` | - | -
`packages/property-tax-ai/client/src/pages/MasterDevelopmentPage.tsx` | unknown | unknown | `/api/agents/master-development/update-schema` | - | - | -
`packages/property-tax-ai/client/src/pages/MasterDevelopmentPage.tsx` | unknown | unknown | `/api/agents/master-development/validate-schema` | - | - | -
`packages/property-tax-ai/client/src/pages/plandex-ai-settings-page.tsx` | unknown | unknown | `/api/plandex-ai/test` | - | - | -
`packages/property-tax-ai/client/src/pages/plandex-ai-settings-page.tsx` | unknown | unknown | `/api/settings/plandex-ai` | - | - | -
`packages/property-tax-ai/client/src/pages/plandex-ai-settings-page.tsx` | unknown | unknown | `/api/settings/plandex-ai` | - | - | -
`packages/property-tax-ai/client/src/providers/ai-assistant-provider.tsx` | unknown | unknown | `/api/ai-assistant/providers` | - | - | -
`packages/property-tax-ai/client/src/providers/ai-assistant-provider.tsx` | unknown | unknown | `/api/ai-assistant/query` | - | - | -
`packages/property-tax-ai/client/src/services/agent-socketio-service.ts` | unknown | unknown | `/api/agents/socketio/action` | - | - | -
`packages/property-tax-ai/client/src/services/agent-socketio-service.ts` | unknown | unknown | `/api/agents/socketio/auth` | - | - | -
`packages/property-tax-ai/client/src/services/agent-socketio-service.ts` | unknown | unknown | `/api/agents/socketio/send` | - | - | -
`packages/property-tax-ai/client/src/services/agent-websocket-service.ts` | unknown | unknown | `/api/agents/action` | - | - | -
`packages/property-tax-ai/client/src/services/agent-websocket-service.ts` | unknown | unknown | `/api/agents/auth` | - | - | -
`packages/property-tax-ai/client/src/services/agent-websocket-service.ts` | unknown | unknown | `/api/agents/message` | - | - | -
`packages/property-tax-ai/client/src/services/agent-websocket-service.ts` | unknown | unknown | `/api/agents/messages/pending` | - | - | -
`packages/property-tax-ai/scripts/generate-property-data.js` | unknown | unknown | `http://localhost:5000/api/properties/generate-samples` | - | - | -
`packages/property-tax-ai/tests/agent-system-api-test.js` | unknown | unknown | `${API_BASE_URL}/api/agents/capabilities` | - | - | -
`packages/property-tax-ai/tests/agent-system-api-test.js` | unknown | unknown | `${API_BASE_URL}/api/agents/status` | - | - | -
`packages/property-tax-ai/tests/app-health.test.js` | test_only | unknown | `${BASE_URL}/api/ai-agents` | - | - | -
`packages/property-tax-ai/tests/app-health.test.js` | test_only | unknown | `${BASE_URL}/api/properties` | - | - | -
`packages/property-tax-ai/tests/app-health.test.js` | test_only | unknown | `${BASE_URL}/api/properties` | - | - | -
`packages/property-tax-ai/tests/app-health.test.js` | test_only | unknown | `${BASE_URL}/api/system-activities` | - | - | -
`packages/property-tax-ai/tests/pacs-integration-tests.js` | unknown | unknown | `${BASE_URL}/api/auth/token` | `PACS` | - | -
`packages/property-tax-ai/tests/pacs-integration-tests.js` | unknown | unknown | `${BASE_URL}/api/pacs-modules` | `PACS` | - | -
`packages/property-tax-ai/tests/pacs-integration-tests.js` | unknown | unknown | `${BASE_URL}/api/pacs-modules` | `PACS` | - | -
`packages/property-tax-ai/tests/pacs-integration-tests.js` | unknown | unknown | `${BASE_URL}/api/pacs-modules/${moduleId}` | `PACS` | - | -
`packages/property-tax-ai/tests/pacs-integration-tests.js` | unknown | unknown | `${BASE_URL}/api/pacs-modules/${moduleId}` | `PACS` | - | -
`packages/property-tax-ai/tests/pacs-integration-tests.js` | unknown | unknown | `${BASE_URL}/api/pacs-modules/${moduleId}/sync-status` | `PACS` | - | -
`packages/property-tax-ai/tests/pacs-integration-tests.js` | unknown | unknown | `${BASE_URL}/api/pacs-modules/category/mapping` | `PACS` | - | -
`packages/property-tax-ai/tests/pacs-module.test.js` | test_only | unknown | `${BASE_URL}/api/mcp/tools` | `PACS` | - | -
`packages/property-tax-ai/tests/pacs-module.test.js` | test_only | unknown | `${BASE_URL}/api/pacs-modules` | `PACS` | - | -
`packages/property-tax-ai/tests/pacs-module.test.js` | test_only | unknown | `${BASE_URL}/api/pacs-modules` | `PACS` | - | -
`packages/property-tax-ai/tests/pacs-module.test.js` | test_only | unknown | `${BASE_URL}/api/pacs-modules/${moduleId}` | `PACS` | - | -
`packages/property-tax-ai/tests/pacs-module.test.js` | test_only | unknown | `${BASE_URL}/api/pacs-modules/by-category` | `PACS` | - | -
`packages/property-tax-ai/tests/property-story-generator.test.js` | test_only | unknown | `${BASE_URL}/api/property-stories/${invalidPropertyId}` | - | - | -
`packages/property-tax-ai/tests/property-story-generator.test.js` | test_only | unknown | `${BASE_URL}/api/property-stories/${propertyId}?tone=friendly&includeImprovements=true&includeLandRecords=true` | - | - | -
`packages/property-tax-ai/tests/property-story-generator.test.js` | test_only | unknown | `${BASE_URL}/api/property-stories/compare` | - | - | -
`packages/property-tax-ai/tests/property-story-generator.test.js` | test_only | unknown | `${BASE_URL}/api/property-stories/multiple` | - | - | -
`packages/terra-gama/app/reports/page.tsx` | unknown | unknown | `/api/reports` | - | - | -
`packages/terra-gama/components/benton-county-gis-viewer.tsx` | unknown | unknown | `/api/arcgis?service=${service}&recordCount=${count}` | - | - | -
`packages/terra-gama/components/integration-hub.tsx` | unknown | unknown | `/api/integrations` | - | - | -
`packages/terra-gama/components/integration-hub.tsx` | unknown | unknown | `/api/integrations?${queryParams}` | - | - | -
`packages/terra-gama/components/integration-hub.tsx` | unknown | unknown | `/api/integrations?action=status` | - | - | -
`packages/terra-gama/components/property-search.tsx` | unknown | unknown | `/api/properties` | - | - | -
`packages/terra-gama/components/real-time-dashboard.tsx` | unknown | unknown | `/api/market?region=${selectedRegion}&trends=true` | - | - | -
`packages/terra-permit/archive/deprecated-services/microservices/test-circuit-breaker.js` | unknown | unknown | `${API_GATEWAY}/api/circuit-breaker/health` | - | - | -
`packages/terra-permit/archive/deprecated-services/microservices/test-circuit-breaker.js` | unknown | unknown | `${API_GATEWAY}/api/circuit-breaker/health` | - | - | -
`packages/terra-permit/archive/deprecated-services/microservices/test-circuit-breaker.js` | unknown | unknown | `${API_GATEWAY}/api/circuit-breaker/reset/${serviceName}` | - | - | -
`packages/terra-permit/archive/test-data/test/advanced-circuit-breaker-tests.js` | unknown | unknown | `${BASE_URL}/api/test/circuit-breaker/${service}?reset=true` | - | - | -
`packages/terra-permit/archive/test-data/test/advanced-circuit-breaker-tests.js` | unknown | unknown | `${BASE_URL}/api/test/circuit-breaker/${service}?reset=true` | - | - | -
`packages/terra-permit/archive/test-data/test/advanced-circuit-breaker-tests.js` | unknown | unknown | `${BASE_URL}/api/test/circuit-breaker/${service}?reset=true` | - | - | -
`packages/terra-permit/archive/test-data/test/ai/ai-integration-tests.js` | unknown | unknown | `${BASE_URL}/api/ai/ask-question` | - | - | -
`packages/terra-permit/archive/test-data/test/ai/ai-integration-tests.js` | unknown | unknown | `${BASE_URL}/api/ai/search-similar` | - | - | -
`packages/terra-permit/archive/test-data/test/ai/ai-integration-tests.js` | unknown | unknown | `${BASE_URL}/api/langchain/agent/ask-question` | - | - | -
`packages/terra-permit/archive/test-data/test/ai/ai-integration-tests.js` | unknown | unknown | `${BASE_URL}/api/langchain/classify-permit` | - | - | -
`packages/terra-permit/archive/test-data/test/ai/ai-integration-tests.js` | unknown | unknown | `${BASE_URL}/api/langchain/classify-permit` | - | - | -
`packages/terra-permit/archive/test-data/test/ai/ai-integration-tests.js` | unknown | unknown | `${BASE_URL}/api/settings/openai-key` | - | - | -
`packages/terra-permit/archive/test-data/test/ai/ai-integration-tests.js` | unknown | unknown | `${BASE_URL}/api/settings/openai-key/status` | - | - | -
`packages/terra-permit/archive/test-data/test/ai/ai-integration-tests.js` | unknown | unknown | `${BASE_URL}/api/settings/openai-key/status` | - | - | -
`packages/terra-permit/archive/test-data/test/ai/ai-integration-tests.js` | unknown | unknown | `${BASE_URL}/api/test/toggle-auth` | - | - | -
`packages/terra-permit/archive/test-data/test/ai/ai-integration-tests.js` | unknown | unknown | `${BASE_URL}/api/test/toggle-auth` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/auth-tests.js` | unknown | unknown | `${BASE_URL}/api/auth/login` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/auth-tests.js` | unknown | unknown | `${BASE_URL}/api/auth/login` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/auth-tests.js` | unknown | unknown | `${BASE_URL}/api/auth/login` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/auth-tests.js` | unknown | unknown | `${BASE_URL}/api/auth/login` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/auth-tests.js` | unknown | unknown | `${BASE_URL}/api/auth/login` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/auth-tests.js` | unknown | unknown | `${BASE_URL}/api/auth/logout` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/auth-tests.js` | unknown | unknown | `${BASE_URL}/api/auth/logout` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/auth-tests.js` | unknown | unknown | `${BASE_URL}/api/auth/logout` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/auth-tests.js` | unknown | unknown | `${BASE_URL}/api/auth/me` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/auth-tests.js` | unknown | unknown | `${BASE_URL}/api/auth/me` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/auth-tests.js` | unknown | unknown | `${BASE_URL}/api/auth/me` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/auth-tests.js` | unknown | unknown | `${BASE_URL}/api/auth/register` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/auth-tests.js` | unknown | unknown | `${BASE_URL}/api/auth/register` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/auth-tests.js` | unknown | unknown | `${BASE_URL}/api/auth/register` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/auth-tests.js` | unknown | unknown | `${BASE_URL}/api/system/status` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/auth-tests.js` | unknown | unknown | `${BASE_URL}/api/system/status` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/auth-tests.js` | unknown | unknown | `${BASE_URL}/api/test/circuit-breaker/auth` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/auth-tests.js` | unknown | unknown | `${BASE_URL}/api/test/toggle-auth` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/auth-tests.js` | unknown | unknown | `${BASE_URL}/api/test/toggle-auth` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/auth-tests.js` | unknown | unknown | `${BASE_URL}/api/test/toggle-auth` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/auth-tests.js` | unknown | unknown | `${BASE_URL}/api/test/toggle-auth` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/run-auth-tests.js` | unknown | unknown | `${BASE_URL}/api/auth/login` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/run-auth-tests.js` | unknown | unknown | `${BASE_URL}/api/auth/login` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/run-auth-tests.js` | unknown | unknown | `${BASE_URL}/api/auth/login` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/run-auth-tests.js` | unknown | unknown | `${BASE_URL}/api/auth/login` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/run-auth-tests.js` | unknown | unknown | `${BASE_URL}/api/auth/login` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/run-auth-tests.js` | unknown | unknown | `${BASE_URL}/api/auth/logout` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/run-auth-tests.js` | unknown | unknown | `${BASE_URL}/api/auth/logout` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/run-auth-tests.js` | unknown | unknown | `${BASE_URL}/api/auth/logout` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/run-auth-tests.js` | unknown | unknown | `${BASE_URL}/api/auth/me` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/run-auth-tests.js` | unknown | unknown | `${BASE_URL}/api/auth/me` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/run-auth-tests.js` | unknown | unknown | `${BASE_URL}/api/auth/me` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/run-auth-tests.js` | unknown | unknown | `${BASE_URL}/api/auth/register` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/run-auth-tests.js` | unknown | unknown | `${BASE_URL}/api/auth/register` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/run-auth-tests.js` | unknown | unknown | `${BASE_URL}/api/auth/register` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/run-auth-tests.js` | unknown | unknown | `${BASE_URL}/api/system/status` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/run-auth-tests.js` | unknown | unknown | `${BASE_URL}/api/system/status` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/run-auth-tests.js` | unknown | unknown | `${BASE_URL}/api/test/circuit-breaker/auth` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/run-auth-tests.js` | unknown | unknown | `${BASE_URL}/api/test/toggle-auth` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/run-auth-tests.js` | unknown | unknown | `${BASE_URL}/api/test/toggle-auth` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/run-auth-tests.js` | unknown | unknown | `${BASE_URL}/api/test/toggle-auth` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/run-auth-tests.js` | unknown | unknown | `${BASE_URL}/api/test/toggle-auth` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/simple-auth-test.js` | unknown | unknown | `${BASE_URL}/api/auth/login` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/simple-auth-test.js` | unknown | unknown | `${BASE_URL}/api/auth/logout` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/simple-auth-test.js` | unknown | unknown | `${BASE_URL}/api/auth/me` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/simple-auth-test.js` | unknown | unknown | `${BASE_URL}/api/auth/me` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/simple-auth-test.js` | unknown | unknown | `${BASE_URL}/api/auth/register` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/simple-auth-test.js` | unknown | unknown | `${BASE_URL}/api/system/status` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/simple-auth-test.js` | unknown | unknown | `${BASE_URL}/api/system/status` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/simple-auth-test.js` | unknown | unknown | `${BASE_URL}/api/test/toggle-auth` | - | - | -
`packages/terra-permit/archive/test-data/test/auth/simple-auth-test.js` | unknown | unknown | `${BASE_URL}/api/test/toggle-auth` | - | - | -
`packages/terra-permit/archive/test-data/test/core/app-startup-test.js` | unknown | unknown | `${BASE_URL}/api/health` | - | - | -
`packages/terra-permit/archive/test-data/test/core/app-startup-test.js` | unknown | unknown | `${BASE_URL}/api/non-existent-endpoint` | - | - | -
`packages/terra-permit/archive/test-data/test/core/app-startup-test.js` | unknown | unknown | `${BASE_URL}/api/organizations` | - | - | -
`packages/terra-permit/archive/test-data/test/core/app-startup-test.js` | unknown | unknown | `${BASE_URL}/api/organizations` | - | - | -
`packages/terra-permit/archive/test-data/test/core/app-startup-test.js` | unknown | unknown | `${BASE_URL}/api/test/auth-status` | - | - | -
`packages/terra-permit/archive/test-data/test/core/app-startup-test.js` | unknown | unknown | `${BASE_URL}/api/test/toggle-auth` | - | - | -
`packages/terra-permit/archive/test-data/test/core/app-startup-test.js` | unknown | unknown | `${BASE_URL}/api/test/toggle-auth` | - | - | -
`packages/terra-permit/archive/test-data/test/core/db.test.js` | test_only | unknown | `${BASE_URL}/api/health` | - | - | -
`packages/terra-permit/archive/test-data/test/core/health.test.js` | test_only | unknown | `${BASE_URL}/api/health` | - | - | -
`packages/terra-permit/archive/test-data/test/core/health.test.js` | test_only | unknown | `${BASE_URL}/api/non-existent-route` | - | - | -
`packages/terra-permit/archive/test-data/test/core/health.test.ts` | test_only | unknown | `${BASE_URL}/api/health` | - | - | -
`packages/terra-permit/archive/test-data/test/core/health.test.ts` | test_only | unknown | `${BASE_URL}/api/non-existent-route` | - | - | -
`packages/terra-permit/archive/test-data/test/core/help-components.test.js` | test_only | unknown | `${BASE_URL}/api/health` | - | - | -
`packages/terra-permit/archive/test-data/test/core/run-core-tests.js` | unknown | unknown | `${BASE_URL}/api/health` | - | - | -
`packages/terra-permit/archive/test-data/test/core/run-core-tests.js` | unknown | unknown | `${BASE_URL}/api/health` | - | - | -
`packages/terra-permit/archive/test-data/test/core/run-core-tests.js` | unknown | unknown | `${BASE_URL}/api/health` | - | - | -
`packages/terra-permit/archive/test-data/test/core/run-core-tests.js` | unknown | unknown | `${BASE_URL}/api/non-existent-endpoint` | - | - | -
`packages/terra-permit/archive/test-data/test/core/run-core-tests.js` | unknown | unknown | `${BASE_URL}/api/organizations` | - | - | -
`packages/terra-permit/archive/test-data/test/core/run-core-tests.js` | unknown | unknown | `${BASE_URL}/api/organizations` | - | - | -
`packages/terra-permit/archive/test-data/test/core/run-core-tests.js` | unknown | unknown | `${BASE_URL}/api/system/status` | - | - | -
`packages/terra-permit/archive/test-data/test/core/run-core-tests.js` | unknown | unknown | `${BASE_URL}/api/test/circuit-breaker/non-existent-service` | - | - | -
`packages/terra-permit/archive/test-data/test/core/run-core-tests.js` | unknown | unknown | `${BASE_URL}/api/test/toggle-auth` | - | - | -
`packages/terra-permit/archive/test-data/test/core/run-core-tests.js` | unknown | unknown | `${BASE_URL}/api/test/toggle-auth` | - | - | -
`packages/terra-permit/archive/test-data/test/core/run-core-tests.js` | unknown | unknown | `${BASE_URL}/api/test/toggle-auth` | - | - | -
`packages/terra-permit/archive/test-data/test/core/run-core-tests.js` | unknown | unknown | `${BASE_URL}/api/test/toggle-auth` | - | - | -
`packages/terra-permit/archive/test-data/test/core/run-core-tests.js` | unknown | unknown | `${BASE_URL}/api/test/toggle-auth` | - | - | -
`packages/terra-permit/archive/test-data/test/database/storage-tests.js` | unknown | unknown | `${BASE_URL}/api/auth/me` | - | - | -
`packages/terra-permit/archive/test-data/test/database/storage-tests.js` | unknown | unknown | `${BASE_URL}/api/organizations` | - | - | -
`packages/terra-permit/archive/test-data/test/database/storage-tests.js` | unknown | unknown | `${BASE_URL}/api/organizations` | - | - | -
`packages/terra-permit/archive/test-data/test/database/storage-tests.js` | unknown | unknown | `${BASE_URL}/api/organizations` | - | - | -
`packages/terra-permit/archive/test-data/test/database/storage-tests.js` | unknown | unknown | `${BASE_URL}/api/organizations` | - | - | -
`packages/terra-permit/archive/test-data/test/database/storage-tests.js` | unknown | unknown | `${BASE_URL}/api/organizations/${secondOrgId}/switch` | - | - | -
`packages/terra-permit/archive/test-data/test/database/storage-tests.js` | unknown | unknown | `${BASE_URL}/api/organizations/${testOrgId}/switch` | - | - | -
`packages/terra-permit/archive/test-data/test/database/storage-tests.js` | unknown | unknown | `${BASE_URL}/api/organizations/${testOrgId}/switch` | - | - | -
`packages/terra-permit/archive/test-data/test/database/storage-tests.js` | unknown | unknown | `${BASE_URL}/api/permits` | - | - | -
`packages/terra-permit/archive/test-data/test/database/storage-tests.js` | unknown | unknown | `${BASE_URL}/api/permits` | - | - | -
`packages/terra-permit/archive/test-data/test/database/storage-tests.js` | unknown | unknown | `${BASE_URL}/api/system/status` | - | - | -
`packages/terra-permit/archive/test-data/test/database/storage-tests.js` | unknown | unknown | `${BASE_URL}/api/test/toggle-auth` | - | - | -
`packages/terra-permit/archive/test-data/test/database/storage-tests.js` | unknown | unknown | `${BASE_URL}/api/test/toggle-auth` | - | - | -
`packages/terra-permit/archive/test-data/test/database/storage-tests.js` | unknown | unknown | `${BASE_URL}/api/uploads` | - | - | -
`packages/terra-permit/archive/test-data/test/database/storage-tests.js` | unknown | unknown | `${BASE_URL}/api/uploads` | - | - | -
`packages/terra-permit/archive/test-data/test/database/storage-tests.js` | unknown | unknown | `${BASE_URL}/api/uploads` | - | - | -
`packages/terra-permit/archive/test-data/test/database/storage-tests.js` | unknown | unknown | `${BASE_URL}/api/uploads` | - | - | -
`packages/terra-permit/archive/test-data/test/database/storage-tests.js` | unknown | unknown | `${BASE_URL}/api/uploads/${testUploadId}/permits` | - | - | -
`packages/terra-permit/archive/test-data/test/mcp/protocol-tests.js` | unknown | unknown | `${BASE_URL}/api/mcp/process` | - | - | -
`packages/terra-permit/archive/test-data/test/mcp/protocol-tests.js` | unknown | unknown | `${BASE_URL}/api/mcp/process` | - | - | -
`packages/terra-permit/archive/test-data/test/mcp/protocol-tests.js` | unknown | unknown | `${BASE_URL}/api/mcp/process` | - | - | -
`packages/terra-permit/archive/test-data/test/mcp/protocol-tests.js` | unknown | unknown | `${BASE_URL}/api/mcp/process` | - | - | -
`packages/terra-permit/archive/test-data/test/mcp/protocol-tests.js` | unknown | unknown | `${BASE_URL}/api/mcp/validate` | - | - | -
`packages/terra-permit/archive/test-data/test/mcp/protocol-tests.js` | unknown | unknown | `${BASE_URL}/api/mcp/validate` | - | - | -
`packages/terra-permit/archive/test-data/test/mcp/protocol-tests.js` | unknown | unknown | `${BASE_URL}/api/test/toggle-auth` | - | - | -
`packages/terra-permit/archive/test-data/test/mcp/protocol-tests.js` | unknown | unknown | `${BASE_URL}/api/test/toggle-auth` | - | - | -
`packages/terra-permit/archive/test-data/test/microservices/test-circuit-breaker.js` | unknown | unknown | `${BASE_URL}/api/test/circuit-breaker/${service}` | - | - | -
`packages/terra-permit/archive/test-data/test/microservices/test-circuit-breaker.js` | unknown | unknown | `${BASE_URL}/api/test/toggle-auth` | - | - | -
`packages/terra-permit/archive/test-data/test/microservices/test-circuit-breaker.js` | unknown | unknown | `${BASE_URL}/api/test/toggle-auth` | - | - | -
`packages/terra-permit/archive/test-data/test/microservices/test-service-discovery.js` | unknown | unknown | `${BASE_URL}/api/test/toggle-auth` | - | - | -
`packages/terra-permit/archive/test-data/test/microservices/test-service-discovery.js` | unknown | unknown | `${BASE_URL}/api/test/toggle-auth` | - | - | -
`packages/terra-permit/archive/test-data/test/neural-network-tests.js` | unknown | unknown | `${BASE_URL}/api/health` | - | - | -
`packages/terra-permit/archive/test-data/test/neural-network-tests.js` | unknown | unknown | `${BASE_URL}/api/neural/decision` | - | - | -
`packages/terra-permit/archive/test-data/test/neural-network-tests.js` | unknown | unknown | `${BASE_URL}/api/neural/decision` | - | - | -
`packages/terra-permit/archive/test-data/test/neural-network-tests.js` | unknown | unknown | `${BASE_URL}/api/neural/decision` | - | - | -
`packages/terra-permit/archive/test-data/test/neural-network-tests.js` | unknown | unknown | `${BASE_URL}/api/neural/decision` | - | - | -
`packages/terra-permit/archive/test-data/test/neural-network-tests.js` | unknown | unknown | `${BASE_URL}/api/neural/decision` | - | - | -
`packages/terra-permit/archive/test-data/test/neural-network-tests.js` | unknown | unknown | `${BASE_URL}/api/neural/insights/${county}` | - | - | -
`packages/terra-permit/archive/test-data/test/neural-network-tests.js` | unknown | unknown | `${BASE_URL}/api/neural/insights/benton` | - | - | -
`packages/terra-permit/archive/test-data/test/neural-network-tests.js` | unknown | unknown | `${BASE_URL}/api/neural/learn` | - | - | -
`packages/terra-permit/archive/test-data/test/neural-network-tests.js` | unknown | unknown | `${BASE_URL}/api/neural/learn` | - | - | -
`packages/terra-permit/archive/test-data/test/neural-network-tests.js` | unknown | unknown | `${BASE_URL}/api/neural/status` | - | - | -
`packages/terra-permit/archive/test-data/test/neural-network-tests.js` | unknown | unknown | `${BASE_URL}/api/neural/status` | - | - | -
`packages/terra-permit/archive/test-data/test/neural-network-tests.js` | unknown | unknown | `${BASE_URL}/api/neural/status` | - | - | -
`packages/terra-permit/archive/test-data/test/neural-network-tests.js` | unknown | unknown | `${BASE_URL}/api/neural/status` | - | - | -
`packages/terra-permit/archive/test-data/test/neural-network-tests.js` | unknown | unknown | `${BASE_URL}/api/neural/status` | - | - | -
`packages/terra-permit/archive/test-data/test/neural-network-tests.js` | unknown | unknown | `${BASE_URL}/api/neural/status` | - | - | -
`packages/terra-permit/archive/test-data/test/neural-network-tests.js` | unknown | unknown | `${BASE_URL}/api/neural/status` | - | - | -
`packages/terra-permit/archive/test-data/test/neural-network-tests.js` | unknown | unknown | `${BASE_URL}/api/neural/status` | - | - | -
`packages/terra-permit/archive/test-data/test/neural-network-tests.js` | unknown | unknown | `${BASE_URL}/api/quantum/automation/${county}` | - | - | -
`packages/terra-permit/archive/test-data/test/neural-network-tests.js` | unknown | unknown | `${BASE_URL}/api/quantum/automation/washington` | - | - | -
`packages/terra-permit/archive/test-data/test/neural-network-tests.js` | unknown | unknown | `${BASE_URL}/api/quantum/deployment` | - | - | -
`packages/terra-permit/archive/test-data/test/neural-network-tests.js` | unknown | unknown | `${BASE_URL}/api/quantum/deployment` | - | - | -
`packages/terra-permit/archive/test-data/test/neural-network-tests.js` | unknown | unknown | `${BASE_URL}/api/quantum/infrastructure/${county}` | - | - | -
`packages/terra-permit/archive/test-data/test/neural-network-tests.js` | unknown | unknown | `${BASE_URL}/api/quantum/infrastructure/multnomah` | - | - | -
`packages/terra-permit/archive/test-data/test/neural-network-tests.js` | unknown | unknown | `${BASE_URL}/api/settings/openai-key/status` | - | - | -
`packages/terra-permit/archive/test-data/test/neural-network-tests.js` | unknown | unknown | `${BASE_URL}/api/test/auth-status` | - | - | -
`packages/terra-permit/archive/test-data/test/neural-network-tests.js` | unknown | unknown | `${BASE_URL}/api/test/toggle-auth` | - | - | -
`packages/terra-permit/archive/test-data/test/neural-network-tests.js` | unknown | unknown | `${BASE_URL}/api/test/toggle-auth` | - | - | -
`packages/terra-permit/archive/test-data/test/recovery-test.js` | unknown | unknown | `${BASE_URL}/api/test/circuit-breaker/${SERVICE}?reset=true` | - | - | -
`packages/terra-permit/archive/test-data/test/run-all-tests.js` | unknown | unknown | `http://localhost:5000/api/health` | - | - | -
`packages/terra-permit/archive/test-data/test/test-auth-token-storage.js` | unknown | unknown | `http://localhost:5000/api/auth/dev-login` | - | - | -
`packages/terra-permit/archive/test-data/test/test-auth-token-storage.js` | unknown | unknown | `http://localhost:5000/api/recommendations` | - | - | -
`packages/terra-permit/client/src/components/ai/SimilarPermitSearch.tsx` | unknown | unknown | `/api/ai/vector/search` | - | - | -
`packages/terra-permit/client/src/components/AutoLogin.tsx` | unknown | unknown | `/api/auth/dev-login` | - | - | -
`packages/terra-permit/client/src/components/SmartDropZone.tsx` | unknown | unknown | `/api/extract` | - | - | -
`packages/terra-permit/client/src/components/tools/PACSDataManager.tsx` | unknown | unknown | `/api/pacs/health` | `PACS` | - | -
`packages/terra-permit/client/src/components/tools/PACSDataManager.tsx` | unknown | unknown | `/api/pacs/tools/export_logs` | `PACS` | - | -
`packages/terra-permit/client/src/components/tools/PACSDataManager.tsx` | unknown | unknown | `/api/pacs/tools/export_logs?status=${value}` | `PACS` | - | -
`packages/terra-permit/client/src/components/tools/PACSDataManager.tsx` | unknown | unknown | `/api/pacs/tools/export_parcel_snapshot?format=${format}` | `PACS` | - | -
`packages/terra-permit/client/src/components/tools/PACSDataManager.tsx` | unknown | unknown | `/api/pacs/tools/import_logs` | `PACS` | - | -
`packages/terra-permit/client/src/components/tools/PACSDataManager.tsx` | unknown | unknown | `/api/pacs/tools/import_logs?status=${value}` | `PACS` | - | -
`packages/terra-permit/client/src/components/tools/PACSDataManager.tsx` | unknown | unknown | `/api/pacs/tools/import_property_values` | `PACS` | - | -
`packages/terra-permit/client/src/components/tools/PACSDataManager.tsx` | unknown | unknown | `/api/pacs/tools/validate_property_values` | `PACS` | - | -
`packages/terra-permit/client/src/contexts/AuthContext.tsx` | unknown | unknown | `/api/auth/login` | - | - | -
`packages/terra-permit/client/src/contexts/AuthContext.tsx` | unknown | unknown | `/api/auth/logout` | - | - | -
`packages/terra-permit/client/src/contexts/AuthContext.tsx` | unknown | unknown | `/api/auth/me` | - | - | -
`packages/terra-permit/client/src/contexts/AuthContext.tsx` | unknown | unknown | `/api/auth/register` | - | - | -
`packages/terra-permit/client/src/lib/api.ts` | unknown | unknown | `/api/permits/${permitId}/history` | - | - | -
`packages/terra-permit/client/src/lib/api.ts` | unknown | unknown | `/api/permits/upload` | - | - | -
`packages/terra-permit/client/src/lib/api.ts` | unknown | unknown | `/api/uploads` | - | - | -
`packages/terra-permit/client/src/lib/api.ts` | unknown | unknown | `/api/uploads/${uploadId}/history` | - | - | -
`packages/terra-permit/client/src/lib/api.ts` | unknown | unknown | `/api/uploads/${uploadId}/permits` | - | - | -
`packages/terra-pilt/client/src/components/SpectacularReportGenerator.tsx` | unknown | unknown | `/api/pilt/history` | - | - | -
`packages/terra-pilt/client/src/components/SpectacularReportGenerator.tsx` | unknown | unknown | `/api/reports/generate` | - | - | -
`packages/terra-pilt/client/src/components/SpectacularReportGenerator.tsx` | unknown | unknown | `/api/reports/templates` | - | - | -
`packages/terra-pilt/client/src/hooks/use-auth.tsx` | unknown | unknown | `/api/auth/login` | - | - | -
`packages/terra-pilt/client/src/hooks/use-auth.tsx` | unknown | unknown | `/api/auth/logout` | - | - | -
`packages/terra-pilt/client/src/hooks/use-auth.tsx` | unknown | unknown | `/api/auth/register` | - | - | -
`packages/terra-pilt/client/src/hooks/use-auth.tsx` | unknown | unknown | `/api/auth/user` | - | - | -
`packages/terra-pilt/client/src/pages/BulkImport.tsx` | unknown | unknown | `/api/etl/upload-csv` | - | - | -
`packages/terra-pilt/client/src/pages/ConsolidatedDashboard.tsx` | unknown | unknown | `/api/pilt/distribution?year=${selectedYear}` | - | - | -
`packages/terra-pilt/client/src/pages/ConsolidatedDashboard.tsx` | unknown | unknown | `/api/pilt/generate-report` | - | - | -
`packages/terra-pilt/client/src/pages/ConsolidatedDashboard.tsx` | unknown | unknown | `/api/pilt/history?year=${selectedYear}` | - | - | -
`packages/terra-pilt/client/src/pages/Reports-backup.tsx` | unknown | unknown | `/api/pilt/generate-report` | - | - | -
`packages/terra-pilt/client/src/pages/Reports.tsx` | unknown | unknown | `/api/pilt/distribution?year=${selectedYear}` | - | - | -
`packages/terra-sync/src/components/analytics/metrics-cards.tsx` | unknown | unknown | `/api/analytics/metrics` | - | - | -
`packages/terra-sync/src/components/analytics/usage-chart.tsx` | unknown | unknown | `/api/analytics/usage` | - | - | -
`packages/terra-sync/src/pages/login.tsx` | unknown | unknown | `/api/auth/login` | - | - | -
`packages/terrabuild/client/src/components/ai/AICalculationExplainer.tsx` | deferred_or_package | costforge | `/api/aimodules/execute` | - | - | -
`packages/terrabuild/client/src/components/ai/AICalculationExplainer.tsx` | deferred_or_package | costforge | `/api/costforge/building-types` | - | - | -
`packages/terrabuild/client/src/components/ai/AICalculationExplainer.tsx` | deferred_or_package | costforge | `/api/costforge/cost-estimate` | - | - | -
`packages/terrabuild/client/src/components/ai/AICalculationExplainer.tsx` | deferred_or_package | costforge | `/api/costforge/regions` | - | - | -
`packages/terrabuild/client/src/components/ai/AIMatrixAnalyzer.tsx` | deferred_or_package | unknown | `/api/benchmarking/hierarchical-costs` | - | - | -
`packages/terrabuild/client/src/components/ai/CostPredictionWizard.tsx` | deferred_or_package | unknown | `/api/aimodules/predict-cost` | `PACS` | - | -
`packages/terrabuild/client/src/components/calibration/AdjustmentSimulator.tsx` | deferred_or_package | unknown | `/api/matrixversion/${matrixVersionId}/apply-adjustment` | - | - | -
`packages/terrabuild/client/src/components/calibration/AIFindingQueue.tsx` | deferred_or_package | workbench | `/api/calibrationdiagnostic/findings?matrixVersionId=${matrixVersionId}` | - | - | -
`packages/terrabuild/client/src/components/calibration/AIFindingQueue.tsx` | deferred_or_package | workbench | `/api/calibrationdiagnostic/findings/${finding.id}/flag-to-workbench` | - | - | -
`packages/terrabuild/client/src/components/calibration/AIFindingQueue.tsx` | deferred_or_package | workbench | `/api/calibrationdiagnostic/findings/${finding.id}/resolve` | - | - | -
`packages/terrabuild/client/src/components/calibration/AIFindingQueue.tsx` | deferred_or_package | workbench | `/api/calibrationdiagnostic/run` | - | - | -
`packages/terrabuild/client/src/components/calibration/CalibrationMemoPanel.tsx` | deferred_or_package | unknown | `/api/calibrationmemo?matrixVersionId=${matrixVersionId}` | - | - | -
`packages/terrabuild/client/src/components/calibration/CalibrationMemoPanel.tsx` | deferred_or_package | unknown | `/api/calibrationmemo/${memo?.id}/section` | - | - | -
`packages/terrabuild/client/src/components/calibration/CalibrationMemoPanel.tsx` | deferred_or_package | unknown | `/api/calibrationmemo/auto-draft` | - | - | -
`packages/terrabuild/client/src/components/calibration/LiveDiagnosticsBar.tsx` | deferred_or_package | unknown | `/api/calibrationdiagnostic/summary` | - | - | -
`packages/terrabuild/client/src/components/calibration/MassAdjustmentControls.tsx` | deferred_or_package | unknown | `/api/matrixversion/${draftVersionId}/rates` | - | - | -
`packages/terrabuild/client/src/components/calibration/MatrixDiffView.tsx` | deferred_or_package | unknown | `/api/matrixversion/${draftVersionId}` | - | - | -
`packages/terrabuild/client/src/components/calibration/MatrixDiffView.tsx` | deferred_or_package | unknown | `/api/matrixversion/${lockedVersionId}` | - | - | -
`packages/terrabuild/client/src/components/calibration/NeighborhoodMatrix.tsx` | deferred_or_package | costforge | `/api/costforge/calibration/mass-adjust-preview` | - | - | -
`packages/terrabuild/client/src/components/calibration/NeighborhoodMatrix.tsx` | deferred_or_package | costforge | `/api/costforge/calibration/neighborhood-matrix?taxYear=${taxYear}&minSales=3` | - | - | -
`packages/terrabuild/client/src/components/calibration/ParcelEvidenceViewer.tsx` | deferred_or_package | workbench | `/api/calibrationdiagnostic/outlier-exclusions` | - | - | -
`packages/terrabuild/client/src/components/calibration/ParcelEvidenceViewer.tsx` | deferred_or_package | workbench | `/api/calibrationdiagnostic/parcel-evidence?${params}` | - | - | -
`packages/terrabuild/client/src/components/calibration/RevalAreaNavigator.tsx` | deferred_or_package | unknown | `/api/calibrationdiagnostic/reval-area-summary?matrixVersionId=${matrixVersionId}` | - | - | -
`packages/terrabuild/client/src/components/calibration/StratifiedEquityPanel.tsx` | deferred_or_package | unknown | `/api/calibrationdiagnostic/stratified-equity?${params}` | - | - | -
`packages/terrabuild/client/src/components/calibration/VersionTimeline.tsx` | deferred_or_package | unknown | `/api/matrixversion` | - | - | -
`packages/terrabuild/client/src/components/calibration/VersionTimeline.tsx` | deferred_or_package | unknown | `/api/matrixversion` | - | - | -
`packages/terrabuild/client/src/components/calibration/VersionTimeline.tsx` | deferred_or_package | unknown | `/api/matrixversion/${id}/transition` | - | - | -
`packages/terrabuild/client/src/components/collaboration/ProjectActivitiesLog.tsx` | deferred_or_package | unknown | `/api/projects/${projectId}/activities${useServerPagination ? ` | - | - | -
`packages/terrabuild/client/src/components/comments/CommentsSection.tsx` | deferred_or_package | unknown | `/api/comments/${commentId}` | - | - | -
`packages/terrabuild/client/src/components/comments/CommentsSection.tsx` | deferred_or_package | unknown | `/api/comments/${commentId}/resolve` | - | - | -
`packages/terrabuild/client/src/components/comments/CommentsSection.tsx` | deferred_or_package | unknown | `/api/comments/${commentToDelete}` | - | - | -
`packages/terrabuild/client/src/components/comments/CommentsSection.tsx` | deferred_or_package | unknown | `/api/comments/${targetType}/${targetId}` | - | - | -
`packages/terrabuild/client/src/components/comments/CommentsSection.tsx` | deferred_or_package | unknown | `/api/comments/${targetType}/${targetId}` | - | - | -
`packages/terrabuild/client/src/components/comments/CommentsSection.tsx` | deferred_or_package | unknown | `/api/comments/${targetType}/${targetId}` | - | - | -
`packages/terrabuild/client/src/components/common/FileUploader.tsx` | deferred_or_package | unknown | `/api/file-uploads/upload` | - | - | -
`packages/terrabuild/client/src/components/cost-analysis/RegionalCostComparison.tsx` | deferred_or_package | costforge | `/api/costforge/cost-matrix/benton` | - | - | -
`packages/terrabuild/client/src/components/CostCalculatorAPI.tsx` | deferred_or_package | costforge | `/api/costforge/cost-estimate` | `CAMA` | - | Frontend legacy terminology appears outside the active June 10 shell; classify before promoting this surface.
`packages/terrabuild/client/src/components/CostCalculatorAPI.tsx` | deferred_or_package | costforge | `/api/costforge/depreciation-calculate` | `CAMA` | - | Frontend legacy terminology appears outside the active June 10 shell; classify before promoting this surface.
`packages/terrabuild/client/src/components/CostCalculatorAPI.tsx` | deferred_or_package | costforge | `/api/costforge/parcels/${encodeURIComponent(parcelId)}/cama` | `CAMA` | - | Frontend legacy terminology appears outside the active June 10 shell; classify before promoting this surface.
`packages/terrabuild/client/src/components/CostCalculatorAPI.tsx` | deferred_or_package | costforge | `/api/costforge/valuations` | `CAMA` | - | Frontend legacy terminology appears outside the active June 10 shell; classify before promoting this surface.
`packages/terrabuild/client/src/components/dashboard/BuildingTypeCostBreakdown.tsx` | deferred_or_package | unknown | `/api/cost-matrices` | - | - | -
`packages/terrabuild/client/src/components/dashboard/ConfigurationTab.tsx` | deferred_or_package | unknown | `/api/settings` | - | - | -
`packages/terrabuild/client/src/components/dashboard/CostPredictionInsights.tsx` | deferred_or_package | unknown | `/api/ai/openai-status` | - | - | -
`packages/terrabuild/client/src/components/dashboard/CostPredictionInsights.tsx` | deferred_or_package | unknown | `/api/ai/predict-cost` | - | - | -
`packages/terrabuild/client/src/components/dashboard/CostPredictionInsights.tsx` | deferred_or_package | unknown | `/api/cost-matrices` | - | - | -
`packages/terrabuild/client/src/components/dashboard/RecentActivity.tsx` | deferred_or_package | unknown | `/api/activities` | - | - | -
`packages/terrabuild/client/src/components/data-connectors/DataConnectionTester.tsx` | deferred_or_package | unknown | `/api/data-connections/test/${type}` | - | - | -
`packages/terrabuild/client/src/components/data-connectors/FTPFilePreview.tsx` | deferred_or_package | unknown | `/api/data-connectors/ftp/download` | - | - | -
`packages/terrabuild/client/src/components/data-connectors/FTPFilePreview.tsx` | deferred_or_package | unknown | `/api/data-connectors/ftp/preview` | - | - | -
`packages/terrabuild/client/src/components/data-connectors/FTPManagement.tsx` | deferred_or_package | unknown | `/api/export/create-directory` | - | - | -
`packages/terrabuild/client/src/components/data-connectors/FTPManagement.tsx` | deferred_or_package | unknown | `/api/export/file` | - | - | -
`packages/terrabuild/client/src/components/data-connectors/FTPManagement.tsx` | deferred_or_package | unknown | `/api/export/file` | - | - | -
`packages/terrabuild/client/src/components/data-connectors/FTPManagement.tsx` | deferred_or_package | unknown | `/api/export/list-files?path=${encodeURIComponent(path)}` | - | - | -
`packages/terrabuild/client/src/components/data-connectors/FTPManagement.tsx` | deferred_or_package | unknown | `/api/export/test-connection` | - | - | -
`packages/terrabuild/client/src/components/data-connectors/FTPSyncScheduler.tsx` | deferred_or_package | unknown | `/api/data-connectors/ftp-sync/history/${connectionId}` | `CAMA` | - | -
`packages/terrabuild/client/src/components/data-connectors/FTPSyncScheduler.tsx` | deferred_or_package | unknown | `/api/data-connectors/ftp-sync/run/${data.connectionId}/${data.name}` | `CAMA` | - | -
`packages/terrabuild/client/src/components/data-connectors/FTPSyncScheduler.tsx` | deferred_or_package | unknown | `/api/data-connectors/ftp-sync/schedules` | `CAMA` | - | -
`packages/terrabuild/client/src/components/data-connectors/FTPSyncScheduler.tsx` | deferred_or_package | unknown | `/api/data-connectors/ftp-sync/schedules/${connectionId}` | `CAMA` | - | -
`packages/terrabuild/client/src/components/data-connectors/FTPSyncScheduler.tsx` | deferred_or_package | unknown | `/api/data-connectors/ftp-sync/schedules/${data.connectionId}/${data.name}` | `CAMA` | - | -
`packages/terrabuild/client/src/components/data-connectors/FTPSyncScheduler.tsx` | deferred_or_package | unknown | `/api/data-connectors/ftp-sync/schedules/${data.id}` | `CAMA` | - | -
`packages/terrabuild/client/src/components/data-transfer/FTPConnectionManager.tsx` | deferred_or_package | unknown | `/api/ftp/download?path=${encodeURIComponent(currentPath)}&filename=${encodeURIComponent(filename)}` | - | - | -
`packages/terrabuild/client/src/components/DataVisualization.tsx` | deferred_or_package | unknown | `/api/analytics/building-type-comparison?revalArea=${comparisonRevalArea}&year=${comparisonYear}&squareFootage=${squareFootage}` | - | - | -
`packages/terrabuild/client/src/components/DataVisualization.tsx` | deferred_or_package | unknown | `/api/analytics/cost-breakdown/${calculationId}` | - | - | -
`packages/terrabuild/client/src/components/DataVisualization.tsx` | deferred_or_package | unknown | `/api/analytics/regional-comparison?buildingType=${comparisonBuildingType}&year=${comparisonYear}&squareFootage=${squareFootage}` | - | - | -
`packages/terrabuild/client/src/components/DataVisualization.tsx` | deferred_or_package | unknown | `/api/analytics/time-series?buildingType=${buildingType}&revalArea=${revalArea}&startYear=${startYear}&endYear=${endYear}` | - | - | -
`packages/terrabuild/client/src/components/geo/GeoAssessment.tsx` | deferred_or_package | unknown | `/api/properties` | - | - | -
`packages/terrabuild/client/src/components/PredictiveCostAnalysis.tsx` | deferred_or_package | costforge | `/api/costforge/cost-estimate` | - | - | -
`packages/terrabuild/client/src/components/storyteller/EnhancedStoryTeller.tsx` | deferred_or_package | unknown | `/api/settings/ANTHROPIC_API_KEY_STATUS` | - | - | -
`packages/terrabuild/client/src/components/visualizations/DrilldownBarChart.tsx` | deferred_or_package | unknown | `/api/benchmarking/hierarchical-costs` | - | - | -
`packages/terrabuild/client/src/components/visualizations/MCPVisualizationController.tsx` | deferred_or_package | unknown | `/api/analytics/hierarchical-costs?${params.toString()}` | - | - | -
`packages/terrabuild/client/src/components/visualizations/MCPVisualizationController.tsx` | deferred_or_package | unknown | `/api/analytics/regional-costs?${params.toString()}` | - | - | -
`packages/terrabuild/client/src/components/visualizations/MCPVisualizationController.tsx` | deferred_or_package | unknown | `/api/analytics/statistical-correlations?${params.toString()}` | - | - | -
`packages/terrabuild/client/src/components/visualizations/MCPVisualizations.tsx` | deferred_or_package | unknown | `/api/swarm/status` | - | - | -
`packages/terrabuild/client/src/components/visualizations/RegionalHeatmap.tsx` | deferred_or_package | unknown | `/api/benchmarking/regional-costs?county=Benton` | `PACS` | - | -
`packages/terrabuild/client/src/components/visualizations/StatisticalAnalysis.tsx` | deferred_or_package | unknown | `/api/benchmarking/statistical-data?${params}` | - | - | -
`packages/terrabuild/client/src/components/visualizations/VisualizationController.tsx` | deferred_or_package | unknown | `/api/benchmarking/hierarchical-costs?${params}` | `PACS` | - | -
`packages/terrabuild/client/src/components/visualizations/VisualizationController.tsx` | deferred_or_package | unknown | `/api/benchmarking/regional-costs?${params}` | `PACS` | - | -
`packages/terrabuild/client/src/components/visualizations/VisualizationController.tsx` | deferred_or_package | unknown | `/api/benchmarking/statistical-data?${params}` | `PACS` | - | -
`packages/terrabuild/client/src/components/visualizations/VisualizationFilterControl.tsx` | deferred_or_package | unknown | `/api/regions` | `PACS` | - | -
`packages/terrabuild/client/src/contexts/ProjectContext.tsx` | deferred_or_package | unknown | `/api/shared-projects/${projectId}` | - | - | -
`packages/terrabuild/client/src/contexts/ProjectContext.tsx` | deferred_or_package | unknown | `/api/shared-projects/${projectId}/activities` | - | - | -
`packages/terrabuild/client/src/contexts/ProjectContext.tsx` | deferred_or_package | unknown | `/api/shared-projects/${projectId}/items` | - | - | -
`packages/terrabuild/client/src/contexts/ProjectContext.tsx` | deferred_or_package | unknown | `/api/shared-projects/${projectId}/members` | - | - | -
`packages/terrabuild/client/src/hooks/use-mcp.ts` | deferred_or_package | costforge | `/api/aimodules/execute` | `PACS` | - | Frontend legacy terminology appears outside the active June 10 shell; classify before promoting this surface.
`packages/terrabuild/client/src/hooks/use-mcp.ts` | deferred_or_package | costforge | `/api/aimodules/execute` | `PACS` | - | Frontend legacy terminology appears outside the active June 10 shell; classify before promoting this surface.
`packages/terrabuild/client/src/hooks/use-mcp.ts` | deferred_or_package | costforge | `/api/aimodules/status` | `PACS` | - | Frontend legacy terminology appears outside the active June 10 shell; classify before promoting this surface.
`packages/terrabuild/client/src/hooks/use-mcp.ts` | deferred_or_package | costforge | `/api/costforge/cost-estimate` | `PACS` | - | Frontend legacy terminology appears outside the active June 10 shell; classify before promoting this surface.
`packages/terrabuild/client/src/hooks/useStorytellingAPI.ts` | deferred_or_package | unknown | `/api/stories/types` | - | - | -
`packages/terrabuild/client/src/lib/devAuth.ts` | deferred_or_package | unknown | `/api/auth/dev-token` | - | - | -
`packages/terrabuild/client/src/lib/swarmClient.ts` | deferred_or_package | unknown | `/api/aiswarm/status` | - | - | -
`packages/terrabuild/client/src/lib/swarmClient.ts` | deferred_or_package | unknown | `/api/aiswarm/workflow/execute` | - | - | -
`packages/terrabuild/client/src/lib/swarmClient.ts` | deferred_or_package | unknown | `/api/swarm/execute` | - | - | -
`packages/terrabuild/client/src/lib/swarmClient.ts` | deferred_or_package | unknown | `/api/swarm/modules/all/stop` | - | - | -
`packages/terrabuild/client/src/lib/swarmClient.ts` | deferred_or_package | unknown | `/api/swarm/status` | - | - | -
`packages/terrabuild/client/src/pages/BenchmarkingPage.tsx` | deferred_or_package | costforge | `/api/costforge/building-types` | - | - | -
`packages/terrabuild/client/src/pages/BenchmarkingPage.tsx` | deferred_or_package | costforge | `/api/costforge/regions` | - | - | -
`packages/terrabuild/client/src/pages/CalibrationWorkbench.tsx` | deferred_or_package | workbench | `/api/calibrationdiagnostic/parcel-evidence?${parcelEvidenceParams}` | - | - | -
`packages/terrabuild/client/src/pages/CalibrationWorkbench.tsx` | deferred_or_package | workbench | `/api/matrixversion` | - | - | -
`packages/terrabuild/client/src/pages/CalibrationWorkbench.tsx` | deferred_or_package | workbench | `/api/matrixversion/${activeDraftId}` | - | - | -
`packages/terrabuild/client/src/pages/CostCalculator.tsx` | deferred_or_package | unknown | `/api/calculate` | - | - | -
`packages/terrabuild/client/src/pages/DashboardPage.tsx` | deferred_or_package | costforge | `/api/analytics/trends?timeRange=12m` | - | - | -
`packages/terrabuild/client/src/pages/DashboardPage.tsx` | deferred_or_package | costforge | `/api/costforge/valuations?limit=5` | - | - | -
`packages/terrabuild/client/src/pages/MCPOverviewPage.tsx` | deferred_or_package | costforge | `/api/aimodules/status` | - | - | -
`packages/terrabuild/client/src/pages/MCPOverviewPage.tsx` | deferred_or_package | costforge | `/api/swarm/mcp-tools` | - | - | -
`packages/terrabuild/client/src/pages/ReportsPage.tsx` | deferred_or_package | costforge | `/api/costforge/valuations` | - | - | -
`packages/terrabuild/client/src/pages/WhatIfScenariosPage.tsx` | deferred_or_package | unknown | `/api/what-if-scenarios` | `PACS` | - | -
`packages/terrabuild/client/src/pages/WhatIfScenariosPage.tsx` | deferred_or_package | unknown | `/api/what-if-scenarios` | `PACS` | - | -
`packages/terrabuild/client/src/pages/WhatIfScenariosPage.tsx` | deferred_or_package | unknown | `/api/what-if-scenarios/${id}` | `PACS` | - | -
`packages/terrabuild/client/src/pages/WhatIfScenariosPage.tsx` | deferred_or_package | unknown | `/api/what-if-scenarios/${id}` | `PACS` | - | -
`packages/terrabuild/test_matrix_import.js` | deferred_or_package | unknown | `http://localhost:5000/api/cost-matrix/import` | - | - | -
`packages/terrabuild/test_matrix_import.js` | deferred_or_package | unknown | `http://localhost:5000/api/cost-matrix/imports` | - | - | -
`packages/terrabuild/test_matrix_import.js` | deferred_or_package | unknown | `http://localhost:5000/api/cost-matrix/validate` | - | - | -
`packages/terrabuild/test_matrix_json_import.js` | deferred_or_package | unknown | `http://localhost:5000/api/cost-matrix/batch` | - | - | -
`packages/terrabuild/test_matrix_json_import.js` | deferred_or_package | unknown | `http://localhost:5000/api/cost-matrix/import` | - | - | -
`packages/terrabuild/test_matrix_validate.js` | deferred_or_package | unknown | `http://localhost:5000/api/cost-matrix/imports` | - | - | -
`packages/terrabuild/test_matrix_validate.js` | deferred_or_package | unknown | `http://localhost:5000/api/cost-matrix/validate` | - | - | -
`packages/terrabuild/test_property_import.js` | deferred_or_package | unknown | `${baseUrl}/api/properties/import` | - | - | -
`packages/terrabuild/test_property_storage_api.mjs` | deferred_or_package | unknown | `${API_URL}/api/improvement-details` | - | - | -
`packages/terrabuild/test_property_storage_api.mjs` | deferred_or_package | unknown | `${API_URL}/api/improvement-details/${createdDetail.id}` | - | - | -
`packages/terrabuild/test_property_storage_api.mjs` | deferred_or_package | unknown | `${API_URL}/api/improvement-items` | - | - | -
`packages/terrabuild/test_property_storage_api.mjs` | deferred_or_package | unknown | `${API_URL}/api/improvement-items/${createdItem.id}` | - | - | -
`packages/terrabuild/test_property_storage_api.mjs` | deferred_or_package | unknown | `${API_URL}/api/improvements` | - | - | -
`packages/terrabuild/test_property_storage_api.mjs` | deferred_or_package | unknown | `${API_URL}/api/improvements/${createdImprovement.id}` | - | - | -
`packages/terrabuild/test_property_storage_api.mjs` | deferred_or_package | unknown | `${API_URL}/api/land-details` | - | - | -
`packages/terrabuild/test_property_storage_api.mjs` | deferred_or_package | unknown | `${API_URL}/api/land-details/${createdLandDetail.id}` | - | - | -
`packages/terrabuild/test_property_storage_api.mjs` | deferred_or_package | unknown | `${API_URL}/api/properties` | - | - | -
`packages/terrabuild/test_property_storage_api.mjs` | deferred_or_package | unknown | `${API_URL}/api/properties` | - | - | -
`packages/terrabuild/test_property_storage_api.mjs` | deferred_or_package | unknown | `${API_URL}/api/properties?limit=5&offset=0` | - | - | -
`packages/terrabuild/test_property_storage_api.mjs` | deferred_or_package | unknown | `${API_URL}/api/properties/${createdProperty.id}` | - | - | -
`packages/terrabuild/test_property_storage_api.mjs` | deferred_or_package | unknown | `${API_URL}/api/properties/${createdProperty.id}` | - | - | -
`packages/terrabuild/test_property_storage_api.mjs` | deferred_or_package | unknown | `${API_URL}/api/properties/${createdProperty.id}` | - | - | -
`packages/terrabuild/test_property_storage_api.mjs` | deferred_or_package | unknown | `${API_URL}/api/properties/${createdProperty.id}/improvements` | - | - | -
`packages/terrabuild/test_property_storage_api.mjs` | deferred_or_package | unknown | `${API_URL}/api/properties/by-prop-id/${testProperty.propId}` | - | - | -
`packages/terrabuild/test-config.js` | deferred_or_package | unknown | `${TEST_CONFIG.baseUrl}/api/repository` | - | - | -
`packages/terrabuild/tests/benchmarking_tests.js` | deferred_or_package | unknown | `${BASE_URL}/api/auth/login` | - | - | -
`packages/terrabuild/tests/benchmarking_tests.js` | deferred_or_package | unknown | `${BASE_URL}/api/benchmarking/counties` | - | - | -
`packages/terrabuild/tests/benchmarking_tests.js` | deferred_or_package | unknown | `${BASE_URL}/api/benchmarking/counties/Benton` | - | - | -
`packages/terrabuild/tests/benchmarking_tests.js` | deferred_or_package | unknown | `${BASE_URL}/api/benchmarking/counties/Benton/building-types` | - | - | -
`packages/terrabuild/tests/benchmarking_tests.js` | deferred_or_package | unknown | `${BASE_URL}/api/benchmarking/counties/Benton/stats` | - | - | -
`packages/terrabuild/tests/benchmarking_tests.js` | deferred_or_package | unknown | `${BASE_URL}/api/benchmarking/counties/compare` | - | - | -
`packages/terrabuild/tests/benchmarking_tests.js` | deferred_or_package | unknown | `${BASE_URL}/api/benchmarking/materials/compare` | - | - | -
`packages/terrabuild/tests/benchmarking_tests.js` | deferred_or_package | unknown | `${BASE_URL}/api/benchmarking/query` | - | - | -
`packages/terrabuild/tests/benchmarking_tests.js` | deferred_or_package | unknown | `${BASE_URL}/api/benchmarking/states` | - | - | -
`packages/terrabuild/tests/benchmarking_tests.js` | deferred_or_package | unknown | `${BASE_URL}/api/benchmarking/states/compare` | - | - | -
`packages/terrabuild/tests/benchmarking_tests.js` | deferred_or_package | unknown | `${BASE_URL}/api/benchmarking/trends/counties` | - | - | -
`packages/terrabuild/tests/benchmarking_tests.js` | deferred_or_package | unknown | `${BASE_URL}/api/benchmarking/trends/region` | - | - | -
`packages/terrabuild/tests/components/ai-prediction.test.js` | test_only | unknown | `/api/cost-matrix` | - | - | -
`packages/terrabuild/tests/components/ai-prediction.test.js` | test_only | unknown | `/api/cost-matrix` | - | - | -
`packages/terrabuild/tests/components/ai-prediction.test.js` | test_only | unknown | `/api/settings/OPENAI_API_KEY_STATUS` | - | - | -
`packages/terrabuild/tests/components/ai-prediction.test.js` | test_only | unknown | `/api/settings/OPENAI_API_KEY_STATUS` | - | - | -
`packages/terrabuild/tests/components/comparative-analysis.test.js` | test_only | unknown | `/api/cost-matrix` | - | - | -
`packages/terrabuild/tests/components/comparative-analysis.test.js` | test_only | unknown | `/api/cost-matrix` | - | - | -
`packages/terrabuild/tests/components/customizable-dashboard.test.js` | test_only | unknown | `/api/dashboard/component/cost-trend-chart` | - | - | -
`packages/terrabuild/tests/components/customizable-dashboard.test.js` | test_only | unknown | `/api/dashboard/components` | - | - | -
`packages/terrabuild/tests/components/customizable-dashboard.test.js` | test_only | unknown | `/api/dashboard/layout` | - | - | -
`packages/terrabuild/tests/components/customizable-dashboard.test.js` | test_only | unknown | `/api/dashboard/layout/1` | - | - | -
`packages/terrabuild/tests/components/customizable-dashboard.test.js` | test_only | unknown | `/api/dashboard/layout/default` | - | - | -
`packages/terrabuild/tests/components/version-control.test.js` | test_only | unknown | `/api/cost-matrix/compare?type=RESIDENTIAL&v1=1&v2=3` | - | - | -
`packages/terrabuild/tests/components/version-control.test.js` | test_only | unknown | `/api/cost-matrix/rollback` | - | - | -
`packages/terrabuild/tests/components/version-control.test.js` | test_only | unknown | `/api/cost-matrix/version` | - | - | -
`packages/terrabuild/tests/components/version-control.test.js` | test_only | unknown | `/api/cost-matrix/versions/RESIDENTIAL` | - | - | -
`packages/terrabuild/tests/cost-calculator-integration.test.js` | test_only | unknown | `${API_BASE_URL}/api/building-cost/calculate` | - | - | -
`packages/terrabuild/tests/cost-calculator-integration.test.js` | test_only | unknown | `${API_BASE_URL}/api/calculation-history` | - | - | -
`packages/terrabuild/tests/cost-calculator-integration.test.js` | test_only | unknown | `${API_BASE_URL}/api/calculation-history` | - | - | -
`packages/terrabuild/tests/cost-calculator-integration.test.js` | test_only | unknown | `${API_BASE_URL}/api/costs/calculate` | - | - | -
`packages/terrabuild/tests/cost-calculator-integration.test.js` | test_only | unknown | `${API_BASE_URL}/api/costs/calculate` | - | - | -
`packages/terrabuild/tests/cost-calculator-integration.test.js` | test_only | unknown | `${API_BASE_URL}/api/costs/calculate-materials` | - | - | -
`packages/terrabuild/upload_test.ts` | deferred_or_package | unknown | `http://localhost:5000/api/file-uploads/upload` | - | - | -

## Interpretation

Product runtime endpoints may not depend directly on legacy source connections. Sync/admin/proof/test code may reference legacy sources, but those references do not certify product runtime truth.

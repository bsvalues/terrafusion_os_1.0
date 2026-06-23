# County Studio R1 Production Proof

Checked: 2026-06-06T06:32:29.487Z
Status: PASS
Decision: COUNTY_STUDIO_R1_RUNTIME_PRODUCTION_PROOF_READY

## Doctrine

- Primary drill paths must not depend on city.
- City is reference metadata only; valuation analysis runs through risk surfaces, revaluation cycle, neighborhood, segment/model context, taxing district exposure, and parcel evidence.
- Sync and DB seeding lanes are excluded from this Codex scope.

## Checks

| Check | Result | Detail | Proof |
| --- | --- | --- | --- |
| endpoint-contract.frontend-backend-county-study-routes | PASS | required=31, missingFrontend=0, missingBackend=0 | `frontend/apps/os-shell/src/pages/forge/county-studio/countyStudyApi.ts`<br>`backend/src/TerraFusion.API/Controllers/CountyStudyController.cs` |
| data-flow.real-canonical-county-study-services | PASS | County Studio services derive health, segments, AI diagnosis, and inspector evidence from EF-backed canonical tables. | `backend/src/TerraFusion.Core/Services/CountyStudySegmentDerivationService.cs:3`<br>`backend/src/TerraFusion.Core/Services/CountyStudySegmentDerivationService.cs:3`<br>`backend/src/TerraFusion.Core/Services/CountyStudySegmentDerivationService.cs:74`<br>`backend/src/TerraFusion.Core/Services/CountyStudyHealthService.cs:73` |
| mock-audit.no-county-studio-production-mocks | PASS | No mock/stub/fixture/fake/sample-data markers in County Studio production paths. | `frontend/apps/os-shell/src/pages/forge/county-studio/components/AdjustmentSetPanel.tsx`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/AiDiagnosisPanel.tsx`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/BottomDeck.tsx`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CityInspector.tsx`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CityRollupTable.tsx`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CohortCreationDialog.tsx`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/ContractLineage.tsx`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CorrectionDefensePanel.tsx`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyCommandStrip.tsx`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyDiagnosisModal.tsx`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyHealthPanel.tsx`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx` |
| city-doctrine.city-reference-only-primary-path-clean | PASS | invariant=true, sanitizer=true, riskSurfaceLeaks=0, healthPanelLeaks=0 | `frontend/apps/os-shell/src/pages/forge/county-studio/countyStudioInvariants.ts:1`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/RiskSurfaceCommandCenter.tsx:215`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/utils/cityPrimarySanitizer.ts:1` |
| gis-contract.embedded-atlas-primary-center-surface | PASS | missingEmbeddedTokens=0, commandCenterEmbeds=true, atlasGeometryContracts=3, popOutOnly=false, countyStudioGisWriteHits=0 | `frontend/apps/os-shell/src/pages/forge/county-studio/components/EmbeddedAtlasGisWorkspace.tsx:280`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/EmbeddedAtlasGisWorkspace.tsx:7`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/EmbeddedAtlasGisWorkspace.tsx:215`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/RiskSurfaceCommandCenter.tsx:9`<br>`frontend/apps/os-shell/src/pages/forge/atlas-live/atlasLiveApi.ts:220` |
| handoffs.atlas-dossier-workbench-valuation-context | PASS | Atlas, Dossier, Workbench, evidence export, and apply handoff paths carry valuation context through city sanitizers. | `frontend/apps/os-shell/src/pages/forge/county-studio/components/ObjectInspector.tsx:37`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/ObjectInspector.tsx:863`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/AdjustmentSetPanel.tsx:343`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/ExportPacketModal.tsx:7` |
| tools.cli-redis-rust-prometheus-inventory | PASS | cli=3, redis=3, rustEngines=3, prometheus=4 | `tools/tdc/cli/src/index.ts`<br>`tools/bin/commands/FORGE_CLI.md`<br>`os-platform/core/pilot/local-agent/help.ts`<br>`backend/src/TerraFusion.Core/Services/RedisCacheService.cs`<br>`backend/src/TerraFusion.Core/Services/Monitoring/HealthChecks/RedisHealthCheck.cs`<br>`config/redis/redis-master.conf`<br>`packages/terrabuild/kernels/terraforge.kernel.valuation/Cargo.toml`<br>`packages/terrabuild/kernels/terraforge.kernel.cost/Cargo.toml`<br>`tools/tf-designctl-rust/Cargo.toml`<br>`backend/src/TerraFusion.API/Monitoring/PrometheusConfig.cs`<br>`backend/monitoring/prometheus.yml`<br>`compose/prometheus.yml`<br>`backend/tests/TerraFusion.Unit.Tests/Observability/PrometheusLaneMetricsTests.cs` |
| runtime.screenshot-contract-ready | PASS | missingVisibleSignals=0, disallowedVisibleHits=0, embeddedCanvasCount=1, mapCanvasCount=1, prometheusRiskLabelCount=3, segmentCount=1393, riskObjectCount=688, atlasLiveVisible=true, loadingHealthMetricsVisible=false, mapDoesNotOverlapAnalytics=true, mapDoesNotOverlapRightRail=true, dockDoesNotOverlapCommandSurface=true, dockDoesNotOverlapBottomQueue=true, consoleErrors=0 | `os-platform/core/pilot/evidence/screenshots/county-studio-r1-production-proof.png` |

## Runtime Screenshot Contract

Mode: `runtime`
Screenshot: `os-platform/core/pilot/evidence/screenshots/county-studio-r1-production-proof.png`

## Tooling Inventory

- CLI surfaces: `tools/tdc/cli/src/index.ts`, `tools/bin/commands/FORGE_CLI.md`, `os-platform/core/pilot/local-agent/help.ts`
- Redis surfaces: `backend/src/TerraFusion.Core/Services/RedisCacheService.cs`, `backend/src/TerraFusion.Core/Services/Monitoring/HealthChecks/RedisHealthCheck.cs`, `config/redis/redis-master.conf`
- Rust engines: `packages/terrabuild/kernels/terraforge.kernel.valuation/Cargo.toml`, `packages/terrabuild/kernels/terraforge.kernel.cost/Cargo.toml`, `tools/tf-designctl-rust/Cargo.toml`
- Prometheus surfaces: `backend/src/TerraFusion.API/Monitoring/PrometheusConfig.cs`, `backend/monitoring/prometheus.yml`, `compose/prometheus.yml`, `backend/tests/TerraFusion.Unit.Tests/Observability/PrometheusLaneMetricsTests.cs`


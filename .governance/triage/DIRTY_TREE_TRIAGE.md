# Dirty Tree Triage — 2026-03-17

## Buckets

### KEEP-NOW (commit immediately — these belong on this branch)
| Status | File | Reason |
|--------|------|--------|
| M | .env.example | Adds placeholder env vars for TF_DB_HOST/PASSWORD/REDIS — safe example values only |
| M | .governance/workflow/progress.md | Session progress tracking |
| ?? | .governance/workflow/REMEDIATION_PLAN_v1.md | New governance artifact for this branch |
| ?? | .governance/triage/ | Triage artifacts from this session |
| M | backend/Directory.Packages.props | Package version management |
| D | backend/src/TerraFusion.AI/Analytics/AnalyticsService.cs | Deleted as part of consolidation refactor |
| D | backend/src/TerraFusion.AI/Comps/CompAnalysisService.cs | Deleted — moved to Services/ |
| M | backend/src/TerraFusion.AI/DataQuality/IAAOValidationRules.cs | IAAO rule updates |
| D | backend/src/TerraFusion.AI/MarketPredictor/MarketPredictorService.cs | Deleted as part of refactor |
| D | backend/src/TerraFusion.AI/MassAppraisal/MassAppraisalService.cs | Deleted as part of refactor |
| M | backend/src/TerraFusion.AI/Services/CompAnalysisService.cs | Consolidated service implementation |
| M | backend/src/TerraFusion.AI/Services/PropertyValuationService.cs | Consolidated service implementation |
| D | backend/src/TerraFusion.AI/Valuation/PropertyValuationService.cs | Deleted — moved to Services/ |
| M | backend/src/TerraFusion.API/Monitoring/PrometheusConfig.cs | Prometheus metrics config |
| M | backend/src/TerraFusion.API/appsettings.Production.json | Production env config updates |
| M | backend/src/TerraFusion.API/appsettings.Staging.json | Staging env config updates |
| D | backend/src/TerraFusion.Core/Connectors/CensusConnector.cs | Deleted (Post-R1 connector) |
| D | backend/src/TerraFusion.Core/Connectors/MarketConnector.cs | Deleted (Post-R1 connector) |
| D | backend/src/TerraFusion.Core/Connectors/WeatherConnector.cs | Deleted (Post-R1 connector) |
| M | backend/src/TerraFusion.Core/Entities/Property/PropertyExtended.cs | Property entity extension |
| M | backend/src/TerraFusion.Core/Interfaces/ITerraFusionDbContext.cs | Interface updates for new entities |
| M | backend/src/TerraFusion.Core/Services/LevyComplianceService.cs | Levy service updates |
| D | backend/src/TerraFusion.Core/Services/PropertyValuationService.cs | Deleted — consolidated to AI layer |
| M | backend/src/TerraFusion.Core/TerraFusion.Core.csproj | Project file updates |
| M | backend/src/TerraFusion.Data/TerraFusionDbContext.cs | DbContext with new entity DbSets |
| M | backend/src/TerraFusion.DataMining/Services/CmaService.cs | CMA service updates |
| M | backend/tests/TerraFusion.Unit.Tests/R1Week5/R1Week5CxR1ClosureTests.cs | R1W5 closure tests |
| M | backend/tests/TerraFusion.Unit.Tests/R2FullPlan/R2FullPlanHandlerAlignmentTests.cs | R2 alignment tests |
| ?? | backend/TerraFusion.API.Tests/DaisPersistenceTests.cs | Dais acceptance tests (new) |
| ?? | backend/src/TerraFusion.Core/Entities/Appeal.cs | New entity |
| ?? | backend/src/TerraFusion.Core/Entities/CertificationStep.cs | New entity |
| ?? | backend/src/TerraFusion.Core/Entities/Exemption.cs | New entity |
| ?? | backend/src/TerraFusion.Core/Entities/Notice.cs | New entity |
| ?? | backend/src/TerraFusion.Core/Entities/QueueItem.cs | New entity |
| ?? | backend/src/TerraFusion.Core/Services/AppealService.cs | New service |
| ?? | backend/src/TerraFusion.Core/Services/CertificationService.cs | New service |
| ?? | backend/src/TerraFusion.Core/Services/ExemptionService.cs | New service |
| ?? | backend/src/TerraFusion.Core/Services/IAppealService.cs | New interface |
| ?? | backend/src/TerraFusion.Core/Services/ICertificationService.cs | New interface |
| ?? | backend/src/TerraFusion.Core/Services/IExemptionService.cs | New interface |
| ?? | backend/src/TerraFusion.Core/Services/INoticeService.cs | New interface |
| ?? | backend/src/TerraFusion.Core/Services/NoticeService.cs | New service |
| ?? | backend/tests/TerraFusion.Unit.Tests/Contracts/ComparablePropertyInfoContractTests.cs | New contract test |
| M | frontend/apps/os-shell/src/__tests__/integration/suiteHandoff.contract.test.tsx | Contract test updates |
| M | frontend/apps/os-shell/src/__tests__/shell/shellAccessibility.contract.test.tsx | Contract test updates |
| M | frontend/apps/os-shell/src/__tests__/shell/suiteStates.contract.test.tsx | Contract test updates |
| M | frontend/apps/os-shell/src/__tests__/workflows/contextPreservation.contract.test.tsx | Contract test updates |
| M | frontend/apps/os-shell/src/__tests__/workflows/operatorJourneys.contract.test.tsx | Contract test updates |
| M | frontend/apps/os-shell/src/__tests__/workflows/workflowEntryPoints.contract.test.tsx | Contract test updates |
| ?? | frontend/apps/os-shell/src/__tests__/auth/w5fRegistryEdge.contract.test.ts | New w5f auth edge test |
| M | frontend/apps/os-shell/src/applications/terra-levy/TerraLevyDashboard.tsx | Levy dashboard updates |
| M | frontend/apps/os-shell/src/applications/terra-levy/hooks/useBudgetData.ts | Budget data hook |
| M | frontend/apps/os-shell/src/components/atlas/SchoolDistrictWidget.tsx | Atlas widget updates |
| M | frontend/apps/os-shell/src/components/atlas/SentimentHeatMapWidget.tsx | Atlas widget updates |
| M | frontend/apps/os-shell/src/components/canon/CanonMinimapPanel.tsx | Canon panel updates |
| M | frontend/apps/os-shell/src/config/moduleComponents.tsx | Module config |
| M | frontend/apps/os-shell/src/hooks/useTodaysWork.ts | Hook updates |
| M | frontend/apps/os-shell/src/pages/forge/cost/CostManual.tsx | Forge cost page |
| M | frontend/apps/os-shell/src/pages/forge/regression/RegressionControlPanel.tsx | Forge regression page |
| M | frontend/apps/os-shell/src/pages/forge/regression/RegressionStudio.tsx | Forge regression studio |
| M | frontend/apps/os-shell/src/pages/forge/statistics/StatisticsStudio.tsx | Forge stats studio |
| M | frontend/apps/os-shell/src/services/QuantumModuleManager.ts | Module manager updates |
| M | package.json | Adds proof:phase21-25 scripts (legitimate) |

### KEEP-LATER (stash — good work but wrong time)
| Status | File | Reason |
|--------|------|--------|
| (none) | — | No files in this category |

### QUARANTINE (stash separately — pilot evidence, auto-generated snapshots)
| Status | File | Reason |
|--------|------|--------|
| M | os-platform/core/pilot/evidence/benton-sync-proof.latest.json | Auto-generated pilot evidence snapshot |
| M | os-platform/core/pilot/evidence/phase10-environment-identity.latest.json | Auto-generated |
| M | os-platform/core/pilot/evidence/phase11-deployment-contract.latest.json | Auto-generated |
| M | os-platform/core/pilot/evidence/phase12-pacs-connected-runtime.latest.json | Auto-generated |
| M | os-platform/core/pilot/evidence/phase13-snapshot-promotion.latest.json | Auto-generated |
| M | os-platform/core/pilot/evidence/phase14-production-atlas-click.png | Auto-generated screenshot |
| M | os-platform/core/pilot/evidence/phase14-production-audit-click.png | Auto-generated screenshot |
| M | os-platform/core/pilot/evidence/phase14-production-clerk-click.png | Auto-generated screenshot |
| M | os-platform/core/pilot/evidence/phase14-production-dais-click.png | Auto-generated screenshot |
| M | os-platform/core/pilot/evidence/phase14-production-dossier-click.png | Auto-generated screenshot |
| M | os-platform/core/pilot/evidence/phase14-production-forge-click.png | Auto-generated screenshot |
| M | os-platform/core/pilot/evidence/phase14-production-pilot-click.png | Auto-generated screenshot |
| M | os-platform/core/pilot/evidence/phase14-production-treasury-click.png | Auto-generated screenshot |
| M | os-platform/core/pilot/evidence/phase14-staging-atlas-click.png | Auto-generated screenshot |
| M | os-platform/core/pilot/evidence/phase14-staging-audit-click.png | Auto-generated screenshot |
| M | os-platform/core/pilot/evidence/phase14-staging-clerk-click.png | Auto-generated screenshot |
| M | os-platform/core/pilot/evidence/phase14-staging-dais-click.png | Auto-generated screenshot |
| M | os-platform/core/pilot/evidence/phase14-staging-dossier-click.png | Auto-generated screenshot |
| M | os-platform/core/pilot/evidence/phase14-staging-forge-click.png | Auto-generated screenshot |
| M | os-platform/core/pilot/evidence/phase14-staging-pilot-click.png | Auto-generated screenshot |
| M | os-platform/core/pilot/evidence/phase14-staging-treasury-click.png | Auto-generated screenshot |
| M | os-platform/core/pilot/evidence/phase19-promotion-manifest.latest.json | Auto-generated manifest |
| M | os-platform/core/pilot/evidence/phase19-promotion-manifest.latest.sha256 | Auto-generated hash |
| M | os-platform/core/pilot/evidence/phase19-promotion-signature.latest.json | Auto-generated signature |
| M | os-platform/core/pilot/evidence/phase19-promotion-snapshot.latest.sha256 | Auto-generated hash |
| M | os-platform/core/pilot/evidence/phase7-deployment-alignment.latest.json | Auto-generated |
| M | os-platform/core/pilot/evidence/phase8-deployed-operator-parity.latest.json | Auto-generated |
| M | os-platform/core/pilot/evidence/phase9-runtime-role-separation.latest.json | Auto-generated |

### DISCARD (restore/delete — noise, junk, accidental)
| Status | File | Reason |
|--------|------|--------|
| ?? | backend/build-errors.txt | Stale build error log — delete |
| ?? | frontend/vitest-failure-triage.json | Auto-generated test artifact — delete |
| ?? | frontend/vitest-results.json | Auto-generated test artifact — delete |
| ?? | backend/tests/TerraFusion.Integration.Tests/TestResults/ | Test runner output — should be gitignored |
| ?? | backend/tests/TerraFusion.Tests.Unit/TestResults/ | Test runner output — should be gitignored |
| ?? | backend/tests/TerraFusion.Unit.SmokeTests/TestResults/ | Test runner output — should be gitignored |
| ?? | backend/tests/TerraFusion.Unit.Tests/TestResults/ | Test runner output — should be gitignored |
| M | .claude/settings.local.json | Local Claude settings — do not commit |
| ?? | .claude/settings.json | Local Claude settings — do not commit |
| ?? | .claude/agents/ | Local Claude agents dir — do not commit |

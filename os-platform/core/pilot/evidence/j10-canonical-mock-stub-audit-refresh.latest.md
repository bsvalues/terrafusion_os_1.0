# Canonical Mock/Stub Audit Refresh

- Generated: 2026-06-01T05:40:52.012Z
- Production touched: false
- DB mutation: false
- Feature work: false
- Packet hash: ef67cf6556bbff7e675f769bfbd527823be0f51f0564a10ca88fd4d67a1affbc

## Verdict

| Claim | Status |
| --- | --- |
| Controlled dev39 preview | ready |
| Production readiness | no_go |
| Full application capability | not_ready |

The canonical denominator is now stable for this worktree. Wave 1 production blockers are disposition-linked, but production/full capability remain blocked by unresolved production-risk mock/stub files and endpoint-affecting mocks.

## Canonical Denominator

| Metric | Count |
| --- | ---: |
| Total files scanned | 7514 |
| Files with mock/stub signals | 2109 |
| Production-risk files | 398 |
| Demo-safe files | 1401 |
| Dormant files | 297 |
| Dead files | 13 |
| Endpoint-affecting mocks | 13 |
| Wave 1 production blockers dispositioned | 39 |
| Wave 1 dispositioned still present in canonical risk | 37 |

## Count Reconciliation

| Count source | Count |
| --- | ---: |
| Previous broad audit production-risk files | 724 |
| Previous Wave 1 inline production-risk files | 618 |
| Canonical production-risk files | 398 |

Use canonicalProductionRiskFiles from this packet for executive reporting going forward. Older 724 and 618 counts are superseded because they used different worktree state and include/exclude rules.

## Include Rules

- Roots: `backend/src`, `frontend/apps/os-shell/src`, `os-platform/core`, `tools/registry`, `tools`, `scripts`, `ops`, `package.json`
- Extensions: `.cs`, `.csproj`, `.js`, `.json`, `.md`, `.mjs`, `.ps1`, `.py`, `.sh`, `.ts`, `.tsx`, `.yaml`, `.yml`
- Max scan bytes: 2097152

## Exclude Rules

- Directories: `.git`, `.claude`, `.codex-worktrees`, `ARCHIVE`, `QUARANTINE`, `bin`, `obj`, `node_modules`, `target`, `dist`, `build`, `publish`, `coverage`
- File-name patterns: `lock`
- Lock files, generated/build outputs, dependency folders, archive/quarantine trees, and oversized files are excluded from the canonical denominator.

## Classification Counts

| Classification | Count |
| --- | ---: |
| production_risk | 398 |
| demo_safe | 1401 |
| dormant | 297 |
| dead | 13 |

## Endpoint-Affecting Mocks

- `GET /api/aiorchestration/county/{countyId}/agents` (AIOrchestrationController)
- `POST /api/aisuperiority/launch` (AISuperiorityController)
- `GET /api/aisuperiority/demo/{demoId}/dashboard` (AISuperiorityController)
- `POST /api/aisuperiority/demo/{demoId}/stop` (AISuperiorityController)
- `POST /api/atlas/arcgis/convert-coordinates` (AtlasController)
- `POST /api/costforge/sync/source-status` (CostForgeController)
- `POST /api/costforge-test/agents/scale` (CostForgeTestController)
- `POST /api/costforge-test/sync/source-status` (CostForgeTestController)
- `POST /api/dais/queue/escalate` (DaisController)
- `GET /api/forge/{parcelId}/reconciliation` (ForgeController)
- `GET /api/massappraisal/segments/{modelId}` (MassAppraisalController)
- `POST /api/playground/start` (PlaygroundController)
- `GET /api/properties/parcel/{parcelNumber}/activity` (PropertiesController)

## Production-Risk Examples

- `backend/src/TerraFusion.AI/Agents/DocumentConversion/PiltDocumentConversionAgent.cs` (backend_runtime; stub, placeholder; wave1_dispositioned)
- `backend/src/TerraFusion.AI/Agents/DocumentFormatting/PiltDocumentFormattingAgent.cs` (backend_runtime; stub, placeholder; wave1_dispositioned)
- `backend/src/TerraFusion.AI/Agents/ValuationAgent.cs` (backend_runtime; placeholder; not_wave1_dispositioned)
- `backend/src/TerraFusion.AI/Controllers/AICodeAssistantController.cs` (backend_runtime; placeholder; not_wave1_dispositioned)
- `backend/src/TerraFusion.AI/Controllers/AdvancedAIController.cs` (backend_runtime; todo; not_wave1_dispositioned)
- `backend/src/TerraFusion.AI/Forecasting/LevyForecastService.cs` (backend_runtime; stub; wave1_dispositioned)
- `backend/src/TerraFusion.AI/Functions/PropertyDataFunction.cs` (backend_runtime; todo; not_wave1_dispositioned)
- `backend/src/TerraFusion.AI/ML/AnalyticsService.cs` (backend_runtime; stub; wave1_dispositioned)
- `backend/src/TerraFusion.AI/Models/CountyModels.cs` (backend_runtime; placeholder; not_wave1_dispositioned)
- `backend/src/TerraFusion.AI/Models/RagFleetReadinessModels.cs` (backend_runtime; placeholder; not_wave1_dispositioned)
- `backend/src/TerraFusion.AI/Models/SystemDiagnosticsModels.cs` (backend_runtime; placeholder; not_wave1_dispositioned)
- `backend/src/TerraFusion.AI/Models/SystemGptPolicyModels.cs` (backend_runtime; placeholder; not_wave1_dispositioned)
- `backend/src/TerraFusion.AI/Models/TestModels.cs` (backend_runtime; stub; not_wave1_dispositioned)
- `backend/src/TerraFusion.AI/Narratives/DefenseNarrativeService.cs` (backend_runtime; stub, placeholder; wave1_dispositioned)
- `backend/src/TerraFusion.AI/Notices/DraftNoticeService.cs` (backend_runtime; stub; wave1_dispositioned)
- `backend/src/TerraFusion.AI/Regression/MultipleRegressionEngine.cs` (backend_runtime; fake; not_wave1_dispositioned)
- `backend/src/TerraFusion.AI/Services/AIAnalyticsService.cs` (backend_runtime; mock; not_wave1_dispositioned)
- `backend/src/TerraFusion.AI/Services/AdvancedAIOrchestrator.cs` (backend_runtime; placeholder; not_wave1_dispositioned)
- `backend/src/TerraFusion.AI/Services/AdvancedAnalyticsEngine.cs` (backend_runtime; stub; wave1_dispositioned)
- `backend/src/TerraFusion.AI/Services/AnalyticsReportingService.cs` (backend_runtime; stub; wave1_dispositioned)
- `backend/src/TerraFusion.AI/Services/CodeAnalyticsService.cs` (backend_runtime; placeholder, hardcoded; not_wave1_dispositioned)
- `backend/src/TerraFusion.AI/Services/CodexExecutiveReportService.cs` (backend_runtime; placeholder; not_wave1_dispositioned)
- `backend/src/TerraFusion.AI/Services/CompAnalysisService.cs` (backend_runtime; sample_or_fixture; not_wave1_dispositioned)
- `backend/src/TerraFusion.AI/Services/CostForgeAIService.cs` (backend_runtime; stub; wave1_dispositioned)
- `backend/src/TerraFusion.AI/Services/CostForgeService.cs` (backend_runtime; mock; not_wave1_dispositioned)
- `backend/src/TerraFusion.AI/Services/CountyPolicyService.cs` (backend_runtime; placeholder, fallback, hardcoded; not_wave1_dispositioned)
- `backend/src/TerraFusion.AI/Services/EmergentIntelligenceEngine.cs` (backend_runtime; placeholder; not_wave1_dispositioned)
- `backend/src/TerraFusion.AI/Services/Framework369AutoScalingService.cs` (backend_runtime; placeholder; not_wave1_dispositioned)
- `backend/src/TerraFusion.AI/Services/FunctionCallingOrchestrator.cs` (backend_runtime; todo; not_wave1_dispositioned)
- `backend/src/TerraFusion.AI/Services/GPTBudgetAlertService.cs` (backend_runtime; todo; not_wave1_dispositioned)
- `backend/src/TerraFusion.AI/Services/GPTCostTrackingService.cs` (backend_runtime; hardcoded, todo; not_wave1_dispositioned)
- `backend/src/TerraFusion.AI/Services/GPTOrchestrationService.cs` (backend_runtime; sample_or_fixture, todo; not_wave1_dispositioned)
- `backend/src/TerraFusion.AI/Services/IntegrationOrchestrationService.cs` (backend_runtime; stub; wave1_dispositioned)
- `backend/src/TerraFusion.AI/Services/KernelExecutionService.cs` (backend_runtime; todo, placeholder; not_wave1_dispositioned)
- `backend/src/TerraFusion.AI/Services/MarketplaceService.cs` (backend_runtime; placeholder; not_wave1_dispositioned)
- `backend/src/TerraFusion.AI/Services/MassAppraisalService.cs` (backend_runtime; placeholder, sample_or_fixture; not_wave1_dispositioned)
- `backend/src/TerraFusion.AI/Services/MultiModalLLMService.cs` (backend_runtime; fallback, placeholder; not_wave1_dispositioned)
- `backend/src/TerraFusion.AI/Services/PredictiveAnalyticsEngine.cs` (backend_runtime; placeholder, mock; not_wave1_dispositioned)
- `backend/src/TerraFusion.AI/Services/PropertyValuationService.cs` (backend_runtime; placeholder, todo; not_wave1_dispositioned)
- `backend/src/TerraFusion.AI/Services/QuantumAIHybridService.cs` (backend_runtime; fallback, placeholder; not_wave1_dispositioned)

## Conclusion

This packet supersedes the conflicting 724 and 618 mock/stub denominator counts for this branch. The actionable state is now: canonical production-risk count = 398, endpoint-affecting mocks = 13, and Wave 1 blockers disposition-linked = 39.

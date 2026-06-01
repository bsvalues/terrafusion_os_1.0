# Canonical Mock/Stub Audit Refresh

- Generated: 2026-06-01T04:49:44.383Z
- Production touched: false
- DB mutation: false
- Feature work: false
- Packet hash: 73de3097cd837b8fce5605257af23e09c429399f15a9cf05509233ac8670bcfc

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
| Total files scanned | 7510 |
| Files with mock/stub signals | 2107 |
| Production-risk files | 372 |
| Demo-safe files | 1397 |
| Dormant files | 325 |
| Dead files | 13 |
| Endpoint-affecting mocks | 16 |
| Wave 1 production blockers dispositioned | 39 |
| Wave 1 dispositioned still present in canonical risk | 39 |

## Count Reconciliation

| Count source | Count |
| --- | ---: |
| Previous broad audit production-risk files | 724 |
| Previous Wave 1 inline production-risk files | 618 |
| Canonical production-risk files | 372 |

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
| production_risk | 372 |
| demo_safe | 1397 |
| dormant | 325 |
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
- `POST /api/gpt/explain` (GPTController)
- `GET /api/massappraisal/segments/{modelId}` (MassAppraisalController)
- `POST /api/pilot/drafts/{id:guid}/reject` (PilotController)
- `POST /api/pilot/invoke` (PilotController)
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
- `backend/src/TerraFusion.AI/Services/QuantumAnalyticsService.cs` (backend_runtime; mock; not_wave1_dispositioned)
- `backend/src/TerraFusion.AI/Services/SystemGptAtlasService.cs` (backend_runtime; fallback; not_wave1_dispositioned)

## Conclusion

This packet supersedes the conflicting 724 and 618 mock/stub denominator counts for this branch. The actionable state is now: canonical production-risk count = 372, endpoint-affecting mocks = 16, and Wave 1 blockers disposition-linked = 39.

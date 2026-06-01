# Production-Risk Mock/Stub Triage Wave 1

- Generated: 2026-06-01T04:39:32.429Z
- Source audit: inline_wave1_scan_no_prior_audit_file
- Target: top_50_production_risk_mock_stub_files
- Production touched: false
- DB mutation: false
- Feature work: false
- Packet hash: 8cf370d548f3c683fa2075e3361e9c6fc9180030b1af020f1092bdca3377ca9e

## Verdict

| Claim | Verdict |
| --- | --- |
| Controlled preview | still_ready |
| Production readiness | blocked_by_mock_stub_disposition |
| Full capability | not_ready |

Top production-risk mock/stub files are dominated by runtime AI/API execution surfaces with stub, placeholder, TODO, hardcoded, or mock behavior. This does not block the controlled demo path, but it does block full production capability claims.

## Summary

| Metric | Count |
| --- | ---: |
| Source production-risk files | 618 |
| Triaged files | 50 |
| Production blockers | 39 |
| Dormant | 9 |
| Intentional fallback | 0 |
| Safe demo-only | 2 |
| Dead code | 0 |

## Disposition Counts

| Disposition | Count |
| --- | ---: |
| production_blocker | 39 |
| safe_demo_only | 2 |
| dormant | 9 |

## Top 50 Triage Matrix

| Rank | Disposition | Confidence | File | Signals |
| ---: | --- | --- | --- | --- |
| 1 | production_blocker | high | `backend/src/TerraFusion.Core/Services/ComplianceAutomationService.cs` | not_implemented |
| 2 | production_blocker | high | `backend/src/TerraFusion.Abstractions/DTOs/ComplianceDto.cs` | not_implemented |
| 3 | production_blocker | high | `backend/src/TerraFusion.API/Controllers/PilotController.cs` | stub |
| 4 | production_blocker | high | `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` | stub, todo, fallback, sample_or_fixture, hardcoded |
| 5 | production_blocker | high | `backend/src/TerraFusion.API/Controllers/GPTController.cs` | placeholder, fallback, stub |
| 6 | safe_demo_only | medium | `backend/src/TerraFusion.API/Controllers/CostForgeTestController.cs` | mock, stub |
| 7 | production_blocker | high | `backend/src/TerraFusion.API/Controllers/AtlasController.cs` | fallback, stub, sample_or_fixture |
| 8 | production_blocker | high | `backend/src/TerraFusion.API/Controllers/DaisController.cs` | sample_or_fixture, fallback, stub |
| 9 | production_blocker | high | `backend/src/TerraFusion.API/Controllers/ForgeController.cs` | fallback, sample_or_fixture, stub |
| 10 | production_blocker | high | `backend/src/TerraFusion.API/Controllers/MassAppraisalController.cs` | stub |
| 11 | production_blocker | high | `backend/src/TerraFusion.API/Controllers/PropertiesController.cs` | fallback, stub |
| 12 | production_blocker | high | `backend/src/TerraFusion.API/Controllers/SystemOrchestrationController.cs` | stub |
| 13 | production_blocker | high | `backend/src/TerraFusion.API/Controllers/LevyExportController.cs` | stub |
| 14 | production_blocker | high | `backend/src/TerraFusion.API/Services/ValuationService.cs` | fallback, stub |
| 15 | production_blocker | medium | `backend/src/TerraFusion.API/Program.cs` | hardcoded, stub, fallback, sample_or_fixture, placeholder |
| 16 | production_blocker | medium | `backend/src/TerraFusion.API/Seeds/PacsCanonicalizer.cs` | stub |
| 17 | production_blocker | high | `backend/src/TerraFusion.AI/Forecasting/LevyForecastService.cs` | stub |
| 18 | production_blocker | high | `backend/src/TerraFusion.AI/Narratives/DefenseNarrativeService.cs` | stub, placeholder |
| 19 | production_blocker | high | `backend/src/TerraFusion.AI/Services/IntegrationOrchestrationService.cs` | stub |
| 20 | production_blocker | high | `backend/src/TerraFusion.API/Services/GisDataService.cs` | stub |
| 21 | production_blocker | high | `backend/src/TerraFusion.AI/ML/AnalyticsService.cs` | stub |
| 22 | production_blocker | high | `backend/src/TerraFusion.AI/Notices/DraftNoticeService.cs` | stub |
| 23 | production_blocker | high | `backend/src/TerraFusion.AI/Services/AnalyticsReportingService.cs` | stub |
| 24 | production_blocker | high | `backend/src/TerraFusion.AI/Services/CostForgeAIService.cs` | stub |
| 25 | production_blocker | high | `backend/src/TerraFusion.API/Security/Interfaces/ILdapService.cs` | stub |
| 26 | production_blocker | high | `backend/src/TerraFusion.API/Security/Services/DevelopmentLdapService.cs` | stub |
| 27 | production_blocker | high | `backend/src/TerraFusion.API/Security/Services/RejectingLdapService.cs` | stub |
| 28 | production_blocker | high | `backend/src/TerraFusion.API/Services/DataPipelineService.cs` | stub |
| 29 | production_blocker | high | `backend/src/TerraFusion.API/Services/ForgeStatisticsService.cs` | stub |
| 30 | dormant | low | `frontend/apps/os-shell/src/pages/workbench/tabs/forge/IncomeApproach.tsx` | stub, placeholder |
| 31 | production_blocker | medium | `backend/src/TerraFusion.API/Seeds/PacsDataSeeder.cs` | fallback, stub |
| 32 | production_blocker | high | `backend/src/TerraFusion.AI/Agents/DocumentConversion/PiltDocumentConversionAgent.cs` | stub, placeholder |
| 33 | production_blocker | medium | `backend/src/TerraFusion.API/Security/AuthenticationConfiguration.cs` | fallback, stub, hardcoded, todo |
| 34 | production_blocker | high | `backend/src/TerraFusion.API/Services/ProductionPACSDataEngine.cs` | todo, stub |
| 35 | dormant | low | `frontend/apps/os-shell/src/hooks/useAtlasGis.ts` | fallback, stub |
| 36 | production_blocker | high | `backend/src/TerraFusion.AI/Agents/DocumentFormatting/PiltDocumentFormattingAgent.cs` | stub, placeholder |
| 37 | dormant | low | `frontend/apps/os-shell/src/components/pilot/RiskConfirmationModal.tsx` | stub, placeholder |
| 38 | dormant | low | `frontend/apps/os-shell/src/services/countyIsolation.ts` | stub |
| 39 | production_blocker | high | `backend/src/TerraFusion.API/Services/DataMigrationEngine.cs` | stub, todo |
| 40 | production_blocker | high | `backend/src/TerraFusion.Core/Services/IntegrationService.cs` | stub |
| 41 | dormant | low | `frontend/apps/os-shell/src/components/CommandPalette.tsx` | stub, placeholder |
| 42 | safe_demo_only | medium | `backend/src/TerraFusion.AI/Models/TestModels.cs` | stub |
| 43 | production_blocker | high | `backend/src/TerraFusion.AI/Services/AdvancedAnalyticsEngine.cs` | stub |
| 44 | dormant | low | `frontend/apps/os-shell/src/middleware/security-plugin.ts` | placeholder, stub |
| 45 | dormant | low | `frontend/apps/os-shell/src/services/gptBackendTruth.ts` | stub |
| 46 | production_blocker | medium | `backend/src/TerraFusion.API/Models/CanonicalCostMatrixReader.cs` | stub |
| 47 | production_blocker | medium | `backend/src/TerraFusion.API/Models/Production/ProductionHelperModels.cs` | stub |
| 48 | dormant | low | `frontend/apps/os-shell/src/pages/workbench/income/DcfPanel.tsx` | stub |
| 49 | dormant | low | `backend/src/TerraFusion.Core/Services/ExportService.cs` | stub |
| 50 | production_blocker | high | `backend/src/TerraFusion.Core/Services/AnalyticsService.cs` | stub, placeholder |

## Unsafe / Manual Gaps

- **Production-risk files are not yet owner-dispositioned**: The system cannot distinguish dormant AI experiments from production blockers without a reviewed disposition ledger. Recommendation: Create a mock/stub disposition ledger with owner, runtime route/module, preview allowance, and production action.
- **AI/API runtime surfaces dominate Wave 1 blockers**: TerraFusion can truthfully demo the statewide runtime preview, but cannot claim complete AI/workflow capability. Recommendation: Separate June 10 preview route set from full product capability route set.

## Recommended Next Steps

- Review each Wave 1 production_blocker with module ownership and decide: replace, disable, downgrade to explicit unavailable, or defer as non-production module.
- Run Wave 2 on the next 50 production-risk files after this packet is reviewed.
- Merge this triage with endpoint mock signals so route-level capability claims cannot hide source-level stubs.

## Conclusion

Wave 1 confirms the largest mock/stub risk is not the controlled dev39 runtime preview. It is full product capability: AI, valuation, workflow, and API surfaces still contain explicit stub/placeholder/mock behavior and need a disposition ledger before any production-ready claim.

# Production Blocker Mock/Stub Disposition Plan

- Generated: 2026-06-01T04:44:24.450Z
- Source: os-platform/core/pilot/evidence/j10-mock-stub-triage-wave1.latest.json
- Scope: 39 production_blocker files from Wave 1
- Production touched: false
- DB mutation: false
- Feature work: false
- Packet hash: bcdc9296304b14f0cf21ec6a7793e794bf6c7a4a5e6c6c68059e935b66b05c35

## Verdict

| Claim | Status |
| --- | --- |
| Controlled dev39 preview | still_ready |
| Production readiness | no_go |
| Full application capability | not_ready |

Wave 1 production blockers mostly affect AI/API/valuation/workflow surfaces outside the frozen dev39 preview path, but they block any full production or full capability claim until dispositioned and remediated.

## Count Reconciliation

| Metric | Count |
| --- | ---: |
| Earlier audit production-risk files | 724 |
| Current Wave 1 production-risk files | 618 |
| Wave 1 production blockers | 39 |

Do not compare 724 and 618 as the same denominator. The 724 count came from a broader prior audit artifact; Wave 1 used an inline scan in this worktree and excludes core pilot audit tooling/test/docs/evidence differently. Executive reporting should use the count tied to the specific packet being cited.

Recommended executive metric: Use Wave 1 blocker result for immediate action: 39 production blockers in the top 50 triaged files. Use total production-risk count only after regenerating one canonical mock/stub audit on the current branch.

## Summary

| Metric | Count |
| --- | ---: |
| Wave 1 triaged files | 50 |
| Disposition rows | 39 |
| June 10 preview blockers | 0 |
| Production blockers | 39 |

## Priority Counts

| Priority | Count |
| --- | ---: |
| P1 | 13 |
| P0 | 7 |
| P3 | 4 |
| P2 | 15 |

## Fix Type Counts

| Fix type | Count |
| --- | ---: |
| implement real service | 30 |
| replace with honest unavailable state | 6 |
| disable surface | 3 |

## Disposition Matrix

| Rank | Priority | Fix type | Module | Surface | Preview blocker | Production blocker | File |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | P1 | implement real service | Core Service/ComplianceAutomation | DI service/runtime service | no | yes | `backend/src/TerraFusion.Core/Services/ComplianceAutomationService.cs` |
| 2 | P1 | implement real service | Abstractions/DTO | contract/model surface | no | yes | `backend/src/TerraFusion.Abstractions/DTOs/ComplianceDto.cs` |
| 3 | P0 | replace with honest unavailable state | API/Pilot | HTTP controller | no | yes | `backend/src/TerraFusion.API/Controllers/PilotController.cs` |
| 4 | P0 | implement real service | API/CostForge | HTTP controller | no | yes | `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` |
| 5 | P0 | replace with honest unavailable state | API/GPT | HTTP controller | no | yes | `backend/src/TerraFusion.API/Controllers/GPTController.cs` |
| 7 | P0 | replace with honest unavailable state | API/Atlas | HTTP controller | no | yes | `backend/src/TerraFusion.API/Controllers/AtlasController.cs` |
| 8 | P0 | implement real service | API/Dais | HTTP controller | no | yes | `backend/src/TerraFusion.API/Controllers/DaisController.cs` |
| 9 | P0 | implement real service | API/Forge | HTTP controller | no | yes | `backend/src/TerraFusion.API/Controllers/ForgeController.cs` |
| 10 | P1 | implement real service | API/MassAppraisal | HTTP controller | no | yes | `backend/src/TerraFusion.API/Controllers/MassAppraisalController.cs` |
| 11 | P0 | implement real service | API/Properties | HTTP controller | no | yes | `backend/src/TerraFusion.API/Controllers/PropertiesController.cs` |
| 12 | P3 | implement real service | API/SystemOrchestration | HTTP controller | no | yes | `backend/src/TerraFusion.API/Controllers/SystemOrchestrationController.cs` |
| 13 | P2 | implement real service | API/LevyExport | HTTP controller | no | yes | `backend/src/TerraFusion.API/Controllers/LevyExportController.cs` |
| 14 | P1 | implement real service | API Service/Valuation | DI service/runtime service | no | yes | `backend/src/TerraFusion.API/Services/ValuationService.cs` |
| 15 | P1 | implement real service | Unknown | runtime source | no | yes | `backend/src/TerraFusion.API/Program.cs` |
| 16 | P1 | disable surface | API Seed/Import | data seed/import path | no | yes | `backend/src/TerraFusion.API/Seeds/PacsCanonicalizer.cs` |
| 17 | P2 | implement real service | AI Forecasting | DI service/runtime service | no | yes | `backend/src/TerraFusion.AI/Forecasting/LevyForecastService.cs` |
| 18 | P2 | implement real service | AI Narratives | DI service/runtime service | no | yes | `backend/src/TerraFusion.AI/Narratives/DefenseNarrativeService.cs` |
| 19 | P2 | implement real service | AI Service/IntegrationOrchestration | DI service/runtime service | no | yes | `backend/src/TerraFusion.AI/Services/IntegrationOrchestrationService.cs` |
| 20 | P2 | implement real service | API Service/GisData | DI service/runtime service | no | yes | `backend/src/TerraFusion.API/Services/GisDataService.cs` |
| 21 | P2 | implement real service | AI ML | DI service/runtime service | no | yes | `backend/src/TerraFusion.AI/ML/AnalyticsService.cs` |
| 22 | P2 | implement real service | AI Notices | DI service/runtime service | no | yes | `backend/src/TerraFusion.AI/Notices/DraftNoticeService.cs` |
| 23 | P2 | implement real service | AI Service/AnalyticsReporting | DI service/runtime service | no | yes | `backend/src/TerraFusion.AI/Services/AnalyticsReportingService.cs` |
| 24 | P3 | implement real service | AI Service/CostForgeAI | DI service/runtime service | no | yes | `backend/src/TerraFusion.AI/Services/CostForgeAIService.cs` |
| 25 | P1 | replace with honest unavailable state | API Security/Auth | DI service/runtime service | no | yes | `backend/src/TerraFusion.API/Security/Interfaces/ILdapService.cs` |
| 26 | P1 | replace with honest unavailable state | API Security/Auth | DI service/runtime service | no | yes | `backend/src/TerraFusion.API/Security/Services/DevelopmentLdapService.cs` |
| 27 | P1 | replace with honest unavailable state | API Security/Auth | DI service/runtime service | no | yes | `backend/src/TerraFusion.API/Security/Services/RejectingLdapService.cs` |
| 28 | P2 | implement real service | API Service/DataPipeline | DI service/runtime service | no | yes | `backend/src/TerraFusion.API/Services/DataPipelineService.cs` |
| 29 | P2 | implement real service | API Service/ForgeStatistics | DI service/runtime service | no | yes | `backend/src/TerraFusion.API/Services/ForgeStatisticsService.cs` |
| 31 | P1 | disable surface | API Seed/Import | data seed/import path | no | yes | `backend/src/TerraFusion.API/Seeds/PacsDataSeeder.cs` |
| 32 | P2 | implement real service | AI Agent | AI agent | no | yes | `backend/src/TerraFusion.AI/Agents/DocumentConversion/PiltDocumentConversionAgent.cs` |
| 33 | P1 | implement real service | API Security/Auth | auth/security surface | no | yes | `backend/src/TerraFusion.API/Security/AuthenticationConfiguration.cs` |
| 34 | P1 | implement real service | API Service/ProductionPACSDataEngine | runtime engine | no | yes | `backend/src/TerraFusion.API/Services/ProductionPACSDataEngine.cs` |
| 36 | P2 | implement real service | AI Agent | AI agent | no | yes | `backend/src/TerraFusion.AI/Agents/DocumentFormatting/PiltDocumentFormattingAgent.cs` |
| 39 | P1 | disable surface | API Service/DataMigrationEngine | runtime engine | no | yes | `backend/src/TerraFusion.API/Services/DataMigrationEngine.cs` |
| 40 | P2 | implement real service | Core Service/Integration | DI service/runtime service | no | yes | `backend/src/TerraFusion.Core/Services/IntegrationService.cs` |
| 43 | P2 | implement real service | AI Service/AdvancedAnalyticsEngine | runtime engine | no | yes | `backend/src/TerraFusion.AI/Services/AdvancedAnalyticsEngine.cs` |
| 46 | P3 | implement real service | API Model | contract/model surface | no | yes | `backend/src/TerraFusion.API/Models/CanonicalCostMatrixReader.cs` |
| 47 | P3 | implement real service | API Model | contract/model surface | no | yes | `backend/src/TerraFusion.API/Models/Production/ProductionHelperModels.cs` |
| 50 | P2 | implement real service | Core Service/Analytics | DI service/runtime service | no | yes | `backend/src/TerraFusion.Core/Services/AnalyticsService.cs` |

## Required Next Step

Owner review of this disposition plan. For each row choose implement, disable, mark dev-only, return honest unavailable, or quarantine. No code fixes were made in this slice.

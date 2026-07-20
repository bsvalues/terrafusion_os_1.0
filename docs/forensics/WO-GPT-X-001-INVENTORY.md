# WO-GPT-X-001 — TerraGPT Implementation Inventory (source-side, on sovereign base)

> Final suite inventory. **Inventory + disposition only** — no code moved, no repo, no credential.
> Resolves the deferred SystemGptAtlas ownership; flags remainder for **WO-GPT-X-002**.

**Date:** 2026-06-25 · **Source of truth:** `origin/main` @ `2ae013561` · **Write-lane:** GPT has **NO sovereign write lane** — acts only via sanctioned TerraPilot tools (`write-lanes.json`)
**Dispositions:** `RETAIN_IN_OS · EXTRACT_EXACT · REWRITE_FOR_SUITE · SHARE_AS_CONTRACT · MINE_PATTERN · DEFER · REJECT`

## 0. Five load-bearing findings
1. **TerraGPT is real** — genuine RAG infrastructure: `OpenAIEmbeddingService` + `PgVectorRAGEmbeddingRepository`
   (real pgvector), `GPTConfiguration(Service/Seeder)`, `RAGService`, `SystemGptRagFleetService`,
   cost/budget (`GPTCostTracking/BudgetAlert/BudgetMonitoring`), `GPTOrchestrationService`. Not theater.
2. **Largest theater surface of any suite** — **124 theater `.cs`** (swarm/consciousness/quantum/
   superiority) + the **entire `TerraFusion.Consciousness` project** (quarantined "lane unavailable"
   stubs per CLAUDE.md). GPT extraction's hardest job is **separating real RAG from AI-swarm theater** → **REJECT** theater.
3. **Muse/Pilot are OS features, NOT GPT.** `MuseService/MuseRouter/*MuseLlmClient`, `MuseChat.tsx` →
   **RETAIN_IN_OS (Pilot)**. GPT must not absorb them (suites.json os_features; Pilot acts/Muse read-only).
4. **`pages/suites` is a SHARED cross-suite module registry (OS composition), not GPT.** It composes
   ALL suites' modules (`CompsForge/CostForge/AppealForge`→Forge, `GIS/LayerWorks`→Atlas,
   `Documents/Evidence/DefensePackets/ChainOfCustody`→Dossier, `DaisSuiteHome`→Dais). **Only GPT-specific
   modules are GPT** (`GPTAnalytics/GPTBuilder/RAGDatasets/DeepSearch/TerraQuery`, `GptSuiteHome`). The
   registry/`SuiteHome` scaffolding → **RETAIN_IN_OS (Workbench composition)**.
5. **SystemGptAtlas → Atlas (RESOLVED).** The 23 `SystemGptAtlas*`+`Spatial/*` files are **spatial
   analytics** (forecast/anomaly over parcel geometry) — domain = Atlas, mechanism = AI. The "SystemGpt"
   prefix is misleading. → **Atlas** (consuming OS AI services via contract), **not GPT**. Closes Atlas X-001 defer.

## 1. Backend inventory (real TerraGPT)
| Source path | Capability | Disposition | Dep | Tests |
|---|---|---|---|---|
| `TerraFusion.AI/Entities/GPTConfiguration` + `Data/GptAiEntityConfigurations` + `Seeds/GPTConfigurationSeeder` + `Configuration/GptRagOptions` | GPT config domain | **REWRITE_FOR_SUITE** → GptDbContext | crosscut.audit | — |
| `AI/Services/{GPTConfigurationService,RAGService,GPTOrchestrationService,GPTCostTrackingService,GPTBudgetAlertService,GPTBudgetMonitoringService,SystemGptRagFleetService,BentonRagReadinessService}` + `Interfaces/{IGPTConfigurationService,IRAGService,IRAGEmbeddingRepository,IEmbeddingService}` | GPT/RAG/cost engines | **EXTRACT_EXACT** (type-cut) | crosscut.audit, pilot-tool contract | — |
| `AI/Services/{OpenAIEmbeddingService,SimulatedEmbeddingService}` + `Repositories/{PgVectorRAGEmbeddingRepository,InMemoryRAGEmbeddingRepository}` + `Models/RagFleetReadinessModels` | embeddings + vector store | **EXTRACT_EXACT** | — | — |
| `AI/Controllers/GPTBudgetController` + `API/Controllers/{GPTController,RAGController,KnowledgeBaseController,AIAssistantController,TerraGaiaController}` | GPT HTTP surface | **EXTRACT_EXACT** (controller-cut) | crosscut.audit | — |
| `AI/Services/{MuseService,MuseRouter,MuseRouterStatusService,SemanticKernelMuseLlmClient,AnthropicMuseLlmClient}` | **Muse/Pilot LLM** | **RETAIN_IN_OS (Pilot)** — GPT consumes via tool contract | — | — |
| `TerraFusion.Consciousness/**` (whole project) + 124 swarm/quantum/superiority `.cs` | **theater** | **REJECT** | — | — |
| `AI/{SystemGptAtlas*,Spatial/*}` (23) | spatial analytics | **→ Atlas** (see finding 5) | atlas.gis | Phase32/33/35 |

## 2. Frontend inventory
| Path | Disposition | Notes |
|---|---|---|
| `pages/suites/GptSuiteHome` + `components/gpt/*` (GPTStudio, GPTChatInterface, RAGSourcesPanel, RAGDatasetManager, GPTManagementDashboard, GPTMarketplace, GPTTraceDetails, GptQuickChat, GptStudioView) + `hooks/{useRAGDatasets,useGPTConversation}` + modules `{GPTAnalytics,GPTBuilder,RAGDatasets,DeepSearch,TerraQuery}Module` | **EXTRACT to GPT** | the real TerraGPT UI |
| `components/dashboards/TerraGaiaDashboard` (+ `TerraGaiaController`) | **DEFER** | "TerraGaia" — AI dashboard; confirm GPT vs OS |
| `hooks/useSystemGptAtlasLive` | **→ Atlas** | pairs with SystemGptAtlas (Atlas) |
| `MuseChat.tsx` | **RETAIN_IN_OS (Pilot)** | Muse chat = Pilot, not GPT |
| `pages/suites/{SuiteHome,TerraPrimeSuite,SuiteWindowLayout}` + cross-suite modules (CompsForge/GIS/Documents/…) | **RETAIN_IN_OS (registry)** / route to owning suite | shared module registry, not GPT |

## 3. Ownership line
```text
GPT owns:      GPT configuration, RAG (embeddings/pgvector/datasets), cost/budget, conversation history
               — persisted in GptDbContext; acts ONLY via sanctioned Pilot tools (no sovereign write).
OS/Pilot owns: Muse/Pilot LLM (MuseService/Router/clients, MuseChat), the suite-module registry.
Not GPT:       SystemGptAtlas spatial-analytics (→ Atlas), cross-suite modules (→ owners),
               AI-swarm/consciousness/quantum (→ REJECT theater).
```

## 4. Contracts + write-lane specialization
- **Consumes:** `crosscut.audit@1.0.0`, plus a **Pilot-tool contract** (GPT has no write lane — it invokes
  sanctioned Pilot tools; this is a GPT↔Pilot contract dependency, not a frozen data contract).
- **Owns (GPT-internal):** GPT config + RAG metadata/embeddings (GptDbContext) — **not** cross-repo contracts
  (GPT is a leaf consumer, not a contract producer, per write-lanes "no sovereign write lane").
- **Feeders (out-of-session):** `PropertyTaxAI` (LangChain assistant), `TaxI_AI` → Pilot/GPT tool suite.

## 5. Flagged for WO-GPT-X-002
1. **Theater separation** (largest) — precise cut of real RAG/GPT from `Consciousness`/swarm/quantum; the 124-file theater must not leak in.
2. **GptDbContext carve** — GPT config + RAG embedding tables (pgvector).
3. **Pilot-tool contract** — define the GPT→Pilot sanctioned-tool boundary (GPT's only write path).
4. **SystemGptAtlas hand-off to Atlas** — coordinate with Atlas X-002.
5. **TerraGaia ownership** (GPT vs OS AI dashboard).
6. **Module-registry disposition** — confirm registry stays OS; modules route to owners.

## 6. Proven vs unverifiable
- **Proven:** real RAG infra (embeddings, pgvector repo), GPT config/cost/budget services, GPT frontend (components/gpt ×9 + modules).
- **Theater to reject:** 124 files + Consciousness project (already quarantined stubs).
- **Unverifiable in-session:** build/test greenness (no `dotnet`); feeder repos.

## 7. Status + all-five synthesis
**WO-GPT-X-001 COMPLETE — all five suite inventories done.** Cross-suite doctrine confirmed:
```text
Every suite's raw NAME over-counts; the real domain is narrower. Strip: theater (Forge CostForge,
GPT swarm/consciousness), OS-AI (Muse/Pilot), Sync-ingested/profiling, shared registries.
Each suite: owns engine/workflow/config + its OWN DbContext (Forge/Atlas/Dais/Dossier/Gpt + Levy/CurrentUse).
Shared/ingested data + PACS stay OS/Sync, read via frozen contracts. Two contract GAPS surfaced
(levy.projection, dossier.evidence). GPT is a leaf (no write lane; acts via Pilot tools).
```
Next: **WO-GPT-X-002**; or freeze the pending contracts (`levy.projection`, `dossier.evidence`); or the
per-suite X-002s. All extraction execution-gated on the suite repos. No code moved.

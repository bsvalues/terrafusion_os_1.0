# WO-GPT-X-002 — TerraGPT Exact Disposition, Dependency & Provenance

> Resolves the decisions flagged by `WO-GPT-X-001-INVENTORY.md` with source evidence. **Decision-layer;
> no code moved, no repo, no credential.** Extraction/bootstrap gated on the GPT repo.

**Date:** 2026-06-25 · **Source of truth:** `origin/main` @ `2ae013561` · **Write-lane:** GPT has NO sovereign write lane — acts via Pilot tools

## 1. Flagged decisions — RESOLVED (evidence)
1. **Theater separation (the hard one).** `TerraFusion.Consciousness` (whole project) + swarm/quantum/
   superiority (124 `.cs`) → **REJECT**. GPT extraction takes ONLY the real RAG/GPT-config/cost surface.
2. **GptDbContext carve — GPT entities are coupled to the main `TerraFusionDbContext` via a static hook.**
   `GptAiEntityConfigurations` is wired via `TerraFusionDbContext.OnModelCreatingExtensions`; GPTConfiguration/
   RAG DbSets live in `TerraFusionDbContext` (+ `AiDataStubs`). ⇒ carve a **GptDbContext** (config + RAG
   embedding/pgvector tables), remove the hook coupling.
3. **`TerraGaia` = THEATER → REJECT.** `TerraGaiaController` self-describes as *"TerraGaia Supreme AI
   Consciousness Controller — Championship-level government AI advisory"*. Not GPT, not OS — fenced theater.
4. **Pilot-tool contract** — GPT's only write path. Define a `gpt↔pilot` sanctioned-tool contract (GPT invokes
   Pilot tools; no direct domain writes). This is a new contract dependency (spec at X-003), not a frozen data contract.
5. **SystemGptAtlas → Atlas** (handed off; see WO-ATLAS-X-002).
6. **Module-registry stays OS** — `pages/suites` registry + `SuiteHome` scaffolding = Workbench composition; only GPT modules extract.

## 2. Ownership line
```text
GPT owns:      GPT configuration, RAG (embeddings/pgvector/datasets/fleet), cost/budget, conversation
               — persisted in GptDbContext; acts ONLY via sanctioned Pilot tools (no sovereign write).
OS/Pilot owns: Muse/Pilot LLM (MuseService/Router/clients, MuseChat), the suite-module registry.
REJECT:        Consciousness project, swarm/quantum/superiority, TerraGaia "Supreme AI Consciousness".
Not GPT:       SystemGptAtlas (→ Atlas).
```

## 3. Exact disposition matrix
| Source path | Action | Dep | Provenance | Cutover gate |
|---|---|---|---|---|
| `AI/Entities/GPTConfiguration` + `Data/GptAiEntityConfigurations` (hook) + `Seeds/GPTConfigurationSeeder` + `Configuration/GptRagOptions` | **REWRITE_FOR_SUITE** → GptDbContext (remove OnModelCreating hook) | crosscut.audit | `2ae013561` | GptDbContext migration applies |
| `AI/Services/{GPTConfiguration,RAG,GPTOrchestration,GPTCostTracking,GPTBudget*,SystemGptRagFleet,BentonRagReadiness}Service` + `Interfaces/{IGPTConfiguration,IRAG,IRAGEmbeddingRepository,IEmbedding}Service` | **EXTRACT_EXACT** (type-cut from AI) | pilot-tool contract | `2ae013561` | compiles; Muse/swarm left in OS |
| `AI/Services/{OpenAIEmbedding,SimulatedEmbedding}Service` + `Repositories/{PgVector,InMemory}RAGEmbeddingRepository` | **EXTRACT_EXACT** | — | `2ae013561` | pgvector wired in GptDbContext |
| `AI/Controllers/GPTBudgetController` + `API/Controllers/{GPTController,RAGController,KnowledgeBaseController,AIAssistantController}` | **EXTRACT_EXACT** (controller-cut) | crosscut.audit | `2ae013561` | OS module-slot via contract |
| `AI/Services/{MuseService,MuseRouter,*MuseLlmClient,MuseRouterStatusService}` + `MuseChat.tsx` | **RETAIN_IN_OS (Pilot)** | — | — | GPT consumes via Pilot tool contract |
| `TerraFusion.Consciousness/**` + swarm/quantum/superiority (124) + `API/Controllers/TerraGaiaController` (+ service) | **REJECT** (theater) | — | — | — |
| `AI/{SystemGptAtlas*,Spatial/*}` | **→ Atlas** | — | — | (WO-ATLAS-X-002) |
| `pages/suites/GptSuiteHome` + `components/gpt/*` + `hooks/{useRAGDatasets,useGPTConversation}` + GPT modules | **EXTRACT_EXACT** | Workbench tab contract | `2ae013561` | renders via contract |
| `pages/suites/{SuiteHome,registry}` + cross-suite modules | **RETAIN_IN_OS** / route to owning suite | — | — | shared registry |

## 4. Dependency inventory + contract action
Consumes `crosscut.audit` + a **`gpt↔pilot` sanctioned-tool contract** (define at X-003 — GPT's only write path). Owns GPT config + RAG (GptDbContext, incl. pgvector). Does **not** produce cross-repo contracts (leaf, no write lane). Feeders (out-of-session): PropertyTaxAI, TaxI_AI.

## 5. Status
**WO-GPT-X-002 COMPLETE** — theater (Consciousness/swarm/TerraGaia) REJECTed; real RAG/GPT surface isolated;
GptDbContext carve defined (remove the OnModelCreating hook coupling); Pilot-tool contract is the gating
new dependency; SystemGptAtlas handed to Atlas. Extraction gated on the GPT repo. No code moved.

# WO-AI-DISCOVERY-001b — GitHub Estate AI Sweep (`bsvalues`)

> **Work order:** WO-AI-DISCOVERY-001b · **Date:** 2026-06-11 · **Mode:** READ-ONLY
> **Method:** `gh` CLI only (repo list, git trees, raw contents, code search). Nothing cloned,
> no files modified, no git state touched. Inventory voice only — verdicts describe what exists;
> nothing here authorizes adoption, recovery, or deletion.

## Summary stats

| Metric | Count |
|---|---|
| Total repos under `bsvalues` | 130 |
| Empty repos (diskUsage = 0, no code) | 36 |
| AI-relevant repos inspected (tree + key files) | ~30 |
| Repos with a **local-LLM (Ollama) code path** | 7 (TerraFusionSync, TerraAgent, BCBSLevy, BCBSLevyMaster, terrafusion-market, TerraFusion_Master_Workspace, kid-safeguard-ai) |
| Repos whose AI is **cloud-key-only** (OpenAI/Anthropic/Azure/Groq/Forge) | majority of the rest |
| Major duplicate clusters | 6 (below) |

## Duplicate clusters (same AI code replicated across repos)

1. **CostForge/MCP-agents suite** — BCBSCOSTApp ≈ BCBSCOST ≈ TerraBuild ≈ TerraFusionMono(`apps/bcbscostapp`) ≈ terrafusion_enterprise(`CostForge/TerraFusionBuild`): identical `server/mcp/agents/*` (compliance/costAnalysis/costEstimation/conversion) + `ai/predictionEngine.ts`.
2. **Levy/MCP-Army** — BCBSLevy ≈ BCBSLevyMaster ≈ TerraFusionMono(`apps/bcbslevy`): same `utils/mcp_llm.py`.
3. **GIS agent framework** — GeoAssessmentPro ≈ BCBSGeoAssessmentPro ≈ TerraFlow: same `ai_agents/` (rule-based, no LLM in base) + OpenAI/FAISS `rag.py`.
4. **MCP assessor platform** — PropertyTaxAI ≈ TaxI_AI (near-identical trees, same `capabilities.json`, same attached_assets).
5. **Streamlit code-analysis multi-agent** — TerraFusionAssistant ≈ TerraF (same `agent_base.py` lineage).
6. **GAMA agents/core TS framework** — TerraFusionTheory ≈ Bsbcintelligentvalues (same `agents/core/agent-coordinator.ts` family).

## AI-relevant repo matrix

| Repo | What it actually is | Local-runnable? | Cloud deps | Verdict | Unique value |
|---|---|---|---|---|---|
| **terrafusion-ai-platform** | Phase-3C polyrepo extraction of `modules/ai-systems` + ai-command-brain + ai-swarm from the main monorepo; includes compiled `.js/.d.ts` artifacts, RevenueHunterSwarm, MCPIntegrationHub, BSArmyAgentManager, a small Python mcp-server | Partially (TS modules, small) | None visible in module code | **Duplicate of main tree** (os-platform/ai-systems) | None beyond main tree |
| **TerraFusionSync** | Python sync platform; root has `narrator_ai_plugin.py` (Ollama narratives) + `exemption_seer_ai.py` (Ollama llama3.2:3b exemption classifier); archive holds **NarratorAI Rust microservice** (`ollama_client.rs`, Prometheus metrics) + ollama install scripts + a Perplexity client | **Yes — Ollama, offline-by-design** ("perfect for county networks") | Only the archived perplexity_client | **Usable (the AI plugins); rest superseded by main-tree Sync** | Strongest local-AI assets in the estate |
| **TerraAgent** | PACS Training Assistant: Flask + LangChain NL→SQL + doc RAG + chat UI; `utils/llm_providers/` with openai/azure/anthropic/**ollama** switchable via `LLM_PROVIDER` env | **Yes with Ollama provider** (default is OpenAI) | OpenAI default; optional | **Needs-work** | Provider-abstraction pattern + NL→SQL over PACS; main tree already carries a descendant (`QUARANTINE/.../terra-agent-production/utils/ollama_client.py`) |
| **BCBSLevy / BCBSLevyMaster** | Flask levy platform with "MCP Army": `utils/mcp_llm.py` defines `LLMProvider` enum OPENAI/ANTHROPIC/**OLLAMA**/**MOCK** + agent dashboard | Yes with OLLAMA or MOCK provider | OpenAI/Anthropic optional | **Needs-work** | MOCK provider = LLM service testable with zero API deps |
| **TerraFusion_Master_Workspace** | 15k-file mega-workspace, heavy lore; contains **`hybrid-llm-implementation/`**: PII-tiered router (Tier1=local-Ollama-only), data classifier, anonymizer, emergency containment, Ollama county-deployment configs, `ollama_performance_optimizer.py` | The hybrid-llm core is plain Python, locally runnable | Tier-3 path may call cloud | **Island with one real subsystem** (rest = doc/lore sprawl) | Privacy-tier routing + PII anonymizer designed for county data |
| **terrafusion-market** | Marketing/market repo; `ai-swarms/` = four config.json shells (vapor); **but `shared/hybrid-llm/`** is real Python: 351-line query router, `gpt_oss_client.py`, e2e tests; routes Ollama-local vs gpt-oss | hybrid-llm module: yes | gpt-oss endpoint for "advanced" tier | **Mostly vapor-demo; one usable module** | Complexity/privacy-based query routing (overlaps Master_Workspace version) |
| **terrafusion-government-platform** | Polyrepo extraction; `modules/government-core/terra-agent/` — README claims Tauri+Ollama offline desktop, but the actual `ai-agent/` code is Express/TS with **cloud** deps (openai, anthropic, langchain, chromadb, supabase) | No (as written) | OpenAI + Anthropic + Supabase | **Needs-work / README-aspirational** | Conversation context manager + NLP intent extraction (deterministic parts) |
| **PropertyTaxAI** | MCP-enabled assessor platform (Node/TS, Drizzle), large Replit lineage, `codeagent-cli` | Runs locally but AI is keyed | @anthropic-ai/sdk, openai, langchain, SendGrid | **Island** (duplicate of TaxI_AI) | MCP agent orchestration patterns |
| **TaxI_AI** | Same platform as PropertyTaxAI, earlier/parallel copy | Same | Same | **Island / duplicate** | — |
| **TerraFusionAssistant** | Streamlit "civil infrastructure brain": multi-agent code-analysis/orchestration UI, dual provider | UI runs; AI needs keys | OpenAI GPT-4 + Anthropic | **Island** | Agent state machine in `agent_base.py` (no LLM dep in base) |
| **TerraF** | Same Streamlit multi-agent family as TerraFusionAssistant, monorepo-ified | Same | Same | **Island / duplicate** | — |
| **TerraFusionTheory** | "GAMA" geographic-assisted mass appraisal: agents/core TS coordinator, Docker per-tier, GAMA installers | Engine partly deterministic | openai + langchain | **Needs-work island** | GAMA spatial-valuation agents (domain logic, not the LLM glue) |
| **Bsbcintelligentvalues** | Same agents/core framework + Qdrant vector store + OpenAIEmbeddings, ETL, microservices | No (embeddings = OpenAI) | OpenAI, Qdrant | **Island / duplicate of Theory** | Vector-store wiring example |
| **TerraMiner** | Flask real-estate data-mining platform: `ai/agents/` (market analyzer, NL search, summarizer), model_factory | Platform yes; AI cloud-only | OpenAI + Anthropic clients only (no local provider) | **Island** | Agent-protocol + prompt A/B testing scaffolding |
| **GeoAssessmentPro / BCBSGeoAssessmentPro / TerraFlow** | Flask GIS/assessment platform; `ai_agents/` framework (anomaly detection, data validation, recovery — rule-based, **no LLM imports in base**) + `rag.py` (OpenAI+FAISS) | Agent framework: yes (deterministic); RAG: no | OpenAI for RAG only | **Needs-work cluster** | Local rule-based anomaly/validation agents for assessor data |
| **PACS-DataBridge** | CIAPS-replacement permit/personal-property importer; scikit-learn + transformers classification, fuzzy address matching | **Yes — classical ML, no LLM API at all** | None | **Needs-work (early, 39 files)** | Local-ML permit classification; CIAPS domain knowledge |
| **AutomationInsights** | Streamlit assessor dashboards; scikit-learn + an openai dep | Mostly | openai (one dep) | **Island** | — |
| **BCBSDataEngine** | Valuation engine + `agents/*.json` (Replit bootstrap-agent configs, not runtime AI) | Yes (no runtime LLM) | None at runtime | **Island** | — |
| **terrafusion-os-core** | C# extraction: `Services/AI/` AzureOpenAIService, MLModelManager, MarketAnalysisEngine — precursor of main-tree TerraFusion.AI | No (Azure OpenAI) | Azure OpenAI | **Duplicate of main tree concepts** | — |
| **TerraFusionMono** | Nx monorepo aggregating bcbscostapp/bcbslevy/etc. | Per-app | Mixed | **Duplicate aggregate** | — |
| **TerraFusionPro / TerraFusionProf** | Appraisal platform; `packages/ai-agents` (valuation/terminology/data-processing agents); Prof has only `packages/agents/index.js` | Partially | Cloud (lineage) | **Island** | — |
| **terrafusion_enterprise** | Restructure of CostForge MCP suite + "CONSCIOUSNESS_LIBERATION_PROTOCOL" lore | Per CostForge | OpenAI/Anthropic | **Island / duplicate (cluster 1)** | — |
| **TerraFusionPilt** | 743MB TS report platform; `server/agents/` = report/formatting/conversion/pdf agents + heuristic `terraFusionAgent.ts` (deterministic valuation stub) | Yes (agents look deterministic) | Not deeply verified | **Needs-work (lightly inspected)** | Report-generation agent pipeline |
| **mass-valuation-showcase** | Manus-built quantum-branded showcase; `server/_core/llm.ts` calls a "Forge API" gateway (`BUILT_IN_FORGE_API_URL/KEY`) | No | Proprietary Forge gateway | **Vapor-demo / non-local** | — |
| **terragroq** | Unmodified Vercel×Groq chatbot starter fork | No | Groq API | **Vapor-demo (template fork)** | — |
| **kid-safeguard-ai** | Lovable child-safety demo; has `LocalAIManager.tsx` mentioning Ollama | UI only | Supabase | **Vapor-demo, off-domain** | — |
| **TerraFusionPlayground** | Dev playground; agent-system UI components, agent-voice, codeagent-cli | UI yes | Cloud lineage | **Island** | Agent control-panel UI patterns |
| **TerraLegislativePulsePub** | Flask legislative-impact tool; MCP message-protocol agents (rule-based) | Yes (no LLM import in agents) | Unverified elsewhere | **Island** | Legislative→property-impact agent logic |
| **BCBSGISPRO** | GIS platform; agent framework all under `archive/deprecated-modules/` | — | — | **Island (AI self-deprecated)** | — |
| **terrafusion-os / shock_and_awe / SHOCK_AND_AWE_public / TerraFusionV0Demo / terrafusion_mock-up** | Demo/snapshot workspaces (Aug 2025 era); SWARM_LAUNCH docs, costforge-ai Tauri `ai_engine.rs` | Fragments | Mixed | **Vapor-demo / island** | — |
| **36 empty repos** incl. TerraIntelligence(1.0), PACSAgentBS, TerraDBAssist, TerraGama, TerraFusionGama, terrafusion-slco-demo, legpulse, TerraFusion, TerraFusion_OS, LevyMaster… | Name-only placeholders, zero content | No | — | **Vapor** | — |

## Adoption-candidate shortlist (input to WO-AI-CONSOLIDATION-005 — candidates only, no admission implied)

Genuinely unique, locally-runnable, and compatible with the governed TerraPilot/LocalOps path (which already has `os-platform/core/pilot/local-agent/ollamaAdapter.js` and a quarantined `terra-agent-production/utils/ollama_client.py` in the main tree):

1. **NarratorAI Rust microservice** — `TerraFusionSync:archive/directories/ai/narrator_ai/` — Ollama client, property summarization/classification, Prometheus metrics, offline-first. Smallest, cleanest local-AI service in the estate.
2. **ExemptionSeer** — `TerraFusionSync:exemption_seer_ai.py` — exemption classification + anomaly/audit insights against local `llama3.2:3b`; aiohttp, zero cloud deps. Direct assessor-domain fit.
3. **NarratorAI Python plugin** — `TerraFusionSync:narrator_ai_plugin.py` — Ollama narrative generation for GIS-export/sync/district-lookup payloads; explicitly written for locked-down county networks.
4. **Hybrid-LLM PII-tier router** — `TerraFusion_Master_Workspace:hybrid-llm-implementation/core/` (router + classifier + anonymizer) and the overlapping `terrafusion-market:shared/hybrid-llm/src/query_router.py` — Tier-1-sensitive-stays-local routing doctrine in working Python; matches LocalOps' locked-down-server constraint.
5. **MOCK/OLLAMA provider enum pattern** — `BCBSLevy:utils/mcp_llm.py` — LLM service abstraction with a mock provider for keyless testing.
6. **Provider-config abstraction** — `TerraAgent:utils/llm_providers/` — clean env-driven openai/azure/anthropic/ollama switch; plus its NL→SQL-over-PACS chain.
7. **PACS-DataBridge classical-ML permit classifier** — scikit-learn/transformers, no LLM API; candidate for permit-ingest workflows without any model server.

Notable non-candidates despite size: the MCP agent suites (CostForge cluster) and agents/core TS coordinators are everywhere but are cloud-keyed LangChain/OpenAI glue duplicating what AICommandService/Consciousness already covers in the main tree.

## Gaps — not inspected or only shallowly inspected

- **Shallow only (tree grep, no dep verification):** TerraFusionPilt (server/agents deps unverified), shock_and_awe / SHOCK_AND_AWE_public, terrafusion-infrastructure-platform (`ProductionTerraFusionAI.ts` seen in search only), TerraFusionProfessional, fuller-build, wa-housing-truth, TerraFusion-Valuator-Pro-Studio (active separate workstream), CUForge, WashingtonForge, legislative-pulse-beacon, TerraMiner beyond `ai/`.
- **Skipped as non-AI by name/description/language:** TSQL DB-dump repos (BSBCmaster, TerraFusionAssessor1.0), HTML desktop snapshots (TerraFusionDesk, TerraFusionDesktop2, BCBSDesktop), permit twins (BCBSPermit/TerraFUsionPermit), StackBlitz one-offs (BSVALES, bs_prop_search, Demon_Values, Whats-the-Cost-BS, BS_Titan_Bolt, sb1-jgvmil), BSIncomeValuation, BCBSValuationDashboard, terrafusion-docs/-website/-brand-vault/-developer-tools/-ui-components/-shared/-specialized-modules, TFPlatformDev, LegislativePulse, CountyDataSync-1, BCBSData, bcbspacsmapping, GeospatialAnalyzerBS (one `openai.ts` service, otherwise GIS).
- **Method limits:** GitHub code search indexes default branches only — Ollama/local-LLM code on non-default branches would be missed; very large trees were grepped by path, so AI code in unconventionally named paths could be missed.

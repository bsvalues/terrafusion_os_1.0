# ADR-005: TerraGPT Suite Charter

**Status:** Accepted (2026-03-15)

## Context

- TerraGPT is one of the 5 constitutional suites (Forge, Atlas, Dais, Dossier, GPT) per TF-052.
- 103 assets from the Phase 4B feeder extraction were deferred with status `deferred-with-rationale` because no ADR formally chartered TerraGPT's scope, write-lane, or module structure.
- The codebase already contains: `GptSuiteHome.tsx` (6-module grid), `suiteRegistry.ts` entry (id: `suite-gpt`), desktop icon, and 6 placeholder sub-modules registered in `moduleComponents.tsx`.
- The write-lane service (`writeLane.ts`) already enforces GPT ownership of: configurations, RAG knowledge bases, embeddings, metrics, conversations.
- 95 of 103 deferred assets are blocked on `adr-pending` (ADR-TBD-5), 8 on `architectural` (also GPT-related), 1 on `security` (Harris PACS DLL legal — unrelated to this ADR).

## Decision

- **TerraGPT is a constitutional suite** owning all AI/LLM capabilities in TerraFusion OS.
- It opens as a **near-full-stage** standalone workspace (same tier as Forge, Atlas, Dais, Dossier).
- Suite ID: `suite-gpt` (already registered).
- Tab position: per TF-052 tab order (Summary, Forge, Atlas, Dais, [future offices], Dossier, Pilot — GPT is accessible via desktop icon, not a workbench tab).

### Write-Lane Ownership

TerraGPT owns these data domains exclusively:

| Domain | Description |
|--------|-------------|
| `gpt.configurations` | AI model configs, provider settings, prompt templates |
| `gpt.rag` | RAG knowledge bases, document ingestion pipelines |
| `gpt.embeddings` | Vector stores, embedding models, similarity indices |
| `gpt.metrics` | AI usage metrics, token consumption, quality scores |
| `gpt.conversations` | Chat histories, conversation state, session management |
| `gpt.agents` | Agent definitions, swarm coordination, task orchestration |

TerraGPT **does NOT write to** other suites' domains. It may **read from** any suite's data to provide AI-assisted analysis (e.g., reading Forge valuation data to explain a value, reading Atlas spatial data to answer location questions).

### Module Structure

6 sub-modules, all launching from GptSuiteHome:

| Module ID | Name | Purpose |
|-----------|------|---------|
| `gpt-studio` | GPT Studio | AI chat interface, prompt engineering, conversation management |
| `gpt-marketplace` | GPT Marketplace | AI model/template marketplace, community prompts |
| `gpt-management` | GPT Management | AI service administration, provider config, usage monitoring |
| `gpt-builder` | GPT Builder | Custom AI agent builder, workflow automation |
| `gpt-analytics` | GPT Analytics | AI performance analytics, quality metrics, cost tracking |
| `gpt-rag` | GPT RAG | Knowledge base management, document ingestion, retrieval config |

### AI Service Architecture

- **Multi-provider support**: OpenAI, xAI, Anthropic, local models — unified interface via AI service factory.
- **Rate limiting**: Per-provider, per-user rate limiting with quota management.
- **Agent hosting**: AI agents (from TerraFusion.Consciousness swarm) surface through GPT Studio and GPT Builder.
- **Embedding pipeline**: Document ingestion → chunking → embedding → vector store, managed by GPT RAG module.

### Asset Placement Rules

Assets from feeder repos that involve AI/LLM capabilities are placed under TerraGPT ownership:
- AI service layers (providers, factories, rate limiting) → `gpt-management`
- AI agent definitions and coordination → `gpt-builder`
- AI chat/conversation UI → `gpt-studio`
- AI analytics and insights → `gpt-analytics`
- Embedding/RAG infrastructure → `gpt-rag`
- AI marketplace/template features → `gpt-marketplace`

Assets that use AI as a tool but primarily serve another suite's domain remain under that suite:
- "AI-assisted valuation explanation" → Forge (uses GPT read-only, writes to Forge domain)
- "AI-powered spatial analysis" → Atlas (uses GPT read-only, writes to Atlas domain)

## Consequences

- All 103 `adr-pending` and `architectural` deferred assets are reclassified to `activated-under-adr005` with `owner_suite: TerraGPT`.
- 1 asset (BIV-178, Harris PACS DLLs) remains deferred on security/legal review — not an ADR blocker.
- The 6 placeholder modules in `moduleComponents.tsx` retain `intent: "future-module"` until implementation begins.
- `GptSuiteHome.tsx` is the canonical launch surface for all 6 modules.
- Backend: `TerraFusion.Consciousness` remains the AI swarm runtime; TerraGPT is the user-facing suite that surfaces swarm capabilities.
- No new OS-level surface registration needed — `suite-gpt` is already registered.

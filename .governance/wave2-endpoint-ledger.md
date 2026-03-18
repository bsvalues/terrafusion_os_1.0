# Wave 2 Endpoint Ledger — TerraGPT/RAG Surface

Generated: 2026-03-18

## Summary

- Total endpoints catalogued: 54
- Complete: 53 (explain route was already added in Phase 31)
- Stub (returns empty): 1 (RAG chunks)
- Missing routes called by frontend: 1 (GET /api/gpt/conversations)
- DbSets for persistence: COMMENTED OUT (entities exist, DB integration pending — Wave 4)
- Contract tests: ZERO (this wave adds them)

## Endpoint Table

| Family | Route | Method | Exists? | Status | Owner | Test File |
|--------|-------|--------|---------|--------|-------|-----------|
| GPT Config | /api/gpt | GET | yes | live | TerraGPT | GptConfigurationEndpointsTests |
| GPT Config | /api/gpt | POST | yes | live | TerraGPT | GptConfigurationEndpointsTests |
| GPT Config | /api/gpt/{id} | GET | yes | live | TerraGPT | GptConfigurationEndpointsTests |
| GPT Config | /api/gpt/{id} | PUT | yes | live | TerraGPT | GptConfigurationEndpointsTests |
| GPT Config | /api/gpt/{id} | DELETE | yes | live | TerraGPT | GptConfigurationEndpointsTests |
| GPT Config | /api/gpt/system | GET | yes | live | TerraGPT | GptConfigurationEndpointsTests |
| GPT Config | /api/gpt/featured | GET | yes | live | TerraGPT | GptConfigurationEndpointsTests |
| GPT Config | /api/gpt/popular | GET | yes | live | TerraGPT | GptConfigurationEndpointsTests |
| GPT Config | /api/gpt/search | GET | yes | live | TerraGPT | GptConfigurationEndpointsTests |
| Conversation | /api/gpt/conversations | POST | yes | live | TerraGPT | GptConversationEndpointsTests |
| Conversation | /api/gpt/conversations | GET | **NO** | **MISSING** | TerraGPT | GptConversationEndpointsTests |
| Conversation | /api/gpt/conversations/{id} | GET | yes | live | TerraGPT | GptConversationEndpointsTests |
| Conversation | /api/gpt/{gptId}/conversations | GET | yes | live | TerraGPT | GptConversationEndpointsTests |
| Conversation | /api/gpt/conversations/{id}/history | GET | yes | live | TerraGPT | GptConversationEndpointsTests |
| Conversation | /api/gpt/conversations/{conversationId}/messages | POST | yes | live | TerraGPT | GptConversationEndpointsTests |
| Conversation | /api/gpt/conversations/{id}/archive | POST | yes | live | TerraGPT | GptConversationEndpointsTests |
| Conversation | /api/gpt/conversations/{id}/rate | POST | yes | live | TerraGPT | GptConversationEndpointsTests |
| Conversation | /api/gpt/conversations/{id} | DELETE | yes | live | TerraGPT | GptConversationEndpointsTests |
| GPT Explain | /api/gpt/explain | POST | yes | live (Phase 31) | TerraGPT | GptConversationEndpointsTests |
| Statistics | /api/gpt/{id}/statistics | GET | yes | live | TerraGPT | GptUsageMetricsEndpointsTests |
| Statistics | /api/gpt/statistics/county | GET | yes | live | TerraGPT | GptUsageMetricsEndpointsTests |
| RAG Dataset | /api/rag/datasets | POST | yes | live | TerraGPT | RagDatasetEndpointsTests |
| RAG Dataset | /api/rag/datasets | GET | yes | live | TerraGPT | RagDatasetEndpointsTests |
| RAG Dataset | /api/rag/datasets/{id} | GET | yes | live | TerraGPT | RagDatasetEndpointsTests |
| RAG Dataset | /api/rag/datasets/{id} | DELETE | yes | live | TerraGPT | RagDatasetEndpointsTests |
| RAG Dataset | /api/rag/datasets/{id}/reindex | POST | yes | live | TerraGPT | RagDatasetEndpointsTests |
| RAG Document | /api/rag/datasets/{datasetId}/documents | POST | yes | live | TerraGPT | RagDatasetEndpointsTests |
| RAG Document | /api/rag/datasets/{datasetId}/documents | GET | yes | live | TerraGPT | RagDatasetEndpointsTests |
| RAG Document | /api/rag/documents/{id} | DELETE | yes | live | TerraGPT | RagDatasetEndpointsTests |
| RAG Chunks | /api/rag/documents/{documentId}/chunks | GET | yes | **STUB** | TerraGPT | RagEmbeddingEndpointsTests |
| RAG Health | /api/gpt/rag/health | GET | yes | live | TerraGPT | RagEmbeddingEndpointsTests |
| RAG Index | /api/gpt/rag/index/{datasetId} | POST | yes | live | TerraGPT | RagEmbeddingEndpointsTests |
| RAG Export | /api/gpt/rag/benton_cama_basics/export | GET | yes | live | TerraGPT | RagEmbeddingEndpointsTests |
| Trace/Audit | /api/gpt/conversations/{conversationId}/trace | GET | yes | live | TerraGPT | GptTraceAuditEndpointsTests |
| Diagnostics | /api/gpt/system/diagnostics | GET | yes | live | TerraGPT | GptConfigurationEndpointsTests |
| Safe Mode | /api/gpt/system/safe-mode | GET | yes | live | TerraGPT | GptConfigurationEndpointsTests |
| Safe Mode | /api/gpt/system/safe-mode | POST | yes | live | TerraGPT | GptConfigurationEndpointsTests |

## What Wave 2 Adds

1. `GET /api/gpt/conversations` — all conversations (frontend already calls this; backend route still missing)
2. RAG chunks endpoint — un-stub (return real chunk data; `IRAGService.GetChunksAsync` needs adding)
3. `POST /api/gpt/explain` — ALREADY EXISTS (Phase 31); ledger updated
4. Contract test harness — 7 test files (all previously missing)

## What Wave 2 Does NOT Do

- DbSet activation for GPT/RAG entities (Wave 4 scope — requires migrations)
- New logging vocabulary (TerraTrace already covers this)
- Shell/workbench changes (sealed)
- Cross-suite writes from TerraGPT controllers

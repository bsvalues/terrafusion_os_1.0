# Wave 2 Endpoint Ledger — TerraGPT/RAG Surface

Generated: 2026-03-18

## Phase 1D Closure

### 1. Fixed now

- invoke/validate `supervisorApproval` parity
- nullable `payloadStore` schema/type parity
- preflight denial parity in `validate()` and `execute()`
- manifest version enforcement at registry load
- county isolation moved into runner-owned enforcement
- route-level parity and county-mismatch proofs added

### 2. Explicit defer

- stale `INVOKE_CONTRACT.md` doc drift

This is frozen documentation drift, not live execution drift.

### 3. Closure statement

Wave 2 Phase 1 backend truth inventory is closed on evidence.
All must-fix-now execution drifts identified in the governed pilot surface were either fixed and proven, or explicitly classified as deferred documentation drift.
Phase 2 remains closed pending formal handoff and route-to-frontend contract confirmation.

## CP-W2-1 Pilot Runtime Truth Addendum

- Fixed: `POST /pilot/invoke` previously parsed `supervisorApproval` but dropped it before runner execution, while `POST /pilot/validate` preserved it. Both routes now share one execution-context builder, so irreversible-tool ingress parity is aligned.
- Fixed: manifest reality already allowed `payloadStore: null` for non-`payload_ref` tools, but runtime types and registry schema still modeled `payloadStore` as string-only. `os-platform/core/types/index.ts` and `tools/registry/terrapilot.tools.schema.json` now permit `null`.
- Fixed: registry version truth had drifted between source and runtime. `ToolRegistry.ts` expected manifest `2.0.0`, checked-in `ToolRegistry.js` still declared `1.3.0`, and neither loader path enforced the manifest version. Registry validation now rejects version drift and both runtime paths are aligned on `2.0.0`.
- Fixed: schema ownership drift on the manifest version anchor. `terrapilot.tools.schema.json` previously accepted any semver string while the registry/runtime required `2.0.0`; the schema now pins the same `2.0.0` anchor.
- Classified must-fix-now and fixed: county isolation was split across the runtime. `ToolRunner.run()` enforced `params.county === context.countyId`, but governed HTTP ingress called `execute()` directly, so `POST /pilot/validate` missed county mismatch entirely and `POST /pilot/invoke` only surfaced it later as handler failure. County isolation now lives in the runner-owned `validate()` and `execute()` surface and returns `COUNTY_MISMATCH` before handler execution.
- Added proof: `os-platform/core/pilot/dev-pilot-runtime.test.mjs` now pins route-level parity for `/pilot/validate` and `/pilot/invoke` using `request_trace_redaction`, including `SUPERVISOR_APPROVAL_REQUIRED` enforcement when approval is absent.
- Added proof: `os-platform/core/pilot/dev-pilot-runtime.test.mjs` now proves a mismatched `params.county` vs `x-county-id` is rejected on both `/pilot/validate` and `/pilot/invoke` with `COUNTY_MISMATCH`.
- Added proof: `os-platform/core/tests/phase83-tools.test.mjs` now rejects manifest files that do not match the `2.0.0` version anchor.
- Added proof: `os-platform/core/tests/phase83-tools.test.mjs` now asserts the JSON schema pins the same `2.0.0` manifest version anchor.
- Runtime truth: R1 real handlers only register when backend env is present via `TF_API_BASE_URL` or `TF_API_PORT`. The ingress parity proof opts into that boot mode with `TF_API_PORT`; `request_trace_redaction` is local in behavior but currently registered behind that path.

## Residual Audit Classification

- Fixed now: no remaining live `ToolRegistry` / `ToolRunner` optional-vs-nullable drift was found after aligning `payloadStore`, preflight denial parity, county isolation, and the manifest version anchor across runtime, schema, and tests.
- Not a Wave 2 concern: the remaining route-local fields in `POST /pilot/validate` and tool-list responses (`requiresConfirmation`, `reasonCodes`, `requiresSupervisorApproval`, preflight booleans) are metadata serialization, not enforcement. Policy decisions now resolve in the runner-owned surface.
- Explicit defer: `tools/registry/INVOKE_CONTRACT.md` is now stale relative to runtime truth. It still advertises manifest version `1.3.0`, tools count `24`, and omits `COUNTY_MISMATCH` from the frozen error-code list. This is classified as frozen-doc drift to reconcile during Phase 1D evidence consolidation, not via casual mid-slice editing.

## Phase 1 Closure Readiness

- Verification wall passed on 2026-03-18:
	- `pnpm run type-check`
	- `node --test os-platform/core/tests/phase83-tools.test.mjs`
	- `node --test os-platform/core/tests/c2-write-lane-governance.test.mjs`
	- `node --test os-platform/core/tests/c3-golden-fixture-contracts.test.mjs`
	- `node --test os-platform/core/tests/d1-trace-evidence-export.test.mjs`
	- `node --test os-platform/core/tests/r1-boot-wiring.test.mjs`
	- `node --test os-platform/core/tests/lane-k-trace-export-endpoint.test.mjs`
	- `node --test os-platform/core/tests/lane-t-export-contract-freeze.test.mjs`
	- `node --test os-platform/core/tests/r1-governance.test.mjs`
	- `node --test os-platform/core/pilot/dev-pilot-runtime.test.mjs`
- Backend truth status: ready for Phase 1D closure review.
- Phase 2 status: not open from this file alone. Phase 2 may begin only after Phase 1D closure formally accepts the fixed-now items and the explicit defer above.

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

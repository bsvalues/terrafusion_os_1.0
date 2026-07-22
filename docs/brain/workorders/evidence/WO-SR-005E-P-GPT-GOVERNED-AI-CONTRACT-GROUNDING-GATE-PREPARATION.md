# WO-SR-005E-P - GPT Governed-AI Contract and Grounding Gate Preparation

## Verdict

`COMPLETE_DECOMPOSITION_REQUIRED_CURRENT_ADAPTER_NOT_PARITY_SAFE`

TerraGPT owns retrieval, grounding, citation, prompt, configuration, conversation, and usage
semantics, but the current RAG surfaces do not provide a county-bound, privacy-safe cross-repository
contract. The smallest coherent candidate is a read-only `gpt.grounded-context@1.0.0` projection.
It must be decomposed before any contract, provider, adapter, or extraction work.

## Exact Audit Basis

| Surface | Exact live evidence | Classification |
| --- | --- | --- |
| GPT authority | `brain/packs/gpt/README.md:5-74` | GPT owns assistance and RAG but is a read-only consumer of suite data; grounding, traceability, PII sanitation, and TerraPilot-mediated actions are mandatory. |
| Retrieval interface | `backend/src/TerraFusion.AI/Interfaces/IRAGService.cs:43-58`, `:124-184` | Search inputs and grounded result details exist, including scores and source metadata, but request/result records carry no county or trace identity. |
| Retrieval implementation | `backend/src/TerraFusion.AI/Services/RAGService.cs:234-327` | Dataset retrieval, embedding search, context assembly, document title/source enrichment, and chunk detail projection are real. |
| County gap | `backend/src/TerraFusion.AI/Services/RAGService.cs:244-260`, `:367-370` | Dataset lookup is by numeric ID without county predicate; no cross-county non-disclosure proof exists for retrieval. |
| PII/logging gap | `backend/src/TerraFusion.AI/Services/RAGService.cs:240-243` | Raw query text is logged. This cannot be represented as compliant PII sanitation or safe contract behavior. |
| Content exposure | `backend/src/TerraFusion.AI/Services/RAGService.cs:274-315`; `IRAGService.cs:150-183` | Results may expose title, source URL, snippet, full chunk text, and scores. Exact citation/privacy rules are not frozen. |
| Dataset API | `backend/src/TerraFusion.API/Controllers/RAGController.cs:34-80`, `:156-246` | Dataset lists fail closed without county claim, but get-by-ID, documents, and chunks do not prove county ownership before return. |
| Anonymous health route | `backend/src/TerraFusion.API/Controllers/GPTController.cs:683-758` | Hard-coded Benton dataset IDs and filesystem fallback are operational compatibility behavior, not a provider-neutral GPT contract. |
| Write-lane guard | `backend/tests/TerraFusion.Unit.Tests/Wave2/GptWriteLaneGuardTests.cs:14-131` | Static constructor proof blocks direct Forge/Dais/Dossier service injection but does not prove retrieval isolation or TerraPilot action mediation. |
| Search-result tests | `backend/src/TerraFusion.AI/Tests/GPTServiceTests.cs:117-148`, `:922-1034` | Shape, snippet truncation, source URL, score, and serialization are tested; county isolation, citation completeness, PII sanitation, and trace emission are not. |
| Frozen contract state | `backend/src/TerraFusion.Abstractions/contracts.freeze.json`, `CONTRACTS.md` | No `gpt.*` group is frozen. |
| Standalone GPT | `bsvalues/terrafusion-gpt` `main` at `10295e9b534cce7ba9d428a91fb966bd58963c77` | Private bootstrap consumes only shared audit capability; no GPT domain contract or adapter exists. |

The sovereign audit is pinned to `80346a945b5a25e0617fe58cf9f4e22b48b24862`. No model,
embedding, provider, county/PACS/SQL, credential, secret, live service, or quarantined source was used.

## Selected Contract Cohort

WO-SR-005E-C should decompose `gpt.grounded-context@1.0.0` as a provider-neutral, read-only retrieval
boundary with:

- mandatory `countyId`, stable dataset identity, sanitized query, result limit, score threshold, and
  trace/correlation identity;
- exact request-to-result county and dataset matching with cross-county non-disclosure;
- stable source/chunk identities, bounded sanitized excerpts, scores, deterministic ordering, and
  citation completeness;
- explicit `grounded`, `no-relevant-context`, and denied/error semantics without invented context;
- no raw embeddings, full text, unrestricted URLs, provider/model identity, prompt templates,
  credentials, token/cost data, conversation history, suite records, or write/tool authority;
- PII sanitation before logging or provider transfer and TerraTrace correlation without transferring
  trace-store ownership.

## Rejected First Cohorts

- Anonymous `rag/health`: Benton-specific IDs, filesystem fallback, and no county identity.
- Dataset CRUD/list entities: provider configuration, descriptions, and incomplete get-by-ID isolation.
- Conversation/message contracts: prompt, response, identity, provider, cost, and persistence risks.
- Tool/action contracts: TerraPilot promotion and write-risk policy remain separate authority gates.

## Existing Proof And Gaps

- Existing proof establishes RAG shape and a static no-direct-suite-service constructor guard.
- It does not establish county-bound retrieval, source authorization, stable citation identity,
  sanitized query logging, deterministic ordering, trace emission, standalone parity, or absence of
  unsupported provider behavior.
- The current source is contract input evidence, not a parity-safe adapter claim.

## Next

`WO-SR-005E-C - GPT Grounded Context Contract Decomposition` is admitted as an R2 docs/evidence-only
slice. It must define exact records, selectors, vocabularies, citation/privacy rules, fixtures,
compatibility, parity gates, and a later implementation allowlist or return `NO_GO`. Provider calls,
contract artifacts, runtime implementation, package/workflow changes, extraction, and cutover remain blocked.

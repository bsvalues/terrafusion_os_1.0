# WO-SR-005E-C - GPT Grounded Context Contract Decomposition

## Verdict

`IMPLEMENTATION_READY_READ_ONLY_WITHOUT_PROVIDER_OR_RUNTIME_ADOPTION`

The smallest safe GPT contract is `gpt.grounded-context@1.0.0`, a provider-neutral, county-scoped,
read-only retrieval projection. It carries bounded citations rather than generated answers or full
documents and grants no provider call, prompt execution, tool action, persistence, or runtime adoption.

## Source Reconciliation

| Surface | Exact evidence | Contract consequence |
| --- | --- | --- |
| Domain ownership | `brain/packs/gpt/README.md:5-74` | GPT owns retrieval/grounding but not suite records or trace storage; PII sanitation and source traceability are mandatory. |
| Retrieval interface | `backend/src/TerraFusion.AI/Interfaces/IRAGService.cs:43-58`, `:124-184` | Scores and chunk/source details exist; county, trace, privacy, and denial semantics must be added at the contract boundary. |
| Retrieval service | `backend/src/TerraFusion.AI/Services/RAGService.cs:234-327` | Search and citation inputs are real, but raw query logging, unscoped dataset lookup, assembled context, full text, and source URLs cannot cross unchanged. |
| County gap | `backend/src/TerraFusion.AI/Services/RAGService.cs:244-260`, `:367-370` | Current lookup is by dataset ID without county predicate; adapter parity remains unproven. |
| API isolation gap | `backend/src/TerraFusion.API/Controllers/RAGController.cs:34-80`, `:156-246` | Dataset listing fails closed without county claim, but single dataset/document/chunk reads lack complete county proof. |
| Existing proof | `backend/src/TerraFusion.AI/Tests/GPTServiceTests.cs:117-148`, `:922-1034`; `backend/tests/TerraFusion.Unit.Tests/Wave2/GptWriteLaneGuardTests.cs:14-131` | Shape and static write-lane separation are proven; county isolation, sanitation, citation completeness, and trace correlation are not. |
| Frozen contracts | `backend/src/TerraFusion.Abstractions/contracts.freeze.json`, `CONTRACTS.md` | No `gpt.*` contract group exists. |
| Standalone GPT | `bsvalues/terrafusion-gpt` `main` at `10295e9b534cce7ba9d428a91fb966bd58963c77` | Bootstrap only; no GPT domain contract or adapter exists. |

The sovereign audit is pinned to `dea2ed12534f5bd39f1d762c120e1157637f82c9`. No model,
embedding, provider, county/PACS/SQL, credential, secret, live service, or quarantined source was used.

## Exact Contract Records

| Record | Required fields | Optional fields |
| --- | --- | --- |
| `GptGroundedContextRequest` | `schemaVersion`, `countyId`, `datasetKey`, `queryText`, `topK`, `scoreThreshold`, `traceId` | none |
| `GptGroundedContextResult` | `schemaVersion`, `countyId`, `datasetKey`, `status`, `citations`, `traceId` | `denialCode` |
| `GptGroundedCitation` | `sourceId`, `chunkId`, `chunkIndex`, `excerpt`, `score` | `sourceTitle` |

Identifiers are non-empty canonical strings. `queryText` must be non-empty, normalized, sanitized
before logging or provider transfer, and no longer than 4096 Unicode scalar values. `topK` is 1
through 20 and `scoreThreshold` is a decimal from 0 through 1. Excerpts are sanitized plain text of
at most 500 Unicode scalar values. Scores are finite decimals from 0 through 1.

Result county, dataset, and trace identity must exactly match the request. Empty citations are valid
only for `NO_RELEVANT_CONTEXT` or `DENIED`; they must never be replaced with fallback or fixture truth.

## Closed Vocabulary And Ordering

- `status`: `GROUNDED`, `NO_RELEVANT_CONTEXT`, `DENIED`.
- `denialCode`: `COUNTY_CONTEXT_MISSING`, `COUNTY_MISMATCH`, `DATASET_NOT_ALLOWED`,
  `QUERY_REJECTED`, `SOURCE_NOT_AUTHORIZED`.
- Unknown values fail closed.
- Citations sort by score descending, then `sourceId` ascending, then `chunkIndex` ascending.
- Duplicate `(sourceId, chunkId)` identities, malformed scores, unstable ordering, and selector or
  trace mismatch fail closed.
- `GROUNDED` requires at least one citation and every returned excerpt must have stable source and
  chunk identity. This contract does not certify a generated answer.

## Exclusions

Exclude raw embeddings, full chunk/document text, unrestricted source URLs, provider/model identity,
system prompts, conversation history, token/cost data, credentials, auth claims, suite records,
generated answers, tool/action authority, write commands, and trace-store mutation. `traceId` is
correlation only. Dataset allowlisting and source authorization remain host responsibilities.

## Compatibility And Fixtures

- Patch changes are documentary only; minor changes may add optional fields without weakening
  selectors, grounding, privacy, ordering, or read-only semantics; all other semantic changes are major.
- Required fixtures: `grounded-two-citations`, `no-relevant-context`, `denied-dataset`,
  `county-mismatch`, `dataset-mismatch`, `trace-mismatch`, `raw-pii-query`, `unknown-status`,
  `citation-without-source`, `duplicate-citation`, `unstable-order`, `full-text-or-provider-leak`.
- Sovereign and standalone verifiers must consume the same hash-pinned corpus and agree on every
  accept/reject result before adapter or extraction work.

## Exact Implementation Slice

`WO-SR-005E-I` may modify only:

- `backend/src/TerraFusion.Abstractions/DTOs/GptGroundedContextDto.cs`
- `backend/src/TerraFusion.Abstractions/contracts/gpt.grounded-context.v1.schema.json`
- `backend/src/TerraFusion.Abstractions/contracts/fixtures/gpt.grounded-context.v1.grounded-two-citations.synthetic.json`
- `backend/src/TerraFusion.Abstractions/contracts/fixtures/gpt.grounded-context.v1.no-relevant-context.synthetic.json`
- `backend/src/TerraFusion.Abstractions/contracts/fixtures/gpt.grounded-context.v1.denied-dataset.synthetic.json`
- `backend/src/TerraFusion.Abstractions/contracts/fixtures/gpt.grounded-context.v1.county-mismatch.synthetic.json`
- `backend/src/TerraFusion.Abstractions/contracts/fixtures/gpt.grounded-context.v1.dataset-mismatch.synthetic.json`
- `backend/src/TerraFusion.Abstractions/contracts/fixtures/gpt.grounded-context.v1.trace-mismatch.synthetic.json`
- `backend/src/TerraFusion.Abstractions/contracts/fixtures/gpt.grounded-context.v1.raw-pii-query.synthetic.json`
- `backend/src/TerraFusion.Abstractions/contracts/fixtures/gpt.grounded-context.v1.unknown-status.synthetic.json`
- `backend/src/TerraFusion.Abstractions/contracts/fixtures/gpt.grounded-context.v1.citation-without-source.synthetic.json`
- `backend/src/TerraFusion.Abstractions/contracts/fixtures/gpt.grounded-context.v1.duplicate-citation.synthetic.json`
- `backend/src/TerraFusion.Abstractions/contracts/fixtures/gpt.grounded-context.v1.unstable-order.synthetic.json`
- `backend/src/TerraFusion.Abstractions/contracts/fixtures/gpt.grounded-context.v1.full-text-or-provider-leak.synthetic.json`
- `backend/src/TerraFusion.Abstractions/contracts.freeze.json`
- `backend/src/TerraFusion.Abstractions/CONTRACTS.md`
- `scripts/contracts/verify-contract-freeze.mjs`
- `scripts/contracts/verify-contract-freeze.test.mjs`
- bounded `docs/brain/workorders/**` evidence and routing files.

Controllers, AI services/entities, provider clients, persistence, product tests, adapters, destination
source, packages, lockfiles, workflows, and runtime consumers remain blocked.

## Validation And Next

Exact source, county/dataset selector, grounding, citation, privacy, ordering, compatibility, and
fixture decomposition: `PASS`. Existing adapter parity: `NOT PROVEN`. Runtime/provider/package/
workflow/deployment/protected-resource changes: `NONE`.

`WO-SR-005E-I - GPT Grounded Context Contract Implementation and Freeze` is implementation-ready
but remains proposed until explicit authority covers its exact non-core source paths. No other R2
five-suite preparation/decomposition node remains admitted.

# WO-SR-005E-A2 - GPT Grounded Source Identity Projection Design

## Verdict

`IMPLEMENTATION_READY_AS_PURE_UNWIRED_SOURCE_PROJECTION`

No existing committed GPT/RAG result can be relabeled into `gpt.grounded-context@1.0.0` without
inventing identity or authorization provenance. A build-fresh, provider-neutral, pure projection
can establish the missing pre-adapter boundary if its identity and authorization inputs are
explicit and host-proven. The projection remains unwired and cannot claim current runtime
integration.

## Inspection Basis

| Surface | Exact revision | Result |
| --- | --- | --- |
| Sovereign base | `2f4f27a7d6720326f2f4afb2e87f2e10e7833deb` | Frozen contract, canonical RAG source, and A2 routing inspected |
| GPT contract DTO | SHA-256 `a4b28ea6e0aa4001cec938104127a46492c6d68bff18014154ca0e81035e023e` | County, dataset, trace, status, denial, and citation identity fixed |
| GPT contract schema | SHA-256 `da9a923e2ef92f63a728edcb19d726a9a29ceb39203464dbe6ee426e94a69019` | Closed status/denial vocabularies and bounded citation shape fixed |
| Current public RAG result | `backend/src/TerraFusion.AI/Interfaces/IRAGService.cs:124-183` | Aggregate output loses source-to-chunk, county, dataset, trace, and authorization identity |
| Current pre-projection result | `backend/src/TerraFusion.AI/Interfaces/IRAGEmbeddingRepository.cs:78-94` | Numeric embedding/document/dataset/chunk identity survives, but contract identity and authorization do not |
| Current retrieval path | `backend/src/TerraFusion.AI/Services/RAGService.cs:234-327` | Numeric dataset lookup, raw-query logging, full-text projection, and identity loss remain |
| Current dataset entity | `backend/src/TerraFusion.AI/Entities/GPTConfiguration.cs:81-131` | Numeric ID and nullable numeric county ID have no committed mapping to opaque contract keys |
| Current in-memory search | `backend/src/TerraFusion.AI/Repositories/InMemoryRAGEmbeddingRepository.cs:87-128` | Score ordering exists, but tie ordering, contract identity, and authorization are absent |
| Current consumer | `backend/src/TerraFusion.AI/Services/GPTOrchestrationService.cs:113-150` | Consumes aggregate context and detached identifiers before provider invocation |
| Existing focused tests | `backend/src/TerraFusion.AI/Tests/GPTServiceTests.cs:902-1041` | Shape and truncation are covered; provenance, authorization, denial, and stable tie ordering are not |

No provider, model, embedding generation, database, county/PACS/SQL, credential, secret, network,
live service, standalone destination product source, or quarantined source was accessed.

## Existing-Boundary Decision

The existing boundaries are rejected as the new canonical projection input:

- `RAGSearchResult` cannot associate a citation with its document identity.
- `RAGEmbeddingSearchResult.DatasetId` and `RAGDataset.CountyId` are numeric persistence identities,
  not the frozen opaque `datasetKey` and `countyId`.
- `RAGDataset.Name`, `DocumentTitle`, and `SourceUrl` are display or transport data, not stable
  contract identity.
- list position cannot reconstruct the detached source-to-chunk relationship;
- an empty result cannot distinguish authorized no-context from denied access;
- current search ordering has no deterministic tie-breaker; and
- raw query and full chunk text are outside the bounded contract result.

No adapter may infer or synthesize the missing values from those fields.

## Proposed Pure Projection Boundary

### Purpose

`WO-SR-005E-E0` creates an internal source-identity validation boundary. It does not retrieve
content, authorize a user, call a provider, query persistence, generate embeddings, map to the
frozen public DTO, or register a runtime consumer.

### Exact future API shape

```text
GptGroundedSourceIdentityProjection.Create(
  GptGroundedSourceIdentityRequest request,
  GptGroundedSourceAuthorization authorization,
  IReadOnlyList<GptGroundedSourceCandidate> candidates)
  -> GptGroundedSourceIdentityResult
```

Required records:

- request: canonical `countyId`, exact frozen `datasetKey`, and `traceId`;
- authorization: `ALLOWED` or `DENIED`, with the frozen denial code when denied;
- candidate: stable `sourceId`, stable `chunkId`, non-negative `chunkIndex`, bounded sanitized
  `excerpt`, finite score in `[0,1]`, and optional bounded `sourceTitle`; and
- result: the same county, dataset, trace, authorization/status identity plus canonical candidates.

The projection input is an assertion boundary, not proof that the current runtime already supplies
these values. Any future consumer must separately prove how the host obtained and authorized each
identity.

### Deterministic status rules

| Authorization and candidates | Projection status | Required behavior |
| --- | --- | --- |
| `DENIED`, no candidates | `DENIED` | Preserve one frozen denial code |
| `ALLOWED`, no candidates | `NO_RELEVANT_CONTEXT` | No denial code and no citations |
| `ALLOWED`, one or more valid candidates | `GROUNDED` | Canonically ordered candidates |
| `DENIED`, any candidate | invalid | Fail closed |
| unknown authorization or denial | invalid | Fail closed |

### Canonical ordering and uniqueness

Candidates are ordered by:

1. score descending;
2. `sourceId` ordinal ascending;
3. `chunkIndex` ascending; and
4. `chunkId` ordinal ascending.

The projection rejects duplicate `(sourceId, chunkId)` pairs. It never trusts caller ordering and
never resolves equal-score ties from list position.

### Fail-closed invariants

E0 tests must reject:

- missing or whitespace county, dataset, trace, source, chunk, or excerpt identity;
- unknown authorization or denial vocabulary;
- denial without a code, allowed output with a denial code, or denied output with candidates;
- negative chunk indexes;
- non-finite, negative, or greater-than-one scores;
- excerpts longer than 500 characters or source titles that exceed the bounded design;
- duplicate source/chunk identity;
- raw query, full text, source URL, provider, model, embedding, prompt, token, credential, or
  persistence fields;
- caller order that is not normalized to the canonical tie-break; and
- any attempt to derive opaque keys from numeric IDs or display names.

## Exact E0 Allowlist

Implementation authority, if granted, is limited to:

- `backend/src/TerraFusion.AI/Models/GptGroundedSourceIdentityProjection.cs`;
- `backend/tests/TerraFusion.Unit.Tests/Gpt/GptGroundedSourceIdentityProjectionTests.cs`;
- `docs/brain/workorders/active/WO-SR-005E-E0-gpt-grounded-source-identity-projection-foundation.md`;
- `docs/brain/workorders/evidence/WO-SR-005E-E0-GPT-GROUNDED-SOURCE-IDENTITY-PROJECTION-FOUNDATION.md`;
- `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`;
- `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md`;
- `docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md`;
- `docs/brain/workorders/programs/five-suite-federated-repository-buildout.md`;
- `docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md`; and
- `docs/brain/workorders/registry/work-order-registry.seed.json`.

The source file contains only immutable records, closed internal vocabularies, and pure validation
and ordering logic. The test file uses synthetic values only.

## E0 Validation Contract

- focused projection tests cover every accepted state and fail-closed invariant;
- repeated and shuffled inputs yield byte-for-byte equivalent normalized values;
- reflection or source inspection proves no provider, model, embedding, database, HTTP, DI,
  controller, service, runtime-consumer, logging, or clock dependency;
- canonical backend build remains zero-warning;
- frozen GPT contract hashes remain unchanged;
- work-order query and tooling tests pass;
- exact changed paths match the allowlist; and
- `git diff --check` passes.

## Provenance, Rollback, And No-Claims

The sovereign base and frozen contract remain authoritative. E0 is built fresh from this design and
copies no product source. Rollback removes the unwired projection, its focused tests, and its
governance records.

E0 would prove only that explicit source identity and authorization assertions can be normalized
and validated deterministically. It would not prove:

- that current RAG runtime produces those assertions;
- that current authorization or county context is parity-safe;
- provider, model, embedding, persistence, or endpoint integration;
- adapter or standalone contract parity;
- extraction, publication, deployment, cutover, or source retirement; or
- access to county, PACS, SQL, credentials, secrets, live services, or production.

## Subsequent Sequence

After E0 merges and is verified, a later R2 reconciliation may determine whether a pure E1 adapter
from the E0 result to `gpt.grounded-context@1.0.0` is bounded and whether standalone E2 parity is
ready. E0 grants no automatic E1, E2, runtime, or extraction authority.

## A2 Validation

- source inspection: read-only;
- changed scope: `docs/brain/workorders/**` only;
- backend/runtime/test/destination/workflow changes: none;
- protected-resource access: none;
- `git diff --check`;
- `node docs/brain/workorders/tools/wo-query.mjs --json`;
- `node --test docs/brain/workorders/tools/*.test.mjs`.

## Required Next Decision

The bounded R3 decision is whether to authorize `WO-SR-005E-E0` under the exact allowlist and
denials above. No broader GPT implementation authority is requested.

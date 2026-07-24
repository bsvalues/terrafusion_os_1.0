# WO-SR-005E-A - GPT Grounded Context Adapter and Standalone Parity Preparation

## Verdict

`DECOMPOSITION_REQUIRED_SOURCE_IDENTITY_PROJECTION`

The frozen `gpt.grounded-context@1.0.0` contract is internally coherent, but no committed
provider-neutral GPT/RAG result currently carries enough identity and authorization truth to serve
as a parity-safe adapter input. An R3 adapter envelope would be premature.

## Inspection Basis

| Surface | Exact revision | Result |
| --- | --- | --- |
| Sovereign base | `d285bf009e0919aa2d3ddc73c1ccdb499f11fdc1` | Frozen GPT contract and canonical RAG source present |
| GPT contract freeze | PR #1352 / merge `e57b1eca9c3291d10203efaa1fd586bcbce13f94` | DTO, schema, 12 fixtures, and freeze hashes committed |
| Standalone GPT | `10295e9b534cce7ba9d428a91fb966bd58963c77` | Private bootstrap only; no GPT product source or domain contract materialized |
| Standalone checks | Live branch protection | `suite-ci`, `contract-compat`, `governance-gate`; strict and admin-enforced |

No model, embedding generation, provider, database, county/PACS/SQL, credential, secret, network,
live service, or quarantined source was accessed.

## Frozen Contract Truth

- DTO SHA-256:
  `a4b28ea6e0aa4001cec938104127a46492c6d68bff18014154ca0e81035e023e`.
- Schema SHA-256:
  `da9a923e2ef92f63a728edcb19d726a9a29ceb39203464dbe6ee426e94a69019`.
- The corpus has three accepted exchanges and nine fail-closed fixtures.
- Required identity is `countyId`, `datasetKey`, and `traceId`.
- Every grounded citation requires stable `sourceId`, `chunkId`, `chunkIndex`, bounded sanitized
  `excerpt`, and score.
- `GROUNDED`, `NO_RELEVANT_CONTEXT`, and `DENIED` are the only result states.
- Generated answers, full text, source URLs, provider/model identity, embeddings, prompts,
  credentials, tool authority, and trace-store mutation are excluded.

## Canonical Source Findings

| Proof | Live source | Finding |
| --- | --- | --- |
| Public search result | `backend/src/TerraFusion.AI/Interfaces/IRAGService.cs:124-183` | `RAGSearchResult` carries aggregate context, a detached document-ID list, and chunk details; each detail lacks document/source, dataset, county, trace, and authorization identity. |
| Pre-projection result | `backend/src/TerraFusion.AI/Interfaces/IRAGEmbeddingRepository.cs:78-94` | `RAGEmbeddingSearchResult` retains embedding, document, dataset, and chunk-index identity, but has no county key, contract dataset key, trace identity, authorization state, or denial result. |
| Retrieval implementation | `backend/src/TerraFusion.AI/Services/RAGService.cs:234-327` | Lookup is by numeric dataset ID, raw query text is logged, full chunk text is populated, and document IDs are detached from chunk details during projection. |
| Dataset identity | `backend/src/TerraFusion.AI/Entities/GPTConfiguration.cs:81-131` | Dataset has numeric ID and nullable numeric county ID; no committed mapping proves the contract's opaque county and dataset keys. |
| Embedding projection | `backend/src/TerraFusion.AI/Repositories/InMemoryRAGEmbeddingRepository.cs:87-128` | Search is dataset-filtered and deterministic by score before `Take`, but source authorization and contract identity are not represented. |
| Existing tests | `backend/src/TerraFusion.AI/Tests/GPTServiceTests.cs:910-1041` | Shape, truncation, population, and serialization are tested; county/dataset/trace binding, source authorization, denial semantics, PII rejection, and stable tie ordering are not. |

## Rejected Mappings

- `DocumentTitle` is display text, not stable source identity.
- `SourceUrl` is optional, unrestricted, and contract-excluded.
- `RAGSearchResult.DocumentIds` is distinct aggregate data and cannot be positionally joined to
  `ChunkDetails`.
- `ChunkId` alone cannot identify its source document.
- Numeric `RAGDataset.CountyId` cannot be relabeled as the frozen opaque county key without a
  committed identity mapping.
- Dataset name or numeric ID cannot be assumed to equal the frozen `datasetKey`.
- Empty search results do not encode authorization denial or a denial code.
- Raw query logging and full-text projection cannot be claimed as privacy-safe contract behavior.

Any adapter based on those assumptions could emit a valid-looking result with false county,
dataset, source, or authorization provenance. The preparation therefore fails closed.

## Exact Missing Proof

WO-SR-005E-A2 must select or define one provider-neutral, already-materialized source projection
that preserves:

1. canonical county key and exact frozen dataset key;
2. trace identity and a host-proven authorization outcome;
3. stable source, chunk, and source-to-chunk association before `RAGSearchResult` drops it;
4. bounded sanitized excerpt and finite score without full text, URL, provider, model, or embedding;
5. explicit grounded, empty, and denied semantics with a closed denial vocabulary; and
6. deterministic ordering and duplicate rejection before any contract mapping.

The design must identify the exact committed source point, exact future source and test allowlist,
and whether a pure unwired adapter can be tested without changing runtime behavior. If that proof
cannot be established without provider, persistence, county data, or runtime access, A2 must return
`NO_GO`.

## Deferred Standalone Scope

The later standalone parity slice may use only:

- `canon/CONTRACT_DEPENDENCY.md`;
- `contract-compat/gpt.grounded-context.v1/**`;
- a dependency-free GPT grounded-context verifier and tests;
- the existing `contract-compat` job in `.github/workflows/suite-ci.yml`; and
- GPT-local Work Order and evidence records.

That scope remains proposed. It must not be activated until a sovereign source projection and pure
adapter boundary are proven.

## Provenance, Rollback, And Safety

This Work Order changes governance/evidence only. Rollback is a revert of its records and routing.
It copies no source and changes no contract, adapter, test, provider, model, embedding, runtime,
package, workflow, deployment, protected data, or standalone product behavior.

Extraction, provider calls, runtime adoption, package publication, credentials, secrets,
county/PACS/SQL access, production, cutover, and source retirement remain unauthorized.

## Validation

- source and destination inspection: read-only;
- runtime/backend/test/destination/workflow changes: none;
- protected-resource access: none;
- `git diff --check`;
- `node docs/brain/workorders/tools/wo-query.mjs --json`;
- work-order tooling tests.

## Next

`WO-SR-005E-A2 - GPT Grounded Source Identity Projection Design` is the next R2
docs/evidence-only node. No R3 implementation envelope is proposed by this Work Order.

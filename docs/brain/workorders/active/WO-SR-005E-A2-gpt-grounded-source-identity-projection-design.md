# WO-SR-005E-A2 - GPT Grounded Source Identity Projection Design

| Field | Value |
| --- | --- |
| Status | COMPLETE |
| Program | Five-Suite Federated Repository Buildout |
| Risk | R2 read-only design and evidence |
| Dependency | WO-SR-005E-A complete |
| Verdict | IMPLEMENTATION_READY_AS_PURE_UNWIRED_SOURCE_PROJECTION |
| Proposed next | WO-SR-005E-E0 - GPT Grounded Source Identity Projection Foundation |

## Objective

Identify an existing committed provider-neutral source boundary or define the smallest build-fresh
projection that can preserve the identity and authorization truth required by
`gpt.grounded-context@1.0.0`.

## Result

No existing GPT/RAG result is parity-safe. `RAGEmbeddingSearchResult` retains numeric embedding,
document, dataset, and chunk identity, but it does not carry the canonical county key, frozen
dataset key, trace identity, authorization outcome, or denial identity. The later
`RAGSearchResult` drops the source-to-chunk association as well.

A bounded pure projection is implementation-ready as `WO-SR-005E-E0`. It must accept explicit,
host-proven county, dataset, trace, authorization, and source/chunk identity as inputs, validate and
order them deterministically, and emit no runtime, provider, persistence, or network behavior. It
must not infer contract identity from numeric IDs, names, titles, URLs, list position, or caller
convention.

E0 is proposed R3 work and is not activated by this R2 design. Adapter implementation, standalone
parity, extraction, provider calls, runtime adoption, packages, workflows, deployment, and
protected-resource access remain unauthorized.

## Stop Type

`GPT_SOURCE_IDENTITY_PROJECTION_IMPLEMENTATION_AUTHORITY_REQUIRED`

# WO-SR-005E-E3 - GPT Bounded Extraction Scope Audit Evidence

## Result

**`PASS_NO_EXECUTABLE_DIRECT_EXTRACTION_BUILD_FRESH_FOUNDATION_CANDIDATE`.** The sovereign E0
projection is pure and provider-neutral, but no committed source is eligible for direct extraction
as an executable capability in `bsvalues/terrafusion-gpt`. The current destination has a Node
contract-compat harness and no `.NET` project or compile gate. The next implementation candidate is
a separately authorized R3 build-fresh, offline, unwired Node projection. No implementation
authority is granted here.

## Exact Anchors

| Field | Value |
| --- | --- |
| Sovereign base audited | `24dcc84ada58347156bcabcdb8228c30f13ac856` |
| Frozen contract | `gpt.grounded-context@1.0.0` |
| Frozen files | 14/14 SHA-256 values match `backend/src/TerraFusion.Abstractions/contracts.freeze.json` |
| E0 projection source | `backend/src/TerraFusion.AI/Models/GptGroundedSourceIdentityProjection.cs` at SHA-256 `ff26dfe6c5a12ae9da892c4dad4c8e6c25ac03ec08d9f1d105db257ddb5ba7ed` |
| Standalone repository | `D:\terrafusion-gpt`, private `github.com/bsvalues/terrafusion-gpt` |
| Standalone `main` | `49cd4adca8d353de45147082cf9946f18ead0c77` |
| Existing standalone proof | GPT PR #1 plus PR #2 Unicode remediation; 13 mirrored pins and 13 verifier tests |

## Frozen Contract Classification

The DTO and schema are sovereign-owned `CONTRACT_ARTIFACT` files. The twelve
`gpt.grounded-context.v1.*.synthetic.json` files are the frozen `SYNTHETIC_FIXTURE` corpus. All 14
current SHA-256 values match `contracts.freeze.json`. The standalone suite consumes the schema and
fixtures by hash; this audit transfers neither DTO nor implementation ownership.

The contract is a county/dataset/trace-scoped grounded result with closed authorization, status, and
denial vocabularies; stable citation ordering by score descending, source ID ascending, chunk index
ascending, then chunk ID ascending; unique source/chunk pairs; bounded excerpts and titles; and
explicit raw-query, full-text, provider, model, embedding, prompt, token, credential, and persistence
exclusions.

## Candidate Inventory

| Candidate | Current dependencies and ownership | Classification |
| --- | --- | --- |
| `GptGroundedSourceIdentityProjection.cs` | Pure BCL-only C# records and static projection; deterministic, provider-neutral, unwired; sovereign namespace and `.NET` build ownership | `PURE_SOVEREIGN_SOURCE`, but not executable by direct copy into the current Node-only destination |
| `GptGroundedContextAdapter.cs` | Pure and unwired, but imports the sovereign projection records and frozen DTO assembly | `PROHIBITED_SOVEREIGN` for direct copy |
| E0 and E1 focused tests | xUnit and FluentAssertions in the sovereign unit-test project | `PROHIBITED_SOVEREIGN` for direct copy |
| `RAGService`, embedding services/repositories, and semantic-kernel client | Providers, embeddings, repositories, HTTP, configuration, or persistence | `PROHIBITED_SOVEREIGN` |
| RAG/GPT controllers and fleet services | ASP.NET, DI, authorization, service orchestration, persistence, or runtime telemetry | `PROHIBITED_SOVEREIGN` |
| Frozen schema and twelve fixtures | Already sovereign-owned and mirrored under hash pins | `CONTRACT_ARTIFACT` / `SYNTHETIC_FIXTURE` |
| Standalone verifier and tests | Node-based contract validation only; no product projection module | `STANDALONE_PARITY_EVIDENCE` |

**Provably provider-neutral source candidates: 1. Executable direct-copy candidates in the current
destination build surface: 0.**

## Why E0 Is Not a Direct Extraction Slice

E0 deliberately proves the correct pure boundary, but direct extraction must deliver a validated
standalone capability rather than an inert file. `terrafusion-gpt` has no `.csproj`, solution,
`.NET` package boundary, or `.NET` CI command. Adding those surfaces would expand package and
workflow scope and duplicate sovereign implementation ownership. Copying the C# file without them
would not compile, execute, or participate in parity validation.

The safe reuse unit is therefore the frozen behavior and synthetic corpus. A later standalone
implementation should be built fresh in the destination's existing Node execution model.

## Ownership and Provenance Decision

- `terrafusion_os_1.0` retains the C# E0/E1 source, contract DTO, runtime authorization, retrieval,
  providers/models/embeddings, persistence, HTTP/API, county context, and deployment.
- `terrafusion-gpt` may later own a fresh provider-neutral Node projection over explicit host-proven
  assertions implementing only the frozen contract semantics.
- No source or Git history is copied. Provenance is build-fresh behavior derived from the frozen
  contract, hash-pinned corpus, E0/E1 tests, and E2 standalone parity.

## Proposed Later F1 Allowlist

If separately authorized, `WO-SR-005E-F1` may be limited in `bsvalues/terrafusion-gpt` to:

- `src/grounded-context/project-grounded-source-identity.mjs`
- `test/project-grounded-source-identity.test.mjs`
- `scripts/verify-gpt-grounded-context.mjs` only to consume the product projection
- `scripts/verify-gpt-grounded-context.test.mjs` only for integration assertions
- existing `contract-compat/gpt.grounded-context.v1/**` only as read-only hash-pinned input
- `operations/work-orders/WO-SR-005E-F1-gpt-standalone-grounded-context-foundation.md`
- `operations/evidence/WO-SR-005E-F1-GPT-STANDALONE-GROUNDED-CONTEXT-FOUNDATION.md`

The module must remain offline and unwired; accept only explicit host-proven county, dataset, trace,
authorization, source, and chunk identity; normalize deterministic order; fail closed on unknown
vocabulary, duplicate identities, invalid bounds, and prohibited fields; and expose no retrieval,
provider, model, embedding, persistence, HTTP, logging, or runtime consumer.

This is a proposed allowlist, not active implementation authority. No package, lockfile, workflow,
contract pin, provider, model, embedding, persistence, runtime, county/PACS/SQL, credential,
deployment, production, cutover, or source-retirement change is included.

## Validation Evidence

| Gate | Result |
| --- | --- |
| Current-base source/import inspection | PASS |
| E0 purity and reference inspection | PASS - only its focused tests reference the projection directly; E1 consumes the result type |
| Frozen contract hash check | PASS - 14/14 |
| Canonical standalone identity | PASS - `D:\terrafusion-gpt` matches the registered remote and live `main` |
| Standalone execution-model inspection | PASS - Node verifier only; no `.NET` project or compile gate |
| Executable direct-copy candidates | PASS - 0 eligible |
| Runtime/backend/frontend/contract/destination changes | NONE |
| Protected-resource access | NONE |
| `git diff --check` | PASS |
| `node docs/brain/workorders/tools/wo-query.mjs --json` | PASS - Dossier A4 is the sole eligible next node |
| Work Order query tests | PASS - 12/12 |
| Wave planner tests | PASS - 29/29 |
| Contract freeze verifier | PASS - 6 groups, 52 frozen; GPT 14/14 pins match |
| Contract freeze tests | PASS - 20/20 |

## Rollback and Non-Claims

Rollback is a repo-local revert of this governance/evidence packet. No source, contract, runtime, or
external repository content changed. This audit does not authorize F1, extraction, runtime or
provider adoption, models, embeddings, persistence, publication, deployment, cutover, or duplicate
retirement.

## Next

Portfolio reconciliation continues with `WO-SR-005D-A4`, the dependency-cleared R2 Dossier
path-canon registration required before any later Dossier F1 dispatch. GPT F1 remains a separately
gated R3 build-fresh candidate.

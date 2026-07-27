# WO-SR-005E-E3 - GPT Bounded Extraction Scope Audit Evidence

## Result

**`PASS_NO_EXECUTABLE_DIRECT_EXTRACTION_WITH_UNRATIFIED_DESTINATION_F1`.** The sovereign E0
projection is pure and provider-neutral, but no committed source is eligible for direct extraction
as an executable capability in `bsvalues/terrafusion-gpt`. The current destination has a Node
contract-compat harness and no `.NET` project or compile gate.

Exact-head assurance discovered that GPT PR #3 merged a build-fresh Node foundation concurrently
with this audit. No active owner decision, issue, or sovereign authority record grants GPT F1; the
recorded E1/E2 envelope was consumed and explicitly excluded F1. The merged code is evidence of an
unratified destination mutation, not accepted TerraFusion capability. No retain, revert, wiring, or
successor authority is inferred.

## Exact Anchors

| Field | Value |
| --- | --- |
| Sovereign base audited | `24dcc84ada58347156bcabcdb8228c30f13ac856` |
| Frozen contract | `gpt.grounded-context@1.0.0` |
| Frozen files | 14/14 SHA-256 values match `backend/src/TerraFusion.Abstractions/contracts.freeze.json` |
| E0 projection source | `backend/src/TerraFusion.AI/Models/GptGroundedSourceIdentityProjection.cs` at SHA-256 `ff26dfe6c5a12ae9da892c4dad4c8e6c25ac03ec08d9f1d105db257ddb5ba7ed` |
| Standalone repository | `D:\terrafusion-gpt`, private `github.com/bsvalues/terrafusion-gpt` |
| Standalone audit-start anchor | `49cd4adca8d353de45147082cf9946f18ead0c77` |
| Standalone live `main` at assurance | `614f62933e6f8cdb4fa8a76eac6305c0e3134070` |
| Existing governed standalone proof | GPT PR #1 plus PR #2 Unicode remediation; 13 mirrored pins and 13 verifier tests |
| Concurrent destination change | GPT PR #3, head `31eba7e9426f86739d31cece6c0e981bd448d7d2`; F1-like foundation merged without matching canonical authority |

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
| Standalone verifier and tests at audit start | Node-based contract validation only; no product projection module | `STANDALONE_PARITY_EVIDENCE` |
| GPT PR #3 product module | Build-fresh Node projection and verifier integration; exact five-file scope, but no matching active F1 authority record | `UNRATIFIED_DESTINATION_MUTATION` |

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

## Intended F1 Boundary and Live Divergence

The audit-derived later F1 boundary would have been limited in `bsvalues/terrafusion-gpt` to:

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

GPT PR #3 used a narrower five-file variant of this shape and merged during the audit. That does not
retroactively create authority. No package, lockfile, workflow,
contract pin, provider, model, embedding, persistence, runtime, county/PACS/SQL, credential,
deployment, production, cutover, or source-retirement change was observed in PR #3. Acceptance or
rollback requires one later exact owner disposition; unrelated R2 reconciliation may continue.

## Validation Evidence

| Gate | Result |
| --- | --- |
| Current-base source/import inspection | PASS |
| E0 purity and reference inspection | PASS - only its focused tests reference the projection directly; E1 consumes the result type |
| Frozen contract hash check | PASS - 14/14 |
| Canonical standalone identity | PASS - `D:\terrafusion-gpt` matches the registered remote |
| Standalone execution-model inspection | PASS - no `.NET` project or compile gate |
| Executable direct-copy candidates | PASS - 0 eligible |
| Live destination drift check | INCIDENT - GPT PR #3 merged unratified F1-like source at `614f6293` |
| Runtime/backend/frontend/contract/destination changes | NONE |
| Protected-resource access | NONE |
| `git diff --check` | PASS |
| `node docs/brain/workorders/tools/wo-query.mjs --json` | PASS - Dossier A4 is the sole eligible next node |
| Work Order query tests | PASS - 12/12 |
| Wave planner tests | PASS - 29/29 |
| Contract freeze verifier | PASS - 6 groups, 52 frozen; GPT 14/14 pins match |
| Contract freeze tests | PASS - 20/20 |

## Rollback and Non-Claims

Rollback of this packet is a repo-local revert. The audit itself changed no source, contract,
runtime, or external repository content. GPT PR #3 rollback is not authorized here. This audit does
not authorize F1 acceptance, extraction, runtime or
provider adoption, models, embeddings, persistence, publication, deployment, cutover, or duplicate
retirement.

## Next

Portfolio reconciliation continues with `WO-SR-005D-A4`, the dependency-cleared R2 Dossier
path-canon registration required before any later Dossier F1 dispatch. GPT F1 remains a separately
gated owner disposition because an unratified implementation now exists in the destination.

## Final F1 Disposition

The E3 audit verdict remains historically correct: no executable direct-copy slice existed, and GPT
PR #3 was unratified when discovered. The later bounded decision
`OWNER-SR-005E-F1-RETAIN-RATIFY-20260727` authorized validation and remediation of that exact
five-file destination foundation without authorizing extraction or runtime adoption.

GPT PR #4 at head `d2f34ce75549bb606539d44bb114d0d5aed4fa1e` restored the verifier's
`validateJsonSchema` compatibility export, added focused regression proof, passed 17 direct module
tests and 13 verifier tests, and merged as `e0856e46807844a95d57aaef49d3350c1bc38a33`.
All 13 frozen artifact hashes, three accepted fixtures, and nine fail-closed fixtures passed. Both
original PR #3 findings are resolved.

The final classification is `RETAINED_PURE_UNWIRED_F1`. Original GPT PR #3 remains recorded as
historically unratified; corrective PR #4 and this sovereign closeout establish the governed
retention. The bounded authority is consumed on closeout. No runtime consumer, provider, model,
embedding, persistence, extraction, publication, workflow, deployment, production, protected
resource, cutover, or successor authority follows.

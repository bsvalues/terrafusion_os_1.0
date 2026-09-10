# gpt.grounded-answer@1.0.0 exact EO specification

Owner EO: EO-TF-GPT-GROUNDED-RUNTIME-001; mechanical OS alias WO-EO-TF-GPT-GROUNDED-RUNTIME-001. Authority: contract-authority.md and coordinator reservations.md dated 2026-09-07. This approved specification is not protected-source evidence. Carry verbatim into the reserved OS active Work Order when os-gpt is ready. No frozen contract changes or new mirrored schema.

## Exchange

Closed root object: required `context`, `result` only. `context` is the existing gpt.grounded-context@1.0.0 `{request,result}` exchange validated by the existing canonical suite module against its frozen schema. The new validator calls that module, never copies its rules. No raw retrieval transport extension.

Closed answer `result` required fields: `schemaVersion` (exact `1.0.0`), `countyId`, `datasetKey`, `traceId`, `status`, `citations`. Optional fields: `answer`, `provider`, `model`, `usage`, `failureCode`. Identifiers countyId/datasetKey/traceId and provider/model are nonempty strings of at most 128 Unicode code points, with no leading/trailing whitespace or control characters. Result scope identities equal context request and result exactly.

`status`: `ANSWERED`, `NO_RELEVANT_CONTEXT`, `DENIED`, `PROVIDER_UNAVAILABLE`, `PROVIDER_ERROR` only.

- `ANSWERED`: context result status must be `GROUNDED`; required answer/provider/model. Answer is a non-whitespace string, at most 16000 Unicode code points; tab/newline/carriage return allowed, other C0/C1 controls forbidden. At least one citation; no failureCode. Provider/model identify actual generation response, with OS checking returned model against configured admitted model. No claim that pure validation can prove generation occurred.
- `NO_RELEVANT_CONTEXT`: context result status must be exactly `NO_RELEVANT_CONTEXT`; empty citations; answer/provider/model/usage/failureCode absent.
- `DENIED`: context result status must be exactly `DENIED`; empty citations; answer/provider/model/usage absent; required failureCode equal context result denialCode.
- `PROVIDER_UNAVAILABLE`: context result status must be `GROUNDED`; empty citations; answer/provider/model/usage absent; required failureCode in `UNCONFIGURED`, `UNREACHABLE`, `TIMEOUT`, `CANCELLED`, `RUNTIME_UNAVAILABLE`.
- `PROVIDER_ERROR`: context result status must be `GROUNDED`; empty citations; answer/provider/model/usage absent; required failureCode in `HTTP_ERROR`, `INVALID_RESPONSE`, `MODEL_MISMATCH`, `RESPONSE_TOO_LARGE`, `ANSWER_REJECTED`.

Each citation is closed `{sourceId,chunkId}` with required bounded identifiers. Its exact pair must exist in the supplied context citations. Duplicate pairs and invented source/chunk combinations are rejected. Count <= context request topK and <=20. Caller ordering is not authoritative: canonical serialization sorts answer citations by sourceId then chunkId (ordinal comparison); existing context citation ordering is unchanged.

Optional `usage` for ANSWERED only: closed object with any nonempty subset of `promptTokens`, `completionTokens`, `totalTokens`, each a nonnegative JavaScript safe integer. Omission means unknown, never zero. If all three present, totalTokens equals promptTokens + completionTokens and sum is safe. Cost is not part of this exchange and cannot be invented from token estimates.

## Pure API and failure contract

`projectGptGroundedAnswer(contextSchema, exchange)` returns `{accepted, violations, normalizedExchangeJson}`. Accepted exchanges have empty violations and deterministic canonical JSON (stable object keys, canonical answer citation order). Rejected exchanges have typed `{class,message}` violations and normalizedExchangeJson=null; messages do not echo source/answer values. Inputs are unchanged. Operates on materialized JSON data; no fs/network/provider/persistence/date/random access. Cyclic/non-JSON/sparse/nonfinite/unsupported prototype input is rejected rather than throwing/serializing lossy values. Maximum exchange materialization size is 1MiB UTF-8 and nesting depth 16, enforced before downstream validation. Host enforces serialized input/output bounds as well.

Failure classes: `INVALID_EXCHANGE`, `CONTEXT_REJECTED`, `SCHEMA`, `COUNTY_MISMATCH`, `DATASET_MISMATCH`, `TRACE_MISMATCH`, `STATUS_CONTEXT_MISMATCH`, `DUPLICATE_CITATION`, `INVENTED_CITATION`, `CITATION_LIMIT`, `USAGE_MISMATCH`. Context errors wrap existing violation class in a generic safe message. No semantic truth check, provider attestation, independent authorization, or cross-suite write authority is claimed.

## Artifact and protection

Canonical new module imports the existing context module as a runtime dependency. New artifact inventory covers exact bytes/length/hash of answer module, unchanged context module, and frozen context schema. No source commit is guessed; coordinator uses actual protected suite commit plus measured blobs when staging. Existing context manifest/corpus stays byte-identical. New manifest is a candidate integrity inventory, not a self-authenticating provenance grant. Runtime pins protected source identity independently and rejects mutable inventory tampering.

OS does only authenticated admission, existing RAG retrieval, actual admitted local provider invocation, bounded exchange construction, exact suite execution, persistence, and UI. Real failure drills alter owned product configuration, not shared inference. Actual browser journey and repetition after protected merge are completion requirements.

## Exact suite source reservation

The initial gpt-report.md path list is retained here under reservations.md:

- src/grounded-answer/project-gpt-grounded-answer.mjs
- test/project-gpt-grounded-answer.test.mjs
- scripts/verify-gpt-grounded-answer.mjs
- scripts/verify-gpt-grounded-answer.test.mjs
- canon/GPT_GROUNDED_ANSWER_EXECUTION_MANIFEST.json
- canon/CONTRACT_DEPENDENCY.md
- operations/work-orders/EO-TF-GPT-GROUNDED-RUNTIME-001.md
- operations/evidence/EO-TF-GPT-GROUNDED-RUNTIME-001.md
- README.md
- .github/workflows/suite-ci.yml
- .gitattributes

Optional contract mirrors remain held. Existing frozen files are dependencies only. Coordinator owns independent assurance, protected GitHub lifecycle and actual protected suite identity. This suite PR precedes the single OS adoption PR; no extra contract PR is required for this new capability. Portable inventory binds this whole specification document plus all three runtime dependency files. No self-referential commit or protected OS source hash is asserted. Final artifact trust comes from actual protected suite commit and independently measured exact blobs during OS adoption. Implementation and suite tests alone are not product completion.

---

## OS adoption companion — WO-EO-TF-GPT-GROUNDED-RUNTIME-001

The preceding specification is copied from the exact suite EO at protected commit `afbcba88c7606e78d3705010b39bcb0527270134` (PR7). Its original complete 6700-byte LF document remains a separately staged artifact with SHA256 `880f16bf0722732c46cf2d2dc9d4dbf8cdcb29dbb22cbc11a15700c91d38bd82`; this OS-only appendix is not part of that specification identity. Protected tree `534bfc422b2f0706680a9c788296dd79bf7a7618` equals independently reviewed `e49df05988b57eb4414afa679dbb9a1a67ae0bda` tree. Suite62 tests and independent exact-head review passed; those are not provider/browser acceptance.

### Additive sovereign transport authority

Under the owner's EO and coordinator reservation ruling, this companion records `gpt.grounded-answer@1.0.0` as the new versioned exchange. No old frozen context corpus or contract version changes. The new code-pinned OS slot is `.terrafusion/runtime/gpt/grounded-answer`; the stager verifies the actual protected suite commit and five exact artifacts (answer, transitive context module, frozen schema, exact specification, portable inventory). Inventory is candidate content integrity, not self-authenticating protected provenance. `adoption.json` binds repository, protected sourceCommit, contract and specificationSha256. No fabricated sovereign source hash or second contract PR is used. Shared freeze/transport registry changes remain coordinator-serialized.

The process host verifies all artifact hashes and snapshots every byte before execution. The answer module's one fixed relative import is linked to the verified context snapshot in memory; no mutable filesystem import is executed. Both pre-retrieval frozen context validation and postgeneration answer judgment use these exact protected bytes. Missing/tampered artifacts or invalid selection fail closed. Default `GptGroundedAnswerRuntime:Mode=Disabled`; explicit `LocalExact` is Development-only with timeout1..30s.

### OS local provider and persistence boundary

`GptLocalInference` requires explicit Enabled, Endpoint, Model, EmbeddingModel, EmbeddingDimensions and TimeoutSeconds. No ambient provider selection, remote factory, fallback, authentication secret, redirect, proxy or retry is allowed. The adapter admits only Development HTTP loopback/private IPv4 literals, avoiding DNS resolution, with bounded request/response and time limits. Configuration alone proves neither reachability nor actual model use. Existing local Ollama installation/model manifests are possible access paths only; no server start/download/global configuration change is authorized by their discovery.

Existing dataset metadata must already match `ollama`, the admitted embedding model, and its dimension; mismatched remote embeddings are rejected without relabeling, mixing, regenerating or persisting vectors. Embedding batch/ingestion methods are not admitted by this retrieval-only adapter. Actual answer provider/model must come from the response and match the configured model; unknown usage/cost remains unknown.

Authenticated county/user/conversation/configuration/dataset scope is checked before retrieval and rechecked after generation before attaching writes. The protected normalized exchange is stored in existing GPTMessage.FunctionResult with CID, exact source/chunk citations, returned usage and typed status. GPTAudit links the persisted message and actual admitted retrieval evidence. User/assistant/audit changes use one SaveChanges call. No migrations, new dataset persistence, training, remote calls or synthetic answer fallback are introduced. Legacy numeric defaults are not evidence of measured usage or free cost.

### Current execution boundary

Observed focused OS RED: missing new answer/provider/host capability types after existing API/dependencies built. Pinned pnpm9 frozen-lockfile install subsequently succeeded. Source implementation follows that RED. The granted focused run then exposed a Core entity-alias compile collision; correcting only the two owned aliases yielded46 passed,0 failed,0 skipped with no-restore, m1, UseSharedCompilation=false and nodeReuse=false. The API and canonical Unit.Tests compiled. The focused UI file observed six missing-feature RED cases then GREEN, and an additional failure-CID RED case then7/7GREEN with maxWorkers1/minWorkers1/retry0. These tests include synthetic provider responses and protected-module fixtures, not real-provider acceptance. Heavy slot was released immediately after verification; no server was started.

Granted lightweight staging subsequently created the actual ignored default slot from protected afbcba88 Git blobs. Nine checks passed: idempotence with unchanged bytes/timestamps, five independent artifact tamper refusals without overwrite followed by exact restoration, invalid receipt refusal/restoration, wrong-origin rejection retaining the previous good slot, and final exact slot re-admission. This is previous-good retention/rollback safety, not an interrupted-process crash recovery claim. No API or provider was started and no suite/foreign source was mutated.

Broader scoped regressions, frontend typecheck and real browser evidence remain pending. Heavy builds, solution-loading normal commit hooks and runtime require coordinator slots; shared Program.cs and schema files remain held. Coordinator owns independent review and protected OS delivery. Completion still requires an actual local provider-backed bounded source answer in the real product, persisted reload/trace, scope denial/no-context/provider failure journeys, and critical browser repetition after protected merge. Existing Ollama installation and model manifests are not an admission record; no reachable admitted provider is yet proven.

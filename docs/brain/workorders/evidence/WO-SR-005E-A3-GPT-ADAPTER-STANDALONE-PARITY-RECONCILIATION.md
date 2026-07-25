# WO-SR-005E-A3 - GPT Adapter and Standalone Parity Reconciliation

## Verdict

`IMPLEMENTATION_READY_AS_TWO_REPOSITORY_SEQUENCE`

The completed E0 projection supplies a safe, already-materialized input for a pure unwired adapter
to `gpt.grounded-context@1.0.0`. The frozen contract can then be proven independently in
`bsvalues/terrafusion-gpt` through a hash-pinned synthetic corpus. Neither slice requires retrieval,
authorization, provider, model, embedding, persistence, network, runtime, extraction, publication,
or protected-resource access.

The proposed sequence is:

1. `WO-SR-005E-E1` - map the validated E0 result to the frozen public result DTO in a pure unwired
   sovereign adapter.
2. `WO-SR-005E-E2` - materialize and verify the frozen schema and twelve synthetic exchanges in the
   standalone GPT repository, then reconcile sovereign routing and consume the envelope.

This packet proposes that bounded R3 sequence. It does not activate E1 or E2.

## Inspection Basis

| Surface | Exact revision | Result |
| --- | --- | --- |
| Sovereign base | `1120c6d86f08f2ed4dcf0d82e60e99761256567b` | E0 projection, tests, frozen DTO/schema/corpus, and canonical authority record inspected |
| E0 reviewed head | `4dc3275023297c1358fa4c981b32224856eb76c9` | PR #1364 passed required checks with zero unresolved threads |
| E0 projection | `backend/src/TerraFusion.AI/Models/GptGroundedSourceIdentityProjection.cs` | Pure result contains canonical county, dataset, trace, authorization, status, denial, and ordered candidates |
| Frozen public DTO | SHA-256 `a4b28ea6e0aa4001cec938104127a46492c6d68bff18014154ca0e81035e023e` | Exact result and citation fields are compatible with E0 |
| Frozen schema | SHA-256 `da9a923e2ef92f63a728edcb19d726a9a29ceb39203464dbe6ee426e94a69019` | Closed state/denial vocabularies, bounded citations, ordering, and privacy exclusions fixed |
| Standalone GPT | `10295e9b534cce7ba9d428a91fb966bd58963c77` | Private bootstrap only; no product or contract-compat source exists |
| Standalone required checks | `.github/workflows/suite-ci.yml` | `suite-ci`, `contract-compat`, and `governance-gate` exist; E2 may narrow only the existing `contract-compat` job |

The GPT domain pack, standalone `AGENTS.md`, contract dependency, intake rules, provenance ledger,
workflow, and bootstrap inventory were inspected read-only. No provider, model, embedding, database,
HTTP, network, county/PACS/SQL, credential, secret, live service, production resource, or
quarantined source was accessed.

## Frozen Contract Truth

| Artifact | SHA-256 |
| --- | --- |
| `GptGroundedContextDto.cs` | `a4b28ea6e0aa4001cec938104127a46492c6d68bff18014154ca0e81035e023e` |
| `gpt.grounded-context.v1.schema.json` | `da9a923e2ef92f63a728edcb19d726a9a29ceb39203464dbe6ee426e94a69019` |
| `citation-without-source.synthetic.json` | `3bdad4afa519f4869a74dd0b98577a1a06b7f82eaf7f246deedc2e3bc4123aaa` |
| `county-mismatch.synthetic.json` | `04a70106108a1e8770b475ee093fb5e24ecff6f7a467134fa3ce242b18f3645b` |
| `dataset-mismatch.synthetic.json` | `103f884cd8349372d0f79ccd4278ee00e970a0ddf2004695c22dbc135e70253c` |
| `denied-dataset.synthetic.json` | `eef7a134bd6e354145c4fef8a882bf179472132737ee52066c118bd275508a60` |
| `duplicate-citation.synthetic.json` | `f68693c30607a804f6ec75dddb6dd7e68d1ec9cd0790cb428f3dbabac1757bf0` |
| `full-text-or-provider-leak.synthetic.json` | `c341b4522f238f2ff6ec7f6699481c92938e360cd4333ddf9d019f07efe4bbfc` |
| `grounded-two-citations.synthetic.json` | `30f0f8d82604ae5caa1fb3008022dc36f27d350d19e87d0e26693ff209b62ed4` |
| `no-relevant-context.synthetic.json` | `02554973cc1d81ae7226a9c2c8f92b8d369e9e64c71b6e049deedc343a08231d` |
| `raw-pii-query.synthetic.json` | `bf5f664253ca1c89b308816934b2434be22edbe018d80106b7b3b61bc2854ce6` |
| `trace-mismatch.synthetic.json` | `2176ddda72986420d337cdaa8b7b26be8f5ec3ad2d27007fb485f0b425273774` |
| `unknown-status.synthetic.json` | `1b326816948cc025c9c4ecd2ea72f2449254696bdff9c8033f8b3b1726c3f426` |
| `unstable-order.synthetic.json` | `1f0f386cc708e37c485c4cc047588f0327234e3f75c654ca87358c305e1bd9ae` |

The corpus contains three accepted exchanges and nine fail-closed cases. Sovereign and standalone
verifiers must agree on each exact artifact and semantic result.

## Exact E1 Adapter Boundary

Proposed API:

```text
GptGroundedContextAdapter.Map(
  GptGroundedSourceIdentityResult source)
  -> GptGroundedContextResult
```

The adapter is a pure static transformation in `TerraFusion.API.Adapters`. It receives only a
completed E0 result. It does not accept a raw query, retrieve content, perform authorization, call a
provider, query persistence, or register a consumer.

| Frozen field | E0 input / rule | Fail-closed rule |
| --- | --- | --- |
| `schemaVersion` | literal `1.0.0` | never accept or infer another version |
| `countyId` | `source.CountyId` | preserve exact canonical E0 identity |
| `datasetKey` | `source.DatasetKey` | preserve exact canonical E0 identity |
| `traceId` | `source.TraceId` | preserve exact canonical E0 identity |
| `status` | `source.Status` | accept only `GROUNDED`, `NO_RELEVANT_CONTEXT`, or `DENIED` |
| `denialCode` | `source.DenialCode` | preserve only for `DENIED`; reject every other combination |
| `citations` | one per ordered E0 candidate | preserve E0 ordering; never re-rank |
| citation identity | source ID, chunk ID, chunk index | preserve exact values |
| citation text | bounded sanitized excerpt and optional title | preserve exact values |
| citation score | checked deterministic `double` to `decimal` conversion | reject non-finite/out-of-range values or conversion failure |

Although E0 construction already enforces these invariants, the public adapter must fail closed if a
synthetic or future caller constructs an invalid result record directly. E1 therefore revalidates
state/citation cardinality, denial combinations, uniqueness, canonical ordering, identities, text
bounds, score range, and the absence of unsupported state. It derives no identity and does not use
request query text.

### E1 exact sovereign allowlist

- `.governance/owner-decisions.json`, limited to the future E1/E2 envelope record;
- `backend/src/TerraFusion.API/Adapters/GptGroundedContextAdapter.cs`;
- `backend/tests/TerraFusion.Unit.Tests/Gpt/GptGroundedContextAdapterTests.cs`;
- `docs/brain/workorders/active/WO-SR-005E-E1-gpt-grounded-context-sovereign-adapter.md`;
- `docs/brain/workorders/evidence/WO-SR-005E-E1-GPT-GROUNDED-CONTEXT-SOVEREIGN-ADAPTER.md`;
- `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`;
- `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md`;
- `docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md`;
- `docs/brain/workorders/programs/five-suite-federated-repository-buildout.md`;
- `docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md`;
- `docs/brain/workorders/goal-loop/GOAL_COMMANDS.md`; and
- `docs/brain/workorders/registry/work-order-registry.seed.json`.

### E1 required proof

- accepted grounded, no-context, and denied E0 results map field-for-field;
- all five frozen denial codes remain exact;
- invalid state/citation cardinality, denial combinations, identities, indexes, scores, text,
  duplicates, and ordering fail closed;
- shuffled or noncanonical candidates are rejected rather than silently reordered by the adapter;
- score conversion is deterministic and remains within `[0,1]`;
- no raw query, full text, URL, provider, model, embedding, prompt, token, credential, persistence,
  HTTP, logging, DI, controller, service, endpoint, or runtime-consumer surface exists;
- focused adapter tests and the canonical backend build pass with zero warnings; and
- frozen contract hashes remain unchanged.

## Exact E2 Standalone Boundary

After E1 merges and post-merge verification succeeds, E2 may operate only in
`bsvalues/terrafusion-gpt` to prove synthetic compatibility. The standalone remains subordinate to
the sovereign contract and receives no product source.

### E2 exact destination allowlist

- `.github/workflows/suite-ci.yml`, limited to the existing `contract-compat` job;
- `canon/CONTRACT_DEPENDENCY.md`;
- `contract-compat/gpt.grounded-context.v1/manifest.json`;
- `contract-compat/gpt.grounded-context.v1/gpt.grounded-context.v1.schema.json`;
- the twelve exact frozen fixtures under
  `contract-compat/gpt.grounded-context.v1/fixtures/`;
- `scripts/verify-gpt-grounded-context.mjs`;
- `scripts/verify-gpt-grounded-context.test.mjs`;
- `operations/work-orders/WO-SR-005E-E2-gpt-standalone-synthetic-contract-parity.md`; and
- `operations/evidence/WO-SR-005E-E2-GPT-STANDALONE-SYNTHETIC-CONTRACT-PARITY.md`.

The future envelope must also permit a terminal sovereign closeout limited to the canonical
owner-decision record and the nine A3/E1 routing and evidence surfaces. That closeout records the
exact standalone PR/head/merge, consumes the envelope, and admits no successor implementation.

### E2 required proof

- all fourteen frozen source artifacts match the manifest: DTO, schema, and twelve fixtures;
- all three accepted fixtures pass and all nine fail-closed fixtures reject for the same semantic
  reason class;
- county, dataset, trace, status, denial, citation identity, score, ordering, uniqueness, and privacy
  semantics match the sovereign contract;
- raw PII query, mismatched identity, unknown status, missing citation source, duplicate citation,
  unstable ordering, and full-text/provider leakage fail closed;
- no provider, model, embedding, database, county dataset, secret, network, runtime, or product
  dependency exists; and
- `suite-ci`, `contract-compat`, and `governance-gate` pass.

## Provenance, Rollback, And No-Claims

- The sovereign contract and E0 merge remain authoritative.
- E1 is built fresh and copies no product source. Rollback removes the unwired adapter and tests.
- E2 mirrors only hash-pinned contract artifacts and built-fresh verifier/evidence files. Rollback
  removes those files and restores the bootstrap contract declaration and constrained workflow job.
- Neither slice changes current RAG retrieval, authorization, providers, persistence, endpoints,
  runtime behavior, source ownership, package publication, deployment, or cutover.
- Passing E1/E2 would prove adapter and standalone synthetic parity only. It would not prove current
  runtime production of E0 assertions or authorize a consumer.

## Proposed Bounded R3 Envelope

The proposed envelope is sequential, exact-scope, and revocable:

1. Canonically record the E1/E2 grant in `.governance/owner-decisions.json`.
2. Implement and merge E1 only within its exact sovereign allowlist.
3. After verified E1 merge, implement and merge E2 only within its exact standalone allowlist.
4. Reconcile the exact standalone merge in the sovereign governance surfaces and consume the
   envelope.
5. Codex may perform isolated worktree creation, implementation, validation, PR operation,
   in-scope remediation, exact-head assurance, governed Mode B merge, post-merge verification, and
   E1-to-E2 continuation without per-step owner relay.

The envelope suspends on scope expansion, required-check failure or bypass, unresolved review,
assurance failure, contract hash drift, protected-resource access, provider/runtime/persistence
work, source extraction, workflow changes outside the constrained job, publication, deployment,
cutover, or conflicting authority.

## A3 Validation

- sovereign source, contract, tests, and standalone repository inspection: read-only;
- changed scope: the nine exact A3 docs/governance files only;
- backend/runtime/test/destination/workflow changes: none;
- protected-resource access: none;
- `git diff --check`: required;
- `node docs/brain/workorders/tools/wo-query.mjs --json`: required; and
- `node --test docs/brain/workorders/tools/*.test.mjs`: required.

## Next

`WO-SR-005E-E1 - GPT Grounded Context Sovereign Adapter` is proposed and blocked pending one exact
bounded E1/E2 R3 envelope. E2 remains dependency-blocked on E1. No runtime, provider, persistence,
extraction, package, publication, deployment, production, cutover, or source-retirement authority
is implied.

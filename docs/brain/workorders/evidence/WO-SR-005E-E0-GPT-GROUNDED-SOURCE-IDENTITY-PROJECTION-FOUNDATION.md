# WO-SR-005E-E0 - GPT Grounded Source Identity Projection Foundation

## Result

`PASS` - the exact A2 projection boundary is implemented as build-fresh, pure, provider-neutral,
and unwired source. It preserves only explicit host-proven assertions and derives no opaque identity
from numeric IDs, names, titles, URLs, or list position.

## Authority And Scope

- authority anchor: WO-SR-005E-A2;
- anchor merge: `80c51579458b96d956c20f2e0b81311fd1b68e16`;
- authority: exact owner-granted E0 R3 envelope;
- changed source:
  `backend/src/TerraFusion.AI/Models/GptGroundedSourceIdentityProjection.cs`;
- changed tests:
  `backend/tests/TerraFusion.Unit.Tests/Gpt/GptGroundedSourceIdentityProjectionTests.cs`;
- governance changes: the nine exact E0 Work Order, evidence, queue, register, playbook, routing, and
  registry files in the recorded allowlist.

No adapter, service, controller, DI, provider, model, embedding, persistence, database, HTTP,
network, logger, runtime consumer, destination repository, workflow, deployment, county/PACS/SQL,
credential, secret, package, publication, extraction, cutover, or source-retirement surface changed.

## Projection Contract

```text
GptGroundedSourceIdentityProjection.Create(
  request,
  authorization,
  candidates
) -> result
```

The typed boundary accepts only:

- request: explicit `countyId`, `datasetKey`, and `traceId`;
- authorization: exact `ALLOWED` or `DENIED`, with one frozen denial code when denied; and
- candidates: stable `sourceId`, stable `chunkId`, non-negative `chunkIndex`, bounded sanitized
  `excerpt`, finite score in `[0,1]`, and optional bounded `sourceTitle`.

It returns the same identity and authorization assertions, a derived closed status, and canonically
ordered candidates.

## Deterministic Rules

| Input | Result |
| --- | --- |
| `DENIED` with one frozen denial code and no candidates | `DENIED` |
| `ALLOWED` with no candidates and no denial code | `NO_RELEVANT_CONTEXT` |
| `ALLOWED` with valid candidates and no denial code | `GROUNDED` |
| denied with candidates | rejected |
| unknown authorization or denial vocabulary | rejected |

Candidate order is score descending, source ID ordinal ascending, chunk index ascending, and chunk
ID ordinal ascending. Duplicate `(sourceId, chunkId)` pairs are rejected.

## Fail-Closed Proof

The focused suite covers:

- all three accepted states;
- every frozen denial code;
- unknown or mis-cased authorization and denial values;
- allowed-with-denial and denied-with-candidates contradictions;
- null inputs and null candidate rows;
- missing, whitespace, non-canonical, and control-character identity or text;
- negative chunk indexes;
- non-finite and out-of-range scores;
- exact score bounds;
- excerpt and title bounds;
- duplicate source/chunk pairs;
- canonical ordering and shuffled-input equivalence; and
- reflection proof that raw query, full text, URL, provider, model, embedding, prompt, token,
  credential, persistence, database, and HTTP fields are absent.

Focused result: 52 passed, 0 failed, 0 skipped.

## Frozen Contract Proof

| Artifact | SHA-256 |
| --- | --- |
| `backend/src/TerraFusion.Abstractions/DTOs/GptGroundedContextDto.cs` | `a4b28ea6e0aa4001cec938104127a46492c6d68bff18014154ca0e81035e023e` |
| `backend/src/TerraFusion.Abstractions/contracts/gpt.grounded-context.v1.schema.json` | `da9a923e2ef92f63a728edcb19d726a9a29ceb39203464dbe6ee426e94a69019` |

These hashes match A2 exactly. E0 does not map to or mutate the frozen public contract.

## Validation

- focused projection tests: PASS, 52/52;
- canonical backend build: PASS, 0 warnings and 0 errors;
- frozen GPT contract hashes: unchanged;
- Work Order query: PASS;
- Work Order tooling tests: PASS;
- exact changed paths: the eleven-file allowlist only;
- `git diff --check`: PASS;
- remote required checks: PASS;
- substantive unresolved review threads: 0.

## Rollback

Remove the pure projection and focused test files, revert the nine governance/evidence changes, and
rerun the same validation. No runtime consumer or persistent state requires rollback.

## No Claims And Next Step

E0 proves only deterministic validation and ordering of explicit assertions. It does not prove
runtime assertion provenance, authorization integration, adapter parity, standalone parity,
provider behavior, persistence, extraction, publication, deployment, cutover, or protected-resource
access.

The only admitted successor is R2 WO-SR-005E-A3 reconciliation. E1 and E2 are not activated or
authorized by this result.

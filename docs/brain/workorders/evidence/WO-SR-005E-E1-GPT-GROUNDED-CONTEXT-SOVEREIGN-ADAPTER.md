# WO-SR-005E-E1 - GPT Grounded Context Sovereign Adapter

## Result

`PASS` - the frozen public GPT result is produced from only a completed E0 source-identity result
through a pure unwired adapter. The adapter preserves explicit host-proven assertions, derives no
identity, consumes no raw query, and rejects invalid or noncanonical synthetic inputs.

## Authority And Scope

- authority: `OWNER-SR-005E-E1-E2-R3-GPT-GROUNDED-CONTEXT-20260725`;
- anchor: `f996ca5cf30d23e998bcbcd940eddfbf53c7af43`;
- source:
  `backend/src/TerraFusion.API/Adapters/GptGroundedContextAdapter.cs`;
- tests:
  `backend/tests/TerraFusion.Unit.Tests/Gpt/GptGroundedContextAdapterTests.cs`;
- governance: the canonical decision plus the nine exact E1 Work Order, evidence, queue, register,
  playbook, routing, and registry files in the recorded allowlist.

No E0 source, frozen DTO/schema/fixture, controller, service, DI, provider, model, embedding,
persistence, database, HTTP, network, logger, runtime consumer, standalone repository, package,
publication, deployment, county/PACS/SQL, credential, secret, cutover, or source-retirement surface
changed.

## Adapter Contract

```text
GptGroundedContextAdapter.Map(
  GptGroundedSourceIdentityResult source)
  -> GptGroundedContextResult
```

The adapter emits literal schema version `1.0.0`, preserves exact county/dataset/trace/status/denial
identity, preserves already-canonical citation order, and converts each finite score in `[0,1]`
through a checked `double` to `decimal` conversion.

## Fail-Closed Proof

The focused suite covers:

- `GROUNDED`, `NO_RELEVANT_CONTEXT`, and `DENIED`;
- all five frozen denial codes;
- unknown authorization, status, and denial vocabulary;
- state/citation cardinality and denial contradictions;
- null results, collections, and candidate rows;
- missing, whitespace, noncanonical, and control-character identities and text;
- negative indexes, non-finite/out-of-range scores, and exact score bounds;
- excerpt and title bounds;
- duplicate source/chunk pairs; and
- score and tie-order violations rejected without reranking.

Focused result: 36 passed, 0 failed, 0 skipped.

## Frozen Contract Proof

| Artifact | SHA-256 |
| --- | --- |
| `backend/src/TerraFusion.Abstractions/DTOs/GptGroundedContextDto.cs` | `a4b28ea6e0aa4001cec938104127a46492c6d68bff18014154ca0e81035e023e` |
| `backend/src/TerraFusion.Abstractions/contracts/gpt.grounded-context.v1.schema.json` | `da9a923e2ef92f63a728edcb19d726a9a29ceb39203464dbe6ee426e94a69019` |

Both hashes remain unchanged from A3.

## Validation

- restore/build/test artifacts redirected process-locally to `D:\tf-build\sr-005e-e1`;
- canonical backend build: PASS, 0 warnings and 0 errors;
- focused adapter tests: PASS, 36/36;
- frozen contract hashes: PASS;
- Work Order query: PASS; E1 complete and E2 correctly remains mechanically protected at R3;
- Work Order tooling tests: PASS, 46/46;
- frozen bootstrap: PASS; `package.json` and `pnpm-lock.yaml` hashes unchanged;
- exact changed paths: PASS, the twelve-file E1 allowlist only;
- Prettier for JSON/Markdown and `git diff --check`: PASS;
- independent read-only assurance: PASS after chunk-index and chunk-ID ordering coverage remediation;
- remote required checks and exact-head assurance: pending PR.

## Rollback

Remove the pure adapter and focused tests, revert the exact E1 governance/evidence transition, and
rerun the same validation. No runtime consumer or persistent state requires rollback.

## No Claims And Next

E1 proves only pure sovereign result adaptation. It does not prove runtime production of E0
assertions, standalone parity, provider behavior, persistence, extraction, publication, deployment,
cutover, or protected-resource access. After E1 merge, E2 may proceed under the same bounded
sequential envelope.

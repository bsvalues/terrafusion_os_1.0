# WO-SR-005C-F1 - Dais Standalone Appeal-Workflow Foundation Evidence

## Decision

`OWNER-SR-005C-F1-RETAIN-REMEDIATE-20260727` authorized exact validation and correction of the
five-file Dais F1 foundation. The original merge remains historical evidence, not retroactive
authority. Corrective PR #4 is the ratified capability head.

| Evidence | Value |
| --- | --- |
| Original PR | `bsvalues/terrafusion-dais#3` |
| Original head | `be1a7676fc79f13d7cd3a3516cafa0ad7f3d624f` |
| Original merge | `4ed92e35d3debc4a43b127087703a1e2bc731203` |
| Historical classification | Originally unratified |
| Corrective PR | `bsvalues/terrafusion-dais#4` |
| Corrective head | `93ee267f3258e8989a5acf27fc40c5bb0d24f695` |
| Corrective merge / Dais `origin/main` | `29a34b0feeab32984a4dedf1af853239993b4a26` |
| Final classification | `RETAINED_PURE_UNWIRED_F1` |

## Corrective Proof

- Frozen corpus remains exactly 10 hash-pinned artifacts: one schema, three accepted fixtures, and
  six fail-closed fixtures.
- Direct module tests pass 17/17.
- Calendar-invalid months, days, and leap days fail closed.
- Valid leap days and known RFC 3339 UTC leap seconds pass; arbitrary second `60` values fail.
- `filedAt <= hearingAt`, `filedAt <= decisionAt`, and `hearingAt <= decisionAt` are enforced.
- Arbitrary fractional precision is ordered deterministically.
- Inputs are not mutated.
- Remote `suite-ci`, `contract-compat`, `governance-gate`, and CodeRabbit checks passed.
- Independent exact-head assurance passed at `93ee267f3258e8989a5acf27fc40c5bb0d24f695`.

The Windows shared Git configuration materializes LF contract artifacts as CRLF. Local validation
therefore proved hashes against byte-exact Git blobs without changing the corpus; remote Linux
checkout validation passed the normal hash gate.

## Provenance And Non-Claims

The module is built fresh against sovereign-owned `dais.appeal-workflow@1.0.0`. It copies no DTO
source and imports no Git history. It remains pure and unwired. This closeout does not authorize
runtime adoption, DI, controllers, services, endpoints, providers, persistence, databases, contract
mutation, extraction, publication, workflows, deployment, production, county, PACS, SQL,
credentials, secrets, cutover, or source retirement.

## Rollback

Full F1 removal is repo-local and revert-only: revert corrective merge
`29a34b0feeab32984a4dedf1af853239993b4a26`, then historical merge
`4ed92e35d3debc4a43b127087703a1e2bc731203`. Reverting only the corrective merge restores the known
timestamp defect and is not a safe terminal state. Sovereign closeout rollback is a separate revert
of its merge and changes no suite runtime or protected resource.

## Result

`DAIS_F1_RETAINED_PURE_UNWIRED_AUTHORITY_CONSUMED`

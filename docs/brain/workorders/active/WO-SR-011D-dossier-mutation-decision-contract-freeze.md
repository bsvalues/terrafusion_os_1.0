# WO-SR-011D - Dossier Mutation Decision Contract Freeze

| Field | Value |
| --- | --- |
| Status | COMPLETE - contract frozen on protected main |
| Program | Five-Suite Federated Repository Buildout |
| Goal | `GOAL-FIVE-SUITE-FEDERATED-REPOSITORIES` |
| Risk | R3 bounded shared-contract addition |
| Authority | `OWNER-FIVE-SUITE-FEDERATED-COMPLETION-20260826` |
| Contract | `dossier.mutation-decision@1.0.0` |
| Terminal condition | `DOSSIER_MUTATION_DECISION_CONTRACT_FROZEN` |

## Objective

Freeze the provider-neutral county/parcel-scoped boundary through which Dossier owns deterministic
record and custody decisions for note creation, document registration/status transitions, evidence
registration with genesis custody, custody append/integrity transitions, and packet composition
from an explicit template plus current document snapshot.

## Exact scope

1. `backend/src/TerraFusion.Abstractions/DTOs/DossierMutationDecisionDto.cs`
2. `backend/src/TerraFusion.Abstractions/contracts/dossier.mutation-decision.v1.schema.json`
3. `backend/src/TerraFusion.Abstractions/contracts/fixtures/dossier.mutation-decision.v1.*.synthetic.json`
4. `backend/src/TerraFusion.Abstractions/contracts.freeze.json`
5. `backend/src/TerraFusion.Abstractions/CONTRACTS.md`
6. `scripts/contracts/verify-contract-freeze.test.mjs`
7. this Work Order, evidence, queue, program record, and registry

## Frozen semantics

- creates begin at optimistic version zero and accepted mutations emit version one;
- document registration derives `entersCustodyChain` from the exact current closed classification:
  deed, mortgage, lien, easement, plat, survey, tax record, appeal, appraisal, inspection report,
  comparable analysis, income analysis, and exemption enter custody; photo, permit,
  correspondence, sketch, other, and unknown types do not;
- document status permits only `active -> sealed|archived` and `sealed -> archived`;
- evidence registration emits `pending` integrity and one `created` genesis event;
- custody append accepts only the existing six actions, requires the exact current chain head, and
  maps `verified|hash-verified` to verified and `disputed` to disputed while preserving integrity
  for transfer, seal, and review;
- packet selection ignores archived documents, selects the newest matching current document with
  document-ID tie-breaking, preserves template order, and derives completeness deterministically;
- every result echoes exact command/county/parcel/trace identity and is either accepted with an
  exact mutation and no violations or rejected with typed violations and no mutation.
- mutable document/evidence snapshots carry the exact target identity as well as county/parcel
  scope, preventing a same-parcel object from satisfying another object's optimistic decision.

## Sovereign boundary and denials

The OS supplies authenticated actor/county/parcel/PII assertions, existence-query results,
allocated IDs, UTC effective timestamps, optimistic versions, current state, and all SHA-256 inputs.
The OS remains responsible for authentication/authorization, lookup, hashing, transactions,
persistence, TerraTrace/audit, HTTP/status mapping, and error transport. This child performs no
runtime adoption, suite copy, source retirement, entity/schema/migration change, live data access,
SQL, credential change, deployment, production action, or custody mutation. Fabricated notice,
appeal, and memo handler-alignment endpoints are explicitly outside this contract.

## Required proof

- DTO, schema, and every synthetic fixture are frozen by exact SHA-256;
- all six accepted operations exactly match deterministic decision semantics;
- custody-entering, non-custody, and unknown/default document classifications match current source,
  and any host attempt to override that suite-owned judgment fails schema;
- host assertion, optimistic conflict, illegal transition, hash-chain conflict, document scope,
  duplicate template, result identity, and cross-lane cases fail closed;
- complete freeze verification, C# contract build, governance JSON parse, independent review,
  required protected checks, exact-head merge, and protected-main verification pass.

## Rollback and continuation

Rollback is the single-commit revert/removal of this additive, unwired contract group; there is no
runtime or stored county state to restore. PR #1475 merged as protected OS main
`7cb96bf2ea5efea7caccae6d6e8c9f81f672412e` with tree
`62b20eac67690c5bd3fa486316bdfe0d46cf0bda`; all later suite publication, staging,
runtime adoption, and duplicate-retirement successors completed.

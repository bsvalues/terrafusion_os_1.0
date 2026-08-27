# WO-SR-010C - Dais Appeal Mutation Contract Freeze

| Field | Value |
| --- | --- |
| Status | ACTIVE - contract implementation and focused synthetic proof pass |
| Program | Five-Suite Federated Repository Buildout |
| Goal | `GOAL-FIVE-SUITE-FEDERATED-REPOSITORIES` |
| Risk | R3 bounded shared-contract addition |
| Authority | `OWNER-FIVE-SUITE-FEDERATED-COMPLETION-20260826` |
| Contract | `dais.appeal-mutation@1.0.0` |
| Terminal condition | `DAIS_APPEAL_MUTATION_CONTRACT_FROZEN` |

## Objective

Freeze the smallest governed boundary that lets Dais own appeal-creation defaults and lifecycle-
transition judgment. The contract carries command identity, county identity, effective time, the
minimal lifecycle snapshot, and typed accepted or rejected decisions. It deliberately excludes
authorization, persistence, audit, transport, identity allocation, PII, monetary values, and notes.

## Exact scope

1. `backend/src/TerraFusion.Abstractions/DTOs/DaisAppealMutationDto.cs`
2. `backend/src/TerraFusion.Abstractions/contracts/dais.appeal-mutation.v1.schema.json`
3. `backend/src/TerraFusion.Abstractions/contracts/fixtures/dais.appeal-mutation.v1.*.synthetic.json`
4. `backend/src/TerraFusion.Abstractions/contracts.freeze.json`
5. `backend/src/TerraFusion.Abstractions/CONTRACTS.md`
6. `scripts/contracts/verify-contract-freeze.test.mjs`
7. this Work Order and its evidence record
8. the Five-Suite program queue, program record, and registry

## Required proof

- exact schema and DTO identities are hash-pinned in the sovereign freeze;
- accepted creation defaults and allowed lifecycle transitions are deterministic;
- invalid ground, tax year, status, transition, and lifecycle ordering return typed rejections;
- county mismatch, PII, monetary values, and cross-lane fields fail closed;
- current and result identity is exact, and decision evaluation does not mutate input;
- the full contract freeze, C# build, JSON parse, governance parse, and diff checks pass;
- protected checks, exact-head merge, and protected-main verification pass.

## Ownership boundary and denials

Dais owns only the pure mutation decision. The OS retains authentication and authorization, county
context enforcement, persistence, transactions, audit, HTTP, entity identity, concurrency, PII,
monetary values, notes, and error transport. This child performs no runtime adoption, suite copy,
source retirement, database/schema/migration mutation, live-data access, deployment, or package
publication.

## Continuation

After protected-main verification, copy the exact frozen schema and fixtures into Dais with their
sovereign identities, implement the pure suite module, then wire the OS service through the
governed process boundary and retire only the duplicated defaults and transition graph.

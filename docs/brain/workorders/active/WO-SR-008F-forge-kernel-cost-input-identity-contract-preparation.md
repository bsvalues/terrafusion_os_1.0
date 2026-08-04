# WO-SR-008F - Forge Kernel Cost Input and Identity Contract Preparation

## Status

`IN PROGRESS - AUDIT COMPLETE / CLOSEOUT MERGE PENDING`

## Program

Five-Suite Federated Repository Buildout

## Goal and loop

- Goal: `GOAL-FIVE-SUITE-FEDERATED-REPOSITORIES`
- Loop: `LOOP-FIVE-SUITE-FEDERATED-REPOSITORIES`

## Risk and mode

- Risk: `R2`
- Mode: read-only design, evidence, and exact-scope preparation
- Dependency: WO-SR-008E merged as PR #1400 and received post-merge verification
- Authority: Issue #1396 plus `OWNER-TF-STANDING-OPERATOR-AUTHORITY`

## Purpose

Define the exact county-bound input, response, failure, trace, cancellation, and process-host
contract required before any Property Workbench Forge cost consumer can invoke the canonical Forge
valuation kernel. Return one bounded implementation verdict without changing product, runtime,
tests, Forge, or configuration.

## Read-only inspection scope

1. Current Workbench Forge cost request, response, fallback, loading, and error semantics.
2. Current Forge controller and valuation-service county, parcel, tax-year, and authorization
   semantics.
3. Canonical kernel request, response, client, host, provenance, timeout, cancellation, and failure
   semantics.
4. Existing WO-SR-006 ownership, local-artifact, rollback, and runtime-consumer evidence.
5. Existing focused tests that prove or fail to prove the proposed boundary.

Writable files are limited to this packet, one evidence artifact, and the canonical Work Order
registry, queue, program, and command-routing records needed for lifecycle closure.

## Required deliverables

1. Exact county, parcel, tax-year, authorization, and source-fact identity contract.
2. Pure facts-to-`KernelCostApproachRequest` projection contract with fail-closed invariants.
3. Exact `KernelCostApproachResponse` to Workbench cost response translation contract.
4. Honest fallback and failure vocabulary that distinguishes unavailable, stub, kernel failure,
   timeout, cancellation, and accepted canonical output.
5. Correlation, TerraTrace, audit, cancellation, timeout, output-bound, environment, and network
   requirements.
6. Synthetic positive and negative parity plan.
7. One staged later implementation sequence with exact candidate file allowlists, rollback, and
   validation gates, or an exact decomposition/no-go finding.
8. One verdict: `IMPLEMENTATION_READY_AS_STAGED_SEQUENCE`, `DECOMPOSITION_REQUIRED`, or `NO_GO`.

## Explicit denials

- no frontend, backend, runtime, test, workflow, package, lockfile, configuration, or deployment
  edits;
- no projection, consumer, controller, service, DI registration, provider, persistence, or process
  host implementation;
- no Forge repository mutation, artifact transfer, source copy, publication, or ownership change;
- no county, PACS, SQL, credential, secret, migration, live service, or production access;
- no runtime switch, route adoption, fallback-policy change, cutover, source retirement, or
  live-readiness claim.

## Validation

- exact source and evidence citations;
- `git diff --check`;
- `node docs/brain/workorders/tools/wo-query.mjs --json`;
- Work Order query and planner tests;
- exact changed paths equal the admitted docs/governance allowlist;
- secret-pattern scan;
- remote required checks and zero unresolved substantive threads;
- independent exact-head assurance.

## Rollback

Revert only this Work Order's packet, evidence, and routing updates. No product, runtime, test,
repository, artifact, data, configuration, or external-resource state changes.

## Terminal condition

One of:

- `FORGE_KERNEL_COST_CONTRACT_IMPLEMENTATION_READY_AS_STAGED_SEQUENCE`;
- `FORGE_KERNEL_COST_CONTRACT_DECOMPOSITION_REQUIRED`; or
- `FORGE_KERNEL_COST_CONTRACT_NO_GO`.

Any later product, test, backend, runtime, consumer, or host implementation requires a separately
recorded bounded R3 authority envelope.

## Result and continuation

Result: `FORGE_KERNEL_COST_CONTRACT_DECOMPOSITION_REQUIRED`.

After merge, continue to `WO-SR-008G - Forge Cost Fact and Schedule Semantics Audit`, a same-risk
docs/evidence-only node. It must resolve the exact rate, schedule-year, modifier, vocabulary,
land/factor, identity, trace, hashing, and rounding semantics before any implementation packet can be
considered.

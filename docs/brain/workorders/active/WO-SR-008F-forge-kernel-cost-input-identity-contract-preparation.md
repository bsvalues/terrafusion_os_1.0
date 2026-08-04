# WO-SR-008F - Forge Kernel Cost Input and Identity Contract Preparation

## Status

`READY - POST-MERGE DEPENDENCY INTERLOCKED`

## Program

Five-Suite Federated Repository Buildout

## Goal and loop

- Goal: `GOAL-FIVE-SUITE-FEDERATED-REPOSITORIES`
- Loop: `LOOP-FIVE-SUITE-FEDERATED-REPOSITORIES`

## Risk and mode

- Risk: `R2`
- Mode: read-only contract design, evidence, and exact-scope preparation
- Dependency: WO-SR-008E must merge and receive post-merge verification
- Authority: Issue #1396 plus `OWNER-TF-STANDING-OPERATOR-AUTHORITY`

## Purpose

Define the missing county-bound input, identity, response, failure, trace, cancellation, and process
constraints that must exist before a Forge kernel cost path can be implemented or shadowed in the
Property Workbench.

## Read-only inspection scope

1. Current authenticated county and parcel context sources.
2. `IValuationService`, Forge cost DTOs, and canonical valuation fact sources.
3. `KernelCostApproachRequest`, `KernelCostApproachResponse`, process host, and existing kernel tests.
4. Current correlation, TerraTrace, timeout, cancellation, environment, and output-bound patterns.
5. Existing WO-SR-006 staging and rollback evidence.

Writable scope is limited to this packet, one evidence artifact, and canonical Work Order registry,
queue, program, and command-routing records required for lifecycle closure.

## Required deliverables

1. Exact authenticated county, parcel, tax-year, and permission assertions.
2. Exact pure input projection contract; persistence is outside the projection.
3. Field-by-field kernel-to-Workbench cost response map and intentional nonclaims.
4. Fail-closed source, fallback, correlation, trace, timeout, cancellation, output, environment, and
   network-posture contract.
5. Exact sovereign file allowlists for a staged later sequence.
6. Required focused tests, rollback, shadow-only interlock, and terminal conditions.
7. One verdict: `IMPLEMENTATION_READY_AS_STAGED_SEQUENCE`, `DECOMPOSITION_REQUIRED`, or `NO_GO`.

If implementation-ready, return one exact bounded R3 authority packet. Do not activate or implement
that packet in WO-SR-008F.

## Explicit denials

- no frontend, backend, runtime, test, workflow, package, lockfile, or deployment edits;
- no controller, consumer, service, projection, DI, configuration, provider, or persistence change;
- no Forge repository mutation, artifact transfer, source copy, publication, or ownership change;
- no county, PACS, SQL, credential, secret, migration, live service, or production access;
- no runtime switch, shadow execution, fallback-policy change, source retirement, or cutover.

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

Revert only this Work Order's evidence and routing updates. No product, runtime, test, repository,
artifact, data, or external-resource state changes.

## Terminal condition

One of:

- `FORGE_KERNEL_COST_CONTRACT_IMPLEMENTATION_READY_AS_STAGED_SEQUENCE`;
- `FORGE_KERNEL_COST_CONTRACT_DECOMPOSITION_REQUIRED`; or
- `FORGE_KERNEL_COST_CONTRACT_NO_GO`.

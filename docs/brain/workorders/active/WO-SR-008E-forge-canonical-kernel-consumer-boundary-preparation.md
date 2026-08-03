# WO-SR-008E - Forge Canonical Kernel Consumer Boundary Preparation

## Status

`READY - POST-MERGE DEPENDENCY INTERLOCKED`

## Program

Five-Suite Federated Repository Buildout

## Goal and loop

- Goal: `GOAL-FIVE-SUITE-FEDERATED-REPOSITORIES`
- Loop: `LOOP-FIVE-SUITE-FEDERATED-REPOSITORIES`

## Risk and mode

- Risk: `R2`
- Mode: read-only design, evidence, and exact-scope preparation
- Dependency: WO-SR-008A must merge before dispatch
- Authority: Issue #1396 plus `OWNER-TF-STANDING-OPERATOR-AUTHORITY`

## Purpose

Define the exact boundary between the Property Workbench Forge tab's current DB-backed
`/api/forge` consumer and the canonical Forge valuation kernel exposed through the sovereign kernel
endpoint. Return one bounded adoption verdict without changing product, runtime, tests, or Forge.

## Read-only inspection scope

1. Workbench Forge tab, hooks, client contracts, and existing tests.
2. `ForgeController`, `ValuationController`, `IValuationService`, canonical kernel registration, and
   related focused tests.
3. Existing WO-SR-006 cutover, rollback, local-shadow, and ownership evidence.
4. Existing Forge repository provenance and public contract evidence.

Writable files are limited to this packet, one evidence artifact, and the canonical Work Order
registry, queue, program, and command-routing records needed for lifecycle closure.

## Required deliverables

1. Exact current Workbench request/response and failure semantics.
2. Exact canonical-kernel request/response and failure semantics.
3. Compatibility and translation matrix between the two paths.
4. County, identity, authorization, trace, timeout, fallback, and rollback requirements.
5. Exact sovereign and Forge no-touch boundaries.
6. One verdict: `IMPLEMENTATION_READY`, `DECOMPOSITION_REQUIRED`, or `NO_GO`.
7. If implementation-ready, one exact later R3 packet with file allowlist, tests, rollback, and
   terminal condition. Do not activate or implement it in this Work Order.

## Explicit denials

- no frontend, backend, runtime, test, workflow, package, lockfile, or deployment edits;
- no consumer, controller, service, DI registration, configuration, provider, or persistence change;
- no Forge repository mutation, artifact transfer, source copy, publication, or ownership change;
- no county, PACS, SQL, credential, secret, migration, live service, or production access;
- no runtime switch, cutover, fallback-policy change, source retirement, or live-readiness claim.

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

- `FORGE_CANONICAL_KERNEL_CONSUMER_IMPLEMENTATION_READY`;
- `FORGE_CANONICAL_KERNEL_CONSUMER_DECOMPOSITION_REQUIRED`; or
- `FORGE_CANONICAL_KERNEL_CONSUMER_NO_GO`.

## Continuation

After merge, continue only to a same-risk dependency-cleared evidence node. Any consumer/runtime
implementation remains a separately bounded R3 authority decision.

# WO-SR-008H - Forge Cost Schedule Version and Modifier Projection Contract

## Status

`IN PROGRESS - CONTRACT COMPLETE, R3 AUTHORITY REQUIRED`

## Program

Five-Suite Federated Repository Buildout

## Goal and loop

- Goal: `GOAL-FIVE-SUITE-FEDERATED-REPOSITORIES`
- Loop: `LOOP-FIVE-SUITE-FEDERATED-REPOSITORIES`

## Risk and mode

- Risk: `R2`
- Mode: read-only source/canon audit and exact-scope contract preparation
- Dependency: WO-SR-008G merged as PR #1402 / `4ef8760fe36f6053d84eb0b7523c7d8f5bd787d5`
- Authority: Issue #1396 plus `OWNER-TF-STANDING-OPERATOR-AUTHORITY`

## Purpose

Define exact cost-factor and depreciation-schedule identity, eliminate lexical latest-version and
duplicate-band ambiguity, and bound the fail-closed modifier subset that a future pure unwired Forge
kernel input projection may consume. This Work Order defines proof; it does not change valuation
behavior.

## Read-only inspection scope

1. `CostFactorSet`, `CostFactorCatalog`, `DepreciationSchedule`, reference-data migrations, and tests.
2. Frozen kernel cost request and Rust cost formula.
3. WO-SR-008F/008G evidence and PR #1402 assurance findings.
4. Exact future source/test allowlists, validation, rollback, and nonclaims.

Writable files are limited to this packet, one evidence artifact, and canonical Work Order registry,
queue, program, and command-routing records needed for lifecycle closure.

## Required deliverables

1. Exact schedule identity and selection contract.
2. Exact duplicate/overlap and provenance failure behavior.
3. Safe first-projection modifier subset and explicit exclusions.
4. Exact future implementation/test allowlist and synthetic proof matrix, if source truth is
   sufficient.
5. One verdict: `IMPLEMENTATION_READY_AS_STAGED_SEQUENCE`, `DECOMPOSITION_REQUIRED`, or `NO_GO`.

## Explicit denials

- no valuation-methodology, calibration, vocabulary, rounding, permission, trace, or identity-policy
  invention;
- no frontend, backend, runtime, test, process-host, workflow, package, lockfile, configuration, or
  deployment edits;
- no projection, consumer, controller, service, DI, provider, persistence, or trace implementation;
- no Forge repository mutation, artifact transfer, source copy, publication, or ownership change;
- no county, PACS, SQL, credential, secret, migration, live service, or production access;
- no runtime switch, route adoption, cutover, source retirement, or live-readiness claim.

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

- `FORGE_COST_SCHEDULE_PROJECTION_IMPLEMENTATION_READY_AS_STAGED_SEQUENCE`;
- `FORGE_COST_SCHEDULE_PROJECTION_DECOMPOSITION_REQUIRED`; or
- `FORGE_COST_SCHEDULE_PROJECTION_NO_GO`.

Any later product, test, backend, runtime, consumer, trace, or host implementation requires a
separately recorded bounded R3 authority envelope.

## Result

`FORGE_COST_SCHEDULE_PROJECTION_IMPLEMENTATION_READY_AS_STAGED_SEQUENCE`

The first stage is `WO-SR-008H-E1 - Forge Pure Cost Schedule Resolution and Modifier Projection
Foundation`. It is a pure, unwired decimal projection over caller-supplied `CostFactorSet` and
`DepreciationSchedule` objects plus an exact pin. It does not perform catalog or persistence lookup.

E1 may validate exact schedule ID, county, effective year, opaque version, provenance, stable content
hash, one unambiguous narrowest cost band, and one unambiguous narrowest depreciation band. It may
return only decimal `BaseRate` and decimal `DepreciationRate`. It must omit quality, condition, land,
neighborhood/location factors, functional/economic obsolescence, and every caller-supplied modifier.

E1 is proposed R3 work. It is not activated or authorized by this R2 packet. A later numeric contract
must govern decimal-to-double conversion before any frozen kernel DTO mapping.

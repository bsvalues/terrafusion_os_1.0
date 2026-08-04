# WO-SR-008G - Forge Cost Fact and Schedule Semantics Audit

## Status

`COMPLETE - DECOMPOSITION_REQUIRED`

## Program

Five-Suite Federated Repository Buildout

## Goal and loop

- Goal: `GOAL-FIVE-SUITE-FEDERATED-REPOSITORIES`
- Loop: `LOOP-FIVE-SUITE-FEDERATED-REPOSITORIES`

## Risk and mode

- Risk: `R2`
- Mode: read-only source/canon audit and exact-scope preparation
- Dependency: WO-SR-008F merged as PR #1401 and received post-merge verification
- Authority: Issue #1396 plus `OWNER-TF-STANDING-OPERATOR-AUTHORITY`

## Purpose

Resolve the source-backed valuation-fact semantics required by the canonical Forge kernel input
projection. Correct WO-SR-008F's overstated rate ambiguity, identify what is already canonical, and
separate implementation-ready facts from remaining policy gaps without changing valuation behavior.

## Read-only inspection scope

1. `CostFactorSet`, `CostFactor`, `CostApproach`, cost matrices/readers, and focused tests.
2. Effective-year, version, county, property-type, quality, condition, modifier, land, and adjustment
   semantics.
3. County/parcel alias uniqueness, authorization permission, correlation/trace, deterministic hash,
   precision, and rounding semantics.
4. WO-SR-008F evidence and the three post-merge PR #1401 review findings.

Writable files are limited to this packet, one evidence artifact, and canonical Work Order registry,
queue, program, and command-routing records needed for lifecycle closure.

## Required deliverables

1. Exact disposition of `UnitCostPerSqFt`, `BaseRate`, `BaseCost`, and legacy `CostPerSqFt`.
2. Exact county/effective-year/version schedule selection semantics.
3. Modifier vocabulary, formula, normalization, ordering, bounds, and unknown-value behavior.
4. Quality/condition normalization and land/neighborhood/location factor provenance.
5. County/parcel alias uniqueness, Forge permission, correlation/trace, hash, precision, and rounding
   semantics.
6. Explicit correction of any inaccurate WO-SR-008F premise without rewriting historical evidence.
7. Exact bounded staged implementation packet if source truth is sufficient, or one further bounded
   decomposition/no-go result.
8. One verdict: `IMPLEMENTATION_READY_AS_STAGED_SEQUENCE`, `DECOMPOSITION_REQUIRED`, or `NO_GO`.

## Explicit denials

- no valuation-policy invention or methodology/calibration choice;
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

- `FORGE_COST_SEMANTICS_IMPLEMENTATION_READY_AS_STAGED_SEQUENCE`;
- `FORGE_COST_SEMANTICS_DECOMPOSITION_REQUIRED`; or
- `FORGE_COST_SEMANTICS_NO_GO`.

Any later product, test, backend, runtime, consumer, trace, or host implementation requires a
separately recorded bounded R3 authority envelope.

## Result

`FORGE_COST_SEMANTICS_DECOMPOSITION_REQUIRED`

The audit corrected the WO-SR-008F rate premise: `CostFactor.UnitCostPerSqFt` is the canonical
TerraFusion-owned replacement-cost-new unit input and is the source candidate for kernel `BaseRate`.
Legacy `BaseCost` and `CostPerSqFt` fields are not projector inputs.

Exact county and effective-year filtering exist, but version selection is not pinned: the current
catalog chooses the lexically greatest version. Duplicate equally specific cost bands can resolve by
generated GUID. Quality, condition, and kernel modifier behavior conflict across current paths;
non-neutral neighborhood/location factors have no versioned provenance. County/parcel alias
uniqueness, exact read permission, trace linkage, deterministic fact hashing, and decimal/double
rounding also remain unresolved.

The smallest dependency-cleared successor is `WO-SR-008H - Forge Cost Schedule Version and Modifier
Projection Contract`. It is admitted as another R2 read-only docs/evidence node. It may define exact
schedule identity, the safe first-projection subset, fail-closed modifier exclusions, and focused
proof requirements. It may not implement or change valuation behavior.

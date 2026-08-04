# WO-SR-008H-E1 - Forge Pure Cost Schedule Resolution and Modifier Projection Foundation

## Status

`IN PROGRESS - IMPLEMENTATION AND LOCAL PROOF COMPLETE`

## Program

Five-Suite Federated Repository Buildout

## Goal and loop

- Goal: `GOAL-FIVE-SUITE-FEDERATED-REPOSITORIES`
- Loop: `LOOP-FIVE-SUITE-FEDERATED-REPOSITORIES`

## Risk, authority, and dependency

- Risk: `R3`
- Mode: bounded pure product/test implementation plus governance evidence
- Dependency: WO-SR-008H merged as PR #1403 / `2561e2d060612e38dfd6afbb0d070268468c7517`
- Authority: `OWNER-SR-008H-E1-R3-FORGE-COST-SCHEDULE-PROJECTION-20260803`
- Canonical-ratification amendment: `OWNER-SR-008H-E1-R3-CANONICAL-RATIFICATION-AMENDMENT-001`

## Purpose

Implement the exact schedule-pin, canonical-content-hash, and unique factor-resolution contract from
WO-SR-008H as a pure, provider-neutral, unwired decimal projection. The projection receives two
caller-supplied schedule snapshots. It does not select, retrieve, persist, convert, or wire them.

## Exact implementation scope

```text
backend/src/TerraFusion.Core/Entities/Forge/ForgeCostScheduleProjection.cs
backend/tests/TerraFusion.Unit.Tests/Forge/ForgeCostScheduleProjectionTests.cs
```

Governance writes are limited to this packet, its evidence artifact, and the seven canonical
registry, queue, program, and command-routing records in the registry allowlist. The amended scope
also includes `.governance/owner-decisions.json` solely to canonize and later consume the bounded
authority.

## Implemented boundary

1. `ForgeCostSchedulePin` requires exact county, year, schedule IDs, opaque versions, and semantic
   SHA-256 hashes.
2. Canonical JSON implements the WO-SR-008H property order, Unicode NFC, lowercase GUIDs,
   deterministic row ordering, invariant integers, and scale-independent decimal strings.
3. Structural validation rejects incomplete provenance, unknown origin, invalid or duplicate row
   identities, cross-schedule children, invalid bounds, and invalid values.
4. Resolution returns the unique narrowest matching class/size and age bands and rejects missing or
   equal-specificity results.
5. Output contains exactly decimal `BaseRate` and decimal `DepreciationRate`.

## Explicit denials and nonclaims

- no runtime, controller, endpoint, service, DI, process-host, catalog, database, provider, HTTP,
  persistence, migration, deployment, production, or protected-resource behavior;
- no kernel DTO mapping or decimal-to-double conversion;
- no quality, condition, land, neighborhood, location, obsolescence, or caller modifier;
- no workflow, package, lockfile, Forge-repository, ownership, publication, or cutover change;
- no claim that Property Workbench or a live parcel journey consumes this projection.

## Validation

- focused synthetic projection tests;
- backend Release build with warnings as errors;
- known-answer hash vectors from WO-SR-008H;
- Work Order query and planner tests;
- exact changed-path and blocked-path inspection;
- package and lockfile unchanged;
- remote required checks, zero unresolved substantive threads, and independent exact-head assurance.

## Rollback

Revert only the two new source/test files and this Work Order's ten governance/evidence records. No
runtime configuration, persistence, external system, credential, data, or deployed state exists.

## Terminal condition

`FORGE_PURE_COST_SCHEDULE_PROJECTION_FOUNDATION_PROVEN_UNWIRED`

After merge, routing returns to one consolidated Forge consumer completion decision packet. E1 does
not admit another planning-only successor and does not authorize consumer adoption.

# WO-SR-008D - Synthetic Single-Parcel Journey Proof Restoration

## Status

`READY - POST-MERGE DEPENDENCY INTERLOCKED`

## Program

Five-Suite Federated Repository Buildout

## Goal and loop

- Goal: `GOAL-FIVE-SUITE-FEDERATED-REPOSITORIES`
- Loop: `LOOP-FIVE-SUITE-FEDERATED-REPOSITORIES`

## Risk and mode

- Risk: `R2`
- Mode: bounded test/evidence restoration; no product behavior change
- Dependency: WO-SR-008A must merge before dispatch
- Authority: Issue #1396 plus `OWNER-TF-STANDING-OPERATOR-AUTHORITY`

## Purpose

Restore current synthetic evidence for the already-ratified single-parcel assessor journey by
replacing two stale/skipped contracts with bounded fixtures. This Work Order does not cross the live
parcel-resource boundary and does not claim synthetic proof is production proof.

## Exact writable test scope

1. `frontend/apps/os-shell/src/__tests__/journey/AssessorValuationJourney.contract.test.tsx`
2. `frontend/apps/os-shell/src/pages/workbench/__tests__/WorkbenchTabBar.test.tsx`

Writable governance/evidence scope is limited to this packet, its evidence artifact, and the
canonical registry, queue, program, and command-routing records needed for lifecycle closure.

## Required behavior

1. Replace the obsolete heavy mock graph with a bounded deterministic synthetic harness.
2. Restore the assessor valuation journey contract for search-to-route, parcel fixture loading,
   Workbench composition, and return navigation.
3. Restore the constitutional nine-position tab-order contract, including Pilot and preserving
   Dossier/Pilot as the final two positions.
4. Fail closed when parcel identity or required synthetic evidence is absent or inconsistent.
5. Keep every live, authenticated, county, provider, persistence, and production dependency mocked
   or explicitly outside the proof.
6. Record warnings, skipped proof, and non-claims honestly.

## Explicit denials

- no frontend product-source, backend, runtime, workflow, package, lockfile, or deployment edits;
- no new route, tab, behavior, consumer, DI registration, provider, persistence, or live service;
- no county, PACS, SQL, credential, secret, migration, production, or protected-resource access;
- no Atlas/GPT runtime adoption, TerraPilot promotion, Sync continuation, cutover, or source retirement;
- no claim that synthetic evidence proves live or production readiness.

## Validation

- focused restored contracts pass;
- the five WO-SR-008A targeted contracts remain green;
- `git diff --check`;
- `node docs/brain/workorders/tools/wo-query.mjs --json`;
- Work Order query and planner tests;
- exact changed paths equal the admitted allowlist;
- secret-pattern scan;
- remote required checks and zero unresolved substantive threads;
- independent exact-head assurance.

## Rollback

Revert only the two test restorations plus their evidence and routing updates. Product and runtime
source remain unchanged.

## Terminal condition

`SYNTHETIC_SINGLE_PARCEL_JOURNEY_PROOF_RESTORED_LIVE_RESOURCE_BOUNDARY_PRESERVED`

## Continuation

After merge, recompute the portfolio from evidence. Do not infer authority for live parcel access,
Forge/Atlas/Dais/Pilot runtime adoption, providers, persistence, deployment, or production.

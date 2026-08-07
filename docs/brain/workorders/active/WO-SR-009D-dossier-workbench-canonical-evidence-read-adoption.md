# WO-SR-009D - Dossier Workbench Canonical Evidence Read Adoption

**Status:** Active / R3 bounded implementation
**Program:** Five-Suite Federated Repository Buildout
**Goal:** `GOAL-FIVE-SUITE-FEDERATED-REPOSITORIES`
**Loop:** `LOOP-FIVE-SUITE-FEDERATED-REPOSITORIES`
**Authority:** `OWNER-SR-009D-R3-DOSSIER-WORKBENCH-CANONICAL-EVIDENCE-READ-20260807`
**Base:** `6622ca14e93d6a853c9629308e37a42620c0e08f`
**Issue:** #1426

## Outcome

Make the frozen `dossier.evidence-registry-read@1.0.0` contract reachable through one authenticated,
county- and parcel-scoped API read and the existing Property Dossier tab. The result remains read-only,
synthetic/in-memory proof only, and does not mutate custody, persistence, routing, or live resources.

## Controlling County Rule

The new canonical route must derive county only from an authenticated canonical `countyId` claim. It
must fail closed when that claim is missing, invalid, or non-canonical. It must not call or inherit the
controller's Development-only Benton fallback.

## Implementation Sequence

1. Canonize this bounded decision and activate the Work Order.
2. Add the strict canonical API read and focused backend proof.
3. Add the typed service read and truthful Property Dossier states.
4. Extend the disposable authenticated SQLite Workbench journey.
5. Validate, assure, merge, verify, and perform one governance-only closeout.

## Required Proof

- Authentication and `read:dossier` are required.
- County and parcel selectors fail closed.
- Same-county results preserve the frozen vocabulary and deterministic ordering.
- Foreign-only and absent parcels return the same empty contract shape.
- Pagination, trace, UTC, duplicate, and adapter rejection behavior is proven.
- Loading, loaded, empty, error, and stale-navigation UI states are honest.
- The legacy mixed evidence index is explicitly non-canonical and is not merged into this result.
- Exact changed paths remain the 17-file allowlist.

## Denials

No writes, custody changes, entity/schema/migration changes, frozen adapter or contract changes,
provider or persistence work, standalone F1, routes/tabs/navigation changes, live county/PACS/SQL,
credentials, secrets, workflows, deployment, production, publication, source retirement, or cutover.

## Terminal Condition

`DOSSIER_COUNTY_SCOPED_CANONICAL_EVIDENCE_READ_REACHABLE_IN_WORKBENCH_NO_WRITE_CUSTODY_MUTATION_OR_LIVE_DATA`

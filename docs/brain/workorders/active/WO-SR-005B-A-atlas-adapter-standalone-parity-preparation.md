# WO-SR-005B-A - Atlas Adapter and Standalone Parity Preparation

| Field | Value |
| --- | --- |
| Status | ACTIVE |
| Program | Five-Suite Federated Repository Buildout |
| Risk | R1 docs/evidence and read-only source inspection |
| Dependency | WO-SR-005B-I complete |
| Next | Bounded Atlas adapter/parity implementation packet or an exact protected boundary |

## Objective

Map the smallest provider-neutral adapter boundary and standalone synthetic parity harness needed
before any Atlas extraction. Reuse `atlas.spatial-read@1.0.0`; do not create a competing contract.

## Allowed

- Read-only inspection of existing Atlas service, controller, frontend adapter, and GIS package
  surfaces.
- Read-only inspection of `bsvalues/terrafusion-atlas` bootstrap and contract-compat posture.
- One evidence packet and bounded `docs/brain/workorders/**` routing updates.
- Exact adapter inputs/outputs, fixture reuse, parity assertions, provenance, and rollback plan.

## Blocked

- Backend, frontend, `packages/gis-pro`, destination runtime, package, lockfile, workflow, or
  deployment edits.
- Provider calls, credentials, county/PACS/SQL data, live services, or production access.
- Contract redefinition, source copying, extraction, ownership cutover, or duplicate retirement.

## Required Proof

- Exact source and destination boundaries with file-level provenance candidates.
- Field-by-field mapping to the frozen contract without cross-lane fields.
- Synthetic-only standalone parity plan using the frozen fixture corpus.
- Explicit verdict: implementation-ready within a bounded slice, or exact blocker.

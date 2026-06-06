# Benton Real Dev Server Readiness

Generated: 2026-06-06T22:21:06.872Z
Status: REAL_DEV_SERVER_BLOCKED

## Decision

- Real Dev Server: BLOCKED
- Production Proof: BLOCKED
- Operational Proof: BLOCKED

## Maturity

- DATA_TRUTH_FAIL: true
- REAL_DEV_DATA_AVAILABLE: true
- SYNC_DERIVED_PARTIAL: true
- SYNC_DERIVED_COMPLETE: false
- AUTHORITATIVE_RECONCILED: false
- PRODUCTION_PROOF_ALLOWED: false

## Checks

| Check | Classification | Passed | Reason |
| --- | --- | --- | --- |
| backend health | SYNC_DERIVED | true | Backend health is reported usable for dev reads. |
| active drain process state | UNKNOWN | false | Drain process state is unknown. |
| load_batch current stage | UNKNOWN | false | load_batch stage is owner-supnum-backfill (FAILED). |
| landing table counts | PARTIAL_SEEDED | true | Property landing rows exist. |
| truth table counts | PARTIAL_SEEDED | true | Truth table counts are evaluated as partial until all expected Benton counts are reconciled. |
| canonical parcel counts | SEEDED | true | Canonical parcel rows exist. |
| owner truth count | PARTIAL_SEEDED | true | Owner truth rows exist. |
| account count | SEEDED | true | Account rows exist. |
| supp association count | PARTIAL_SEEDED | true | Supplement association landing rows exist. |
| property landing count | PARTIAL_SEEDED | true | Property landing count is present. |
| WPOV status | PARTIAL_SEEDED | true | WPOV landing rows exist. |
| WSDOR status | PARTIAL_SEEDED | true | WSDOR truth rows exist. |
| map data dependency status | PARTIAL_SEEDED | true | Map dependency is classified PARTIAL_SEEDED. |
| ledger data dependency status | SYNC_DERIVED | true | Ledger dependency is classified SYNC_DERIVED. |
| inspector data dependency status | SYNC_DERIVED | true | Inspector dependency is classified SYNC_DERIVED. |

## Blockers

- active drain process state: Drain process state is unknown.
- load_batch current stage: load_batch stage is owner-supnum-backfill (FAILED).

## Rules

- Client timeout is not data failure.
- Backend death is data failure.
- Stage stagnation without inserts is investigation.
- Partial landing is usable for dev evidence, not production proof.
- Do not relabel partial seed as authoritative.

## Boundaries

- This gate does not start or stop drains.
- This gate does not touch TerraFusion Sync.
- This gate does not touch DB seeding.
- This gate does not weaken production proof gates.

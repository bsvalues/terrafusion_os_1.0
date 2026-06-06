# Benton Real Dev Server Readiness

Generated: 2026-06-06T22:47:00.641Z
Status: REAL_DEV_DATA_AVAILABLE

## Decision

- Real Dev Server: ALLOWED
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
| active drain process state | SYNC_DERIVED | true | Client drain process is not alive, but DB load_batch proves server-side state IN_PROGRESS. |
| load_batch current stage | SYNC_DERIVED | true | load_batch stage is owner-supnum-resume (IN_PROGRESS). |
| landing table counts | PARTIAL_SEEDED | true | Property landing rows exist. |
| truth table counts | PARTIAL_SEEDED | true | Truth table counts are evaluated as partial until all expected Benton counts are reconciled. |
| canonical parcel counts | SEEDED | true | Canonical parcel rows exist. |
| owner truth count | PARTIAL_SEEDED | true | Owner truth rows exist. |
| account count | SEEDED | true | Account rows exist. |
| supp association count | PARTIAL_SEEDED | true | Supplement association landing rows exist. |
| property landing count | PARTIAL_SEEDED | true | Property landing count is present. |
| WPOV status | PARTIAL_SEEDED | true | WPOV landing rows exist. |
| WSDOR status | PARTIAL_SEEDED | true | WSDOR truth rows exist. |
| owner-supnum backfill dependency classification | PARTIAL_SEEDED | true | owner-supnum backfill is not required for County Studio Forge valuation dev; packet and operational proof remain blocked. |
| map data dependency status | PARTIAL_SEEDED | true | Map dependency is classified PARTIAL_SEEDED. |
| ledger data dependency status | SYNC_DERIVED | true | Ledger dependency is classified SYNC_DERIVED. |
| inspector data dependency status | SYNC_DERIVED | true | Inspector dependency is classified SYNC_DERIVED. |

## Forge Dev Dependency Reclassification

- ownerSupnumBackfillStatus: IN_PROGRESS
- ownerSupnumBackfillStage: owner-supnum-resume
- ownerSupnumBackfillLatestFailedStage: owner-supnum-resume
- ownerSupnumBackfillLatestFailedStatus: FAILED
- ownerSupnumBackfillClassification: NOT_REQUIRED_FOR_FORGE_DEV
- ownerSupnumBackfillRequiredForForgeDev: false
- ownerSupnumBackfillRequiredForPacketProof: true
- ownerSupnumBackfillRequiredForOperationalProof: true

## Blockers

- None

## Rules

- Client timeout is not data failure.
- Backend death is data failure.
- Stage stagnation without inserts is investigation.
- Partial landing is usable for dev evidence, not production proof.
- Owner-supnum backfill failure blocks packet and operational proof, but only blocks County Studio Forge dev when a Forge surface consumes owner identity.
- Do not relabel partial seed as authoritative.

## Boundaries

- This gate does not start or stop drains.
- This gate does not touch TerraFusion Sync.
- This gate does not touch DB seeding.
- This gate does not weaken production proof gates.

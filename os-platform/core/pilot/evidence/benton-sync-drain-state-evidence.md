# Benton Sync Drain State Evidence

Generated: 2026-06-07T15:51:02.540Z

## Decision

- Real dev evidence readable: true
- Production proof allowed: false
- Operational proof allowed: false

## Runtime

- Backend health: healthy
- Drain PID: none
- Drain alive: null
- load_batch stage: owner-supnum-v2-activesupp-copy
- load_batch status: IN_PROGRESS

## DB Runtime Access

- Mode: docker
- Canonical path: `docker exec <TF_PG_CONTAINER> psql -U <TF_PG_USER> -d <TF_PG_DATABASE>`
- Container: terrafusion-postgres-dev
- Database: terrafusion
- User: postgres
- Direct connection configured: false

## Counts

| Source | Classification | Count | Reason |
| --- | --- | ---: | --- |
| legacyProperty | PARTIAL_SEEDED | 1190834 | count present |
| legacyOwner | PARTIAL_SEEDED | 8213706 | count present |
| legacyPropSuppAssoc | PARTIAL_SEEDED | 4382985 | count present |
| legacyWashPropOwnerVal | PARTIAL_SEEDED | 1654143 | count present |
| legacyAccount | SEEDED | 535140 | count present |
| truthParcel | SYNC_DERIVED | 83326 | count present |
| truthOwner | SYNC_DERIVED | 816849 | count present |
| truthWsdor | UNKNOWN | 0 | No readable DB runtime path. docker psql: spawnSync docker ETIMEDOUT |
| canonicalParcel | SEEDED | 3198979 | count present |
| canonicalOwner | SEEDED | 312532 | count present |
| canonicalWsdor | SEEDED | 686820 | count present |
| gisParcelGeometry | PARTIAL_SEEDED | 80075 | count present |

## County Studio Dependencies

- Map: PARTIAL_SEEDED
- Ledger: SYNC_DERIVED
- Inspector: SYNC_DERIVED
- Owner-supnum backfill status: IN_PROGRESS
- Owner-supnum latest failed stage: owner-supnum-resume
- Owner-supnum latest failed status: FAILED
- Owner-supnum required for Forge dev: false
- Owner-supnum required for packet proof: true
- Owner-supnum required for operational proof: true

## Rules

- Read-only evidence collector only.
- Unavailable DB connection reports UNKNOWN, not PASS.
- Partial seed may enable real dev readiness, not production proof.
- Production and operational proof remain false.

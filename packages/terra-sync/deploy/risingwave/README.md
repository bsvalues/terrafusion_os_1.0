# RisingWave Materialized Views → Postgres shadow schema

## What this does

Four RisingWave MVs consume the Kafka canonical topics produced by Arroyo (Tasks 11–12) and sink upserts into a `shadow` schema in TerraFusion Postgres. Existing consumers read from `public."Properties"` / `public."CamaCharacteristics"` / etc. — the shadow schema is the PARALLEL truth that the shadow-diff job (Task 14) compares against before Phase 3 cutover.

| File | Source topic | Sink table |
| --- | --- | --- |
| `mv_properties.sql` | `sync.canonical.property` | `shadow."Properties"` |
| `mv_cama_characteristics.sql` | `sync.canonical.cama` | `shadow."CamaCharacteristics"` |
| `mv_comparable_sales.sql` | `sync.canonical.comparable_sales` | `shadow."ComparableSales"` |
| `mv_property_assessments.sql` | `sync.canonical.property_assessments` | `shadow."PropertyAssessments"` |

## Prerequisites

- TerraFusion Postgres running (outside this compose — the existing canonical DB).
- RisingWave up via `docker compose -f packages/terra-sync/deploy/docker-compose.dev.yml up -d risingwave`.
- `shadow-schema.sql` applied to Postgres once (creates the 4 shadow tables).
- Arroyo pipelines (Tasks 11–12) deployed and producing events to the 4 canonical topics.

## Apply

```bash
# 1. Create shadow schema in TerraFusion Postgres.
docker exec terrafusion-postgres-dev psql -U postgres -d terrafusion \
  -f /path/inside/container/shadow-schema.sql

# 2. Apply each RisingWave MV.
psql postgresql://root@localhost:4566/dev \
  -f packages/terra-sync/deploy/risingwave/mv_properties.sql
psql postgresql://root@localhost:4566/dev \
  -f packages/terra-sync/deploy/risingwave/mv_cama_characteristics.sql
psql postgresql://root@localhost:4566/dev \
  -f packages/terra-sync/deploy/risingwave/mv_comparable_sales.sql
psql postgresql://root@localhost:4566/dev \
  -f packages/terra-sync/deploy/risingwave/mv_property_assessments.sql
```

## Verify

```bash
# After Debezium snapshot completes and Arroyo+RisingWave have caught up:
docker exec terrafusion-postgres-dev psql -U postgres -d terrafusion \
  -c 'SELECT COUNT(*) FROM shadow."Properties";'
```

Expected: non-zero count. Parity with `public."Properties"` is the Phase 2 exit gate (Task 16).

## Known gaps (close in Phase 2.1)

- `Properties.SitusCity/State/Zip` — Arroyo enrichment pass from the situs topic not wired; lands NULL here.
- `ComparableSales.ParcelId` — Arroyo does not join `chg_of_owner_prop_assoc` yet; lands NULL.

Both gaps are in-scope for Phase 2.1 (not a blocker for Phase 2 shadow-parity gate on the attributes that ARE populated).

## Passwords

`devpassword123` is the dev Postgres password. Production uses Vault-sourced secrets per Phase 3 Spec-Lock v2.

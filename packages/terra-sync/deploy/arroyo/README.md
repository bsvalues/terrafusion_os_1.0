# Arroyo Streaming Pipelines — TerraFusion Sync v4 Phase 2

Arroyo runs as a containerized service in `docker-compose.dev.yml` and exposes:
- `http://localhost:5115` — Web UI for pipeline management
- `http://localhost:8000` — REST API

## Pipelines

| File | Source topics | Sink topic |
| --- | --- | --- |
| `pipelines/normalize-property.sql` | `sync.source.harris.benton.pacs_oltp.dbo.property` + `property_val` | `sync.canonical.property` |
| `pipelines/normalize-cama.sql` | `sync.source.harris.benton.pacs_oltp.dbo.imprv` | `sync.canonical.cama` |
| `pipelines/normalize-comparable-sales.sql` | `sync.source.harris.benton.pacs_oltp.dbo.sale` | `sync.canonical.comparable_sales` |
| `pipelines/normalize-property-assessments.sql` | `sync.source.harris.benton.pacs_oltp.dbo.property_val` | `sync.canonical.property_assessments` |

## Deploy

Arroyo 0.14 accepts pipelines via its UI or API. Easiest operator path:

1. Open `http://localhost:5115`.
2. Create pipeline → paste the SQL from `pipelines/normalize-property.sql`.
3. Set name `normalize-property`.
4. Deploy. Confirm state reaches `RUNNING`.

API alternative (idempotent, scriptable — preferred for CI later):

```bash
# Create pipeline from SQL (HTTP POST)
curl -sf -X POST http://localhost:8000/api/v1/pipelines \
  -H 'Content-Type: application/json' \
  -d "$(jq -Rs --arg name normalize-property '{ name: $name, query: . }' \
         < pipelines/normalize-property.sql)"
```

(Arroyo's REST surface is versioned; re-check the exact endpoint against the installed version's docs before scripting CI.)

## Verify

```bash
# Tail the canonical output topic:
docker compose -f ../docker-compose.dev.yml exec -T kafka \
  kafka-console-consumer \
    --bootstrap-server kafka:9092 \
    --topic sync.canonical.property \
    --from-beginning --max-messages 3 | head -50
```

Expected: JSON records with fields `event_id`, `schema_version=1.0`,
`event_type=upsert|delete`, `county_id`, `entity=Property`,
`source_system=harris-pacs`, `source_id`, `occurred_at_utc`,
`ingested_at_utc`, `after_json` (stringified JSON object).

## Schema contract

The JSON shape is pinned in `docs/superpowers/specs/2026-04-16-terrafusion-sync-v4-control-plane-design.md` §6.2. Changes require a Spec-Lock v2 amendment — never edit this pipeline's output shape without updating the spec first.

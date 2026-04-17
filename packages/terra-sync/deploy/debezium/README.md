# Debezium SQL Server Connector — Benton Harris PACS

## What this does

Replicates four tables from the `pacs_oltp` MSSQL database into Kafka topics for Phase 2 canonicalization:

| Source (MSSQL) | Kafka topic |
| --- | --- |
| `dbo.property` | `sync.source.harris.benton.pacs_oltp.dbo.property` |
| `dbo.property_val` | `sync.source.harris.benton.pacs_oltp.dbo.property_val` |
| `dbo.sale` | `sync.source.harris.benton.pacs_oltp.dbo.sale` |
| `dbo.imprv` | `sync.source.harris.benton.pacs_oltp.dbo.imprv` |

Topic prefix is `sync.source.harris.benton`; Debezium appends `.<database>.<schema>.<table>`.

## Prerequisites

- Dev topology running: `docker compose -f packages/terra-sync/deploy/docker-compose.dev.yml up -d`
- MSSQL restored + CDC enabled per `../mssql/README.md`
- Debezium service account `debezium` exists with `db_datareader` + `SELECT ON SCHEMA::cdc`
- `jq` and `curl` installed locally (for `register.sh`)
- Phase 2 topics pre-created by `../bin/create-topics.sh` (optional; Debezium auto-creates, but explicit provisioning lets you control partition count)

## Register the connector

```bash
cd packages/terra-sync/deploy/debezium
./register.sh connectors/benton-harris-pacs.json
```

Expected: status response with `connector.state = RUNNING`, `tasks[0].state = RUNNING`.

## Verify CDC events flow

```bash
docker compose -f ../docker-compose.dev.yml exec -T kafka \
  kafka-console-consumer \
    --bootstrap-server kafka:9092 \
    --topic sync.source.harris.benton.pacs_oltp.dbo.property \
    --from-beginning --max-messages 3
```

Expected: 3 JSON messages. After the `transforms.unwrap=ExtractNewRecordState` step, each message is a flat row representation (no Debezium envelope), with the key columns as declared in the source table and `__deleted = "false"` (or `"true"` for deletes after the initial snapshot).

## Connector config highlights

- `snapshot.mode=initial` — full historical load on first start, then CDC streaming via SQL Server change tables. No gaps.
- `transforms.unwrap` with `delete.handling.mode=rewrite` — produces flat records with `__deleted` marker instead of tombstones with null value. Downstream Arroyo pipelines (Task 11/12) treat `__deleted=true` as an upsert → delete transition.
- `schema.history.internal.kafka.topic` — Debezium stores DDL history here so the connector can restart cleanly. One topic per connector.
- `provide.transaction.metadata=false` — keeps events flat; transaction grouping is not needed for canonicalization.
- `heartbeat.interval.ms=5000` — connector sends a heartbeat every 5s even when tables are idle so LSN progresses, preventing the CDC capture table from stalling.

## Tear down

```bash
curl -X DELETE http://localhost:8083/connectors/benton-harris-pacs-v1
```

Kafka topics stay intact; delete them separately with `kafka-topics --delete` if desired.

## Passwords

`TF_Deb2026!` is dev-only. Production uses Vault-sourced secrets per Phase 3 Spec-Lock v2.

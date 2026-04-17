# Shadow Parity — Day N (YYYY-MM-DD)

## Reports

Ran `cargo run -p terra-sync-shadow-diff` at 02:00 UTC. Full JSON in
`/var/log/terrafusion/shadow-diff-YYYY-MM-DD.json`.

| Table | truth_count | shadow_count | missing | extra | delta_% | threshold_ok |
| --- | --- | --- | --- | --- | --- | --- |
| Properties | | | | | | |
| CamaCharacteristics | | | | | | |
| PropertyAssessments | | | | | | |

## Debezium status

```
curl -sf http://localhost:8083/connectors/benton-harris-pacs-v1/status | jq .
```

Connector state: {RUNNING / FAILED / etc.}
Tasks[0].state: {RUNNING / ...}

## CDC lag

SQL Server capture job lag (latest LSN - latest snapshot LSN):

```
-- Run in pacs_oltp:
SELECT
  capture_instance,
  tran_end_time,
  DATEDIFF(SECOND, tran_end_time, GETUTCDATE()) AS seconds_behind
FROM cdc.lsn_time_mapping
ORDER BY start_lsn DESC
OFFSET 0 ROWS FETCH NEXT 1 ROW ONLY;
```

Lag seconds: {N}

## Audit chain

```
docker compose exec kafka kafka-console-consumer \
  --bootstrap-server kafka:9092 --topic sync.audit \
  --from-beginning --max-messages 5 | \
  cargo run --release -p some-chain-verifier-script
```

(The chain verifier is a future Phase 2.1 helper. For now, spot-check: are events present on `sync.audit`, and does each event's `prev_hash` equal the previous event's `hash`?)

Audit events today: {N}
Chain verified: yes | no | skipped

## Anomalies

{Free-form. Note any connector restarts, spikes in delta_%, schema drift, manual intervention. If "none", say so.}

## Verdict

- Delta thresholds: {all < 0.1 | <table> at <n>% — investigation needed}
- Connector stable: {yes | no}
- CDC lag stable: {< 5 min | spike at HH:MM}
- Audit chain verified: {yes | no}

Days remaining until exit gate: {7 - N}

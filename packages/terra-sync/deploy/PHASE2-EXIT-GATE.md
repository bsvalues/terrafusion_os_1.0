# Phase 2 Exit Gate

Phase 2 of TerraFusion Sync v4 exits when all exit criteria below are green across 7 consecutive observation days. Phase 3 (consumer cutover + decommission) starts only after this gate passes.

## Why 7 days

- CDC snapshot + catch-up from `pacs_oltp` takes several hours. The first day after bring-up is expected to have non-zero delta.
- Benton PACS receives daily overnight batch updates. We need at least one full weekly cycle to observe Monday/Wednesday-heavy roll changes.
- 7-day stability is the threshold the Sync v4 control plane design spec §9 ("Shadow-mode parallel run") locks in.

## Pre-requisites

Before starting the 7-day observation window:

1. Phase 1 exit gate passed (see `PHASE1-EXIT-GATE.md`).
2. MSSQL `pacs_oltp` restored + CDC enabled per `mssql/README.md`.
3. Debezium connector `benton-harris-pacs-v1` registered and status = `RUNNING`.
4. Four Arroyo pipelines deployed and `RUNNING` (`normalize-property`, `normalize-cama`, `normalize-comparable-sales`, `normalize-property-assessments`).
5. RisingWave `shadow-schema.sql` applied to TerraFusion Postgres.
6. Four RisingWave MVs + sinks deployed.
7. Initial load converged: `SELECT COUNT(*) FROM shadow."Properties" WHERE "CountyId" = '19190019-1919-1919-1919-191919191919'` > 0 and approximately equal to `SELECT COUNT(*) FROM public."Properties" WHERE "CountyId" = ...`.

## Daily observation — automated

Cron on the observation host (dev or staging):

```cron
# Daily at 02:00 UTC — runs terra-sync-shadow-diff, logs JSON report.
0 2 * * * /opt/terrafusion/bin/run-shadow-diff.sh
```

`run-shadow-diff.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
cd /opt/terrafusion/packages/terra-sync
DATE=$(date -u +%F)
LOG_DIR=/var/log/terrafusion
mkdir -p "$LOG_DIR"
DATABASE_URL="postgres://postgres:${PG_PW}@postgres:5432/terrafusion" \
  cargo run --release -p terra-sync-shadow-diff \
  > "$LOG_DIR/shadow-diff-$DATE.json" \
  2> "$LOG_DIR/shadow-diff-$DATE.log"
```

(`PG_PW` comes from the operator's shell environment, not hardcoded here. For production, this script is replaced by a Kubernetes CronJob pointing at a Vault-sourced secret.)

## Daily observation — human record

Each day, commit an evidence file at
`docs/superpowers/evidence/2026-04-XX-sync-v4-shadow-parity-day-N.md`
(template below). The commit message is:

```
evidence(sync-v4): shadow parity day N — YYYY-MM-DD
```

Template:

```markdown
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
```

## Exit criteria — all green for 7 consecutive days

1. `delta_percent < 0.1` on every table, every day.
2. Debezium connector state stays `RUNNING` (no failed task restarts that require human intervention).
3. CDC lag stays < 5 minutes (peak lag window during overnight batch may go higher transiently; sustained > 5 min is a failure).
4. `sync.audit` event count > 0 each day, chain verifies clean.

## On exit-gate pass

Commit the milestone:

```bash
git commit --allow-empty -m "milestone(sync-v4): PHASE 2 exit gate PASSED — 7-day shadow parity achieved

Benton Harris PACS → Debezium → Kafka → Arroyo → RisingWave → Postgres
shadow schema. 7 consecutive days of delta_percent < 0.1 across
Properties, CamaCharacteristics, PropertyAssessments. No connector
failures, CDC lag stable under 5 min, audit chain verified daily.

Phase 3 (consumer cutover + decommission of PacsCanonicalizer,
PacsToTerraFusionSyncService, TerraFusion.Sync raw-SQL bypasses,
HarrisPACSSyncBackgroundService) begins after this commit.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

## On exit-gate fail

If any exit criterion fails on any of the 7 days:
1. Diagnose the root cause (Debezium logs, Arroyo UI, RisingWave query plan, Postgres slow log).
2. Fix the issue.
3. Restart the 7-day observation window from day 1. Do NOT skip ahead.

## What this gate does NOT prove

- **Schema evolution resilience**: Phase 2.1 adds ALTER TABLE drills.
- **Amendment propagation**: Phase 3 adds a signed amendment flow in pacscontract.v1 that requires separate integration evidence.
- **Multi-county generalization**: Phase 4 adds a second county and its own exit gate.
- **Bidirectional writeback safety**: Phase 6. Currently writeback is globally forbidden under pacscontract.v1.

## Evidence directory

All 7 daily evidence files + the milestone commit live under:
```
docs/superpowers/evidence/2026-04-XX-sync-v4-shadow-parity-day-N.md
```

Keep the directory for audit purposes — FISMA-HIGH + NIST 800-53 AU-11 retention.

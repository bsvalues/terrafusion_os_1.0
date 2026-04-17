# Benton Harris PACS — MSSQL Dev Restore + CDC Runbook

This runbook provisions the MSSQL 2022 dev container from docker-compose.dev.yml with the Benton County Harris PACS snapshot, enables SQL Server CDC on the tables Phase 2 replicates, and creates the Debezium service account.

## Prerequisites

- `docker compose -f docker-compose.dev.yml up -d mssql` running
- Backup file `pacs_oltp_backup_2026_01_15_170502_7994110.bak` (≈102 GB) available. For local dev, the canonical source location is `E:\PACS\` on the Benton workstation. Copy it into `deploy/mssql/backups/` or bind-mount from an absolute path by editing the `mssql` service's `volumes:` in docker-compose.dev.yml.

## 1. Restore the database

```bash
# From the repo root
cp /path/to/pacs_oltp_backup_2026_01_15_170502_7994110.bak \
   packages/terra-sync/deploy/mssql/backups/

docker compose -f packages/terra-sync/deploy/docker-compose.dev.yml \
  exec -T mssql /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P 'TF_Pacs2026!' \
  -Q "RESTORE DATABASE pacs_oltp FROM DISK='/var/opt/mssql/backup/pacs_oltp_backup_2026_01_15_170502_7994110.bak' WITH MOVE 'pacs_oltp' TO '/var/opt/mssql/data/pacs_oltp.mdf', MOVE 'pacs_oltp_log' TO '/var/opt/mssql/data/pacs_oltp_log.ldf', REPLACE"
```

Expected: `RESTORE DATABASE successfully processed N pages`.

Note: MSSQL 2022 on Linux does not ship `mssql-tools` at `/opt/mssql-tools/bin/`; it's at `/opt/mssql-tools18/bin/sqlcmd` with TLS required. If the above path fails with "not found", substitute:

```bash
docker compose exec -T mssql /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P 'TF_Pacs2026!' -Q "..."
```

The `-C` flag trusts the self-signed server cert for local dev.

## 2. Enable CDC on the database + tables

```sql
USE pacs_oltp;
EXEC sys.sp_cdc_enable_db;

-- Tables Phase 2 replicates:
EXEC sys.sp_cdc_enable_table
  @source_schema = N'dbo', @source_name = N'property',
  @role_name = N'cdc_reader', @supports_net_changes = 0;
EXEC sys.sp_cdc_enable_table
  @source_schema = N'dbo', @source_name = N'property_val',
  @role_name = N'cdc_reader', @supports_net_changes = 0;
EXEC sys.sp_cdc_enable_table
  @source_schema = N'dbo', @source_name = N'sale',
  @role_name = N'cdc_reader', @supports_net_changes = 0;
EXEC sys.sp_cdc_enable_table
  @source_schema = N'dbo', @source_name = N'imprv',
  @role_name = N'cdc_reader', @supports_net_changes = 0;
```

Run via:
```bash
docker compose exec -T mssql /opt/mssql-tools18/bin/sqlcmd \
  -C -S localhost -U sa -P 'TF_Pacs2026!' -i /var/opt/mssql/backup/enable-cdc.sql
```

(Save the SQL above as `enable-cdc.sql` in `backups/` for convenience.)

SQL Server Agent must be running (`MSSQL_AGENT_ENABLED=true` in the compose spec ensures this); CDC requires it for the capture/cleanup jobs.

## 3. Create the Debezium service account

```sql
CREATE LOGIN debezium WITH PASSWORD = 'TF_Deb2026!';
USE pacs_oltp;
CREATE USER debezium FOR LOGIN debezium;
EXEC sp_addrolemember 'db_datareader', 'debezium';
GRANT SELECT ON SCHEMA::cdc TO debezium;
```

Minimum privileges — the Debezium connector only reads from the CDC capture tables and the base tables for snapshots. No DDL, no writes.

## 4. Verify CDC is working

```bash
docker compose exec -T mssql /opt/mssql-tools18/bin/sqlcmd \
  -C -S localhost -U sa -P 'TF_Pacs2026!' \
  -Q "USE pacs_oltp; SELECT name, is_cdc_enabled FROM sys.databases WHERE name = 'pacs_oltp'; SELECT name, is_tracked_by_cdc FROM sys.tables WHERE name IN ('property', 'property_val', 'sale', 'imprv');"
```

Expected: `is_cdc_enabled = 1` for the database; `is_tracked_by_cdc = 1` for all four tables.

Then confirm capture jobs are running:
```sql
EXEC sys.sp_cdc_help_jobs;
```
Expected: two rows — `cdc.pacs_oltp_capture` and `cdc.pacs_oltp_cleanup`, both `status: 1` (running).

## 5. Passwords — DEV ONLY

`TF_Pacs2026!` and `TF_Deb2026!` are dev-only constants. Production secrets come from the sovereign-county vault per Phase 3 (Spec-Lock v2 signed amendments).

## What this runbook does NOT do

- Load the 102 GB .bak — that's a one-time manual op per operator.
- Wire the Debezium connector (Task 10).
- Validate the CDC event shape (Task 10's register.sh verifies).
- Document TLS hardening (Phase 3).

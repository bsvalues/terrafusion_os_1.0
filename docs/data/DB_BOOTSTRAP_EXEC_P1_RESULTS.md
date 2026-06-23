# WO-DATA-002A-EXEC-P1: PostgreSQL TCP Diagnosis + Archive Verification

**Work Order:** WO-DATA-002A-EXEC-P1  
**Date:** 2026-06-14  
**Type:** Diagnostic execution (read-only)  
**Prerequisite:** WO-DATA-002A plan merged (PR #1011, commit fb185161a)

---

## 1. PostgreSQL Service Status

**Two PostgreSQL instances discovered:**

| Instance | Engine | Port | Container/Service | Status |
|---|---|---|---|---|
| Docker pgvector | PostgreSQL 16.14 (Debian) | 5432 | `terrafusion-postgres-dev` (pgvector/pgvector:pg16) | RUNNING, TCP LISTENING |
| Native Windows | PostgreSQL 17.5 | 5433 | `postgresql-x64-17` Windows service | RUNNING, different password |

**Critical finding**: The development `DefaultConnection` targets `localhost:5432`, which reaches the **Docker** PostgreSQL 16, not the native Windows PostgreSQL 17 on port 5433.

## 2. TCP Connectivity

| Test | Result |
|---|---|
| `netstat -an \| findstr 5432` | `0.0.0.0:5432 LISTENING` + `[::]:5432 LISTENING` |
| `psql -h localhost -p 5432 -U postgres -c "SELECT 1"` | **SUCCESS** (tcp_ok = 1) |
| `psql -h localhost -p 5433 -U postgres` | **FAILED** (password mismatch — different instance) |

**TCP blocker status: RESOLVED.** Port 5432 accepts TCP connections from localhost. The blocker documented in prior WO-DATA work orders is no longer present — the Docker container is running and reachable.

## 3. psql Path

```
C:\Program Files\PostgreSQL\17\bin\psql.exe
```

Not in PATH. Must use full path or add to PATH.

## 4. pg_dump Path

```
C:\Program Files\PostgreSQL\17\bin\pg_dump.exe
```

Not in PATH. Must use full path or add to PATH. pg_dump version 17.5 successfully dumps from PostgreSQL 16.14 server (cross-version compatible).

## 5. Database Reachability: `terrafusion`

| Check | Result |
|---|---|
| Exists | YES |
| Size | 7,666,711 bytes (7.3 MB) |
| User tables | **0** (empty — only pg_catalog and information_schema) |
| `__EFMigrationsHistory` | **DOES NOT EXIST** |
| Schemas | None beyond system defaults |

**Critical finding**: The `terrafusion` database on the Docker PG16 instance is **empty**. It has no user tables, no migration history, no schemas. The 107-migration divergence documented in WO-DATA-001 was from a **different database state** — either:

1. The Docker container was recreated since WO-DATA-001 (Docker volumes are ephemeral unless explicitly persisted)
2. The 107 migrations were applied to a different PostgreSQL instance (possibly native PG17 on port 5433)
3. The database was manually reset

**Impact on WO-DATA-002A plan**: The archive step is still valid (proven below), but the "old contaminated DB" referenced in the plan is no longer present. The clean bootstrap can proceed against an empty `terrafusion` database — or a new `terrafusion_dev_clean` per the plan.

## 6. Database Reachability: `terrafusion_levy`

| Check | Result |
|---|---|
| Exists | **NO** |

`terrafusion_levy` does not exist on the Docker PG16 instance. This is consistent with finding #5 — if the container was recreated, the Levy database would also be gone.

**Impact**: No Levy archive needed. The Levy cross-context contamination documented in WO-DATA-001R is not present in the current state.

## 7. Full Database Inventory (Docker PG16, port 5432)

| Database | Size | User Tables | Notes |
|---|---|---|---|
| `terrafusion` | 7.3 MB | 0 | Empty — no migrations applied |
| `tfpr_dev` | 8.0 MB | 8 | Valuator Pro runtime (separate workstream) |
| `postgres` | 7.3 MB | 0 | System default |
| `template0` | 7.1 MB | 0 | System template |
| `template1` | 7.5 MB | 0 | System template |

## 8. Archive Directory

```
C:\Users\bsval\tf-db-archives\
```

Created during this execution.

## 9. Archive Execution

| Archive | Status | File | Size |
|---|---|---|---|
| `terrafusion` | **COMPLETED** | `terrafusion_archive_20260614.dump` | 878 bytes |
| `terrafusion_levy` | **SKIPPED** (database does not exist) | N/A | N/A |

The `terrafusion` archive is minimal (4 TOC entries, 878 bytes) because the database is empty. The pg_dump pipeline is proven — it successfully exports from Docker PG16 using Windows PG17 client tools.

Archive verification:
```
pg_restore --list terrafusion_archive_20260614.dump
; Archive created at 2026-06-14 09:12:57
;     dbname: terrafusion
;     TOC Entries: 4
;     Compression: gzip
;     Dump Version: 1.16-0
;     Format: CUSTOM
;     Dumped from database version: 16.14 (Debian 16.14-1.pgdg12+1)
;     Dumped by pg_dump version: 17.5
```

## 10. Stop Point

**Execution stops here.** The following are deferred to P2:

- ~~PostgreSQL TCP fix~~ (no longer needed — TCP works)
- Creating `terrafusion_dev_clean` database
- Editing `appsettings.Development.json` connection strings
- Removing LevyDbContext `DefaultConnection` fallback from Program.cs
- Applying 99 source migrations
- Running verification gates 1-6

---

## Revised Assessment for WO-DATA-002A-EXEC-P2

The plan assumed a contaminated `terrafusion` database with 107 migrations and Levy cross-context leakage. The actual state is simpler:

| Plan Assumption | Actual State | Impact |
|---|---|---|
| `terrafusion` has 107 migrations | `terrafusion` is empty (0 tables, no history) | Archive is precautionary, not protective |
| 4 Levy migrations in main DB | No Levy contamination (DB was reset) | Levy isolation fix is still needed (preventive) |
| `terrafusion_levy` exists | Does not exist | No Levy archive needed |
| PostgreSQL TCP blocked | TCP works (Docker PG16 on 5432) | No config changes needed |
| Native Windows PG17 on 5432 | Docker PG16 on 5432; native PG17 on 5433 | Connection string already targets correct instance |

**Recommended P2 adjustments:**

1. Skip the old-DB archive step (already done; DB is empty anyway)
2. Skip Levy archive step (DB doesn't exist)
3. Skip PostgreSQL TCP fix (already working)
4. Proceed directly to: connection-string updates → LevyDbContext fallback removal → `terrafusion_dev_clean` creation → migration application
5. Keep the `terrafusion` database alive for comparison (even though it's empty)

---

## Commands Run During P1

All commands were read-only diagnostics or non-destructive archive operations:

```
# Diagnostics (read-only)
netstat -an | findstr "5432"
psql -h localhost -p 5432 -U postgres -c "SELECT 1 AS tcp_ok;"
psql -c "SELECT datname, pg_database_size(datname) FROM pg_database ..."
psql -d terrafusion -c "SELECT COUNT(*) FROM __EFMigrationsHistory"  # errored: table doesn't exist
psql -d terrafusion -c "SELECT table_schema, COUNT(*) FROM information_schema.tables ..."
psql -c "SELECT version();"
psql -c "SELECT usename, usesuper FROM pg_user"
docker ps --format ... | grep postgres
cat postgresql.conf | grep listen_addresses,port

# Archive (non-destructive read from source DB)
mkdir -p C:\Users\bsval\tf-db-archives
pg_dump -h localhost -p 5432 -U postgres -Fc -f ...terrafusion_archive_20260614.dump terrafusion
pg_restore --list ...terrafusion_archive_20260614.dump
```

**No databases were created, modified, or destroyed.**

---

**Classification:** Diagnostic Execution Results  
**Next Work Order:** WO-DATA-002A-EXEC-P2 (connection-string updates, Levy fallback removal, clean DB creation, migration application)

# WO-DATA-004B-FIX — PACS Source Truth Gate

**Date**: 2026-06-16
**Branch**: `claude/wo-data-004b-pacs-source-truth` (off `origin/main` @ `900671de9`)
**Mode**: READ-ONLY source-truth inventory. No drains, import, promote, project, writeback. No MDF attach, no BAK restore, no MSSQL container start, no DB mutation, no code edits. All volume inspection via `--rm` alpine with `:ro` mounts.

**Controlling rule**: *No Sync movement until PACS source vintage is proven.*

---

## Why this gate exists

The Sync parcel pipeline filters `owner_tax_yr >= 2018`. The container the pipeline was pointed at during WO-DATA-004B-P2 (`tf-benton-wo004-sql` / `pacs_oltp_wo004_benton`) is a **Dec-2015 WO-004 identity-crosswalk evidence container** (owner_tax_yr 1980–2016) → 0 qualifying rows. This gate inventories every PACS source and decides which, if any, is the authoritative **current** source — without touching anything.

---

## 1. MSSQL containers

| Container | Image | Status | Ports | Vintage |
|-----------|-------|--------|-------|---------|
| `tf-benton-wo004-sql` | `mcr.microsoft.com/mssql/server:2019-latest` | **Exited (255)** ~1h ago | none (was 11433) | **Dec-2015 historical** (proven) |

**No MSSQL container is currently running.** `tf-benton-wo004-sql` is the only MSSQL container on the host and it is stopped. Its mounts: `/backup` ← bind `E:\PACS\Files of SQL\Files of SQL\pacs_benton_122915` (ro); data ← bind `D:\MSSQL\WO004\sql-data`.

**wo004 vintage (proven earlier this session, read-only; data is an immutable Dec-2015 snapshot):**
```
DB: pacs_oltp_wo004_benton
owner_tax_yr range            : 1980 – 2016
property.prop_create_dt range : 1900-01-01 – 2015-07-28
owner rows (total)            : 3,504,830  (all sup_num = 0)
owner rows where sup_num=0 AND owner_tax_yr >= 2018 : 0
```
Not restarted for this gate (no-MSSQL-start rule); data is immutable so the prior read-only proof stands.

---

## 2. PACS-related Docker volumes (none mounted by any container)

All three: `labels=null`, created 2026-04-02, **mounted-by = none**.

### `tf_mssql_data` — LIKELY CURRENT SOURCE — **DO NOT TOUCH**
- Mountpoint: `/var/lib/docker/volumes/tf_mssql_data/_data`
- `data/pacs_oltp.mdf` = **533.6 GB actual** (full PACS OLTP, not a small snapshot)
- Full PACS stack present: `pacs_oltp`, `pacs_lists`, `pacs_spatial`, `Benton_spatial_data`, `PACS_Training`, `CIAPS`, `TAAppSvr`, `Web_Internet_Benton`, `SSISDB` + system DBs
- ERRORLOG: `pacs_oltp` **online & recovered 2026-06-09 21:00** under SQL Server 2019
- **Vintage caveat**: last clean `CHECKDB` is 2016-04-14 (boot-page record). Size + Jun-2026 activity strongly suggest current prod, but **owner_tax_yr is UNKNOWN until queried**, which requires attaching the `.mdf` (recovery writes) — out of scope for this read-only gate.

### `tf_mssql_data_pacs` — EMPTY
- Empty scratch volume (no files).

### `pacs_baks` — Jan-2026 SATELLITE backups only — **DO NOT RESTORE**
- 2.4 GB total. `.bak` files stamped **2026-01-15**:
  `Benton_spatial_data` (2.42 GB), `pacs_spatial` (168 MB), `pacs_lists` (4.4 MB), `TAAppSvr` (2.1 MB).
- **No `pacs_oltp.bak`** — the main OLTP DB is not backed up here.

---

## 3. Host PACS backup paths — `E:\PACS\Files of SQL\Files of SQL\`

| Item | Size | Modified | Inferred vintage |
|------|------|----------|------------------|
| `pacs_benton_122915.rar` (+ extracted dir) | 2.21 GB | **2015-12-29** | Historical 2015 (the wo004 source) |
| `pacs_golive_manual-backup` (single file) | **7.39 GB** | **2023-04-27** | Possible go-live / sales source (`pacs_golive`; matches `PacsSalesConnection`). Too small to be a full 533 GB OLTP backup |
| `Backup.zip` | 6.08 GB | 2025-03-31 | Unknown — recent-ish |
| `Backup\`, `BentonData\` | — | 2026-03-27 | Auxiliary / extracted |

---

## 4. Running-source vintage queries

**Not run — there is no running MSSQL source** (`tf-benton-wo004-sql` is exited; restarting it is out of scope per the no-MSSQL-start rule, and it is the known-historical container regardless). The likely-current source (`tf_mssql_data` / `pacs_oltp`) cannot be queried without an attach, which this gate forbids. The required vintage queries (`MIN/MAX(owner_tax_yr)`, qualifying count, property/sale date ranges) are deferred to the attach/restore plan.

---

## Config linkage

Committed `appsettings.Development.json` (passwords redacted): `PacsConnection → localhost,1433 / pacs_oltp`; `PacsSalesConnection → localhost,1433 / pacs_golive`. The intended source is a `pacs_oltp` DB on **port 1433** — consistent with serving the `tf_mssql_data` volume, **not** the historical wo004 container (11433 / `pacs_oltp_wo004_benton`).

---

## Candidate Source Table

| Candidate | Evidence | Vintage | Current? | Risk | Next Safe Action |
|-----------|----------|---------|----------|------|------------------|
| `tf-benton-wo004-sql` / `pacs_oltp_wo004_benton` (stopped) | bind `pacs_benton_122915`; queried owner 1980–2016; 0 qualifying | **Dec-2015 historical** | NO | Low | Keep as historical evidence; never the Sync source |
| `tf_mssql_data` / `pacs_oltp.mdf` (volume, unmounted) | 533.6 GB mdf; ERRORLOG online Jun 9 2026; SQL 2019 | **UNCONFIRMED** (CHECKDB-2016 caveat; size ⇒ likely full prod) | **LIKELY** | **HIGH** (attach = recovery writes) | **Attach/restore plan** before any query |
| `pacs_baks` (volume) | `.bak` 2026-01-15; satellites only, **no OLTP** | Jan 2026 (satellites) | partial | Medium | Do not restore; not the OLTP source |
| `pacs_golive_manual-backup` (E:\, 7.39 GB) | single file Apr 2023; matches `pacs_golive` (sales) | Apr 2023 (inferred) | possible (sales) | Medium | Do not restore; sales-side, separate |

---

## Decision

See `PACS_SOURCE_SELECTION_DECISION.md`. Summary: **Decision D** — a current PACS source very likely exists (`tf_mssql_data` / `pacs_oltp.mdf`) but its vintage cannot be confirmed without an attach, which is out of scope here. The next work order is a safe **attach/restore plan**, not a drain.

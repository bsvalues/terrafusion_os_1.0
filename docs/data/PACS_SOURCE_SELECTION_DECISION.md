# WO-DATA-004B-FIX — PACS Source Selection Decision

**Date**: 2026-06-16 · Companion to `PACS_SOURCE_TRUTH_GATE.md` · Read-only, no mutations.

---

## Sources evaluated

| Source | Vintage | Current Sync source? |
|--------|---------|----------------------|
| `tf-benton-wo004-sql` / `pacs_oltp_wo004_benton` (stopped) | Dec-2015 historical (owner 1980–2016, 0 qualifying) | **No** — historical evidence only |
| `tf_mssql_data` / `pacs_oltp.mdf` (533.6 GB, online Jun 9 2026) | **Unconfirmed** (likely current; CHECKDB-2016 caveat) | **Likely — pending attach** |
| `pacs_baks` (Jan 2026 `.bak`) | Jan 2026 satellites only (no OLTP) | No (not the OLTP) |
| `pacs_golive_manual-backup` (Apr 2023, 7.39 GB) | Apr 2023 (sales/go-live) | No (sales-side) |

No MSSQL source is currently running, so no live vintage query was possible. The committed pipeline config targets `pacs_oltp` on port **1433** — consistent with the `tf_mssql_data` volume, not the historical wo004 container.

---

## DECISION — D

**D. Current PACS source likely exists but requires an attach/restore plan.**

- **Exact candidate**: the `tf_mssql_data` Docker volume, database **`pacs_oltp`** (`/var/opt/mssql/data/pacs_oltp.mdf`, **533.6 GB**, last online 2026-06-09 under SQL Server 2019).
- **Why not decision A**: vintage is unproven. Confirming `owner_tax_yr >= 2018` requires attaching the `.mdf` to a SQL Server, which triggers recovery writes to the production data files — explicitly out of scope for this read-only gate. The CHECKDB-2016 boot-page date means size/activity alone cannot prove the data is post-2018.
- **Why not B**: a current source almost certainly *does* exist on disk (533 GB OLTP + Jan-2026 satellite backups + an Apr-2023 go-live backup). This is not "no source available."
- **Why not C**: the candidate is not known-historical; it is unconfirmed-but-likely-current. Only `wo004` is confirmed historical.

### Do NOT (until the plan is approved)
- Do not attach `pacs_oltp.mdf`.
- Do not restore any `.bak`.
- Do not start/restart any MSSQL container.
- Do not change pipeline filters.
- Do not run any drain.

### Required next work order

**WO-DATA-004B-FIX1 — PACS Current Source Attach/Restore Plan**
Plan (do not execute) a safe way to make `tf_mssql_data` / `pacs_oltp` queryable **without risking the original volume** — e.g. attach against a **copy** of the volume on an isolated SQL 2019 instance, or restore a copy of the relevant `.bak` — then run the vintage gate **before** any TerraFusion drain:

```sql
SELECT MIN(owner_tax_yr), MAX(owner_tax_yr),
       SUM(CASE WHEN sup_num=0 AND owner_tax_yr>=2018 THEN 1 ELSE 0 END) AS qualifying
FROM owner;
```

Only if that returns post-2018 qualifying rows does the data lane proceed to a controlled drain.

---

## Final Report

```
RESULT                : Source-truth inventory complete. No running current source. Current candidate identified. Decision D.
WORKTREE              : C:\Users\bsval\tf-pacs-source-truth
BRANCH                : claude/wo-data-004b-pacs-source-truth (off origin/main 900671de9)
FILES CHANGED         : 2 (docs/data/PACS_SOURCE_TRUTH_GATE.md, docs/data/PACS_SOURCE_SELECTION_DECISION.md)
SOURCES_CHECKED       : 1 MSSQL container (wo004, stopped) + 3 volumes (tf_mssql_data, tf_mssql_data_pacs, pacs_baks) + host E:\PACS backups
RUNNING_MSSQL_SOURCE  : none (tf-benton-wo004-sql is Exited)
LIKELY_CURRENT_SOURCE : tf_mssql_data / pacs_oltp.mdf (533.6 GB, online 2026-06-09, SQL 2019) — vintage UNCONFIRMED
BACKUP_SOURCES        : pacs_baks (Jan-2026 satellites, no OLTP); pacs_golive_manual-backup (Apr-2023, sales); Backup.zip (Mar-2025); pacs_benton_122915 (Dec-2015 historical)
OWNER_YEAR_RANGE      : wo004 = 1980–2016 (proven historical); current candidate = UNKNOWN (needs attach)
QUALIFYING_OWNER_ROWS : wo004 = 0; current candidate = unknown
PROPERTY_DATE_RANGE   : wo004 = 1900-01-01 .. 2015-07-28; current candidate = unknown
DECISION              : D — current source likely exists (tf_mssql_data/pacs_oltp); requires attach/restore plan
MUTATIONS             : none
PR                    : draft (docs-only)
NEXT_WORK_ORDER       : WO-DATA-004B-FIX1 — PACS Current Source Attach/Restore Plan
```

# WO-DATA-004B-FIX2B — PACS Current Source Attach Results

**Work Order:** WO-DATA-004B-FIX2B  
**Date:** 2026-06-17  
**Status:** ATTACH SUCCEEDED — read-only vintage queries complete

---

## Container

| Field | Value |
|---|---|
| Container name | `tf-pacs-current-verify` |
| Image | `mcr.microsoft.com/mssql/server:2022-latest` |
| SQL Server version | 2022 (RTM-CU25, 16.0.4255.1) |
| Port | **21433** |
| Restart policy | `--restart=no` |
| Mounts | `D:/TerraFusion_PACS_Verification/source-copy:/mnt/pacs-copy` only |

**Note:** SQL Server 2019 was attempted first but failed — MDF is database version 957 (SQL Server 2022 format); SQL Server 2019 supports only up to version 904. SQL Server 2022 container was used instead.

---

## Files Attached

| File | Path in container | Size (bytes) |
|---|---|---|
| MDF | `/mnt/pacs-copy/pacs_oltp.mdf` | 572,901,883,904 |
| LDF | `/mnt/pacs-copy/pacs_oltp_log.ldf` | 1,073,618,944 |

Attached as database name: **`pacs_oltp_verify`** (DB ID = 5)

---

## Attach Status

**ATTACH_SUCCESS** — `CREATE DATABASE pacs_oltp_verify ON ... FOR ATTACH` returned DB ID 5 with no errors.

---

## Source Volume Integrity

Container mounts inspected via `docker inspect`:

```
type=bind  src=D:/TerraFusion_PACS_Verification/source-copy  dst=/mnt/pacs-copy
```

- `tf_mssql_data` Docker volume: **NOT mounted**
- E: drive: **NOT mounted**
- Original PACS source: **NOT touched**

---

## Mutations

- No drains run
- No imports run
- No promotions run
- No TerraFusion DB mutations
- No writes to `tf_mssql_data` volume
- SQL Server may have written recovery logs to the LDF during attach (standard behavior — these writes are to the D: copy only, not the source volume)

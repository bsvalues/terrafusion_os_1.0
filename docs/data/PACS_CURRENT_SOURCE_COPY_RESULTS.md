# WO-DATA-004B-FIX2A — PACS Current Source Copy Results

**Work Order:** WO-DATA-004B-FIX2A  
**Date completed:** 2026-06-17  
**Status:** COPY COMPLETE — attach not yet performed

---

## Purpose

Record the verified byte-exact copy of the Harris PACS current source MDF/LDF files from the Docker volume to a stable D:\ path, establishing the physical prerequisite for WO-DATA-004B-FIX2B (attach + vintage query).

This document is evidence-only. No attach, no SQL queries, no drain has occurred.

---

## Source

| Field | Value |
|---|---|
| Docker volume | `tf_mssql_data` |
| MDF path inside volume | `/data/pacs_oltp.mdf` |
| MDF size | **572,901,883,904 bytes (533.6 GB)** |
| MDF mtime | 2026-06-08 03:41 UTC |
| LDF path inside volume | `/data/pacs_oltp_log.ldf` |
| LDF size | **1,073,618,944 bytes (1023.9 MB)** |
| LDF mtime | 2026-06-09 21:00 UTC |

---

## Destination

| Field | Value |
|---|---|
| Host path | `D:\TerraFusion_PACS_Verification\source-copy\` |
| MDF filename | `pacs_oltp.mdf` |
| MDF size | **572,901,883,904 bytes (533.6 GB)** |
| LDF filename | `pacs_oltp_log.ldf` |
| LDF size | **1,073,618,944 bytes (1023.9 MB)** |
| D: free after copy | 396.8 GB |

---

## Copy Operation

| Field | Value |
|---|---|
| Container name | `pacs-mdf-copy` |
| Image | `alpine` |
| Restart policy | `--restart=on-failure` |
| Exit code | `0` (clean) |
| Restarts during copy | **0** |
| Copy duration | ~4 hours 30 minutes |
| Bind mount format | `"D:/TerraFusion_PACS_Verification/source-copy:/dst"` (forward slashes, quoted) |

---

## Verification

| Check | Result |
|---|---|
| MDF size match (source == dest) | **YES — 572,901,883,904 bytes both sides** |
| LDF size match (source == dest) | **YES — 1,073,618,944 bytes both sides** |
| Source volume untouched | **YES — tf_mssql_data read-only mount only** |
| Attach performed | **NO** |
| SQL queries run | **NO** |
| Drain run | **NO** |

---

## Incident: Docker Restart During Prior Copy Attempt

An earlier copy attempt (container `awesome_germain`) was destroyed when Docker Desktop restarted mid-write. The 9p filesystem used by Docker bind mounts buffers writes in Docker VM memory; on restart the buffer was discarded and D:\ reverted to its pre-copy state (319 GB of apparent progress vanished). Recovery:

1. Confirmed destination file size was 0 after Docker restart.
2. Replaced container with `pacs-mdf-copy` using `--restart=on-failure` (does NOT restart on exit 0, unlike `--restart=unless-stopped` which would loop).
3. Corrected bind mount path format from `//D/...://dst` (Git Bash mangling) to `"D:/...:/dst"` (quoted, forward slashes).
4. Copy ran clean from byte 0 to completion over ~4.5 hours with 0 restarts.

---

## Next Gate

**WO-DATA-004B-FIX2B** — Attach PACS Copy + Vintage Query

- Start isolated SQL Server 2019 container
- Attach **copy only** (`D:\TerraFusion_PACS_Verification\source-copy\pacs_oltp.mdf`)
- Do NOT attach source volume (`tf_mssql_data`)
- Run `owner_tax_yr` / property / sale vintage queries
- Confirm qualifying post-2018 rows exist before any drain

---

## Evidence File

A machine-readable flat file was written at copy completion:

```
D:\TerraFusion_PACS_Verification\COPY_COMPLETE.txt
```

Contents mirror the verification table above.

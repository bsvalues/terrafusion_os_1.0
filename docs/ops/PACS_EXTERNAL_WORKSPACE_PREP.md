# WO-OPS-002 — External PACS Verification Workspace Prep

**Date**: 2026-06-16
**Mode**: Storage prep only. No PACS copy, no MDF attach, no BAK restore, no SQL container, no drain, no Docker-volume access, no TerraFusion/PACS DB mutation.

---

## Drives found

| Drive | Model (BusType) | Disk # | Size | Role |
|-------|-----------------|--------|------|------|
| C: | SAMSUNG MZVL81T0HFLB (NVMe, internal) | 0 | 952.8 GB | Windows / laptop — not a candidate |
| D: | SanDisk Extreme 55AE (**USB external**) | 1 | 931.5 GB | **selected → wiped & reformatted** |
| E: | Seagate BUP Portable (**USB external**) | 2 | 4657.2 GB | **PACS source + backups — NEVER touched** |

`E:` hosts `E:\DockerData\docker_data.vhdx` (the 533 GB `pacs_oltp` source) plus `Files of SQL` backups. It was confirmed untouched throughout (still `Backup Plus` / exFAT, ~456 GB free).

## Selection & format

- **Operator confirmed D: backups exist**, including the specific 9.3 GB `TerraFusion_WA_InitialSeed.mdf` (a TerraFusion WA seed DB, content dated 2026-05-09) which was flagged and confirmed backed up before wiping.
- D: was previously exFAT "Extreme SSD" with active 2026 assessor working files (all confirmed backed up).
- **Format executed by operator in an elevated `diskpart`** (the Claude session was non-elevated; disk format requires Administrator):
  ```
  select disk 1 ; select partition 1 ; format fs=ntfs label=TF_PACS_VERIFY quick ; assign letter=D
  ```
- Identity guarded to Disk 1 / SanDisk Extreme throughout; Disk 2 (Seagate / E:) never selected.

## Result

| Field | Value |
|-------|-------|
| Drive | D: |
| Label | **TF_PACS_VERIFY** |
| Filesystem | **NTFS** |
| Size | 931.5 GB |
| Free | **931.4 GB** |
| Health | Healthy |

## Workspace created

```
D:\TerraFusion_PACS_Verification\
  ├── source-copy\   (for the read-only copy of pacs_oltp.mdf + .ldf)
  ├── sql-data\      (isolated SQL 2019 container data mount target)
  ├── logs\
  ├── hashes\        (sha256 of source vs copy)
  └── reports\
```

## Capacity check

- Free: **931.4 GB** → **PREFERRED met** (≥900 GB; min was ≥650 GB).
- `pacs_oltp.mdf` (533.6 GB) + `pacs_oltp_log.ldf` (~1 GB) copy ≈ 535 GB.
- Headroom after copy ≈ ~396 GB for SQL attach / recovery / log growth. Sufficient.

## Copy readiness

**READY.** NTFS, ample space, dedicated workspace, source isolated on a different physical disk (E:). NTFS chosen (not exFAT) for SQL Server MDF/LDF behavior.

---

## Final Report

```
RESULT           : External PACS verification workspace prepared on D:. Copy-ready.
DRIVES_FOUND     : C: (internal NVMe, Windows) · D: (USB SanDisk Extreme 931.5GB) · E: (USB Seagate 4657GB = PACS source+backups, untouched)
SELECTED_DRIVE   : D: (SanDisk Extreme 55AE, Disk 1, USB) — backups confirmed by operator
FORMAT_STATUS    : formatted (operator-run elevated diskpart; session was non-admin)
FILESYSTEM       : NTFS
FREE_SPACE       : 931.4 GB (PREFERRED >=900GB met)
WORKSPACE_PATH   : D:\TerraFusion_PACS_Verification\{source-copy,sql-data,logs,hashes,reports}
COPY_READY       : YES (needs ~535GB; ~396GB headroom after copy)
NEXT_WORK_ORDER  : WO-DATA-004B-FIX2 — PACS Current Source Copy + Attach Verification
```

**Controlling rule still in force**: no Sync movement until PACS source vintage is proven. FIX2 (copy `pacs_oltp` read-only → attach the COPY on an isolated SQL 2019 → run `MIN/MAX(owner_tax_yr)`) is the next gated step; each of its actions (copy, container start, attach, first drain) requires explicit operator approval per `PACS_ATTACH_RESTORE_SAFETY_CHECKLIST.md`.

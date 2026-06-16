# WO-DATA-004B-FIX1 — PACS Current Source Attach/Restore Plan

**Date**: 2026-06-16
**Branch**: `claude/wo-data-004b-fix1-attach-plan` (off `origin/main` @ `a0cd60c0b`)
**Mode**: PLANNING ONLY. No MDF attach, no BAK restore, no MSSQL container start, no 533 GB copy, no PACS/TerraFusion mutation, no drain/import/promote/project, no code edits. All inputs gathered via `--rm` alpine `:ro` mounts and read-only host inspection.

**Controlling rule**: *No Sync movement until PACS source vintage is proven. The original 533 GB source must never be attached directly.*

---

## 1. Exact source files (the current-source candidate)

In Docker volume `tf_mssql_data` (physically on `E:\DockerData` via the Docker WSL data-disk symlink), path `/var/opt/mssql/data/`:

| File | Size (actual) | Last modified | Notes |
|------|---------------|---------------|-------|
| `pacs_oltp.mdf` | **533.6 GB** | 2026-06-08 | primary data file |
| `pacs_oltp_log.ldf` | **~1.0 GB** (1023.9 MB) | 2026-06-09 | transaction log |
| secondary `.ndf` / FILESTREAM | **none** | — | confirmed: only mdf+ldf for pacs_oltp |

ERRORLOG: `pacs_oltp` was online and recovered cleanly **2026-06-09 21:00** under SQL Server **2019**. The DB-engine version for the copy MUST be SQL Server 2019 (matching) to avoid an irreversible on-attach upgrade.

**Total to copy: ~535 GB (mdf + ldf).**

---

## 2. Safe target location — ⚠️ BLOCKED: no drive has enough free space

This is the **#1 prerequisite and approval gate**. A 535 GB copy needs ≥ ~600 GB free (copy + working headroom). Current free space:

| Drive | Size | Free | Enough for 535 GB copy? |
|-------|------|------|--------------------------|
| C: | 953 GB | **28 GB** | No |
| D: | 932 GB | **233 GB** | No |
| E: | 4.6 TB | **163 GB** | No (and source already lives here, in `E:\DockerData`) |
| Docker volumes total | — | 603.7 GB used | copying to a new volume grows `E:\DockerData` — E: lacks the space |

**No current target can hold the copy.** Execution (FIX2) cannot start until one of:
1. **Add a dedicated external/secondary disk** with ≥ 600 GB free (recommended — isolates the copy entirely).
2. **Free ≥ ~400 GB on E:** (so a new Docker volume or `E:\` path can hold it), or **≥ ~310 GB on D:** then target a `D:\` path.

The target MUST NOT be inside `tf_mssql_data` and MUST NOT overwrite the original.

---

## 3. Copy strategy (source is a Docker volume, not a host path)

`robocopy` cannot read a Docker named volume directly. The copy runs through a read-only container mount:

```
# READ-ONLY source mount; TARGET is a fresh location with >=600 GB free
docker run --rm \
  -v tf_mssql_data:/src:ro \
  -v <TARGET_PATH_OR_NEW_VOLUME>:/dst \
  alpine sh -c '
    cp -av /src/data/pacs_oltp.mdf     /dst/pacs_oltp.mdf
    cp -av /src/data/pacs_oltp_log.ldf /dst/pacs_oltp_log.ldf
  '
```

- **Integrity**: after copy, `sha256sum` both files at source (`:ro`) and target; compare. (533 GB hash ≈ 30–60 min each side.)
- **Throughput**: ~535 GB at ~100–200 MB/s ≈ **45–90 min** copy + hashing.
- **Failure handling**: if copy/hash mismatches or aborts, delete the partial target copy and retry; never touch the source.
- **Source stays `:ro`** the entire time — the original `tf_mssql_data` volume is never written.

(Windows `robocopy /Z /J` is the alternative only if the volume is first surfaced to a host path; the container-mount `cp` above avoids that extra step.)

---

## 4. Isolated SQL Server attach strategy (against the COPY only)

| Item | Value |
|------|-------|
| Container name | `tf-pacs-current-verify` (new, dedicated) |
| Image | `mcr.microsoft.com/mssql/server:2019-latest` (match source engine) |
| Data mount | the **COPY** location from §3 (new volume or host bind) → `/var/opt/mssql/data` |
| Port | **21433** → 1433 (avoids 1433 intended-config + 11433 wo004) |
| Attach | `CREATE DATABASE pacs_oltp ON (FILENAME=.../pacs_oltp.mdf), (FILENAME=.../pacs_oltp_log.ldf) FOR ATTACH;` |

- On-attach recovery writes hit the **COPY only** — the original is untouched.
- READ_ONLY attach is not assumed: an unclean log forces recovery first. Attach normal, then optionally `ALTER DATABASE pacs_oltp SET READ_ONLY` once recovered. Either way it is the copy.
- Engine MUST be 2019 — a newer engine performs an irreversible compat upgrade on attach.

---

## 5. Fallback restore strategy — ⚠️ NOT AVAILABLE for pacs_oltp

- `pacs_baks` contains **only satellite** `.bak` (Jan-2026: `Benton_spatial_data`, `pacs_spatial`, `pacs_lists`, `TAAppSvr`) — **no `pacs_oltp.bak`**.
- `pacs_golive_manual-backup` (Apr-2023) is the sales/go-live DB, **not** the current OLTP, and is older.
- The Dec-2015 `pacs_benton_122915` is the historical wo004 source — **must not be used**.

**Conclusion: there is no current `pacs_oltp` backup to restore. The MDF copy (§3) is the only path to the current OLTP.** A restore fallback does not exist for OLTP; it would only apply to satellite DBs, which are not what the vintage gate needs.

---

## 6. Vintage queries after attach

See `PACS_CURRENT_SOURCE_VINTAGE_QUERY_PLAN.md` (read-only SQL: DB list, owner min/max + qualifying `>=2018`, property date range, sale date range).

---

## 7. Success / fail decision (post-vintage)

- **A — current/post-2018 proven** (qualifying owner rows > 0): proceed to a controlled parcel drain rerun (separate WO; still bounded TopN).
- **B — historical only** (no post-2018 rows): STOP. Do **not** adjust pipeline filters. Source is not current.
- **C — attach/restore fails**: STOP, preserve logs, do not retry against the original.

---

## 8. Safety controls

No drain · no writeback · no source mutation · no original-volume attach · no delete/drop of source · no filter change · no import/promote/project · engine-version match (2019) · source mounted `:ro` only.

---

## 9. Approval gates (each requires explicit operator go)

1. **Before securing ≥600 GB space** (external disk vs free-up D:/E:) — required first; nothing proceeds without it.
2. **Before copying the 533 GB MDF** (time + space committed).
3. **Before starting the `tf-pacs-current-verify` SQL container.**
4. **Before attaching the copied DB.**
5. **Before the first drain** after vintage is proven (only if Decision A).

---

## Next work order

**WO-DATA-004B-FIX2 — PACS Current Source Attach/Restore Execution** (executes §3–§6 after gate 1–4 approvals; produces the vintage result and Decision A/B/C).

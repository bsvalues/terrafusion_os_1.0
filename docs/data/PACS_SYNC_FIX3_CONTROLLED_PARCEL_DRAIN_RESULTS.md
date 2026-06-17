# WO-DATA-004B-FIX3 — Controlled Parcel Drain Results

**Work Order:** WO-DATA-004B-FIX3  
**Date:** 2026-06-17  
**Status:** BLOCKED — D: copy invalidated and re-copy in progress; drain gate not open

---

## Mission

Run one tightly bounded controlled parcel pipeline drain:
- TopN ≤ 100
- Verified PACS source: `pacs_oltp_verify` (SQL Server 2022, port 21433, D: copy only)
- Target: `terrafusion_dev_clean` (PostgreSQL Docker PG16)
- Parcel endpoint only

---

## Copy Evidence — INVALIDATED (superseded by RE-COPY below)

The original D: copy completed at `2026-06-17 13:29:10 UTC` (logged in `pacs-mdf-copy` container).
**That evidence is no longer current.** The `pacs-mdf-copy` container restarted when Docker Desktop
restarted (this is expected behavior for `--restart=on-failure` containers when the Docker daemon
restarts — the container was still running during the daemon restart, so Docker started it fresh).
The container began re-copying from byte 0, overwriting the completed 572 GB copy. It was stopped
at 92,185,821,184 bytes (85.85 GB of 533.6 GB) — an incomplete, unusable partial file.

### Prior D: State at Invalidation (2026-06-17 ~11:32 AM local)

| Item | Value |
|---|---|
| pacs_oltp.mdf on D: | 92,185,821,184 bytes (85.85 GB) — PARTIAL, OVERWRITTEN |
| pacs_oltp_log.ldf on D: | 1,073,618,944 bytes — **intact, matches target** |
| tf_mssql_data source volume | **UNCHANGED** — only mounted read-only |

**Operational truth at this point:**

```
PACS source: EXISTS (tf_mssql_data volume intact)
Correct source: tf_mssql_data
Verification copy: INCOMPLETE (85.85 GB / 533.6 GB)
Attach: BLOCKED
Drain: BLOCKED
```

---

## RE-COPY (FIX3-COPY-RETRY, 2026-06-17)

### Pre-Copy State Confirmed

| Check | Result |
|---|---|
| Partial MDF deleted | `DELETED: pacs_oltp.mdf removed` (PowerShell Remove-Item confirmed) |
| LDF status | 1,073,618,944 bytes — **intact, matches target, KEPT** |
| D: free space | ~844 GB (sufficient for 533 GB MDF) |
| Source MDF in tf_mssql_data | 572,901,883,904 bytes (confirmed via read-only alpine container) |
| tf-pacs-current-verify stopped | **YES** — was holding exclusive file handle on pacs_oltp.mdf name, blocking creation |

**Root cause of creation failure:** SQL Server in `tf-pacs-current-verify` held an open file handle
to `pacs_oltp.mdf` with an exclusive share mode. Even after Windows deleted the file's directory
entry (via PowerShell `Remove-Item`), the kernel-level name lock remained until all handles closed.
Docker Desktop's 9p VirtioFS translated this as "File exists" on `cp` and "No such file or
directory" on `dd`/`touch` — contradictory errors, both caused by the same Windows handle lock.
Fix: stopped the SQL Server container to release the handle.

### Copy Container Configuration

| Setting | Value |
|---|---|
| Container name | `pacs-mdf-copy` |
| Image | `alpine` |
| Command | `rm -f /dst/pacs_oltp.mdf && cp /src/data/pacs_oltp.mdf /dst/pacs_oltp.mdf && echo "COPY DONE $(date)"` |
| Source | `tf_mssql_data:/src:ro` (read-only volume mount) |
| Destination | `D:\TerraFusion_PACS_Verification\source-copy:/dst` (bind mount) |
| Restart policy | `--restart=on-failure` |
| Started | 2026-06-17 ~18:47 UTC |

### Copy Started — Status at Launch

| Metric | Value |
|---|---|
| RestartCount | **0** |
| MDF size at t+10s | 1,271,660,544 bytes — growing |
| Container status | Up, running |

### Target Sizes

| File | Target bytes |
|---|---|
| pacs_oltp.mdf | 572,901,883,904 |
| pacs_oltp_log.ldf | 1,073,618,944 |

Copy in progress. Monitor every 20 minutes. Do not attach until copy completes and size
matches, and operator explicitly approves.

---

## Preflight Results (from initial FIX3 attempt)

### 1. API Runtime Config — VERIFIED

| Setting | Value | Status |
|---|---|---|
| DefaultConnection | `Host=127.0.0.1;Database=terrafusion_dev_clean;...;Port=5432` | ✅ Correct |
| PacsConnection | `Server=localhost,21433;Database=pacs_oltp_verify;...` | ✅ Aligned to verified source |
| PacsSalesConnection | `Server=localhost,21433;Database=pacs_oltp_verify;...` | ✅ Aligned to verified source |
| DefaultCounty.Id | `4ec6e187-f053-4397-b87c-95d0ef9e99aa` | ✅ Benton |
| TF_SKIP_DEV_SEEDERS | `true` | ✅ Dev seeders suppressed |
| ASPNETCORE_ENVIRONMENT | `Development` | ✅ |

### 2. PACS Vintage — VERIFIED (from FIX2B, unchanged)

| Metric | Value |
|---|---|
| DB | `pacs_oltp_verify` (will be re-attached from D: copy after completion) |
| `max_owner_tax_yr` | 2026 |
| Qualifying rows (`sup_num=0, year≥2018`) | **809,396** |
| `max_sl_dt` | 2026-01-13 |
| `post_2018_sales` | 62,042 |

### 3. Pre-Drain Row Counts (captured before any drain)

| Table | Pre-Count |
|---|---|
| `legacy_pacs_raw.property` | 0 |
| `truth_pacs.parcel_spine` | 0 |
| `canonical_tf.tf_parcel` | 0 |
| `sync_bridge.load_batch` | 4 |
| `sync_bridge.source_xref` | 0 |

---

## BLOCKER 1 — DI Registration Gap (RESOLVED — Program.cs updated, not yet committed)

Three services were missing from `Program.cs`. Added (operator-approved):

```csharp
builder.Services.AddScoped<
    TerraFusion.Core.Sync.PacsProperty.IPacsPropertyLandingService,
    TerraFusion.Data.Services.LegacyPacsRaw.PacsPropertyLandingService>();

builder.Services.AddScoped<
    TerraFusion.Core.Sync.PacsParcelTruth.IPacsParcelSpineTruthPromoter,
    TerraFusion.Data.Services.TruthPacs.PacsParcelSpineTruthPromoter>();

builder.Services.AddScoped<
    TerraFusion.Core.Sync.PacsParcelCanonical.IPacsParcelCanonicalProjector,
    TerraFusion.Data.Services.CanonicalTf.PacsParcelCanonicalProjector>();
```

---

## BLOCKER 2 — D: Copy Invalidated (ACTIVE — re-copy in progress)

See RE-COPY section above. Do not proceed to attach or drain until:
1. Copy container exits 0
2. `pacs_oltp.mdf` size = 572,901,883,904 bytes
3. `pacs_oltp_log.ldf` size = 1,073,618,944 bytes
4. Container did not restart after exit 0
5. Operator approves attach

---

## Source Integrity

- `tf_mssql_data` Docker volume: **NOT mutated** — mounted read-only for copy
- Original PACS source: **NOT touched**
- TerraFusion DB (`terrafusion_dev_clean`): **NOT mutated** — no drain ran
- No manual SQL executed
- No fake seeders ran
- No other lanes called

---

## Current Operational State

```
PACS source (tf_mssql_data):  INTACT
Verification copy (D:):       IN PROGRESS (~0.2% at copy start)
tf-pacs-current-verify:       STOPPED (released file handle for copy)
terrafusion_dev_clean:        CLEAN (all tables at 0)
API (port 5047, Debug build): RUNNING — Program.cs DI fix applied
Drain:                        BLOCKED until copy completes + operator approves attach
```

---

## Next Steps (in order)

1. **Monitor copy** every 20 min — container status, RestartCount, MDF size, D: free space
2. **Completion gate** — confirm MDF size = 572,901,883,904 bytes, RestartCount stable at 0
3. **Write COPY_COMPLETE.txt** to `D:\TerraFusion_PACS_Verification\`
4. **Operator approves attach** — re-start tf-pacs-current-verify pointing to complete D: copy
5. **Verify vintage** — query pacs_oltp_verify for max owner_tax_yr, qualifying rows
6. **Run drain** — `POST /api/sync/doctrine/drain/parcel` with TopN=100

**Do not proceed to any step without completing the prior step and operator approval for attach.**

# BENTON_DEMO_SALES_STALL_DIAGNOSIS

**Work Order:** WO-DATA-FINALIZE-SALES-001X  
**Date:** 2026-06-22  
**Operator:** WO-DATA-FINALIZE-SALES-001 / bsvalues  
**DB Target:** terrafusion_benton_demo @ localhost:5433  
**PACS Source:** pacs_oltp_verify @ localhost:21433 (read-only)

---

## RESULT

**STALLED / ZOMBIE BATCH.** Sales drain (WO-DATA-FINALIZE-SALES-001) started at 21:01:59 PDT, streamed 56,500 rows from PACS over 5 minutes (21:02–21:07), then blocked indefinitely at `rdr.ReadAsync()`. The curl 2-hour timeout fired at ~23:01 PDT, cancelling the ASP.NET `CancellationToken`. The `OperationCanceledException` propagated uncaught through `PacsSaleLandingService`, leaving load_batch `10821864-...` permanently `IN_PROGRESS`. Zero gate results, zero truth rows, zero canonical rows.

---

## DB_STATE

Collected 2026-06-22 ~23:30 PDT (post-stall):

| Table | Count |
|-------|-------|
| `legacy_pacs_raw.sale` | 56,500 (zombie batch only) |
| `truth_pacs.sale` | 0 |
| `canonical_tf.tf_sale` | 0 |
| `sync_bridge.load_batch` (sale, IN_PROGRESS) | 1 |
| `sync_bridge.load_batch` (sale, COMPLETED) | 0 |
| `sync_bridge.promotion_gate_result` (sale batch) | 0 |
| `canonical_tf.tf_parcel` | 83,326 ✓ |
| `canonical_tf.tf_owner` | 97,062 ✓ |
| `canonical_tf.tf_improvement` | 100,144 ✓ |
| `canonical_tf.tf_land` | 87,767 ✓ |

Prior lanes (parcel, owner, improvement, land) are **untouched** by this failure.

---

## ZOMBIE_BATCH

```
LoadBatchId:  10821864-0e1b-4361-94a6-ccd468fe799e
SourceFamily: PACS_OLTP
Status:       IN_PROGRESS  ← permanent zombie; will never self-resolve
StartedAt:    2026-06-22 21:01:59 PDT
CompletedAt:  (null)
RowsExtracted:(null)
ErrorSummary: (null)
```

`PacsSaleLandingService` catch block: `when (ex is not OperationCanceledException)` — the OCE from curl timeout cancellation is **excluded**, so `batch.Status` was never written to `FAILED`. This is a **systemic bug** affecting all 11 landing services, not just sales.

A rerun without first clearing this batch will leave two simultaneous IN_PROGRESS sale batches in the load_batch table. No constraint prevents this.

---

## RAW_SALE_COUNT

56,500 rows in `legacy_pacs_raw.sale`, all from batch `10821864-...`:

| Metric | Value |
|--------|-------|
| first_landed_at | 2026-06-22 21:02:14 PDT |
| last_landed_at | 2026-06-22 21:07:03 PDT |
| streaming_window | ~5 minutes |
| distinct_chg_of_owner_ids | 45,288 |
| distinct_prop_ids | 34,516 |
| distinct_prop_id_yr_pairs | 44,520 |
| earliest_sl_dt | 1973-03-24 |
| latest_sl_dt | 2026-01-12 |
| pre_2018 | 466 |
| post_2018 | 56,027 |
| null_sl_dt | 7 |

SlCountyRatioCd distribution from landed rows:

| Code | Count |
|------|-------|
| NULL | 29,166 |
| 100 | 13,745 |
| 200 | 8,944 |
| 300 | 3,535 |
| 400 | 568 |
| 27 | 374 |
| 9 | 122 |

**56,500 is NOT the full corpus.** The reader stalled before EOF; no gate ran, no sale-code-distribution gate wrote to promotion_gate_result.

---

## PACS_JOIN_COUNT

Full-corpus JOIN query (`dbo.sale INNER JOIN dbo.chg_of_owner_prop_assoc ON chg_of_owner_id`) produces:

| Metric | Value |
|--------|-------|
| `COUNT(dbo.sale)` | 425,251 |
| `COUNT(dbo.chg_of_owner_prop_assoc)` | 440,400 |
| **JOIN result (full corpus)** | **440,274** |
| post-2018 (sl_dt >= 2018-01-01) | 75,678 |
| pre-2018 (sl_dt < 2018-01-01) | 361,481 |
| null sl_dt | 3,115 |
| distinct prop_ids in copa | 90,317 |

The drain landed 56,500 / 440,274 = **12.8%** of the full corpus before stalling.

---

## PACS_QUERY_FINDING

**Full-corpus SQL (from `SqlServerPacsSaleSource.StreamSalesAsync`, `_topN = null`):**

```sql
SELECT s.chg_of_owner_id,
       copa.prop_id,
       CAST(COALESCE(YEAR(s.sl_dt), YEAR(GETDATE())) AS smallint) AS prop_val_yr,
       CAST(0 AS smallint) AS sup_num,
       s.sl_county_ratio_cd,
       s.wac_cd,
       s.sl_ratio_type_cd,
       s.sl_dt,
       s.sl_price,
       s.adjusted_sl_price AS adj_sl_price
FROM dbo.sale s
INNER JOIN dbo.chg_of_owner_prop_assoc copa
    ON copa.chg_of_owner_id = s.chg_of_owner_id
ORDER BY s.chg_of_owner_id DESC, copa.prop_id
```

Key observations:
1. **No TOP N, no WHERE** — full 440,274-row JOIN is materialized and sorted by SQL Server before any row streams to the client.
2. **ORDER BY is unconditional** — it is always present even for full-corpus runs. For TopN bounded runs, DESC ordering is intentional (surface recent sales first). For full-corpus, `ORDER BY chg_of_owner_id DESC` forces SQL Server to sort all 440,274 rows through tempdb before the first row is sent.
3. **CommandTimeout = 600** governs only `ExecuteReaderAsync` (cursor open time). Once the cursor opens and `ReadAsync` begins streaming, this timeout no longer applies. Mid-stream stalls from SQL Server tempdb I/O or TCP/WSL relay pressure are NOT covered.
4. **No socket-level read timeout** is configured in the `SqlConnection` (no `ConnectRetryCount`, no `Connection Timeout` for I/O, no application-layer deadline on `ReadAsync`).
5. **sl_county_ratio_cd**: 388,495 of 425,251 sale rows (91.4%) are NULL in PACS. The landed 56,500 rows show 29,166 NULL (51.6%) — the high-chg_of_owner_id end has more modern sales, explaining the proportional difference.

---

## STALL_ROOT_CAUSE

**Primary cause:** `ORDER BY chg_of_owner_id DESC, copa.prop_id` on a 440,274-row join with no index hint forces SQL Server to:
1. Execute the full hash join (dbo.sale × dbo.chg_of_owner_prop_assoc → 440,274 rows)
2. Sort the entire result in tempdb before returning the first row to the `SqlDataReader`

The reader cursor opened quickly (streaming started at 21:02), producing 56,500 rows (the already-sorted leading segment) in 5 minutes. Then the tempdb/sort or the WSL TCP relay stalled mid-stream. PACS held the cursor open without sending EOF. `ReadAsync(cancellationToken)` blocked indefinitely.

**Secondary cause (zombie batch):** When the curl 2h timeout fired, ASP.NET cancelled the request `CancellationToken`. This propagated to `rdr.ReadAsync(cancellationToken)` → `OperationCanceledException`. `PacsSaleLandingService.LandSalesAsync` has:

```csharp
catch (Exception ex) when (ex is not OperationCanceledException)
```

The OCE is excluded from this catch, so `batch.Status` was never written to `FAILED` or `CANCELLED`. The `LoadBatch` row is permanently stuck at `IN_PROGRESS`.

**This same zombie pattern affects all 11 landing services.**

---

## RERUN_STRATEGY

**CANNOT rerun from current state.** Reasons:
1. Zombie batch `10821864-...` is `IN_PROGRESS` — a rerun would create a second IN_PROGRESS batch.
2. `legacy_pacs_raw.sale` has no unique constraint on `(ChgOfOwnerId, PropId, PropValYr)` — rerun would insert 56,500 duplicate rows on top of existing rows, corrupting Sale-S1.
3. No `full_corpus_lane_result` table exists in `terrafusion_benton_demo` — the resume mechanism is a no-op; drain always restarts from Sale-S1.

**Required precondition for any rerun:** Restore S4 snapshot (`terrafusion_benton_demo_S4_post_land.dump`, 1.36 GB) to reset DB to post-land clean state. This eliminates the zombie batch and the 56,500 partial rows.

**Recommended rerun approach (Option A — minimum change, highest probability of success):**

Remove `ORDER BY` from the full-corpus query path in `SqlServerPacsSaleSource`. The sort is only needed for TopN proof runs (to surface recent/canonical-eligible records first). Full-corpus has no ordering requirement — `PacsSaleLandingService` counts rows in the streaming loop, no ordering dependency.

```csharp
// Change in SqlServerPacsSaleSource.StreamSalesAsync:
var orderClause = _topN.HasValue ? "ORDER BY s.chg_of_owner_id DESC, copa.prop_id" : "";

var sql = $@"
    SELECT {topClause}s.chg_of_owner_id,
           ...
    FROM dbo.sale s
    INNER JOIN dbo.chg_of_owner_prop_assoc copa
        ON copa.chg_of_owner_id = s.chg_of_owner_id
    {dateFilter}
    {orderClause}";
```

Without `ORDER BY`, SQL Server streams the hash join result directly without tempdb sort materialization. The 440,274-row stream should complete uninterrupted.

**Option B (more robust, more work):** Paginate the full-corpus query in chunks of N rows by `chg_of_owner_id` range (e.g., 50,000 per chunk). Each chunk is a bounded query with its own CommandTimeout. Eliminates the single-large-cursor problem entirely. Requires more code change and a new source type or parameter.

**Recommendation:** Option A first. If the stall recurs on a subsequent run (suggesting the tempdb sort is not the sole cause), escalate to Option B.

---

## CODE_CHANGE_REQUIRED

Two code changes are required before the next rerun:

### Change 1 — Remove ORDER BY from full-corpus query (SqlServerPacsSaleSource)

**File:** `backend/src/TerraFusion.Data/Services/PacsSources/SqlServerPacsSaleSource.cs`

Change lines 74–93 so that `ORDER BY` is only emitted when `_topN.HasValue`:

```csharp
var topClause   = _topN.HasValue ? $"TOP {_topN.Value} " : "";
var dateFilter  = _topN.HasValue ? "WHERE s.sl_dt >= '2018-01-01'" : "";
var orderClause = _topN.HasValue ? "ORDER BY s.chg_of_owner_id DESC, copa.prop_id" : "";

var sql = $@"
    SELECT {topClause}s.chg_of_owner_id,
           copa.prop_id,
           CAST(COALESCE(YEAR(s.sl_dt), YEAR(GETDATE())) AS smallint) AS prop_val_yr,
           CAST(0 AS smallint) AS sup_num,
           s.sl_county_ratio_cd,
           s.wac_cd,
           s.sl_ratio_type_cd,
           s.sl_dt,
           s.sl_price,
           s.adjusted_sl_price AS adj_sl_price
    FROM dbo.sale s
    INNER JOIN dbo.chg_of_owner_prop_assoc copa
        ON copa.chg_of_owner_id = s.chg_of_owner_id
    {dateFilter}
    {orderClause}";
```

### Change 2 — Catch OperationCanceledException in ALL 11 landing services

**Pattern to fix in all landing services:**

```csharp
// BEFORE (in all 11 services):
catch (Exception ex) when (ex is not OperationCanceledException)
{
    batch.Status = "FAILED";
    ...
    await _db.SaveChangesAsync(CancellationToken.None);
}

// AFTER — add a dedicated OCE catch BEFORE the existing catch:
catch (OperationCanceledException)
{
    batch.Status = "CANCELLED";
    batch.CompletedAt = DateTime.UtcNow;
    batch.ErrorSummary = "Cancelled by caller (request timeout or explicit cancellation).";
    await _db.SaveChangesAsync(CancellationToken.None).ConfigureAwait(false);
    throw; // re-throw so the controller sees the cancellation
}
catch (Exception ex) when (ex is not OperationCanceledException)
{
    batch.Status = "FAILED";
    ...
}
```

**Affected files (all 11 landing services):**
- `PacsSaleLandingService.cs`
- `PacsParcelLandingService.cs`
- `PacsOwnerLandingService.cs`
- `PacsAccountLandingService.cs`
- `PacsImprovementLandingService.cs`
- `PacsImprovementDetailLandingService.cs`
- `PacsImprovementAttrLandingService.cs`
- `PacsLandDetailLandingService.cs`
- `PacsPropertyValLandingService.cs`
- `PacsPropSuppAssocLandingService.cs`
- `PacsWashPropOwnerValLandingService.cs`

Both changes should go in the same PR. The OCE fix is the higher-priority safety change; the ORDER BY fix is the primary performance fix for sales.

---

## DB_CLEANUP_REQUIRED

Before rerunning sales drain:

1. **Restore S4 snapshot** — authoritative clean state post-land.
   ```bash
   pg_restore -h localhost -p 5433 -U postgres -d terrafusion_benton_demo \
     --clean --if-exists \
     "C:/Users/bsval/benton-snapshots/terrafusion_benton_demo_S4_post_land.dump"
   ```
   This clears `legacy_pacs_raw.sale` (56,500 rows), the zombie batch from `sync_bridge.load_batch`, and resets all sale-related tables to zero.

2. **Do NOT manually update/delete the zombie batch** — restoring S4 handles it cleanly and atomically. Manual SQL manipulation of load_batch risks foreign key inconsistency.

3. **Verify post-restore state** before rerunning:
   - `legacy_pacs_raw.sale` COUNT = 0
   - `sync_bridge.load_batch WHERE "SourceFamily"='PACS_OLTP' AND "Status"='IN_PROGRESS'` = 0
   - `canonical_tf.tf_parcel/tf_owner/tf_improvement/tf_land` counts match S4 values (83,326 / 97,062 / 100,144 / 87,767)

---

## NEXT_WORK_ORDER

**WO-DATA-FINALIZE-SALES-002**

Scope:
1. Implement Change 1 (remove ORDER BY from full-corpus path) and Change 2 (OCE catch) in `fix/land-drain-propsupp-bulk-source` worktree.
2. Build the worktree API (rebuild DLL).
3. Restore S4 snapshot to `terrafusion_benton_demo`.
4. Verify restore state matches S4 baseline.
5. Submit sales full-corpus drain: `POST /api/sync/doctrine/drain/sales` with `{"fullCorpus":true,"operatorName":"WO-DATA-FINALIZE-SALES-002"}` — no curl timeout (fire-and-forget + separate status polling).
6. Monitor via DB queries until `canonical_tf.tf_sale > 0` and batch `Status = 'COMPLETED'`.
7. Write `docs/data/BENTON_DEMO_SALES_FULL_RUN_RESULTS.md`.
8. Commit and push branch; open PR targeting `main`.

**Target corpus:** 440,274 JOIN rows (sales full corpus). Expected tf_sale rows: subset of post-2018 / qualified sales per doctrine promotion rules.

**GEOM-011C hard block remains in effect.** Do not start geometry lane.

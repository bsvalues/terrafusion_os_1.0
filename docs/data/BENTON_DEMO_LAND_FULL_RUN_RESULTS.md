# BENTON_DEMO_LAND_FULL_RUN_RESULTS

Work Order: WO-DATA-FINALIZE-LAND-001  
Operator: bsvalues  
Date: 2026-06-22  
Worktree: C:\Users\bsval\tf-data-finalize-002 (branch: fix/improvement-varchar32-widen)

---

## Summary Fields

| Field | Value |
|-------|-------|
| RESULT | **SUCCEEDED** |
| DB_TARGET | terrafusion_benton_demo (PostgreSQL 17, port 5433) |
| ENDPOINT | POST /api/sync/doctrine/drain/land |
| FULL_CORPUS | true (explicit JSON body: `{"fullCorpus":true,"operatorName":"WO-DATA-FINALIZE-LAND-001"}`) |
| TOPN | null / omitted |
| ROWS_LANDED | 87,767 |
| ROWS_PROMOTED | 87,767 |
| ROWS_CANONICALIZED | 87,767 |
| GATE_STATUS | 34 PASS, 0 failures |
| QUARANTINE_STATUS | delta=0 (before=2,048,684, after=2,048,684 — all pre-existing, none from land lane) |
| DEV_CLEAN_TOUCHED | NO |
| PACS_MUTATED | NO (pacs_oltp_verify read-only throughout) |
| ERRORS | None in final run (see Prior Failures below) |
| DURATION | 3,900 sec (~65 min) |

---

## Pre-Drain Baseline (from WO-DATA-FINALIZE-S3 snapshot)

| Table | Pre-Drain Count |
|-------|----------------|
| truth_pacs.land_current | 0 |
| canonical_tf.tf_land | 0 |
| canonical_tf.tf_parcel | 83,326 |
| canonical_tf.tf_owner | 97,062 |
| canonical_tf.tf_improvement | 100,144 |
| canonical_tf.tf_sale | 0 |

---

## Post-Drain Counts (confirmed from DB 2026-06-23 ~17:45 PDT)

| Table | Post-Drain Count |
|-------|----------------|
| truth_pacs.land_current | 87,767 |
| canonical_tf.tf_land | 87,767 |
| canonical_tf.tf_parcel | 83,326 (unchanged) |
| canonical_tf.tf_owner | 97,062 (unchanged) |
| canonical_tf.tf_improvement | 100,144 (unchanged) |
| canonical_tf.tf_sale | 0 (not yet drained — awaiting operator auth) |

---

## Batch Pipeline (this run — started 16:35 PDT)

| # | Stage | Status | Extracted | Promoted | Start PDT | End PDT |
|---|-------|--------|-----------|----------|-----------|---------|
| 1 | Owner-Seed-S1 | COMPLETED | 809,396 | 809,396 | 16:35:30 | 16:57:08 |
| 2 | Parcel-S1 | COMPLETED | 95,810 | 95,810 | 16:57:13 | 16:58:47 |
| 3 | Parcel-Spine (truth) | COMPLETED | 95,810 | 83,326 | 16:58:52 | 17:00:16 |
| 4 | Parcel-Canonical | COMPLETED | 83,326 | 83,326 | 17:00:22 | 17:04:19 |
| 5 | Supp-S1 (PropSuppAssoc) | COMPLETED | 774,728 | 774,728 | 17:04:26 | 17:20:30 |
| 6 | Land-Stage | COMPLETED | 87,767 | 87,767 | 17:20:42 | 17:34:36 |
| 7 | Land-Truth | COMPLETED | 87,767 | 87,767 | 17:34:47 | 17:36:48 |
| 8 | Land-Canonical | COMPLETED | 87,767 | 87,767 | 17:37:01 | 17:40:13 |

**Drain completed: 17:40:13 PDT on 2026-06-22**

Note: One additional FAILED batch (16:31:31–16:35:19) was a prior aborted resume attempt, manually marked FAILED. It did not produce any rows and does not affect this run's results.

---

## Bridge Table Totals (post-drain)

| Table | Count |
|-------|-------|
| sync_bridge.load_batch | 92 (cumulative, all runs) |
| sync_bridge.source_xref | 1,055,119 |
| sync_bridge.promotion_gate_result | 335 |

---

## Gate Summary

- **Total gates fired**: 34
- **PASS**: 34
- **FAIL / WARN**: 0
- **Recent failures**: none

---

## Code Fix Applied This Run

**File**: `backend/src/TerraFusion.API/Controllers/DoctrineDrainController.cs`  
**Stage**: Supp-S1 (PropSuppAssoc fetch)  
**Problem**: Full-corpus mode used `KeyedSqlServerPacsPropSuppAssocSource` which issued 83,326 individual MSSQL round-trips. Previous run timed out at 35 min.  
**Fix**: Full-corpus mode now uses `SqlServerPacsPropSuppAssocSource(topN: null, filterToQualified: true)` — single bulk fetch.  
**Result**: Supp-S1 completed in 16 min (17:04→17:20) vs prior timeout.

This is the same pattern as PR #1060 (improvement drain, merged 2026-06-22T22:00:14Z, commit `77452e9f3`).

---

## Prior Failures (context)

| Failure | Cause | Resolution |
|---------|-------|------------|
| First run: Supp-S1 TaskCanceledException | 83k MSSQL round-trips; HTTP client dropped at 35 min | Bulk source fix applied |
| Resume attempts | `full_corpus_lane_result` table does not exist in terrafusion_benton_demo; resume hint silently dropped | Accepted: drain re-ran from Owner-Seed-S1 with fix in binary |

---

## Resume Mechanism Note

`DoctrineDrainController.BuildResumeContextAsync` requires a `LaneResultId` pointing to a row in `sync_bridge.full_corpus_lane_result`. That table does not exist in `terrafusion_benton_demo`. Without a valid `LaneResultId`, the `resumeFromStage` parameter is cleared to null and the drain always restarts from the beginning (Owner-Seed-S1). This is expected behaviour for this DB state.

---

## Non-Land Lane Impact

- **tf_parcel**: unchanged (83,326)
- **tf_owner**: unchanged (97,062)
- **tf_improvement**: unchanged (100,144)
- **tf_sale**: unchanged (0) — sales drain NOT started, awaiting operator authorization

---

## PACS Source

- **Connection**: pacs_oltp_verify on port 21433 (WSL relay, read-only)
- **Mutations to PACS**: NONE
- **SA password**: not printed or committed

---

## ERRORS

None in the completed run.

---

## LOCAL_COMMIT

Pending — code fix (DoctrineDrainController.cs PropSuppAssoc bulk-source) + this evidence file to be committed on `fix/improvement-varchar32-widen` branch and PR opened to main.

---

## NEXT_WORK_ORDER

**WO-DATA-FINALIZE-SALES-001** — Full-corpus sales drain against terrafusion_benton_demo.  
**Status**: BLOCKED — awaiting explicit operator authorization.  
Operator must authorize before sales drain starts. Do not auto-start.

---

## Signed

Generated by Claude Code (claude-sonnet-4-6)  
Session: a5d542f2-721f-494e-be09-d23c827349f5  
Work order: WO-DATA-FINALIZE-LAND-001  

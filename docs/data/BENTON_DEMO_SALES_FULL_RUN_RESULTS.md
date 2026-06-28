# Benton Demo Sales Full Run Results

**WO:** WO-DATA-FINALIZE-SALES-002B  
**Date:** 2026-06-28  
**Operator:** claude-finalize-sales-full-v3-windows-restore  
**Branch:** wo/sales-002b (fresh worktree from origin/main)

---

## Summary

Full sales drain against restored S4 baseline. Source: Windows SQL Server 2019 `pacs_oltp_sales_restore` (validated, PR #1071 merged). Target: `terrafusion_benton_demo` restored from S4 snapshot.

---

## Prerequisites Verified

| Gate | Status |
|------|--------|
| PR #1071 merged (PacsSalesConnection wiring) | PASS |
| S4 snapshot exists (2.25 GB) | PASS |
| `pacs_oltp_sales_restore` DBCC PHYSICAL_ONLY | PASS |
| Sales join count validated: 440,274 | PASS |
| Fresh worktree from origin/main | PASS — `wo/sales-002b` |
| No pre-existing merge conflicts | PASS |

---

## S4 Restore (Pre-Drain State)

**Source:** `C:\Users\bsval\tf-db-archives\terrafusion_benton_demo_S4_post_land.dump` (2,252,914,854 bytes)  
**Target:** `terrafusion_benton_demo` (dropped/recreated, then restored via `pg_restore -j 4`)

| Table | Count | Expected |
|-------|-------|----------|
| `legacy_pacs_raw.property` | 766,480 | ✓ |
| `legacy_pacs_raw.owner` | 8,568,960 | ✓ |
| `truth_pacs.imprv_current` | 300,432 | ✓ |
| `truth_pacs.land_current` | 87,767 | ✓ S4 land |
| `truth_pacs.sale` | 0 | ✓ clean |
| `canonical_tf.tf_sale` | 0 | ✓ clean |
| Zombie IN_PROGRESS sales batch | 0 | ✓ no zombie |

---

## Sales Drain Execution

**Endpoint:** `POST http://localhost:${TF_API_PORT:-5046}/api/sync/doctrine/drain/sales`  
**Body:**
```json
{
  "OperatorName": "claude-finalize-sales-full-v3-windows-restore",
  "WorkingYear": 2026,
  "FullCorpus": true,
  "TopN": null
}
```

**API:** worktree `wo/sales-002b` at `localhost:5046`  
**Sales Source:** `pacs_oltp_sales_restore` @ `localhost,1433` (Windows SQL Server 2019)  
**Target DB:** `terrafusion_benton_demo` @ `localhost:5432`  
**Started:** 17:22:13 (2026-06-27)  
**Ended:** 22:38:53 (2026-06-27)  
**Duration:** 19,000 seconds (~5.28 hours)

---

## Drain Results

| Metric | Value |
|--------|-------|
| Status | **Succeeded** |
| `rowsLanded` | **440,274** (full corpus) |
| `rowsPromotedToTruth` | **94,875** |
| `rowsCanonicalized` | **90,386** |
| `rowsQuarantinedThisLane` | 4,489 |
| Gates PASS | 29 |
| Gates WARN | 2 |
| Gates FAIL | 0 |
| Quarantine before | 2,048,684 |
| Quarantine after | 2,053,173 |
| Quarantine delta | +4,489 |
| Next recommended lane | geometry (hard-blocked) |

**Batch IDs:**
- `db123ff9-f691-494d-8088-06392326b1e4`
- `a3cb4656-724e-48ac-bf39-2b5f4a39253a`
- `e2262599-37c3-4ddf-9f81-3ec1870a3d3a`
- `3a375d7c-6c37-443d-bd7b-00c0d9b24a10`
- `6d640e0e-bd7e-4b4b-ab49-08b2119e57f7`
- `7c052b6c-734a-4a51-8818-926a61ce6f98`
- `7da3e046-b95d-4805-b295-75198b709d03`

---

## Gate WARNs (not failures)

### 1. `truth-pacs-supp-aware-join` — WARN
- **Stage:** RAW_TO_TRUTH
- **Detail:** `noSuppPointer=194,757 staleSupNum=0`
- **Meaning:** 194,757 raw sale rows had no supplemental pointer match. These are valid sales with no sup record (expected behavior for many Benton sales).

### 2. `truth-pacs-sale-pre-conversion-share` — WARN
- **Stage:** RAW_TO_TRUTH
- **Detail:** `preConversion=66,473 total=94,875 threshold=5.00% actual=70.06%`
- **Meaning:** 70% of promoted truth rows are pre-ProVal-conversion sales. This is a known Benton characteristic (large historical corpus predating the 2017 ProVal conversion). Not a data quality failure — expected given the full-corpus run.

---

## Post-Run DB State

| Table | Count |
|-------|-------|
| `legacy_pacs_raw.sale` | 440,274 |
| `truth_pacs.sale` | 94,875 |
| `canonical_tf.tf_sale` | 90,386 |
| Zombie IN_PROGRESS batch | 0 |
| `terrafusion_dev_clean` | 4 rows (seed, untouched) |

---

## Operator Constraints Honored

- PACS SA password: not printed, not committed
- Original PACS source (`pacs_oltp_verify`): not touched
- `pacs_oltp_sales_restore`: read-only source (no mutations)
- Conflicted worktree (`claude/forensic-estate-audit-4kzp3e`): quarantined, not touched
- Geometry: not run
- Other lanes: not run
- `terrafusion_dev_clean`: untouched (confirmed 4 seed rows)
- No manual table mutations outside approved S4 restore

---

## Final Report

| Field | Value |
|-------|-------|
| RESULT | Succeeded |
| DB_TARGET | terrafusion_benton_demo |
| RESTORE_STATUS | PASS — S4 (87,767 land rows confirmed) |
| SALES_SOURCE | pacs_oltp_sales_restore @ localhost,1433 |
| SOURCE_CORPUS_ROWS | 440,274 |
| ENDPOINT | POST /api/sync/doctrine/drain/sales |
| FULL_CORPUS | true |
| TOPN | null |
| ROWS_LANDED | 440,274 |
| ROWS_PROMOTED | 94,875 |
| ROWS_CANONICALIZED | 90,386 |
| GATE_STATUS | 29 PASS / 2 WARN / 0 FAIL |
| QUARANTINE_STATUS | +4,489 (2,048,684 → 2,053,173) |
| ZOMBIE_BATCH_STATUS | 0 — clean |
| DEV_CLEAN_TOUCHED | No (4 seed rows, unchanged) |
| ERRORS | None |
| LOCAL_COMMIT | Pending (see below) |
| NEXT_WORK_ORDER | GEOM-011C (hard-blocked) or operator-directed |

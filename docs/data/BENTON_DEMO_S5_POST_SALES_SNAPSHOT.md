# Benton Demo S5 Post-Sales Snapshot

**WO:** WO-DATA-FINALIZE-S5  
**Date:** 2026-06-28  
**Branch:** wo/sales-002b (fresh worktree from origin/main)

---

## Summary

Post-sales-completion snapshot of `terrafusion_benton_demo`. All five data-load lanes are complete: parcel, owner-wsdor, improvement, land, and sales. Geometry remains hard-blocked (GEOM-011C).

---

## Completed Lane Counts (canonical_tf)

| Table | Count |
|-------|-------|
| `canonical_tf.tf_parcel` | 84,418 |
| `canonical_tf.tf_owner` | 97,062 |
| `canonical_tf.tf_parcel_owner_link` | 686,851 |
| `canonical_tf.tf_assessment_wsdor` | 686,820 |
| `canonical_tf.tf_improvement` | 100,144 |
| `canonical_tf.tf_improvement_feature` | 1,351,892 |
| `canonical_tf.tf_land` | 87,767 |
| `canonical_tf.tf_sale` | 90,386 |

---

## Sales Lane — Carry-Forward Warnings

These appeared in WO-DATA-FINALIZE-SALES-002B and must carry forward to the final Benton demo data completion report.

### WARN 1: `truth-pacs-supp-aware-join`
- **noSuppPointer:** 194,757 rows with no supplemental pointer match
- **Interpretation:** Valid sales with no sup record (normal for many Benton sales, not a data quality failure)

### WARN 2: `truth-pacs-sale-pre-conversion-share`
- **Pre-conversion share:** 70.06% (66,473 / 94,875 promoted rows)
- **Threshold:** ≤5.00%
- **Interpretation:** 70% of promoted truth rows are pre-ProVal-conversion sales. Known Benton characteristic (large historical corpus predating 2017 ProVal conversion). Not a data quality failure.

---

## Sales Lane Gate Summary

| Status | Count |
|--------|-------|
| PASS | 29 |
| WARN | 2 |
| FAIL | 0 |

---

## Quarantine Status

| Metric | Value |
|--------|-------|
| Quarantine delta from sales lane | +4,489 |
| Cumulative quarantine (2,048,684 → 2,053,173) | 2,053,173 |
| `sync_bridge.load_batch` QUARANTINED rows | 0 |
| `sync_bridge.load_batch` SUCCEEDED/COMPLETED rows | 81 |

---

## Zombie / Batch Hygiene

### A. Current Sales Run Health

| Check | Result |
|-------|--------|
| Sales drain status | Succeeded |
| Zombie IN_PROGRESS batch from SALES-002B | **0** |
| Active IN_PROGRESS sales batch post-drain | **0** |
| Sales batch IDs cleanly closed | Yes (7 batches, all terminal) |

The sales drain started and completed cleanly. No open/stuck batch records were created by WO-DATA-FINALIZE-SALES-002B.

### B. Historical Batch Hygiene

9 orphaned `IN_PROGRESS` records exist in `sync_bridge.load_batch`. These were **not created by SALES-002B** and are carry-forward artifacts from prior cancelled drain attempts.

| LoadBatchId (truncated) | SourceFamily | Operator | StartedAt | Status |
|------------------------|--------------|----------|-----------|--------|
| `2d59a7e5` | PACS_OLTP | claude-finalize-s4r-land-rebuild-v1 | 2026-06-26 18:35 | IN_PROGRESS |
| `37674f41` | PACS_OLTP | finalize-improvement-full-v3 | 2026-06-22 08:40 | IN_PROGRESS |
| `d70bb70a` | PACS_OLTP | finalize-improvement-full-v2 | 2026-06-22 06:07 | IN_PROGRESS |
| `4c733901` | PACS_OLTP | finalize-improvement-full-v1 | 2026-06-22 00:51 | IN_PROGRESS |
| `9dd7f995` | PACS_OLTP | claude-finalize-owner-wsdor-full-v2 | 2026-06-21 20:27 | IN_PROGRESS |
| `8852d015` | PACS_OLTP | claude-finalize-owner-wsdor-full-v1 | 2026-06-21 16:22 | IN_PROGRESS |
| `c90b40b2` | PACS_OLTP | claude-finalize-owner-wsdor-full-v1 | 2026-06-21 16:18 | IN_PROGRESS |
| `5cbb4c42` | PACS_OLTP | claude-finalize-owner-wsdor-full-v1 | 2026-06-21 16:12 | IN_PROGRESS |
| `87a6e7a6` | PACS_OLTP | claude-finalize-owner-wsdor-full-v1 | 2026-06-21 16:11 | IN_PROGRESS |

**Classification:** Historical/orphaned from prior cancelled owner-wsdor (Jun 21) and improvement (Jun 22) attempts, plus one land-rebuild cancellation (Jun 26).  
**Impact:** None — successful drains ran after these and wrote correct data. These records are metadata only.  
**S5 state:** S5 snapshot includes these historical zombie metadata records.  
**Cleanup:** Deferred — this is a snapshot WO, not a batch-repair WO.

---

## Snapshot

**File:** `C:\Users\bsval\tf-db-archives\terrafusion_benton_demo_S5_post_sales.dump`  
**Size:** 1,725,235,200 bytes (~1.725 GB)  
**Method:** `pg_dump -Fc -j 1` inside container (`docker exec terrafusion-postgres-dev pg_dump -U postgres -Fc -f /tmp/S5_post_sales.dump terrafusion_benton_demo`) → `docker cp` to host  
**Source:** `terrafusion_benton_demo` @ localhost:5432  
**Restore command:** `pg_restore -U postgres -d <target_db> -Fc -j 4 /tmp/S5_post_sales.dump`

---

## Other Checks

| Check | Result |
|-------|--------|
| `terrafusion_dev_clean` Properties count | 4 (seed data, untouched) |
| Geometry lane | Hard-blocked (GEOM-011C) |
| Any drain run | No — snapshot only |
| Any DB mutation | No — read-only verification + pg_dump only |

---

## Operator Constraints Honored

- GEOM-011C: not started
- No drain run
- No code changes
- No manual DB mutations
- PACS: not touched
- `terrafusion_dev_clean`: untouched

---

## Final Report

| Field | Value |
|-------|-------|
| RESULT | Complete |
| SNAPSHOT | `C:\Users\bsval\tf-db-archives\terrafusion_benton_demo_S5_post_sales.dump` |
| SNAPSHOT_SIZE | 1,725,235,200 bytes (~1.725 GB) |
| LANE_COUNTS | parcel=84,418 / owner=97,062 / owner_link=686,851 / wsdor=686,820 / improvement=100,144 / imprv_feature=1,351,892 / land=87,767 / sale=90,386 |
| SALES_WARNINGS | WARN1: noSuppPointer=194,757 (no supp pointer, not a failure) / WARN2: pre-conversion=70.06% (known Benton historical corpus, not a failure) |
| SALES_ZOMBIE_STATUS | 0 — sales drain created no zombie batches |
| HISTORICAL_ZOMBIE_BATCHES | 9 orphaned IN_PROGRESS records from prior owner-wsdor (Jun 21) + improvement (Jun 22) + land (Jun 26) cancelled runs; not from SALES-002B; cleanup deferred |
| QUARANTINE_STATUS | Sales delta +4,489; cumulative 2,053,173; 0 QUARANTINED batch records |
| DEV_CLEAN_TOUCHED | No (4 seed rows confirmed) |
| FILES_CHANGED | docs/data/BENTON_DEMO_S5_POST_SALES_SNAPSHOT.md |
| LOCAL_COMMIT | Pending |
| NEXT_WORK_ORDER | Operator decision — GEOM-011C checklist review before geometry full-corpus |

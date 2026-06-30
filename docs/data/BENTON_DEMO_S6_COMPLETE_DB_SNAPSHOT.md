# Benton Demo S6 Complete DB Snapshot

**WO:** WO-DATA-FINALIZE-S6  
**Date:** 2026-06-28  
**Branch:** wo/geom-011c (worktree at `C:\Users\bsval\tf-worktrees\wo-sales-002b`)

---

## Summary

Post-geometry snapshot of `terrafusion_benton_demo`. All six data-load lanes are complete:
parcel, owner-wsdor, improvement, land, sales, and geometry. This is the first fully populated
Benton demo database state.

---

## Final Lane Counts (All Layers)

### Canonical Layer

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

### Geometry Layer

| Table | Count |
|-------|-------|
| `legacy_arcgis_raw.parcel_geom` | 79,199 |
| `truth_arcgis.parcel_geom_current` | 79,199 |
| `gis_tf.tf_parcel_geom` | 79,199 |

---

## GEOM-011C Confirmation

| Metric | Value |
|--------|-------|
| `rowsLanded` | 79,199 |
| `rowsPromotedToTruth` | 79,199 |
| `rowsCanonicalized` | 79,199 |
| `rowsQuarantinedThisLane` | 0 |
| Gate status | 13 PASS / 0 WARN / 0 FAIL |
| Quarantine delta | 0 |
| Duration | 253.75 sec (~4.2 min) |
| Commit | `2fb35a117` |
| Source | ArcGIS REST, FIPS 53005, FullCorpus=true |

---

## Batch Hygiene

### Active Drain Check

| Check | Result |
|-------|--------|
| Active `IN_PROGRESS` batch from GEOM-011C | **0** — geometry drain completed cleanly |
| Geometry batches | 3 records, all terminal (`COMPLETED`) |

### Historical Zombie Batches (Carry-Forward from S5)

9 orphaned `IN_PROGRESS` records from prior cancelled runs — **unchanged from S5**.

| LoadBatchId (truncated) | SourceFamily | Operator | StartedAt |
|------------------------|--------------|----------|-----------|
| `87a6e7a6` | PACS_OLTP | claude-finalize-owner-wsdor-full-v1 | 2026-06-21 16:11 |
| `5cbb4c42` | PACS_OLTP | claude-finalize-owner-wsdor-full-v1 | 2026-06-21 16:12 |
| `c90b40b2` | PACS_OLTP | claude-finalize-owner-wsdor-full-v1 | 2026-06-21 16:18 |
| `8852d015` | PACS_OLTP | claude-finalize-owner-wsdor-full-v1 | 2026-06-21 16:22 |
| `9dd7f995` | PACS_OLTP | claude-finalize-owner-wsdor-full-v2 | 2026-06-21 20:27 |
| `4c733901` | PACS_OLTP | finalize-improvement-full-v1 | 2026-06-22 00:51 |
| `d70bb70a` | PACS_OLTP | finalize-improvement-full-v2 | 2026-06-22 06:07 |
| `37674f41` | PACS_OLTP | finalize-improvement-full-v3 | 2026-06-22 08:40 |
| `2d59a7e5` | PACS_OLTP | claude-finalize-s4r-land-rebuild-v1 | 2026-06-26 18:35 |

**Classification:** Historical/orphaned from prior cancelled owner-wsdor (Jun 21), improvement
(Jun 22), and land-rebuild (Jun 26) attempts. Not from any geometry run. Cleanup deferred.

---

## Batch Summary

| Status | Count |
|--------|-------|
| COMPLETED | 84 |
| IN_PROGRESS (historical zombies) | 9 |
| CANCELLED | 3 |
| FAILED | 5 |

---

## Quarantine Status

| Metric | Value |
|--------|-------|
| Cumulative quarantine | 2,053,173 |
| GEOM-011C quarantine delta | 0 |
| `sync_bridge.load_batch` QUARANTINED rows | 0 |

---

## Snapshot

**File:** `C:\Users\bsval\tf-db-archives\terrafusion_benton_demo_S6_complete.dump`  
**Size:** 2,507,328,204 bytes (~2.507 GB)  
**Delta from S5:** +782,092,804 bytes (~782 MB — geometry layer)  
**Method:** `pg_dump -Fc` inside container (`docker exec terrafusion-postgres-dev pg_dump -U postgres -Fc -f /tmp/S6_complete.dump terrafusion_benton_demo`) → `docker cp` to host  
**Started:** 14:16:55  
**Ended:** 14:25:14  
**Duration:** ~8 min 19 sec  
**pg_dump exit:** 0  
**cp exit:** 0  
**Restore command:** `pg_restore -U postgres -d <target_db> -Fc -j 4 /tmp/S6_complete.dump`

---

## Other Checks

| Check | Result |
|-------|--------|
| `terrafusion_dev_clean` Properties count | 4 (seed data, untouched) |
| Any drain run | No — snapshot + read-only verification only |
| Any DB mutation | No |
| ArcGIS touched | No — drain already completed before this WO |
| PACS touched | No |
| Code changed | No |

---

## Operator Constraints Honored

- PACS SA password: not printed, not committed
- Original PACS source: not touched
- ArcGIS: not touched
- No drain run
- No code changes
- No PR opened
- `terrafusion_dev_clean`: untouched (4 seed rows confirmed)
- No manual DB mutations

---

## Final Report

| Field | Value |
|-------|-------|
| RESULT | Complete |
| DB_TARGET | terrafusion_benton_demo |
| SNAPSHOT | `C:\Users\bsval\tf-db-archives\terrafusion_benton_demo_S6_complete.dump` |
| SNAPSHOT_SIZE | 2,507,328,204 bytes (~2.507 GB) |
| FINAL_LANE_COUNTS | parcel=84,418 / owner=97,062 / owner_link=686,851 / wsdor=686,820 / improvement=100,144 / imprv_feature=1,351,892 / land=87,767 / sale=90,386 / geom=79,199 |
| GEOMETRY_STATUS | Complete — 79,199 landed/promoted/canonicalized, 0 quarantined |
| GATE_STATUS | 13 PASS / 0 WARN / 0 FAIL |
| QUARANTINE_STATUS | delta=0, cumulative=2,053,173, 0 QUARANTINED batch records |
| ZOMBIE_BATCH_STATUS | 9 historical zombies (Jun 21-26, not from GEOM-011C); 0 new zombies from geometry; cleanup deferred |
| DEV_CLEAN_TOUCHED | No (4 seed rows confirmed) |
| FILES_CHANGED | docs/data/BENTON_DEMO_S6_COMPLETE_DB_SNAPSHOT.md |
| LOCAL_COMMIT | Pending |
| NEXT_WORK_ORDER | Operator decision — PR / evidence packet |

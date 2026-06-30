# Benton Demo DB — Completion Final Summary

**Date:** 2026-06-28  
**Classification:** Evidence/Canonicalization Only  
**Status:** ALL LANES COMPLETE

---

## 1. Target Database

```
terrafusion_benton_demo
```

Hosted in Docker container `terrafusion-postgres-dev` (pgvector/pgvector:pg16).  
Local Postgres at `localhost:5432`.

---

## 2. Final Lane Counts

All counts verified post-S6 snapshot.

| Lane | Canonical Table | Count |
|------|----------------|------:|
| Parcel | `canonical_tf.tf_parcel` | 84,418 |
| Owner | `canonical_tf.tf_owner` | 97,062 |
| Owner Link | `canonical_tf.tf_parcel_owner_link` | 686,851 |
| WSDOR | `canonical_tf.tf_assessment_wsdor` | 686,820 |
| Improvement | `canonical_tf.tf_improvement` | 100,144 |
| Improvement Features | `canonical_tf.tf_improvement_feature` | 1,351,892 |
| Land | `canonical_tf.tf_land` | 87,767 |
| Sales | `canonical_tf.tf_sale` | 90,386 |
| Geometry | `gis_tf.tf_parcel_geom` | 79,199 |

**Geometry layer (all three tiers):**

| Layer | Table | Count |
|-------|-------|------:|
| Raw | `legacy_arcgis_raw.parcel_geom` | 79,199 |
| Truth | `truth_arcgis.parcel_geom_current` | 79,199 |
| Canonical | `gis_tf.tf_parcel_geom` | 79,199 |

---

## 3. Source Systems

| Lane | Source System | Connection |
|------|--------------|-----------|
| Parcel, Owner, Improvement, Land | PACS OLTP (`pacs_oltp_verify`) | `localhost,21433` — Windows SQL Server 2019, Docker container `tf-pacs-current-verify` |
| Sales | Restored PACS sales DB (`pacs_oltp_sales_restore`) | `localhost,1433` — Windows SQL Server 2019, Docker container `tf-pacs-bak-restore`. PR #1071 wired `PacsSalesConnection`. |
| Geometry | ArcGIS REST API | Benton County FIPS 53005, paginated endpoint. GEOM-011 pagination + H1 hardening (feat/geom-011-arcgis-pagination, fix/geom-011b-h1-pagination-hardening) required before full-corpus run was stable. |

All sources were **read-only**. No writes to PACS or ArcGIS at any point.

---

## 4. Important Known Warnings

These are carry-forward from run results and must not be treated as failures.

### Sales Lane (WO-DATA-FINALIZE-SALES-002B)

| Warning | Value | Interpretation |
|---------|-------|---------------|
| `truth-pacs-supp-aware-join` noSuppPointer | 194,757 rows | Valid sales with no supplemental pointer. Normal Benton characteristic — many sales have no sup record. Not a data quality failure. |
| `truth-pacs-sale-pre-conversion-share` | 70.06% (66,473 / 94,875) | 70% of promoted truth rows are pre-ProVal-conversion sales. Expected for Benton's large historical corpus predating the 2017 ProVal conversion. Not a data quality failure. |

### Quarantine

| Metric | Value |
|--------|-------|
| Cumulative quarantine total | 2,053,173 |
| Sales lane delta | +4,489 |
| Geometry lane delta | 0 |
| QUARANTINED batch records | 0 |

### Zombie Batches (Historical — Deferred)

9 orphaned `IN_PROGRESS` batch records from prior cancelled runs (Jun 21–26). None from any
completed lane run. All successful drains ran after these and wrote correct data. Cleanup
deferred — these are metadata only with no downstream impact.

| SourceFamily | Operator | Date |
|-------------|----------|------|
| PACS_OLTP | claude-finalize-owner-wsdor-full-v1 (×4) | 2026-06-21 |
| PACS_OLTP | claude-finalize-owner-wsdor-full-v2 | 2026-06-21 |
| PACS_OLTP | finalize-improvement-full-v1/v2/v3 | 2026-06-22 |
| PACS_OLTP | claude-finalize-s4r-land-rebuild-v1 | 2026-06-26 |

---

## 5. Snapshots

All snapshots stored at `C:\Users\bsval\tf-db-archives\`.

| Snapshot | File | Size | Notes |
|----------|------|-----:|-------|
| S3 post-improvement | `terrafusion_benton_demo_S3_post_improvement.dump` | (see S3 evidence) | After improvement + imprv_feature lanes |
| S4 post-land | `terrafusion_benton_demo_S4_post_land.dump` | 2,252,914,854 bytes (~2.25 GB) | After land lane rebuild |
| S5 post-sales | `terrafusion_benton_demo_S5_post_sales.dump` | 1,725,235,200 bytes (~1.73 GB) | After sales lane (compressed smaller due to column data profile) |
| **S6 complete** | `terrafusion_benton_demo_S6_complete.dump` | **2,507,328,204 bytes (~2.51 GB)** | **All 6 lanes complete. First full Benton demo state.** |

**S6 restore command:**
```bash
pg_restore -U postgres -d <target_db> -Fc -j 4 /tmp/S6_complete.dump
```

---

## 6. Safety

| Check | Status |
|-------|--------|
| `terrafusion_dev_clean` untouched | CONFIRMED — 4 seed rows, unchanged throughout all runs |
| PACS source read-only | CONFIRMED — no writes to `pacs_oltp_verify` or `pacs_oltp_sales_restore` |
| ArcGIS source read-only | CONFIRMED — geometry drain reads only, no ArcGIS mutations |
| No active drains at snapshot time | CONFIRMED |
| Dump files not committed | CONFIRMED — dumps in `tf-db-archives/`, gitignored |
| Secrets not printed or committed | CONFIRMED — SA password in gitignored `appsettings.Development.local.json` only |
| Evidence docs secret scan | CLEAN — no passwords, no tokens, no connection strings |

---

## 7. Final Status

**The Benton demo database (`terrafusion_benton_demo`) is complete for all data loading lanes:**

- ✅ Parcel — 84,418 canonical parcels
- ✅ Owner / WSDOR — 97,062 owners, 686,820 WSDOR assessment rows
- ✅ Improvement — 100,144 improvements, 1,351,892 features
- ✅ Land — 87,767 land segments
- ✅ Sales — 90,386 canonical sales (440,274 raw rows landed)
- ✅ Geometry — 79,199 parcel polygons from ArcGIS

**Remaining work is deployment/promotion, not data loading.**  
The S6 snapshot is the authoritative restore point for the complete Benton demo state.

---

## Evidence Documents (This PR)

| Document | Work Order | Covers |
|----------|-----------|--------|
| `BENTON_DEMO_SALES_FULL_RUN_RESULTS.md` | WO-DATA-FINALIZE-SALES-002B | Full sales drain — 440,274 landed, 94,875 promoted |
| `BENTON_DEMO_S5_POST_SALES_SNAPSHOT.md` | WO-DATA-FINALIZE-S5 | Post-sales snapshot — 1.725 GB, all 5 pre-geometry lanes |
| `BENTON_DEMO_GEOM_FULL_RUN_RESULTS.md` | GEOM-011C | Full geometry drain — 79,199 rows, 13/13 gates pass |
| `BENTON_DEMO_S6_COMPLETE_DB_SNAPSHOT.md` | WO-DATA-FINALIZE-S6 | Final complete snapshot — 2.507 GB, all 6 lanes |
| `BENTON_DEMO_DB_COMPLETION_FINAL_SUMMARY.md` | WO-DATA-FINALIZE-PR | This document — canonical final state record |

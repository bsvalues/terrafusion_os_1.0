# Benton Demo Geometry Full Run Results

**WO:** GEOM-011C  
**Date:** 2026-06-28  
**Operator:** claude-geom-011c-benton-full  
**Branch:** wo/geom-011c (worktree at `C:\Users\bsval\tf-worktrees\wo-sales-002b`)

---

## Summary

Full-corpus geometry drain from ArcGIS REST against S5 baseline. All six data lanes are now
complete: parcel, owner-wsdor, improvement, land, sales, and geometry.

---

## Prerequisites Verified (Pre-Drain)

| Gate | Status |
|------|--------|
| Docker Desktop recovered after laptop restart | PASS |
| `terrafusion-postgres-dev` started, WAL recovery complete (~13 min) | PASS |
| `tf-pacs-current-verify` started | PASS |
| S5 restore counts intact post-recovery | PASS |
| API health on `:5046` | PASS (HTTP 200) |
| Branch `wo/geom-011c` confirmed active | PASS |
| `geom_drain_body.json`: FullCorpus=true, TopN=null | PASS |

---

## S5 Baseline Counts (Pre-Drain)

| Table | Count |
|-------|-------|
| `canonical_tf.tf_parcel` | 84,418 |
| `canonical_tf.tf_land` | 87,767 |
| `canonical_tf.tf_sale` | 90,386 |
| `canonical_tf.tf_improvement` | 100,144 |
| Geometry tables | 0 (not yet loaded) |

---

## Geometry Drain Execution

**Endpoint:** `POST http://localhost:5046/api/sync/doctrine/drain/geometry`  
**Body:**
```json
{
  "OperatorName": "claude-geom-011c-benton-full",
  "WorkingYear": 2026,
  "FullCorpus": true,
  "TopN": null
}
```

**Source:** ArcGIS REST API (Benton County FIPS 53005)  
**Target DB:** `terrafusion_benton_demo` @ `localhost:5432`  
**Started:** 02:53:45 (2026-06-28)  
**Ended:** 02:57:59 (2026-06-28)  
**Duration:** 253.75 seconds (~4.2 minutes)

---

## Drain Results

| Metric | Value |
|--------|-------|
| Status | **Succeeded** |
| `rowsLanded` | **79,199** |
| `rowsPromotedToTruth` | **79,199** |
| `rowsCanonicalized` | **79,199** |
| `rowsQuarantinedThisLane` | **0** |
| Gates PASS | **13** |
| Gates WARN | 0 |
| Gates FAIL | 0 |
| Quarantine before | 2,053,173 |
| Quarantine after | 2,053,173 |
| Quarantine delta | 0 |

**Batch IDs:**
- `eafbde28-b7b9-420b-be7d-f4db2c8430be`
- `b1f22e89-3134-440e-89fe-0ae6faa1953a`
- `d5e1b26b-32ef-42bd-9088-fb9ebbf0cc5b`

---

## Post-Drain DB State

| Table | Count |
|-------|-------|
| `legacy_arcgis_raw.parcel_geom` | 79,199 |
| `truth_arcgis.parcel_geom_current` | 79,199 |
| `gis_tf.tf_parcel_geom` | 79,199 |
| `canonical_tf.tf_parcel` | 84,418 (unchanged) |
| `canonical_tf.tf_land` | 87,767 (unchanged) |
| `canonical_tf.tf_sale` | 90,386 (unchanged) |
| `canonical_tf.tf_improvement` | 100,144 (unchanged) |

---

## All Lanes Complete — Full Picture

| Lane | Canonical Table | Count |
|------|----------------|-------|
| Parcel | `canonical_tf.tf_parcel` | 84,418 |
| Owner | `canonical_tf.tf_owner` | 97,062 |
| Owner Link | `canonical_tf.tf_parcel_owner_link` | 686,851 |
| WSDOR | `canonical_tf.tf_assessment_wsdor` | 686,820 |
| Improvement | `canonical_tf.tf_improvement` | 100,144 |
| Imprv Features | `canonical_tf.tf_improvement_feature` | 1,351,892 |
| Land | `canonical_tf.tf_land` | 87,767 |
| Sales | `canonical_tf.tf_sale` | 90,386 |
| **Geometry** | `gis_tf.tf_parcel_geom` | **79,199** |

---

## Operator Constraints Honored

- PACS SA password: not printed, not committed
- Original PACS source (`pacs_oltp_verify`): not touched
- `terrafusion_dev_clean`: not touched
- No manual table mutations
- No other lane reruns

---

## Final Report

| Field | Value |
|-------|-------|
| RESULT | Succeeded |
| DB_TARGET | terrafusion_benton_demo |
| BASELINE | S5 (post-sales) |
| SOURCE | ArcGIS REST, FIPS 53005, FullCorpus=true |
| ENDPOINT | POST /api/sync/doctrine/drain/geometry |
| ROWS_LANDED | 79,199 |
| ROWS_PROMOTED | 79,199 |
| ROWS_CANONICALIZED | 79,199 |
| ROWS_QUARANTINED | 0 |
| GATE_STATUS | 13 PASS / 0 WARN / 0 FAIL |
| QUARANTINE_STATUS | delta=0, cumulative=2,053,173 |
| DURATION | 253.75 sec |
| ALL_LANES_COMPLETE | YES |
| NEXT_STEP | Operator decision — S6 snapshot or PR |

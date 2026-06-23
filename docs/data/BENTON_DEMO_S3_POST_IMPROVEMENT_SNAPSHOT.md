# WO-DATA-FINALIZE-S3 — Post-Improvement Snapshot

**Snapshot name**: `terrafusion_benton_demo_S3_post_improvement.dump`  
**Location**: `C:/Users/bsval/tf-db-archives/terrafusion_benton_demo_S3_post_improvement.dump`  
**Taken**: 2026-06-22 07:52 PDT  
**Format**: pg_dump custom format (-Fc), compression level 6  
**Size**: **2.0 GB** (998 MB at S2 → 2.0 GB at S3, +1.0 GB improvement data)  
**Objects**: 1,552 (verified via pg_restore --list)  
**Status**: VALID

---

## DB State at Snapshot Time

All API processes and drain connections stopped before dump.  
No active non-idle connections to `terrafusion_benton_demo` at time of dump.

| Table | Count |
|---|---|
| `canonical_tf.tf_parcel` | **83,326** |
| `canonical_tf.tf_owner` | **97,062** |
| `canonical_tf.tf_parcel_owner_link` | **686,851** |
| `canonical_tf.tf_assessment_wsdor` | **686,820** |
| `canonical_tf.tf_improvement` | **100,144** |
| `canonical_tf.tf_improvement_feature` | **1,351,892** |
| `legacy_tf_unproven.unresolved_imprv_attr` | 1,872,866 (quarantine) |
| `truth_pacs.imprv_current` | 300,432 (cumulative v1+v2+v4) |
| `truth_pacs.owner_current` | 774,760 |
| `legacy_pacs_raw.imprv_attr` | 1,870,609 |
| `legacy_pacs_raw.imprv_detail` | 1,351,892 |
| `legacy_pacs_raw.imprv` | 400,576 |

---

## Snapshot Progression

| Snapshot | Taken | Size | State |
|---|---|---|---|
| S1 | (prior session) | — | post-parcel |
| S2 | 2026-06-21 ~16:17 PDT | 998 MB | post-owner-wsdor |
| **S3** | **2026-06-22 07:52 PDT** | **2.0 GB** | **post-improvement** ← current |

---

## Lanes Represented in S3

| Lane | Status |
|---|---|
| Parcel | COMPLETE |
| Owner-WSDOR | COMPLETE |
| **Improvement** | **COMPLETE** |
| Land | pending |
| Sales | pending |
| Geometry | pending / GEOM-011C locked |

---

## terrafusion_dev_clean

`terrafusion_dev_clean` is on Docker PostgreSQL (port 5432, separate instance from port 5433 native). Not accessible during this work order. No operations were directed at it. UNTOUCHED.

---

## Next

Schema PR required before land drain can run on a reproducible basis:

**WO-DATA-FINALIZE-IMPROVEMENT-001A** — Promote improvement VARCHAR(32) schema fixes:
- `WO_IMPROVEMENT_ImprvAttrValCd_Widen`
- `WO_IMPROVEMENT_TfImprovementFeature_WidenCodes`
- `WO_IMPROVEMENT_UnprovenAttr_WidenCodes`

Do not start land drain until schema PR is merged or operator explicitly approves running from worktree branch.

---

*Evidence written by TerraFusion Copilot — 2026-06-22*

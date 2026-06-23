# WO-DATA-004B-SCALE-001F — Scale Proof Final Summary

**Work Order:** WO-DATA-004B-SCALE-001F
**Date:** 2026-06-19
**Status:** COMPLETE — all five drainable lanes accepted.
**Mission:** Final evidence summary for the completed SCALE-001 run on `terrafusion_scale_proof`.

---

## 1. Scale Database

| Field | Value |
|---|---|
| Database | `terrafusion_scale_proof` |
| Type | Fresh clean PostgreSQL database |
| Migrations applied | 90 (all current) |
| Bootstrap | SCALE-001Z — clean zero-row baseline confirmed before any drain |
| `terrafusion_dev_clean` | NOT used, NOT touched (all runs verified against dev_clean post-drain) |

---

## 2. PACS Source

| Field | Value |
|---|---|
| Source database | `pacs_oltp_verify` |
| Engine | SQL Server 2022 |
| Port | `localhost:21433` (D: verified copy) |
| Origin | D: drive copy only — `tf_mssql_data` Docker volume NOT touched |
| Credential location | `appsettings.Development.local.json` (gitignored — never committed) |
| Source integrity | Source file size and existence verified before drain chain began |

---

## 3. Safety Controls

| Control | Status |
|---|---|
| PR #1051 safe-default patch | OPERATIVE — `NormalizeRequest ?? true → ?? false`; `FullCorpus=False` logged on every drain |
| JSON body used for all drains | ✓ — all drains sent `Content-Type: application/json` with explicit body |
| `FullCorpus=false` in logs | ✓ — `[Drain:parcel] Owner seed (TopN=500, FullCorpus=False)` and equivalents logged for every lane |
| `TopN` honored in logs | ✓ — TopN value appears in every drain log line; no `TopN=null` observed |
| Fake/dev seeders suppressed | ✓ — `TF_SKIP_DEV_SEEDERS` active; GPT seeding and Dossier seed both skipped at startup |
| No manual mutation SQL | ✓ — no direct DB writes; all data moved exclusively through drain endpoints |
| No code changes | ✓ — worktree at `abca83b439` (post-PR #1051 main); no source files modified |
| `terrafusion_dev_clean` isolation | ✓ — dev_clean verified unchanged after every lane |
| PACS source isolation | ✓ — `pacs_oltp_verify` (D: copy) only; original `tf_mssql_data` untouched |
| Geometry excluded | ✓ — geometry drain not run (see §6) |

---

## 4. Lane Results

### 4.1 Parcel — SCALE-001A

| Field | Value |
|---|---|
| Endpoint | `POST /api/sync/doctrine/drain/parcel` |
| TopN | 500 |
| Rows landed | 500 |
| Rows promoted | 500 |
| Rows canonicalized | 500 |
| Quarantine | 0 |
| Gates | **17/17 PASS** |
| Duration | 2.8s |
| Status | **ACCEPTED** |
| Evidence | `PACS_SYNC_SCALE_001A_PARCEL_500_RESULTS.md` |

Note: A 1-row probe run preceded the 500-row run to confirm PACS connectivity and parameter handling. The probe's 1 parcel was included in the 500-row window and upserted cleanly.

---

### 4.2 Owner-WSDOR — SCALE-001B

| Field | Value |
|---|---|
| Endpoint | `POST /api/sync/doctrine/drain/owner-wsdor` |
| TopN | 500 |
| Rows landed | 999 (500 owner + 499 wash_prop_owner_val) |
| Rows promoted | 999 (500 truth owner + 499 truth WSDOR) |
| Rows canonicalized | 1420 (421 tf_owner + 500 tf_parcel_owner_link + 499 tf_assessment_wsdor) |
| Quarantine | 0 |
| Gates | **49/49 PASS** |
| Duration | 23.4s |
| Status | **ACCEPTED** |
| Evidence | `PACS_SYNC_SCALE_001B_OWNER_WSDOR_500_RESULTS.md` |

Note: Owner-WSDOR covers two sub-lanes (owner + WSDOR assessments), so landed/promoted/canonicalized counts exceed TopN=500. The 421 unique owners for 500 parcels reflects shared ownership (LLC, joint tenancy, etc.) at ~1.19 owners/parcel average.

---

### 4.3 Improvement — SCALE-001C + R1 + R2

The improvement lane required three steps to reach acceptance on a fresh database.

#### 4.3.1 Initial drain (SCALE-001C)

| Field | Value |
|---|---|
| Endpoint | `POST /api/sync/doctrine/drain/improvement` |
| TopN | 250 |
| Rows landed | 3303 (307 imprv + 947 imprv_detail + 2049 imprv_attr) |
| Rows promoted | 307 (truth_pacs.imprv_current) |
| Rows canonicalized | 1254 (307 tf_improvement + 947 tf_improvement_feature) |
| Rows quarantined | 2049 (pre-resolution attr staging — see §5.1) |
| Known FAIL gate | `imprv-attr-key-uniqueness` — actual=3 (known PACS duplicate, stable across all runs) |
| Gates | 1 FAIL (known) / 52 PASS |
| Stop condition 6 | Triggered (2049 > threshold 1,176) |
| Duration | 48.8s |

Initial drain stopped because `unresolved_imprv_attr=2049` exceeded threshold. The drain itself succeeded (HTTP 200); the stop was operator-defined, not a system failure.

#### 4.3.2 R1 — attr-drain-1 (INCONCLUSIVE)

`POST /api/debug/attr-drain-1/run-drain` — run to resolve imprv_attr staging.

**Result:** INCONCLUSIVE. Quarantine doubled from 2049 → 4098; 0 resolved.

**Root cause:** `canonical_tf.attribute_definition` had 0 rows in both `terrafusion_scale_proof` and `terrafusion_dev_clean`. `attr-drain-1` requires canonical attribute definitions to assign `AttributeId`. Without them, it re-projects the full truth scope (296 improvements), generating more attr rows (4098) than the original sample-drain (2049), and quarantines all of them.

#### 4.3.3 R2 — ATTR-POP-1 → ATTR-POP-2 (ACCEPTED)

| Step | Endpoint | Result |
|---|---|---|
| ATTR-POP-1 | `POST /api/debug/attr-pop-1/run-populate` | 35 family-grain defs seeded; 4096/4098 attrs resolved (auto-reprojection included) |
| ATTR-POP-2 | `POST /api/debug/attr-pop-2/run-populate` | 32 value-grain defs updated; final 2 attrs resolved; 0 remaining |

**Final improvement state:**

| Metric | Value |
|---|---|
| `canonical_tf.attribute_definition` (total) | 35 |
| `canonical_tf.attribute_definition` (active) | 34 |
| `legacy_tf_unproven.unresolved_imprv_attr` | **0** |
| `canonical_tf.tf_improvement` | 307 |
| `canonical_tf.tf_improvement_feature` | 5,972 |
| Attrs with canonical AttributeId | 4,098 |
| Known PACS dup-key count | 3 (unchanged) |

**Status: ACCEPTED.** Threshold: 0 ≤ 1,176 ✓

---

### 4.4 Land — SCALE-001D

| Field | Value |
|---|---|
| Endpoint | `POST /api/sync/doctrine/drain/land` |
| TopN | 500 |
| Rows landed | 543 (land segments — multiple per parcel) |
| Rows promoted | 543 |
| Rows canonicalized | 543 |
| Quarantine | 0 |
| Gates | **34/34 PASS** |
| Duration | 22.4s |
| Status | **ACCEPTED** |
| Evidence | `PACS_SYNC_SCALE_001D_LAND_500_RESULTS.md` |

Note: 543 > TopN=500 because parcels can have multiple land segments (split lots, multiple land types). `legacy_pacs_raw.land_detail` had 289 pre-seeded rows before the land drain — these were seeded as a dependency of the improvement drain and are acceptable; `truth_pacs.land_current` and `canonical_tf.tf_land` were both 0 before the land drain and became 543 after.

---

### 4.5 Sales — SCALE-001E

| Field | Value |
|---|---|
| Endpoint | `POST /api/sync/doctrine/drain/sales` |
| TopN | 250 (conservative — prior schema-width blocker + noSuppPointer warning) |
| Rows landed | 250 |
| Rows promoted | 125 (DOR ratio doctrine filter — ~50% qualification rate, expected) |
| Rows canonicalized | 125 |
| Quarantine | 0 |
| WARN gate | `truth-pacs-supp-aware-join` — noSuppPointer=9, staleSupNum=0 (expected) |
| Gates | **30 PASS + 1 WARN** |
| Duration | 8.9s |
| Status | **ACCEPTED** |
| Evidence | `PACS_SYNC_SCALE_001E_SALES_250_RESULTS.md` |

Note: 50% promotion rate (125/250) reflects the Benton DOR ratio doctrine filter — only sales with qualifying ratio codes and year ranges are promoted to truth. The remaining 125 are not quarantined; they simply did not meet doctrine qualification. The WARN (`noSuppPointer=9`) was anticipated in the work order.

The sales promoter seeded 124 additional parcel stubs (`tf_parcel` 500 → 624) for sale records referencing parcels outside the original TopN=500 parcel drain window. This was investigated, confirmed, and accepted (see §5.5).

---

### 4.6 Geometry — EXCLUDED

| Field | Value |
|---|---|
| Status | EXCLUDED — not run |
| Reason 1 | Geometry lane is not bounded by TopN in current implementation |
| Reason 2 | Benton County ArcGIS configuration mismatch exists (county config alignment required) |
| Next step | WO-DATA-004C-GEOM-001 (slice-control design) + WO-DATA-004C-GEOM-002 (county config alignment) |

Geometry exclusion was established at the start of the SCALE-001 chain and honored through all work orders.

---

## 5. Known Observations

### 5.1 Fresh DB Improvement Sequence (CRITICAL — carry forward)

On a fresh database, the improvement lane requires this exact sequence:

```
1. POST /api/sync/doctrine/drain/improvement  (TopN=N, FullCorpus=false)
2. POST /api/debug/attr-pop-1/run-populate    (seeds family-grain attribute_definition)
3. POST /api/debug/attr-pop-2/run-populate    (seeds value-grain attribute_definition, closes loop)
4. Evaluate unresolved_imprv_attr → should be 0 or near-0
```

**Do NOT use `attr-drain-1` as the first resolution step on a fresh DB unless `attribute_definition` is already populated.** `attr-drain-1` re-projects from the full truth scope and will quarantine 100% of attrs if `attribute_definition` is empty, doubling the staging count rather than resolving it.

Both ATTR-POP endpoints include automatic reprojection (`RerunImprvCanonical=true` default). A separate `attr-drain-1` call is NOT needed when the ATTR-POP sequence is used.

### 5.2 Canonical attribute_definition Must Be Pre-Populated

`canonical_tf.attribute_definition` = 0 rows in BOTH `terrafusion_scale_proof` (fresh) AND `terrafusion_dev_clean` (FIX7B-era). The dev_clean post-drain residual of 588 `unresolved_imprv_attr` rows is also unresolvable by `attr-drain-1` for the same reason. The 1,176 threshold (2× dev_clean residual) was set against a state where `attribute_definition` was empty — the apples-to-apples comparison is post-ATTR-POP, which produces `unresolved_imprv_attr=0` on the current corpus.

### 5.3 Known PACS Duplicate Improvement Attr Tuples

The gate `imprv-attr-key-uniqueness` fires with `actual=3` — 3 six-key tuples appear more than once in the PACS source (`pacs_oltp_verify`). This count is **stable** and unchanged across all scale runs. It reflects a PACS data condition, not a TerraFusion pipeline bug. The gate status is FAIL but the lane proceeds (this is the one allowed FAIL gate per the improvement work order).

### 5.4 Sales noSuppPointer WARN

Gate `truth-pacs-supp-aware-join` fires with WARN status (`noSuppPointer=9`, `staleSupNum=0`). This means 9 sales in the TopN=250 batch had no matching supplemental pointer in PACS. This is a Benton County data condition (not all sales have supplemental records). The 9 sales were still promoted to truth. `staleSupNum=0` confirms no stale references — the 9 are simply absent from the supplemental table.

### 5.5 Sales Drain Seeds Parcels Outside Original TopN Window

The sales promoter resolves each promoted sale to its source parcel. 124 of the 125 promoted sales referenced parcels outside the original parcel-lane TopN=500 sample. The promoter seeded 124 additional parcel stubs into `canonical_tf.tf_parcel` and `sync_bridge.source_xref`.

**Proof (source_xref entity distribution post-SCALE-001E):**

| TfEntityType | Count | Source lane |
|---|---|---|
| parcel | 624 | parcel lane (500) + sales promoter (124) |
| land | 543 | land lane |
| assessment_wsdor | 499 | owner-wsdor lane |
| owner | 421 | owner-wsdor lane |
| improvement | 307 | improvement lane |
| sale | 125 | sales lane |

Source_xref delta after sales drain: +249 = 125 sales + 124 parcels ✓ (math clean).

This behavior is expected and acceptable. The 124 additional parcels are real Benton County parcels that have qualifying sales history but were not in the parcel-lane's TopN=500 window.

### 5.6 Land Raw Pre-Seeded by Improvement

`legacy_pacs_raw.land_detail` had 289 rows before the land drain ran. These were seeded as a side-effect of the improvement drain (improvement resolves land raw dependencies during its own pipeline). This is acceptable: `truth_pacs.land_current` and `canonical_tf.tf_land` were both 0 before the land drain and became 543 after. The pre-seeded raw rows did not pollute truth or canonical land tables.

---

## 6. Final Scale Status

| Lane | TopN | Status | Landed | Promoted | Canonicalized | Gates |
|---|---|---|---|---|---|---|
| parcel | 500 | ACCEPTED | 500 | 500 | 500 | 17/17 PASS |
| owner-wsdor | 500 | ACCEPTED | 999 | 999 | 1420 | 49/49 PASS |
| improvement | 250 | ACCEPTED | 3303 | 307 | 1254+attr | 1F(known)/52P + ATTR-POP resolved |
| land | 500 | ACCEPTED | 543 | 543 | 543 | 34/34 PASS |
| sales | 250 | ACCEPTED | 250 | 125 | 125 | 30P/1W(expected) |
| geometry | — | EXCLUDED | — | — | — | — |

**No full corpus run was executed.**
**No original source was mutated.**
**terrafusion_dev_clean was not touched.**
**All scale controls remained in effect throughout.**

### Cumulative terrafusion_scale_proof state at end of SCALE-001

| Table | Rows |
|---|---|
| `canonical_tf.tf_parcel` | 624 |
| `canonical_tf.tf_owner` | 421 |
| `canonical_tf.tf_parcel_owner_link` | 500 |
| `canonical_tf.tf_assessment_wsdor` | 499 |
| `canonical_tf.tf_improvement` | 307 |
| `canonical_tf.tf_improvement_feature` | 5,972 |
| `canonical_tf.tf_land` | 543 |
| `canonical_tf.tf_sale` | 125 |
| `canonical_tf.attribute_definition` | 35 (34 active) |
| `legacy_tf_unproven.unresolved_imprv_attr` | 0 |
| `sync_bridge.load_batch` | 60 |
| `sync_bridge.source_xref` | 2,519 |
| `sync_bridge.promotion_gate_result` | 264 |

---

## 7. Evidence Document Index

| Work Order | Evidence File | Status |
|---|---|---|
| SCALE-001Y | PR #1051 (`abca83b439`) — code, not a doc | Merged |
| SCALE-001Z | (Bootstrap — zero-row baseline confirmed in SCALE-001A doc) | — |
| SCALE-001A | `PACS_SYNC_SCALE_001A_PARCEL_500_RESULTS.md` | ACCEPTED |
| SCALE-001B | `PACS_SYNC_SCALE_001B_OWNER_WSDOR_500_RESULTS.md` | ACCEPTED |
| SCALE-001C | `PACS_SYNC_SCALE_001C_IMPROVEMENT_250_RESULTS.md` | STOPPED → resolved |
| SCALE-001C-R1 | `PACS_SYNC_SCALE_001C_R1_ATTR_DRAIN_RESULTS.md` | INCONCLUSIVE → root cause found |
| SCALE-001C-R2 | `PACS_SYNC_SCALE_001C_R2_ATTR_POP_RESULTS.md` | ACCEPTED (unresolved=0) |
| SCALE-001D | `PACS_SYNC_SCALE_001D_LAND_500_RESULTS.md` | ACCEPTED |
| SCALE-001E | `PACS_SYNC_SCALE_001E_SALES_250_RESULTS.md` | ACCEPTED |
| **SCALE-001F** | **`PACS_SYNC_SCALE_001_FINAL_SUMMARY.md`** | **This document** |

All evidence committed on branch `docs/wo-data-004b-scale-001-results` (commits through `907894366`).

---

## 8. Next Recommended Work Orders

| Work Order | Description | Priority |
|---|---|---|
| WO-DATA-004B-SCALE-002 | Next batch decision — larger TopN or county-scale drain planning | High |
| WO-DATA-004C-GEOM-001 | Geometry slice-control design — make geometry lane TopN-capable | High |
| WO-DATA-004C-GEOM-002 | Benton ArcGIS county config alignment — resolve county config mismatch before geometry drain | Blocker for geometry |
| WO-DATA-004B-ATTR-001 | Document canonical attribute definition bootstrap sequence as runbook — ATTR-POP-1 → ATTR-POP-2 as the required fresh-DB improvement sequence | Medium |

---

## Final Report

| Field | Value |
|---|---|
| RESULT | **SCALE PROOF COMPLETE — 5/5 drainable lanes accepted** |
| FILES_CHANGED | `docs/data/PACS_SYNC_SCALE_001_FINAL_SUMMARY.md` (this file) |
| SCALE_DB | `terrafusion_scale_proof` (fresh, clean, untouched dev_clean) |
| COMPLETED_LANES | parcel, owner-wsdor, improvement, land, sales |
| GEOMETRY_STATUS | EXCLUDED — awaiting WO-DATA-004C-GEOM-001 slice-control design |
| KNOWN_ISSUES | imprv-attr-key-uniqueness dup=3 (stable PACS condition); noSuppPointer=9 (Benton sales condition); fresh-DB ATTR-POP sequence required; sales expands tf_parcel beyond parcel-lane TopN |
| FINAL_SCALE_STATUS | **ACCEPTED** for parcel, owner-wsdor, improvement, land, sales — scale controls maintained throughout |
| PR_OR_LOCAL_ARTIFACT | `tf-scale-001z/docs/data/PACS_SYNC_SCALE_001_FINAL_SUMMARY.md` |
| NEXT_WORK_ORDERS | WO-DATA-004B-SCALE-002, WO-DATA-004C-GEOM-001, WO-DATA-004C-GEOM-002, WO-DATA-004B-ATTR-001 |
| STOP | ✓ |

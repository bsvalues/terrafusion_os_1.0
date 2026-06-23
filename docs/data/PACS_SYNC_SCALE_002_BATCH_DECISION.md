# WO-DATA-004B-SCALE-002 — Next Batch Decision Memo

**Work Order:** WO-DATA-004B-SCALE-002
**Date:** 2026-06-19
**Status:** DECIDED — ready for operator approval before first drain
**Prerequisite:** SCALE-001 accepted for all five drainable lanes
**Pacing rule:** Local commit is the gate; no GitHub PR required until milestone packet is complete.

---

## Decision Summary

| Decision | Resolution |
|---|---|
| DB baseline | **Fresh DB** (or restored post-seed snapshot) |
| Lane strategy | **Lane-by-lane** (same as SCALE-001) |
| Geometry | **Excluded** (no change) |
| Blocking issues | **None** |
| Approval gate | Operator approves this memo before any drain runs |

---

## 1. DB Baseline Decision

**Decision: Fresh DB or restored post-seed snapshot.**

Options considered:

| Option | Pros | Cons | Decision |
|---|---|---|---|
| Reuse `terrafusion_scale_proof` (current state) | No migration overhead | 5 drains of mixed SCALE-001 data already present; cross-lane bleed risk for gate accounting | REJECTED |
| Fresh `terrafusion_scale_proof` (drop and recreate) | Clean baseline; migration chain re-verified | 90 migrations must re-apply (~3 min) | PREFERRED |
| Restore post-seed snapshot | Fastest cold start if pg_dump was taken | Depends on operator having taken the snapshot after first API boot | ACCEPTABLE if snapshot exists |

**Action:** Drop and recreate `terrafusion_scale_proof`, re-apply 90 migrations, boot API once to trigger doctrine seeder, then take pg_dump before first drain.

**Why:** SCALE-001 left 624 parcels, 421 owners, 307 improvements, 543 land segments, 125 sales in the scale_proof DB. Starting SCALE-002 from that state would make delta accounting ambiguous — impossible to isolate which rows came from SCALE-002 drains vs carry-over from SCALE-001. A fresh DB gives unambiguous evidence.

---

## 2. Recommended TopN by Lane

| Lane | SCALE-001 TopN | SCALE-001 Actual Rows | SCALE-002 Proposed TopN | Notes |
|---|---|---|---|---|
| parcel | 500 | 500 | **2,500** | Anchor lane; all others follow parcel identity |
| owner-wsdor | 500 | 999 (cross-join × 1,420 assessments) | **2,500** | Actual rows will exceed TopN due to cross-join |
| improvement | 500 | 307 headers + 5,972 features | **1,000** | Most complex lane; moderate step-up |
| land | 500 | 543 (multi-segment) | **2,500** | Actual rows exceed TopN; land segments per parcel average > 1 |
| sales | 250 | 125 promoted (DOR filter ~50%) | **1,000** | Expect ~500 promoted at 50% rate |
| geometry | EXCLUDED | — | **EXCLUDED** | Awaiting WO-DATA-004C-GEOM-001 |

**Scale factor rationale:** 5× on parcel/owner/land, 2× on improvement/sales. Improvement and sales require the most manual verification (ATTR-POP sequence for improvement; DOR doctrine for sales) — stepping up conservatively.

---

## 3. Lane Strategy: Lane-by-Lane

**Decision: Lane-by-lane, same sequence as SCALE-001.**

Drain sequence:
1. **parcel** — anchor; establish parcel universe
2. **owner-wsdor** — depends on parcel identity
3. **improvement** → **ATTR-POP-1** → **ATTR-POP-2** → evaluate `unresolved_imprv_attr`
4. **land** — depends on parcel identity
5. **sales** — creates parcel stubs; run last

**Why lane-by-lane (not grouped):** Each lane has specific post-drain verification steps. Running all lanes simultaneously makes it impossible to isolate failure sources. Lane-by-lane also lets ATTR-POP run at the right time (after improvement, before land/sales interpret attr data).

---

## 4. Stop Conditions

Any of the following stops SCALE-002 drains immediately (no proceeding to next lane without operator review):

| Condition | Stop Rule |
|---|---|
| Any FAIL gate | Stop. Diagnose before proceeding to next lane. |
| Quarantine rows appear unexpectedly | Stop. Profile quarantine before proceeding. |
| `unresolved_imprv_attr` > 0 after ATTR-POP-1+2 | Stop. Do not run attr-drain-1 without operator review. |
| `terrafusion_dev_clean` is touched | CRITICAL STOP. This should never happen. |
| PACS source changes from `pacs_oltp_verify` | CRITICAL STOP. |
| API reports wrong DB target | CRITICAL STOP. Verify connection string before any drain. |
| New WARN gate not seen in SCALE-001 | Flag and document; continue only if explainable |

---

## 5. Required Preflight Checks

Before running any SCALE-002 drain, confirm all of the following:

| Preflight | Check |
|---|---|
| DB target | `terrafusion_scale_proof` — verify via psql connection + schema query |
| `terrafusion_dev_clean` isolation | Row counts unchanged (83,326 parcel / 61 sale / 137 land) |
| PACS source | `pacs_oltp_verify` on `localhost:21433` — verify via drain attempt |
| `TF_SKIP_DEV_SEEDERS=1` | Must appear in API startup log before any drain |
| Doctrine rules seeded | `doctrine_tf.*` tables non-empty after first API boot |
| `FullCorpus=false` | Explicit JSON body on every drain request |
| pg_dump taken | Post-seed snapshot exists before first drain |
| API port | `localhost:5000` (not 5046 or any other; verify before drain) |

---

## 6. Required ATTR-POP Sequence (Improvement Lane)

For any fresh database, the improvement lane MUST follow this exact sequence. This is a hard constraint, not optional:

```
POST /api/sync/doctrine/drain/improvement   (TopN=1000)
  → verify improvement headers and features landed
POST /api/debug/attr-pop-1/run-populate
  → verify attr-pop-1 row count
POST /api/debug/attr-pop-2/run-populate
  → verify attr-pop-2 row count
SELECT COUNT(*) FROM legacy_tf_unproven.unresolved_imprv_attr
  → STOP if > 0 (diagnose before proceeding)
```

**Why this order matters:** On a fresh DB, `canonical_tf.attribute_definition` is empty (0 rows). Running `attr-drain-1` against an empty `attribute_definition` produces `UNKNOWN_ATTRIBUTE` quarantine inflation — it doubles the staging count and quarantines all features as unresolved. ATTR-POP-1 and ATTR-POP-2 must first populate `attribute_definition` from PACS source data before any attr drain can resolve features.

**SCALE-001 evidence:** ATTR-POP-1 → POP-2 resolved 4,098 attrs, left `unresolved_imprv_attr = 0`.

---

## 7. Geometry Status

**Decision: Geometry remains excluded from SCALE-002.**

Reason: The geometry drain endpoint currently has no `TopN` parameter — it drains the full geometry corpus or nothing. Running a full geometry drain on a scale-proof DB without slice control is outside scope for a controlled batch proof.

**Path forward:** WO-DATA-004C-GEOM-001 (geometry slice-control design) must land before geometry is included in any scale batch. This is a code change and requires PR discipline.

---

## 8. Evidence Template Improvements (SCALE-002 mandatory)

All SCALE-002 evidence documents must follow these rules (carry-forward from SCALE-001 Codex review):

| Rule | Requirement |
|---|---|
| No literal passwords | All shell examples use `PGPASSWORD=<dev-postgres-password>`. Never embed a literal password value. |
| `promotion_gate_result` delta required | Every evidence doc includes pre/post/delta for `sync_bridge.promotion_gate_result`. |
| `source_xref` delta required | Every evidence doc includes pre/post/delta for `sync_bridge.source_xref`, broken down by entity type where relevant. |
| Parcel stub accounting required (sales) | Sales evidence must account for `tf_parcel` growth beyond parcel TopN. Source_xref entity breakdown (parcel vs sale vs other) must be shown. |
| PACS source confirmed | Every doc includes a "PACS source verified" line (`pacs_oltp_verify`, `localhost:21433`). |
| dev_clean isolation proof | Every doc includes a dev_clean unchanged table. |

---

## 9. Known Issues — None Block SCALE-002

| Observation from SCALE-001 | Status | SCALE-002 Impact |
|---|---|---|
| Duplicate PACS improvement attr tuples (3 rows) | Known PACS data condition | Not a blocker; will appear again in ATTR-POP output |
| Sales `noSuppPointer=9` WARN | Known Benton data condition | Expected again at proportionally higher count with TopN=1000 |
| `land_detail` pre-seeded by improvement drain | Expected (improvement drain seeds land_detail staging) | Document in SCALE-002C evidence; not a failure |
| `tf_parcel` exceeds parcel TopN after sales drain | Expected behavior (sales promoter seeds parcel stubs) | Account for in SCALE-002E evidence using source_xref breakdown |
| `promotion_gate_result` delta missing from SCALE-001C-R2 | Evidence gap (Codex flag) | Carry forward to SCALE-002 template — required in all docs |

---

## Final Report

| Field | Value |
|---|---|
| RESULT | DECISION MEMO COMPLETE |
| FILES_CHANGED | `docs/data/PACS_SYNC_SCALE_002_BATCH_DECISION.md` (this file) |
| RECOMMENDED_BATCH_PLAN | parcel=2500, owner-wsdor=2500, improvement=1000, land=2500, sales=1000 |
| DB_BASELINE_DECISION | Fresh DB (drop/recreate terrafusion_scale_proof, 90 migrations, post-seed pg_dump) |
| GEOMETRY_STATUS | EXCLUDED — awaiting WO-DATA-004C-GEOM-001 slice-control design |
| KNOWN_ISSUES | 3 duplicate PACS attr tuples, noSuppPointer WARN — neither blocks SCALE-002 |
| STOP_CONDITIONS | Any FAIL gate, unexpected quarantine, unresolved_imprv_attr > 0 after ATTR-POP, dev_clean touch |
| SCALE_APPROVAL_STATUS | AWAITING OPERATOR APPROVAL |
| NEXT_WORK_ORDER | SCALE-002Z — fresh DB bootstrap and post-seed snapshot |

# F2 — Parcel Debris Cleanup Evidence
<!-- WORKBENCH-V0.3 F2 cleanup evidence. Canonical record. Do NOT modify post-seal. -->

**Date**: 2026-06-09  
**Branch**: `fix/projector-delete-insert-atomicity`  
**Operator**: TerraFusion Copilot  

---

## Success Claim

**F2 removed stale canonical parcel debris and dangling owner-link associations. It did not alter source truth, PACS, or sealed domain facts.**

---

## Root Cause (from commit `cd23481db`)

`PacsParcelSpineTruthPromoter` had an idempotency bug: stale rows were keyed by `PropertyLoadBatchId` instead of `prop_id`. Multiple re-drains of the same parcels under new landing batches stacked duplicate rows in `truth_pacs.parcel_spine`:

- **684,457 total rows** / 83,326 distinct prop_id / 321 batches → **8.2× inflation**

The canonical projector (`PacsParcelCanonicalProjector`) reproduced this inflation directly into `canonical_tf.tf_parcel`, creating 3,198,979 rows from 83,326 live parcels. The F1 repair (`be087d586`) fixed the projector's FK fan-out issue but explicitly deferred tf_parcel debris pruning to F2.

---

## Protocol Miss — No Pre-Cleanup Backup

**No pre-cleanup backup table was created before the destructive delete. This was a protocol miss.**

Post-cleanup verification showed target counts correct, non-target lane counts unchanged, identity drift cleared, and sealed substrate invariants preserved.

The deleted rows are irrecoverable from this transaction alone. They can be reconstructed by re-running the canonical parcel projector from the existing `truth_pacs.parcel_spine` (which is intact and was not modified). The truth spine is the authoritative source; the deleted canonical debris is derivative.

---

## Pre-Cleanup State (confirmed via diagnostic queries)

| metric | value |
|---|---|
| `canonical_tf.tf_parcel` total | 3,198,979 |
| `sync_bridge.source_xref` live parcels | 83,326 |
| tf_parcel debris (not live) | 3,115,653 |
| `canonical_tf.tf_parcel_owner_link` total | 2,111,805 |
| owner_link live (parcel in xref) | 714,553 |
| owner_link dangling (parcel not in xref) | 1,397,252 |

Debris ratio: **38.4×** (3,198,979 / 83,326)

---

## Cleanup SQL — Final Version (`tools/sync/f2-parcel-debris-cleanup.sql`)

```sql
BEGIN;

-- Step 1: Delete dangling owner link rows
DELETE FROM canonical_tf.tf_parcel_owner_link o
WHERE NOT EXISTS (
    SELECT 1 FROM sync_bridge.source_xref x
    WHERE x."TfEntityType" = 'parcel'
      AND x."IsActive"
      AND x."TfEntityId" = o."TfParcelId"
);

-- Step 2: Delete debris tf_parcel rows
DELETE FROM canonical_tf.tf_parcel p
WHERE NOT EXISTS (
    SELECT 1 FROM sync_bridge.source_xref x
    WHERE x."TfEntityType" = 'parcel'
      AND x."IsActive"
      AND x."TfEntityId" = p."TfParcelId"
);

COMMIT;
```

**Note**: NOT EXISTS used (not NOT IN) — NOT IN on the 3.2M-row table timed out.

**Execution**: Single transaction, 119 seconds.  
**Result**: DELETE 1,397,252 (owner_link) + DELETE 3,115,653 (tf_parcel). COMMIT.

---

## Post-Cleanup State (confirmed via `tools/sync/run-f2-counts.mjs`)

| metric | value | expected | status |
|---|---|---|---|
| `canonical_tf.tf_parcel` total | 83,326 | = source_xref live | ✅ |
| source_xref live parcels | 83,326 | — | ✅ |
| tf_parcel debris | 0 | 0 | ✅ |
| distinct ParcelNumber | 83,326 | = total (no dupes) | ✅ |
| owner_link total | 714,553 | — | ✅ |
| owner_link dangling | 0 | 0 | ✅ |

---

## Domain Lane Verification (`tools/sync/run-f2-domain-verify.mjs`)

All 10 non-target domain lanes confirmed **unchanged** from Slice L baseline:

| lane | count | dangling |
|---|---|---|
| `canonical_tf.tf_land` | 87,767 | 0 |
| `canonical_tf.tf_improvement` | 99,694 | 0 |
| `gis_tf.tf_parcel_geom` | 80,075 | 0 |
| `canonical_tf.tf_assessment` | 83,326 | 0 |
| `canonical_tf.tf_assessment_bill_current` | 0 | 0 |
| `canonical_tf.tf_assessment_bill_line` | 0 | 0 |
| `canonical_tf.tf_exemption` | 5,643 | 0 |
| `canonical_tf.tf_parcel_tax_area` | 83,326 | 0 |
| `canonical_tf.tf_tax_bill_current` | 79,767 | 0 |
| `canonical_tf.tf_tax_bill_line` | 990,665 | 0 |

**All dangling checks on non-owner lanes: 0** (land, improvement, assessment, exemption, tax_area, tax_bill_line).

---

## Seal-Check (`run-seal-check-v3.mjs` → `seal-check-runner.sql`)

| gate | result |
|---|---|
| parcel-spine/live-parcel-count | ✅ PASS (83,326 = 83,326) |
| assessment/canonical-row-count | ✅ PASS (83,326) |
| assessment/no-duplicate-parcel/year | ✅ PASS |
| exemption/canonical-row-count | ✅ PASS (5,643) |
| geometry/canonical-row-count | ✅ PASS (80,075) |
| improvement/canonical-row-count | ✅ PASS (99,694) |
| jurisdiction/parcel-tax-area-count | ✅ PASS (83,326) |
| land/canonical-row-count | ✅ PASS (87,767) |
| revenue-l/all gates | ✅ PASS |
| revenue-a/amount-due, bill-count, bill-line-count | ❌ FAIL — **PRE-EXISTING** |

**Pre-existing FAIL explanation**: `tf_assessment_bill_current` and `tf_assessment_bill_line` are empty (0 rows) — confirmed in Slice L runtime verification doc (2026-06-09) before F2 ran. These tables have never been populated by any drain. F2 did not modify them.

**All F2-relevant gates PASS.** The OVERALL FAIL is pre-existing and orthogonal to this cleanup.

---

## TF Sync Doctor (`tools/sync/tf-sync-doctor.mjs`)

```
#0  Harris PACS Pack Validator      ⚠  WARN — 1 check needs county override doc (64 pass)
#1  Identity-Drift Detector         ✓  PASS — all tables clean
#2  Seal-Check Runner               ✗  FAIL — 3 revenue-a gates (pre-existing)
#3  Domain-Coverage Audit           ✓  12 SEALED, 3 LANDED_ONLY, 3 DISCOVERED_DEFERRED, 1 EMPTY_IN_SOURCE
```

**Identity-Drift: PASS** — all tables clean, including owner_link (previously WARN/deferred).

---

## Identity-Spine Endpoint — Post-F2 Verification

**Endpoint**: `POST /api/sync/workbench/identity-spine/run`  
**Timestamp**: `2026-06-09T20:18:10.3608391Z`  
**Exit code**: `0`  
**Duration**: `4,666 ms`

### Per-Table Results

| table | total | live | dangling | null_ref | verdict |
|---|---|---|---|---|---|
| `canonical_tf.tf_assessment` | 83,326 | 83,326 | 0 | 0 | **PASS** |
| `canonical_tf.tf_assessment_bill_current` | 0 | 0 | 0 | 0 | **PASS** |
| `canonical_tf.tf_assessment_bill_line` | 0 | 0 | 0 | 0 | **PASS** |
| `canonical_tf.tf_exemption` | 5,643 | 5,643 | 0 | 0 | **PASS** |
| `canonical_tf.tf_improvement` | 99,694 | 99,694 | 0 | 0 | **PASS** |
| `canonical_tf.tf_land` | 87,767 | 87,767 | 0 | 0 | **PASS** |
| `canonical_tf.tf_parcel_owner_link` | 714,553 | 714,553 | 0 | 0 | **PASS** |
| `canonical_tf.tf_parcel_tax_area` | 83,326 | 83,326 | 0 | 0 | **PASS** |
| `canonical_tf.tf_tax_bill_current` | 79,767 | 79,767 | 0 | 0 | **PASS** |
| `canonical_tf.tf_tax_bill_line` | 990,665 | 990,665 | 0 | 0 | **PASS** |
| `gis_tf.tf_parcel_geom` | 80,075 | 79,105 | 0 | 970 | **PASS** |

**OVERALL: PASS — no identity drift**

Compare to Slice L (pre-F2): owner_link was FAIL/WARN with 1,397,252 dangling. Now PASS.

---

## `KNOWN_DRIFT_DEFERRED` Update

`canonical_tf.tf_parcel_owner_link` removed from `KNOWN_DRIFT_DEFERRED` in:
- `frontend/apps/os-shell/src/pages/workbench/identity-spine/parseIdentityDriftOutput.ts`
- Tests updated to reflect empty deferred set and post-F2 steady state

---

## Hard Boundary Compliance

| boundary | status |
|---|---|
| Did not mutate PACS | ✅ |
| Did not mutate legacy_pacs_raw | ✅ |
| Did not mutate truth_pacs | ✅ |
| Did not touch land/improvement/geometry/assessment/exemption/jurisdiction/revenue/source_xref (except read-only) | ✅ |
| Did not run drains | ✅ |
| Did not run history lanes | ✅ |
| No canonical table besides tf_parcel + tf_parcel_owner_link mutated | ✅ |
| Used NOT EXISTS (not NOT IN) | ✅ |
| Explicit git path staging (no git add .) | ✅ |

---

## Conclusion

F2 is **sealed**. The canonical parcel table is clean. The identity-spine panel shows OVERALL PASS for the first time. All sealed domain lanes are intact and unchanged.

---
type: sync_lesson
county: Benton WA
domain: parcel-identity
lane: parcel / owner-link
status: proven
symptom: >
  canonical_tf.tf_parcel has far more rows than expected (3,198,979 vs 83,326 live parcels).
  canonical_tf.tf_parcel_owner_link has 1,397,252 dangling rows (parcel not in live spine).
  identity-drift-detector shows FAIL for tf_parcel_owner_link.
root_cause: >
  PacsParcelSpineTruthPromoter idempotency bug (see [[SYNC-LESSON-BENTON-F1-LIVE-SPINE]]).
  Multiple re-drains stacked duplicate rows in truth_pacs.parcel_spine keyed by
  PropertyLoadBatchId instead of prop_id. This created 684,457 total truth rows (8.2× the
  83,326 distinct parcels). The canonical projector (PacsParcelCanonicalProjector) reproduced
  this inflation directly into canonical_tf.tf_parcel. Owner-link rows were projected with
  TfParcelIds from the inflated set — most referenced dead debris rows.
proof: >
  Pre-cleanup: tf_parcel total=3,198,979 / live=83,326 / debris=3,115,653.
  Pre-cleanup: tf_parcel_owner_link total=2,111,805 / live=714,553 / dangling=1,397,252.
  Post-cleanup: tf_parcel=83,326 / debris=0. owner_link=714,553 / dangling=0.
  Commits: 3057891b4 (cleanup), 481955026 (evidence doc tightened).
  Identity-drift: all 11 tables PASS after cleanup (0 dangling everywhere).
fix: >
  1. Cleanup SQL deleted 3,115,653 stale tf_parcel rows and 1,397,252 dangling owner_link rows
     in a single transaction.
  2. F1 root cause (projector bug) was already fixed in be087d586. F2 is the debris pruning.
  3. No re-drain of downstream lanes was required — the downstream lanes' TfParcelIds now all
     resolve because the debris rows have been removed (not replaced by new debris).
commit: "3057891b4 (F2 cleanup), 481955026 (evidence tightened)"
prevention_rule: >
  After any PacsParcelSpineTruthPromoter run, check:
    SELECT count(*) FROM truth_pacs.parcel_spine
    vs 
    SELECT count(DISTINCT prop_id) FROM truth_pacs.parcel_spine
  If ratio > 1.05, stacking is occurring. Fix the promoter keying before continuing.
  Also run identity-drift-detector after every bulk parcel drain to catch debris early.
automation_target: >
  Add a ratio check to harris-pacs-pack-validator.sql or doctor step #1:
  truth_pacs.parcel_spine row count vs distinct prop_id count.
  Also: add pre-drain identity gate in DoctrineDrainController that blocks if identity-drift != PASS.
related_files:
  - tools/sync/identity-drift-detector.sql
  - tools/sync/f2-parcel-debris-cleanup.sql
  - docs/sync/workbench/F2_PARCEL_DEBRIS_CLEANUP_EVIDENCE.md
  - docs/sync/workbench/SYNC_RUNTIME_PRODUCTION_PROOF.md
---

## Protocol Miss Note

**No pre-cleanup backup table was created before the destructive DELETE.** This was a protocol miss documented in commit `481955026`.

The deleted rows are reconstructible by re-running the canonical parcel projector from the intact `truth_pacs.parcel_spine`. The truth spine is the authoritative source; the deleted canonical debris is derivative. This reconstruction path is available but was not tested.

Future cleanup operations should create a `canonical_tf.tf_parcel_debris_backup_YYYYMMDD` table before deleting.

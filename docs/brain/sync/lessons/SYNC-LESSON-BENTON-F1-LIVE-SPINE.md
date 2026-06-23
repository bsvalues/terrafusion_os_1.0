---
type: sync_lesson
county: Benton WA
domain: parcel-identity
lane: all canonical lanes
status: proven
symptom: >
  Canonical rows for land, improvement, assessment, etc. exist and appear correct but cannot be
  joined together — e.g. "show all improvements for this parcel" returns nothing even though the
  improvement row is present. ROOT READ-BACK FAILURE: the TfParcelId in downstream lanes points
  at a dead parcel identity generation, not the live parcel spine.
root_cause: >
  PacsParcelSpineTruthPromoter had an idempotency bug: stale rows were keyed by PropertyLoadBatchId
  instead of prop_id. Multiple re-drains of the same parcels under new landing batches stacked
  duplicate rows in truth_pacs.parcel_spine. The canonical projector reproduced this fan-out directly
  into canonical_tf.tf_parcel (3,198,979 rows from 83,326 live parcels). Downstream lanes projected
  with TfParcelIds from this inflated set — most referenced dead rows that are no longer the "live"
  parcel spine entry for that prop_id.
proof: >
  Commit be087d586 (F1 fix): projector FK fan-out bug fixed.
  Identity-drift-detector.sql: before F1 fix, every canonical table showed thousands of dangling rows.
  After F1 fix: all 11 tables show 0 dangling.
fix: >
  1. Fix PacsParcelSpineTruthPromoter keying to prop_id (not batch ID).
  2. Fix PacsParcelCanonicalProjector to not fan-out stale identities.
  3. Run F2 to prune canonical debris (see [[SYNC-LESSON-BENTON-F2-PARCEL-DEBRIS]]).
  4. Re-drain all downstream lanes to get canonical rows pointing at live parcel spine entries.
commit: "be087d586 (F1 projector fix), 3057891b4 (F2 debris cleanup)"
prevention_rule: >
  HARD RULE (Learned Law #2): Never blind-join the raw tf_parcel table (~3.1M rows in post-F2
  environment has 83,326 live rows). Always resolve through the active source_xref / live parcel
  spine:
    SELECT x."TfEntityId" AS pid
    FROM sync_bridge.source_xref x
    WHERE x."TfEntityType" = 'parcel' AND x."IsActive"
  The identity-drift-detector.sql automates this check. Run it before every major Sync session.
automation_target: >
  identity-drift-detector.sql: already automated as doctor step #1.
  WorkbenchIdentitySpineController: POST /api/sync/workbench/identity-spine/run.
  Any CI/pre-drain check should gate on identity-drift PASS before proceeding.
related_files:
  - tools/sync/identity-drift-detector.sql
  - tools/sync/tf-sync-doctor.mjs
  - docs/sync/workbench/SYNC_RUNTIME_PRODUCTION_PROOF.md
  - docs/sync/workbench/WORKBENCH_V0_3_RUNTIME_PROOF.md
---

## F1 Live Spine Doctrine

The live parcel spine is the **only** authoritative parcel identity. It is:

```sql
SELECT x."TfEntityId" AS pid
FROM sync_bridge.source_xref x
WHERE x."TfEntityType" = 'parcel' AND x."IsActive"
```

### Why "Not Live" Is Sufficient

A dangling canonical row is one where `TfParcelId IS NOT NULL` but the ID is not in the live spine. We do NOT classify "dangling" into sub-categories (debris vs never-existed). That would require joining the 3.1M-row tf_parcel table. "Not live" triggers the alarm — the sub-classification is not needed.

### Automation Gate

```sql
-- Fast dangling check for a single lane:
SELECT count(*) AS dangling
FROM canonical_tf.tf_improvement i
WHERE i."TfParcelId" IS NOT NULL
  AND i."TfParcelId" NOT IN (
      SELECT x."TfEntityId" FROM sync_bridge.source_xref x
      WHERE x."TfEntityType" = 'parcel' AND x."IsActive"
  );
-- Expected: 0 for healthy substrate
```

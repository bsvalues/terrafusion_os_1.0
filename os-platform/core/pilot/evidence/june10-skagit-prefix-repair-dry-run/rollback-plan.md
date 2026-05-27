# Skagit Prefix Repair Rollback Plan

This is a dry-run artifact. No SQL was executed.

Rollback requirement before any future mutation:

1. Back up every active Skagit canonical_tf.tf_parcel row touched by skagit_prefix_repair_dry_run_2026_05_27.
2. Execute repair in one transaction.
3. If verification fails, restore from the backup by TfParcelId.
4. Delete only newly inserted shell rows for this receipt ID if rollback is required.
5. Never delete existing canonical rows; stale rows must be marked superseded/inactive only.

Required artifacts:

- Update targets: os-platform/core/pilot/evidence/june10-skagit-prefix-repair-dry-run/update-targets.jsonl
- Supersede targets: os-platform/core/pilot/evidence/june10-skagit-prefix-repair-dry-run/supersede-targets.jsonl
- Stage insert targets: os-platform/core/pilot/evidence/june10-skagit-prefix-repair-dry-run/stage-insert-targets.jsonl

Rollback SQL template:

```sql
BEGIN;

-- Restore repaired existing rows from a pre-mutation backup table.
-- UPDATE canonical_tf.tf_parcel p
-- SET
--   "ParcelNumber" = b."ParcelNumber",
--   "LegacyImportedParcelKey" = b."LegacyImportedParcelKey",
--   "TerraFusionParcelKey" = b."TerraFusionParcelKey",
--   "ParcelStatus" = b."ParcelStatus",
--   "IdentityRepairReceiptId" = b."IdentityRepairReceiptId",
--   "UpdatedAt" = b."UpdatedAt"
-- FROM backup.skagit_prefix_repair_skagit_prefix_repair_dry_run_2026_05_27 b
-- WHERE p."TfParcelId" = b."TfParcelId";

-- Remove shell rows inserted by a future authorized repair.
-- DELETE FROM canonical_tf.tf_parcel
-- WHERE "CountyId" = 'a1c87e81-4825-f488-040b-2faa433b9905'::uuid
--   AND "IdentityRepairReceiptId" = 'skagit_prefix_repair_dry_run_2026_05_27'
--   AND "LegacyImportedParcelKey" IS NULL
--   AND "ParcelStatus" = 'ACTIVE';

ROLLBACK;
```

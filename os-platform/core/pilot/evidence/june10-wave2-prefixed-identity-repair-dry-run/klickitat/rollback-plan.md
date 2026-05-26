# Klickitat Wave 2 Prefix Repair Rollback Plan

Receipt: wave2_53039_prefixed_identity_repair_dry_run_2026_05_26

Before any execution, export affected active canonical_tf.tf_parcel rows for Klickitat 53039 where CountyId=9d619518-23ca-f6e9-03c9-6219db494501.

Restore ParcelNumber, LegacyImportedParcelKey, TerraFusionParcelKey, IdentityRepairReceiptId, and UpdatedAt from the pre-mutation backup inside one transaction.

```sql
-- Template only. Requires backup table populated before execution.
BEGIN;

-- UPDATE canonical_tf.tf_parcel p
-- SET
--   "ParcelNumber" = b."ParcelNumber",
--   "LegacyImportedParcelKey" = b."LegacyImportedParcelKey",
--   "TerraFusionParcelKey" = b."TerraFusionParcelKey",
--   "IdentityRepairReceiptId" = b."IdentityRepairReceiptId",
--   "UpdatedAt" = b."UpdatedAt"
-- FROM backup.wave2_53039_tf_parcel_identity b
-- WHERE p."TfParcelId" = b."TfParcelId";

ROLLBACK; -- template only

```

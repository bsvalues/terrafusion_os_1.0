# Kitsap Wave 2 Prefix Repair Rollback Plan

Receipt: wave2_53035_prefixed_identity_repair_dry_run_2026_05_26

Before any execution, export affected active canonical_tf.tf_parcel rows for Kitsap 53035 where CountyId=500ef839-e1cf-9c95-60b5-3b1b12f5851d.

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
-- FROM backup.wave2_53035_tf_parcel_identity b
-- WHERE p."TfParcelId" = b."TfParcelId";

ROLLBACK; -- template only

```

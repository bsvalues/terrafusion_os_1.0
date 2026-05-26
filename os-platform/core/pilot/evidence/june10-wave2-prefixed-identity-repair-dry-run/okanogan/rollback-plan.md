# Okanogan Wave 2 Prefix Repair Rollback Plan

Receipt: wave2_53047_prefixed_identity_repair_dry_run_2026_05_26

Before any execution, export affected active canonical_tf.tf_parcel rows for Okanogan 53047 where CountyId=2ca5f53a-275d-d1b7-3266-80383d5e2387.

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
-- FROM backup.wave2_53047_tf_parcel_identity b
-- WHERE p."TfParcelId" = b."TfParcelId";

ROLLBACK; -- template only

```

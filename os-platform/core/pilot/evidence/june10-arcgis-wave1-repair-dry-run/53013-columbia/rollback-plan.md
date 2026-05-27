# Columbia ArcGIS Wave 1 Repair Rollback Plan

Receipt: arcgis_wave1_53013_source_native_identity_repair_dry_run

Before execution, export active canonical_tf.tf_parcel rows for Columbia 53013 into a dated backup table.

Restore ParcelNumber, LegacyImportedParcelKey, TerraFusionParcelKey, IdentityRepairReceiptId, and UpdatedAt from the pre-mutation backup in one transaction.

```sql
-- Template only. Requires a populated backup table before any mutation.
BEGIN;

-- UPDATE canonical_tf.tf_parcel p
-- SET
--   "ParcelNumber" = b."ParcelNumber",
--   "LegacyImportedParcelKey" = b."LegacyImportedParcelKey",
--   "TerraFusionParcelKey" = b."TerraFusionParcelKey",
--   "IdentityRepairReceiptId" = b."IdentityRepairReceiptId",
--   "UpdatedAt" = b."UpdatedAt"
-- FROM backup.arcgis_wave1_53013_tf_parcel_identity b
-- WHERE p."TfParcelId" = b."TfParcelId";

ROLLBACK; -- template only

```

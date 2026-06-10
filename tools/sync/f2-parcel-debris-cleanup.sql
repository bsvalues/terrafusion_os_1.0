-- ============================================================================
-- TerraFusion Sync — F2 Parcel-Debris Cleanup
-- ----------------------------------------------------------------------------
-- DESTRUCTIVE. Run ONLY when:
--   1. Backend API is stopped (no background service contention).
--   2. Diagnostic SQL (f2-parcel-debris-diagnostic.sql) has been run and
--      the debris count is confirmed.
--   3. Identity drift detector last run showed only tf_parcel_owner_link WARN
--      (all other lanes PASS) — meaning F1 repair is confirmed complete.
--
-- Cleanup order:
--   Step 1 — Delete dangling owner link rows (point to debris parcel IDs).
--   Step 2 — Delete debris tf_parcel rows (no active source_xref entry).
--
-- There are no DB-level FK constraints on TfParcelId columns (EF uses
-- application-layer identity enforcement via source_xref). Steps can be
-- executed in either order, but Step 1 first is the safer convention.
--
-- After cleanup run f2-parcel-debris-diagnostic.sql to confirm:
--   debris_tf_parcel_rows = 0
--   owner_link_dangling   = 0
-- Then run identity-drift-detector.sql to confirm overall PASS.
-- ============================================================================

BEGIN;

-- Step 1: Delete dangling owner link rows (referencing non-live parcel IDs).
-- Uses NOT EXISTS for efficiency on large tables (avoids NOT IN subquery materialization).
DELETE FROM canonical_tf.tf_parcel_owner_link o
WHERE NOT EXISTS (
    SELECT 1 FROM sync_bridge.source_xref x
    WHERE x."TfEntityType" = 'parcel'
      AND x."IsActive"
      AND x."TfEntityId" = o."TfParcelId"
);

-- Step 2: Delete debris tf_parcel rows (no active source_xref entry).
DELETE FROM canonical_tf.tf_parcel p
WHERE NOT EXISTS (
    SELECT 1 FROM sync_bridge.source_xref x
    WHERE x."TfEntityType" = 'parcel'
      AND x."IsActive"
      AND x."TfEntityId" = p."TfParcelId"
);

COMMIT;

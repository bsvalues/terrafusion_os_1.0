-- ============================================================================
-- TerraFusion Sync — F2 Parcel-Debris Diagnostic
-- ----------------------------------------------------------------------------
-- READ-ONLY. Quantifies the tf_parcel debris left from the stacking era
-- (before the prop_id-key idempotency fix on 2026-05-27).
--
-- Root cause (commit cd23481db): PacsParcelSpineTruthPromoter cleared spine
-- rows by PropertyLoadBatchId, letting re-drains stack duplicates. Fix
-- collapsed truth_pacs.parcel_spine 684k → 83k. The canonical re-projection
-- created a new live set of ~83k tf_parcel rows, but old debris rows from
-- prior projection runs were NOT deleted (F1 repair deferred F2 explicitly).
--
-- The live spine is defined by source_xref WHERE TfEntityType='parcel' AND IsActive.
-- Debris rows are tf_parcel rows with no corresponding live source_xref entry.
-- ============================================================================

-- 1. Total tf_parcel rows vs live-spine count.
SELECT
    (SELECT count(*) FROM canonical_tf.tf_parcel)                              AS tf_parcel_total,
    (SELECT count(*) FROM sync_bridge.source_xref
     WHERE "TfEntityType" = 'parcel' AND "IsActive")                          AS live_spine_entries,
    (SELECT count(*) FROM canonical_tf.tf_parcel p
     WHERE p."TfParcelId" NOT IN (
         SELECT x."TfEntityId"
         FROM sync_bridge.source_xref x
         WHERE x."TfEntityType" = 'parcel' AND x."IsActive"
     ))                                                                        AS debris_tf_parcel_rows,
    (SELECT count(DISTINCT "ParcelNumber") FROM canonical_tf.tf_parcel)        AS distinct_parcel_numbers,
    (SELECT count(DISTINCT "ParcelNumber") FROM canonical_tf.tf_parcel p
     WHERE p."TfParcelId" IN (
         SELECT x."TfEntityId"
         FROM sync_bridge.source_xref x
         WHERE x."TfEntityType" = 'parcel' AND x."IsActive"
     ))                                                                        AS distinct_parcel_numbers_live;

-- 2. Owner link breakdown: live vs dangling.
WITH live AS (
    SELECT x."TfEntityId" AS pid
    FROM sync_bridge.source_xref x
    WHERE x."TfEntityType" = 'parcel' AND x."IsActive"
)
SELECT
    count(*)                                                            AS owner_link_total,
    count(*) FILTER (WHERE "TfParcelId" IN (SELECT pid FROM live))     AS owner_link_live,
    count(*) FILTER (WHERE "TfParcelId" NOT IN (SELECT pid FROM live)) AS owner_link_dangling
FROM canonical_tf.tf_parcel_owner_link;

-- 3. Spot-check: sample of debris tf_parcel rows (confirms no live xref).
SELECT p."TfParcelId", p."ParcelNumber", p."CreatedAt"
FROM canonical_tf.tf_parcel p
WHERE p."TfParcelId" NOT IN (
    SELECT x."TfEntityId"
    FROM sync_bridge.source_xref x
    WHERE x."TfEntityType" = 'parcel' AND x."IsActive"
)
ORDER BY p."CreatedAt"
LIMIT 5;

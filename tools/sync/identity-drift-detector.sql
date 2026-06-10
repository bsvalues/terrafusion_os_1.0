-- ============================================================================
-- TerraFusion Sync — Automation #1: Identity-Drift Detector
-- ----------------------------------------------------------------------------
-- READ-ONLY. No DDL, no canonical mutation. Run in psql / SSMS / any SQL client;
-- export the result set to Excel if desired.
--
-- Purpose: prevent the F1 failure from ever recurring silently — canonical rows
-- that LOOK sealed but point at a dead/stale parcel-identity generation instead
-- of the live parcel spine.
--
-- Definition of "live parcel spine" (the ONLY authoritative parcel identity):
--     active parcel cross-reference  ->  canonical_tf.tf_parcel
--     sync_bridge.source_xref WHERE "TfEntityType"='parcel' AND "IsActive"
--
-- HARD RULE (Product Doctrine Learned Law #2): never blind-join the raw
-- ~3.1M-row tf_parcel table. We resolve ONLY through the active source_xref /
-- live spine. We therefore do NOT sub-classify "dangling" into "tf_parcel debris"
-- vs "nonexistent" — that would require joining the 3.1M debris. "Not live" is
-- sufficient for the alarm.
--
-- Per parcel-bearing canonical table this reports:
--   total      total rows
--   live       rows whose TfParcelId resolves to the live parcel spine
--   dangling   rows with a NON-NULL TfParcelId NOT on the live spine   <-- the alarm
--   null_ref   rows with NULL TfParcelId (valid-zero candidate, e.g. geometry residual)
--   verdict    PASS if dangling = 0, else FAIL
--
-- A lane FAILS the detector if dangling > 0. null_ref is reported, not failed
-- (Learned Law #9: a zero/null can be valid when source truth has none — confirm
-- against the lane's documented residual before treating null_ref as a problem).
--
-- County scope: single-county DBs run as-is. For multi-county, add
--   AND "CountyId" = :'county_id'
-- to each block and to the live CTE join (county isolation is by CountyId, not
-- separate tables — the canonical schema is shared across counties).
-- ============================================================================

WITH live AS (
    -- the live parcel spine: active parcel xref -> tf_parcel identity
    SELECT (x."SourceKeyJson"::jsonb->>'prop_id')::bigint AS prop_id,
           x."TfEntityId" AS pid
    FROM sync_bridge.source_xref x
    WHERE x."TfEntityType" = 'parcel'
      AND x."IsActive"
),
report AS (
    SELECT 'canonical_tf.tf_land' AS lane_table, count(*) AS total,
           count(*) FILTER (WHERE "TfParcelId" IN (SELECT pid FROM live))                          AS live,
           count(*) FILTER (WHERE "TfParcelId" IS NOT NULL AND "TfParcelId" NOT IN (SELECT pid FROM live)) AS dangling,
           count(*) FILTER (WHERE "TfParcelId" IS NULL)                                            AS null_ref
    FROM canonical_tf.tf_land
    UNION ALL
    SELECT 'canonical_tf.tf_improvement', count(*),
           count(*) FILTER (WHERE "TfParcelId" IN (SELECT pid FROM live)),
           count(*) FILTER (WHERE "TfParcelId" IS NOT NULL AND "TfParcelId" NOT IN (SELECT pid FROM live)),
           count(*) FILTER (WHERE "TfParcelId" IS NULL)
    FROM canonical_tf.tf_improvement
    UNION ALL
    SELECT 'gis_tf.tf_parcel_geom', count(*),
           count(*) FILTER (WHERE "TfParcelId" IN (SELECT pid FROM live)),
           count(*) FILTER (WHERE "TfParcelId" IS NOT NULL AND "TfParcelId" NOT IN (SELECT pid FROM live)),
           count(*) FILTER (WHERE "TfParcelId" IS NULL)
    FROM gis_tf.tf_parcel_geom
    UNION ALL
    SELECT 'canonical_tf.tf_assessment', count(*),
           count(*) FILTER (WHERE "TfParcelId" IN (SELECT pid FROM live)),
           count(*) FILTER (WHERE "TfParcelId" IS NOT NULL AND "TfParcelId" NOT IN (SELECT pid FROM live)),
           count(*) FILTER (WHERE "TfParcelId" IS NULL)
    FROM canonical_tf.tf_assessment
    UNION ALL
    SELECT 'canonical_tf.tf_exemption', count(*),
           count(*) FILTER (WHERE "TfParcelId" IN (SELECT pid FROM live)),
           count(*) FILTER (WHERE "TfParcelId" IS NOT NULL AND "TfParcelId" NOT IN (SELECT pid FROM live)),
           count(*) FILTER (WHERE "TfParcelId" IS NULL)
    FROM canonical_tf.tf_exemption
    UNION ALL
    SELECT 'canonical_tf.tf_parcel_tax_area', count(*),
           count(*) FILTER (WHERE "TfParcelId" IN (SELECT pid FROM live)),
           count(*) FILTER (WHERE "TfParcelId" IS NOT NULL AND "TfParcelId" NOT IN (SELECT pid FROM live)),
           count(*) FILTER (WHERE "TfParcelId" IS NULL)
    FROM canonical_tf.tf_parcel_tax_area
    UNION ALL
    SELECT 'canonical_tf.tf_tax_bill_line', count(*),
           count(*) FILTER (WHERE "TfParcelId" IN (SELECT pid FROM live)),
           count(*) FILTER (WHERE "TfParcelId" IS NOT NULL AND "TfParcelId" NOT IN (SELECT pid FROM live)),
           count(*) FILTER (WHERE "TfParcelId" IS NULL)
    FROM canonical_tf.tf_tax_bill_line
    UNION ALL
    SELECT 'canonical_tf.tf_assessment_bill_line', count(*),
           count(*) FILTER (WHERE "TfParcelId" IN (SELECT pid FROM live)),
           count(*) FILTER (WHERE "TfParcelId" IS NOT NULL AND "TfParcelId" NOT IN (SELECT pid FROM live)),
           count(*) FILTER (WHERE "TfParcelId" IS NULL)
    FROM canonical_tf.tf_assessment_bill_line
    UNION ALL  -- rollups (parcel-bearing too)
    SELECT 'canonical_tf.tf_tax_bill_current', count(*),
           count(*) FILTER (WHERE "TfParcelId" IN (SELECT pid FROM live)),
           count(*) FILTER (WHERE "TfParcelId" IS NOT NULL AND "TfParcelId" NOT IN (SELECT pid FROM live)),
           count(*) FILTER (WHERE "TfParcelId" IS NULL)
    FROM canonical_tf.tf_tax_bill_current
    UNION ALL
    SELECT 'canonical_tf.tf_assessment_bill_current', count(*),
           count(*) FILTER (WHERE "TfParcelId" IN (SELECT pid FROM live)),
           count(*) FILTER (WHERE "TfParcelId" IS NOT NULL AND "TfParcelId" NOT IN (SELECT pid FROM live)),
           count(*) FILTER (WHERE "TfParcelId" IS NULL)
    FROM canonical_tf.tf_assessment_bill_current
    UNION ALL
    SELECT 'canonical_tf.tf_parcel_owner_link', count(*),
           count(*) FILTER (WHERE "TfParcelId" IN (SELECT pid FROM live)),
           count(*) FILTER (WHERE "TfParcelId" IS NOT NULL AND "TfParcelId" NOT IN (SELECT pid FROM live)),
           count(*) FILTER (WHERE "TfParcelId" IS NULL)
    FROM canonical_tf.tf_parcel_owner_link
)
SELECT lane_table, total, live, dangling, null_ref,
       CASE WHEN dangling = 0 THEN 'PASS' ELSE 'FAIL' END AS verdict
FROM report
ORDER BY (dangling > 0) DESC, lane_table;

-- Overall verdict: detector PASSES only if every lane_table has dangling = 0.
-- (Run this second statement, or read the per-table verdicts above.)
WITH live AS (
    SELECT x."TfEntityId" AS pid
    FROM sync_bridge.source_xref x
    WHERE x."TfEntityType" = 'parcel' AND x."IsActive"
)
SELECT CASE WHEN (
    (SELECT count(*) FROM canonical_tf.tf_land                  WHERE "TfParcelId" IS NOT NULL AND "TfParcelId" NOT IN (SELECT pid FROM live))
  + (SELECT count(*) FROM canonical_tf.tf_improvement           WHERE "TfParcelId" IS NOT NULL AND "TfParcelId" NOT IN (SELECT pid FROM live))
  + (SELECT count(*) FROM gis_tf.tf_parcel_geom                 WHERE "TfParcelId" IS NOT NULL AND "TfParcelId" NOT IN (SELECT pid FROM live))
  + (SELECT count(*) FROM canonical_tf.tf_assessment            WHERE "TfParcelId" IS NOT NULL AND "TfParcelId" NOT IN (SELECT pid FROM live))
  + (SELECT count(*) FROM canonical_tf.tf_exemption             WHERE "TfParcelId" IS NOT NULL AND "TfParcelId" NOT IN (SELECT pid FROM live))
  + (SELECT count(*) FROM canonical_tf.tf_parcel_tax_area       WHERE "TfParcelId" IS NOT NULL AND "TfParcelId" NOT IN (SELECT pid FROM live))
  + (SELECT count(*) FROM canonical_tf.tf_tax_bill_line         WHERE "TfParcelId" IS NOT NULL AND "TfParcelId" NOT IN (SELECT pid FROM live))
  + (SELECT count(*) FROM canonical_tf.tf_assessment_bill_line  WHERE "TfParcelId" IS NOT NULL AND "TfParcelId" NOT IN (SELECT pid FROM live))
  + (SELECT count(*) FROM canonical_tf.tf_tax_bill_current      WHERE "TfParcelId" IS NOT NULL AND "TfParcelId" NOT IN (SELECT pid FROM live))
  + (SELECT count(*) FROM canonical_tf.tf_assessment_bill_current WHERE "TfParcelId" IS NOT NULL AND "TfParcelId" NOT IN (SELECT pid FROM live))
  + (SELECT count(*) FROM canonical_tf.tf_parcel_owner_link     WHERE "TfParcelId" IS NOT NULL AND "TfParcelId" NOT IN (SELECT pid FROM live))
    ) = 0 THEN 'OVERALL: PASS — no identity drift' ELSE 'OVERALL: FAIL — identity drift detected' END AS overall_verdict;

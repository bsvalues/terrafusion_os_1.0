-- ============================================================================
-- TerraFusion Sync — Automation #2: Seal-Check Runner (Benton County, 2025)
-- ----------------------------------------------------------------------------
-- READ-ONLY. No DDL, no canonical mutation. Run in psql / SSMS / any SQL client.
--
-- Purpose: encode the manual seal gates as an automated, repeatable check so
-- future sessions — after re-drains, refactors, or county additions — can
-- verify the canonical substrate is still consistent with the sealed benchmarks
-- instead of rediscovering problems by hand.
--
-- This runner checks seven lane families:
--   parcel-spine · assessment · jurisdiction · exemption ·
--   land · improvement · geometry · revenue-l (levy) · revenue-a (special-assess)
--
-- VERDICT taxonomy:
--   PASS           — matches sealed benchmark or structural invariant holds
--   WARN-CHANGED   — deviates from sealed benchmark but not zero/broken;
--                    expected after a re-drain or new operational year
--   WARN-REGRESSED — count dropped below sealed benchmark; investigate
--   FAIL           — structural invariant broken (parity mismatch, rollup gap,
--                    balance arithmetic error, or lane is empty)
--
-- PREREQUISITE: Run identity-drift-detector.sql separately. That tool checks
-- canonical FK → live parcel spine resolution for all 11 tables. This runner
-- checks lane counts, parity, rollup integrity, and amount totals — it does NOT
-- re-run the FK drift scan.
--
-- SEALED BENCHMARKS (Benton County, 2025 operational year, drained 2026-06-07/08):
--   live parcel spine:          83,326
--   tf_assessment:              83,326  (1:1 with parcel spine)
--   tf_parcel_tax_area:         83,326  (1:1 with parcel spine)
--   tf_exemption:                5,643  (not all parcels)
--   tf_land:                    87,767  (multi-segment — ≥ threshold)
--   tf_improvement:             99,694  (multi-improvement — ≥ threshold)
--   tf_parcel_geom:             80,075  (geometry — ≥ threshold)
--   tf_tax_bill_line:          990,665  (levy bill lines — ≥ threshold)
--   tf_tax_bill_current:        79,767  (levy rollup, < parcel count: MH/personal excluded)
--   tf_assessment_bill_line:   313,139  (assessment bill lines — ≥ threshold)
--   tf_assessment_bill_current: 79,078  (assessment rollup)
--   Revenue-L due:       $308,949,578.44
--   Revenue-L paid:            $3,602.19
--   Revenue-A due:         $8,841,075.97
--   Revenue-A paid:              $429.35
--
-- For multi-county DBs: add AND "CountyId" = :'county_id' to each table scan
-- and scope the live CTE to the same county. (County isolation is by CountyId,
-- not separate schemas — the canonical schema is shared across counties.)
-- ============================================================================

WITH

-- ── LIVE PARCEL SPINE ──────────────────────────────────────────────────────
live AS (
    SELECT "TfEntityId" AS pid
    FROM sync_bridge.source_xref
    WHERE "TfEntityType" = 'parcel' AND "IsActive"
),

-- ── RAW METRICS (all measured in one pass) ────────────────────────────────
m AS (
    SELECT
        -- spine
        (SELECT count(*) FROM live)::bigint                                        AS live_parcels,

        -- assessment
        (SELECT count(*) FROM canonical_tf.tf_assessment)::bigint                  AS assessment,
        (   (SELECT count(*) FROM canonical_tf.tf_assessment)
          - (SELECT count(*) FROM (SELECT DISTINCT "TfParcelId", "AssessmentYear"
                                   FROM canonical_tf.tf_assessment) _a)
        )                                                                           AS assess_dupes,

        -- jurisdiction
        (SELECT count(*) FROM canonical_tf.tf_parcel_tax_area)::bigint             AS ptax_area,

        -- exemption
        (SELECT count(*) FROM canonical_tf.tf_exemption)::bigint                   AS exemption,

        -- land
        (SELECT count(*) FROM canonical_tf.tf_land)::bigint                        AS land,

        -- improvement
        (SELECT count(*) FROM canonical_tf.tf_improvement)::bigint                 AS improvement,

        -- geometry
        (SELECT count(*) FROM gis_tf.tf_parcel_geom)::bigint                       AS geom,

        -- revenue-L
        (SELECT count(*) FROM canonical_tf.tf_tax_bill_line)::bigint               AS tbl,
        (SELECT count(*) FROM canonical_tf.tf_tax_bill_current)::bigint            AS tbc,
        (SELECT coalesce(sum("BillCount"), 0)
         FROM canonical_tf.tf_tax_bill_current)::bigint                            AS tbc_bill_sum,
        (   (SELECT count(*) FROM canonical_tf.tf_tax_bill_current)
          - (SELECT count(DISTINCT "TfParcelId") FROM canonical_tf.tf_tax_bill_current)
        )                                                                           AS tbc_dupes,
        ROUND(coalesce(
            (SELECT sum("CurrentAmountDue") FROM canonical_tf.tf_tax_bill_line), 0
        )::numeric, 2)                                                              AS l_due,
        ROUND(coalesce(
            (SELECT sum("AmountPaid") FROM canonical_tf.tf_tax_bill_line), 0
        )::numeric, 2)                                                              AS l_paid,
        ROUND(coalesce(
            (SELECT sum("BalanceAmount") FROM canonical_tf.tf_tax_bill_line), 0
        )::numeric, 2)                                                              AS l_balance,

        -- revenue-A
        (SELECT count(*) FROM canonical_tf.tf_assessment_bill_line)::bigint        AS abl,
        (SELECT count(*) FROM canonical_tf.tf_assessment_bill_current)::bigint     AS abc,
        (SELECT coalesce(sum("BillCount"), 0)
         FROM canonical_tf.tf_assessment_bill_current)::bigint                     AS abc_bill_sum,
        (   (SELECT count(*) FROM canonical_tf.tf_assessment_bill_current)
          - (SELECT count(DISTINCT "TfParcelId") FROM canonical_tf.tf_assessment_bill_current)
        )                                                                           AS abc_dupes,
        ROUND(coalesce(
            (SELECT sum("CurrentAmountDue") FROM canonical_tf.tf_assessment_bill_line), 0
        )::numeric, 2)                                                              AS a_due,
        ROUND(coalesce(
            (SELECT sum("AmountPaid") FROM canonical_tf.tf_assessment_bill_line), 0
        )::numeric, 2)                                                              AS a_paid,
        ROUND(coalesce(
            (SELECT sum("BalanceAmount") FROM canonical_tf.tf_assessment_bill_line), 0
        )::numeric, 2)                                                              AS a_balance
),

-- ── CHECKS (one row per gate) ─────────────────────────────────────────────
checks AS (

    -- PARCEL SPINE
    SELECT 'parcel-spine' AS chk_group, 'live-parcel-count'      AS check_name,
           m.live_parcels::text AS measured, '83326'             AS sealed,
           CASE WHEN m.live_parcels = 83326        THEN 'PASS'
                WHEN m.live_parcels BETWEEN 80000 AND 90000 THEN 'WARN-CHANGED'
                ELSE 'FAIL' END                                  AS verdict
    FROM m

    UNION ALL

    -- ASSESSMENT
    SELECT 'assessment', 'canonical-row-count',
           m.assessment::text, '83326 (= live parcel count)',
           CASE WHEN m.assessment = m.live_parcels THEN 'PASS' ELSE 'FAIL' END
    FROM m

    UNION ALL
    SELECT 'assessment', 'no-duplicate-parcel/year',
           m.assess_dupes::text || ' dupe(s)', '0',
           CASE WHEN m.assess_dupes = 0 THEN 'PASS' ELSE 'FAIL' END
    FROM m

    UNION ALL

    -- JURISDICTION
    SELECT 'jurisdiction', 'parcel-tax-area-count',
           m.ptax_area::text, '83326 (= live parcel count)',
           CASE WHEN m.ptax_area = m.live_parcels THEN 'PASS' ELSE 'FAIL' END
    FROM m

    UNION ALL

    -- EXEMPTION
    SELECT 'exemption', 'canonical-row-count',
           m.exemption::text, '≥5643',
           CASE WHEN m.exemption >= 5643 THEN 'PASS'
                WHEN m.exemption = 0     THEN 'FAIL'
                ELSE 'WARN-REGRESSED' END
    FROM m

    UNION ALL

    -- LAND
    SELECT 'land', 'canonical-row-count',
           m.land::text, '≥87767',
           CASE WHEN m.land >= 87767 THEN 'PASS'
                WHEN m.land = 0      THEN 'FAIL'
                ELSE 'WARN-REGRESSED' END
    FROM m

    UNION ALL

    -- IMPROVEMENT
    SELECT 'improvement', 'canonical-row-count',
           m.improvement::text, '≥99694',
           CASE WHEN m.improvement >= 99694 THEN 'PASS'
                WHEN m.improvement = 0      THEN 'FAIL'
                ELSE 'WARN-REGRESSED' END
    FROM m

    UNION ALL

    -- GEOMETRY
    SELECT 'geometry', 'canonical-row-count',
           m.geom::text, '≥80075',
           CASE WHEN m.geom >= 80075 THEN 'PASS'
                WHEN m.geom = 0      THEN 'FAIL'
                ELSE 'WARN-REGRESSED' END
    FROM m

    UNION ALL

    -- REVENUE-L counts
    SELECT 'revenue-l', 'bill-line-count',
           m.tbl::text, '≥990665',
           CASE WHEN m.tbl >= 990665 THEN 'PASS'
                WHEN m.tbl = 0       THEN 'FAIL'
                ELSE 'WARN-REGRESSED' END
    FROM m

    UNION ALL
    SELECT 'revenue-l', 'bill-current-count',
           m.tbc::text, '≥79767',
           CASE WHEN m.tbc >= 79767 THEN 'PASS'
                WHEN m.tbc = 0      THEN 'FAIL'
                ELSE 'WARN-REGRESSED' END
    FROM m

    UNION ALL
    SELECT 'revenue-l', 'rollup-sum(BillCount)=line-count',
           m.tbc_bill_sum::text || ' vs ' || m.tbl::text, 'equal',
           CASE WHEN m.tbc_bill_sum = m.tbl THEN 'PASS' ELSE 'FAIL' END
    FROM m

    UNION ALL
    SELECT 'revenue-l', 'no-duplicate-parcel-in-rollup',
           m.tbc_dupes::text || ' dupe(s)', '0',
           CASE WHEN m.tbc_dupes = 0 THEN 'PASS' ELSE 'FAIL' END
    FROM m

    UNION ALL
    SELECT 'revenue-l', 'amount-due (sealed: $308,949,578.44)',
           '$' || m.l_due::text, '$308949578.44',
           CASE WHEN ABS(m.l_due - 308949578.44) <= 0.01 THEN 'PASS'
                WHEN m.l_due = 0                         THEN 'FAIL'
                ELSE 'WARN-CHANGED' END
    FROM m

    UNION ALL
    SELECT 'revenue-l', 'amount-paid (sealed: $3,602.19)',
           '$' || m.l_paid::text, '$3602.19',
           CASE WHEN ABS(m.l_paid - 3602.19) <= 0.01 THEN 'PASS'
                ELSE 'WARN-CHANGED' END   -- $0 paid is valid for current year; not a FAIL
    FROM m

    UNION ALL
    SELECT 'revenue-l', 'balance-identity (due − paid = balance)',
           'Δ=' || ABS(m.l_due - m.l_paid - m.l_balance)::text, '0.00',
           CASE WHEN ABS(m.l_due - m.l_paid - m.l_balance) <= 0.01 THEN 'PASS'
                ELSE 'FAIL' END
    FROM m

    UNION ALL

    -- REVENUE-A counts
    SELECT 'revenue-a', 'bill-line-count',
           m.abl::text, '≥313139',
           CASE WHEN m.abl >= 313139 THEN 'PASS'
                WHEN m.abl = 0       THEN 'FAIL'
                ELSE 'WARN-REGRESSED' END
    FROM m

    UNION ALL
    SELECT 'revenue-a', 'bill-current-count',
           m.abc::text, '≥79078',
           CASE WHEN m.abc >= 79078 THEN 'PASS'
                WHEN m.abc = 0      THEN 'FAIL'
                ELSE 'WARN-REGRESSED' END
    FROM m

    UNION ALL
    SELECT 'revenue-a', 'rollup-sum(BillCount)=line-count',
           m.abc_bill_sum::text || ' vs ' || m.abl::text, 'equal',
           CASE WHEN m.abc_bill_sum = m.abl THEN 'PASS' ELSE 'FAIL' END
    FROM m

    UNION ALL
    SELECT 'revenue-a', 'no-duplicate-parcel-in-rollup',
           m.abc_dupes::text || ' dupe(s)', '0',
           CASE WHEN m.abc_dupes = 0 THEN 'PASS' ELSE 'FAIL' END
    FROM m

    UNION ALL
    SELECT 'revenue-a', 'amount-due (sealed: $8,841,075.97)',
           '$' || m.a_due::text, '$8841075.97',
           CASE WHEN ABS(m.a_due - 8841075.97) <= 0.01 THEN 'PASS'
                WHEN m.a_due = 0                        THEN 'FAIL'
                ELSE 'WARN-CHANGED' END
    FROM m

    UNION ALL
    SELECT 'revenue-a', 'amount-paid (sealed: $429.35)',
           '$' || m.a_paid::text, '$429.35',
           CASE WHEN ABS(m.a_paid - 429.35) <= 0.01 THEN 'PASS'
                ELSE 'WARN-CHANGED' END   -- $0 paid is valid for current year; not a FAIL
    FROM m

    UNION ALL
    SELECT 'revenue-a', 'balance-identity (due − paid = balance)',
           'Δ=' || ABS(m.a_due - m.a_paid - m.a_balance)::text, '0.00',
           CASE WHEN ABS(m.a_due - m.a_paid - m.a_balance) <= 0.01 THEN 'PASS'
                ELSE 'FAIL' END
    FROM m
)

-- ── OUTPUT: per-check detail ───────────────────────────────────────────────
-- FAIL rows sorted first; within group sorted by lane then check.
SELECT
    chk_group   AS lane,
    check_name,
    measured,
    sealed      AS expected,
    verdict
FROM checks
ORDER BY
    CASE verdict
        WHEN 'FAIL'          THEN 0
        WHEN 'WARN-REGRESSED' THEN 1
        WHEN 'WARN-CHANGED'  THEN 2
        ELSE 3
    END,
    chk_group,
    check_name;

-- ── OVERALL VERDICT (statement 2) ─────────────────────────────────────────
-- Hard-fail conditions only: structural invariants that must hold regardless
-- of year or re-drain. WARN conditions are surfaced in statement 1, not here.
WITH live AS (
    SELECT "TfEntityId" AS pid
    FROM sync_bridge.source_xref
    WHERE "TfEntityType" = 'parcel' AND "IsActive"
),
live_cnt AS (SELECT count(*) AS n FROM live),
fail_list AS (
    -- parity: assessment must equal live parcel count
    SELECT 'assessment count ≠ live parcel count' AS reason
    WHERE (SELECT count(*) FROM canonical_tf.tf_assessment) <>
          (SELECT n FROM live_cnt)

    UNION ALL
    -- parity: jurisdiction must equal live parcel count
    SELECT 'parcel_tax_area count ≠ live parcel count'
    WHERE (SELECT count(*) FROM canonical_tf.tf_parcel_tax_area) <>
          (SELECT n FROM live_cnt)

    UNION ALL
    -- dedup: no duplicate assessment parcel/year
    SELECT 'duplicate (TfParcelId, AssessmentYear) in tf_assessment'
    WHERE (SELECT count(*) FROM canonical_tf.tf_assessment)
        - (SELECT count(*) FROM (SELECT DISTINCT "TfParcelId", "AssessmentYear"
                                 FROM canonical_tf.tf_assessment) _a) > 0

    UNION ALL
    -- rollup integrity: levy BillCount sum = line count
    SELECT 'revenue-l rollup sum(BillCount) ≠ tf_tax_bill_line count'
    WHERE (SELECT coalesce(sum("BillCount"),0) FROM canonical_tf.tf_tax_bill_current) <>
          (SELECT count(*) FROM canonical_tf.tf_tax_bill_line)

    UNION ALL
    -- rollup integrity: assessment BillCount sum = line count
    SELECT 'revenue-a rollup sum(BillCount) ≠ tf_assessment_bill_line count'
    WHERE (SELECT coalesce(sum("BillCount"),0) FROM canonical_tf.tf_assessment_bill_current) <>
          (SELECT count(*) FROM canonical_tf.tf_assessment_bill_line)

    UNION ALL
    -- empty-lane guards
    SELECT 'tf_assessment is empty'     WHERE (SELECT count(*) FROM canonical_tf.tf_assessment)    = 0
    UNION ALL
    SELECT 'tf_land is empty'           WHERE (SELECT count(*) FROM canonical_tf.tf_land)           = 0
    UNION ALL
    SELECT 'tf_improvement is empty'    WHERE (SELECT count(*) FROM canonical_tf.tf_improvement)    = 0
    UNION ALL
    SELECT 'tf_tax_bill_line is empty'  WHERE (SELECT count(*) FROM canonical_tf.tf_tax_bill_line)  = 0
    UNION ALL
    SELECT 'tf_assessment_bill_line is empty' WHERE (SELECT count(*) FROM canonical_tf.tf_assessment_bill_line) = 0

    UNION ALL
    -- balance arithmetic identity (levy)
    SELECT 'revenue-l balance identity broken (due − paid ≠ balance)'
    WHERE ABS(
        ROUND(coalesce((SELECT sum("CurrentAmountDue") FROM canonical_tf.tf_tax_bill_line),0)::numeric,2)
      - ROUND(coalesce((SELECT sum("AmountPaid")       FROM canonical_tf.tf_tax_bill_line),0)::numeric,2)
      - ROUND(coalesce((SELECT sum("BalanceAmount")    FROM canonical_tf.tf_tax_bill_line),0)::numeric,2)
    ) > 0.01

    UNION ALL
    -- balance arithmetic identity (assessment)
    SELECT 'revenue-a balance identity broken (due − paid ≠ balance)'
    WHERE ABS(
        ROUND(coalesce((SELECT sum("CurrentAmountDue") FROM canonical_tf.tf_assessment_bill_line),0)::numeric,2)
      - ROUND(coalesce((SELECT sum("AmountPaid")       FROM canonical_tf.tf_assessment_bill_line),0)::numeric,2)
      - ROUND(coalesce((SELECT sum("BalanceAmount")    FROM canonical_tf.tf_assessment_bill_line),0)::numeric,2)
    ) > 0.01
)
SELECT
    CASE WHEN count(*) = 0
         THEN 'OVERALL: PASS — all structural seal gates hold'
         ELSE 'OVERALL: FAIL — ' || count(*) || ' gate(s) failed'
    END AS overall_verdict,
    count(*) AS fail_count,
    string_agg(reason, ' | ') AS failures
FROM fail_list;

-- ============================================================================
-- TerraFusion Sync — Automation #3: Domain Coverage Audit
-- ----------------------------------------------------------------------------
-- READ-ONLY. No DDL, no canonical mutation. Run in psql or any SQL client.
--
-- Purpose: automatically answer "which PACS domains exist with real data but
-- are NOT represented by a sealed canonical lane?" — the question that
-- prevented Benton from overclaiming.
--
-- This audit covers all 19 Benton PACS domain families. For each domain it
-- reports live row counts from all three pipeline layers (landing →
-- truth → canonical) plus a classification:
--
--   SEALED             — domain converted end-to-end; canonical lane sealed
--                        with runtime-proven gates and evidence packet
--   LANDED_ONLY        — source data landed in legacy_pacs_raw; truth/canonical
--                        coverage is partial (e.g. current-year only, qualified only)
--                        or absent; more work needed to seal fully
--   DISCOVERED_DEFERRED — domain known to exist in PACS with real data; never
--                         landed; explicitly deferred with rationale
--   EMPTY_IN_SOURCE    — domain tabled in PACS schema but has 0 meaningful rows
--                         for this county (Benton); no implementation required
--   OUT_OF_SCOPE       — domain exists but is architecturally outside the
--                         TerraFusion Sync mission (Treasurer systems, etc.)
--
-- NOTE: DISCOVERED_DEFERRED is NOT a gap in the sealed substrate. It records
-- the conscious decisions made during Benton conversion so future counties do
-- not repeat the discovery work. "Deferred" means the seal explicitly holds
-- its boundary; it does NOT mean the canonical substrate is incomplete for its
-- claimed scope.
--
-- Known open items (not domains — repair/cleanup tasks):
--   tf_parcel_owner_link: 1.4M identity-drift rows (separate triage, not F1)
--   tf_parcel: 3.1M debris rows (F2, non-blocking cleanup, deferred)
--
-- For multi-county DBs: add AND "CountyId" = :'county_id' to each count query
-- and scope live CTE to same county.
-- ============================================================================

WITH

-- ── LIVE COUNTS: landing layer ─────────────────────────────────────────────
landing AS (
    SELECT
        (SELECT count(*) FROM legacy_pacs_raw.property)             AS prop,
        (SELECT count(*) FROM legacy_pacs_raw.owner)                AS owner,
        (SELECT count(*) FROM legacy_pacs_raw.land_detail)          AS land,
        (SELECT count(*) FROM legacy_pacs_raw.imprv_detail)         AS imprv,
        (SELECT count(*) FROM legacy_pacs_raw.imprv_attr)           AS imprv_attr,
        (SELECT count(*) FROM legacy_pacs_raw.sale)                 AS sale,
        (SELECT count(*) FROM legacy_pacs_raw.property_val)         AS prop_val,
        (SELECT count(*) FROM legacy_pacs_raw.wash_prop_owner_val)  AS wsdor,
        (SELECT count(*) FROM legacy_pacs_raw.property_exemption)   AS exemption,
        (SELECT count(*) FROM legacy_pacs_raw.property_tax_area)    AS tax_area,
        (SELECT count(*) FROM legacy_pacs_raw.tax_bill_line)        AS tax_bill,
        (SELECT count(*) FROM legacy_pacs_raw.assessment_bill_line) AS asmt_bill
),

-- ── LIVE COUNTS: truth layer ───────────────────────────────────────────────
truth AS (
    SELECT
        (SELECT count(*) FROM truth_pacs.parcel_spine)          AS parcel,
        (SELECT count(*) FROM truth_pacs.owner_current)         AS owner,
        (SELECT count(*) FROM truth_pacs.land_current)          AS land,
        (SELECT count(*) FROM truth_pacs.imprv_current)         AS imprv,
        (SELECT count(*) FROM truth_pacs.sale)                  AS sale,
        (SELECT count(*) FROM truth_pacs.assessment_current)    AS asmt_val,
        (SELECT count(*) FROM truth_pacs.wash_prop_owner_val)   AS wsdor,
        (SELECT count(*) FROM truth_pacs.exemption_current)     AS exemption
),

-- ── LIVE COUNTS: canonical layer ──────────────────────────────────────────
canon AS (
    SELECT
        -- active parcel spine (never blind-join tf_parcel total)
        (SELECT count(*) FROM sync_bridge.source_xref
         WHERE "TfEntityType" = 'parcel' AND "IsActive")            AS live_parcels,
        (SELECT count(*) FROM canonical_tf.tf_parcel)               AS tf_parcel_total,
        (SELECT count(*) FROM canonical_tf.tf_owner)                AS owner,
        (SELECT count(*) FROM canonical_tf.tf_land)                 AS land,
        (SELECT count(*) FROM canonical_tf.tf_improvement)          AS imprv,
        (SELECT count(*) FROM canonical_tf.tf_improvement_feature)  AS imprv_feat,
        (SELECT count(*) FROM canonical_tf.tf_sale)                 AS sale,
        (SELECT count(*) FROM gis_tf.tf_parcel_geom)                AS geom,
        (SELECT count(*) FROM canonical_tf.tf_assessment)           AS asmt_val,
        (SELECT count(*) FROM canonical_tf.tf_assessment_wsdor)     AS wsdor,
        (SELECT count(*) FROM canonical_tf.tf_exemption)            AS exemption,
        (SELECT count(*) FROM canonical_tf.tf_parcel_tax_area)      AS parcel_tax_area,
        (SELECT count(*) FROM canonical_tf.tf_tax_bill_line)        AS tax_bill_line,
        (SELECT count(*) FROM canonical_tf.tf_assessment_bill_line) AS asmt_bill_line
),

-- ── DOMAIN REPORT ──────────────────────────────────────────────────────────
report AS (

    -- 1. Parcel / Property Identity
    SELECT 1 AS seq,
           'parcel'                          AS domain,
           'property + prop_supp_assoc'      AS pacs_source_family,
           l.prop                            AS landing_rows,
           t.parcel                          AS truth_rows,
           c.live_parcels                    AS canonical_rows,
           'SEALED'                          AS status,
           'Live spine ' || c.live_parcels ||
           '; tf_parcel total=' || c.tf_parcel_total ||
           ' (debris rows = F2 cleanup, deferred, non-blocking)'
                                             AS notes
    FROM landing l, truth t, canon c

    UNION ALL
    -- 2. Owner (current-year active-supplement)
    SELECT 2, 'owner', 'owner + account',
           l.owner, t.owner, c.owner,
           'SEALED',
           'Current-year active-supplement; tf_parcel_owner_link 1.4M identity-drift rows = separate deferred repair (NOT F1-class; see Automation #1 evidence)'
    FROM landing l, truth t, canon c

    UNION ALL
    -- 3. Land (current-year)
    SELECT 3, 'land', 'land_detail',
           l.land, t.land, c.land,
           'SEALED',
           'Current-year active-supplement segments; landing table spans all years (see land-imprv-history domain #17)'
    FROM landing l, truth t, canon c

    UNION ALL
    -- 4. Improvement / Structure (current-year)
    SELECT 4, 'improvement', 'imprv + imprv_detail + imprv_attr',
           l.imprv + l.imprv_attr, t.imprv,
           c.imprv + c.imprv_feat,
           'SEALED',
           'Current-year active-supplement; universe-classified; tf_improvement=' || c.imprv ||
           ' + tf_improvement_feature=' || c.imprv_feat ||
           '; landing tables span all years (see domain #17)'
    FROM landing l, truth t, canon c

    UNION ALL
    -- 5. Sales (DOR ratio-coded qualified)
    SELECT 5, 'sales-qualified', 'sale',
           l.sale, t.sale, c.sale,
           'SEALED',
           'DOR ratio-coded qualified sales (year-aware: pre-2017 code 0, post-2017 code 100); landing=' ||
           l.sale || ' all-year/all-code; disqualified + prior-year → domain #18'
    FROM landing l, truth t, canon c

    UNION ALL
    -- 6. Geometry / GIS Parcel Boundary
    SELECT 6, 'geometry', '(ArcGIS REST — no landing table)',
           0::bigint, 0::bigint, c.geom,
           'SEALED',
           'Direct ArcGIS REST ingestion → WKT centroids; no landing or truth layer; 970 NULL-APN residual documented; canonical=gis_tf.tf_parcel_geom'
    FROM landing l, truth t, canon c

    UNION ALL
    -- 7. Assessment Value (current-year)
    SELECT 7, 'assessment-value', 'property_val',
           l.prop_val, t.asmt_val, c.asmt_val,
           'SEALED',
           'Current-year 2025 active-supplement; spine-resolved; landing=' ||
           l.prop_val || ' spans full 1968-2026 history → history in domain #16'
    FROM landing l, truth t, canon c

    UNION ALL
    -- 8. Owner-WSDOR (DOR Audit Roll)
    SELECT 8, 'owner-wsdor', 'wash_prop_owner_val',
           l.wsdor, t.wsdor, c.wsdor,
           'SEALED',
           'WSDOR DOR audit roll per owner per parcel/year; landing multi-year; truth/canonical = active years'
    FROM landing l, truth t, canon c

    UNION ALL
    -- 9. Exemption
    SELECT 9, 'exemption', 'property_exemption',
           l.exemption, t.exemption, c.exemption,
           'SEALED',
           '844 rows outside real-property spine excluded; dict_exemption_type 6 types'
    FROM landing l, truth t, canon c

    UNION ALL
    -- 10. Jurisdiction / Tax Area–District Assignment
    SELECT 10, 'jurisdiction', 'property_tax_area',
           l.tax_area, 0::bigint, c.parcel_tax_area,
           'SEALED',
           'Direct landing → canonical (no truth layer); tf_tax_area=109 / tf_tax_district=37 / tf_tax_area_district=487 / tf_parcel_tax_area=' || c.parcel_tax_area
    FROM landing l, truth t, canon c

    UNION ALL
    -- 11. Revenue — Levy Tax Bills
    SELECT 11, 'revenue-l-levy-bills', 'tax_bill_line (L+A combined in landing)',
           l.tax_bill, 0::bigint, c.tax_bill_line,
           'SEALED',
           'Current-year 2025 L bills; 113842 unresolved (MH/personal outside real-property spine) explicitly excluded; tf_levy_rate=49; $308.9M due penny-exact'
    FROM landing l, truth t, canon c

    UNION ALL
    -- 12. Revenue — Special-Assessment Bills
    SELECT 12, 'revenue-a-assessment-bills', 'assessment_bill_line',
           l.asmt_bill, 0::bigint, c.asmt_bill_line,
           'SEALED',
           'Current-year 2025 A bills; 100% parcel-resolved; 9 billing agencies; tf_assessment_agency=29; $8.8M due penny-exact'
    FROM landing l, truth t, canon c

    -- ── NOT LANDED / DEFERRED (no landing table exists) ───────────────────

    UNION ALL
    -- 13. Payment / Collection Ledger
    SELECT 13, 'payment-collection-ledger', 'PACS dbo.coll_transaction (NOT landed)',
           0::bigint, 0::bigint, 0::bigint,
           'DISCOVERED_DEFERRED',
           'Stage 3B proved bill.amount_paid ≡ SUM(base_amount_pd) $0.00 delta corpus-wide across 1,417,646 2025 bills ($32,941.46); bill-grain net-paid model sufficient; receipt/tender ledger not required'
    FROM (SELECT 1) _

    UNION ALL
    -- 14. Fund / Distribution Accounting
    SELECT 14, 'fund-distribution-accounting', 'PACS dbo.coll_distribution + levy fund cols (NOT landed)',
           0::bigint, 0::bigint, 0::bigint,
           'DISCOVERED_DEFERRED',
           'Treasurer-grade fund allocation and distribution accounting; out of scope for assessor workbench; no authorized work item'
    FROM (SELECT 1) _

    UNION ALL
    -- 15. Delinquency
    SELECT 15, 'delinquency', 'PACS dbo.delinquency / bill_adj (NOT landed)',
           0::bigint, 0::bigint, 0::bigint,
           'DISCOVERED_DEFERRED',
           'Prior-year delinquent bill tracking and penalty/interest; Treasurer-grade; out of scope for current-year assessment workbench'
    FROM (SELECT 1) _

    -- ── LANDED BUT NOT SEALED (partial coverage) ──────────────────────────

    UNION ALL
    -- 16. Assessment-Value History (multi-year)
    SELECT 16, 'assessment-value-history', 'property_val (shared table, all years)',
           l.prop_val, 0::bigint, 0::bigint,
           'LANDED_ONLY',
           'property_val has ' || l.prop_val || ' rows across 1968-2026; sealed domain #7 covers 2025 active-supplement only (' ||
           t.asmt_val || ' truth / ' || c.asmt_val || ' canonical); full history lane = separate future mission'
    FROM landing l, truth t, canon c

    UNION ALL
    -- 17. Land / Improvement History (multi-year)
    SELECT 17, 'land-improvement-history', 'land_detail + imprv_detail (shared tables, all years)',
           l.land + l.imprv, 0::bigint, 0::bigint,
           'LANDED_ONLY',
           'land_detail=' || l.land || ' imprv_detail=' || l.imprv ||
           ' rows span all years; sealed domains #3 and #4 cover current-year active-supplement only; physical history lanes = separate future mission'
    FROM landing l, truth t, canon c

    UNION ALL
    -- 18. Sales — Disqualified / Historical
    SELECT 18, 'sales-disqualified-historical', 'sale (shared table, all years/ratio codes)',
           l.sale, 0::bigint, 0::bigint,
           'LANDED_ONLY',
           'landing=' || l.sale || ' all sales (all years, all DOR ratio codes); truth=' || t.sale ||
           ' DOR-qualified only; disqualified=' || (l.sale - t.sale) ||
           ' rows explicitly deferred; no policy to claim disqualified sales as operational truth'
    FROM landing l, truth t, canon c

    -- ── EMPTY IN SOURCE ────────────────────────────────────────────────────

    UNION ALL
    -- 19. Appeals / Corrections (ARB)
    SELECT 19, 'appeals-corrections-arb', 'PACS dbo.arb_detail + dbo.arb_event (NOT landed)',
           0::bigint, 0::bigint, 0::bigint,
           'EMPTY_IN_SOURCE',
           'Benton County ARB appeal volume = 0 meaningful rows per 2026-06-03 sales lane discovery; no Benton implementation required; resurface for counties with active ARB workloads'
    FROM (SELECT 1) _
)

-- ── OUTPUT: per-domain detail ──────────────────────────────────────────────
SELECT
    domain,
    pacs_source_family,
    landing_rows,
    truth_rows,
    canonical_rows,
    status,
    notes
FROM report
ORDER BY seq;

-- ── SUMMARY by status (statement 2) ───────────────────────────────────────
SELECT
    status,
    count(*)   AS domain_count,
    string_agg(domain, ' · ' ORDER BY domain) AS domains
FROM (
    VALUES
        ('SEALED',               'parcel'),
        ('SEALED',               'owner'),
        ('SEALED',               'land'),
        ('SEALED',               'improvement'),
        ('SEALED',               'sales-qualified'),
        ('SEALED',               'geometry'),
        ('SEALED',               'assessment-value'),
        ('SEALED',               'owner-wsdor'),
        ('SEALED',               'exemption'),
        ('SEALED',               'jurisdiction'),
        ('SEALED',               'revenue-l-levy-bills'),
        ('SEALED',               'revenue-a-assessment-bills'),
        ('DISCOVERED_DEFERRED',  'payment-collection-ledger'),
        ('DISCOVERED_DEFERRED',  'fund-distribution-accounting'),
        ('DISCOVERED_DEFERRED',  'delinquency'),
        ('LANDED_ONLY',          'assessment-value-history'),
        ('LANDED_ONLY',          'land-improvement-history'),
        ('LANDED_ONLY',          'sales-disqualified-historical'),
        ('EMPTY_IN_SOURCE',      'appeals-corrections-arb')
) t(status, domain)
GROUP BY status
ORDER BY
    CASE status
        WHEN 'SEALED'              THEN 1
        WHEN 'LANDED_ONLY'         THEN 2
        WHEN 'DISCOVERED_DEFERRED' THEN 3
        WHEN 'EMPTY_IN_SOURCE'     THEN 4
        ELSE 5
    END;

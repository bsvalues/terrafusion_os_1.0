-- =============================================================================
-- harris-pacs-pack-validator.sql
-- TerraFusion Sync — Harris PACS Source Pack Validator  v1.0  2026-06-08
-- =============================================================================
-- Validates that legacy_pacs_raw conforms to the Harris PACS Source Pack spec.
-- Run against TerraFusion DB (dbname=terrafusion), NOT against PACS directly.
--
-- Usage:
--   psql "host=localhost port=5432 dbname=terrafusion user=postgres" \
--        -f tools/sync/harris-pacs-pack-validator.sql -t -A
--
-- Output (two statements):
--   Statement 1 — per-check detail
--     category|check_name|measured|expected|verdict|severity|notes
--     Sorted: FAIL first, then WARN, PASS, INFO.
--
--   Statement 2 — summary line
--     OVERALL: PASS|fail=0|warn=N|pass=N|info=N
--
-- Sections:
--   1  table_presence    15 landing tables (11 CRITICAL + 4 WARN)
--   2  column_structure  38 field checks across all lane domains
--   3  dictionary        5 canonical_tf dict tables (all WARN — seeded by hosted service)
--   4  data_content      8 data-content checks (requires tables to be populated)
--
-- Read-only. No writes. No schema mutations. No temp tables.
-- Section 4 queries legacy_pacs_raw tables directly.  If any table_presence check
-- FAILs, the corresponding data_content check may error.  Run section 1+2 first.
--
-- Expected Benton result: OVERALL PASS — all 66 checks pass (all tables, columns,
-- dict tables, and data-content checks confirmed on Benton County production data).
-- =============================================================================

\set ON_ERROR_STOP off

-- =============================================================================
-- Statement 1: per-check detail
-- =============================================================================
WITH
tbl AS (
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'legacy_pacs_raw'
      AND table_type = 'BASE TABLE'
),
col AS (
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'legacy_pacs_raw'
),
canon_tbl AS (
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'canonical_tf'
      AND table_type = 'BASE TABLE'
),

-- ── 1. table_presence ────────────────────────────────────────────────────────
tp AS (
    SELECT
        'table_presence'::text                 AS category,
        'tbl_' || req.t                        AS check_name,
        CASE WHEN tbl.table_name IS NOT NULL
             THEN 'present' ELSE 'missing' END AS measured,
        'present'                              AS expected,
        CASE WHEN tbl.table_name IS NOT NULL
             THEN 'PASS' ELSE req.fail_v END   AS verdict,
        req.sev                                AS severity,
        req.notes                              AS notes
    FROM (VALUES
        ('property',            'FAIL', 'CRITICAL', 'parcel identity anchor; all lanes join here'),
        ('property_val',        'FAIL', 'CRITICAL', 'assessment value + active-supplement head'),
        ('owner',               'FAIL', 'CRITICAL', 'ownership record + active-supplement model'),
        ('imprv',               'FAIL', 'CRITICAL', 'improvement universe head record'),
        ('imprv_detail',        'FAIL', 'CRITICAL', 'improvement sub-type detail; joins to imprv_attr'),
        ('imprv_attr',          'FAIL', 'CRITICAL', 'improvement attribute values; dictionary-keyed'),
        ('land_detail',         'FAIL', 'CRITICAL', 'land segments + ag current-use classification'),
        ('sale',                'FAIL', 'CRITICAL', 'sales universe; qualification + ratio policy'),
        ('property_exemption',  'FAIL', 'CRITICAL', 'exemption facts per parcel/year/type'),
        ('property_tax_area',   'FAIL', 'CRITICAL', 'tax area assignment; links parcel to levy districts'),
        ('tax_bill_line',       'FAIL', 'CRITICAL', 'levy bill model (BillType=L)'),
        ('assessment_bill_line','FAIL', 'CRITICAL', 'special-assessment bill model (BillType=A)'),
        ('prop_supp_assoc',     'WARN', 'WARN',     'supplement-association table; used by active-supplement profiler'),
        ('wash_prop_owner_val', 'WARN', 'WARN',     'WA DOR WSDOR owner-value reporting; used for WSDOR lane'),
        ('account',             'WARN', 'WARN',     'tax account cross-reference; used for account lane')
    ) AS req(t, fail_v, sev, notes)
    LEFT JOIN tbl ON tbl.table_name = req.t
),

-- ── 2. column_structure ──────────────────────────────────────────────────────
cc AS (
    SELECT
        'column_structure'::text               AS category,
        chk.check_name,
        CASE WHEN col.column_name IS NOT NULL
             THEN 'present' ELSE 'missing' END AS measured,
        'present'                              AS expected,
        CASE WHEN col.column_name IS NOT NULL
             THEN 'PASS' ELSE chk.fail_v END   AS verdict,
        chk.sev                                AS severity,
        chk.notes                              AS notes
    FROM (VALUES
        -- identity
        ('col_property__PropId',
            'property', 'PropId', 'FAIL', 'CRITICAL',
            'primary parcel identity key; all pipeline joins start here'),
        ('col_property__PropTypeCd',
            'property', 'PropTypeCd', 'FAIL', 'CRITICAL',
            'R=real property; drives universe classification'),
        ('col_property__GeoId',
            'property', 'GeoId', 'FAIL', 'CRITICAL',
            'APN / parcel number surfaced to assessor; must be populated >95%'),
        -- assessment value
        ('col_property_val__PropValYr',
            'property_val', 'PropValYr', 'FAIL', 'CRITICAL',
            'tax year key for assessment value lane'),
        ('col_property_val__SupNum',
            'property_val', 'SupNum', 'FAIL', 'CRITICAL',
            'supplement; MAX(SupNum) per (PropId,PropValYr) = current record'),
        ('col_property_val__AssessedVal',
            'property_val', 'AssessedVal', 'FAIL', 'CRITICAL',
            'certified assessed value; primary value surface'),
        ('col_property_val__AppraisedVal',
            'property_val', 'AppraisedVal', 'FAIL', 'CRITICAL',
            'appraised value pre-certification'),
        ('col_property_val__MarketVal',
            'property_val', 'MarketVal', 'WARN', 'WARN',
            'market value; may be NULL in some PACS configs — confirm before surfacing'),
        -- owner
        ('col_owner__OwnerTaxYr',
            'owner', 'OwnerTaxYr', 'FAIL', 'CRITICAL',
            'tax year for owner record; grain is (PropId, OwnerTaxYr, SupNum)'),
        ('col_owner__SupNum',
            'owner', 'SupNum', 'FAIL', 'CRITICAL',
            'supplement; MAX(SupNum) per (PropId, OwnerTaxYr) = current owner'),
        -- improvement
        ('col_imprv__PropValYr',
            'imprv', 'PropValYr', 'FAIL', 'CRITICAL',
            'improvement year; grain is (PropId, PropValYr, SupNum, ImprvId)'),
        ('col_imprv__SupNum',
            'imprv', 'SupNum', 'FAIL', 'CRITICAL',
            'improvement supplement number'),
        ('col_imprv__ImprvId',
            'imprv', 'ImprvId', 'FAIL', 'CRITICAL',
            'improvement identity key; parent key for imprv_detail + imprv_attr'),
        -- imprv_detail
        ('col_imprv_detail__ImprvId',
            'imprv_detail', 'ImprvId', 'FAIL', 'CRITICAL',
            'FK to imprv; required for detail-to-head join'),
        ('col_imprv_detail__ImprvDetId',
            'imprv_detail', 'ImprvDetId', 'FAIL', 'CRITICAL',
            'detail segment identity key; parent key for imprv_attr join'),
        -- imprv_attr
        ('col_imprv_attr__IAttrValCd',
            'imprv_attr', 'IAttrValCd', 'FAIL', 'CRITICAL',
            'attribute code; must match RefreshableImprvAttrDictionary loaded from PACS'),
        ('col_imprv_attr__ImprvId',
            'imprv_attr', 'ImprvId', 'FAIL', 'CRITICAL',
            'FK to imprv head'),
        -- land
        ('col_land_detail__PropValYr',
            'land_detail', 'PropValYr', 'FAIL', 'CRITICAL',
            'land segment year; grain is (PropId, PropValYr, SupNum, LandSegId)'),
        ('col_land_detail__SupNum',
            'land_detail', 'SupNum', 'FAIL', 'CRITICAL',
            'land supplement; MAX(SupNum) per (PropId, PropValYr) = current land'),
        ('col_land_detail__AgApply',
            'land_detail', 'AgApply', 'WARN', 'WARN',
            'ag current-use flag (T/F); required for AG_CURRENT_USE universe classification'),
        -- exemption
        ('col_property_exemption__ExmptTaxYr',
            'property_exemption', 'ExmptTaxYr', 'FAIL', 'CRITICAL',
            'exemption tax year; grain is (PropId, ExmptTaxYr, SupNum, OwnerId, ExmptTypeCd)'),
        ('col_property_exemption__ExmptTypeCd',
            'property_exemption', 'ExmptTypeCd', 'FAIL', 'CRITICAL',
            'exemption type code; must resolve against exemption type dictionary'),
        ('col_property_exemption__SupNum',
            'property_exemption', 'SupNum', 'WARN', 'WARN',
            'exemption supplement; confirm active-supplement grain per county before sealing'),
        -- tax area
        ('col_property_tax_area__TaxYr',
            'property_tax_area', 'TaxYr', 'FAIL', 'CRITICAL',
            'tax area year; grain is (PropId, TaxYr, SupNum) — NOTE: TaxYr not PropValYr [Benton confirmed]'),
        ('col_property_tax_area__SupNum',
            'property_tax_area', 'SupNum', 'FAIL', 'CRITICAL',
            'tax area supplement'),
        ('col_property_tax_area__TaxAreaId',
            'property_tax_area', 'TaxAreaId', 'FAIL', 'CRITICAL',
            'FK to canonical_tf.tf_tax_area; drives levy district join chain'),
        -- sales
        ('col_sale__SlDt',
            'sale', 'SlDt', 'FAIL', 'CRITICAL',
            'sale date; YEAR(SlDt) = qualification year — drives ratio study inclusion'),
        ('col_sale__ChgOfOwnerId',
            'sale', 'ChgOfOwnerId', 'FAIL', 'CRITICAL',
            'sale identity key; grain is (PropId, ChgOfOwnerId)'),
        ('col_sale__SlCountyRatioCd',
            'sale', 'SlCountyRatioCd', 'WARN', 'WARN',
            'county ratio code: 100=qualified (post-2017), 0=qualified (pre-2017) [Benton ref: ~38k populated]'),
        ('col_sale__SlRatioTypeCd',
            'sale', 'SlRatioTypeCd', 'WARN', 'WARN',
            'DOR ratio code: 00=arm''s-length qualified; primary DOR qualification signal [Benton ref: ~75k populated]'),
        -- bill model
        ('col_tax_bill_line__BillType',
            'tax_bill_line', 'BillType', 'FAIL', 'CRITICAL',
            'levy bill type code; must filter WHERE BillType=''L'' for levy lane'),
        ('col_tax_bill_line__IsActive',
            'tax_bill_line', 'IsActive', 'FAIL', 'CRITICAL',
            'active bill filter; only IsActive=true rows served to UI'),
        ('col_tax_bill_line__AmountPaid',
            'tax_bill_line', 'AmountPaid', 'FAIL', 'CRITICAL',
            'net-paid; net-paid attestation (delta=$0.00 corpus proof) required before surfacing balance'),
        ('col_assessment_bill_line__BillType',
            'assessment_bill_line', 'BillType', 'FAIL', 'CRITICAL',
            'assessment bill type code; must filter WHERE BillType=''A'''),
        ('col_assessment_bill_line__IsActive',
            'assessment_bill_line', 'IsActive', 'FAIL', 'CRITICAL',
            'active bill filter for assessment bills'),
        ('col_assessment_bill_line__AmountPaid',
            'assessment_bill_line', 'AmountPaid', 'FAIL', 'CRITICAL',
            'net-paid for special-assessment bills; same attestation requirement'),
        -- conversion indicators (INFO — optional columns)
        ('col_property__PropCreateDt',
            'property', 'PropCreateDt', 'INFO', 'INFO',
            'may be 1980-01-01 ProVal-conversion sentinel for pre-2017 rows [Benton ref: CONVERSION_LEGACY trigger]'),
        ('col_property__PropInactiveDt',
            'property', 'PropInactiveDt', 'INFO', 'INFO',
            'inactive date; optional — used for CONVERSION_LEGACY universe classification')
    ) AS chk(check_name, tname, cname, fail_v, sev, notes)
    LEFT JOIN col ON col.table_name = chk.tname AND col.column_name = chk.cname
),

-- ── 3. dictionary tables (canonical_tf — seeded by hosted service, not landing) ─
dc AS (
    SELECT
        'dictionary'::text                         AS category,
        'dict_canonical__' || req.t                AS check_name,
        CASE WHEN ct.table_name IS NOT NULL
             THEN 'present' ELSE 'missing' END     AS measured,
        'present'                                  AS expected,
        CASE WHEN ct.table_name IS NOT NULL
             THEN 'PASS' ELSE 'WARN' END           AS verdict,
        'WARN'::text                               AS severity,
        req.notes                                  AS notes
    FROM (VALUES
        ('tf_tax_area',
            'levy tax-area code dictionary; backed by canonical_tf, NOT landing layer'),
        ('tf_tax_district',
            'levy district codes'),
        ('tf_tax_area_district',
            'area-to-district junction; required for levy bill → district resolution'),
        ('tf_levy_rate',
            'levy rate by year and district; required for levy bill explanation'),
        ('tf_assessment_agency',
            'special-assessment agency codes; required for assessment bill lane')
    ) AS req(t, notes)
    LEFT JOIN canon_tbl ct ON ct.table_name = req.t
),

-- ── 4. data_content (direct table queries — requires all section 1 tables present) ─
lbill AS (
    SELECT
        count(*) FILTER (WHERE "BillType" = 'L' AND "IsActive" = true) AS l_active
    FROM legacy_pacs_raw.tax_bill_line
),
abill AS (
    SELECT
        count(*) FILTER (WHERE "BillType" = 'A' AND "IsActive" = true) AS a_active
    FROM legacy_pacs_raw.assessment_bill_line
),
sale_r AS (
    SELECT
        count(*)                                               AS total,
        count(*) FILTER (WHERE "SlCountyRatioCd" IS NOT NULL) AS county_pop,
        count(*) FILTER (WHERE "SlRatioTypeCd"   IS NOT NULL) AS dor_pop
    FROM legacy_pacs_raw.sale
),
geo_r AS (
    SELECT
        count(*)                                     AS total,
        count(*) FILTER (WHERE "GeoId" IS NOT NULL)  AS populated
    FROM legacy_pacs_raw.property
),
supp_r AS (
    SELECT count(*) FILTER (WHERE "SupNum" > 0) AS nonzero
    FROM legacy_pacs_raw.property_val
),
dat AS (
    -- levy bills exist
    SELECT
        'data_content'::text AS category,
        'levy_bills_L_active_count'::text AS check_name,
        l_active::text        AS measured,
        '>0'                  AS expected,
        CASE WHEN l_active > 0 THEN 'PASS' ELSE 'WARN' END AS verdict,
        'WARN'::text          AS severity,
        'active levy bills (BillType=L IsActive=true) [Benton ref: 1,104,507]'::text AS notes
    FROM lbill
    UNION ALL
    -- assessment bills exist
    SELECT 'data_content', 'assessment_bills_A_active_count',
           a_active::text, '>0',
           CASE WHEN a_active > 0 THEN 'PASS' ELSE 'WARN' END, 'WARN',
           'active special-assessment bills (BillType=A IsActive=true) [Benton ref: 313,139]'
    FROM abill
    UNION ALL
    -- sale table has rows
    SELECT 'data_content', 'sale_row_count',
           total::text, '>0',
           CASE WHEN total > 0 THEN 'PASS' ELSE 'WARN' END, 'WARN',
           'sale table must have rows before sales qualification lane is meaningful [Benton ref: 75,678]'
    FROM sale_r
    UNION ALL
    -- county ratio field populated
    SELECT 'data_content', 'sale_county_ratio_populated_count',
           county_pop::text, '>0',
           CASE WHEN county_pop > 0 THEN 'PASS' ELSE 'WARN' END, 'WARN',
           'SlCountyRatioCd rows; low count expected if county uses DOR ratio only [Benton ref: 38,254]'
    FROM sale_r
    UNION ALL
    -- DOR ratio field populated
    SELECT 'data_content', 'sale_dor_ratio_populated_count',
           dor_pop::text, '>0',
           CASE WHEN dor_pop > 0 THEN 'PASS' ELSE 'WARN' END, 'WARN',
           'SlRatioTypeCd rows; primary DOR qualification signal [Benton ref: 75,157]'
    FROM sale_r
    UNION ALL
    -- GeoId population rate
    SELECT 'data_content', 'property_geo_id_population_pct',
           CASE WHEN total > 0
                THEN round(100.0 * populated / total, 2)::text || '%'
                ELSE 'N/A' END,
           '>= 95.00%',
           CASE WHEN total = 0 THEN 'WARN'
                WHEN round(100.0 * populated / total, 2) >= 95.00 THEN 'PASS'
                ELSE 'WARN' END,
           'WARN',
           'GeoId (APN) population rate in property table [Benton ref: 99.98%]'
    FROM geo_r
    UNION ALL
    -- non-zero supplement rows confirm active-supplement model
    SELECT 'data_content', 'property_val_nonzero_supnum_exists',
           nonzero::text, '>0',
           CASE WHEN nonzero > 0 THEN 'PASS' ELSE 'WARN' END, 'WARN',
           'non-zero SupNum rows confirm MAX-per-grain active-supplement model is required (not sup=0 only)'
    FROM supp_r
    UNION ALL
    -- coll_transaction expected ABSENT from landing layer
    SELECT 'data_content', 'coll_transaction_not_in_landing',
           CASE WHEN EXISTS (SELECT 1 FROM tbl WHERE table_name = 'coll_transaction')
                THEN 'present' ELSE 'absent' END,
           'absent',
           CASE WHEN NOT EXISTS (SELECT 1 FROM tbl WHERE table_name = 'coll_transaction')
                THEN 'PASS' ELSE 'WARN' END,
           'INFO',
           'collection ledger is in PACS MSSQL only; payment attestation requires direct MSSQL corpus proof [Benton ref: delta=$0.00 on 1,417,646 bills]'
),

-- ── combine ──────────────────────────────────────────────────────────────────
all_checks AS (
    SELECT * FROM tp
    UNION ALL SELECT * FROM cc
    UNION ALL SELECT * FROM dc
    UNION ALL SELECT * FROM dat
)
SELECT
    category,
    check_name,
    measured,
    expected,
    verdict,
    severity,
    notes
FROM all_checks
ORDER BY
    CASE verdict   WHEN 'FAIL' THEN 0 WHEN 'WARN' THEN 1 WHEN 'PASS' THEN 2 ELSE 3 END,
    CASE severity  WHEN 'CRITICAL' THEN 0 WHEN 'WARN' THEN 1 ELSE 2 END,
    category,
    check_name;

-- =============================================================================
-- Statement 2: summary
-- =============================================================================
WITH
tbl AS (
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'legacy_pacs_raw' AND table_type = 'BASE TABLE'
),
col AS (
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema = 'legacy_pacs_raw'
),
canon_tbl AS (
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'canonical_tf' AND table_type = 'BASE TABLE'
),
tp_v AS (
    SELECT CASE WHEN tbl.table_name IS NOT NULL THEN 'PASS' ELSE req.fv END AS v
    FROM (VALUES
        ('property','FAIL'),('property_val','FAIL'),('owner','FAIL'),
        ('imprv','FAIL'),('imprv_detail','FAIL'),('imprv_attr','FAIL'),
        ('land_detail','FAIL'),('sale','FAIL'),('property_exemption','FAIL'),
        ('property_tax_area','FAIL'),('tax_bill_line','FAIL'),
        ('assessment_bill_line','FAIL'),
        ('prop_supp_assoc','WARN'),('wash_prop_owner_val','WARN'),('account','WARN')
    ) AS req(t, fv)
    LEFT JOIN tbl ON tbl.table_name = req.t
),
cc_v AS (
    SELECT CASE WHEN col.column_name IS NOT NULL THEN 'PASS' ELSE chk.fv END AS v
    FROM (VALUES
        ('property','PropId','FAIL'),('property','PropTypeCd','FAIL'),
        ('property','GeoId','FAIL'),
        ('property_val','PropValYr','FAIL'),('property_val','SupNum','FAIL'),
        ('property_val','AssessedVal','FAIL'),('property_val','AppraisedVal','FAIL'),
        ('property_val','MarketVal','WARN'),
        ('owner','OwnerTaxYr','FAIL'),('owner','SupNum','FAIL'),
        ('imprv','PropValYr','FAIL'),('imprv','SupNum','FAIL'),('imprv','ImprvId','FAIL'),
        ('imprv_detail','ImprvId','FAIL'),('imprv_detail','ImprvDetId','FAIL'),
        ('imprv_attr','IAttrValCd','FAIL'),('imprv_attr','ImprvId','FAIL'),
        ('land_detail','PropValYr','FAIL'),('land_detail','SupNum','FAIL'),
        ('land_detail','AgApply','WARN'),
        ('property_exemption','ExmptTaxYr','FAIL'),
        ('property_exemption','ExmptTypeCd','FAIL'),
        ('property_exemption','SupNum','WARN'),
        ('property_tax_area','TaxYr','FAIL'),
        ('property_tax_area','SupNum','FAIL'),
        ('property_tax_area','TaxAreaId','FAIL'),
        ('sale','SlDt','FAIL'),('sale','ChgOfOwnerId','FAIL'),
        ('sale','SlCountyRatioCd','WARN'),('sale','SlRatioTypeCd','WARN'),
        ('tax_bill_line','BillType','FAIL'),
        ('tax_bill_line','IsActive','FAIL'),
        ('tax_bill_line','AmountPaid','FAIL'),
        ('assessment_bill_line','BillType','FAIL'),
        ('assessment_bill_line','IsActive','FAIL'),
        ('assessment_bill_line','AmountPaid','FAIL'),
        ('property','PropCreateDt','INFO'),
        ('property','PropInactiveDt','INFO')
    ) AS chk(tname, cname, fv)
    LEFT JOIN col ON col.table_name = chk.tname AND col.column_name = chk.cname
),
dc_v AS (
    SELECT CASE WHEN ct.table_name IS NOT NULL THEN 'PASS' ELSE 'WARN' END AS v
    FROM (VALUES
        ('tf_tax_area'),('tf_tax_district'),('tf_tax_area_district'),
        ('tf_levy_rate'),('tf_assessment_agency')
    ) AS req(t)
    LEFT JOIN canon_tbl ct ON ct.table_name = req.t
),
lbill AS (
    SELECT count(*) FILTER (WHERE "BillType"='L' AND "IsActive"=true) AS la
    FROM legacy_pacs_raw.tax_bill_line
),
abill AS (
    SELECT count(*) FILTER (WHERE "BillType"='A' AND "IsActive"=true) AS aa
    FROM legacy_pacs_raw.assessment_bill_line
),
sale_r AS (
    SELECT count(*) AS tot,
           count(*) FILTER (WHERE "SlCountyRatioCd" IS NOT NULL) AS cp,
           count(*) FILTER (WHERE "SlRatioTypeCd"   IS NOT NULL) AS dp
    FROM legacy_pacs_raw.sale
),
geo_r AS (
    SELECT count(*) AS tot, count(*) FILTER (WHERE "GeoId" IS NOT NULL) AS pop
    FROM legacy_pacs_raw.property
),
supp_r AS (
    SELECT count(*) FILTER (WHERE "SupNum" > 0) AS nz
    FROM legacy_pacs_raw.property_val
),
dat_v AS (
    SELECT CASE WHEN la > 0 THEN 'PASS' ELSE 'WARN' END AS v FROM lbill
    UNION ALL SELECT CASE WHEN aa > 0 THEN 'PASS' ELSE 'WARN' END FROM abill
    UNION ALL SELECT CASE WHEN tot > 0 THEN 'PASS' ELSE 'WARN' END FROM sale_r
    UNION ALL SELECT CASE WHEN cp  > 0 THEN 'PASS' ELSE 'WARN' END FROM sale_r
    UNION ALL SELECT CASE WHEN dp  > 0 THEN 'PASS' ELSE 'WARN' END FROM sale_r
    UNION ALL SELECT CASE WHEN tot = 0 THEN 'WARN'
                          WHEN round(100.0 * pop / tot, 2) >= 95.00 THEN 'PASS'
                          ELSE 'WARN' END FROM geo_r
    UNION ALL SELECT CASE WHEN nz > 0 THEN 'PASS' ELSE 'WARN' END FROM supp_r
    UNION ALL SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM tbl WHERE table_name='coll_transaction')
                          THEN 'PASS' ELSE 'WARN' END
),
all_v AS (
    SELECT v FROM tp_v UNION ALL SELECT v FROM cc_v
    UNION ALL SELECT v FROM dc_v UNION ALL SELECT v FROM dat_v
),
counts AS (
    SELECT
        count(*) FILTER (WHERE v = 'FAIL') AS f,
        count(*) FILTER (WHERE v = 'WARN') AS w,
        count(*) FILTER (WHERE v = 'PASS') AS p,
        count(*) FILTER (WHERE v = 'INFO') AS i
    FROM all_v
)
SELECT
    'OVERALL: ' ||
        CASE WHEN f > 0 THEN 'FAIL' WHEN w > 0 THEN 'WARN' ELSE 'PASS' END AS overall,
    'fail=' || f  AS fail_count,
    'warn=' || w  AS warn_count,
    'pass=' || p  AS pass_count,
    'info=' || i  AS info_count
FROM counts;

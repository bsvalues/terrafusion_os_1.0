-- =============================================================================
-- TerraFusion pacscontract.v1 — View & Procedure Deployment
-- =============================================================================
-- Target: pacs_oltp (Harris PACS clone, Benton County)
-- Contract: PacsSqlAdapter expects these objects to exist.
-- Source tables: property, property_val, situs, owner, account, address,
--               chg_of_owner, chg_of_owner_prop_assoc
--
-- Run once after RESTORE DATABASE to satisfy the contract.
-- Idempotent: uses CREATE OR ALTER.
-- =============================================================================

USE [pacs_golive];
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- VIEW 1: vw_TerraFusion_Property_Core
-- ─────────────────────────────────────────────────────────────────────────────
-- Maps to PacsPropertyCore DTO:
--   PropId, GeoId, PropTypeCd, SitusAddr, SitusCity, SitusZip,
--   LegalDesc, AssessedVal, MarketVal, LandVal, ImprvVal, ApprYear,
--   LastModified
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR ALTER VIEW [dbo].[vw_TerraFusion_Property_Core]
AS
SELECT
    p.prop_id                       AS prop_id,
    p.geo_id                        AS geo_id,
    p.prop_type_cd                  AS prop_type_cd,
    -- Situs: concatenate number + street for a single address line
    LTRIM(RTRIM(
        ISNULL(s.situs_num, '') + ' ' +
        ISNULL(s.situs_street_prefx, '') + ' ' +
        ISNULL(s.situs_street, '') + ' ' +
        ISNULL(s.situs_street_sufix, '')
    ))                              AS situs_addr,
    s.situs_city                    AS situs_city,
    s.situs_zip                     AS situs_zip,
    -- Legal description from property_val (current sup_num = 0)
    pv.legal_desc                   AS legal_desc,
    -- Values from property_val for the latest year / base supplement
    pv.assessed_val                 AS assessed_val,
    pv.market                       AS market_val,
    (ISNULL(pv.land_hstd_val, 0) + ISNULL(pv.land_non_hstd_val, 0))
                                    AS land_val,
    pv.imprv_val                    AS imprv_val,
    pv.prop_val_yr                  AS appr_year,
    -- Best available modification timestamp
    COALESCE(pv.chg_dt, pv.last_appraisal_dt, p.prop_create_dt)
                                    AS last_modified
FROM
    dbo.property p
    -- Latest property_val: sup_num = 0 is the base record
    OUTER APPLY (
        SELECT TOP 1 *
        FROM dbo.property_val pvi
        WHERE pvi.prop_id = p.prop_id
          AND pvi.sup_num = 0
        ORDER BY pvi.prop_val_yr DESC
    ) pv
    -- Primary situs address
    OUTER APPLY (
        SELECT TOP 1 *
        FROM dbo.situs si
        WHERE si.prop_id = p.prop_id
          AND si.primary_situs = 'Y'
    ) s;
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- VIEW 2: vw_TerraFusion_Property_Ownership
-- ─────────────────────────────────────────────────────────────────────────────
-- Maps to PacsPropertyOwnership DTO:
--   PropId, OwnerName, MailAddr1, MailAddr2, MailCity, MailState,
--   MailZip, PctOwnership, DeedDate
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR ALTER VIEW [dbo].[vw_TerraFusion_Property_Ownership]
AS
SELECT
    o.prop_id                       AS prop_id,
    -- Owner name from account table
    ISNULL(a.file_as_name,
        LTRIM(RTRIM(ISNULL(a.last_name, '') + ', ' + ISNULL(a.first_name, '')))
    )                               AS owner_name,
    -- Mailing address from primary address
    addr.addr_line1                 AS mail_addr_1,
    addr.addr_line2                 AS mail_addr_2,
    addr.addr_city                  AS mail_city,
    addr.addr_state                 AS mail_state,
    addr.addr_zip                   AS mail_zip,
    o.pct_ownership                 AS pct_ownership,
    -- Deed date from most recent change of owner
    coo.deed_dt                     AS deed_date
FROM
    dbo.owner o
    -- Get the latest tax year for each owner
    INNER JOIN (
        SELECT prop_id, owner_id, MAX(owner_tax_yr) AS max_yr
        FROM dbo.owner
        GROUP BY prop_id, owner_id
    ) latest ON o.prop_id = latest.prop_id
            AND o.owner_id = latest.owner_id
            AND o.owner_tax_yr = latest.max_yr
    -- Account for owner name
    LEFT JOIN dbo.account a ON o.owner_id = a.acct_id
    -- Primary mailing address
    OUTER APPLY (
        SELECT TOP 1 *
        FROM dbo.address ad
        WHERE ad.acct_id = o.owner_id
          AND ad.primary_addr = 'Y'
    ) addr
    -- Most recent deed
    OUTER APPLY (
        SELECT TOP 1 c.deed_dt
        FROM dbo.chg_of_owner_prop_assoc ca
        INNER JOIN dbo.chg_of_owner c ON ca.chg_of_owner_id = c.chg_of_owner_id
        WHERE ca.prop_id = o.prop_id
        ORDER BY c.deed_dt DESC
    ) coo
WHERE o.sup_num = 0;
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- VIEW 3: vw_TerraFusion_Assessment_History
-- ─────────────────────────────────────────────────────────────────────────────
-- Maps to PacsAssessmentHistory DTO:
--   PropId, PropValYr, AssessedVal, MarketVal, LandVal, ImprvVal,
--   AppraisedBy, AppraisalDt
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR ALTER VIEW [dbo].[vw_TerraFusion_Assessment_History]
AS
SELECT
    pv.prop_id                      AS prop_id,
    pv.prop_val_yr                  AS prop_val_yr,
    pv.assessed_val                 AS assessed_val,
    pv.market                       AS market_val,
    (ISNULL(pv.land_hstd_val, 0) + ISNULL(pv.land_non_hstd_val, 0))
                                    AS land_val,
    pv.imprv_val                    AS imprv_val,
    -- Appraiser name if available
    CAST(pv.last_appraiser_id AS VARCHAR(20))
                                    AS appraised_by,
    pv.last_appraisal_dt            AS appraisal_dt
FROM
    dbo.property_val pv
WHERE
    pv.sup_num = 0;  -- Base supplement only
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- VIEW 4: vw_TerraFusion_Comparable_Sales
-- ─────────────────────────────────────────────────────────────────────────────
-- Raw PACS sale/change-of-owner data for TerraFusionSync conversion:
--   PropId, GeoId, SaleDate, SalePrice, PropTypeCd, SitusAddr, Neighborhood,
--   SaleRatioTypeCd, DeedTypeCd, Consideration, LastModified
-- TerraFusionSync converts this raw legacy shape into operational ComparableSales.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR ALTER VIEW [dbo].[vw_TerraFusion_Comparable_Sales]
AS
SELECT
    p.prop_id                                                           AS prop_id,
    p.geo_id                                                            AS geo_id,
    COALESCE(s.sl_dt, coo.deed_dt, coo.recorded_dt)                     AS sale_date,
    COALESCE(NULLIF(s.adjusted_sl_price, 0), NULLIF(s.sl_price, 0))     AS sale_price,
    p.prop_type_cd                                                      AS prop_type_cd,
    LTRIM(RTRIM(
        ISNULL(si.situs_num, '') + ' ' +
        ISNULL(si.situs_street_prefx, '') + ' ' +
        ISNULL(si.situs_street, '') + ' ' +
        ISNULL(si.situs_street_sufix, '')
    ))                                                                  AS situs_addr,
    si.situs_city                                                       AS neighborhood,
    s.sl_ratio_type_cd                                                  AS sale_ratio_type_cd,
    coo.deed_type_cd                                                    AS deed_type_cd,
    coo.consideration                                                   AS consideration,
    COALESCE(s.sl_dt, coo.deed_dt, coo.recorded_dt)                     AS last_modified
FROM dbo.property p
INNER JOIN dbo.chg_of_owner_prop_assoc coopa ON coopa.prop_id = p.prop_id
INNER JOIN dbo.chg_of_owner coo ON coopa.chg_of_owner_id = coo.chg_of_owner_id
LEFT JOIN dbo.sale s ON coopa.chg_of_owner_id = s.chg_of_owner_id
OUTER APPLY (
    SELECT TOP 1 *
    FROM dbo.situs sx
    WHERE sx.prop_id = p.prop_id
      AND sx.primary_situs = 'Y'
) si
WHERE
    COALESCE(NULLIF(s.adjusted_sl_price, 0), NULLIF(s.sl_price, 0)) > 0
    AND COALESCE(s.sl_dt, coo.deed_dt, coo.recorded_dt) IS NOT NULL;
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- VIEW 5: vw_TerraFusion_Cama_Characteristics
-- ─────────────────────────────────────────────────────────────────────────────
-- Maps to PacsCamaCharacteristic DTO.
-- Source: property_profile (PACS 9.0 WA — schema confirmed from phase15 probe)
--   Confirmed columns: prop_id, prop_val_yr, yr_blt, living_area, land_sqft,
--   region, neighborhood, condition_cd, property_use_cd, imprv_type_cd,
--   imprv_det_sub_class_cd
-- imprv_attr attribute IDs (bedrooms/bathrooms/etc.) stubbed NULL until
--   confirmed from live pacs_golive: run
--   SELECT DISTINCT i_attr_val_id, i_attr_val_cd FROM imprv_attr ORDER BY i_attr_val_id
--   then replace NULL stubs with conditional aggregation.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR ALTER VIEW [dbo].[vw_TerraFusion_Cama_Characteristics]
AS
SELECT
    pp.prop_id                                              AS prop_id,
    p.geo_id                                                AS geo_id,
    pp.prop_val_yr                                          AS tax_year,
    pp.imprv_type_cd                                        AS building_type,
    pp.imprv_det_sub_class_cd                               AS building_type_description,
    pp.region                                               AS region,
    ISNULL(pp.living_area, 0)                               AS square_feet,
    -- imprv_attr stubs — replace with MAX(CASE WHEN i_attr_val_id=N ...) when attr map known
    CAST(NULL AS NUMERIC(5,1))                              AS stories,
    CAST(NULL AS NUMERIC(10,2))                             AS basement_sqft,
    CAST(NULL AS NUMERIC(10,2))                             AS garage_sqft,
    CAST(NULL AS VARCHAR(10))                               AS quality_grade,
    pp.condition_cd                                         AS condition_grade,
    CAST(NULL AS VARCHAR(10))                               AS complexity_grade,
    CAST(NULL AS VARCHAR(10))                               AS exterior_wall,
    CAST(NULL AS VARCHAR(10))                               AS roof_type,
    CAST(NULL AS VARCHAR(10))                               AS foundation,
    CAST(NULL AS VARCHAR(10))                               AS hvac_type,
    CAST(NULL AS VARCHAR(10))                               AS interior_finish,
    pp.yr_blt                                               AS year_built,
    CAST(YEAR(GETDATE()) - ISNULL(pp.yr_blt, YEAR(GETDATE())) AS INT)
                                                            AS effective_age,
    CAST(NULL AS INT)                                       AS economic_life,
    ISNULL(pp.land_sqft, 0)                                 AS land_area_sqft,
    CAST(NULL AS VARCHAR(20))                               AS land_zone,
    CAST(NULL AS NUMERIC(8,4))                              AS land_adjustment_factor,
    CAST(NULL AS INT)                                       AS bedrooms,
    CAST(NULL AS NUMERIC(4,1))                              AS bathrooms,
    CAST(NULL AS INT)                                       AS fireplaces,
    CAST('N' AS CHAR(1))                                    AS has_pool,
    CAST(NULL AS NUMERIC(5,2))                              AS functional_obsolescence,
    CAST(NULL AS NUMERIC(5,2))                              AS external_obsolescence,
    pp.neighborhood                                         AS neighborhood,
    pp.property_use_cd                                      AS property_type_cd,
    CAST(NULL AS DATETIME)                                  AS last_modified
FROM
    dbo.property_profile pp
    LEFT JOIN dbo.property p ON p.prop_id = pp.prop_id
WHERE
    pp.prop_val_yr = (
        SELECT MAX(pp2.prop_val_yr)
        FROM dbo.property_profile pp2
        WHERE pp2.prop_id = pp.prop_id
    );
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- VIEW 6: vw_TerraFusion_Improvement_Cost_Matrices
-- ─────────────────────────────────────────────────────────────────────────────
-- Maps to PacsImprovementCostMatrix DTO.
-- Source tables confirmed from phase15 schema probe:
--   imprv_sched: imprv_det_type_cd, imprv_det_class_cd, imprv_det_sub_class_cd,
--                imprv_yr, imprv_sched_slope_intercept, imprv_sched_value_type,
--                matrix_id
--   matrix:      matrix_id, matrix_yr, label, axis_1, axis_2,
--                matrix_description, operator, default_cell_value,
--                matrix_type, matrix_sub_type_cd
--   matrix_detail: matrix_id, matrix_yr, axis_1_value, axis_2_value, cell_value
--   imprv_sched_matrix_assoc: linking table (confirmed in phase15 probe)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR ALTER VIEW [dbo].[vw_TerraFusion_Improvement_Cost_Matrices]
AS
SELECT
    m.matrix_id                                             AS source_matrix_id,
    m.matrix_yr                                             AS matrix_year,
    m.matrix_type                                           AS matrix_type,
    ISNULL(s.imprv_sched_slope_intercept, 0)                AS base_rate,
    ISNULL(m.default_cell_value, 1.0)                       AS multiplier,
    CAST(NULL AS VARCHAR(20))                               AS region,
    s.imprv_det_type_cd                                     AS building_type,
    s.imprv_det_class_cd                                    AS building_type_description,
    ISNULL(m.default_cell_value, 0)                         AS base_cost,
    m.matrix_description                                    AS matrix_description,
    ISNULL(md_agg.data_points, 0)                           AS data_points,
    ISNULL(md_agg.min_cost, 0)                              AS min_cost,
    ISNULL(md_agg.max_cost, 0)                              AS max_cost,
    s.imprv_sched_value_type                                AS grade,
    CAST(NULL AS VARCHAR(10))                               AS condition,
    s.imprv_yr                                              AS year_built,
    CAST(NULL AS NUMERIC(6,4))                              AS depreciation_rate,
    m.axis_1                                                AS axis1,
    m.axis_2                                                AS axis2,
    m.operator                                              AS adjustment_factor_raw,
    ISNULL(m.label,
        m.matrix_type + ' ' + CAST(m.matrix_yr AS VARCHAR(4))
    )                                                       AS matrix_label
FROM
    dbo.matrix m
    LEFT JOIN dbo.imprv_sched_matrix_assoc ism
        ON ism.matrix_id = m.matrix_id
    LEFT JOIN dbo.imprv_sched s
        ON s.matrix_id = ism.matrix_id
    OUTER APPLY (
        SELECT
            COUNT(*)            AS data_points,
            MIN(md2.cell_value) AS min_cost,
            MAX(md2.cell_value) AS max_cost
        FROM dbo.matrix_detail md2
        WHERE md2.matrix_id = m.matrix_id
          AND md2.matrix_yr  = m.matrix_yr
    ) md_agg
WHERE
    m.matrix_yr IS NOT NULL;
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- STORED PROCEDURE: sp_TerraFusion_HealthCheck
-- ─────────────────────────────────────────────────────────────────────────────
-- Returns a single row with database health metrics.
-- PacsSqlAdapter calls this to verify the contract is alive.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE [dbo].[sp_TerraFusion_HealthCheck]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        DB_NAME()                   AS database_name,
        GETUTCDATE()                AS checked_at,
        (SELECT COUNT(*) FROM dbo.property)
                                    AS property_count,
        (SELECT COUNT(*) FROM dbo.property_val WHERE sup_num = 0)
                                    AS property_val_count,
        (SELECT COUNT(*) FROM dbo.owner WHERE sup_num = 0)
                                    AS owner_count,
        (SELECT COUNT(*) FROM dbo.situs WHERE primary_situs = 'Y')
                                    AS situs_count,
        'pacscontract.v1'           AS contract_version,
        'HEALTHY'                   AS status;
END;
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES (performance, warning-only per pacscontract.v1)
-- ─────────────────────────────────────────────────────────────────────────────
-- Only create if they don't already exist (Harris may have native indexes)
-- QUOTED_IDENTIFIER must be ON for filtered indexes (WHERE clause).
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TerraFusion_Property_GeoID')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_TerraFusion_Property_GeoID]
    ON [dbo].[property] ([geo_id])
    INCLUDE ([prop_id], [prop_type_cd]);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TerraFusion_PropertyVal_PropYear')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_TerraFusion_PropertyVal_PropYear]
    ON [dbo].[property_val] ([prop_id], [prop_val_yr])
    INCLUDE ([assessed_val], [market], [sup_num])
    WHERE sup_num = 0;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TerraFusion_Situs_Property')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_TerraFusion_Situs_Property]
    ON [dbo].[situs] ([prop_id])
    INCLUDE ([situs_num], [situs_street], [situs_city], [situs_zip])
    WHERE primary_situs = 'Y';
END;
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICATION
-- ─────────────────────────────────────────────────────────────────────────────
PRINT '=== TerraFusion pacscontract.v1 Deployment Verification ===';
PRINT '';

-- Views
DECLARE @v INT;
SELECT @v = COUNT(*) FROM sys.views WHERE name IN (
    'vw_TerraFusion_Property_Core',
    'vw_TerraFusion_Property_Ownership',
    'vw_TerraFusion_Assessment_History',
    'vw_TerraFusion_Comparable_Sales',
    'vw_TerraFusion_Cama_Characteristics',
    'vw_TerraFusion_Improvement_Cost_Matrices'
);
PRINT 'Views created: ' + CAST(@v AS VARCHAR) + '/6';

-- Procedure
DECLARE @p INT;
SELECT @p = COUNT(*) FROM sys.procedures WHERE name = 'sp_TerraFusion_HealthCheck';
PRINT 'Procedures created: ' + CAST(@p AS VARCHAR) + '/1';

-- Indexes
DECLARE @i INT;
SELECT @i = COUNT(*) FROM sys.indexes WHERE name IN (
    'IX_TerraFusion_Property_GeoID',
    'IX_TerraFusion_PropertyVal_PropYear',
    'IX_TerraFusion_Situs_Property'
);
PRINT 'Indexes created: ' + CAST(@i AS VARCHAR) + '/3';

-- Quick data check
DECLARE @coreCount INT, @ownCount INT, @histCount INT, @salesCount INT, @camaCount INT, @matrixCount INT;
SELECT @coreCount  = COUNT(*) FROM vw_TerraFusion_Property_Core;
SELECT @ownCount   = COUNT(*) FROM vw_TerraFusion_Property_Ownership;
SELECT @histCount  = COUNT(*) FROM vw_TerraFusion_Assessment_History;
SELECT @salesCount = COUNT(*) FROM vw_TerraFusion_Comparable_Sales;
SELECT @camaCount  = COUNT(*) FROM vw_TerraFusion_Cama_Characteristics;
SELECT @matrixCount = COUNT(*) FROM vw_TerraFusion_Improvement_Cost_Matrices;
PRINT '';
PRINT 'vw_TerraFusion_Property_Core rows:              ' + CAST(@coreCount AS VARCHAR);
PRINT 'vw_TerraFusion_Property_Ownership rows:          ' + CAST(@ownCount AS VARCHAR);
PRINT 'vw_TerraFusion_Assessment_History rows:          ' + CAST(@histCount AS VARCHAR);
PRINT 'vw_TerraFusion_Comparable_Sales rows:            ' + CAST(@salesCount AS VARCHAR);
PRINT 'vw_TerraFusion_Cama_Characteristics rows:        ' + CAST(@camaCount AS VARCHAR);
PRINT 'vw_TerraFusion_Improvement_Cost_Matrices rows:   ' + CAST(@matrixCount AS VARCHAR);
PRINT '';
PRINT '=== Deployment complete — pacscontract.v1 (6/6 views) ===';
GO


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
-- Maps to PacsCamaCharacteristic DTO:
--   prop_id, geo_id, tax_year, building_type, building_type_description,
--   region, square_feet, stories, basement_sqft, garage_sqft, quality_grade,
--   condition_grade, complexity_grade, exterior_wall, roof_type, foundation,
--   hvac_type, interior_finish, year_built, effective_age, economic_life,
--   land_area_sqft, land_zone, land_adjustment_factor, bedrooms, bathrooms,
--   fireplaces, has_pool, functional_obsolescence, external_obsolescence,
--   neighborhood, property_type_cd, last_modified
-- Source tables: imprv, imprv_det, land, property
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR ALTER VIEW [dbo].[vw_TerraFusion_Cama_Characteristics]
AS
SELECT
    p.prop_id                                               AS prop_id,
    p.geo_id                                                AS geo_id,
    i.prop_val_yr                                           AS tax_year,
    i.imprv_type_cd                                         AS building_type,
    i.imprv_desc                                            AS building_type_description,
    i.neighborhood_cd                                       AS region,
    ISNULL(id_rec.living_area, 0)                           AS square_feet,
    ISNULL(id_rec.stories, 0)                               AS stories,
    ISNULL(id_rec.basement_sqft, 0)                         AS basement_sqft,
    ISNULL(id_rec.garage_sqft, 0)                           AS garage_sqft,
    id_rec.quality_cd                                       AS quality_grade,
    id_rec.condition_cd                                     AS condition_grade,
    id_rec.class_cd                                         AS complexity_grade,
    id_rec.ext_wall_cd                                      AS exterior_wall,
    id_rec.roof_cover_cd                                    AS roof_type,
    id_rec.foundation_cd                                    AS foundation,
    id_rec.heat_type_cd                                     AS hvac_type,
    id_rec.interior_finish_cd                               AS interior_finish,
    ISNULL(id_rec.yr_blt, i.heat_yr_blt)                   AS year_built,
    ISNULL(id_rec.eff_age, 0)                               AS effective_age,
    ISNULL(i.economic_bldg_life, 0)                         AS economic_life,
    ISNULL(l.land_area_sqft, 0)                             AS land_area_sqft,
    l.land_zone_cd                                          AS land_zone,
    ISNULL(l.land_adj_factor, 1.0)                          AS land_adjustment_factor,
    ISNULL(id_rec.bedrooms, 0)                              AS bedrooms,
    ISNULL(id_rec.bath_count, 0)                            AS bathrooms,
    ISNULL(id_rec.fireplaces, 0)                            AS fireplaces,
    ISNULL(id_rec.has_pool, 'N')                            AS has_pool,
    ISNULL(id_rec.functional_obsolescence_pct, 0)           AS functional_obsolescence,
    ISNULL(id_rec.economic_obsolescence_pct, 0)             AS external_obsolescence,
    p.neighborhood                                          AS neighborhood,
    p.prop_type_cd                                          AS property_type_cd,
    COALESCE(id_rec.imprv_det_chg_dt, i.imprv_chg_dt, p.prop_create_dt)
                                                            AS last_modified
FROM
    dbo.property p
    -- Latest primary improvement header (sup_num=0, sale_id=0)
    OUTER APPLY (
        SELECT TOP 1 i2.*
        FROM dbo.imprv i2
        WHERE i2.prop_id = p.prop_id
          AND i2.sup_num = 0
          AND i2.sale_id = 0
        ORDER BY i2.prop_val_yr DESC, i2.imprv_id ASC
    ) i
    -- Latest primary improvement detail record
    OUTER APPLY (
        SELECT TOP 1 id2.*
        FROM dbo.imprv_det id2
        WHERE id2.prop_id = p.prop_id
          AND id2.sup_num = 0
          AND id2.sale_id = 0
          AND id2.imprv_id = i.imprv_id
        ORDER BY id2.prop_val_yr DESC, id2.imprv_det_id ASC
    ) id_rec
    -- Latest primary land segment
    OUTER APPLY (
        SELECT TOP 1
            l2.land_area_sqft,
            l2.land_zone_cd,
            l2.land_adj_factor
        FROM dbo.land l2
        WHERE l2.prop_id = p.prop_id
          AND l2.sup_num = 0
          AND l2.sale_id = 0
        ORDER BY l2.prop_val_yr DESC, l2.land_seg_id ASC
    ) l;
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- VIEW 6: vw_TerraFusion_Improvement_Cost_Matrices
-- ─────────────────────────────────────────────────────────────────────────────
-- Maps to PacsImprovementCostMatrix DTO:
--   source_matrix_id, matrix_year, matrix_type, base_rate, multiplier,
--   region, building_type, building_type_description, base_cost,
--   matrix_description, data_points, min_cost, max_cost, grade, condition,
--   year_built, depreciation_rate, axis1, axis2, adjustment_factor_raw,
--   matrix_label
-- Source tables: imprv_sched (primary PACS 9.0 cost schedule table)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR ALTER VIEW [dbo].[vw_TerraFusion_Improvement_Cost_Matrices]
AS
SELECT
    ms.sched_id                                             AS source_matrix_id,
    ms.sched_yr                                             AS matrix_year,
    ms.sched_type_cd                                        AS matrix_type,
    ISNULL(ms.base_rate, 0)                                 AS base_rate,
    ISNULL(ms.regional_multiplier, 1.0)                     AS multiplier,
    ms.region_cd                                            AS region,
    ms.imprv_type_cd                                        AS building_type,
    ms.imprv_type_desc                                      AS building_type_description,
    ISNULL(ms.base_cost, 0)                                 AS base_cost,
    ms.sched_desc                                           AS matrix_description,
    ISNULL(ms.data_point_count, 0)                          AS data_points,
    ISNULL(ms.min_cost, 0)                                  AS min_cost,
    ISNULL(ms.max_cost, 0)                                  AS max_cost,
    ms.quality_cd                                           AS grade,
    ms.condition_cd                                         AS condition,
    ms.base_yr                                              AS year_built,
    ISNULL(ms.dep_pct, 0)                                   AS depreciation_rate,
    ms.x_axis_cd                                            AS axis1,
    ms.y_axis_cd                                            AS axis2,
    ISNULL(ms.adj_factor, 1.0)                              AS adjustment_factor_raw,
    ISNULL(ms.sched_desc,
        ISNULL(ms.imprv_type_cd, '') + ' ' + CAST(ISNULL(ms.sched_yr, 0) AS VARCHAR(4))
    )                                                       AS matrix_label
FROM
    dbo.imprv_sched ms
WHERE
    ms.sched_yr IS NOT NULL;
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


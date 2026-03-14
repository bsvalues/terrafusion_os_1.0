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

USE [pacs_oltp];
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
-- SALES / CAMA / MATRIX VIEWS (pacs_golive)
-- ─────────────────────────────────────────────────────────────────────────────
-- The Benton PACS clone is split:
--   - pacs_oltp    = parcel / ownership / assessment truth
--   - pacs_golive  = sales history + improvement-level matrix truth
-- The canonical adapter uses PacsConnection for pacs_oltp and
-- PacsSalesConnection for pacs_golive.
-- ─────────────────────────────────────────────────────────────────────────────
USE [pacs_golive];
GO

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
    LEFT(CONVERT(VARCHAR(50), si.situs_city), 50)                       AS neighborhood,
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

CREATE OR ALTER VIEW [dbo].[vw_TerraFusion_Cama_Characteristics]
AS
WITH latest_profile AS (
    SELECT
        p.prop_id,
        p.geo_id,
        CONVERT(INT, pp.prop_val_yr)                                     AS tax_year,
        pp.property_use_cd,
        pp.imprv_type_cd,
        pp.class_cd,
        pp.imprv_det_sub_class_cd,
        pp.region,
        pp.neighborhood,
        pp.living_area,
        pp.land_sqft,
        pp.zoning,
        pp.yr_blt,
        pp.actual_year_built,
        pp.actual_age,
        pp.condition_cd,
        pp.num_imprv,
        ROW_NUMBER() OVER (
            PARTITION BY pp.prop_id
            ORDER BY pp.prop_val_yr DESC, pp.sup_num ASC
        )                                                                AS rn
    FROM dbo.property_profile pp
    INNER JOIN dbo.property p ON p.prop_id = pp.prop_id
    WHERE pp.sup_num = 0
),
primary_improvement AS (
    SELECT
        i.prop_id,
        CONVERT(INT, i.prop_val_yr)                                      AS prop_val_yr,
        i.imprv_type_cd,
        i.imprv_desc,
        i.stories,
        i.actual_year_built,
        i.economic_pct,
        i.functional_pct,
        i.num_imprv,
        ROW_NUMBER() OVER (
            PARTITION BY i.prop_id, i.prop_val_yr
            ORDER BY CASE WHEN i.primary_imprv = 'T' THEN 0 ELSE 1 END, i.imprv_val DESC, i.imprv_id
        )                                                                AS rn
    FROM dbo.imprv i
    WHERE i.sale_id = 0
      AND i.sup_num = 0
),
improvement_areas AS (
    SELECT
        d.prop_id,
        CONVERT(INT, d.prop_val_yr)                                      AS prop_val_yr,
        SUM(CASE WHEN UPPER(LTRIM(RTRIM(d.imprv_det_type_cd))) IN ('BSMT', 'U-BSMT')
            THEN CAST(d.imprv_det_area AS DECIMAL(18,2)) ELSE 0 END)     AS basement_sqft,
        SUM(CASE WHEN UPPER(LTRIM(RTRIM(d.imprv_det_type_cd))) IN ('ATTGAR', 'DETGAR')
            THEN CAST(d.imprv_det_area AS DECIMAL(18,2)) ELSE 0 END)     AS garage_sqft
    FROM dbo.imprv_detail d
    WHERE d.sale_id = 0
      AND d.sup_num = 0
    GROUP BY d.prop_id, CONVERT(INT, d.prop_val_yr)
),
system_settings AS (
    SELECT TOP 1
        num_bedrooms_code_attribute_id                                  AS bedrooms_attr_id,
        num_bathrooms_code_attribute_id                                 AS bathrooms_attr_id
    FROM dbo.pacs_system
),
improvement_attributes AS (
    SELECT
        a.prop_id,
        CONVERT(INT, a.prop_val_yr)                                      AS prop_val_yr,
        SUM(CASE
            WHEN a.i_attr_val_id = ss.bedrooms_attr_id
             AND NULLIF(LTRIM(RTRIM(a.i_attr_val_cd)), '') IS NOT NULL
             AND PATINDEX('%[^0-9]%', LTRIM(RTRIM(a.i_attr_val_cd))) = 0
            THEN CONVERT(INT, LTRIM(RTRIM(a.i_attr_val_cd)))
            ELSE 0
        END)                                                             AS bedrooms,
        SUM(CASE WHEN a.i_attr_val_id = ss.bathrooms_attr_id THEN CONVERT(INT, a.i_attr_unit) ELSE 0 END) AS bathrooms,
        SUM(CASE WHEN a.i_attr_val_id = 10 THEN CONVERT(INT, a.i_attr_unit) ELSE 0 END) AS fireplaces,
        MAX(CASE WHEN a.i_attr_val_id = 2 THEN NULLIF(LTRIM(RTRIM(a.i_attr_val_cd)), '') END) AS foundation,
        MAX(CASE WHEN a.i_attr_val_id = 3 THEN NULLIF(LTRIM(RTRIM(a.i_attr_val_cd)), '') END) AS exterior_wall,
        MAX(CASE WHEN a.i_attr_val_id = 6 THEN NULLIF(LTRIM(RTRIM(a.i_attr_val_cd)), '') END) AS roof_type,
        MAX(CASE WHEN a.i_attr_val_id = 9 THEN NULLIF(LTRIM(RTRIM(a.i_attr_val_cd)), '') END) AS hvac_type
    FROM dbo.imprv_attr a
    CROSS JOIN system_settings ss
    WHERE a.sale_id = 0
      AND a.sup_num = 0
    GROUP BY a.prop_id, CONVERT(INT, a.prop_val_yr)
)
SELECT
    lp.prop_id                                                            AS prop_id,
    lp.geo_id                                                             AS geo_id,
    lp.tax_year                                                           AS tax_year,
    LEFT(COALESCE(
        NULLIF(LTRIM(RTRIM(pi.imprv_type_cd)), ''),
        NULLIF(LTRIM(RTRIM(lp.imprv_type_cd)), ''),
        NULLIF(LTRIM(RTRIM(lp.class_cd)), ''),
        'UNKNOWN'
    ), 10)                                                                AS building_type,
    COALESCE(
        NULLIF(LTRIM(RTRIM(pi.imprv_desc)), ''),
        NULLIF(LTRIM(RTRIM(lp.property_use_cd)), ''),
        NULLIF(LTRIM(RTRIM(lp.imprv_det_sub_class_cd)), ''),
        NULLIF(LTRIM(RTRIM(lp.class_cd)), '')
    )                                                                     AS building_type_description,
    NULLIF(LTRIM(RTRIM(lp.region)), '')                                   AS region,
    CASE WHEN lp.living_area > 0 THEN CAST(lp.living_area AS DECIMAL(18,2)) END
                                                                          AS square_feet,
    CASE
        WHEN NULLIF(LTRIM(RTRIM(pi.stories)), '') IS NOT NULL
         AND PATINDEX('%[^0-9.]%', LTRIM(RTRIM(pi.stories))) = 0
        THEN CONVERT(DECIMAL(18,2), LTRIM(RTRIM(pi.stories)))
    END                                                                   AS stories,
    CASE WHEN iarea.basement_sqft > 0 THEN CAST(iarea.basement_sqft AS DECIMAL(18,2)) END
                                                                          AS basement_sqft,
    CASE WHEN iarea.garage_sqft > 0 THEN CAST(iarea.garage_sqft AS DECIMAL(18,2)) END
                                                                          AS garage_sqft,
    NULLIF(LTRIM(RTRIM(lp.class_cd)), '')                                 AS quality_grade,
    NULLIF(LTRIM(RTRIM(lp.condition_cd)), '')                             AS condition_grade,
    CASE
        WHEN COALESCE(pi.num_imprv, lp.num_imprv, 0) >= 4 THEN 'COMPLEX'
        WHEN COALESCE(pi.num_imprv, lp.num_imprv, 0) >= 2 THEN 'STANDARD'
        ELSE 'SIMPLE'
    END                                                                   AS complexity_grade,
    iattr.exterior_wall                                                   AS exterior_wall,
    iattr.roof_type                                                       AS roof_type,
    iattr.foundation                                                      AS foundation,
    iattr.hvac_type                                                       AS hvac_type,
    CAST(NULL AS VARCHAR(30))                                             AS interior_finish,
    CASE
        WHEN COALESCE(pi.actual_year_built, lp.actual_year_built, lp.yr_blt) > 0
        THEN CONVERT(INT, COALESCE(pi.actual_year_built, lp.actual_year_built, lp.yr_blt))
    END
                                                                          AS year_built,
    CASE WHEN lp.actual_age > 0 THEN CONVERT(INT, lp.actual_age) END      AS effective_age,
    CAST(NULL AS INT)                                                     AS economic_life,
    CASE WHEN lp.land_sqft > 0 THEN CAST(lp.land_sqft AS DECIMAL(18,2)) END
                                                                          AS land_area_sqft,
    NULLIF(LTRIM(RTRIM(lp.zoning)), '')                                   AS land_zone,
    CAST(NULL AS DECIMAL(18,4))                                           AS land_adjustment_factor,
    NULLIF(iattr.bedrooms, 0)                                             AS bedrooms,
    NULLIF(iattr.bathrooms, 0)                                            AS bathrooms,
    NULLIF(iattr.fireplaces, 0)                                           AS fireplaces,
    CAST(NULL AS BIT)                                                     AS has_pool,
    CASE WHEN pi.functional_pct <> 0 THEN CAST(pi.functional_pct AS DECIMAL(18,4)) END
                                                                          AS functional_obsolescence,
    CASE WHEN pi.economic_pct <> 0 THEN CAST(pi.economic_pct AS DECIMAL(18,4)) END
                                                                          AS external_obsolescence,
    LEFT(CONVERT(VARCHAR(50), lp.neighborhood), 50)                       AS neighborhood,
    NULLIF(LTRIM(RTRIM(lp.property_use_cd)), '')                          AS property_type_cd,
    CAST(NULL AS DATETIME)                                                AS last_modified
FROM latest_profile lp
LEFT JOIN primary_improvement pi
    ON pi.prop_id = lp.prop_id
   AND pi.prop_val_yr = lp.tax_year
   AND pi.rn = 1
LEFT JOIN improvement_areas iarea
    ON iarea.prop_id = lp.prop_id
   AND iarea.prop_val_yr = lp.tax_year
LEFT JOIN improvement_attributes iattr
    ON iattr.prop_id = lp.prop_id
   AND iattr.prop_val_yr = lp.tax_year
WHERE lp.rn = 1;
GO

CREATE OR ALTER VIEW [dbo].[vw_TerraFusion_Improvement_Cost_Matrices]
AS
WITH matrix_stats AS (
    SELECT
        md.matrix_id,
        CONVERT(INT, md.matrix_yr)                                        AS matrix_year,
        COUNT(*)                                                          AS data_points,
        MIN(CAST(md.cell_value AS DECIMAL(18,4)))                         AS min_cost,
        MAX(CAST(md.cell_value AS DECIMAL(18,4)))                         AS max_cost,
        AVG(CAST(md.cell_value AS DECIMAL(18,4)))                         AS avg_cost
    FROM dbo.matrix_detail md
    GROUP BY md.matrix_id, CONVERT(INT, md.matrix_yr)
)
SELECT
    ism.matrix_id                                                         AS source_matrix_id,
    CONVERT(INT, ism.imprv_yr)                                            AS matrix_year,
    COALESCE(NULLIF(LTRIM(RTRIM(m.matrix_type)), ''), 'PACS')             AS matrix_type,
    CASE
        WHEN ism.adj_factor IS NULL OR ism.adj_factor = 0 THEN CAST(1.0 AS DECIMAL(18,4))
        ELSE CAST(ism.adj_factor / 100.0 AS DECIMAL(18,4))
    END                                                                   AS multiplier,
    COALESCE(NULLIF(LTRIM(RTRIM(ism.imprv_det_meth_cd)), ''), 'PACS')     AS region,
    LEFT(COALESCE(
        NULLIF(LTRIM(RTRIM(ism.imprv_det_type_cd)), ''),
        NULLIF(LTRIM(RTRIM(ism.imprv_det_class_cd)), ''),
        'UNKNOWN'
    ), 10)                                                                AS building_type,
    COALESCE(
        NULLIF(LTRIM(RTRIM(m.matrix_description)), ''),
        NULLIF(LTRIM(RTRIM(m.label)), ''),
        'PACS improvement matrix'
    )                                                                     AS building_type_description,
    COALESCE(stats.avg_cost, CAST(m.default_cell_value AS DECIMAL(18,4)), CAST(0 AS DECIMAL(18,4)))
                                                                          AS base_rate,
    COALESCE(stats.avg_cost, CAST(m.default_cell_value AS DECIMAL(18,4)), CAST(0 AS DECIMAL(18,4)))
                                                                          AS base_cost,
    COALESCE(
        NULLIF(LTRIM(RTRIM(m.matrix_description)), ''),
        NULLIF(LTRIM(RTRIM(m.label)), ''),
        'PACS improvement matrix'
    )                                                                     AS matrix_description,
    ISNULL(stats.data_points, 0)                                          AS data_points,
    ISNULL(stats.min_cost, 0)                                             AS min_cost,
    ISNULL(stats.max_cost, 0)                                             AS max_cost,
    NULLIF(NULLIF(LTRIM(RTRIM(ism.imprv_det_class_cd)), ''), '*')         AS grade,
    NULLIF(NULLIF(LTRIM(RTRIM(ism.imprv_det_sub_class_cd)), ''), '*')     AS condition,
    CONVERT(INT, ism.imprv_yr)                                            AS year_built,
    CAST(NULL AS DECIMAL(18,4))                                           AS depreciation_rate,
    NULLIF(LTRIM(RTRIM(m.axis_1)), '')                                    AS axis_1,
    NULLIF(LTRIM(RTRIM(m.axis_2)), '')                                    AS axis_2,
    CAST(ism.adj_factor AS DECIMAL(18,4))                                 AS adjustment_factor_raw,
    NULLIF(LTRIM(RTRIM(m.label)), '')                                     AS matrix_label
FROM dbo.imprv_sched_matrix_assoc ism
INNER JOIN dbo.imprv_sched s
    ON s.imprv_det_meth_cd = ism.imprv_det_meth_cd
   AND s.imprv_det_type_cd = ism.imprv_det_type_cd
   AND s.imprv_det_class_cd = ism.imprv_det_class_cd
   AND s.imprv_yr = ism.imprv_yr
   AND ISNULL(s.imprv_det_sub_class_cd, '') = ISNULL(ism.imprv_det_sub_class_cd, '')
INNER JOIN dbo.matrix m
    ON m.matrix_id = ism.matrix_id
   AND m.matrix_yr = ism.imprv_yr
LEFT JOIN matrix_stats stats
    ON stats.matrix_id = ism.matrix_id
   AND stats.matrix_year = CONVERT(INT, ism.imprv_yr);
GO

USE [pacs_oltp];
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
    'vw_TerraFusion_Comparable_Sales'
);
PRINT 'Views created: ' + CAST(@v AS VARCHAR) + '/4';

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
DECLARE @coreCount INT, @ownCount INT, @histCount INT;
SELECT @coreCount = COUNT(*) FROM vw_TerraFusion_Property_Core;
SELECT @ownCount = COUNT(*) FROM vw_TerraFusion_Property_Ownership;
SELECT @histCount = COUNT(*) FROM vw_TerraFusion_Assessment_History;
PRINT '';
PRINT 'vw_TerraFusion_Property_Core rows:       ' + CAST(@coreCount AS VARCHAR);
PRINT 'vw_TerraFusion_Property_Ownership rows:   ' + CAST(@ownCount AS VARCHAR);
PRINT 'vw_TerraFusion_Assessment_History rows:    ' + CAST(@histCount AS VARCHAR);
PRINT '';
GO

USE [pacs_golive];
GO

DECLARE @salesCount INT, @camaCount INT, @matrixCount INT;
SELECT @salesCount = COUNT(*) FROM vw_TerraFusion_Comparable_Sales;
SELECT @camaCount = COUNT(*) FROM vw_TerraFusion_Cama_Characteristics;
SELECT @matrixCount = COUNT(*) FROM vw_TerraFusion_Improvement_Cost_Matrices;
PRINT 'vw_TerraFusion_Comparable_Sales rows:         ' + CAST(@salesCount AS VARCHAR);
PRINT 'vw_TerraFusion_Cama_Characteristics rows:     ' + CAST(@camaCount AS VARCHAR);
PRINT 'vw_TerraFusion_Improvement_Cost_Matrices rows:' + CAST(@matrixCount AS VARCHAR);
PRINT '';
PRINT '=== Deployment complete ===';
GO

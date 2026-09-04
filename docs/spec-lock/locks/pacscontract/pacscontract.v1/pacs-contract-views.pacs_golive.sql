-- =============================================================================
-- TerraFusion pacscontract.v1 — Sales/CAMA/Matrix View Deployment
-- =============================================================================
-- Target: pacs_golive (configured by ConnectionStrings:PacsSalesConnection)
-- Contract: PacsSqlAdapter sales connection.
-- Run through the configured sales connection; never substitute the core database.
-- Idempotent: uses CREATE OR ALTER.
-- =============================================================================

USE [pacs_golive];
GO

-- VIEW 4: vw_TerraFusion_Comparable_Sales
-- ─────────────────────────────────────────────────────────────────────────────
-- Raw PACS sale/change-of-owner data for TerraFusionSync conversion:
--   PacsChgOfOwnerId, PropId, GeoId, SaleDate, SalePrice, PropTypeCd, SitusAddr,
--   Neighborhood, SaleRatioTypeCd, DeedTypeCd, Consideration, SaleComment, LastModified
-- TerraFusionSync converts this raw legacy shape into operational ComparableSales.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR ALTER VIEW [dbo].[vw_TerraFusion_Comparable_Sales]
AS
SELECT
    coo.chg_of_owner_id                                                AS chg_of_owner_id,
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
    s.sl_comment                                                        AS sale_comment,
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
-- VERIFICATION: sales connection objects only
-- ─────────────────────────────────────────────────────────────────────────────
PRINT '=== TerraFusion pacscontract.v1 Sales Deployment Verification ===';
DECLARE @v INT;
SELECT @v = COUNT(*) FROM sys.views WHERE name IN (
    'vw_TerraFusion_Comparable_Sales',
    'vw_TerraFusion_Cama_Characteristics',
    'vw_TerraFusion_Improvement_Cost_Matrices'
);
PRINT 'Sales/CAMA/matrix views created: ' + CAST(@v AS VARCHAR) + '/3';

DECLARE @salesCount INT, @camaCount INT, @matrixCount INT;
SELECT @salesCount = COUNT(*) FROM vw_TerraFusion_Comparable_Sales;
SELECT @camaCount = COUNT(*) FROM vw_TerraFusion_Cama_Characteristics;
SELECT @matrixCount = COUNT(*) FROM vw_TerraFusion_Improvement_Cost_Matrices;
PRINT 'vw_TerraFusion_Comparable_Sales rows:             ' + CAST(@salesCount AS VARCHAR);
PRINT 'vw_TerraFusion_Cama_Characteristics rows:         ' + CAST(@camaCount AS VARCHAR);
PRINT 'vw_TerraFusion_Improvement_Cost_Matrices rows:    ' + CAST(@matrixCount AS VARCHAR);
PRINT '=== Sales deployment complete — pacscontract.v1 (3/3 views) ===';
GO

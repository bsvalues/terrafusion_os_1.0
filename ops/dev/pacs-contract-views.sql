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
    'vw_TerraFusion_Assessment_History'
);
PRINT 'Views created: ' + CAST(@v AS VARCHAR) + '/3';

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
PRINT '=== Deployment complete ===';
GO

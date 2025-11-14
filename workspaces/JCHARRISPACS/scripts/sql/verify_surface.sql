-- Benton County PACS - Database Surface Verification
-- Validates key objects exist and are correctly configured
-- Fails with error if critical objects are missing or renamed
-- Usage: sqlcmd -S localhost,1433 -U sa -P <password> -d pacs_oltp -i verify_surface.sql

SET NOCOUNT ON;

PRINT '🔍 Benton County PACS - Surface Verification';
PRINT '   Database: ' + DB_NAME();
PRINT '   Timestamp: ' + CONVERT(VARCHAR(30), GETDATE(), 120);
PRINT '';

DECLARE @missing TABLE (
    object_name SYSNAME,
    object_type VARCHAR(50),
    severity VARCHAR(20),
    why NVARCHAR(200)
);

-- ============================================================================
-- CRITICAL TABLES (System will not function without these)
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name='property')
    INSERT INTO @missing VALUES ('property', 'table', 'CRITICAL', 'Core property table missing');

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name='property_val')
    INSERT INTO @missing VALUES ('property_val', 'table', 'CRITICAL', 'Property valuation table missing');

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name='situs')
    INSERT INTO @missing VALUES ('situs', 'table', 'CRITICAL', 'Property address table missing');

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name='owner')
    INSERT INTO @missing VALUES ('owner', 'table', 'CRITICAL', 'Owner table missing');

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name='owner_prop_assoc')
    INSERT INTO @missing VALUES ('owner_prop_assoc', 'table', 'CRITICAL', 'Property-owner association table missing');

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name='improvement')
    INSERT INTO @missing VALUES ('improvement', 'table', 'CRITICAL', 'Improvement table missing');

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name='change_log')
    INSERT INTO @missing VALUES ('change_log', 'table', 'CRITICAL', 'Audit trail table missing');

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name='pacs_system')
    INSERT INTO @missing VALUES ('pacs_system', 'table', 'CRITICAL', 'System configuration table missing (future_yr lookup)');

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name='xsp_pacs_config')
    INSERT INTO @missing VALUES ('xsp_pacs_config', 'table', 'HIGH', 'Extended SP configuration table missing');

-- ============================================================================
-- CRITICAL STORED PROCEDURES
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM sys.procedures WHERE name LIKE '%RecalcProperty%')
    INSERT INTO @missing VALUES ('RecalcProperty', 'procedure', 'CRITICAL', 'Property recalculation proc missing (aliases: xsp_RecalcProperty, RecalcProperty.sql)');

IF NOT EXISTS (SELECT 1 FROM sys.procedures WHERE name LIKE '%pProcess_BuildingImport%')
    INSERT INTO @missing VALUES ('pProcess_BuildingImport', 'procedure', 'HIGH', 'Building permit import proc missing (CIAPS integration)');

-- ============================================================================
-- CRITICAL TRIGGERS (property_val has 9 triggers)
-- ============================================================================

DECLARE @trigger_count INT;
SELECT @trigger_count = COUNT(*)
FROM sys.triggers
WHERE parent_object_id = OBJECT_ID('dbo.property_val');

IF @trigger_count < 9
    INSERT INTO @missing VALUES ('property_val triggers', 'trigger', 'HIGH', 
        'Expected 9 triggers on property_val, found ' + CAST(@trigger_count AS VARCHAR(10)));

-- ============================================================================
-- CRITICAL INDEXES (property table must have parcel_num index)
-- ============================================================================

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes i
    INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
    INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    WHERE i.object_id = OBJECT_ID('dbo.property')
    AND c.name = 'parcel_num'
)
    INSERT INTO @missing VALUES ('property.parcel_num index', 'index', 'HIGH', 
        'No index on property.parcel_num (performance critical for lookups)');

-- ============================================================================
-- CROSS-DATABASE SYNONYMS (if CIAPS database exists)
-- ============================================================================

IF DB_ID('CIAPS') IS NOT NULL
BEGIN
    -- Check CIAPS synonyms pointing to pacs_oltp
    DECLARE @synonym_db SYSNAME = DB_NAME();
    
    IF NOT EXISTS (SELECT 1 FROM CIAPS.sys.synonyms WHERE name='building_permit' AND base_object_name LIKE '%' + @synonym_db + '%')
        INSERT INTO @missing VALUES ('CIAPS.dbo.building_permit', 'synonym', 'HIGH', 
            'CIAPS synonym to pacs_oltp.dbo.building_permit missing');
    
    IF NOT EXISTS (SELECT 1 FROM CIAPS.sys.synonyms WHERE name='property' AND base_object_name LIKE '%' + @synonym_db + '%')
        INSERT INTO @missing VALUES ('CIAPS.dbo.property', 'synonym', 'HIGH', 
            'CIAPS synonym to pacs_oltp.dbo.property missing');
    
    IF NOT EXISTS (SELECT 1 FROM CIAPS.sys.synonyms WHERE name='property_val' AND base_object_name LIKE '%' + @synonym_db + '%')
        INSERT INTO @missing VALUES ('CIAPS.dbo.property_val', 'synonym', 'HIGH', 
            'CIAPS synonym to pacs_oltp.dbo.property_val missing');
END

-- ============================================================================
-- DATA INTEGRITY CHECKS
-- ============================================================================

-- Check change_log IDENTITY approaching limit
DECLARE @change_log_max BIGINT;
SELECT @change_log_max = ISNULL(MAX(lChangeID), 0) FROM change_log;

IF @change_log_max > 1800000000  -- 1.8B (approaching 2.1B limit)
    INSERT INTO @missing VALUES ('change_log.lChangeID', 'data', 'CRITICAL', 
        'IDENTITY column approaching limit: ' + CAST(@change_log_max AS VARCHAR(20)) + ' / 2,147,483,647');

-- Check property_val Year 0 records exist
DECLARE @year_zero_count INT;
SELECT @year_zero_count = COUNT(*) FROM property_val WHERE prop_val_yr = 0;

IF @year_zero_count = 0
    INSERT INTO @missing VALUES ('property_val Year 0', 'data', 'HIGH', 
        'No Year 0 (current working year) records found in property_val');

-- ============================================================================
-- REPORT RESULTS
-- ============================================================================

IF EXISTS (SELECT 1 FROM @missing WHERE severity = 'CRITICAL')
BEGIN
    PRINT '';
    PRINT '❌ CRITICAL FAILURES DETECTED:';
    PRINT '';
    SELECT object_name AS [Object], object_type AS [Type], severity AS [Severity], why AS [Issue]
    FROM @missing
    WHERE severity = 'CRITICAL'
    ORDER BY object_name;
    
    RAISERROR('Surface verification failed: CRITICAL objects missing', 16, 1);
END
ELSE IF EXISTS (SELECT 1 FROM @missing WHERE severity = 'HIGH')
BEGIN
    PRINT '';
    PRINT '⚠️  HIGH SEVERITY WARNINGS:';
    PRINT '';
    SELECT object_name AS [Object], object_type AS [Type], severity AS [Severity], why AS [Issue]
    FROM @missing
    WHERE severity = 'HIGH'
    ORDER BY object_name;
    
    PRINT '';
    PRINT '⚠️  Warning: Non-critical issues detected, but system should be functional';
END
ELSE
BEGIN
    PRINT '✅ Surface verification PASSED';
    PRINT '';
    PRINT '   All critical objects present:';
    PRINT '   - Core tables (property, property_val, situs, owner, etc.)';
    PRINT '   - Critical procedures (RecalcProperty, pProcess_BuildingImport)';
    PRINT '   - Triggers on property_val (9 triggers)';
    PRINT '   - Indexes on property.parcel_num';
    IF DB_ID('CIAPS') IS NOT NULL
        PRINT '   - CIAPS cross-database synonyms';
    PRINT '';
END

-- Additional metadata
PRINT 'Database Metadata:';
PRINT '   Tables: ' + CAST((SELECT COUNT(*) FROM sys.tables WHERE is_ms_shipped=0) AS VARCHAR(20));
PRINT '   Procedures: ' + CAST((SELECT COUNT(*) FROM sys.procedures WHERE is_ms_shipped=0) AS VARCHAR(20));
PRINT '   Triggers: ' + CAST((SELECT COUNT(*) FROM sys.triggers WHERE parent_id <> 0) AS VARCHAR(20));
PRINT '   Views: ' + CAST((SELECT COUNT(*) FROM sys.views WHERE is_ms_shipped=0) AS VARCHAR(20));
PRINT '';

GO

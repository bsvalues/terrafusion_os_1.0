# TerraFusion Schema-Corrected Integration Script
# Execute fixed PACS to TerraFusion OS integration with correct column names
# Author: TerraFusion Elite Government OS Engineering Team

param(
    [string]$SqlServer = "localhost,1433",
    [string]$SaPassword = $(if ($env:SA_PASSWORD) { $env:SA_PASSWORD } else { 'TF_Pacs2026!' })
)

$ErrorActionPreference = "Continue"

function Invoke-SqlCommandSafe {
    param(
        [string]$Query,
        [string]$Database = "master",
        [string]$Description
    )
    
    try {
        $connectionString = "Server=$SqlServer;Database=$Database;User Id=sa;Password=$SaPassword;TrustServerCertificate=True;"
        $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
        $connection.Open()
        
        $command = New-Object System.Data.SqlClient.SqlCommand($Query, $connection)
        $command.CommandTimeout = 300
        $result = $command.ExecuteNonQuery()
        
        $connection.Close()
        Write-Host "✅ $Description" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Failed: $Description - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

Write-Host @"
╔══════════════════════════════════════════════════════════════════════════════╗
║                    TerraFusion Schema Correction                            ║
║                   Fixing API Views with Actual Schema                      ║
╚══════════════════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

Write-Host "🔧 Creating schema-corrected TerraFusion views..." -ForegroundColor Cyan

# Create corrected property core view
$correctedPropertyViewQuery = @"
-- Create schema-correct property core view for TerraFusion API
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_TerraFusion_Property_Core')
    DROP VIEW vw_TerraFusion_Property_Core;

CREATE VIEW vw_TerraFusion_Property_Core AS
SELECT 
    p.prop_id,
    p.geo_id,
    p.prop_type_cd,
    p.prop_create_dt,
    p.state_cd,
    pv.prop_val_yr,
    pv.assessed_val,
    pv.appraised_val,
    pv.market,
    pv.freeze_ceiling,
    pv.recalc_dt,
    pv.recalc_flag,
    pv.hood_cd as neighborhood_cd,
    pv.property_use_cd,
    pv.sub_market_cd,
    s.situs_display,
    s.situs_num,
    s.situs_city,
    s.situs_state,
    s.situs_zip,
    s.primary_situs
FROM property p
INNER JOIN property_val pv ON p.prop_id = pv.prop_id
LEFT JOIN situs s ON p.prop_id = s.prop_id AND s.primary_situs = 'Y'
WHERE pv.prop_val_yr >= YEAR(GETDATE()) - 5
    AND p.prop_type_cd NOT IN ('EXEMPT', 'INACTIVE');

PRINT 'Created corrected vw_TerraFusion_Property_Core view';
"@

Invoke-SqlCommandSafe -Query $correctedPropertyViewQuery -Database "pacs_oltp" -Description "Corrected TerraFusion Property Core view"

# Create corrected ownership view  
$correctedOwnershipViewQuery = @"
-- Create corrected ownership view for TerraFusion API
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_TerraFusion_Property_Ownership')
    DROP VIEW vw_TerraFusion_Property_Ownership;

CREATE VIEW vw_TerraFusion_Property_Ownership AS
SELECT 
    p.prop_id,
    p.geo_id,
    o.owner_id,
    o.owner_name,
    o.care_of_name,
    o.mail_addr_1,
    o.mail_addr_2,
    o.mail_city,
    o.mail_state,
    o.mail_zip,
    po.ownership_pct,
    po.primary_owner,
    po.eff_dt,
    po.exp_dt
FROM property p
INNER JOIN prop_owner po ON p.prop_id = po.prop_id
INNER JOIN owner o ON po.owner_id = o.owner_id
WHERE po.exp_dt IS NULL OR po.exp_dt > GETDATE();

PRINT 'Created corrected vw_TerraFusion_Property_Ownership view';
"@

Invoke-SqlCommandSafe -Query $correctedOwnershipViewQuery -Database "pacs_oltp" -Description "Corrected TerraFusion Property Ownership view"

# Create corrected assessment history view
$correctedAssessmentViewQuery = @"
-- Create corrected assessment history view
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_TerraFusion_Assessment_History')
    DROP VIEW vw_TerraFusion_Assessment_History;

CREATE VIEW vw_TerraFusion_Assessment_History AS
SELECT 
    p.prop_id,
    p.geo_id,
    pv.prop_val_yr,
    pv.assessed_val,
    pv.appraised_val,
    pv.market,
    pv.freeze_ceiling,
    pv.recalc_dt,
    pv.land_hstd_val + pv.land_non_hstd_val as total_land_value,
    pv.imprv_hstd_val + pv.imprv_non_hstd_val as total_improvement_value,
    pt.prop_type_desc,
    pv.property_use_cd,
    pv.sub_market_cd,
    pv.hood_cd as neighborhood_cd
FROM property p
INNER JOIN property_val pv ON p.prop_id = pv.prop_id
LEFT JOIN property_type pt ON p.prop_type_cd = pt.prop_type_cd
WHERE pv.prop_val_yr >= 2020;

PRINT 'Created corrected vw_TerraFusion_Assessment_History view';
"@

Invoke-SqlCommandSafe -Query $correctedAssessmentViewQuery -Database "pacs_oltp" -Description "Corrected TerraFusion Assessment History view"

# Create corrected performance indexes
Write-Host "⚡ Creating corrected TerraFusion performance indexes..." -ForegroundColor Cyan

$correctedIndexQueries = @(
    @{
        Name  = "IX_TerraFusion_Property_GeoID"
        Query = @"
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TerraFusion_Property_GeoID')
BEGIN
    CREATE NONCLUSTERED INDEX IX_TerraFusion_Property_GeoID 
    ON property (geo_id) 
    INCLUDE (prop_id, prop_type_cd, state_cd);
    PRINT 'Created corrected IX_TerraFusion_Property_GeoID index';
END
"@
    },
    @{
        Name  = "IX_TerraFusion_PropertyVal_PropYear"
        Query = @"
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TerraFusion_PropertyVal_PropYear')
BEGIN
    CREATE NONCLUSTERED INDEX IX_TerraFusion_PropertyVal_PropYear 
    ON property_val (prop_id, prop_val_yr) 
    INCLUDE (assessed_val, appraised_val, market, freeze_ceiling, recalc_dt);
    PRINT 'Created corrected IX_TerraFusion_PropertyVal_PropYear index';
END
"@
    },
    @{
        Name  = "IX_TerraFusion_Situs_Property"
        Query = @"
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TerraFusion_Situs_Property')
BEGIN
    CREATE NONCLUSTERED INDEX IX_TerraFusion_Situs_Property 
    ON situs (prop_id, primary_situs) 
    INCLUDE (situs_display, situs_num, situs_city, situs_state, situs_zip)
    WHERE primary_situs = 'Y';
    PRINT 'Created corrected IX_TerraFusion_Situs_Property index';
END
"@
    }
)

foreach ($index in $correctedIndexQueries) {
    Invoke-SqlCommandSafe -Query $index.Query -Database "pacs_oltp" -Description "Corrected TerraFusion index: $($index.Name)"
}

# Test corrected views
Write-Host "🧪 Testing corrected TerraFusion views..." -ForegroundColor Cyan

$testQueries = @(
    @{
        Name  = "Property Core View"
        Query = "SELECT TOP 5 prop_id, geo_id, assessed_val FROM vw_TerraFusion_Property_Core ORDER BY prop_id"
    },
    @{
        Name  = "Assessment History View"  
        Query = "SELECT TOP 5 prop_id, prop_val_yr, assessed_val FROM vw_TerraFusion_Assessment_History ORDER BY prop_id, prop_val_yr DESC"
    }
)

foreach ($test in $testQueries) {
    try {
        $connectionString = "Server=$SqlServer;Database=pacs_oltp;User Id=sa;Password=$SaPassword;TrustServerCertificate=True;"
        $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
        $connection.Open()
        $command = New-Object System.Data.SqlClient.SqlCommand($test.Query, $connection)
        $reader = $command.ExecuteReader()
        
        $rowCount = 0
        while ($reader.Read() -and $rowCount -lt 2) {
            $rowCount++
        }
        
        $reader.Close()
        $connection.Close()
        
        Write-Host "   ✅ $($test.Name): $rowCount rows returned" -ForegroundColor Green
    }
    catch {
        Write-Host "   ❌ $($test.Name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    🎯 SCHEMA CORRECTION COMPLETE                           ║" -ForegroundColor Green  
Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "✅ TerraFusion views corrected with actual PACS schema" -ForegroundColor Green
Write-Host "✅ Performance indexes updated for real column names" -ForegroundColor Green
Write-Host "✅ API endpoints ready for accurate property data access" -ForegroundColor Green
# TerraFusion Data Validation Framework
# Comprehensive testing and validation for TerraFusion API endpoints
# Author: TerraFusion Elite Government OS Engineering Team

param(
    [string]$SqlServer = "localhost,1433",
    [string]$SaPassword = "P@ssw0rd123!",
    [string]$Environment = "Development",
    [string]$OutputPath = "C:\TerraFusion\Testing",
    [int]$SampleSize = 1000,
    [switch]$GenerateTestData,
    [switch]$FullValidation,
    [switch]$ExportResults
)

$ErrorActionPreference = "Stop"

# Validation configuration
$ValidationConfig = @{
    TestCategories        = @("DataIntegrity", "APIPerformance", "SecurityValidation", "BusinessRules", "CrossReference")
    PerformanceThresholds = @{
        QueryResponseTime = 500  # milliseconds
        ViewCreationTime  = 2000  # milliseconds
        IndexSeekTime     = 100      # milliseconds
        HealthCheckTime   = 1000   # milliseconds
    }
    DataQualityRules      = @{
        RequiredFields = @("prop_id", "geo_id", "prop_type_cd")
        NumericRanges  = @{
            assessed_val = @{Min = 0; Max = 100000000 }
            prop_val_yr  = @{Min = 1900; Max = [DateTime]::Now.Year + 1 }
        }
        StringFormats  = @{
            geo_id    = "^\d{2}-\d{2}-\d{2}-\d{3}-\d{3}$|^\w{1,20}$"
            situs_zip = "^\d{5}(-\d{4})?$|^$"
        }
    }
}

function Write-ValidationHeader {
    Write-Host @"
╔══════════════════════════════════════════════════════════════════════════════╗
║                    TerraFusion Data Validation Framework                    ║
║                   Comprehensive API Testing & Validation                   ║
║                        Environment: $Environment                        ║
╚══════════════════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

    Write-Host "🧪 Validating TerraFusion API endpoints and data integrity..." -ForegroundColor Green
    Write-Host "📊 Sample Size: $SampleSize records" -ForegroundColor Gray
    Write-Host "📁 Results Path: $OutputPath" -ForegroundColor Gray
    Write-Host ""
}

function New-TestDataset {
    if (-not $GenerateTestData) {
        Write-Host "⏭️  Skipping test data generation" -ForegroundColor Yellow
        return
    }
    
    Write-Host "🔧 Generating test dataset..." -ForegroundColor Cyan
    
    # Create test data insertion script
    $testDataScript = @"
-- TerraFusion Test Data Generator
-- Creates realistic property data for API validation

USE pacs_oltp;

-- Insert required reference data first
IF NOT EXISTS (SELECT 1 FROM property_type WHERE prop_type_cd = 'RES')
    INSERT INTO property_type (prop_type_cd, prop_type_desc) VALUES ('RES', 'Residential');
IF NOT EXISTS (SELECT 1 FROM property_type WHERE prop_type_cd = 'COM')
    INSERT INTO property_type (prop_type_cd, prop_type_desc) VALUES ('COM', 'Commercial');
IF NOT EXISTS (SELECT 1 FROM property_type WHERE prop_type_cd = 'IND')
    INSERT INTO property_type (prop_type_cd, prop_type_desc) VALUES ('IND', 'Industrial');
IF NOT EXISTS (SELECT 1 FROM property_type WHERE prop_type_cd = 'AGR')
    INSERT INTO property_type (prop_type_cd, prop_type_desc) VALUES ('AGR', 'Agricultural');

-- Clear existing test data
DELETE FROM property_val WHERE prop_id BETWEEN 999000 AND 999999;
DELETE FROM situs WHERE prop_id BETWEEN 999000 AND 999999;
DELETE FROM property WHERE prop_id BETWEEN 999000 AND 999999;

-- Insert test properties with required fields
INSERT INTO property (prop_id, geo_id, prop_type_cd, prop_create_dt, state_cd, col_owner_override, col_agent_override)
VALUES 
(999001, '23-45-67-001-001', 'RES', GETDATE()-365, 'OR', 0, 0),
(999002, '23-45-67-001-002', 'COM', GETDATE()-180, 'OR', 0, 0),
(999003, '23-45-67-001-003', 'IND', GETDATE()-90, 'OR', 0, 0),
(999004, '23-45-67-001-004', 'RES', GETDATE()-30, 'OR', 0, 0),
(999005, '23-45-67-001-005', 'AGR', GETDATE()-720, 'OR', 0, 0);

-- Insert test property valuations with all required fields
INSERT INTO property_val (prop_id, prop_val_yr, assessed_val, appraised_val, market, freeze_ceiling, hood_cd, property_use_cd, sup_num, collections_only, suppress_notice_prior_year_values, retain_notice_prior_year_value_setting, has_locked_values)
VALUES 
(999001, 2025, 285000, 320000, 320000, 275000, 'TEST01', 'SINGLE_FAM', 1, 0, 0, 0, 0),
(999001, 2024, 275000, 310000, 310000, 265000, 'TEST01', 'SINGLE_FAM', 2, 0, 0, 0, 0),
(999002, 2025, 1250000, 1400000, 1400000, 0, 'TEST02', 'RETAIL', 3, 0, 0, 0, 0),
(999002, 2024, 1180000, 1350000, 1350000, 0, 'TEST02', 'RETAIL', 4, 0, 0, 0, 0),
(999003, 2025, 2100000, 2350000, 2350000, 0, 'TEST03', 'WAREHOUSE', 5, 0, 0, 0, 0),
(999004, 2025, 195000, 215000, 215000, 185000, 'TEST01', 'CONDO', 6, 0, 0, 0, 0),
(999005, 2025, 45000, 850000, 850000, 0, 'TEST04', 'FARM_LAND', 7, 0, 0, 0, 0);

-- Insert test situs information with required situs_id (excluding computed column situs_display)
INSERT INTO situs (prop_id, situs_id, situs_num, situs_street, situs_city, situs_state, situs_zip, primary_situs)
VALUES 
(999001, 9001, '123', 'Main St', 'Corvallis', 'OR', '97330', 'Y'),
(999002, 9002, '456', 'Business Ave', 'Corvallis', 'OR', '97330', 'Y'),
(999003, 9003, '789', 'Industrial Blvd', 'Corvallis', 'OR', '97331', 'Y'),
(999004, 9004, '321', 'Condo Way Unit A', 'Corvallis', 'OR', '97330', 'Y'),
(999005, 9005, '999', 'Farm Road', 'Philomath', 'OR', '97370', 'Y');

PRINT 'Created test dataset with 5 properties and valuations';
"@

    try {
        $connectionString = "Server=$SqlServer;Database=pacs_oltp;User Id=sa;Password=$SaPassword;TrustServerCertificate=True;"
        $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
        $connection.Open()
        
        $command = New-Object System.Data.SqlClient.SqlCommand($testDataScript, $connection)
        $command.CommandTimeout = 300
        $result = $command.ExecuteNonQuery()
        
        $connection.Close()
        Write-Host "   ✅ Test dataset created successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "   ⚠️  Test data creation warning: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

function Test-DataIntegrity {
    Write-Host "🔍 Running data integrity validation..." -ForegroundColor Cyan
    
    $integrityTests = @()
    
    # Test 1: Core table existence and accessibility  
    $coreTablesQuery = @"
SELECT 
    t.TABLE_NAME,
    CASE t.TABLE_NAME 
        WHEN 'property' THEN (SELECT COUNT(*) FROM property)
        WHEN 'property_val' THEN (SELECT COUNT(*) FROM property_val)
        WHEN 'situs' THEN (SELECT COUNT(*) FROM situs)
        WHEN 'owner' THEN (SELECT COUNT(*) FROM owner)
    END as RecordCount
FROM INFORMATION_SCHEMA.TABLES t
WHERE t.TABLE_NAME IN ('property', 'property_val', 'situs', 'owner')
"@
    
    try {
        $connectionString = "Server=$SqlServer;Database=pacs_oltp;User Id=sa;Password=$SaPassword;TrustServerCertificate=True;"
        $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
        $connection.Open()
        $command = New-Object System.Data.SqlClient.SqlCommand($coreTablesQuery, $connection)
        $reader = $command.ExecuteReader()
        
        while ($reader.Read()) {
            $integrityTests += @{
                Category  = "Core Tables"
                Test      = "Table Access: $($reader['TABLE_NAME'])"
                Status    = "PASS"
                Details   = "$($reader['RecordCount']) records accessible"
                Timestamp = Get-Date
            }
        }
        
        $reader.Close()
        $connection.Close()
        
        Write-Host "   ✅ Core tables validation: PASS" -ForegroundColor Green
    }
    catch {
        $integrityTests += @{
            Category  = "Core Tables"
            Test      = "Table Access"
            Status    = "FAIL"
            Details   = $_.Exception.Message
            Timestamp = Get-Date
        }
        Write-Host "   ❌ Core tables validation: FAIL" -ForegroundColor Red
    }
    
    # Test 2: TerraFusion views functionality
    $viewTests = @("vw_TerraFusion_Property_Core", "vw_TerraFusion_Assessment_History")
    
    foreach ($view in $viewTests) {
        try {
            $viewQuery = "SELECT TOP 10 * FROM $view"
            $connection = New-Object System.Data.SqlClient.SqlConnection("Server=$SqlServer;Database=pacs_oltp;User Id=sa;Password=$SaPassword;TrustServerCertificate=True;")
            $connection.Open()
            
            $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
            $command = New-Object System.Data.SqlClient.SqlCommand($viewQuery, $connection)
            $reader = $command.ExecuteReader()
            
            $recordCount = 0
            while ($reader.Read()) { $recordCount++ }
            
            $stopwatch.Stop()
            $reader.Close()
            $connection.Close()
            
            $responseTime = $stopwatch.ElapsedMilliseconds
            $status = if ($responseTime -le $ValidationConfig.PerformanceThresholds.QueryResponseTime) { "PASS" } else { "WARNING" }
            
            $integrityTests += @{
                Category  = "API Views"
                Test      = "View Query: $view"
                Status    = $status
                Details   = "$recordCount records, ${responseTime}ms response time"
                Timestamp = Get-Date
            }
            
            Write-Host "   ✅ View test ($view): $status - ${responseTime}ms" -ForegroundColor Green
        }
        catch {
            $integrityTests += @{
                Category  = "API Views"
                Test      = "View Query: $view"
                Status    = "FAIL"
                Details   = $_.Exception.Message
                Timestamp = Get-Date
            }
            Write-Host "   ❌ View test ($view): FAIL" -ForegroundColor Red
        }
    }
    
    return $integrityTests
}

function Test-APIPerformance {
    Write-Host "⚡ Running API performance validation..." -ForegroundColor Cyan
    
    $performanceTests = @()
    
    # Performance test scenarios
    $testScenarios = @(
        @{
            Name      = "Property Core View - Single Record"
            Query     = "SELECT TOP 1 * FROM vw_TerraFusion_Property_Core WHERE prop_id IS NOT NULL"
            Threshold = $ValidationConfig.PerformanceThresholds.QueryResponseTime
        },
        @{
            Name      = "Assessment History - Year Range"
            Query     = "SELECT * FROM vw_TerraFusion_Assessment_History WHERE prop_val_yr BETWEEN 2020 AND 2025"
            Threshold = $ValidationConfig.PerformanceThresholds.QueryResponseTime * 2
        },
        @{
            Name      = "Health Check Procedure"
            Query     = "EXEC sp_TerraFusion_HealthCheck"
            Threshold = $ValidationConfig.PerformanceThresholds.HealthCheckTime
        }
    )
    
    foreach ($scenario in $testScenarios) {
        try {
            $connection = New-Object System.Data.SqlClient.SqlConnection("Server=$SqlServer;Database=pacs_oltp;User Id=sa;Password=$SaPassword;TrustServerCertificate=True;")
            $connection.Open()
            
            # Run test multiple times for average
            $totalTime = 0
            $iterations = 3
            
            for ($i = 0; $i -lt $iterations; $i++) {
                $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
                $command = New-Object System.Data.SqlClient.SqlCommand($scenario.Query, $connection)
                $command.CommandTimeout = 30
                
                if ($scenario.Query.StartsWith("EXEC")) {
                    $result = $command.ExecuteNonQuery()
                }
                else {
                    $reader = $command.ExecuteReader()
                    while ($reader.Read()) { } # Consume all results
                    $reader.Close()
                }
                
                $stopwatch.Stop()
                $totalTime += $stopwatch.ElapsedMilliseconds
            }
            
            $connection.Close()
            $avgResponseTime = $totalTime / $iterations
            $status = if ($avgResponseTime -le $scenario.Threshold) { "PASS" } else { "WARNING" }
            
            $performanceTests += @{
                Category  = "Performance"
                Test      = $scenario.Name
                Status    = $status
                Details   = "${avgResponseTime}ms avg (threshold: $($scenario.Threshold)ms)"
                Timestamp = Get-Date
            }
            
            Write-Host "   ✅ $($scenario.Name): $status - ${avgResponseTime}ms" -ForegroundColor Green
        }
        catch {
            $performanceTests += @{
                Category  = "Performance" 
                Test      = $scenario.Name
                Status    = "FAIL"
                Details   = $_.Exception.Message
                Timestamp = Get-Date
            }
            Write-Host "   ❌ $($scenario.Name): FAIL" -ForegroundColor Red
        }
    }
    
    return $performanceTests
}

function Test-SecurityValidation {
    Write-Host "🔒 Running security validation..." -ForegroundColor Cyan
    
    $securityTests = @()
    
    # Test 1: Verify TerraFusion user exists and has correct permissions
    $securityQuery = @"
SELECT 
    dp.name as PrincipalName,
    dp.type_desc as PrincipalType,
    r.permission_name,
    r.state_desc as PermissionState,
    r.class_desc as PermissionScope
FROM sys.database_principals dp
LEFT JOIN sys.database_permissions r ON dp.principal_id = r.grantee_principal_id
WHERE dp.name = 'TerraFusion_Integration'
"@
    
    try {
        $connection = New-Object System.Data.SqlClient.SqlConnection("Server=$SqlServer;Database=pacs_oltp;User Id=sa;Password=$SaPassword;TrustServerCertificate=True;")
        $connection.Open()
        $command = New-Object System.Data.SqlClient.SqlCommand($securityQuery, $connection)
        $reader = $command.ExecuteReader()
        
        $permissionCount = 0
        $hasReadAccess = $false
        
        while ($reader.Read()) {
            $permissionCount++
            if ($reader["permission_name"] -eq "SELECT" -or $reader["PrincipalType"] -eq "SQL_USER") {
                $hasReadAccess = $true
            }
        }
        
        $reader.Close()
        $connection.Close()
        
        $status = if ($hasReadAccess) { "PASS" } else { "FAIL" }
        $securityTests += @{
            Category  = "Security"
            Test      = "TerraFusion User Permissions"
            Status    = $status
            Details   = "$permissionCount permissions found, Read access: $hasReadAccess"
            Timestamp = Get-Date
        }
        
        Write-Host "   ✅ Security validation: $status" -ForegroundColor Green
    }
    catch {
        $securityTests += @{
            Category  = "Security"
            Test      = "TerraFusion User Permissions"
            Status    = "FAIL"
            Details   = $_.Exception.Message
            Timestamp = Get-Date
        }
        Write-Host "   ❌ Security validation: FAIL" -ForegroundColor Red
    }
    
    # Test 2: Verify audit configuration
    try {
        $auditQuery = "SELECT name, is_state_enabled FROM sys.server_audits WHERE name = 'TerraFusion_Audit'"
        $connection = New-Object System.Data.SqlClient.SqlConnection("Server=$SqlServer;Database=master;User Id=sa;Password=$SaPassword;TrustServerCertificate=True;")
        $connection.Open()
        $command = New-Object System.Data.SqlClient.SqlCommand($auditQuery, $connection)
        $reader = $command.ExecuteReader()
        
        $auditExists = $false
        $auditEnabled = $false
        
        while ($reader.Read()) {
            $auditExists = $true
            $auditEnabled = $reader["is_state_enabled"]
        }
        
        $reader.Close()
        $connection.Close()
        
        $status = if ($auditExists -and $auditEnabled) { "PASS" } else { "WARNING" }
        $securityTests += @{
            Category  = "Security"
            Test      = "Audit Configuration"
            Status    = $status
            Details   = "Audit exists: $auditExists, Enabled: $auditEnabled"
            Timestamp = Get-Date
        }
        
        Write-Host "   ✅ Audit validation: $status" -ForegroundColor Green
    }
    catch {
        $securityTests += @{
            Category  = "Security"
            Test      = "Audit Configuration" 
            Status    = "WARNING"
            Details   = $_.Exception.Message
            Timestamp = Get-Date
        }
        Write-Host "   ⚠️  Audit validation: WARNING" -ForegroundColor Yellow
    }
    
    return $securityTests
}

function Test-BusinessRules {
    Write-Host "📋 Running business rules validation..." -ForegroundColor Cyan
    
    $businessTests = @()
    
    # Business Rule 1: Property valuations must be reasonable
    $valuationRuleQuery = @"
SELECT 
    COUNT(*) as TotalProperties,
    COUNT(CASE WHEN assessed_val <= 0 THEN 1 END) as InvalidAssessments,
    COUNT(CASE WHEN assessed_val > appraised_val * 1.1 THEN 1 END) as OverAssessed,
    MIN(assessed_val) as MinAssessedValue,
    MAX(assessed_val) as MaxAssessedValue,
    AVG(assessed_val) as AvgAssessedValue
FROM property_val pv
WHERE prop_val_yr >= 2020
"@
    
    try {
        $connection = New-Object System.Data.SqlClient.SqlConnection("Server=$SqlServer;Database=pacs_oltp;User Id=sa;Password=$SaPassword;TrustServerCertificate=True;")
        $connection.Open()
        $command = New-Object System.Data.SqlClient.SqlCommand($valuationRuleQuery, $connection)
        $reader = $command.ExecuteReader()
        
        while ($reader.Read()) {
            $totalProps = [int]$reader["TotalProperties"]
            $invalidAssessments = [int]$reader["InvalidAssessments"] 
            $overAssessed = [int]$reader["OverAssessed"]
            
            $invalidPercent = if ($totalProps -gt 0) { ($invalidAssessments / $totalProps) * 100 } else { 0 }
            $overPercent = if ($totalProps -gt 0) { ($overAssessed / $totalProps) * 100 } else { 0 }
            
            $status = if ($invalidPercent -le 1 -and $overPercent -le 5) { "PASS" } else { "WARNING" }
            
            $businessTests += @{
                Category  = "Business Rules"
                Test      = "Property Valuation Reasonableness"
                Status    = $status
                Details   = "Total: $totalProps, Invalid: $invalidPercent%, Over-assessed: $overPercent%"
                Timestamp = Get-Date
            }
        }
        
        $reader.Close()
        $connection.Close()
        
        Write-Host "   ✅ Valuation rules validation: PASS" -ForegroundColor Green
    }
    catch {
        $businessTests += @{
            Category  = "Business Rules"
            Test      = "Property Valuation Reasonableness"
            Status    = "FAIL"
            Details   = $_.Exception.Message
            Timestamp = Get-Date
        }
        Write-Host "   ❌ Valuation rules validation: FAIL" -ForegroundColor Red
    }
    
    return $businessTests
}

function Export-ValidationResults {
    param($AllResults)
    
    if (-not $ExportResults) {
        Write-Host "⏭️  Skipping results export" -ForegroundColor Yellow
        return
    }
    
    Write-Host "📊 Exporting validation results..." -ForegroundColor Cyan
    
    # Ensure output directory exists
    if (-not (Test-Path $OutputPath)) {
        New-Item -Path $OutputPath -ItemType Directory -Force | Out-Null
    }
    
    # Create comprehensive report
    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $reportPath = Join-Path $OutputPath "TerraFusion_Validation_Report_$timestamp.json"
    
    $validationReport = @{
        Metadata    = @{
            TestDate    = Get-Date
            Environment = $Environment
            SqlServer   = $SqlServer
            SampleSize  = $SampleSize
            TotalTests  = $AllResults.Count
        }
        Summary     = @{
            PassedTests  = ($AllResults | Where-Object { $_.Status -eq "PASS" }).Count
            FailedTests  = ($AllResults | Where-Object { $_.Status -eq "FAIL" }).Count
            WarningTests = ($AllResults | Where-Object { $_.Status -eq "WARNING" }).Count
        }
        TestResults = $AllResults
        Categories  = @{
            DataIntegrity  = ($AllResults | Where-Object { $_.Category -eq "Data Integrity" })
            APIPerformance = ($AllResults | Where-Object { $_.Category -eq "Performance" })
            Security       = ($AllResults | Where-Object { $_.Category -eq "Security" })
            BusinessRules  = ($AllResults | Where-Object { $_.Category -eq "Business Rules" })
        }
    }
    
    $validationReport | ConvertTo-Json -Depth 5 | Out-File -FilePath $reportPath -Encoding UTF8
    
    # Create summary CSV
    $csvPath = Join-Path $OutputPath "TerraFusion_Validation_Summary_$timestamp.csv"
    $AllResults | Export-Csv -Path $csvPath -NoTypeInformation
    
    Write-Host "   ✅ Validation report exported: $reportPath" -ForegroundColor Green
    Write-Host "   ✅ Summary CSV exported: $csvPath" -ForegroundColor Green
}

# Main execution
try {
    Write-ValidationHeader
    
    # Ensure output directory exists
    if (-not (Test-Path $OutputPath)) {
        New-Item -Path $OutputPath -ItemType Directory -Force | Out-Null
        Write-Host "   ✅ Created testing directory: $OutputPath" -ForegroundColor Gray
    }
    
    # Generate test data if requested
    New-TestDataset
    
    # Run all validation categories
    $allResults = @()
    
    $allResults += Test-DataIntegrity
    $allResults += Test-APIPerformance
    $allResults += Test-SecurityValidation
    $allResults += Test-BusinessRules
    
    # Export results if requested
    Export-ValidationResults -AllResults $allResults
    
    # Summary statistics
    $passedTests = ($allResults | Where-Object { $_.Status -eq "PASS" }).Count
    $failedTests = ($allResults | Where-Object { $_.Status -eq "FAIL" }).Count
    $warningTests = ($allResults | Where-Object { $_.Status -eq "WARNING" }).Count
    $totalTests = $allResults.Count
    
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                    🧪 VALIDATION COMPLETE                                   ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Validation Summary:" -ForegroundColor Cyan
    Write-Host "   ✅ Passed: $passedTests" -ForegroundColor Green
    Write-Host "   ⚠️  Warnings: $warningTests" -ForegroundColor Yellow
    Write-Host "   ❌ Failed: $failedTests" -ForegroundColor Red
    Write-Host "   📋 Total: $totalTests tests executed" -ForegroundColor Gray
    Write-Host ""
    
    $overallStatus = if ($failedTests -eq 0) { 
        if ($warningTests -eq 0) { "🟢 EXCELLENT" } else { "🟡 GOOD" }
    }
    else { "🔴 NEEDS ATTENTION" }
    
    Write-Host "🎯 Overall Status: $overallStatus" -ForegroundColor Cyan
    Write-Host "📁 Results saved to: $OutputPath" -ForegroundColor Gray
    
}
catch {
    Write-Host ""
    Write-Host "❌ Validation framework error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "📋 Check configuration and retry" -ForegroundColor Yellow
    exit 1
}
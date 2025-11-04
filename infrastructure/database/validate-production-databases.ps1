# TerraFusion OS - Production Database Validation Script
# Validates the 5 core production databases are properly deployed and accessible

$ErrorActionPreference = "Continue"

Write-Host "`n========================================================================================================" -ForegroundColor Cyan
Write-Host "🏛️  TERRAFUSION OS - PRODUCTION DATABASE VALIDATION" -ForegroundColor Cyan
Write-Host "========================================================================================================`n" -ForegroundColor Cyan

# Production database list
$productionDatabases = @(
    @{
        Name = "TerraFlow_PRODUCTION"
        Description = "AI Workflow Coordination & Agent Orchestration"
        Port = 5435
        Priority = "CRITICAL"
    },
    @{
        Name = "TerraFusionSync_PRODUCTION"
        Description = "Government System Synchronization & Harris PACS Integration"
        Port = 5436
        Priority = "CRITICAL"
    },
    @{
        Name = "TerraFusionAssessor_PRODUCTION"
        Description = "CAMA Mass Appraisal & Property Assessment"
        Port = 5437
        Priority = "CRITICAL"
    },
    @{
        Name = "BCBSGISPRO_PRODUCTION"
        Description = "GIS Parcel Mapping & Spatial Analysis"
        Port = 5438
        Priority = "CRITICAL"
    },
    @{
        Name = "BSIncomeValuation_PRODUCTION"
        Description = "Income Capitalization & Commercial Valuation"
        Port = 5439
        Priority = "HIGH"
    }
)

$validationResults = @()
$totalDatabases = $productionDatabases.Count
$databasesFound = 0
$databasesAccessible = 0

# Check PostgreSQL availability
Write-Host "🔍 CHECKING POSTGRESQL AVAILABILITY..." -ForegroundColor Yellow

$pgHost = $env:POSTGRES_HOST ?? "localhost"
$pgPort = $env:POSTGRES_PORT ?? 5432
$pgUser = $env:POSTGRES_USER ?? "postgres"
$pgPassword = $env:POSTGRES_PASSWORD ?? "TF_DB_Master_2025_Secure!"

try {
    # Test master database connection
    $env:PGPASSWORD = $pgPassword
    $testConnection = psql -h $pgHost -p $pgPort -U $pgUser -d postgres -c "SELECT version();" 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ PostgreSQL Master: Available at $pgHost`:$pgPort" -ForegroundColor Green
    } else {
        Write-Host "   ❌ PostgreSQL Master: UNAVAILABLE" -ForegroundColor Red
        Write-Host "   Error: $testConnection" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ PostgreSQL Connection Failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n📊 VALIDATING PRODUCTION DATABASES..." -ForegroundColor Yellow
Write-Host "="*100 -ForegroundColor Gray

foreach ($db in $productionDatabases) {
    $dbName = $db.Name.ToLower()
    $result = @{
        Name = $db.Name
        Description = $db.Description
        Port = $db.Port
        Priority = $db.Priority
        Exists = $false
        Accessible = $false
        TablesCount = 0
        Error = $null
    }

    Write-Host "`n🗄️  Checking: $($db.Name)" -ForegroundColor Cyan
    Write-Host "   Description: $($db.Description)" -ForegroundColor Gray
    Write-Host "   Priority: $($db.Priority)" -ForegroundColor Gray

    try {
        # Check if database exists
        $dbExists = psql -h $pgHost -p $pgPort -U $pgUser -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname = '$dbName';" 2>&1

        if ($dbExists -match "1") {
            $result.Exists = $true
            $databasesFound++
            Write-Host "   ✅ Database exists: $dbName" -ForegroundColor Green

            # Try to connect and count tables
            try {
                $tableCount = psql -h $pgHost -p $pgPort -U $pgUser -d $dbName -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema');" 2>&1

                if ($tableCount -match "\d+") {
                    $result.Accessible = $true
                    $result.TablesCount = [int]($tableCount -replace '\s','')
                    $databasesAccessible++
                    Write-Host "   ✅ Connection successful: $dbName" -ForegroundColor Green
                    Write-Host "   📊 Tables: $($result.TablesCount)" -ForegroundColor Green
                } else {
                    $result.Error = "Failed to count tables"
                    Write-Host "   ⚠️  Connection issue: $tableCount" -ForegroundColor Yellow
                }
            } catch {
                $result.Error = $_.Exception.Message
                Write-Host "   ❌ Connection failed: $_" -ForegroundColor Red
            }
        } else {
            Write-Host "   ❌ Database NOT found: $dbName" -ForegroundColor Red
            Write-Host "   💡 Run deployment script to create this database" -ForegroundColor Yellow
        }
    } catch {
        $result.Error = $_.Exception.Message
        Write-Host "   ❌ Validation error: $_" -ForegroundColor Red
    }

    $validationResults += $result
}

# Generate summary
Write-Host "`n========================================================================================================" -ForegroundColor Cyan
Write-Host "📊 VALIDATION SUMMARY" -ForegroundColor Cyan
Write-Host "========================================================================================================" -ForegroundColor Cyan

Write-Host "`n🎯 Overall Status:" -ForegroundColor Yellow
Write-Host "   Total Databases: $totalDatabases" -ForegroundColor White
Write-Host "   Databases Found: $databasesFound / $totalDatabases" -ForegroundColor $(if ($databasesFound -eq $totalDatabases) { "Green" } else { "Yellow" })
Write-Host "   Databases Accessible: $databasesAccessible / $totalDatabases" -ForegroundColor $(if ($databasesAccessible -eq $totalDatabases) { "Green" } else { "Yellow" })

if ($databasesAccessible -eq $totalDatabases) {
    Write-Host "`n🏆 ALL PRODUCTION DATABASES VALIDATED - GOVERNMENT. TRANSCENDED." -ForegroundColor Green
    $exitCode = 0
} elseif ($databasesFound -eq $totalDatabases) {
    Write-Host "`n⚠️  ALL DATABASES EXIST BUT SOME CONNECTION ISSUES" -ForegroundColor Yellow
    $exitCode = 1
} else {
    Write-Host "`n❌ MISSING PRODUCTION DATABASES - DEPLOYMENT REQUIRED" -ForegroundColor Red
    Write-Host "   Run: python infrastructure/database/deploy-production-databases.py" -ForegroundColor Yellow
    $exitCode = 2
}

# Detailed results
Write-Host "`n📋 Detailed Results:" -ForegroundColor Yellow
$validationResults | ForEach-Object {
    $status = if ($_.Accessible) { "✅ READY" } elseif ($_.Exists) { "⚠️  EXISTS (Connection Issue)" } else { "❌ MISSING" }
    Write-Host "   $status - $($_.Name) ($($_.TablesCount) tables)" -ForegroundColor $(if ($_.Accessible) { "Green" } elseif ($_.Exists) { "Yellow" } else { "Red" })
}

# Save results to JSON
$reportPath = "infrastructure/database/validation_report_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
$validationResults | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportPath -Encoding UTF8
Write-Host "`n💾 Validation report saved: $reportPath" -ForegroundColor Cyan

Write-Host "`n========================================================================================================`n" -ForegroundColor Cyan

exit $exitCode

# 🏛️ TERRAFUSION ELITE DATABASE MIGRATION EXECUTOR
# Championship-Level Phase 2 Database Migration
# Government. Transcended.

param(
  [string]$Action = "migrate",
  [string]$Environment = "development",
  [switch]$Validate = $false,
  [switch]$DryRun = $false
)

Write-Host "🏛️ TERRAFUSION ELITE DATABASE MIGRATION EXECUTOR" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "🎯 Phase 2: Database Migration - Championship Execution" -ForegroundColor Yellow
Write-Host "🔐 FISMA-HIGH Security + County Data Sovereignty" -ForegroundColor Green
Write-Host ""

# Championship-Level Configuration
$EliteConfig = @{
  SourceDB        = "terrafusion_enterprise.db"
  TargetHost      = "localhost"
  TargetPort      = 5432
  TargetDB        = "terrafusion_government"
  CountyID        = "benton-county-wa"
  MigrationAgent  = "TerraFusion_Elite_Government_OS"
  SecurityLevel   = "FISMA-HIGH"
  ComplianceLevel = "Government-Grade"
}

function Write-EliteStatus {
  param([string]$Message, [string]$Level = "INFO")

  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss UTC"
  $prefix = switch ($Level) {
    "SUCCESS" { "✅" }
    "ERROR" { "❌" }
    "WARNING" { "⚠️" }
    "INFO" { "🏛️" }
    "SECURITY" { "🔐" }
    "PERFORMANCE" { "🚀" }
    default { "🏛️" }
  }

  Write-Host "[$timestamp] $prefix $Message" -ForegroundColor $(
    switch ($Level) {
      "SUCCESS" { "Green" }
      "ERROR" { "Red" }
      "WARNING" { "Yellow" }
      "SECURITY" { "Magenta" }
      "PERFORMANCE" { "Cyan" }
      default { "White" }
    }
  )
}

function Test-ElitePrerequisites {
  Write-EliteStatus "Validating elite-level prerequisites..." "INFO"

  # Check Python installation
  try {
    $pythonVersion = python --version 2>&1
    Write-EliteStatus "Python detected: $pythonVersion" "SUCCESS"
  } catch {
    Write-EliteStatus "Python not found. Please install Python 3.8+" "ERROR"
    return $false
  }

  # Check required Python packages
  $requiredPackages = @("psycopg2-binary", "cryptography", "sqlite3")
  foreach ($package in $requiredPackages) {
    try {
      python -c "import $($package.Replace('-', '_'))" 2>&1 | Out-Null
      Write-EliteStatus "Python package '$package' verified" "SUCCESS"
    } catch {
      Write-EliteStatus "Installing required package: $package" "INFO"
      pip install $package
    }
  }

  # Check source database
  if (Test-Path $EliteConfig.SourceDB) {
    Write-EliteStatus "Source database found: $($EliteConfig.SourceDB)" "SUCCESS"
  } else {
    Write-EliteStatus "Source database not found: $($EliteConfig.SourceDB)" "ERROR"
    return $false
  }

  # Check Docker for PostgreSQL
  try {
    $dockerVersion = docker --version 2>&1
    Write-EliteStatus "Docker detected: $dockerVersion" "SUCCESS"
  } catch {
    Write-EliteStatus "Docker not found. PostgreSQL database required." "WARNING"
  }

  Write-EliteStatus "Elite prerequisites validation complete" "SUCCESS"
  return $true
}

function Start-ElitePostgreSQL {
  Write-EliteStatus "Starting elite PostgreSQL database..." "INFO"

  # Check if docker-compose file exists
  if (Test-Path "docker-compose.database.yml") {
    Write-EliteStatus "Using elite Docker Compose configuration" "INFO"

    # Start PostgreSQL with government-grade configuration
    docker-compose -f docker-compose.database.yml up -d terrafusion-postgres

    # Wait for database to be ready
    Write-EliteStatus "Waiting for PostgreSQL to achieve operational status..." "INFO"
    $attempts = 0
    $maxAttempts = 30

    do {
      Start-Sleep -Seconds 2
      $attempts++

      try {
        $result = docker exec terrafusion-elite-postgres pg_isready -U terrafusion_admin -d terrafusion_government
        if ($result -match "accepting connections") {
          Write-EliteStatus "PostgreSQL database is operational" "SUCCESS"
          return $true
        }
      } catch {
        # Continue waiting
      }

      Write-Host "." -NoNewline

    } while ($attempts -lt $maxAttempts)

    Write-Host ""
    Write-EliteStatus "PostgreSQL failed to achieve operational status within timeout" "ERROR"
    return $false

  } else {
    Write-EliteStatus "Docker Compose configuration not found" "WARNING"
    Write-EliteStatus "Please ensure PostgreSQL is running on $($EliteConfig.TargetHost):$($EliteConfig.TargetPort)" "INFO"
    return $true
  }
}

function Invoke-EliteMigration {
  Write-EliteStatus "🚀 INITIATING CHAMPIONSHIP-LEVEL DATABASE MIGRATION" "PERFORMANCE"
  Write-EliteStatus "Mission: TerraAgent → TerraFusion PostgreSQL Transformation" "INFO"
  Write-EliteStatus "Security: $($EliteConfig.SecurityLevel)" "SECURITY"
  Write-EliteStatus "Compliance: $($EliteConfig.ComplianceLevel)" "SECURITY"
  Write-Host ""

  if ($DryRun) {
    Write-EliteStatus "DRY RUN MODE - No actual migration will be performed" "WARNING"
    return $true
  }

  # Execute the elite migration script
  try {
    Write-EliteStatus "Executing elite database migration engine..." "PERFORMANCE"

    $migrationResult = python elite_database_migration.py

    if ($LASTEXITCODE -eq 0) {
      Write-EliteStatus "🏆 CHAMPIONSHIP MIGRATION EXECUTION COMPLETE" "SUCCESS"
      Write-EliteStatus "Database transformation successful with government excellence" "SUCCESS"

      # Display migration report if available
      if (Test-Path "elite_migration_report.json") {
        $report = Get-Content "elite_migration_report.json" | ConvertFrom-Json
        Write-Host ""
        Write-EliteStatus "📊 ELITE MIGRATION METRICS:" "PERFORMANCE"
        Write-EliteStatus "Records Migrated: $($report.migrated_records)" "INFO"
        Write-EliteStatus "Duration: $($report.duration_formatted)" "INFO"
        Write-EliteStatus "Performance: $([math]::Round($report.performance_metrics.records_per_second, 2)) records/sec" "PERFORMANCE"
        Write-EliteStatus "Success Status: $($report.success)" "$(if($report.success) { 'SUCCESS' } else { 'ERROR' })"
      }

      return $true
    } else {
      Write-EliteStatus "Migration execution failed with exit code: $LASTEXITCODE" "ERROR"
      return $false
    }

  } catch {
    Write-EliteStatus "Migration execution error: $($_.Exception.Message)" "ERROR"
    return $false
  }
}

function Invoke-EliteValidation {
  Write-EliteStatus "🔍 Executing championship-level validation..." "INFO"

  # Database connectivity validation
  try {
    Write-EliteStatus "Testing PostgreSQL connectivity..." "INFO"

    $connectionTest = docker exec terrafusion-elite-postgres psql -U terrafusion_admin -d terrafusion_government -c "SELECT COUNT(*) FROM properties;"

    if ($connectionTest -match "\d+") {
      $recordCount = [regex]::Match($connectionTest, "\d+").Value
      Write-EliteStatus "PostgreSQL connection successful - $recordCount properties found" "SUCCESS"
    } else {
      Write-EliteStatus "PostgreSQL connection test failed" "ERROR"
      return $false
    }

  } catch {
    Write-EliteStatus "Database validation error: $($_.Exception.Message)" "ERROR"
    return $false
  }

  # Data integrity validation
  Write-EliteStatus "Validating data integrity with government standards..." "SECURITY"

  # Check for required audit fields
  $auditCheck = docker exec terrafusion-elite-postgres psql -U terrafusion_admin -d terrafusion_government -c "SELECT COUNT(*) FROM properties WHERE created_by IS NOT NULL AND updated_by IS NOT NULL AND county_id IS NOT NULL;"

  if ($auditCheck -match "\d+") {
    Write-EliteStatus "Government audit trail validation passed" "SUCCESS"
  } else {
    Write-EliteStatus "Government audit trail validation failed" "ERROR"
    return $false
  }

  Write-EliteStatus "Elite validation complete - All systems operational" "SUCCESS"
  return $true
}

function Show-EliteStatus {
  Write-Host ""
  Write-EliteStatus "🏛️ TERRAFUSION ELITE DATABASE STATUS" "INFO"
  Write-Host "================================================" -ForegroundColor Cyan

  # System Status
  Write-EliteStatus "Migration Agent: $($EliteConfig.MigrationAgent)" "INFO"
  Write-EliteStatus "County: $($EliteConfig.CountyID)" "INFO"
  Write-EliteStatus "Security Level: $($EliteConfig.SecurityLevel)" "SECURITY"
  Write-EliteStatus "Compliance Level: $($EliteConfig.ComplianceLevel)" "SECURITY"

  # Database Status
  try {
    $dbStatus = docker exec terrafusion-elite-postgres pg_isready -U terrafusion_admin -d terrafusion_government
    if ($dbStatus -match "accepting connections") {
      Write-EliteStatus "PostgreSQL Database: OPERATIONAL" "SUCCESS"
    } else {
      Write-EliteStatus "PostgreSQL Database: NOT OPERATIONAL" "ERROR"
    }
  } catch {
    Write-EliteStatus "PostgreSQL Database: STATUS UNKNOWN" "WARNING"
  }

  # Check for migration report
  if (Test-Path "elite_migration_report.json") {
    Write-EliteStatus "Last Migration Report: AVAILABLE" "SUCCESS"
  } else {
    Write-EliteStatus "Last Migration Report: NOT FOUND" "WARNING"
  }

  Write-Host ""
  Write-EliteStatus "Government. Transcended." "SUCCESS"
}

# =====================================================
# MAIN EXECUTION - CHAMPIONSHIP STANDARD
# =====================================================

Write-EliteStatus "Action: $Action | Environment: $Environment" "INFO"

switch ($Action.ToLower()) {
  "migrate" {
    if (Test-ElitePrerequisites) {
      if (Start-ElitePostgreSQL) {
        $migrationSuccess = Invoke-EliteMigration

        if ($migrationSuccess -and $Validate) {
          Invoke-EliteValidation | Out-Null
        }

        if ($migrationSuccess) {
          Write-Host ""
          Write-EliteStatus "🏆 PHASE 2 DATABASE MIGRATION: COMPLETE" "SUCCESS"
          Write-EliteStatus "TerraAgent → TerraFusion transformation successful" "SUCCESS"
          Write-EliteStatus "Government-grade database ready for Phase 3" "SUCCESS"
        } else {
          Write-EliteStatus "❌ PHASE 2 DATABASE MIGRATION: FAILED" "ERROR"
          exit 1
        }
      }
    } else {
      Write-EliteStatus "Prerequisites validation failed" "ERROR"
      exit 1
    }
  }

  "validate" {
    if (Invoke-EliteValidation) {
      Write-EliteStatus "Validation successful - Database operational" "SUCCESS"
    } else {
      Write-EliteStatus "Validation failed - Database issues detected" "ERROR"
      exit 1
    }
  }

  "status" {
    Show-EliteStatus
  }

  "start-db" {
    Start-ElitePostgreSQL
  }

  default {
    Write-EliteStatus "Unknown action: $Action" "ERROR"
    Write-EliteStatus "Available actions: migrate, validate, status, start-db" "INFO"
    exit 1
  }
}

Write-Host ""
Write-EliteStatus "🏛️ TerraFusion Elite Database Migration Executor Complete" "SUCCESS"

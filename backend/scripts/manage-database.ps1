#!/usr/bin/env pwsh
<#
.SYNOPSIS
    TerraFusion Elite - Database Management & Migration
.DESCRIPTION
    Comprehensive database operations including migrations, seeding, and backup
.PARAMETER Action
    Action to perform: Migrate, Seed, Reset, Backup, Restore, Status
.PARAMETER Environment
    Target environment: Development, Staging, Production
.EXAMPLE
    .\manage-database.ps1 -Action Status
    .\manage-database.ps1 -Action Migrate -Environment Development
    .\manage-database.ps1 -Action Backup
#>

param(
    [ValidateSet("Migrate", "Seed", "Reset", "Backup", "Restore", "Status")]
    [string]$Action = "Status",

    [ValidateSet("Development", "Staging", "Production")]
    [string]$Environment = "Development"
)

$ErrorActionPreference = 'Stop'
$BackendRoot = Split-Path -Parent $PSScriptRoot

function Write-Banner {
    Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  TERRAFUSION DATABASE MANAGER - $Action".PadRight(65) + "║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan
}

function Get-DatabaseStatus {
    Write-Host "📊 Database Status Check`n" -ForegroundColor Yellow

    # Check EF Core tools
    Write-Host "🔧 Checking .NET EF Core Tools..." -ForegroundColor Cyan
    try {
        $efVersion = dotnet ef --version 2>&1
        Write-Host "  ✅ EF Core Tools: $efVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "  ❌ EF Core Tools not installed" -ForegroundColor Red
        Write-Host "     Install with: dotnet tool install --global dotnet-ef`n" -ForegroundColor Yellow
        return
    }

    # Check for pending migrations
    Write-Host "`n📋 Checking Migrations..." -ForegroundColor Cyan
    Push-Location "$BackendRoot\TerraFusion.API"

    try {
        $migrations = dotnet ef migrations list --no-build 2>&1
        Write-Host "  Migrations:" -ForegroundColor Gray
        Write-Host "  $migrations`n" -ForegroundColor Gray
    }
    catch {
        Write-Host "  ⚠️  Could not retrieve migrations`n" -ForegroundColor Yellow
    }
    finally {
        Pop-Location
    }

    # Check database connectivity
    Write-Host "🔌 Database Connectivity:" -ForegroundColor Cyan

    # PostgreSQL check
    $pgHost = $env:POSTGRES_HOST ?? "localhost"
    $pgPort = $env:POSTGRES_PORT ?? "5432"
    $pgConnected = Test-NetConnection -ComputerName $pgHost -Port $pgPort -WarningAction SilentlyContinue -ErrorAction SilentlyContinue

    if ($pgConnected.TcpTestSucceeded) {
        Write-Host "  ✅ PostgreSQL: Connected ($pgHost:$pgPort)" -ForegroundColor Green
    }
    else {
        Write-Host "  ⚠️  PostgreSQL: Not reachable ($pgHost:$pgPort)" -ForegroundColor Yellow
    }

    # Check data directory
    Write-Host "`n📁 Data Directory:" -ForegroundColor Cyan
    $dataDir = "$BackendRoot\Data"
    if (Test-Path $dataDir) {
        $dbFiles = Get-ChildItem -Path $dataDir -Filter "*.db" -ErrorAction SilentlyContinue
        if ($dbFiles) {
            Write-Host "  ✅ SQLite Databases:" -ForegroundColor Green
            foreach ($db in $dbFiles) {
                $sizeKB = [math]::Round($db.Length / 1KB, 2)
                Write-Host ("     - {0} ({1} KB)" -f $db.Name, $sizeKB) -ForegroundColor Gray
            }
        }
        else {
            Write-Host "  ℹ️  No SQLite databases found" -ForegroundColor Gray
        }
    }
    else {
        Write-Host "  ℹ️  Data directory not found: $dataDir" -ForegroundColor Gray
    }

    Write-Host ""
}

function Invoke-Migrations {
    Write-Host "🚀 Running Database Migrations`n" -ForegroundColor Yellow

    Push-Location "$BackendRoot\TerraFusion.API"

    try {
        Write-Host "Building project..." -ForegroundColor Cyan
        dotnet build --configuration Release --verbosity quiet

        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Build failed" -ForegroundColor Red
            return
        }

        Write-Host "✅ Build successful`n" -ForegroundColor Green

        Write-Host "Applying migrations..." -ForegroundColor Cyan
        dotnet ef database update --no-build

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Migrations applied successfully`n" -ForegroundColor Green
        }
        else {
            Write-Host "❌ Migration failed`n" -ForegroundColor Red
        }
    }
    finally {
        Pop-Location
    }
}

function Invoke-SeedData {
    Write-Host "🌱 Seeding Database`n" -ForegroundColor Yellow

    # Check for seed script
    $seedScript = "$BackendRoot\scripts\seed-database.sql"

    if (Test-Path $seedScript) {
        Write-Host "  ✅ Found seed script: seed-database.sql" -ForegroundColor Green
        Write-Host "  ℹ️  Execute manually with psql or your preferred SQL client`n" -ForegroundColor Gray
    }
    else {
        Write-Host "  ℹ️  No seed script found at: $seedScript" -ForegroundColor Gray
        Write-Host "  ℹ️  Create seed-database.sql with your seed data`n" -ForegroundColor Gray
    }
}

function Invoke-DatabaseReset {
    Write-Host "⚠️  Database Reset - DESTRUCTIVE OPERATION`n" -ForegroundColor Red

    $confirm = Read-Host "This will DELETE all data. Type 'RESET' to confirm"

    if ($confirm -ne "RESET") {
        Write-Host "❌ Reset cancelled`n" -ForegroundColor Yellow
        return
    }

    Push-Location "$BackendRoot\TerraFusion.API"

    try {
        Write-Host "Dropping database..." -ForegroundColor Cyan
        dotnet ef database drop --force --no-build

        Write-Host "Recreating database..." -ForegroundColor Cyan
        dotnet ef database update --no-build

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database reset successfully`n" -ForegroundColor Green
        }
        else {
            Write-Host "❌ Reset failed`n" -ForegroundColor Red
        }
    }
    finally {
        Pop-Location
    }
}

function Invoke-DatabaseBackup {
    Write-Host "💾 Creating Database Backup`n" -ForegroundColor Yellow

    $backupDir = "$BackendRoot\Backups"
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

    # Create backup directory
    if (-not (Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir | Out-Null
        Write-Host "  ✅ Created backup directory" -ForegroundColor Green
    }

    # Backup SQLite databases
    $dataDir = "$BackendRoot\Data"
    if (Test-Path $dataDir) {
        $dbFiles = Get-ChildItem -Path $dataDir -Filter "*.db"

        foreach ($db in $dbFiles) {
            $backupPath = "$backupDir\$($db.BaseName)_$timestamp.db"
            Copy-Item -Path $db.FullName -Destination $backupPath
            Write-Host ("  ✅ Backed up: {0}" -f $db.Name) -ForegroundColor Green
        }
    }

    Write-Host "`n  📁 Backup location: $backupDir`n" -ForegroundColor Cyan
}

# Main Execution
Write-Banner

switch ($Action) {
    "Status" { Get-DatabaseStatus }
    "Migrate" { Invoke-Migrations }
    "Seed" { Invoke-SeedData }
    "Reset" { Invoke-DatabaseReset }
    "Backup" { Invoke-DatabaseBackup }
    "Restore" {
        Write-Host "⚠️  Restore functionality coming soon" -ForegroundColor Yellow
        Write-Host "   Manually restore from Backups directory`n" -ForegroundColor Gray
    }
}

Write-Host "✅ Database operation completed`n" -ForegroundColor Green

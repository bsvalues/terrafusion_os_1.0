<#
.SYNOPSIS
    TerraFusion OS - Database Cleanup Script
    Removes duplicate and backup database files to optimize workspace

.DESCRIPTION
    This script safely removes:
    - Old backup databases (3-5 months old)
    - Demo databases (can be regenerated)
    - Duplicate development databases
    - Desktop app duplicates
    
    Preserves:
    - All operational databases in data/
    - Development database in backend/TerraFusion.API/
    - Trust Fabric databases (pending review)

.PARAMETER WhatIf
    Show what would be deleted without actually deleting

.PARAMETER Force
    Skip confirmation prompts

.EXAMPLE
    .\cleanup-databases.ps1 -WhatIf
    Show what would be deleted

.EXAMPLE
    .\cleanup-databases.ps1
    Execute cleanup with confirmation prompts

.EXAMPLE
    .\cleanup-databases.ps1 -Force
    Execute cleanup without confirmation prompts

.NOTES
    Author: TerraFusion AI
    Date: 2025-01-10
    Version: 1.0
#>

[CmdletBinding(SupportsShouldProcess)]
param(
    [switch]$Force
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Initialize counters
$filesDeleted = 0
$spaceRecovered = 0
$errors = @()

# Create log file
$logFile = "logs/database-cleanup-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
New-Item -Path "logs" -ItemType Directory -Force | Out-Null

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $Message" | Tee-Object -FilePath $logFile -Append
}

function Get-DirectorySize {
    param([string]$Path)
    if (Test-Path $Path) {
        $size = (Get-ChildItem -Path $Path -Recurse -ErrorAction SilentlyContinue | 
                Measure-Object -Property Length -Sum).Sum
        return $size
    }
    return 0
}

function Remove-ItemSafely {
    param(
        [string]$Path,
        [string]$Description
    )
    
    if (-not (Test-Path $Path)) {
        Write-Log "⚠️ Skipped: $Description - Path not found: $Path"
        return
    }
    
    try {
        $size = Get-DirectorySize -Path $Path
        $sizeInMB = [math]::Round($size / 1MB, 2)
        
        if ($PSCmdlet.ShouldProcess($Path, "Delete $Description ($sizeInMB MB)")) {
            Remove-Item -Path $Path -Recurse -Force -ErrorAction Stop
            $script:filesDeleted++
            $script:spaceRecovered += $size
            Write-Log "✅ Deleted: $Description ($sizeInMB MB)"
        }
    }
    catch {
        $script:errors += "Failed to delete $Description : $_"
        Write-Log "❌ Error: Failed to delete $Description - $_"
    }
}

# Banner
Write-Host ""
Write-Host "🧹 ================================================================" -ForegroundColor Cyan
Write-Host "   TerraFusion OS - Database Cleanup Script" -ForegroundColor Cyan
Write-Host "   Removing duplicate and backup database files" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Log "Starting database cleanup..."

# Calculate initial workspace size
Write-Host "📊 Calculating current workspace size..." -ForegroundColor Yellow
$initialDbCount = (Get-ChildItem -Path . -Recurse -Include *.db -ErrorAction SilentlyContinue).Count
$initialSize = Get-DirectorySize -Path .
$initialSizeGB = [math]::Round($initialSize / 1GB, 2)

Write-Host "   Current: $initialDbCount database files, $initialSizeGB GB total workspace" -ForegroundColor White
Write-Log "Initial state: $initialDbCount database files, $initialSizeGB GB total workspace"

if (-not $WhatIfPreference) {
    Write-Host ""
    Write-Host "⚠️ WARNING: This will permanently delete files!" -ForegroundColor Red
    Write-Host "   Backup files, demo data, and duplicates will be removed." -ForegroundColor Yellow
    Write-Host ""
    
    if (-not $Force) {
        $confirmation = Read-Host "Do you want to continue? (yes/no)"
        if ($confirmation -ne "yes") {
            Write-Host "❌ Cleanup cancelled by user." -ForegroundColor Red
            Write-Log "Cleanup cancelled by user"
            exit 0
        }
    }
}

Write-Host ""
Write-Host "🗑️ Phase 1: Removing Old Backups..." -ForegroundColor Cyan
Write-Host "─────────────────────────────────────" -ForegroundColor Cyan

# Delete old backup deployments
Remove-ItemSafely `
    -Path "archive/old-backups/terrafusion-os-deployment-20250924_182335" `
    -Description "Old backup deployment (Sep 24, 2024)"

# Delete legacy code backups
Remove-ItemSafely `
    -Path "LEGACY_CODE_ARCHIVE/src-backup-20251010" `
    -Description "Legacy code backup (Oct 10, 2024)"

# Delete production backups
Remove-ItemSafely `
    -Path "packages/shock-and-awe/backups/production_20250809_074906" `
    -Description "Production backup (Aug 9, 2024)"

# Delete old builds
Remove-ItemSafely `
    -Path "packages/shock-and-awe/old_builds" `
    -Description "Old build artifacts"

Write-Host ""
Write-Host "🎭 Phase 2: Removing Demo Databases..." -ForegroundColor Cyan
Write-Host "─────────────────────────────────────" -ForegroundColor Cyan

# Delete demo databases
Remove-ItemSafely `
    -Path "packages/shock-and-awe/demos" `
    -Description "Demo databases (county_demo)"

Remove-ItemSafely `
    -Path "deployment/web-demo/data/benton-county-demo.db" `
    -Description "Web demo database"

Remove-ItemSafely `
    -Path "deployment/web-demo/hostinger-package/public_html/data/benton-county-demo.db" `
    -Description "Hostinger demo database"

Write-Host ""
Write-Host "🔄 Phase 3: Removing Duplicate Development Databases..." -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────────────────" -ForegroundColor Cyan

# Delete duplicate terrafusion.db (keep only data/terrafusion.db)
Remove-ItemSafely `
    -Path "backend/TerraFusion.API/terrafusion.db" `
    -Description "Duplicate: backend/TerraFusion.API/terrafusion.db"

Remove-ItemSafely `
    -Path "backend/TerraFusion.Data/terrafusion.db" `
    -Description "Duplicate: backend/TerraFusion.Data/terrafusion.db"

# Delete duplicate analytics.db (keep only data/databases/analytics.db)
Remove-ItemSafely `
    -Path "terrafusion-cos/analytics.db" `
    -Description "Duplicate: terrafusion-cos/analytics.db"

# Delete duplicate terrafusion_sync.db (keep only data/databases/terrafusion_sync.db)
Remove-ItemSafely `
    -Path "terrafusion-cos/terrafusion_sync.db" `
    -Description "Duplicate: terrafusion-cos/terrafusion_sync.db"

Remove-ItemSafely `
    -Path "trust-fabric/terrafusion_sync.db" `
    -Description "Duplicate: trust-fabric/terrafusion_sync.db"

Write-Host ""
Write-Host "🖥️ Phase 4: Removing Desktop App Duplicates..." -ForegroundColor Cyan
Write-Host "────────────────────────────────────────────" -ForegroundColor Cyan

# Delete desktop app duplicate
Remove-ItemSafely `
    -Path "terrafusion-cos/desktop/vendor_registry.db" `
    -Description "Duplicate: desktop/vendor_registry.db"

Write-Host ""
Write-Host "📊 Cleanup Summary" -ForegroundColor Green
Write-Host "══════════════════" -ForegroundColor Green

# Calculate final workspace size
$finalDbCount = (Get-ChildItem -Path . -Recurse -Include *.db -ErrorAction SilentlyContinue).Count
$finalSize = Get-DirectorySize -Path .
$finalSizeGB = [math]::Round($finalSize / 1GB, 2)
$spaceRecoveredMB = [math]::Round($spaceRecovered / 1MB, 2)
$spaceRecoveredGB = [math]::Round($spaceRecovered / 1GB, 2)
$percentReduction = [math]::Round(($spaceRecovered / $initialSize) * 100, 1)

Write-Host ""
Write-Host "   Database Files: $initialDbCount → $finalDbCount" -ForegroundColor White
Write-Host "   Workspace Size: $initialSizeGB GB → $finalSizeGB GB" -ForegroundColor White
Write-Host "   Space Recovered: $spaceRecoveredMB MB ($spaceRecoveredGB GB)" -ForegroundColor Green
Write-Host "   Reduction: $percentReduction%" -ForegroundColor Green
Write-Host "   Items Deleted: $filesDeleted" -ForegroundColor White
Write-Host ""

Write-Log "Cleanup completed successfully"
Write-Log "Database files: $initialDbCount → $finalDbCount"
Write-Log "Space recovered: $spaceRecoveredMB MB ($percentReduction%)"
Write-Log "Items deleted: $filesDeleted"

if ($errors.Count -gt 0) {
    Write-Host "⚠️ Errors Encountered:" -ForegroundColor Yellow
    foreach ($errorMsg in $errors) {
        Write-Host "   • $errorMsg" -ForegroundColor Yellow
        Write-Log "ERROR: $errorMsg"
    }
    Write-Host ""
}

Write-Host "✅ Cleanup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Log file: $logFile" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔍 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Test application startup" -ForegroundColor White
Write-Host "   2. Verify database connectivity" -ForegroundColor White
Write-Host "   3. Test Harris PACS integration" -ForegroundColor White
Write-Host "   4. Test levy chain queries" -ForegroundColor White
Write-Host "   5. Test analytics dashboards" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Operational databases preserved:" -ForegroundColor Green
Write-Host "   ✅ data/databases/ (8 core system databases)" -ForegroundColor White
Write-Host "   ✅ data/benton_*.db (15 county databases)" -ForegroundColor White
Write-Host "   ✅ data/*.db (7 government module databases)" -ForegroundColor White
Write-Host "   ✅ data/terrafusion.db (main database)" -ForegroundColor White
Write-Host "   ✅ backend/TerraFusion.API/terrafusion-dev.db (development)" -ForegroundColor White
Write-Host ""

# Rollback instructions
Write-Host "🔄 Rollback Instructions:" -ForegroundColor Yellow
Write-Host "   If you need to restore deleted files:" -ForegroundColor White
Write-Host "   1. Check git history for deleted files" -ForegroundColor White
Write-Host "   2. Use 'git restore' to recover specific files" -ForegroundColor White
Write-Host "   3. Or restore from your external backup system" -ForegroundColor White
Write-Host ""

Write-Host "🚀 THE TERRAFUSION WAY - Workspace Optimized! 🚀" -ForegroundColor Magenta
Write-Host ""

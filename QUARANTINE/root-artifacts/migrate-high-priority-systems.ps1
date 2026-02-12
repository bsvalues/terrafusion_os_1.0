# TerraFusion Elite Government OS Engineering Agent - HIGH Priority Systems Migration
# Systematic migration of next 4 HIGH priority systems

$ErrorActionPreference = "Stop"

# Configuration
$sourcePath = "C:\Users\bsval\OneDrive\Desktop\from D"
$targetRoot = "C:\Users\bsval\terrafusion_os_1.0\applications"

# HIGH priority systems to migrate (Priority 4-7)
$highPrioritySystems = @(
    @{
        Name = "BCBSWebhub_PRODUCTION"
        Target = "bcbs-webhub-production"
        FoundationValue = 0.094
    },
    @{
        Name = "TerraFusionDashboard_PRODUCTION"
        Target = "terra-dashboard-production"
        FoundationValue = 0.085
    },
    @{
        Name = "TerraFusionPro_PRODUCTION"
        Target = "terra-pro-production"
        FoundationValue = 0.076
    },
    @{
        Name = "TerraAgent_PRODUCTION"
        Target = "terra-agent-production"
        FoundationValue = 0.072
    }
)

# Logging
$logFile = "migration-log-high-priority-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage
    Add-Content -Path $logFile -Value $logMessage
}

function Migrate-TerraFusionSystem {
    param(
        [hashtable]$System
    )

    $systemName = $System.Name
    $targetName = $System.Target
    $foundationValue = $System.FoundationValue

    Write-Log "===========================================" "INFO"
    Write-Log "Starting migration: $systemName" "INFO"
    Write-Log "Foundation Value: +$foundationValue" "INFO"
    Write-Log "Target: $targetName" "INFO"

    # Step 1: Verify source exists
    $sourceDir = Join-Path $sourcePath $systemName
    if (!(Test-Path $sourceDir)) {
        Write-Log "ERROR: Source directory not found: $sourceDir" "ERROR"
        return $false
    }
    Write-Log "✅ Source verified: $sourceDir" "INFO"

    # Step 2: Analyze source
    $sourceFiles = Get-ChildItem $sourceDir -Recurse -File
    $sourceSize = ($sourceFiles | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Log "Source analysis: $($sourceFiles.Count) files, $([math]::Round($sourceSize, 2)) MB" "INFO"

    # Step 3: Create target directory
    $targetDir = Join-Path $targetRoot $targetName
    if (Test-Path $targetDir) {
        Write-Log "WARNING: Target directory already exists. Backing up..." "WARN"
        $backupDir = "$targetDir-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Move-Item $targetDir $backupDir
        Write-Log "Backup created: $backupDir" "INFO"
    }

    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    Write-Log "✅ Target directory created: $targetDir" "INFO"

    # Step 4: Copy files with progress
    Write-Log "Copying files..." "INFO"
    try {
        Copy-Item "$sourceDir\*" -Destination $targetDir -Recurse -Force
    }
    catch {
        Write-Log "ERROR: Copy failed: $_" "ERROR"
        return $false
    }

    # Step 5: Verify copy
    $targetFiles = Get-ChildItem $targetDir -Recurse -File
    $targetSize = ($targetFiles | Measure-Object -Property Length -Sum).Sum / 1MB

    Write-Log "Target analysis: $($targetFiles.Count) files, $([math]::Round($targetSize, 2)) MB" "INFO"

    if ($sourceFiles.Count -ne $targetFiles.Count) {
        Write-Log "ERROR: File count mismatch! Source: $($sourceFiles.Count), Target: $($targetFiles.Count)" "ERROR"
        return $false
    }

    if ([math]::Abs($sourceSize - $targetSize) -gt 0.1) {
        Write-Log "WARNING: Size difference detected. Source: $sourceSize MB, Target: $targetSize MB" "WARN"
    }

    Write-Log "✅ Verification passed: $($targetFiles.Count) files copied successfully" "INFO"

    # Step 6: Check for package.json or requirements.txt
    $hasPackageJson = Test-Path (Join-Path $targetDir "package.json")
    $hasRequirementsTxt = Test-Path (Join-Path $targetDir "requirements.txt")
    $hasCsproj = (Get-ChildItem $targetDir -Filter "*.csproj" -Recurse).Count -gt 0

    Write-Log "Technology markers:" "INFO"
    if ($hasPackageJson) { Write-Log "  - Node.js (package.json found)" "INFO" }
    if ($hasRequirementsTxt) { Write-Log "  - Python (requirements.txt found)" "INFO" }
    if ($hasCsproj) { Write-Log "  - .NET (*.csproj found)" "INFO" }

    # Step 7: Create migration manifest
    $manifest = @{
        SystemName = $systemName
        TargetName = $targetName
        MigrationDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        SourcePath = $sourceDir
        TargetPath = $targetDir
        FileCount = $targetFiles.Count
        SizeMB = [math]::Round($targetSize, 2)
        FoundationValue = $foundationValue
        Technologies = @()
    }

    if ($hasPackageJson) { $manifest.Technologies += "Node.js" }
    if ($hasRequirementsTxt) { $manifest.Technologies += "Python" }
    if ($hasCsproj) { $manifest.Technologies += ".NET" }

    $manifestPath = Join-Path $targetDir ".migration-manifest.json"
    $manifest | ConvertTo-Json -Depth 10 | Set-Content $manifestPath
    Write-Log "✅ Migration manifest created: $manifestPath" "INFO"

    Write-Log "✅✅✅ MIGRATION COMPLETE: $systemName" "INFO"
    Write-Log "===========================================" "INFO"

    return $true
}

# Main execution
Write-Log "==================================================" "INFO"
Write-Log "TerraFusion Elite Government OS Engineering Agent" "INFO"
Write-Log "HIGH Priority Systems Migration (4-7)" "INFO"
Write-Log "==================================================" "INFO"

# Migrate each HIGH priority system
$successCount = 0
$failCount = 0
$totalFiles = 0
$totalSizeMB = 0

foreach ($system in $highPrioritySystems) {
    $result = Migrate-TerraFusionSystem -System $system
    if ($result) {
        $successCount++
        # Get stats for summary
        $targetDir = Join-Path $targetRoot $system.Target
        $files = Get-ChildItem $targetDir -Recurse -File
        $totalFiles += $files.Count
        $totalSizeMB += ($files | Measure-Object -Property Length -Sum).Sum / 1MB
    }
    else {
        $failCount++
    }
    Write-Host ""  # Blank line between systems
}

# Final summary
Write-Log "==================================================" "INFO"
Write-Log "MIGRATION SUMMARY - HIGH PRIORITY SYSTEMS" "INFO"
Write-Log "Total Systems: $($highPrioritySystems.Count)" "INFO"
Write-Log "Successful: $successCount" "INFO"
Write-Log "Failed: $failCount" "INFO"
Write-Log "Total Files Migrated: $totalFiles" "INFO"
Write-Log "Total Size: $([math]::Round($totalSizeMB, 2)) MB" "INFO"
Write-Log "Foundation Value Added: +$($highPrioritySystems | ForEach-Object { $_.FoundationValue } | Measure-Object -Sum).Sum" "INFO"
Write-Log "Log file: $logFile" "INFO"
Write-Log "==================================================" "INFO"

if ($successCount -eq $highPrioritySystems.Count) {
    Write-Host "`n✅✅✅ ALL HIGH PRIORITY SYSTEMS MIGRATED SUCCESSFULLY ✅✅✅" -ForegroundColor Green
    Write-Host "Government. Transcended. Excellence Achieved." -ForegroundColor Cyan
}
else {
    Write-Host "`n⚠️  MIGRATION COMPLETED WITH ERRORS ⚠️" -ForegroundColor Yellow
}

# TerraFusion Elite Government OS Engineering Agent - MEDIUM Priority Systems Migration
# Systematic migration of next 10 MEDIUM priority systems

$ErrorActionPreference = "Stop"

# Configuration
$sourcePath = "C:\Users\bsval\OneDrive\Desktop\from D"
$targetRoot = "C:\Users\bsval\terrafusion_os_1.0\applications"

# MEDIUM priority systems to migrate (batch 1 of 3)
$mediumPrioritySystems = @(
    @{
        Name = "TerraFusionBuild_ACTUAL"
        Target = "terra-build-actual"
        FoundationValue = 0.070
    },
    @{
        Name = "TerraFusionPlayground-main"
        Target = "terra-playground-main"
        FoundationValue = 0.070
    },
    @{
        Name = "TerraFusionPrimeView_PRODUCTION"
        Target = "terra-primeview-production"
        FoundationValue = 0.070
    },
    @{
        Name = "TerraFusionV0Demo_PRODUCTION"
        Target = "terra-v0demo-production"
        FoundationValue = 0.070
    },
    @{
        Name = "TerraFusionProf_PRODUCTION"
        Target = "terra-prof-production"
        FoundationValue = 0.069
    },
    @{
        Name = "TerraFusionAssistant_PRODUCTION"
        Target = "terra-assistant-production"
        FoundationValue = 0.068
    },
    @{
        Name = "TerraFusionGama_PRODUCTION"
        Target = "terra-gama-production"
        FoundationValue = 0.067
    },
    @{
        Name = "TerraFusionEcosystem_PRODUCTION"
        Target = "terra-ecosystem-production"
        FoundationValue = 0.066
    },
    @{
        Name = "TerraFusionProPlus_PRODUCTION"
        Target = "terra-proplus-production"
        FoundationValue = 0.062
    },
    @{
        Name = "TerraMiner_PRODUCTION"
        Target = "terra-miner-production"
        FoundationValue = 0.060
    }
)

# Logging
$logFile = "migration-log-medium-batch1-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"

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
    $sourceFiles = Get-ChildItem $sourceDir -Recurse -File -ErrorAction SilentlyContinue
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
    $startTime = Get-Date
    try {
        Copy-Item "$sourceDir\*" -Destination $targetDir -Recurse -Force -ErrorAction Stop
    }
    catch {
        Write-Log "ERROR: Copy failed: $_" "ERROR"
        return $false
    }
    $duration = ((Get-Date) - $startTime).TotalSeconds
    Write-Log "Copy completed in $([math]::Round($duration, 1)) seconds" "INFO"

    # Step 5: Verify copy
    $targetFiles = Get-ChildItem $targetDir -Recurse -File -ErrorAction SilentlyContinue
    $targetSize = ($targetFiles | Measure-Object -Property Length -Sum).Sum / 1MB

    Write-Log "Target analysis: $($targetFiles.Count) files, $([math]::Round($targetSize, 2)) MB" "INFO"

    if ($sourceFiles.Count -ne $targetFiles.Count) {
        Write-Log "ERROR: File count mismatch! Source: $($sourceFiles.Count), Target: $($targetFiles.Count)" "ERROR"
        return $false
    }

    Write-Log "✅ Verification passed: $($targetFiles.Count) files copied successfully" "INFO"

    # Step 6: Check for technology markers
    $hasPackageJson = Test-Path (Join-Path $targetDir "package.json")
    $hasRequirementsTxt = Test-Path (Join-Path $targetDir "requirements.txt")
    $hasCsproj = (Get-ChildItem $targetDir -Filter "*.csproj" -Recurse -ErrorAction SilentlyContinue).Count -gt 0
    $hasCargoToml = Test-Path (Join-Path $targetDir "Cargo.toml")

    Write-Log "Technology markers:" "INFO"
    if ($hasPackageJson) { Write-Log "  - Node.js (package.json found)" "INFO" }
    if ($hasRequirementsTxt) { Write-Log "  - Python (requirements.txt found)" "INFO" }
    if ($hasCsproj) { Write-Log "  - .NET (*.csproj found)" "INFO" }
    if ($hasCargoToml) { Write-Log "  - Rust (Cargo.toml found)" "INFO" }

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
        CopyDurationSeconds = [math]::Round($duration, 1)
        Technologies = @()
    }

    if ($hasPackageJson) { $manifest.Technologies += "Node.js" }
    if ($hasRequirementsTxt) { $manifest.Technologies += "Python" }
    if ($hasCsproj) { $manifest.Technologies += ".NET" }
    if ($hasCargoToml) { $manifest.Technologies += "Rust" }

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
Write-Log "MEDIUM Priority Systems Migration - Batch 1 (10 systems)" "INFO"
Write-Log "==================================================" "INFO"

$startTime = Get-Date

# Migrate each MEDIUM priority system
$successCount = 0
$failCount = 0
$totalFiles = 0
$totalSizeMB = 0

foreach ($system in $mediumPrioritySystems) {
    $result = Migrate-TerraFusionSystem -System $system
    if ($result) {
        $successCount++
        # Get stats for summary
        $targetDir = Join-Path $targetRoot $system.Target
        $files = Get-ChildItem $targetDir -Recurse -File -ErrorAction SilentlyContinue
        $totalFiles += $files.Count
        $totalSizeMB += ($files | Measure-Object -Property Length -Sum).Sum / 1MB
    }
    else {
        $failCount++
    }
    Write-Host ""  # Blank line between systems
}

$totalDuration = ((Get-Date) - $startTime).TotalMinutes

# Final summary
Write-Log "==================================================" "INFO"
Write-Log "MIGRATION SUMMARY - MEDIUM PRIORITY BATCH 1" "INFO"
Write-Log "Total Systems: $($mediumPrioritySystems.Count)" "INFO"
Write-Log "Successful: $successCount" "INFO"
Write-Log "Failed: $failCount" "INFO"
Write-Log "Total Files Migrated: $totalFiles" "INFO"
Write-Log "Total Size: $([math]::Round($totalSizeMB, 2)) MB ($([math]::Round($totalSizeMB/1024, 2)) GB)" "INFO"
$foundationTotal = ($mediumPrioritySystems | ForEach-Object { $_.FoundationValue } | Measure-Object -Sum).Sum
Write-Log "Foundation Value Added: +$foundationTotal" "INFO"
Write-Log "Total Duration: $([math]::Round($totalDuration, 1)) minutes" "INFO"
Write-Log "Log file: $logFile" "INFO"
Write-Log "==================================================" "INFO"

if ($successCount -eq $mediumPrioritySystems.Count) {
    Write-Host "`n✅✅✅ ALL MEDIUM PRIORITY BATCH 1 SYSTEMS MIGRATED SUCCESSFULLY ✅✅✅" -ForegroundColor Green
    Write-Host "Government. Transcended. Excellence. Achieved." -ForegroundColor Cyan
    Write-Host "Progress: $(7 + $successCount)/63 systems completed" -ForegroundColor Cyan
}
else {
    Write-Host "`n⚠️  MIGRATION COMPLETED WITH ERRORS ⚠️" -ForegroundColor Yellow
}

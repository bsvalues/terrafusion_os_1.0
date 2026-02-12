# TerraFusion MIT PhD Systems Agent - CRITICAL Systems Migration Script
# Evidence-based, systematic migration of top 3 CRITICAL priority systems

$ErrorActionPreference = "Stop"

# Configuration
$sourcePath = "C:\Users\bsval\OneDrive\Desktop\from D"
$targetRoot = "C:\Users\bsval\terrafusion_os_1.0\applications"

# CRITICAL systems to migrate (Priority 1-3)
$criticalSystems = @(
    @{
        Name = "TerraFusionPilt_PRODUCTION"
        Target = "terra-pilt-production"
        FoundationValue = 0.112
    },
    @{
        Name = "TerraFusionPlayground_PRODUCTION"
        Target = "terra-playground-production"
        FoundationValue = 0.112
    },
    @{
        Name = "TerraFusionPermit_PRODUCTION"
        Target = "terra-permit-production"
        FoundationValue = 0.104
    }
)

# Logging
$logFile = "migration-log-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"

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

    if ([math]::Abs($sourceSize - $targetSize) > 0.1) {
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
Write-Log "TerraFusion MIT PhD Systems Agent - Migration Started" "INFO"
Write-Log "Target: CRITICAL Priority Systems (1-3)" "INFO"
Write-Log "==================================================" "INFO"

# Ensure target root exists
if (!(Test-Path $targetRoot)) {
    New-Item -ItemType Directory -Path $targetRoot -Force | Out-Null
    Write-Log "Created applications directory: $targetRoot" "INFO"
}

# Migrate each CRITICAL system
$successCount = 0
$failCount = 0

foreach ($system in $criticalSystems) {
    $result = Migrate-TerraFusionSystem -System $system
    if ($result) {
        $successCount++
    }
    else {
        $failCount++
    }
    Write-Host ""  # Blank line between systems
}

# Final summary
Write-Log "==================================================" "INFO"
Write-Log "MIGRATION SUMMARY" "INFO"
Write-Log "Total Systems: $($criticalSystems.Count)" "INFO"
Write-Log "Successful: $successCount" "INFO"
Write-Log "Failed: $failCount" "INFO"
Write-Log "Log file: $logFile" "INFO"
Write-Log "==================================================" "INFO"

if ($successCount -eq $criticalSystems.Count) {
    Write-Host "`n✅✅✅ ALL CRITICAL SYSTEMS MIGRATED SUCCESSFULLY ✅✅✅" -ForegroundColor Green
}
else {
    Write-Host "`n⚠️  MIGRATION COMPLETED WITH ERRORS ⚠️" -ForegroundColor Yellow
}

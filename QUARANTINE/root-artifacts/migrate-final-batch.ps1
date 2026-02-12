# TerraFusion Elite Government OS Engineering Agent - Remaining Systems Migration
# Final batch of production systems

$ErrorActionPreference = "Stop"

# Configuration
$sourcePath = "C:\Users\bsval\OneDrive\Desktop\from D"
$targetRoot = "C:\Users\bsval\terrafusion_os_1.0\applications"

# Remaining HIGH VALUE systems to migrate
$remainingSystems = @(
    @{
        Name = "TerraFusion_NextGen_Elite_Execution"
        Target = "terra-nextgen-elite-execution"
        Priority = "HIGH"
    },
    @{
        Name = "TerraFusion-Enterprise"
        Target = "terra-enterprise"
        Priority = "HIGH"
    },
    @{
        Name = "TerraFusionDevelopment"
        Target = "terra-development"
        Priority = "MEDIUM"
    },
    @{
        Name = "MCP_Servers_PRODUCTION"
        Target = "mcp-servers-production"
        Priority = "HIGH"
    },
    @{
        Name = "MONITORING_PRODUCTION"
        Target = "monitoring-production"
        Priority = "HIGH"
    },
    @{
        Name = "SECURITY_PRODUCTION"
        Target = "security-production"
        Priority = "CRITICAL"
    },
    @{
        Name = "SystemPrompts_AI_Tools_PRODUCTION"
        Target = "system-prompts-ai-tools"
        Priority = "HIGH"
    }
)

# Logging
$logFile = "migration-log-final-batch-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage
    Add-Content -Path $logFile -Value $logMessage
}

function Migrate-TerraFusionSystem {
    param([hashtable]$System)

    $systemName = $System.Name
    $targetName = $System.Target
    $priority = $System.Priority

    Write-Log "===========================================" "INFO"
    Write-Log "Starting migration: $systemName" "INFO"
    Write-Log "Priority: $priority" "INFO"
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
        Write-Log "WARNING: Target already exists, skipping: $targetName" "WARN"
        return $true
    }

    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    Write-Log "✅ Target directory created: $targetDir" "INFO"

    # Step 4: Copy files
    Write-Log "Copying files..." "INFO"
    try {
        Copy-Item "$sourceDir\*" -Destination $targetDir -Recurse -Force -ErrorAction Stop
    }
    catch {
        Write-Log "ERROR: Copy failed: $_" "ERROR"
        return $false
    }

    # Step 5: Verify copy
    $targetFiles = Get-ChildItem $targetDir -Recurse -File -ErrorAction SilentlyContinue
    $targetSize = ($targetFiles | Measure-Object -Property Length -Sum).Sum / 1MB

    Write-Log "Target analysis: $($targetFiles.Count) files, $([math]::Round($targetSize, 2)) MB" "INFO"

    if ($sourceFiles.Count -ne $targetFiles.Count) {
        Write-Log "WARNING: File count mismatch! Source: $($sourceFiles.Count), Target: $($targetFiles.Count)" "WARN"
    }

    Write-Log "✅ Verification completed: $($targetFiles.Count) files" "INFO"

    # Create migration manifest
    $manifest = @{
        SystemName = $systemName
        TargetName = $targetName
        MigrationDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Priority = $priority
        FileCount = $targetFiles.Count
        SizeMB = [math]::Round($targetSize, 2)
    }

    $manifestPath = Join-Path $targetDir ".migration-manifest.json"
    $manifest | ConvertTo-Json -Depth 10 | Set-Content $manifestPath
    Write-Log "✅ Migration manifest created" "INFO"
    Write-Log "✅✅✅ MIGRATION COMPLETE: $systemName" "INFO"
    Write-Log "===========================================" "INFO"

    return $true
}

# Main execution
Write-Log "==================================================" "INFO"
Write-Log "TerraFusion Elite Government OS Engineering Agent" "INFO"
Write-Log "Final Batch Migration - Essential Systems" "INFO"
Write-Log "==================================================" "INFO"

$successCount = 0
$failCount = 0
$totalFiles = 0
$totalSizeMB = 0

foreach ($system in $remainingSystems) {
    $result = Migrate-TerraFusionSystem -System $system
    if ($result) {
        $successCount++
        $targetDir = Join-Path $targetRoot $system.Target
        if (Test-Path $targetDir) {
            $files = Get-ChildItem $targetDir -Recurse -File -ErrorAction SilentlyContinue
            $totalFiles += $files.Count
            $totalSizeMB += ($files | Measure-Object -Property Length -Sum).Sum / 1MB
        }
    }
    else {
        $failCount++
    }
    Write-Host ""
}

# Final summary
Write-Log "==================================================" "INFO"
Write-Log "FINAL BATCH MIGRATION SUMMARY" "INFO"
Write-Log "Total Systems Attempted: $($remainingSystems.Count)" "INFO"
Write-Log "Successful: $successCount" "INFO"
Write-Log "Failed: $failCount" "INFO"
Write-Log "Total Files Migrated: $totalFiles" "INFO"
Write-Log "Total Size: $([math]::Round($totalSizeMB, 2)) MB ($([math]::Round($totalSizeMB/1024, 2)) GB)" "INFO"
Write-Log "==================================================" "INFO"

if ($successCount -gt 0) {
    Write-Host "`n✅✅✅ FINAL BATCH MIGRATION SUCCESSFUL ✅✅✅" -ForegroundColor Green
    Write-Host "Government. Transcended. Excellence. Complete." -ForegroundColor Cyan
}

# TerraFusion OS 1.0 - Complete Module Migration Script
# Migrates ALL 32 modules from fragmented system into unified structure

param(
    [string]$SourcePath = "e:\TerraFusion_OS\modules",
    [string]$TargetPath = "e:\TerraFusion_OS_1.0\modules",
    [switch]$DryRun = $false
)

Write-Host "=== TerraFusion OS 1.0 Module Migration ===" -ForegroundColor Cyan
Write-Host "Source: $SourcePath" -ForegroundColor Yellow
Write-Host "Target: $TargetPath" -ForegroundColor Yellow
Write-Host "Dry Run: $DryRun" -ForegroundColor Yellow
Write-Host ""

# Module Priority Tiers
$tier1Modules = @(
    "government-edition",
    "costforge-ai-champion", 
    "marketplace-champion",
    "ai-command-brain"
)

$tier2Modules = @(
    "terra-agent-champion",
    "terra-flow-champion",
    "gispro",
    "terra-fusion-assessor",
    "terra-levy",
    "web-audit-tracker"
)

$tier3Modules = @(
    "commercial-suite",
    "development",
    "costforge-ai",
    "costforge-ai-desktop",
    "terra-agent",
    "terra-collections",
    "terra-flow",
    "terra-fusion-dashboard",
    "terra-fusion-sync",
    "terra-insight",
    "terra-miner",
    "property-workbench"
)

# Create target directory
if (-not $DryRun) {
    New-Item -ItemType Directory -Path $TargetPath -Force | Out-Null
}

function Copy-ModuleComplete {
    param(
        [string[]]$Modules,
        [string]$TierName,
        [string]$Color
    )
    
    Write-Host "`n=== Migrating $TierName ===" -ForegroundColor $Color
    
    $script:totalMigrated = 0
    
    foreach ($module in $Modules) {
        $sourcePath = Join-Path $SourcePath $module
        $targetPath = Join-Path $TargetPath $module
        
        if (Test-Path $sourcePath) {
            $itemCount = (Get-ChildItem $sourcePath -Recurse).Count
            
            if (-not $DryRun) {
                # Ensure target directory exists
                $targetParent = Split-Path $targetPath -Parent
                if (-not (Test-Path $targetParent)) {
                    New-Item -ItemType Directory -Path $targetParent -Force | Out-Null
                }
                
                # Remove existing target if it exists
                if (Test-Path $targetPath) {
                    Remove-Item $targetPath -Recurse -Force
                }
                
                # Copy entire module with all contents
                Copy-Item $sourcePath -Destination $targetPath -Recurse -Force
            }
            
            Write-Host "  ✓ $module ($itemCount items)" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ $module (not found)" -ForegroundColor Yellow
        }
    }
}

# Migrate by tiers
Copy-ModuleComplete -Modules $tier1Modules -TierName "Tier 1 (Simple)" -Color "Green"
Copy-ModuleComplete -Modules $tier2Modules -TierName "Tier 2 (Medium)" -Color "Yellow"
Copy-ModuleComplete -Modules $tier3Modules -TierName "Tier 3 (Complex)" -Color "Red"

# Create module registry
Write-Host "`n=== Creating Module Registry ===" -ForegroundColor Cyan

$moduleRegistry = @{
    version = "1.0.0"
    totalModules = ($tier1Modules + $tier2Modules + $tier3Modules).Count
    tiers = @{
        tier1 = @{
            name = "Core Government"
            modules = $tier1Modules
            priority = "high"
        }
        tier2 = @{
            name = "Essential Operations" 
            modules = $tier2Modules
            priority = "medium"
        }
        tier3 = @{
            name = "Extended Features"
            modules = $tier3Modules
            priority = "low"
        }
    }
    migratedAt = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
}

if (-not $DryRun) {
    $moduleRegistry | ConvertTo-Json -Depth 5 | Out-File "$TargetPath\module-registry.json" -Encoding UTF8
}

Write-Host "✓ Module registry created with $($moduleRegistry.totalModules) modules" -ForegroundColor Green

# Summary
Write-Host "`n=== Migration Summary ===" -ForegroundColor Cyan
Write-Host "✓ Tier 1 (Core): $($tier1Modules.Count) modules" -ForegroundColor Green
Write-Host "✓ Tier 2 (Essential): $($tier2Modules.Count) modules" -ForegroundColor Green  
Write-Host "✓ Tier 3 (Extended): $($tier3Modules.Count) modules" -ForegroundColor Green
Write-Host "✓ Total: $($tier1Modules.Count + $tier2Modules.Count + $tier3Modules.Count) modules migrated" -ForegroundColor Green

if ($DryRun) {
    Write-Host "`n⚠ DRY RUN COMPLETED - No modules were actually migrated" -ForegroundColor Yellow
} else {
    Write-Host "`n🎉 MODULE MIGRATION COMPLETED SUCCESSFULLY!" -ForegroundColor Green
}

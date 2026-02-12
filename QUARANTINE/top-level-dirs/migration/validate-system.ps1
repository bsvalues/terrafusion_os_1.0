# TerraFusion OS 1.0 - System Validation Script
# Validates the complete migration and system readiness

param(
    [string]$TargetPath = "e:\TerraFusion_OS_1.0",
    [switch]$Verbose = $false
)

Write-Host "=== TerraFusion OS 1.0 System Validation ===" -ForegroundColor Cyan
Write-Host "Target: $TargetPath" -ForegroundColor Yellow
Write-Host ""

$validationResults = @()

function Test-Component {
    param(
        [string]$Name,
        [string]$Path,
        [string]$Type = "Directory"
    )
    
    $exists = if ($Type -eq "File") { Test-Path $Path -PathType Leaf } else { Test-Path $Path -PathType Container }
    $status = if ($exists) { "✓" } else { "✗" }
    $color = if ($exists) { "Green" } else { "Red" }
    
    Write-Host "  $status $Name" -ForegroundColor $color
    
    if ($Verbose -and $exists -and $Type -eq "Directory") {
        $itemCount = (Get-ChildItem $Path -Recurse -ErrorAction SilentlyContinue).Count
        Write-Host "    ($itemCount items)" -ForegroundColor Gray
    }
    
    return @{
        Name = $Name
        Path = $Path
        Exists = $exists
        Type = $Type
    }
}

# Backend Validation
Write-Host "=== Backend (.NET 8.0) Validation ===" -ForegroundColor Cyan
$validationResults += Test-Component "TerraFusion.sln" "$TargetPath\backend\TerraFusion.sln" "File"
$validationResults += Test-Component "TerraFusion.API" "$TargetPath\backend\TerraFusion.API"
$validationResults += Test-Component "TerraFusion.Core" "$TargetPath\backend\TerraFusion.Core"
$validationResults += Test-Component "TerraFusion.Data" "$TargetPath\backend\TerraFusion.Data"
$validationResults += Test-Component "TerraFusion.AI" "$TargetPath\backend\TerraFusion.AI"
$validationResults += Test-Component "Program.cs" "$TargetPath\backend\TerraFusion.API\Program.cs" "File"
$validationResults += Test-Component "TerraFusionContext.cs" "$TargetPath\backend\TerraFusion.Data\TerraFusionContext.cs" "File"

# Frontend Validation
Write-Host "`n=== Frontend (React 18 PWA) Validation ===" -ForegroundColor Cyan
$validationResults += Test-Component "package.json" "$TargetPath\frontend\package.json" "File"
$validationResults += Test-Component "vite.config.ts" "$TargetPath\frontend\vite.config.ts" "File"
$validationResults += Test-Component "src directory" "$TargetPath\frontend\src"
$validationResults += Test-Component "DesktopShell.tsx" "$TargetPath\frontend\src\shell\DesktopShell.tsx" "File"
$validationResults += Test-Component "ModuleLauncher.tsx" "$TargetPath\frontend\src\shell\ModuleLauncher.tsx" "File"
$validationResults += Test-Component "App.tsx" "$TargetPath\frontend\src\App.tsx" "File"

# Electron Shell Validation
Write-Host "`n=== Electron Desktop Shell Validation ===" -ForegroundColor Cyan
$validationResults += Test-Component "electron directory" "$TargetPath\frontend\electron"
$validationResults += Test-Component "main.js" "$TargetPath\frontend\electron\main.js" "File"
$validationResults += Test-Component "preload.js" "$TargetPath\frontend\electron\preload.js" "File"
$validationResults += Test-Component "electron package.json" "$TargetPath\frontend\electron\package.json" "File"

# Data Structure Validation
Write-Host "`n=== Data Structure Validation ===" -ForegroundColor Cyan
$validationResults += Test-Component "data directory" "$TargetPath\data"
$validationResults += Test-Component "counties directory" "$TargetPath\data\counties"
$validationResults += Test-Component "ai-models directory" "$TargetPath\data\ai-models"
$validationResults += Test-Component "cost-matrices directory" "$TargetPath\data\cost-matrices"
$validationResults += Test-Component "databases directory" "$TargetPath\data\databases"
$validationResults += Test-Component "intelligence directory" "$TargetPath\data\intelligence"

# Module Structure Validation
Write-Host "`n=== Module Structure Validation ===" -ForegroundColor Cyan
$validationResults += Test-Component "modules directory" "$TargetPath\modules"

if (Test-Path "$TargetPath\modules") {
    $moduleCount = (Get-ChildItem "$TargetPath\modules" -Directory -ErrorAction SilentlyContinue).Count
    Write-Host "  ✓ Found $moduleCount modules" -ForegroundColor Green
    
    # Check for key modules
    $keyModules = @(
        "government-edition",
        "costforge-ai-champion", 
        "marketplace-champion",
        "ai-command-brain"
    )
    
    foreach ($module in $keyModules) {
        $validationResults += Test-Component $module "$TargetPath\modules\$module"
    }
}

# Migration Scripts Validation
Write-Host "`n=== Migration Scripts Validation ===" -ForegroundColor Cyan
$validationResults += Test-Component "migration directory" "$TargetPath\migration"
$validationResults += Test-Component "consolidate-data.ps1" "$TargetPath\migration\consolidate-data.ps1" "File"
$validationResults += Test-Component "migrate-modules.ps1" "$TargetPath\migration\migrate-modules.ps1" "File"

# Deployment Scripts Validation
Write-Host "`n=== Deployment Scripts Validation ===" -ForegroundColor Cyan
$validationResults += Test-Component "deployment directory" "$TargetPath\deployment"
$validationResults += Test-Component "build-windows.ps1" "$TargetPath\deployment\build-windows.ps1" "File"
$validationResults += Test-Component "docker-compose.dev.yml" "$TargetPath\docker-compose.dev.yml" "File"

# Documentation Validation
Write-Host "`n=== Documentation Validation ===" -ForegroundColor Cyan
$validationResults += Test-Component "README.md" "$TargetPath\README.md" "File"
$validationResults += Test-Component "docs directory" "$TargetPath\docs"
$validationResults += Test-Component "GETTING_STARTED.md" "$TargetPath\docs\GETTING_STARTED.md" "File"

# Configuration Files Validation
Write-Host "`n=== Configuration Files Validation ===" -ForegroundColor Cyan
$validationResults += Test-Component "package.json" "$TargetPath\package.json" "File"
$validationResults += Test-Component ".gitignore" "$TargetPath\.gitignore" "File"

# Generate Summary Report
Write-Host "`n=== Validation Summary ===" -ForegroundColor Cyan

$totalComponents = $validationResults.Count
$validComponents = ($validationResults | Where-Object { $_.Exists }).Count
$invalidComponents = $totalComponents - $validComponents
$validationPercentage = [math]::Round(($validComponents / $totalComponents) * 100, 1)

Write-Host "Total Components: $totalComponents" -ForegroundColor White
Write-Host "Valid Components: $validComponents" -ForegroundColor Green
Write-Host "Invalid Components: $invalidComponents" -ForegroundColor Red
Write-Host "Validation Score: $validationPercentage%" -ForegroundColor $(if ($validationPercentage -ge 90) { "Green" } elseif ($validationPercentage -ge 75) { "Yellow" } else { "Red" })

# Check for critical components
$criticalComponents = @(
    "TerraFusion.sln",
    "Program.cs", 
    "DesktopShell.tsx",
    "main.js",
    "package.json",
    "README.md"
)

$missingCritical = $validationResults | Where-Object { 
    $criticalComponents -contains $_.Name -and -not $_.Exists 
}

if ($missingCritical.Count -gt 0) {
    Write-Host "`n⚠ CRITICAL COMPONENTS MISSING:" -ForegroundColor Red
    foreach ($component in $missingCritical) {
        Write-Host "  ✗ $($component.Name)" -ForegroundColor Red
    }
} else {
    Write-Host "`n✓ All critical components present" -ForegroundColor Green
}

# System Readiness Assessment
Write-Host "`n=== System Readiness Assessment ===" -ForegroundColor Cyan

if ($validationPercentage -ge 95) {
    Write-Host "🎉 SYSTEM READY FOR PRODUCTION" -ForegroundColor Green
    Write-Host "All components validated successfully. Ready to run migration and start development." -ForegroundColor Green
} elseif ($validationPercentage -ge 85) {
    Write-Host "⚠ SYSTEM MOSTLY READY" -ForegroundColor Yellow
    Write-Host "Minor components missing. System should work but may have limited functionality." -ForegroundColor Yellow
} elseif ($validationPercentage -ge 70) {
    Write-Host "⚠ SYSTEM PARTIALLY READY" -ForegroundColor Yellow
    Write-Host "Some important components missing. Review and complete setup before proceeding." -ForegroundColor Yellow
} else {
    Write-Host "❌ SYSTEM NOT READY" -ForegroundColor Red
    Write-Host "Major components missing. Complete workspace setup before proceeding." -ForegroundColor Red
}

# Next Steps
Write-Host "`n=== Recommended Next Steps ===" -ForegroundColor Cyan

if ($validationPercentage -ge 90) {
    Write-Host "1. Run data migration: npm run migrate:data" -ForegroundColor Green
    Write-Host "2. Run module migration: npm run migrate:modules" -ForegroundColor Green
    Write-Host "3. Start development: npm run dev" -ForegroundColor Green
    Write-Host "4. Test desktop shell: npm run electron" -ForegroundColor Green
} else {
    Write-Host "1. Review missing components above" -ForegroundColor Yellow
    Write-Host "2. Complete workspace setup" -ForegroundColor Yellow
    Write-Host "3. Re-run validation: .\migration\validate-system.ps1" -ForegroundColor Yellow
    Write-Host "4. Proceed with migration once validation passes" -ForegroundColor Yellow
}

Write-Host "`n🏁 VALIDATION COMPLETED" -ForegroundColor Cyan

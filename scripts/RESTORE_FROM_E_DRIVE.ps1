#!/usr/bin/env pwsh
# TERRAFUSION OS RESTORATION FROM E: DRIVE BACKUP
# This will restore the working system from the clean backup

Write-Host @"
╔══════════════════════════════════════════════════════════════════╗
║           TERRAFUSION OS - E: DRIVE RESTORATION                  ║
║                   FIXING THE DAMAGE                               ║
╚══════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

$ErrorActionPreference = "Continue"
$SourcePath = "E:\TerraFusion_OS_1.0"
$TargetPath = "."

# Check if E: drive backup exists
if (-not (Test-Path $SourcePath)) {
    Write-Host "❌ E: drive backup not found at $SourcePath" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ E: drive backup found!" -ForegroundColor Green

# 1. RESTORE BACKEND SERVICES
Write-Host "`n[1/5] RESTORING BACKEND SERVICES..." -ForegroundColor Yellow
if (Test-Path "$SourcePath\backend\TerraFusion.Core\Services") {
    Copy-Item "$SourcePath\backend\TerraFusion.Core\Services\*" -Destination "backend\TerraFusion.Core\Services\" -Recurse -Force
    Write-Host "  ✓ Backend services restored" -ForegroundColor Green
}

# 2. RESTORE API CONTROLLERS
Write-Host "`n[2/5] RESTORING API CONTROLLERS..." -ForegroundColor Yellow
if (Test-Path "$SourcePath\backend\TerraFusion.API\Controllers") {
    Copy-Item "$SourcePath\backend\TerraFusion.API\Controllers\*" -Destination "backend\TerraFusion.API\Controllers\" -Recurse -Force
    Write-Host "  ✓ API controllers restored" -ForegroundColor Green
}

# 3. RESTORE FRONTEND COMPONENTS
Write-Host "`n[3/5] RESTORING FRONTEND COMPONENTS..." -ForegroundColor Yellow
if (Test-Path "$SourcePath\frontend\src\components") {
    Copy-Item "$SourcePath\frontend\src\components\*" -Destination "frontend\src\components\" -Recurse -Force
    Write-Host "  ✓ Frontend components restored" -ForegroundColor Green
}

# 4. RESTORE MODULE SYSTEM
Write-Host "`n[4/5] RESTORING MODULE SYSTEM..." -ForegroundColor Yellow
if (Test-Path "$SourcePath\modules") {
    # Only restore missing or damaged modules
    $modules = Get-ChildItem "$SourcePath\modules" -Directory
    foreach ($module in $modules) {
        $targetModule = Join-Path "modules" $module.Name
        if (-not (Test-Path $targetModule) -or (Get-ChildItem $targetModule -Recurse).Count -lt 10) {
            Copy-Item $module.FullName -Destination "modules\" -Recurse -Force
            Write-Host "  ✓ Restored module: $($module.Name)" -ForegroundColor Green
        }
    }
}

# 5. RESTORE PACKAGE FILES
Write-Host "`n[5/5] RESTORING PACKAGE CONFIGURATIONS..." -ForegroundColor Yellow
Copy-Item "$SourcePath\package.json" -Destination "package.json" -Force
Copy-Item "$SourcePath\backend\TerraFusion.API\TerraFusion.API.csproj" -Destination "backend\TerraFusion.API\" -Force -ErrorAction SilentlyContinue
Copy-Item "$SourcePath\backend\TerraFusion.Core\TerraFusion.Core.csproj" -Destination "backend\TerraFusion.Core\" -Force -ErrorAction SilentlyContinue
Write-Host "  ✓ Package configurations restored" -ForegroundColor Green

Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "RESTORATION COMPLETE!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "`nNEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Run: npm install" -ForegroundColor White
Write-Host "2. Run: cd backend && dotnet restore" -ForegroundColor White
Write-Host "3. Run: cd backend && dotnet build" -ForegroundColor White
Write-Host "4. Run: npm run dev" -ForegroundColor White




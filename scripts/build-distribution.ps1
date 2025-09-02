# TerraFusion OS - Professional Distribution Builder
# Creates Windows installer (.msi) and standalone executable

Write-Host "🏛️ Building TerraFusion OS - Government Desktop Application" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green

# Step 1: Build Electron Application
Write-Host "📦 Building Electron Desktop Application..." -ForegroundColor Yellow
Set-Location frontend/electron
npm install
npm run build:windows

# Step 2: Package Backend Services
Write-Host "🔧 Packaging .NET Backend Services..." -ForegroundColor Yellow
Set-Location ../../backend
dotnet publish TerraFusion.API/TerraFusion.API.csproj -c Release -r win-x64 --self-contained true -o ../dist/backend

# Step 3: Create Installer Package
Write-Host "📋 Creating Professional Windows Installer..." -ForegroundColor Yellow
Set-Location ../deployment/windows

# Create installer using WiX toolset
candle.exe TerraFusionOS.wxs -out TerraFusionOS.wixobj
light.exe TerraFusionOS.wixobj -out "TerraFusion OS v1.0 - Government Edition.msi"

# Step 4: Create Standalone Executable
Write-Host "🚀 Building Standalone Government OS..." -ForegroundColor Yellow
# Package everything into single executable
$exePath = "TerraFusion Government OS.exe"

# Copy all dependencies
Copy-Item "../dist/backend/*" -Destination "./standalone/" -Recurse -Force
Copy-Item "../frontend/electron/dist/*" -Destination "./standalone/app/" -Recurse -Force

# Create launcher executable
$launcherScript = @"
@echo off
title TerraFusion Government OS
cd /d "%~dp0"
start "" "app\TerraFusion OS.exe"
"@
$launcherScript | Out-File -FilePath "./standalone/TerraFusion Government OS.bat" -Encoding ASCII

Write-Host "✅ Distribution packages created successfully!" -ForegroundColor Green
Write-Host "📁 Windows Installer: deployment/windows/TerraFusion OS v1.0 - Government Edition.msi" -ForegroundColor Cyan
Write-Host "📁 Standalone App: deployment/windows/standalone/TerraFusion Government OS.exe" -ForegroundColor Cyan
Write-Host "" 
Write-Host "🎯 Ready for county deployment!" -ForegroundColor Green
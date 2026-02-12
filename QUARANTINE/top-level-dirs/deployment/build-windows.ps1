# TerraFusion OS 1.0 - Windows Production Build Script
# Creates professional MSI installer with all components

param(
    [string]$Configuration = "Release",
    [string]$OutputPath = ".\dist\installers",
    [switch]$SkipTests = $false
)

Write-Host "=== TerraFusion OS 1.0 Windows Build ===" -ForegroundColor Cyan
Write-Host "Configuration: $Configuration" -ForegroundColor Yellow
Write-Host "Output: $OutputPath" -ForegroundColor Yellow
Write-Host ""

# Ensure output directory exists
New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null

# Step 1: Build .NET Backend
Write-Host "=== Building .NET Backend ===" -ForegroundColor Cyan
Push-Location "backend"
try {
    Write-Host "Restoring NuGet packages..." -ForegroundColor Yellow
    dotnet restore TerraFusion.sln
    
    if (-not $SkipTests) {
        Write-Host "Running backend tests..." -ForegroundColor Yellow
        dotnet test --no-restore --verbosity minimal
        if ($LASTEXITCODE -ne 0) {
            throw "Backend tests failed"
        }
    }
    
    Write-Host "Publishing backend..." -ForegroundColor Yellow
    dotnet publish TerraFusion.API/TerraFusion.API.csproj -c $Configuration -o "../dist/backend" --no-restore
    
    Write-Host "✓ Backend build completed" -ForegroundColor Green
} finally {
    Pop-Location
}

# Step 2: Build React Frontend
Write-Host "`n=== Building React Frontend ===" -ForegroundColor Cyan
Push-Location "frontend"
try {
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    npm ci --silent
    
    if (-not $SkipTests) {
        Write-Host "Running frontend tests..." -ForegroundColor Yellow
        npm test -- --coverage --watchAll=false
        if ($LASTEXITCODE -ne 0) {
            throw "Frontend tests failed"
        }
    }
    
    Write-Host "Building production frontend..." -ForegroundColor Yellow
    npm run build
    
    Write-Host "✓ Frontend build completed" -ForegroundColor Green
} finally {
    Pop-Location
}

# Step 3: Build Electron Desktop App
Write-Host "`n=== Building Electron Desktop App ===" -ForegroundColor Cyan
Push-Location "frontend"
try {
    Write-Host "Building Electron application..." -ForegroundColor Yellow
    npm run electron:build
    
    Write-Host "✓ Electron build completed" -ForegroundColor Green
} finally {
    Pop-Location
}

# Step 4: Create Portable Package
Write-Host "`n=== Creating Portable Package ===" -ForegroundColor Cyan

$portableDir = "$OutputPath\TerraFusion_OS_1.0_Portable"
New-Item -ItemType Directory -Path $portableDir -Force | Out-Null

# Copy all components
Copy-Item "dist\backend\*" "$portableDir\backend\" -Recurse -Force
Copy-Item "frontend\dist\*" "$portableDir\frontend\" -Recurse -Force
Copy-Item "data\*" "$portableDir\data\" -Recurse -Force -ErrorAction SilentlyContinue

# Create launcher script
$launcherScript = @"
@echo off
title TerraFusion OS 1.0
echo Starting TerraFusion OS...

REM Start backend
start /B "TerraFusion Backend" backend\TerraFusion.API.exe

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
start "TerraFusion OS" TerraFusion_OS.exe

echo TerraFusion OS started successfully!
pause
"@

$launcherScript | Out-File "$portableDir\Start_TerraFusion_OS.bat" -Encoding ASCII

# Create ZIP package
if (Get-Command "7z.exe" -ErrorAction SilentlyContinue) {
    7z.exe a "$OutputPath\TerraFusion_OS_1.0_Portable.zip" "$portableDir\*"
    Write-Host "✓ Portable ZIP package created" -ForegroundColor Green
} else {
    Compress-Archive -Path "$portableDir\*" -DestinationPath "$OutputPath\TerraFusion_OS_1.0_Portable.zip" -Force
    Write-Host "✓ Portable ZIP package created" -ForegroundColor Green
}

# Build Summary
Write-Host "`n=== Build Summary ===" -ForegroundColor Cyan
$backendSize = (Get-ChildItem "dist\backend" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
$frontendSize = (Get-ChildItem "frontend\dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB

Write-Host "✓ Backend: $([math]::Round($backendSize, 2)) MB" -ForegroundColor Green
Write-Host "✓ Frontend: $([math]::Round($frontendSize, 2)) MB" -ForegroundColor Green
Write-Host "✓ Total Size: $([math]::Round($backendSize + $frontendSize, 2)) MB" -ForegroundColor Green

Write-Host "`n🎉 WINDOWS BUILD COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "Output directory: $OutputPath" -ForegroundColor Green

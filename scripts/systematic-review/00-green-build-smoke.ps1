# TerraFusion OS - Pass 0: Green Build Smoke Test
# Exit immediately on any error
$ErrorActionPreference = "Stop"

Write-Host "================================" -ForegroundColor Green
Write-Host "PASS 0: GREEN BUILD SMOKE TEST" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Check Node version
Write-Host "`n[1/6] Checking Node version..." -ForegroundColor Yellow
$nodeVersion = node --version
$nodeVersionNum = [int]($nodeVersion -replace "v(\d+)\..*", '$1')
if ($nodeVersionNum -lt 18 -or $nodeVersionNum -gt 24) {
    Write-Host "ERROR: Node 18.x - 24.x required, found $nodeVersion" -ForegroundColor Red
    Write-Host "Current version is acceptable for Node 24, but may have compatibility issues" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] Node version: $nodeVersion (Acceptable)" -ForegroundColor Green

# Check .NET SDK
Write-Host "`n[2/6] Checking .NET SDK..." -ForegroundColor Yellow
$dotnetVersion = dotnet --version
$dotnetMajorVersion = [int]($dotnetVersion -split '\.' | Select-Object -First 1)
if ($dotnetMajorVersion -lt 8) {
    Write-Host "ERROR: .NET 8.0+ SDK required, found $dotnetVersion" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] .NET SDK: $dotnetVersion (Acceptable)" -ForegroundColor Green
if ($dotnetMajorVersion -eq 9) {
    Write-Host "Note: Using .NET 9.0 - may need to update target framework in projects" -ForegroundColor Yellow
}

# Backend clean & restore
Write-Host "`n[3/6] Backend clean and restore..." -ForegroundColor Yellow
Set-Location $PSScriptRoot\..\..\backend
dotnet clean --nologo -v q
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Backend clean failed" -ForegroundColor Red
    exit 1
}
dotnet restore --nologo
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Backend restore failed" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Backend cleaned and restored" -ForegroundColor Green

# Backend build
Write-Host "`n[4/6] Backend build..." -ForegroundColor Yellow
dotnet build -c Debug --no-restore --nologo -v m /bl:../artifacts/backend.binlog
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Backend build failed" -ForegroundColor Red
    Write-Host "Check artifacts/backend.binlog for details" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] Backend built successfully" -ForegroundColor Green

# Frontend install
Write-Host "`n[5/6] Frontend dependencies..." -ForegroundColor Yellow
Set-Location $PSScriptRoot\..\..
if (Test-Path "package-lock.json") {
    npm ci --silent
} else {
    npm install --silent
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Frontend install failed" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Frontend dependencies installed" -ForegroundColor Green

# Frontend build
Write-Host "`n[6/6] Frontend build..." -ForegroundColor Yellow
npm run build --silent
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Frontend build failed" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Frontend built successfully" -ForegroundColor Green

# Summary
Write-Host "`n================================" -ForegroundColor Green
Write-Host "[OK] PASS 0 COMPLETE - BUILD GREEN!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. Run: .\scripts\systematic-review\01-backend-review.ps1" -ForegroundColor White
Write-Host "  2. Run: .\scripts\systematic-review\02-frontend-review.ps1" -ForegroundColor White
Write-Host "  3. Run: .\scripts\systematic-review\03-modules-review.ps1" -ForegroundColor White

exit 0

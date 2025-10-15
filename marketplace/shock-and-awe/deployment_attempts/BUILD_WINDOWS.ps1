# TerraFusion Championship Build Script for Windows PowerShell
# No OpenSSL issues, no webkit issues - just works!

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TerraFusion County OS - Windows Build" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set location to script directory
Set-Location $PSScriptRoot

# Check for Rust
if (-not (Get-Command rustc -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Rust is not installed!" -ForegroundColor Red
    Write-Host "Please install from: https://rustup.rs/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check for Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install from: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[1/4] Installing Node dependencies..." -ForegroundColor Green
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm install failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "[2/4] Building frontend..." -ForegroundColor Green
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Frontend build failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "[3/4] Building Tauri app..." -ForegroundColor Green
Set-Location src-tauri
cargo build --release
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Rust build failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "[4/4] Build complete!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SUCCESS! Your executable is ready:" -ForegroundColor Green
Write-Host "  src-tauri\target\release\terrafusion-county-os.exe" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Run it with: .\src-tauri\target\release\terrafusion-county-os.exe" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"
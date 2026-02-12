#!/usr/bin/env pwsh

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TerraFusion Complete Application Launcher" -ForegroundColor Cyan
Write-Host "Rust Backend + Next.js Frontend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check Rust installation
Write-Host "`n🔍 Checking Rust installation..." -ForegroundColor Yellow
if (Test-Command "cargo") {
    $rustVersion = cargo --version
    Write-Host "✅ Rust found: $rustVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Rust not found!" -ForegroundColor Red
    Write-Host "Please install Rust from: https://rustup.rs/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check Node.js installation
Write-Host "`n🔍 Checking Node.js installation..." -ForegroundColor Yellow
$nodeFound = $false
$npmFound = $false

if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
    $nodeFound = $true
} else {
    Write-Host "❌ Node.js not found!" -ForegroundColor Red
}

if (Test-Command "npm") {
    $npmVersion = npm --version
    Write-Host "✅ npm found: $npmVersion" -ForegroundColor Green
    $npmFound = $true
} else {
    Write-Host "❌ npm not found!" -ForegroundColor Red
}

# Set working directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "`n🚀 PHASE 1: Building Rust Backend..." -ForegroundColor Cyan
Set-Location "backend"

Write-Host "Building with cargo..." -ForegroundColor Yellow
$buildResult = cargo build --release 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Rust backend build successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Rust backend build failed!" -ForegroundColor Red
    Write-Host $buildResult -ForegroundColor Red
    Read-Host "Press Enter to continue anyway"
}

# Start Rust backend in background
Write-Host "`n🔄 Starting Rust backend on port 8080..." -ForegroundColor Yellow
Start-Process -FilePath "cargo" -ArgumentList "run", "--release" -NoNewWindow

Write-Host "✅ Rust backend started!" -ForegroundColor Green
Write-Host "🌐 Backend API: http://localhost:8080" -ForegroundColor Cyan

# Handle frontend
Set-Location "../frontend"

Write-Host "`n🚀 PHASE 2: Frontend Setup..." -ForegroundColor Cyan

if ($nodeFound -and $npmFound) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependencies installed!" -ForegroundColor Green
        Write-Host "`n🔄 Starting Next.js frontend on port 3000..." -ForegroundColor Yellow
        Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow
        Write-Host "✅ Frontend started!" -ForegroundColor Green
        Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Frontend dependency installation failed!" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Node.js/npm not available. Frontend cannot start." -ForegroundColor Red
    Write-Host "Install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "Backend will still work on: http://localhost:8080" -ForegroundColor Cyan
}

Write-Host "`n🎉 TerraFusion Launch Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Rust Backend:  http://localhost:8080" -ForegroundColor White
if ($nodeFound -and $npmFound) {
    Write-Host "Next.js Frontend: http://localhost:3000" -ForegroundColor White
}
Write-Host "========================================" -ForegroundColor Cyan

# Open browsers
Write-Host "`n🌐 Opening applications in browser..." -ForegroundColor Yellow
Start-Process "http://localhost:8080"
if ($nodeFound -and $npmFound) {
    Start-Sleep 3
    Start-Process "http://localhost:3000"
}

Write-Host "`nPress Ctrl+C to stop all services" -ForegroundColor Yellow
Read-Host "Press Enter to exit" 
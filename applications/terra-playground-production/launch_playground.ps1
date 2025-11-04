#!/usr/bin/env pwsh

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TerraFusion Playground Launcher" -ForegroundColor Cyan
Write-Host "Enterprise Application Hub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check Python installation
Write-Host "`n🔍 Checking Python installation..." -ForegroundColor Yellow
if (Test-Command "python") {
    $pythonVersion = python --version
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Python not found!" -ForegroundColor Red
    Write-Host "Please install Python from: https://python.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Set working directory to the script location
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "`n🔍 Checking required files..." -ForegroundColor Yellow

# Check if start_playground.py exists
if (Test-Path "start_playground.py") {
    Write-Host "✅ start_playground.py found" -ForegroundColor Green
} else {
    Write-Host "❌ start_playground.py not found!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if index.html exists
if (Test-Path "index.html") {
    Write-Host "✅ index.html found" -ForegroundColor Green
} else {
    Write-Host "❌ index.html not found!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "`n🚀 Installing Python dependencies..." -ForegroundColor Cyan
try {
    python -m pip install flask flask-cors --quiet
    Write-Host "✅ Dependencies installed!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Dependency installation may have issues, continuing..." -ForegroundColor Yellow
}

Write-Host "`n🔄 Starting TerraFusion Playground..." -ForegroundColor Cyan
Write-Host "🌐 Hub URL: http://localhost:3000" -ForegroundColor White
Write-Host "🎯 Purpose: Enterprise application launcher and manager" -ForegroundColor White
Write-Host "`nStarting playground (browser will open automatically)..." -ForegroundColor Yellow

# Start the playground
python start_playground.py 
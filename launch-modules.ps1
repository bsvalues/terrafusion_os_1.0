#!/usr/bin/env pwsh
# TerraFusion OS Module Launcher
# Starts the module manager and launches all modules

Write-Host "🚀 TerraFusion OS Module Launcher Starting..." -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Blue

# Set environment variables
$env:TF_MODULE_API_PORT = "5046"
$env:TF_AUTO_START_MODULES = "true"
$env:NODE_ENV = "production"

# Check if Node.js is available
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Navigate to module manager directory
$moduleManagerPath = Join-Path $PSScriptRoot "backend\services"
if (-not (Test-Path $moduleManagerPath)) {
    Write-Host "❌ Module manager not found at: $moduleManagerPath" -ForegroundColor Red
    exit 1
}

Set-Location $moduleManagerPath

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

Write-Host "🔧 Starting TerraFusion Module Manager..." -ForegroundColor Green
Write-Host "📊 API will be available at: http://localhost:5046" -ForegroundColor Cyan
Write-Host "🏥 Health check: http://localhost:5046/health" -ForegroundColor Cyan
Write-Host "📦 Modules API: http://localhost:5046/api/modules" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Blue

# Start the module manager
node module-manager-api.js
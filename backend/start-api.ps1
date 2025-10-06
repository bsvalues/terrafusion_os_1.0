#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Start TerraFusion Component Generator API with proper port management
.DESCRIPTION
    Checks for existing API server, kills it cleanly, and starts a fresh instance.
    Uses PORT environment variable or defaults to 5000.
#>

param(
    [int]$Port = $env:PORT ?? 5000,
    [switch]$Simple
)

$ApiFile = if ($Simple) { "component-generator-simple.py" } else { "component-generator-api.py" }

Write-Host "🔍 Checking for existing API on port $Port..." -ForegroundColor Cyan

# Find process listening on target port
$listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($listener) {
    Write-Host "⚠️  Port $Port is in use by PID $($listener.OwningProcess)" -ForegroundColor Yellow
    Write-Host "🛑 Stopping existing server..." -ForegroundColor Red
    Stop-Process -Id $listener.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "✅ Old server stopped" -ForegroundColor Green
}

# Verify port is free
$stillUsed = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($stillUsed) {
    Write-Host "❌ ERROR: Port $Port is still in use!" -ForegroundColor Red
    exit 1
}

# Start API server
Write-Host "🚀 Starting $ApiFile on port $Port..." -ForegroundColor Green
$env:PORT = $Port
$env:PYTHONDONTWRITEBYTECODE = 1

cd $PSScriptRoot\..
python "backend\$ApiFile"

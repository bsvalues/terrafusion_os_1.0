#!/usr/bin/env pwsh
<#
.SYNOPSIS
    TerraFusion Elite Backend - Quick Start Script
.DESCRIPTION
    Rapid deployment script for TerraFusion backend API
    Government. Transcended.
.PARAMETER Port
    Port number for API (default: 5000)
.PARAMETER Environment
    Environment name (Development, Staging, Production)
.EXAMPLE
    .\start-api.ps1 -Port 5000 -Environment Development
#>

param(
    [int]$Port = 5000,
    [ValidateSet('Development', 'Staging', 'Production')]
    [string]$Environment = 'Development'
)

$ErrorActionPreference = 'Stop'
$BackendPath = Split-Path -Parent $PSScriptRoot

Write-Host "`n╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   TERRAFUSION ELITE BACKEND LAUNCHER                             ║" -ForegroundColor Cyan
Write-Host "║   Government. Transcended.                                       ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Validate .NET 8 SDK
Write-Host "🔍 Validating .NET 8 SDK..." -ForegroundColor Yellow
$dotnetVersion = dotnet --version
if ($dotnetVersion -notmatch '^8\.') {
    Write-Host "❌ .NET 8 SDK required. Current version: $dotnetVersion" -ForegroundColor Red
    exit 1
}
Write-Host "  ✅ .NET SDK $dotnetVersion" -ForegroundColor Green

# Check if port is available
Write-Host "`n🔍 Checking port $Port availability..." -ForegroundColor Yellow
$portInUse = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "  ⚠️  Port $Port is in use by process: $($portInUse.OwningProcess)" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne 'y') {
        exit 0
    }
}
else {
    Write-Host "  ✅ Port $Port available" -ForegroundColor Green
}

# Build solution
Write-Host "`n🔨 Building TerraFusion solution..." -ForegroundColor Yellow
Push-Location $BackendPath
$buildResult = dotnet build TerraFusion.sln -c Release --no-restore 2>&1 | Select-String "Build succeeded|Build FAILED|error CS"
if ($buildResult -match "Build FAILED" -or $buildResult -match "error CS") {
    Write-Host "  ❌ Build failed" -ForegroundColor Red
    $buildResult | Select-Object -First 10
    Pop-Location
    exit 1
}
Write-Host "  ✅ Build succeeded" -ForegroundColor Green

# Set environment
$env:ASPNETCORE_ENVIRONMENT = $Environment
Write-Host "`n🔧 Environment: $Environment" -ForegroundColor Cyan

# Launch API
Write-Host "`n🚀 Starting TerraFusion API on port $Port..." -ForegroundColor Yellow
Write-Host "   Press Ctrl+C to stop`n" -ForegroundColor Gray

$apiUrl = "http://localhost:$Port"
Write-Host "📡 Endpoints:" -ForegroundColor Cyan
Write-Host "   • API Base:      $apiUrl" -ForegroundColor White
Write-Host "   • Health Check:  $apiUrl/health" -ForegroundColor White
Write-Host "   • Swagger UI:    $apiUrl/swagger" -ForegroundColor White
Write-Host "   • SignalR Hub:   ws://localhost:$Port/hubs/oscore`n" -ForegroundColor White

try {
    dotnet run --project TerraFusion.API\TerraFusion.API.csproj --no-build -c Release --urls "$apiUrl"
}
finally {
    Pop-Location
    Write-Host "`n✅ TerraFusion API stopped" -ForegroundColor Green
}

#!/usr/bin/env pwsh
# TerraFusion OS — Dev Startup Script
# Starts the backend with ASPNETCORE_ENVIRONMENT=Development (required for SQLite dev DB)
# Usage: .\start-dev.ps1

$env:ASPNETCORE_ENVIRONMENT = "Development"
$apiPath = Join-Path $PSScriptRoot "backend\src\TerraFusion.API"

Write-Host "Starting TerraFusion API (Development)..." -ForegroundColor Cyan
Write-Host "  Path: $apiPath" -ForegroundColor Gray
Write-Host "  Port: 5000" -ForegroundColor Gray
Write-Host ""

Push-Location $apiPath
try {
    dotnet run
} finally {
    Pop-Location
}

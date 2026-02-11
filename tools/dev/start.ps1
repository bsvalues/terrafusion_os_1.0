<#
.SYNOPSIS
  TerraFusion OS – Start the Docker spine.
  Builds Soul (frontend) and starts all services.
#>
param(
    [switch]$Build,
    [switch]$Detach
)

$ErrorActionPreference = 'Stop'
$compose = Join-Path $PSScriptRoot "../../ops/prod/docker-compose.prod.server.yml"

if (-not (Test-Path $compose)) {
    Write-Host "ERROR: Compose file not found at $compose" -ForegroundColor Red
    exit 1
}

$args_ = @('-f', $compose, 'up')
if ($Build)  { $args_ += '--build' }
if ($Detach) { $args_ += '-d' }

Write-Host "Starting TerraFusion OS spine..." -ForegroundColor Cyan
Write-Host "  compose: $compose"
Write-Host "  build: $Build  detach: $Detach"
Write-Host ""

docker compose @args_

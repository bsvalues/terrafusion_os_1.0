<#
.SYNOPSIS
  TerraFusion OS – Start the Docker spine.
  Builds Soul (frontend) and starts all services.

.PARAMETER WashingtonLaunchManifestSha256
  Public SHA-256 trust pin for the hosted Washington launch manifest. Required
  with -Build; defaults from VITE_WASHINGTON_LAUNCH_MANIFEST_SHA256.
#>
param(
    [switch]$Build,
    [switch]$Detach,
    [string]$WashingtonLaunchManifestSha256 = $env:VITE_WASHINGTON_LAUNCH_MANIFEST_SHA256
)

$ErrorActionPreference = 'Stop'
$compose = Join-Path $PSScriptRoot "../../ops/prod/docker-compose.prod.server.yml"

if (-not (Test-Path $compose)) {
    Write-Host "ERROR: Compose file not found at $compose" -ForegroundColor Red
    exit 1
}

$upArgs = @('-f', $compose, 'up')
if ($Detach) { $upArgs += '-d' }

$buildArgs = $null
if ($Build) {
    $manifestSha256 = ([string]$WashingtonLaunchManifestSha256).Trim().ToLowerInvariant()
    if ($manifestSha256 -notmatch '^[0-9a-f]{64}$') {
        Write-Host "ERROR: -Build requires a 64-character Washington launch manifest SHA-256 pin." -ForegroundColor Red
        Write-Host "Supply -WashingtonLaunchManifestSha256 or set VITE_WASHINGTON_LAUNCH_MANIFEST_SHA256." -ForegroundColor Red
        exit 1
    }

    $buildArgs = @(
        '-f',
        $compose,
        'build',
        '--build-arg',
        "VITE_WASHINGTON_LAUNCH_MANIFEST_SHA256=$manifestSha256"
    )
}

Write-Host "Starting TerraFusion OS spine..." -ForegroundColor Cyan
Write-Host "  compose: $compose"
Write-Host "  build: $Build  detach: $Detach"
Write-Host ""

if ($Build) {
    Write-Host "Building TerraFusion OS spine with the authenticated Washington package pin..." -ForegroundColor Cyan
    docker compose @buildArgs
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

docker compose @upArgs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

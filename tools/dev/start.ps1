<#
.SYNOPSIS
  TerraFusion OS – Start the Docker spine.
  Authenticates and builds Soul (frontend), then starts all services.

.PARAMETER Build
  Retained for compatibility with existing quick-start commands. Every start
  performs the authenticated build because Compose up cannot carry build args.

.PARAMETER WashingtonLaunchManifestSha256
  Public SHA-256 trust pin for the hosted Washington launch manifest. Required
  for every start; defaults from VITE_WASHINGTON_LAUNCH_MANIFEST_SHA256.
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

$upArgs = @('-f', $compose, 'up', '--no-build')
if ($Detach) { $upArgs += '-d' }

$manifestSha256 = ([string]$WashingtonLaunchManifestSha256).Trim().ToLowerInvariant()
if ($manifestSha256 -notmatch '^[0-9a-f]{64}$') {
    Write-Host "ERROR: Start requires a 64-character Washington launch manifest SHA-256 pin." -ForegroundColor Red
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

Write-Host "Starting TerraFusion OS spine..." -ForegroundColor Cyan
Write-Host "  compose: $compose"
Write-Host "  authenticated build: true  requested -Build: $Build  detach: $Detach"
Write-Host ""

# `docker compose up` may build a missing image, but that implicit build cannot
# receive the public trust pin. Build explicitly on every quick start and then
# forbid Compose from taking an unpinned build path during startup.
Write-Host "Building TerraFusion OS spine with the authenticated Washington package pin..." -ForegroundColor Cyan
docker compose @buildArgs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

docker compose @upArgs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

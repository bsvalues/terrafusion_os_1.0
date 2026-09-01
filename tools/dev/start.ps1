<#
.SYNOPSIS
  TerraFusion OS – Start the Docker spine.
  Builds Soul (frontend), then starts all services.

.PARAMETER Build
  Retained for compatibility with existing quick-start commands. Every start
  performs an explicit build because Compose up cannot carry build args.

.PARAMETER WashingtonLaunchManifestSha256
  Public SHA-256 trust pin for the hosted Washington launch manifest. Supply it
  together with WashingtonLaunchDataSourceUrl to enable hosted public data, or
  leave both blank for the truthful 39-county navigation-only fallback.

.PARAMETER WashingtonLaunchDataSourceUrl
  Credential-free HTTPS root for the matching public package. The path must be
  /launch-data/washington. Supply it together with the manifest trust pin, or
  leave both blank for navigation-only operation.
#>
param(
    [switch]$Build,
    [switch]$Detach,
    [string]$WashingtonLaunchManifestSha256 = $env:VITE_WASHINGTON_LAUNCH_MANIFEST_SHA256,
    [string]$WashingtonLaunchDataSourceUrl = $env:WASHINGTON_LAUNCH_DATA_SOURCE_URL
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
$packageSourceUrl = ([string]$WashingtonLaunchDataSourceUrl).Trim()
$hasManifestPin = -not [string]::IsNullOrWhiteSpace($manifestSha256)
$hasPackageSource = -not [string]::IsNullOrWhiteSpace($packageSourceUrl)

if ($hasManifestPin -ne $hasPackageSource) {
    Write-Host "ERROR: The Washington launch manifest pin and package source must be supplied together." -ForegroundColor Red
    Write-Host "Supply both values for authenticated public data, or leave both blank for navigation-only operation." -ForegroundColor Red
    exit 1
}

$buildArgs = @(
    '-f',
    $compose,
    'build'
)
$washingtonLaunchMode = 'navigation-only'

if ($hasManifestPin) {
    if ($manifestSha256 -notmatch '^[0-9a-f]{64}$') {
        Write-Host "ERROR: Start requires a 64-character Washington launch manifest SHA-256 pin." -ForegroundColor Red
        Write-Host "Supply -WashingtonLaunchManifestSha256 or set VITE_WASHINGTON_LAUNCH_MANIFEST_SHA256." -ForegroundColor Red
        exit 1
    }

    $packageSourceUri = $null
    if (
        -not [Uri]::TryCreate($packageSourceUrl, [UriKind]::Absolute, [ref]$packageSourceUri) `
        -or $packageSourceUri.Scheme -ne 'https' `
        -or -not $packageSourceUri.IsDefaultPort `
        -or [string]::IsNullOrWhiteSpace($packageSourceUri.Host) `
        -or -not [string]::IsNullOrEmpty($packageSourceUri.UserInfo) `
        -or -not [string]::IsNullOrEmpty($packageSourceUri.Query) `
        -or -not [string]::IsNullOrEmpty($packageSourceUri.Fragment) `
        -or $packageSourceUri.AbsolutePath.TrimEnd('/') -ne '/launch-data/washington'
    ) {
        Write-Host "ERROR: Start requires a credential-free HTTPS Washington package root ending in /launch-data/washington." -ForegroundColor Red
        Write-Host "Supply -WashingtonLaunchDataSourceUrl or set WASHINGTON_LAUNCH_DATA_SOURCE_URL." -ForegroundColor Red
        exit 1
    }
    $packageSourceUrl = $packageSourceUri.AbsoluteUri.TrimEnd('/')
    $buildArgs += @(
        '--build-arg',
        "VITE_WASHINGTON_LAUNCH_MANIFEST_SHA256=$manifestSha256",
        '--build-arg',
        "WASHINGTON_LAUNCH_DATA_SOURCE_URL=$packageSourceUrl"
    )
    $washingtonLaunchMode = 'authenticated-public-data'
}

Write-Host "Starting TerraFusion OS spine..." -ForegroundColor Cyan
Write-Host "  compose: $compose"
Write-Host "  Washington launch mode: $washingtonLaunchMode  requested -Build: $Build  detach: $Detach"
Write-Host ""

# Build explicitly so the selected launch-data posture is baked into the image,
# then prevent Compose from silently rebuilding with a different posture.
Write-Host "Building TerraFusion OS spine in $washingtonLaunchMode mode..." -ForegroundColor Cyan
docker compose @buildArgs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

docker compose @upArgs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

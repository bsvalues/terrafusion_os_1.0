# Save as: tools/onboarding/onboard-terra-permit.ps1
$ErrorActionPreference = "Stop"
Write-Host "--- PROTOCOL: ONBOARDING TERRA-PERMIT ---" -ForegroundColor Cyan

$Root = (Get-Location).Path
$Source = Join-Path $Root "applications/terra-permit-production"
$Dest = Join-Path $Root "applications/terra-permit"
$RegistryFile = Join-Path $Root "registry/app-registry.json"

# 1. Harmonize (Rename)
if (Test-Path $Source) {
    if (-not (Test-Path $Dest)) {
        Write-Host "Harmonizing Path: $Source -> $Dest" -ForegroundColor Yellow
        Move-Item -Path $Source -Destination $Dest
    } else {
        Write-Warning "Destination already exists. Skipping move."
    }
} else {
    if (-not (Test-Path $Dest)) {
        Write-Error "Source application not found: $Source"
        exit 1
    }
}

# 2. Register (The Truth)
if (-not (Test-Path $RegistryFile)) {
    @{ apps = @() } | ConvertTo-Json | Out-File $RegistryFile
}

$Registry = Get-Content $RegistryFile -Raw | ConvertFrom-Json
$AppEntry = @{
    id = "terra-permit"
    path = "applications/terra-permit"
    type = "node-hybrid"
    status = "active"
    port = 3006 # Assigning a dedicated port
}

# Update or Add
$Existing = $Registry.apps | Where-Object { $_.id -eq "terra-permit" }
if ($Existing) {
    Write-Host "Updating Registry Entry..." -ForegroundColor Gray
    $Registry.apps = $Registry.apps | Where-Object { $_.id -ne "terra-permit" }
}
$Registry.apps += $AppEntry

$Registry | ConvertTo-Json -Depth 4 | Out-File $RegistryFile -Encoding UTF8
Write-Host "✅ Registered 'terra-permit' (Port 3006)" -ForegroundColor Green

# 3. Create Launch Script
$LaunchScript = Join-Path $Dest "start-sovereign.ps1"
Set-Content -Path $LaunchScript -Value "npm install; npm run dev -- --port 3006"
Write-Host "✅ Launch Script Created: $LaunchScript" -ForegroundColor Green

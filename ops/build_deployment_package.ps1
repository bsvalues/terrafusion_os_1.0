$ErrorActionPreference = "Stop"

$Version = "v1.1.0-sov"
$DistRoot = "$PSScriptRoot\..\dist"
$TargetDir = "$DistRoot\$Version"
$ZipPath = "$DistRoot\TerraFusion_v1.1.0_SOVEREIGN.zip"

Write-Host "Packaging [$Version]..." -ForegroundColor Cyan

# 1. Clean
if (Test-Path $DistRoot) {
    Remove-Item $DistRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
Write-Host "   Existing dist/ cleaned." -ForegroundColor Gray

# 2. Assemble Artifacts
function Copy-Artifact {
    param($Source, $Dest)
    if (-not (Test-Path $Source)) {
        Write-Error "Missing Source: $Source"
    }
    Copy-Item -Path $Source -Destination $Dest -Recurse -Force
    Write-Host "   + Added: $(Split-Path $Source -Leaf)" -ForegroundColor Gray
}

# Core Files
Copy-Artifact "ops\prod\docker-compose.prod.server.yml" "$TargetDir\docker-compose.yml"
Copy-Artifact "docker-compose.observability.yml" "$TargetDir\docker-compose.obs.yml"
Copy-Artifact "ops\prod\secrets.prod.template.env" "$TargetDir\secrets.env"
Copy-Artifact "ops\prod\setup_host.ps1" "$TargetDir\setup_host.ps1"
Copy-Artifact "ops\prod\verify_connection_string.ps1" "$TargetDir\verify.ps1"

# Directories
New-Item -ItemType Directory -Path "$TargetDir\scripts" -Force | Out-Null
Copy-Artifact "config" "$TargetDir\config"
Copy-Artifact "scripts\gates" "$TargetDir\scripts\gates"

# 3. Zip (The Pack)
Write-Host "Zipping payload..." -ForegroundColor Cyan
if (Test-Path $ZipPath) { Remove-Item $ZipPath }
Compress-Archive -Path "$TargetDir\*" -DestinationPath $ZipPath

# 4. Seal (SHA256)
$Hash = Get-FileHash $ZipPath -Algorithm SHA256
$HashVal = $Hash.Hash

Write-Host "BUILD SUCCESSFUL" -ForegroundColor Green
Write-Host "Artifact: $ZipPath"
Write-Host "SHA256:   $HashVal"

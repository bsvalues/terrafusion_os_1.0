Write-Host "--- PROTOCOL: WSL POSTGRES (SECURE) + TERRA-PERMIT ---" -ForegroundColor Cyan
$ErrorActionPreference = "Stop"

# 1. Resolve Target
$AppPath = "applications/terra-permit"
if (-not (Test-Path $AppPath)) { $AppPath = "applications/terra-permit-production" }
if (-not (Test-Path $AppPath)) { throw "CRITICAL: TerraPermit not found." }
Write-Host "Target Locked: $AppPath" -ForegroundColor Gray

# 2. Transfer Script to WSL
Write-Host "[Infrastructure] Transferring setup script..." -ForegroundColor Cyan
$BashScriptPath = Join-Path $PSScriptRoot "wsl-setup.sh"
if (-not (Test-Path $BashScriptPath)) { throw "Missing wsl-setup.sh" }

# Read content
$BashContent = Get-Content $BashScriptPath -Raw

# Write to tmp file, then STRIP \r explicitly using tr
$BashContent | wsl -d Ubuntu -u root -- bash -c "cat > /tmp/wsl-setup.sh"
wsl -d Ubuntu -u root -- bash -c "tr -d '\r' < /tmp/wsl-setup.sh > /tmp/wsl-setup-clean.sh"
wsl -d Ubuntu -u root -- chmod +x /tmp/wsl-setup-clean.sh

# 3. Execute
Write-Host "[Infrastructure] Provisioning DB..." -ForegroundColor Cyan
$Result = wsl -d Ubuntu -u root -- /tmp/wsl-setup-clean.sh

# Extract IP (clean up potential noise)
$WslIp = $Result.Trim().Split("`n")[-1].Trim()

if ([string]::IsNullOrWhiteSpace($WslIp)) {
    throw "Failed to get WSL IP. Output: $Result"
}
Write-Host "✅ WSL Active. IP: $WslIp" -ForegroundColor Green

$DbHost = $WslIp

# 4. Inject Config (.env)
$EnvContent = "NODE_ENV=development`nPORT=3006`nDATABASE_URL=postgresql://terra_permit:terra_permit_dev_pw@${DbHost}:5432/terra_permit`nSESSION_SECRET=dev_secret_$(Get-Random)"
$EnvPath = Join-Path $AppPath ".env"
Set-Content -Path $EnvPath -Value $EnvContent
Write-Host "[Config] .env Injected at $EnvPath" -ForegroundColor Green

# 5. Verify & Push
Push-Location $AppPath
    try {
        if (-not (Test-Path "node_modules")) {
            Write-Host "[Schema] Installing dependencies..." -ForegroundColor Cyan
            npm install
        }
        
        Write-Host "[Schema] Pushing Drizzle Schema..." -ForegroundColor Cyan
        $env:DATABASE_URL = "postgresql://terra_permit:terra_permit_dev_pw@${DbHost}:5432/terra_permit"
        npm run db:push
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
Pop-Location

Write-Host "`n[Ready] Env Configured." -ForegroundColor Cyan
Write-Host "Verify manually: curl http://localhost:3006/api/health" -ForegroundColor Gray

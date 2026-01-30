Write-Host "--- TERRAFUSION OS LAYER: IGNITION ---" -ForegroundColor Cyan
$ErrorActionPreference = "Stop"

$BashScriptPath = "scripts/os_layer_setup.sh"

Write-Host "[Infrastructure] Provisioning DB..." -ForegroundColor Cyan
# Read raw, replace CRLF with LF just in case
(Get-Content $BashScriptPath -Raw) -replace "`r`n", "`n" | wsl -d Ubuntu -u root -- bash -c "cat > /tmp/os_setup_clean.sh"
wsl -d Ubuntu -u root -- chmod +x /tmp/os_setup_clean.sh

$Result = wsl -d Ubuntu -u root -- /tmp/os_setup_clean.sh
$WslIp = $Result.Trim().Split("`n")[-1].Trim()

if ([string]::IsNullOrWhiteSpace($WslIp)) {
    throw "Failed to get WSL IP. Output: $Result"
}

Write-Host "✅ OS Data Layer Active. IP: $WslIp" -ForegroundColor Green
Write-Host "DB: postgresql://terrafusion_os:terrafusion_dev_secret@${WslIp}:5432/terrafusion_os" -ForegroundColor Gray

$Config = @{
    DATABASE_URL = "postgresql://terrafusion_os:terrafusion_dev_secret@${WslIp}:5432/terrafusion_os"
    IP = $WslIp
}
$Config | ConvertTo-Json | Set-Content "config/os-data-layer.json"
Write-Host "[Configuration] Persisted to config/os-data-layer.json" -ForegroundColor Green

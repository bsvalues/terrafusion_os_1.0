# File: ops/scripts/import_grafana_dashboard.ps1
# Purpose: Import Confidence Gradient Dashboard into Grafana via API
# Usage: pwsh ops/scripts/import_grafana_dashboard.ps1
# Prerequisites: $env:GRAFANA_API_KEY must be set

param(
    [string]$GrafanaUrl = "http://localhost:3000",
    [string]$DashboardPath = "ops/observability/grafana-dashboards/confidence-gradient.json"
)

# Validate API key
if (-not $env:GRAFANA_API_KEY) {
    Write-Error "GRAFANA_API_KEY environment variable not set."
    Write-Host "Set it via: `$env:GRAFANA_API_KEY = 'your_api_key'"
    exit 1
}

# Validate dashboard file exists
if (-not (Test-Path $DashboardPath)) {
    Write-Error "Dashboard file not found: $DashboardPath"
    exit 1
}

Write-Host "[INFO] Importing Confidence Gradient Dashboard..."
Write-Host "[INFO] Grafana URL: $GrafanaUrl"
Write-Host "[INFO] Dashboard: $DashboardPath"

# Load dashboard JSON
$dashboardJson = Get-Content $DashboardPath -Raw | ConvertFrom-Json

# Build Grafana API payload
$payload = @{
    dashboard = $dashboardJson.dashboard
    overwrite = $true
    message = "Imported Confidence Gradient Dashboard (T+36h Observation Mode)"
} | ConvertTo-Json -Depth 30 -Compress

# Import via Grafana API
try {
    $response = Invoke-RestMethod `
        -Uri "$GrafanaUrl/api/dashboards/db" `
        -Method Post `
        -Body $payload `
        -ContentType "application/json" `
        -Headers @{ Authorization = "Bearer $env:GRAFANA_API_KEY" }
    
    Write-Host "[SUCCESS] Dashboard imported!"
    Write-Host "[INFO] Dashboard URL: $GrafanaUrl$($response.url)"
    Write-Host "[INFO] Dashboard UID: $($response.uid)"
    Write-Host "[INFO] Version: $($response.version)"
} catch {
    Write-Error "[FAILED] Dashboard import failed: $_"
    exit 1
}

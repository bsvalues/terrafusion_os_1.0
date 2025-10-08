#!/usr/bin/env pwsh
# Grafana Dashboard to PNG Renderer
# Exports Grafana panels as PNG images for evidence trail
# Usage: .\render-grafana-panels.ps1 -DashboardUID "xyz123" -OutputDir "evidence/migration"

param(
    [Parameter(Mandatory=$false)]
    [string]$GrafanaUrl = $env:GRAFANA_URL ?? "http://localhost:3000",
    
    [Parameter(Mandatory=$false)]
    [string]$ApiKey = $env:GRAFANA_API_KEY,
    
    [Parameter(Mandatory=$true)]
    [string]$DashboardUID,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputDir = "evidence/grafana",
    
    [Parameter(Mandatory=$false)]
    [string]$TimeRange = "now-6h",
    
    [Parameter(Mandatory=$false)]
    [string]$TimeRangeTo = "now",
    
    [Parameter(Mandatory=$false)]
    [int]$Width = 1920,
    
    [Parameter(Mandatory=$false)]
    [int]$Height = 1080,
    
    [Parameter(Mandatory=$false)]
    [int]$Timeout = 60
)

# Check prerequisites
if (-not $ApiKey) {
    Write-Error "GRAFANA_API_KEY environment variable not set"
    Write-Host "Set with: `$env:GRAFANA_API_KEY = 'your-api-key'"
    exit 1
}

# Create output directory
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
Write-Host "📁 Output directory: $OutputDir" -ForegroundColor Blue

# Function to render panel
function Render-Panel {
    param(
        [int]$PanelId,
        [string]$PanelTitle
    )
    
    $safeTitle = $PanelTitle -replace '[^\w\s-]', '' -replace '\s+', '_'
    $outputFile = Join-Path $OutputDir "${safeTitle}_panel${PanelId}.png"
    
    $renderUrl = "${GrafanaUrl}/render/d-solo/${DashboardUID}?orgId=1&from=${TimeRange}&to=${TimeRangeTo}&panelId=${PanelId}&width=${Width}&height=${Height}&timeout=${Timeout}"
    
    Write-Host "📸 Rendering: $PanelTitle (Panel ID: $PanelId)..." -NoNewline
    
    try {
        $headers = @{
            "Authorization" = "Bearer $ApiKey"
        }
        
        Invoke-WebRequest -Uri $renderUrl -Headers $headers -OutFile $outputFile -TimeoutSec $Timeout
        
        $fileSize = (Get-Item $outputFile).Length / 1KB
        Write-Host " ✅ ${fileSize} KB" -ForegroundColor Green
        
        return @{
            Success = $true
            File = $outputFile
            Size = $fileSize
        }
    }
    catch {
        Write-Host " ❌ Failed" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        
        return @{
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

# Get dashboard metadata
Write-Host "🔍 Fetching dashboard metadata..." -ForegroundColor Blue

try {
    $headers = @{
        "Authorization" = "Bearer $ApiKey"
        "Content-Type" = "application/json"
    }
    
    $dashboardUrl = "${GrafanaUrl}/api/dashboards/uid/${DashboardUID}"
    $response = Invoke-RestMethod -Uri $dashboardUrl -Headers $headers -Method Get
    
    $dashboard = $response.dashboard
    $dashboardTitle = $dashboard.title
    
    Write-Host "✅ Dashboard: $dashboardTitle" -ForegroundColor Green
    Write-Host "   UID: $DashboardUID" -ForegroundColor Gray
    Write-Host "   Panels: $($dashboard.panels.Count)" -ForegroundColor Gray
    Write-Host ""
}
catch {
    Write-Error "Failed to fetch dashboard metadata: $($_.Exception.Message)"
    exit 1
}

# Render all panels
$results = @()
$successCount = 0
$failCount = 0

foreach ($panel in $dashboard.panels) {
    $panelId = $panel.id
    $panelTitle = $panel.title ?? "Panel_${panelId}"
    
    $result = Render-Panel -PanelId $panelId -PanelTitle $panelTitle
    $results += $result
    
    if ($result.Success) {
        $successCount++
    } else {
        $failCount++
    }
    
    Start-Sleep -Milliseconds 500  # Rate limiting
}

# Summary
Write-Host ""
Write-Host "============================================================================" -ForegroundColor Blue
Write-Host "                     RENDERING SUMMARY" -ForegroundColor Blue
Write-Host "============================================================================" -ForegroundColor Blue
Write-Host ""
Write-Host "Dashboard:      $dashboardTitle" -ForegroundColor White
Write-Host "Total Panels:   $($dashboard.panels.Count)" -ForegroundColor White
Write-Host "Success:        $successCount" -ForegroundColor Green
Write-Host "Failed:         $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "White" })
Write-Host "Output Dir:     $OutputDir" -ForegroundColor White
Write-Host ""

# List rendered files
if ($successCount -gt 0) {
    Write-Host "Rendered files:" -ForegroundColor Blue
    Get-ChildItem -Path $OutputDir -Filter "*.png" | ForEach-Object {
        $sizeKB = [math]::Round($_.Length / 1KB, 2)
        Write-Host "  - $($_.Name) ($sizeKB KB)" -ForegroundColor Gray
    }
}

# Exit code
if ($failCount -gt 0) {
    exit 1
} else {
    Write-Host ""
    Write-Host "✅ All panels rendered successfully!" -ForegroundColor Green
    exit 0
}

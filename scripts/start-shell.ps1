# TerraFusion OS Shell (Real Frontend-v2) Startup Script with Brand Assets
# Government. Transcended.

param(
    [string]$ShellPort = $env:TF_SHELL_PORT,
    [string]$ApiPort = $env:TF_API_PORT
)

# Set default ports if not provided
if (-not $ShellPort) {
    $ShellPort = "3103"
    $env:TF_SHELL_PORT = $ShellPort
}

if (-not $ApiPort) {
    $ApiPort = "5050"
    $env:TF_API_PORT = $ApiPort
}

Write-Host "🏛️ Starting REAL TerraFusion OS Shell with Full Brand Assets on port $ShellPort" -ForegroundColor Green
Write-Host "🔗 Connecting to API Gateway on port $ApiPort" -ForegroundColor Cyan
Write-Host "✨ Government. Transcended. - Loading TerraFusion Brand System..." -ForegroundColor Yellow

# Navigate to REAL TerraFusion Shell (frontend-v2)
Set-Location "frontend-v2/shell"

# Set environment variables with TerraFusion branding
$env:PORT = $ShellPort
$env:REACT_APP_API_GATEWAY = "http://localhost:$ApiPort"
$env:REACT_APP_MARKETPLACE_URL = "http://localhost:3002"
$env:REACT_APP_BRAND_CONFIG = "../../Brand_Assets/tf-brand-config.json"
$env:HOST = "0.0.0.0"
$env:BROWSER = "none"

# Start REAL TerraFusion Shell with Brand System
npm start
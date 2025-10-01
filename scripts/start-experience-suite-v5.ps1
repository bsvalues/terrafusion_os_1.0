# TerraFusion OS Experience Suite v5 Startup Script with Dynamic Port Management
# Elite Government PWA Desktop Environment

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

Write-Host "🌟 Starting TerraFusion OS Experience Suite v5 on port $ShellPort" -ForegroundColor Green
Write-Host "🔗 Connecting to API Gateway on port $ApiPort" -ForegroundColor Cyan
Write-Host "🏛️ Government PWA Desktop Environment (Experience Suite v5) Loading..." -ForegroundColor Yellow

# Navigate to Experience Suite v5 directory
Set-Location "experience-suite/temp-extract/experience-suite-v5/ui"

# Set environment variables for React/Vite
$env:PORT = $ShellPort
$env:VITE_PORT = $ShellPort
$env:REACT_APP_API_GATEWAY = "http://localhost:$ApiPort"
$env:VITE_API_URL = "http://localhost:$ApiPort"
$env:HOST = "0.0.0.0"
$env:BROWSER = "none"

# Start Experience Suite v5
npm start
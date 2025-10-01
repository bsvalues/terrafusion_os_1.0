# TerraFusion OS Shell Static Serve Script with Dynamic Port Management
# Elite Government Technology Platform

param(
    [string]$Port = $env:TF_SHELL_PORT
)

# Set default port if not provided
if (-not $Port) {
    $Port = "3103"
    $env:TF_SHELL_PORT = $Port
}

Write-Host "📡 Serving TerraFusion OS Shell on port $Port" -ForegroundColor Green
Write-Host "🏛️ Government PWA Desktop Environment - Static Build" -ForegroundColor Cyan

# Navigate to shell build directory and serve
Set-Location "frontend-v2/shell"
npx serve -s build -l $Port
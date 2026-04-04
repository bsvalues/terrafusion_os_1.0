# TerraSync API Startup Script - PowerShell Edition
# THE TERRAFUSION WAY - Government. Transcended.

Write-Host "🚀 STARTING TERRASYNC API BRIDGE..." -ForegroundColor Cyan
Write-Host "   🏛️ County Data Integration Service" -ForegroundColor Yellow
Write-Host "   🔒 Harris PACS 9.0 Integration" -ForegroundColor Green
Write-Host "   ⚡ Government-grade performance" -ForegroundColor Magenta

# Set environment variables
$env:TERRASYNC_PORT = "3005"
$env:HARRIS_PACS_VERSION = "9.0"
$env:NODE_ENV = "development"

# Check if node_modules exists
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start TerraSync API
Write-Host "🌐 Starting TerraSync API on port $env:TERRASYNC_PORT..." -ForegroundColor Green
Write-Host "   📡 API Endpoint: http://localhost:$env:TERRASYNC_PORT" -ForegroundColor Gray
Write-Host "   🏥 Health Check: http://localhost:$env:TERRASYNC_PORT/api/health" -ForegroundColor Gray
Write-Host "   🏛️ Government API: http://localhost:$env:TERRASYNC_PORT/api/government/excellence" -ForegroundColor Gray

# Run TerraSync API
npm run terrasync:dev

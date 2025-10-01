# TerraFusion API Startup Script
# 🔧 DYNAMIC PORT CONFIGURATION - NO HARDCODING!

Write-Host "🚀 Starting TerraFusion API with dynamic port detection..." -ForegroundColor Green

# 🔧 NO HARDCODED PORTS - Let application auto-detect available port
# Only set if user explicitly provides ASPNETCORE_URLS environment variable
if (-not $env:ASPNETCORE_URLS) {
    Write-Host "🔧 No port specified - API will auto-detect available port starting from 5000" -ForegroundColor Yellow
}
$env:ASPNETCORE_ENVIRONMENT = "Development"

# Navigate to API directory
Set-Location $PSScriptRoot

# Check if database exists
if (-not (Test-Path "terrafusion.db")) {
    Write-Host "⚠️ Database not found, creating..." -ForegroundColor Yellow
    dotnet ef database update
}

# Start the API with explicit port configuration
try {
    Write-Host "🔧 Building TerraFusion API..." -ForegroundColor Blue
    dotnet build --configuration Release
    
    Write-Host "🚀 Starting TerraFusion API..." -ForegroundColor Green
    # 🔧 NO HARDCODED PORTS - Let application handle dynamic port detection
    dotnet run --configuration Release
} catch {
    Write-Host "❌ Failed to start TerraFusion API: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "🔍 Check the logs for more details" -ForegroundColor Yellow
}

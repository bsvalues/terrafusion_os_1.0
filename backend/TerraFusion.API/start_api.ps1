# TerraFusion API Startup Script
# Explicitly sets port 5000 and handles startup issues

Write-Host "🚀 Starting TerraFusion API on Port 5000..." -ForegroundColor Green

# Set environment variables
$env:ASPNETCORE_URLS = "http://localhost:5000"
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
    dotnet run --configuration Release --urls "http://localhost:5000"
} catch {
    Write-Host "❌ Failed to start TerraFusion API: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "🔍 Check the logs for more details" -ForegroundColor Yellow
}

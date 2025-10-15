#!/usr/bin/env pwsh
# Start TerraFusion OS Backend

Write-Host "🚀 Starting TerraFusion OS Backend..." -ForegroundColor Cyan

Set-Location "C:\Users\bsval\terrafusion_os_1.0\backend\TerraFusion.API"

Write-Host "📍 Working Directory: $(Get-Location)" -ForegroundColor Gray
Write-Host "🔧 Starting .NET API on port 5000..." -ForegroundColor Yellow

dotnet run --urls "http://localhost:5000"

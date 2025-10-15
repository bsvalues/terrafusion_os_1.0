#!/usr/bin/env pwsh
# Test script to run backend and keep it alive

Set-Location "C:\Users\bsval\terrafusion_os_1.0\backend\TerraFusion.API"

Write-Host "🧪 Testing Backend Startup..." -ForegroundColor Cyan
Write-Host "📍 Working Directory: $(Get-Location)" -ForegroundColor Gray

# Run the backend
dotnet run --urls "http://localhost:5000"

Write-Host "`n⚠️  Backend exited with code: $LASTEXITCODE" -ForegroundColor Yellow

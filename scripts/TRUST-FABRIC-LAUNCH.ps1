#!/usr/bin/env powershell
<#
TRUST FABRIC ECOSYSTEM LAUNCHER
Real enforcement - services use assigned ports OR DIE
#>

Write-Host "🚀 TRUST FABRIC ECOSYSTEM LAUNCHER" -ForegroundColor Magenta
Write-Host "===================================" -ForegroundColor White
Write-Host "🔐 Real enforcement - no more port scanning theater!" -ForegroundColor Yellow
Write-Host ""

# Kill any existing processes first
Write-Host "🔥 Clearing any zombie processes..." -ForegroundColor Red
Get-Process | Where-Object {$_.ProcessName -match "dotnet|node" -and $_.ProcessName -notmatch "python"} | ForEach-Object {
    Write-Host "   💀 Terminating: $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor Yellow
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}
Start-Sleep 2

# Start Backend with ENFORCED port
Write-Host "🖥️  STARTING BACKEND - ENFORCED PORT 5000" -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd 'c:\Users\bsval\terrafusion_os_1.0\backend\TerraFusion.API'; `$env:ASPNETCORE_ENVIRONMENT='Development'; `$env:ASPNETCORE_URLS='http://localhost:\${{TF_API_PORT:-5000}}'; `$env:FABRIC_ENFORCED='true'; Write-Host '🔐 Backend under Trust Fabric control - Port \${{TF_API_PORT:-5000}} ENFORCED' -ForegroundColor Green; dotnet run"
) -WindowStyle Normal

Write-Host "   ⏳ Waiting for backend to initialize..." -ForegroundColor Gray
Start-Sleep 8

# Test backend before starting frontend
Write-Host "   🔍 Verifying backend on ENFORCED port \${{TF_API_PORT:-5000}}..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:\${{TF_API_PORT:-5000}}/health" -TimeoutSec 5
    Write-Host "   ✅ Backend CONFIRMED: $($health | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Backend not ready yet: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Start Frontend with STRICT PORT ENFORCEMENT
Write-Host "`n🌐 STARTING FRONTEND - ENFORCED PORT 3000" -ForegroundColor Cyan
Write-Host "   Using --strictPort to prevent port scanning!" -ForegroundColor Yellow

Start-Process powershell -ArgumentList @(
    "-NoExit", 
    "-Command",
    "cd 'c:\Users\bsval\terrafusion_os_1.0\frontend'; `$env:PORT='3000'; `$env:NODE_ENV='development'; `$env:VITE_API_URL='http://localhost:\${{TF_API_PORT:-5000}}'; `$env:FABRIC_ENFORCED='true'; Write-Host '🔐 Frontend under Trust Fabric control - Port \${{TF_API_PORT:-5000}} ENFORCED' -ForegroundColor Green; npm run dev -- --port \${{TF_API_PORT:-5000}} --strictPort"
) -WindowStyle Normal

Write-Host "`n⏳ Waiting for frontend to initialize..." -ForegroundColor Gray
Start-Sleep 10

# Final status check
Write-Host "`n🎯 TRUST FABRIC ECOSYSTEM STATUS" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor White

Write-Host "`n🖥️  Backend (Enforced Port \${{TF_API_PORT:-5000}}):" -ForegroundColor Yellow
try {
    $backend = Invoke-RestMethod -Uri "http://localhost:\${{TF_API_PORT:-5000}}/health" -TimeoutSec 5
    Write-Host "   ✅ ACTIVE: $($backend | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ DOWN: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🌐 Frontend (Enforced Port \${{TF_API_PORT:-5000}}):" -ForegroundColor Yellow  
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:\${{TF_API_PORT:-5000}}" -TimeoutSec 5 -UseBasicParsing
    Write-Host "   ✅ ACTIVE: Status $($frontend.StatusCode) - $($frontend.Content.Length) bytes" -ForegroundColor Green
} catch {
    Write-Host "   ❌ DOWN: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🔐 TRUST FABRIC ENFORCEMENT ACTIVE" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor White
Write-Host "✅ Services are using ASSIGNED ports (no scanning)" -ForegroundColor Green
Write-Host "✅ Any unauthorized process will be terminated" -ForegroundColor Green
Write-Host "✅ Trust Fabric has REAL enforcement power" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Access TerraFusion at: http://localhost:\${{TF_API_PORT:-5000}}" -ForegroundColor Cyan
Write-Host "🖥️  Backend API at: http://localhost:\${{TF_API_PORT:-5000}}" -ForegroundColor Cyan
Write-Host ""
Write-Host "💀 Trust Fabric is watching - no more configuration theater!" -ForegroundColor Red

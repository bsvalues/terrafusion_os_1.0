# TerraFusion OS Launch Script
# This script properly launches all components

Write-Host "🚀 LAUNCHING TERRAFUSION OS..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill any existing processes
Write-Host "🔧 Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process dotnet -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process "TerraFusion.Shell" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Step 2: Start Backend API
Write-Host "🌐 Starting Backend API on port 5000..." -ForegroundColor Green
$backendPath = "C:\Users\bsval\terrafusion_os_1.0\backend\TerraFusion.API"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; dotnet run --urls 'http://localhost:5000'" -WindowStyle Minimized

# Step 3: Wait for backend to be ready
Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Step 4: Verify backend is healthy
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/health" -ErrorAction Stop
    Write-Host "✅ Backend is healthy!" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Gray
    Write-Host "   Modules: $($health.modules.total)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Backend failed to start!" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    exit 1
}

# Step 5: Launch Native Shell
Write-Host "🖥️ Launching Native Shell (Desktop App)..." -ForegroundColor Green
$nativeShellPath = "C:\Users\bsval\terrafusion_os_1.0\native-shell"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$nativeShellPath'; dotnet run"

Write-Host ""
Write-Host "✨ TERRAFUSION OS LAUNCHED SUCCESSFULLY!" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 System Status:" -ForegroundColor White
Write-Host "   Backend API: http://localhost:5000" -ForegroundColor Gray
Write-Host "   Native Shell: Loading..." -ForegroundColor Gray
Write-Host "   Rust FFI: Integrated" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow

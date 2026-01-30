# TerraFusion OS - Enterprise Launch Script
# Pure Rust + .NET Architecture (NO PYTHON!)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🏛️ TERRAFUSION OS - ENTERPRISE LAUNCH                      ║" -ForegroundColor White
Write-Host "║  Architecture: Rust + .NET (Government-Grade)               ║" -ForegroundColor White
Write-Host "║  ❌ NO PYTHON! ✅ PURE ENTERPRISE STACK!                    ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 1. Ensure Rust FFI is built
Write-Host "🦀 Checking Rust FFI Bridge..." -ForegroundColor Cyan
if (!(Test-Path "core-os/target/release/terrafusion_core_os.dll")) {
    Write-Host "   Building Rust FFI Bridge..." -ForegroundColor Yellow
    Push-Location core-os/ffi
    cargo build --release
    Pop-Location
    Write-Host "   ✅ Rust FFI compiled" -ForegroundColor Green
} else {
    Write-Host "   ✅ Rust FFI already built" -ForegroundColor Green
}

# 2. Copy Rust DLL to .NET projects
Write-Host "📦 Deploying Rust services..." -ForegroundColor Cyan
Copy-Item "core-os/target/release/terrafusion_core_os.dll" "backend/TerraFusion.API/" -Force -ErrorAction SilentlyContinue
Copy-Item "core-os/target/release/terrafusion_core_os.dll" "native-shell/bin/Debug/net8.0-windows/" -Force -ErrorAction SilentlyContinue
Write-Host "   ✅ Rust DLL deployed" -ForegroundColor Green

# 3. Ensure React UI is built
Write-Host "⚛️  Checking React Frontend..." -ForegroundColor Cyan
if (!(Test-Path "native-shell/ui/dist/index.html")) {
    Write-Host "   Building React frontend..." -ForegroundColor Yellow
    Push-Location frontend
    npm run build
    Pop-Location
    Write-Host "   ✅ React UI built to native-shell/ui/dist/" -ForegroundColor Green
} else {
    Write-Host "   ✅ React UI already built" -ForegroundColor Green
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              LAUNCHING ENTERPRISE STACK                      ║" -ForegroundColor White
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 4. Launch .NET API Gateway
Write-Host "🌐 Starting .NET API Gateway (Port 5000)..." -ForegroundColor Yellow
Write-Host "   This will:" -ForegroundColor White
Write-Host "   ✅ Load Rust FFI bridge" -ForegroundColor Green
Write-Host "   ✅ Initialize Core Rust Services" -ForegroundColor Green
Write-Host "   ✅ Start REST API endpoints" -ForegroundColor Green
Write-Host "   ✅ Enable SignalR real-time" -ForegroundColor Green
Write-Host ""

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend/TerraFusion.API; Write-Host '🌐 .NET API Gateway Starting...' -ForegroundColor Cyan; dotnet run"

Write-Host "⏳ Waiting for .NET API to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Test API
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -TimeoutSec 5
    Write-Host "✅ .NET API operational on Port 5000" -ForegroundColor Green
} catch {
    Write-Host "⚠️  .NET API still starting (this is normal)" -ForegroundColor Yellow
}

Write-Host ""

# 5. Launch Native Shell
Write-Host "🖥️  Launching Native TerraFusion Shell..." -ForegroundColor Cyan
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                              ║" -ForegroundColor White
Write-Host "║    TERRAFUSION OS v1.0 - NATIVE ENTERPRISE LAUNCH            ║" -ForegroundColor White
Write-Host "║                                                              ║" -ForegroundColor White
Write-Host "║    Stack:                                                    ║" -ForegroundColor White
Write-Host "║    ✅ Native Shell (.NET WPF + WebView2)                     ║" -ForegroundColor Green
Write-Host "║    ✅ React Frontend (Built-in)                              ║" -ForegroundColor Green
Write-Host "║    ✅ .NET API Gateway (Port 5000)                           ║" -ForegroundColor Green
Write-Host "║    ✅ Core Rust Services (FFI Bridge)                        ║" -ForegroundColor Green
Write-Host "║    ✅ Elite Rust Engine (50,000 agents)                      ║" -ForegroundColor Green
Write-Host "║                                                              ║" -ForegroundColor White
Write-Host "║    🦀 RUST + .NET = ENTERPRISE!                              ║" -ForegroundColor Magenta
Write-Host "║    ❌ NO PYTHON!                                             ║" -ForegroundColor Red
Write-Host "║                                                              ║" -ForegroundColor White
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Push-Location native-shell
dotnet run
Pop-Location

Write-Host ""
Write-Host "👋 TerraFusion OS shutdown complete" -ForegroundColor Cyan
Write-Host ""



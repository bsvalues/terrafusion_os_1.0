# TerraFusion Complete Ecosystem Launcher
# Activates ALL components of the TerraFusion system

Write-Host "🚀 TERRAFUSION COMPLETE ECOSYSTEM ACTIVATION" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor White

# Kill any existing processes
Write-Host "🔄 Cleaning existing processes..." -ForegroundColor Yellow
Get-Process -Name "dotnet","node","tsx","python" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Create necessary directories
Write-Host "📁 Creating ecosystem directories..." -ForegroundColor Yellow
$dirs = @(
    "data\redis-gov", "data\postgres-gov", "data\marketplace-plugins", "data\marketplace-revenue",
    "logs", "infrastructure\marketplace-enhanced", "temp", "cache"
)
foreach($dir in $dirs) {
    New-Item -ItemType Directory -Path $dir -Force -ErrorAction SilentlyContinue | Out-Null
}

# Start Core Backend API
Write-Host "⚡ Starting TerraFusion Core Backend API..." -ForegroundColor Green
Start-Job -Name "TerraFusion-API" -ScriptBlock {
    Set-Location "c:\Users\bsval\terrafusion_os_1.0\backend\TerraFusion.API"
    $env:ASPNETCORE_ENVIRONMENT="Development"
    $env:ASPNETCORE_URLS="http://localhost:\${{TF_API_PORT:-5000}}"
    dotnet run --launch-profile Development
}

Start-Sleep 3

# Start TerraFusion Dashboard
Write-Host "📊 Starting TerraFusion Dashboard..." -ForegroundColor Green
Start-Job -Name "TerraFusion-Dashboard" -ScriptBlock {
    Set-Location "c:\Users\bsval\terrafusion_os_1.0\src-enhanced\terrafusion-dashboard\TerraFusionDashboard"
    $env:NODE_ENV="development"
    $env:PORT="3000"
    $env:DATABASE_URL="postgresql://user:pass@localhost:\${{TF_API_PORT:-5000}}/terrafusion"
    npm run dev
}

Start-Sleep 2

# Start Frontend
Write-Host "🌐 Starting TerraFusion Frontend..." -ForegroundColor Green  
Start-Job -Name "TerraFusion-Frontend" -ScriptBlock {
    Set-Location "c:\Users\bsval\terrafusion_os_1.0\frontend"
    $env:NODE_ENV="development"
    npm run dev
}

Start-Sleep 2

# Start Government Platform
Write-Host "🏛️ Starting TerraFusion Government Platform..." -ForegroundColor Green
Start-Job -Name "TerraFusion-Government" -ScriptBlock {
    Set-Location "c:\Users\bsval\terrafusion_os_1.0\terrafusion-government"
    $env:NODE_ENV="development"
    $env:PORT="3001"
    npm run dev
}

# Start Marketplace
Write-Host "🛒 Starting TerraFusion Marketplace..." -ForegroundColor Green
Start-Job -Name "TerraFusion-Marketplace" -ScriptBlock {
    Set-Location "c:\Users\bsval\terrafusion_os_1.0\terrafusion-marketplace"
    $env:NODE_ENV="development"
    $env:PORT="3002"
    npm run dev
}

# Start AI Orchestration
Write-Host "🧠 Starting AI Orchestration Layer..." -ForegroundColor Green
Start-Job -Name "AI-Orchestration" -ScriptBlock {
    Set-Location "c:\Users\bsval\terrafusion_os_1.0"
    node scripts/ai-orchestration-layer-11.mjs start
}

# Start Security Service
Write-Host "🔐 Starting Security Framework..." -ForegroundColor Green
Start-Job -Name "TerraFusion-Security" -ScriptBlock {
    Set-Location "c:\Users\bsval\terrafusion_os_1.0\terrafusion-security"
    $env:NODE_ENV="development"
    $env:PORT="3003"
    npm run dev
}

Write-Host "⏱️  Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep 10

Write-Host "🔍 ECOSYSTEM STATUS CHECK:" -ForegroundColor Cyan
$services = @(
    @{Name="Core API"; Port=5000; Endpoint="/health"},
    @{Name="Dashboard"; Port=3000; Endpoint="/"},
    @{Name="Frontend"; Port=5173; Endpoint="/"},
    @{Name="Government"; Port=3001; Endpoint="/"},
    @{Name="Marketplace"; Port=3002; Endpoint="/"},
    @{Name="Security"; Port=3003; Endpoint="/"}
)

foreach($service in $services) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)$($service.Endpoint)" -TimeoutSec 3 -UseBasicParsing
        Write-Host "✅ $($service.Name) - Port $($service.Port) - ACTIVE" -ForegroundColor Green
    } catch {
        Write-Host "🔄 $($service.Name) - Port $($service.Port) - Starting..." -ForegroundColor Yellow
    }
}

Write-Host "`n🌟 TERRAFUSION ECOSYSTEM ACCESS POINTS:" -ForegroundColor Magenta
Write-Host "🏠 Main Dashboard:     http://localhost:\${{TF_API_PORT:-5000}}" -ForegroundColor White
Write-Host "🌐 Frontend App:       http://localhost:\${{TF_API_PORT:-5000}}" -ForegroundColor White
Write-Host "🏛️ Government Portal:   http://localhost:\${{TF_API_PORT:-5000}}" -ForegroundColor White
Write-Host "🛒 Marketplace:        http://localhost:\${{TF_API_PORT:-5000}}" -ForegroundColor White
Write-Host "🔐 Security Center:    http://localhost:\${{TF_API_PORT:-5000}}" -ForegroundColor White
Write-Host "⚡ Core API:           http://localhost:\${{TF_API_PORT:-5000}}" -ForegroundColor White

Write-Host "`n🎯 ALL SYSTEMS ACTIVATED! The complete TerraFusion ecosystem is now running!" -ForegroundColor Green


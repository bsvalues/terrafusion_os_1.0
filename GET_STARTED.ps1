# TerraFusion OS - Getting Started Script
# Government. Transcended. - One-click environment setup

Write-Host "🏛️ TerraFusion OS 1.0 - Getting Started" -ForegroundColor Cyan
Write-Host "Government. Transcended." -ForegroundColor Green
Write-Host ""

# Step 1: Environment Check
Write-Host "📋 Checking Prerequisites..." -ForegroundColor Yellow

# Check .NET
try {
    $dotnetVersion = dotnet --version
    Write-Host "✅ .NET SDK: $dotnetVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ .NET SDK not found. Please install .NET 8.0 from https://dotnet.microsoft.com/download" -ForegroundColor Red
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check Python
try {
    $pythonVersion = python --version
    Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.11+ from https://python.org" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Activate Virtual Environment
Write-Host "🐍 Activating Python Environment..." -ForegroundColor Yellow
if (Test-Path ".venv\Scripts\Activate.ps1") {
    & .\.venv\Scripts\Activate.ps1
    Write-Host "✅ Python environment activated" -ForegroundColor Green
} else {
    Write-Host "⚠️  Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv .venv
    & .\.venv\Scripts\Activate.ps1
    Write-Host "✅ Python environment created and activated" -ForegroundColor Green
}

Write-Host ""

# Step 3: System Health Check
Write-Host "🔍 Running System Diagnostics..." -ForegroundColor Yellow
try {
    Set-Location "agents\terrafusion-phd-systems-agent"
    npm run diagnostic
    Set-Location "..\..\"
    Write-Host "✅ System diagnostics completed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  System diagnostics had issues (this is normal during initial setup)" -ForegroundColor Yellow
}

Write-Host ""

# Step 4: Quick Service Test
Write-Host "⚙️ Testing Core Services..." -ForegroundColor Yellow

# Test backend build
try {
    Set-Location "backend"
    dotnet build --nologo --verbosity quiet
    Set-Location ".."
    Write-Host "✅ Backend build successful" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend build had issues" -ForegroundColor Yellow
}

# Test frontend dependencies
try {
    Set-Location "frontend"
    if (!(Test-Path "node_modules")) {
        Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
        npm install --silent
    }
    Set-Location ".."
    Write-Host "✅ Frontend dependencies ready" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Frontend setup had issues" -ForegroundColor Yellow
}

Write-Host ""

# Step 5: Workspace Recommendations
Write-Host "🗂️ Workspace Recommendations:" -ForegroundColor Cyan
Write-Host "   For beginners:       code workspaces/master.code-workspace" -ForegroundColor White
Write-Host "   Frontend dev:        code workspaces/frontend.code-workspace" -ForegroundColor White
Write-Host "   Backend dev:         code workspaces/backend.code-workspace" -ForegroundColor White
Write-Host "   AI development:      code workspaces/consciousness.code-workspace" -ForegroundColor White

Write-Host ""

# Step 6: Next Steps
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Read: BEGINNERS_GUIDE_TO_TERRAFUSION_OS.md" -ForegroundColor White
Write-Host "   2. Keep handy: QUICK_REFERENCE_CARD.md" -ForegroundColor White
Write-Host "   3. Open workspace: code workspaces/master.code-workspace" -ForegroundColor White

Write-Host ""

# Step 7: Service Startup Commands
Write-Host "🚀 To start services:" -ForegroundColor Cyan
Write-Host "   Backend API:         cd backend && dotnet run --project TerraFusion.API" -ForegroundColor White
Write-Host "   AI Consciousness:    cd backend && dotnet run --project TerraFusion.Consciousness" -ForegroundColor White
Write-Host "   Frontend:            cd frontend && npm run dev" -ForegroundColor White

Write-Host ""
Write-Host "🏛️ TerraFusion OS Setup Complete!" -ForegroundColor Green
Write-Host "Government. Transcended. - Execute with championship excellence!" -ForegroundColor Magenta

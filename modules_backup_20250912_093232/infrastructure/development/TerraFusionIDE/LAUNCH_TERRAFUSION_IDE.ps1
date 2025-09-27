#!/usr/bin/env pwsh

<#
.SYNOPSIS
TerraFusion IDE - Production Launcher

.DESCRIPTION
Launches the TerraFusion IDE in production mode with full AI integration
#>

Write-Host "
╔═══════════════════════════════════════════════════════════════════════════════╗
║                           🚀 TERRAFUSION IDE                                 ║
║                   AI-Powered Government Development Environment               ║
║                                                                               ║
║  🏛️  Government-Grade Development Platform                                   ║
║  🤖  1,008 AI Agents Integration                                             ║
║  ⚡  Monaco Editor with County-Aware Features                               ║
║  🧠  Real-time AI Code Generation                                           ║
║                                                                               ║
║  🎯  Status: PRODUCTION READY                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
" -ForegroundColor Cyan

Write-Host "🎯 Starting TerraFusion IDE Production Environment..." -ForegroundColor Yellow

# Check if TerraFusion OS is running
$processes = Get-Process -Name "dotnet" -ErrorAction SilentlyContinue
$osRunning = $false

if ($processes) {
    $netstatOutput = netstat -ano | Select-String ":5000"
    if ($netstatOutput) {
        $osRunning = $true
        Write-Host "✅ TerraFusion OS detected running on port \${{TF_API_PORT:-5000}}" -ForegroundColor Green
    }
}

if (-not $osRunning) {
    Write-Host "⚠️  TerraFusion OS not detected. Starting OS services..." -ForegroundColor Yellow
    
    # Start TerraFusion OS in background
    Start-Process -FilePath "pwsh" -ArgumentList "-Command", "cd C:\Users\bsval\terrafusion_os_1.0; npm run dev" -WindowStyle Minimized
    
    Write-Host "🔄 Waiting for TerraFusion OS to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

# Navigate to IDE directory
Set-Location "C:\Users\bsval\terrafusion_os_1.0\modules\development\TerraFusionIDE"

Write-Host "🔧 Installing dependencies..." -ForegroundColor Yellow
npm install --silent

Write-Host "🏗️ Building production version..." -ForegroundColor Yellow
npm run build

Write-Host "🚀 Starting TerraFusion IDE..." -ForegroundColor Green
Write-Host ""
Write-Host "📊 Available Services:" -ForegroundColor Cyan
Write-Host "  🖥️  TerraFusion OS:     http://localhost:\${{TF_DESKTOP_PORT:-3003}}" -ForegroundColor White
Write-Host "  🏛️  TerraFusion API:    http://localhost:\${{TF_DESKTOP_PORT:-3003}}" -ForegroundColor White  
Write-Host "  💻  TerraFusion IDE:    http://localhost:\${{TF_DESKTOP_PORT:-3003}}" -ForegroundColor White
Write-Host ""
Write-Host "🎯 TerraFusion IDE Features:" -ForegroundColor Cyan
Write-Host "  • Monaco Editor with government autocomplete" -ForegroundColor White
Write-Host "  • 1,008 AI agents for code generation" -ForegroundColor White
Write-Host "  • Benton County data integration" -ForegroundColor White
Write-Host "  • Real-time development environment" -ForegroundColor White
Write-Host ""

# Start the IDE
npm run preview

Write-Host "🎉 TerraFusion IDE Production Environment Ready!" -ForegroundColor Green

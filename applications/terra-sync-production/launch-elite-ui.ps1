#!/usr/bin/env pwsh
<#
.SYNOPSIS
TerraFusion Elite Platform Launcher
Launch the new elite UI/UX for demonstration

.DESCRIPTION
Sets up environment variables and launches the TerraFusion platform
with the new government-grade Elite user interface.
#>

Write-Host "🚀 LAUNCHING TERRAFUSION ELITE PLATFORM" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor DarkGray

# Set environment variables for development
$env:DATABASE_URL = "sqlite:///terrafusionsync_elite.db"
$env:FLASK_ENV = "development"
$env:FLASK_DEBUG = "1"
$env:SESSION_SECRET = "terrafusion-elite-demo-secret"
$env:OLLAMA_URL = "http://localhost:11434"

Write-Host "✅ Environment configured for Elite demonstration" -ForegroundColor Green
Write-Host "   Database: SQLite (Demo Mode)" -ForegroundColor Gray
Write-Host "   Debug Mode: Enabled" -ForegroundColor Gray
Write-Host "   Elite UI: Active" -ForegroundColor Gray

Write-Host "`n🌟 ELITE UI/UX AVAILABLE AT:" -ForegroundColor Cyan
Write-Host "   🏠 Elite Home: http://localhost:5000/elite" -ForegroundColor Yellow
Write-Host "   📊 Elite Dashboard: http://localhost:5000/dashboard/elite" -ForegroundColor Yellow  
Write-Host "   🤖 AI Analysis: http://localhost:5000/ai-analysis/elite" -ForegroundColor Yellow
Write-Host "   🗺️  GIS Command: http://localhost:5000/gis/elite" -ForegroundColor Yellow

Write-Host "`n🔧 Starting Flask Application..." -ForegroundColor Cyan

# Launch the application
python app.py
# TerraFusionGama Development Startup Script
# This script starts both Next.js and Flask servers

Write-Host "🚀 Starting TerraFusionGama Development Environment" -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan; Write-Host ("=" * 60) -ForegroundColor Cyan

# Check if Node.js is installed
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if Python is installed
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python is not installed. Please install Python first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prerequisites check passed" -ForegroundColor Green
Write-Host ""

# Start Flask analytics server in background
Write-Host "🐍 Starting Flask Analytics Server (Port 5003)..." -ForegroundColor Yellow
$flaskJob = Start-Job -ScriptBlock {
    Set-Location "c:\Users\bsval\OneDrive\Desktop\from D\TerraFusionGama_PRODUCTION"
    python app.py
}
Start-Sleep -Seconds 2
Write-Host "✅ Flask server started (Job ID: $($flaskJob.Id))" -ForegroundColor Green
Write-Host ""

# Start Next.js development server
Write-Host "⚡ Starting Next.js Development Server (Port 3000)..." -ForegroundColor Yellow
Write-Host "   Press Ctrl+C to stop all servers" -ForegroundColor Gray
Write-Host ""

try {
    npm run dev
}
finally {
    # Cleanup: Stop Flask server when Next.js stops
    Write-Host ""
    Write-Host "🛑 Stopping Flask server..." -ForegroundColor Yellow
    Stop-Job -Job $flaskJob
    Remove-Job -Job $flaskJob
    Write-Host "✅ All servers stopped" -ForegroundColor Green
}

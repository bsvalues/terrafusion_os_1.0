# ═══════════════════════════════════════════════════════════════════════════
# TERRAFUSION OS - GENERATION 2 KERNEL LAUNCHER
# Connects to Docker PostgreSQL on port 5432
# ═══════════════════════════════════════════════════════════════════════════

Write-Host @"

═══════════════════════════════════════════════════════════════════════════════
  TERRAFUSION KERNEL - DIRECT LAUNCH PROTOCOL
═══════════════════════════════════════════════════════════════════════════════

"@ -ForegroundColor Cyan

$ErrorActionPreference = "Stop"

# 1. CLEANUP
Write-Host "[Step 1] Terminating stale processes..." -ForegroundColor Yellow
taskkill /F /IM deno.exe /T 2>$null | Out-Null
Start-Sleep -Seconds 1

# Kill anything on port 5000
$portCheck = netstat -ano | Select-String ":5000.*LISTENING"
if ($portCheck) {
    $pids = $portCheck | ForEach-Object {
        if ($_ -match '\s+(\d+)\s*$') { $matches[1] }
    } | Select-Object -Unique
    foreach ($pid in $pids) {
        if ($pid -and $pid -ne "0") {
            taskkill /F /PID $pid 2>$null | Out-Null
        }
    }
}
Write-Host "  ✅ Port 5000 cleared" -ForegroundColor Green

# 2. SECURE KEY INPUT
Write-Host ""
Write-Host "[Step 2] Neural Link Configuration" -ForegroundColor Yellow
Write-Host "  (Leave empty to run in HEURISTIC MODE)" -ForegroundColor Gray
$ApiKey = Read-Host -Prompt "Enter OpenAI API Key"

# 3. SET ENVIRONMENT
Write-Host ""
Write-Host "[Step 3] Configuring Environment..." -ForegroundColor Yellow

# Database - Using Docker PostgreSQL on port 5432
$env:POSTGRES_HOST = "localhost"
$env:POSTGRES_PORT = "5432"
$env:POSTGRES_DB = "terrafusion"
$env:POSTGRES_USER = "postgres"
$env:POSTGRES_PASSWORD = "postgres"

Write-Host "  ✅ Database: terrafusion@localhost:5432 (Docker)" -ForegroundColor Green

# OpenAI Key
if ($ApiKey -and $ApiKey.Length -gt 10) {
    $env:OPENAI_API_KEY = $ApiKey
    Write-Host "  ✅ OpenAI API Key: INJECTED" -ForegroundColor Green
    $aiMode = "GPT-4"
} else {
    $env:OPENAI_API_KEY = ""
    Write-Host "  ⚡ OpenAI API Key: NOT SET (Heuristic Mode)" -ForegroundColor Yellow
    $aiMode = "HEURISTIC"
}

# 4. LAUNCH KERNEL
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Magenta
if ($aiMode -eq "GPT-4") {
    Write-Host "  🧠 SOUL STATUS: AWAKENING (GPT-4 Neural Link)" -ForegroundColor Magenta
} else {
    Write-Host "  ⚡ SOUL STATUS: DORMANT (Heuristic Fallback)" -ForegroundColor Yellow
}
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""
Write-Host "  Kernel URL:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "  Health:      http://localhost:5000/api/health" -ForegroundColor Gray
Write-Host "  Database:    postgresql://localhost:5432/terrafusion" -ForegroundColor Gray
Write-Host ""
Write-Host "  Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

Set-Location "C:\Users\bsval\terrafusion_os_1.0\os-kernel\api"
deno run --allow-net --allow-env --allow-read main.ts

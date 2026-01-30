Write-Host "--- PROTOCOL: DATABASE INJECTION & BOOT ---" -ForegroundColor Cyan
$ErrorActionPreference = "Stop"

# 1. HARMONIZE (Force Canonical Path)
$Root = (Get-Location).Path
$Source = Join-Path $Root "applications/terra-permit-production"
$Dest = Join-Path $Root "applications/terra-permit"

if (Test-Path $Source) {
    Write-Host "[Action] Renaming to canonical ID: terra-permit" -ForegroundColor Yellow
    Move-Item -Path $Source -Destination $Dest -Force
} elseif (-not (Test-Path $Dest)) {
    Write-Error "CRITICAL: App not found at $Source or $Dest"
    exit 1
}

# 2. PROVISION DATABASE (Docker)
$ComposeFile = Join-Path $Root "deployment/compose/terra-permit.db.yml"
$ComposeContent = @'
services:
  terra-permit-db:
    image: postgres:16-alpine
    container_name: terra-permit-db
    environment:
      POSTGRES_DB: terra_permit
      POSTGRES_USER: terra_permit
      POSTGRES_PASSWORD: terra_permit_dev_pw
    ports:
      - "54326:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U terra_permit -d terra_permit"]
      interval: 5s
      timeout: 3s
      retries: 10
'@
if (-not (Test-Path "deployment/compose")) { New-Item -ItemType Directory "deployment/compose" -Force | Out-Null }
Set-Content -Path $ComposeFile -Value $ComposeContent
Write-Host "[Infrastructure] database definition created." -ForegroundColor Green

Write-Host "[Infrastructure] Booting Database Container..." -ForegroundColor Cyan
docker compose -f $ComposeFile up -d --wait
if ($LASTEXITCODE -ne 0) { Write-Error "Docker Boot Failed. Is Docker Desktop running?"; exit 1 }
Write-Host "✅ Database Active (Port 54326)" -ForegroundColor Green

# 3. INJECT CONFIGURATION (.env)
$EnvFile = Join-Path $Dest ".env"
$EnvContent = @"
NODE_ENV=development
PORT=3006
DATABASE_URL=postgresql://terra_permit:terra_permit_dev_pw@localhost:54326/terra_permit
"@
Set-Content -Path $EnvFile -Value $EnvContent
Write-Host "[Config] .env injected into application." -ForegroundColor Green

# 4. INITIALIZE SCHEMA (Drizzle Push)
Push-Location $Dest
Write-Host "`n[Schema] Pushing Database Schema..." -ForegroundColor Cyan
npm run db:push
if ($LASTEXITCODE -ne 0) { Write-Warning "Schema Push Failed. Check logs." }
else { Write-Host "✅ Schema Synchronized." -ForegroundColor Green }

# 5. LIVE FIRE TEST (Background Boot)
Write-Host "`n[Live Fire] Starting Application (Background)..." -ForegroundColor Cyan
$Job = Start-Job -ScriptBlock { 
    Set-Location $using:Dest
    npm run dev -- --port 3006 
}

# Wait for boot (10 seconds)
Start-Sleep -Seconds 10

# 6. VERIFY HEALTH
Write-Host "[Verification] Probing Health Endpoint..." -ForegroundColor Yellow
try {
    $Response = Invoke-RestMethod -Uri "http://localhost:3006/api/health" -ErrorAction Stop
    Write-Host "✅ HEALTH CONFIRMED: $($Response | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Error "❌ Health Probe Failed. App did not boot correctly."
    Receive-Job $Job
} finally {
    Stop-Job $Job
    Remove-Job $Job
}
Pop-Location

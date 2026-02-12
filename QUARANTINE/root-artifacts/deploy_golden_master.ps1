# TerraFusion OS - Golden Master Deployment Script
# Purpose: Builds and packages the Sovereign Capsule

Write-Host "🚀 INITIALIZING GOLDEN MASTER SEQUENCE..." -ForegroundColor Cyan

# 1. Environment Check
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Creating from template..." -ForegroundColor Yellow
    # Create valid dummy .env for build purposes if needed, or warn user
    "DB_CONNECTION_STRING=Host=postgres;Database=terrafusion;Username=postgres;Password=terrafusion_secure" | Out-File .env -Append
    "OPENAI_API_KEY=sk-placeholder" | Out-File .env -Append
    "DB_PASSWORD=terrafusion_secure" | Out-File .env -Append
}

# 2. Build Sequence
Write-Host "🏗️  Constructing The Body (Iron)..." -ForegroundColor Green
docker-compose -f docker-compose.prod.yml build api

Write-Host "🧠  Awakening The Brain (Cortex)..." -ForegroundColor Green
docker-compose -f docker-compose.prod.yml build cortex

Write-Host "✨  Polishing The Soul (Frontend)..." -ForegroundColor Green
docker-compose -f docker-compose.prod.yml build frontend

# 3. Final Output
Write-Host "✅  GOLDEN MASTER CONSTRUCTED." -ForegroundColor Cyan
Write-Host "---------------------------------------------------"
Write-Host " To Launch The Sovereign Capsule:"
Write-Host " > docker-compose -f docker-compose.prod.yml up -d"
Write-Host "---------------------------------------------------"

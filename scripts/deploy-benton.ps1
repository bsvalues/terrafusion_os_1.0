# TerraFusion OS 1.0 - Benton County Demo Deployment (PowerShell)
param(
    [switch]$Force
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Benton County TerraFusion Demo Deployment" -ForegroundColor Green

# Create environment file if it doesn't exist
if (-not (Test-Path ".env.benton") -or $Force) {
    Copy-Item ".env.benton.example" ".env.benton" -Force
    Write-Host "✅ Created .env.benton from template" -ForegroundColor Green
}

# Create Docker network
try {
    docker network create --subnet 172.30.10.0/24 terrafusion_demo 2>$null
    Write-Host "✅ Created Docker network: terrafusion_demo" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  Docker network terrafusion_demo already exists" -ForegroundColor Yellow
}

# Create artifacts directory
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$artifactsDir = "artifacts/benton/$timestamp"
New-Item -ItemType Directory -Path $artifactsDir -Force | Out-Null
Write-Host "✅ Created artifacts directory: $artifactsDir" -ForegroundColor Green

# Start database and Redis first
Write-Host "🗄️  Starting database and Redis..." -ForegroundColor Cyan
docker compose -f compose/docker-compose.demo.yml up -d db redis

# Wait for database to be ready
Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
do {
    $attempt++
    Start-Sleep -Seconds 2
    $dbReady = docker exec terrafusion_benton-db-1 pg_isready -U terrafusion 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database is ready!" -ForegroundColor Green
        break
    }
    if ($attempt -ge $maxAttempts) {
        Write-Host "❌ Database failed to start after $maxAttempts attempts" -ForegroundColor Red
        exit 1
    }
} while ($true)

# Start all services
Write-Host "🚀 Starting all services..." -ForegroundColor Cyan
docker compose -f compose/docker-compose.demo.yml up -d

# Wait a moment for services to start
Start-Sleep -Seconds 10

# Check service status
Write-Host "📊 Checking service status..." -ForegroundColor Cyan
docker compose -f compose/docker-compose.demo.yml ps

Write-Host ""
Write-Host "🎉 Benton County Demo Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Access Points:" -ForegroundColor Cyan
Write-Host "  UI:        http://localhost:\${{TF_FRONTEND_PORT:-3000}}" -ForegroundColor White
Write-Host "  API:       http://localhost:\${{TF_FRONTEND_PORT:-3000}}" -ForegroundColor White
Write-Host "  Grafana:   http://localhost:\${{TF_FRONTEND_PORT:-3000}}" -ForegroundColor White
Write-Host "  Prometheus:http://localhost:\${{TF_FRONTEND_PORT:-3000}}" -ForegroundColor White
Write-Host ""
Write-Host "📁 Artifacts saved to: $artifactsDir" -ForegroundColor Yellow
Write-Host ""
Write-Host "🛑 To stop: docker compose -f compose/docker-compose.demo.yml down" -ForegroundColor Red

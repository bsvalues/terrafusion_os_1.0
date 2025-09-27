# TerraFusion OS 1.0 - Benton County Demo (Fixed)
param([switch]$Force)

Write-Host "🚀 TerraFusion Benton County Deployment" -ForegroundColor Green

# Check if Docker is running
try {
    docker version | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Desktop is not running. Please start Docker Desktop first." -ForegroundColor Red
    Write-Host "   Then run this script again." -ForegroundColor Yellow
    exit 1
}

# Load environment variables from .env.benton
if (Test-Path ".env.benton") {
    Write-Host "📋 Loading environment variables from .env.benton" -ForegroundColor Cyan
    Get-Content ".env.benton" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
            Write-Host "  Set: $($matches[1])" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "❌ .env.benton file not found" -ForegroundColor Red
    exit 1
}

# Create network (ignore if exists)
Write-Host "🌐 Creating Docker network..." -ForegroundColor Cyan
docker network create --subnet 172.30.10.0/24 terrafusion_demo 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Network created" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Network already exists" -ForegroundColor Yellow
}

# Start services with environment variables
Write-Host "🚀 Starting services..." -ForegroundColor Cyan
$env:COMPOSE_PROJECT_NAME = "terrafusion_benton"

# Start database first
docker compose -f compose/docker-compose.demo.yml --env-file .env.benton up -d db redis

Write-Host "⏳ Waiting for database..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Start all services
docker compose -f compose/docker-compose.demo.yml --env-file .env.benton up -d

# Show status
Write-Host "📊 Service Status:" -ForegroundColor Cyan
docker compose -f compose/docker-compose.demo.yml --env-file .env.benton ps

Write-Host ""
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "📊 Access Points:" -ForegroundColor Cyan
Write-Host "  UI:        http://localhost:\${{TF_FRONTEND_PORT:-3000}}" -ForegroundColor White
Write-Host "  API:       http://localhost:\${{TF_FRONTEND_PORT:-3000}}" -ForegroundColor White
Write-Host "  Grafana:   http://localhost:\${{TF_FRONTEND_PORT:-3000}}" -ForegroundColor White
Write-Host "  Prometheus:http://localhost:\${{TF_FRONTEND_PORT:-3000}}" -ForegroundColor White

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  TerraFusion OS 1.0 - PROPER DEPLOYMENT" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

Write-Host "🤦‍♂️ We've been doing this wrong! Let's use the containerized infrastructure!" -ForegroundColor Yellow
Write-Host ""

function Show-Available-Deployments {
    Write-Host "📋 Available Docker Deployments:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. 🚀 ENHANCED DEVELOPMENT (Recommended)" -ForegroundColor Green
    Write-Host "   - Full stack with monitoring, security, AI swarm"
    Write-Host "   - PostgreSQL, Redis, Prometheus, Grafana"
    Write-Host "   - Hot reload, debugging, health checks"
    Write-Host "   File: docker-compose.dev.enhanced.yml"
    Write-Host ""
    
    Write-Host "2. 🏭 PRODUCTION DEPLOYMENT" -ForegroundColor Blue
    Write-Host "   - Government-grade security and performance"
    Write-Host "   - Load balancing, auto-scaling, ELK stack"
    Write-Host "   - 1,008 AI agents, quantum optimization"
    Write-Host "   File: docker-compose.production.yml"
    Write-Host ""
    
    Write-Host "3. ⚡ QUICK DEMO" -ForegroundColor Yellow
    Write-Host "   - Simple Benton County demo"
    Write-Host "   - PostgreSQL, Redis, basic monitoring"
    Write-Host "   File: compose/docker-compose.demo.yml"
    Write-Host ""
}

function Start-Enhanced-Development {
    Write-Host "🚀 Starting Enhanced Development Environment..." -ForegroundColor Green
    Write-Host ""
    
    # Check if Docker is running
    try {
        docker info | Out-Null
    }
    catch {
        Write-Host "❌ Docker is not running! Please start Docker Desktop." -ForegroundColor Red
        exit 1
    }
    
    # Create required directories
    $dirs = @("logs", "monitoring/grafana/dashboards", "monitoring/grafana/datasources", "database/init")
    foreach ($dir in $dirs) {
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Host "📁 Created directory: $dir" -ForegroundColor Gray
        }
    }
    
    # Create environment file if it doesn't exist
    if (!(Test-Path ".env")) {
        $envContent = @"
# TerraFusion OS Development Environment
DB_NAME=terrafusion_dev
DB_USER=terrafusion
DB_PASSWORD=dev_password_2024
REDIS_PASSWORD=redis_dev_password
AI_SWARM_SIZE=1008
QUANTUM_ENABLED=true
BENTON_COUNTY_MODE=true
"@
        $envContent | Out-File -FilePath ".env" -Encoding UTF8
        Write-Host "📝 Created .env file" -ForegroundColor Gray
    }
    
    Write-Host "🐳 Starting Docker containers..." -ForegroundColor Yellow
    docker-compose -f docker-compose.dev.enhanced.yml up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ TerraFusion OS Enhanced Development Environment Started!" -ForegroundColor Green
        Write-Host ""
        Show-Service-Status
    }
    else {
        Write-Host "❌ Failed to start containers" -ForegroundColor Red
        exit 1
    }
}

function Start-Production {
    Write-Host "🏭 Starting Production Environment..." -ForegroundColor Blue
    Write-Host ""
    
    # Check for required environment variables
    $requiredVars = @("DB_PASSWORD", "JWT_SECRET_KEY", "ENCRYPTION_KEY", "GRAFANA_ADMIN_PASSWORD")
    $missing = @()
    
    foreach ($var in $requiredVars) {
        if (!(Get-ChildItem Env: | Where-Object Name -eq $var)) {
            $missing += $var
        }
    }
    
    if ($missing.Count -gt 0) {
        Write-Host "❌ Missing required environment variables:" -ForegroundColor Red
        $missing | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
        Write-Host ""
        Write-Host "Please set these variables or create a .env.production file" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "🐳 Starting production containers..." -ForegroundColor Yellow
    docker-compose -f docker-compose.production.yml up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ TerraFusion OS Production Environment Started!" -ForegroundColor Green
        Write-Host ""
        Show-Service-Status
    }
    else {
        Write-Host "❌ Failed to start production containers" -ForegroundColor Red
        exit 1
    }
}

function Start-Demo {
    Write-Host "⚡ Starting Quick Demo..." -ForegroundColor Yellow
    Write-Host ""
    
    # Create demo network
    docker network create terrafusion_demo 2>$null
    
    # Set demo environment variables
    $env:POSTGRES_USER = "demo"
    $env:POSTGRES_PASSWORD = "demo123"
    $env:POSTGRES_DB = "terrafusion_demo"
    
    Write-Host "🐳 Starting demo containers..." -ForegroundColor Yellow
    docker-compose -f compose/docker-compose.demo.yml up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ TerraFusion OS Demo Started!" -ForegroundColor Green
        Write-Host ""
        Show-Service-Status
    }
    else {
        Write-Host "❌ Failed to start demo containers" -ForegroundColor Red
        exit 1
    }
}

function Show-Service-Status {
    Write-Host "🌐 Service URLs:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Frontend:          http://localhost:\${{TF_FRONTEND_PORT:-3000}}" -ForegroundColor Green
    Write-Host "Backend API:       http://localhost:\${{TF_FRONTEND_PORT:-3000}}" -ForegroundColor Green
    Write-Host "Health Check:      http://localhost:\${{TF_FRONTEND_PORT:-3000}}/health" -ForegroundColor Green
    Write-Host "API Test:          http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api/test" -ForegroundColor Green
    Write-Host "Grafana:           http://localhost:\${{TF_FRONTEND_PORT:-3000}} (admin/terrafusion_dev_2024)" -ForegroundColor Blue
    Write-Host "Prometheus:        http://localhost:\${{TF_FRONTEND_PORT:-3000}}" -ForegroundColor Blue
    Write-Host "Database:          localhost:\${{TF_FRONTEND_PORT:-3000}}" -ForegroundColor Gray
    Write-Host "Redis:             localhost:\${{TF_FRONTEND_PORT:-3000}}" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "📊 Container Status:" -ForegroundColor Cyan
    docker-compose -f docker-compose.dev.enhanced.yml ps
    
    Write-Host ""
    Write-Host "🔍 To view logs: docker-compose -f docker-compose.dev.enhanced.yml logs -f [service]" -ForegroundColor Gray
    Write-Host "🛑 To stop: docker-compose -f docker-compose.dev.enhanced.yml down" -ForegroundColor Gray
    Write-Host ""
}

function Show-Menu {
    Show-Available-Deployments
    
    do {
        Write-Host "Please select deployment type (1-3): " -NoNewline -ForegroundColor White
        $choice = Read-Host
        
        switch ($choice) {
            "1" { 
                Start-Enhanced-Development
                return
            }
            "2" { 
                Start-Production
                return
            }
            "3" { 
                Start-Demo
                return
            }
            default { 
                Write-Host "Invalid choice. Please enter 1, 2, or 3." -ForegroundColor Red
            }
        }
    } while ($true)
}

# Check if Docker Compose file exists
if (Test-Path "docker-compose.dev.enhanced.yml") {
    Show-Menu
}
else {
    Write-Host "❌ Docker Compose files not found!" -ForegroundColor Red
    Write-Host "Please ensure you're in the TerraFusion OS root directory." -ForegroundColor Yellow
    exit 1
}

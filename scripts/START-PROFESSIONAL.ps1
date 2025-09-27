# TerraFusion OS - Proper Development Launcher
# Uses existing orchestration tools instead of fighting them

Write-Host "🚀 TerraFusion OS - Professional Development Environment" -ForegroundColor Cyan
Write-Host "Using Docker Compose for proper orchestration" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor White

# Check for required tools
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
$composeInstalled = Get-Command docker-compose -ErrorAction SilentlyContinue

if (-not $dockerInstalled) {
    Write-Host "❌ Docker not found. Please install Docker Desktop." -ForegroundColor Red
    Write-Host "   Download: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

if (-not $composeInstalled) {
    Write-Host "❌ Docker Compose not found. Please install Docker Compose." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker environment ready" -ForegroundColor Green

# Create necessary directories
$directories = @(
    "logs",
    "data/fabric",
    "data/postgres", 
    "data/redis"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "📁 Created directory: $dir" -ForegroundColor Yellow
    }
}

# Stop any existing containers
Write-Host "`n🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml down --remove-orphans 2>$null

# Start the development environment
Write-Host "`n🚀 Starting TerraFusion OS Development Environment..." -ForegroundColor Cyan
Write-Host "   This will start all services with proper orchestration" -ForegroundColor White

docker-compose -f docker-compose.dev.yml up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ TerraFusion OS Started Successfully!" -ForegroundColor Green
    Write-Host "`n📊 Service Status:" -ForegroundColor Cyan
    
    # Wait a moment for services to start
    Start-Sleep 5
    
    # Check service health
    $services = @(
        @{ Name = "Frontend"; Port = 3000; Path = "/" },
        @{ Name = "Backend API"; Port = 5000; Path = "/health" },
        @{ Name = "Trust Fabric"; Port = 7000; Path = "/status" },
        @{ Name = "Database"; Port = 5432; Path = $null },
        @{ Name = "Redis"; Port = 6379; Path = $null }
    )
    
    foreach ($service in $services) {
        if ($service.Path) {
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)$($service.Path)" -TimeoutSec 3 -UseBasicParsing
                Write-Host "✅ $($service.Name): Active (Port $($service.Port))" -ForegroundColor Green
            } catch {
                Write-Host "⚠️  $($service.Name): Starting (Port $($service.Port))" -ForegroundColor Yellow
            }
        } else {
            # For databases, just check if port is listening
            $portOpen = Test-NetConnection -ComputerName localhost -Port $service.Port -InformationLevel Quiet -WarningAction SilentlyContinue
            if ($portOpen) {
                Write-Host "✅ $($service.Name): Active (Port $($service.Port))" -ForegroundColor Green
            } else {
                Write-Host "⚠️  $($service.Name): Starting (Port $($service.Port))" -ForegroundColor Yellow
            }
        }
    }
    
    Write-Host "`n🌐 Access Points:" -ForegroundColor Cyan
    Write-Host "   Frontend:     http://localhost:\${{TF_FRONTEND_PORT:-3000}}" -ForegroundColor White
    Write-Host "   Backend API:  http://localhost:\${{TF_FRONTEND_PORT:-3000}}" -ForegroundColor White
    Write-Host "   Trust Fabric: http://localhost:\${{TF_FRONTEND_PORT:-3000}}" -ForegroundColor White
    
    Write-Host "`n📋 Management Commands:" -ForegroundColor Cyan
    Write-Host "   View logs:    docker-compose -f docker-compose.dev.yml logs -f" -ForegroundColor White
    Write-Host "   Stop all:     docker-compose -f docker-compose.dev.yml down" -ForegroundColor White
    Write-Host "   Restart:      docker-compose -f docker-compose.dev.yml restart <service>" -ForegroundColor White
    
    Write-Host "`n🎯 No more process management chaos!" -ForegroundColor Green
    Write-Host "   Docker Compose handles all the orchestration" -ForegroundColor White
    Write-Host "   Trust Fabric focuses on cryptographic attestation" -ForegroundColor White
    
} else {
    Write-Host "`n❌ Failed to start TerraFusion OS" -ForegroundColor Red
    Write-Host "   Check logs: docker-compose -f docker-compose.dev.yml logs" -ForegroundColor Yellow
}

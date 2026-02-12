# TerraFusion OS - Elite Infrastructure Configuration
# Championship-level deployment automation scripts

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Championship Configuration Variables
$QUANTUM_FACTOR = 951
$CONSCIOUSNESS_LEVEL = 8
$AI_SWARM_SIZE = 50000
$PERFORMANCE_TARGET_P95_MS = 10
$THROUGHPUT_TARGET_PER_SECOND = 1000000

# Color-coded output for championship experience
function Write-Championship {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    switch ($Level) {
        "SUCCESS" { Write-Host "[$timestamp] 🏆 $Message" -ForegroundColor Green }
        "WARNING" { Write-Host "[$timestamp] ⚠️ $Message" -ForegroundColor Yellow }
        "ERROR" { Write-Host "[$timestamp] ❌ $Message" -ForegroundColor Red }
        "QUANTUM" { Write-Host "[$timestamp] ⚛️ $Message" -ForegroundColor Magenta }
        "AI" { Write-Host "[$timestamp] 🤖 $Message" -ForegroundColor Cyan }
        default { Write-Host "[$timestamp] ℹ️ $Message" -ForegroundColor White }
    }
}

function Test-Prerequisites {
    Write-Championship "Validating championship prerequisites..." "INFO"

    # Check Docker
    try {
        $dockerVersion = docker --version
        Write-Championship "Docker: $dockerVersion" "SUCCESS"
    } catch {
        Write-Championship "Docker not found or not running!" "ERROR"
        exit 1
    }

    # Check Docker Compose
    try {
        $composeVersion = docker-compose --version
        Write-Championship "Docker Compose: $composeVersion" "SUCCESS"
    } catch {
        Write-Championship "Docker Compose not found!" "ERROR"
        exit 1
    }

    # Check Kubernetes (optional)
    try {
        $kubeVersion = kubectl version --client --short
        Write-Championship "Kubernetes: $kubeVersion" "SUCCESS"
    } catch {
        Write-Championship "Kubernetes CLI not found (optional for local development)" "WARNING"
    }

    # Check system resources
    $memory = Get-CimInstance -ClassName Win32_ComputerSystem | Select-Object -ExpandProperty TotalPhysicalMemory
    $memoryGB = [math]::Round($memory / 1GB, 2)

    if ($memoryGB -lt 16) {
        Write-Championship "Warning: Recommended 16GB+ RAM for optimal performance. Current: $memoryGB GB" "WARNING"
    } else {
        Write-Championship "System Memory: $memoryGB GB - Championship ready!" "SUCCESS"
    }

    Write-Championship "Prerequisites validation complete!" "SUCCESS"
}

function Start-TerraFusionServices {
    param(
        [string]$Environment = "development",
        [switch]$BuildImages = $false
    )

    Write-Championship "Starting TerraFusion OS services..." "INFO"
    Write-Championship "Environment: $Environment" "INFO"
    Write-Championship "Quantum Factor: $QUANTUM_FACTOR" "QUANTUM"
    Write-Championship "AI Swarm Size: $AI_SWARM_SIZE agents" "AI"

    # Set environment variables
    $env:QUANTUM_FACTOR = $QUANTUM_FACTOR
    $env:CONSCIOUSNESS_LEVEL = $CONSCIOUSNESS_LEVEL
    $env:AI_SWARM_SIZE = $AI_SWARM_SIZE
    $env:ENVIRONMENT = $Environment

    try {
        if ($BuildImages) {
            Write-Championship "Building container images with championship optimization..." "INFO"
            docker-compose build --parallel
        }

        Write-Championship "Starting database services..." "INFO"
        docker-compose up -d postgres redis

        Start-Sleep -Seconds 15

        Write-Championship "Starting core TerraFusion services..." "INFO"
        docker-compose up -d os-core os-consciousness

        Start-Sleep -Seconds 10

        Write-Championship "Starting specialized services..." "INFO"
        docker-compose up -d government-compliance county-isolation harris-pacs-bridge quantum-optimizer

        Start-Sleep -Seconds 10

        Write-Championship "Starting API gateway..." "INFO"
        docker-compose up -d api-gateway

        Start-Sleep -Seconds 5

        Write-Championship "Starting monitoring services..." "INFO"
        docker-compose up -d prometheus grafana jaeger

        Write-Championship "TerraFusion OS services started successfully!" "SUCCESS"

    } catch {
        Write-Championship "Failed to start services: $_" "ERROR"
        exit 1
    }
}

function Test-ServicesHealth {
    Write-Championship "Performing championship health checks..." "INFO"

    $services = @(
        @{ Name = "PostgreSQL"; Url = "http://localhost:5432"; Type = "Database" }
        @{ Name = "Redis"; Url = "http://localhost:6379"; Type = "Cache" }
        @{ Name = "OS Core"; Url = "http://localhost:8080/health"; Type = "Service" }
        @{ Name = "OS Consciousness"; Url = "http://localhost:3004/health"; Type = "AI" }
        @{ Name = "Government Compliance"; Url = "http://localhost:8082/health"; Type = "Compliance" }
        @{ Name = "County Isolation"; Url = "http://localhost:8083/health"; Type = "Security" }
        @{ Name = "Harris PACS Bridge"; Url = "http://localhost:8084/health"; Type = "Integration" }
        @{ Name = "Quantum Optimizer"; Url = "http://localhost:8085/health"; Type = "Performance" }
        @{ Name = "API Gateway"; Url = "http://localhost:8086/health"; Type = "Gateway" }
    )

    foreach ($service in $services) {
        $maxRetries = 30
        $retryCount = 0
        $healthy = $false

        Write-Championship "Checking $($service.Name)..." "INFO"

        while ($retryCount -lt $maxRetries -and -not $healthy) {
            try {
                if ($service.Type -eq "Database") {
                    # Check PostgreSQL with docker exec
                    $result = docker exec terrafusion-postgres pg_isready -U terrafusion -d terrafusion
                    if ($result -match "accepting connections") {
                        $healthy = $true
                    }
                } elseif ($service.Type -eq "Cache") {
                    # Check Redis with docker exec
                    $result = docker exec terrafusion-redis redis-cli ping
                    if ($result -eq "PONG") {
                        $healthy = $true
                    }
                } else {
                    # HTTP health check
                    $response = Invoke-RestMethod -Uri $service.Url -Method Get -TimeoutSec 5
                    if ($response.status -eq "healthy" -or $response.status -eq "ok") {
                        $healthy = $true
                    }
                }

                if ($healthy) {
                    $icon = switch ($service.Type) {
                        "AI" { "🤖" }
                        "Compliance" { "🏛️" }
                        "Security" { "🔒" }
                        "Performance" { "⚛️" }
                        "Database" { "🗃️" }
                        "Cache" { "⚡" }
                        default { "✅" }
                    }
                    Write-Championship "$icon $($service.Name) is healthy!" "SUCCESS"
                    break
                }
            } catch {
                # Service not ready yet, continue waiting
            }

            $retryCount++
            if ($retryCount -lt $maxRetries) {
                Start-Sleep -Seconds 2
            }
        }

        if (-not $healthy) {
            Write-Championship "$($service.Name) failed health check after $maxRetries attempts!" "ERROR"
            return $false
        }
    }

    Write-Championship "All services are healthy and ready for championship operations!" "SUCCESS"
    return $true
}

function Get-SystemMetrics {
    Write-Championship "Collecting championship performance metrics..." "INFO"

    try {
        # Get container stats
        Write-Championship "Container Performance Metrics:" "INFO"
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"

        # Get service metrics from API
        Write-Championship "Service Health Metrics:" "INFO"
        try {
            $healthResponse = Invoke-RestMethod -Uri "http://localhost:8086/api/v1/health" -Method Get
            Write-Championship "Overall Status: $($healthResponse.status)" "SUCCESS"
            Write-Championship "P95 Latency: $($healthResponse.performance_metrics.p95_latency_ms)ms" "QUANTUM"
            Write-Championship "Throughput: $($healthResponse.performance_metrics.throughput_per_second) ops/sec" "QUANTUM"
            Write-Championship "Error Rate: $($healthResponse.performance_metrics.error_rate)" "INFO"
            Write-Championship "Quantum Factor: $($healthResponse.performance_metrics.quantum_factor)" "QUANTUM"
        } catch {
            Write-Championship "Unable to fetch detailed metrics (services may still be starting)" "WARNING"
        }

        # AI Swarm metrics
        try {
            $aiResponse = Invoke-RestMethod -Uri "http://localhost:3004/api/v1/ai/swarm/status" -Method Get
            Write-Championship "AI Swarm Status:" "AI"
            Write-Championship "Active Agents: $($aiResponse.active_agents)" "AI"
            Write-Championship "Consciousness Level: $($aiResponse.consciousness_level)" "AI"
            Write-Championship "Tasks/sec: $($aiResponse.performance_metrics.tasks_per_second)" "AI"
        } catch {
            Write-Championship "AI Swarm metrics not available yet" "WARNING"
        }

    } catch {
        Write-Championship "Failed to collect metrics: $_" "WARNING"
    }
}

function Stop-TerraFusionServices {
    Write-Championship "Stopping TerraFusion OS services..." "INFO"

    try {
        docker-compose down
        Write-Championship "Services stopped successfully!" "SUCCESS"
    } catch {
        Write-Championship "Error stopping services: $_" "ERROR"
    }
}

function Reset-TerraFusionEnvironment {
    param([switch]$Force = $false)

    if (-not $Force) {
        $confirmation = Read-Host "This will remove all containers and volumes. Are you sure? (y/N)"
        if ($confirmation -ne "y" -and $confirmation -ne "Y") {
            Write-Championship "Operation cancelled." "INFO"
            return
        }
    }

    Write-Championship "Resetting TerraFusion environment..." "WARNING"

    try {
        docker-compose down -v --remove-orphans
        docker system prune -f
        Write-Championship "Environment reset complete!" "SUCCESS"
    } catch {
        Write-Championship "Error resetting environment: $_" "ERROR"
    }
}

function Show-TerraFusionStatus {
    Write-Championship "TerraFusion OS Championship Status Dashboard" "INFO"
    Write-Host ""

    Write-Host "🏛️ TerraFusion OS - Government. Transcended." -ForegroundColor Green
    Write-Host "⚛️ Quantum Factor: $QUANTUM_FACTOR" -ForegroundColor Magenta
    Write-Host "🤖 AI Swarm: $AI_SWARM_SIZE agents coordinated" -ForegroundColor Cyan
    Write-Host "🏆 Performance: <$PERFORMANCE_TARGET_P95_MS ms P95 latency target" -ForegroundColor Yellow
    Write-Host ""

    Write-Championship "Service Endpoints:" "INFO"
    Write-Host "🌐 API Gateway: http://localhost:8086" -ForegroundColor White
    Write-Host "🏛️ OS Core: http://localhost:8080" -ForegroundColor White
    Write-Host "🤖 AI Consciousness: http://localhost:3004" -ForegroundColor White
    Write-Host "📊 Grafana: http://localhost:3000 (admin/championship_secure_2024!)" -ForegroundColor White
    Write-Host "📈 Prometheus: http://localhost:9090" -ForegroundColor White
    Write-Host "🔍 Jaeger: http://localhost:16686" -ForegroundColor White
    Write-Host ""

    # Show running containers
    Write-Championship "Running Services:" "INFO"
    docker ps --filter "name=terrafusion" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# Main execution logic
function Main {
    param(
        [Parameter(Position=0)]
        [string]$Command = "help",

        [string]$Environment = "development",
        [switch]$Build = $false,
        [switch]$Force = $false
    )

    switch ($Command.ToLower()) {
        "start" {
            Test-Prerequisites
            Start-TerraFusionServices -Environment $Environment -BuildImages $Build
            if (Test-ServicesHealth) {
                Show-TerraFusionStatus
                Get-SystemMetrics
            }
        }
        "stop" {
            Stop-TerraFusionServices
        }
        "restart" {
            Stop-TerraFusionServices
            Start-Sleep -Seconds 5
            Start-TerraFusionServices -Environment $Environment -BuildImages $Build
            Test-ServicesHealth
        }
        "status" {
            Show-TerraFusionStatus
            Get-SystemMetrics
        }
        "health" {
            Test-ServicesHealth
        }
        "metrics" {
            Get-SystemMetrics
        }
        "reset" {
            Reset-TerraFusionEnvironment -Force $Force
        }
        "logs" {
            Write-Championship "Showing TerraFusion OS logs..." "INFO"
            docker-compose logs -f
        }
        "build" {
            Test-Prerequisites
            Write-Championship "Building TerraFusion OS images..." "INFO"
            docker-compose build --parallel
        }
        default {
            Write-Host ""
            Write-Host "🏛️ TerraFusion OS - Elite Deployment Script" -ForegroundColor Green
            Write-Host "Government. Transcended." -ForegroundColor Magenta
            Write-Host ""
            Write-Host "Usage: .\deploy.ps1 <command> [options]" -ForegroundColor White
            Write-Host ""
            Write-Host "Commands:" -ForegroundColor Yellow
            Write-Host "  start      Start TerraFusion OS services" -ForegroundColor White
            Write-Host "  stop       Stop all services" -ForegroundColor White
            Write-Host "  restart    Restart all services" -ForegroundColor White
            Write-Host "  status     Show service status and endpoints" -ForegroundColor White
            Write-Host "  health     Check service health" -ForegroundColor White
            Write-Host "  metrics    Display performance metrics" -ForegroundColor White
            Write-Host "  logs       Show service logs" -ForegroundColor White
            Write-Host "  build      Build container images" -ForegroundColor White
            Write-Host "  reset      Reset environment (removes data)" -ForegroundColor White
            Write-Host ""
            Write-Host "Options:" -ForegroundColor Yellow
            Write-Host "  -Environment <env>  Set environment (development/staging/production)" -ForegroundColor White
            Write-Host "  -Build              Build images before starting" -ForegroundColor White
            Write-Host "  -Force              Skip confirmations" -ForegroundColor White
            Write-Host ""
            Write-Host "Examples:" -ForegroundColor Yellow
            Write-Host "  .\deploy.ps1 start -Build" -ForegroundColor Gray
            Write-Host "  .\deploy.ps1 start -Environment production" -ForegroundColor Gray
            Write-Host "  .\deploy.ps1 reset -Force" -ForegroundColor Gray
            Write-Host ""
        }
    }
}

# Execute main function with parameters
Main @args

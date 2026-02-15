# TerraFusion OS — Start Day 1 Dependencies
#
# Starts required services for Day 1-7 SLO burn capture:
#   - Grafana (dashboard)
#   - Prometheus (metrics)
#   - TerraFusion API (health checks)
#
# Classification: Government Operations — FISMA-HIGH

param(
    [switch]$Force,  # Force restart even if already running
    [int]$WaitSeconds = 30  # Seconds to wait for services to start
)

$ErrorActionPreference = "Stop"

# ===== Configuration =====

$REPO_ROOT = Split-Path -Parent $PSScriptRoot
$COMPOSE_FILE = Join-Path $REPO_ROOT "compose\docker-compose.yml"
$COMPOSE_FILE_MONITORING = Join-Path $REPO_ROOT "compose\docker-compose.monitoring.yml"

$SERVICES = @("grafana", "prometheus", "backend")

# ===== Helper Functions =====

function Write-Step {
    param([string]$Message)
    Write-Host "`n▶️  $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "   ✅ $Message" -ForegroundColor Green
}

function Write-Failure {
    param([string]$Message)
    Write-Host "   ❌ $Message" -ForegroundColor Red
}

function Test-ServiceRunning {
    param([string]$ServiceName)
    
    $running = docker ps --filter "name=$ServiceName" --filter "status=running" --format "{{.Names}}" 2>$null
    return ($running -like "*$ServiceName*")
}

function Test-ServiceHealth {
    param([string]$Url)
    
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        return ($response.StatusCode -eq 200)
    } catch {
        return $false
    }
}

# ===== Main Execution =====

Write-Host "`n🚀 TerraFusion OS — Day 1 Dependencies Startup"
Write-Host "=============================================="
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n"

# Check if Docker is running
Write-Step "Checking Docker availability..."

try {
    docker info 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Failure "Docker not running"
        Write-Host "`nAction required: Start Docker Desktop"
        exit 1
    }
    Write-Success "Docker is running"
} catch {
    Write-Failure "Docker not found or not accessible"
    Write-Host "`nAction required: Install Docker Desktop or start Docker daemon"
    exit 1
}

# Check if docker-compose files exist
if (-not (Test-Path $COMPOSE_FILE)) {
    Write-Failure "docker-compose.yml not found at $COMPOSE_FILE"
    Write-Host "`nAction required: Ensure you're running from repository root"
    exit 1
}

if (-not (Test-Path $COMPOSE_FILE_MONITORING)) {
    Write-Failure "docker-compose.monitoring.yml not found at $COMPOSE_FILE_MONITORING"
    Write-Host "`nAction required: Ensure monitoring compose file exists"
    exit 1
}

# Check current service status
Write-Step "Checking current service status..."

$runningServices = @()
$stoppedServices = @()

foreach ($service in $SERVICES) {
    if (Test-ServiceRunning $service) {
        $runningServices += $service
        Write-Host "   ✅ $service is running"
    } else {
        $stoppedServices += $service
        Write-Host "   ⏸️  $service is stopped"
    }
}

# Determine action
if ($runningServices.Count -eq $SERVICES.Count -and -not $Force) {
    Write-Host "`n✅ All services already running (use -Force to restart)"
} elseif ($Force -and $runningServices.Count -gt 0) {
    Write-Step "Force restart requested, stopping services..."
    
    try {
        docker-compose -f $COMPOSE_FILE -f $COMPOSE_FILE_MONITORING stop $SERVICES -t 10 2>&1 | Out-Null
        Write-Success "Services stopped"
    } catch {
        Write-Failure "Failed to stop services: $_"
        exit 1
    }
    
    $stoppedServices = $SERVICES
} else {
    Write-Host ""
}

# Start services if needed
if ($stoppedServices.Count -gt 0) {
    Write-Step "Starting services: $($stoppedServices -join ', ')..."
    
    try {
        docker-compose -f $COMPOSE_FILE -f $COMPOSE_FILE_MONITORING up -d $stoppedServices 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Services started (waiting ${WaitSeconds}s for ready state...)"
        } else {
            Write-Failure "Failed to start services"
            exit 1
        }
    } catch {
        Write-Failure "Error starting services: $_"
        exit 1
    }
    
    # Wait for services to be ready
    Write-Host "`n   ⏳ Waiting for services to initialize..."
    Start-Sleep -Seconds $WaitSeconds
}

# Verify service health
Write-Step "Verifying service health..."

$healthChecks = @(
    @{ Name = "Grafana"; Url = "http://localhost:3000/-/healthy" },
    @{ Name = "Prometheus"; Url = "http://localhost:9090/-/healthy" },
    @{ Name = "TerraFusion API"; Url = "http://localhost:5000/health" }
)

$allHealthy = $true

foreach ($check in $healthChecks) {
    if (Test-ServiceHealth $check.Url) {
        Write-Success "$($check.Name) is healthy"
    } else {
        Write-Failure "$($check.Name) is not responding at $($check.Url)"
        $allHealthy = $false
    }
}

# Final verdict
Write-Host ""

if ($allHealthy) {
    Write-Host "✅ All services healthy and ready for Day 1 capture" -ForegroundColor Green
    Write-Host ""
    Write-Host "Service URLs:"
    Write-Host "  - Grafana Dashboard: http://localhost:3000/d/slo-burn"
    Write-Host "  - Prometheus: http://localhost:9090"
    Write-Host "  - TerraFusion API: http://localhost:5000/health"
    Write-Host ""
    Write-Host "Next step: Run pre-start verification"
    Write-Host "  .\scripts\verify-day1-prestart.ps1"
    Write-Host ""
    exit 0
} else {
    Write-Host "⚠️  Some services are not healthy" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Troubleshooting:"
    Write-Host "  1. Check Docker logs: docker-compose -f compose\docker-compose.yml -f compose\docker-compose.monitoring.yml logs grafana prometheus backend"
    Write-Host "  2. Wait longer (services may still be initializing)"
    Write-Host "  3. Restart services: .\scripts\start-day1-services.ps1 -Force"
    Write-Host ""
    Write-Host "Re-run verification after troubleshooting:"
    Write-Host "  .\scripts\verify-day1-prestart.ps1"
    Write-Host ""
    exit 1
}

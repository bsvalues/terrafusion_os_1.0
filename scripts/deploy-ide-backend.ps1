# ═══════════════════════════════════════════════════════════════════════════
# TerraFusion IDE Backend Deployment Script
# Builds and deploys the IDE backend service
# ═══════════════════════════════════════════════════════════════════════════

param(
    [Parameter(Mandatory = $false)]
    [ValidateSet("development", "production")]
    [string]$Environment = "development",

    [Parameter(Mandatory = $false)]
    [string]$ImageTag = "latest",

    [Parameter(Mandatory = $false)]
    [switch]$Push = $false
)

# Colors for output
$Green = "`e[32m"
$Yellow = "`e[33m"
$Red = "`e[31m"
$Reset = "`e[0m"

# ═══════════════════════════════════════════════════════════════════════════
# Utility Functions
# ═══════════════════════════════════════════════════════════════════════════

function Write-Status {
    param([string]$Message)
    Write-Host "$Green✓$Reset $Message"
}

function Write-Warning {
    param([string]$Message)
    Write-Host "$Yellow⚠$Reset $Message"
}

function Write-Error {
    param([string]$Message)
    Write-Host "$Red✗$Reset $Message"
    exit 1
}

# ═══════════════════════════════════════════════════════════════════════════
# Prerequisites Check
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "`n$Yellow═══════════════════════════════════════════════════════════════$Reset"
Write-Host "$Yellow TerraFusion IDE Backend Deployment$Reset"
Write-Host "$Yellow═══════════════════════════════════════════════════════════════$Reset`n"

Write-Status "Checking prerequisites..."

# Check if Docker is installed
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker is not installed or not in PATH"
}
Write-Status "Docker: $(docker --version)"

# Check if Docker daemon is running
try {
    docker ps > $null 2>&1
    Write-Status "Docker daemon is running"
} catch {
    Write-Error "Docker daemon is not running"
}

# ═══════════════════════════════════════════════════════════════════════════
# Project Setup
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "`n$Yellow--- Project Setup ---$Reset`n"

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

# Navigate to backend directory
$BackendDir = Join-Path $ProjectRoot "backend"
if (-not (Test-Path $BackendDir)) {
    Write-Error "Backend directory not found at $BackendDir"
}

Write-Status "Project root: $ProjectRoot"
Write-Status "Backend directory: $BackendDir"

# ═══════════════════════════════════════════════════════════════════════════
# Build Configuration
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "`n$Yellow--- Build Configuration ---$Reset`n"

$ImageName = "terrafusion-ide-backend"
$ImageFull = "$ImageName`:$ImageTag"

Write-Status "Image name: $ImageName"
Write-Status "Image tag: $ImageTag"
Write-Status "Full image: $ImageFull"
Write-Status "Environment: $Environment"

# ═══════════════════════════════════════════════════════════════════════════
# Build Docker Image
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "`n$Yellow--- Building Docker Image ---$Reset`n"

$DockerfilePath = Join-Path $ProjectRoot "Dockerfile.backend"
if (-not (Test-Path $DockerfilePath)) {
    Write-Error "Dockerfile not found at $DockerfilePath"
}

Write-Status "Building image from: $DockerfilePath"

# Build the image
$BuildStartTime = Get-Date
$BuildOutput = docker build `
    --file $DockerfilePath `
    --tag $ImageFull `
    --build-arg ENVIRONMENT=$Environment `
    --progress=plain `
    $ProjectRoot 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker build failed`n$BuildOutput"
}

$BuildEndTime = Get-Date
$BuildDuration = ($BuildEndTime - $BuildStartTime).TotalSeconds

Write-Status "Docker image built successfully in $([Math]::Round($BuildDuration, 2)) seconds"
Write-Status "Image: $(docker images $ImageName --format='table {{.Repository}}:{{.Tag}}\t{{.Size}}' | Select-Object -Skip 1 | Select-Object -First 1)"

# ═══════════════════════════════════════════════════════════════════════════
# Optional: Push to Registry
# ═══════════════════════════════════════════════════════════════════════════

if ($Push) {
    Write-Host "`n$Yellow--- Pushing to Registry ---$Reset`n"

    Write-Warning "Push flag set - preparing for registry push"
    Write-Status "Ensure DOCKER_REGISTRY environment variable is set"

    $Registry = $env:DOCKER_REGISTRY
    if ([string]::IsNullOrEmpty($Registry)) {
        Write-Warning "DOCKER_REGISTRY not set, skipping push"
    } else {
        $RegistryImage = "$Registry/$ImageFull"
        Write-Status "Tagging image as: $RegistryImage"

        docker tag $ImageFull $RegistryImage
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to tag image for registry"
        }

        Write-Status "Pushing to registry: $Registry"
        docker push $RegistryImage
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to push image to registry"
        }

        Write-Status "Image pushed successfully"
    }
}

# ═══════════════════════════════════════════════════════════════════════════
# Deploy with Docker Compose
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "`n$Yellow--- Deploying Service ---$Reset`n"

$ComposeFile = Join-Path $ProjectRoot "docker-compose.backend.yml"
if (-not (Test-Path $ComposeFile)) {
    Write-Error "docker-compose file not found at $ComposeFile"
}

# Stop existing container if running
Write-Status "Checking for existing container..."
$ExistingContainer = docker ps -a --filter "name=terrafusion-ide-backend" --format "{{.ID}}" 2>$null
if ($ExistingContainer) {
    Write-Warning "Stopping existing container: $ExistingContainer"
    docker compose -f $ComposeFile down --remove-orphans 2>&1 | Out-Null
    Start-Sleep -Seconds 2
}

# Start new container
Write-Status "Starting IDE backend service..."
docker compose -f $ComposeFile up -d

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to start service with docker compose"
}

Write-Status "Service started"

# ═══════════════════════════════════════════════════════════════════════════
# Post-Deployment Verification
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "`n$Yellow--- Verification ---$Reset`n"

Write-Status "Waiting for service to be ready..."
$MaxWait = 30
$Elapsed = 0
$Ready = $false

while ($Elapsed -lt $MaxWait) {
    try {
        $Response = Invoke-WebRequest -Uri "http://localhost:8787/health/ready" -ErrorAction SilentlyContinue
        if ($Response.StatusCode -eq 200) {
            $Ready = $true
            break
        }
    } catch {
        # Service not ready yet
    }

    Start-Sleep -Seconds 1
    $Elapsed++
}

if (-not $Ready) {
    Write-Warning "Service did not become ready within $MaxWait seconds"
    Write-Status "Checking service logs..."
    docker compose -f $ComposeFile logs --tail=20
} else {
    Write-Status "Service is ready and responding to health checks"

    # Get service info
    $ServiceInfo = docker ps --filter "name=terrafusion-ide-backend" --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"
    Write-Host "`n$ServiceInfo"
}

# ═══════════════════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "`n$Yellow═══════════════════════════════════════════════════════════════$Reset"
Write-Host "$Green✓ Deployment Complete$Reset"
Write-Host "$Yellow═══════════════════════════════════════════════════════════════$Reset`n"

Write-Host "Service Details:"
Write-Host "  Image: $ImageFull"
Write-Host "  Container: terrafusion-ide-backend"
Write-Host "  Port: http://localhost:8787"
Write-Host "  Health: http://localhost:8787/health/ready"
Write-Host "  Logs: docker compose -f $ComposeFile logs -f"
Write-Host "  Stop: docker compose -f $ComposeFile down"
Write-Host ""

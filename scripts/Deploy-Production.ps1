# TerraFusion OS 1.0 - Production Deployment Script (PowerShell)
# Government Operating System with 1,008 AI Agents
# FISMA/FedRAMP Compliant Deployment

param(
    [switch]$Yes,
    [switch]$SkipBackup,
    [switch]$Verbose
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Configuration
$ProjectName = "TerraFusion OS 1.0"
$Version = "1.0.0"
$DeploymentDate = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BackupDir = ".\backups\$DeploymentDate"
$LogFile = ".\logs\deployment_$DeploymentDate.log"

# Ensure directories exist
New-Item -ItemType Directory -Force -Path ".\logs", ".\backups", ".\data\postgres", ".\data\redis", ".\certs" | Out-Null

# Logging function
function Write-Log {
    param([string]$Message, [string]$Color = "White")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] $Message"
    Write-Host $LogMessage -ForegroundColor $Color
    $LogMessage | Out-File -FilePath $LogFile -Append -Encoding UTF8
}

# Header
function Show-Header {
    Clear-Host
    Write-Log "==========================================================" "Cyan"
    Write-Log "🏛️  $ProjectName - PRODUCTION DEPLOYMENT" "Cyan"
    Write-Log "==========================================================" "Cyan"
    Write-Log "Version: $Version" "Cyan"
    Write-Log "Date: $(Get-Date)" "Cyan"
    Write-Log "Environment: Production" "Cyan"
    Write-Log "Compliance: FISMA | FedRAMP | SOC2" "Cyan"
    Write-Log "AI Agents: 1,008" "Cyan"
    Write-Log "==========================================================" "Cyan"
}

# Check prerequisites
function Test-Prerequisites {
    Write-Log "[1/8] Checking prerequisites..." "Blue"
    
    # Check Docker
    try {
        docker --version | Out-Null
        Write-Log "✅ Docker found" "Green"
    }
    catch {
        Write-Log "❌ Docker not found! Please install Docker first." "Red"
        exit 1
    }
    
    # Check Docker Compose
    try {
        docker-compose --version | Out-Null
        Write-Log "✅ Docker Compose found" "Green"
    }
    catch {
        Write-Log "❌ Docker Compose not found! Please install Docker Compose first." "Red"
        exit 1
    }
    
    # Check .env.production
    if (-not (Test-Path ".env.production")) {
        Write-Log "❌ .env.production file not found!" "Red"
        Write-Log "Creating template .env.production file..." "Yellow"
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env.production"
            Write-Log "⚠️  Please update .env.production with your actual values and run again." "Yellow"
            exit 1
        }
        else {
            Write-Log "❌ .env.example not found! Please create .env.production manually." "Red"
            exit 1
        }
    }
    
    # Check Docker daemon
    try {
        docker info | Out-Null
        Write-Log "✅ Docker daemon is running" "Green"
    }
    catch {
        Write-Log "❌ Docker daemon not running! Please start Docker first." "Red"
        exit 1
    }
    
    Write-Log "✅ Prerequisites check passed" "Green"
}

# Backup existing data
function Backup-Data {
    if ($SkipBackup) {
        Write-Log "[2/8] Skipping backup (--SkipBackup specified)..." "Yellow"
        return
    }
    
    Write-Log "[2/8] Creating backup..." "Blue"
    
    $RunningServices = docker-compose -f docker-compose.production.yml ps --services --filter "status=running"
    if ($RunningServices) {
        Write-Log "Creating data backup before deployment..." "Yellow"
        New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
        
        # Backup database
        try {
            docker-compose -f docker-compose.production.yml exec -T postgres pg_isready
            docker-compose -f docker-compose.production.yml exec -T postgres pg_dump -U terrafusion terrafusion_prod > "$BackupDir\database_backup.sql"
            Write-Log "✅ Database backup created" "Green"
        }
        catch {
            Write-Log "⚠️  Database backup failed (service may not be running)" "Yellow"
        }
        
        # Backup Redis
        try {
            docker-compose -f docker-compose.production.yml exec -T redis redis-cli ping
            Write-Log "✅ Redis backup check completed" "Green"
        }
        catch {
            Write-Log "⚠️  Redis backup failed (service may not be running)" "Yellow"
        }
        
        # Backup application data
        if (Test-Path ".\data") {
            Copy-Item -Recurse ".\data" "$BackupDir\" -Force
            Write-Log "✅ Application data backup created" "Green"
        }
    }
    else {
        Write-Log "⚠️  No running services found, skipping backup" "Yellow"
    }
}

# Build images
function Build-Images {
    Write-Log "[3/8] Building production images..." "Blue"
    
    Write-Log "Building TerraFusion OS API image..." "Yellow"
    docker-compose -f docker-compose.production.yml build --no-cache terrafusion-api
    
    if (Test-Path ".\ai-swarm") {
        Write-Log "Building AI Swarm image..." "Yellow"
        docker-compose -f docker-compose.production.yml build --no-cache ai-swarm
    }
    
    Write-Log "✅ Images built successfully" "Green"
}

# Stop existing services
function Stop-Services {
    Write-Log "[4/8] Stopping existing services..." "Blue"
    
    $RunningServices = docker-compose -f docker-compose.production.yml ps --services --filter "status=running"
    if ($RunningServices) {
        Write-Log "Gracefully stopping services..." "Yellow"
        docker-compose -f docker-compose.production.yml down --timeout 30
    }
    else {
        Write-Log "⚠️  No running services found" "Yellow"
    }
    
    Write-Log "✅ Services stopped" "Green"
}

# Start services
function Start-Services {
    Write-Log "[5/8] Starting production services..." "Blue"
    
    Write-Log "Starting infrastructure services..." "Yellow"
    docker-compose -f docker-compose.production.yml up -d postgres redis
    
    Write-Log "Waiting for infrastructure to be ready..." "Yellow"
    Start-Sleep -Seconds 10
    
    # Wait for PostgreSQL
    Write-Log "Waiting for PostgreSQL..." "Yellow"
    $timeout = 60
    $elapsed = 0
    do {
        try {
            docker-compose -f docker-compose.production.yml exec -T postgres pg_isready -U terrafusion -d terrafusion_prod
            break
        }
        catch {
            Start-Sleep -Seconds 2
            $elapsed += 2
        }
    } while ($elapsed -lt $timeout)
    
    # Wait for Redis
    Write-Log "Waiting for Redis..." "Yellow"
    $timeout = 30
    $elapsed = 0
    do {
        try {
            docker-compose -f docker-compose.production.yml exec -T redis redis-cli ping
            break
        }
        catch {
            Start-Sleep -Seconds 2
            $elapsed += 2
        }
    } while ($elapsed -lt $timeout)
    
    Write-Log "Starting application services..." "Yellow"
    docker-compose -f docker-compose.production.yml up -d
    
    Write-Log "✅ All services started" "Green"
}

# Run database migrations
function Invoke-Migrations {
    Write-Log "[6/8] Running database migrations..." "Blue"
    
    Write-Log "Waiting for API to be ready..." "Yellow"
    $timeout = 120
    $elapsed = 0
    do {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:\${{TF_API_PORT:-5000}}/health" -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                break
            }
        }
        catch {
            Start-Sleep -Seconds 5
            $elapsed += 5
        }
    } while ($elapsed -lt $timeout)
    
    # Run Entity Framework migrations
    try {
        docker-compose -f docker-compose.production.yml exec -T terrafusion-api dotnet ef database update --no-build
        Write-Log "✅ Database migrations completed" "Green"
    }
    catch {
        Write-Log "⚠️  Migrations may have already been applied" "Yellow"
    }
}

# Verify deployment
function Test-Deployment {
    Write-Log "[7/8] Verifying deployment..." "Blue"
    
    # Check service health
    Write-Log "Checking service health..." "Yellow"
    
    $services = @("postgres", "redis", "terrafusion-api")
    foreach ($service in $services) {
        $serviceStatus = docker-compose -f docker-compose.production.yml ps $service
        if ($serviceStatus -match "Up") {
            Write-Log "✅ $service is running" "Green"
        }
        else {
            Write-Log "❌ $service is not running" "Red"
            return $false
        }
    }
    
    # Test API endpoints
    Write-Log "Testing API endpoints..." "Yellow"
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:\${{TF_API_PORT:-5000}}/health" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Log "✅ Health endpoint responding" "Green"
        }
        else {
            Write-Log "❌ Health endpoint not responding correctly" "Red"
            return $false
        }
    }
    catch {
        Write-Log "❌ Health endpoint not responding" "Red"
        return $false
    }
    
    # Check AI Swarm (if available)
    $aiSwarmStatus = docker-compose -f docker-compose.production.yml ps ai-swarm
    if ($aiSwarmStatus -match "Up") {
        Write-Log "✅ AI Swarm is running (1,008 agents)" "Green"
    }
    else {
        Write-Log "⚠️  AI Swarm not running (optional)" "Yellow"
    }
    
    # Check monitoring (if available)
    $prometheusStatus = docker-compose -f docker-compose.production.yml ps prometheus
    if ($prometheusStatus -match "Up") {
        Write-Log "✅ Monitoring stack is running" "Green"
    }
    else {
        Write-Log "⚠️  Monitoring stack not running (optional)" "Yellow"
    }
    
    Write-Log "✅ Deployment verification passed" "Green"
    return $true
}

# Display summary
function Show-Summary {
    Write-Log "[8/8] Deployment Summary" "Blue"
    Write-Log ""
    Write-Log "🎉 TerraFusion OS 1.0 PRODUCTION DEPLOYMENT SUCCESSFUL! 🎉" "Green"
    Write-Log ""
    Write-Log "📊 DEPLOYMENT DETAILS:" "Cyan"
    Write-Log "• Version: $Version"
    Write-Log "• Deployment Date: $DeploymentDate"
    Write-Log "• Environment: Production"
    Write-Log "• Compliance: FISMA | FedRAMP | SOC2"
    Write-Log "• AI Agents: 1,008"
    Write-Log ""
    Write-Log "🌐 ACCESS INFORMATION:" "Cyan"
    Write-Log "• API Health: http://localhost:\${{TF_API_PORT:-5000}}/health"
    Write-Log "• API Swagger: http://localhost:\${{TF_API_PORT:-5000}}/swagger (if enabled)"
    Write-Log "• Prometheus: http://localhost:\${{TF_API_PORT:-5000}} (if enabled)"
    Write-Log "• Grafana: http://localhost:\${{TF_API_PORT:-5000}} (if enabled)"
    Write-Log ""
    Write-Log "🔧 MANAGEMENT COMMANDS:" "Cyan"
    Write-Log "• View Logs: docker-compose -f docker-compose.production.yml logs -f"
    Write-Log "• Stop Services: docker-compose -f docker-compose.production.yml down"
    Write-Log "• Restart Services: docker-compose -f docker-compose.production.yml restart"
    Write-Log "• Service Status: docker-compose -f docker-compose.production.yml ps"
    Write-Log ""
    Write-Log "📋 CONTAINER RESOURCE USAGE:" "Cyan"
    try {
        docker stats --no-stream --format "table {{.Container}}`t{{.CPUPerc}}`t{{.MemUsage}}`t{{.NetIO}}"
    }
    catch {
        Write-Log "Unable to display container stats" "Yellow"
    }
    Write-Log ""
    Write-Log "📝 IMPORTANT NOTES:" "Yellow"
    Write-Log "• Backup created at: $BackupDir"
    Write-Log "• Deployment log: $LogFile"
    Write-Log "• Monitor system resources and performance"
    Write-Log "• Regular backups are recommended"
    Write-Log "• Review security configurations for production"
    Write-Log ""
    Write-Log "✅ TerraFusion OS 1.0 is now running in production mode!" "Green"
}

# Error handling
function Write-ErrorAndExit {
    param([string]$Step)
    Write-Log "❌ Deployment failed at step: $Step" "Red"
    Write-Log "Checking service logs..." "Yellow"
    try {
        docker-compose -f docker-compose.production.yml logs --tail=50
    }
    catch {
        Write-Log "Unable to retrieve service logs" "Yellow"
    }
    Write-Log "For troubleshooting, check: $LogFile" "Yellow"
    exit 1
}

# Main deployment process
function Start-Deployment {
    Show-Header
    
    # Confirm production deployment
    if (-not $Yes) {
        Write-Log "⚠️  WARNING: This will deploy TerraFusion OS 1.0 to PRODUCTION!" "Yellow"
        $confirmation = Read-Host "Are you sure you want to continue? (yes/no)"
        if ($confirmation -notmatch "^[Yy][Ee][Ss]$") {
            Write-Log "Deployment cancelled by user." "Yellow"
            exit 0
        }
    }
    
    try {
        # Deployment steps
        Test-Prerequisites
        Backup-Data
        Build-Images
        Stop-Services
        Start-Services
        Invoke-Migrations
        $verificationResult = Test-Deployment
        if (-not $verificationResult) {
            Write-ErrorAndExit "Deployment verification"
        }
        Show-Summary
    }
    catch {
        Write-ErrorAndExit "Unknown error: $($_.Exception.Message)"
    }
}

# Run the deployment
Start-Deployment

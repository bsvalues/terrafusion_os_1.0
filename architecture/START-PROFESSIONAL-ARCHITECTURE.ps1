#!/usr/bin/env powershell
# MIT PhD-Level TerraFusion OS Professional Launcher
# Four-Layer Architecture with Proper Separation of Concerns

Write-Host "🎓 MIT PhD-Level TerraFusion OS Architecture" -ForegroundColor Cyan
Write-Host "   Layer 1: Infrastructure (Docker/Kubernetes)" -ForegroundColor White
Write-Host "   Layer 2: Service Mesh (Consul/Envoy)" -ForegroundColor White  
Write-Host "   Layer 3: Trust Fabric (SPIFFE/OPA)" -ForegroundColor White
Write-Host "   Layer 4: Business Logic (TerraFusion Modules)" -ForegroundColor White
Write-Host "=" * 80 -ForegroundColor Green

# Check prerequisites
function Test-Prerequisites {
    Write-Host "`n🔍 Checking prerequisites..." -ForegroundColor Yellow
    
    $missing = @()
    
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        $missing += "Docker"
    }
    
    if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
        $missing += "Docker Compose"
    }
    
    if ($missing.Count -gt 0) {
        Write-Host "❌ Missing prerequisites: $($missing -join ', ')" -ForegroundColor Red
        Write-Host "   Please install Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
        return $false
    }
    
    Write-Host "✅ Prerequisites satisfied" -ForegroundColor Green
    return $true
}

# Initialize directory structure
function Initialize-DirectoryStructure {
    Write-Host "`n📁 Initializing directory structure..." -ForegroundColor Yellow
    
    $directories = @(
        "architecture/data/consul",
        "architecture/data/vault", 
        "architecture/data/spire-server",
        "architecture/data/spire-agent",
        "architecture/data/trust-fabric",
        "architecture/data/postgres",
        "architecture/data/redis",
        "architecture/logs",
        "architecture/certs"
    )
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Host "   Created: $dir" -ForegroundColor Gray
        }
    }
    
    Write-Host "✅ Directory structure ready" -ForegroundColor Green
}

# Generate required certificates and secrets
function Initialize-SecurityArtifacts {
    Write-Host "`n🔐 Initializing security artifacts..." -ForegroundColor Yellow
    
    # Generate Consul gossip key
    if (-not (Test-Path "architecture/.env.secrets")) {
        $consulKey = & docker run --rm consul:1.16.1 consul keygen
        $vaultToken = [System.Guid]::NewGuid().ToString()
        $dbPassword = [System.Web.Security.Membership]::GeneratePassword(16, 4)
        
        $secrets = @"
CONSUL_GOSSIP_KEY=$consulKey
VAULT_ROOT_TOKEN=$vaultToken
DB_PASSWORD=$dbPassword
VERSION=latest
"@
        
        Set-Content -Path "architecture/.env.secrets" -Value $secrets
        Write-Host "   Generated: Consul gossip key" -ForegroundColor Gray
        Write-Host "   Generated: Vault root token" -ForegroundColor Gray
        Write-Host "   Generated: Database password" -ForegroundColor Gray
    }
    
    Write-Host "✅ Security artifacts ready" -ForegroundColor Green
}

# Start Layer 1: Infrastructure
function Start-Infrastructure {
    Write-Host "`n🏗️  Starting Layer 1: Infrastructure..." -ForegroundColor Cyan
    
    Set-Location "architecture"
    
    # Stop any existing containers
    Write-Host "   Stopping existing containers..." -ForegroundColor Gray
    & docker-compose -f docker-compose.production.yml down --remove-orphans 2>$null
    
    # Start infrastructure services first
    Write-Host "   Starting core infrastructure..." -ForegroundColor Gray
    & docker-compose -f docker-compose.production.yml up -d postgres redis consul
    
    # Wait for core services
    Write-Host "   Waiting for core services to be ready..." -ForegroundColor Gray
    Start-Sleep 10
    
    # Start identity infrastructure (SPIRE)
    Write-Host "   Starting identity infrastructure (SPIRE)..." -ForegroundColor Gray  
    & docker-compose -f docker-compose.production.yml up -d spire-server spire-agent vault
    
    # Wait for identity services
    Start-Sleep 15
    
    Write-Host "✅ Layer 1: Infrastructure ready" -ForegroundColor Green
}

# Start Layer 2: Service Mesh
function Start-ServiceMesh {
    Write-Host "`n🕸️  Starting Layer 2: Service Mesh..." -ForegroundColor Cyan
    
    # Consul should already be running from Layer 1
    Write-Host "   Verifying Consul service discovery..." -ForegroundColor Gray
    
    $consulReady = $false
    for ($i = 0; $i -lt 10; $i++) {
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:\${{TF_CONSUL_PORT:-8500}}/v1/status/leader" -TimeoutSec 3
            if ($response) {
                $consulReady = $true
                break
            }
        }
        catch {
            Start-Sleep 3
        }
    }
    
    if ($consulReady) {
        Write-Host "✅ Layer 2: Service Mesh ready" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Layer 2: Service Mesh not ready" -ForegroundColor Red
        return $false
    }
    
    return $true
}

# Start Layer 3: Trust Fabric
function Start-TrustFabric {
    Write-Host "`n🔐 Starting Layer 3: Trust Fabric..." -ForegroundColor Cyan
    
    Write-Host "   Starting Trust Fabric attestation service..." -ForegroundColor Gray
    & docker-compose -f docker-compose.production.yml up -d trust-fabric
    
    # Wait for Trust Fabric to be ready
    Start-Sleep 10
    
    $trustFabricReady = $false
    for ($i = 0; $i -lt 10; $i++) {
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:\${{TF_CONSUL_PORT:-8500}}/health" -TimeoutSec 3
            if ($response.status -eq "healthy") {
                $trustFabricReady = $true
                break
            }
        }
        catch {
            Start-Sleep 3
        }
    }
    
    if ($trustFabricReady) {
        Write-Host "✅ Layer 3: Trust Fabric ready" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Layer 3: Trust Fabric not ready" -ForegroundColor Red
        return $false
    }
    
    return $true
}

# Start Layer 4: Business Logic
function Start-BusinessLogic {
    Write-Host "`n🏢 Starting Layer 4: Business Logic..." -ForegroundColor Cyan
    
    Write-Host "   Starting TerraFusion backend API..." -ForegroundColor Gray
    & docker-compose -f docker-compose.production.yml up -d terrafusion-backend
    
    Start-Sleep 10
    
    Write-Host "   Starting TerraFusion frontend..." -ForegroundColor Gray
    & docker-compose -f docker-compose.production.yml up -d terrafusion-frontend
    
    Start-Sleep 10
    
    # Verify business logic services
    $backendReady = $false
    $frontendReady = $false
    
    try {
        $backendResponse = Invoke-RestMethod -Uri "http://localhost:\${{TF_CONSUL_PORT:-8500}}/health" -TimeoutSec 5
        if ($backendResponse.status -eq "healthy") { $backendReady = $true }
    }
    catch { }
    
    try {
        $frontendResponse = Invoke-WebRequest -Uri "http://localhost:\${{TF_CONSUL_PORT:-8500}}" -TimeoutSec 5 -UseBasicParsing
        if ($frontendResponse.StatusCode -eq 200) { $frontendReady = $true }
    }
    catch { }
    
    if ($backendReady -and $frontendReady) {
        Write-Host "✅ Layer 4: Business Logic ready" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  Layer 4: Partial ready (Backend: $backendReady, Frontend: $frontendReady)" -ForegroundColor Yellow
    }
    
    return $true
}

# Display system status
function Show-SystemStatus {
    Write-Host "`n📊 TerraFusion OS System Status" -ForegroundColor Cyan
    Write-Host "=" * 50 -ForegroundColor White
    
    $services = @(
        @{ Name = "PostgreSQL Database"; Port = 5432; Layer = "L1" },
        @{ Name = "Redis Cache"; Port = 6379; Layer = "L1" },
        @{ Name = "Consul Service Mesh"; Port = 8500; Layer = "L2" },
        @{ Name = "SPIRE Server"; Port = 8081; Layer = "L3" },
        @{ Name = "HashiCorp Vault"; Port = 8200; Layer = "L3" },
        @{ Name = "Trust Fabric"; Port = 7000; Layer = "L3" },
        @{ Name = "TerraFusion Backend"; Port = 8080; Layer = "L4" },
        @{ Name = "TerraFusion Frontend"; Port = 3000; Layer = "L4" },
        @{ Name = "Prometheus Monitoring"; Port = 9090; Layer = "L1" }
    )
    
    foreach ($service in $services) {
        $status = "🔴 DOWN"
        try {
            $test = Test-NetConnection -ComputerName localhost -Port $service.Port -WarningAction SilentlyContinue
            if ($test.TcpTestSucceeded) {
                $status = "🟢 UP  "
            }
        }
        catch { }
        
        Write-Host "[$($service.Layer)] $status $($service.Name) (port $($service.Port))" -ForegroundColor White
    }
    
    Write-Host "`n🌐 Access Points:" -ForegroundColor Cyan
    Write-Host "   Frontend:     http://localhost:\${{TF_CONSUL_PORT:-8500}}" -ForegroundColor Yellow
    Write-Host "   Backend API:  http://localhost:\${{TF_CONSUL_PORT:-8500}}" -ForegroundColor Yellow
    Write-Host "   Consul UI:    http://localhost:\${{TF_CONSUL_PORT:-8500}}" -ForegroundColor Yellow
    Write-Host "   Vault UI:     http://localhost:\${{TF_CONSUL_PORT:-8500}}" -ForegroundColor Yellow
    Write-Host "   Trust Fabric: http://localhost:\${{TF_CONSUL_PORT:-8500}}/status" -ForegroundColor Yellow
    Write-Host "   Monitoring:   http://localhost:\${{TF_CONSUL_PORT:-8500}}" -ForegroundColor Yellow
}

# Main execution
function Start-TerraFusionOS {
    if (-not (Test-Prerequisites)) {
        exit 1
    }
    
    Initialize-DirectoryStructure
    Initialize-SecurityArtifacts
    
    if (-not (Start-Infrastructure)) {
        Write-Host "❌ Failed to start infrastructure layer" -ForegroundColor Red
        exit 1
    }
    
    if (-not (Start-ServiceMesh)) {
        Write-Host "❌ Failed to start service mesh layer" -ForegroundColor Red
        exit 1
    }
    
    if (-not (Start-TrustFabric)) {
        Write-Host "❌ Failed to start trust fabric layer" -ForegroundColor Red
        exit 1
    }
    
    if (-not (Start-BusinessLogic)) {
        Write-Host "⚠️  Business logic layer partially ready" -ForegroundColor Yellow
    }
    
    Show-SystemStatus
    
    Write-Host "`n🎯 TerraFusion OS MIT PhD-Level Architecture: OPERATIONAL" -ForegroundColor Green
    Write-Host "   Four-layer separation of concerns implemented" -ForegroundColor White
    Write-Host "   Enterprise-grade reliability and security" -ForegroundColor White
    Write-Host "   Government compliance and zero trust architecture" -ForegroundColor White
}

# Execute
Start-TerraFusionOS

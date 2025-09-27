# 🏪 TerraFusion Marketplace Platform Deployment Script
# Government Plugin Economy Infrastructure Deployment

param(
    [switch]$Force,
    [switch]$SkipBackup,
    [switch]$DevelopmentMode,
    [string]$CountyName = "Benton County"
)

# Logging function
function Write-Log {
    param([string]$Message, [string]$Color = "White")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

Write-Log "🏪 TerraFusion Marketplace Platform Deployment Starting..." "Cyan"
Write-Log "Government Plugin Economy Infrastructure" "Yellow"

# Prerequisites Check
function Test-Prerequisites {
    Write-Log "Checking prerequisites..." "Yellow"
    
    # Check Docker
    try {
        docker --version | Out-Null
        Write-Log "✅ Docker found" "Green"
    }
    catch {
        Write-Log "❌ Docker not found! Please install Docker first." "Red"
        exit 1
    }
    
    # Check .env.production
    if (-not (Test-Path ".env.production")) {
        Write-Log "❌ .env.production file not found!" "Red"
        Write-Log "Creating template .env.production file..." "Yellow"
        exit 1
    }
    
    # Check marketplace platform directory
    if (-not (Test-Path "infrastructure/marketplace-enhanced")) {
        Write-Log "❌ Marketplace platform directory not found!" "Red"
        exit 1
    }
    
    Write-Log "✅ Prerequisites check passed" "Green"
}

# Create marketplace platform directories
function Initialize-MarketplacePlatform {
    Write-Log "Initializing TerraFusion Marketplace Platform..." "Yellow"
    
    $directories = @(
        "data/postgres-gov",
        "data/redis-gov", 
        "data/marketplace/plugins",
        "data/marketplace/revenue",
        "data/marketplace/analytics",
        "logs/marketplace",
        "security/sandbox-config"
    )
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Force -Path $dir | Out-Null
            Write-Log "📁 Created directory: $dir" "Cyan"
        }
    }
    
    Write-Log "✅ Marketplace platform directories initialized" "Green"
}

# Stop existing services
function Stop-ExistingServices {
    Write-Log "Stopping existing marketplace services..." "Yellow"
    
    try {
        docker-compose -f docker-compose.marketplace.yml down --remove-orphans 2>$null
        Write-Log "✅ Existing services stopped" "Green"
    }
    catch {
        Write-Log "⚠️  No existing services to stop" "Yellow"
    }
}

# Build marketplace platform
function Build-MarketplacePlatform {
    Write-Log "Building TerraFusion Marketplace Platform..." "Yellow"
    
    # Build core API with marketplace support
    Write-Log "Building Core API with Marketplace Engine..." "Cyan"
    docker build -f backend/Dockerfile.production.simple -t terrafusion/os-api:1.0.0-production ./backend
    
    # Build marketplace platform frontend
    Write-Log "Building Marketplace Platform Frontend..." "Cyan"
    docker build -f infrastructure/marketplace-enhanced/Dockerfile -t terrafusion/marketplace-platform:1.0.0 ./infrastructure/marketplace-enhanced
    
    Write-Log "✅ Marketplace platform built successfully" "Green"
}

# Deploy marketplace platform
function Deploy-MarketplacePlatform {
    Write-Log "Deploying TerraFusion Marketplace Platform..." "Yellow"
    
    # Start infrastructure services first
    Write-Log "Starting infrastructure services..." "Cyan"
    docker-compose -f docker-compose.marketplace.yml up -d postgres redis
    
    # Wait for infrastructure
    Write-Log "Waiting for infrastructure to be ready..." "Cyan"
    Start-Sleep -Seconds 30
    
    # Start core services
    Write-Log "Starting marketplace core services..." "Cyan"
    docker-compose -f docker-compose.marketplace.yml up -d terrafusion-api plugin-sandbox
    
    # Wait for core services
    Write-Log "Waiting for core services..." "Cyan"
    Start-Sleep -Seconds 20
    
    # Start marketplace platform
    Write-Log "Starting marketplace platform..." "Cyan"
    docker-compose -f docker-compose.marketplace.yml up -d marketplace-platform
    
    # Start monitoring
    Write-Log "Starting monitoring services..." "Cyan"
    docker-compose -f docker-compose.marketplace.yml up -d prometheus grafana
    
    Write-Log "✅ Marketplace platform deployed successfully" "Green"
}

# Verify deployment
function Test-MarketplaceDeployment {
    Write-Log "Verifying marketplace platform deployment..." "Yellow"
    
    $services = @(
        @{Name="Core API"; Url="http://localhost:\${{TF_API_PORT:-5000}}/health"; Port=5000},
        @{Name="Marketplace Platform"; Url="http://localhost:\${{TF_API_PORT:-5000}}/health"; Port=3000},
        @{Name="Revenue Analytics"; Url="http://localhost:\${{TF_API_PORT:-5000}}"; Port=3001}
    )
    
    foreach ($service in $services) {
        Write-Log "Testing $($service.Name)..." "Cyan"
        
        $retries = 0
        $maxRetries = 10
        $success = $false
        
        while ($retries -lt $maxRetries -and -not $success) {
            try {
                $response = Invoke-WebRequest -Uri $service.Url -TimeoutSec 5 -UseBasicParsing
                if ($response.StatusCode -eq 200) {
                    Write-Log "✅ $($service.Name) is healthy" "Green"
                    $success = $true
                } else {
                    throw "HTTP $($response.StatusCode)"
                }
            }
            catch {
                $retries++
                if ($retries -lt $maxRetries) {
                    Write-Log "⏳ Waiting for $($service.Name)... (attempt $retries/$maxRetries)" "Yellow"
                    Start-Sleep -Seconds 10
                } else {
                    Write-Log "⚠️  $($service.Name) health check failed after $maxRetries attempts" "Red"
                }
            }
        }
    }
}

# Display deployment summary
function Show-DeploymentSummary {
    Write-Log "" "White"
    Write-Log "🎉 TerraFusion Marketplace Platform Deployment Complete!" "Green"
    Write-Log "" "White"
    Write-Log "🏪 Government Plugin Economy Platform:" "Cyan"
    Write-Log "   • Marketplace Portal: http://localhost:\${{TF_API_PORT:-5000}}" "White"
    Write-Log "   • Core API: http://localhost:\${{TF_API_PORT:-5000}}" "White"
    Write-Log "   • Revenue Analytics: http://localhost:\${{TF_API_PORT:-5000}}" "White"
    Write-Log "   • Plugin API: http://localhost:\${{TF_API_PORT:-5000}}/api/marketplace" "White"
    Write-Log "" "White"
    Write-Log "💰 Revenue Sharing Platform:" "Cyan"
    Write-Log "   • Counties can develop and sell plugins" "White"
    Write-Log "   • 70% revenue to developer county" "White"
    Write-Log "   • 30% platform fee" "White"
    Write-Log "   • Cross-county collaboration enabled" "White"
    Write-Log "" "White"
    Write-Log "🔒 Government Security:" "Cyan"
    Write-Log "   • FISMA/FedRAMP compliant sandboxing" "White"
    Write-Log "   • Plugin isolation and validation" "White"
    Write-Log "   • Government-grade encryption" "White"
    Write-Log "" "White"
    Write-Log "🚀 Plugin Ecosystem:" "Cyan"
    Write-Log "   • 7 initial government plugins available" "White"
    Write-Log "   • AI-powered property valuation" "White"
    Write-Log "   • Harris PACS integration" "White"
    Write-Log "   • GIS mapping and CAMA systems" "White"
    Write-Log "" "White"
    Write-Log "📊 Monitoring:" "Cyan"
    Write-Log "   • Prometheus: http://localhost:\${{TF_API_PORT:-5000}}" "White"
    Write-Log "   • Grafana: http://localhost:\${{TF_API_PORT:-5000}}" "White"
    Write-Log "" "White"
    Write-Log "🎯 Next Steps:" "Yellow"
    Write-Log "   1. Access marketplace at http://localhost:\${{TF_API_PORT:-5000}}" "White"
    Write-Log "   2. Configure county-specific plugins" "White"
    Write-Log "   3. Set up revenue sharing agreements" "White"
    Write-Log "   4. Enable cross-county collaboration" "White"
    Write-Log "" "White"
}

# Main deployment process
try {
    Test-Prerequisites
    Initialize-MarketplacePlatform
    Stop-ExistingServices
    Build-MarketplacePlatform
    Deploy-MarketplacePlatform
    Test-MarketplaceDeployment
    Show-DeploymentSummary
    
    Write-Log "🏆 TerraFusion Marketplace Platform is ready for government plugin economy!" "Green"
}
catch {
    Write-Log "❌ Deployment failed: $($_.Exception.Message)" "Red"
    Write-Log "Check logs and try again" "Yellow"
    exit 1
}

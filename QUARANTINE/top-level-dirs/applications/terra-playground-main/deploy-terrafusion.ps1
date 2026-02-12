$ErrorActionPreference = "Stop"

function Test-Requirements {
    Write-Host "Checking system requirements..."
    
    $requirements = @{
        "Node.js" = { node --version }
        "npm" = { npm --version }
        "Docker" = { docker --version }
        "Git" = { git --version }
    }
    
    foreach ($req in $requirements.GetEnumerator()) {
        try {
            $version = & $req.Value
            Write-Host "✅ $($req.Key) is installed: $version"
        }
        catch {
            Write-Host "❌ $($req.Key) is not installed or not in PATH"
            return $false
        }
    }
    return $true
}

function Initialize-Environment {
    Write-Host "Initializing deployment environment..."
    
    # Create necessary directories
    $dirs = @(
        "logs",
        "data",
        "config",
        "secrets"
    )
    
    foreach ($dir in $dirs) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Host "Created directory: $dir"
        }
    }
    
    # Set up environment variables
    $env:TF_ENV = "production"
    $env:TF_LOG_LEVEL = "info"
}

function Install-Dependencies {
    Write-Host "Installing project dependencies..."
    
    try {
        npm ci --production
        Write-Host "✅ Dependencies installed successfully"
    }
    catch {
        Write-Host "❌ Failed to install dependencies: $_"
        throw
    }
}

function Build-Project {
    Write-Host "Building project..."
    
    try {
        npm run build
        Write-Host "✅ Project built successfully"
    }
    catch {
        Write-Host "❌ Build failed: $_"
        throw
    }
}

function Setup-Monitoring {
    Write-Host "Setting up monitoring..."
    
    try {
        # Start Prometheus
        docker-compose -f docker-compose.prod.yml up -d prometheus
        
        # Start Grafana
        docker-compose -f docker-compose.prod.yml up -d grafana
        
        Write-Host "✅ Monitoring services started"
    }
    catch {
        Write-Host "❌ Failed to start monitoring services: $_"
        throw
    }
}

function Deploy-Services {
    Write-Host "Deploying services..."
    
    try {
        # Start main application
        docker-compose -f docker-compose.prod.yml up -d
        
        Write-Host "✅ Services deployed successfully"
    }
    catch {
        Write-Host "❌ Deployment failed: $_"
        throw
    }
}

function Verify-Deployment {
    Write-Host "Verifying deployment..."
    
    $services = @(
        "http://localhost:3000",  # Main application
        "http://localhost:9090",  # Prometheus
        "http://localhost:3001"   # Grafana
    )
    
    foreach ($service in $services) {
        try {
            $response = Invoke-WebRequest -Uri $service -Method Head
            Write-Host "✅ $service is responding"
        }
        catch {
            Write-Host "❌ $service is not responding: $_"
            throw
        }
    }
}

function Main {
    Write-Host "Starting TerraFusion IDE deployment..."
    
    if (-not (Test-Requirements)) {
        Write-Host "❌ System requirements not met"
        exit 1
    }
    
    try {
        Initialize-Environment
        Install-Dependencies
        Build-Project
        Setup-Monitoring
        Deploy-Services
        Verify-Deployment
        
        Write-Host "✅ TerraFusion IDE deployed successfully!"
    }
    catch {
        Write-Host "❌ Deployment failed: $_"
        exit 1
    }
}

Main 
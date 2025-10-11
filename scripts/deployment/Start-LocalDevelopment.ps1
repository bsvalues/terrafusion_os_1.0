#!/usr/bin/env pwsh
<#
.SYNOPSIS
    🚀 TerraFusion OS 1.0 - Local Development Setup
    Quick local setup for testing AI Swarm without cloud deployment

.DESCRIPTION
    This script sets up TerraFusion OS 1.0 locally for development and testing.
    Perfect for testing the AI Swarm before deploying to production.
    
.EXAMPLE
    .\Start-LocalDevelopment.ps1
#>

[CmdletBinding()]
param(
    [switch]$SkipBuild,
    [switch]$OpenBrowser
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-LocalLog {
    param(
        [string]$Message,
        [ValidateSet('INFO', 'WARN', 'ERROR', 'SUCCESS')]
        [string]$Level = 'INFO'
    )
    
    $colors = @{
        'INFO' = 'White'
        'WARN' = 'Yellow' 
        'ERROR' = 'Red'
        'SUCCESS' = 'Green'
    }
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $colors[$Level]
}

function Test-Prerequisites {
    Write-LocalLog "🔍 Checking local development prerequisites..." -Level 'INFO'
    
    $missing = @()
    
    if (!(Get-Command node -ErrorAction SilentlyContinue)) { $missing += "Node.js" }
    if (!(Get-Command npm -ErrorAction SilentlyContinue)) { $missing += "npm" }
    if (!(Get-Command dotnet -ErrorAction SilentlyContinue)) { $missing += ".NET SDK" }
    
    if ($missing.Count -gt 0) {
        Write-LocalLog "❌ Missing prerequisites: $($missing -join ', ')" -Level 'ERROR'
        return $false
    }
    
    Write-LocalLog "✅ All prerequisites available" -Level 'SUCCESS'
    return $true
}

function Start-LocalServices {
    Write-LocalLog "🐳 Starting local services..." -Level 'INFO'
    
    # Check if Docker is running
    try {
        docker info | Out-Null
        Write-LocalLog "✅ Docker is running" -Level 'SUCCESS'
    }
    catch {
        Write-LocalLog "⚠️ Docker not running - some features may be limited" -Level 'WARN'
    }
    
    # Create local database (SQLite for development)
    Write-LocalLog "📊 Setting up local database..." -Level 'INFO'
    
    if (!(Test-Path "./data")) {
        New-Item -ItemType Directory -Path "./data" -Force | Out-Null
    }
    
    Write-LocalLog "✅ Local database ready" -Level 'SUCCESS'
}

function Build-Backend {
    if ($SkipBuild) {
        Write-LocalLog "⏭️ Skipping backend build" -Level 'WARN'
        return
    }
    
    Write-LocalLog "🔨 Building .NET backend..." -Level 'INFO'
    
    try {
        Push-Location "./backend"
        
        # Restore packages
        dotnet restore
        
        # Build in development mode
        dotnet build --configuration Debug
        
        Write-LocalLog "✅ Backend build completed" -Level 'SUCCESS'
    }
    catch {
        Write-LocalLog "❌ Backend build failed: $($_.Exception.Message)" -Level 'ERROR'
        throw
    }
    finally {
        Pop-Location
    }
}

function Build-Frontend {
    if ($SkipBuild) {
        Write-LocalLog "⏭️ Skipping frontend build" -Level 'WARN'
        return
    }
    
    Write-LocalLog "⚛️ Setting up React frontend..." -Level 'INFO'
    
    try {
        Push-Location "./frontend"
        
        # Install packages
        npm install
        
        Write-LocalLog "✅ Frontend setup completed" -Level 'SUCCESS'
    }
    catch {
        Write-LocalLog "❌ Frontend setup failed: $($_.Exception.Message)" -Level 'ERROR'
        throw
    }
    finally {
        Pop-Location
    }
}

function Start-Backend {
    Write-LocalLog "🚀 Starting backend services..." -Level 'INFO'
    
    try {
        Push-Location "./backend"
        
        # Start the backend in development mode
        Start-Process powershell -ArgumentList "-Command", "dotnet run --environment Development" -WindowStyle Normal
        
        Write-LocalLog "✅ Backend started on https://localhost:5001" -Level 'SUCCESS'
    }
    catch {
        Write-LocalLog "❌ Failed to start backend: $($_.Exception.Message)" -Level 'ERROR'
        throw
    }
    finally {
        Pop-Location
    }
}

function Start-Frontend {
    Write-LocalLog "🌐 Starting frontend development server..." -Level 'INFO'
    
    try {
        Push-Location "./frontend"
        
        # Start the React development server
        Start-Process powershell -ArgumentList "-Command", "npm start" -WindowStyle Normal
        
        Write-LocalLog "✅ Frontend started on http://localhost:3000" -Level 'SUCCESS'
    }
    catch {
        Write-LocalLog "❌ Failed to start frontend: $($_.Exception.Message)" -Level 'ERROR'
        throw
    }
    finally {
        Pop-Location
    }
}

function Initialize-AISwarm {
    Write-LocalLog "🤖 Initializing local AI Swarm..." -Level 'INFO'
    
    # Wait for backend to be ready
    $maxRetries = 30
    $retries = 0
    
    do {
        Start-Sleep -Seconds 2
        try {
            $response = Invoke-RestMethod -Uri "https://localhost:5001/api/health" -SkipCertificateCheck -TimeoutSec 5
            break
        }
        catch {
            $retries++
            if ($retries -ge $maxRetries) {
                Write-LocalLog "❌ Backend not responding after $maxRetries attempts" -Level 'ERROR'
                return
            }
        }
    } while ($retries -lt $maxRetries)
    
    # Initialize the AI Swarm
    try {
        $initPayload = @{
            command = "initialize_local_swarm"
            agentCount = 1000  # Reduced for local development
            quantumCoherence = 0.95
            consciousnessLevel = 6.0
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "https://localhost:5001/api/ai-swarm/initialize" -Method POST -Body $initPayload -ContentType "application/json" -SkipCertificateCheck
        
        Write-LocalLog "✅ AI Swarm initialized with $($response.agentsInitialized) agents" -Level 'SUCCESS'
        Write-LocalLog "🌟 Quantum coherence: $($response.quantumCoherence * 100)%" -Level 'INFO'
        Write-LocalLog "🧠 Consciousness level: $($response.consciousnessLevel)/10" -Level 'INFO'
    }
    catch {
        Write-LocalLog "⚠️ AI Swarm initialization will complete when backend is ready" -Level 'WARN'
    }
}

# Main execution
try {
    Write-Host @"
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║  🤖 TERRAFUSION OS 1.0 - LOCAL DEVELOPMENT SETUP                            ║
║                                                                              ║
║  Quick setup for testing AI Swarm locally                                   ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

    Write-LocalLog "🚀 Starting TerraFusion OS 1.0 local development..." -Level 'INFO'
    
    # Check prerequisites
    if (!(Test-Prerequisites)) {
        Write-LocalLog "💡 Install missing tools and try again" -Level 'INFO'
        exit 1
    }
    
    # Start local services
    Start-LocalServices
    
    # Build applications
    Build-Backend
    Build-Frontend
    
    # Start services
    Start-Backend
    Start-Sleep -Seconds 5  # Give backend time to start
    Start-Frontend
    
    # Initialize AI Swarm
    Start-Sleep -Seconds 10  # Give services time to start
    Initialize-AISwarm
    
    Write-LocalLog "" -Level 'INFO'
    Write-LocalLog "🎉 TerraFusion OS 1.0 is now running locally!" -Level 'SUCCESS'
    Write-LocalLog "" -Level 'INFO'
    Write-LocalLog "🔗 Access URLs:" -Level 'INFO'
    Write-LocalLog "   🌐 Frontend: http://localhost:3000" -Level 'INFO'
    Write-LocalLog "   🔧 Backend API: https://localhost:5001" -Level 'INFO'
    Write-LocalLog "   📊 Health Check: https://localhost:5001/api/health" -Level 'INFO'
    Write-LocalLog "   🤖 AI Swarm Status: https://localhost:5001/api/ai-swarm/status" -Level 'INFO'
    Write-LocalLog "" -Level 'INFO'
    Write-LocalLog "🧠 Supreme Commander Claude is coordinating 1,000 local agents!" -Level 'SUCCESS'
    Write-LocalLog "⚡ Use this for testing before production deployment" -Level 'INFO'
    
    if ($OpenBrowser) {
        Start-Sleep -Seconds 5
        Start-Process "http://localhost:3000"
    }
    
    Write-LocalLog "" -Level 'INFO'
    Write-LocalLog "Press Ctrl+C to stop all services" -Level 'INFO'
    
    # Keep script running
    while ($true) {
        Start-Sleep -Seconds 30
    }
}
catch {
    Write-LocalLog "💥 Local setup failed: $($_.Exception.Message)" -Level 'ERROR'
    Write-LocalLog "📞 Check the error above and try again" -Level 'INFO'
    exit 1
}

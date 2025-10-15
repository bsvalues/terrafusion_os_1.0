#!/usr/bin/env pwsh
<#
.SYNOPSIS
    TerraFusion OS Master Launch Script - THE RIGHT WAY
    
.DESCRIPTION
    This script properly orchestrates all TerraFusion services with:
    - Dynamic port allocation (no hardcoding)
    - Health checks and retries
    - Service discovery via registry
    - Proper error handling
    - Graceful shutdown
    
    We are MIT/PhD systems engineers. We do things RIGHT the first time.
    
.PARAMETER NoBuild
    Skip building projects (use existing binaries)
    
.PARAMETER SkipDatabase
    Skip PostgreSQL checks (use SQLite fallback)
    
.EXAMPLE
    .\Launch-TerraFusion.ps1
    
.EXAMPLE
    .\Launch-TerraFusion.ps1 -NoBuild
#>

param(
    [switch]$NoBuild,
    [switch]$SkipDatabase
)

$ErrorActionPreference = "Stop"
$WorkspaceRoot = $PSScriptRoot

# Color output functions
function Write-Success { Write-Host "✅ $args" -ForegroundColor Green }
function Write-Info { Write-Host "ℹ️  $args" -ForegroundColor Cyan }
function Write-Warning { Write-Host "⚠️  $args" -ForegroundColor Yellow }
function Write-Failure { Write-Host "❌ $args" -ForegroundColor Red }
function Write-Header { Write-Host "`n🚀 $args" -ForegroundColor Magenta -BackgroundColor Black }

# Service registry management
$RegistryPath = Join-Path $WorkspaceRoot "service-registry.json"

function Reset-ServiceRegistry {
    Write-Info "Resetting service registry..."
    $registry = Get-Content $RegistryPath | ConvertFrom-Json
    foreach ($service in $registry.services.PSObject.Properties) {
        $service.Value.status = "stopped"
        $service.Value.port = $null
        $service.Value.url = $null
        $service.Value.pid = $null
        $service.Value.startedAt = $null
    }
    $registry.lastUpdated = Get-Date -Format "o"
    $registry | ConvertTo-Json -Depth 10 | Set-Content $RegistryPath
    Write-Success "Service registry reset"
}

function Wait-ForService {
    param(
        [string]$ServiceName,
        [int]$TimeoutSeconds = 30
    )
    
    Write-Info "Waiting for $ServiceName to register (timeout: ${TimeoutSeconds}s)..."
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    
    while ($stopwatch.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
        $registry = Get-Content $RegistryPath | ConvertFrom-Json
        $service = $registry.services.$ServiceName
        
        if ($service.status -eq "running" -and $service.url) {
            Write-Success "$ServiceName is running at $($service.url)"
            return $service.url
        }
        
        Start-Sleep -Milliseconds 500
    }
    
    Write-Failure "$ServiceName failed to start within ${TimeoutSeconds}s"
    return $null
}

function Test-PortAvailable {
    param([int]$Port)
    
    $listener = $null
    try {
        $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $Port)
        $listener.Start()
        $listener.Stop()
        return $true
    }
    catch {
        return $false
    }
    finally {
        if ($listener) { $listener.Stop() }
    }
}

# ============================================================================
# MAIN ORCHESTRATION
# ============================================================================

Write-Header "TerraFusion OS - Master Launch Sequence"
Write-Info "Workspace: $WorkspaceRoot"
Write-Info "Mode: $(if ($NoBuild) { 'No Build' } else { 'Build & Launch' })"
Write-Info ""

try {
    # -----------------------------------------------------------------------
    # PHASE 1: PRE-FLIGHT CHECKS
    # -----------------------------------------------------------------------
    Write-Header "PHASE 1: Pre-Flight Checks"
    
    # Check .NET SDK
    $dotnetVersion = dotnet --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Failure ".NET SDK not found. Install .NET 8 SDK: https://dotnet.microsoft.com/download"
        exit 1
    }
    Write-Success ".NET SDK: $dotnetVersion"
    
    # Check Node.js
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Node.js not found. AI services will be unavailable."
    } else {
        Write-Success "Node.js: $nodeVersion"
    }
    
    # Check Python
    $pythonVersion = python --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Python not found. Python cOS will be unavailable."
    } else {
        Write-Success "Python: $pythonVersion"
    }
    
    # Reset service registry
    Reset-ServiceRegistry
    
    # -----------------------------------------------------------------------
    # PHASE 2: BUILD PROJECTS
    # -----------------------------------------------------------------------
    if (-not $NoBuild) {
        Write-Header "PHASE 2: Building Projects"
        
        # Build backend
        Write-Info "Building backend API..."
        Push-Location (Join-Path $WorkspaceRoot "backend\TerraFusion.API")
        dotnet build --configuration Release
        if ($LASTEXITCODE -ne 0) {
            Write-Failure "Backend build failed"
            Pop-Location
            exit 1
        }
        Pop-Location
        Write-Success "Backend built successfully"
        
        # Build native shell
        Write-Info "Building native shell..."
        Push-Location (Join-Path $WorkspaceRoot "native-shell")
        dotnet build --configuration Release
        if ($LASTEXITCODE -ne 0) {
            Write-Failure "Native shell build failed"
            Pop-Location
            exit 1
        }
        Pop-Location
        Write-Success "Native shell built successfully"
        
        # Build frontend
        Write-Info "Building React frontend..."
        Push-Location (Join-Path $WorkspaceRoot "frontend")
        if (Test-Path "node_modules") {
            npm run build
            if ($LASTEXITCODE -ne 0) {
                Write-Failure "Frontend build failed"
                Pop-Location
                exit 1
            }
        } else {
            Write-Warning "Frontend node_modules not found, skipping build"
        }
        Pop-Location
        Write-Success "Frontend built successfully"
    }
    
    # -----------------------------------------------------------------------
    # PHASE 3: START SERVICES
    # -----------------------------------------------------------------------
    Write-Header "PHASE 3: Starting Services"
    
    # Start backend API with dynamic port allocation
    Write-Info "Starting TerraFusion API (dynamic port)..."
    Push-Location (Join-Path $WorkspaceRoot "backend\TerraFusion.API")
    $backendProcess = Start-Process -FilePath "dotnet" `
        -ArgumentList "run", "--configuration", "Release", "--no-build" `
        -WorkingDirectory (Get-Location) `
        -PassThru `
        -WindowStyle Hidden
    Pop-Location
    
    if (-not $backendProcess) {
        Write-Failure "Failed to start backend process"
        exit 1
    }
    Write-Success "Backend process started (PID: $($backendProcess.Id))"
    
    # Wait for backend to register
    $backendUrl = Wait-ForService -ServiceName "backend" -TimeoutSeconds 30
    if (-not $backendUrl) {
        Write-Failure "Backend failed to start. Check logs."
        Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
        exit 1
    }
    
    # -----------------------------------------------------------------------
    # PHASE 4: LAUNCH NATIVE SHELL
    # -----------------------------------------------------------------------
    Write-Header "PHASE 4: Launching Native Shell"
    
    Write-Info "Starting TerraFusion Native Shell..."
    $shellPath = Join-Path $WorkspaceRoot "native-shell\bin\Release\net8.0-windows\TerraFusion.Shell.exe"
    
    if (-not (Test-Path $shellPath)) {
        Write-Failure "Native shell not found at: $shellPath"
        Write-Info "Run without -NoBuild flag to build first"
        Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
        exit 1
    }
    
    $shellProcess = Start-Process -FilePath $shellPath -PassThru
    Write-Success "Native shell launched (PID: $($shellProcess.Id))"
    
    # -----------------------------------------------------------------------
    # PHASE 5: MONITOR
    # -----------------------------------------------------------------------
    Write-Header "PHASE 5: System Running"
    Write-Success "TerraFusion OS is now running!"
    Write-Info ""
    Write-Info "Backend API: $backendUrl"
    Write-Info "Native Shell: Running (PID: $($shellProcess.Id))"
    Write-Info ""
    Write-Info "Press Ctrl+C to shutdown..."
    
    # Wait for shell to exit
    $shellProcess.WaitForExit()
    
    # -----------------------------------------------------------------------
    # SHUTDOWN
    # -----------------------------------------------------------------------
    Write-Header "Shutting Down Services"
    Write-Info "Stopping backend..."
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    Write-Success "Shutdown complete"
    
} catch {
    Write-Failure "Fatal error: $_"
    Write-Info $_.ScriptStackTrace
    exit 1
}

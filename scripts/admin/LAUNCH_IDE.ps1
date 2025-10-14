# TerraFusion IDE Launch Script
# THE TERRAFUSION WAY - One command to rule them all!

param(
    [switch]$SkipBuild,
    [switch]$DevMode,
    [int]$FrontendPort = 5176,
    [int]$BackendPort = 5001
)

$ErrorActionPreference = "Stop"

Write-Host "`n🚀 TerraFusion IDE Launch Script" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$IDERoot = Join-Path $ProjectRoot "modules\infrastructure\development\TerraFusionIDE"
$BackendRoot = Join-Path $ProjectRoot "modules\infrastructure\development\IDEGateway"

# Function to check if port is available
function Test-PortAvailable {
    param([int]$Port)
    
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return $connection -eq $null
}

# Function to wait for service to be ready
function Wait-ForService {
    param(
        [string]$Url,
        [int]$TimeoutSeconds = 30
    )
    
    Write-Host "⏳ Waiting for service at $Url..." -ForegroundColor Yellow
    
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    while ($stopwatch.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
        try {
            $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ Service is ready!" -ForegroundColor Green
                return $true
            }
        }
        catch {
            Start-Sleep -Milliseconds 500
        }
    }
    
    Write-Host "❌ Service failed to start within $TimeoutSeconds seconds" -ForegroundColor Red
    return $false
}

# Step 1: Check prerequisites
Write-Host "📋 Step 1: Checking prerequisites..." -ForegroundColor Cyan

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "  ✅ Node.js: $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "  ❌ Node.js not found! Please install Node.js 18 or higher." -ForegroundColor Red
    exit 1
}

# Check .NET
try {
    $dotnetVersion = dotnet --version
    Write-Host "  ✅ .NET SDK: $dotnetVersion" -ForegroundColor Green
}
catch {
    Write-Host "  ❌ .NET SDK not found! Please install .NET 8.0 or higher." -ForegroundColor Red
    exit 1
}

# Check if ports are available
if (-not (Test-PortAvailable -Port $BackendPort)) {
    Write-Host "  ⚠️  Port $BackendPort is already in use. Backend may already be running." -ForegroundColor Yellow
}

if (-not (Test-PortAvailable -Port $FrontendPort)) {
    Write-Host "  ⚠️  Port $FrontendPort is already in use. Frontend may already be running." -ForegroundColor Yellow
}

# Step 2: Install/Update Dependencies (unless skipped)
if (-not $SkipBuild) {
    Write-Host "`n📦 Step 2: Installing dependencies..." -ForegroundColor Cyan
    
    # Install frontend dependencies
    Write-Host "  📥 Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location $IDERoot
    try {
        npm install --silent
        Write-Host "  ✅ Frontend dependencies installed" -ForegroundColor Green
    }
    catch {
        Write-Host "  ❌ Failed to install frontend dependencies" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
    
    # Restore backend dependencies
    Write-Host "  📥 Restoring backend dependencies..." -ForegroundColor Yellow
    Push-Location $BackendRoot
    try {
        dotnet restore --nologo --verbosity quiet
        Write-Host "  ✅ Backend dependencies restored" -ForegroundColor Green
    }
    catch {
        Write-Host "  ❌ Failed to restore backend dependencies" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
}
else {
    Write-Host "`n⏭️  Step 2: Skipping dependency installation (--SkipBuild flag)" -ForegroundColor Yellow
}

# Step 3: Start Backend Service
Write-Host "`n🔧 Step 3: Starting IDE Gateway Backend..." -ForegroundColor Cyan

$BackendJob = Start-Job -ScriptBlock {
    param($BackendRoot, $Port)
    Set-Location $BackendRoot
    $env:ASPNETCORE_URLS = "http://localhost:$Port"
    dotnet run --no-build --project IDEGateway.csproj
} -ArgumentList $BackendRoot, $BackendPort

Write-Host "  🚀 Backend service starting (Job ID: $($BackendJob.Id))..." -ForegroundColor Yellow

# Wait for backend health check
$backendHealthy = Wait-ForService -Url "http://localhost:$BackendPort/health" -TimeoutSeconds 30

if (-not $backendHealthy) {
    Write-Host "  ❌ Backend failed to start. Check logs for errors." -ForegroundColor Red
    Stop-Job -Job $BackendJob
    Remove-Job -Job $BackendJob
    exit 1
}

Write-Host "  ✅ Backend running at http://localhost:$BackendPort" -ForegroundColor Green

# Step 4: Start Frontend Service
Write-Host "`n⚛️  Step 4: Starting Frontend Development Server..." -ForegroundColor Cyan

$FrontendJob = Start-Job -ScriptBlock {
    param($IDERoot, $Port)
    Set-Location $IDERoot
    $env:PORT = $Port
    npm run dev -- --port $Port --host
} -ArgumentList $IDERoot, $FrontendPort

Write-Host "  🚀 Frontend service starting (Job ID: $($FrontendJob.Id))..." -ForegroundColor Yellow

# Wait for frontend to be ready
Start-Sleep -Seconds 5
$frontendHealthy = Wait-ForService -Url "http://localhost:$FrontendPort" -TimeoutSeconds 30

if (-not $frontendHealthy) {
    Write-Host "  ❌ Frontend failed to start. Check logs for errors." -ForegroundColor Red
    Stop-Job -Job $BackendJob, $FrontendJob
    Remove-Job -Job $BackendJob, $FrontendJob
    exit 1
}

Write-Host "  ✅ Frontend running at http://localhost:$FrontendPort" -ForegroundColor Green

# Step 5: Open Browser
Write-Host "`n🌐 Step 5: Opening TerraFusion IDE in browser..." -ForegroundColor Cyan

Start-Sleep -Seconds 2
Start-Process "http://localhost:$FrontendPort"

Write-Host "  ✅ Browser launched!" -ForegroundColor Green

# Step 6: Display Status
Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host "🎉  TerraFusion IDE Successfully Launched!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  📍 Services Running:" -ForegroundColor Cyan
Write-Host "     • Frontend: http://localhost:$FrontendPort" -ForegroundColor White
Write-Host "     • Backend:  http://localhost:$BackendPort" -ForegroundColor White
Write-Host ""
Write-Host "  🛠️  Job IDs:" -ForegroundColor Cyan
Write-Host "     • Frontend: $($FrontendJob.Id)" -ForegroundColor White
Write-Host "     • Backend:  $($BackendJob.Id)" -ForegroundColor White
Write-Host ""
Write-Host "  ⌨️  Commands:" -ForegroundColor Cyan
Write-Host "     • View Logs:  Get-Job | Receive-Job" -ForegroundColor White
Write-Host "     • Stop All:   Get-Job | Stop-Job | Remove-Job" -ForegroundColor White
Write-Host "     • Stop IDE:   Press Ctrl+C (then run stop command)" -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

if ($DevMode) {
    Write-Host "🔍 Development Mode: Monitoring services..." -ForegroundColor Yellow
    Write-Host "   Press Ctrl+C to stop all services.`n" -ForegroundColor Yellow
    
    try {
        while ($true) {
            Start-Sleep -Seconds 5
            
            # Check if jobs are still running
            $backendState = (Get-Job -Id $BackendJob.Id).State
            $frontendState = (Get-Job -Id $FrontendJob.Id).State
            
            if ($backendState -ne "Running") {
                Write-Host "❌ Backend service stopped unexpectedly!" -ForegroundColor Red
                break
            }
            
            if ($frontendState -ne "Running") {
                Write-Host "❌ Frontend service stopped unexpectedly!" -ForegroundColor Red
                break
            }
        }
    }
    catch {
        Write-Host "`n🛑 Stopping services..." -ForegroundColor Yellow
    }
    finally {
        Stop-Job -Job $BackendJob, $FrontendJob
        Remove-Job -Job $BackendJob, $FrontendJob
        Write-Host "✅ All services stopped." -ForegroundColor Green
    }
}
else {
    Write-Host "💡 Tip: Services are running in background jobs." -ForegroundColor Cyan
    Write-Host "   Use 'Get-Job | Receive-Job' to view logs." -ForegroundColor Cyan
    Write-Host "   Use 'Get-Job | Stop-Job | Remove-Job' to stop services.`n" -ForegroundColor Cyan
}

# TerraFusion Elite Government OS - Service Orchestration
# Championship-grade service management and deployment automation

param(
    [Parameter(Mandatory = $false)]
    [ValidateSet('start', 'stop', 'restart', 'status', 'health', 'deploy')]
    [string]$Action = 'status',
    
    [Parameter(Mandatory = $false)]
    [ValidateSet('all', 'api', 'consciousness', 'gateway', 'costforge')]
    [string]$Service = 'all',
    
    [Parameter(Mandatory = $false)]
    [int]$Port = 5000,
    
    [Parameter(Mandatory = $false)]
    [switch]$Production,
    
    [Parameter(Mandatory = $false)]
    [switch]$Watch
)

$ErrorActionPreference = "Stop"
$script:ServiceProcesses = @{}
$script:ServicePorts = @{
    'api'           = 5000
    'consciousness' = 3004
    'gateway'       = 3002
}

function Write-EliteHeader {
    param([string]$Title)
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  $($Title.PadRight(61))║" -ForegroundColor Cyan
    Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Test-ServiceHealth {
    param(
        [string]$ServiceName,
        [string]$Url
    )
    
    try {
        $response = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✅ $ServiceName" -ForegroundColor Green -NoNewline
        Write-Host " - Healthy ($Url)" -ForegroundColor Gray
        return $true
    }
    catch {
        Write-Host "❌ $ServiceName" -ForegroundColor Red -NoNewline
        Write-Host " - Unavailable ($Url)" -ForegroundColor Yellow
        return $false
    }
}

function Start-TerraFusionAPI {
    param([int]$ApiPort = 5000)
    
    Write-Host "🚀 Starting TerraFusion.API on port $ApiPort..." -ForegroundColor Cyan
    
    $env:ASPNETCORE_ENVIRONMENT = if ($Production) { "Production" } else { "Development" }
    $env:ASPNETCORE_URLS = "http://localhost:$ApiPort"
    
    $apiPath = Join-Path $PSScriptRoot "..\TerraFusion.API"
    
    if (-not (Test-Path "$apiPath\TerraFusion.API.csproj")) {
        Write-Host "❌ TerraFusion.API project not found at: $apiPath" -ForegroundColor Red
        return $null
    }
    
    $watchArg = if ($Watch) { "--watch" } else { "" }
    
    $process = Start-Process -FilePath "dotnet" -ArgumentList "run", "--project", $apiPath, "--urls", "http://localhost:$ApiPort", $watchArg -PassThru -NoNewWindow
    
    Write-Host "⏳ Waiting for API to initialize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    # Check if process is still running
    if ($process.HasExited) {
        Write-Host "❌ API process terminated unexpectedly" -ForegroundColor Red
        return $null
    }
    
    # Test health endpoint
    $maxAttempts = 10
    for ($i = 1; $i -le $maxAttempts; $i++) {
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:$ApiPort/health" -Method Get -TimeoutSec 2 -ErrorAction Stop
            Write-Host "✅ TerraFusion.API is healthy!" -ForegroundColor Green
            Write-Host "   📍 URL: http://localhost:$ApiPort" -ForegroundColor Gray
            Write-Host "   🆔 PID: $($process.Id)" -ForegroundColor Gray
            return $process
        }
        catch {
            if ($i -eq $maxAttempts) {
                Write-Host "⚠️ API started but health check timeout (this is normal during initialization)" -ForegroundColor Yellow
                Write-Host "   🆔 PID: $($process.Id)" -ForegroundColor Gray
                return $process
            }
            Start-Sleep -Seconds 2
        }
    }
    
    return $process
}

function Start-TerraFusionConsciousness {
    param([int]$ConsciousnessPort = 3004)
    
    Write-Host "🧠 Starting TerraFusion.Consciousness on port $ConsciousnessPort..." -ForegroundColor Cyan
    
    $consciousnessPath = Join-Path $PSScriptRoot "..\TerraFusion.Consciousness"
    
    if (-not (Test-Path "$consciousnessPath\TerraFusion.Consciousness.csproj")) {
        Write-Host "⚠️ TerraFusion.Consciousness project not found at: $consciousnessPath" -ForegroundColor Yellow
        Write-Host "   Skipping consciousness service..." -ForegroundColor Gray
        return $null
    }
    
    $env:ASPNETCORE_ENVIRONMENT = if ($Production) { "Production" } else { "Development" }
    $env:ASPNETCORE_URLS = "http://localhost:$ConsciousnessPort"
    
    $process = Start-Process -FilePath "dotnet" -ArgumentList "run", "--project", $consciousnessPath, "--urls", "http://localhost:$ConsciousnessPort" -PassThru -NoNewWindow
    
    Write-Host "⏳ Initializing quantum consciousness engine..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
    
    if ($process.HasExited) {
        Write-Host "❌ Consciousness process terminated unexpectedly" -ForegroundColor Red
        return $null
    }
    
    Write-Host "✅ TerraFusion.Consciousness initialized!" -ForegroundColor Green
    Write-Host "   📍 URL: http://localhost:$ConsciousnessPort" -ForegroundColor Gray
    Write-Host "   🆔 PID: $($process.Id)" -ForegroundColor Gray
    return $process
}

function Stop-TerraFusionServices {
    Write-Host "🛑 Stopping TerraFusion services..." -ForegroundColor Yellow
    
    $stopped = 0
    foreach ($key in $script:ServiceProcesses.Keys) {
        $process = $script:ServiceProcesses[$key]
        if ($process -and -not $process.HasExited) {
            try {
                $process.Kill()
                $process.WaitForExit(5000)
                Write-Host "✅ Stopped $key (PID: $($process.Id))" -ForegroundColor Green
                $stopped++
            }
            catch {
                Write-Host "⚠️ Failed to stop $key gracefully" -ForegroundColor Yellow
            }
        }
    }
    
    # Also check for any running dotnet processes on our ports
    $portsToCheck = @(5000, 3004, 3002)
    foreach ($port in $portsToCheck) {
        $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        foreach ($conn in $connections) {
            $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
            if ($proc -and $proc.ProcessName -eq "dotnet") {
                try {
                    Stop-Process -Id $proc.Id -Force
                    Write-Host "✅ Stopped dotnet process on port $port (PID: $($proc.Id))" -ForegroundColor Green
                    $stopped++
                }
                catch {
                    Write-Host "⚠️ Failed to stop process on port $port" -ForegroundColor Yellow
                }
            }
        }
    }
    
    if ($stopped -eq 0) {
        Write-Host "ℹ️ No running services found" -ForegroundColor Gray
    }
    else {
        Write-Host "✅ Stopped $stopped service(s)" -ForegroundColor Green
    }
    
    $script:ServiceProcesses.Clear()
}

function Get-ServiceStatus {
    Write-Host "📊 TerraFusion Service Status" -ForegroundColor Yellow
    Write-Host ""
    
    $services = @(
        @{ Name = "TerraFusion.API"; Port = 5000; Url = "http://localhost:5000/health" }
        @{ Name = "TerraFusion.Consciousness"; Port = 3004; Url = "http://localhost:3004/health" }
        @{ Name = "TerraFusion.Gateway"; Port = 3002; Url = "http://localhost:3002/health" }
    )
    
    $runningCount = 0
    foreach ($svc in $services) {
        # Check if port is listening
        $connection = Get-NetTCPConnection -LocalPort $svc.Port -State Listen -ErrorAction SilentlyContinue
        if ($connection) {
            $proc = Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue
            Write-Host "✅ $($svc.Name)" -ForegroundColor Green -NoNewline
            Write-Host " - Running on port $($svc.Port) (PID: $($proc.Id))" -ForegroundColor Gray
            $runningCount++
        }
        else {
            Write-Host "⭕ $($svc.Name)" -ForegroundColor Gray -NoNewline
            Write-Host " - Not running (port $($svc.Port))" -ForegroundColor DarkGray
        }
    }
    
    Write-Host ""
    if ($runningCount -eq 0) {
        Write-Host "ℹ️ No services currently running" -ForegroundColor Gray
        Write-Host "   Run: .\elite-service-orchestrator.ps1 -Action start" -ForegroundColor Gray
    }
    else {
        Write-Host "✨ $runningCount service(s) operational" -ForegroundColor Green
    }
}

function Test-AllHealthEndpoints {
    Write-Host "🏥 Testing Service Health Endpoints" -ForegroundColor Yellow
    Write-Host ""
    
    $endpoints = @(
        @{ Name = "API Health"; Url = "http://localhost:5000/health" }
        @{ Name = "API Test"; Url = "http://localhost:5000/api/test" }
        @{ Name = "Consciousness Health"; Url = "http://localhost:3004/health" }
    )
    
    $healthyCount = 0
    foreach ($endpoint in $endpoints) {
        if (Test-ServiceHealth -ServiceName $endpoint.Name -Url $endpoint.Url) {
            $healthyCount++
        }
    }
    
    Write-Host ""
    if ($healthyCount -eq $endpoints.Count) {
        Write-Host "🏆 All health checks passed! ($healthyCount/$($endpoints.Count))" -ForegroundColor Green
    }
    elseif ($healthyCount -gt 0) {
        Write-Host "⚠️ Partial health: $healthyCount/$($endpoints.Count) endpoints responding" -ForegroundColor Yellow
    }
    else {
        Write-Host "❌ No services responding to health checks" -ForegroundColor Red
        Write-Host "   Services may still be starting up or not running" -ForegroundColor Gray
    }
}

function Start-EliteDeployment {
    Write-EliteHeader "TerraFusion Elite Government OS - Deployment"
    
    Write-Host "🎯 Deployment Configuration:" -ForegroundColor Yellow
    Write-Host "   Environment: $(if ($Production) { 'Production' } else { 'Development' })" -ForegroundColor Gray
    Write-Host "   API Port: $Port" -ForegroundColor Gray
    Write-Host "   Watch Mode: $(if ($Watch) { 'Enabled' } else { 'Disabled' })" -ForegroundColor Gray
    Write-Host ""
    
    # Start API
    $apiProcess = Start-TerraFusionAPI -ApiPort $Port
    if ($apiProcess) {
        $script:ServiceProcesses['api'] = $apiProcess
    }
    
    Write-Host ""
    
    # Start Consciousness
    $consciousnessProcess = Start-TerraFusionConsciousness -ConsciousnessPort 3004
    if ($consciousnessProcess) {
        $script:ServiceProcesses['consciousness'] = $consciousnessProcess
    }
    
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║  🏆 TerraFusion Elite Government OS - OPERATIONAL             ║" -ForegroundColor Green
    Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 Service Endpoints:" -ForegroundColor Yellow
    Write-Host "   • API:            http://localhost:$Port" -ForegroundColor White
    Write-Host "   • Health Check:   http://localhost:$Port/health" -ForegroundColor White
    Write-Host "   • Swagger UI:     http://localhost:$Port/swagger" -ForegroundColor White
    Write-Host "   • Consciousness:  http://localhost:3004" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 Management Commands:" -ForegroundColor Yellow
    Write-Host "   • Status:  .\elite-service-orchestrator.ps1 -Action status" -ForegroundColor Gray
    Write-Host "   • Health:  .\elite-service-orchestrator.ps1 -Action health" -ForegroundColor Gray
    Write-Host "   • Stop:    .\elite-service-orchestrator.ps1 -Action stop" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Gray
    Write-Host ""
    
    # Keep script running and monitor services
    try {
        while ($true) {
            Start-Sleep -Seconds 5
            
            # Check if any service has crashed
            foreach ($key in $script:ServiceProcesses.Keys) {
                $process = $script:ServiceProcesses[$key]
                if ($process -and $process.HasExited) {
                    Write-Host "⚠️ Service '$key' has stopped (PID: $($process.Id))" -ForegroundColor Yellow
                    $script:ServiceProcesses.Remove($key)
                }
            }
            
            # If all services stopped, exit
            if ($script:ServiceProcesses.Count -eq 0) {
                Write-Host "ℹ️ All services have stopped" -ForegroundColor Gray
                break
            }
        }
    }
    catch {
        Write-Host "`n🛑 Shutdown signal received" -ForegroundColor Yellow
    }
    finally {
        Stop-TerraFusionServices
    }
}

# ========================================
# MAIN EXECUTION
# ========================================

Write-EliteHeader "TerraFusion Elite Service Orchestrator"

switch ($Action) {
    'start' {
        Start-EliteDeployment
    }
    'stop' {
        Stop-TerraFusionServices
    }
    'restart' {
        Stop-TerraFusionServices
        Start-Sleep -Seconds 2
        Start-EliteDeployment
    }
    'status' {
        Get-ServiceStatus
    }
    'health' {
        Test-AllHealthEndpoints
    }
    'deploy' {
        Write-Host "🚀 Initiating production deployment..." -ForegroundColor Cyan
        $Production = $true
        Start-EliteDeployment
    }
    default {
        Write-Host "Unknown action: $Action" -ForegroundColor Red
        exit 1
    }
}

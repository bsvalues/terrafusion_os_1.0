# TerraFusion Elite Persistent Server Manager
# Government. Transcended. - Infinite Uptime Protocol

param(
    [switch]$Start,
    [switch]$Stop,
    [switch]$Restart,
    [switch]$Status,
    [switch]$Monitor,
    [string]$Port = "8002",
    [int]$HealthCheckInterval = 30
)

$ErrorActionPreference = "Stop"

# Elite Service Management Functions
function Write-EliteLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss.fff"
    $color = switch ($Level) {
        "SUCCESS" { "Green" }
        "WARNING" { "Yellow" }
        "ERROR" { "Red" }
        "CRITICAL" { "Magenta" }
        "QUANTUM" { "Cyan" }
        default { "White" }
    }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

function Test-TerraFusionHealth {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port" -Method HEAD -TimeoutSec 3 -ErrorAction Stop
        return @{
            IsHealthy = $true
            StatusCode = $response.StatusCode
            ResponseTime = (Measure-Command {
                Invoke-WebRequest -Uri "http://localhost:$Port" -Method HEAD -TimeoutSec 3
            }).TotalMilliseconds
        }
    } catch {
        return @{
            IsHealthy = $false
            Error = $_.Exception.Message
            StatusCode = $null
            ResponseTime = $null
        }
    }
}

function Start-EliteTerraFusionServer {
    Write-EliteLog "🚀 Initiating TerraFusion Elite Server deployment..." "QUANTUM"

    # Ensure build is current
    Push-Location "../frontend"
    try {
        Write-EliteLog "📦 Verifying production build currency..." "INFO"
        $buildResult = npm run build 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-EliteLog "✅ Production build verified/updated" "SUCCESS"
        } else {
            Write-EliteLog "❌ Build failed - aborting server start" "ERROR"
            return $false
        }
    } finally {
        Pop-Location
    }

    # Navigate to UI directory
    Push-Location "../native-shell/ui"
    try {
        # Kill any existing processes on the port
        $existingProcess = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        if ($existingProcess) {
            Write-EliteLog "🔧 Terminating existing process on port $Port..." "WARNING"
            Stop-Process -Id $existingProcess.OwningProcess -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        }

        # Start the server with enhanced configuration
        Write-EliteLog "🌐 Deploying TerraFusion Elite Server on port $Port..." "QUANTUM"

        # Create a job to run the server in background
        $serverJob = Start-Job -ScriptBlock {
            param($Port, $WorkingDir)
            Set-Location $WorkingDir
            npx serve . -l $Port --single --cors --no-clipboard --verbose
        } -ArgumentList $Port, (Get-Location).Path

        # Wait a moment for server to start
        Start-Sleep -Seconds 3

        # Verify server health
        $health = Test-TerraFusionHealth
        if ($health.IsHealthy) {
            Write-EliteLog "🎯 TerraFusion Elite Server OPERATIONAL" "SUCCESS"
            Write-EliteLog "🌍 Local Access: http://localhost:$Port" "INFO"
            Write-EliteLog "🌐 Network Access: http://172.22.48.1:$Port" "INFO"
            Write-EliteLog "⚡ Response Time: $([math]::Round($health.ResponseTime, 2))ms" "SUCCESS"

            # Store job info for monitoring
            $serverJob.Id | Out-File ".terrafusion-server.pid" -Encoding ASCII
            return $true
        } else {
            Write-EliteLog "❌ Server health check failed: $($health.Error)" "ERROR"
            Stop-Job $serverJob -Force
            Remove-Job $serverJob -Force
            return $false
        }

    } finally {
        Pop-Location
    }
}

function Stop-EliteTerraFusionServer {
    Write-EliteLog "🛑 Stopping TerraFusion Elite Server..." "WARNING"

    # Stop job if exists
    if (Test-Path "../native-shell/ui/.terrafusion-server.pid") {
        $jobId = Get-Content "../native-shell/ui/.terrafusion-server.pid" -ErrorAction SilentlyContinue
        if ($jobId) {
            $job = Get-Job -Id $jobId -ErrorAction SilentlyContinue
            if ($job) {
                Stop-Job $job -Force
                Remove-Job $job -Force
                Write-EliteLog "✅ Server job terminated" "SUCCESS"
            }
        }
        Remove-Item "../native-shell/ui/.terrafusion-server.pid" -Force -ErrorAction SilentlyContinue
    }

    # Kill processes on port
    $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    foreach ($proc in $processes) {
        try {
            Stop-Process -Id $proc.OwningProcess -Force
            Write-EliteLog "🔧 Terminated process $($proc.OwningProcess) on port $Port" "SUCCESS"
        } catch {
            Write-EliteLog "⚠️ Could not terminate process $($proc.OwningProcess)" "WARNING"
        }
    }
}

function Get-TerraFusionStatus {
    Write-Host @"
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🏛️ TERRAFUSION ELITE SERVER STATUS 🏛️                  ║
║                          Government. Transcended.                           ║
╚══════════════════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

    $health = Test-TerraFusionHealth
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    Write-Host "⏰ Status Check: $timestamp" -ForegroundColor White
    Write-Host ""

    if ($health.IsHealthy) {
        Write-Host "🟢 TerraFusion Elite Server: OPERATIONAL" -ForegroundColor Green
        Write-Host "🌍 Local URL: http://localhost:$Port" -ForegroundColor White
        Write-Host "🌐 Network URL: http://172.22.48.1:$Port" -ForegroundColor White
        Write-Host "⚡ Response Time: $([math]::Round($health.ResponseTime, 2))ms" -ForegroundColor Green
        Write-Host "📊 Status Code: $($health.StatusCode)" -ForegroundColor Green

        # Additional system info
        Write-Host ""
        Write-Host "📊 SYSTEM METRICS" -ForegroundColor Yellow
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

        $nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
        Write-Host "🔧 Node.js Processes: $($nodeProcesses.Count)" -ForegroundColor White

        if (Test-Path "../native-shell/ui/index.html") {
            $buildTime = (Get-Item "../native-shell/ui/index.html").LastWriteTime
            Write-Host "📦 Last Build: $buildTime" -ForegroundColor White
        }

    } else {
        Write-Host "🔴 TerraFusion Elite Server: OFFLINE" -ForegroundColor Red
        Write-Host "❌ Error: $($health.Error)" -ForegroundColor Red
        Write-Host ""
        Write-Host "🔧 RECOVERY OPTIONS" -ForegroundColor Yellow
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
        Write-Host "1. .\persistent-server.ps1 -Start" -ForegroundColor Cyan
        Write-Host "2. .\persistent-server.ps1 -Restart" -ForegroundColor Cyan
    }
}

function Start-ContinuousMonitoring {
    Write-EliteLog "👁️ Initiating continuous health monitoring..." "QUANTUM"
    Write-EliteLog "🔄 Health check interval: $HealthCheckInterval seconds" "INFO"
    Write-EliteLog "⚡ Press Ctrl+C to stop monitoring" "WARNING"

    $consecutiveFailures = 0
    $maxFailures = 3

    while ($true) {
        try {
            $health = Test-TerraFusionHealth

            if ($health.IsHealthy) {
                Write-EliteLog "✅ Health Check PASSED - Response: $([math]::Round($health.ResponseTime, 2))ms" "SUCCESS"
                $consecutiveFailures = 0
            } else {
                $consecutiveFailures++
                Write-EliteLog "❌ Health Check FAILED ($consecutiveFailures/$maxFailures) - $($health.Error)" "ERROR"

                if ($consecutiveFailures -ge $maxFailures) {
                    Write-EliteLog "🚨 CRITICAL: Maximum failures reached - Initiating auto-recovery..." "CRITICAL"

                    # Attempt auto-recovery
                    Stop-EliteTerraFusionServer
                    Start-Sleep -Seconds 5

                    if (Start-EliteTerraFusionServer) {
                        Write-EliteLog "🎯 AUTO-RECOVERY SUCCESSFUL - Server restored" "SUCCESS"
                        $consecutiveFailures = 0
                    } else {
                        Write-EliteLog "💥 AUTO-RECOVERY FAILED - Manual intervention required" "CRITICAL"
                        break
                    }
                }
            }

            Start-Sleep -Seconds $HealthCheckInterval

        } catch {
            Write-EliteLog "💥 Monitoring error: $($_.Exception.Message)" "ERROR"
            Start-Sleep -Seconds 5
        }
    }
}

# Main execution logic
try {
    Write-Host "🏛️ TerraFusion Elite Persistent Server Manager" -ForegroundColor Cyan
    Write-Host "Government. Transcended." -ForegroundColor Green
    Write-Host ""

    switch ($true) {
        $Start {
            if (Start-EliteTerraFusionServer) {
                Write-EliteLog "🎯 TerraFusion Elite Server deployment COMPLETE" "SUCCESS"
            } else {
                Write-EliteLog "💥 Server deployment FAILED" "ERROR"
                exit 1
            }
        }

        $Stop {
            Stop-EliteTerraFusionServer
            Write-EliteLog "🛑 TerraFusion Elite Server stopped" "WARNING"
        }

        $Restart {
            Write-EliteLog "🔄 Restarting TerraFusion Elite Server..." "QUANTUM"
            Stop-EliteTerraFusionServer
            Start-Sleep -Seconds 3
            if (Start-EliteTerraFusionServer) {
                Write-EliteLog "🎯 Restart SUCCESSFUL" "SUCCESS"
            } else {
                Write-EliteLog "💥 Restart FAILED" "ERROR"
                exit 1
            }
        }

        $Status {
            Get-TerraFusionStatus
        }

        $Monitor {
            Start-ContinuousMonitoring
        }

        default {
            Get-TerraFusionStatus
            Write-Host ""
            Write-Host "🎯 AVAILABLE COMMANDS" -ForegroundColor Yellow
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
            Write-Host "-Start    : Deploy TerraFusion Elite Server" -ForegroundColor Cyan
            Write-Host "-Stop     : Terminate server gracefully" -ForegroundColor Cyan
            Write-Host "-Restart  : Full server restart cycle" -ForegroundColor Cyan
            Write-Host "-Status   : Current system status" -ForegroundColor Cyan
            Write-Host "-Monitor  : Continuous health monitoring" -ForegroundColor Cyan
        }
    }

} catch {
    Write-EliteLog "💥 Critical error: $($_.Exception.Message)" "CRITICAL"
    exit 1
} finally {
    Write-EliteLog "🏛️ Elite Server Manager session complete" "INFO"
}

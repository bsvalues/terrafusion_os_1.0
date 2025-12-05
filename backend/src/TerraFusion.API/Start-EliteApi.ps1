# ═══════════════════════════════════════════════════════════════
# TERRAFUSION OS - ELITE CONTINUOUS OPERATION LAUNCHER
# Championship-Level 24/7 Government Service Deployment
# Government-Grade Reliability and Monitoring
# THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
# ═══════════════════════════════════════════════════════════════

param(
    [switch]$Production,
    [switch]$Service,
    [switch]$Monitor,
    [int]$Port = 0,
    [string]$Environment = "Production"
)

# Elite Configuration
$EliteConfig = @{
    MaxRestarts = 10
    HealthCheckInterval = 120  # 2 minutes
    RestartDelay = 15         # 15 seconds
    MaxConsecutiveFailures = 3
    LogRetentionDays = 30
}

Write-Host "🏛️ TerraFusion OS - Elite Continuous Operation Launcher" -ForegroundColor Green
Write-Host "🚀 Government. Transcended. - 24/7 Service Excellence" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow

function Write-EliteLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    switch ($Level) {
        "ERROR" { Write-Host $logEntry -ForegroundColor Red }
        "WARN"  { Write-Host $logEntry -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $logEntry -ForegroundColor Green }
        default { Write-Host $logEntry -ForegroundColor White }
    }
    
    # Log to file
    $logFile = "logs/elite-launcher-$(Get-Date -Format 'yyyy-MM-dd').log"
    if (!(Test-Path "logs")) { New-Item -ItemType Directory -Path "logs" -Force | Out-Null }
    Add-Content -Path $logFile -Value $logEntry
}

function Test-EliteApiHealth {
    param([string]$ApiUrl)
    
    try {
        $response = Invoke-RestMethod -Uri "$ApiUrl/health" -TimeoutSec 10 -ErrorAction Stop
        Write-EliteLog "✅ Health check passed for $ApiUrl" "SUCCESS"
        return $true
    }
    catch {
        Write-EliteLog "❌ Health check failed for $ApiUrl : $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Find-EliteApiProcess {
    try {
        # Look for TerraFusion API processes
        $processes = Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | 
                    Where-Object { $_.MainWindowTitle -like "*TerraFusion*" -or $_.ProcessName -eq "dotnet" }
        
        foreach ($process in $processes) {
            # Check if this is our API by testing common ports
            $testPorts = @(5000, 5001, 5002, 52213, 61544)
            foreach ($port in $testPorts) {
                $testUrl = "http://127.0.0.1:$port"
                if (Test-EliteApiHealth -ApiUrl $testUrl) {
                    return @{
                        Process = $process
                        Url = $testUrl
                        Port = $port
                    }
                }
            }
        }
        return $null
    }
    catch {
        Write-EliteLog "Error finding API process: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

function Start-EliteApi {
    param([int]$PortNumber = 0)
    
    try {
        Write-EliteLog "🚀 Starting TerraFusion Elite API..." "INFO"
        
        # Ensure we're in the correct directory
        if (!(Test-Path "TerraFusion.API.csproj")) {
            Write-EliteLog "❌ TerraFusion.API.csproj not found in current directory" "ERROR"
            return $null
        }
        
        # Set environment variables for production
        $env:ASPNETCORE_ENVIRONMENT = $Environment
        $env:TF_PRODUCTION_MODE = "true"
        $env:TF_CONTINUOUS_OPERATION = "true"
        $env:TF_ELITE_MODE = "true"
        
        # Determine URL
        $url = if ($PortNumber -eq 0) { "http://127.0.0.1:0" } else { "http://127.0.0.1:$PortNumber" }
        
        # Start the process
        $processInfo = New-Object System.Diagnostics.ProcessStartInfo
        $processInfo.FileName = "dotnet"
        $processInfo.Arguments = "run --configuration Release --urls `"$url`""
        $processInfo.UseShellExecute = $false
        $processInfo.RedirectStandardOutput = $false
        $processInfo.RedirectStandardError = $false
        $processInfo.CreateNoWindow = $false
        $processInfo.WorkingDirectory = Get-Location
        
        $process = [System.Diagnostics.Process]::Start($processInfo)
        
        if ($process) {
            Write-EliteLog "✅ API process started with PID: $($process.Id)" "SUCCESS"
            
            # Wait for startup
            Write-EliteLog "⏳ Waiting for API initialization..." "INFO"
            Start-Sleep -Seconds 20
            
            # Find the actual port it's listening on
            $apiInfo = Find-EliteApiProcess
            if ($apiInfo) {
                Write-EliteLog "🎯 API detected at: $($apiInfo.Url)" "SUCCESS"
                return $apiInfo
            }
            else {
                Write-EliteLog "⚠️ API process started but could not detect listening port" "WARN"
                return @{
                    Process = $process
                    Url = $url
                    Port = $PortNumber
                }
            }
        }
        else {
            Write-EliteLog "❌ Failed to start API process" "ERROR"
            return $null
        }
    }
    catch {
        Write-EliteLog "❌ Exception starting API: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

function Stop-EliteApi {
    param($ApiInfo)
    
    if ($ApiInfo -and $ApiInfo.Process -and !$ApiInfo.Process.HasExited) {
        try {
            Write-EliteLog "🛑 Stopping API process gracefully..." "INFO"
            
            # Send Ctrl+C for graceful shutdown
            $ApiInfo.Process.CloseMainWindow()
            
            # Wait for graceful shutdown
            $gracefulShutdown = $ApiInfo.Process.WaitForExit(30000)
            
            if (!$gracefulShutdown) {
                Write-EliteLog "⚠️ Graceful shutdown timeout - Force killing process" "WARN"
                $ApiInfo.Process.Kill()
            }
            
            Write-EliteLog "✅ API process stopped" "SUCCESS"
        }
        catch {
            Write-EliteLog "❌ Error stopping API: $($_.Exception.Message)" "ERROR"
        }
    }
}

# Main execution logic
try {
    Write-EliteLog "🎯 Elite Launcher started with parameters: Production=$Production, Service=$Service, Monitor=$Monitor, Port=$Port" "INFO"
    
    if ($Production -or $Service -or $Monitor) {
        Write-EliteLog "🏛️ PRODUCTION MODE ACTIVATED - Continuous Operation Enabled" "SUCCESS"
        
        $restartCount = 0
        $consecutiveFailures = 0
        
        while ($restartCount -lt $EliteConfig.MaxRestarts) {
            try {
                # Start API
                $apiInfo = Start-EliteApi -PortNumber $Port
                
                if ($apiInfo) {
                    $consecutiveFailures = 0
                    Write-EliteLog "🏆 Elite API operational at $($apiInfo.Url)" "SUCCESS"
                    
                    # Monitor loop
                    while ($true) {
                        Start-Sleep -Seconds $EliteConfig.HealthCheckInterval
                        
                        # Check if process is still running
                        if ($apiInfo.Process.HasExited) {
                            Write-EliteLog "⚠️ API process has exited - Restarting..." "WARN"
                            break
                        }
                        
                        # Perform health check
                        if (!(Test-EliteApiHealth -ApiUrl $apiInfo.Url)) {
                            Write-EliteLog "❌ Health check failed - Restarting API..." "ERROR"
                            Stop-EliteApi -ApiInfo $apiInfo
                            break
                        }
                        
                        Write-EliteLog "✅ API health check passed - Service operational" "SUCCESS"
                    }
                }
                else {
                    $consecutiveFailures++
                    Write-EliteLog "❌ Failed to start API (Attempt $($restartCount + 1))" "ERROR"
                }
                
                if ($consecutiveFailures -ge $EliteConfig.MaxConsecutiveFailures) {
                    Write-EliteLog "🚨 Maximum consecutive failures reached - Stopping launcher" "ERROR"
                    break
                }
                
                $restartCount++
                if ($restartCount -lt $EliteConfig.MaxRestarts) {
                    Write-EliteLog "⏳ Waiting $($EliteConfig.RestartDelay) seconds before restart..." "INFO"
                    Start-Sleep -Seconds $EliteConfig.RestartDelay
                }
            }
            catch {
                Write-EliteLog "❌ Exception in monitoring loop: $($_.Exception.Message)" "ERROR"
                $consecutiveFailures++
                Start-Sleep -Seconds $EliteConfig.RestartDelay
            }
        }
        
        Write-EliteLog "🛑 Elite Launcher stopped after $restartCount restart attempts" "WARN"
    }
    else {
        # Single run mode
        Write-EliteLog "🚀 Starting API in single-run mode..." "INFO"
        $apiInfo = Start-EliteApi -PortNumber $Port
        
        if ($apiInfo) {
            Write-EliteLog "🏆 Elite API started successfully at $($apiInfo.Url)" "SUCCESS"
            Write-EliteLog "Press Ctrl+C to stop the API" "INFO"
            
            # Wait for user interrupt
            try {
                while (!$apiInfo.Process.HasExited) {
                    Start-Sleep -Seconds 5
                }
            }
            finally {
                Stop-EliteApi -ApiInfo $apiInfo
            }
        }
    }
}
catch {
    Write-EliteLog "🚨 Critical error in Elite Launcher: $($_.Exception.Message)" "ERROR"
    exit 1
}
finally {
    Write-EliteLog "🏁 Elite Launcher session completed" "INFO"
}

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "🏛️ TerraFusion OS Elite Launcher - Session Complete" -ForegroundColor Green
Write-Host "🚀 Government. Transcended." -ForegroundColor Cyan
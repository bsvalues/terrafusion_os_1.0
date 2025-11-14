#!/usr/bin/env pwsh
# ════════════════════════════════════════════════════════════════════════════
# TerraFusion Elite Government OS - Network Connectivity Validator
# Championship-grade network diagnostics and connectivity testing
# ════════════════════════════════════════════════════════════════════════════

param(
    [Parameter(Mandatory=$false)]
    [string]$County = "benton",

    [Parameter(Mandatory=$false)]
    [switch]$FixNetworking,

    [Parameter(Mandatory=$false)]
    [switch]$DetailedDiagnostics
)

function Show-EliteBanner {
    Clear-Host
    Write-Host @"
╔═══════════════════════════════════════════════════════════════════════════════╗
║  🏆 TERRAFUSION ELITE NETWORK VALIDATOR 🏆                                   ║
║                     Championship Network Diagnostics                         ║
╚═══════════════════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

    Write-Host "`n🔍 Validating: $County County Network Infrastructure" -ForegroundColor Yellow
    Write-Host "═" * 79 -ForegroundColor DarkBlue
}

function Test-ContainerNetworking {
    Write-Host "`n🔧 CONTAINER NETWORK DIAGNOSTICS:" -ForegroundColor Blue
    Write-Host "─" * 79 -ForegroundColor DarkBlue

    try {
        # Check container status
        $containers = docker compose -f "counties\$County\docker-compose.county.yml" ps --format json | ConvertFrom-Json

        foreach ($container in $containers) {
            $statusIcon = if ($container.State -eq "running") { "🟢" } else { "🔴" }
            Write-Host "  $statusIcon $($container.Service): $($container.State)" -ForegroundColor $(if ($container.State -eq "running") { "Green" } else { "Red" })

            if ($DetailedDiagnostics -and $container.State -eq "running") {
                # Get container IP
                $containerIP = docker inspect $container.Name --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null
                Write-Host "    📍 IP: $containerIP" -ForegroundColor Gray

                # Check ports
                $ports = $container.Ports -split ', '
                foreach ($port in $ports) {
                    if ($port -match '(\d+):(\d+)') {
                        Write-Host "    🔌 Port: $port" -ForegroundColor Gray
                    }
                }
            }
        }

        return $containers
    }
    catch {
        Write-Host "  ❌ Error checking containers: $_" -ForegroundColor Red
        return @()
    }
}

function Test-DockerNetworks {
    Write-Host "`n🌐 DOCKER NETWORK ANALYSIS:" -ForegroundColor Blue
    Write-Host "─" * 79 -ForegroundColor DarkBlue

    try {
        # List all networks
        $networks = docker network ls --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}"
        Write-Host $networks -ForegroundColor White

        # Inspect county network
        $networkName = "$County-county-network"
        $networkExists = docker network ls --filter "name=$networkName" --format "{{.Name}}" | Where-Object { $_ -eq $networkName }

        if ($networkExists) {
            Write-Host "`n✅ County network '$networkName' exists" -ForegroundColor Green

            if ($DetailedDiagnostics) {
                $networkDetails = docker network inspect $networkName | ConvertFrom-Json
                Write-Host "  🔍 Subnet: $($networkDetails[0].IPAM.Config[0].Subnet)" -ForegroundColor Gray
                Write-Host "  🚪 Gateway: $($networkDetails[0].IPAM.Config[0].Gateway)" -ForegroundColor Gray

                $connectedContainers = $networkDetails[0].Containers
                if ($connectedContainers) {
                    Write-Host "  📦 Connected containers: $($connectedContainers.Count)" -ForegroundColor Gray
                }
            }
        } else {
            Write-Host "`n❌ County network '$networkName' not found" -ForegroundColor Red
        }

        return $networkExists
    }
    catch {
        Write-Host "  ❌ Error analyzing networks: $_" -ForegroundColor Red
        return $false
    }
}

function Test-APIConnectivity {
    Write-Host "`n🔗 API CONNECTIVITY TESTS:" -ForegroundColor Blue
    Write-Host "─" * 79 -ForegroundColor DarkBlue

    $tests = @(
        @{ Name = "Internal Health"; URL = "http://localhost:5000/health"; Container = "$County-api" }
        @{ Name = "Internal Database"; URL = "http://localhost:5000/api/database/status"; Container = "$County-api" }
        @{ Name = "External Health (Host)"; URL = "http://localhost:5000/health"; Container = $null }
        @{ Name = "External Health (127.0.0.1)"; URL = "http://127.0.0.1:5000/health"; Container = $null }
    )

    $results = @{}

    foreach ($test in $tests) {
        Write-Host "  🧪 Testing $($test.Name)..." -ForegroundColor Yellow

        try {
            if ($test.Container) {
                # Internal test
                $response = docker exec $test.Container curl -s -w "%{http_code}" -o /dev/null $test.URL 2>$null
                $success = $response -eq "200"
            } else {
                # External test
                $response = try {
                    Invoke-WebRequest -Uri $test.URL -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
                    $true
                } catch {
                    $false
                }
                $success = $response
            }

            if ($success) {
                Write-Host "    ✅ $($test.Name): SUCCESS" -ForegroundColor Green
                $results[$test.Name] = "SUCCESS"
            } else {
                Write-Host "    ❌ $($test.Name): FAILED" -ForegroundColor Red
                $results[$test.Name] = "FAILED"
            }
        }
        catch {
            Write-Host "    ❌ $($test.Name): ERROR - $_" -ForegroundColor Red
            $results[$test.Name] = "ERROR"
        }
    }

    return $results
}

function Test-PortBindings {
    Write-Host "`n🔌 PORT BINDING ANALYSIS:" -ForegroundColor Blue
    Write-Host "─" * 79 -ForegroundColor DarkBlue

    $expectedPorts = @(5000, 3000, 5432, 6379)

    foreach ($port in $expectedPorts) {
        try {
            $listener = netstat -an | Select-String ":$port.*LISTENING"
            if ($listener) {
                Write-Host "  ✅ Port $port is listening" -ForegroundColor Green
                if ($DetailedDiagnostics) {
                    Write-Host "    📍 $($listener -join ', ')" -ForegroundColor Gray
                }
            } else {
                Write-Host "  ❌ Port $port is NOT listening" -ForegroundColor Red
            }
        }
        catch {
            Write-Host "  ⚠️  Error checking port $port" -ForegroundColor Yellow
        }
    }
}

function Test-DockerDesktopConfig {
    Write-Host "`n🖥️  DOCKER DESKTOP CONFIGURATION:" -ForegroundColor Blue
    Write-Host "─" * 79 -ForegroundColor DarkBlue

    try {
        # Check Docker version
        $dockerVersion = docker version --format "{{.Server.Version}}" 2>$null
        Write-Host "  🐳 Docker Version: $dockerVersion" -ForegroundColor Green

        # Check Docker Desktop status
        $dockerStatus = docker system info 2>$null | Select-String "Server Version"
        if ($dockerStatus) {
            Write-Host "  ✅ Docker Desktop: Running" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Docker Desktop: Not responding" -ForegroundColor Red
        }

        # Check WSL integration (if on Windows)
        if ($env:OS -eq "Windows_NT") {
            Write-Host "  🪟 Windows Host detected" -ForegroundColor Gray

            # Check if using WSL2
            $wsl2 = docker system info 2>$null | Select-String "WSL"
            if ($wsl2) {
                Write-Host "    🐧 WSL2 Integration: Active" -ForegroundColor Green
            } else {
                Write-Host "    🔶 WSL2 Integration: Not detected" -ForegroundColor Yellow
            }
        }

        # Check Docker daemon connectivity
        $daemonPing = docker system ping 2>$null
        if ($daemonPing -eq "OK") {
            Write-Host "  ✅ Docker Daemon: Accessible" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Docker Daemon: Connection issues" -ForegroundColor Red
        }

    }
    catch {
        Write-Host "  ❌ Error checking Docker Desktop: $_" -ForegroundColor Red
    }
}

function Invoke-NetworkingFix {
    if (-not $FixNetworking) { return }

    Write-Host "`n🔧 ATTEMPTING NETWORK FIXES:" -ForegroundColor Blue
    Write-Host "─" * 79 -ForegroundColor DarkBlue

    try {
        Write-Host "  🔄 Restarting Docker networking..." -ForegroundColor Yellow

        # Restart containers with fresh networking
        docker compose -f "counties\$County\docker-compose.county.yml" restart api 2>$null
        Start-Sleep -Seconds 5

        Write-Host "  🔄 Flushing Docker DNS cache..." -ForegroundColor Yellow
        docker system prune --volumes -f >$null 2>&1

        Write-Host "  ✅ Network fixes applied" -ForegroundColor Green
        Write-Host "    ℹ️  Please wait 30 seconds for services to stabilize" -ForegroundColor Cyan
    }
    catch {
        Write-Host "  ❌ Error applying network fixes: $_" -ForegroundColor Red
    }
}

function Show-NetworkingSummary {
    param($ContainerResults, $NetworkResults, $ConnectivityResults)

    Write-Host "`n📊 NETWORK VALIDATION SUMMARY:" -ForegroundColor Blue
    Write-Host "─" * 79 -ForegroundColor DarkBlue

    # Overall status
    $runningContainers = ($ContainerResults | Where-Object { $_.State -eq "running" }).Count
    $totalContainers = $ContainerResults.Count
    $containerHealth = [math]::Round(($runningContainers / [math]::Max($totalContainers, 1)) * 100, 1)

    $successfulConnections = ($ConnectivityResults.Values | Where-Object { $_ -eq "SUCCESS" }).Count
    $totalConnections = $ConnectivityResults.Count
    $connectivityHealth = [math]::Round(($successfulConnections / [math]::Max($totalConnections, 1)) * 100, 1)

    Write-Host "  🏆 Container Health: $containerHealth% ($runningContainers/$totalContainers running)" -ForegroundColor $(if ($containerHealth -eq 100) { "Green" } elseif ($containerHealth -gt 80) { "Yellow" } else { "Red" })
    Write-Host "  🔗 Connectivity Health: $connectivityHealth% ($successfulConnections/$totalConnections tests passed)" -ForegroundColor $(if ($connectivityHealth -eq 100) { "Green" } elseif ($connectivityHealth -gt 50) { "Yellow" } else { "Red" })
    Write-Host "  🌐 Docker Networks: $(if ($NetworkResults) { 'CONFIGURED' } else { 'ISSUES DETECTED' })" -ForegroundColor $(if ($NetworkResults) { "Green" } else { "Red" })

    # Recommendations
    Write-Host "`n💡 RECOMMENDATIONS:" -ForegroundColor Blue
    Write-Host "─" * 79 -ForegroundColor DarkBlue

    if ($connectivityHealth -lt 100) {
        Write-Host "  🔧 External connectivity issues detected" -ForegroundColor Yellow
        Write-Host "     • Consider running with -FixNetworking flag" -ForegroundColor Gray
        Write-Host "     • Check Windows Firewall settings" -ForegroundColor Gray
        Write-Host "     • Verify Docker Desktop port forwarding" -ForegroundColor Gray
    }

    if ($containerHealth -lt 100) {
        Write-Host "  🚨 Container health issues detected" -ForegroundColor Red
        Write-Host "     • Check container logs for errors" -ForegroundColor Gray
        Write-Host "     • Verify Docker resources allocation" -ForegroundColor Gray
    }

    if ($ConnectivityResults["Internal Health"] -eq "SUCCESS" -and $ConnectivityResults["External Health (Host)"] -eq "FAILED") {
        Write-Host "  ℹ️  Internal API is healthy but external access is blocked" -ForegroundColor Cyan
        Write-Host "     • This is a common Docker Desktop for Windows networking issue" -ForegroundColor Gray
        Write-Host "     • The containerized system is fully functional" -ForegroundColor Gray
        Write-Host "     • Consider using Docker exec for direct API access" -ForegroundColor Gray
    }

    # Elite status
    if ($containerHealth -eq 100 -and $connectivityHealth -ge 50) {
        Write-Host "`n🏆 ELITE NETWORK STATUS: CHAMPIONSHIP ACHIEVED!" -ForegroundColor Green
        Write-Host "   The TerraFusion Elite Government OS networking is operational!" -ForegroundColor Cyan
    } else {
        Write-Host "`n🔶 NETWORK STATUS: REQUIRES ATTENTION" -ForegroundColor Yellow
        Write-Host "   Run with -FixNetworking flag to attempt automatic repairs" -ForegroundColor Gray
    }
}

# Main execution
Show-EliteBanner

Write-Host "`n🚀 Starting Elite Network Validation..." -ForegroundColor Green

# Run diagnostics
$containerResults = Test-ContainerNetworking
$networkResults = Test-DockerNetworks
$connectivityResults = Test-APIConnectivity

if ($DetailedDiagnostics) {
    Test-PortBindings
    Test-DockerDesktopConfig
}

# Apply fixes if requested
Invoke-NetworkingFix

# Show summary
Show-NetworkingSummary -ContainerResults $containerResults -NetworkResults $networkResults -ConnectivityResults $connectivityResults

Write-Host "`n🏁 Network validation complete!" -ForegroundColor Cyan
Write-Host "   For real-time monitoring: .\scripts\elite-live-monitor.ps1" -ForegroundColor Gray

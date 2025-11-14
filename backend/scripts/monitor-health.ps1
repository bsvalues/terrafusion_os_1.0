#!/usr/bin/env pwsh
<#
.SYNOPSIS
    TerraFusion Elite - Health Monitoring & Diagnostics
.DESCRIPTION
    Real-time health monitoring for TerraFusion backend services
    Monitors API, database, AI systems, and consciousness networks
.PARAMETER Continuous
    Run in continuous monitoring mode
.PARAMETER Interval
    Monitoring interval in seconds (default: 30)
.EXAMPLE
    .\monitor-health.ps1
    .\monitor-health.ps1 -Continuous -Interval 10
#>

param(
    [switch]$Continuous,
    [int]$Interval = 30
)

$ErrorActionPreference = 'Stop'
$ApiBaseUrl = "http://localhost:5000"

function Test-ServiceEndpoint {
    param([string]$Url, [string]$Name)

    try {
        $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 5 -UseBasicParsing
        return @{
            Name         = $Name
            Status       = "✅ HEALTHY"
            StatusCode   = $response.StatusCode
            ResponseTime = "OK"
            Color        = "Green"
        }
    }
    catch {
        return @{
            Name         = $Name
            Status       = "❌ DOWN"
            StatusCode   = "N/A"
            ResponseTime = "TIMEOUT"
            Color        = "Red"
        }
    }
}

function Get-HealthReport {
    Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  TERRAFUSION HEALTH MONITOR - $(Get-Date -Format 'HH:mm:ss')             ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

    # Test Core Endpoints
    Write-Host "🔍 Core Services:" -ForegroundColor Yellow
    $endpoints = @(
        @{ Url = "$ApiBaseUrl/"; Name = "API Root" },
        @{ Url = "$ApiBaseUrl/health"; Name = "Health Check" },
        @{ Url = "$ApiBaseUrl/api/swarm/status"; Name = "AI Swarm" },
        @{ Url = "$ApiBaseUrl/api/database/status"; Name = "Database" }
    )

    $results = @()
    foreach ($endpoint in $endpoints) {
        $result = Test-ServiceEndpoint -Url $endpoint.Url -Name $endpoint.Name
        $results += $result
        Write-Host ("  {0,-20} {1}" -f $result.Name, $result.Status) -ForegroundColor $result.Color
    }

    # System Resources
    Write-Host "`n💻 System Resources:" -ForegroundColor Yellow
    $cpu = Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average
    $mem = Get-CimInstance Win32_OperatingSystem
    $memUsed = [math]::Round(($mem.TotalVisibleMemorySize - $mem.FreePhysicalMemory) / $mem.TotalVisibleMemorySize * 100, 1)

    Write-Host ("  CPU Usage:        {0}%" -f [math]::Round($cpu.Average, 1)) -ForegroundColor $(if ($cpu.Average -lt 80) { "Green" }else { "Red" })
    Write-Host ("  Memory Usage:     {0}%" -f $memUsed) -ForegroundColor $(if ($memUsed -lt 80) { "Green" }else { "Yellow" })

    # Process Check
    Write-Host "`n🔧 Backend Processes:" -ForegroundColor Yellow
    $dotnetProcesses = Get-Process -Name "TerraFusion.API" -ErrorAction SilentlyContinue
    if ($dotnetProcesses) {
        foreach ($proc in $dotnetProcesses) {
            Write-Host ("  ✅ PID {0}: {1:N0} MB" -f $proc.Id, ($proc.WorkingSet64 / 1MB)) -ForegroundColor Green
        }
    }
    else {
        Write-Host "  ⚠️  No TerraFusion processes found" -ForegroundColor Yellow
    }

    # Network Ports
    Write-Host "`n🌐 Network Status:" -ForegroundColor Yellow
    $port5000 = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
    if ($port5000) {
        Write-Host "  ✅ Port 5000: LISTENING" -ForegroundColor Green
    }
    else {
        Write-Host "  ❌ Port 5000: NOT LISTENING" -ForegroundColor Red
    }

    # Summary
    $healthyCount = ($results | Where-Object { $_.Status -match "HEALTHY" }).Count
    $totalCount = $results.Count

    Write-Host "`n📊 Summary:" -ForegroundColor Yellow
    Write-Host ("  Services: {0}/{1} Healthy" -f $healthyCount, $totalCount) -ForegroundColor $(if ($healthyCount -eq $totalCount) { "Green" }else { "Yellow" })

    if ($healthyCount -eq $totalCount) {
        Write-Host "`n  🏆 All Systems Operational" -ForegroundColor Green
    }
    else {
        Write-Host "`n  ⚠️  Some Services Need Attention" -ForegroundColor Yellow
    }

    Write-Host ""
}

# Main Execution
if ($Continuous) {
    Write-Host "Starting continuous monitoring (Interval: ${Interval}s, Press Ctrl+C to stop)..." -ForegroundColor Cyan
    while ($true) {
        Clear-Host
        Get-HealthReport
        Start-Sleep -Seconds $Interval
    }
}
else {
    Get-HealthReport
}

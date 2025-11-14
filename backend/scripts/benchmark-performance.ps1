#!/usr/bin/env pwsh
<#
.SYNOPSIS
    TerraFusion Elite - Performance Benchmarking Suite
.DESCRIPTION
    Comprehensive performance testing for API endpoints and AI systems
    Measures response times, throughput, and system capacity
.PARAMETER TestType
    Type of test: Quick, Standard, Comprehensive, Load, Stress
.PARAMETER Iterations
    Number of test iterations (default: 100)
.EXAMPLE
    .\benchmark-performance.ps1 -TestType Quick
    .\benchmark-performance.ps1 -TestType Load -Iterations 1000
#>

param(
    [ValidateSet("Quick", "Standard", "Comprehensive", "Load", "Stress")]
    [string]$TestType = "Quick",
    [int]$Iterations = 100
)

$ErrorActionPreference = 'Stop'
$ApiBaseUrl = "http://localhost:5000"

function Measure-EndpointPerformance {
    param(
        [string]$Url,
        [string]$Name,
        [int]$Iterations = 10
    )

    Write-Host ("  Testing: {0}..." -f $Name) -ForegroundColor Cyan

    $times = @()
    $successes = 0

    for ($i = 1; $i -le $Iterations; $i++) {
        try {
            $sw = [System.Diagnostics.Stopwatch]::StartNew()
            $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 10 -UseBasicParsing
            $sw.Stop()

            if ($response.StatusCode -eq 200) {
                $successes++
                $times += $sw.ElapsedMilliseconds
            }
        }
        catch {
            # Timeout or error
        }

        if ($i % 10 -eq 0) {
            Write-Progress -Activity "Benchmarking $Name" -Status "$i/$Iterations" -PercentComplete (($i / $Iterations) * 100)
        }
    }

    Write-Progress -Activity "Benchmarking $Name" -Completed

    if ($times.Count -gt 0) {
        $avg = ($times | Measure-Object -Average).Average
        $min = ($times | Measure-Object -Minimum).Minimum
        $max = ($times | Measure-Object -Maximum).Maximum
        $p95 = $times | Sort-Object | Select-Object -Skip ([int]($times.Count * 0.95)) -First 1

        return @{
            Name        = $Name
            Iterations  = $Iterations
            Successes   = $successes
            SuccessRate = [math]::Round(($successes / $Iterations) * 100, 2)
            AvgMs       = [math]::Round($avg, 2)
            MinMs       = $min
            MaxMs       = $max
            P95Ms       = $p95
        }
    }
    else {
        return @{
            Name        = $Name
            Iterations  = $Iterations
            Successes   = 0
            SuccessRate = 0
            AvgMs       = "N/A"
            MinMs       = "N/A"
            MaxMs       = "N/A"
            P95Ms       = "N/A"
        }
    }
}

function Start-BenchmarkSuite {
    Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "║  TERRAFUSION PERFORMANCE BENCHMARK - $TestType".PadRight(65) + "║" -ForegroundColor Magenta
    Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Magenta

    # Configure test parameters
    $testIterations = switch ($TestType) {
        "Quick" { 10 }
        "Standard" { 100 }
        "Comprehensive" { 500 }
        "Load" { 1000 }
        "Stress" { 5000 }
    }

    if ($Iterations -ne 100) {
        $testIterations = $Iterations
    }

    Write-Host "📊 Test Configuration:" -ForegroundColor Yellow
    Write-Host "  Type:        $TestType"
    Write-Host "  Iterations:  $testIterations"
    Write-Host "  Base URL:    $ApiBaseUrl`n"

    # Define test endpoints
    $endpoints = @(
        @{ Url = "$ApiBaseUrl/"; Name = "API Root" },
        @{ Url = "$ApiBaseUrl/health"; Name = "Health Check" }
    )

    if ($TestType -in @("Comprehensive", "Load", "Stress")) {
        $endpoints += @(
            @{ Url = "$ApiBaseUrl/api/swarm/status"; Name = "AI Swarm Status" },
            @{ Url = "$ApiBaseUrl/api/database/status"; Name = "Database Status" }
        )
    }

    # Run benchmarks
    Write-Host "🚀 Running Benchmarks..." -ForegroundColor Green
    $results = @()

    foreach ($endpoint in $endpoints) {
        $result = Measure-EndpointPerformance -Url $endpoint.Url -Name $endpoint.Name -Iterations $testIterations
        $results += $result
    }

    # Display Results
    Write-Host "`n📈 Performance Results:`n" -ForegroundColor Yellow
    Write-Host ("  {0,-25} {1,8} {2,8} {3,8} {4,8} {5,10}" -f "Endpoint", "Success%", "Avg(ms)", "Min(ms)", "Max(ms)", "P95(ms)") -ForegroundColor Cyan
    Write-Host ("  " + ("-" * 77)) -ForegroundColor DarkGray

    foreach ($result in $results) {
        $color = if ($result.SuccessRate -ge 99) { "Green" } elseif ($result.SuccessRate -ge 95) { "Yellow" } else { "Red" }
        Write-Host ("  {0,-25} {1,7}% {2,8} {3,8} {4,8} {5,10}" -f
            $result.Name,
            $result.SuccessRate,
            $result.AvgMs,
            $result.MinMs,
            $result.MaxMs,
            $result.P95Ms
        ) -ForegroundColor $color
    }

    # Performance Metrics
    Write-Host "`n📊 System Metrics:" -ForegroundColor Yellow
    $cpu = Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average
    $mem = Get-CimInstance Win32_OperatingSystem
    $memUsed = [math]::Round(($mem.TotalVisibleMemorySize - $mem.FreePhysicalMemory) / $mem.TotalVisibleMemorySize * 100, 1)

    Write-Host ("  CPU Load:    {0}%" -f [math]::Round($cpu.Average, 1))
    Write-Host ("  Memory:      {0}%" -f $memUsed)

    # Calculate throughput
    $totalRequests = $testIterations * $endpoints.Count
    $totalSuccesses = ($results | Measure-Object -Property Successes -Sum).Sum
    $avgResponseTime = ($results | Where-Object { $_.AvgMs -ne "N/A" } | Measure-Object -Property AvgMs -Average).Average

    if ($avgResponseTime -gt 0) {
        $requestsPerSecond = [math]::Round(1000 / $avgResponseTime, 2)

        Write-Host "`n🎯 Performance Summary:" -ForegroundColor Yellow
        Write-Host ("  Total Requests:     {0}" -f $totalRequests)
        Write-Host ("  Successful:         {0}" -f $totalSuccesses)
        Write-Host ("  Overall Success:    {0}%" -f [math]::Round(($totalSuccesses / $totalRequests) * 100, 2))
        Write-Host ("  Avg Response Time:  {0} ms" -f [math]::Round($avgResponseTime, 2))
        Write-Host ("  Throughput:         {0} req/sec" -f $requestsPerSecond) -ForegroundColor Green
    }

    # Performance Grade
    Write-Host "`n🏆 Performance Grade:" -ForegroundColor Yellow
    $overallSuccess = [math]::Round(($totalSuccesses / $totalRequests) * 100, 2)

    $grade = if ($overallSuccess -ge 99.5 -and $avgResponseTime -lt 100) {
        "A+ (Excellent)"
        $gradeColor = "Green"
    }
    elseif ($overallSuccess -ge 98 -and $avgResponseTime -lt 200) {
        "A (Very Good)"
        $gradeColor = "Green"
    }
    elseif ($overallSuccess -ge 95 -and $avgResponseTime -lt 500) {
        "B (Good)"
        $gradeColor = "Yellow"
    }
    elseif ($overallSuccess -ge 90) {
        "C (Fair)"
        $gradeColor = "Yellow"
    }
    else {
        "D (Needs Improvement)"
        $gradeColor = "Red"
    }

    Write-Host "  $grade" -ForegroundColor $gradeColor
    Write-Host ""
}

# Main Execution
try {
    # Check if API is running
    try {
        $null = Invoke-WebRequest -Uri "$ApiBaseUrl/" -Method Get -TimeoutSec 5 -UseBasicParsing
    }
    catch {
        Write-Host "❌ API is not responding at $ApiBaseUrl" -ForegroundColor Red
        Write-Host "   Please start the API first using: .\scripts\start-api.ps1`n" -ForegroundColor Yellow
        exit 1
    }

    Start-BenchmarkSuite

    Write-Host "✅ Benchmark completed successfully`n" -ForegroundColor Green
}
catch {
    Write-Host "❌ Benchmark failed: $_" -ForegroundColor Red
    exit 1
}

#!/usr/bin/env pwsh
# TerraFusion API Smoke Test Script
# Purpose: Validate all health endpoints and core API functionality
# Usage: ./smoke.ps1 [base_url] [database_mode]
# Example: ./smoke.ps1 "http://localhost:5000" "with-db"

param(
    [Parameter(Position=0)]
    [string]$BaseUrl = "http://localhost:5000",

    [Parameter(Position=1)]
    [ValidateSet("with-db", "no-db", "auto")]
    [string]$DatabaseMode = "auto"
)

$ErrorActionPreference = "Continue"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Write-Host "🚀 TerraFusion API Smoke Test - $timestamp" -ForegroundColor Cyan
Write-Host "📍 Base URL: $BaseUrl" -ForegroundColor Yellow
Write-Host "🔧 Database Mode: $DatabaseMode" -ForegroundColor Yellow
Write-Host ""

# Test results tracking
$TestResults = @()
$PassCount = 0
$FailCount = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [int]$ExpectedStatus = 200,
        [string]$ExpectedContent = $null,
        [bool]$IsHealthCheck = $false
    )

    try {
        Write-Host "🔍 Testing: $Name" -NoNewline

        $response = Invoke-RestMethod -Uri $Url -Method GET -TimeoutSec 10 -ErrorAction Stop
        $statusCode = 200  # If we get here, it was successful

        $result = @{
            Name = $Name
            Url = $Url
            Status = "PASS"
            StatusCode = $statusCode
            Response = $response
            Error = $null
        }

        if ($ExpectedContent -and $response -notlike "*$ExpectedContent*") {
            $result.Status = "FAIL"
            $result.Error = "Expected content '$ExpectedContent' not found"
        }

        if ($result.Status -eq "PASS") {
            Write-Host " ✅ PASS" -ForegroundColor Green
            $script:PassCount++
        } else {
            Write-Host " ❌ FAIL" -ForegroundColor Red
            $script:FailCount++
        }

    } catch {
        $result = @{
            Name = $Name
            Url = $Url
            Status = "FAIL"
            StatusCode = $_.Exception.Response.StatusCode.value__ ?? "N/A"
            Response = $null
            Error = $_.Exception.Message
        }

        Write-Host " ❌ FAIL" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        $script:FailCount++
    }

    $TestResults += $result
    return $result
}

# Core Health Endpoints
Write-Host "🏥 Health Check Endpoints" -ForegroundColor Magenta
Test-Endpoint "Liveness Check" "$BaseUrl/healthz" 200
Test-Endpoint "Readiness Check" "$BaseUrl/ready" 200
Test-Endpoint "Legacy Health Check" "$BaseUrl/health" 200

# Version Endpoint with deployment traceability
Write-Host ""
Write-Host "📋 Information Endpoints" -ForegroundColor Magenta
$versionResult = Test-Endpoint "Version Info" "$BaseUrl/api/version" 200
if ($versionResult.Response) {
    Write-Host "   Version: $($versionResult.Response.version)" -ForegroundColor Gray
    Write-Host "   Environment: $($versionResult.Response.environment)" -ForegroundColor Gray
    Write-Host "   Build Time: $($versionResult.Response.build)" -ForegroundColor Gray
    Write-Host "   Git Commit: $($versionResult.Response.commit)" -ForegroundColor Gray
    Write-Host "   Image Tag: $($versionResult.Response.imageTag)" -ForegroundColor Gray
    Write-Host "   Process ID: $($versionResult.Response.deployment.processId)" -ForegroundColor Gray
    Write-Host "   Uptime: $($versionResult.Response.deployment.uptime)" -ForegroundColor Gray
}

# Prometheus Metrics Endpoint
Write-Host ""
Write-Host "📊 Observability Endpoints" -ForegroundColor Magenta
$metricsResult = Test-Endpoint "Prometheus Metrics" "$BaseUrl/metrics" 200
if ($metricsResult.Status -eq "PASS") {
    # Parse some key metrics
    $metricsText = $metricsResult.Response
    if ($metricsText -like "*http_requests_total*") {
        Write-Host "   ✅ HTTP request metrics available" -ForegroundColor Green
    }
    if ($metricsText -like "*dotnet_*") {
        Write-Host "   ✅ .NET runtime metrics available" -ForegroundColor Green
    }
    if ($metricsText -like "*process_*") {
        Write-Host "   ✅ Process metrics available" -ForegroundColor Green
    }
}

# Optional: Core API Endpoints (if available)
Write-Host ""
Write-Host "🔧 Core API Endpoints" -ForegroundColor Magenta
Test-Endpoint "API Root" "$BaseUrl/" 200

# Database connectivity check
Write-Host ""
Write-Host "🗄️ Database Connectivity" -ForegroundColor Magenta
$readyResult = $TestResults | Where-Object { $_.Name -eq "Readiness Check" }
if ($readyResult -and $readyResult.Status -eq "PASS") {
    if ($readyResult.Response -and $readyResult.Response.status -eq "Healthy") {
        Write-Host "   Database: ✅ Connected" -ForegroundColor Green
    } elseif ($readyResult.Response -and $readyResult.Response.status -eq "Degraded") {
        Write-Host "   Database: ⚠️ Degraded (Expected in dev without DB)" -ForegroundColor Yellow
    } else {
        Write-Host "   Database: ❌ Unhealthy" -ForegroundColor Red
    }
}

# Summary
Write-Host ""
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host "✅ Passed: $PassCount" -ForegroundColor Green
Write-Host "❌ Failed: $FailCount" -ForegroundColor Red
Write-Host "📈 Success Rate: $([math]::Round(($PassCount / ($PassCount + $FailCount)) * 100, 1))%" -ForegroundColor Yellow

if ($FailCount -eq 0) {
    Write-Host ""
    Write-Host "🎉 ALL TESTS PASSED! TerraFusion API is operational." -ForegroundColor Green

    # Deployment readiness summary
    Write-Host ""
    Write-Host "🚀 Deployment Readiness Summary" -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host "✅ Liveness: Process running and responsive" -ForegroundColor Green
    Write-Host "✅ Readiness: Dependencies healthy" -ForegroundColor Green
    Write-Host "✅ Observability: Metrics endpoint available" -ForegroundColor Green
    Write-Host "✅ Traceability: Version info with commit/build details" -ForegroundColor Green

    $versionInfo = $TestResults | Where-Object { $_.Name -eq "Version Info" }
    if ($versionInfo -and $versionInfo.Response.commit -and $versionInfo.Response.commit -ne "unknown") {
        Write-Host "✅ CI/CD: Git SHA available for deployment tracking" -ForegroundColor Green
    } else {
        Write-Host "⚠️ CI/CD: Git SHA not set (local development)" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "🔗 Operational URLs:" -ForegroundColor White
    Write-Host "  Health: $BaseUrl/healthz (liveness)" -ForegroundColor Gray
    Write-Host "  Ready:  $BaseUrl/ready (readiness)" -ForegroundColor Gray
    Write-Host "  Metrics: $BaseUrl/metrics (prometheus)" -ForegroundColor Gray
    Write-Host "  Version: $BaseUrl/api/version (deployment info)" -ForegroundColor Gray

    exit 0
} else {
    Write-Host ""
    Write-Host "⚠️ Some tests failed. Check the API logs for details." -ForegroundColor Yellow

    # Show failed tests
    $failedTests = $TestResults | Where-Object { $_.Status -eq "FAIL" }
    if ($failedTests) {
        Write-Host ""
        Write-Host "Failed Tests:" -ForegroundColor Red
        foreach ($test in $failedTests) {
            Write-Host "  - $($test.Name): $($test.Error)" -ForegroundColor Red
        }
    }

    # Production troubleshooting hints
    Write-Host ""
    Write-Host "🔧 Troubleshooting:" -ForegroundColor Cyan
    if ($failedTests | Where-Object { $_.Name -eq "Readiness Check" }) {
        Write-Host "  • Readiness failing: Check database connectivity" -ForegroundColor Yellow
        Write-Host "  • Expected in dev without PostgreSQL running" -ForegroundColor Yellow
    }
    if ($failedTests | Where-Object { $_.Name -eq "Liveness Check" }) {
        Write-Host "  • Liveness failing: API process not responding" -ForegroundColor Red
        Write-Host "  • Check API logs and process status" -ForegroundColor Red
    }

    exit 1
}

# Development Database Helper
if ($DatabaseMode -eq "with-db" -or ($DatabaseMode -eq "auto" -and $FailCount -gt 0)) {
    Write-Host ""
    Write-Host "💡 To start development database:" -ForegroundColor Cyan
    Write-Host "   docker compose -f compose.dev.yml up -d" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 To stop development database:" -ForegroundColor Cyan
    Write-Host "   docker compose -f compose.dev.yml down" -ForegroundColor Gray
}

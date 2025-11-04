# TerraFusion Playground - Frontend Integration Test Script
# Championship-level validation of all 5 endpoints from PowerShell
# Government. Transcended.

$ErrorActionPreference = "Stop"
$API_BASE = "http://localhost:5000/api/playground"

Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   TERRAFUSION PLAYGROUND - FRONTEND INTEGRATION TESTING" -ForegroundColor White
Write-Host "   Government. Transcended." -ForegroundColor Gray
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$testResults = @()
$createdRunId = $null
$totalDuration = 0

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
Write-Host "   Endpoint: GET $API_BASE/health" -ForegroundColor Gray
try {
    $start = Get-Date
    $response = Invoke-RestMethod -Uri "$API_BASE/health" -Method Get -ErrorAction Stop
    $duration = ((Get-Date) - $start).TotalMilliseconds
    $totalDuration += $duration

    Write-Host "   ✅ SUCCESS" -ForegroundColor Green
    Write-Host "   Status: $($response.status)" -ForegroundColor White
    Write-Host "   Timestamp: $($response.timestamp)" -ForegroundColor White
    Write-Host "   Endpoints: $($response.endpoints.Count)" -ForegroundColor White
    Write-Host "   Duration: $([math]::Round($duration, 2))ms" -ForegroundColor Cyan

    $testResults += @{
        Name = "Health Check"
        Status = "PASS"
        Duration = $duration
    }
} catch {
    Write-Host "   ❌ FAILED: $_" -ForegroundColor Red
    $testResults += @{
        Name = "Health Check"
        Status = "FAIL"
        Duration = 0
    }
}
Write-Host ""

Start-Sleep -Milliseconds 500

# Test 2: List Scenarios
Write-Host "Test 2: List Scenarios" -ForegroundColor Yellow
Write-Host "   Endpoint: GET $API_BASE/scenarios" -ForegroundColor Gray
try {
    $start = Get-Date
    $response = Invoke-RestMethod -Uri "$API_BASE/scenarios" -Method Get -ErrorAction Stop
    $duration = ((Get-Date) - $start).TotalMilliseconds
    $totalDuration += $duration

    $scenarios = $response.scenarios
    Write-Host "   ✅ SUCCESS" -ForegroundColor Green
    Write-Host "   Scenarios Found: $($scenarios.Count)" -ForegroundColor White
    foreach ($scenario in $scenarios) {
        Write-Host "      • $($scenario.id): $($scenario.name)" -ForegroundColor Gray
    }
    Write-Host "   Duration: $([math]::Round($duration, 2))ms" -ForegroundColor Cyan

    $testResults += @{
        Name = "List Scenarios"
        Status = "PASS"
        Duration = $duration
    }
} catch {
    Write-Host "   ❌ FAILED: $_" -ForegroundColor Red
    $testResults += @{
        Name = "List Scenarios"
        Status = "FAIL"
        Duration = 0
    }
}
Write-Host ""

Start-Sleep -Milliseconds 500

# Test 3: Start Scenario
Write-Host "Test 3: Start Scenario (hello-world)" -ForegroundColor Yellow
Write-Host "   Endpoint: POST $API_BASE/start" -ForegroundColor Gray
try {
    $start = Get-Date
    $body = @{
        scenarioId = "hello-world"
        parameters = @{
            testParam = "championship-frontend-test"
            timestamp = (Get-Date).ToString("o")
        }
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$API_BASE/start" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
    $duration = ((Get-Date) - $start).TotalMilliseconds
    $totalDuration += $duration

    $createdRunId = $response.runId
    Write-Host "   ✅ SUCCESS" -ForegroundColor Green
    Write-Host "   Scenario: $($response.scenarioId)" -ForegroundColor White
    Write-Host "   Run ID: $($response.runId)" -ForegroundColor White
    Write-Host "   Status: $($response.status)" -ForegroundColor White
    Write-Host "   Started At: $($response.startedAt)" -ForegroundColor White
    Write-Host "   Duration: $([math]::Round($duration, 2))ms" -ForegroundColor Cyan

    $testResults += @{
        Name = "Start Scenario"
        Status = "PASS"
        Duration = $duration
    }
} catch {
    Write-Host "   ❌ FAILED: $_" -ForegroundColor Red
    $testResults += @{
        Name = "Start Scenario"
        Status = "FAIL"
        Duration = 0
    }
}
Write-Host ""

Start-Sleep -Seconds 1

# Test 4: Get Run Status
Write-Host "Test 4: Get Run Status" -ForegroundColor Yellow
if ($createdRunId) {
    Write-Host "   Endpoint: GET $API_BASE/runs/$createdRunId" -ForegroundColor Gray
    try {
        $start = Get-Date
        $response = Invoke-RestMethod -Uri "$API_BASE/runs/$([uri]::EscapeDataString($createdRunId))" -Method Get -ErrorAction Stop
        $duration = ((Get-Date) - $start).TotalMilliseconds
        $totalDuration += $duration

        Write-Host "   ✅ SUCCESS" -ForegroundColor Green
        Write-Host "   Run ID: $($response.id)" -ForegroundColor White
        Write-Host "   Scenario: $($response.scenarioId)" -ForegroundColor White
        Write-Host "   Status: $($response.status)" -ForegroundColor White
        Write-Host "   Started At: $($response.startedAt)" -ForegroundColor White
        if ($response.completedAt) {
            Write-Host "   Completed At: $($response.completedAt)" -ForegroundColor White
        }
        Write-Host "   Duration: $([math]::Round($duration, 2))ms" -ForegroundColor Cyan

        $testResults += @{
            Name = "Get Run Status"
            Status = "PASS"
            Duration = $duration
        }
    } catch {
        Write-Host "   ❌ FAILED: $_" -ForegroundColor Red
        $testResults += @{
            Name = "Get Run Status"
            Status = "FAIL"
            Duration = 0
        }
    }
} else {
    Write-Host "   ⚠️ SKIPPED: No run ID available from previous test" -ForegroundColor Yellow
    $testResults += @{
        Name = "Get Run Status"
        Status = "SKIP"
        Duration = 0
    }
}
Write-Host ""

Start-Sleep -Milliseconds 500

# Test 5: List All Runs
Write-Host "Test 5: List All Runs" -ForegroundColor Yellow
Write-Host "   Endpoint: GET $API_BASE/runs" -ForegroundColor Gray
try {
    $start = Get-Date
    $response = Invoke-RestMethod -Uri "$API_BASE/runs" -Method Get -ErrorAction Stop
    $duration = ((Get-Date) - $start).TotalMilliseconds
    $totalDuration += $duration

    $runs = $response.runs
    Write-Host "   ✅ SUCCESS" -ForegroundColor Green
    Write-Host "   Total Runs: $($runs.Count)" -ForegroundColor White
    if ($runs.Count -gt 0) {
        Write-Host "   Recent Runs:" -ForegroundColor Gray
        $runs | Select-Object -First 3 | ForEach-Object {
            Write-Host "      • $($_.id) - Status: $($_.status) - Scenario: $($_.scenarioId)" -ForegroundColor Gray
        }
    }
    Write-Host "   Duration: $([math]::Round($duration, 2))ms" -ForegroundColor Cyan

    $testResults += @{
        Name = "List All Runs"
        Status = "PASS"
        Duration = $duration
    }
} catch {
    Write-Host "   ❌ FAILED: $_" -ForegroundColor Red
    $testResults += @{
        Name = "List All Runs"
        Status = "FAIL"
        Duration = 0
    }
}
Write-Host ""

# Summary
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   TEST SUMMARY" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$passedCount = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failedCount = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$totalTests = $testResults.Count

Write-Host "Results: $passedCount/$totalTests tests passed" -ForegroundColor $(if ($passedCount -eq $totalTests) { "Green" } else { "Yellow" })
Write-Host ""

# Results Table
$testResults | ForEach-Object {
    $statusColor = switch ($_.Status) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "SKIP" { "Yellow" }
        default { "White" }
    }

    $name = $_.Name.PadRight(20)
    $status = $_.Status.PadRight(6)
    $durationText = if ($_.Duration -gt 0) { "$([math]::Round($_.Duration, 2))ms" } else { "-" }

    Write-Host "$name" -NoNewline -ForegroundColor White
    Write-Host "$status" -NoNewline -ForegroundColor $statusColor
    Write-Host "$durationText" -ForegroundColor Cyan
}

Write-Host ""

# Performance Metrics
if ($totalDuration -gt 0) {
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "   PERFORMANCE METRICS" -ForegroundColor White
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""

    $avgDuration = $totalDuration / ($testResults | Where-Object { $_.Duration -gt 0 }).Count

    Write-Host "Total Duration:   $([math]::Round($totalDuration, 2))ms" -ForegroundColor Cyan
    Write-Host "Average Duration: $([math]::Round($avgDuration, 2))ms" -ForegroundColor Cyan
    Write-Host ""
}

# Final Status
if ($passedCount -eq $totalTests) {
    Write-Host "🏆 CHAMPIONSHIP SUCCESS!" -ForegroundColor Green
    Write-Host "All Playground endpoints operational from frontend!" -ForegroundColor Green
    Write-Host "Government. Transcended. 🚀" -ForegroundColor Cyan
} else {
    Write-Host "⚠️ Some tests failed. Review results above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($createdRunId) {
    Write-Host "📋 Created Run ID: $createdRunId" -ForegroundColor Gray
    Write-Host ""
}

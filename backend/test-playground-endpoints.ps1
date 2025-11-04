# Test script for Playground Phase 4 endpoints
# Championship-level validation testing

Write-Host "`n🎯 ============================================" -ForegroundColor Cyan
Write-Host "   TERRAFUSION PLAYGROUND ENDPOINT VALIDATION" -ForegroundColor Cyan
Write-Host "   Government. Transcended." -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000/api/playground"
$testResults = @()

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Gray
    Write-Host "   Timestamp: $($health.timestamp)" -ForegroundColor Gray
    Write-Host "   Endpoints: $($health.endpoints.Count)" -ForegroundColor Gray
    $testResults += [PSCustomObject]@{Test="Health";Status="PASS"}
} catch {
    Write-Host "❌ FAILED: $_" -ForegroundColor Red
    $testResults += [PSCustomObject]@{Test="Health";Status="FAIL"}
}

Start-Sleep -Milliseconds 500

# Test 2: List Scenarios
Write-Host "`nTest 2: List Scenarios" -ForegroundColor Yellow
try {
    $scenarios = Invoke-RestMethod -Uri "$baseUrl/scenarios" -Method GET
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "   Count: $($scenarios.count)" -ForegroundColor Gray
    foreach ($scenario in $scenarios.scenarios) {
        Write-Host "   📋 $($scenario.id): $($scenario.name)" -ForegroundColor Gray
    }
    $testResults += [PSCustomObject]@{Test="List Scenarios";Status="PASS"}
} catch {
    Write-Host "❌ FAILED: $_" -ForegroundColor Red
    $testResults += [PSCustomObject]@{Test="List Scenarios";Status="FAIL"}
}

Start-Sleep -Milliseconds 500

# Test 3: Start Scenario
Write-Host "`nTest 3: Start Scenario (hello-world)" -ForegroundColor Yellow
try {
    $body = @{ scenarioId = "hello-world" } | ConvertTo-Json
    $startResult = Invoke-RestMethod -Uri "$baseUrl/start" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "   Run ID: $($startResult.runId)" -ForegroundColor Gray
    Write-Host "   Status: $($startResult.status)" -ForegroundColor Gray
    Write-Host "   Started: $($startResult.startedAt)" -ForegroundColor Gray
    $runId = $startResult.runId
    $testResults += [PSCustomObject]@{Test="Start Scenario";Status="PASS"}

    # Wait for scenario to complete
    Start-Sleep -Milliseconds 300

    # Test 4: Get Specific Run
    Write-Host "`nTest 4: Get Run Status ($runId)" -ForegroundColor Yellow
    try {
        $run = Invoke-RestMethod -Uri "$baseUrl/runs/$runId" -Method GET
        Write-Host "✅ SUCCESS" -ForegroundColor Green
        Write-Host "   Run ID: $($run.id)" -ForegroundColor Gray
        Write-Host "   Scenario: $($run.scenarioId)" -ForegroundColor Gray
        Write-Host "   Status: $($run.status)" -ForegroundColor Gray
        if ($run.result) {
            Write-Host "   Result: $($run.result | ConvertTo-Json -Compress)" -ForegroundColor Gray
        }
        $testResults += [PSCustomObject]@{Test="Get Run";Status="PASS"}
    } catch {
        Write-Host "❌ FAILED: $_" -ForegroundColor Red
        $testResults += [PSCustomObject]@{Test="Get Run";Status="FAIL"}
    }

} catch {
    Write-Host "❌ FAILED: $_" -ForegroundColor Red
    $testResults += [PSCustomObject]@{Test="Start Scenario";Status="FAIL"}
}

Start-Sleep -Milliseconds 500

# Test 5: List All Runs
Write-Host "`nTest 5: List All Runs" -ForegroundColor Yellow
try {
    $runs = Invoke-RestMethod -Uri "$baseUrl/runs" -Method GET
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "   Total Runs: $($runs.count)" -ForegroundColor Gray
    foreach ($run in $runs.runs) {
        Write-Host "   🏃 $($run.id): $($run.scenarioId) - $($run.status)" -ForegroundColor Gray
    }
    $testResults += [PSCustomObject]@{Test="List Runs";Status="PASS"}
} catch {
    Write-Host "❌ FAILED: $_" -ForegroundColor Red
    $testResults += [PSCustomObject]@{Test="List Runs";Status="FAIL"}
}

# Summary
Write-Host "`n🏆 ============================================" -ForegroundColor Cyan
Write-Host "   TEST SUMMARY" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

$testResults | Format-Table -AutoSize

$passCount = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$totalCount = $testResults.Count
$passRate = [math]::Round(($passCount / $totalCount) * 100, 2)

Write-Host "`nResults: $passCount/$totalCount tests passed ($passRate%)" -ForegroundColor $(if ($passRate -eq 100) { "Green" } else { "Yellow" })

if ($passRate -eq 100) {
    Write-Host "`n✅ CHAMPIONSHIP SUCCESS - All Playground endpoints OPERATIONAL!" -ForegroundColor Green
    Write-Host "Government. Transcended. 🚀`n" -ForegroundColor Cyan
} else {
    Write-Host "`n⚠️  Some tests failed - review output above`n" -ForegroundColor Yellow
}

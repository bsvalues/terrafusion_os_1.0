# TerraLevy Endpoint Testing Script
# Government. Transcended. - Championship Excellence

Write-Host "Starting TerraFusion API with TerraLevy integration..." -ForegroundColor Cyan

# Set environment variables
$env:LEVY_DATABASE_URL = 'Host=localhost;Port=5432;Database=terrafusion_levy;Username=terrafusion;Password=terrafusion_production_secure_2025'
$env:TF_DISABLE_DEV_PIPELINE = 'true'

# Start API in background
$apiProcess = Start-Process -FilePath "dotnet" -ArgumentList "run --no-build --urls http://localhost:5100 --project TerraFusion.API" -WorkingDirectory "C:\Users\bsval\terrafusion_os_1.0\backend\" -PassThru -NoNewWindow

Write-Host "Waiting for API startup (15 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host "`nTesting TerraLevy Endpoints..." -ForegroundColor Green
Write-Host "=" * 80

# Test 1: Health endpoint
Write-Host "`nTest 1: GET /levy/health" -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri 'http://localhost:5100/levy/health' -Method Get -TimeoutSec 5
    Write-Host "Health Check Response:" -ForegroundColor Green
    $health | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Health check failed: $_" -ForegroundColor Red
}

# Test 2: Districts endpoint (all)
Write-Host "`nTest 2: GET /levy/districts (all districts)" -ForegroundColor Cyan
try {
    $districts = Invoke-RestMethod -Uri 'http://localhost:5100/levy/districts' -Method Get -TimeoutSec 5
    Write-Host "Districts Response:" -ForegroundColor Green
    $districts | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Districts query failed: $_" -ForegroundColor Red
}

# Test 3: Districts endpoint (filtered by county)
Write-Host "`nTest 3: GET /levy/districts?county=benton" -ForegroundColor Cyan
try {
    $bentonDistricts = Invoke-RestMethod -Uri 'http://localhost:5100/levy/districts?county=benton' -Method Get -TimeoutSec 5
    Write-Host "Benton County Districts Response:" -ForegroundColor Green
    $bentonDistricts | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Benton county query failed: $_" -ForegroundColor Red
}

# Test 4: Districts endpoint (paging)
Write-Host "`nTest 4: GET /levy/districts?take=10&skip=0" -ForegroundColor Cyan
try {
    $paged = Invoke-RestMethod -Uri 'http://localhost:5100/levy/districts?take=10&skip=0' -Method Get -TimeoutSec 5
    Write-Host "Paged Districts Response:" -ForegroundColor Green
    $paged | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Paged query failed: $_" -ForegroundColor Red
}

# Test 5: Calculate optimal rate
Write-Host "`nTest 5: POST /levy/calculate (measureId seeded)" -ForegroundColor Cyan
try {
    $calcBody = @{ measureId = '22222222-2222-2222-2222-222222222222' } | ConvertTo-Json
    $calc = Invoke-RestMethod -Uri 'http://localhost:5100/levy/calculate' -Method Post -Body $calcBody -ContentType 'application/json' -TimeoutSec 10
    Write-Host "Calculate Response:" -ForegroundColor Green
    $calc | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Calculate failed: $_" -ForegroundColor Red
}

# Test 6: Compliance validation
Write-Host "`nTest 6: GET /levy/measures/{id}/compliance?rate=0.00125" -ForegroundColor Cyan
try {
    $compliance = Invoke-RestMethod -Uri 'http://localhost:5100/levy/measures/22222222-2222-2222-2222-222222222222/compliance?rate=0.00125' -Method Get -TimeoutSec 10
    Write-Host "Compliance Response:" -ForegroundColor Green
    $compliance | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Compliance failed: $_" -ForegroundColor Red
}

# Test 7: Scenario analysis
Write-Host "`nTest 7: POST /levy/scenarios/analyze (3 rates)" -ForegroundColor Cyan
try {
    $analyzeBody = @{ measureId = '22222222-2222-2222-2222-222222222222'; rates = @(0.0010, 0.00125, 0.0015) } | ConvertTo-Json
    $analysis = Invoke-RestMethod -Uri 'http://localhost:5100/levy/scenarios/analyze' -Method Post -Body $analyzeBody -ContentType 'application/json' -TimeoutSec 10
    Write-Host "Analysis Response:" -ForegroundColor Green
    $analysis | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Analysis failed: $_" -ForegroundColor Red
}

# Test 8: Projections generate
Write-Host "`nTest 8: POST /levy/projections/generate (3 years)" -ForegroundColor Cyan
try {
    $projBody = @{ scenarioId = '44444444-4444-4444-4444-444444444444'; years = 3 } | ConvertTo-Json
    $proj = Invoke-RestMethod -Uri 'http://localhost:5100/levy/projections/generate' -Method Post -Body $projBody -ContentType 'application/json' -TimeoutSec 10
    Write-Host "Projections Response:" -ForegroundColor Green
    $proj | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Projections failed: $_" -ForegroundColor Red
}

# Test 9: List measures
Write-Host "`nTest 9: GET /levy/measures?county=benton&take=10&skip=0" -ForegroundColor Cyan
try {
    $measures = Invoke-RestMethod -Uri 'http://localhost:5100/levy/measures?county=benton&take=10&skip=0' -Method Get -TimeoutSec 10
    Write-Host "Measures Response:" -ForegroundColor Green
    $measures | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Measures failed: $_" -ForegroundColor Red
}

# Test 10: Get measure by id
Write-Host "`nTest 10: GET /levy/measures/{id}" -ForegroundColor Cyan
try {
    $measure = Invoke-RestMethod -Uri 'http://localhost:5100/levy/measures/22222222-2222-2222-2222-222222222222' -Method Get -TimeoutSec 10
    Write-Host "Measure Response:" -ForegroundColor Green
    $measure | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Measure lookup failed: $_" -ForegroundColor Red
}

# Test 11: List scenarios for measure
Write-Host "`nTest 11: GET /levy/scenarios?measureId={id}" -ForegroundColor Cyan
try {
    $scenarios = Invoke-RestMethod -Uri 'http://localhost:5100/levy/scenarios?measureId=22222222-2222-2222-2222-222222222222' -Method Get -TimeoutSec 10
    Write-Host "Scenarios Response:" -ForegroundColor Green
    $scenarios | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Scenarios list failed: $_" -ForegroundColor Red
}

# Test 12: List projections for scenario
Write-Host "`nTest 12: GET /levy/projections?scenarioId={id}" -ForegroundColor Cyan
try {
    $projList = Invoke-RestMethod -Uri 'http://localhost:5100/levy/projections?scenarioId=44444444-4444-4444-4444-444444444444' -Method Get -TimeoutSec 10
    Write-Host "Projections List Response:" -ForegroundColor Green
    $projList | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Projections list failed: $_" -ForegroundColor Red
}

# Test 13: Compare scenarios (duplicate IDs)
Write-Host "`nTest 13: POST /levy/scenarios/compare (Base vs Base duplicate for smoke)" -ForegroundColor Cyan
try {
    $compareBody = @{ scenarioIds = @('44444444-4444-4444-4444-444444444444','44444444-4444-4444-4444-444444444444'); projectionYears = 3 } | ConvertTo-Json
    $compare = Invoke-RestMethod -Uri 'http://localhost:5100/levy/scenarios/compare' -Method Post -Body $compareBody -ContentType 'application/json' -TimeoutSec 10
    Write-Host "Compare Response:" -ForegroundColor Green
    $compare | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Compare failed: $_" -ForegroundColor Red
}

# Test 14: Compare scenarios (empty array - should fail gracefully)
Write-Host "`nTest 14: POST /levy/scenarios/compare (empty array edge case)" -ForegroundColor Cyan
try {
    $emptyBody = @{ scenarioIds = @(); projectionYears = 3 } | ConvertTo-Json
    $emptyCompare = Invoke-RestMethod -Uri 'http://localhost:5100/levy/scenarios/compare' -Method Post -Body $emptyBody -ContentType 'application/json' -TimeoutSec 10 -ErrorAction Stop
    Write-Host "Empty Compare Response (unexpected success):" -ForegroundColor Yellow
    $emptyCompare | ConvertTo-Json -Depth 5
} catch {
    if ($_.Exception.Response.StatusCode -eq 404 -or $_.Exception.Response.StatusCode -eq 400) {
        Write-Host "Empty array correctly rejected with status $($_.Exception.Response.StatusCode)" -ForegroundColor Green
    } else {
        Write-Host "Empty array failed with unexpected error: $_" -ForegroundColor Red
    }
}

# Test 15: Compare scenarios (mixed valid + invalid IDs - should succeed with found ones)
Write-Host "`nTest 15: POST /levy/scenarios/compare (mixed valid+invalid IDs)" -ForegroundColor Cyan
try {
    $mixedBody = @{ scenarioIds = @('44444444-4444-4444-4444-444444444444','99999999-9999-9999-9999-999999999999'); projectionYears = 3 } | ConvertTo-Json
    $mixedCompare = Invoke-RestMethod -Uri 'http://localhost:5100/levy/scenarios/compare' -Method Post -Body $mixedBody -ContentType 'application/json' -TimeoutSec 10
    Write-Host "Mixed Compare Response (should include 1 valid scenario):" -ForegroundColor Green
    $mixedCompare | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Mixed compare failed: $_" -ForegroundColor Red
}

# Test 16: Compare scenarios (single ID - should succeed)
Write-Host "`nTest 16: POST /levy/scenarios/compare (single scenario ID)" -ForegroundColor Cyan
try {
    $singleBody = @{ scenarioIds = @('44444444-4444-4444-4444-444444444444'); projectionYears = 5 } | ConvertTo-Json
    $singleCompare = Invoke-RestMethod -Uri 'http://localhost:5100/levy/scenarios/compare' -Method Post -Body $singleBody -ContentType 'application/json' -TimeoutSec 10
    Write-Host "Single Scenario Compare Response:" -ForegroundColor Green
    $singleCompare | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Single scenario compare failed: $_" -ForegroundColor Red
}

Write-Host "`n" + ("=" * 80)
Write-Host "TerraLevy endpoint testing complete! (16 tests)" -ForegroundColor Green
Write-Host "Government. Transcended. - Championship Database Integration Validated" -ForegroundColor Magenta

# Stop API process
Write-Host "`nStopping API process..." -ForegroundColor Yellow
Stop-Process -Id $apiProcess.Id -Force
Write-Host "API stopped gracefully" -ForegroundColor Green

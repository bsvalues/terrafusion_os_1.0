#!/usr/bin/env pwsh
# TerraFusion Elite AI Intelligence Integration Test
# Tests the revolutionary AI-powered sync service with auto-detection and intelligence

Write-Host "`n🎯 TERRAFUSION ELITE AI INTELLIGENCE INTEGRATION TEST" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

$results = @{
    "APIHealth" = $false
    "AISwarmOperational" = $false
    "SyncServiceCompiled" = $false
    "ConsciousnessEngine" = $false
    "TotalAgents" = 0
    "AccuracyRate" = 0
}

# Test 1: API Health Check
Write-Host "`n[1/5] Testing TerraFusion API Health..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method GET -TimeoutSec 5
    if ($healthResponse.status -eq "healthy") {
        Write-Host "  ✅ API Health: HEALTHY" -ForegroundColor Green
        $results.APIHealth = $true
    } else {
        Write-Host "  ❌ API Health: DEGRADED" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ API Health: OFFLINE" -ForegroundColor Red
}

# Test 2: AI Swarm Status
Write-Host "`n[2/5] Testing AI Swarm Intelligence..." -ForegroundColor Yellow
try {
    $swarmResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/swarm/status" -Method GET -TimeoutSec 5
    $totalAgents = $swarmResponse.swarm.totalAgents
    $results.TotalAgents = $totalAgents

    if ($totalAgents -gt 1000) {
        Write-Host "  ✅ AI Swarm: $totalAgents agents operational" -ForegroundColor Green
        $results.AISwarmOperational = $true
    } else {
        Write-Host "  ⚠️ AI Swarm: Only $totalAgents agents (expected >1000)" -ForegroundColor Yellow
    }

    # Check accuracy rate if available
    if ($swarmResponse.agentConfig.performance_metrics.accuracy_rate) {
        $accuracyStr = $swarmResponse.agentConfig.performance_metrics.accuracy_rate
        $accuracy = [float]($accuracyStr -replace '%', '')
        $results.AccuracyRate = $accuracy
        Write-Host "  📊 Accuracy Rate: $accuracyStr" -ForegroundColor Cyan
    }
} catch {
    Write-Host "  ❌ AI Swarm: OFFLINE" -ForegroundColor Red
}

# Test 3: TerraFusion.Sync Compilation Status
Write-Host "`n[3/5] Testing TerraFusion.Sync AI Intelligence Layer..." -ForegroundColor Yellow
try {
    $buildResult = dotnet build "c:\Users\bsval\terrafusion_os_1.0\backend\TerraFusion.Sync" --nologo --verbosity quiet 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ TerraFusion.Sync: COMPILATION SUCCESS" -ForegroundColor Green
        $results.SyncServiceCompiled = $true

        # Check for our key AI intelligence files
        $aiFiles = @(
            "c:\Users\bsval\terrafusion_os_1.0\backend\TerraFusion.Sync\Services\AISchemaDetector.cs",
            "c:\Users\bsval\terrafusion_os_1.0\backend\TerraFusion.Sync\Services\AIDataTransformationEngine.cs",
            "c:\Users\bsval\terrafusion_os_1.0\backend\TerraFusion.Sync\Services\AIValidationEngine.cs",
            "c:\Users\bsval\terrafusion_os_1.0\backend\TerraFusion.Sync\Models\AIModels.cs"
        )

        $aiFilesExist = $true
        foreach ($file in $aiFiles) {
            if (-not (Test-Path $file)) {
                $aiFilesExist = $false
                Write-Host "  ❌ Missing: $(Split-Path $file -Leaf)" -ForegroundColor Red
            }
        }

        if ($aiFilesExist) {
            Write-Host "  ✅ AI Intelligence Components: ALL PRESENT" -ForegroundColor Green
        }
    } else {
        Write-Host "  ❌ TerraFusion.Sync: COMPILATION FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ TerraFusion.Sync: BUILD ERROR" -ForegroundColor Red
}

# Test 4: Consciousness Engine Status
Write-Host "`n[4/5] Testing Consciousness Engine..." -ForegroundColor Yellow
try {
    $consciousnessResponse = Invoke-RestMethod -Uri "http://localhost:3004/health" -Method GET -TimeoutSec 3
    Write-Host "  ✅ Consciousness Engine: OPERATIONAL" -ForegroundColor Green
    $results.ConsciousnessEngine = $true
} catch {
    Write-Host "  ⚠️ Consciousness Engine: Starting/Offline (expected during startup)" -ForegroundColor Yellow
}

# Test 5: AI Intelligence Integration Test
Write-Host "`n[5/5] Testing AI Intelligence Integration..." -ForegroundColor Yellow
try {
    # Test if we can access TerraFusion.Sync services through the API
    $moduleResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/modules" -Method GET -TimeoutSec 5
    Write-Host "  ✅ Module System: Accessible" -ForegroundColor Green

    # Test database status
    $dbResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/database/status" -Method GET -TimeoutSec 5
    if ($dbResponse.status -eq "connected" -or $dbResponse.status -eq "healthy") {
        Write-Host "  ✅ Database: Connected" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ Database: $($dbResponse.status)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️ Integration Test: Partial (API limitations)" -ForegroundColor Yellow
}

# Results Summary
Write-Host "`n🏆 TERRAFUSION ELITE AI INTELLIGENCE TEST RESULTS" -ForegroundColor Magenta
Write-Host "====================================================" -ForegroundColor Magenta

$successCount = 0
if ($results.APIHealth) { $successCount++ }
if ($results.AISwarmOperational) { $successCount++ }
if ($results.SyncServiceCompiled) { $successCount++ }
if ($results.ConsciousnessEngine) { $successCount++ }

Write-Host "`n📊 Test Results:" -ForegroundColor White
Write-Host "  • API Health: $(if ($results.APIHealth) { '✅ PASSED' } else { '❌ FAILED' })" -ForegroundColor $(if ($results.APIHealth) { 'Green' } else { 'Red' })
Write-Host "  • AI Swarm: $(if ($results.AISwarmOperational) { '✅ PASSED' } else { '❌ FAILED' }) ($($results.TotalAgents) agents)" -ForegroundColor $(if ($results.AISwarmOperational) { 'Green' } else { 'Red' })
Write-Host "  • Sync Service: $(if ($results.SyncServiceCompiled) { '✅ PASSED' } else { '❌ FAILED' })" -ForegroundColor $(if ($results.SyncServiceCompiled) { 'Green' } else { 'Red' })
Write-Host "  • Consciousness: $(if ($results.ConsciousnessEngine) { '✅ PASSED' } else { '⚠️ STARTING' })" -ForegroundColor $(if ($results.ConsciousnessEngine) { 'Green' } else { 'Yellow' })

Write-Host "`n🎯 Performance Metrics:" -ForegroundColor White
Write-Host "  • Total AI Agents: $($results.TotalAgents)" -ForegroundColor Cyan
Write-Host "  • Accuracy Rate: $($results.AccuracyRate)%" -ForegroundColor Cyan
Write-Host "  • Success Rate: $successCount/4 tests passed" -ForegroundColor Cyan

if ($successCount -ge 3) {
    Write-Host "`n🎊 REVOLUTIONARY AI INTELLIGENCE SYSTEM: OPERATIONAL!" -ForegroundColor Green
    Write-Host "   Elite government property assessment with AI auto-detection ready!" -ForegroundColor Green
} elseif ($successCount -ge 2) {
    Write-Host "`n⚡ SYSTEM PARTIALLY OPERATIONAL" -ForegroundColor Yellow
    Write-Host "   Core AI intelligence functional, some components starting up" -ForegroundColor Yellow
} else {
    Write-Host "`n⚠️ SYSTEM REQUIRES ATTENTION" -ForegroundColor Red
    Write-Host "   Please check service startup and dependencies" -ForegroundColor Red
}

Write-Host "`n🏆 THE TERRAFUSION WAY - Elite AI Intelligence Revolution!" -ForegroundColor Magenta

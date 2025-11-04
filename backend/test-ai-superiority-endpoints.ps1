#!/usr/bin/env pwsh

# TerraFusion AI Superiority Demonstration - Championship Validation Script
# Validates 1,008 AI agents delivering quantifiable superiority over Harris PACS

param(
    [string]$BaseUrl = "http://localhost:5000",
    [string]$CountyCode = "benton",
    [string]$OutputFile = "ai-superiority-validation-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
)

Write-Host "🚀 TerraFusion AI Superiority Demonstration - Championship Validation" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl" -ForegroundColor Green
Write-Host "County Code: $CountyCode" -ForegroundColor Green
Write-Host "Output File: $OutputFile" -ForegroundColor Green
Write-Host ""

# Initialize results
$ValidationResults = @{
    StartTime = Get-Date
    BaseUrl = $BaseUrl
    CountyCode = $CountyCode
    Tests = @()
    Summary = @{
        Total = 0
        Passed = 0
        Failed = 0
        Warnings = 0
    }
}

function Write-TestResult {
    param(
        [string]$TestName,
        [string]$Status,
        [string]$Message,
        [object]$Data = $null,
        [string]$Color = "White"
    )

    $result = @{
        TestName = $TestName
        Status = $Status
        Message = $Message
        Data = $Data
        Timestamp = Get-Date
    }

    $ValidationResults.Tests += $result
    $ValidationResults.Summary.Total++

    switch ($Status) {
        "PASS" {
            $ValidationResults.Summary.Passed++
            $Color = "Green"
        }
        "FAIL" {
            $ValidationResults.Summary.Failed++
            $Color = "Red"
        }
        "WARN" {
            $ValidationResults.Summary.Warnings++
            $Color = "Yellow"
        }
    }

    Write-Host "[$Status] $TestName - $Message" -ForegroundColor $Color

    if ($Data) {
        Write-Host "   Data: $($Data | ConvertTo-Json -Compress)" -ForegroundColor Gray
    }
}

function Invoke-APITest {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        [object]$Body = $null,
        [hashtable]$Headers = @{}
    )

    try {
        $uri = "$BaseUrl$Endpoint"
        $params = @{
            Uri = $uri
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
        }

        if ($Body) {
            $params.Body = $Body | ConvertTo-Json -Depth 10
        }

        $response = Invoke-RestMethod @params
        return @{
            Success = $true
            Data = $response
            StatusCode = 200
        }
    }
    catch {
        return @{
            Success = $false
            Error = $_.Exception.Message
            StatusCode = $_.Exception.Response.StatusCode.value__
        }
    }
}

# Test 1: Get Available Scenarios
Write-Host "🎯 Test 1: Get Available Demonstration Scenarios" -ForegroundColor Yellow
$scenariosTest = Invoke-APITest -Endpoint "/api/aisuperiority/scenarios"

if ($scenariosTest.Success) {
    $scenarios = $scenariosTest.Data
    if ($scenarios -and $scenarios.Count -gt 0) {
        Write-TestResult -TestName "Get Scenarios" -Status "PASS" -Message "Retrieved $($scenarios.Count) scenarios" -Data @{
            ScenarioCount = $scenarios.Count
            ScenarioNames = $scenarios | ForEach-Object { $_.name }
        }

        # Validate scenario structure
        $firstScenario = $scenarios[0]
        $requiredFields = @('scenarioId', 'name', 'description', 'recordCount', 'expectedSuperiority')
        $missingFields = $requiredFields | Where-Object { -not $firstScenario.PSObject.Properties.Name.Contains($_) }

        if ($missingFields.Count -eq 0) {
            Write-TestResult -TestName "Scenario Structure" -Status "PASS" -Message "All required fields present"
        } else {
            Write-TestResult -TestName "Scenario Structure" -Status "FAIL" -Message "Missing fields: $($missingFields -join ', ')"
        }
    } else {
        Write-TestResult -TestName "Get Scenarios" -Status "FAIL" -Message "No scenarios returned"
    }
} else {
    Write-TestResult -TestName "Get Scenarios" -Status "FAIL" -Message "API call failed: $($scenariosTest.Error)"
}

# Test 2: Get AI Swarm Status
Write-Host "`n🤖 Test 2: Get AI Swarm Status" -ForegroundColor Yellow
$swarmTest = Invoke-APITest -Endpoint "/api/aisuperiority/swarm/status"

if ($swarmTest.Success) {
    $swarmStatus = $swarmTest.Data
    if ($swarmStatus) {
        Write-TestResult -TestName "Swarm Status" -Status "PASS" -Message "Retrieved swarm status" -Data @{
            TotalAgents = $swarmStatus.totalAgents
            QuantumOptimized = $swarmStatus.quantumOptimizationEnabled
            ConsciousnessLevel = $swarmStatus.consciousnessLevel
        }

        # Validate target agent count (should be 1,008)
        if ($swarmStatus.totalAgents -eq 1008) {
            Write-TestResult -TestName "Agent Count Target" -Status "PASS" -Message "Correct agent count: 1,008"
        } elseif ($swarmStatus.totalAgents -gt 0) {
            Write-TestResult -TestName "Agent Count Target" -Status "WARN" -Message "Agent count: $($swarmStatus.totalAgents) (target: 1,008)"
        } else {
            Write-TestResult -TestName "Agent Count Target" -Status "FAIL" -Message "No agents deployed"
        }
    } else {
        Write-TestResult -TestName "Swarm Status" -Status "FAIL" -Message "No swarm status returned"
    }
} else {
    Write-TestResult -TestName "Swarm Status" -Status "FAIL" -Message "API call failed: $($swarmTest.Error)"
}

# Test 3: Get Battalion Status
Write-Host "`n🎖️ Test 3: Get AI Battalion Deployment Status" -ForegroundColor Yellow
$battalionTest = Invoke-APITest -Endpoint "/api/aisuperiority/battalions"

if ($battalionTest.Success) {
    $battalions = $battalionTest.Data
    if ($battalions -and $battalions.Count -gt 0) {
        Write-TestResult -TestName "Battalion Status" -Status "PASS" -Message "Retrieved $($battalions.Count) battalions" -Data @{
            BattalionCount = $battalions.Count
            BattalionNames = $battalions | ForEach-Object { $_.name }
            TotalBattalionAgents = ($battalions | ForEach-Object { $_.agentCount } | Measure-Object -Sum).Sum
        }

        # Check for expected battalions (5 specialized battalions)
        $expectedBattalions = @(
            "Property Assessment Intelligence",
            "Data Processing Supremacy",
            "Workflow Automation",
            "Predictive Analytics",
            "Quality Assurance"
        )

        $foundBattalions = $battalions | ForEach-Object { $_.name }
        $missingBattalions = $expectedBattalions | Where-Object { $_ -notin $foundBattalions }

        if ($missingBattalions.Count -eq 0) {
            Write-TestResult -TestName "Battalion Coverage" -Status "PASS" -Message "All expected battalions deployed"
        } else {
            Write-TestResult -TestName "Battalion Coverage" -Status "WARN" -Message "Missing battalions: $($missingBattalions -join ', ')"
        }
    } else {
        Write-TestResult -TestName "Battalion Status" -Status "FAIL" -Message "No battalions returned"
    }
} else {
    Write-TestResult -TestName "Battalion Status" -Status "FAIL" -Message "API call failed: $($battalionTest.Error)"
}

# Test 4: Get Performance Comparison
Write-Host "`n📊 Test 4: Get Performance Comparison Metrics" -ForegroundColor Yellow
$perfTest = Invoke-APITest -Endpoint "/api/aisuperiority/performance/comparison?countyCode=$CountyCode"

if ($perfTest.Success) {
    $perfComparison = $perfTest.Data
    if ($perfComparison -and $perfComparison.terraFusionMetrics -and $perfComparison.harrisPACSMetrics) {
        Write-TestResult -TestName "Performance Comparison" -Status "PASS" -Message "Retrieved performance metrics" -Data @{
            TerraFusionResponseTime = $perfComparison.terraFusionMetrics.averageResponseTime
            HarrisPACSResponseTime = $perfComparison.harrisPACSMetrics.averageResponseTime
            TerraFusionAccuracy = $perfComparison.terraFusionMetrics.accuracy
            HarrisPACSAccuracy = $perfComparison.harrisPACSMetrics.accuracy
        }

        # Validate superiority metrics
        $advantages = $perfComparison.competitiveAdvantages
        if ($advantages) {
            $overallAdvantage = ($advantages.responseTimeAdvantage + $advantages.throughputAdvantage + $advantages.accuracyAdvantage + $advantages.reliabilityAdvantage + $advantages.efficiencyAdvantage) / 5

            if ($overallAdvantage -gt 0.5) {
                Write-TestResult -TestName "Competitive Advantage" -Status "PASS" -Message "Strong competitive advantage: $([math]::Round($overallAdvantage * 100, 1))%"
            } elseif ($overallAdvantage -gt 0.2) {
                Write-TestResult -TestName "Competitive Advantage" -Status "WARN" -Message "Moderate competitive advantage: $([math]::Round($overallAdvantage * 100, 1))%"
            } else {
                Write-TestResult -TestName "Competitive Advantage" -Status "FAIL" -Message "Low competitive advantage: $([math]::Round($overallAdvantage * 100, 1))%"
            }
        }
    } else {
        Write-TestResult -TestName "Performance Comparison" -Status "FAIL" -Message "Incomplete performance data returned"
    }
} else {
    Write-TestResult -TestName "Performance Comparison" -Status "FAIL" -Message "API call failed: $($perfTest.Error)"
}

# Test 5: Launch AI Superiority Demonstration
Write-Host "`n🚀 Test 5: Launch AI Superiority Demonstration" -ForegroundColor Yellow

# Prepare demo launch request
$demoRequest = @{
    countyCode = $CountyCode
    demoType = "comprehensive"
    selectedScenarios = @("mass-assessment", "real-time-sync")
    quantumOptimizationEnabled = $true
    consciousnessLevel = "Elite"
    maxAgents = 1008
}

$launchTest = Invoke-APITest -Endpoint "/api/aisuperiority/launch" -Method "POST" -Body $demoRequest

if ($launchTest.Success) {
    $launchResult = $launchTest.Data
    if ($launchResult -and $launchResult.demoId) {
        Write-TestResult -TestName "Demo Launch" -Status "PASS" -Message "Successfully launched demo: $($launchResult.demoId)" -Data @{
            DemoId = $launchResult.demoId
            PerformanceAdvantage = $launchResult.performanceAdvantage
            AccuracyAdvantage = $launchResult.accuracyAdvantage
            DashboardUrl = $launchResult.liveDashboardUrl
        }

        $global:LaunchedDemoId = $launchResult.demoId

        # Test 6: Get Demo Dashboard
        Write-Host "`n📈 Test 6: Get Demo Dashboard Data" -ForegroundColor Yellow
        Start-Sleep -Seconds 2  # Allow time for demo initialization

        $dashboardTest = Invoke-APITest -Endpoint "/api/aisuperiority/demo/$($launchResult.demoId)/dashboard"

        if ($dashboardTest.Success) {
            $dashboardData = $dashboardTest.Data
            if ($dashboardData) {
                Write-TestResult -TestName "Demo Dashboard" -Status "PASS" -Message "Retrieved dashboard data" -Data @{
                    DemoId = $dashboardData.demoId
                    Status = $dashboardData.status
                    AgentBattalions = $dashboardData.agentBattalions.Count
                    TestResults = $dashboardData.testResults.Count
                }

                # Validate competitive advantage
                if ($dashboardData.competitiveAdvantage -and $dashboardData.competitiveAdvantage.overallSuperiority -gt 0) {
                    Write-TestResult -TestName "Superiority Metrics" -Status "PASS" -Message "Overall superiority: $([math]::Round($dashboardData.competitiveAdvantage.overallSuperiority * 100, 1))%"
                } else {
                    Write-TestResult -TestName "Superiority Metrics" -Status "WARN" -Message "Superiority metrics not yet available"
                }
            } else {
                Write-TestResult -TestName "Demo Dashboard" -Status "FAIL" -Message "No dashboard data returned"
            }
        } else {
            Write-TestResult -TestName "Demo Dashboard" -Status "FAIL" -Message "Dashboard API call failed: $($dashboardTest.Error)"
        }

        # Test 7: Stop Demonstration
        Write-Host "`n🛑 Test 7: Stop Demonstration" -ForegroundColor Yellow
        Start-Sleep -Seconds 1

        $stopTest = Invoke-APITest -Endpoint "/api/aisuperiority/demo/$($launchResult.demoId)/stop" -Method "POST"

        if ($stopTest.Success) {
            Write-TestResult -TestName "Demo Stop" -Status "PASS" -Message "Successfully stopped demonstration"
        } else {
            Write-TestResult -TestName "Demo Stop" -Status "WARN" -Message "Stop API call failed: $($stopTest.Error)"
        }

    } else {
        Write-TestResult -TestName "Demo Launch" -Status "FAIL" -Message "No demo ID returned in launch response"
    }
} else {
    Write-TestResult -TestName "Demo Launch" -Status "FAIL" -Message "Launch API call failed: $($launchTest.Error)"
}

# Generate Summary Report
Write-Host "`n🏆 CHAMPIONSHIP VALIDATION SUMMARY" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Total Tests: $($ValidationResults.Summary.Total)" -ForegroundColor White
Write-Host "Passed: $($ValidationResults.Summary.Passed)" -ForegroundColor Green
Write-Host "Failed: $($ValidationResults.Summary.Failed)" -ForegroundColor Red
Write-Host "Warnings: $($ValidationResults.Summary.Warnings)" -ForegroundColor Yellow

$ValidationResults.EndTime = Get-Date
$ValidationResults.Duration = $ValidationResults.EndTime - $ValidationResults.StartTime

$successRate = if ($ValidationResults.Summary.Total -gt 0) {
    [math]::Round(($ValidationResults.Summary.Passed / $ValidationResults.Summary.Total) * 100, 1)
} else { 0 }

Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 60) { "Yellow" } else { "Red" })
Write-Host "Duration: $($ValidationResults.Duration.TotalSeconds) seconds" -ForegroundColor White

# Championship Status
if ($ValidationResults.Summary.Failed -eq 0 -and $ValidationResults.Summary.Passed -ge 5) {
    Write-Host "`n🏆 CHAMPIONSHIP STATUS: ACHIEVED" -ForegroundColor Green
    Write-Host "TerraFusion AI Superiority Demonstration is ready for production deployment!" -ForegroundColor Green
} elseif ($ValidationResults.Summary.Failed -le 1 -and $ValidationResults.Summary.Passed -ge 4) {
    Write-Host "`n🥈 COMPETITIVE STATUS: ACHIEVED" -ForegroundColor Yellow
    Write-Host "TerraFusion shows strong competitive advantage with minor issues to resolve." -ForegroundColor Yellow
} else {
    Write-Host "`n⚠️ DEVELOPMENT STATUS: REQUIRES ATTENTION" -ForegroundColor Red
    Write-Host "Multiple issues detected. Review failed tests and implement fixes." -ForegroundColor Red
}

# Save results to file
$ValidationResults | ConvertTo-Json -Depth 10 | Out-File -FilePath $OutputFile -Encoding UTF8
Write-Host "`n📄 Detailed results saved to: $OutputFile" -ForegroundColor Cyan

Write-Host "`n🚀 AI Superiority Demonstration validation complete!" -ForegroundColor Cyan

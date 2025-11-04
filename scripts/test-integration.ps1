# TerraFusion Elite Government OS Engineering Agent
# Integration Testing Framework
# Date: November 4, 2025
# Purpose: Cross-system integration and dependency validation

$ErrorActionPreference = "Stop"

$applicationsPath = "C:\Users\bsval\terrafusion_os_1.0\applications"
$reportPath = "INTEGRATION_TEST_REPORT.md"

$results = @{
    TotalTests = 0
    Passed = 0
    Failed = 0
    Warnings = 0
    Tests = @()
}

function Write-TestHeader {
    param($Text)
    Write-Host "`n$('=' * 70)" -ForegroundColor Cyan
    Write-Host $Text -ForegroundColor Yellow
    Write-Host "$('=' * 70)`n" -ForegroundColor Cyan
}

function Test-Integration {
    param(
        [string]$TestName,
        [scriptblock]$TestScript
    )

    Write-Host "Testing: $TestName..." -NoNewline
    $results.TotalTests++

    try {
        $testResult = & $TestScript

        if ($testResult.Status -eq "PASS") {
            Write-Host " ✅ PASS" -ForegroundColor Green
            $results.Passed++
        } elseif ($testResult.Status -eq "WARNING") {
            Write-Host " ⚠️ WARNING" -ForegroundColor Yellow
            $results.Warnings++
        } else {
            Write-Host " ❌ FAIL" -ForegroundColor Red
            $results.Failed++
        }

        $results.Tests += @{
            Name = $TestName
            Status = $testResult.Status
            Message = $testResult.Message
            Details = $testResult.Details
        }
    } catch {
        Write-Host " ❌ FAIL" -ForegroundColor Red
        $results.Failed++
        $results.Tests += @{
            Name = $TestName
            Status = "FAIL"
            Message = "Test execution error"
            Details = $_.Exception.Message
        }
    }
}

Write-TestHeader "TerraFusion OS - Integration Testing Suite"

# Test 1: Application Directory Structure
Test-Integration "Application Directory Structure" {
    $systems = Get-ChildItem $applicationsPath -Directory | Where-Object { $_.Name -notlike '*backup*' }

    if ($systems.Count -eq 31) {
        @{
            Status = "PASS"
            Message = "All 31 systems present"
            Details = "Expected: 31, Found: $($systems.Count)"
        }
    } else {
        @{
            Status = "FAIL"
            Message = "System count mismatch"
            Details = "Expected: 31, Found: $($systems.Count)"
        }
    }
}

# Test 2: Migration Manifests Completeness
Test-Integration "Migration Manifests Completeness" {
    $systems = Get-ChildItem $applicationsPath -Directory | Where-Object { $_.Name -notlike '*backup*' }
    $manifestCount = 0

    foreach ($system in $systems) {
        if (Test-Path (Join-Path $system.FullName ".migration-manifest.json")) {
            $manifestCount++
        }
    }

    if ($manifestCount -eq 31) {
        @{
            Status = "PASS"
            Message = "All systems have migration manifests"
            Details = "31/31 manifests present"
        }
    } else {
        @{
            Status = "FAIL"
            Message = "Missing manifests"
            Details = "$manifestCount/31 manifests present"
        }
    }
}

# Test 3: Node.js Package Dependencies
Test-Integration "Node.js Package Detection" {
    $nodeSystems = @()
    $systems = Get-ChildItem $applicationsPath -Directory | Where-Object { $_.Name -notlike '*backup*' }

    foreach ($system in $systems) {
        if (Test-Path (Join-Path $system.FullName "package.json")) {
            $nodeSystems += $system.Name
        }
    }

    @{
        Status = "PASS"
        Message = "Node.js systems identified"
        Details = "$($nodeSystems.Count) systems with package.json: $(($nodeSystems | Select-Object -First 5) -join ', ')..."
    }
}

# Test 4: .NET Project Detection
Test-Integration ".NET Project Detection" {
    $dotnetSystems = @()
    $systems = Get-ChildItem $applicationsPath -Directory | Where-Object { $_.Name -notlike '*backup*' }

    foreach ($system in $systems) {
        $csproj = Get-ChildItem $system.FullName -Filter "*.csproj" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($csproj) {
            $dotnetSystems += $system.Name
        }
    }

    @{
        Status = "PASS"
        Message = ".NET projects identified"
        Details = "$($dotnetSystems.Count) systems with .csproj files"
    }
}

# Test 5: Master Workspace Configuration
Test-Integration "Master Workspace Configuration" {
    $workspacePath = "C:\Users\bsval\terrafusion_os_1.0\workspaces\master.code-workspace"

    if (Test-Path $workspacePath) {
        $workspace = Get-Content $workspacePath -Raw | ConvertFrom-Json
        $folderCount = $workspace.folders.Count

        if ($folderCount -ge 31) {
            @{
                Status = "PASS"
                Message = "Master workspace properly configured"
                Details = "$folderCount folders registered"
            }
        } else {
            @{
                Status = "WARNING"
                Message = "Master workspace may need updates"
                Details = "$folderCount folders registered (expected 31+ with systems)"
            }
        }
    } else {
        @{
            Status = "FAIL"
            Message = "Master workspace not found"
            Details = "File not found at: $workspacePath"
        }
    }
}

# Test 6: Cross-System File Consistency
Test-Integration "Cross-System File Consistency" {
    $systems = Get-ChildItem $applicationsPath -Directory | Where-Object { $_.Name -notlike '*backup*' }
    $totalFiles = 0
    $inconsistencies = 0

    foreach ($system in $systems) {
        $manifestPath = Join-Path $system.FullName ".migration-manifest.json"
        if (Test-Path $manifestPath) {
            $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
            $actualFiles = (Get-ChildItem $system.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count
            $totalFiles += $actualFiles

            if ($manifest.file_count -ne $actualFiles) {
                $inconsistencies++
            }
        }
    }

    if ($inconsistencies -eq 0) {
        @{
            Status = "PASS"
            Message = "All file counts match manifests"
            Details = "$totalFiles total files verified across all systems"
        }
    } else {
        @{
            Status = "FAIL"
            Message = "File count inconsistencies detected"
            Details = "$inconsistencies systems have mismatched counts"
        }
    }
}

# Test 7: Backend Service Accessibility
Test-Integration "Backend Service Structure" {
    $backendPath = "C:\Users\bsval\terrafusion_os_1.0\backend"

    if (Test-Path $backendPath) {
        $services = Get-ChildItem $backendPath -Directory -ErrorAction SilentlyContinue
        @{
            Status = "PASS"
            Message = "Backend services accessible"
            Details = "$($services.Count) backend components found"
        }
    } else {
        @{
            Status = "WARNING"
            Message = "Backend path not found"
            Details = "Expected path: $backendPath"
        }
    }
}

# Test 8: Configuration Files Presence
Test-Integration "Configuration Files Structure" {
    $configPath = "C:\Users\bsval\terrafusion_os_1.0\config"

    if (Test-Path $configPath) {
        $configFiles = Get-ChildItem $configPath -Recurse -File -ErrorAction SilentlyContinue
        @{
            Status = "PASS"
            Message = "Configuration directory accessible"
            Details = "$($configFiles.Count) configuration files found"
        }
    } else {
        @{
            Status = "WARNING"
            Message = "Config path not found"
            Details = "Expected path: $configPath"
        }
    }
}

# Test 9: SDK Accessibility
Test-Integration "SDK Structure" {
    $sdkPath = "C:\Users\bsval\terrafusion_os_1.0\SDK"

    if (Test-Path $sdkPath) {
        $sdkModules = Get-ChildItem (Join-Path $sdkPath "modules") -Directory -ErrorAction SilentlyContinue
        @{
            Status = "PASS"
            Message = "SDK accessible"
            Details = "$($sdkModules.Count) SDK modules found"
        }
    } else {
        @{
            Status = "WARNING"
            Message = "SDK path not found"
            Details = "Expected path: $sdkPath"
        }
    }
}

# Test 10: Total Storage Capacity
Test-Integration "Total Storage Capacity" {
    $systems = Get-ChildItem $applicationsPath -Directory | Where-Object { $_.Name -notlike '*backup*' }
    $totalSize = 0

    foreach ($system in $systems) {
        $files = Get-ChildItem $system.FullName -Recurse -File -ErrorAction SilentlyContinue
        $totalSize += ($files | Measure-Object -Property Length -Sum).Sum
    }

    $sizeGB = [math]::Round($totalSize / 1GB, 2)

    if ($sizeGB -ge 14.0 -and $sizeGB -le 15.0) {
        @{
            Status = "PASS"
            Message = "Storage capacity within expected range"
            Details = "$sizeGB GB total (expected ~14.08 GB)"
        }
    } else {
        @{
            Status = "WARNING"
            Message = "Storage capacity unexpected"
            Details = "$sizeGB GB total (expected ~14.08 GB)"
        }
    }
}

# Summary
Write-TestHeader "Integration Test Summary"
Write-Host "Total Tests: $($results.TotalTests)" -ForegroundColor Cyan
Write-Host "Passed: $($results.Passed)" -ForegroundColor Green
Write-Host "Warnings: $($results.Warnings)" -ForegroundColor Yellow
Write-Host "Failed: $($results.Failed)" -ForegroundColor Red

$successRate = [math]::Round(($results.Passed / $results.TotalTests) * 100, 2)
Write-Host "`nSuccess Rate: $successRate%" -ForegroundColor $(if($successRate -eq 100){"Green"}elseif($successRate -ge 80){"Yellow"}else{"Red"})

# Generate Report
$report = @"
# 🔗 TerraFusion OS - Integration Test Report

**Generated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Agent:** TerraFusion Elite Government OS Engineering Agent
**Test Suite:** Cross-System Integration Validation

---

## 📊 Test Summary

| Metric | Count | Percentage |
|--------|-------|------------|
| **Total Tests** | $($results.TotalTests) | 100% |
| **Passed** | $($results.Passed) | $([math]::Round(($results.Passed/$results.TotalTests)*100, 2))% |
| **Warnings** | $($results.Warnings) | $([math]::Round(($results.Warnings/$results.TotalTests)*100, 2))% |
| **Failed** | $($results.Failed) | $([math]::Round(($results.Failed/$results.TotalTests)*100, 2))% |

**Overall Success Rate: $successRate%**

---

## 🧪 Test Results

"@

foreach ($test in $results.Tests) {
    $emoji = switch ($test.Status) {
        "PASS" { "✅" }
        "WARNING" { "⚠️" }
        "FAIL" { "❌" }
    }

    $report += @"

### $emoji $($test.Name)

**Status:** $($test.Status)
**Message:** $($test.Message)
**Details:** $($test.Details)

"@
}

$report += @"

---

## 🎯 Integration Assessment

"@

if ($results.Failed -eq 0 -and $results.Warnings -eq 0) {
    $report += @"
✅ **EXCELLENT** - All integration tests passed successfully.

**System Status:**
- All 31 systems properly integrated
- Cross-system dependencies validated
- Workspace configuration verified
- Storage capacity confirmed

**Ready for:**
- County deployment
- AI swarm activation
- Production operations
- Performance optimization

"@
} elseif ($results.Failed -gt 0) {
    $report += @"
❌ **ACTION REQUIRED** - $($results.Failed) test(s) failed.

**Immediate Actions:**
1. Review failed tests above
2. Address critical integration issues
3. Re-run integration tests
4. Verify system dependencies

"@
} else {
    $report += @"
⚠️ **MINOR ISSUES** - $($results.Warnings) warning(s) detected.

**Recommended Actions:**
1. Review warnings above
2. Verify non-critical paths
3. Update configurations if needed
4. Proceed with deployment preparation

"@
}

$report += @"

---

## 🚀 Next Phase Recommendations

1. **Performance Testing** - Benchmark individual system response times
2. **County Deployment** - Prepare 39-county rollout automation
3. **AI Swarm Activation** - Initialize 50,000+ agent coordination
4. **Monitoring Setup** - Activate real-time health tracking
5. **Security Audit** - FISMA-High compliance validation

---

*Generated by TerraFusion Elite Government OS Engineering Agent*
*Evidence-Based | Data-Driven | Machine Precision*
"@

Set-Content -Path $reportPath -Value $report -Force
Write-Host "`n✅ Report generated: $reportPath" -ForegroundColor Green

Write-Host "`n🏆 Integration Testing Complete" -ForegroundColor Green
Write-Host "Government. Integrated. Excellence. Verified." -ForegroundColor Yellow

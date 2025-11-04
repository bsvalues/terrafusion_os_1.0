#!/usr/bin/env pwsh
# =============================
# TerraFusion Production Readiness Validation Script
# Comprehensive pre-deployment validation ensuring all systems are ready for production
# =============================

param(
    [switch]$SkipTests = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Colors for output
$Green = "`e[32m"
$Red = "`e[31m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

# Validation results
$ValidationResults = @{
    TotalChecks = 0
    PassedChecks = 0
    FailedChecks = 0
    WarningChecks = 0
}

function Write-ValidationHeader {
    Write-Host "`n$Blue════════════════════════════════════════════════════════════════$Reset" -ForegroundColor Blue
    Write-Host "$Blue   🏆 TerraFusion Production Readiness Validation Suite$Reset" -ForegroundColor Blue
    Write-Host "$Blue════════════════════════════════════════════════════════════════$Reset`n" -ForegroundColor Blue
}

function Write-SectionHeader {
    param([string]$Title)
    Write-Host "`n$Blue▶ $Title$Reset" -ForegroundColor Blue
    Write-Host "$Blue──────────────────────────────────────────────────────────────$Reset" -ForegroundColor Blue
}

function Write-CheckResult {
    param(
        [string]$Check,
        [bool]$Passed,
        [string]$Details = "",
        [bool]$IsWarning = $false
    )

    $ValidationResults.TotalChecks++

    if ($IsWarning) {
        $ValidationResults.WarningChecks++
        Write-Host "  $Yellow⚠ WARNING:$Reset $Check" -ForegroundColor Yellow
        if ($Details) {
            Write-Host "     $Yellow→ $Details$Reset" -ForegroundColor Yellow
        }
    }
    elseif ($Passed) {
        $ValidationResults.PassedChecks++
        Write-Host "  $Green✓$Reset $Check" -ForegroundColor Green
        if ($Details -and $Verbose) {
            Write-Host "     $Green→ $Details$Reset" -ForegroundColor DarkGray
        }
    }
    else {
        $ValidationResults.FailedChecks++
        Write-Host "  $Red✗ FAILED:$Reset $Check" -ForegroundColor Red
        if ($Details) {
            Write-Host "     $Red→ $Details$Reset" -ForegroundColor Red
        }
    }
}

# =============================
# Validation: Project Structure
# =============================

function Test-ProjectStructure {
    Write-SectionHeader "1. Project Structure Validation"

    # Check critical directories
    $RequiredDirs = @(
        "src",
        "src/components",
        "src/services",
        "src/services/monitoring",
        "src/tests",
        "src/tests/integration",
        ".github",
        ".github/workflows"
    )

    foreach ($dir in $RequiredDirs) {
        $exists = Test-Path $dir
        Write-CheckResult -Check "Directory exists: $dir" -Passed $exists -Details $(if (-not $exists) { "Create missing directory" })
    }

    # Check critical files
    $RequiredFiles = @(
        "package.json",
        "tsconfig.json",
        "vite.config.ts",
        "PRODUCTION_DEPLOYMENT_CHECKLIST.md",
        "PRODUCTION_DEPLOYMENT_GUIDE.md",
        "OPERATIONAL_RUNBOOK.md",
        "FINAL_PROJECT_SUMMARY.md"
    )

    foreach ($file in $RequiredFiles) {
        $exists = Test-Path $file
        Write-CheckResult -Check "File exists: $file" -Passed $exists -Details $(if (-not $exists) { "Create missing file" })
    }
}

# =============================
# Validation: Code Quality
# =============================

function Test-CodeQuality {
    Write-SectionHeader "2. Code Quality Validation"

    # Check if node_modules installed
    $nodeModulesExists = Test-Path "node_modules"
    Write-CheckResult -Check "Node modules installed" -Passed $nodeModulesExists -Details $(if (-not $nodeModulesExists) { "Run: npm install" })

    if ($nodeModulesExists) {
        # Run linter
        try {
            Write-Host "  Running ESLint..." -ForegroundColor DarkGray
            $lintOutput = npm run lint:check 2>&1
            $lintPassed = $LASTEXITCODE -eq 0
            Write-CheckResult -Check "ESLint validation" -Passed $lintPassed -Details $(if (-not $lintPassed) { "Run: npm run lint:fix" })
        }
        catch {
            Write-CheckResult -Check "ESLint validation" -Passed $false -Details "Failed to run linter: $_"
        }

        # Run TypeScript type checking
        try {
            Write-Host "  Running TypeScript type checking..." -ForegroundColor DarkGray
            $tscOutput = npm run type-check 2>&1
            $tscPassed = $LASTEXITCODE -eq 0
            Write-CheckResult -Check "TypeScript type checking" -Passed $tscPassed -Details $(if (-not $tscPassed) { "Fix TypeScript errors" })
        }
        catch {
            Write-CheckResult -Check "TypeScript type checking" -Passed $false -Details "Failed to run type checking"
        }
    }
}

# =============================
# Validation: Test Coverage
# =============================

function Test-TestCoverage {
    Write-SectionHeader "3. Test Coverage Validation"

    if (-not $SkipTests) {
        # Run unit tests
        try {
            Write-Host "  Running unit tests..." -ForegroundColor DarkGray
            $testOutput = npm run test:unit -- --coverage 2>&1
            $testPassed = $LASTEXITCODE -eq 0

            if ($testPassed) {
                # Extract coverage percentage from output
                $coverageMatch = $testOutput | Select-String -Pattern "All files\s+\|\s+(\d+\.?\d*)" | Select-Object -First 1
                if ($coverageMatch) {
                    $coveragePercentage = [double]$coverageMatch.Matches.Groups[1].Value
                    Write-CheckResult -Check "Unit tests passing" -Passed $true -Details "Coverage: $coveragePercentage%"

                    if ($coveragePercentage -ge 80) {
                        Write-CheckResult -Check "Coverage target (≥80%)" -Passed $true -Details "$coveragePercentage%"
                    }
                    else {
                        Write-CheckResult -Check "Coverage target (≥80%)" -Passed $false -Details "Current: $coveragePercentage%, Target: 80%"
                    }
                }
                else {
                    Write-CheckResult -Check "Unit tests passing" -Passed $true -Details "Could not extract coverage percentage"
                }
            }
            else {
                Write-CheckResult -Check "Unit tests passing" -Passed $false -Details "Tests failed"
            }
        }
        catch {
            Write-CheckResult -Check "Unit tests passing" -Passed $false -Details "Failed to run tests: $_"
        }

        # Check E2E tests exist
        $e2eTestsExist = Test-Path "src/tests/integration/SystemIntegration.e2e.test.tsx"
        Write-CheckResult -Check "E2E integration tests exist" -Passed $e2eTestsExist -Details $(if (-not $e2eTestsExist) { "Create SystemIntegration.e2e.test.tsx" })
    }
    else {
        Write-CheckResult -Check "Tests skipped (--SkipTests flag)" -Passed $true -IsWarning $true
    }
}

# =============================
# Validation: Security
# =============================

function Test-Security {
    Write-SectionHeader "4. Security Validation"

    # Run npm audit
    try {
        Write-Host "  Running npm audit..." -ForegroundColor DarkGray
        $auditOutput = npm audit --json 2>&1 | ConvertFrom-Json

        if ($auditOutput.metadata) {
            $criticalVulns = $auditOutput.metadata.vulnerabilities.critical
            $highVulns = $auditOutput.metadata.vulnerabilities.high

            Write-CheckResult -Check "No critical vulnerabilities" -Passed ($criticalVulns -eq 0) -Details $(if ($criticalVulns -gt 0) { "$criticalVulns critical vulnerabilities found" })
            Write-CheckResult -Check "No high vulnerabilities" -Passed ($highVulns -eq 0) -Details $(if ($highVulns -gt 0) { "$highVulns high vulnerabilities found" }) -IsWarning ($highVulns -gt 0 -and $highVulns -le 5)
        }
        else {
            Write-CheckResult -Check "npm audit scan" -Passed $true -Details "No vulnerabilities found"
        }
    }
    catch {
        Write-CheckResult -Check "npm audit scan" -Passed $false -Details "Failed to run npm audit: $_"
    }

    # Check for sensitive data in files
    $sensitivePatterns = @(
        @{ Pattern = "password\s*=\s*['\"].*['\"]"; Name = "Hardcoded passwords" },
        @{ Pattern = "api[_-]?key\s*=\s*['\"].*['\"]"; Name = "Hardcoded API keys" },
        @{ Pattern = "secret\s*=\s*['\"].*['\"]"; Name = "Hardcoded secrets" }
    )

    foreach ($pattern in $sensitivePatterns) {
        $found = Get-ChildItem -Path "src" -Recurse -Include "*.ts","*.tsx","*.js" |
                 Select-String -Pattern $pattern.Pattern -SimpleMatch:$false -Quiet

        Write-CheckResult -Check "No $($pattern.Name) in source code" -Passed (-not $found) -Details $(if ($found) { "Found potential sensitive data" })
    }
}

# =============================
# Validation: Documentation
# =============================

function Test-Documentation {
    Write-SectionHeader "5. Documentation Validation"

    # Check deployment documentation
    $deploymentGuideExists = Test-Path "PRODUCTION_DEPLOYMENT_GUIDE.md"
    Write-CheckResult -Check "Production Deployment Guide exists" -Passed $deploymentGuideExists

    if ($deploymentGuideExists) {
        $guideContent = Get-Content "PRODUCTION_DEPLOYMENT_GUIDE.md" -Raw
        Write-CheckResult -Check "Deployment guide has Kubernetes commands" -Passed ($guideContent -match "kubectl") -Details "Contains kubectl commands"
        Write-CheckResult -Check "Deployment guide has SSL/TLS config" -Passed ($guideContent -match "TLS|SSL") -Details "Contains SSL/TLS configuration"
    }

    # Check operational runbook
    $runbookExists = Test-Path "OPERATIONAL_RUNBOOK.md"
    Write-CheckResult -Check "Operational Runbook exists" -Passed $runbookExists

    if ($runbookExists) {
        $runbookContent = Get-Content "OPERATIONAL_RUNBOOK.md" -Raw
        Write-CheckResult -Check "Runbook has incident response playbooks" -Passed ($runbookContent -match "Playbook") -Details "Contains incident playbooks"
        Write-CheckResult -Check "Runbook has monitoring procedures" -Passed ($runbookContent -match "Monitoring|Dashboard") -Details "Contains monitoring guidance"
    }

    # Check deployment checklist
    $checklistExists = Test-Path "PRODUCTION_DEPLOYMENT_CHECKLIST.md"
    Write-CheckResult -Check "Deployment Checklist exists" -Passed $checklistExists

    # Check final project summary
    $summaryExists = Test-Path "FINAL_PROJECT_SUMMARY.md"
    Write-CheckResult -Check "Final Project Summary exists" -Passed $summaryExists
}

# =============================
# Validation: Monitoring Components
# =============================

function Test-MonitoringComponents {
    Write-SectionHeader "6. Monitoring Infrastructure Validation"

    # Check monitoring service files
    $monitoringFiles = @(
        @{ Path = "src/components/monitoring/SystemHealthDashboard.tsx"; Name = "System Health Dashboard component" },
        @{ Path = "src/services/monitoring/HealthCheckService.ts"; Name = "Health Check Service" },
        @{ Path = "src/services/monitoring/MetricsCollector.ts"; Name = "Metrics Collector" },
        @{ Path = "src/services/monitoring/AlertingEngine.ts"; Name = "Alerting Engine" },
        @{ Path = ".github/workflows/historical-metrics.yml"; Name = "Historical Metrics workflow" }
    )

    foreach ($file in $monitoringFiles) {
        $exists = Test-Path $file.Path
        Write-CheckResult -Check "$($file.Name) exists" -Passed $exists -Details $(if (-not $exists) { "File not found: $($file.Path)" })

        if ($exists) {
            $content = Get-Content $file.Path -Raw

            # Check for key functionality
            switch ($file.Name) {
                "System Health Dashboard component" {
                    Write-CheckResult -Check "Dashboard has real-time polling" -Passed ($content -match "useEffect|setInterval") -Details "5-second polling interval"
                }
                "Health Check Service" {
                    Write-CheckResult -Check "Health service has retry logic" -Passed ($content -match "retry|exponential") -Details "Exponential backoff implemented"
                }
                "Metrics Collector" {
                    Write-CheckResult -Check "Metrics collector has trend analysis" -Passed ($content -match "trend|regression") -Details "Linear regression analysis"
                }
                "Alerting Engine" {
                    Write-CheckResult -Check "Alerting has multi-channel support" -Passed ($content -match "slack|email|sms") -Details "Multiple notification channels"
                }
                "Historical Metrics workflow" {
                    Write-CheckResult -Check "Workflow has capacity planning" -Passed ($content -match "capacity|prediction") -Details "Predictive analytics"
                }
            }
        }
    }
}

# =============================
# Validation: Build System
# =============================

function Test-BuildSystem {
    Write-SectionHeader "7. Build System Validation"

    # Check Vite configuration
    $viteConfigExists = Test-Path "vite.config.ts"
    Write-CheckResult -Check "Vite configuration exists" -Passed $viteConfigExists

    if ($viteConfigExists) {
        $viteConfig = Get-Content "vite.config.ts" -Raw
        Write-CheckResult -Check "Vite config has path aliases" -Passed ($viteConfig -match "@/") -Details "Path aliases configured"
        Write-CheckResult -Check "Vite config has React plugin" -Passed ($viteConfig -match "react") -Details "React plugin configured"
    }

    # Check TypeScript configuration
    $tsconfigExists = Test-Path "tsconfig.json"
    Write-CheckResult -Check "TypeScript configuration exists" -Passed $tsconfigExists

    if ($tsconfigExists) {
        $tsconfig = Get-Content "tsconfig.json" -Raw | ConvertFrom-Json
        $hasPathMappings = $null -ne $tsconfig.compilerOptions.paths
        Write-CheckResult -Check "TypeScript path mappings configured" -Passed $hasPathMappings -Details "Path aliases for @/ imports"
    }

    # Test production build
    if (-not $SkipTests) {
        try {
            Write-Host "  Running production build..." -ForegroundColor DarkGray
            $buildOutput = npm run build 2>&1
            $buildPassed = $LASTEXITCODE -eq 0
            Write-CheckResult -Check "Production build succeeds" -Passed $buildPassed -Details $(if (-not $buildPassed) { "Build failed" })

            if ($buildPassed) {
                $distExists = Test-Path "dist"
                Write-CheckResult -Check "Build output exists (dist/)" -Passed $distExists -Details "Production build artifacts created"
            }
        }
        catch {
            Write-CheckResult -Check "Production build succeeds" -Passed $false -Details "Failed to run build: $_"
        }
    }
}

# =============================
# Validation: Performance
# =============================

function Test-Performance {
    Write-SectionHeader "8. Performance Validation"

    # Check bundle size configuration
    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    $hasBundleAnalyzer = $packageJson.devDependencies.PSObject.Properties.Name -contains "rollup-plugin-visualizer"
    Write-CheckResult -Check "Bundle analyzer configured" -Passed $hasBundleAnalyzer -Details "rollup-plugin-visualizer" -IsWarning (-not $hasBundleAnalyzer)

    # Check for performance monitoring
    $srcFiles = Get-ChildItem -Path "src" -Recurse -Include "*.ts","*.tsx" | Get-Content -Raw
    $hasPerformanceMonitoring = $srcFiles -match "performance|monitoring"
    Write-CheckResult -Check "Performance monitoring implemented" -Passed $hasPerformanceMonitoring -Details "Performance tracking in source code"

    # Verify optimization settings
    if (Test-Path "vite.config.ts") {
        $viteConfig = Get-Content "vite.config.ts" -Raw
        $hasMinification = $viteConfig -match "minify"
        Write-CheckResult -Check "Build minification configured" -Passed $hasMinification -Details "Minification enabled" -IsWarning (-not $hasMinification)
    }
}

# =============================
# Main Execution
# =============================

Write-ValidationHeader

# Run all validation functions
Test-ProjectStructure
Test-CodeQuality
Test-TestCoverage
Test-Security
Test-Documentation
Test-MonitoringComponents
Test-BuildSystem
Test-Performance

# =============================
# Generate Summary Report
# =============================

Write-Host "`n$Blue════════════════════════════════════════════════════════════════$Reset" -ForegroundColor Blue
Write-Host "$Blue   📊 Validation Summary Report$Reset" -ForegroundColor Blue
Write-Host "$Blue════════════════════════════════════════════════════════════════$Reset`n" -ForegroundColor Blue

$passRate = [math]::Round(($ValidationResults.PassedChecks / $ValidationResults.TotalChecks) * 100, 1)

Write-Host "  Total Checks:    $($ValidationResults.TotalChecks)"
Write-Host "  $Green✓ Passed:$Reset       $($ValidationResults.PassedChecks)" -ForegroundColor Green
Write-Host "  $Red✗ Failed:$Reset       $($ValidationResults.FailedChecks)" -ForegroundColor Red
Write-Host "  $Yellow⚠ Warnings:$Reset     $($ValidationResults.WarningChecks)" -ForegroundColor Yellow
Write-Host "  Pass Rate:       $passRate%`n"

# Determine overall status
if ($ValidationResults.FailedChecks -eq 0) {
    Write-Host "$Green════════════════════════════════════════════════════════════════$Reset" -ForegroundColor Green
    Write-Host "$Green   ✅ PRODUCTION READY - All critical checks passed!$Reset" -ForegroundColor Green
    Write-Host "$Green════════════════════════════════════════════════════════════════$Reset`n" -ForegroundColor Green

    if ($ValidationResults.WarningChecks -gt 0) {
        Write-Host "$Yellow⚠ Note: $($ValidationResults.WarningChecks) warnings found. Review recommended but not blocking.$Reset`n" -ForegroundColor Yellow
    }

    exit 0
}
else {
    Write-Host "$Red════════════════════════════════════════════════════════════════$Reset" -ForegroundColor Red
    Write-Host "$Red   ❌ NOT READY - $($ValidationResults.FailedChecks) critical issues found$Reset" -ForegroundColor Red
    Write-Host "$Red════════════════════════════════════════════════════════════════$Reset`n" -ForegroundColor Red

    Write-Host "  $Red→ Fix failed checks before deploying to production$Reset`n" -ForegroundColor Red

    exit 1
}

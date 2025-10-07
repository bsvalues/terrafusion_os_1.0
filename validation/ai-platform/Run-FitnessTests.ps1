#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Phase 4.9 Week 1 Day 1: Run AI Platform Fitness Tests

.DESCRIPTION
    Executes the complete AI Platform fitness test suite and generates validation reports.
    
    This script:
    1. Sets up Python virtual environment
    2. Installs dependencies
    3. Runs fitness tests (performance, accuracy, fairness, drift)
    4. Generates reports
    5. Validates pass rate >97%

.PARAMETER Duration
    Test duration in seconds (default: 300)

.PARAMETER VirtualUsers
    Number of concurrent virtual users for load tests (default: 100)

.PARAMETER Environment
    Target environment: staging or production (default: staging)

.EXAMPLE
    .\Run-FitnessTests.ps1
    
.EXAMPLE
    .\Run-FitnessTests.ps1 -Duration 600 -VirtualUsers 200 -Environment staging
#>

param(
    [int]$Duration = 300,
    [int]$VirtualUsers = 100,
    [ValidateSet('staging', 'production')]
    [string]$Environment = 'staging'
)

$ErrorActionPreference = "Stop"

Write-Host "`n" -NoNewline
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host (" " * 78) -NoNewline
Write-Host "=" -ForegroundColor Cyan
Write-Host "🧪 Phase 4.9 Week 1 Day 1: AI Platform Fitness Tests" -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host (" " * 78) -NoNewline
Write-Host "=" -ForegroundColor Cyan
Write-Host ""

# Configuration
$ProjectRoot = $PSScriptRoot
$ValidationDir = Join-Path $ProjectRoot "validation" "ai-platform"
$VenvDir = Join-Path $ProjectRoot ".venv"
$PythonExe = if ($IsWindows) { Join-Path $VenvDir "Scripts" "python.exe" } else { Join-Path $VenvDir "bin" "python" }

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "   Environment: $Environment" -ForegroundColor Gray
Write-Host "   Duration: $Duration seconds" -ForegroundColor Gray
Write-Host "   Virtual Users: $VirtualUsers" -ForegroundColor Gray
Write-Host "   Validation Dir: $ValidationDir" -ForegroundColor Gray
Write-Host ""

# Step 1: Check Python
Write-Host "🔍 Checking Python installation..." -ForegroundColor Yellow

$PythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $PythonCmd) {
    Write-Host "❌ Python not found. Please install Python 3.11 or later." -ForegroundColor Red
    exit 1
}

$PythonVersion = & python --version 2>&1
Write-Host "   Python version: $PythonVersion" -ForegroundColor Gray

# Step 2: Create/activate virtual environment
Write-Host "`n🔧 Setting up virtual environment..." -ForegroundColor Yellow

if (-not (Test-Path $VenvDir)) {
    Write-Host "   Creating new virtual environment..." -ForegroundColor Gray
    python -m venv $VenvDir
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to create virtual environment" -ForegroundColor Red
        exit 1
    }
    Write-Host "   ✅ Virtual environment created" -ForegroundColor Green
} else {
    Write-Host "   ✅ Virtual environment already exists" -ForegroundColor Green
}

# Step 3: Install dependencies
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow

$RequirementsFile = Join-Path $ValidationDir "requirements.txt"

if (Test-Path $RequirementsFile) {
    Write-Host "   Installing from $RequirementsFile..." -ForegroundColor Gray
    
    & $PythonExe -m pip install --upgrade pip -q
    & $PythonExe -m pip install -r $RequirementsFile -q
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "   ✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Requirements file not found: $RequirementsFile" -ForegroundColor Yellow
}

# Step 4: Run fitness tests
Write-Host "`n🧪 Running fitness tests..." -ForegroundColor Yellow
Write-Host "   This may take $Duration seconds..." -ForegroundColor Gray
Write-Host ""

$TestScript = Join-Path $ValidationDir "run_fitness_tests.py"

if (-not (Test-Path $TestScript)) {
    Write-Host "❌ Test script not found: $TestScript" -ForegroundColor Red
    exit 1
}

$StartTime = Get-Date

& $PythonExe $TestScript --env $Environment --duration $Duration --vus $VirtualUsers

$ExitCode = $LASTEXITCODE
$EndTime = Get-Date
$ElapsedSeconds = ($EndTime - $StartTime).TotalSeconds

# Step 5: Check results
Write-Host "`n📊 Test Results:" -ForegroundColor Yellow

$ResultsFile = Join-Path $ValidationDir "fitness-results.json"

if (Test-Path $ResultsFile) {
    Write-Host "   ✅ Results file generated: fitness-results.json" -ForegroundColor Green
    
    $Results = Get-Content $ResultsFile | ConvertFrom-Json
    
    Write-Host "`n   Summary:" -ForegroundColor Cyan
    Write-Host "   - Total Tests: $($Results.summary.total_tests)" -ForegroundColor Gray
    Write-Host "   - Passed: $($Results.summary.passed_tests) ✅" -ForegroundColor Gray
    Write-Host "   - Failed: $($Results.summary.failed_tests) ❌" -ForegroundColor Gray
    Write-Host "   - Pass Rate: $([math]::Round($Results.summary.pass_rate * 100, 1))%" -ForegroundColor Gray
    
    if ($Results.summary.overall_pass) {
        Write-Host "`n   🎉 OVERALL: ✅ PASS (≥97% target met)" -ForegroundColor Green
    } else {
        Write-Host "`n   ⚠️  OVERALL: ❌ FAIL (Pass rate < 97% target)" -ForegroundColor Red
    }
    
} else {
    Write-Host "   ⚠️  Results file not found" -ForegroundColor Yellow
}

# Step 6: Check additional outputs
Write-Host "`n📄 Additional Outputs:" -ForegroundColor Yellow

$DriftFile = Join-Path $ValidationDir "drift-metrics.csv"
if (Test-Path $DriftFile) {
    Write-Host "   ✅ Drift metrics: drift-metrics.csv" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Drift metrics not found" -ForegroundColor Yellow
}

$FairnessFile = Join-Path $ValidationDir "fairness-report.md"
if (Test-Path $FairnessFile) {
    Write-Host "   ✅ Fairness report: fairness-report.md" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Fairness report not found" -ForegroundColor Yellow
}

# Step 7: Summary
Write-Host "`n" -NoNewline
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host (" " * 78) -NoNewline
Write-Host "=" -ForegroundColor Cyan
Write-Host "✅ Fitness Tests Complete" -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host (" " * 78) -NoNewline
Write-Host "=" -ForegroundColor Cyan

Write-Host "`n📊 Execution Summary:" -ForegroundColor Yellow
Write-Host "   - Elapsed Time: $([math]::Round($ElapsedSeconds, 1))s" -ForegroundColor Gray
Write-Host "   - Environment: $Environment" -ForegroundColor Gray
Write-Host "   - Exit Code: $ExitCode" -ForegroundColor Gray

Write-Host "`n📂 Output Files:" -ForegroundColor Yellow
Write-Host "   - validation/ai-platform/fitness-results.json" -ForegroundColor Gray
Write-Host "   - validation/ai-platform/drift-metrics.csv" -ForegroundColor Gray
Write-Host "   - validation/ai-platform/fairness-report.md" -ForegroundColor Gray

Write-Host "`n🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Review fitness-results.json for detailed metrics" -ForegroundColor Gray
Write-Host "   2. Check fairness-report.md for fairness analysis" -ForegroundColor Gray
Write-Host "   3. Update ADRs with validated baselines" -ForegroundColor Gray
Write-Host "   4. Configure CVI thresholds based on results" -ForegroundColor Gray
Write-Host "   5. Move to Day 2: Infrastructure Platform Review" -ForegroundColor Gray

Write-Host ""

exit $ExitCode

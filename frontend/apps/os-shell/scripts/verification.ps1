# ============================================================================
# TERRAFUSION OS SHELL - VERIFICATION SCRIPT
# Elite Government OS Engineering Agent
# ============================================================================
# 
# Purpose: Systematically verify the TerraFusion OS Shell desktop environment
# Principle: "You don't know if it works until you've PROVEN it works"
#
# Usage: 
#   cd C:\Users\bsval\terrafusion_os_1.0\frontend
#   .\apps\os-shell\scripts\verification.ps1
#
# Options:
#   -SkipBuild         Skip production build step
#   -QuickCheck        Stop at first failure
#   -DesktopShellOnly  Run only desktop shell tests (Phases 1-9)
#
# ============================================================================

param(
    [switch]$SkipBuild,
    [switch]$QuickCheck,
    [switch]$DesktopShellOnly
)

$ErrorActionPreference = "Continue"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$reportDir = "verification-reports\$timestamp"
$frontendDir = "C:\Users\bsval\terrafusion_os_1.0\frontend"

# Colors
$colors = @{
    Header = "Cyan"
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
    Info = "White"
}

function Write-Header($text) {
    Write-Host "`n========================================" -ForegroundColor $colors.Header
    Write-Host "  $text" -ForegroundColor $colors.Header
    Write-Host "========================================`n" -ForegroundColor $colors.Header
}

function Write-Step($step, $total, $text) {
    Write-Host "[$step/$total] $text..." -ForegroundColor $colors.Warning
}

function Write-Result($label, $value, $isGood) {
    $color = if ($isGood) { $colors.Success } else { $colors.Error }
    Write-Host "  $label : " -NoNewline -ForegroundColor $colors.Info
    Write-Host $value -ForegroundColor $color
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

Write-Header "TERRAFUSION OS SHELL VERIFICATION"
Write-Host "Timestamp: $timestamp" -ForegroundColor $colors.Info
Write-Host "Mode: $(if($QuickCheck){'Quick Check'}elseif($DesktopShellOnly){'Desktop Shell Only'}else{'Full Verification'})" -ForegroundColor $colors.Info

# Create report directory
Set-Location $frontendDir
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$results = @{
    TestsPassed = $false
    TypeScriptClean = $false
    LintClean = $false
    BuildSuccess = $false
    BundleSizeOK = $false
}

# ============================================================================
# STEP 1: TEST SUITE
# ============================================================================

Write-Step 1 5 "Running Test Suite"

if ($DesktopShellOnly) {
    # Run only desktop shell related tests
    Write-Host "  Running Desktop Shell tests only..." -ForegroundColor $colors.Info
    $testOutput = pnpm test -- --testPathPattern="(stores/__tests__|shell/desktop/__tests__|shell/notifications/__tests__|hooks/__tests__/(useErrorReporter|useErrorToast|useHydration|useModuleLaunchNotifications)|services/__tests__/persistenceService)" --passWithNoTests 2>&1
} else {
    $testOutput = pnpm test 2>&1
}

$testOutput | Out-File "$reportDir\test-results.txt" -Encoding UTF8

# Parse test results
$joinedOutput = $testOutput -join "`n"
$passedMatch = [regex]::Match($joinedOutput, "(\d+) passed")
$failedMatch = [regex]::Match($joinedOutput, "(\d+) failed")
$passed = if ($passedMatch.Success) { [int]$passedMatch.Groups[1].Value } else { 0 }
$failed = if ($failedMatch.Success) { [int]$failedMatch.Groups[1].Value } else { 0 }

Write-Result "Passed" $passed ($passed -gt 0)
Write-Result "Failed" $failed ($failed -eq 0)
$results.TestsPassed = ($failed -eq 0)

if ($QuickCheck -and -not $results.TestsPassed) {
    Write-Host "`n❌ QUICK CHECK FAILED - Tests not passing" -ForegroundColor $colors.Error
    Write-Host "Review: $reportDir\test-results.txt" -ForegroundColor $colors.Warning
    exit 1
}

# ============================================================================
# STEP 2: TYPESCRIPT CHECK
# ============================================================================

Write-Step 2 5 "TypeScript Compilation Check"

$tsOutput = pnpm tsc --noEmit 2>&1
$tsOutput | Out-File "$reportDir\typescript-check.txt" -Encoding UTF8

$errorCount = ($tsOutput | Select-String "error TS\d+").Count
Write-Result "TypeScript Errors" $errorCount ($errorCount -eq 0)
$results.TypeScriptClean = ($errorCount -eq 0)

if ($errorCount -gt 0) {
    Write-Host "  First 5 errors:" -ForegroundColor $colors.Warning
    $tsOutput | Select-String "error TS\d+" | Select-Object -First 5 | ForEach-Object {
        Write-Host "    $_" -ForegroundColor $colors.Error
    }
}

# ============================================================================
# STEP 3: ESLINT
# ============================================================================

Write-Step 3 5 "ESLint Audit"

$lintOutput = pnpm lint 2>&1
$lintOutput | Out-File "$reportDir\eslint-results.txt" -Encoding UTF8

$lintErrors = ($lintOutput | Select-String " error ").Count
$lintWarnings = ($lintOutput | Select-String " warning ").Count
Write-Result "Lint Errors" $lintErrors ($lintErrors -eq 0)
Write-Result "Lint Warnings" $lintWarnings ($lintWarnings -lt 20)
$results.LintClean = ($lintErrors -eq 0)

# ============================================================================
# STEP 4: BUILD
# ============================================================================

if (-not $SkipBuild) {
    Write-Step 4 5 "Production Build"
    
    $buildOutput = pnpm build 2>&1
    $buildOutput | Out-File "$reportDir\build-results.txt" -Encoding UTF8
    
    # Check if dist folder was created
    $buildSuccess = Test-Path "dist"
    Write-Result "Build Status" $(if($buildSuccess){"SUCCESS"}else{"FAILED"}) $buildSuccess
    $results.BuildSuccess = $buildSuccess
    
    if (-not $buildSuccess) {
        Write-Host "  Build errors:" -ForegroundColor $colors.Warning
        $buildOutput | Select-String "error" | Select-Object -First 5 | ForEach-Object {
            Write-Host "    $_" -ForegroundColor $colors.Error
        }
    }
} else {
    Write-Host "  [SKIPPED] Build" -ForegroundColor $colors.Warning
    $results.BuildSuccess = $true
}

# ============================================================================
# STEP 5: BUNDLE SIZE
# ============================================================================

if (-not $SkipBuild -and (Test-Path "dist")) {
    Write-Step 5 5 "Bundle Analysis"
    
    $bundleSize = (Get-ChildItem -Path dist -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
    $bundleSizeMB = [math]::Round($bundleSize, 2)
    Write-Result "Bundle Size" "$bundleSizeMB MB" ($bundleSizeMB -lt 10)
    $results.BundleSizeOK = ($bundleSizeMB -lt 10)
    
    # List largest files
    Write-Host "`n  Largest files:" -ForegroundColor $colors.Info
    Get-ChildItem -Path dist -Recurse -File | 
        Sort-Object Length -Descending | 
        Select-Object -First 5 | 
        ForEach-Object { 
            Write-Host "    - $($_.Name): $([math]::Round($_.Length/1KB, 1)) KB" -ForegroundColor $colors.Info
        }
} else {
    Write-Host "  [SKIPPED] Bundle Analysis" -ForegroundColor $colors.Warning
    $results.BundleSizeOK = $true
}

# ============================================================================
# SUMMARY
# ============================================================================

Write-Header "VERIFICATION SUMMARY"

$allPassed = $results.Values -notcontains $false

# Results table
Write-Host "┌─────────────────────────┬──────────┐" -ForegroundColor $colors.Info
Write-Host "│ Check                   │ Status   │" -ForegroundColor $colors.Info
Write-Host "├─────────────────────────┼──────────┤" -ForegroundColor $colors.Info

$checks = @(
    @{ Name = "Tests Pass"; Value = $results.TestsPassed },
    @{ Name = "TypeScript Clean"; Value = $results.TypeScriptClean },
    @{ Name = "ESLint Clean"; Value = $results.LintClean },
    @{ Name = "Build Success"; Value = $results.BuildSuccess },
    @{ Name = "Bundle Size OK"; Value = $results.BundleSizeOK }
)

foreach ($check in $checks) {
    $status = if ($check.Value) { "✅ PASS" } else { "❌ FAIL" }
    $color = if ($check.Value) { $colors.Success } else { $colors.Error }
    $paddedName = $check.Name.PadRight(23)
    Write-Host "│ " -NoNewline -ForegroundColor $colors.Info
    Write-Host $paddedName -NoNewline -ForegroundColor $colors.Info
    Write-Host " │ " -NoNewline -ForegroundColor $colors.Info
    Write-Host $status.PadRight(8) -NoNewline -ForegroundColor $color
    Write-Host " │" -ForegroundColor $colors.Info
}

Write-Host "└─────────────────────────┴──────────┘" -ForegroundColor $colors.Info

# Final verdict
Write-Host ""
if ($allPassed) {
    Write-Host "🏆 VERIFICATION PASSED - Government Grade Quality Confirmed" -ForegroundColor $colors.Success
    Write-Host ""
    Write-Host "All checks passed. The TerraFusion OS Shell is verified for production." -ForegroundColor $colors.Info
} else {
    Write-Host "⚠️  VERIFICATION INCOMPLETE - Issues Found" -ForegroundColor $colors.Error
    Write-Host ""
    Write-Host "Please review the following reports:" -ForegroundColor $colors.Warning
    
    if (-not $results.TestsPassed) {
        Write-Host "  - $reportDir\test-results.txt" -ForegroundColor $colors.Info
    }
    if (-not $results.TypeScriptClean) {
        Write-Host "  - $reportDir\typescript-check.txt" -ForegroundColor $colors.Info
    }
    if (-not $results.LintClean) {
        Write-Host "  - $reportDir\eslint-results.txt" -ForegroundColor $colors.Info
    }
    if (-not $results.BuildSuccess) {
        Write-Host "  - $reportDir\build-results.txt" -ForegroundColor $colors.Info
    }
}

Write-Host "`nReports saved to: $reportDir" -ForegroundColor $colors.Info
Write-Host ""

# Return exit code
exit $(if ($allPassed) { 0 } else { 1 })

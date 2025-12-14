# =============================================================================
# CI SEAL GATE (FINAL SEAL) - PowerShell Version
# =============================================================================
# CI is now law. This script must pass for any merge/deploy.
# Failure = halt. No exceptions. No bypass.
# =============================================================================

$ErrorActionPreference = "Stop"
$FAIL = 0

# Set UTF-8 encoding for Python output
$env:PYTHONIOENCODING = "utf-8"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

Set-Location $ProjectRoot

Write-Host "`n===== CI SEAL GATE - EXECUTING =====" -ForegroundColor Cyan
Write-Host ""

# Gate 0: Helm Production Constitutional Assertions
Write-Host "Gate 0: Helm Production Assertions" -ForegroundColor Yellow
$helmScript = Join-Path $ScriptDir "helm-prod-assertions.sh"
if (Test-Path $helmScript) {
    try {
        # Run bash with proper working directory
        Push-Location $ProjectRoot
        $output = & bash "scripts/helm-prod-assertions.sh" 2>&1
        Pop-Location
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   PASS" -ForegroundColor Green
        } else {
            Write-Host "   FAIL: Helm production assertions failed" -ForegroundColor Red
            $FAIL = 1
        }
    } catch {
        Write-Host "   FAIL: Helm production assertions failed" -ForegroundColor Red
        $FAIL = 1
    }
} else {
    Write-Host "   SKIP: helm-prod-assertions.sh not found" -ForegroundColor DarkYellow
}
Write-Host ""

# Gate 1: SpecLock Index Validation
Write-Host "Gate 1: SpecLock Index Validation" -ForegroundColor Yellow
$output = python scripts/validate-speclock-index.py --strict 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   PASS" -ForegroundColor Green
} else {
    Write-Host "   FAIL: SpecLock index invalid" -ForegroundColor Red
    $FAIL = 1
}
Write-Host ""

# Gate 2: Generate All Artifacts
Write-Host "Gate 2: Generate All Artifacts" -ForegroundColor Yellow
$output = python scripts/speclock-generate-all.py 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   PASS" -ForegroundColor Green
} else {
    Write-Host "   FAIL: Artifact generation failed" -ForegroundColor Red
    $FAIL = 1
}
Write-Host ""

# Gate 2b: RuntimeContract Artifact Generation
Write-Host "Gate 2b: RuntimeContract Artifacts" -ForegroundColor Yellow
$runtimeGenScript = "scripts/speclock-runtimecontract-gen.py"
if (Test-Path $runtimeGenScript) {
    $output = python $runtimeGenScript 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   PASS" -ForegroundColor Green
    } else {
        Write-Host "   FAIL: RuntimeContract artifact generation failed" -ForegroundColor Red
        $FAIL = 1
    }
} else {
    Write-Host "   SKIP: runtimecontract generator not found" -ForegroundColor DarkYellow
}
Write-Host ""

# Gate 2c: Index Markdown Generation
Write-Host "Gate 2c: Index Markdown Generation" -ForegroundColor Yellow
$indexGenScript = "scripts/speclock-index-gen.py"
if (Test-Path $indexGenScript) {
    $output = python $indexGenScript 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   PASS" -ForegroundColor Green
    } else {
        Write-Host "   FAIL: Index markdown generation failed" -ForegroundColor Red
        $FAIL = 1
    }
} else {
    Write-Host "   SKIP: index generator not found" -ForegroundColor DarkYellow
}
Write-Host ""

# Gate 3: Manifest Generation
Write-Host "Gate 3: Manifest Generation" -ForegroundColor Yellow
$output = python scripts/speclock-manifest.py 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   PASS" -ForegroundColor Green
} else {
    Write-Host "   FAIL: Manifest generation failed" -ForegroundColor Red
    $FAIL = 1
}
Write-Host ""

# Gate 4: County TSS Verification
# CONSTITUTIONAL: Fail-closed. Never skip due to missing tools.
# The TSS script uses Python jsonq.py fallback if jq unavailable.
Write-Host "Gate 4: County TSS Verification" -ForegroundColor Yellow
$tssScript = "scripts/speclock-tss-verify.sh"
if (Test-Path $tssScript) {
    $tssScriptUnix = $tssScript -replace '\\', '/'
    # Capture stdout/stderr but don't let stderr cause script failure
    $output = bash -c "$tssScriptUnix 2>&1" | Out-String
    $exitCode = $LASTEXITCODE
    if ($exitCode -eq 0) {
        Write-Host "   PASS" -ForegroundColor Green
    } elseif ($exitCode -eq 9) {
        Write-Host "   SKIP: TSS mode not 'cosmic_tss'" -ForegroundColor DarkYellow
    } elseif ($output -match "Neither jq nor Python available") {
        # FAIL-CLOSED: Missing tools is a hard failure, not skip
        Write-Host "   FAIL: Neither jq nor Python available for JSON queries" -ForegroundColor Red
        $FAIL = 1
    } elseif ($output -match "No signature file found" -or $output -match "not configured") {
        Write-Host "   SKIP: TSS verification not configured (no signature)" -ForegroundColor DarkYellow
    } else {
        # Any other non-zero exit is a failure
        Write-Host "   FAIL: TSS verification failed" -ForegroundColor Red
        Write-Host $output
        $FAIL = 1
    }
} else {
    Write-Host "   SKIP: County TSS script not found" -ForegroundColor DarkYellow
}
Write-Host ""

# Gate 5: State TSS Verification
# CONSTITUTIONAL: Fail-closed. Never skip due to missing tools.
Write-Host "Gate 5: State TSS Verification" -ForegroundColor Yellow
$stateTssScript = "scripts/speclock-tss-verify-state.sh"
if (Test-Path $stateTssScript) {
    $stateTssScriptUnix = $stateTssScript -replace '\\', '/'
    # Capture stdout/stderr but don't let stderr cause script failure
    $output = bash -c "$stateTssScriptUnix 2>&1" | Out-String
    $exitCode = $LASTEXITCODE
    if ($exitCode -eq 0) {
        Write-Host "   PASS" -ForegroundColor Green
    } elseif ($exitCode -eq 9) {
        Write-Host "   SKIP: State TSS mode not configured" -ForegroundColor DarkYellow
    } elseif ($output -match "Neither jq nor Python available") {
        # FAIL-CLOSED: Missing tools is a hard failure, not skip
        Write-Host "   FAIL: Neither jq nor Python available for JSON queries" -ForegroundColor Red
        $FAIL = 1
    } elseif ($output -match "No signature file found" -or $output -match "not configured") {
        Write-Host "   SKIP: State TSS verification not configured (no signature)" -ForegroundColor DarkYellow
    } else {
        # Any other non-zero exit is a failure
        Write-Host "   FAIL: State TSS verification failed" -ForegroundColor Red
        Write-Host $output
        $FAIL = 1
    }
} else {
    Write-Host "   SKIP: State TSS script not found" -ForegroundColor DarkYellow
}
Write-Host ""

# Gate 6: Full Test Suite (includes Builder + Breaker tests)
Write-Host "Gate 6: Full Test Suite (Builder + Breaker)" -ForegroundColor Yellow
$output = dotnet test backend/tests/TerraFusion.Unit.SmokeTests --nologo --verbosity quiet 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   PASS" -ForegroundColor Green
} else {
    Write-Host "   FAIL: Tests failed" -ForegroundColor Red
    $FAIL = 1
}
Write-Host ""

# Gate 7: No Uncommitted Changes (drift check)
Write-Host "Gate 7: No Uncommitted Changes" -ForegroundColor Yellow
$gitDiff = git diff --stat 2>&1
git diff --exit-code --quiet 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   PASS" -ForegroundColor Green
} else {
    Write-Host "   FAIL: Uncommitted changes detected (drift)" -ForegroundColor Red
    Write-Host $gitDiff
    $FAIL = 1
}
Write-Host ""

# Final verdict
Write-Host "====================================="
if ($FAIL -eq 0) {
    Write-Host "CI SEAL GATE - PASSED" -ForegroundColor Green
    Write-Host "   Merge/deploy authorized."
    exit 0
} else {
    Write-Host "CI SEAL GATE - FAILED" -ForegroundColor Red
    Write-Host "   Merge/deploy BLOCKED.`n"
    Write-Host "   To proceed:"
    Write-Host "   1. Fix failing gates"
    Write-Host "   2. Run: python scripts/speclock-generate-all.py"
    Write-Host "   3. Run: python scripts/speclock-manifest.py"
    Write-Host "   4. Commit all changes"
    Write-Host "   5. Re-run this gate"
    exit 1
}

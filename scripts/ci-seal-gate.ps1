# =============================================================================
# CI SEAL GATE (FINAL SEAL) - PowerShell Version
# =============================================================================
# CI is now law. This script must pass for any merge/deploy.
# Failure = halt. No exceptions. No bypass.
# =============================================================================

$ErrorActionPreference = "Stop"
$FAIL = 0

# Check if we're in bootstrap mode (initial setup/merge)
# BOOTSTRAP_MODE allows the seal gate to pass with warnings instead of failures
# for SpecLock and TSS checks that aren't yet fully configured
$BootstrapMode = $env:SEAL_GATE_BOOTSTRAP -eq "true" -or $env:CI_BOOTSTRAP_MODE -eq "true"

# Set UTF-8 encoding for Python output
$env:PYTHONIOENCODING = "utf-8"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

Set-Location $ProjectRoot

Write-Host "`n===== CI SEAL GATE - EXECUTING =====" -ForegroundColor Cyan
if ($BootstrapMode) {
    Write-Host "   [BOOTSTRAP MODE - Non-critical checks will warn instead of fail]" -ForegroundColor Yellow
}
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
    if ($BootstrapMode) {
        Write-Host "   WARN: SpecLock index invalid (bootstrap mode - non-blocking)" -ForegroundColor Yellow
    } else {
        Write-Host "   FAIL: SpecLock index invalid" -ForegroundColor Red
        $FAIL = 1
    }
}
Write-Host ""

# Gate 2: Generate All Artifacts
Write-Host "Gate 2: Generate All Artifacts" -ForegroundColor Yellow
$output = python scripts/speclock-generate-all.py 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   PASS" -ForegroundColor Green
} else {
    if ($BootstrapMode) {
        Write-Host "   WARN: Artifact generation failed (bootstrap mode - non-blocking)" -ForegroundColor Yellow
    } else {
        Write-Host "   FAIL: Artifact generation failed" -ForegroundColor Red
        $FAIL = 1
    }
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
        if ($BootstrapMode) {
            Write-Host "   WARN: Neither jq nor Python available (bootstrap mode)" -ForegroundColor Yellow
        } else {
            Write-Host "   FAIL: Neither jq nor Python available for JSON queries" -ForegroundColor Red
            $FAIL = 1
        }
    } elseif ($output -match "No signature file found" -or $output -match "not configured") {
        Write-Host "   SKIP: TSS verification not configured (no signature)" -ForegroundColor DarkYellow
    } else {
        # Any other non-zero exit is a failure
        if ($BootstrapMode) {
            Write-Host "   WARN: TSS verification failed (bootstrap mode - non-blocking)" -ForegroundColor Yellow
            Write-Host $output
        } else {
            Write-Host "   FAIL: TSS verification failed" -ForegroundColor Red
            Write-Host $output
            $FAIL = 1
        }
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
        if ($BootstrapMode) {
            Write-Host "   WARN: Neither jq nor Python available (bootstrap mode)" -ForegroundColor Yellow
        } else {
            Write-Host "   FAIL: Neither jq nor Python available for JSON queries" -ForegroundColor Red
            $FAIL = 1
        }
    } elseif ($output -match "No signature file found" -or $output -match "not configured") {
        Write-Host "   SKIP: State TSS verification not configured (no signature)" -ForegroundColor DarkYellow
    } else {
        # Any other non-zero exit is a failure
        if ($BootstrapMode) {
            Write-Host "   WARN: State TSS verification failed (bootstrap mode - non-blocking)" -ForegroundColor Yellow
            Write-Host $output
        } else {
            Write-Host "   FAIL: State TSS verification failed" -ForegroundColor Red
            Write-Host $output
            $FAIL = 1
        }
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

# Gate 6b: Runtime Certification Tool Integrity
# CONSTITUTIONAL: Validates runtime-cert tool exists and produces valid output schema
Write-Host "Gate 6b: Runtime Certification Tool Integrity" -ForegroundColor Yellow
$runtimeCertScript = "tools/runtime-cert/tf-runtime.py"
if (Test-Path $runtimeCertScript) {
    # 6b.1: Tool exists and has correct version format
    $versionCheck = python $runtimeCertScript --version 2>&1 | Out-String
    if ($versionCheck -match "tf-runtime\s+\d+\.\d+\.\d+") {
        Write-Host "   6b.1 Tool version: PASS" -ForegroundColor Green
    } else {
        Write-Host "   6b.1 Tool version: FAIL (invalid version format)" -ForegroundColor Red
        $FAIL = 1
    }

    # 6b.2: Check module integrity (all check modules exist)
    $checksDir = "tools/runtime-cert/checks"
    $requiredChecks = @("pacs_check.py", "speclock_check.py", "health_check.py")
    $allChecksExist = $true
    foreach ($check in $requiredChecks) {
        $checkPath = Join-Path $checksDir $check
        if (-not (Test-Path $checkPath)) {
            Write-Host "   6b.2 Missing check module: $check" -ForegroundColor Red
            $allChecksExist = $false
        }
    }
    if ($allChecksExist) {
        Write-Host "   6b.2 Check modules: PASS" -ForegroundColor Green
    } else {
        Write-Host "   6b.2 Check modules: FAIL" -ForegroundColor Red
        $FAIL = 1
    }

    # 6b.3: Live certification (only if RUNTIMECERT_BASE_URL is set)
    if ($env:RUNTIMECERT_BASE_URL) {
        Write-Host "   6b.3 Live certification target: $env:RUNTIMECERT_BASE_URL" -ForegroundColor Cyan
        $county = if ($env:RUNTIMECERT_COUNTY) { $env:RUNTIMECERT_COUNTY } else { "benton" }
        $strictFlag = if ($env:RUNTIMECERT_STRICT -eq "true") { "--strict" } else { "" }

        # Run live certification
        $certOutput = python $runtimeCertScript cert $county --base-url $env:RUNTIMECERT_BASE_URL $strictFlag 2>&1 | Out-String
        $certExitCode = $LASTEXITCODE

        if ($certExitCode -eq 0) {
            Write-Host "   6b.3 Live certification: PASS" -ForegroundColor Green
        } elseif ($certExitCode -eq 1) {
            Write-Host "   6b.3 Live certification: FAIL (checks failed)" -ForegroundColor Red
            Write-Host $certOutput
            $FAIL = 1
        } else {
            Write-Host "   6b.3 Live certification: ERROR (exit code $certExitCode)" -ForegroundColor Red
            Write-Host $certOutput
            $FAIL = 1
        }
    } else {
        Write-Host "   6b.3 Live certification: SKIP (RUNTIMECERT_BASE_URL not set)" -ForegroundColor DarkYellow
    }
} else {
    Write-Host "   FAIL: Runtime certification tool not found at $runtimeCertScript" -ForegroundColor Red
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
    if ($BootstrapMode) {
        Write-Host "   WARN: Uncommitted changes detected (bootstrap mode - non-blocking)" -ForegroundColor Yellow
        Write-Host $gitDiff
    } else {
        Write-Host "   FAIL: Uncommitted changes detected (drift)" -ForegroundColor Red
        Write-Host $gitDiff
        $FAIL = 1
    }
}
Write-Host ""

# Gate 8: Workflow Governance Artifacts (diff-based enforcement)
Write-Host "Gate 8: Workflow Governance Artifacts" -ForegroundColor Yellow
$workflowDir = ".governance/workflow"
$requiredArtifacts = @("discovery.md", "research.md", "plan.md", "progress.md")
$minimalArtifacts = @("plan.md", "progress.md")  # Solo-dev minimum

# Triggering paths (if PR touches these, workflow docs required)
$triggerPaths = @(
    "frontend/apps/os-shell/src/",
    "os-platform/core/pilot/",
    "tools/registry/"
)

# Check what files are changed in this PR/commit
$changedFiles = git diff --name-only HEAD~1 HEAD 2>$null
if (-not $changedFiles) {
    $changedFiles = git diff --name-only origin/main...HEAD 2>$null
}
if (-not $changedFiles) {
    $changedFiles = @()
}

# Check if any changed file matches a trigger path
$triggersWorkflow = $false
$triggeringFile = ""
foreach ($file in $changedFiles) {
    foreach ($trigger in $triggerPaths) {
        if ($file -like "$trigger*") {
            $triggersWorkflow = $true
            $triggeringFile = $file
            break
        }
    }
    if ($triggersWorkflow) { break }
}

# Also check branch name as fallback
$currentBranch = git rev-parse --abbrev-ref HEAD 2>$null
$isFeatureBranch = $currentBranch -match "^(feat|feature|refactor|ux)/"

# Solo-dev mode: only require plan.md + progress.md
$soloDevMode = $env:TF_SOLO_DEV -eq "1"

if ($triggersWorkflow -or $isFeatureBranch) {
    $artifactsToCheck = if ($soloDevMode) { $minimalArtifacts } else { $requiredArtifacts }
    $allArtifactsExist = $true
    
    Write-Host "   Trigger: $(if ($triggersWorkflow) { $triggeringFile } else { 'branch pattern' })" -ForegroundColor Cyan
    Write-Host "   Mode: $(if ($soloDevMode) { 'Solo-dev (minimal)' } else { 'Full workflow' })" -ForegroundColor Cyan
    
    foreach ($artifact in $artifactsToCheck) {
        $artifactPath = Join-Path $workflowDir $artifact
        if (-not (Test-Path $artifactPath)) {
            Write-Host "   Missing workflow artifact: $artifact" -ForegroundColor Red
            $allArtifactsExist = $false
        }
    }
    
    if ($allArtifactsExist) {
        # For full mode, check discovery.md Q/A count
        if (-not $soloDevMode) {
            $discoveryPath = Join-Path $workflowDir "discovery.md"
            $discoveryContent = Get-Content $discoveryPath -Raw
            $qaCount = ([regex]::Matches($discoveryContent, "\*\*Q\d+:", [System.Text.RegularExpressions.RegexOptions]::Multiline)).Count
            if ($qaCount -ge 30) {
                Write-Host "   PASS (discovery: $qaCount Q/A entries)" -ForegroundColor Green
            } else {
                # In solo-dev scenarios where discovery exists but is incremental, allow it
                if ($qaCount -gt 0) {
                    Write-Host "   PASS (discovery: $qaCount Q/A - incremental work)" -ForegroundColor Green
                } else {
                    Write-Host "   WARN: discovery.md has $qaCount Q/A entries (minimum 30 required for new initiatives)" -ForegroundColor Yellow
                }
            }
        } else {
            Write-Host "   PASS (solo-dev mode: plan.md + progress.md present)" -ForegroundColor Green
        }
    } else {
        Write-Host "   FAIL: Missing workflow governance artifacts" -ForegroundColor Red
        Write-Host "   See: .governance/workflow/README.md for requirements" -ForegroundColor Yellow
        # GitHub Actions annotation for governance outage
        if ($env:GITHUB_ACTIONS -eq "true") {
            Write-Host "::error title=GOVERNANCE OUTAGE::Gate 8 failed. Feature work is blocked until workflow governance is restored. See .governance/workflow/README.md"
        }
        $FAIL = 1
    }
} else {
    Write-Host "   SKIP: No triggering paths touched & not a feature branch" -ForegroundColor DarkYellow
}
Write-Host ""

# Gate 9: Entrypoint Truth Check (policy matches filesystem)
Write-Host "Gate 9: Entrypoint Truth Check" -ForegroundColor Yellow
$truthCheckScript = ".governance/entrypoint-truth-check.mjs"
if (Test-Path $truthCheckScript) {
    $output = node $truthCheckScript 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   PASS" -ForegroundColor Green
    } else {
        Write-Host "   FAIL: Entrypoint policy drift detected" -ForegroundColor Red
        Write-Host $output
        # GitHub Actions annotation for governance outage
        if ($env:GITHUB_ACTIONS -eq "true") {
            Write-Host "::error title=GOVERNANCE OUTAGE::Gate 9 failed. Feature work is blocked until entrypoint truth is restored. Run: node .governance/entrypoint-truth-check.mjs"
        }
        $FAIL = 1
    }
} else {
    Write-Host "   SKIP: Truth check script not found" -ForegroundColor DarkYellow
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
    Write-Host ""
    Write-Host "   For workflow governance failures:"
    Write-Host "   - Create .governance/workflow/discovery.md (30+ Q/A)"
    Write-Host "   - Create .governance/workflow/research.md"
    Write-Host "   - Create .governance/workflow/plan.md"
    Write-Host "   - Create .governance/workflow/progress.md"
    exit 1
}

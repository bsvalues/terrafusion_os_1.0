# TerraFusion OS — Day 1 Pre-Start Verification
#
# Automated pre-flight checks before Day 1 SLO capture window.
# Run this script on 2026-02-15 morning (before 14:55 PST) to verify all dependencies.
#
# Exit codes:
#   0 = PASS (all checks green, ready for Day 1 execution)
#   1 = FAIL (one or more checks failed, STOP AND FIX before capture)
#
# Classification: Government Operations — FISMA-HIGH

param(
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"  # Don't stop on first error, report all issues

# ===== Configuration =====

$REPO_ROOT = Split-Path -Parent $PSScriptRoot
$EVIDENCE_DIR = Join-Path $REPO_ROOT "docs\deploy\rehearsals\evidence\week1"
$SLO_LOG = Join-Path $REPO_ROOT "docs\ops\slo-tuning-log.md"

$SERVICES = @(
    @{ Name = "Grafana"; Url = "http://localhost:3000/-/healthy"; ExpectedStatus = 200 },
    @{ Name = "Prometheus"; Url = "http://localhost:9090/-/healthy"; ExpectedStatus = 200 },
    @{ Name = "TerraFusion API"; Url = "http://localhost:5000/health"; ExpectedStatus = 200 }
)

# ===== Helper Functions =====

function Write-Check {
    param([string]$Message, [string]$Status, [string]$Details = "")
    
    $symbol = switch ($Status) {
        "PASS" { "✅" }
        "FAIL" { "❌" }
        "WARN" { "⚠️ " }
        "INFO" { "ℹ️ " }
        default { "  " }
    }
    
    Write-Host "$symbol $Message" -NoNewline
    
    if ($Details) {
        Write-Host " — $Details" -ForegroundColor Gray
    } else {
        Write-Host ""
    }
}

function Test-ServiceHealth {
    param([string]$Name, [string]$Url, [int]$ExpectedStatus)
    
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Check "$Name accessible" "PASS" "$Url"
            return $true
        } else {
            Write-Check "$Name returned unexpected status" "FAIL" "Got $($response.StatusCode), expected $ExpectedStatus"
            return $false
        }
    } catch {
        Write-Check "$Name not accessible" "FAIL" "$Url — $($_.Exception.Message)"
        return $false
    }
}

function Test-DirectoryExists {
    param([string]$Path, [string]$Description)
    
    if (Test-Path $Path) {
        Write-Check "$Description exists" "PASS" $Path
        return $true
    } else {
        Write-Check "$Description not found" "FAIL" $Path
        return $false
    }
}

function Test-GitStatus {
    Push-Location $REPO_ROOT
    try {
        $gitStatus = git status --porcelain 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Check "Git status check failed" "FAIL" $gitStatus
            return $false
        }
        
        if ([string]::IsNullOrWhiteSpace($gitStatus)) {
            Write-Check "Git working tree clean" "PASS" "No uncommitted changes"
            return $true
        } else {
            $changedFiles = ($gitStatus -split "`n").Count
            Write-Check "Git working tree has uncommitted changes" "WARN" "$changedFiles file(s) modified"
            
            if ($Verbose) {
                Write-Host "`n  Modified files:" -ForegroundColor Gray
                $gitStatus -split "`n" | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
                Write-Host ""
            }
            
            return $true  # Warning, not failure
        }
    } finally {
        Pop-Location
    }
}

function Test-NodeVersion {
    try {
        $nodeVersion = node --version 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Check "Node.js not found" "FAIL" "Install Node.js v24.6.0+"
            return $false
        }
        
        $versionMatch = $nodeVersion -match 'v(\d+)\.(\d+)\.(\d+)'
        if ($versionMatch) {
            $major = [int]$Matches[1]
            $minor = [int]$Matches[2]
            
            if ($major -ge 24 -and $minor -ge 6) {
                Write-Check "Node.js version acceptable" "PASS" $nodeVersion
                return $true
            } else {
                Write-Check "Node.js version too old" "FAIL" "$nodeVersion (need v24.6.0+)"
                return $false
            }
        } else {
            Write-Check "Node.js version unrecognized" "WARN" $nodeVersion
            return $true  # Proceed cautiously
        }
    } catch {
        Write-Check "Node.js check failed" "FAIL" $_.Exception.Message
        return $false
    }
}

function Test-CaptureScript {
    $scriptPath = Join-Path $REPO_ROOT "scripts\capture-daily-slo-burn.mjs"
    
    if (Test-Path $scriptPath) {
        Write-Check "Daily capture script exists" "PASS" $scriptPath
        return $true
    } else {
        Write-Check "Daily capture script not found" "FAIL" $scriptPath
        return $false
    }
}

# ===== Main Execution =====

Write-Host "`n🔍 TerraFusion OS — Day 1 Pre-Start Verification"
Write-Host "=============================================="
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "Target: Day 1 capture window (2026-02-15 15:00-15:59 PST)`n"

$allChecks = @()

# ===== System Prerequisites =====

Write-Host "📋 System Prerequisites"
Write-Host "------------------------`n"

$allChecks += Test-NodeVersion
$allChecks += Test-CaptureScript
$allChecks += Test-DirectoryExists $EVIDENCE_DIR "Evidence directory"
$allChecks += Test-DirectoryExists (Split-Path $SLO_LOG) "Ops documentation directory"

# ===== Service Health Checks =====

Write-Host "`n🏥 Service Health Checks"
Write-Host "------------------------`n"

foreach ($service in $SERVICES) {
    $allChecks += Test-ServiceHealth -Name $service.Name -Url $service.Url -ExpectedStatus $service.ExpectedStatus
}

# ===== Repository State =====

Write-Host "`n📦 Repository State"
Write-Host "-------------------`n"

$allChecks += Test-GitStatus

# ===== Evidence Integrity =====

Write-Host "`n🔒 Evidence Integrity"
Write-Host "---------------------`n"

# Check if Day 1 evidence already exists (shouldn't on pre-start)
$day1Screenshot = Join-Path $EVIDENCE_DIR "slo-burn-day1.png"
$day1Prometheus = Join-Path $EVIDENCE_DIR "prometheus-day1.json"

if ((Test-Path $day1Screenshot) -or (Test-Path $day1Prometheus)) {
    Write-Check "Day 1 evidence already exists" "WARN" "Delete premature artifacts or verify Day 1 not yet captured"
    $allChecks += $true  # Warning, not failure
} else {
    Write-Check "Day 1 evidence not present" "PASS" "Ready for capture"
    $allChecks += $true
}

# ===== Results Summary =====

Write-Host "`n📊 Verification Results"
Write-Host "=======================`n"

$passedChecks = ($allChecks | Where-Object { $_ -eq $true }).Count
$totalChecks = $allChecks.Count
$failedChecks = $totalChecks - $passedChecks

Write-Host "  Total checks: $totalChecks"
Write-Host "  Passed: $passedChecks" -ForegroundColor Green
Write-Host "  Failed: $failedChecks" -ForegroundColor $(if ($failedChecks -eq 0) { "Green" } else { "Red" })

# ===== Verdict =====

Write-Host ""

if ($failedChecks -eq 0) {
    Write-Host "✅ VERDICT: READY FOR DAY 1 EXECUTION" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "  1. Wait for Day 1 window (2026-02-15 15:00-15:59 PST)"
    Write-Host "  2. Run: node scripts/capture-daily-slo-burn.mjs --day=1"
    Write-Host "  3. Fill evidence (screenshot + Prometheus export)"
    Write-Host "  4. Commit atomically"
    Write-Host ""
    
    exit 0
} else {
    Write-Host "❌ VERDICT: NOT READY — STOP AND FIX" -ForegroundColor Red
    Write-Host ""
    Write-Host "⚠️  DO NOT proceed with Day 1 capture until all checks pass."
    Write-Host ""
    Write-Host "Common fixes:"
    Write-Host "  - Services not running: docker-compose up -d grafana prometheus terrafusion-api"
    Write-Host "  - Node.js missing: Install from https://nodejs.org (v24.6.0+)"
    Write-Host "  - Evidence directory missing: git pull origin feature/phase4-sprint1-storage"
    Write-Host ""
    Write-Host "Re-run this script after fixes:"
    Write-Host "  .\scripts\verify-day1-prestart.ps1"
    Write-Host ""
    
    exit 1
}

# TerraFusion OS — Post-Capture Sanity Check
#
# Verifies Day N capture evidence is complete and properly committed.
# Run immediately after committing Day N evidence.
#
# Exit codes:
#   0 = PASS (Day N evidence complete, ready for next day)
#   1 = FAIL (issues detected, review and fix)
#
# Classification: Government Operations — FISMA-HIGH

param(
    [Parameter(Mandatory=$true)]
    [ValidateRange(1,7)]
    [int]$Day
)

$ErrorActionPreference = "Continue"

# ===== Configuration =====

$REPO_ROOT = Split-Path -Parent $PSScriptRoot
$EVIDENCE_DIR = Join-Path $REPO_ROOT "docs\deploy\rehearsals\evidence\week1"
$SLO_LOG = Join-Path $REPO_ROOT "docs\ops\slo-tuning-log.md"

# ===== Helper Functions =====

function Write-Check {
    param([string]$Message, [string]$Status, [string]$Details = "")
    
    $symbol = switch ($Status) {
        "PASS" { "✅" }
        "FAIL" { "❌" }
        "WARN" { "⚠️ " }
        default { "  " }
    }
    
    Write-Host "$symbol $Message" -NoNewline
    
    if ($Details) {
        Write-Host " — $Details" -ForegroundColor Gray
    } else {
        Write-Host ""
    }
}

function Test-EvidenceFileExists {
    param([string]$FilePath, [string]$Description)
    
    if (Test-Path $FilePath) {
        $file = Get-Item $FilePath
        Write-Check "$Description exists" "PASS" "$($file.Length) bytes"
        return $true
    } else {
        Write-Check "$Description missing" "FAIL" $FilePath
        return $false
    }
}

function Test-PrometheusNoNulls {
    param([string]$FilePath)
    
    if (-not (Test-Path $FilePath)) {
        Write-Check "Prometheus export exists" "FAIL" "File not found"
        return $false
    }
    
    try {
        $content = Get-Content $FilePath -Raw | ConvertFrom-Json
        
        # Check for null values in nested structure
        $nullCount = 0
        
        foreach ($slo in $content.slos.PSObject.Properties) {
            $sloData = $slo.Value
            
            foreach ($metric in $sloData.PSObject.Properties) {
                if ($metric.Name -ne "_note" -and $null -eq $metric.Value) {
                    $nullCount++
                }
            }
        }
        
        if ($nullCount -eq 0) {
            Write-Check "Prometheus export complete" "PASS" "No null values"
            return $true
        } else {
            Write-Check "Prometheus export incomplete" "FAIL" "$nullCount null value(s) found"
            return $false
        }
    } catch {
        Write-Check "Prometheus export invalid" "FAIL" "JSON parse error: $_"
        return $false
    }
}

function Test-SLOLogComplete {
    param([int]$Day)
    
    if (-not (Test-Path $SLO_LOG)) {
        Write-Check "SLO log exists" "FAIL" "File not found"
        return $false
    }
    
    $logContent = Get-Content $SLO_LOG -Raw
    
    # Calculate expected date for this day
    $cutoverDate = [DateTime]::Parse("2026-02-14")
    $targetDate = $cutoverDate.AddDays($Day)
    $dateStr = $targetDate.ToString("yyyy-MM-dd")
    
    # Find the row for this day
    $dayRow = $logContent -split "`n" | Where-Object { $_ -match "^\|\s*$dateStr" }
    
    if (-not $dayRow) {
        Write-Check "SLO log Day $Day entry exists" "FAIL" "Row for $dateStr not found"
        return $false
    }
    
    # Check if row still contains "Pending"
    if ($dayRow -match "Pending") {
        Write-Check "SLO log Day $Day entry complete" "FAIL" "Still contains 'Pending'"
        Write-Host "   Row: $dayRow" -ForegroundColor Gray
        return $false
    }
    
    Write-Check "SLO log Day $Day entry complete" "PASS" "No 'Pending' values"
    return $true
}

function Test-GitCommit {
    param([int]$Day)
    
    Push-Location $REPO_ROOT
    try {
        $lastCommit = git log --oneline -1 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Check "Git commit exists" "FAIL" "Git log failed"
            return $false
        }
        
        if ($lastCommit -match "Day $Day") {
            Write-Check "Git commit for Day $Day exists" "PASS" $lastCommit
            return $true
        } else {
            Write-Check "Git commit for Day $Day missing" "FAIL" "Last commit: $lastCommit"
            return $false
        }
    } finally {
        Pop-Location
    }
}

function Test-GitClean {
    Push-Location $REPO_ROOT
    try {
        $gitStatus = git status --porcelain 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Check "Git status check" "FAIL" $gitStatus
            return $false
        }
        
        if ([string]::IsNullOrWhiteSpace($gitStatus)) {
            Write-Check "Git working tree clean" "PASS" "No uncommitted changes"
            return $true
        } else {
            $changedFiles = ($gitStatus -split "`n").Count
            Write-Check "Git working tree has changes" "WARN" "$changedFiles file(s) modified"
            
            Write-Host "`n  Modified files:" -ForegroundColor Gray
            $gitStatus -split "`n" | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
            Write-Host ""
            
            return $false  # Warning becomes failure for post-capture
        }
    } finally {
        Pop-Location
    }
}

# ===== Main Execution =====

Write-Host "`n🔍 TerraFusion OS — Post-Capture Sanity Check (Day $Day)"
Write-Host "=========================================================="
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n"

$allChecks = @()

# ===== Evidence File Checks =====

Write-Host "📦 Evidence Files"
Write-Host "-----------------`n"

$screenshotPath = Join-Path $EVIDENCE_DIR "slo-burn-day$Day.png"
$prometheusPath = Join-Path $EVIDENCE_DIR "prometheus-day$Day.json"

$allChecks += Test-EvidenceFileExists $screenshotPath "Dashboard screenshot"
$allChecks += Test-EvidenceFileExists $prometheusPath "Prometheus export"

# ===== Evidence Quality Checks =====

Write-Host "`n🔒 Evidence Quality"
Write-Host "-------------------`n"

$allChecks += Test-PrometheusNoNulls $prometheusPath
$allChecks += Test-SLOLogComplete $Day

# ===== Git Integrity Checks =====

Write-Host "`n📝 Git Integrity"
Write-Host "----------------`n"

$allChecks += Test-GitCommit $Day
$allChecks += Test-GitClean

# ===== Results Summary =====

Write-Host "`n📊 Sanity Check Results"
Write-Host "=======================`n"

$passedChecks = ($allChecks | Where-Object { $_ -eq $true }).Count
$totalChecks = $allChecks.Count
$failedChecks = $totalChecks - $passedChecks

Write-Host "  Total checks: $totalChecks"
Write-Host "  Passed: $passedChecks" -ForegroundColor $(if ($passedChecks -eq $totalChecks) { "Green" } else { "Yellow" })
Write-Host "  Failed: $failedChecks" -ForegroundColor $(if ($failedChecks -eq 0) { "Green" } else { "Red" })

# ===== Verdict =====

Write-Host ""

if ($failedChecks -eq 0) {
    Write-Host "✅ VERDICT: Day $Day CAPTURE COMPLETE" -ForegroundColor Green
    Write-Host ""
    
    $nextDay = $Day + 1
    if ($nextDay -le 7) {
        Write-Host "Next steps:"
        Write-Host "  - Day $nextDay capture window: 2026-02-$(14 + $nextDay) 15:00-15:59 PST"
        Write-Host "  - Run: node scripts/capture-daily-slo-burn.mjs --day=$nextDay"
        Write-Host ""
    } else {
        Write-Host "🎉 All 7 days captured! Next steps:"
        Write-Host "  1. Run completeness verifier:"
        Write-Host "     node scripts/verify-slo-burn-completeness.mjs"
        Write-Host "  2. If PASS, update validation tracker (Criterion #3 → ✅)"
        Write-Host "  3. Follow Phase 8 unlocking runbook"
        Write-Host ""
    }
    
    exit 0
} else {
    Write-Host "❌ VERDICT: ISSUES DETECTED — REVIEW AND FIX" -ForegroundColor Red
    Write-Host ""
    Write-Host "⚠️  Day $Day evidence is incomplete or uncommitted."
    Write-Host ""
    Write-Host "Common fixes:"
    Write-Host "  - Prometheus nulls: Re-query Prometheus, fill prometheus-day$Day.json, recommit"
    Write-Host "  - SLO log Pending: Update Day $Day row with actual burn rates, recommit"
    Write-Host "  - Missing evidence: Capture screenshot/export, add to commit"
    Write-Host "  - Uncommitted changes: git add ... && git commit -m '...'"
    Write-Host ""
    Write-Host "Re-run sanity check after fixes:"
    Write-Host "  .\scripts\verify-day-capture.ps1 -Day $Day"
    Write-Host ""
    
    exit 1
}

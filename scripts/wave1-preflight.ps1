#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Wave 1 Open Day Preflight Verifier
.DESCRIPTION
    Automated Go/No-Go gate checks for 2026-02-21 cold start.
    Run this BEFORE beginning intake to verify all preconditions.
.EXAMPLE
    ./scripts/wave1-preflight.ps1
.NOTES
    Seal Commit: 7c5853e92
    Operator Card: docs/ops/templates/WAVE_1_TRIAGE_OPERATOR_CARD.md
    Write Surface: docs/ops/WAVE_1_EVALUATION_LOG.md
#>

param(
    [string]$SealCommit = "7c5853e92",
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

$operatorCard = "docs/ops/templates/WAVE_1_TRIAGE_OPERATOR_CARD.md"
$writeSurface = "docs/ops/WAVE_1_EVALUATION_LOG.md"
$freezeCutoff = "2026-02-25T23:59:00Z"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        WAVE 1 OPEN DAY PREFLIGHT VERIFIER                    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$gates = @()
$allPass = $true

# ─────────────────────────────────────────────────────────────────────────────
# Gate 1: Operator Card Seal Integrity
# ─────────────────────────────────────────────────────────────────────────────
Write-Host "Gate 1: Operator Card Seal Integrity" -ForegroundColor White

# Check if card exists at sealed commit
$cardAtSeal = git show "${SealCommit}:${operatorCard}" 2>$null
if (-not $cardAtSeal) {
    Write-Host "  ❌ FAIL: Operator card not found at seal commit $SealCommit" -ForegroundColor Red
    $gates += @{ Gate = 1; Name = "Card Seal"; Status = "FAIL"; Reason = "Not found at seal commit" }
    $allPass = $false
} else {
    # Use git diff for reliable comparison (handles line endings correctly)
    $diffOutput = git diff "${SealCommit}" -- $operatorCard 2>$null
    
    if ([string]::IsNullOrWhiteSpace($diffOutput)) {
        Write-Host "  ✅ PASS: Card matches sealed commit $SealCommit" -ForegroundColor Green
        $gates += @{ Gate = 1; Name = "Card Seal"; Status = "PASS"; Reason = "Matches $SealCommit" }
    } else {
        Write-Host "  ❌ FAIL: Card differs from sealed version" -ForegroundColor Red
        Write-Host "         Run: git diff $SealCommit -- $operatorCard" -ForegroundColor Yellow
        $gates += @{ Gate = 1; Name = "Card Seal"; Status = "FAIL"; Reason = "Differs from sealed version" }
        $allPass = $false
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# Gate 2: Working Tree Clean (Wave 1 paths)
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Gate 2: Working Tree Clean (Wave 1 Templates)" -ForegroundColor White

$wave1Diffs = git diff --name-only HEAD -- "docs/ops/WAVE_1_*.md" "docs/ops/templates/WAVE_1_*.md" 2>$null
$wave1Staged = git diff --cached --name-only -- "docs/ops/WAVE_1_*.md" "docs/ops/templates/WAVE_1_*.md" 2>$null

if (-not $wave1Diffs -and -not $wave1Staged) {
    Write-Host "  ✅ PASS: No uncommitted Wave 1 template changes" -ForegroundColor Green
    $gates += @{ Gate = 2; Name = "Clean Tree"; Status = "PASS"; Reason = "No Wave 1 diffs" }
} else {
    Write-Host "  ❌ FAIL: Uncommitted Wave 1 template changes detected" -ForegroundColor Red
    if ($wave1Diffs) { Write-Host "         Modified: $wave1Diffs" -ForegroundColor Yellow }
    if ($wave1Staged) { Write-Host "         Staged: $wave1Staged" -ForegroundColor Yellow }
    $gates += @{ Gate = 2; Name = "Clean Tree"; Status = "FAIL"; Reason = "Uncommitted changes" }
    $allPass = $false
}

# ─────────────────────────────────────────────────────────────────────────────
# Gate 3: Write Surface Exists and Writable
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Gate 3: Write Surface Ready" -ForegroundColor White

if (Test-Path $writeSurface) {
    # Check if file is writable
    try {
        $testLine = "# Preflight write test - $(Get-Date -Format 'o')"
        # Don't actually write, just check permissions
        $fileInfo = Get-Item $writeSurface
        if (-not $fileInfo.IsReadOnly) {
            Write-Host "  ✅ PASS: $writeSurface exists and is writable" -ForegroundColor Green
            $gates += @{ Gate = 3; Name = "Write Surface"; Status = "PASS"; Reason = "Exists + writable" }
        } else {
            Write-Host "  ❌ FAIL: $writeSurface is read-only" -ForegroundColor Red
            $gates += @{ Gate = 3; Name = "Write Surface"; Status = "FAIL"; Reason = "Read-only" }
            $allPass = $false
        }
    } catch {
        Write-Host "  ❌ FAIL: Cannot access $writeSurface" -ForegroundColor Red
        $gates += @{ Gate = 3; Name = "Write Surface"; Status = "FAIL"; Reason = "Access error" }
        $allPass = $false
    }
} else {
    Write-Host "  ❌ FAIL: $writeSurface does not exist" -ForegroundColor Red
    $gates += @{ Gate = 3; Name = "Write Surface"; Status = "FAIL"; Reason = "File not found" }
    $allPass = $false
}

# ─────────────────────────────────────────────────────────────────────────────
# Gate 4: UTC Clock Verification
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Gate 4: UTC Clock Verification" -ForegroundColor White

$utcNow = (Get-Date).ToUniversalTime()
$cutoffDate = [DateTime]::Parse($freezeCutoff).ToUniversalTime()
$openDate = [DateTime]::Parse("2026-02-21T00:00:00Z")

Write-Host "  Current UTC: $($utcNow.ToString('yyyy-MM-ddTHH:mm:ssZ'))" -ForegroundColor Gray
Write-Host "  Open Date:   2026-02-21" -ForegroundColor Gray
Write-Host "  Cutoff:      $freezeCutoff" -ForegroundColor Gray

if ($utcNow -lt $openDate) {
    $daysUntil = [math]::Ceiling(($openDate - $utcNow).TotalDays)
    Write-Host "  ⏳ INFO: $daysUntil days until Open Day" -ForegroundColor Yellow
    $gates += @{ Gate = 4; Name = "UTC Clock"; Status = "INFO"; Reason = "$daysUntil days until open" }
} elseif ($utcNow -gt $cutoffDate) {
    Write-Host "  ❌ FAIL: Past freeze cutoff - nominations closed" -ForegroundColor Red
    $gates += @{ Gate = 4; Name = "UTC Clock"; Status = "FAIL"; Reason = "Past cutoff" }
    $allPass = $false
} else {
    Write-Host "  ✅ PASS: Within intake window" -ForegroundColor Green
    $gates += @{ Gate = 4; Name = "UTC Clock"; Status = "PASS"; Reason = "Within window" }
}

# ─────────────────────────────────────────────────────────────────────────────
# Gate 5: Decision ID Map Present
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Gate 5: Decision ID Map Verification" -ForegroundColor White

$cardContent = Get-Content $operatorCard -Raw -ErrorAction SilentlyContinue
$requiredIds = @("dec_ss_002", "dec_ss_003", "dec_ss_004", "dec_ss_005", "dec_ss_006")
$missingIds = @()

foreach ($id in $requiredIds) {
    if ($cardContent -notmatch $id) {
        $missingIds += $id
    }
}

if ($missingIds.Count -eq 0) {
    Write-Host "  ✅ PASS: All 5 decision IDs present in card" -ForegroundColor Green
    $gates += @{ Gate = 5; Name = "Decision IDs"; Status = "PASS"; Reason = "5/5 IDs present" }
} else {
    Write-Host "  ❌ FAIL: Missing decision IDs: $($missingIds -join ', ')" -ForegroundColor Red
    $gates += @{ Gate = 5; Name = "Decision IDs"; Status = "FAIL"; Reason = "Missing: $($missingIds -join ', ')" }
    $allPass = $false
}

# ─────────────────────────────────────────────────────────────────────────────
# Gate 6: Slot Cap Visible
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Gate 6: Slot Cap Enforcement" -ForegroundColor White

if ($cardContent -match "Cap\s*=\s*20" -or $cardContent -match "cap.*20") {
    Write-Host "  ✅ PASS: Slot cap = 20 is visible in card" -ForegroundColor Green
    $gates += @{ Gate = 6; Name = "Slot Cap"; Status = "PASS"; Reason = "Cap = 20 visible" }
} else {
    Write-Host "  ❌ FAIL: Slot cap not visible or incorrect" -ForegroundColor Red
    $gates += @{ Gate = 6; Name = "Slot Cap"; Status = "FAIL"; Reason = "Cap not visible" }
    $allPass = $false
}

# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$passCount = @($gates | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = @($gates | Where-Object { $_.Status -eq "FAIL" }).Count
$infoCount = @($gates | Where-Object { $_.Status -eq "INFO" }).Count

Write-Host "  PREFLIGHT SUMMARY" -ForegroundColor White
Write-Host "  ─────────────────" -ForegroundColor Gray
Write-Host "  Gates Passed: $passCount" -ForegroundColor $(if ($passCount -gt 0) { "Green" } else { "Gray" })
Write-Host "  Gates Failed: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Gray" })
Write-Host "  Info Only:    $infoCount" -ForegroundColor $(if ($infoCount -gt 0) { "Yellow" } else { "Gray" })
Write-Host ""

if ($allPass -and $failCount -eq 0) {
    Write-Host "  ╔═══════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "  ║            ✅ GO FOR INTAKE           ║" -ForegroundColor Green
    Write-Host "  ╚═══════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Next: Execute Open Day Checklist in operator card" -ForegroundColor Gray
    Write-Host "  Then: Begin intake → WAVE_1_EVALUATION_LOG.md" -ForegroundColor Gray
    exit 0
} elseif ($failCount -eq 0 -and $infoCount -gt 0) {
    Write-Host "  ╔═══════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "  ║        ⏳ READY - WAITING FOR OPEN    ║" -ForegroundColor Yellow
    Write-Host "  ╚═══════════════════════════════════════╝" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  All gates pass. Waiting for 2026-02-21 to begin intake." -ForegroundColor Gray
    exit 0
} else {
    Write-Host "  ╔═══════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "  ║          ❌ NO-GO - FIX ISSUES        ║" -ForegroundColor Red
    Write-Host "  ╚═══════════════════════════════════════╝" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Resolve all FAIL gates before proceeding" -ForegroundColor Yellow
    exit 1
}

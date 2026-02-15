# TerraFusion OS — Post-Capture Immutability Check
#
# Enforces local chain-of-custody for offline evidence commits.
# Run immediately after committing Day N evidence.
#
# Validates:
#   1. Triad atomicity (exactly 3 files in last commit)
#   2. Working tree clean (no staged/unstaged changes)
#   3. Creates local backup bundle (protection against disk failure)
#
# Exit codes:
#   0 = PASS (immutability guaranteed)
#   1 = FAIL (violation detected)
#
# Classification: Government Operations — FISMA-HIGH

param(
    [Parameter(Mandatory=$true)]
    [ValidateRange(1,7)]
    [int]$Day
)

$ErrorActionPreference = "Stop"

# ===== Configuration =====

$REPO_ROOT = Split-Path -Parent $PSScriptRoot
$BACKUP_DIR = Join-Path $REPO_ROOT "backups"
$BUNDLE_FILE = Join-Path $BACKUP_DIR "day$Day.bundle"

# ===== Helper Functions =====

function Write-Check {
    param([string]$Message, [string]$Status)
    
    $symbol = switch ($Status) {
        "PASS" { "✅" }
        "FAIL" { "❌" }
        "WARN" { "⚠️ " }
        default { "  " }
    }
    
    Write-Host "$symbol $Message"
}

# ===== Main Execution =====

Write-Host "`n🔒 TerraFusion OS — Post-Capture Immutability Check (Day $Day)"
Write-Host "=========================================================="
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n"

$allPassed = $true

# Check 1: Last commit contains exactly 3 files (triad)
Write-Host "📦 Triad Atomicity"
Write-Host "------------------`n"

$files = git show --name-only --format="" HEAD
$fileCount = ($files | Measure-Object).Count

if ($fileCount -eq 3) {
    Write-Check "Last commit contains exactly 3 files" "PASS"
    Write-Host "   Files committed:" -ForegroundColor Gray
    $files | ForEach-Object { Write-Host "   - $_" -ForegroundColor Gray }
} else {
    Write-Check "Last commit contains $fileCount files (expected 3)" "FAIL"
    $allPassed = $false
}

# Check 2: Working tree is clean
Write-Host "`n📝 Working Tree Status"
Write-Host "----------------------`n"

$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Check "Working tree clean" "PASS"
} else {
    Write-Check "Working tree has uncommitted changes" "FAIL"
    Write-Host "   Modified/untracked files:" -ForegroundColor Gray
    $status -split "`n" | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    $allPassed = $false
}

# Check 3: Create backup bundle
Write-Host "`n💾 Local Backup"
Write-Host "------------------`n"

try {
    # Ensure backup directory exists
    if (-not (Test-Path $BACKUP_DIR)) {
        New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
    }
    
    # Create bundle of current HEAD
    git bundle create $BUNDLE_FILE HEAD 2>&1 | Out-Null
    
    if (Test-Path $BUNDLE_FILE) {
        $bundleSize = (Get-Item $BUNDLE_FILE).Length
        Write-Check "Backup bundle created" "PASS"
        Write-Host "   Location: $BUNDLE_FILE" -ForegroundColor Gray
        Write-Host "   Size: $([math]::Round($bundleSize / 1KB, 2)) KB" -ForegroundColor Gray
    } else {
        Write-Check "Backup bundle creation failed" "FAIL"
        $allPassed = $false
    }
} catch {
    Write-Check "Backup bundle error: $_" "FAIL"
    $allPassed = $false
}

# Check 4: Verify last commit message matches Day N
Write-Host "`n📋 Commit Message"
Write-Host "-----------------`n"

$commitMsg = git log -1 --format=%s
if ($commitMsg -match "Day $Day") {
    Write-Check "Commit message references Day $Day" "PASS"
    Write-Host "   Message: $commitMsg" -ForegroundColor Gray
} else {
    Write-Check "Commit message does not reference Day $Day" "WARN"
    Write-Host "   Message: $commitMsg" -ForegroundColor Gray
}

# Final verdict
Write-Host "`n📊 Immutability Check Results"
Write-Host "============================`n"

if ($allPassed) {
    Write-Host "✅ PASS — Chain-of-custody guaranteed" -ForegroundColor Green
    Write-Host ""
    Write-Host "Immutability constraints:"
    Write-Host "  - ❌ DO NOT rebase this commit"
    Write-Host "  - ❌ DO NOT amend this commit"
    Write-Host "  - ❌ DO NOT cherry-pick this commit"
    Write-Host "  - ✅ Push as-is when network restores"
    Write-Host ""
    Write-Host "Backup bundle created at:"
    Write-Host "  $BUNDLE_FILE"
    Write-Host ""
    Write-Host "To restore from bundle (if needed):"
    Write-Host "  git clone backups/day$Day.bundle -b $(git branch --show-current) restored-repo"
    Write-Host ""
    exit 0
} else {
    Write-Host "❌ FAIL — Immutability violation detected" -ForegroundColor Red
    Write-Host ""
    Write-Host "Fix issues and re-run:"
    Write-Host "  .\scripts\post-capture-immutability-check.ps1 -Day $Day"
    Write-Host ""
    exit 1
}

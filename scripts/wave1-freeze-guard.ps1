#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Wave 1 Template Freeze Guard (Pre-commit)
.DESCRIPTION
    Blocks commits that modify Wave 1 templates before the freeze date.
    Set WAVE1_TEMPLATE_OVERRIDE=1 to bypass (requires exception approval).
.EXAMPLE
    ./scripts/wave1-freeze-guard.ps1
.NOTES
    Freeze Until: 2026-02-21
    Override: WAVE1_TEMPLATE_OVERRIDE=1
#>

param(
    [string]$FreezeUntil = "2026-02-21",
    [switch]$Force
)

$ErrorActionPreference = "Stop"

# Check if override is set
if ($env:WAVE1_TEMPLATE_OVERRIDE -eq "1" -or $Force) {
    Write-Host "⚠️  Wave 1 Template Override Active" -ForegroundColor Yellow
    Write-Host "   Ensure exception is recorded in STEADY_STATE_DECISION_LOG.md" -ForegroundColor Yellow
    exit 0
}

# Check current date against freeze date
$today = Get-Date
$freezeDate = [DateTime]::Parse($FreezeUntil)

if ($today -ge $freezeDate) {
    Write-Host "✅ Wave 1 freeze period ended ($FreezeUntil)" -ForegroundColor Green
    exit 0
}

# Wave 1 template paths
$wave1Patterns = @(
    "docs/ops/WAVE_1_",
    "docs/ops/templates/WAVE_1_"
)

# Get staged files
$stagedFiles = git diff --cached --name-only 2>$null

if (-not $stagedFiles) {
    # No staged files
    exit 0
}

# Check for Wave 1 template modifications
$blockedFiles = @()
foreach ($file in $stagedFiles) {
    foreach ($pattern in $wave1Patterns) {
        if ($file -like "*$pattern*") {
            $blockedFiles += $file
            break
        }
    }
}

if ($blockedFiles.Count -gt 0) {
    Write-Host "" -ForegroundColor Red
    Write-Host "🔒 WAVE 1 TEMPLATE FREEZE ACTIVE" -ForegroundColor Red
    Write-Host "   Freeze Until: $FreezeUntil" -ForegroundColor Yellow
    Write-Host "   Days Remaining: $([math]::Ceiling(($freezeDate - $today).TotalDays))" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Blocked files:" -ForegroundColor Red
    foreach ($file in $blockedFiles) {
        Write-Host "     ❌ $file" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "   To override (requires exception approval):" -ForegroundColor Yellow
    Write-Host "     1. Record exception in STEADY_STATE_DECISION_LOG.md" -ForegroundColor Gray
    Write-Host "     2. Get dual-approval" -ForegroundColor Gray
    Write-Host "     3. Set WAVE1_TEMPLATE_OVERRIDE=1" -ForegroundColor Gray
    Write-Host "     4. Re-run commit" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

exit 0

#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Wave 1 Template Seal Check
.DESCRIPTION
    Verifies no Wave 1 template files have been modified since the seal commit.
    Run this command to prove seal integrity at any time.
.EXAMPLE
    ./scripts/wave1-seal-check.ps1
.NOTES
    Seal Commit: 7c5853e92
    Seal Date: 2026-02-03
    Freeze Until: 2026-02-21
#>

param(
    [string]$SealCommit = "7c5853e92",
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

# Wave 1 template paths (relative to repo root)
$Wave1Patterns = @(
    "docs/ops/WAVE_1_*.md",
    "docs/ops/templates/WAVE_1_*.md"
)

Write-Host "🔒 Wave 1 Template Seal Check" -ForegroundColor Cyan
Write-Host "   Seal Commit: $SealCommit" -ForegroundColor Gray
Write-Host "   Freeze Until: 2026-02-21" -ForegroundColor Gray
Write-Host ""

# Get files changed since seal commit
$changedFiles = git diff --name-only "$SealCommit..HEAD" 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ FAIL: Could not compare against seal commit $SealCommit" -ForegroundColor Red
    Write-Host "   Ensure the seal commit exists in history." -ForegroundColor Yellow
    exit 1
}

# Filter for Wave 1 template files
$wave1Changes = @()
foreach ($file in $changedFiles) {
    foreach ($pattern in $Wave1Patterns) {
        # Convert glob to regex-ish match
        $regexPattern = $pattern -replace '\*', '.*' -replace '/', '[/\\]'
        if ($file -match $regexPattern) {
            $wave1Changes += $file
            break
        }
    }
}

# Also check for exact matches on known files
$knownWave1Files = @(
    "docs/ops/WAVE_1_NOMINATIONS_OPEN.md",
    "docs/ops/WAVE_1_EVALUATION_LOG.md",
    "docs/ops/templates/WAVE_1_NOMINATION_FORM.md",
    "docs/ops/templates/WAVE_1_COHORT_INTAKE_PACKET.md",
    "docs/ops/templates/WAVE_1_READINESS_GATE_CHECKLIST.md",
    "docs/ops/templates/WAVE_1_ACCEPTED_COHORT.md",
    "docs/ops/templates/WAVE_1_DAY_0_BASELINE.md",
    "docs/ops/templates/WAVE_1_TRIAGE_OPERATOR_CARD.md"
)

foreach ($file in $changedFiles) {
    $normalizedFile = $file -replace '\\', '/'
    if ($knownWave1Files -contains $normalizedFile -and $wave1Changes -notcontains $file) {
        $wave1Changes += $file
    }
}

$wave1Changes = $wave1Changes | Select-Object -Unique

if ($wave1Changes.Count -eq 0) {
    Write-Host "✅ SEAL INTACT" -ForegroundColor Green
    Write-Host "   No Wave 1 template changes detected since seal commit." -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Protected files (6):" -ForegroundColor Gray
    foreach ($f in $knownWave1Files | Where-Object { $_ -like "*templates/*" }) {
        Write-Host "     - $f" -ForegroundColor DarkGray
    }
    exit 0
} else {
    Write-Host "❌ SEAL BROKEN" -ForegroundColor Red
    Write-Host "   Wave 1 template files modified since seal commit:" -ForegroundColor Yellow
    foreach ($file in $wave1Changes) {
        Write-Host "     - $file" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "   To proceed with changes, set WAVE1_TEMPLATE_OVERRIDE=1" -ForegroundColor Yellow
    Write-Host "   and record exception in STEADY_STATE_DECISION_LOG.md" -ForegroundColor Yellow
    exit 1
}

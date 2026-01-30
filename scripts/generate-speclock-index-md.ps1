<#
.SYNOPSIS
    Generates INDEX.md from INDEX.json for the TerraFusion SpecLock registry.

.DESCRIPTION
    This script reads docs/spec-lock/INDEX.json and generates a human-readable
    INDEX.md file with tables organized by surface and project.

.EXAMPLE
    ./scripts/generate-speclock-index-md.ps1

.NOTES
    TerraFusion OS - SpecLock Index MD Generator
    Version: 1.0.0
#>

[CmdletBinding()]
param(
    [string]$RepoRoot = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

# Find repo root
while (-not (Test-Path (Join-Path $RepoRoot ".git")) -and $RepoRoot -ne [System.IO.Path]::GetPathRoot($RepoRoot)) {
    $RepoRoot = Split-Path $RepoRoot -Parent
}

$indexJsonPath = Join-Path $RepoRoot "docs/spec-lock/INDEX.json"
$indexMdPath = Join-Path $RepoRoot "docs/spec-lock/INDEX.md"

Write-Host "Generating INDEX.md from INDEX.json..." -ForegroundColor Cyan
Write-Host "  Source: $indexJsonPath"
Write-Host "  Output: $indexMdPath"
Write-Host ""

# Load INDEX.json
if (-not (Test-Path $indexJsonPath)) {
    Write-Error "INDEX.json not found at: $indexJsonPath"
    exit 1
}

$index = Get-Content $indexJsonPath -Raw | ConvertFrom-Json

# Surface display info
$surfaceInfo = @{
    "dashboards" = @{ emoji = "📊"; name = "Dashboards" }
    "metrics" = @{ emoji = "📈"; name = "Metrics" }
    "alerts" = @{ emoji = "🚨"; name = "Alerts" }
    "api" = @{ emoji = "🔌"; name = "API" }
    "events" = @{ emoji = "📡"; name = "Events" }
    "ui" = @{ emoji = "🖥️"; name = "UI" }
    "mixed" = @{ emoji = "🔀"; name = "Mixed" }
}

# Status display
$statusDisplay = @{
    "active" = "✅ active"
    "draft" = "⚠️ draft"
    "deprecated" = "🚫 deprecated"
}

# Build markdown
$sb = [System.Text.StringBuilder]::new()

[void]$sb.AppendLine("# TerraFusion SpecLock Index")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("> Central registry of all frozen spec-lock contracts")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("**Version**: $($index.version)")
[void]$sb.AppendLine("**Updated**: $($index.updated)")
[void]$sb.AppendLine("**Total Locks**: $($index.locks.Count)")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("---")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("## Quick Links")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("- [Active Locks](#active-locks)")
[void]$sb.AppendLine("- [By Surface](#by-surface)")
[void]$sb.AppendLine("- [By Project](#by-project)")
[void]$sb.AppendLine("- [Deprecated Locks](#deprecated-locks)")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("---")
[void]$sb.AppendLine("")

# Active Locks table
$activeLocks = $index.locks | Where-Object { $_.status -eq "active" }

[void]$sb.AppendLine("## Active Locks")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("| ID | Surface | Project | Version | Owner | Spec |")
[void]$sb.AppendLine("|----|---------|---------|---------|-------|------|")

foreach ($lock in $activeLocks) {
    $specLink = "[📄]($($lock.spec_path -replace '^docs/spec-lock/', '' -replace '^', '../'))"
    [void]$sb.AppendLine("| ``$($lock.id)`` | $($lock.surface) | $($lock.project) | $($lock.spec_version) | $($lock.owner) | $specLink |")
}

[void]$sb.AppendLine("")
[void]$sb.AppendLine("---")
[void]$sb.AppendLine("")

# By Surface
[void]$sb.AppendLine("## By Surface")
[void]$sb.AppendLine("")

$surfaces = $index.locks | Group-Object -Property surface | Sort-Object Name

foreach ($surfaceEntry in $surfaceInfo.Keys | Sort-Object) {
    $info = $surfaceInfo[$surfaceEntry]
    $locksForSurface = $index.locks | Where-Object { $_.surface -eq $surfaceEntry }

    [void]$sb.AppendLine("### $($info.emoji) $($info.name) ($($locksForSurface.Count))")
    [void]$sb.AppendLine("")

    if ($locksForSurface.Count -eq 0) {
        [void]$sb.AppendLine("*No $($info.name.ToLower()) spec-locks registered yet.*")
    } else {
        [void]$sb.AppendLine("| ID | Project | Version | Status |")
        [void]$sb.AppendLine("|----|---------|---------|--------|")
        foreach ($lock in $locksForSurface) {
            $status = $statusDisplay[$lock.status]
            [void]$sb.AppendLine("| ``$($lock.id)`` | $($lock.project) | $($lock.spec_version) | $status |")
        }
    }
    [void]$sb.AppendLine("")
}

[void]$sb.AppendLine("---")
[void]$sb.AppendLine("")

# By Project
[void]$sb.AppendLine("## By Project")
[void]$sb.AppendLine("")

$projects = $index.locks | Group-Object -Property project | Sort-Object Name

foreach ($project in $projects) {
    [void]$sb.AppendLine("### $($project.Name) ($($project.Count))")
    [void]$sb.AppendLine("")
    [void]$sb.AppendLine("| ID | Surface | Version | Status |")
    [void]$sb.AppendLine("|----|---------|---------|--------|")
    foreach ($lock in $project.Group) {
        $status = $statusDisplay[$lock.status]
        [void]$sb.AppendLine("| ``$($lock.id)`` | $($lock.surface) | $($lock.spec_version) | $status |")
    }
    [void]$sb.AppendLine("")
}

[void]$sb.AppendLine("---")
[void]$sb.AppendLine("")

# Deprecated Locks
$deprecatedLocks = $index.locks | Where-Object { $_.status -eq "deprecated" }

[void]$sb.AppendLine("## Deprecated Locks")
[void]$sb.AppendLine("")

if ($deprecatedLocks.Count -eq 0) {
    [void]$sb.AppendLine("*No deprecated spec-locks.*")
} else {
    [void]$sb.AppendLine("| ID | Surface | Deprecated By | Notes |")
    [void]$sb.AppendLine("|----|---------|---------------|-------|")
    foreach ($lock in $deprecatedLocks) {
        $deprecatedBy = if ($lock.deprecated_by) { "``$($lock.deprecated_by)``" } else { "-" }
        $notes = if ($lock.notes) { $lock.notes } else { "-" }
        [void]$sb.AppendLine("| ``$($lock.id)`` | $($lock.surface) | $deprecatedBy | $notes |")
    }
}

[void]$sb.AppendLine("")
[void]$sb.AppendLine("---")
[void]$sb.AppendLine("")

# CI Integration
[void]$sb.AppendLine("## CI Integration")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("### Run All SpecLock Tests")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("``````bash")
[void]$sb.AppendLine("dotnet test --filter `"Category=SpecLock`"")
[void]$sb.AppendLine("``````")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("### Validate Index")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("``````powershell")
[void]$sb.AppendLine("./scripts/validate-speclock-index.ps1")
[void]$sb.AppendLine("``````")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("### Regenerate This File")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("``````powershell")
[void]$sb.AppendLine("./scripts/generate-speclock-index-md.ps1")
[void]$sb.AppendLine("``````")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("---")
[void]$sb.AppendLine("")

# Adding a new lock
[void]$sb.AppendLine("## Adding a New SpecLock")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("1. Use ``/tf-speclock`` command to create spec + tests")
[void]$sb.AppendLine("2. Entry is auto-registered in ``INDEX.json``")
[void]$sb.AppendLine("3. Run ``./scripts/generate-speclock-index-md.ps1`` to update this file")
[void]$sb.AppendLine("4. Commit both files together")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("---")
[void]$sb.AppendLine("")

# Status definitions
[void]$sb.AppendLine("## SpecLock Status Definitions")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("| Status | Meaning |")
[void]$sb.AppendLine("|--------|---------|")
[void]$sb.AppendLine("| ✅ ``active`` | Contract is frozen and enforced by tests |")
[void]$sb.AppendLine("| ⚠️ ``draft`` | Contract is being defined, not yet enforced |")
[void]$sb.AppendLine("| 🚫 ``deprecated`` | Contract is superseded, tests may be removed |")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("---")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("*Generated by ``generate-speclock-index-md.ps1`` on $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') — Do not edit manually*")

# Write output
$sb.ToString() | Set-Content $indexMdPath -Encoding UTF8

Write-Host "✅ INDEX.md generated successfully" -ForegroundColor Green
Write-Host "   Locks: $($index.locks.Count)"
Write-Host "   Active: $($activeLocks.Count)"
Write-Host "   Deprecated: $($deprecatedLocks.Count)"

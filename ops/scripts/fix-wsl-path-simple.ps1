# Fix WSL Path Translation Issues - Simple Version
# Resolves E:\Windsurf\bin path translation error

param(
    [switch]$Fix,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "⚠️ $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Info { param($Message) Write-Host "ℹ️ $Message" -ForegroundColor Cyan }
function Write-Header { param($Message) Write-Host "`n🚀 $Message" -ForegroundColor Magenta }

function Test-WSLPathIssue {
    Write-Header "Diagnosing WSL Path Translation Issue"

    $currentPath = $env:PATH
    $pathEntries = $currentPath -split ';'
    $problematicPaths = @()

    foreach ($entry in $pathEntries) {
        if ($entry -like "*Windsurf*" -and !(Test-Path $entry)) {
            $problematicPaths += $entry
            Write-Warning "Found invalid PATH entry: $entry"
        }
    }

    if ($problematicPaths.Count -eq 0) {
        Write-Success "No problematic PATH entries found"
        return $false
    }

    Write-Info "Found $($problematicPaths.Count) problematic PATH entries"
    return $true
}

function Remove-InvalidPathEntries {
    Write-Header "Removing Invalid PATH Entries"

    $userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
    $userPathEntries = $userPath -split ';' | Where-Object { $_ -ne "" }
    $cleanUserPath = @()
    $removedEntries = @()

    foreach ($entry in $userPathEntries) {
        if ($entry -like "*Windsurf*" -and !(Test-Path $entry)) {
            $removedEntries += $entry
            Write-Warning "Removing from User PATH: $entry"
        }
        else {
            $cleanUserPath += $entry
        }
    }

    if ($Fix -and $removedEntries.Count -gt 0) {
        $newUserPath = $cleanUserPath -join ';'
        [Environment]::SetEnvironmentVariable("PATH", $newUserPath, "User")
        Write-Success "Updated User PATH (removed $($removedEntries.Count) entries)"

        # Update current session
        $machinePath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
        $env:PATH = $machinePath + ";" + $newUserPath

        # Test WSL
        Write-Info "Testing WSL after PATH cleanup..."
        try {
            $wslTest = & wsl echo "WSL Test Success" 2>&1
            if ($wslTest -like "*WSL Test Success*") {
                Write-Success "WSL is now working correctly!"
                return $true
            }
            else {
                Write-Warning "WSL still has issues"
                return $false
            }
        }
        catch {
            Write-Warning "WSL test failed: $($_.Exception.Message)"
            return $false
        }
    }
    else {
        Write-Info "Dry run mode - no changes made"
        Write-Info "Run with -Fix to actually remove invalid PATH entries"
        return $false
    }
}

function Show-Solutions {
    Write-Header "Solutions Available"

    Write-Info "1. Use PowerShell versions of scripts (RECOMMENDED):"
    Write-Info "   .\ops\scripts\ai-swarm-readiness.ps1"
    Write-Info "   .\ops\scripts\tf-oneclick.ps1"
    Write-Info ""
    Write-Info "2. Fix PATH and use WSL:"
    Write-Info "   .\ops\scripts\fix-wsl-path.ps1 -Fix"
    Write-Info "   wsl bash ops/scripts/ai-swarm-readiness.sh"
    Write-Info ""
    Write-Info "3. Use make commands:"
    Write-Info "   make swarm-ps     # PowerShell AI-swarm validation"
    Write-Info "   make oneclick-ps  # PowerShell one-click deployment"
}

Write-Header "TerraFusion WSL Path Fix Utility"

$hasIssue = Test-WSLPathIssue

if (!$hasIssue) {
    Write-Success "No WSL path translation issues detected"
    exit 0
}

$fixed = Remove-InvalidPathEntries

if (!$fixed -and !$Fix) {
    Write-Info "Run with -Fix parameter to attempt automatic repair"
}

Show-Solutions

exit $(if ($fixed) { 0 } else { 1 })

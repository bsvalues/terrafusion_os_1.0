# Fix WSL Path Translation Issues
# Resolves E:\Windsurf\bin path translation error

param(
    [Parameter(HelpMessage = "Actually remove the invalid PATH entry")]
    [switch]$Fix,

    [Parameter(HelpMessage = "Show verbose output")]
    [switch]$Verbose
)

# Set error action and strict mode
$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# Color functions for output
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }
function Write-Header { param($Message) Write-Host "`n🚀 $Message" -ForegroundColor Magenta }

function Test-WSLPathIssue {
    Write-Header "Diagnosing WSL Path Translation Issue"

    # Check current PATH for problematic entries
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

    # Test WSL with current PATH
    Write-Info "Testing WSL with current PATH..."
    try {
        $wslTest = & wsl echo "WSL Test" 2>&1
        if ($wslTest -like "*Failed to translate*") {
            Write-Error "WSL path translation error confirmed"
            return $true
        }
        else {
            Write-Success "WSL working despite invalid PATH entries"
            return $false
        }
    }
    catch {
        Write-Warning "Could not test WSL: $($_.Exception.Message)"
        return $true
    }
}

function Remove-InvalidPathEntries {
    Write-Header "Removing Invalid PATH Entries"

    # Get current PATH
    $userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
    $machinePath = [Environment]::GetEnvironmentVariable("PATH", "Machine")

    Write-Info "Current User PATH entries:"
    $userPath -split ';' | ForEach-Object { Write-Info "  $_" }

    # Check user PATH for invalid entries
    $userPathEntries = $userPath -split ';' | Where-Object { $_ -ne "" }
    $cleanUserPath = @()
    $removedUserEntries = @()

    foreach ($entry in $userPathEntries) {
        if ($entry -like "*Windsurf*" -and !(Test-Path $entry)) {
            $removedUserEntries += $entry
            Write-Warning "Removing from User PATH: $entry"
        }
        else {
            $cleanUserPath += $entry
        }
    }

    # Check machine PATH for invalid entries (requires admin)
    $machinePathEntries = $machinePath -split ';' | Where-Object { $_ -ne "" }
    $cleanMachinePath = @()
    $removedMachineEntries = @()

    foreach ($entry in $machinePathEntries) {
        if ($entry -like "*Windsurf*" -and !(Test-Path $entry)) {
            $removedMachineEntries += $entry
            Write-Warning "Found invalid Machine PATH entry: $entry (requires admin to remove)"
        }
        else {
            $cleanMachinePath += $entry
        }
    }

    if ($Fix) {
        # Update User PATH
        if ($removedUserEntries.Count -gt 0) {
            $newUserPath = $cleanUserPath -join ';'
            [Environment]::SetEnvironmentVariable("PATH", $newUserPath, "User")
            Write-Success "Updated User PATH (removed $($removedUserEntries.Count) entries)"

            # Update current session
            $env:PATH = [Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + $newUserPath
        }

        # Warn about Machine PATH
        if ($removedMachineEntries.Count -gt 0) {
            Write-Warning "Machine PATH contains invalid entries that require administrator privileges to remove:"
            $removedMachineEntries | ForEach-Object { Write-Warning "  $_" }
            Write-Info "Run this script as Administrator to clean Machine PATH"
        }

        Write-Success "PATH cleanup completed"

        # Test WSL again
        Write-Info "Testing WSL after PATH cleanup..."
        try {
            $wslTest = & wsl echo "WSL Test Success" 2>&1
            if ($wslTest -like "*WSL Test Success*") {
                Write-Success "WSL is now working correctly!"
                return $true
            }
            else {
                Write-Warning "WSL still has issues: $wslTest"
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

        if ($removedUserEntries.Count -gt 0) {
            Write-Info "Would remove from User PATH:"
            $removedUserEntries | ForEach-Object { Write-Info "  $_" }
        }

        if ($removedMachineEntries.Count -gt 0) {
            Write-Info "Would remove from Machine PATH (requires admin):"
            $removedMachineEntries | ForEach-Object { Write-Info "  $_" }
        }

        return $false
    }
}

function Show-AlternativeSolutions {
    Write-Header "Alternative Solutions"

    Write-Info "If PATH cleanup doesn't work, try these alternatives:"
    Write-Info ""
    Write-Info "1. Use PowerShell versions of scripts:"
    Write-Info "   .\ops\scripts\ai-swarm-readiness.ps1"
    Write-Info "   .\ops\scripts\tf-oneclick.ps1"
    Write-Info ""
    Write-Info "2. Temporarily set PATH for WSL session:"
    Write-Info "   `$env:PATH = (`$env:PATH -split ';' | Where-Object { -not (`$_ -like '*Windsurf*' -and !(Test-Path `$_)) }) -join ';'"
    Write-Info "   wsl bash ops/scripts/ai-swarm-readiness.sh"
    Write-Info ""
    Write-Info "3. Run bash scripts directly in WSL:"
    Write-Info "   wsl --cd /mnt/c/Users/bsval/terrafusion_os_1.0 bash ops/scripts/ai-swarm-readiness.sh"
    Write-Info ""
    Write-Info "4. Use Git Bash instead of WSL:"
    Write-Info "   'C:\Program Files\Git\bin\bash.exe' ops/scripts/ai-swarm-readiness.sh"
}

function Invoke-WSLPathFix {
    Write-Header "TerraFusion WSL Path Fix Utility"

    # Diagnose the issue
    $hasIssue = Test-WSLPathIssue

    if (!$hasIssue) {
        Write-Success "No WSL path translation issues detected"
        return $true
    }

    # Attempt to fix
    $fixed = Remove-InvalidPathEntries

    if (!$fixed -and !$Fix) {
        Write-Info "Run with -Fix parameter to attempt automatic repair"
    }

    # Show alternatives
    Show-AlternativeSolutions

    return $fixed
}

# Execute main function if script is run directly
if ($MyInvocation.InvocationName -ne '.') {
    $result = Invoke-WSLPathFix
    exit $(if ($result) { 0 } else { 1 })
}

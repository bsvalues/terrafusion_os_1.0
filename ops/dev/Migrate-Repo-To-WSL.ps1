<#
.SYNOPSIS
    Safely migrate TerraFusion repo from Windows (NTFS) to WSL (ext4)

.DESCRIPTION
    This script:
    1. Snapshots all uncommitted changes (working + staged + untracked)
    2. Creates stash + patch files as backup
    3. Clones fresh repo in WSL
    4. Applies your local changes
    5. Validates the migration

    The Windows repo is left untouched - rename/delete it manually after validation.

.PARAMETER WindowsRepoPath
    Path to the Windows repo (default: C:\Users\bsval\terrafusion_os_1.0)

.PARAMETER WslRepoPath
    Path in WSL where repo will be cloned (default: ~/dev/terrafusion_os_1.0)

.PARAMETER Distro
    WSL distribution to use (default: Ubuntu)

.PARAMETER SkipClone
    Skip cloning if WSL repo already exists

.PARAMETER DryRun
    Show what would happen without making changes

.EXAMPLE
    # Full migration
    .\Migrate-Repo-To-WSL.ps1

.EXAMPLE
    # Dry run first
    .\Migrate-Repo-To-WSL.ps1 -DryRun

.EXAMPLE
    # If WSL repo already exists
    .\Migrate-Repo-To-WSL.ps1 -SkipClone
#>

param(
    [string]$WindowsRepoPath = "C:\Users\bsval\terrafusion_os_1.0",
    [string]$WslRepoPath = "~/dev/terrafusion_os_1.0",
    [string]$Distro = "Ubuntu",
    [string]$GitHubRepo = "https://github.com/bsvalues/terrafusion_os_1.0.git",
    [switch]$SkipClone,
    [switch]$DryRun,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

# ═══════════════════════════════════════════════════════════════════════════
# Configuration
# ═══════════════════════════════════════════════════════════════════════════

$BackupDir = "C:\Dev\tf-migration-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$LogFile = "$BackupDir\migration.log"

# ═══════════════════════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════════════════════

function Log {
    param([string]$Message, [string]$Color = "White")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $entry = "[$timestamp] $Message"
    Write-Host $entry -ForegroundColor $Color
    if (-not $DryRun) {
        Add-Content -Path $LogFile -Value $entry -ErrorAction SilentlyContinue
    }
}

function Run-WSL {
    param([string]$Command)
    Log "WSL> $Command" "Cyan"
    if (-not $DryRun) {
        wsl -d $Distro -- bash -lc $Command
    }
}

function Show-Banner {
    Write-Host ""
    Write-Host "  ╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "  ║     🚀 TerraFusion WSL Migration Tool                     ║" -ForegroundColor Magenta
    Write-Host "  ╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
    Write-Host ""
    if ($DryRun) {
        Write-Host "  ⚠️  DRY RUN MODE - No changes will be made" -ForegroundColor Yellow
        Write-Host ""
    }
}

# ═══════════════════════════════════════════════════════════════════════════
# Pre-flight Checks
# ═══════════════════════════════════════════════════════════════════════════

function Test-Prerequisites {
    Log "Running pre-flight checks..." "Cyan"

    # Check Windows repo exists
    if (-not (Test-Path "$WindowsRepoPath\.git")) {
        throw "Windows repo not found at $WindowsRepoPath"
    }
    Log "  ✓ Windows repo exists" "Green"

    # Check WSL is available - use simple test
    $wslTest = wsl -d $Distro -e echo "ok" 2>$null
    if ($wslTest -ne "ok") {
        throw "WSL distro '$Distro' not found"
    }
    Log "  ✓ WSL distro '$Distro' available" "Green"

    # Check git in WSL
    $gitVersion = wsl -d $Distro -- git --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Git not found in WSL"
    }
    Log "  ✓ Git available in WSL" "Green"

    # Check VS Code Remote WSL
    $remoteWsl = code-insiders --list-extensions 2>$null | Select-String "ms-vscode-remote.remote-wsl"
    if (-not $remoteWsl) {
        Log "  ⚠ Remote-WSL extension not found (recommended)" "Yellow"
    } else {
        Log "  ✓ Remote-WSL extension installed" "Green"
    }

    Log "Pre-flight checks passed!" "Green"
}

# ═══════════════════════════════════════════════════════════════════════════
# Phase 1: Snapshot Windows Changes
# ═══════════════════════════════════════════════════════════════════════════

function Save-WindowsChanges {
    Log "Phase 1: Snapshotting Windows changes..." "Yellow"

    if (-not $DryRun) {
        New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    }

    Push-Location $WindowsRepoPath

    try {
        # Show current status
        Log "Current git status:" "Gray"
        git status --short

        # Count changes
        $statusOutput = git status --porcelain
        $changedFiles = ($statusOutput | Measure-Object).Count
        Log "  Found $changedFiles uncommitted changes" "Cyan"

        if ($changedFiles -gt 0) {
            if (-not $DryRun) {
                # Save working directory changes
                Log "  Saving working directory diff..." "Gray"
                git diff > "$BackupDir\working.diff"

                # Save staged changes
                Log "  Saving staged diff..." "Gray"
                git diff --staged > "$BackupDir\staged.diff"

                # Save list of untracked files
                Log "  Saving untracked file list..." "Gray"
                git ls-files --others --exclude-standard > "$BackupDir\untracked.txt"

                # Create stash with everything including untracked
                $stashMsg = "wsl-migration-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
                Log "  Creating stash: $stashMsg" "Gray"
                git stash push -u -m $stashMsg

                # Export stash as patch (most portable)
                Log "  Exporting stash as patch..." "Gray"
                git stash show -p > "$BackupDir\stash.patch"

                # Pop stash back so Windows repo is unchanged
                git stash pop | Out-Null
            }

            Log "  ✓ Changes backed up to $BackupDir" "Green"
        } else {
            Log "  ✓ No uncommitted changes to migrate" "Green"
        }

        # Record current branch and commit
        $currentBranch = git branch --show-current
        $currentCommit = git rev-parse HEAD

        if (-not $DryRun) {
            @{
                branch = $currentBranch
                commit = $currentCommit
                timestamp = Get-Date -Format "o"
                changedFiles = $changedFiles
            } | ConvertTo-Json | Set-Content "$BackupDir\state.json"
        }

        Log "  Branch: $currentBranch" "Gray"
        Log "  Commit: $($currentCommit.Substring(0,8))" "Gray"

    } finally {
        Pop-Location
    }

    Log "Phase 1 complete!" "Green"
    return [int]$changedFiles
}

# ═══════════════════════════════════════════════════════════════════════════
# Phase 2: Clone in WSL
# ═══════════════════════════════════════════════════════════════════════════

function Initialize-WslRepo {
    Log "Phase 2: Setting up WSL repo..." "Yellow"

    # Expand ~ to actual home
    $wslHome = wsl -d $Distro -- bash -c 'echo $HOME' 2>$null
    $wslFullPath = $WslRepoPath -replace "^~", $wslHome

    # Check if already exists
    $repoExists = wsl -d $Distro -- bash -c "test -d '$wslFullPath/.git' && echo 'yes' || echo 'no'" 2>$null

    if ($repoExists -eq "yes") {
        if ($SkipClone) {
            Log "  WSL repo already exists, skipping clone" "Yellow"
        } else {
            Log "  ⚠ WSL repo already exists at $wslFullPath" "Yellow"
            $response = Read-Host "  Delete and re-clone? (y/N)"
            if ($response -eq "y") {
                if (-not $DryRun) {
                    Run-WSL "rm -rf '$wslFullPath'"
                }
            } else {
                Log "  Keeping existing repo, will apply changes on top" "Yellow"
                return $wslFullPath
            }
        }
    }

    if (-not $SkipClone -and $repoExists -ne "yes") {
        Log "  Creating directory structure..." "Gray"
        Run-WSL "mkdir -p $(Split-Path $wslFullPath -Parent)"

        Log "  Cloning from $GitHubRepo..." "Gray"
        Run-WSL "git clone '$GitHubRepo' '$wslFullPath'"

        # Checkout same branch as Windows
        $state = Get-Content "$BackupDir\state.json" -ErrorAction SilentlyContinue | ConvertFrom-Json
        if ($state.branch -and $state.branch -ne "main") {
            Log "  Checking out branch: $($state.branch)" "Gray"
            Run-WSL "cd '$wslFullPath' && git checkout '$($state.branch)'"
        }
    }

    Log "Phase 2 complete!" "Green"
    return $wslFullPath
}

# ═══════════════════════════════════════════════════════════════════════════
# Phase 3: Apply Changes
# ═══════════════════════════════════════════════════════════════════════════

function Apply-ChangesToWsl {
    param([string]$WslFullPath, [int]$ChangedFiles)

    Log "Phase 3: Applying changes to WSL repo..." "Yellow"

    if ($ChangedFiles -eq 0) {
        Log "  No changes to apply" "Gray"
        return
    }

    # Convert Windows backup path to WSL path
    $wslBackupPath = $BackupDir -replace "C:", "/mnt/c" -replace "\\", "/"

    # Apply the stash patch
    Log "  Applying stash.patch..." "Gray"
    if (-not $DryRun) {
        $applyResult = wsl -d $Distro -- bash -c "cd '$WslFullPath' && git apply --reject --whitespace=fix '$wslBackupPath/stash.patch' 2>&1" 2>$null

        if ($LASTEXITCODE -ne 0) {
            Log "  ⚠ Some hunks may have failed, checking for .rej files..." "Yellow"
            $rejFiles = wsl -d $Distro -- bash -c "find '$WslFullPath' -name '*.rej' 2>/dev/null" 2>$null
            if ($rejFiles) {
                Log "  Reject files found:" "Yellow"
                $rejFiles -split "`n" | ForEach-Object { Log "    $_" "Gray" }
            }
        }
    }

    # Show resulting status
    Log "  WSL repo status after apply:" "Gray"
    Run-WSL "cd '$WslFullPath' && git status --short"

    Log "Phase 3 complete!" "Green"
}

# ═══════════════════════════════════════════════════════════════════════════
# Phase 4: Validation
# ═══════════════════════════════════════════════════════════════════════════

function Test-Migration {
    param([string]$WslFullPath)

    Log "Phase 4: Validating migration..." "Yellow"

    # Check repo is valid
    Run-WSL "cd '$WslFullPath' && git status > /dev/null"
    Log "  ✓ Git repo valid" "Green"

    # Check ops/dev exists
    $opsExists = wsl -d $Distro -- bash -c "test -d '$WslFullPath/ops/dev' && echo 'yes' || echo 'no'" 2>$null
    if ($opsExists -eq "yes") {
        Log "  ✓ ops/dev directory exists" "Green"
    } else {
        Log "  ⚠ ops/dev directory not found" "Yellow"
    }

    # Check docker-compose.yml
    $composeExists = wsl -d $Distro -- bash -c "test -f '$WslFullPath/docker-compose.yml' && echo 'yes' || echo 'no'" 2>$null
    if ($composeExists -eq "yes") {
        Log "  ✓ docker-compose.yml exists" "Green"
    }

    Log "Phase 4 complete!" "Green"
}

# ═══════════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════════

Show-Banner

Write-Host "  Configuration:" -ForegroundColor Yellow
Write-Host "    Windows repo:  $WindowsRepoPath" -ForegroundColor Gray
Write-Host "    WSL repo:      $WslRepoPath" -ForegroundColor Gray
Write-Host "    Distro:        $Distro" -ForegroundColor Gray
Write-Host "    Backup dir:    $BackupDir" -ForegroundColor Gray
Write-Host ""

if (-not $DryRun -and -not $Force) {
    $confirm = Read-Host "  Proceed with migration? (y/N)"
    if ($confirm -ne "y") {
        Write-Host "  Aborted." -ForegroundColor Yellow
        exit 0
    }
}

try {
    Test-Prerequisites
    $changedFilesResult = Save-WindowsChanges
    # Extract just the integer from the result (PowerShell returns all output)
    $changedFiles = if ($changedFilesResult -is [array]) { $changedFilesResult[-1] } else { $changedFilesResult }
    $changedFiles = [int]$changedFiles

    $wslFullPathResult = Initialize-WslRepo
    $wslFullPath = if ($wslFullPathResult -is [array]) { $wslFullPathResult[-1] } else { $wslFullPathResult }

    Apply-ChangesToWsl -WslFullPath $wslFullPath -ChangedFiles $changedFiles
    Test-Migration -WslFullPath $wslFullPath

    Write-Host ""
    Write-Host "  ╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "  ║     ✅ Migration Complete!                                ║" -ForegroundColor Green
    Write-Host "  ╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Next steps:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  1. Open in VS Code:" -ForegroundColor White
    Write-Host "     code-insiders --remote wsl+$Distro $WslRepoPath" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  2. Test the tf CLI:" -ForegroundColor White
    Write-Host "     cd $WslRepoPath && ./ops/dev/tf.sh doctor" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  3. After validation, rename old Windows repo:" -ForegroundColor White
    Write-Host "     Rename-Item '$WindowsRepoPath' 'terrafusion_os_1.0_windows_backup'" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Backup location: $BackupDir" -ForegroundColor Gray
    Write-Host ""

} catch {
    Log "Migration failed: $_" "Red"
    Write-Host ""
    Write-Host "  Backup files preserved at: $BackupDir" -ForegroundColor Yellow
    Write-Host "  Your Windows repo is unchanged." -ForegroundColor Yellow
    exit 1
}

#Requires -Version 7.0
<#
.SYNOPSIS
    Phase 3C Manual Extraction - Individual Repository Extraction with Error Handling
    
.DESCRIPTION
    Extracts remaining 6 repositories (repos 3-8) individually with:
    - Better error detection and handling
    - Timeout protection (5 minutes per repo)
    - Individual repo success/failure tracking
    - Ability to skip failed repos and continue
    
.NOTES
    Created: 2025-10-06
    Phase: 3C (Domain Repository Extraction)
    Prerequisites: Git, Python, git-filter-repo installed
#>

[CmdletBinding()]
param(
    [Parameter()]
    [switch]$AutoConfirm,
    
    [Parameter()]
    [int]$TimeoutMinutes = 5
)

$ErrorActionPreference = "Stop"

# ============================================================================
# CONFIGURATION
# ============================================================================

$WorkspaceRoot = "C:\Temp\phase-3c-extraction"
$SourceRepo = "C:\Users\bsval\terrafusion_os_1.0"
$LogFile = Join-Path $WorkspaceRoot "manual-extraction.log"
$TimeoutSeconds = $TimeoutMinutes * 60

# Repositories to extract (repos 3-8, skipping 1-2 already complete)
$Repositories = @(
    @{
        Number = 3
        Name = "terrafusion-ai-platform"
        Paths = @(
            "modules/ai-systems/",
            "modules/ai-command-brain/",
            "modules/ai-swarm/",
            "modules/autonomous-research-engine/"
        )
        Description = "AI/ML Platform - AI systems, command brain, swarm intelligence, autonomous research"
        EstimatedSize = "2.6MB"
    },
    @{
        Number = 4
        Name = "terrafusion-infrastructure-platform"
        Paths = @(
            "modules/infrastructure/",
            "modules/terra-flow/",
            "modules/terra-fusion-sync/"
        )
        Description = "Infrastructure Platform - Core infrastructure, workflow engine, synchronization"
        EstimatedSize = "23MB"
    },
    @{
        Number = 5
        Name = "terrafusion-specialized-modules"
        Paths = @(
            "modules/specialized/"
        )
        Description = "Specialized Modules - Domain-specific tools and utilities"
        EstimatedSize = "26MB"
    },
    @{
        Number = 6
        Name = "terrafusion-developer-tools"
        Paths = @(
            "modules/TerraFusionIDE/",
            "modules/property-workbench/",
            "modules/test-helpers/"
        )
        Description = "Developer Tools - IDE, property workbench, testing utilities"
        EstimatedSize = "0.18MB"
    },
    @{
        Number = 7
        Name = "terrafusion-docs"
        Paths = @(
            "docs/"
        )
        Description = "Documentation - All project documentation and guides"
        EstimatedSize = "TBD"
    },
    @{
        Number = 8
        Name = "terrafusion-ui-components"
        Paths = @(
            "modules/terra-fusion-dashboard/",
            "modules/golden-ratio-engine/",
            "modules/TerraFusion-PublicRecords/",
            "packages/tf-visual/",
            "packages/tf-audio/"
        )
        Description = "UI Components - Dashboard, design system, visual/audio components"
        EstimatedSize = "0.01MB"
    }
)

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Add-Content -Path $LogFile -Value $logMessage
    
    switch ($Level) {
        "ERROR" { Write-Host $Message -ForegroundColor Red }
        "SUCCESS" { Write-Host $Message -ForegroundColor Green }
        "WARNING" { Write-Host $Message -ForegroundColor Yellow }
        default { Write-Host $Message -ForegroundColor Gray }
    }
}

function Test-Prerequisites {
    Write-Host "`n🔍 Checking prerequisites..." -ForegroundColor Cyan
    
    # Check Git
    try {
        $gitVersion = git --version
        Write-Log "✅ Git: $gitVersion" "SUCCESS"
    } catch {
        Write-Log "❌ Git not found. Please install Git." "ERROR"
        return $false
    }
    
    # Check Python
    try {
        $pythonVersion = python --version 2>&1
        Write-Log "✅ Python: $pythonVersion" "SUCCESS"
    } catch {
        Write-Log "❌ Python not found. Please install Python 3.x." "ERROR"
        return $false
    }
    
    # Check git-filter-repo
    try {
        $filterRepoCheck = python -m git_filter_repo --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ git-filter-repo: installed and working" "SUCCESS"
        } else {
            throw "git-filter-repo not working"
        }
    } catch {
        Write-Log "❌ git-filter-repo not found. Install with: pip install git-filter-repo" "ERROR"
        return $false
    }
    
    # Check disk space
    $drive = (Get-Item $WorkspaceRoot).PSDrive
    $freeSpaceGB = [math]::Round($drive.Free / 1GB, 2)
    if ($freeSpaceGB -lt 5) {
        Write-Log "⚠️  Low disk space: ${freeSpaceGB}GB free (recommend 5GB+)" "WARNING"
    } else {
        Write-Log "✅ Disk space: ${freeSpaceGB}GB free" "SUCCESS"
    }
    
    # Check workspace exists
    if (-not (Test-Path $WorkspaceRoot)) {
        Write-Log "❌ Workspace not found: $WorkspaceRoot" "ERROR"
        return $false
    }
    Write-Log "✅ Workspace exists: $WorkspaceRoot" "SUCCESS"
    
    return $true
}

function Invoke-FilterRepoWithTimeout {
    param(
        [string]$RepoPath,
        [string[]]$PathsToKeep,
        [int]$TimeoutSeconds
    )
    
    # Create paths file
    $pathsFile = Join-Path $RepoPath "paths-to-keep.txt"
    $PathsToKeep | Out-File -FilePath $pathsFile -Encoding UTF8
    
    Write-Log "ℹ️  Filtering repository with timeout: $TimeoutSeconds seconds"
    
    # Create a job to run git-filter-repo
    $job = Start-Job -ScriptBlock {
        param($repoPath, $pathsFile)
        Set-Location $repoPath
        python -m git_filter_repo --force --paths-from-file $pathsFile 2>&1
    } -ArgumentList $RepoPath, $pathsFile
    
    # Wait for job with timeout
    $completed = Wait-Job -Job $job -Timeout $TimeoutSeconds
    
    if ($null -eq $completed) {
        # Timeout occurred
        Write-Log "⚠️  Timeout after $TimeoutSeconds seconds - stopping job" "WARNING"
        Stop-Job -Job $job
        Remove-Job -Job $job -Force
        Remove-Item $pathsFile -ErrorAction SilentlyContinue
        return $false
    }
    
    # Get job results
    $output = Receive-Job -Job $job
    Remove-Job -Job $job
    Remove-Item $pathsFile -ErrorAction SilentlyContinue
    
    # Check for errors
    if ($output -match "error|fatal|failed") {
        Write-Log "❌ git-filter-repo reported errors: $output" "ERROR"
        return $false
    }
    
    Write-Log "✅ Repository filtered successfully"
    return $true
}

function Get-RepoSize {
    param([string]$Path)
    
    if (-not (Test-Path $Path)) {
        return 0
    }
    
    $size = (Get-ChildItem $Path -Recurse -File -ErrorAction SilentlyContinue | 
             Measure-Object -Property Length -Sum).Sum
    return [math]::Round($size / 1MB, 2)
}

function New-RepositoryReadme {
    param(
        [string]$RepoName,
        [string]$Description,
        [string[]]$Paths
    )
    
    $readmeContent = @"
# $RepoName

$Description

## Overview

This repository was extracted from the TerraFusion OS monorepo as part of the polyrepo transformation (Phase 3C).

## Contents

This repository contains the following modules/packages:

$($Paths | ForEach-Object { "- ``$_``" } | Out-String)

## Original Monorepo

This code was extracted from: https://github.com/bsvalues/terrafusion_os_1.0

## Related Repositories

Part of the TerraFusion ecosystem:
- [terrafusion-shared](https://github.com/bsvalues/terrafusion-shared) - Shared libraries and utilities
- [terrafusion-os-core](https://github.com/bsvalues/terrafusion-os-core) - Core OS functionality
- [terrafusion-marketplace](https://github.com/bsvalues/terrafusion-marketplace) - Marketplace platform
- [terrafusion-infrastructure](https://github.com/bsvalues/terrafusion-infrastructure) - Infrastructure and DevOps

## Architecture

For full architecture documentation, see the [main monorepo docs](https://github.com/bsvalues/terrafusion_os_1.0/tree/main/docs).

## License

See LICENSE file in this repository.

---

**Extracted:** $(Get-Date -Format "yyyy-MM-dd")  
**Phase:** 3C (Domain Repository Extraction)  
**Method:** git-filter-repo (preserves full Git history)
"@
    
    return $readmeContent
}

function Extract-SingleRepository {
    param([hashtable]$Repo)
    
    $repoName = $Repo.Name
    $repoNumber = $Repo.Number
    $paths = $Repo.Paths
    $description = $Repo.Description
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Repository $repoNumber/8: $repoName" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Log "Starting extraction: $repoName"
    
    $startTime = Get-Date
    $repoPath = Join-Path $WorkspaceRoot $repoName
    
    # Check if repo already exists and has content
    if (Test-Path $repoPath) {
        $existingSize = Get-RepoSize -Path $repoPath
        $hasReadme = Test-Path (Join-Path $repoPath "README.md")
        
        if ($existingSize -gt 0 -and $hasReadme) {
            Write-Log "⚠️  Repository already exists with content (${existingSize}MB)" "WARNING"
            $response = Read-Host "Overwrite? (y/N)"
            if ($response -ne 'y' -and $response -ne 'Y') {
                Write-Log "⏭️  Skipped by user" "WARNING"
                return @{ Success = $false; Skipped = $true; Reason = "User skipped" }
            }
        }
        
        Write-Log "🗑️  Removing existing directory..."
        Remove-Item -Recurse -Force $repoPath -ErrorAction Stop
    }
    
    try {
        # Step 1: Clone (bare, no checkout)
        Write-Host "🔄 Cloning repository (bare, no checkout)..." -ForegroundColor Yellow
        Write-Log "Cloning from $SourceRepo to $repoPath"
        
        git clone --no-checkout "$SourceRepo" "$repoPath" 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Git clone failed with exit code $LASTEXITCODE"
        }
        Write-Log "✅ Repository cloned (bare)" "SUCCESS"
        
        # Step 2: Filter with timeout
        Write-Host "🔄 Filtering repository (timeout: ${TimeoutMinutes}m)..." -ForegroundColor Yellow
        Write-Log "Filtering paths: $($paths -join ', ')"
        
        $filterSuccess = Invoke-FilterRepoWithTimeout -RepoPath $repoPath -PathsToKeep $paths -TimeoutSeconds $TimeoutSeconds
        
        if (-not $filterSuccess) {
            throw "Repository filtering failed or timed out"
        }
        
        # Step 3: Checkout files
        Write-Host "🔄 Checking out files..." -ForegroundColor Yellow
        Set-Location $repoPath
        git checkout main 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Git checkout failed with exit code $LASTEXITCODE"
        }
        Write-Log "✅ Files checked out" "SUCCESS"
        
        # Step 4: Create README
        Write-Host "🔄 Creating README.md..." -ForegroundColor Yellow
        $readme = New-RepositoryReadme -RepoName $repoName -Description $description -Paths $paths
        $readmePath = Join-Path $repoPath "README.md"
        $readme | Out-File -FilePath $readmePath -Encoding UTF8
        
        git add README.md 2>&1 | Out-Null
        git commit -m "Add repository README (Phase 3C extraction)" 2>&1 | Out-Null
        Write-Log "✅ README.md created and committed" "SUCCESS"
        
        # Success!
        $endTime = Get-Date
        $duration = $endTime - $startTime
        $size = Get-RepoSize -Path $repoPath
        
        Write-Host "✅ $repoName complete: ${size}MB in $($duration.ToString('mm\:ss'))" -ForegroundColor Green
        Write-Log "Repository extraction complete: ${size}MB in $($duration.ToString('mm\:ss'))" "SUCCESS"
        
        return @{
            Success = $true
            Size = $size
            Duration = $duration
            Path = $repoPath
        }
        
    } catch {
        $errorMsg = $_.Exception.Message
        Write-Host "❌ Failed: $errorMsg" -ForegroundColor Red
        Write-Log "Repository extraction failed: $errorMsg" "ERROR"
        
        return @{
            Success = $false
            Skipped = $false
            Reason = $errorMsg
            Path = $repoPath
        }
        
    } finally {
        Set-Location $WorkspaceRoot
    }
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

Write-Host @"

╔════════════════════════════════════════════════════════════════╗
║     Phase 3C Manual Extraction - Individual Repository        ║
║                  Repos 3-8 (6 remaining)                       ║
╚════════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# Initialize log
"========================================" | Out-File $LogFile
"Phase 3C Manual Extraction Log" | Out-File $LogFile -Append
"Started: $(Get-Date)" | Out-File $LogFile -Append
"========================================`n" | Out-File $LogFile -Append

# Check prerequisites
if (-not (Test-Prerequisites)) {
    Write-Host "`n❌ Prerequisites check failed. Please fix the issues above.`n" -ForegroundColor Red
    exit 1
}

# Confirm with user
if (-not $AutoConfirm) {
    Write-Host "`n📋 This will extract 6 repositories:" -ForegroundColor Yellow
    foreach ($repo in $Repositories) {
        Write-Host "   $($repo.Number). $($repo.Name) (estimated: $($repo.EstimatedSize))" -ForegroundColor Gray
    }
    Write-Host "`n⚠️  Timeout per repo: ${TimeoutMinutes} minutes" -ForegroundColor Yellow
    Write-Host "   (Prevents hung processes like repo 3 earlier)`n" -ForegroundColor Gray
    
    $response = Read-Host "Continue? (Y/n)"
    if ($response -eq 'n' -or $response -eq 'N') {
        Write-Host "`n⏹️  Extraction cancelled by user.`n" -ForegroundColor Yellow
        exit 0
    }
}

# Track results
$results = @()
$successCount = 0
$failCount = 0
$skipCount = 0

# Extract each repository
foreach ($repo in $Repositories) {
    $result = Extract-SingleRepository -Repo $repo
    $results += @{
        Repo = $repo.Name
        Number = $repo.Number
        Result = $result
    }
    
    if ($result.Success) {
        $successCount++
    } elseif ($result.Skipped) {
        $skipCount++
    } else {
        $failCount++
        
        # Ask if user wants to continue after failure
        if (-not $AutoConfirm) {
            Write-Host "`n⚠️  Extraction failed for $($repo.Name)" -ForegroundColor Yellow
            $continue = Read-Host "Continue with remaining repositories? (Y/n)"
            if ($continue -eq 'n' -or $continue -eq 'N') {
                Write-Host "`n⏹️  Extraction stopped by user.`n" -ForegroundColor Yellow
                break
            }
        }
    }
}

# Final summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "EXTRACTION SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n✅ Successful: $successCount" -ForegroundColor Green
Write-Host "❌ Failed: $failCount" -ForegroundColor Red
Write-Host "⏭️  Skipped: $skipCount" -ForegroundColor Yellow

Write-Host "`n📊 Individual Results:" -ForegroundColor Cyan
foreach ($result in $results) {
    $icon = if ($result.Result.Success) { "✅" } elseif ($result.Result.Skipped) { "⏭️" } else { "❌" }
    $status = if ($result.Result.Success) { 
        "$($result.Result.Size)MB in $($result.Result.Duration.ToString('mm\:ss'))" 
    } elseif ($result.Result.Skipped) {
        "Skipped - $($result.Result.Reason)"
    } else {
        "Failed - $($result.Result.Reason)"
    }
    Write-Host "   $icon $($result.Number). $($result.Repo): $status"
}

Write-Host "`n📁 Extraction workspace: $WorkspaceRoot" -ForegroundColor Cyan
Write-Host "📝 Log file: $LogFile" -ForegroundColor Cyan

# Add to previous results (repos 1-2 already complete)
$totalComplete = $successCount + 2  # Add the 2 already extracted
$totalRepos = 8

Write-Host "`n🎯 Overall Progress: $totalComplete/$totalRepos repositories complete" -ForegroundColor Cyan

if ($failCount -eq 0 -and $skipCount -eq 0 -and $successCount -eq 6) {
    Write-Host "`n🎉 All 6 remaining repositories extracted successfully!" -ForegroundColor Green
    Write-Host "   Combined with repos 1-2: 8/8 complete (100%)" -ForegroundColor Green
    Write-Host "`n✨ Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Verify all 8 repositories" -ForegroundColor Gray
    Write-Host "   2. Create GitHub repositories" -ForegroundColor Gray
    Write-Host "   3. Push to GitHub" -ForegroundColor Gray
} elseif ($failCount -gt 0) {
    Write-Host "`n⚠️  Some repositories failed. Review errors above." -ForegroundColor Yellow
    Write-Host "   You can retry failed repos individually later.`n" -ForegroundColor Gray
} else {
    Write-Host "`n✅ Extraction complete with $successCount successful extractions.`n" -ForegroundColor Green
}

Write-Log "Extraction complete: $successCount success, $failCount failed, $skipCount skipped" "INFO"
Write-Host ""

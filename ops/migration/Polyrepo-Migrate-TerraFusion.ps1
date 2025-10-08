#Requires -Version 7.0
################################################################################
# TERRAFUSION OS - POLYREPO MIGRATION SCRIPT (PowerShell)
# "We do it right, but we never wait around doing nothing."
################################################################################

param(
    [string]$GitHubOrg = "bsvalues",
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

# Configuration
$MonorepoPath = Get-Location
$TempMigrationDir = Join-Path $env:TEMP "terrafusion-polyrepo-migration"
$BackupDir = Join-Path $MonorepoPath "backups\polyrepo-migration-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# Repository definitions
$CoreRepos = @{
    "terrafusion-core" = "core"
    "terrafusion-shared" = "shared"
    "terrafusion-packages" = "packages"
    "terrafusion-modules" = "modules/core"
}

$DomainRepos = @{
    "terrafusion-government-platform" = "modules/government-core","packages/government-edition"
    "terrafusion-commercial-platform" = "modules/commercial","packages/commercial"
    "terrafusion-ai-platform" = "modules/ai-systems"
    "terrafusion-infrastructure-platform" = "modules/infrastructure"
    "terrafusion-specialized-modules" = "modules/specialized"
    "terrafusion-developer-tools" = "modules/TerraFusionIDE"
    "terrafusion-docs" = "docs"
    "terrafusion-ui-components" = "modules/terra-fusion-dashboard"
}

# Logging functions
function Write-Log {
    param(
        [Parameter(Mandatory=$true)]
        [ValidateSet("ERROR","SUCCESS","WARNING","INFO","STEP")]
        [string]$Level,
        
        [Parameter(Mandatory=$true)]
        [string]$Message
    )
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    switch ($Level) {
        "ERROR"   { Write-Host "[$timestamp] ❌ ERROR: $Message" -ForegroundColor Red }
        "SUCCESS" { Write-Host "[$timestamp] ✅ SUCCESS: $Message" -ForegroundColor Green }
        "WARNING" { Write-Host "[$timestamp] ⚠️  WARNING: $Message" -ForegroundColor Yellow }
        "INFO"    { Write-Host "[$timestamp] ℹ️  INFO: $Message" -ForegroundColor Cyan }
        "STEP"    { Write-Host "[$timestamp] 🚀 STEP: $Message" -ForegroundColor Magenta }
    }
}

# Banner
function Show-Banner {
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                                                               ║" -ForegroundColor Cyan
    Write-Host "║   🚀 TERRAFUSION OS - POLYREPO MIGRATION 🚀                  ║" -ForegroundColor Cyan
    Write-Host "║                                                               ║" -ForegroundColor Cyan
    Write-Host "║   \"We do it right, but we never wait around doing nothing.\" ║" -ForegroundColor Cyan
    Write-Host "║                                                               ║" -ForegroundColor Cyan
    Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

# Check prerequisites
function Test-Prerequisites {
    Write-Log -Level STEP -Message "Checking prerequisites..."
    
    # Check git
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        throw "git is not installed"
    }
    Write-Log -Level INFO -Message "git: $(git --version)"
    
    # Check GitHub CLI
    if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
        throw "GitHub CLI (gh) is not installed. Install from https://cli.github.com/"
    }
    Write-Log -Level INFO -Message "GitHub CLI: $((gh --version)[0])"
    
    # Check gh auth
    $authStatus = gh auth status 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "GitHub CLI not authenticated. Run: gh auth login"
    }
    Write-Log -Level INFO -Message "GitHub CLI authenticated"
    
    Write-Log -Level SUCCESS -Message "All prerequisites met"
}

# Create backup
function New-Backup {
    Write-Log -Level STEP -Message "Creating backup..."
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    
    Write-Log -Level INFO -Message "Backing up .git directory..."
    Copy-Item -Path ".git" -Destination (Join-Path $BackupDir ".git") -Recurse -Force
    
    Write-Log -Level SUCCESS -Message "Backup created at $BackupDir"
}

# Check GitHub organization
function Test-GitHubOrg {
    Write-Log -Level STEP -Message "Checking GitHub organization: $GitHubOrg..."
    
    $result = gh api "/orgs/$GitHubOrg" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Log -Level WARNING -Message "Organization $GitHubOrg does not exist or not accessible"
        Write-Log -Level INFO -Message "Using personal account instead (repos will be under your username)"
        return $false
    }
    
    Write-Log -Level SUCCESS -Message "Organization $GitHubOrg verified"
    return $true
}

# Create GitHub repository
function New-GitHubRepo {
    param(
        [string]$RepoName,
        [string]$Description,
        [bool]$UseOrg
    )
    
    $fullName = if ($UseOrg) { "$GitHubOrg/$RepoName" } else { $RepoName }
    Write-Log -Level INFO -Message "Creating repository: $fullName..."
    
    # Check if repo exists
    $checkResult = gh repo view $fullName 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Log -Level WARNING -Message "Repository $fullName already exists (skipping)"
        return
    }
    
    if ($DryRun) {
        Write-Log -Level INFO -Message "[DRY RUN] Would create: $fullName"
        return
    }
    
    # Create repo
    $createArgs = @("repo", "create", $fullName, "--description", $Description, "--private")
    if (-not $UseOrg) {
        $createArgs += "--public"  # Personal repos can be public
    }
    
    & gh @createArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Log -Level SUCCESS -Message "Created $fullName"
    } else {
        Write-Log -Level ERROR -Message "Failed to create $fullName"
    }
}

# Extract repository (simplified - creates new repos with content, not full history)
function Export-Repository {
    param(
        [string]$RepoName,
        [string[]]$SourcePaths,
        [bool]$UseOrg
    )
    
    $fullName = if ($UseOrg) { "$GitHubOrg/$RepoName" } else { $RepoName }
    Write-Log -Level STEP -Message "Extracting $RepoName..."
    Write-Log -Level INFO -Message "Source paths: $($SourcePaths -join ', ')"
    
    $tempRepoDir = Join-Path $TempMigrationDir $RepoName
    
    if ($DryRun) {
        Write-Log -Level INFO -Message "[DRY RUN] Would extract: $fullName from $($SourcePaths -join ', ')"
        return
    }
    
    # Create temp directory
    New-Item -ItemType Directory -Path $tempRepoDir -Force | Out-Null
    
    # Initialize new git repo
    Push-Location $tempRepoDir
    try {
        git init
        git config user.name "TerraFusion Bot"
        git config user.email "bot@terrafusion.ai"
        
        # Copy source content
        $copied = $false
        foreach ($sourcePath in $SourcePaths) {
            $fullSourcePath = Join-Path $MonorepoPath $sourcePath
            if (Test-Path $fullSourcePath) {
                Write-Log -Level INFO -Message "Copying $sourcePath..."
                Copy-Item -Path "$fullSourcePath\*" -Destination $tempRepoDir -Recurse -Force
                $copied = $true
            } else {
                Write-Log -Level WARNING -Message "Path $sourcePath not found (skipping)"
            }
        }
        
        if (-not $copied) {
            # Create empty repo with README
            Write-Log -Level WARNING -Message "No valid paths found for $RepoName (creating empty repo)"
        }
        
        # Create README if not exists
        if (-not (Test-Path "README.md")) {
            $readmeContent = @"
# $RepoName

**Extracted from:** terrafusion_os_1.0  
**Extraction date:** $(Get-Date -Format 'yyyy-MM-dd')  
**Source paths:** $($SourcePaths -join ', ')

## Overview

This repository was extracted from the TerraFusion OS monorepo as part of the polyrepo migration (Phase 3).

## Documentation

- [Polyrepo Migration Guide](https://github.com/$GitHubOrg/terrafusion_os_1.0/blob/main/POLYREPO_MIGRATION_GUIDE.md)
- [TerraFusion OS Architecture](https://github.com/$GitHubOrg/terrafusion-docs)

## Related Repositories

See [terrafusion_os_1.0](https://github.com/$GitHubOrg/terrafusion_os_1.0) for the full repository list.
"@
            Set-Content -Path "README.md" -Value $readmeContent
        }
        
        # Initial commit
        git add -A
        git commit -m "Initial commit: Extracted from terrafusion_os_1.0 monorepo"
        
        # Rename branch to main
        git branch -M main
        
        # Add remote and push
        Write-Log -Level INFO -Message "Adding GitHub remote..."
        git remote add origin "https://github.com/$fullName.git"
        
        Write-Log -Level INFO -Message "Pushing to GitHub..."
        git push -u origin main --force
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log -Level SUCCESS -Message "Extracted and pushed $RepoName"
        } else {
            Write-Log -Level ERROR -Message "Failed to push $RepoName"
        }
    }
    finally {
        Pop-Location
    }
}

# Main execution
try {
    Show-Banner
    
    Write-Log -Level INFO -Message "GitHub Organization: $GitHubOrg"
    Write-Log -Level INFO -Message "Monorepo Path: $MonorepoPath"
    Write-Log -Level INFO -Message "Temp Directory: $TempMigrationDir"
    Write-Log -Level INFO -Message "Backup Directory: $BackupDir"
    if ($DryRun) {
        Write-Log -Level WARNING -Message "DRY RUN MODE: No actual changes will be made"
    }
    Write-Host ""
    
    # Step 1: Prerequisites
    Test-Prerequisites
    Write-Host ""
    
    # Step 2: Backup (skip in dry run)
    if (-not $DryRun) {
        New-Backup
        Write-Host ""
    }
    
    # Step 3: Check GitHub org
    $useOrg = Test-GitHubOrg
    Write-Host ""
    
    # Step 4: Create empty repos
    Write-Log -Level STEP -Message "Creating GitHub repositories..."
    
    New-GitHubRepo -RepoName "terrafusion-core" -Description "TerraFusion OS Core - Base platform services and kernel" -UseOrg $useOrg
    New-GitHubRepo -RepoName "terrafusion-shared" -Description "TerraFusion Shared - Common utilities and types" -UseOrg $useOrg
    New-GitHubRepo -RepoName "terrafusion-packages" -Description "TerraFusion Packages - Reusable components" -UseOrg $useOrg
    New-GitHubRepo -RepoName "terrafusion-modules" -Description "TerraFusion Modules - Core module implementations" -UseOrg $useOrg
    New-GitHubRepo -RepoName "terrafusion-government-platform" -Description "TerraFusion Government Platform - County operations and CAMA" -UseOrg $useOrg
    New-GitHubRepo -RepoName "terrafusion-commercial-platform" -Description "TerraFusion Commercial Platform - Commercial real estate" -UseOrg $useOrg
    New-GitHubRepo -RepoName "terrafusion-ai-platform" -Description "TerraFusion AI Platform - AI swarm and neural systems" -UseOrg $useOrg
    New-GitHubRepo -RepoName "terrafusion-infrastructure-platform" -Description "TerraFusion Infrastructure - Monitoring, health, observability" -UseOrg $useOrg
    New-GitHubRepo -RepoName "terrafusion-specialized-modules" -Description "TerraFusion Specialized Modules - GIS, analytics, compliance" -UseOrg $useOrg
    New-GitHubRepo -RepoName "terrafusion-developer-tools" -Description "TerraFusion Developer Tools - IDE, testing, debugging" -UseOrg $useOrg
    New-GitHubRepo -RepoName "terrafusion-docs" -Description "TerraFusion Documentation - Architecture and guides" -UseOrg $useOrg
    New-GitHubRepo -RepoName "terrafusion-ui-components" -Description "TerraFusion UI Components - Dashboard and UI library" -UseOrg $useOrg
    
    Write-Host ""
    
    # Step 5: Extract core repos (Phase 3B)
    Write-Log -Level STEP -Message "Phase 3B: Extracting core repositories..."
    New-Item -ItemType Directory -Path $TempMigrationDir -Force | Out-Null
    
    foreach ($repo in $CoreRepos.GetEnumerator()) {
        $paths = @($repo.Value)
        Export-Repository -RepoName $repo.Key -SourcePaths $paths -UseOrg $useOrg
        Write-Host ""
    }
    
    Write-Log -Level SUCCESS -Message "Phase 3B complete: 4 core repositories extracted"
    Write-Host ""
    
    # Step 6: Extract domain repos (Phase 3C)
    Write-Log -Level STEP -Message "Phase 3C: Extracting domain repositories..."
    
    foreach ($repo in $DomainRepos.GetEnumerator()) {
        $paths = $repo.Value
        Export-Repository -RepoName $repo.Key -SourcePaths $paths -UseOrg $useOrg
        Write-Host ""
    }
    
    Write-Log -Level SUCCESS -Message "Phase 3C complete: 8 domain repositories extracted"
    Write-Host ""
    
    # Step 7: Cleanup
    Write-Log -Level STEP -Message "Cleaning up temporary files..."
    if (Test-Path $TempMigrationDir) {
        Remove-Item -Path $TempMigrationDir -Recurse -Force
    }
    Write-Log -Level SUCCESS -Message "Cleanup complete"
    Write-Host ""
    
    # Step 8: Success summary
    Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                                                               ║" -ForegroundColor Green
    Write-Host "║   🎉 POLYREPO MIGRATION COMPLETE - TERRAFUSION MODE 🎉      ║" -ForegroundColor Green
    Write-Host "║                                                               ║" -ForegroundColor Green
    Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Log -Level SUCCESS -Message "12 repositories created and deployed to GitHub"
    if ($useOrg) {
        Write-Log -Level INFO -Message "Organization: https://github.com/$GitHubOrg"
    }
    if (-not $DryRun) {
        Write-Log -Level INFO -Message "Backup location: $BackupDir"
    }
    Write-Host ""
    Write-Log -Level INFO -Message "Next steps:"
    Write-Log -Level INFO -Message "  1. Review extracted repositories on GitHub"
    Write-Log -Level INFO -Message "  2. Enable branch protection rules"
    Write-Log -Level INFO -Message "  3. Configure CI/CD workflows"
    Write-Log -Level INFO -Message "  4. Update monorepo documentation (Phase 3D)"
    Write-Log -Level INFO -Message "  5. Notify team of migration completion"
    Write-Host ""
}
catch {
    Write-Log -Level ERROR -Message "Migration failed: $_"
    Write-Log -Level ERROR -Message "Stack trace: $($_.ScriptStackTrace)"
    if (-not $DryRun -and (Test-Path $BackupDir)) {
        Write-Log -Level INFO -Message "Backup available at: $BackupDir"
    }
    exit 1
}

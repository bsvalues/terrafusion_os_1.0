#Requires -Version 7.0
<#
.SYNOPSIS
    Phase 3C - Push Extracted Repositories to GitHub
    
.DESCRIPTION
    Creates 8 GitHub repositories and pushes all Phase 3C extracted code.
    Handles each repository carefully with verification and error checking.
    
    Features:
    - Checks GitHub CLI authentication
    - Creates repositories with proper descriptions and topics
    - Verifies local repository state before pushing
    - Handles each repo individually with error recovery
    - Provides detailed progress reporting
    
.PARAMETER DryRun
    If specified, shows what would be done without actually creating repos or pushing

.NOTES
    Created: 2025-10-06
    Phase: 3C (Domain Repository Extraction)
    Prerequisites: GitHub CLI (gh) installed and authenticated
#>

[CmdletBinding()]
param(
    [Parameter()]
    [switch]$DryRun,
    
    [Parameter()]
    [switch]$AutoConfirm
)

$ErrorActionPreference = "Stop"

# ============================================================================
# CONFIGURATION
# ============================================================================

$WorkspaceRoot = "C:\Temp\phase-3c-extraction"
$LogFile = Join-Path $WorkspaceRoot "github-push.log"
$GitHubOrg = "bsvalues"

# Repository definitions with metadata
$Repositories = @(
    @{
        Number = 1
        Name = "terrafusion-government-platform"
        Description = "Government-focused property valuation and management platform for county assessors and public agencies"
        Topics = @("government", "property-valuation", "real-estate", "tax-assessment", "county-assessor", "public-records")
        Homepage = ""
        Private = $false
    },
    @{
        Number = 2
        Name = "terrafusion-commercial-platform"
        Description = "Commercial real estate valuation and analytics platform for investment analysis and portfolio management"
        Topics = @("commercial-real-estate", "property-valuation", "investment-analysis", "portfolio-management", "market-analytics")
        Homepage = ""
        Private = $false
    },
    @{
        Number = 3
        Name = "terrafusion-ai-platform"
        Description = "AI/ML systems for intelligent property analysis - command brain, swarm intelligence, autonomous research"
        Topics = @("artificial-intelligence", "machine-learning", "property-analysis", "ai-swarm", "autonomous-agents")
        Homepage = ""
        Private = $false
    },
    @{
        Number = 4
        Name = "terrafusion-infrastructure-platform"
        Description = "Core infrastructure services, workflow automation engine, and data synchronization system"
        Topics = @("infrastructure", "workflow-automation", "data-sync", "microservices", "orchestration")
        Homepage = ""
        Private = $false
    },
    @{
        Number = 5
        Name = "terrafusion-specialized-modules"
        Description = "Domain-specific tools and utilities for specialized property valuation workflows"
        Topics = @("specialized-tools", "domain-utilities", "property-valuation", "real-estate-tools")
        Homepage = ""
        Private = $false
    },
    @{
        Number = 6
        Name = "terrafusion-developer-tools"
        Description = "Development tools and testing utilities - IDE, property workbench, test helpers"
        Topics = @("developer-tools", "ide", "testing", "development-utilities", "property-workbench")
        Homepage = ""
        Private = $false
    },
    @{
        Number = 7
        Name = "terrafusion-docs"
        Description = "Comprehensive documentation and guides for the TerraFusion ecosystem"
        Topics = @("documentation", "guides", "api-docs", "architecture", "developer-docs")
        Homepage = ""
        Private = $false
    },
    @{
        Number = 8
        Name = "terrafusion-ui-components"
        Description = "UI components and design system - dashboard, golden ratio engine, visual/audio components"
        Topics = @("ui-components", "design-system", "react", "dashboard", "frontend", "golden-ratio")
        Homepage = ""
        Private = $false
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
        "INFO" { Write-Host $Message -ForegroundColor Cyan }
        default { Write-Host $Message -ForegroundColor Gray }
    }
}

function Test-Prerequisites {
    Write-Host "`n🔍 Checking prerequisites..." -ForegroundColor Cyan
    
    # Check GitHub CLI
    try {
        $ghVersion = gh --version 2>&1 | Select-Object -First 1
        Write-Log "✅ GitHub CLI: $ghVersion" "SUCCESS"
    } catch {
        Write-Log "❌ GitHub CLI not found. Please install: https://cli.github.com/" "ERROR"
        return $false
    }
    
    # Check GitHub authentication
    try {
        $ghAuthStatus = gh auth status 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Log "❌ GitHub CLI not authenticated. Run: gh auth login" "ERROR"
            return $false
        }
        Write-Log "✅ GitHub CLI authenticated" "SUCCESS"
    } catch {
        Write-Log "❌ GitHub authentication check failed. Run: gh auth login" "ERROR"
        return $false
    }
    
    # Check Git
    try {
        $gitVersion = git --version
        Write-Log "✅ Git: $gitVersion" "SUCCESS"
    } catch {
        Write-Log "❌ Git not found. Please install Git." "ERROR"
        return $false
    }
    
    # Check workspace exists
    if (-not (Test-Path $WorkspaceRoot)) {
        Write-Log "❌ Workspace not found: $WorkspaceRoot" "ERROR"
        return $false
    }
    Write-Log "✅ Workspace exists: $WorkspaceRoot" "SUCCESS"
    
    # Check all 8 repositories exist locally
    $missingRepos = @()
    foreach ($repo in $Repositories) {
        $repoPath = Join-Path $WorkspaceRoot $repo.Name
        if (-not (Test-Path $repoPath)) {
            $missingRepos += $repo.Name
        }
    }
    
    if ($missingRepos.Count -gt 0) {
        Write-Log "❌ Missing local repositories: $($missingRepos -join ', ')" "ERROR"
        return $false
    }
    Write-Log "✅ All 8 local repositories found" "SUCCESS"
    
    return $true
}

function Test-GitHubRepoExists {
    param([string]$RepoName)
    
    $result = gh repo view "$GitHubOrg/$RepoName" 2>&1
    return $LASTEXITCODE -eq 0
}

function Get-LocalRepoInfo {
    param([string]$RepoPath)
    
    Push-Location $RepoPath
    try {
        $info = @{
            Commits = (git log --oneline 2>&1 | Measure-Object -Line).Lines
            Branch = (git branch --show-current 2>&1)
            RemoteUrl = (git remote get-url origin 2>&1)
            HasRemote = $?
            IsClean = $true
            Size = [math]::Round((Get-ChildItem -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
            Files = (Get-ChildItem -Recurse -File | Measure-Object).Count
        }
        
        $status = git status --porcelain 2>&1
        $info.IsClean = [string]::IsNullOrWhiteSpace($status)
        
        return $info
    } finally {
        Pop-Location
    }
}

function New-GitHubRepository {
    param(
        [hashtable]$Repo,
        [bool]$DryRun = $false
    )
    
    $repoName = $Repo.Name
    $repoFullName = "$GitHubOrg/$repoName"
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Repository $($Repo.Number)/8: $repoName" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Log "Processing: $repoName"
    
    $repoPath = Join-Path $WorkspaceRoot $repoName
    
    # Check if repo already exists on GitHub
    $existsOnGitHub = Test-GitHubRepoExists -RepoName $repoName
    
    if ($existsOnGitHub) {
        Write-Log "⚠️  Repository already exists on GitHub: $repoFullName" "WARNING"
        
        if (-not $DryRun -and -not $script:AutoConfirm) {
            $response = Read-Host "Delete and recreate? (y/N)"
            if ($response -ne 'y' -and $response -ne 'Y') {
                Write-Log "⏭️  Skipped - will attempt to push to existing repo" "WARNING"
                return @{ 
                    Success = $false
                    Skipped = $true
                    Reason = "Repository exists, user chose to skip"
                    ExistingRepo = $true
                }
            }
            
            # Delete existing repo
            Write-Host "🗑️  Deleting existing repository..." -ForegroundColor Yellow
            if ($DryRun) {
                Write-Log "[DRY RUN] Would delete: gh repo delete $repoFullName --yes" "INFO"
            } else {
                gh repo delete $repoFullName --yes 2>&1 | Out-Null
                if ($LASTEXITCODE -ne 0) {
                    Write-Log "❌ Failed to delete existing repository" "ERROR"
                    return @{ Success = $false; Reason = "Failed to delete existing repo" }
                }
                Start-Sleep -Seconds 2  # Wait for deletion to complete
                Write-Log "✅ Existing repository deleted" "SUCCESS"
            }
        }
    }
    
    # Get local repo info
    $localInfo = Get-LocalRepoInfo -RepoPath $repoPath
    Write-Host "📊 Local Repository Info:" -ForegroundColor Cyan
    Write-Host "   Commits: $($localInfo.Commits)" -ForegroundColor Gray
    Write-Host "   Branch: $($localInfo.Branch)" -ForegroundColor Gray
    Write-Host "   Size: $($localInfo.Size)MB" -ForegroundColor Gray
    Write-Host "   Files: $($localInfo.Files)" -ForegroundColor Gray
    Write-Host "   Clean: $(if ($localInfo.IsClean) { '✅' } else { '❌ (uncommitted changes)' })" -ForegroundColor Gray
    
    if (-not $localInfo.IsClean) {
        Write-Log "⚠️  Repository has uncommitted changes!" "WARNING"
        if (-not $DryRun -and -not $script:AutoConfirm) {
            $response = Read-Host "Continue anyway? (y/N)"
            if ($response -ne 'y' -and $response -ne 'Y') {
                return @{ Success = $false; Skipped = $true; Reason = "Uncommitted changes" }
            }
        }
    }
    
    try {
        # Create GitHub repository
        Write-Host "`n🔄 Creating GitHub repository..." -ForegroundColor Yellow
        Write-Log "Creating repository: $repoFullName"
        
        $visibility = if ($Repo.Private) { "--private" } else { "--public" }
        $createCmd = "gh repo create `"$repoFullName`" $visibility --description `"$($Repo.Description)`""
        
        if ($DryRun) {
            Write-Log "[DRY RUN] Would create: $createCmd" "INFO"
            Write-Log "[DRY RUN] Would add topics: $($Repo.Topics -join ', ')" "INFO"
        } else {
            # Create the repository
            $output = Invoke-Expression $createCmd 2>&1
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to create repository: $output"
            }
            Write-Log "✅ GitHub repository created" "SUCCESS"
            
            # Add topics
            if ($Repo.Topics.Count -gt 0) {
                Write-Host "🏷️  Adding topics..." -ForegroundColor Yellow
                $topicsJson = $Repo.Topics | ConvertTo-Json -Compress
                gh api -X PUT "repos/$repoFullName/topics" -f names=$topicsJson 2>&1 | Out-Null
                if ($LASTEXITCODE -eq 0) {
                    Write-Log "✅ Topics added: $($Repo.Topics -join ', ')" "SUCCESS"
                } else {
                    Write-Log "⚠️  Failed to add topics (non-critical)" "WARNING"
                }
            }
            
            # Set homepage if provided
            if ($Repo.Homepage) {
                gh api -X PATCH "repos/$repoFullName" -f homepage="$($Repo.Homepage)" 2>&1 | Out-Null
            }
            
            Start-Sleep -Seconds 1  # Brief pause for GitHub API
        }
        
        # Configure remote and push
        Write-Host "`n🔄 Configuring remote and pushing code..." -ForegroundColor Yellow
        Push-Location $repoPath
        try {
            # Remove existing remote if present
            $hasRemote = git remote get-url origin 2>&1
            if ($LASTEXITCODE -eq 0) {
                if ($DryRun) {
                    Write-Log "[DRY RUN] Would remove existing remote" "INFO"
                } else {
                    git remote remove origin 2>&1 | Out-Null
                    Write-Log "Removed existing remote" "INFO"
                }
            }
            
            # Add GitHub remote
            $remoteUrl = "https://github.com/$repoFullName.git"
            if ($DryRun) {
                Write-Log "[DRY RUN] Would add remote: $remoteUrl" "INFO"
                Write-Log "[DRY RUN] Would push: git push -u origin main" "INFO"
            } else {
                git remote add origin $remoteUrl 2>&1 | Out-Null
                if ($LASTEXITCODE -ne 0) {
                    throw "Failed to add remote"
                }
                Write-Log "✅ Remote added: $remoteUrl" "SUCCESS"
                
                # Push to GitHub
                Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow
                $pushOutput = git push -u origin main 2>&1
                if ($LASTEXITCODE -ne 0) {
                    throw "Failed to push: $pushOutput"
                }
                Write-Log "✅ Code pushed to GitHub" "SUCCESS"
            }
            
        } finally {
            Pop-Location
        }
        
        # Success!
        Write-Host "✅ $repoName deployed successfully!" -ForegroundColor Green
        Write-Log "Repository deployment complete: $repoFullName" "SUCCESS"
        
        return @{
            Success = $true
            Url = "https://github.com/$repoFullName"
            Commits = $localInfo.Commits
            Size = $localInfo.Size
            Files = $localInfo.Files
        }
        
    } catch {
        $errorMsg = $_.Exception.Message
        Write-Host "❌ Failed: $errorMsg" -ForegroundColor Red
        Write-Log "Repository deployment failed: $errorMsg" "ERROR"
        
        return @{
            Success = $false
            Skipped = $false
            Reason = $errorMsg
        }
    }
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

Write-Host @"

╔════════════════════════════════════════════════════════════════╗
║           Phase 3C - Push to GitHub (8 Repositories)           ║
║                  Doing it right the first time                 ║
╚════════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "🔍 DRY RUN MODE - No changes will be made`n" -ForegroundColor Yellow
}

# Initialize log
"========================================" | Out-File $LogFile
"Phase 3C GitHub Push Log" | Out-File $LogFile -Append
"Started: $(Get-Date)" | Out-File $LogFile -Append
"Dry Run: $DryRun" | Out-File $LogFile -Append
"========================================`n" | Out-File $LogFile -Append

# Check prerequisites
if (-not (Test-Prerequisites)) {
    Write-Host "`n❌ Prerequisites check failed. Please fix the issues above.`n" -ForegroundColor Red
    exit 1
}

# Display plan
Write-Host "`n📋 Deployment Plan:" -ForegroundColor Cyan
Write-Host "`nThe following 8 repositories will be created on GitHub:" -ForegroundColor Yellow
foreach ($repo in $Repositories) {
    Write-Host "`n$($repo.Number). $($repo.Name)" -ForegroundColor White
    Write-Host "   Description: $($repo.Description)" -ForegroundColor Gray
    Write-Host "   Topics: $($repo.Topics -join ', ')" -ForegroundColor Gray
    Write-Host "   Visibility: $(if ($repo.Private) { 'Private' } else { 'Public' })" -ForegroundColor Gray
}

Write-Host "`n📍 Organization: $GitHubOrg" -ForegroundColor Cyan
Write-Host "📂 Source: $WorkspaceRoot" -ForegroundColor Cyan

if (-not $DryRun -and -not $AutoConfirm) {
    Write-Host "`n⚠️  This will:" -ForegroundColor Yellow
    Write-Host "   1. Create 8 new public repositories on GitHub" -ForegroundColor Gray
    Write-Host "   2. Push all local code with full Git history" -ForegroundColor Gray
    Write-Host "   3. Configure topics and descriptions" -ForegroundColor Gray
    Write-Host "`n   If repositories already exist, you'll be asked to confirm deletion.`n" -ForegroundColor Gray
    
    $response = Read-Host "Continue? (Y/n)"
    if ($response -eq 'n' -or $response -eq 'N') {
        Write-Host "`n⏹️  Deployment cancelled by user.`n" -ForegroundColor Yellow
        exit 0
    }
}

# Track results
$results = @()
$successCount = 0
$failCount = 0
$skipCount = 0
$script:AutoConfirm = $AutoConfirm

# Deploy each repository
foreach ($repo in $Repositories) {
    $result = New-GitHubRepository -Repo $repo -DryRun $DryRun
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
        if (-not $DryRun -and -not $AutoConfirm) {
            Write-Host "`n⚠️  Deployment failed for $($repo.Name)" -ForegroundColor Yellow
            $continue = Read-Host "Continue with remaining repositories? (Y/n)"
            if ($continue -eq 'n' -or $continue -eq 'N') {
                Write-Host "`n⏹️  Deployment stopped by user.`n" -ForegroundColor Yellow
                break
            }
        }
    }
}

# Final summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n✅ Successful: $successCount" -ForegroundColor Green
Write-Host "❌ Failed: $failCount" -ForegroundColor Red
Write-Host "⏭️  Skipped: $skipCount" -ForegroundColor Yellow

Write-Host "`n📊 Individual Results:" -ForegroundColor Cyan
foreach ($result in $results) {
    $icon = if ($result.Result.Success) { "✅" } elseif ($result.Result.Skipped) { "⏭️" } else { "❌" }
    
    if ($result.Result.Success) {
        $status = "$($result.Result.Size)MB, $($result.Result.Commits) commits, $($result.Result.Files) files"
        $url = $result.Result.Url
        Write-Host "   $icon $($result.Number). $($result.Repo)" -ForegroundColor Green
        Write-Host "      $status" -ForegroundColor Gray
        Write-Host "      $url" -ForegroundColor Blue
    } elseif ($result.Result.Skipped) {
        Write-Host "   $icon $($result.Number). $($result.Repo): Skipped - $($result.Result.Reason)" -ForegroundColor Yellow
    } else {
        Write-Host "   $icon $($result.Number). $($result.Repo): Failed - $($result.Result.Reason)" -ForegroundColor Red
    }
}

Write-Host "`n📁 Local workspace: $WorkspaceRoot" -ForegroundColor Cyan
Write-Host "📝 Log file: $LogFile" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "`n🔍 DRY RUN COMPLETE - No changes were made" -ForegroundColor Yellow
    Write-Host "   Run without -DryRun to actually create repositories and push code.`n" -ForegroundColor Gray
} elseif ($failCount -eq 0 -and $skipCount -eq 0 -and $successCount -eq 8) {
    Write-Host "`n🎉 All 8 repositories deployed successfully!" -ForegroundColor Green
    Write-Host "`n🌐 View your repositories at:" -ForegroundColor Cyan
    Write-Host "   https://github.com/$GitHubOrg?tab=repositories`n" -ForegroundColor Blue
    
    Write-Host "✨ Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Configure branch protection rules" -ForegroundColor Gray
    Write-Host "   2. Set up GitHub Actions CI/CD" -ForegroundColor Gray
    Write-Host "   3. Update monorepo documentation with polyrepo structure" -ForegroundColor Gray
    Write-Host "   4. Configure dependabot and security alerts`n" -ForegroundColor Gray
} elseif ($failCount -gt 0) {
    Write-Host "`n⚠️  Some repositories failed. Review errors above." -ForegroundColor Yellow
    Write-Host "   You can retry failed repos individually later.`n" -ForegroundColor Gray
} else {
    Write-Host "`n✅ Deployment complete with $successCount successful deployments.`n" -ForegroundColor Green
}

Write-Log "Deployment complete: $successCount success, $failCount failed, $skipCount skipped" "INFO"
Write-Host ""

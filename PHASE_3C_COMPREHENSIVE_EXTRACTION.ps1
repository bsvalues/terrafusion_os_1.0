# PHASE 3C: Comprehensive Module Extraction Script
# Extracts 8 domain repositories from TerraFusion OS 1.0 monorepo
# Based on proven Phase 3B methodology with git-filter-repo

param(
    [switch]$AutoConfirm = $false
)

$ErrorActionPreference = "Stop"

Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  PHASE 3C: COMPREHENSIVE MODULE EXTRACTION" -ForegroundColor Cyan
Write-Host "  8 Domain Repositories | ~273MB Total | ~1.5 Hours" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Configuration
$SourceRepo = $PWD.Path
$WorkspaceRoot = "C:\Temp\phase-3c-extraction"
$ExtractionLog = Join-Path $WorkspaceRoot "extraction.log"

# Repository definitions
$Repositories = @(
    @{
        Name = "terrafusion-government-platform"
        Paths = @(
            "modules/government-core/",
            "packages/government-edition/",
            "packages/government-edition-enhanced/"
        )
        Description = "Government property assessment platform - core modules and applications"
        EstimatedSize = "190MB"
        EstimatedTime = "20 min"
    },
    @{
        Name = "terrafusion-commercial-platform"
        Paths = @(
            "modules/commercial/",
            "packages/commercial/"
        )
        Description = "Commercial real estate platform - modules and applications"
        EstimatedSize = "31MB"
        EstimatedTime = "10 min"
    },
    @{
        Name = "terrafusion-ai-platform"
        Paths = @(
            "modules/ai-systems/",
            "modules/ai-command-brain/",
            "modules/ai-swarm/",
            "modules/autonomous-research-engine/"
        )
        Description = "AI/ML platform - predictive analytics, automation, multi-agent systems"
        EstimatedSize = "2.6MB"
        EstimatedTime = "5 min"
    },
    @{
        Name = "terrafusion-infrastructure-platform"
        Paths = @(
            "modules/infrastructure/",
            "modules/terra-flow/",
            "modules/terra-fusion-sync/"
        )
        Description = "Infrastructure platform - deployment, workflow, sync services"
        EstimatedSize = "23MB"
        EstimatedTime = "10 min"
    },
    @{
        Name = "terrafusion-specialized-modules"
        Paths = @(
            "modules/specialized/"
        )
        Description = "Specialized tools and workflows for advanced use cases"
        EstimatedSize = "26MB"
        EstimatedTime = "10 min"
    },
    @{
        Name = "terrafusion-developer-tools"
        Paths = @(
            "modules/TerraFusionIDE/",
            "modules/property-workbench/",
            "modules/test-helpers/"
        )
        Description = "Developer experience tools - IDE, workbench, testing utilities"
        EstimatedSize = "0.18MB"
        EstimatedTime = "2 min"
    },
    @{
        Name = "terrafusion-docs"
        Paths = @(
            "docs/"
        )
        Description = "Comprehensive documentation for TerraFusion platform"
        EstimatedSize = "TBD"
        EstimatedTime = "10 min"
    },
    @{
        Name = "terrafusion-ui-components"
        Paths = @(
            "modules/terra-fusion-dashboard/",
            "modules/golden-ratio-engine/",
            "modules/TerraFusion-PublicRecords/",
            "packages/tf-visual/",
            "packages/tf-audio/"
        )
        Description = "Shared UI components and design system"
        EstimatedSize = "0.01MB"
        EstimatedTime = "2 min"
    }
)

# Helper function to invoke git-filter-repo
function Invoke-FilterRepo {
    param(
        [string]$RepoPath,
        [string[]]$PathsToKeep,
        [string]$RepoName
    )
    
    Write-Host "ℹ️  Filtering repository for $RepoName..." -ForegroundColor Cyan
    Write-Host "ℹ️  Keeping paths: $($PathsToKeep -join ', ')" -ForegroundColor Gray
    
    # Create paths file
    $pathsFile = Join-Path $WorkspaceRoot "$RepoName-paths.txt"
    $PathsToKeep | Out-File -FilePath $pathsFile -Encoding utf8
    
    # Change to repo directory
    Push-Location $RepoPath
    
    try {
        # Run git-filter-repo
        $output = python -m git_filter_repo --force --paths-from-file $pathsFile 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Repository filtered successfully" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ git-filter-repo failed with exit code: $LASTEXITCODE" -ForegroundColor Red
            Write-Host "Output: $output" -ForegroundColor Red
            return $false
        }
    }
    finally {
        Pop-Location
    }
}

# Check prerequisites
Write-Host "🔍 Checking prerequisites...`n" -ForegroundColor Yellow

# Check Git
try {
    $gitVersion = git --version 2>&1
    Write-Host "✅ Git: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git not found! Please install Git." -ForegroundColor Red
    exit 1
}

# Check Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found! Please install Python 3.x" -ForegroundColor Red
    exit 1
}

# Check git-filter-repo
try {
    $filterRepoCheck = python -m git_filter_repo --version 2>&1
    Write-Host "✅ git-filter-repo: installed and working" -ForegroundColor Green
} catch {
    Write-Host "❌ git-filter-repo not found!" -ForegroundColor Red
    Write-Host "Install with: pip install git-filter-repo" -ForegroundColor Yellow
    exit 1
}

# Check disk space (need at least 5GB free)
$drive = Get-PSDrive -Name ($WorkspaceRoot[0])
$freeSpaceGB = [math]::Round($drive.Free / 1GB, 2)
if ($freeSpaceGB -lt 5) {
    Write-Host "❌ Insufficient disk space! Need at least 5GB free, have ${freeSpaceGB}GB" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Disk space: ${freeSpaceGB}GB free" -ForegroundColor Green

# Create workspace
Write-Host "`n🔧 Setting up workspace..." -ForegroundColor Yellow
if (Test-Path $WorkspaceRoot) {
    Write-Host "⚠️  Workspace already exists: $WorkspaceRoot" -ForegroundColor Yellow
    if (-not $AutoConfirm) {
        $response = Read-Host "Delete and recreate? (y/N)"
        if ($response -ne 'y') {
            Write-Host "❌ Extraction cancelled" -ForegroundColor Red
            exit 1
        }
    }
    Remove-Item -Recurse -Force $WorkspaceRoot
}
New-Item -ItemType Directory -Force -Path $WorkspaceRoot | Out-Null
Write-Host "✅ Workspace created: $WorkspaceRoot" -ForegroundColor Green

# Confirmation
Write-Host "`n📋 Extraction Summary:" -ForegroundColor Yellow
Write-Host "   Source: $SourceRepo" -ForegroundColor Gray
Write-Host "   Target: $WorkspaceRoot" -ForegroundColor Gray
Write-Host "   Repositories: $($Repositories.Count)" -ForegroundColor Gray
Write-Host "   Total estimated size: ~273MB" -ForegroundColor Gray
Write-Host "   Total estimated time: ~1.5 hours`n" -ForegroundColor Gray

if (-not $AutoConfirm) {
    $response = Read-Host "Proceed with extraction? (y/N)"
    if ($response -ne 'y') {
        Write-Host "❌ Extraction cancelled" -ForegroundColor Red
        exit 0
    }
} else {
    Write-Host "✅ Auto-confirmed - proceeding with extraction`n" -ForegroundColor Green
}

# Start extraction log
$logHeader = @"
PHASE 3C EXTRACTION LOG
=======================
Start Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Source: $SourceRepo
Target: $WorkspaceRoot
Repositories: $($Repositories.Count)

"@
$logHeader | Out-File -FilePath $ExtractionLog -Encoding utf8

# Extract each repository
$successCount = 0
$failCount = 0
$startTime = Get-Date

for ($i = 0; $i -lt $Repositories.Count; $i++) {
    $repo = $Repositories[$i]
    $repoNum = $i + 1
    
    Write-Host "`n══════════════════════════════════════════════" -ForegroundColor Magenta
    Write-Host "Repository $repoNum/$($Repositories.Count): $($repo.Name)" -ForegroundColor Magenta
    Write-Host "══════════════════════════════════════════════" -ForegroundColor Magenta
    Write-Host "Description: $($repo.Description)" -ForegroundColor Gray
    Write-Host "Paths: $($repo.Paths -join ', ')" -ForegroundColor Gray
    Write-Host "Estimated: $($repo.EstimatedSize) in $($repo.EstimatedTime)`n" -ForegroundColor Gray
    
    $repoStartTime = Get-Date
    $repoPath = Join-Path $WorkspaceRoot $repo.Name
    
    try {
        # Clone repository (bare, no checkout to avoid Windows path issues)
        Write-Host "🔄 Cloning repository (bare, no checkout)..." -ForegroundColor Cyan
        $cloneOutput = git clone --no-checkout "$SourceRepo" "$repoPath" 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            throw "Git clone failed: $cloneOutput"
        }
        Write-Host "✅ Repository cloned (bare)" -ForegroundColor Green
        
        # Filter repository
        $filterSuccess = Invoke-FilterRepo -RepoPath $repoPath -PathsToKeep $repo.Paths -RepoName $repo.Name
        
        if (-not $filterSuccess) {
            throw "git-filter-repo failed"
        }
        
        # Checkout files now (after filtering, paths are shorter)
        Write-Host "🔄 Checking out files..." -ForegroundColor Cyan
        Push-Location $repoPath
        git checkout main 2>&1 | Out-Null
        Pop-Location
        Write-Host "✅ Files checked out" -ForegroundColor Green
        
        # Create README.md
        Write-Host "🔄 Creating README.md..." -ForegroundColor Cyan
        $readmeContent = @"
# $($repo.Name)

**Status:** ✅ Active Development  
**Phase:** 3C (Domain Repository Extraction)  
**Extracted:** $(Get-Date -Format 'yyyy-MM-dd')

---

## Description

$($repo.Description)

---

## Repository Contents

This repository contains:

$($repo.Paths | ForEach-Object { "- ``$_``" } | Out-String)

---

## Related Repositories

### Core Platform
- [terrafusion-shared](https://github.com/bsvalues/terrafusion-shared) - Shared libraries and utilities
- [terrafusion-os-core](https://github.com/bsvalues/terrafusion-os-core) - Core operating system
- [terrafusion-marketplace](https://github.com/bsvalues/terrafusion-marketplace) - Marketplace application
- [terrafusion-infrastructure](https://github.com/bsvalues/terrafusion-infrastructure) - Deployment configs

### Domain Repositories
- [terrafusion-government-platform](https://github.com/bsvalues/terrafusion-government-platform) - Government platform
- [terrafusion-commercial-platform](https://github.com/bsvalues/terrafusion-commercial-platform) - Commercial platform
- [terrafusion-ai-platform](https://github.com/bsvalues/terrafusion-ai-platform) - AI/ML platform
- [terrafusion-infrastructure-platform](https://github.com/bsvalues/terrafusion-infrastructure-platform) - Infrastructure
- [terrafusion-specialized-modules](https://github.com/bsvalues/terrafusion-specialized-modules) - Specialized tools
- [terrafusion-developer-tools](https://github.com/bsvalues/terrafusion-developer-tools) - Developer tools
- [terrafusion-docs](https://github.com/bsvalues/terrafusion-docs) - Documentation
- [terrafusion-ui-components](https://github.com/bsvalues/terrafusion-ui-components) - UI components

---

## Architecture

This repository is part of the TerraFusion OS 1.0 polyrepo architecture, designed using Domain-Driven Design principles with clear bounded contexts.

**Extraction Details:**
- **Source:** TerraFusion OS 1.0 Monorepo
- **Method:** git-filter-repo with full history preservation
- **Phase:** 3C - Domain Repository Extraction
- **Date:** $(Get-Date -Format 'yyyy-MM-dd')

---

## Getting Started

[Add setup/installation instructions here]

---

## Contributing

[Add contribution guidelines here]

---

## License

[Add license information here]
"@
        
        $readmeContent | Out-File -FilePath (Join-Path $repoPath "README.md") -Encoding utf8
        
        # Commit README
        Push-Location $repoPath
        git add README.md 2>&1 | Out-Null
        git commit -m "Add README for $($repo.Name)" 2>&1 | Out-Null
        Pop-Location
        Write-Host "✅ README.md created and committed" -ForegroundColor Green
        
        # Calculate final size
        $repoSize = (Get-ChildItem $repoPath -Recurse -File | Measure-Object -Property Length -Sum).Sum
        $repoSizeMB = [math]::Round($repoSize / 1MB, 2)
        
        # Calculate time taken
        $repoEndTime = Get-Date
        $duration = $repoEndTime - $repoStartTime
        $durationStr = "{0:D2}:{1:D2}" -f [int]$duration.TotalMinutes, $duration.Seconds
        
        Write-Host "`n✅ $($repo.Name) complete: ${repoSizeMB}MB in $durationStr" -ForegroundColor Green
        
        # Log success
        $logEntry = "[$repoNum/$($Repositories.Count)] SUCCESS: $($repo.Name) - ${repoSizeMB}MB in $durationStr`n"
        $logEntry | Out-File -FilePath $ExtractionLog -Append -Encoding utf8
        
        $successCount++
        
    } catch {
        Write-Host "`n❌ Failed to extract $($repo.Name): $_" -ForegroundColor Red
        
        # Log failure
        $logEntry = "[$repoNum/$($Repositories.Count)] FAILED: $($repo.Name) - $($_.Exception.Message)`n"
        $logEntry | Out-File -FilePath $ExtractionLog -Append -Encoding utf8
        
        $failCount++
    }
}

# Calculate total time
$endTime = Get-Date
$totalDuration = $endTime - $startTime
$totalDurationStr = "{0:D2}:{1:D2}:{2:D2}" -f [int]$totalDuration.TotalHours, $totalDuration.Minutes, $totalDuration.Seconds

# Summary
Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  PHASE 3C EXTRACTION COMPLETE" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "📊 Summary:" -ForegroundColor Yellow
Write-Host "   Total repositories: $($Repositories.Count)" -ForegroundColor Gray
Write-Host "   Successful: $successCount" -ForegroundColor Green
Write-Host "   Failed: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Gray" })
Write-Host "   Total time: $totalDurationStr" -ForegroundColor Gray
Write-Host "   Workspace: $WorkspaceRoot`n" -ForegroundColor Gray

if ($successCount -eq $Repositories.Count) {
    Write-Host "🎉 All repositories extracted successfully!" -ForegroundColor Green
    Write-Host "`n📝 Next Steps:" -ForegroundColor Yellow
    Write-Host "   1. Verify extracted repositories" -ForegroundColor Gray
    Write-Host "   2. Create GitHub repositories" -ForegroundColor Gray
    Write-Host "   3. Push to GitHub" -ForegroundColor Gray
    Write-Host "   4. Document completion`n" -ForegroundColor Gray
} else {
    Write-Host "⚠️  Some repositories failed to extract. Check log: $ExtractionLog" -ForegroundColor Yellow
}

# Log completion
$logFooter = @"

EXTRACTION COMPLETE
===================
End Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Total Duration: $totalDurationStr
Successful: $successCount
Failed: $failCount
"@
$logFooter | Out-File -FilePath $ExtractionLog -Append -Encoding utf8

Write-Host "📄 Extraction log saved: $ExtractionLog`n" -ForegroundColor Gray

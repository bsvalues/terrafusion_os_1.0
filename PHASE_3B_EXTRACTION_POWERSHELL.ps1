# Phase 3b: Polyrepo Extraction - PowerShell Version
# TerraFusion OS Architectural Transformation

param(
    [string]$ExtractionPath = "C:\Temp\polyrepo-extraction",
    [string]$SourceRepo = "C:\Users\bsval\terrafusion_os_1.0",
    [string]$GithubOrg = "bsvalues",
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Header { param($msg) Write-Host "`n========================================" -ForegroundColor Magenta; Write-Host $msg -ForegroundColor Magenta; Write-Host "========================================`n" -ForegroundColor Magenta }

# Banner
Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  TerraFusion Polyrepo Extraction - Phase 3b║" -ForegroundColor Cyan
Write-Host "║            PowerShell Edition              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Verify prerequisites
Write-Header "Step 1: Prerequisites Check"

Write-Info "Checking Git..."
$gitVersion = git --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Git not found! Please install Git."
    exit 1
}
Write-Success "Git installed: $gitVersion"

Write-Info "Checking git-filter-repo..."
$filterRepo = python -m pip show git-filter-repo 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Error "git-filter-repo not installed! Run: pip install git-filter-repo"
    exit 1
}
Write-Success "git-filter-repo installed"

Write-Info "Checking GitHub CLI..."
$ghVersion = gh --version 2>$null | Select-Object -First 1
if ($LASTEXITCODE -ne 0) {
    Write-Warning "GitHub CLI not found - you'll need to create repos manually"
} else {
    Write-Success "GitHub CLI installed: $ghVersion"
}

Write-Info "Checking disk space..."
$drive = Get-PSDrive C
$freeGB = [math]::Round($drive.Free/1GB, 2)
if ($freeGB -lt 100) {
    Write-Error "Insufficient disk space! Need 100GB+, have ${freeGB}GB"
    exit 1
}
Write-Success "Disk space available: ${freeGB}GB"

if (-not (Test-Path $SourceRepo)) {
    Write-Error "Source repository not found: $SourceRepo"
    exit 1
}
Write-Success "Source repository found: $SourceRepo"

# Setup workspace
Write-Header "Step 2: Setting Up Extraction Workspace"

if (Test-Path $ExtractionPath) {
    Write-Warning "Extraction workspace already exists. Cleaning up..."
    Remove-Item -Recurse -Force $ExtractionPath
}

New-Item -ItemType Directory -Path $ExtractionPath -Force | Out-Null
Write-Success "Workspace created: $ExtractionPath"

# Get current repo size
Write-Info "Calculating source repository size..."
$sourceSize = (Get-ChildItem $SourceRepo -Recurse -File -ErrorAction SilentlyContinue | 
    Measure-Object -Property Length -Sum).Sum / 1GB
Write-Info "Source repository size: $([math]::Round($sourceSize, 2))GB"

Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "                 🚀 READY TO EXTRACT                    " -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""
Write-Host "This will extract the following repositories:" -ForegroundColor White
Write-Host "  1. terrafusion-shared      (200-300MB) - Foundation libraries" -ForegroundColor Cyan
Write-Host "  2. terrafusion-os-core     (3-4GB)     - Core OS kernel" -ForegroundColor Cyan
Write-Host "  3. terrafusion-marketplace (1-2GB)     - Marketplace platform" -ForegroundColor Cyan
Write-Host "  4. terrafusion-infrastructure (100-200MB) - IaC & deployment" -ForegroundColor Cyan
Write-Host ""
Write-Host "Extraction path: $ExtractionPath" -ForegroundColor Gray
Write-Host "Estimated time: 2-4 hours" -ForegroundColor Gray
Write-Host "Disk space needed: ~50-100GB temporarily" -ForegroundColor Gray
Write-Host ""

if ($DryRun) {
    Write-Warning "DRY RUN MODE - No actual extraction will be performed"
    exit 0
}

$confirm = Read-Host "Do you want to proceed? (yes/no)"
if ($confirm -ne "yes" -and $confirm -ne "y") {
    Write-Warning "Extraction cancelled by user"
    exit 0
}

# Repository 1: terrafusion-shared (EXTRACT FIRST)
Write-Header "Step 3: Extracting Repository 1 - terrafusion-shared"

$repo1Path = Join-Path $ExtractionPath "terrafusion-shared"
Write-Info "Creating repository: terrafusion-shared"
Write-Info "This repository MUST be extracted first as it's a dependency for others"

# Clone the source repo
Write-Info "Cloning source repository..."
git clone $SourceRepo $repo1Path 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to clone source repository"
    exit 1
}

Set-Location $repo1Path
Write-Success "Repository cloned"

# Use git filter-repo to extract only shared packages
Write-Info "Extracting shared libraries with git-filter-repo..."
Write-Info "Keeping only: packages/shared/"

# Create paths file for filter-repo
$pathsFile = Join-Path $repo1Path "filter-paths.txt"
Set-Content -Path $pathsFile -Value "packages/shared/"

# Run git-filter-repo
Write-Info "Running git filter-repo (this may take several minutes)..."
python -m git_filter_repo --force --paths-from-file $pathsFile --path-rename packages/shared/:

if ($LASTEXITCODE -ne 0) {
    Write-Error "git-filter-repo failed!"
    exit 1
}

Remove-Item $pathsFile -ErrorAction SilentlyContinue
Write-Success "Extraction complete"

# Update README
Write-Info "Creating README..."
@"
# TerraFusion Shared Libraries

Foundation libraries and utilities shared across the TerraFusion ecosystem.

## 🎯 Purpose

This repository contains shared code, utilities, and libraries used by:
- TerraFusion OS Core
- TerraFusion Marketplace
- TerraFusion Infrastructure
- All marketplace applications

## 📦 Components

- **Common utilities** - Helper functions, types, interfaces
- **Shared models** - Data models used across services
- **Configuration** - Shared configuration utilities
- **Constants** - System-wide constants and enums

## 🚀 Installation

\`\`\`bash
npm install @terrafusion/shared
# or
yarn add @terrafusion/shared
\`\`\`

## 📖 Documentation

See the [docs](./docs) directory for detailed documentation.

## 🔗 Related Repositories

- [terrafusion-os-core](https://github.com/$GithubOrg/terrafusion-os-core)
- [terrafusion-marketplace](https://github.com/$GithubOrg/terrafusion-marketplace)
- [terrafusion-infrastructure](https://github.com/$GithubOrg/terrafusion-infrastructure)

---

**Part of the TerraFusion OS Platform**  
Extracted from monorepo: $((Get-Date).ToString('yyyy-MM-dd'))
"@ | Set-Content -Path (Join-Path $repo1Path "README.md") -Force

git add .
git commit -m "Initialize terrafusion-shared repository

Extracted from TerraFusion OS monorepo
Contains foundation libraries and shared utilities
Base dependency for all TerraFusion repositories" 2>&1 | Out-Null

Write-Success "terrafusion-shared repository ready"

# Check size
$repo1Size = (Get-ChildItem $repo1Path -Recurse -File -ErrorAction SilentlyContinue | 
    Measure-Object -Property Length -Sum).Sum / 1MB
Write-Info "Repository size: $([math]::Round($repo1Size, 2))MB"

Set-Location $SourceRepo

# Summary
Write-Header "Phase 3b Step 1 Complete"

Write-Host "✅ Repository extracted: terrafusion-shared" -ForegroundColor Green
Write-Host "   Location: $repo1Path" -ForegroundColor Gray
Write-Host "   Size: $([math]::Round($repo1Size, 2))MB" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  NEXT STEPS:" -ForegroundColor Yellow
Write-Host "   1. Review the extracted repository" -ForegroundColor White
Write-Host "   2. Verify git history is intact: cd $repo1Path && git log" -ForegroundColor White
Write-Host "   3. Push to GitHub: gh repo create $GithubOrg/terrafusion-shared --public --source=. --push" -ForegroundColor White
Write-Host "   4. Continue with remaining repositories (os-core, marketplace, infrastructure)" -ForegroundColor White
Write-Host ""
Write-Host "📚 For detailed manual extraction steps, see:" -ForegroundColor Cyan
Write-Host "   PHASE_3_POLYREPO_EXTRACTION_PLAN.md" -ForegroundColor Gray
Write-Host ""

Write-Info "Phase 3b extraction (1/4 repositories) complete!"
Write-Info "Run this script again or continue manually for remaining repos"

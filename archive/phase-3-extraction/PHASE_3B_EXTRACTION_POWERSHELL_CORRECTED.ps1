# Phase 3b: Polyrepo Extraction - PowerShell Native (CORRECTED)
# Based on ACTUAL repository structure analysis
# Works natively on Windows - NO WSL REQUIRED

param(
    [string]$SourceRepo = "C:\Users\bsval\terrafusion_os_1.0",
    [string]$OutputBase = "C:\Temp\polyrepo-extraction-corrected",
    [string]$GithubOrg = "bsvalues",
    [switch]$DryRun = $false,
    [switch]$AutoConfirm = $false
)

$ErrorActionPreference = "Stop"

# Helper functions
function Write-Status { param($msg, $color="White") Write-Host $msg -ForegroundColor $color }
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Cyan }
function Write-Warn { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Err { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Header { 
    param($msg) 
    Write-Host "`n══════════════════════════════════════════════" -ForegroundColor Magenta
    Write-Host $msg -ForegroundColor Magenta
    Write-Host "══════════════════════════════════════════════`n" -ForegroundColor Magenta
}

# Banner
Clear-Host
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  TerraFusion Polyrepo Extraction - Phase 3b CORRECTED ║" -ForegroundColor Cyan
Write-Host "║         PowerShell Native - Windows Edition            ║" -ForegroundColor Cyan
Write-Host "║       Based on ACTUAL Repository Structure             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Step 1: Prerequisites
Write-Header "Step 1: Prerequisites Check"

Write-Info "Checking Git..."
try {
    $gitVer = git --version 2>&1
    Write-Success "Git: $gitVer"
} catch {
    Write-Err "Git not found! Install from https://git-scm.com"
    exit 1
}

Write-Info "Checking Python..."
try {
    $pyVer = python --version 2>&1
    Write-Success "Python: $pyVer"
} catch {
    Write-Err "Python not found!"
    exit 1
}

Write-Info "Checking git-filter-repo..."
try {
    $filterTest = python -m git_filter_repo --version 2>&1
    Write-Success "git-filter-repo: installed and working"
} catch {
    Write-Err "git-filter-repo not accessible via Python!"
    Write-Info "Install with: pip install git-filter-repo"
    exit 1
}

Write-Info "Checking disk space..."
$drive = Get-PSDrive C
$freeGB = [math]::Round($drive.Free/1GB, 2)
if ($freeGB -lt 50) {
    Write-Err "Insufficient disk space! Need 50GB+, have ${freeGB}GB"
    exit 1
}
Write-Success "Disk space: ${freeGB}GB free"

Write-Info "Checking source repository..."
if (-not (Test-Path $SourceRepo)) {
    Write-Err "Source repository not found: $SourceRepo"
    exit 1
}
Write-Success "Source repository found"

# Step 2: Setup
Write-Header "Step 2: Workspace Setup"

if (Test-Path $OutputBase) {
    Write-Warn "Output directory exists. Removing..."
    Remove-Item -Recurse -Force $OutputBase -ErrorAction SilentlyContinue
}

New-Item -ItemType Directory -Path $OutputBase -Force | Out-Null
Write-Success "Workspace created: $OutputBase"

# Display plan
Write-Host "`n" -NoNewline
Write-Status "═══════════════════════════════════════════════════════════" -color Yellow
Write-Status "                   EXTRACTION PLAN                          " -color Yellow
Write-Status "═══════════════════════════════════════════════════════════" -color Yellow
Write-Host ""
Write-Status "Based on ACTUAL repository analysis, will extract:" -color White
Write-Status "  1. terrafusion-shared      (~400-500MB)" -color Cyan
Write-Status "     ├─ shared-libraries/" -color Gray
Write-Status "     ├─ SDK/" -color Gray
Write-Status "     └─ terrafusion-sdk/" -color Gray
Write-Status "  2. terrafusion-os-core     (~5-6GB)" -color Cyan
Write-Status "     ├─ rust-performance-engine/ (2.4GB)" -color Gray
Write-Status "     ├─ terrafusion-cos/ (2.0GB)" -color Gray
Write-Status "     ├─ backend/ (267MB)" -color Gray
Write-Status "     └─ TERRAFUSION_OS_CORE/" -color Gray
Write-Status "  3. terrafusion-marketplace (~3-4GB)" -color Cyan
Write-Status "     ├─ packages/commercial/" -color Gray
Write-Status "     ├─ packages/government-edition/" -color Gray
Write-Status "     └─ marketplace/" -color Gray
Write-Status "  4. terrafusion-infrastructure (~350-400MB)" -color Cyan
Write-Status "     ├─ infrastructure/" -color Gray
Write-Status "     ├─ scripts/ (250MB)" -color Gray
Write-Status "     └─ .github/" -color Gray
Write-Host ""
Write-Status "Estimated time: 2-4 hours" -color Gray
Write-Status "All Git history will be preserved!" -color Green
Write-Host ""

if ($DryRun) {
    Write-Warn "DRY RUN MODE - Exiting without extraction"
    exit 0
}

if (-not $AutoConfirm) {
    $confirm = Read-Host "Proceed with extraction? (yes/no)"
    if ($confirm -ne "yes" -and $confirm -ne "y") {
        Write-Warn "Extraction cancelled"
        exit 0
    }
} else {
    Write-Success "Auto-confirmed - proceeding with extraction"
}

# Helper function to run git-filter-repo
function Invoke-FilterRepo {
    param(
        [string]$RepoPath,
        [string[]]$PathsToKeep,
        [string]$RepoName
    )
    
    Write-Info "Filtering repository for $RepoName..."
    Write-Info "Keeping paths: $($PathsToKeep -join ', ')"
    
    # Create paths file
    $pathsFile = Join-Path $RepoPath "filter-paths.txt"
    $PathsToKeep | Set-Content $pathsFile
    
    # Run filter-repo using Python module
    Push-Location $RepoPath
    try {
        $result = python -m git_filter_repo --force --paths-from-file $pathsFile 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Err "git-filter-repo failed!"
            Write-Host $result
            Pop-Location
            return $false
        }
        Write-Success "Filtering complete"
        Remove-Item $pathsFile -ErrorAction SilentlyContinue
        Pop-Location
        return $true
    } catch {
        Write-Err "Exception during filtering: $_"
        Pop-Location
        return $false
    }
}

# Repository 1: terrafusion-shared
Write-Header "Repository 1/4: terrafusion-shared"

$repo1Path = Join-Path $OutputBase "terrafusion-shared"
Write-Info "Creating terrafusion-shared repository..."

Write-Info "Cloning source repository (no checkout - avoiding Windows path limits)..."
Write-Host "Running: git clone --no-checkout `"$SourceRepo`" `"$repo1Path`"" -ForegroundColor DarkGray
$cloneOutput = git clone --no-checkout "$SourceRepo" "$repo1Path" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Err "Failed to clone repository"
    Write-Host "Error output:" -ForegroundColor Red
    Write-Host $cloneOutput
    exit 1
}
Write-Success "Repository cloned (bare)"

# Extract shared components
$pathsToKeep = @(
    "shared-libraries/",
    "SDK/",
    "terrafusion-sdk/"
)

$success = Invoke-FilterRepo -RepoPath $repo1Path -PathsToKeep $pathsToKeep -RepoName "terrafusion-shared"
if (-not $success) {
    Write-Err "Failed to extract terrafusion-shared"
    exit 1
}

# Create README
Set-Location $repo1Path
@"
# TerraFusion Shared Libraries

Foundation libraries and utilities shared across the TerraFusion ecosystem.

## 🎯 Purpose

Shared code, utilities, and libraries used by:
- TerraFusion OS Core
- TerraFusion Marketplace  
- TerraFusion Infrastructure
- All marketplace applications

## 📦 Components

- **shared-libraries/** - Common utilities and helpers
- **SDK/** - Software Development Kit
- **terrafusion-sdk/** - TerraFusion-specific SDK

## 🚀 Installation

\`\`\`bash
npm install @terrafusion/shared
# or
yarn add @terrafusion/shared
\`\`\`

## 🔗 Related Repositories

- [terrafusion-os-core](https://github.com/$GithubOrg/terrafusion-os-core)
- [terrafusion-marketplace](https://github.com/$GithubOrg/terrafusion-marketplace)
- [terrafusion-infrastructure](https://github.com/$GithubOrg/terrafusion-infrastructure)

---

**Part of the TerraFusion OS Platform**  
Extracted from monorepo: $((Get-Date).ToString('yyyy-MM-dd'))
"@ | Set-Content "README.md"

git add -A
git commit -m "Initialize terrafusion-shared repository

Extracted from TerraFusion OS monorepo
Contains foundation libraries and shared utilities
Base dependency for all TerraFusion repositories

Extraction date: $((Get-Date).ToString('yyyy-MM-dd'))" 2>&1 | Out-Null

$repo1Size = (Get-ChildItem $repo1Path -Recurse -File -ErrorAction SilentlyContinue | 
    Measure-Object -Property Length -Sum).Sum / 1MB
Write-Success "terrafusion-shared complete: $([math]::Round($repo1Size, 2))MB"

Set-Location $SourceRepo

# Repository 2: terrafusion-os-core  
Write-Header "Repository 2/4: terrafusion-os-core"

$repo2Path = Join-Path $OutputBase "terrafusion-os-core"
Write-Info "Creating terrafusion-os-core repository..."

Write-Info "Cloning source repository (no checkout - avoiding Windows path limits)..."
Write-Host "Running: git clone --no-checkout `"$SourceRepo`" `"$repo2Path`"" -ForegroundColor DarkGray
$cloneOutput = git clone --no-checkout "$SourceRepo" "$repo2Path" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Err "Failed to clone repository"
    Write-Host "Error output:" -ForegroundColor Red
    Write-Host $cloneOutput
    exit 1
}
Write-Success "Repository cloned (bare)"

# Extract OS core components
$pathsToKeep = @(
    "rust-performance-engine/",
    "terrafusion-cos/",
    "TERRAFUSION_OS_CORE/",
    "backend/",
    "terrafusion-os/"
)

$success = Invoke-FilterRepo -RepoPath $repo2Path -PathsToKeep $pathsToKeep -RepoName "terrafusion-os-core"
if (-not $success) {
    Write-Err "Failed to extract terrafusion-os-core"
    exit 1
}

# Create README
Set-Location $repo2Path
@"
# TerraFusion OS Core

The core operating system kernel, APIs, and platform services.

## 🎯 Components

- **rust-performance-engine/** - High-performance Rust engine
- **terrafusion-cos/** - Core Operating System
- **backend/** - C# backend services
- **TERRAFUSION_OS_CORE/** - OS core components

## 🏗️ Architecture

TerraFusion OS Core provides the foundational platform:

- Authentication and authorization
- Request routing and load balancing
- Data persistence and caching
- Event-driven messaging
- High-performance computation (Rust)
- Microservices (C#)

## 🚀 Getting Started

\`\`\`bash
# Build Rust engine
cd rust-performance-engine
cargo build --release

# Run backend services
cd backend
dotnet run
\`\`\`

## 🔗 Dependencies

- [terrafusion-shared](https://github.com/$GithubOrg/terrafusion-shared) - Required

---

**Part of the TerraFusion OS Platform**  
Extracted from monorepo: $((Get-Date).ToString('yyyy-MM-dd'))
"@ | Set-Content "README.md"

git add -A
git commit -m "Initialize terrafusion-os-core repository

Extracted from TerraFusion OS monorepo
Contains core OS, Rust engine, and backend services

Components:
- rust-performance-engine (2.4GB)
- terrafusion-cos (2.0GB)  
- backend (267MB)

Extraction date: $((Get-Date).ToString('yyyy-MM-dd'))" 2>&1 | Out-Null

$repo2Size = (Get-ChildItem $repo2Path -Recurse -File -ErrorAction SilentlyContinue |
    Measure-Object -Property Length -Sum).Sum / 1GB
Write-Success "terrafusion-os-core complete: $([math]::Round($repo2Size, 2))GB"

Set-Location $SourceRepo

# Repository 3: terrafusion-marketplace
Write-Header "Repository 3/4: terrafusion-marketplace"

$repo3Path = Join-Path $OutputBase "terrafusion-marketplace"
Write-Info "Creating terrafusion-marketplace repository..."

Write-Info "Cloning source repository (no checkout - avoiding Windows path limits)..."
Write-Host "Running: git clone --no-checkout `"$SourceRepo`" `"$repo3Path`"" -ForegroundColor DarkGray
$cloneOutput = git clone --no-checkout "$SourceRepo" "$repo3Path" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Err "Failed to clone repository"
    Write-Host "Error output:" -ForegroundColor Red
    Write-Host $cloneOutput
    exit 1
}
Write-Success "Repository cloned (bare)"

# Extract marketplace components
$pathsToKeep = @(
    "packages/commercial/",
    "packages/government-edition/",
    "packages/government-edition-enhanced-MARKED-FOR-REVIEW/",
    "marketplace/",
    "terrafusion-marketplace/",
    "frontend/"
)

$success = Invoke-FilterRepo -RepoPath $repo3Path -PathsToKeep $pathsToKeep -RepoName "terrafusion-marketplace"
if (-not $success) {
    Write-Err "Failed to extract terrafusion-marketplace"
    exit 1
}

# Create README
Set-Location $repo3Path
@"
# TerraFusion Marketplace

Application marketplace platform for government and commercial solutions.

## 🎯 Purpose

Platform for discovering, installing, and managing TerraFusion applications.

## 📦 Components

- **packages/commercial/** - Commercial marketplace apps
- **packages/government-edition/** - Government applications
- **marketplace/** - Marketplace platform code
- **frontend/** - Marketplace UI

## 🏗️ Features

- App discovery and search
- Installation and updates
- Revenue management
- License validation
- Review and rating system

## 🚀 Getting Started

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

## 🔗 Dependencies

- [terrafusion-shared](https://github.com/$GithubOrg/terrafusion-shared) - Required
- [terrafusion-os-core](https://github.com/$GithubOrg/terrafusion-os-core) - Required

---

**Part of the TerraFusion OS Platform**  
Extracted from monorepo: $((Get-Date).ToString('yyyy-MM-dd'))
"@ | Set-Content "README.md"

git add -A
git commit -m "Initialize terrafusion-marketplace repository

Extracted from TerraFusion OS monorepo
Contains marketplace platform and applications

Components:
- Commercial packages
- Government editions
- Marketplace platform
- Frontend UI

Extraction date: $((Get-Date).ToString('yyyy-MM-dd'))" 2>&1 | Out-Null

$repo3Size = (Get-ChildItem $repo3Path -Recurse -File -ErrorAction SilentlyContinue |
    Measure-Object -Property Length -Sum).Sum / 1GB
Write-Success "terrafusion-marketplace complete: $([math]::Round($repo3Size, 2))GB"

Set-Location $SourceRepo

# Repository 4: terrafusion-infrastructure
Write-Header "Repository 4/4: terrafusion-infrastructure"

$repo4Path = Join-Path $OutputBase "terrafusion-infrastructure"
Write-Info "Creating terrafusion-infrastructure repository..."

Write-Info "Cloning source repository (no checkout - avoiding Windows path limits)..."
Write-Host "Running: git clone --no-checkout `"$SourceRepo`" `"$repo4Path`"" -ForegroundColor DarkGray
$cloneOutput = git clone --no-checkout "$SourceRepo" "$repo4Path" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Err "Failed to clone repository"
    Write-Host "Error output:" -ForegroundColor Red
    Write-Host $cloneOutput
    exit 1
}
Write-Success "Repository cloned (bare)"

# Extract infrastructure components
$pathsToKeep = @(
    "infrastructure/",
    "iac/",
    "deployment/",
    ".github/",
    "scripts/",
    "docker/",
    "helmfile/"
)

$success = Invoke-FilterRepo -RepoPath $repo4Path -PathsToKeep $pathsToKeep -RepoName "terrafusion-infrastructure"
if (-not $success) {
    Write-Err "Failed to extract terrafusion-infrastructure"
    exit 1
}

# Create README
Set-Location $repo4Path
@"
# TerraFusion Infrastructure

Infrastructure as Code (IaC) and deployment automation for TerraFusion platform.

## 🎯 Purpose

Automated deployment and infrastructure management for all TerraFusion components.

## 📦 Components

- **infrastructure/** - IaC definitions
- **iac/** - Infrastructure as Code
- **deployment/** - Deployment scripts and configurations
- **.github/** - CI/CD workflows
- **scripts/** - Automation scripts
- **docker/** - Container definitions
- **helmfile/** - Kubernetes Helm configurations

## 🚀 Getting Started

\`\`\`bash
# Deploy to Azure
cd infrastructure/azure
terraform init
terraform plan
terraform apply

# Deploy with Kubernetes
cd helmfile
helmfile sync
\`\`\`

## 🔧 Technologies

- Terraform - Infrastructure as Code
- Kubernetes - Container orchestration
- Helm - Kubernetes package manager
- Docker - Containerization
- GitHub Actions - CI/CD

---

**Part of the TerraFusion OS Platform**  
Extracted from monorepo: $((Get-Date).ToString('yyyy-MM-dd'))
"@ | Set-Content "README.md"

git add -A
git commit -m "Initialize terrafusion-infrastructure repository

Extracted from TerraFusion OS monorepo
Contains IaC, deployment scripts, and CI/CD

Components:
- Infrastructure definitions
- Deployment automation
- CI/CD workflows
- Container configurations

Extraction date: $((Get-Date).ToString('yyyy-MM-dd'))" 2>&1 | Out-Null

$repo4Size = (Get-ChildItem $repo4Path -Recurse -File -ErrorAction SilentlyContinue |
    Measure-Object -Property Length -Sum).Sum / 1MB
Write-Success "terrafusion-infrastructure complete: $([math]::Round($repo4Size, 2))MB"

Set-Location $SourceRepo

# Final Summary
Write-Header "Phase 3b Extraction Complete! 🎉"

Write-Host ""
Write-Success "All 4 repositories extracted successfully!"
Write-Host ""
Write-Status "Repository Sizes:" -color Cyan
Write-Status "  1. terrafusion-shared:          $([math]::Round($repo1Size, 2))MB" -color White
Write-Status "  2. terrafusion-os-core:         $([math]::Round($repo2Size, 2))GB" -color White
Write-Status "  3. terrafusion-marketplace:     $([math]::Round($repo3Size, 2))GB" -color White
Write-Status "  4. terrafusion-infrastructure:  $([math]::Round($repo4Size, 2))MB" -color White
Write-Host ""
Write-Status "Output location: $OutputBase" -color Gray
Write-Host ""

Write-Header "Next Steps"

Write-Host "1️⃣  Verify each repository:" -ForegroundColor Yellow
Write-Host "   cd $OutputBase\terrafusion-shared"
Write-Host "   git log --oneline -10"
Write-Host "   git count-objects -vH"
Write-Host ""
Write-Host "2️⃣  Push to GitHub:" -ForegroundColor Yellow
Write-Host "   cd $OutputBase\terrafusion-shared"
Write-Host "   gh repo create $GithubOrg/terrafusion-shared --public --source=. --remote=origin"
Write-Host "   git push -u origin main"
Write-Host ""
Write-Host "   Repeat for: terrafusion-os-core, terrafusion-marketplace, terrafusion-infrastructure"
Write-Host ""
Write-Host "3️⃣  Mark Phase 3b complete and commit progress" -ForegroundColor Yellow
Write-Host ""

Write-Success "Phase 3b extraction completed successfully! 🚀"

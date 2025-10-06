# Phase 3C: Module Extraction - PowerShell Native
# Extracts large modules/packages into focused repositories
# Based on proven Phase 3B approach

param(
    [string]$SourceRepo = "C:\Users\bsval\terrafusion_os_1.0",
    [string]$OutputBase = "C:\Temp\module-extraction",
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
Write-Host "║   TerraFusion Module Extraction - Phase 3C            ║" -ForegroundColor Cyan
Write-Host "║         PowerShell Native - Windows Edition            ║" -ForegroundColor Cyan
Write-Host "║       Module & Package Repository Extraction           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Step 1: Prerequisites (same checks as Phase 3B)
Write-Header "Step 1: Prerequisites Check"

Write-Info "Checking Git..."
try {
    $gitVer = git --version 2>&1
    Write-Success "Git: $gitVer"
} catch {
    Write-Err "Git not found!"
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
    Write-Err "git-filter-repo not accessible!"
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
Write-Status "              MODULE EXTRACTION PLAN                        " -color Yellow
Write-Status "═══════════════════════════════════════════════════════════" -color Yellow
Write-Host ""
Write-Status "Will extract 6 module repositories:" -color White
Write-Status "  1. terrafusion-shock-and-awe    (~1.77GB)" -color Cyan
Write-Status "     ├─ packages/shock-and-awe/" -color Gray
Write-Status "     └─ modules/shock-and-awe/" -color Gray
Write-Status "  2. terrafusion-docs             (~623MB)" -color Cyan
Write-Status "     └─ docs/" -color Gray
Write-Status "  3. terrafusion-government-modules (~36MB)" -color Cyan
Write-Status "     └─ modules/government-core/" -color Gray
Write-Status "  4. terrafusion-specialized-modules (~26MB)" -color Cyan
Write-Status "     └─ modules/specialized/" -color Gray
Write-Status "  5. terrafusion-commercial-modules (~14.6MB)" -color Cyan
Write-Status "     └─ modules/commercial/" -color Gray
Write-Status "  6. terrafusion-ai-modules       (~2.6MB)" -color Cyan
Write-Status "     ├─ modules/ai-systems/" -color Gray
Write-Status "     └─ modules/ai-command-brain/" -color Gray
Write-Host ""
Write-Status "Estimated time: 1-2 hours" -color Gray
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
    $PathsToKeep | Out-File -FilePath $pathsFile -Encoding utf8
    
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

# Repository 1: terrafusion-shock-and-awe
Write-Header "Repository 1/6: terrafusion-shock-and-awe"

$repo1Path = Join-Path $OutputBase "terrafusion-shock-and-awe"
Write-Info "Creating terrafusion-shock-and-awe repository..."

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

# Extract shock-and-awe
$pathsToKeep = @(
    "packages/shock-and-awe/",
    "modules/shock-and-awe/"
)

$success = Invoke-FilterRepo -RepoPath $repo1Path -PathsToKeep $pathsToKeep -RepoName "terrafusion-shock-and-awe"
if (-not $success) {
    Write-Err "Failed to extract terrafusion-shock-and-awe"
    exit 1
}

# Create README
Set-Location $repo1Path
@"
# TerraFusion Shock and Awe

Advanced UI/UX framework and demonstration platform.

## 🎯 Purpose

Shock and Awe provides cutting-edge UI components, animations, and demonstrations for TerraFusion applications.

## 📦 Components

- **packages/shock-and-awe/** - Main package with components
- **modules/shock-and-awe/** - Additional modules and integrations

## 🚀 Installation

\`\`\`bash
npm install @terrafusion/shock-and-awe
\`\`\`

## 📚 Documentation

See [docs/](./docs/) for detailed documentation.

---

Extracted from TerraFusion monorepo - Phase 3C
"@ | Out-File -FilePath "README.md" -Encoding utf8

git add README.md
git commit -m "docs: Add repository README" --no-verify
Set-Location $OutputBase

$repo1Size = [math]::Round((Get-ChildItem $repo1Path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
Write-Success "terrafusion-shock-and-awe complete: ${repo1Size}MB"

# Repository 2: terrafusion-docs
Write-Header "Repository 2/6: terrafusion-docs"

$repo2Path = Join-Path $OutputBase "terrafusion-docs"
Write-Info "Creating terrafusion-docs repository..."

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

# Extract docs
$pathsToKeep = @(
    "docs/"
)

$success = Invoke-FilterRepo -RepoPath $repo2Path -PathsToKeep $pathsToKeep -RepoName "terrafusion-docs"
if (-not $success) {
    Write-Err "Failed to extract terrafusion-docs"
    exit 1
}

# Create README
Set-Location $repo2Path
@"
# TerraFusion Documentation

Complete documentation for the TerraFusion platform.

## 📚 Contents

- Architecture guides
- API documentation  
- User guides
- Developer tutorials
- Deployment guides

## 🌐 View Documentation

Documentation is automatically built and published via GitHub Pages.

Visit: https://bsvalues.github.io/terrafusion-docs

## 🛠️ Building Locally

\`\`\`bash
npm install
npm run build
npm run serve
\`\`\`

---

Extracted from TerraFusion monorepo - Phase 3C
"@ | Out-File -FilePath "README.md" -Encoding utf8

git add README.md
git commit -m "docs: Add repository README" --no-verify
Set-Location $OutputBase

$repo2Size = [math]::Round((Get-ChildItem $repo2Path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
Write-Success "terrafusion-docs complete: ${repo2Size}MB"

# Repository 3: terrafusion-government-modules
Write-Header "Repository 3/6: terrafusion-government-modules"

$repo3Path = Join-Path $OutputBase "terrafusion-government-modules"
Write-Info "Creating terrafusion-government-modules repository..."

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

# Extract government modules
$pathsToKeep = @(
    "modules/government-core/"
)

$success = Invoke-FilterRepo -RepoPath $repo3Path -PathsToKeep $pathsToKeep -RepoName "terrafusion-government-modules"
if (-not $success) {
    Write-Err "Failed to extract terrafusion-government-modules"
    exit 1
}

# Create README
Set-Location $repo3Path
@"
# TerraFusion Government Modules

Government-specific modules and integrations for TerraFusion platform.

## 🏛️ Purpose

Provides government-specific functionality, compliance features, and integrations required for public sector deployments.

## 📦 Modules

- **government-core/** - Core government functionality

## 🔒 Compliance

These modules are designed to meet government compliance requirements including:
- NIST cybersecurity framework
- FedRAMP standards
- State/local government regulations

## 🚀 Installation

\`\`\`bash
npm install @terrafusion/government-modules
\`\`\`

---

Extracted from TerraFusion monorepo - Phase 3C
"@ | Out-File -FilePath "README.md" -Encoding utf8

git add README.md
git commit -m "docs: Add repository README" --no-verify
Set-Location $OutputBase

$repo3Size = [math]::Round((Get-ChildItem $repo3Path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
Write-Success "terrafusion-government-modules complete: ${repo3Size}MB"

# Repository 4: terrafusion-specialized-modules
Write-Header "Repository 4/6: terrafusion-specialized-modules"

$repo4Path = Join-Path $OutputBase "terrafusion-specialized-modules"
Write-Info "Creating terrafusion-specialized-modules repository..."

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

# Extract specialized modules
$pathsToKeep = @(
    "modules/specialized/"
)

$success = Invoke-FilterRepo -RepoPath $repo4Path -PathsToKeep $pathsToKeep -RepoName "terrafusion-specialized-modules"
if (-not $success) {
    Write-Err "Failed to extract terrafusion-specialized-modules"
    exit 1
}

# Create README
Set-Location $repo4Path
@"
# TerraFusion Specialized Modules

Industry-specific and specialized functionality modules.

## 🎯 Purpose

Provides specialized modules for specific industries and use cases beyond core platform functionality.

## 📦 Modules

- **specialized/** - Industry-specific modules and integrations

## 🚀 Installation

\`\`\`bash
npm install @terrafusion/specialized-modules
\`\`\`

---

Extracted from TerraFusion monorepo - Phase 3C
"@ | Out-File -FilePath "README.md" -Encoding utf8

git add README.md
git commit -m "docs: Add repository README" --no-verify
Set-Location $OutputBase

$repo4Size = [math]::Round((Get-ChildItem $repo4Path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
Write-Success "terrafusion-specialized-modules complete: ${repo4Size}MB"

# Repository 5: terrafusion-commercial-modules
Write-Header "Repository 5/6: terrafusion-commercial-modules"

$repo5Path = Join-Path $OutputBase "terrafusion-commercial-modules"
Write-Info "Creating terrafusion-commercial-modules repository..."

Write-Info "Cloning source repository (no checkout - avoiding Windows path limits)..."
Write-Host "Running: git clone --no-checkout `"$SourceRepo`" `"$repo5Path`"" -ForegroundColor DarkGray
$cloneOutput = git clone --no-checkout "$SourceRepo" "$repo5Path" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Err "Failed to clone repository"
    Write-Host "Error output:" -ForegroundColor Red
    Write-Host $cloneOutput
    exit 1
}
Write-Success "Repository cloned (bare)"

# Extract commercial modules
$pathsToKeep = @(
    "modules/commercial/"
)

$success = Invoke-FilterRepo -RepoPath $repo5Path -PathsToKeep $pathsToKeep -RepoName "terrafusion-commercial-modules"
if (-not $success) {
    Write-Err "Failed to extract terrafusion-commercial-modules"
    exit 1
}

# Create README
Set-Location $repo5Path
@"
# TerraFusion Commercial Modules

Commercial marketplace modules and integrations.

## 💼 Purpose

Provides commercial-specific functionality, licensing features, and marketplace integrations.

## 📦 Modules

- **commercial/** - Commercial marketplace modules

## 🚀 Installation

\`\`\`bash
npm install @terrafusion/commercial-modules
\`\`\`

---

Extracted from TerraFusion monorepo - Phase 3C
"@ | Out-File -FilePath "README.md" -Encoding utf8

git add README.md
git commit -m "docs: Add repository README" --no-verify
Set-Location $OutputBase

$repo5Size = [math]::Round((Get-ChildItem $repo5Path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
Write-Success "terrafusion-commercial-modules complete: ${repo5Size}MB"

# Repository 6: terrafusion-ai-modules
Write-Header "Repository 6/6: terrafusion-ai-modules"

$repo6Path = Join-Path $OutputBase "terrafusion-ai-modules"
Write-Info "Creating terrafusion-ai-modules repository..."

Write-Info "Cloning source repository (no checkout - avoiding Windows path limits)..."
Write-Host "Running: git clone --no-checkout `"$SourceRepo`" `"$repo6Path`"" -ForegroundColor DarkGray
$cloneOutput = git clone --no-checkout "$SourceRepo" "$repo6Path" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Err "Failed to clone repository"
    Write-Host "Error output:" -ForegroundColor Red
    Write-Host $cloneOutput
    exit 1
}
Write-Success "Repository cloned (bare)"

# Extract AI modules
$pathsToKeep = @(
    "modules/ai-systems/",
    "modules/ai-command-brain/"
)

$success = Invoke-FilterRepo -RepoPath $repo6Path -PathsToKeep $pathsToKeep -RepoName "terrafusion-ai-modules"
if (-not $success) {
    Write-Err "Failed to extract terrafusion-ai-modules"
    exit 1
}

# Create README
Set-Location $repo6Path
@"
# TerraFusion AI Modules

AI systems, machine learning, and intelligence modules for TerraFusion platform.

## 🤖 Purpose

Provides AI/ML functionality, intelligent agents, and machine learning integrations.

## 📦 Modules

- **ai-systems/** - Core AI systems and ML models
- **ai-command-brain/** - AI command and control intelligence

## 🧠 Features

- Machine learning models
- AI agent systems
- Intelligent automation
- Predictive analytics

## 🚀 Installation

\`\`\`bash
npm install @terrafusion/ai-modules
\`\`\`

---

Extracted from TerraFusion monorepo - Phase 3C
"@ | Out-File -FilePath "README.md" -Encoding utf8

git add README.md
git commit -m "docs: Add repository README" --no-verify
Set-Location $OutputBase

$repo6Size = [math]::Round((Get-ChildItem $repo6Path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
Write-Success "terrafusion-ai-modules complete: ${repo6Size}MB"

# Summary
Write-Header "Phase 3C Extraction Complete! 🎉"

Write-Host ""
Write-Success "All 6 module repositories extracted successfully!"
Write-Host ""
Write-Status "Repository Sizes:" -color White
Write-Status "  1. terrafusion-shock-and-awe:        ${repo1Size}MB" -color Cyan
Write-Status "  2. terrafusion-docs:                 ${repo2Size}MB" -color Cyan
Write-Status "  3. terrafusion-government-modules:   ${repo3Size}MB" -color Cyan
Write-Status "  4. terrafusion-specialized-modules:  ${repo4Size}MB" -color Cyan
Write-Status "  5. terrafusion-commercial-modules:   ${repo5Size}MB" -color Cyan
Write-Status "  6. terrafusion-ai-modules:           ${repo6Size}MB" -color Cyan
Write-Host ""
Write-Status "Output location: $OutputBase" -color White
Write-Host ""
Write-Host ""

Write-Header "Next Steps"
Write-Host ""
Write-Status "1️⃣  Verify each repository:" -color Yellow
Write-Status "   cd $OutputBase\terrafusion-shock-and-awe" -color Gray
Write-Status "   git log --oneline -10" -color Gray
Write-Status "   git count-objects -vH" -color Gray
Write-Host ""
Write-Status "2️⃣  Push to GitHub:" -color Yellow
Write-Status "   cd $OutputBase\terrafusion-shock-and-awe" -color Gray
Write-Status "   gh repo create $GithubOrg/terrafusion-shock-and-awe --public --source=. --remote=origin" -color Gray
Write-Status "   git push -u origin main" -color Gray
Write-Host ""
Write-Status "   Repeat for: terrafusion-docs, terrafusion-government-modules," -color Gray
Write-Status "   terrafusion-specialized-modules, terrafusion-commercial-modules, terrafusion-ai-modules" -color Gray
Write-Host ""
Write-Status "3️⃣  Mark Phase 3C complete and commit progress" -color Yellow
Write-Host ""

Write-Success "Phase 3C extraction completed successfully! 🚀"

# Extract Shock-and-Awe Demo Repository (OPTIONAL - Phase 3E)
# This is a separate demo repository, NOT part of core TerraFusion architecture
# Run this ONLY if you want to preserve shock-and-awe as a standalone demo

param(
    [switch]$Execute = $false
)

$ErrorActionPreference = "Stop"

Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "  PHASE 3E: Shock-and-Awe Demo Repository Extraction (OPTIONAL)" -ForegroundColor Magenta
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Magenta

Write-Host "⚠️  WARNING: This is OPTIONAL and separate from core architecture!" -ForegroundColor Yellow
Write-Host "   - Shock-and-awe is a demo/side project" -ForegroundColor Gray
Write-Host "   - Not required for core TerraFusion platform" -ForegroundColor Gray
Write-Host "   - Can be skipped or run later" -ForegroundColor Gray
Write-Host "   - Repo can be archived/deleted without affecting core`n" -ForegroundColor Gray

if (-not $Execute) {
    Write-Host "🛑 SIMULATION MODE" -ForegroundColor Cyan
    Write-Host "   Run with -Execute flag to actually perform extraction`n" -ForegroundColor Gray
}

# Configuration
$SourceRepo = $PWD.Path
$WorkspaceRoot = "C:\Temp\demo-extraction"
$RepoName = "terrafusion-shock-and-awe-demo"
$RepoPath = Join-Path $WorkspaceRoot $RepoName

# Paths to extract
$PathsToKeep = @(
    "packages/shock-and-awe/",
    "modules/shock-and-awe/"
)

Write-Host "📊 Extraction Details:" -ForegroundColor Yellow
Write-Host "   Source: $SourceRepo" -ForegroundColor Gray
Write-Host "   Target: $RepoPath" -ForegroundColor Gray
Write-Host "   Paths: $($PathsToKeep -join ', ')" -ForegroundColor Gray
Write-Host "   Size: ~1.77GB (18,000+ files)" -ForegroundColor Gray
Write-Host "   Time: ~30-45 minutes`n" -ForegroundColor Gray

if ($Execute) {
    Write-Host "🔄 Creating workspace..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Force -Path $WorkspaceRoot | Out-Null
    
    Write-Host "🔄 Cloning repository (bare, no checkout)..." -ForegroundColor Cyan
    git clone --no-checkout "$SourceRepo" "$RepoPath"
    
    Write-Host "🔄 Creating path filter file..." -ForegroundColor Cyan
    $pathsFile = Join-Path $WorkspaceRoot "shock-and-awe-paths.txt"
    $PathsToKeep | Out-File -FilePath $pathsFile -Encoding utf8
    
    Write-Host "🔄 Running git-filter-repo (this will take 30-45 min)..." -ForegroundColor Cyan
    Set-Location $RepoPath
    python -m git_filter_repo --force --paths-from-file $pathsFile
    
    Write-Host "🔄 Creating README.md..." -ForegroundColor Cyan
    $readme = @"
# TerraFusion Shock-and-Awe Demo

**Status:** 🎭 Demo/Showcase Repository (Archived)  
**Purpose:** Proof-of-concept, sales demos, experimental features  
**Maintenance:** Optional - not actively maintained

---

## ⚠️ Important Notice

This is a **DEMO REPOSITORY** separate from the core TerraFusion platform.

- **Not production code** - experimental/showcase only
- **Not maintained** - may become outdated
- **Archived status** - can be deleted without affecting core platform
- **Created:** Phase 3E (optional extraction)

---

## What is Shock-and-Awe?

A comprehensive demo/showcase project demonstrating TerraFusion capabilities.

**Size:** 1.77GB  
**Files:** 18,000+  
**Type:** Demo/POC/Showcase

---

## Repository Structure

- `packages/shock-and-awe/` - Main demo application package
- `modules/shock-and-awe/` - Supporting demo modules

---

## Status

This repository is **archived** and not part of active TerraFusion development.

For production TerraFusion code, see:
- [terrafusion-government-platform](https://github.com/bsvalues/terrafusion-government-platform)
- [terrafusion-commercial-platform](https://github.com/bsvalues/terrafusion-commercial-platform)
- [terrafusion-ai-platform](https://github.com/bsvalues/terrafusion-ai-platform)

---

**Extracted:** $(Get-Date -Format 'yyyy-MM-dd')  
**Source:** TerraFusion OS 1.0 Monorepo  
**Phase:** 3E (Optional Demo Extraction)
"@
    
    $readme | Out-File -FilePath "README.md" -Encoding utf8
    git add README.md
    git commit -m "Add demo repository README"
    
    Write-Host "`n✅ Shock-and-Awe demo repository extracted!" -ForegroundColor Green
    Write-Host "   Location: $RepoPath" -ForegroundColor Gray
    Write-Host "   Size: $(((Get-ChildItem $RepoPath -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1GB).ToString('F2')) GB`n" -ForegroundColor Gray
    
    Write-Host "🔄 Next Steps:" -ForegroundColor Yellow
    Write-Host "   1. Review extracted repository" -ForegroundColor Gray
    Write-Host "   2. (Optional) Create GitHub repo:" -ForegroundColor Gray
    Write-Host "      gh repo create bsvalues/terrafusion-shock-and-awe-demo --public --source=. --description='TerraFusion Demo/Showcase (Archived)'" -ForegroundColor DarkGray
    Write-Host "   3. (Optional) Push to GitHub:" -ForegroundColor Gray
    Write-Host "      git push -u origin main" -ForegroundColor DarkGray
    Write-Host "   4. (Optional) Archive repository on GitHub`n" -ForegroundColor Gray
    
} else {
    Write-Host "ℹ️  SIMULATION COMPLETE - No changes made" -ForegroundColor Cyan
    Write-Host "   Run again with -Execute flag to perform actual extraction`n" -ForegroundColor Gray
}

Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Magenta

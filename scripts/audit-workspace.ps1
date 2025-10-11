# 🔍 TERRAFUSION OS WORKSPACE AUDIT SCRIPT
# Phase 0: Current State Audit
# THE TERRAFUSION WAY - Know Everything Before Changing Anything

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🔍 TERRAFUSION OS - WORKSPACE CURRENT STATE AUDIT 🔍        ║" -ForegroundColor Cyan
Write-Host "║   Phase 0: Understanding What We Have                         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$auditPath = "AUDIT_REPORTS"
New-Item -ItemType Directory -Force -Path $auditPath | Out-Null

$reportFile = "$auditPath/WORKSPACE_AUDIT_$timestamp.txt"
$jsonReport = "$auditPath/WORKSPACE_AUDIT_$timestamp.json"

function Write-Report {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
    Add-Content -Path $reportFile -Value $Message
}

Write-Report "TERRAFUSION OS WORKSPACE AUDIT" "Cyan"
Write-Report "Generated: $(Get-Date)" "Gray"
Write-Report "Working Directory: $(Get-Location)" "Gray"
Write-Report "=" * 80 "Gray"
Write-Report ""

# =============================================================================
# SECTION 1: SCAN FOR ALL PACKAGE.JSON FILES
# =============================================================================

Write-Report "SECTION 1: PACKAGE.JSON INVENTORY" "Yellow"
Write-Report "-" * 80 "Gray"

Write-Host "  📦 Scanning for package.json files (excluding node_modules)..." -ForegroundColor Gray

$allPackages = Get-ChildItem -Path "." -Filter "package.json" -Recurse -ErrorAction SilentlyContinue | 
    Where-Object { 
        $_.FullName -notlike "*node_modules*" -and 
        $_.FullName -notlike "*dist*" -and
        $_.FullName -notlike "*build*" -and
        $_.FullName -notlike "*archive*" -and
        $_.FullName -notlike "*ARCHIVES*" -and
        $_.FullName -notlike "*.git*"
    }

Write-Report "  Total package.json files found: $($allPackages.Count)" "Green"
Write-Report ""

# Categorize by location
$categories = @{
    "src" = $allPackages | Where-Object { $_.FullName -like "*\src\*" }
    "modules" = $allPackages | Where-Object { $_.FullName -like "*\modules\*" }
    "backend" = $allPackages | Where-Object { $_.FullName -like "*terrafusion-backend*" }
    "shared" = $allPackages | Where-Object { $_.FullName -like "*terrafusion-shared*" }
    "cos" = $allPackages | Where-Object { $_.FullName -like "*terrafusion-cos*" }
    "other" = @()
}

# Find "other" packages
foreach ($pkg in $allPackages) {
    $foundCategory = $false
    foreach ($cat in $categories.Keys) {
        if ($cat -ne "other" -and $categories[$cat] -contains $pkg) {
            $foundCategory = $true
            break
        }
    }
    if (-not $foundCategory) {
        $categories["other"] += $pkg
    }
}

Write-Report "BREAKDOWN BY LOCATION:" "Cyan"
foreach ($cat in $categories.Keys | Sort-Object) {
    if ($cat -ne "other" -and $categories[$cat].Count -gt 0) {
        Write-Report "  $cat/: $($categories[$cat].Count) packages" "White"
    }
}
Write-Report "  other locations: $($categories["other"].Count) packages" "White"
Write-Report ""

# =============================================================================
# SECTION 2: DETAILED SRC/ ANALYSIS (Hot-Swappable Modules)
# =============================================================================

Write-Report "SECTION 2: SRC/ DIRECTORY ANALYSIS (Modules to Move)" "Yellow"
Write-Report "-" * 80 "Gray"

$srcPackages = $categories["src"]
Write-Report "  Found $($srcPackages.Count) packages in src/" "Green"
Write-Report ""

$srcModulesData = @()

foreach ($pkg in $srcPackages) {
    $relativePath = $pkg.Directory.FullName.Replace("$PWD\", "")
    $packageJson = Get-Content $pkg.FullName -Raw | ConvertFrom-Json
    
    $moduleInfo = [PSCustomObject]@{
        Name = $packageJson.name
        Version = $packageJson.version
        Path = $relativePath
        HasStartScript = $null -ne $packageJson.scripts.start
        HasDevScript = $null -ne $packageJson.scripts.dev
        HasBuildScript = $null -ne $packageJson.scripts.build
        StartCommand = $packageJson.scripts.start
        DevCommand = $packageJson.scripts.dev
        BuildCommand = $packageJson.scripts.build
    }
    
    $srcModulesData += $moduleInfo
    
    Write-Report "  📦 $($moduleInfo.Name)" "White"
    Write-Report "     Path: $relativePath" "Gray"
    Write-Report "     Version: $($moduleInfo.Version)" "Gray"
    if ($moduleInfo.HasStartScript) {
        Write-Report "     ✅ Start: $($moduleInfo.StartCommand)" "Green"
    } else {
        Write-Report "     ❌ No start script" "Red"
    }
    if ($moduleInfo.HasDevScript) {
        Write-Report "     ✅ Dev: $($moduleInfo.DevCommand)" "Green"
    }
    if ($moduleInfo.HasBuildScript) {
        Write-Report "     ✅ Build: $($moduleInfo.BuildCommand)" "Green"
    }
    Write-Report ""
}

# =============================================================================
# SECTION 3: MODULES/ DIRECTORY ANALYSIS (Existing Modules)
# =============================================================================

Write-Report "SECTION 3: MODULES/ DIRECTORY ANALYSIS (Existing Tier Structure)" "Yellow"
Write-Report "-" * 80 "Gray"

$modulesPackages = $categories["modules"]
Write-Report "  Found $($modulesPackages.Count) packages in modules/" "Green"
Write-Report ""

# Check for tier organization
$tiers = @{
    "TIER-1" = @()
    "TIER-2" = @()
    "TIER-3" = @()
    "TIER-4" = @()
    "TIER-5" = @()
    "ai-systems" = @()
    "government-core" = @()
    "commercial" = @()
    "infrastructure" = @()
    "specialized" = @()
    "other" = @()
}

foreach ($pkg in $modulesPackages) {
    $path = $pkg.Directory.FullName
    $categorized = $false
    
    foreach ($tier in $tiers.Keys) {
        if ($path -like "*$tier*") {
            $tiers[$tier] += $pkg
            $categorized = $true
            break
        }
    }
    
    if (-not $categorized) {
        $tiers["other"] += $pkg
    }
}

Write-Report "TIER BREAKDOWN:" "Cyan"
foreach ($tier in $tiers.Keys | Sort-Object) {
    if ($tiers[$tier].Count -gt 0) {
        $count = $tiers[$tier].Count
        Write-Report "  ${tier}: ${count} modules" "White"
    }
}
Write-Report ""

# =============================================================================
# SECTION 4: BACKEND & SHARED ANALYSIS
# =============================================================================

Write-Report "SECTION 4: SINGLE SOURCE OF TRUTH BACKEND" "Yellow"
Write-Report "-" * 80 "Gray"

$backendPackages = $categories["backend"]
if ($backendPackages.Count -gt 0) {
    Write-Report "  ✅ Found terrafusion-backend: $($backendPackages.Count) package(s)" "Green"
    foreach ($pkg in $backendPackages) {
        $relativePath = $pkg.Directory.FullName.Replace("$PWD\", "")
        Write-Report "     Path: $relativePath" "Gray"
    }
} else {
    Write-Report "  ⚠️  No terrafusion-backend packages found" "Yellow"
}
Write-Report ""

$sharedPackages = $categories["shared"]
if ($sharedPackages.Count -gt 0) {
    Write-Report "  ✅ Found terrafusion-shared: $($sharedPackages.Count) package(s)" "Green"
    foreach ($pkg in $sharedPackages) {
        $relativePath = $pkg.Directory.FullName.Replace("$PWD\", "")
        Write-Report "     Path: $relativePath" "Gray"
    }
} else {
    Write-Report "  ⚠️  No terrafusion-shared packages found" "Yellow"
}
Write-Report ""

# =============================================================================
# SECTION 5: WORKSPACE STRUCTURE SUMMARY
# =============================================================================

Write-Report "SECTION 5: WORKSPACE STRUCTURE SUMMARY" "Yellow"
Write-Report "-" * 80 "Gray"

Write-Report "CURRENT STATE:" "Cyan"
Write-Report "  Total Packages: $($allPackages.Count)" "White"
Write-Report "  Hot-Swappable Modules in src/ (TO MOVE): $($srcPackages.Count)" "Yellow"
Write-Report "  Existing Modules in modules/: $($modulesPackages.Count)" "Green"
Write-Report "  Backend Packages: $($backendPackages.Count)" "White"
Write-Report "  Shared Packages: $($sharedPackages.Count)" "White"
Write-Report ""

Write-Report "MODULES IN SRC/ TO MOVE:" "Cyan"
foreach ($mod in $srcModulesData) {
    $status = if ($mod.HasStartScript) { "✅" } else { "⚠️" }
    Write-Report "  $status $($mod.Name) - $($mod.Path)" "White"
}
Write-Report ""

# =============================================================================
# SECTION 6: RECOMMENDATIONS
# =============================================================================

Write-Report "SECTION 6: RECOMMENDATIONS" "Yellow"
Write-Report "-" * 80 "Gray"

Write-Report "RECOMMENDED ACTIONS:" "Cyan"
Write-Report "  1. Create tier directories in modules/ if not exist:" "White"
Write-Report "     - modules/TIER-1-ai-systems/" "Gray"
Write-Report "     - modules/TIER-2-government-core/" "Gray"
Write-Report "     - modules/TIER-3-commercial/" "Gray"
Write-Report "     - modules/TIER-4-infrastructure/" "Gray"
Write-Report "     - modules/TIER-5-specialized/" "Gray"
Write-Report "     - modules/demos/" "Gray"
Write-Report ""
Write-Report "  2. Move hot-swappable modules from src/ to appropriate tiers" "White"
Write-Report "  3. Keep only libraries in src/ (auth, database, ui-components, etc.)" "White"
Write-Report "  4. Test each module after moving" "White"
Write-Report "  5. Update module registry" "White"
Write-Report ""

# =============================================================================
# SECTION 7: SAVE JSON REPORT
# =============================================================================

$jsonData = @{
    Timestamp = $timestamp
    WorkingDirectory = "$PWD"
    TotalPackages = $allPackages.Count
    Categories = @{
        Src = $srcPackages.Count
        Modules = $modulesPackages.Count
        Backend = $backendPackages.Count
        Shared = $sharedPackages.Count
        Other = $categories["other"].Count
    }
    SrcModules = $srcModulesData
    TierBreakdown = @{}
}

foreach ($tier in $tiers.Keys) {
    $jsonData.TierBreakdown[$tier] = $tiers[$tier].Count
}

$jsonData | ConvertTo-Json -Depth 10 | Out-File -FilePath $jsonReport -Encoding UTF8

Write-Report "=" * 80 "Gray"
Write-Report "✅ AUDIT COMPLETE!" "Green"
Write-Report ""
Write-Report "Reports saved to:" "Cyan"
Write-Report "  Text Report: $reportFile" "White"
Write-Report "  JSON Report: $jsonReport" "White"
Write-Report ""
Write-Report "Next Steps: Review the report and proceed with Phase 1 (Module Selection System Design)" "Yellow"
Write-Report ""

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              ✅ PHASE 0 AUDIT COMPLETE! ✅                     ║" -ForegroundColor Green
Write-Host "║   Ready to proceed with workspace reorganization               ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📄 Review the reports in: $auditPath/" -ForegroundColor Cyan
Write-Host ""

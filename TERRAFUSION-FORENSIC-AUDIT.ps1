<#
.SYNOPSIS
    TerraFusion OS - Complete Forensic Audit System
    
.DESCRIPTION
    Comprehensive workspace analysis that reports ACTUAL state with ZERO assumptions.
    
    Scans:
    1. All C# projects (.csproj files) - what can compile
    2. All Node projects (package.json files) - what exists
    3. All Python projects (requirements.txt, setup.py) - what's installed
    4. Module ecosystem - actual count, structure
    5. Port usage - what services claim what ports
    6. Hardcoded paths - find all absolute paths in scripts
    7. Build validation - test what actually compiles
    8. Disk usage - where is the space
    9. Git status - what's tracked, what's ignored
    10. Tool inventory - what exists, what works
    
    Outputs JSON for machine processing + human-readable report.
    
.EXAMPLE
    .\TERRAFUSION-FORENSIC-AUDIT.ps1
    .\TERRAFUSION-FORENSIC-AUDIT.ps1 -SkipBuildTests
    .\TERRAFUSION-FORENSIC-AUDIT.ps1 -OutputPath "C:\audit-reports"
#>

param(
    [switch]$SkipBuildTests,        # Skip actual build compilation tests (faster)
    [switch]$DeepScan,              # Scan all subdirectories (slower, more thorough)
    [string]$OutputPath = "C:\Users\bsval\terrafusion_os_1.0\FORENSIC_REPORTS"
)

$ErrorActionPreference = "Continue"
$WorkspaceRoot = "C:\Users\bsval\terrafusion_os_1.0"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$ReportFile = Join-Path $OutputPath "FORENSIC-AUDIT-$Timestamp.json"
$ReadableReportFile = Join-Path $OutputPath "FORENSIC-AUDIT-$Timestamp.md"

# Create output directory
if (-not (Test-Path $OutputPath)) {
    New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
}

# ============================================================================
# AUDIT DATA STRUCTURE
# ============================================================================

$AuditData = @{
    Metadata = @{
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        WorkspaceRoot = $WorkspaceRoot
        AuditVersion = "1.0.0"
        MachineName = $env:COMPUTERNAME
        UserName = $env:USERNAME
    }
    CSharpProjects = @{
        Count = 0
        Projects = @()
        Buildable = @()
        Failed = @()
    }
    NodeProjects = @{
        Count = 0
        RootLevel = @()
        AllProjects = @()
        TotalPackageJsonFiles = 0
    }
    PythonProjects = @{
        Count = 0
        Projects = @()
        HasRequirements = @()
    }
    Modules = @{
        Categories = @()
        TotalModules = 0
        ModulesByCategory = @{}
        DetailedList = @()
    }
    Ports = @{
        ClaimedInCode = @{}
        CurrentlyListening = @()
    }
    HardcodedPaths = @{
        InScripts = @()
        InCode = @()
        TotalFound = 0
    }
    DiskUsage = @{
        TotalSize = 0
        LargeDirectories = @()
        NodeModulesCount = 0
        NodeModulesSize = 0
    }
    GitStatus = @{
        IsGitRepo = $false
        Branch = ""
        UntrackedFiles = 0
        ModifiedFiles = 0
        IgnoredPatterns = @()
    }
    Tools = @{
        Found = @()
        Broken = @()
        Working = @()
    }
    CoreServices = @{
        Backend = @{}
        Frontend = @{}
        NativeShell = @{}
        TerraFusionCOS = @{}
    }
    Issues = @()
    Recommendations = @()
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Write-AuditSection {
    param([string]$Title)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
}

function Write-Progress-Custom {
    param([string]$Activity, [string]$Status, [int]$PercentComplete)
    Write-Progress -Activity $Activity -Status $Status -PercentComplete $PercentComplete
}

function Get-DirectorySize {
    param([string]$Path)
    try {
        $size = (Get-ChildItem -Path $Path -Recurse -File -ErrorAction SilentlyContinue | 
                 Measure-Object -Property Length -Sum).Sum
        return [math]::Round($size / 1MB, 2)
    } catch {
        return 0
    }
}

function Test-PortListening {
    param([int]$Port)
    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        return ($null -ne $connections)
    } catch {
        return $false
    }
}

# ============================================================================
# AUDIT EXECUTION
# ============================================================================

Clear-Host
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║              TERRAFUSION OS - FORENSIC AUDIT SYSTEM                          ║" -ForegroundColor Yellow
Write-Host "║                      COMPLETE WORKSPACE ANALYSIS                             ║" -ForegroundColor Yellow
Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔬 Starting comprehensive audit at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "📂 Workspace: $WorkspaceRoot" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# 1. SCAN C# PROJECTS
# ============================================================================

Write-AuditSection "1/10 Scanning C# Projects (.csproj files)"
Write-Progress-Custom -Activity "Forensic Audit" -Status "Scanning C# projects..." -PercentComplete 10

$csprojFiles = Get-ChildItem -Path $WorkspaceRoot -Filter "*.csproj" -Recurse -ErrorAction SilentlyContinue

$AuditData.CSharpProjects.Count = $csprojFiles.Count

foreach ($csproj in $csprojFiles) {
    $projectInfo = @{
        Name = $csproj.BaseName
        Path = $csproj.FullName
        RelativePath = $csproj.FullName.Replace($WorkspaceRoot, "").TrimStart('\')
        Directory = $csproj.Directory.FullName
        SizeMB = [math]::Round($csproj.Length / 1KB, 2)
    }
    
    # Test if it builds (if not skipped)
    if (-not $SkipBuildTests) {
        Write-Host "  Testing build: $($csproj.BaseName)..." -NoNewline
        try {
            $buildOutput = & dotnet build $csproj.FullName --nologo --verbosity quiet 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host " ✅" -ForegroundColor Green
                $projectInfo.BuildStatus = "Success"
                $AuditData.CSharpProjects.Buildable += $projectInfo
            } else {
                Write-Host " ❌" -ForegroundColor Red
                $projectInfo.BuildStatus = "Failed"
                $projectInfo.BuildError = $buildOutput -join "`n"
                $AuditData.CSharpProjects.Failed += $projectInfo
            }
        } catch {
            Write-Host " ⚠️" -ForegroundColor Yellow
            $projectInfo.BuildStatus = "Error"
            $projectInfo.BuildError = $_.Exception.Message
            $AuditData.CSharpProjects.Failed += $projectInfo
        }
    } else {
        $projectInfo.BuildStatus = "Not Tested"
    }
    
    $AuditData.CSharpProjects.Projects += $projectInfo
}

Write-Host "  Found: $($AuditData.CSharpProjects.Count) C# projects" -ForegroundColor Green
if (-not $SkipBuildTests) {
    Write-Host "  Buildable: $($AuditData.CSharpProjects.Buildable.Count)" -ForegroundColor Green
    Write-Host "  Failed: $($AuditData.CSharpProjects.Failed.Count)" -ForegroundColor $(if ($AuditData.CSharpProjects.Failed.Count -gt 0) { "Red" } else { "Green" })
}

# ============================================================================
# 2. SCAN NODE PROJECTS
# ============================================================================

Write-AuditSection "2/10 Scanning Node Projects (package.json files)"
Write-Progress-Custom -Activity "Forensic Audit" -Status "Scanning Node projects..." -PercentComplete 20

$packageJsonFiles = Get-ChildItem -Path $WorkspaceRoot -Filter "package.json" -Recurse -ErrorAction SilentlyContinue

$AuditData.NodeProjects.TotalPackageJsonFiles = $packageJsonFiles.Count

# Root level projects
$rootLevelProjects = $packageJsonFiles | Where-Object { 
    $_.Directory.FullName -eq $WorkspaceRoot -or
    (Split-Path $_.Directory.FullName -Parent) -eq $WorkspaceRoot
}

foreach ($pkg in $rootLevelProjects) {
    try {
        $content = Get-Content $pkg.FullName -Raw | ConvertFrom-Json
        $AuditData.NodeProjects.RootLevel += @{
            Name = $content.name
            Version = $content.version
            Path = $pkg.FullName
            RelativePath = $pkg.FullName.Replace($WorkspaceRoot, "").TrimStart('\')
            HasScripts = ($null -ne $content.scripts)
            ScriptCount = if ($content.scripts) { ($content.scripts | Get-Member -MemberType NoteProperty).Count } else { 0 }
        }
    } catch {
        $AuditData.Issues += "Failed to parse package.json: $($pkg.FullName)"
    }
}

$AuditData.NodeProjects.Count = $rootLevelProjects.Count

Write-Host "  Total package.json files: $($AuditData.NodeProjects.TotalPackageJsonFiles)" -ForegroundColor Yellow
Write-Host "  Root-level projects: $($AuditData.NodeProjects.Count)" -ForegroundColor Green

# ============================================================================
# 3. SCAN PYTHON PROJECTS
# ============================================================================

Write-AuditSection "3/10 Scanning Python Projects"
Write-Progress-Custom -Activity "Forensic Audit" -Status "Scanning Python projects..." -PercentComplete 30

$requirementFiles = Get-ChildItem -Path $WorkspaceRoot -Filter "requirements.txt" -Recurse -ErrorAction SilentlyContinue
$setupPyFiles = Get-ChildItem -Path $WorkspaceRoot -Filter "setup.py" -Recurse -ErrorAction SilentlyContinue

foreach ($req in $requirementFiles) {
    $AuditData.PythonProjects.HasRequirements += @{
        Path = $req.FullName
        RelativePath = $req.FullName.Replace($WorkspaceRoot, "").TrimStart('\')
        Directory = $req.Directory.Name
    }
}

$AuditData.PythonProjects.Count = $requirementFiles.Count + $setupPyFiles.Count

Write-Host "  Found: $($requirementFiles.Count) requirements.txt files" -ForegroundColor Green
Write-Host "  Found: $($setupPyFiles.Count) setup.py files" -ForegroundColor Green

# ============================================================================
# 4. SCAN MODULE ECOSYSTEM
# ============================================================================

Write-AuditSection "4/10 Scanning Module Ecosystem"
Write-Progress-Custom -Activity "Forensic Audit" -Status "Scanning modules..." -PercentComplete 40

$modulesPath = Join-Path $WorkspaceRoot "modules"

if (Test-Path $modulesPath) {
    $categories = Get-ChildItem -Path $modulesPath -Directory -ErrorAction SilentlyContinue
    
    foreach ($category in $categories) {
        $AuditData.Modules.Categories += $category.Name
        
        # Find modules in this category (with package.json)
        $modulesInCategory = Get-ChildItem -Path $category.FullName -Filter "package.json" -Recurse -ErrorAction SilentlyContinue
        
        $categoryModules = @()
        foreach ($modulePackage in $modulesInCategory) {
            try {
                $content = Get-Content $modulePackage.FullName -Raw | ConvertFrom-Json
                $moduleInfo = @{
                    Name = $content.name
                    Category = $category.Name
                    Path = $modulePackage.Directory.FullName
                    RelativePath = $modulePackage.Directory.FullName.Replace($WorkspaceRoot, "").TrimStart('\')
                    Version = $content.version
                    HasScripts = ($null -ne $content.scripts)
                }
                $categoryModules += $moduleInfo
                $AuditData.Modules.DetailedList += $moduleInfo
            } catch {
                # Skip invalid package.json
            }
        }
        
        $AuditData.Modules.ModulesByCategory[$category.Name] = $categoryModules.Count
        $AuditData.Modules.TotalModules += $categoryModules.Count
    }
    
    Write-Host "  Categories: $($AuditData.Modules.Categories.Count)" -ForegroundColor Green
    Write-Host "  Total Modules: $($AuditData.Modules.TotalModules)" -ForegroundColor Green
    
    foreach ($cat in ($AuditData.Modules.ModulesByCategory.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 10)) {
        Write-Host "    $($cat.Key): $($cat.Value) modules" -ForegroundColor White
    }
} else {
    Write-Host "  ⚠️  modules/ directory not found" -ForegroundColor Yellow
}

# ============================================================================
# 5. SCAN PORT USAGE
# ============================================================================

Write-AuditSection "5/10 Scanning Port Usage"
Write-Progress-Custom -Activity "Forensic Audit" -Status "Scanning ports..." -PercentComplete 50

# Common ports to check
$commonPorts = @(3000, 3001, 3002, 5000, 5001, 8080, 8090, 5432, 6379)

foreach ($port in $commonPorts) {
    $listening = Test-PortListening -Port $port
    if ($listening) {
        $AuditData.Ports.CurrentlyListening += @{
            Port = $port
            Status = "LISTENING"
        }
        Write-Host "  Port $port : LISTENING ✅" -ForegroundColor Green
    }
}

# Scan code for port references
$portPatterns = @(
    "localhost:(\d+)",
    ":(\d{4,5})",
    "PORT.*?(\d+)",
    "port.*?(\d+)"
)

Write-Host "  Scanning for port references in code..." -ForegroundColor Cyan

# Sample key files for port scanning
$configFiles = @(
    (Join-Path $WorkspaceRoot "backend\TerraFusion.API\appsettings.json"),
    (Join-Path $WorkspaceRoot "frontend\vite.config.ts"),
    (Join-Path $WorkspaceRoot "frontend\package.json"),
    (Join-Path $WorkspaceRoot "docker-compose.yml")
)

foreach ($file in $configFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
        if ($content -match '(\d{4,5})') {
            # Extract potential ports
            $matches | ForEach-Object {
                $port = $_.Groups[1].Value
                if ($port -as [int] -and $port -ge 1000 -and $port -le 65535) {
                    if (-not $AuditData.Ports.ClaimedInCode.ContainsKey($port)) {
                        $AuditData.Ports.ClaimedInCode[$port] = @()
                    }
                    $AuditData.Ports.ClaimedInCode[$port] += $file
                }
            }
        }
    }
}

# ============================================================================
# 6. SCAN HARDCODED PATHS
# ============================================================================

Write-AuditSection "6/10 Scanning Hardcoded Paths"
Write-Progress-Custom -Activity "Forensic Audit" -Status "Scanning hardcoded paths..." -PercentComplete 60

$pathPattern = 'C:\\Users\\[^"''`\s]+'

# Scan PowerShell scripts
$psScripts = Get-ChildItem -Path $WorkspaceRoot -Filter "*.ps1" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 50

foreach ($script in $psScripts) {
    $content = Get-Content $script.FullName -Raw -ErrorAction SilentlyContinue
    $matches = [regex]::Matches($content, $pathPattern)
    
    foreach ($match in $matches) {
        $AuditData.HardcodedPaths.InScripts += @{
            File = $script.FullName.Replace($WorkspaceRoot, "").TrimStart('\')
            Path = $match.Value
        }
    }
}

$AuditData.HardcodedPaths.TotalFound = $AuditData.HardcodedPaths.InScripts.Count

Write-Host "  Found $($AuditData.HardcodedPaths.TotalFound) hardcoded paths in scripts" -ForegroundColor $(if ($AuditData.HardcodedPaths.TotalFound -gt 50) { "Yellow" } else { "Green" })

# ============================================================================
# 7. DISK USAGE ANALYSIS
# ============================================================================

Write-AuditSection "7/10 Analyzing Disk Usage"
Write-Progress-Custom -Activity "Forensic Audit" -Status "Analyzing disk usage..." -PercentComplete 70

# Find large directories
$topLevelDirs = Get-ChildItem -Path $WorkspaceRoot -Directory -ErrorAction SilentlyContinue

foreach ($dir in $topLevelDirs) {
    Write-Host "  Measuring: $($dir.Name)..." -NoNewline
    $size = Get-DirectorySize -Path $dir.FullName
    Write-Host " $size MB" -ForegroundColor Cyan
    
    $AuditData.DiskUsage.LargeDirectories += @{
        Name = $dir.Name
        SizeMB = $size
    }
    $AuditData.DiskUsage.TotalSize += $size
}

# Count node_modules
$nodeModulesDirs = Get-ChildItem -Path $WorkspaceRoot -Directory -Filter "node_modules" -Recurse -ErrorAction SilentlyContinue
$AuditData.DiskUsage.NodeModulesCount = $nodeModulesDirs.Count

foreach ($nm in $nodeModulesDirs) {
    $size = Get-DirectorySize -Path $nm.FullName
    $AuditData.DiskUsage.NodeModulesSize += $size
}

Write-Host "  Total workspace size: $([math]::Round($AuditData.DiskUsage.TotalSize, 2)) MB" -ForegroundColor Yellow
Write-Host "  node_modules found: $($AuditData.DiskUsage.NodeModulesCount)" -ForegroundColor Yellow
Write-Host "  node_modules size: $([math]::Round($AuditData.DiskUsage.NodeModulesSize, 2)) MB" -ForegroundColor Yellow

# ============================================================================
# 8. GIT STATUS
# ============================================================================

Write-AuditSection "8/10 Checking Git Status"
Write-Progress-Custom -Activity "Forensic Audit" -Status "Checking git status..." -PercentComplete 80

try {
    Push-Location $WorkspaceRoot
    
    $gitBranch = git branch --show-current 2>&1
    if ($LASTEXITCODE -eq 0) {
        $AuditData.GitStatus.IsGitRepo = $true
        $AuditData.GitStatus.Branch = $gitBranch
        
        $untracked = (git ls-files --others --exclude-standard 2>&1).Count
        $modified = (git diff --name-only 2>&1).Count
        
        $AuditData.GitStatus.UntrackedFiles = $untracked
        $AuditData.GitStatus.ModifiedFiles = $modified
        
        Write-Host "  Git repository: YES ✅" -ForegroundColor Green
        Write-Host "  Branch: $gitBranch" -ForegroundColor Cyan
        Write-Host "  Untracked files: $untracked" -ForegroundColor Yellow
        Write-Host "  Modified files: $modified" -ForegroundColor Yellow
    } else {
        $AuditData.GitStatus.IsGitRepo = $false
        Write-Host "  Git repository: NO ❌" -ForegroundColor Red
    }
    
    # Check .gitignore
    $gitignorePath = Join-Path $WorkspaceRoot ".gitignore"
    if (Test-Path $gitignorePath) {
        $ignorePatterns = Get-Content $gitignorePath | Where-Object { $_ -and -not $_.StartsWith("#") }
        $AuditData.GitStatus.IgnoredPatterns = $ignorePatterns
        Write-Host "  .gitignore rules: $($ignorePatterns.Count)" -ForegroundColor Green
    }
    
    Pop-Location
} catch {
    $AuditData.GitStatus.IsGitRepo = $false
    Write-Host "  Git repository: ERROR ⚠️" -ForegroundColor Yellow
    Pop-Location
}

# ============================================================================
# 9. TOOL INVENTORY
# ============================================================================

Write-AuditSection "9/10 Inventorying Tools"
Write-Progress-Custom -Activity "Forensic Audit" -Status "Inventorying tools..." -PercentComplete 90

$knownTools = @(
    @{ Name = "workspace-explorer"; Path = "workspace-explorer"; TestFile = "package.json" },
    @{ Name = "terrafusion-atlas"; Path = "terrafusion-atlas"; TestFile = "ATLAS.json" },
    @{ Name = "start-everything.ps1"; Path = "scripts"; TestFile = "start-everything.ps1" },
    @{ Name = "validate-workspace.ps1"; Path = "scripts"; TestFile = "validate-workspace.ps1" },
    @{ Name = "START-TERRAFUSION-FIXED.ps1"; Path = "."; TestFile = "START-TERRAFUSION-FIXED.ps1" }
)

foreach ($tool in $knownTools) {
    $fullPath = Join-Path $WorkspaceRoot (Join-Path $tool.Path $tool.TestFile)
    if (Test-Path $fullPath) {
        $AuditData.Tools.Found += @{
            Name = $tool.Name
            Path = $fullPath.Replace($WorkspaceRoot, "").TrimStart('\')
            Status = "Found"
        }
        Write-Host "  ✅ $($tool.Name)" -ForegroundColor Green
    } else {
        $AuditData.Tools.Broken += @{
            Name = $tool.Name
            Path = $fullPath.Replace($WorkspaceRoot, "").TrimStart('\')
            Status = "Missing"
        }
        Write-Host "  ❌ $($tool.Name) - NOT FOUND" -ForegroundColor Red
    }
}

# ============================================================================
# 10. CORE SERVICES VALIDATION
# ============================================================================

Write-AuditSection "10/10 Validating Core Services"
Write-Progress-Custom -Activity "Forensic Audit" -Status "Validating core services..." -PercentComplete 100

# Backend
$backendPath = Join-Path $WorkspaceRoot "backend\TerraFusion.API"
$AuditData.CoreServices.Backend = @{
    Exists = (Test-Path $backendPath)
    Path = $backendPath
    HasCsproj = (Test-Path (Join-Path $backendPath "TerraFusion.API.csproj"))
    ExpectedPort = 5000
    PortListening = (Test-PortListening -Port 5000)
}
Write-Host "  Backend: $(if ($AuditData.CoreServices.Backend.Exists) { '✅ EXISTS' } else { '❌ MISSING' })" -ForegroundColor $(if ($AuditData.CoreServices.Backend.Exists) { "Green" } else { "Red" })

# Frontend
$frontendPath = Join-Path $WorkspaceRoot "frontend"
$AuditData.CoreServices.Frontend = @{
    Exists = (Test-Path $frontendPath)
    Path = $frontendPath
    HasPackageJson = (Test-Path (Join-Path $frontendPath "package.json"))
    ExpectedPort = 3000
    PortListening = (Test-PortListening -Port 3000)
}
Write-Host "  Frontend: $(if ($AuditData.CoreServices.Frontend.Exists) { '✅ EXISTS' } else { '❌ MISSING' })" -ForegroundColor $(if ($AuditData.CoreServices.Frontend.Exists) { "Green" } else { "Red" })

# Native Shell
$nativeShellPath = Join-Path $WorkspaceRoot "native-shell"
$AuditData.CoreServices.NativeShell = @{
    Exists = (Test-Path $nativeShellPath)
    Path = $nativeShellPath
    HasCsproj = (Test-Path (Join-Path $nativeShellPath "TerraFusion.Shell.csproj"))
}
Write-Host "  Native Shell: $(if ($AuditData.CoreServices.NativeShell.Exists) { '✅ EXISTS' } else { '❌ MISSING' })" -ForegroundColor $(if ($AuditData.CoreServices.NativeShell.Exists) { "Green" } else { "Red" })

# TerraFusion cOS
$cosPath = Join-Path $WorkspaceRoot "terrafusion-cos"
$AuditData.CoreServices.TerraFusionCOS = @{
    Exists = (Test-Path $cosPath)
    Path = $cosPath
    HasApiServer = (Test-Path (Join-Path $cosPath "api_server.py"))
    ExpectedPort = 8090
    PortListening = (Test-PortListening -Port 8090)
}
Write-Host "  TerraFusion cOS: $(if ($AuditData.CoreServices.TerraFusionCOS.Exists) { '✅ EXISTS' } else { '❌ MISSING' })" -ForegroundColor $(if ($AuditData.CoreServices.TerraFusionCOS.Exists) { "Green" } else { "Red" })

# ============================================================================
# GENERATE RECOMMENDATIONS
# ============================================================================

Write-AuditSection "Generating Recommendations"

# Critical issues
if ($AuditData.DiskUsage.NodeModulesCount -gt 5) {
    $AuditData.Recommendations += "CRITICAL: $($AuditData.DiskUsage.NodeModulesCount) node_modules directories found. Consider consolidating dependencies."
    $AuditData.Issues += "Multiple node_modules ($($AuditData.DiskUsage.NodeModulesCount) copies) consuming $([math]::Round($AuditData.DiskUsage.NodeModulesSize, 2)) MB"
}

if ($AuditData.NodeProjects.TotalPackageJsonFiles -gt 100) {
    $AuditData.Recommendations += "WARNING: $($AuditData.NodeProjects.TotalPackageJsonFiles) package.json files found. Workspace may need restructuring."
    $AuditData.Issues += "Excessive package.json files ($($AuditData.NodeProjects.TotalPackageJsonFiles)) indicates possible duplicate projects"
}

if ($AuditData.HardcodedPaths.TotalFound -gt 20) {
    $AuditData.Recommendations += "HIGH: $($AuditData.HardcodedPaths.TotalFound) hardcoded paths found. Scripts need path parameterization."
    $AuditData.Issues += "Hardcoded paths ($($AuditData.HardcodedPaths.TotalFound)) make workspace non-portable"
}

if (-not $AuditData.CoreServices.Backend.PortListening -and $AuditData.CoreServices.Backend.Exists) {
    $AuditData.Recommendations += "CRITICAL: Backend exists but not listening on port 5000. Build or runtime issue."
    $AuditData.Issues += "Backend service not running despite existing at $($AuditData.CoreServices.Backend.Path)"
}

if (-not $SkipBuildTests -and $AuditData.CSharpProjects.Failed.Count -gt 0) {
    $AuditData.Recommendations += "HIGH: $($AuditData.CSharpProjects.Failed.Count) C# projects failed to build. Review build errors."
    $AuditData.Issues += "$($AuditData.CSharpProjects.Failed.Count) C# projects have build failures"
}

# ============================================================================
# SAVE REPORTS
# ============================================================================

Write-AuditSection "Saving Reports"

# Save JSON
$AuditData | ConvertTo-Json -Depth 10 | Out-File $ReportFile -Encoding UTF8
Write-Host "  ✅ JSON report saved: $ReportFile" -ForegroundColor Green

# Generate human-readable Markdown report
$markdown = @"
# TerraFusion OS - Forensic Audit Report

**Generated:** $($AuditData.Metadata.Timestamp)  
**Workspace:** $($AuditData.Metadata.WorkspaceRoot)  
**Machine:** $($AuditData.Metadata.MachineName)

---

## Executive Summary

| Metric | Count |
|--------|-------|
| C# Projects | $($AuditData.CSharpProjects.Count) |
| Node Projects (Root) | $($AuditData.NodeProjects.Count) |
| Total package.json Files | $($AuditData.NodeProjects.TotalPackageJsonFiles) |
| Python Projects | $($AuditData.PythonProjects.Count) |
| Module Categories | $($AuditData.Modules.Categories.Count) |
| Total Modules | $($AuditData.Modules.TotalModules) |
| Hardcoded Paths | $($AuditData.HardcodedPaths.TotalFound) |
| node_modules Copies | $($AuditData.DiskUsage.NodeModulesCount) |
| Total Disk Usage | $([math]::Round($AuditData.DiskUsage.TotalSize, 2)) MB |

---

## Critical Issues ($($AuditData.Issues.Count))

$(if ($AuditData.Issues.Count -gt 0) {
    $AuditData.Issues | ForEach-Object { "- ❌ $_`n" }
} else {
    "✅ No critical issues detected!"
})

---

## Recommendations ($($AuditData.Recommendations.Count))

$(if ($AuditData.Recommendations.Count -gt 0) {
    $AuditData.Recommendations | ForEach-Object { "- 💡 $_`n" }
} else {
    "✅ Workspace is in good shape!"
})

---

## Core Services Status

| Service | Exists | Port | Listening |
|---------|--------|------|-----------|
| Backend API | $(if ($AuditData.CoreServices.Backend.Exists) { '✅' } else { '❌' }) | $($AuditData.CoreServices.Backend.ExpectedPort) | $(if ($AuditData.CoreServices.Backend.PortListening) { '✅' } else { '❌' }) |
| Frontend | $(if ($AuditData.CoreServices.Frontend.Exists) { '✅' } else { '❌' }) | $($AuditData.CoreServices.Frontend.ExpectedPort) | $(if ($AuditData.CoreServices.Frontend.PortListening) { '✅' } else { '❌' }) |
| Native Shell | $(if ($AuditData.CoreServices.NativeShell.Exists) { '✅' } else { '❌' }) | N/A | N/A |
| TerraFusion cOS | $(if ($AuditData.CoreServices.TerraFusionCOS.Exists) { '✅' } else { '❌' }) | $($AuditData.CoreServices.TerraFusionCOS.ExpectedPort) | $(if ($AuditData.CoreServices.TerraFusionCOS.PortListening) { '✅' } else { '❌' }) |

---

## Module Ecosystem

**Total Categories:** $($AuditData.Modules.Categories.Count)  
**Total Modules:** $($AuditData.Modules.TotalModules)

### Top Module Categories

$(
$AuditData.Modules.ModulesByCategory.GetEnumerator() | 
Sort-Object Value -Descending | 
Select-Object -First 10 | 
ForEach-Object { "- **$($_.Key)**: $($_.Value) modules`n" }
)

---

## Disk Usage Analysis

**Total Workspace Size:** $([math]::Round($AuditData.DiskUsage.TotalSize, 2)) MB  
**node_modules Count:** $($AuditData.DiskUsage.NodeModulesCount)  
**node_modules Size:** $([math]::Round($AuditData.DiskUsage.NodeModulesSize, 2)) MB

### Largest Directories (Top 10)

$(
$AuditData.DiskUsage.LargeDirectories | 
Sort-Object SizeMB -Descending | 
Select-Object -First 10 | 
ForEach-Object { "- **$($_.Name)**: $([math]::Round($_.SizeMB, 2)) MB`n" }
)

---

## Git Status

- **Is Git Repo:** $(if ($AuditData.GitStatus.IsGitRepo) { 'YES ✅' } else { 'NO ❌' })
- **Branch:** $($AuditData.GitStatus.Branch)
- **Untracked Files:** $($AuditData.GitStatus.UntrackedFiles)
- **Modified Files:** $($AuditData.GitStatus.ModifiedFiles)
- **.gitignore Rules:** $($AuditData.GitStatus.IgnoredPatterns.Count)

---

## Next Steps

1. Review critical issues above
2. Address recommendations in priority order
3. Re-run audit after making changes
4. Use JSON output for automated processing

**Full JSON Report:** ``$ReportFile``

"@

$markdown | Out-File $ReadableReportFile -Encoding UTF8
Write-Host "  ✅ Markdown report saved: $ReadableReportFile" -ForegroundColor Green

# ============================================================================
# COMPLETION
# ============================================================================

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    FORENSIC AUDIT COMPLETE ✅                                ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "  • C# Projects: $($AuditData.CSharpProjects.Count)" -ForegroundColor White
Write-Host "  • Node Projects: $($AuditData.NodeProjects.Count) (Total package.json: $($AuditData.NodeProjects.TotalPackageJsonFiles))" -ForegroundColor White
Write-Host "  • Modules: $($AuditData.Modules.TotalModules) across $($AuditData.Modules.Categories.Count) categories" -ForegroundColor White
Write-Host "  • Issues Found: $($AuditData.Issues.Count)" -ForegroundColor $(if ($AuditData.Issues.Count -gt 0) { "Yellow" } else { "Green" })
Write-Host "  • Recommendations: $($AuditData.Recommendations.Count)" -ForegroundColor Cyan
Write-Host ""
Write-Host "📄 Reports Generated:" -ForegroundColor Cyan
Write-Host "  • JSON: $ReportFile" -ForegroundColor White
Write-Host "  • Markdown: $ReadableReportFile" -ForegroundColor White
Write-Host ""
Write-Host "💡 Next: Review the markdown report for human-readable analysis" -ForegroundColor Yellow
Write-Host ""

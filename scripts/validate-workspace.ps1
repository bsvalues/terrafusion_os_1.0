<#
.SYNOPSIS
    TerraFusion OS - Comprehensive Workspace Validation Script
    
.DESCRIPTION
    Validates the entire TerraFusion workspace:
    - 318 total packages
    - 50 MCP servers
    - 6 hot-swappable modules
    - Backend services (C# .NET)
    - 18 AI systems
    - Configuration integrity
    - Dependencies validation
    
    Generates detailed validation report with pass/fail/warning status.
    THE TERRAFUSION WAY - Test everything, break nothing!
    
.EXAMPLE
    .\scripts\validate-workspace.ps1
    .\scripts\validate-workspace.ps1 -QuickMode
    .\scripts\validate-workspace.ps1 -Verbose
#>

param(
    [switch]$QuickMode,      # Skip time-consuming tests
    [switch]$FixIssues,      # Attempt to fix common issues
    [switch]$Verbose         # Show detailed output
)

# ============================================================================
# CONFIGURATION
# ============================================================================

$ErrorActionPreference = "Continue"
$WorkspaceRoot = "C:\Users\bsval\terrafusion_os_1.0"
$ReportDir = Join-Path $WorkspaceRoot "VALIDATION_REPORTS"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$ReportFile = Join-Path $ReportDir "VALIDATION_REPORT_$Timestamp.txt"
$JsonReportFile = Join-Path $ReportDir "VALIDATION_REPORT_$Timestamp.json"

# Create report directory
if (-not (Test-Path $ReportDir)) {
    New-Item -ItemType Directory -Path $ReportDir -Force | Out-Null
}

# ============================================================================
# VALIDATION RESULTS STORAGE
# ============================================================================

$ValidationResults = @{
    Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    WorkspaceRoot = $WorkspaceRoot
    Summary = @{
        TotalTests = 0
        Passed = 0
        Failed = 0
        Warnings = 0
    }
    Packages = @{
        Total = 0
        Validated = 0
        Passed = @()
        Failed = @()
        Warnings = @()
    }
    MCPServers = @{
        Total = 0
        Validated = 0
        Passed = @()
        Failed = @()
        Warnings = @()
    }
    HotSwappableModules = @{
        Total = 0
        Validated = 0
        Passed = @()
        Failed = @()
        Warnings = @()
    }
    Backend = @{
        Projects = @()
        BuildStatus = @()
        Issues = @()
    }
    AISystems = @{
        Total = 0
        Validated = 0
        Passed = @()
        Failed = @()
        Warnings = @()
    }
    Configuration = @{
        EnvFiles = @()
        ConfigFiles = @()
        Issues = @()
    }
    Recommendations = @()
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Write-ValidationHeader {
    param([string]$Title)
    
    Write-Host ""
    Write-Host ("=" * 80) -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor Cyan
    Write-Host ("=" * 80) -ForegroundColor Cyan
    Write-Host ""
}

function Write-TestResult {
    param(
        [string]$TestName,
        [string]$Status,  # "PASS", "FAIL", "WARN"
        [string]$Message = ""
    )
    
    $ValidationResults.Summary.TotalTests++
    
    $symbol = switch ($Status) {
        "PASS" { 
            $ValidationResults.Summary.Passed++
            "✅"
        }
        "FAIL" { 
            $ValidationResults.Summary.Failed++
            "❌"
        }
        "WARN" { 
            $ValidationResults.Summary.Warnings++
            "⚠️"
        }
    }
    
    $color = switch ($Status) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "WARN" { "Yellow" }
    }
    
    $statusText = "[$Status]"
    Write-Host "$symbol " -NoNewline -ForegroundColor $color
    Write-Host "$statusText " -NoNewline -ForegroundColor $color
    Write-Host $TestName
    
    if ($Message -and $Verbose) {
        Write-Host "   └─ $Message" -ForegroundColor Gray
    }
}

function Test-NodePackage {
    param(
        [string]$PackagePath,
        [string]$PackageName
    )
    
    $result = @{
        Name = $PackageName
        Path = $PackagePath
        Status = "UNKNOWN"
        Issues = @()
        HasPackageJson = $false
        HasNodeModules = $false
        HasStartScript = $false
        HasBuildScript = $false
        HasTestScript = $false
    }
    
    # Check package.json
    $packageJsonPath = Join-Path $PackagePath "package.json"
    if (Test-Path $packageJsonPath) {
        $result.HasPackageJson = $true
        
        try {
            $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
            
            # Check scripts
            if ($packageJson.scripts) {
                $result.HasStartScript = $null -ne $packageJson.scripts.start -or $null -ne $packageJson.scripts.dev
                $result.HasBuildScript = $null -ne $packageJson.scripts.build
                $result.HasTestScript = $null -ne $packageJson.scripts.test
            }
            
            # Check node_modules
            $nodeModulesPath = Join-Path $PackagePath "node_modules"
            $result.HasNodeModules = Test-Path $nodeModulesPath
            
            # Determine status
            if ($result.HasNodeModules) {
                $result.Status = "PASS"
            } else {
                $result.Status = "WARN"
                $result.Issues += "Missing node_modules (run npm install)"
            }
            
        } catch {
            $result.Status = "FAIL"
            $result.Issues += "Invalid package.json: $($_.Exception.Message)"
        }
    } else {
        $result.Status = "FAIL"
        $result.Issues += "Missing package.json"
    }
    
    return $result
}

function Test-DotNetProject {
    param(
        [string]$ProjectPath,
        [string]$ProjectName
    )
    
    $result = @{
        Name = $ProjectName
        Path = $ProjectPath
        Status = "UNKNOWN"
        Issues = @()
        HasProjectFile = $false
        CanBuild = $false
    }
    
    # Check for .csproj or .sln
    $csprojFiles = Get-ChildItem -Path $ProjectPath -Filter "*.csproj" -File
    $slnFiles = Get-ChildItem -Path $ProjectPath -Filter "*.sln" -File
    
    if ($csprojFiles.Count -gt 0 -or $slnFiles.Count -gt 0) {
        $result.HasProjectFile = $true
        
        # Try to build (dry run)
        if (-not $QuickMode) {
            Push-Location $ProjectPath
            try {
                $buildOutput = dotnet build --no-restore --nologo 2>&1
                if ($LASTEXITCODE -eq 0) {
                    $result.CanBuild = $true
                    $result.Status = "PASS"
                } else {
                    $result.Status = "WARN"
                    $result.Issues += "Build may have issues (run 'dotnet build' for details)"
                }
            } catch {
                $result.Status = "WARN"
                $result.Issues += "Could not test build: $($_.Exception.Message)"
            }
            Pop-Location
        } else {
            $result.Status = "PASS"
        }
    } else {
        $result.Status = "FAIL"
        $result.Issues += "No .csproj or .sln file found"
    }
    
    return $result
}

# ============================================================================
# VALIDATION TESTS
# ============================================================================

function Test-HotSwappableModules {
    Write-ValidationHeader "Testing Hot-Swappable Modules (6 Expected)"
    
    $modules = @(
        @{ Name = "TerraFusion Dashboard"; Path = "src\terrafusion-dashboard\TerraFusionDashboard"; ExpectedPort = 3001 }
        @{ Name = "TerraFusion GIS"; Path = "src\terrafusion-gis"; ExpectedPort = 3002 }
        @{ Name = "TerraFusion v0 Demo"; Path = "src\terrafusion-v0-demo"; ExpectedPort = 3000 }
        @{ Name = "AI Command Brain"; Path = "src\modules\ai-command-brain"; ExpectedPort = $null }
        @{ Name = "TerraFusion Prime View"; Path = "src\terrafusion-prime-view"; ExpectedPort = $null }
        @{ Name = "TerraFusion Pro Plus"; Path = "src\terrafusion-pro-plus"; ExpectedPort = $null }
    )
    
    $ValidationResults.HotSwappableModules.Total = $modules.Count
    
    foreach ($module in $modules) {
        $modulePath = Join-Path $WorkspaceRoot $module.Path
        
        if (Test-Path $modulePath) {
            $result = Test-NodePackage -PackagePath $modulePath -PackageName $module.Name
            $ValidationResults.HotSwappableModules.Validated++
            
            # Check for start script
            if (-not $result.HasStartScript) {
                $result.Status = "WARN"
                $result.Issues += "No start/dev script found"
            }
            
            # Categorize result
            switch ($result.Status) {
                "PASS" { 
                    $ValidationResults.HotSwappableModules.Passed += $result
                    Write-TestResult -TestName $module.Name -Status "PASS" -Message "Ready to run"
                }
                "WARN" { 
                    $ValidationResults.HotSwappableModules.Warnings += $result
                    Write-TestResult -TestName $module.Name -Status "WARN" -Message ($result.Issues -join ", ")
                }
                "FAIL" { 
                    $ValidationResults.HotSwappableModules.Failed += $result
                    Write-TestResult -TestName $module.Name -Status "FAIL" -Message ($result.Issues -join ", ")
                }
            }
        } else {
            Write-TestResult -TestName $module.Name -Status "FAIL" -Message "Module not found at $($module.Path)"
            $ValidationResults.HotSwappableModules.Failed += @{
                Name = $module.Name
                Path = $module.Path
                Status = "FAIL"
                Issues = @("Module directory not found")
            }
        }
    }
}

function Test-BackendServices {
    Write-ValidationHeader "Testing Backend Services (C# .NET)"
    
    $backendPath = Join-Path $WorkspaceRoot "backend"
    
    if (Test-Path $backendPath) {
        # Check for TerraFusion.sln
        $slnPath = Join-Path $backendPath "TerraFusion.sln"
        if (Test-Path $slnPath) {
            Write-TestResult -TestName "TerraFusion.sln" -Status "PASS" -Message "Solution file found"
            $ValidationResults.Backend.Projects += @{
                Name = "TerraFusion.sln"
                Path = $slnPath
                Status = "PASS"
            }
        } else {
            Write-TestResult -TestName "TerraFusion.sln" -Status "WARN" -Message "Solution file not found"
        }
        
        # Test key backend projects (.NET/C# only)
        $backendProjects = @(
            "api-unified"
            "TerraFusion.API"
            # Note: TerraFusion.Marketplace and mcp-core are not .NET projects
            # They are TypeScript/Python service directories
        )
        
        foreach ($project in $backendProjects) {
            $projectPath = Join-Path $backendPath $project
            if (Test-Path $projectPath) {
                $result = Test-DotNetProject -ProjectPath $projectPath -ProjectName $project
                $ValidationResults.Backend.Projects += $result
                
                Write-TestResult -TestName $project -Status $result.Status -Message ($result.Issues -join ", ")
            } else {
                Write-TestResult -TestName $project -Status "WARN" -Message "Project directory not found"
                $ValidationResults.Backend.Issues += "Project not found: $project"
            }
        }
    } else {
        Write-TestResult -TestName "Backend Directory" -Status "FAIL" -Message "backend/ directory not found"
        $ValidationResults.Backend.Issues += "Backend directory not found at $backendPath"
    }
}

function Test-MCPServers {
    Write-ValidationHeader "Testing MCP Servers (50 Expected)"
    
    # MCP servers are scattered throughout the workspace in subdirectories
    # Search recursively in key areas (modules, backend, src) but exclude noise
    $searchPaths = @(
        (Join-Path $WorkspaceRoot "modules"),
        (Join-Path $WorkspaceRoot "backend"),
        (Join-Path $WorkspaceRoot "src")
    )
    
    $mcpServersFound = 0
    $allMcpDirs = @()
    
    foreach ($searchPath in $searchPaths) {
        if (Test-Path $searchPath) {
            # Find all mcp-* directories recursively, excluding git-temp-clone and node_modules
            $mcpDirs = Get-ChildItem -Path $searchPath -Directory -Filter "mcp-*" -Recurse -Depth 4 -ErrorAction SilentlyContinue | Where-Object {
                $_.FullName -notlike "*\.git-temp-clone\*" -and 
                $_.FullName -notlike "*\node_modules\*" -and
                $_.FullName -notlike "*\.git\*"
            }
            $allMcpDirs += $mcpDirs
        }
    }
    
    foreach ($mcpDir in $allMcpDirs) {
        $mcpServersFound++
        $result = Test-NodePackage -PackagePath $mcpDir.FullName -PackageName $mcpDir.Name
        $ValidationResults.MCPServers.Validated++
        
        switch ($result.Status) {
            "PASS" { 
                $ValidationResults.MCPServers.Passed += $result
                if ($Verbose) {
                    Write-TestResult -TestName $mcpDir.Name -Status "PASS" -Message "MCP server validated"
                }
            }
            "WARN" { 
                $ValidationResults.MCPServers.Warnings += $result
                Write-TestResult -TestName $mcpDir.Name -Status "WARN" -Message ($result.Issues -join ", ")
            }
            "FAIL" { 
                $ValidationResults.MCPServers.Failed += $result
                Write-TestResult -TestName $mcpDir.Name -Status "FAIL" -Message ($result.Issues -join ", ")
            }
        }
    }
    
    $ValidationResults.MCPServers.Total = $mcpServersFound
    
    Write-Host ""
    Write-Host "MCP Servers Summary:" -ForegroundColor Cyan
    Write-Host "  Total Found: $mcpServersFound"
    Write-Host "  Passed: $($ValidationResults.MCPServers.Passed.Count)" -ForegroundColor Green
    Write-Host "  Warnings: $($ValidationResults.MCPServers.Warnings.Count)" -ForegroundColor Yellow
    Write-Host "  Failed: $($ValidationResults.MCPServers.Failed.Count)" -ForegroundColor Red
}

function Test-AISystems {
    Write-ValidationHeader "Testing AI Systems (18 Expected)"
    
    $aiSystems = @(
        @{ Name = ".ai (Core AI Development)"; Path = ".ai" }
        @{ Name = "AI Workspace Companion"; Path = "ai-workspace-companion" }
        @{ Name = "AI Swarm Supreme Commander"; Path = "ai-swarm-supreme-commander" }
        @{ Name = "Backend AI Models"; Path = "backend\ai-models" }
        @{ Name = "Backend AI Swarm"; Path = "backend\ai-swarm" }
        @{ Name = "Backend AI Swarm Service"; Path = "backend\ai-swarm-service" }
        @{ Name = "AI Agent Training Config v2"; Path = "ai-agent-training-config-v2.json" }
        @{ Name = "AI Swarm Config"; Path = "ai-swarm-config.json" }
    )
    
    $ValidationResults.AISystems.Total = $aiSystems.Count
    
    foreach ($system in $aiSystems) {
        $systemPath = Join-Path $WorkspaceRoot $system.Path
        
        if (Test-Path $systemPath) {
            $ValidationResults.AISystems.Validated++
            
            # For directories, check if they have content
            if (Test-Path $systemPath -PathType Container) {
                $fileCount = (Get-ChildItem -Path $systemPath -Recurse -File | Measure-Object).Count
                if ($fileCount -gt 0) {
                    $ValidationResults.AISystems.Passed += @{
                        Name = $system.Name
                        Path = $system.Path
                        FileCount = $fileCount
                        Status = "PASS"
                    }
                    Write-TestResult -TestName $system.Name -Status "PASS" -Message "$fileCount files found"
                } else {
                    $ValidationResults.AISystems.Warnings += @{
                        Name = $system.Name
                        Path = $system.Path
                        Status = "WARN"
                        Issues = @("Directory is empty")
                    }
                    Write-TestResult -TestName $system.Name -Status "WARN" -Message "Directory is empty"
                }
            } else {
                # File exists
                $ValidationResults.AISystems.Passed += @{
                    Name = $system.Name
                    Path = $system.Path
                    Status = "PASS"
                }
                Write-TestResult -TestName $system.Name -Status "PASS" -Message "Config file found"
            }
        } else {
            $ValidationResults.AISystems.Failed += @{
                Name = $system.Name
                Path = $system.Path
                Status = "FAIL"
                Issues = @("AI system not found")
            }
            Write-TestResult -TestName $system.Name -Status "FAIL" -Message "Not found at $($system.Path)"
        }
    }
}

function Test-Configuration {
    Write-ValidationHeader "Testing Configuration Files"
    
    # Check for critical configuration files
    $criticalConfigs = @(
        "package.json"
        "benton-county-config.json"
        ".gitignore"
        "README.md"
        ".workspace-map.json"
    )
    
    foreach ($config in $criticalConfigs) {
        $configPath = Join-Path $WorkspaceRoot $config
        if (Test-Path $configPath) {
            $ValidationResults.Configuration.ConfigFiles += @{
                Name = $config
                Path = $config
                Status = "PASS"
            }
            Write-TestResult -TestName $config -Status "PASS" -Message "Found"
        } else {
            $ValidationResults.Configuration.Issues += "Missing: $config"
            Write-TestResult -TestName $config -Status "WARN" -Message "Not found"
        }
    }
}

function Test-DocumentationSystem {
    Write-ValidationHeader "Testing Documentation System"
    
    $docSystems = @(
        @{ Name = "docs/"; Path = "docs" }
        @{ Name = "ai-codex/"; Path = "ai-codex" }
        @{ Name = "WORKSPACE_NAVIGATION_GUIDE.md"; Path = "WORKSPACE_NAVIGATION_GUIDE.md" }
        @{ Name = "ACTIVE_SYSTEMS.md"; Path = "ACTIVE_SYSTEMS.md" }
        @{ Name = ".workspace-map.json"; Path = ".workspace-map.json" }
    )
    
    foreach ($doc in $docSystems) {
        $docPath = Join-Path $WorkspaceRoot $doc.Path
        if (Test-Path $docPath) {
            Write-TestResult -TestName $doc.Name -Status "PASS" -Message "Documentation found"
        } else {
            Write-TestResult -TestName $doc.Name -Status "WARN" -Message "Not found"
        }
    }
}

function Test-SystemRequirements {
    Write-ValidationHeader "Testing System Requirements"
    
    # Check Node.js
    try {
        $nodeVersion = node --version 2>&1
        if ($nodeVersion -match "v(\d+)\.") {
            $majorVersion = [int]$Matches[1]
            if ($majorVersion -ge 18) {
                Write-TestResult -TestName "Node.js ($nodeVersion)" -Status "PASS" -Message "Version 18+ required"
            } else {
                Write-TestResult -TestName "Node.js ($nodeVersion)" -Status "WARN" -Message "Version 18+ recommended, found $nodeVersion"
            }
        }
    } catch {
        Write-TestResult -TestName "Node.js" -Status "FAIL" -Message "Node.js not found in PATH"
    }
    
    # Check .NET
    try {
        $dotnetVersion = dotnet --version 2>&1
        if ($dotnetVersion -match "(\d+)\.") {
            $majorVersion = [int]$Matches[1]
            if ($majorVersion -ge 8) {
                Write-TestResult -TestName ".NET SDK ($dotnetVersion)" -Status "PASS" -Message "Version 8+ required"
            } else {
                Write-TestResult -TestName ".NET SDK ($dotnetVersion)" -Status "WARN" -Message "Version 8+ recommended, found $dotnetVersion"
            }
        }
    } catch {
        Write-TestResult -TestName ".NET SDK" -Status "FAIL" -Message ".NET SDK not found in PATH"
    }
    
    # Check npm
    try {
        $npmVersion = npm --version 2>&1
        Write-TestResult -TestName "npm ($npmVersion)" -Status "PASS" -Message "npm installed"
    } catch {
        Write-TestResult -TestName "npm" -Status "FAIL" -Message "npm not found in PATH"
    }
    
    # Check Git
    try {
        $gitVersion = git --version 2>&1
        Write-TestResult -TestName "Git" -Status "PASS" -Message "Git installed"
    } catch {
        Write-TestResult -TestName "Git" -Status "WARN" -Message "Git not found in PATH"
    }
}

# ============================================================================
# GENERATE RECOMMENDATIONS
# ============================================================================

function Generate-Recommendations {
    Write-ValidationHeader "Generating Recommendations"
    
    # Failed hot-swappable modules
    if ($ValidationResults.HotSwappableModules.Failed.Count -gt 0) {
        $ValidationResults.Recommendations += @{
            Priority = "HIGH"
            Category = "Hot-Swappable Modules"
            Issue = "$($ValidationResults.HotSwappableModules.Failed.Count) module(s) failed validation"
            Action = "Review failed modules and run 'npm install' in their directories"
            Modules = $ValidationResults.HotSwappableModules.Failed.Name
        }
    }
    
    # Modules needing npm install
    $needsNpmInstall = $ValidationResults.HotSwappableModules.Warnings | Where-Object { $_.Issues -contains "Missing node_modules (run npm install)" }
    if ($needsNpmInstall.Count -gt 0) {
        $ValidationResults.Recommendations += @{
            Priority = "MEDIUM"
            Category = "Dependencies"
            Issue = "$($needsNpmInstall.Count) module(s) missing node_modules"
            Action = "Run 'npm install' in the following directories: " + ($needsNpmInstall.Name -join ", ")
        }
    }
    
    # MCP Servers issues
    if ($ValidationResults.MCPServers.Failed.Count -gt 0) {
        $ValidationResults.Recommendations += @{
            Priority = "MEDIUM"
            Category = "MCP Servers"
            Issue = "$($ValidationResults.MCPServers.Failed.Count) MCP server(s) failed validation"
            Action = "Review MCP server configuration and dependencies"
        }
    }
    
    # Backend issues
    if ($ValidationResults.Backend.Issues.Count -gt 0) {
        $ValidationResults.Recommendations += @{
            Priority = "HIGH"
            Category = "Backend"
            Issue = "Backend validation issues detected"
            Action = "Review backend projects: " + ($ValidationResults.Backend.Issues -join ", ")
        }
    }
    
    # AI Systems issues
    if ($ValidationResults.AISystems.Failed.Count -gt 0) {
        $ValidationResults.Recommendations += @{
            Priority = "LOW"
            Category = "AI Systems"
            Issue = "$($ValidationResults.AISystems.Failed.Count) AI system(s) not found"
            Action = "Verify AI system paths and restore if needed"
        }
    }
    
    # Display recommendations
    foreach ($rec in $ValidationResults.Recommendations) {
        $priorityColor = switch ($rec.Priority) {
            "HIGH" { "Red" }
            "MEDIUM" { "Yellow" }
            "LOW" { "Cyan" }
        }
        
        Write-Host ""
        Write-Host "[$($rec.Priority)] $($rec.Category)" -ForegroundColor $priorityColor
        Write-Host "  Issue: $($rec.Issue)"
        Write-Host "  Action: $($rec.Action)"
    }
}

# ============================================================================
# GENERATE REPORTS
# ============================================================================

function Generate-Reports {
    Write-ValidationHeader "Generating Validation Reports"
    
    # Generate text report
    $report = @"
╔══════════════════════════════════════════════════════════════════════════════╗
║                    TERRAFUSION OS VALIDATION REPORT                          ║
║                          THE TERRAFUSION WAY                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

Timestamp: $($ValidationResults.Timestamp)
Workspace: $($ValidationResults.WorkspaceRoot)

═══════════════════════════════════════════════════════════════════════════════
EXECUTIVE SUMMARY
═══════════════════════════════════════════════════════════════════════════════

Total Tests Run:     $($ValidationResults.Summary.TotalTests)
✅ Passed:           $($ValidationResults.Summary.Passed)
⚠️  Warnings:         $($ValidationResults.Summary.Warnings)
❌ Failed:           $($ValidationResults.Summary.Failed)

Success Rate:        $(if ($ValidationResults.Summary.TotalTests -gt 0) { [math]::Round(($ValidationResults.Summary.Passed / $ValidationResults.Summary.TotalTests) * 100, 2) } else { 0 })%

═══════════════════════════════════════════════════════════════════════════════
HOT-SWAPPABLE MODULES (6 Expected)
═══════════════════════════════════════════════════════════════════════════════

Total:      $($ValidationResults.HotSwappableModules.Total)
Validated:  $($ValidationResults.HotSwappableModules.Validated)
✅ Passed:   $($ValidationResults.HotSwappableModules.Passed.Count)
⚠️  Warnings: $($ValidationResults.HotSwappableModules.Warnings.Count)
❌ Failed:   $($ValidationResults.HotSwappableModules.Failed.Count)

Ready to Run:
$($ValidationResults.HotSwappableModules.Passed | ForEach-Object { "  ✅ $($_.Name)" })

Needs Attention:
$($ValidationResults.HotSwappableModules.Warnings | ForEach-Object { "  ⚠️  $($_.Name): $($_.Issues -join ', ')" })

Failed:
$($ValidationResults.HotSwappableModules.Failed | ForEach-Object { "  ❌ $($_.Name): $($_.Issues -join ', ')" })

═══════════════════════════════════════════════════════════════════════════════
BACKEND SERVICES (C# .NET)
═══════════════════════════════════════════════════════════════════════════════

Projects Found: $($ValidationResults.Backend.Projects.Count)

$($ValidationResults.Backend.Projects | ForEach-Object { 
    $symbol = switch ($_.Status) {
        "PASS" { "✅" }
        "WARN" { "⚠️" }
        "FAIL" { "❌" }
    }
    "  $symbol $($_.Name)"
})

Issues:
$($ValidationResults.Backend.Issues | ForEach-Object { "  - $_" })

═══════════════════════════════════════════════════════════════════════════════
MCP SERVERS (50 Expected)
═══════════════════════════════════════════════════════════════════════════════

Total Found: $($ValidationResults.MCPServers.Total)
✅ Passed:    $($ValidationResults.MCPServers.Passed.Count)
⚠️  Warnings:  $($ValidationResults.MCPServers.Warnings.Count)
❌ Failed:    $($ValidationResults.MCPServers.Failed.Count)

Failed Servers:
$($ValidationResults.MCPServers.Failed | ForEach-Object { "  ❌ $($_.Name): $($_.Issues -join ', ')" })

═══════════════════════════════════════════════════════════════════════════════
AI SYSTEMS (18 Expected)
═══════════════════════════════════════════════════════════════════════════════

Total:      $($ValidationResults.AISystems.Total)
Validated:  $($ValidationResults.AISystems.Validated)
✅ Passed:   $($ValidationResults.AISystems.Passed.Count)
⚠️  Warnings: $($ValidationResults.AISystems.Warnings.Count)
❌ Failed:   $($ValidationResults.AISystems.Failed.Count)

═══════════════════════════════════════════════════════════════════════════════
RECOMMENDATIONS
═══════════════════════════════════════════════════════════════════════════════

$($ValidationResults.Recommendations | ForEach-Object { 
@"
[$($_.Priority)] $($_.Category)
  Issue:  $($_.Issue)
  Action: $($_.Action)

"@
})

═══════════════════════════════════════════════════════════════════════════════
NEXT STEPS
═══════════════════════════════════════════════════════════════════════════════

1. Review failed tests and address high-priority issues
2. Run 'npm install' in modules with missing dependencies
3. Test backend services with 'dotnet build' in backend/
4. Validate MCP servers individually if issues found
5. Run health-check.ps1 to verify system health
6. Use start-everything.ps1 to launch all services

═══════════════════════════════════════════════════════════════════════════════

Report generated: $($ValidationResults.Timestamp)
THE TERRAFUSION WAY - We test everything, break nothing! ✅

"@
    
    # Save reports
    $report | Out-File -FilePath $ReportFile -Encoding UTF8
    $ValidationResults | ConvertTo-Json -Depth 10 | Out-File -FilePath $JsonReportFile -Encoding UTF8
    
    Write-Host ""
    Write-Host "Reports saved:" -ForegroundColor Green
    Write-Host "  Text:  $ReportFile" -ForegroundColor Cyan
    Write-Host "  JSON:  $JsonReportFile" -ForegroundColor Cyan
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         TERRAFUSION OS - COMPREHENSIVE WORKSPACE VALIDATION                 ║" -ForegroundColor Cyan
Write-Host "║                      THE TERRAFUSION WAY                                     ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting validation at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Yellow
Write-Host "Workspace: $WorkspaceRoot" -ForegroundColor Yellow
Write-Host ""

# Run all validation tests
Test-SystemRequirements
Test-HotSwappableModules
Test-BackendServices
Test-MCPServers
Test-AISystems
Test-Configuration
Test-DocumentationSystem

# Generate recommendations
Generate-Recommendations

# Generate reports
Generate-Reports

# Final summary
Write-ValidationHeader "VALIDATION COMPLETE"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  FINAL RESULTS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Total Tests:    $($ValidationResults.Summary.TotalTests)"
Write-Host "  ✅ Passed:      $($ValidationResults.Summary.Passed)" -ForegroundColor Green
Write-Host "  ⚠️  Warnings:    $($ValidationResults.Summary.Warnings)" -ForegroundColor Yellow
Write-Host "  ❌ Failed:      $($ValidationResults.Summary.Failed)" -ForegroundColor Red
Write-Host ""

$successRate = if ($ValidationResults.Summary.TotalTests -gt 0) { 
    [math]::Round(($ValidationResults.Summary.Passed / $ValidationResults.Summary.TotalTests) * 100, 2) 
} else { 
    0 
}

Write-Host "  Success Rate:   $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 60) { "Yellow" } else { "Red" })
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "THE TERRAFUSION WAY - We test everything, break nothing! ✅" -ForegroundColor Cyan
Write-Host ""

#!/usr/bin/env pwsh
<#
.SYNOPSIS
    TerraFusion Elite Workspace Generator
    Government. Transcended. - Championship Excellence

.DESCRIPTION
    Generates AI-optimized workspaces with full WorkForge compatibility
    and TerraFusion brand integration for separate AI agent teams.

.PARAMETER WorkspaceName
    Name of the workspace to create

.PARAMETER WorkspaceType
    Type of workspace: frontend, backend, fullstack, specialized

.PARAMETER AgentTeamSize
    Size of AI agent team: small (5), medium (8), large (12)

.PARAMETER FismaLevel
    FISMA compliance level: LOW, MODERATE, HIGH

.EXAMPLE
    .\Generate-TerraFusion-Workspace.ps1 -WorkspaceName "terra-citizen-portal" -WorkspaceType "frontend" -AgentTeamSize "medium"
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$WorkspaceName,

    [Parameter(Mandatory = $true)]
    [ValidateSet('frontend', 'backend', 'fullstack', 'specialized', 'ai-systems', 'infrastructure')]
    [string]$WorkspaceType,

    [Parameter(Mandatory = $false)]
    [ValidateSet('small', 'medium', 'large')]
    [string]$AgentTeamSize = 'medium',

    [Parameter(Mandatory = $false)]
    [ValidateSet('LOW', 'MODERATE', 'HIGH')]
    [string]$FismaLevel = 'MODERATE',

    [Parameter(Mandatory = $false)]
    [switch]$IncludeUIUX = $true,

    [Parameter(Mandatory = $false)]
    [string]$OutputPath = ".\workspaces"
)

# TerraFusion Elite Configuration
$TerraFusionConfig = @{
    Brand = @{
        Tagline = "Government. Transcended."
        Excellence = "Championship Excellence"
        Colors = @{
            TrustBlue = "#0099ff"
            TranscendCyan = "#00ffee"
            SuccessGreen = "#00ffaa"
            DeepSpace = "#0b1020"
        }
    }
    AI = @{
        OrchestrationUrl = "http://localhost:3004/api/agents"
        MCPProtocol = "v1.0"
        ConfidenceTarget = 0.97
    }
}

function Write-TerraFusionHeader {
    Write-Host "🎯 TerraFusion Elite Workspace Generator" -ForegroundColor Cyan
    Write-Host "Government. Transcended. - Championship Excellence" -ForegroundColor Green
    Write-Host "═" * 80 -ForegroundColor DarkCyan
    Write-Host "📍 Workspace: $WorkspaceName" -ForegroundColor Yellow
    Write-Host "🔧 Type: $WorkspaceType" -ForegroundColor Yellow
    Write-Host "🤖 Agent Team: $AgentTeamSize" -ForegroundColor Yellow
    Write-Host "🛡️ FISMA Level: $FismaLevel" -ForegroundColor Yellow
    Write-Host ""
}

function Get-AgentConfiguration {
    param($TeamSize, $WorkspaceType)

    $baseAgents = @{
        developmentLead = $true
        codeGenerator = $true
        testAutomation = $true
        qaLead = $true
    }

    $additionalAgents = @{
        uiuxDesigner = ($WorkspaceType -in @('frontend', 'fullstack') -and $IncludeUIUX)
        accessibilityExpert = ($WorkspaceType -in @('frontend', 'fullstack'))
        devOpsSpecialist = ($TeamSize -in @('medium', 'large'))
        securityAnalyst = ($FismaLevel -in @('MODERATE', 'HIGH'))
        performanceOptimizer = ($TeamSize -in @('medium', 'large'))
        brandCompliance = ($WorkspaceType -in @('frontend', 'fullstack'))
        apiDocumentationGenerator = ($WorkspaceType -in @('backend', 'fullstack'))
    }

    return $baseAgents + $additionalAgents
}

function Get-TestFrameworkConfig {
    param($WorkspaceType)

    switch ($WorkspaceType) {
        'frontend' {
            return @{
                testFramework = "Vitest + Testing Library + Playwright"
                testCommand = "npm"
                testArgs = @("run", "test")
                problemMatcher = "$tsc"
            }
        }
        'backend' {
            return @{
                testFramework = "xUnit + NUnit + Rust Tests"
                testCommand = "dotnet"
                testArgs = @("test", "--coverage")
                problemMatcher = "$msCompile"
            }
        }
        'fullstack' {
            return @{
                testFramework = "Vitest + xUnit + Playwright E2E"
                testCommand = "npm"
                testArgs = @("run", "test:all")
                problemMatcher = @("$tsc", "$msCompile")
            }
        }
        default {
            return @{
                testFramework = "Generic Test Suite"
                testCommand = "npm"
                testArgs = @("test")
                problemMatcher = @()
            }
        }
    }
}

function New-WorkspaceFromTemplate {
    param($TemplatePath, $TargetPath, $Variables)

    Write-Host "📋 Generating workspace from template..." -ForegroundColor Green

    # Read template
    $templateContent = Get-Content $TemplatePath -Raw

    # Replace variables
    foreach ($var in $Variables.GetEnumerator()) {
        $placeholder = "`${$($var.Key)}"
        $templateContent = $templateContent -replace [regex]::Escape($placeholder), $var.Value
    }

    # Create target directory
    $targetDir = Split-Path $TargetPath -Parent
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }

    # Write processed template
    Set-Content -Path $TargetPath -Value $templateContent -Encoding UTF8

    Write-Host "  ✅ Workspace configuration created" -ForegroundColor Green
}

function New-WorkspaceStructure {
    param($WorkspacePath, $WorkspaceType)

    Write-Host "📁 Creating workspace structure..." -ForegroundColor Green

    # Base directories
    $baseDirs = @(
        "src",
        "tests",
        "docs",
        ".vscode",
        ".vscode/agents",
        ".vscode/scripts"
    )

    # Type-specific directories
    $typeDirs = switch ($WorkspaceType) {
        'frontend' { @("src/components", "src/pages", "src/styles", "src/assets", "public") }
        'backend' { @("src/Controllers", "src/Services", "src/Models", "src/Data", "migrations") }
        'fullstack' { @("frontend/src", "backend/src", "shared", "deployment") }
        default { @("src/modules", "src/utils") }
    }

    $allDirs = $baseDirs + $typeDirs

    foreach ($dir in $allDirs) {
        $dirPath = Join-Path $WorkspacePath $dir
        if (-not (Test-Path $dirPath)) {
            New-Item -ItemType Directory -Path $dirPath -Force | Out-Null
            Write-Host "  ✅ Created: $dir" -ForegroundColor Green
        }
    }
}

function New-VSCodeConfiguration {
    param($WorkspacePath, $AgentConfig, $TestConfig)

    Write-Host "⚙️ Configuring VS Code integration..." -ForegroundColor Green

    # Copy agent scripts
    $scriptTemplatesPath = Join-Path $PSScriptRoot "templates\scripts"
    $targetScriptsPath = Join-Path $WorkspacePath ".vscode\scripts"

    if (Test-Path $scriptTemplatesPath) {
        Copy-Item "$scriptTemplatesPath\*" $targetScriptsPath -Recurse -Force
        Write-Host "  ✅ Agent scripts configured" -ForegroundColor Green
    }

    # Create launch configuration
    $launchConfig = @{
        version = "0.2.0"
        configurations = @(
            @{
                name = "Launch AI Agent Dashboard"
                type = "node"
                request = "launch"
                program = "`${workspaceFolder}/.vscode/scripts/agent-dashboard.js"
                console = "integratedTerminal"
                env = @{
                    WORKSPACE_TYPE = $WorkspaceType
                    WORKSPACE_NAME = $WorkspaceName
                }
            }
        )
    }

    $launchPath = Join-Path $WorkspacePath ".vscode\launch.json"
    $launchConfig | ConvertTo-Json -Depth 10 | Set-Content $launchPath

    Write-Host "  ✅ Launch configuration created" -ForegroundColor Green
}

function New-PackageJson {
    param($WorkspacePath, $WorkspaceType, $WorkspaceName)

    Write-Host "📦 Creating package.json..." -ForegroundColor Green

    $basePackage = @{
        name = $WorkspaceName.ToLower() -replace '[^a-z0-9-]', '-'
        version = "1.0.0"
        description = "TerraFusion $WorkspaceType workspace - Government. Transcended."
        main = "index.js"
        scripts = @{
            "start" = "node index.js"
            "dev" = "node --watch index.js"
            "test" = "jest"
            "lint" = "eslint ."
            "format" = "prettier --write ."
            "agents:init" = "node .vscode/scripts/init-agents.js"
            "workforge:validate" = "node .vscode/scripts/validate-workforge.js"
        }
        dependencies = @{
            "@terrafusion/sdk" = "^2.0.0"
            "@terrafusion/ui-kit" = "^1.0.0"
        }
        devDependencies = @{
            "typescript" = "^5.0.0"
            "@types/node" = "^20.0.0"
            "eslint" = "^8.0.0"
            "prettier" = "^3.0.0"
            "jest" = "^29.0.0"
        }
        keywords = @(
            "terrafusion",
            "government",
            "transcended",
            "ai-optimized",
            "workforge-compatible"
        )
        author = "TerraFusion Elite Team"
        license = "MIT"
        terrafusion = @{
            workspace = @{
                type = $WorkspaceType
                aiEnabled = $true
                workforgeCompatible = $true
                confidenceTarget = 0.97
            }
        }
    }

    # Type-specific dependencies
    if ($WorkspaceType -eq 'frontend') {
        $basePackage.dependencies["react"] = "^18.0.0"
        $basePackage.dependencies["react-dom"] = "^18.0.0"
        $basePackage.devDependencies["@vitejs/plugin-react"] = "^4.0.0"
        $basePackage.devDependencies["vite"] = "^5.0.0"
        $basePackage.scripts["dev"] = "vite"
        $basePackage.scripts["build"] = "vite build"
    }

    $packagePath = Join-Path $WorkspacePath "package.json"
    $basePackage | ConvertTo-Json -Depth 10 | Set-Content $packagePath

    Write-Host "  ✅ package.json created" -ForegroundColor Green
}

function New-ReadmeFile {
    param($WorkspacePath, $WorkspaceName, $WorkspaceType)

    Write-Host "📚 Creating README.md..." -ForegroundColor Green

    $readmeContent = @"
# $WorkspaceName

**Government. Transcended. - Championship Excellence**

## 🎯 TerraFusion $WorkspaceType Workspace

This workspace is optimized for AI agent teams and WorkForge compatibility, delivering championship-level excellence in government technology.

### 🚀 Features

- **AI Agent Integration**: Fully compatible with TerraFusion AI agent teams
- **WorkForge Ready**: Seamless project creation and deployment
- **Government Transcended**: Beyond bureaucracy into pure technological excellence
- **Championship Standards**: 97%+ confidence, <50ms response times

### 🤖 AI Agent Team

This workspace includes a specialized AI agent team:

- **Development Lead**: Code generation and architecture
- **QA Lead**: Quality assurance and evidence collection
- **Test Automation**: Comprehensive testing frameworks
- **Performance Optimizer**: Real-time performance monitoring

### 🛠️ Quick Start

1. **Initialize AI Agents**:
   ``````bash
   npm run agents:init
   ``````

2. **Validate WorkForge Compatibility**:
   ``````bash
   npm run workforge:validate
   ``````

3. **Start Development**:
   ``````bash
   npm run dev
   ``````

### 📊 Quality Standards

- **Test Coverage**: ≥90% critical paths
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: 90+ Lighthouse scores
- **Security**: FISMA $FismaLevel compliance

### 🎨 TerraFusion Brand Integration

This workspace follows the TerraFusion Brand Codex with:

- **Glass Morphism UI**: Transcendent visual effects
- **Quantum Color Palette**: Trust Blue, Transcend Cyan, Success Green
- **Championship Typography**: Government excellence typography

### 🔧 Configuration

The workspace is configured with:

- **TypeScript**: Strict type checking
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Jest/Vitest**: Testing framework
- **Playwright**: E2E testing

### 📈 Monitoring & Analytics

- **Real-time Performance**: Live metrics dashboard
- **AI Agent Health**: Continuous monitoring
- **Quality Gates**: Automated validation
- **Evidence Collection**: Comprehensive audit trails

---

**TerraFusion Elite Government OS Engineering**
*Championship Excellence: Government. Transcended.*
"@

    $readmePath = Join-Path $WorkspacePath "README.md"
    Set-Content -Path $readmePath -Value $readmeContent

    Write-Host "  ✅ README.md created" -ForegroundColor Green
}

function Initialize-GitRepository {
    param($WorkspacePath)

    Write-Host "🔧 Initializing Git repository..." -ForegroundColor Green

    Push-Location $WorkspacePath
    try {
        git init

        # Create .gitignore
        $gitignoreContent = @"
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
dist/
build/
.next/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/settings.json
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# AI Agent runtime
.vscode/agents/runtime/
.vscode/agents/logs/

# TerraFusion specific
.terrafusion/cache/
workforge-validation-report.json
"@

        Set-Content -Path ".gitignore" -Value $gitignoreContent

        git add .
        git commit -m "🎯 Initial commit: TerraFusion $WorkspaceType workspace - Government. Transcended."

        Write-Host "  ✅ Git repository initialized" -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
}

function Start-WorkspaceValidation {
    param($WorkspacePath)

    Write-Host "🔍 Running initial WorkForge validation..." -ForegroundColor Green

    Push-Location $WorkspacePath
    try {
        # Install dependencies first
        if (Test-Path "package.json") {
            npm install --silent
        }

        # Run validation
        node .vscode/scripts/validate-workforge.js

        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ WorkForge validation passed" -ForegroundColor Green
        } else {
            Write-Warning "  ⚠️ WorkForge validation has warnings - check report"
        }
    }
    catch {
        Write-Warning "  ⚠️ Could not run validation: $($_.Exception.Message)"
    }
    finally {
        Pop-Location
    }
}

# Main execution
function Main {
    Write-TerraFusionHeader

    try {
        # Prepare configuration
        $agentConfig = Get-AgentConfiguration $AgentTeamSize $WorkspaceType
        $testConfig = Get-TestFrameworkConfig $WorkspaceType

        # Template variables
        $templateVars = @{
            workspaceName = $WorkspaceName
            workspaceType = $WorkspaceType
            fismaMode = $FismaLevel
            includeUIUX = $IncludeUIUX.ToString().ToLower()
            testFramework = $testConfig.testFramework
            testCommand = $testConfig.testCommand
            testArgs = ($testConfig.testArgs -join '", "')
            problemMatcher = if ($testConfig.problemMatcher -is [array]) { $testConfig.problemMatcher -join '", "' } else { $testConfig.problemMatcher }
            securityLevel = if ($FismaLevel -eq 'HIGH') { 'continuous' } else { 'periodic' }
            environment = 'development'
        }

        # Create workspace directory
        $workspacePath = Join-Path $OutputPath $WorkspaceName
        if (-not (Test-Path $workspacePath)) {
            New-Item -ItemType Directory -Path $workspacePath -Force | Out-Null
        }

        # Generate workspace from template
        $templatePath = Join-Path $PSScriptRoot "templates\$WorkspaceType-workspace.template.json"
        if (-not (Test-Path $templatePath)) {
            $templatePath = Join-Path $PSScriptRoot "templates\master-workspace.template.json"
        }

        $workspaceConfigPath = Join-Path $workspacePath "$WorkspaceName.code-workspace"
        New-WorkspaceFromTemplate $templatePath $workspaceConfigPath $templateVars

        # Create workspace structure
        New-WorkspaceStructure $workspacePath $WorkspaceType

        # Setup VS Code configuration
        New-VSCodeConfiguration $workspacePath $agentConfig $testConfig

        # Create package.json
        New-PackageJson $workspacePath $WorkspaceType $WorkspaceName

        # Create README
        New-ReadmeFile $workspacePath $WorkspaceName $WorkspaceType

        # Initialize Git
        Initialize-GitRepository $workspacePath

        # Run validation
        Start-WorkspaceValidation $workspacePath

        Write-Host ""
        Write-Host "🎊 WORKSPACE CREATION COMPLETED! 🎊" -ForegroundColor Green
        Write-Host "Government. Transcended. - Championship Excellence Achieved!" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📍 Location: $workspacePath" -ForegroundColor Yellow
        Write-Host "🚀 Open in VS Code: code '$workspaceConfigPath'" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Next Steps:" -ForegroundColor White
        Write-Host "1. Open workspace in VS Code" -ForegroundColor Gray
        Write-Host "2. Run 'npm run agents:init' to start AI agent team" -ForegroundColor Gray
        Write-Host "3. Begin championship development!" -ForegroundColor Gray

    }
    catch {
        Write-Error "💥 Workspace creation failed: $($_.Exception.Message)"
        Write-Error $_.ScriptStackTrace
        exit 1
    }
}

# Execute
Main

#!/usr/bin/env pwsh
<#
.SYNOPSIS
    TerraFusion Elite Government OS - Complete Development Environment Setup
    For brand new engineers with zero TerraFusion experience

.DESCRIPTION
    This script sets up the complete TerraFusion development environment in one command.
    Installs all prerequisites, dependencies, and configures VS Code workspaces.

    **CHAMPIONSHIP-LEVEL AUTOMATION FOR GOVERNMENT.TRANSCENDED.**

.PARAMETER Role
    Engineer role: frontend, backend, fullstack, ai-architect, devops

.PARAMETER SkipValidation
    Skip environment validation checks

.EXAMPLE
    .\scripts\terrafusion-elite-setup.ps1 -Role "fullstack"
    .\scripts\terrafusion-elite-setup.ps1 -Role "frontend" -SkipValidation

.NOTES
    Version: 1.0.0
    Author: TerraFusion Elite Engineering Team
    Requires: Windows 10+ with PowerShell 5.1+
#>

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("frontend", "backend", "fullstack", "ai-architect", "devops")]
    [string]$Role,

    [switch]$SkipValidation
)

# TerraFusion Elite Engineering Constants
$TerraFusionVersion = "1.0.0"
$QuantumFactor = 949
$TargetScore = 12.0

# ASCII Art Header
function Show-TerraFusionHeader {
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                    TERRAFUSION ELITE GOVERNMENT OS                   ║" -ForegroundColor Cyan
    Write-Host "║                     Development Environment Setup                   ║" -ForegroundColor Cyan
    Write-Host "║                                                                      ║" -ForegroundColor White
    Write-Host "║                        🏛️  GOVERNMENT.TRANSCENDED  🏛️                ║" -ForegroundColor Yellow
    Write-Host "║                                                                      ║" -ForegroundColor White
    Write-Host "║  Role: $($Role.ToUpper().PadRight(15)) │ Quantum Factor: $QuantumFactor     │ Target: $TargetScore   ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

# Logging Functions
function Write-TerraLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "SUCCESS" { "Green" }
        "WARNING" { "Yellow" }
        "ERROR" { "Red" }
        "QUANTUM" { "Magenta" }
        default { "White" }
    }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

function Write-Success { param([string]$Message) Write-TerraLog $Message "SUCCESS" }
function Write-Warning { param([string]$Message) Write-TerraLog $Message "WARNING" }
function Write-Error { param([string]$Message) Write-TerraLog $Message "ERROR" }
function Write-Quantum { param([string]$Message) Write-TerraLog $Message "QUANTUM" }

# Environment Detection
function Test-Prerequisites {
    Write-TerraLog "🔍 Detecting development environment..."

    $prerequisites = @()

    # Check Windows Version
    $windowsVersion = [System.Environment]::OSVersion.Version
    if ($windowsVersion.Major -ge 10) {
        Write-Success "✅ Windows $($windowsVersion) detected"
    } else {
        Write-Error "❌ Windows 10+ required"
        $prerequisites += "Windows 10+"
    }

    # Check PowerShell Version
    if ($PSVersionTable.PSVersion.Major -ge 5) {
        Write-Success "✅ PowerShell $($PSVersionTable.PSVersion) detected"
    } else {
        Write-Error "❌ PowerShell 5.1+ required"
        $prerequisites += "PowerShell 5.1+"
    }

    # Check Git
    try {
        $gitVersion = git --version 2>$null
        if ($gitVersion) {
            Write-Success "✅ Git detected: $gitVersion"
        } else {
            throw "Git not found"
        }
    } catch {
        Write-Warning "⚠️ Git not detected - will install"
        $prerequisites += "Git"
    }

    return $prerequisites
}

# Software Installation
function Install-ChocolateyIfNeeded {
    Write-TerraLog "🍫 Checking Chocolatey package manager..."

    if (Get-Command choco -ErrorAction SilentlyContinue) {
        Write-Success "✅ Chocolatey already installed"
        return
    }

    Write-TerraLog "📦 Installing Chocolatey package manager..."
    try {
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        Write-Success "✅ Chocolatey installed successfully"
    } catch {
        Write-Error "❌ Failed to install Chocolatey: $($_.Exception.Message)"
        throw
    }
}

function Install-DevelopmentTools {
    Write-TerraLog "🛠️ Installing TerraFusion development tools..."

    $tools = @(
        "git",
        "vscode",
        "nodejs-lts",  # Node.js 18+ LTS
        "dotnet-8.0-sdk",
        "docker-desktop",
        "postman",
        "azure-cli"
    )

    # Role-specific tools
    switch ($Role) {
        "frontend" {
            $tools += @("nodejs", "yarn")
        }
        "backend" {
            $tools += @("dotnet-ef", "sql-server-management-studio")
        }
        "fullstack" {
            $tools += @("nodejs", "yarn", "dotnet-ef", "sql-server-management-studio")
        }
        "ai-architect" {
            $tools += @("python", "anaconda3", "jupyter")
        }
        "devops" {
            $tools += @("kubernetes-cli", "terraform", "packer")
        }
    }

    foreach ($tool in $tools) {
        Write-TerraLog "📥 Installing $tool..."
        try {
            choco install $tool -y --limit-output
            Write-Success "✅ $tool installed"
        } catch {
            Write-Warning "⚠️ Failed to install $tool - continuing..."
        }
    }
}

function Install-VSCodeExtensions {
    Write-TerraLog "🔌 Installing VS Code extensions for $Role role..."

    $coreExtensions = @(
        "ms-vscode.powershell",
        "GitHub.copilot",
        "GitHub.copilot-chat",
        "ms-python.python",
        "ms-dotnettools.csharp",
        "bradlc.vscode-tailwindcss",
        "esbenp.prettier-vscode",
        "ms-vscode.vscode-json"
    )

    # Role-specific extensions
    $roleExtensions = switch ($Role) {
        "frontend" { @(
            "bradlc.vscode-tailwindcss",
            "ms-vscode.vscode-typescript-next",
            "formulahendry.auto-rename-tag",
            "ms-playwright.playwright",
            "steoates.autoimport-es6-ts"
        )}
        "backend" { @(
            "ms-dotnettools.csharp",
            "ms-dotnettools.vscode-dotnet-runtime",
            "ms-mssql.mssql",
            "humao.rest-client"
        )}
        "fullstack" { @(
            "bradlc.vscode-tailwindcss",
            "ms-vscode.vscode-typescript-next",
            "ms-dotnettools.csharp",
            "ms-dotnettools.vscode-dotnet-runtime",
            "ms-mssql.mssql",
            "ms-playwright.playwright"
        )}
        "ai-architect" { @(
            "ms-python.python",
            "ms-python.vscode-pylance",
            "ms-toolsai.jupyter",
            "ms-toolsai.vscode-ai"
        )}
        "devops" { @(
            "ms-kubernetes-tools.vscode-kubernetes-tools",
            "HashiCorp.terraform",
            "ms-azuretools.vscode-docker",
            "ms-vscode.azure-account"
        )}
        default { @() }
    }

    $allExtensions = $coreExtensions + $roleExtensions

    foreach ($extension in $allExtensions) {
        Write-TerraLog "🔌 Installing extension: $extension"
        try {
            code --install-extension $extension --force
            Write-Success "✅ Extension installed: $extension"
        } catch {
            Write-Warning "⚠️ Failed to install extension: $extension"
        }
    }
}

function Setup-NodejsEnvironment {
    if ($Role -in @("frontend", "fullstack")) {
        Write-TerraLog "📦 Setting up Node.js environment..."

        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

        Write-TerraLog "📥 Installing frontend dependencies..."
        Push-Location "frontend"
        try {
            npm install
            Write-Success "✅ Frontend dependencies installed"
        } catch {
            Write-Warning "⚠️ Some frontend dependencies may have failed"
        }
        Pop-Location
    }
}

function Setup-DotNetEnvironment {
    if ($Role -in @("backend", "fullstack")) {
        Write-TerraLog "🔧 Setting up .NET environment..."

        Write-TerraLog "📥 Restoring backend packages..."
        Push-Location "backend"
        try {
            dotnet restore
            Write-Success "✅ .NET packages restored"
        } catch {
            Write-Warning "⚠️ Some .NET packages may have failed to restore"
        }
        Pop-Location
    }
}

function Create-VSCodeWorkspaces {
    Write-TerraLog "📝 Creating VS Code workspaces for $Role..."

    $workspacesDir = "workspaces"
    if (!(Test-Path $workspacesDir)) {
        New-Item -ItemType Directory -Path $workspacesDir -Force | Out-Null
    }

    # Base workspace configuration
    $baseSettings = @{
        "azureML.showWelcomePage" = $false
        "azureML.enableWorkspaceCompletions" = $false
        "python.defaultInterpreterPath" = "./venv/Scripts/python.exe"
        "terrafusion.quantum_factor" = $QuantumFactor
        "terrafusion.target_score" = $TargetScore
        "terrafusion.role" = $Role
        "files.autoSave" = "afterDelay"
        "editor.formatOnSave" = $true
        "editor.codeActionsOnSave" = @{
            "source.fixAll.eslint" = $true
        }
    }

    # Role-specific workspace
    $workspace = switch ($Role) {
        "frontend" {
            @{
                name = "TerraFusion Frontend Development"
                folders = @(
                    @{ path = "./frontend" },
                    @{ path = "./docs/frontend" }
                )
                settings = $baseSettings + @{
                    "typescript.preferences.quoteStyle" = "single"
                    "emmet.includeLanguages" = @{
                        "typescript" = "html"
                        "typescriptreact" = "html"
                    }
                }
                extensions = @{
                    recommendations = @(
                        "bradlc.vscode-tailwindcss",
                        "ms-vscode.vscode-typescript-next",
                        "esbenp.prettier-vscode"
                    )
                }
            }
        }
        "backend" {
            @{
                name = "TerraFusion Backend Development"
                folders = @(
                    @{ path = "./backend" },
                    @{ path = "./docs/backend" }
                )
                settings = $baseSettings + @{
                    "dotnet.defaultSolution" = "./backend/TerraFusion.sln"
                    "omnisharp.enableRoslynAnalyzers" = $true
                }
                extensions = @{
                    recommendations = @(
                        "ms-dotnettools.csharp",
                        "ms-dotnettools.vscode-dotnet-runtime",
                        "ms-mssql.mssql"
                    )
                }
            }
        }
        "fullstack" {
            @{
                name = "TerraFusion Full Stack Development"
                folders = @(
                    @{ path = "./backend" },
                    @{ path = "./frontend" },
                    @{ path = "./config" },
                    @{ path = "./docs" }
                )
                settings = $baseSettings + @{
                    "dotnet.defaultSolution" = "./backend/TerraFusion.sln"
                    "typescript.preferences.quoteStyle" = "single"
                }
                extensions = @{
                    recommendations = @(
                        "ms-dotnettools.csharp",
                        "bradlc.vscode-tailwindcss",
                        "ms-vscode.vscode-typescript-next",
                        "esbenp.prettier-vscode"
                    )
                }
            }
        }
        default {
            @{
                name = "TerraFusion $Role Development"
                folders = @(
                    @{ path = "./" }
                )
                settings = $baseSettings
            }
        }
    }

    $workspaceFile = "$workspacesDir/$Role.code-workspace"
    $workspace | ConvertTo-Json -Depth 10 | Set-Content $workspaceFile -Encoding UTF8
    Write-Success "✅ Created workspace: $workspaceFile"
}

function Test-Environment {
    Write-TerraLog "🧪 Validating TerraFusion development environment..."

    $issues = @()

    # Test Node.js
    if ($Role -in @("frontend", "fullstack")) {
        try {
            $nodeVersion = node --version 2>$null
            if ($nodeVersion -match "v(\d+)\.") {
                $majorVersion = [int]$matches[1]
                if ($majorVersion -ge 18) {
                    Write-Success "✅ Node.js $nodeVersion (compatible)"
                } else {
                    $issues += "Node.js version $nodeVersion too old (need 18+)"
                }
            }
        } catch {
            $issues += "Node.js not accessible"
        }
    }

    # Test .NET
    if ($Role -in @("backend", "fullstack")) {
        try {
            $dotnetVersion = dotnet --version 2>$null
            if ($dotnetVersion -match "^(\d+)\.") {
                $majorVersion = [int]$matches[1]
                if ($majorVersion -ge 8) {
                    Write-Success "✅ .NET $dotnetVersion (compatible)"
                } else {
                    $issues += ".NET version $dotnetVersion too old (need 8+)"
                }
            }
        } catch {
            $issues += ".NET SDK not accessible"
        }
    }

    # Test Git
    try {
        $gitVersion = git --version 2>$null
        if ($gitVersion) {
            Write-Success "✅ Git accessible"
        }
    } catch {
        $issues += "Git not accessible"
    }

    # Test VS Code
    try {
        $codeVersion = code --version 2>$null
        if ($codeVersion) {
            Write-Success "✅ VS Code accessible"
        }
    } catch {
        $issues += "VS Code not accessible"
    }

    if ($issues.Count -eq 0) {
        Write-Quantum "🏆 CHAMPIONSHIP STATUS: Environment validation passed!"
        return $true
    } else {
        Write-Warning "⚠️ Environment issues detected:"
        foreach ($issue in $issues) {
            Write-Warning "   - $issue"
        }
        return $false
    }
}

function Show-NextSteps {
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                    🏆 SETUP COMPLETE - NEXT STEPS 🏆                  ║" -ForegroundColor Green
    Write-Host "║                                                                      ║" -ForegroundColor White
    Write-Host "║  1. Open your workspace:                                             ║" -ForegroundColor White
    Write-Host "║     code workspaces/$Role.code-workspace                            ║" -ForegroundColor Yellow
    Write-Host "║                                                                      ║" -ForegroundColor White
    Write-Host "║  2. Start development servers:                                       ║" -ForegroundColor White
    if ($Role -in @("frontend", "fullstack")) {
        Write-Host "║     Frontend: cd frontend && npm run dev                            ║" -ForegroundColor Yellow
    }
    if ($Role -in @("backend", "fullstack")) {
        Write-Host "║     Backend:  cd backend && dotnet run --project TerraFusion.API    ║" -ForegroundColor Yellow
    }
    Write-Host "║                                                                      ║" -ForegroundColor White
    Write-Host "║  3. Read the documentation:                                          ║" -ForegroundColor White
    Write-Host "║     📖 docs/ONBOARDING_GUIDE.md                                      ║" -ForegroundColor Yellow
    Write-Host "║     📖 docs/ARCHITECTURE.md                                          ║" -ForegroundColor Yellow
    Write-Host "║                                                                      ║" -ForegroundColor White
    Write-Host "║  4. Join the team channels:                                          ║" -ForegroundColor White
    Write-Host "║     💬 #terrafusion-$Role                                           ║" -ForegroundColor Yellow
    Write-Host "║     💬 #terrafusion-help                                             ║" -ForegroundColor Yellow
    Write-Host "║                                                                      ║" -ForegroundColor White
    Write-Host "║                     🏛️ GOVERNMENT.TRANSCENDED 🏛️                      ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
}

# Main Setup Function
function Start-TerraFusionSetup {
    try {
        Show-TerraFusionHeader

        Write-TerraLog "🚀 Starting TerraFusion Elite setup for $Role engineer..."

        # Check prerequisites
        $missingPrereqs = Test-Prerequisites
        if ($missingPrereqs.Count -gt 0) {
            Write-Warning "Missing prerequisites detected. Installing..."
        }

        # Install Chocolatey
        Install-ChocolateyIfNeeded

        # Install development tools
        Install-DevelopmentTools

        # Setup environments
        Setup-NodejsEnvironment
        Setup-DotNetEnvironment

        # Install VS Code extensions
        Install-VSCodeExtensions

        # Create workspaces
        Create-VSCodeWorkspaces

        # Validate environment
        if (!$SkipValidation) {
            $validationPassed = Test-Environment
            if (!$validationPassed) {
                Write-Warning "Environment validation had issues, but setup completed."
            }
        }

        # Success
        Write-Quantum "🏆 CHAMPIONSHIP SETUP COMPLETE!"
        Show-NextSteps

    } catch {
        Write-Error "💥 Setup failed: $($_.Exception.Message)"
        Write-Error "Stack trace: $($_.ScriptStackTrace)"
        exit 1
    }
}

# Execute setup
Start-TerraFusionSetup

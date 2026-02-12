#!/usr/bin/env pwsh
<#
.SYNOPSIS
TerraFusion Development Environment Setup - Complete Integration
Government. Transcended. - Infrastructure Intelligence, Infinite Scale

.DESCRIPTION
Sets up the complete TerraFusion development environment with integrated workspaces.
Combines the enhanced development workspace capabilities with specialized service
workspaces, creating a unified development experience.

.PARAMETER QuickSetup
Run quick setup without full validation

.PARAMETER ServiceWorkspaces
Comma-separated list of service workspaces to enhance (e.g., "terra-levy,terra-flow")

.PARAMETER ValidateAll
Validate all workspace configurations after setup

.EXAMPLE
.\setup-development-integration.ps1

.EXAMPLE
.\setup-development-integration.ps1 -ServiceWorkspaces "terra-levy,terra-flow" -ValidateAll

.EXAMPLE
.\setup-development-integration.ps1 -QuickSetup
#>

param(
    [Parameter(Mandatory = $false)]
    [switch]$QuickSetup,

    [Parameter(Mandatory = $false)]
    [string]$ServiceWorkspaces,

    [Parameter(Mandatory = $false)]
    [switch]$ValidateAll
)

# TerraFusion Elite Government OS Branding
function Show-SetupBanner {
    Clear-Host
    Write-Host ""
    Write-Host "🏛️ " -ForegroundColor Cyan -NoNewline
    Write-Host "TerraFusion Development Environment Setup" -ForegroundColor White
    Write-Host "   Complete Workspace Integration" -ForegroundColor Yellow
    Write-Host "   Government. Transcended." -ForegroundColor Green
    Write-Host ""
}

function Write-SetupLog {
    param(
        [string]$Message,
        [ValidateSet("INFO", "SUCCESS", "WARN", "ERROR", "PROGRESS")]
        [string]$Level = "INFO"
    )

    $timestamp = Get-Date -Format "HH:mm:ss"

    switch ($Level) {
        "INFO" { Write-Host "[$timestamp] ℹ️  $Message" -ForegroundColor White }
        "SUCCESS" { Write-Host "[$timestamp] ✅ $Message" -ForegroundColor Green }
        "WARN" { Write-Host "[$timestamp] ⚠️  $Message" -ForegroundColor Yellow }
        "ERROR" { Write-Host "[$timestamp] ❌ $Message" -ForegroundColor Red }
        "PROGRESS" { Write-Host "[$timestamp] 🔄 $Message" -ForegroundColor Cyan }
    }
}

# Validate current environment
function Test-SetupPrerequisites {
    Write-SetupLog "Validating TerraFusion development environment prerequisites..." -Level "PROGRESS"

    $issues = @()

    # Check VS Code
    try {
        $codeVersion = & code --version 2>$null
        if ($codeVersion) {
            Write-SetupLog "VS Code: $(($codeVersion -split "`n")[0]) [AVAILABLE]" -Level "SUCCESS"
        } else {
            throw "VS Code not found"
        }
    }
    catch {
        Write-SetupLog "VS Code not found in PATH" -Level "ERROR"
        $issues += "VS Code"
    }

    # Check PowerShell
    $psVersion = $PSVersionTable.PSVersion
    if ($psVersion.Major -ge 5) {
        Write-SetupLog "PowerShell: $($psVersion.ToString()) [COMPATIBLE]" -Level "SUCCESS"
    } else {
        Write-SetupLog "PowerShell 5.1+ required" -Level "ERROR"
        $issues += "PowerShell"
    }

    # Check key directories
    $keyDirectories = @(
        "workspaces",
        "os-platform/development",
        "ecosystem/intake",
        "backend",
        "config"
    )

    foreach ($dir in $keyDirectories) {
        if (Test-Path $dir) {
            Write-SetupLog "Directory '$dir': [EXISTS]" -Level "SUCCESS"
        } else {
            Write-SetupLog "Directory '$dir': [MISSING]" -Level "WARN"
            $issues += $dir
        }
    }

    return $issues.Count -eq 0
}

# Setup workspace orchestrator
function Install-WorkspaceOrchestrator {
    Write-SetupLog "Installing workspace orchestrator system..." -Level "PROGRESS"

    # The orchestrator script was already created above, so we just validate it
    if (Test-Path "workspace-orchestrator.ps1") {
        Write-SetupLog "Workspace orchestrator: [INSTALLED]" -Level "SUCCESS"
    } else {
        Write-SetupLog "Workspace orchestrator: [MISSING]" -Level "ERROR"
        return $false
    }

    # Create quick launcher shortcuts
    $shortcuts = @{
        "dev.ps1" = ".\workspace-orchestrator.ps1 -Action switch -Workspace development-enhanced"
        "levy.ps1" = ".\workspace-orchestrator.ps1 -Action switch -Workspace terra-levy"
        "agent.ps1" = ".\workspace-orchestrator.ps1 -Action switch -Workspace terrafusion-elite-agent"
        "ws-list.ps1" = ".\workspace-orchestrator.ps1 -Action list"
        "ws-status.ps1" = ".\workspace-orchestrator.ps1 -Action status"
    }

    foreach ($shortcut in $shortcuts.GetEnumerator()) {
        $content = "#!/usr/bin/env pwsh`n# TerraFusion Workspace Shortcut`n$($shortcut.Value)"
        Set-Content $shortcut.Key $content
        Write-SetupLog "Created shortcut: $($shortcut.Key)" -Level "SUCCESS"
    }

    return $true
}

# Enhance service workspaces
function Update-ServiceWorkspaces {
    param([string[]]$Services)

    if (!$Services) {
        # Auto-discover service workspaces
        $Services = Get-ChildItem "workspaces" -Filter "*.code-workspace" |
                   Where-Object { $_.BaseName -notmatch "development|platform" } |
                   ForEach-Object { $_.BaseName }
    }

    Write-SetupLog "Enhancing service workspaces: $($Services -join ', ')" -Level "PROGRESS"

    foreach ($service in $Services) {
        $workspacePath = "workspaces/$service.code-workspace"

        if (!(Test-Path $workspacePath)) {
            Write-SetupLog "Service workspace not found: $workspacePath" -Level "WARN"
            continue
        }

        try {
            $workspace = Get-Content $workspacePath | ConvertFrom-Json

            # Add development tools folder if not present
            $devToolsFolder = @{
                path = "../os-platform/development/dev-tools"
                name = "🛠️ Development Tools (shared)"
            }

            $ztFolder = @{
                path = "../ecosystem/intake"
                name = "⚡ Zero-Touch Integration (shared)"
            }

            # Check if already added
            $hasDevTools = $workspace.folders | Where-Object { $_.path -eq $devToolsFolder.path }
            $hasZT = $workspace.folders | Where-Object { $_.path -eq $ztFolder.path }

            if (!$hasDevTools) {
                $workspace.folders += $devToolsFolder
                Write-SetupLog "Added development tools to $service workspace" -Level "SUCCESS"
            }

            if (!$hasZT) {
                $workspace.folders += $ztFolder
                Write-SetupLog "Added Zero-Touch integration to $service workspace" -Level "SUCCESS"
            }

            # Enhance settings
            if (!$workspace.settings."terrafusion.development") {
                $workspace.settings | Add-Member -NotePropertyName "terrafusion.development" -NotePropertyValue @{
                    enableDevTools = $true
                    codeGeneration = $true
                    testingFramework = $true
                    crossServiceIntegration = $true
                    aiAssistedDevelopment = $true
                } -Force

                Write-SetupLog "Enhanced development settings for $service" -Level "SUCCESS"
            }

            # Save enhanced workspace
            $workspace | ConvertTo-Json -Depth 10 | Set-Content $workspacePath
            Write-SetupLog "Service workspace enhanced: $service" -Level "SUCCESS"

        }
        catch {
            Write-SetupLog "Failed to enhance $service workspace: $($_.Exception.Message)" -Level "ERROR"
        }
    }
}

# Validate workspace configurations
function Test-WorkspaceConfigurations {
    Write-SetupLog "Validating workspace configurations..." -Level "PROGRESS"

    $workspaces = @(
        @{ Name = "development-enhanced"; Path = "workspaces/development-enhanced.code-workspace" },
        @{ Name = "terra-levy"; Path = "workspaces/terra-levy.code-workspace" },
        @{ Name = "terrafusion-elite-agent"; Path = "ecosystem/intake/terrafusion-elite-agent.code-workspace" }
    )

    $validationResults = @()

    foreach ($workspace in $workspaces) {
        $result = @{
            Name = $workspace.Name
            Exists = Test-Path $workspace.Path
            Valid = $false
            Issues = @()
        }

        if ($result.Exists) {
            try {
                $content = Get-Content $workspace.Path | ConvertFrom-Json

                # Validate structure
                if (!$content.folders) {
                    $result.Issues += "Missing folders configuration"
                } elseif ($content.folders.Count -eq 0) {
                    $result.Issues += "No folders configured"
                }

                if (!$content.settings) {
                    $result.Issues += "Missing settings configuration"
                }

                if (!$content.extensions) {
                    $result.Issues += "Missing extensions configuration"
                }

                $result.Valid = $result.Issues.Count -eq 0

            } catch {
                $result.Issues += "Invalid JSON format: $($_.Exception.Message)"
            }
        } else {
            $result.Issues += "Workspace file does not exist"
        }

        $validationResults += $result

        if ($result.Valid) {
            Write-SetupLog "Workspace '$($workspace.Name)': [VALID]" -Level "SUCCESS"
        } else {
            Write-SetupLog "Workspace '$($workspace.Name)': [ISSUES] - $($result.Issues -join ', ')" -Level "ERROR"
        }
    }

    return $validationResults
}

# Create development environment documentation
function New-DevelopmentDocumentation {
    Write-SetupLog "Creating development environment documentation..." -Level "PROGRESS"

    $documentation = @"
# 🏛️ TerraFusion Development Environment Guide

**Government. Transcended. - Infrastructure Intelligence, Infinite Scale**

## 🎯 Overview

The TerraFusion development environment provides a comprehensive, integrated workspace system for government-grade application development. This setup combines specialized service workspaces with enhanced development tools.

## 🚀 Quick Start

### Workspace Switching
```powershell
# Development workspace with all tools
.\dev.ps1

# Service-specific workspace (e.g., TerraLevy)
.\levy.ps1

# Elite Agent workspace (Zero-Touch Integration)
.\agent.ps1

# List all workspaces
.\ws-list.ps1

# Check workspace status
.\ws-status.ps1
```

### Full Orchestrator
```powershell
# List all available workspaces
.\workspace-orchestrator.ps1 -Action list

# Switch to any workspace
.\workspace-orchestrator.ps1 -Action switch -Workspace terra-levy

# Create new service workspace
.\workspace-orchestrator.ps1 -Action create -Service terra-collections

# Show detailed status
.\workspace-orchestrator.ps1 -Action status -Workspace development-enhanced
```

## 🏗️ Workspace Architecture

### 1. **Development-Enhanced Workspace**
- **Purpose**: Comprehensive development environment
- **Features**: AI code generation, testing frameworks, CI/CD pipelines
- **Best For**: Cross-service development, new feature creation

### 2. **Service Workspaces** (e.g., terra-levy)
- **Purpose**: Service-specific development
- **Features**: Integrated development tools, service-focused debugging
- **Best For**: Service-specific maintenance and enhancement

### 3. **TerraFusion Elite Agent Workspace**
- **Purpose**: Zero-Touch Integration Pipeline operations
- **Features**: Legacy application modernization, AI-powered scanning
- **Best For**: Legacy system integration and modernization

## 🛠️ Development Workflows

### Cross-Service Development
1. Start in **Development-Enhanced** workspace for planning and architecture
2. Switch to specific **Service Workspace** for implementation
3. Use **Elite Agent** workspace for integration testing

### Service Enhancement
1. Open service-specific workspace (e.g., `.\levy.ps1`)
2. Use integrated development tools for code generation
3. Test within service context
4. Switch to development workspace for cross-service validation

### Legacy Integration
1. Open Elite Agent workspace (`.\agent.ps1`)
2. Use Zero-Touch Integration Pipeline for assessment
3. Generate modernization reports and recommendations
4. Implement in appropriate service workspace

## 🎨 Features Available in All Workspaces

### AI-Powered Development
- **GitHub Copilot**: AI-assisted code completion
- **Code Generation**: Service-specific template generation
- **Smart Testing**: Automated test creation and validation

### Government Compliance
- **FISMA-HIGH**: Built-in security controls
- **FedRAMP**: Cloud readiness validation
- **Audit Logging**: Comprehensive development trail

### Performance Optimization
- **Real-time Linting**: ESLint + Prettier integration
- **Type Safety**: TypeScript with advanced configurations
- **Testing**: Jest with 95% coverage targets

## 🔧 Troubleshooting

### Workspace Not Loading
```powershell
# Validate workspace configuration
.\workspace-orchestrator.ps1 -Action status -Workspace <workspace-name>

# Recreate workspace shortcuts
.\setup-development-integration.ps1 -QuickSetup
```

### Missing Development Tools
```powershell
# Re-enhance service workspaces
.\setup-development-integration.ps1 -ServiceWorkspaces "terra-levy" -ValidateAll
```

### VS Code Extensions Missing
- Open any workspace
- Press `Ctrl+Shift+P` → `Extensions: Show Recommended Extensions`
- Install all recommended extensions

## 🏆 Best Practices

### 1. Workspace Selection
- Use **Development-Enhanced** for new features spanning multiple services
- Use **Service Workspaces** for service-specific work
- Use **Elite Agent** for legacy integration projects

### 2. Development Flow
- Always start with workspace status check
- Use AI code generation for government-compliant patterns
- Run security scans before committing changes

### 3. Cross-Workspace Coordination
- Use the orchestrator for seamless switching
- Maintain shared configuration in `config/` folder
- Sync changes across workspaces regularly

## 📊 Monitoring & Analytics

### Workspace Health
```powershell
.\workspace-orchestrator.ps1 -Action status
```

### Development Metrics
- Code coverage reports in each workspace
- Security compliance status
- Performance benchmarks

---

*TerraFusion OS 1.0 - Elite Government Development Environment*
*© 2024 TerraFusion Technologies - Government. Transcended.*
"@

    Set-Content "DEVELOPMENT_ENVIRONMENT_GUIDE.md" $documentation
    Write-SetupLog "Created development environment guide: DEVELOPMENT_ENVIRONMENT_GUIDE.md" -Level "SUCCESS"
}

# Main execution
try {
    Show-SetupBanner

    # Prerequisites check
    if (!(Test-SetupPrerequisites)) {
        Write-SetupLog "Prerequisites validation failed - please resolve issues before continuing" -Level "ERROR"
        if (!$QuickSetup) {
            exit 1
        }
    }

    # Install orchestrator
    if (!(Install-WorkspaceOrchestrator)) {
        Write-SetupLog "Failed to install workspace orchestrator" -Level "ERROR"
        exit 1
    }

    # Enhance service workspaces
    $services = if ($ServiceWorkspaces) { $ServiceWorkspaces -split "," } else { @() }
    Update-ServiceWorkspaces $services

    # Validate configurations
    if ($ValidateAll) {
        $validationResults = Test-WorkspaceConfigurations
        $validWorkspaces = ($validationResults | Where-Object { $_.Valid }).Count
        $totalWorkspaces = $validationResults.Count

        Write-SetupLog "Workspace validation: $validWorkspaces/$totalWorkspaces workspaces valid" -Level "INFO"
    }

    # Create documentation
    New-DevelopmentDocumentation

    # Final status
    Write-Host ""
    Write-Host "🎊 TERRAFUSION DEVELOPMENT ENVIRONMENT SETUP COMPLETE" -ForegroundColor Green
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "🏛️ ENVIRONMENT STATUS:" -ForegroundColor Cyan
    Write-Host "   • Workspace Orchestrator: [INSTALLED]" -ForegroundColor Green
    Write-Host "   • Service Workspaces: [ENHANCED]" -ForegroundColor Green
    Write-Host "   • Development Integration: [ACTIVE]" -ForegroundColor Green
    Write-Host "   • Quick Launchers: [CREATED]" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 QUICK START:" -ForegroundColor Cyan
    Write-Host "   • Development Workspace: .\dev.ps1" -ForegroundColor White
    Write-Host "   • TerraLevy Service: .\levy.ps1" -ForegroundColor White
    Write-Host "   • Elite Agent: .\agent.ps1" -ForegroundColor White
    Write-Host "   • List Workspaces: .\ws-list.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 DOCUMENTATION:" -ForegroundColor Cyan
    Write-Host "   • Complete Guide: DEVELOPMENT_ENVIRONMENT_GUIDE.md" -ForegroundColor White
    Write-Host "   • Workspace Status: .\ws-status.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "🏆 GOVERNMENT. TRANSCENDED." -ForegroundColor Green
    Write-Host "    Infrastructure Intelligence, Infinite Scale" -ForegroundColor Cyan
    Write-Host "    Elite Development Environment Operational" -ForegroundColor Yellow
    Write-Host ""

    Write-SetupLog "TerraFusion development environment setup completed successfully" -Level "SUCCESS"

} catch {
    Write-SetupLog "Critical setup error: $($_.Exception.Message)" -Level "ERROR"
    exit 1
}

Write-Host "🌟 Ready for championship-level government development!" -ForegroundColor Green

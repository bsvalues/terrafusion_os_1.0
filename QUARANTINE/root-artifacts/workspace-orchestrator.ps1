#!/usr/bin/env pwsh
<#
.SYNOPSIS
TerraFusion Workspace Orchestrator - Elite Development Environment Manager
Government. Transcended. - Infrastructure Intelligence, Infinite Scale

.DESCRIPTION
Manages and coordinates multiple TerraFusion workspaces including specialized service
workspaces (terra-levy, terra-flow, etc.) and the enhanced development workspace.
Provides seamless switching, cross-workspace synchronization, and unified development experience.

.PARAMETER Action
The orchestration action to perform (list, switch, sync, status, create)

.PARAMETER Workspace
Target workspace name (terra-levy, development-enhanced, terrafusion-elite-agent)

.PARAMETER Service
Service name for creating new service workspaces

.PARAMETER ShowAll
Show all available workspaces including inactive ones

.EXAMPLE
.\workspace-orchestrator.ps1 -Action list

.EXAMPLE
.\workspace-orchestrator.ps1 -Action switch -Workspace terra-levy

.EXAMPLE
.\workspace-orchestrator.ps1 -Action sync -Workspace development-enhanced

.EXAMPLE
.\workspace-orchestrator.ps1 -Action create -Service terra-collections
#>

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("list", "switch", "sync", "status", "create", "link")]
    [string]$Action,

    [Parameter(Mandatory = $false)]
    [string]$Workspace,

    [Parameter(Mandatory = $false)]
    [string]$Service,

    [Parameter(Mandatory = $false)]
    [switch]$ShowAll
)

# TerraFusion Elite Government OS Branding
function Show-OrchestratorBanner {
    Clear-Host
    Write-Host ""
    Write-Host "🏛️ " -ForegroundColor Cyan -NoNewline
    Write-Host "TerraFusion Workspace Orchestrator" -ForegroundColor White
    Write-Host "   Elite Development Environment Manager" -ForegroundColor Yellow
    Write-Host "   Government. Transcended." -ForegroundColor Green
    Write-Host ""
}

function Write-OrchestratorLog {
    param(
        [string]$Message,
        [ValidateSet("INFO", "SUCCESS", "WARN", "ERROR", "WORKSPACE")]
        [string]$Level = "INFO"
    )

    $timestamp = Get-Date -Format "HH:mm:ss"

    switch ($Level) {
        "INFO" { Write-Host "[$timestamp] ℹ️  $Message" -ForegroundColor White }
        "SUCCESS" { Write-Host "[$timestamp] ✅ $Message" -ForegroundColor Green }
        "WARN" { Write-Host "[$timestamp] ⚠️  $Message" -ForegroundColor Yellow }
        "ERROR" { Write-Host "[$timestamp] ❌ $Message" -ForegroundColor Red }
        "WORKSPACE" { Write-Host "[$timestamp] 🏗️  $Message" -ForegroundColor Cyan }
    }
}

# Get all available workspaces
function Get-TerraFusionWorkspaces {
    $workspaces = @()

    # Core workspaces
    $coreWorkspaces = @(
        @{ Name = "development-enhanced"; Path = "workspaces/development-enhanced.code-workspace"; Type = "Development"; Description = "Enhanced development environment with cross-service capabilities" },
        @{ Name = "development"; Path = "workspaces/development.code-workspace"; Type = "Development"; Description = "Original development workspace with AI tools" },
        @{ Name = "terrafusion-elite-agent"; Path = "ecosystem/intake/terrafusion-elite-agent.code-workspace"; Type = "Elite Agent"; Description = "Zero-Touch Integration Pipeline workspace" }
    )

    # Service workspaces (auto-discover)
    $serviceWorkspaces = Get-ChildItem "workspaces" -Filter "*.code-workspace" | ForEach-Object {
        @{
            Name = $_.BaseName
            Path = "workspaces/$($_.Name)"
            Type = "Service"
            Description = "Specialized service workspace"
        }
    }

    # Platform workspaces
    $platformWorkspaces = Get-ChildItem "workspaces/platform" -Filter "*.code-workspace" -ErrorAction SilentlyContinue | ForEach-Object {
        @{
            Name = "platform-$($_.BaseName)"
            Path = "workspaces/platform/$($_.Name)"
            Type = "Platform"
            Description = "Platform-specific workspace"
        }
    }

    $workspaces += $coreWorkspaces
    $workspaces += $serviceWorkspaces
    $workspaces += $platformWorkspaces

    return $workspaces
}

# List all workspaces
function Show-WorkspaceList {
    Write-OrchestratorLog "Discovering TerraFusion workspaces..." -Level "INFO"

    $workspaces = Get-TerraFusionWorkspaces

    Write-Host ""
    Write-Host "🏛️ TERRAFUSION WORKSPACE ECOSYSTEM" -ForegroundColor Green
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""

    # Group by type
    $groupedWorkspaces = $workspaces | Group-Object Type

    foreach ($group in $groupedWorkspaces) {
        $icon = switch ($group.Name) {
            "Development" { "🛠️" }
            "Elite Agent" { "🤖" }
            "Service" { "⚡" }
            "Platform" { "🏗️" }
            default { "📁" }
        }

        Write-Host "$icon $($group.Name.ToUpper()) WORKSPACES:" -ForegroundColor Cyan

        foreach ($workspace in $group.Group) {
            $status = if (Test-Path $workspace.Path) { "✅ Available" } else { "❌ Missing" }
            $statusColor = if (Test-Path $workspace.Path) { "Green" } else { "Red" }

            Write-Host "   • " -ForegroundColor Gray -NoNewline
            Write-Host "$($workspace.Name)" -ForegroundColor White -NoNewline
            Write-Host " - $status" -ForegroundColor $statusColor

            if ($ShowAll) {
                Write-Host "     Path: $($workspace.Path)" -ForegroundColor Gray
                Write-Host "     Description: $($workspace.Description)" -ForegroundColor Gray
            }
        }
        Write-Host ""
    }

    Write-Host "💡 QUICK ACTIONS:" -ForegroundColor Yellow
    Write-Host "   • Switch: .\workspace-orchestrator.ps1 -Action switch -Workspace <name>" -ForegroundColor White
    Write-Host "   • Status: .\workspace-orchestrator.ps1 -Action status -Workspace <name>" -ForegroundColor White
    Write-Host "   • Create: .\workspace-orchestrator.ps1 -Action create -Service <service-name>" -ForegroundColor White
    Write-Host ""
}

# Switch to a workspace
function Switch-ToWorkspace {
    param([string]$WorkspaceName)

    $workspaces = Get-TerraFusionWorkspaces
    $targetWorkspace = $workspaces | Where-Object { $_.Name -eq $WorkspaceName }

    if (!$targetWorkspace) {
        Write-OrchestratorLog "Workspace '$WorkspaceName' not found" -Level "ERROR"
        Write-Host ""
        Write-Host "Available workspaces:" -ForegroundColor Yellow
        $workspaces | ForEach-Object { Write-Host "   • $($_.Name)" -ForegroundColor White }
        return
    }

    if (!(Test-Path $targetWorkspace.Path)) {
        Write-OrchestratorLog "Workspace file not found: $($targetWorkspace.Path)" -Level "ERROR"
        return
    }

    Write-OrchestratorLog "Switching to workspace: $WorkspaceName" -Level "WORKSPACE"
    Write-OrchestratorLog "Type: $($targetWorkspace.Type)" -Level "INFO"
    Write-OrchestratorLog "Description: $($targetWorkspace.Description)" -Level "INFO"

    try {
        & code $targetWorkspace.Path

        Write-Host ""
        Write-Host "🎊 WORKSPACE SWITCHED SUCCESSFULLY" -ForegroundColor Green
        Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host ""
        Write-Host "🏛️ ACTIVE WORKSPACE: " -ForegroundColor Cyan -NoNewline
        Write-Host $WorkspaceName -ForegroundColor White
        Write-Host "📂 WORKSPACE TYPE: " -ForegroundColor Cyan -NoNewline
        Write-Host $targetWorkspace.Type -ForegroundColor White
        Write-Host "🎯 CAPABILITIES: " -ForegroundColor Cyan -NoNewline
        Write-Host $targetWorkspace.Description -ForegroundColor White
        Write-Host ""

        # Show workspace-specific quick actions
        switch ($targetWorkspace.Type) {
            "Development" {
                Write-Host "🛠️ DEVELOPMENT ACTIONS:" -ForegroundColor Yellow
                Write-Host "   • Build All: Ctrl+Shift+P → 'Tasks: Run Task' → 'Build All Development Platform'" -ForegroundColor White
                Write-Host "   • Generate Code: Ctrl+Shift+P → 'Tasks: Run Task' → 'Generate Service Code'" -ForegroundColor White
                Write-Host "   • Run Tests: Ctrl+Shift+P → 'Tasks: Run Task' → 'Test All Development Services'" -ForegroundColor White
            }
            "Elite Agent" {
                Write-Host "🤖 ELITE AGENT ACTIONS:" -ForegroundColor Yellow
                Write-Host "   • System Status: Ctrl+Shift+P → 'Tasks: Run Task' → 'TerraFusion: System Status'" -ForegroundColor White
                Write-Host "   • Scan Legacy App: Ctrl+Shift+P → 'Tasks: Run Task' → 'ZT-IP: Scan Legacy Application'" -ForegroundColor White
                Write-Host "   • Run Demo: Ctrl+Shift+P → 'Tasks: Run Task' → 'ZT-IP: Run Demo'" -ForegroundColor White
            }
            "Service" {
                Write-Host "⚡ SERVICE ACTIONS:" -ForegroundColor Yellow
                Write-Host "   • Build Service: Ctrl+Shift+P → 'Tasks: Run Task' → 'Build'" -ForegroundColor White
                Write-Host "   • Test Service: Ctrl+Shift+P → 'Tasks: Run Task' → 'Test'" -ForegroundColor White
                Write-Host "   • Security Scan: Ctrl+Shift+P → 'Tasks: Run Task' → 'Security Compliance Scan'" -ForegroundColor White
            }
        }

        Write-Host ""
        Write-Host "🏆 GOVERNMENT. TRANSCENDED." -ForegroundColor Green
        Write-Host "    Infrastructure Intelligence, Infinite Scale" -ForegroundColor Cyan
        Write-Host ""

    } catch {
        Write-OrchestratorLog "Failed to open workspace: $($_.Exception.Message)" -Level "ERROR"
    }
}

# Show workspace status
function Show-WorkspaceStatus {
    param([string]$WorkspaceName)

    if ($WorkspaceName) {
        $workspaces = Get-TerraFusionWorkspaces
        $targetWorkspace = $workspaces | Where-Object { $_.Name -eq $WorkspaceName }

        if (!$targetWorkspace) {
            Write-OrchestratorLog "Workspace '$WorkspaceName' not found" -Level "ERROR"
            return
        }

        Write-Host ""
        Write-Host "🔍 WORKSPACE STATUS: $WorkspaceName" -ForegroundColor Cyan
        Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host ""

        $exists = Test-Path $targetWorkspace.Path
        $status = if ($exists) { "✅ Available" } else { "❌ Missing" }
        $statusColor = if ($exists) { "Green" } else { "Red" }

        Write-Host "📂 Workspace File: " -ForegroundColor White -NoNewline
        Write-Host $status -ForegroundColor $statusColor
        Write-Host "🎯 Type: " -ForegroundColor White -NoNewline
        Write-Host $targetWorkspace.Type -ForegroundColor Yellow
        Write-Host "📝 Description: " -ForegroundColor White -NoNewline
        Write-Host $targetWorkspace.Description -ForegroundColor Gray
        Write-Host "📍 Path: " -ForegroundColor White -NoNewline
        Write-Host $targetWorkspace.Path -ForegroundColor Gray

        if ($exists) {
            try {
                $workspaceContent = Get-Content $targetWorkspace.Path | ConvertFrom-Json
                $folderCount = $workspaceContent.folders.Count
                $taskCount = if ($workspaceContent.tasks.tasks) { $workspaceContent.tasks.tasks.Count } else { 0 }
                $launchCount = if ($workspaceContent.launch.configurations) { $workspaceContent.launch.configurations.Count } else { 0 }

                Write-Host ""
                Write-Host "📊 WORKSPACE METRICS:" -ForegroundColor Yellow
                Write-Host "   • Folders: $folderCount" -ForegroundColor White
                Write-Host "   • Tasks: $taskCount" -ForegroundColor White
                Write-Host "   • Launch Configurations: $launchCount" -ForegroundColor White

            } catch {
                Write-Host ""
                Write-Host "⚠️ Warning: Could not parse workspace file" -ForegroundColor Yellow
            }
        }

    } else {
        # Show overall system status
        Write-Host ""
        Write-Host "🏛️ TERRAFUSION WORKSPACE ECOSYSTEM STATUS" -ForegroundColor Green
        Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host ""

        $workspaces = Get-TerraFusionWorkspaces
        $availableCount = ($workspaces | Where-Object { Test-Path $_.Path }).Count
        $totalCount = $workspaces.Count
        $healthPercentage = [math]::Round(($availableCount / $totalCount) * 100, 1)

        Write-Host "📊 ECOSYSTEM HEALTH: " -ForegroundColor Cyan -NoNewline
        Write-Host "$healthPercentage% ($availableCount/$totalCount workspaces available)" -ForegroundColor Green

        $groupedWorkspaces = $workspaces | Group-Object Type
        foreach ($group in $groupedWorkspaces) {
            $availableInGroup = ($group.Group | Where-Object { Test-Path $_.Path }).Count
            $totalInGroup = $group.Group.Count

            Write-Host "   • $($group.Name): $availableInGroup/$totalInGroup available" -ForegroundColor White
        }
    }

    Write-Host ""
}

# Create new service workspace
function New-ServiceWorkspace {
    param([string]$ServiceName)

    if (!$ServiceName) {
        Write-OrchestratorLog "Service name is required for workspace creation" -Level "ERROR"
        return
    }

    $workspacePath = "workspaces/$ServiceName.code-workspace"

    if (Test-Path $workspacePath) {
        Write-OrchestratorLog "Workspace already exists: $workspacePath" -Level "WARN"
        $response = Read-Host "Overwrite existing workspace? (y/N)"
        if ($response -ne "y" -and $response -ne "Y") {
            return
        }
    }

    Write-OrchestratorLog "Creating new service workspace: $ServiceName" -Level "WORKSPACE"

    # Generate workspace content based on terra-levy pattern
    $workspaceContent = @{
        folders = @(
            @{ path = "../$ServiceName/api"; name = "🚀 $ServiceName API" },
            @{ path = "../$ServiceName/core-services"; name = "⚡ $ServiceName Core" },
            @{ path = "../$ServiceName/testing"; name = "🧪 $ServiceName Tests" },
            @{ path = "../SDK"; name = "📦 Platform SDK (read-only)" },
            @{ path = "../backend"; name = "🔧 Shared Backend (read-only)" },
            @{ path = "../docs/$ServiceName"; name = "📚 $ServiceName Docs" },
            @{ path = "../config"; name = "⚙️ Config (shared)" }
        )
        settings = @{
            "files.exclude" = @{
                "**/node_modules" = $true
                "**/dist" = $true
                "**/bin" = $true
                "**/obj" = $true
            }
            "editor.formatOnSave" = $true
            "terrafusion.sync" = @{
                autoSync = $true
                syncInterval = 25
                conflictResolution = "prompt"
                sharedState = @{
                    backend = "read-only"
                    sdk = "read-only"
                    config = "shared-write"
                }
            }
            "terrafusion.compliance" = @{
                fismaMode = "HIGH"
                nist80053 = $true
                section508 = $true
                auditTrail = "comprehensive"
            }
        }
        extensions = @{
            recommendations = @(
                "ms-dotnettools.csharp",
                "dbaeumer.vscode-eslint",
                "esbenp.prettier-vscode",
                "ms-vscode.vscode-typescript-next",
                "streetsidesoftware.code-spell-checker"
            )
        }
        tasks = @{
            version = "2.0.0"
            tasks = @(
                @{
                    label = "Build $ServiceName"
                    type = "shell"
                    command = "dotnet"
                    args = @("build", "--configuration", "Debug")
                    options = @{ cwd = "`${workspaceFolder}/$ServiceName/core-services" }
                    group = @{ kind = "build"; isDefault = $true }
                },
                @{
                    label = "Test $ServiceName"
                    type = "shell"
                    command = "dotnet"
                    args = @("test", "--configuration", "Debug")
                    options = @{ cwd = "`${workspaceFolder}/$ServiceName/testing" }
                    group = @{ kind = "test"; isDefault = $true }
                }
            )
        }
    }

    try {
        $workspaceContent | ConvertTo-Json -Depth 10 | Set-Content $workspacePath
        Write-OrchestratorLog "Service workspace created successfully: $workspacePath" -Level "SUCCESS"

        Write-Host ""
        Write-Host "🎊 NEW SERVICE WORKSPACE CREATED" -ForegroundColor Green
        Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host ""
        Write-Host "🏗️ SERVICE: " -ForegroundColor Cyan -NoNewline
        Write-Host $ServiceName -ForegroundColor White
        Write-Host "📂 WORKSPACE: " -ForegroundColor Cyan -NoNewline
        Write-Host $workspacePath -ForegroundColor White
        Write-Host ""
        Write-Host "🚀 NEXT STEPS:" -ForegroundColor Yellow
        Write-Host "   1. Create service directories: mkdir $ServiceName/{api,core-services,testing}" -ForegroundColor White
        Write-Host "   2. Switch to workspace: .\workspace-orchestrator.ps1 -Action switch -Workspace $ServiceName" -ForegroundColor White
        Write-Host "   3. Begin development with government-grade patterns" -ForegroundColor White
        Write-Host ""

    } catch {
        Write-OrchestratorLog "Failed to create workspace: $($_.Exception.Message)" -Level "ERROR"
    }
}

# Link development workspace with service workspaces
function Link-Workspaces {
    Write-OrchestratorLog "Creating cross-workspace linkage system..." -Level "WORKSPACE"

    # Create workspace coordination script
    $coordinatorScript = @"
#!/usr/bin/env pwsh
# TerraFusion Workspace Coordinator
# Auto-generated by workspace-orchestrator.ps1

param([string]`$TargetWorkspace, [string]`$Action)

switch (`$Action) {
    "dev" {
        # Switch to development-enhanced workspace
        code "workspaces/development-enhanced.code-workspace"
    }
    "service" {
        # Switch to specific service workspace
        if (`$TargetWorkspace) {
            code "workspaces/`$TargetWorkspace.code-workspace"
        } else {
            Write-Host "Available services:" -ForegroundColor Yellow
            Get-ChildItem "workspaces" -Filter "*.code-workspace" | ForEach-Object {
                Write-Host "   • `$(`$_.BaseName)" -ForegroundColor White
            }
        }
    }
    "agent" {
        # Switch to elite agent workspace
        code "ecosystem/intake/terrafusion-elite-agent.code-workspace"
    }
    default {
        Write-Host "🏛️ TerraFusion Workspace Quick Switcher" -ForegroundColor Cyan
        Write-Host "Usage:" -ForegroundColor Yellow
        Write-Host "   .\workspace-coordinator.ps1 -Action dev                    # Development workspace" -ForegroundColor White
        Write-Host "   .\workspace-coordinator.ps1 -Action service -TargetWorkspace terra-levy  # Service workspace" -ForegroundColor White
        Write-Host "   .\workspace-coordinator.ps1 -Action agent                  # Elite agent workspace" -ForegroundColor White
    }
}
"@

    Set-Content "workspace-coordinator.ps1" $coordinatorScript
    Write-OrchestratorLog "Created workspace coordinator: workspace-coordinator.ps1" -Level "SUCCESS"

    Write-Host ""
    Write-Host "🔗 WORKSPACE LINKAGE COMPLETE" -ForegroundColor Green
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 QUICK WORKSPACE SWITCHING:" -ForegroundColor Yellow
    Write-Host "   • Development: .\workspace-coordinator.ps1 -Action dev" -ForegroundColor White
    Write-Host "   • Service: .\workspace-coordinator.ps1 -Action service -TargetWorkspace terra-levy" -ForegroundColor White
    Write-Host "   • Elite Agent: .\workspace-coordinator.ps1 -Action agent" -ForegroundColor White
    Write-Host ""
}

# Main execution
try {
    Show-OrchestratorBanner

    switch ($Action) {
        "list" {
            Show-WorkspaceList
        }
        "switch" {
            if (!$Workspace) {
                Write-OrchestratorLog "Workspace name required for switch action" -Level "ERROR"
                exit 1
            }
            Switch-ToWorkspace $Workspace
        }
        "status" {
            Show-WorkspaceStatus $Workspace
        }
        "create" {
            if (!$Service) {
                Write-OrchestratorLog "Service name required for create action" -Level "ERROR"
                exit 1
            }
            New-ServiceWorkspace $Service
        }
        "link" {
            Link-Workspaces
        }
        "sync" {
            Write-OrchestratorLog "Cross-workspace synchronization starting..." -Level "WORKSPACE"
            # Implement sync logic here
            Write-OrchestratorLog "Sync functionality coming soon" -Level "INFO"
        }
    }

} catch {
    Write-OrchestratorLog "Critical orchestrator error: $($_.Exception.Message)" -Level "ERROR"
    exit 1
}

Write-Host "🌟 Workspace orchestration completed!" -ForegroundColor Green

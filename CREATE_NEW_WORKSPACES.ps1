#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Create TerraFusion OS Specialized Team Workspaces
.DESCRIPTION
    Creates dedicated VS Code workspaces for specialized development teams.
    Each workspace configured for focused development with proper folder structure.
#>

param(
    [string]$WorkspacesPath = "c:\Users\bsval\terrafusion_os_1.0\workspaces"
)

Write-Host "🏛️ Creating TerraFusion OS Specialized Team Workspaces..." -ForegroundColor Cyan

# New workspaces to create
$NewWorkspaces = @(
    @{
        Name = "native-shell"
        Description = "C# WPF Desktop Application & OS Integration"
        Folders = @("native-shell", "apps/desktop-electron")
        Team = "Native Shell Team"
    },
    @{
        Name = "terrafusion-browser"
        Description = "Custom Government Browser (WebView2-based)"
        Folders = @("native-shell", "frontend")
        Team = "TerraFusion Browser Team"
    },
    @{
        Name = "government-apps"
        Description = "Full Government Applications"
        Folders = @("government-core", "government-edition", "property-workbench")
        Team = "Government Applications Team"
    },
    @{
        Name = "dashboards"
        Description = "Real-time Dashboards & Widgets"
        Folders = @("terra-fusion-dashboard", "monitoring", "analytics-platform")
        Team = "Dashboard & Widgets Team"
    },
    @{
        Name = "agent-interfaces"
        Description = "AI Agent User Interfaces & Human-Agent Interaction"
        Folders = @("ai-systems", "consciousness", "terrabuild-modernization")
        Team = "Agent UI/UX Team"
    },
    @{
        Name = "sdk"
        Description = "Software Development Kit for TerraFusion Applications"
        Folders = @("SDK", "tools", "templates")
        Team = "SDK Team"
    },
    @{
        Name = "adk"
        Description = "Agent Development Kit for AI Agent Creation"
        Folders = @("terrabuild-modernization/server/mcp", "ai-systems", "SDK")
        Team = "ADK Team"
    },
    @{
        Name = "design-system"
        Description = "TerraFusion Quantum Design System"
        Folders = @("frontend/src/components", "Brand_Assets", "design")
        Team = "UI/UX Design Team"
    }
)

foreach ($workspace in $NewWorkspaces) {
    $workspaceName = $workspace.Name
    $workspaceFile = Join-Path $WorkspacesPath "$workspaceName.code-workspace"

    Write-Host "📁 Creating workspace: $workspaceName" -ForegroundColor Green

    # Create workspace configuration
    $workspaceConfig = @{
        folders = @()
        settings = @{
            "workbench.colorTheme" = "TerraFusion Dark"
            "workbench.iconTheme" = "terrafusion-icons"
            "editor.formatOnSave" = $true
            "editor.codeActionsOnSave" = @{
                "source.fixAll" = $true
            }
            "terrafusion.team" = $workspace.Team
            "terrafusion.focus" = $workspace.Description
        }
        extensions = @{
            recommendations = @(
                "ms-vscode.vscode-typescript-next",
                "bradlc.vscode-tailwindcss",
                "ms-dotnettools.csharp",
                "ms-python.python",
                "ms-vscode.powershell",
                "GitHub.copilot",
                "terrafusion.ai-agent-tools"
            )
        }
    }

    # Add folders to workspace
    foreach ($folder in $workspace.Folders) {
        $folderPath = "../../$folder"
        $workspaceConfig.folders += @{
            name = Split-Path $folder -Leaf
            path = $folderPath
        }
    }

    # Write workspace file
    $workspaceConfig | ConvertTo-Json -Depth 10 | Out-File -FilePath $workspaceFile -Encoding UTF8

    Write-Host "  ✅ Created: $workspaceFile" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🎯 Team Workspace Creation Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open each workspace in VS Code" -ForegroundColor Gray
Write-Host "2. Install recommended extensions" -ForegroundColor Gray
Write-Host "3. Configure team-specific settings" -ForegroundColor Gray
Write-Host "4. Set up team documentation in each workspace" -ForegroundColor Gray
Write-Host ""

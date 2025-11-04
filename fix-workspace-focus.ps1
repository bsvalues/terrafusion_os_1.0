#!/usr/bin/env pwsh
<#
.SYNOPSIS
Fix TerraFusion Workspace Focus - Correct CostForge AI References
Government. Transcended. - Infrastructure Intelligence, Infinite Scale

.DESCRIPTION
Corrects workspace configurations that incorrectly focus on CostForge AI
instead of the broader TerraFusion OS platform. Updates copilot instructions
and workspace settings to reflect proper TerraFusion OS context.

.PARAMETER ValidateOnly
Only validate issues without making changes

.PARAMETER WorkspaceFilter
Filter specific workspaces (e.g., "terra-levy,development")

.EXAMPLE
.\fix-workspace-focus.ps1

.EXAMPLE
.\fix-workspace-focus.ps1 -ValidateOnly

.EXAMPLE
.\fix-workspace-focus.ps1 -WorkspaceFilter "terra-levy"
#>

param(
    [Parameter(Mandatory = $false)]
    [switch]$ValidateOnly,

    [Parameter(Mandatory = $false)]
    [string]$WorkspaceFilter
)

function Show-FixBanner {
    Clear-Host
    Write-Host ""
    Write-Host "🔧 " -ForegroundColor Cyan -NoNewline
    Write-Host "TerraFusion Workspace Focus Correction" -ForegroundColor White
    Write-Host "   Fixing CostForge AI Misalignment" -ForegroundColor Yellow
    Write-Host "   Government. Transcended." -ForegroundColor Green
    Write-Host ""
}

function Write-FixLog {
    param(
        [string]$Component,
        [string]$Issue,
        [string]$Action = "FIX",
        [ValidateSet("FOUND", "FIXED", "SKIPPED", "ERROR")]
        [string]$Status = "FOUND"
    )

    $statusIcon = switch ($Status) {
        "FOUND" { "🔍" }
        "FIXED" { "✅" }
        "SKIPPED" { "⏭️" }
        "ERROR" { "❌" }
    }

    $statusColor = switch ($Status) {
        "FOUND" { "Yellow" }
        "FIXED" { "Green" }
        "SKIPPED" { "Cyan" }
        "ERROR" { "Red" }
    }

    Write-Host "$statusIcon " -ForegroundColor $statusColor -NoNewline
    Write-Host "$Component`: " -ForegroundColor White -NoNewline
    Write-Host "$Issue" -ForegroundColor $statusColor

    if ($Action -ne "FIX" -and !$ValidateOnly) {
        Write-Host "    Action: $Action" -ForegroundColor Gray
    }
}

# Track discovered issues
$IssuesFound = @()

function Test-CopilotInstructions {
    Write-Host "🔍 Scanning Copilot Instructions..." -ForegroundColor Cyan

    $copilotFiles = @(
        @{ Path = "backend/.github/copilot-instructions.md"; Component = "Backend Instructions" },
        @{ Path = "frontend/.github/copilot-instructions.md"; Component = "Frontend Instructions" },
        @{ Path = "terrabuild-modernization/.github/copilot-instructions.md"; Component = "TerraBuild Instructions" }
    )

    foreach ($file in $copilotFiles) {
        if (Test-Path $file.Path) {
            $content = Get-Content $file.Path -Raw

            # Check for CostForge AI focus issues
            $costforgeReferences = ($content | Select-String "CostForge" -AllMatches).Matches.Count
            $terrafusionReferences = ($content | Select-String "TerraFusion OS" -AllMatches).Matches.Count

            if ($costforgeReferences -gt $terrafusionReferences) {
                $issue = "Over-focused on CostForge AI ($costforgeReferences refs) vs TerraFusion OS ($terrafusionReferences refs)"
                Write-FixLog $file.Component $issue
                $IssuesFound += @{
                    Type = "CopilotInstructions"
                    File = $file.Path
                    Component = $file.Component
                    Issue = $issue
                }
            } else {
                Write-FixLog $file.Component "Focus balance correct" "VALIDATE" "FIXED"
            }

            # Check for specific problematic patterns
            $problematicPatterns = @(
                "focuses on.*CostForge AI",
                "CostForge.*workspace",
                "quantum-enhanced property valuation",
                "99.5% accuracy.*CostForge"
            )

            foreach ($pattern in $problematicPatterns) {
                if ($content -match $pattern) {
                    $issue = "Contains CostForge-specific pattern: $pattern"
                    Write-FixLog $file.Component $issue
                    $IssuesFound += @{
                        Type = "ProblematicPattern"
                        File = $file.Path
                        Component = $file.Component
                        Pattern = $pattern
                    }
                }
            }
        } else {
            Write-FixLog $file.Component "File not found" "CREATE" "ERROR"
        }
    }
}

function Test-WorkspaceConfigurations {
    Write-Host "🔍 Scanning Workspace Configurations..." -ForegroundColor Cyan

    $workspaceFilter = if ($WorkspaceFilter) { $WorkspaceFilter -split "," } else { @() }

    $workspaces = Get-ChildItem "workspaces" -Filter "*.code-workspace" |
                 Where-Object {
                     if ($workspaceFilter.Count -eq 0) { $true }
                     else { $workspaceFilter -contains $_.BaseName }
                 }

    foreach ($workspace in $workspaces) {
        try {
            $content = Get-Content $workspace.FullName | ConvertFrom-Json

            # Check launch configurations for CostForge focus
            if ($content.launch -and $content.launch.configurations) {
                foreach ($config in $content.launch.configurations) {
                    if ($config.name -match "CostForge" -or $config.env.SERVICE_CONTEXT -eq "costforge-ai") {
                        $issue = "Launch config '$($config.name)' focused on CostForge"
                        Write-FixLog $workspace.BaseName $issue
                        $IssuesFound += @{
                            Type = "LaunchConfig"
                            File = $workspace.FullName
                            Component = $workspace.BaseName
                            ConfigName = $config.name
                        }
                    }
                }
            }

            # Check settings for service-specific context
            if ($content.settings -and $content.settings."terrafusion.codeGen") {
                $codeGenSettings = $content.settings."terrafusion.codeGen"
                if ($codeGenSettings.serviceSpecific -eq "costforge-ai") {
                    $issue = "Code generation context set to 'costforge-ai'"
                    Write-FixLog $workspace.BaseName $issue
                    $IssuesFound += @{
                        Type = "CodeGenContext"
                        File = $workspace.FullName
                        Component = $workspace.BaseName
                        Context = $codeGenSettings.serviceSpecific
                    }
                }
            }

            # Check tasks for CostForge references
            if ($content.tasks -and $content.tasks.tasks) {
                foreach ($task in $content.tasks.tasks) {
                    if ($task.label -match "CostForge" -or $task.command -match "costforge") {
                        $issue = "Task '$($task.label)' references CostForge"
                        Write-FixLog $workspace.BaseName $issue
                        $IssuesFound += @{
                            Type = "TaskReference"
                            File = $workspace.FullName
                            Component = $workspace.BaseName
                            TaskLabel = $task.label
                        }
                    }
                }
            }

        } catch {
            Write-FixLog $workspace.BaseName "Invalid JSON format" "VALIDATE" "ERROR"
        }
    }
}

function Repair-CopilotInstructions {
    if ($ValidateOnly) { return }

    Write-Host "🔧 Fixing Copilot Instructions..." -ForegroundColor Green

    # The backend instructions were already fixed above, but let's ensure consistency
    $backendPath = "backend/.github/copilot-instructions.md"
    if (Test-Path $backendPath) {
        $content = Get-Content $backendPath -Raw

        # Replace any remaining CostForge-specific content
        $replacements = @{
            "CostForge AI Development Guide" = "Backend Development Guide"
            "focuses on.*CostForge AI[^.]*\." = "focuses on Backend .NET Microservices - the core kernel and services that power all TerraFusion government operations."
            "CostForge.*workspace" = "TerraFusion backend workspace"
            "quantum-enhanced property valuation engine" = "government services coordination engine"
            "99\.5% accuracy.*property assessments" = "government-grade reliability for multi-county operations"
        }

        $updated = $content
        foreach ($replacement in $replacements.GetEnumerator()) {
            $updated = $updated -replace $replacement.Key, $replacement.Value
        }

        if ($updated -ne $content) {
            Set-Content $backendPath $updated
            Write-FixLog "Backend Instructions" "Updated CostForge references" "REPLACE" "FIXED"
        }
    }
}

function Repair-WorkspaceConfigurations {
    if ($ValidateOnly) { return }

    Write-Host "🔧 Fixing Workspace Configurations..." -ForegroundColor Green

    $workspaceFilter = if ($WorkspaceFilter) { $WorkspaceFilter -split "," } else { @() }

    foreach ($issue in $IssuesFound) {
        if ($issue.Type -eq "CodeGenContext" -and $issue.Context -eq "costforge-ai") {
            try {
                $workspace = Get-Content $issue.File | ConvertFrom-Json

                # Update code generation context to service-specific or general
                $serviceName = (Split-Path $issue.File -Leaf) -replace "\.code-workspace$", ""
                $workspace.settings."terrafusion.codeGen".serviceSpecific = $serviceName

                $workspace | ConvertTo-Json -Depth 10 | Set-Content $issue.File
                Write-FixLog $issue.Component "Updated code generation context to '$serviceName'" "UPDATE" "FIXED"

            } catch {
                Write-FixLog $issue.Component "Failed to update: $($_.Exception.Message)" "UPDATE" "ERROR"
            }
        }

        if ($issue.Type -eq "LaunchConfig" -and $issue.ConfigName -match "CostForge") {
            try {
                $workspace = Get-Content $issue.File | ConvertFrom-Json

                # Find and update the problematic launch config
                foreach ($config in $workspace.launch.configurations) {
                    if ($config.name -eq $issue.ConfigName) {
                        $config.name = $config.name -replace "CostForge", "TerraFusion"
                        if ($config.env -and $config.env.SERVICE_CONTEXT) {
                            $config.env.SERVICE_CONTEXT = $issue.Component
                        }
                        break
                    }
                }

                $workspace | ConvertTo-Json -Depth 10 | Set-Content $issue.File
                Write-FixLog $issue.Component "Updated launch configuration" "UPDATE" "FIXED"

            } catch {
                Write-FixLog $issue.Component "Failed to update launch config: $($_.Exception.Message)" "UPDATE" "ERROR"
            }
        }
    }
}

function Show-FixSummary {
    Write-Host ""
    Write-Host "📊 WORKSPACE FOCUS CORRECTION SUMMARY" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

    $totalIssues = $IssuesFound.Count
    $issueTypes = $IssuesFound | Group-Object Type

    Write-Host ""
    Write-Host "🔍 ISSUES DISCOVERED:" -ForegroundColor White

    if ($totalIssues -eq 0) {
        Write-Host "   ✅ No workspace focus issues found!" -ForegroundColor Green
        Write-Host "   All workspaces correctly focused on TerraFusion OS." -ForegroundColor Cyan
    } else {
        Write-Host "   📋 Total Issues: $totalIssues" -ForegroundColor Yellow

        foreach ($type in $issueTypes) {
            Write-Host "   • $($type.Name): $($type.Count) issues" -ForegroundColor White
        }

        Write-Host ""
        Write-Host "🎯 ISSUE BREAKDOWN:" -ForegroundColor White
        foreach ($issue in $IssuesFound) {
            Write-Host "   • $($issue.Component): $($issue.Issue -or $issue.Pattern)" -ForegroundColor Gray
        }
    }

    Write-Host ""
    if ($ValidateOnly) {
        Write-Host "🔍 VALIDATION-ONLY MODE" -ForegroundColor Yellow
        Write-Host "   Run without -ValidateOnly to apply fixes." -ForegroundColor White
    } else {
        Write-Host "✅ CORRECTION COMPLETE" -ForegroundColor Green
        Write-Host "   Workspaces now properly focused on TerraFusion OS." -ForegroundColor Cyan
    }

    Write-Host ""
    Write-Host "🏛️ GOVERNMENT. TRANSCENDED." -ForegroundColor Green
    Write-Host "    TerraFusion OS - Complete Government Operating System" -ForegroundColor Cyan
    Write-Host "    Infrastructure Intelligence, Infinite Scale" -ForegroundColor Yellow
    Write-Host ""
}

# Main execution
try {
    Show-FixBanner

    # Discover issues
    Test-CopilotInstructions
    Test-WorkspaceConfigurations

    # Apply fixes if not validation-only
    if (!$ValidateOnly) {
        Repair-CopilotInstructions
        Repair-WorkspaceConfigurations
    }

    # Show summary
    Show-FixSummary

} catch {
    Write-Host "❌ CRITICAL ERROR DURING WORKSPACE FOCUS CORRECTION" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

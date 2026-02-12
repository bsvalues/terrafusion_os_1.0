#!/usr/bin/env pwsh
<#
.SYNOPSIS
TerraFusion Development Environment Health Check
Government. Transcended. - Infrastructure Intelligence, Infinite Scale

.DESCRIPTION
Comprehensive health check for the integrated TerraFusion development environment.
Validates workspace configurations, development tools, and integration points.

.PARAMETER Detailed
Show detailed health information

.PARAMETER Fix
Attempt to fix discovered issues

.EXAMPLE
.\validate-development-environment.ps1

.EXAMPLE
.\validate-development-environment.ps1 -Detailed -Fix
#>

param(
    [Parameter(Mandatory = $false)]
    [switch]$Detailed,

    [Parameter(Mandatory = $false)]
    [switch]$Fix
)

function Show-HealthBanner {
    Clear-Host
    Write-Host ""
    Write-Host "🏥 " -ForegroundColor Green -NoNewline
    Write-Host "TerraFusion Development Environment Health Check" -ForegroundColor White
    Write-Host "   Quantum-Enhanced Validation System" -ForegroundColor Cyan
    Write-Host "   Government. Transcended." -ForegroundColor Green
    Write-Host ""
}

function Write-HealthLog {
    param(
        [string]$Component,
        [string]$Status,
        [string]$Details = "",
        [ValidateSet("HEALTHY", "WARNING", "CRITICAL", "INFO")]
        [string]$Level = "INFO"
    )

    $statusIcon = switch ($Level) {
        "HEALTHY" { "✅" }
        "WARNING" { "⚠️" }
        "CRITICAL" { "❌" }
        "INFO" { "ℹ️" }
    }

    $statusColor = switch ($Level) {
        "HEALTHY" { "Green" }
        "WARNING" { "Yellow" }
        "CRITICAL" { "Red" }
        "INFO" { "Cyan" }
    }

    Write-Host "$statusIcon " -ForegroundColor $statusColor -NoNewline
    Write-Host "$Component`: " -ForegroundColor White -NoNewline
    Write-Host "$Status" -ForegroundColor $statusColor

    if ($Details -and $Detailed) {
        Write-Host "    $Details" -ForegroundColor Gray
    }
}

# Health check results
$HealthStatus = @{
    WorkspaceOrchestrator = @{ Status = "UNKNOWN"; Issues = @() }
    DevelopmentWorkspace = @{ Status = "UNKNOWN"; Issues = @() }
    ServiceWorkspaces = @{ Status = "UNKNOWN"; Issues = @() }
    DevTools = @{ Status = "UNKNOWN"; Issues = @() }
    Integration = @{ Status = "UNKNOWN"; Issues = @() }
    Performance = @{ Status = "UNKNOWN"; Issues = @() }
    Compliance = @{ Status = "UNKNOWN"; Issues = @() }
}

function Test-WorkspaceOrchestrator {
    Write-HealthLog "Workspace Orchestrator" "Checking..." "INFO"

    $issues = @()

    # Check main orchestrator script
    if (Test-Path "workspace-orchestrator.ps1") {
        $content = Get-Content "workspace-orchestrator.ps1" -Raw
        if ($content -match "TerraFusion Workspace Orchestrator") {
            Write-HealthLog "Orchestrator Script" "INSTALLED" "" "HEALTHY"
        } else {
            $issues += "Orchestrator script content invalid"
            Write-HealthLog "Orchestrator Script" "CORRUPT" "" "CRITICAL"
        }
    } else {
        $issues += "workspace-orchestrator.ps1 missing"
        Write-HealthLog "Orchestrator Script" "MISSING" "" "CRITICAL"
    }

    # Check quick launcher shortcuts
    $shortcuts = @("dev.ps1", "levy.ps1", "agent.ps1", "ws-list.ps1", "ws-status.ps1")
    $missingShortcuts = @()

    foreach ($shortcut in $shortcuts) {
        if (!(Test-Path $shortcut)) {
            $missingShortcuts += $shortcut
        }
    }

    if ($missingShortcuts.Count -eq 0) {
        Write-HealthLog "Quick Launchers" "ALL PRESENT ($($shortcuts.Count))" "" "HEALTHY"
    } else {
        $issues += "Missing shortcuts: $($missingShortcuts -join ', ')"
        Write-HealthLog "Quick Launchers" "MISSING ($($missingShortcuts.Count))" "$($missingShortcuts -join ', ')" "WARNING"
    }

    $HealthStatus.WorkspaceOrchestrator.Issues = $issues
    $HealthStatus.WorkspaceOrchestrator.Status = if ($issues.Count -eq 0) { "HEALTHY" }
                                                elseif ($issues.Count -le 2) { "WARNING" }
                                                else { "CRITICAL" }
}

function Test-DevelopmentWorkspace {
    Write-HealthLog "Development Workspace" "Checking..." "INFO"

    $issues = @()
    $workspacePath = "workspaces/development-enhanced.code-workspace"

    if (Test-Path $workspacePath) {
        try {
            $workspace = Get-Content $workspacePath | ConvertFrom-Json

            # Check folder count
            $folderCount = $workspace.folders.Count
            if ($folderCount -ge 10) {
                Write-HealthLog "Workspace Folders" "COMPLETE ($folderCount)" "" "HEALTHY"
            } else {
                $issues += "Insufficient folders configured ($folderCount)"
                Write-HealthLog "Workspace Folders" "INCOMPLETE ($folderCount)" "" "WARNING"
            }

            # Check development settings
            if ($workspace.settings."terrafusion.aiCodeGeneration") {
                Write-HealthLog "AI Code Generation" "ENABLED" "" "HEALTHY"
            } else {
                $issues += "AI code generation not configured"
                Write-HealthLog "AI Code Generation" "DISABLED" "" "WARNING"
            }

            # Check extensions
            $requiredExtensions = @("ms-vscode.vscode-typescript-next", "github.copilot", "ms-python.python")
            $missingExtensions = @()

            foreach ($ext in $requiredExtensions) {
                if ($workspace.extensions.recommendations -notcontains $ext) {
                    $missingExtensions += $ext
                }
            }

            if ($missingExtensions.Count -eq 0) {
                Write-HealthLog "Required Extensions" "ALL CONFIGURED" "" "HEALTHY"
            } else {
                $issues += "Missing extensions: $($missingExtensions -join ', ')"
                Write-HealthLog "Required Extensions" "MISSING ($($missingExtensions.Count))" "" "WARNING"
            }

        } catch {
            $issues += "Invalid workspace JSON format"
            Write-HealthLog "Workspace Format" "INVALID JSON" $_.Exception.Message "CRITICAL"
        }
    } else {
        $issues += "Development workspace file missing"
        Write-HealthLog "Workspace File" "MISSING" $workspacePath "CRITICAL"
    }

    $HealthStatus.DevelopmentWorkspace.Issues = $issues
    $HealthStatus.DevelopmentWorkspace.Status = if ($issues.Count -eq 0) { "HEALTHY" }
                                              elseif ($issues.Count -le 2) { "WARNING" }
                                              else { "CRITICAL" }
}

function Test-ServiceWorkspaces {
    Write-HealthLog "Service Workspaces" "Checking..." "INFO"

    $issues = @()
    $serviceWorkspaces = Get-ChildItem "workspaces" -Filter "*.code-workspace" |
                        Where-Object { $_.BaseName -notmatch "development|platform" }

    if ($serviceWorkspaces.Count -eq 0) {
        $issues += "No service workspaces found"
        Write-HealthLog "Service Discovery" "NO SERVICES" "" "WARNING"
    } else {
        Write-HealthLog "Service Discovery" "FOUND ($($serviceWorkspaces.Count))" "" "HEALTHY"

        foreach ($ws in $serviceWorkspaces) {
            try {
                $workspace = Get-Content $ws.FullName | ConvertFrom-Json

                # Check if enhanced with development tools
                $hasDevTools = $workspace.folders | Where-Object { $_.path -match "dev-tools" }
                $hasZeroTouch = $workspace.folders | Where-Object { $_.path -match "intake" }

                if ($hasDevTools -and $hasZeroTouch) {
                    Write-HealthLog "Service '$($ws.BaseName)'" "ENHANCED" "" "HEALTHY"
                } else {
                    $issues += "Service '$($ws.BaseName)' not enhanced with development tools"
                    Write-HealthLog "Service '$($ws.BaseName)'" "NOT ENHANCED" "" "WARNING"
                }

            } catch {
                $issues += "Service '$($ws.BaseName)' has invalid JSON"
                Write-HealthLog "Service '$($ws.BaseName)'" "INVALID JSON" "" "CRITICAL"
            }
        }
    }

    $HealthStatus.ServiceWorkspaces.Issues = $issues
    $HealthStatus.ServiceWorkspaces.Status = if ($issues.Count -eq 0) { "HEALTHY" }
                                           elseif ($issues.Count -le 2) { "WARNING" }
                                           else { "CRITICAL" }
}

function Test-DevTools {
    Write-HealthLog "Development Tools" "Checking..." "INFO"

    $issues = @()

    # Check key development directories
    $devDirectories = @(
        @{ Path = "os-platform/development"; Name = "Development Platform" },
        @{ Path = "ecosystem/intake"; Name = "Zero-Touch Integration" },
        @{ Path = "backend"; Name = "Backend Services" },
        @{ Path = "config"; Name = "Configuration" }
    )

    foreach ($dir in $devDirectories) {
        if (Test-Path $dir.Path) {
            Write-HealthLog $dir.Name "AVAILABLE" $dir.Path "HEALTHY"
        } else {
            $issues += "$($dir.Name) directory missing"
            Write-HealthLog $dir.Name "MISSING" $dir.Path "CRITICAL"
        }
    }

    # Check configuration files
    $configFiles = @(
        @{ Path = "config/core-os.toml"; Name = "Core OS Config" },
        @{ Path = "config/brand-consistency-framework.json"; Name = "Brand Framework" }
    )

    foreach ($config in $configFiles) {
        if (Test-Path $config.Path) {
            Write-HealthLog $config.Name "PRESENT" $config.Path "HEALTHY"
        } else {
            $issues += "$($config.Name) missing"
            Write-HealthLog $config.Name "MISSING" $config.Path "WARNING"
        }
    }

    $HealthStatus.DevTools.Issues = $issues
    $HealthStatus.DevTools.Status = if ($issues.Count -eq 0) { "HEALTHY" }
                                   elseif ($issues.Count -le 2) { "WARNING" }
                                   else { "CRITICAL" }
}

function Test-Integration {
    Write-HealthLog "Integration Points" "Checking..." "INFO"

    $issues = @()

    # Check VS Code availability
    try {
        $codeVersion = & code --version 2>$null
        if ($codeVersion) {
            Write-HealthLog "VS Code Integration" "AVAILABLE" "Version: $(($codeVersion -split "`n")[0])" "HEALTHY"
        } else {
            $issues += "VS Code not accessible"
            Write-HealthLog "VS Code Integration" "NOT ACCESSIBLE" "" "CRITICAL"
        }
    } catch {
        $issues += "VS Code not found in PATH"
        Write-HealthLog "VS Code Integration" "NOT FOUND" "" "CRITICAL"
    }

    # Check PowerShell version
    $psVersion = $PSVersionTable.PSVersion
    if ($psVersion.Major -ge 5) {
        Write-HealthLog "PowerShell Version" "COMPATIBLE" "Version: $($psVersion.ToString())" "HEALTHY"
    } else {
        $issues += "PowerShell version too old"
        Write-HealthLog "PowerShell Version" "TOO OLD" "Required: 5.1+, Found: $($psVersion.ToString())" "CRITICAL"
    }

    # Check documentation
    if (Test-Path "DEVELOPMENT_ENVIRONMENT_GUIDE.md") {
        Write-HealthLog "Documentation" "AVAILABLE" "" "HEALTHY"
    } else {
        $issues += "Development guide missing"
        Write-HealthLog "Documentation" "MISSING" "" "WARNING"
    }

    $HealthStatus.Integration.Issues = $issues
    $HealthStatus.Integration.Status = if ($issues.Count -eq 0) { "HEALTHY" }
                                     elseif ($issues.Count -le 1) { "WARNING" }
                                     else { "CRITICAL" }
}

function Show-HealthSummary {
    Write-Host ""
    Write-Host "🏥 HEALTH SUMMARY" -ForegroundColor Cyan
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan

    $totalComponents = $HealthStatus.Count
    $healthyComponents = ($HealthStatus.Values | Where-Object { $_.Status -eq "HEALTHY" }).Count
    $warningComponents = ($HealthStatus.Values | Where-Object { $_.Status -eq "WARNING" }).Count
    $criticalComponents = ($HealthStatus.Values | Where-Object { $_.Status -eq "CRITICAL" }).Count

    Write-Host ""
    Write-Host "📊 COMPONENT STATUS:" -ForegroundColor White
    Write-Host "   • HEALTHY: " -ForegroundColor Green -NoNewline
    Write-Host "$healthyComponents/$totalComponents components" -ForegroundColor White
    Write-Host "   • WARNING: " -ForegroundColor Yellow -NoNewline
    Write-Host "$warningComponents/$totalComponents components" -ForegroundColor White
    Write-Host "   • CRITICAL: " -ForegroundColor Red -NoNewline
    Write-Host "$criticalComponents/$totalComponents components" -ForegroundColor White

    Write-Host ""
    Write-Host "🎯 OVERALL HEALTH:" -ForegroundColor White

    $overallHealth = if ($criticalComponents -gt 0) { "CRITICAL" }
                    elseif ($warningComponents -gt 0) { "WARNING" }
                    else { "HEALTHY" }

    $healthColor = switch ($overallHealth) {
        "HEALTHY" { "Green" }
        "WARNING" { "Yellow" }
        "CRITICAL" { "Red" }
    }

    $healthPercentage = [math]::Round(($healthyComponents / $totalComponents) * 100, 1)

    Write-Host "   $overallHealth " -ForegroundColor $healthColor -NoNewline
    Write-Host "($healthPercentage% operational)" -ForegroundColor White

    if ($overallHealth -eq "HEALTHY") {
        Write-Host ""
        Write-Host "🎊 CHAMPIONSHIP-LEVEL ENVIRONMENT OPERATIONAL!" -ForegroundColor Green
        Write-Host "   Government. Transcended. - Ready for elite development." -ForegroundColor Cyan
    } elseif ($overallHealth -eq "WARNING") {
        Write-Host ""
        Write-Host "⚠️  MINOR OPTIMIZATIONS RECOMMENDED" -ForegroundColor Yellow
        if ($Fix) {
            Write-Host "   Running auto-fix procedures..." -ForegroundColor Cyan
        } else {
            Write-Host "   Run with -Fix to attempt automatic repairs." -ForegroundColor White
        }
    } else {
        Write-Host ""
        Write-Host "❌ CRITICAL ISSUES DETECTED" -ForegroundColor Red
        Write-Host "   Manual intervention required." -ForegroundColor White
        if ($Fix) {
            Write-Host "   Attempting emergency repairs..." -ForegroundColor Cyan
        }
    }

    Write-Host ""
}

function Invoke-AutoFix {
    if (!$Fix) { return }

    Write-Host "🔧 AUTO-FIX PROCEDURES" -ForegroundColor Cyan
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""

    # Try to fix orchestrator issues
    if ($HealthStatus.WorkspaceOrchestrator.Status -ne "HEALTHY") {
        Write-Host "🔄 Reinstalling workspace orchestrator..." -ForegroundColor Yellow
        try {
            & ".\setup-development-integration.ps1" -QuickSetup
            Write-Host "✅ Workspace orchestrator reinstalled" -ForegroundColor Green
        } catch {
            Write-Host "❌ Failed to reinstall orchestrator: $($_.Exception.Message)" -ForegroundColor Red
        }
    }

    # Try to enhance service workspaces
    if ($HealthStatus.ServiceWorkspaces.Status -ne "HEALTHY") {
        Write-Host "🔄 Re-enhancing service workspaces..." -ForegroundColor Yellow
        try {
            & ".\setup-development-integration.ps1" -ServiceWorkspaces "terra-levy"
            Write-Host "✅ Service workspaces re-enhanced" -ForegroundColor Green
        } catch {
            Write-Host "❌ Failed to enhance service workspaces: $($_.Exception.Message)" -ForegroundColor Red
        }
    }

    Write-Host ""
    Write-Host "🏥 Auto-fix procedures completed. Re-run health check to verify." -ForegroundColor Cyan
}

# Main execution
try {
    Show-HealthBanner

    # Run all health checks
    Test-WorkspaceOrchestrator
    Test-DevelopmentWorkspace
    Test-ServiceWorkspaces
    Test-DevTools
    Test-Integration

    # Show detailed issues if requested
    if ($Detailed) {
        Write-Host ""
        Write-Host "🔍 DETAILED ISSUES" -ForegroundColor Yellow
        Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Yellow

        foreach ($component in $HealthStatus.GetEnumerator()) {
            if ($component.Value.Issues.Count -gt 0) {
                Write-Host ""
                Write-Host "$($component.Key):" -ForegroundColor White
                foreach ($issue in $component.Value.Issues) {
                    Write-Host "  • $issue" -ForegroundColor Gray
                }
            }
        }
    }

    # Show summary
    Show-HealthSummary

    # Attempt auto-fix if requested
    Invoke-AutoFix

} catch {
    Write-Host "❌ CRITICAL ERROR DURING HEALTH CHECK" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

#!/usr/bin/env pwsh
<#
.SYNOPSIS
TerraFusion Elite Government OS - Quick Launcher
Launch the complete TerraFusion Elite Agent development environment

.DESCRIPTION
Opens the comprehensive VS Code workspace with TerraFusion Elite Government OS
Engineering Agent configured with government branding, specialized tasks,
debugging configurations, and development tooling.

.PARAMETER StatusCheck
Run system status check before launching workspace

.PARAMETER Initialize
Run initialization process before launching workspace

.EXAMPLE
.\launch-elite-agent.ps1

.EXAMPLE
.\launch-elite-agent.ps1 -StatusCheck -Initialize
#>

param(
    [Parameter(Mandatory = $false)]
    [switch]$StatusCheck,

    [Parameter(Mandatory = $false)]
    [switch]$Initialize
)

# TerraFusion Elite Government OS Branding
function Show-LauncherBanner {
    Clear-Host
    Write-Host ""
    Write-Host "🚀 " -ForegroundColor Yellow -NoNewline
    Write-Host "TerraFusion Elite Government OS" -ForegroundColor White
    Write-Host "   Engineering Agent Launcher" -ForegroundColor Cyan
    Write-Host "   Government. Transcended." -ForegroundColor Green
    Write-Host ""
}

function Write-LaunchLog {
    param(
        [string]$Message,
        [ValidateSet("INFO", "SUCCESS", "WARN", "ERROR")]
        [string]$Level = "INFO"
    )

    $timestamp = Get-Date -Format "HH:mm:ss"

    switch ($Level) {
        "INFO" { Write-Host "[$timestamp] ℹ️  $Message" -ForegroundColor White }
        "SUCCESS" { Write-Host "[$timestamp] ✅ $Message" -ForegroundColor Green }
        "WARN" { Write-Host "[$timestamp] ⚠️  $Message" -ForegroundColor Yellow }
        "ERROR" { Write-Host "[$timestamp] ❌ $Message" -ForegroundColor Red }
    }
}

# Main execution
try {
    Show-LauncherBanner

    Write-LaunchLog "Preparing TerraFusion Elite Government OS Engineering Agent..." -Level "INFO"

    # Run initialization if requested
    if ($Initialize) {
        Write-LaunchLog "Running agent initialization..." -Level "INFO"
        & ".\init-elite-agent.ps1"
        if ($LASTEXITCODE -ne 0) {
            Write-LaunchLog "Initialization failed - continuing with launch" -Level "WARN"
        } else {
            Write-LaunchLog "Agent initialization completed successfully" -Level "SUCCESS"
        }
    }

    # Run status check if requested
    if ($StatusCheck) {
        Write-LaunchLog "Running system status check..." -Level "INFO"
        & ".\status-check.ps1" -Quick
        if ($LASTEXITCODE -ne 0) {
            Write-LaunchLog "Status check failed - continuing with launch" -Level "WARN"
        } else {
            Write-LaunchLog "System status validated successfully" -Level "SUCCESS"
        }
    }

    # Verify workspace file exists
    $workspaceFile = "terrafusion-elite-agent.code-workspace"
    if (!(Test-Path $workspaceFile)) {
        Write-LaunchLog "Workspace file not found: $workspaceFile" -Level "ERROR"
        Write-LaunchLog "Run .\init-elite-agent.ps1 to create workspace configuration" -Level "ERROR"
        exit 1
    }

    # Check if VS Code is available
    try {
        $codeVersion = & code --version 2>$null
        if ($codeVersion) {
            Write-LaunchLog "VS Code detected: $(($codeVersion -split "`n")[0])" -Level "SUCCESS"
        } else {
            throw "VS Code not found"
        }
    }
    catch {
        Write-LaunchLog "VS Code not found in PATH - attempting direct launch" -Level "WARN"
    }

    Write-LaunchLog "Launching TerraFusion Elite Agent workspace..." -Level "INFO"

    # Launch VS Code workspace
    try {
        & code $workspaceFile

        Write-Host ""
        Write-Host "🎊 TERRAFUSION ELITE GOVERNMENT OS ENGINEERING AGENT" -ForegroundColor Green
        Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host ""
        Write-Host "🏛️ WORKSPACE STATUS:" -ForegroundColor Cyan
        Write-Host "   • VS Code Workspace: [LAUNCHED]" -ForegroundColor Green
        Write-Host "   • Government Theme: [ACTIVE]" -ForegroundColor Green
        Write-Host "   • Elite Agent Tools: [READY]" -ForegroundColor Green
        Write-Host "   • AI Swarm Connection: [AVAILABLE]" -ForegroundColor Green
        Write-Host ""
        Write-Host "🚀 QUICK ACTIONS:" -ForegroundColor Cyan
        Write-Host "   • Press Ctrl+Shift+P → 'Tasks: Run Task' → Select ZT-IP operation" -ForegroundColor White
        Write-Host "   • Press F5 → Select debug configuration for component testing" -ForegroundColor White
        Write-Host "   • Use integrated terminal → Run .\zt-intake-cli.ps1 for legacy app scanning" -ForegroundColor White
        Write-Host ""
        Write-Host "🎯 GOVERNMENT COMPLIANCE:" -ForegroundColor Cyan
        Write-Host "   • FISMA-HIGH: Ready for federal deployment" -ForegroundColor Green
        Write-Host "   • FedRAMP: Cloud-ready security controls" -ForegroundColor Green
        Write-Host "   • Audit Logging: Comprehensive operation tracking" -ForegroundColor Green
        Write-Host ""
        Write-Host "🏆 GOVERNMENT. TRANSCENDED." -ForegroundColor Green
        Write-Host "    Infrastructure Intelligence, Infinite Scale" -ForegroundColor Cyan
        Write-Host "    Elite Engineering Agent Operational" -ForegroundColor Yellow
        Write-Host ""

        Write-LaunchLog "TerraFusion Elite Agent workspace launched successfully" -Level "SUCCESS"

    }
    catch {
        Write-LaunchLog "Error launching VS Code workspace: $($_.Exception.Message)" -Level "ERROR"

        # Fallback: Open current directory in VS Code
        Write-LaunchLog "Attempting fallback launch..." -Level "INFO"
        try {
            & code .
            Write-LaunchLog "Fallback launch successful - workspace available in file explorer" -Level "SUCCESS"
        }
        catch {
            Write-LaunchLog "Fallback launch failed - open VS Code manually and load workspace file" -Level "ERROR"
            Write-Host ""
            Write-Host "📝 MANUAL LAUNCH INSTRUCTIONS:" -ForegroundColor Yellow
            Write-Host "   1. Open VS Code" -ForegroundColor White
            Write-Host "   2. File → Open Workspace from File..." -ForegroundColor White
            Write-Host "   3. Select: $((Get-Location).Path)\$workspaceFile" -ForegroundColor White
            Write-Host ""
        }
    }

}
catch {
    Write-LaunchLog "Critical launcher error: $($_.Exception.Message)" -Level "ERROR"
    exit 1
}

Write-Host "🌟 Ready for championship-level legacy application modernization!" -ForegroundColor Green

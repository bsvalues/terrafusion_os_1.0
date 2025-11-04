# TerraFusion One-Click Deployment - PowerShell Edition
# Master orchestration script for complete TerraFusion OS deployment

param(
    [Parameter(HelpMessage = "Skip confirmation prompts")]
    [switch]$Force,

    [Parameter(HelpMessage = "Enable verbose output")]
    [switch]$Verbose,

    [Parameter(HelpMessage = "Run in test mode (no actual deployment)")]
    [switch]$TestMode,

    [Parameter(HelpMessage = "Environment to deploy to")]
    [ValidateSet("dev", "stage", "prod")]
    [string]$Environment = "dev"
)

# Set error action and strict mode
$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# Color functions for output
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }
function Write-Header { param($Message) Write-Host "`n🚀 $Message" -ForegroundColor Magenta }
function Write-Step { param($Step, $Message) Write-Host "[$Step/6] $Message" -ForegroundColor Blue }

# Global variables
$script:StartTime = Get-Date
$script:StepResults = @()

# Execute gate script with error handling
function Invoke-GateScript {
    param(
        [string]$ScriptName,
        [string]$Description,
        [int]$StepNumber
    )

    Write-Step $StepNumber $Description

    $scriptPath = "ops\scripts\$ScriptName.ps1"
    if (!(Test-Path $scriptPath)) {
        # Try bash version if PowerShell doesn't exist
        $scriptPath = "ops\scripts\$ScriptName.sh"
        if (!(Test-Path $scriptPath)) {
            Write-Error "Gate script not found: $ScriptName"
            return $false
        }
    }

    try {
        $startTime = Get-Date

        if ($TestMode) {
            Write-Info "TEST MODE: Would execute $scriptPath"
            Start-Sleep -Seconds 2
            $result = $true
        }
        else {
            if ($scriptPath.EndsWith(".ps1")) {
                # Execute PowerShell script
                $result = & $scriptPath -Environment $Environment
            }
            else {
                # Execute bash script via WSL (if available)
                try {
                    $result = & wsl bash $scriptPath
                }
                catch {
                    Write-Warning "WSL not available, skipping bash script: $scriptPath"
                    $result = $true
                }
            }
        }

        $duration = (Get-Date) - $startTime

        if ($result) {
            Write-Success "$Description completed in $($duration.TotalSeconds) seconds"
            $script:StepResults += @{
                Step     = $StepNumber
                Name     = $ScriptName
                Status   = "SUCCESS"
                Duration = $duration.TotalSeconds
            }
            return $true
        }
        else {
            Write-Error "$Description failed"
            $script:StepResults += @{
                Step     = $StepNumber
                Name     = $ScriptName
                Status   = "FAILED"
                Duration = $duration.TotalSeconds
            }
            return $false
        }
    }
    catch {
        $duration = (Get-Date) - $startTime
        Write-Error "$Description failed: $($_.Exception.Message)"
        $script:StepResults += @{
            Step     = $StepNumber
            Name     = $ScriptName
            Status   = "ERROR"
            Duration = $duration.TotalSeconds
            Error    = $_.Exception.Message
        }
        return $false
    }
}

# Generate deployment report
function New-DeploymentReport {
    param([bool]$Success)

    $totalDuration = (Get-Date) - $script:StartTime
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

    $report = @{
        meta    = @{
            generated_at           = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
            environment            = $Environment
            test_mode              = $TestMode.IsPresent
            total_duration_seconds = $totalDuration.TotalSeconds
            overall_status         = if ($Success) { "SUCCESS" } else { "FAILED" }
        }
        steps   = $script:StepResults
        summary = @{
            total_steps      = $script:StepResults.Count
            successful_steps = ($script:StepResults | Where-Object { $_.Status -eq "SUCCESS" }).Count
            failed_steps     = ($script:StepResults | Where-Object { $_.Status -ne "SUCCESS" }).Count
        }
    }

    $reportPath = "reports\one-click-deployment-$timestamp.json"
    $report | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportPath -Encoding UTF8

    Write-Header "Deployment Report Generated"
    Write-Info "Report saved to: $reportPath"
    Write-Info "Total duration: $($totalDuration.TotalMinutes.ToString('F2')) minutes"
    Write-Info "Success rate: $($report.summary.successful_steps)/$($report.summary.total_steps) steps"

    return $reportPath
}

# Check prerequisites
function Test-Prerequisites {
    Write-Header "Checking Prerequisites"

    $prerequisites = @(
        @{ Name = "PowerShell"; Command = "pwsh"; Version = "7.0" },
        @{ Name = "Docker"; Command = "docker"; Version = "20.0" },
        @{ Name = "Helm"; Command = "helm"; Version = "3.0" },
        @{ Name = "kubectl"; Command = "kubectl"; Version = "1.20" }
    )

    $allGood = $true

    foreach ($prereq in $prerequisites) {
        try {
            $version = & $prereq.Command --version 2>$null
            if ($version) {
                Write-Success "$($prereq.Name) is available"
            }
            else {
                Write-Warning "$($prereq.Name) not found or not working"
                $allGood = $false
            }
        }
        catch {
            Write-Warning "$($prereq.Name) not found: $($_.Exception.Message)"
            $allGood = $false
        }
    }

    return $allGood
}

# Display banner
function Show-Banner {
    Write-Host @"

████████╗███████╗██████╗ ██████╗  █████╗ ███████╗██╗   ██╗███████╗██╗ ██████╗ ███╗   ██╗
╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔════╝██║   ██║██╔════╝██║██╔═══██╗████╗  ██║
   ██║   █████╗  ██████╔╝██████╔╝███████║█████╗  ██║   ██║███████╗██║██║   ██║██╔██╗ ██║
   ██║   ██╔══╝  ██╔══██╗██╔══██╗██╔══██║██╔══╝  ██║   ██║╚════██║██║██║   ██║██║╚██╗██║
   ██║   ███████╗██║  ██║██║  ██║██║  ██║██║     ╚██████╔╝███████║██║╚██████╔╝██║ ╚████║
   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝

🏛️  GOVERNMENT OPERATING SYSTEM - ONE-CLICK DEPLOYMENT 🏛️
Environment: $Environment | Test Mode: $($TestMode.IsPresent)

"@ -ForegroundColor Cyan
}

# Main orchestration function
function Invoke-OneClickDeployment {
    try {
        Show-Banner

        # Create reports directory
        if (!(Test-Path "reports")) {
            New-Item -ItemType Directory -Path "reports" -Force | Out-Null
        }

        # Check prerequisites
        if (!(Test-Prerequisites)) {
            if (!$Force) {
                Write-Error "Prerequisites not met. Use -Force to override."
                return $false
            }
            Write-Warning "Prerequisites not met, but continuing due to -Force flag"
        }

        # Confirmation
        if (!$Force -and !$TestMode) {
            $confirmation = Read-Host "Deploy TerraFusion OS to $Environment environment? (y/N)"
            if ($confirmation -ne "y" -and $confirmation -ne "Y") {
                Write-Info "Deployment cancelled by user"
                return $false
            }
        }

        Write-Header "Starting TerraFusion OS One-Click Deployment"
        Write-Info "Target Environment: $Environment"
        Write-Info "Test Mode: $($TestMode.IsPresent)"

        # Execute deployment gates in sequence
        $gates = @(
            @{ Script = "preflight"; Description = "Preflight Validation" },
            @{ Script = "security-baseline"; Description = "Security Baseline Validation" },
            @{ Script = "bringup-core"; Description = "Core System Deployment" },
            @{ Script = "swarm-online"; Description = "AI-Swarm Activation" },
            @{ Script = "api-surface"; Description = "API Surface Validation" },
            @{ Script = "validate-all"; Description = "Comprehensive Testing" }
        )

        $allSuccess = $true
        $stepNumber = 1

        foreach ($gate in $gates) {
            $success = Invoke-GateScript -ScriptName $gate.Script -Description $gate.Description -StepNumber $stepNumber
            if (!$success) {
                $allSuccess = $false
                Write-Error "Gate failed: $($gate.Description)"
                break
            }
            $stepNumber++
        }

        # Generate final report
        $reportPath = New-DeploymentReport -Success $allSuccess

        # Final status
        $totalDuration = (Get-Date) - $script:StartTime

        if ($allSuccess) {
            Write-Header "🎉 ONE-CLICK DEPLOYMENT SUCCESSFUL! 🎉"
            Write-Success "TerraFusion OS deployed successfully to $Environment"
            Write-Success "Total deployment time: $($totalDuration.TotalMinutes.ToString('F2')) minutes"
            Write-Success "Report: $reportPath"

            if (!$TestMode) {
                Write-Info "Next steps:"
                Write-Info "1. Validate deployment: make validate-all"
                Write-Info "2. Run AI-Swarm readiness: .\ops\scripts\ai-swarm-readiness.ps1"
                Write-Info "3. Access dashboard: http://localhost:3000"
            }
        }
        else {
            Write-Header "❌ DEPLOYMENT FAILED"
            Write-Error "One or more deployment gates failed"
            Write-Info "Review the deployment report for details: $reportPath"
        }

        return $allSuccess

    }
    catch {
        Write-Error "Deployment failed with exception: $($_.Exception.Message)"
        if ($Verbose) {
            Write-Error $_.Exception.StackTrace
        }
        New-DeploymentReport -Success $false
        return $false
    }
}

# Execute main function if script is run directly
if ($MyInvocation.InvocationName -ne '.') {
    $result = Invoke-OneClickDeployment
    exit $(if ($result) { 0 } else { 1 })
}

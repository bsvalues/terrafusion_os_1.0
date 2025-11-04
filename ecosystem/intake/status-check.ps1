#!/usr/bin/env pwsh
<#
.SYNOPSIS
TerraFusion Elite Government OS - Agent Status Monitor
Championship-Level Legacy Application Modernization Status

.DESCRIPTION
Real-time monitoring and health check for the TerraFusion Elite Government OS
Engineering Agent. Provides comprehensive status across all agent components,
Zero-Touch Integration Pipeline services, and government compliance systems.

.PARAMETER Quick
Run quick health check without detailed diagnostics

.PARAMETER Full
Run comprehensive system analysis with performance metrics

.PARAMETER JsonOutput
Output status in JSON format for automation

.EXAMPLE
.\status-check.ps1

.EXAMPLE
.\status-check.ps1 -Full

.EXAMPLE
.\status-check.ps1 -JsonOutput
#>

param(
    [Parameter(Mandatory = $false)]
    [switch]$Quick,

    [Parameter(Mandatory = $false)]
    [switch]$Full,

    [Parameter(Mandatory = $false)]
    [switch]$JsonOutput
)

# TerraFusion Elite Status Data Structure
$global:TerraFusionStatus = @{
    Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    AgentVersion = "1.0.0"
    Environment = "Elite Government OS"
    OverallStatus = "UNKNOWN"
    Components = @{}
    Metrics = @{}
    Compliance = @{}
    Recommendations = @()
}

function Show-EliteStatusBanner {
    if ($JsonOutput) { return }

    Clear-Host
    Write-Host ""
    Write-Host "🔍 " -ForegroundColor Blue -NoNewline
    Write-Host "TerraFusion Elite Government OS" -ForegroundColor White
    Write-Host "   Engineering Agent Status Monitor" -ForegroundColor Yellow
    Write-Host "   Real-Time Health & Performance Analytics" -ForegroundColor Gray
    Write-Host ""
}

function Write-StatusLog {
    param(
        [string]$Message,
        [ValidateSet("INFO", "SUCCESS", "WARN", "ERROR", "METRIC")]
        [string]$Level = "INFO",
        [switch]$NoNewline
    )

    if ($JsonOutput) { return }

    $timestamp = Get-Date -Format "HH:mm:ss"

    switch ($Level) {
        "INFO" { Write-Host "[$timestamp] ℹ️  $Message" -ForegroundColor White -NoNewline:$NoNewline }
        "SUCCESS" { Write-Host "[$timestamp] ✅ $Message" -ForegroundColor Green -NoNewline:$NoNewline }
        "WARN" { Write-Host "[$timestamp] ⚠️  $Message" -ForegroundColor Yellow -NoNewline:$NoNewline }
        "ERROR" { Write-Host "[$timestamp] ❌ $Message" -ForegroundColor Red -NoNewline:$NoNewline }
        "METRIC" { Write-Host "[$timestamp] 📊 $Message" -ForegroundColor Cyan -NoNewline:$NoNewline }
    }
}

function Test-CoreComponents {
    Write-StatusLog "Analyzing TerraFusion Elite Agent core components..." -Level "INFO"

    $components = @{
        "Package Configuration" = "package.json"
        "TypeScript Config" = "tsconfig.json"
        "ESLint Config" = ".eslintrc.json"
        "Prettier Config" = ".prettierrc"
        "Jest Config" = "jest.config.json"
        "Workspace Config" = "terrafusion-elite-agent.code-workspace"
        "Environment Config" = ".env.development"
        "Legacy Scanner" = "legacy-app-scanner.ts"
        "Integration Orchestrator" = "integration-orchestrator.ts"
        "CLI Interface" = "zt-intake-cli.ps1"
        "Demo Scripts" = "simple-demo.ps1"
        "Initialization Script" = "init-elite-agent.ps1"
    }

    $componentStatus = @{}
    $healthyComponents = 0

    foreach ($component in $components.GetEnumerator()) {
        $exists = Test-Path $component.Value
        $componentStatus[$component.Key] = @{
            Present = $exists
            Path = $component.Value
            Status = if ($exists) { "HEALTHY" } else { "MISSING" }
        }

        if ($exists) {
            $healthyComponents++
            Write-StatusLog "$($component.Key): [HEALTHY]" -Level "SUCCESS"
        } else {
            Write-StatusLog "$($component.Key): [MISSING]" -Level "ERROR"
        }
    }

    $global:TerraFusionStatus.Components = $componentStatus
    $global:TerraFusionStatus.Metrics["ComponentHealthRatio"] = [math]::Round(($healthyComponents / $components.Count) * 100, 1)

    return $healthyComponents -eq $components.Count
}

function Test-Dependencies {
    Write-StatusLog "Validating dependency ecosystem..." -Level "INFO"

    $dependencies = @{}

    # Node.js
    try {
        $nodeVersion = & node --version 2>$null
        if ($nodeVersion) {
            $dependencies["Node.js"] = @{
                Version = $nodeVersion
                Status = "AVAILABLE"
                Required = $true
            }
            Write-StatusLog "Node.js: $nodeVersion [AVAILABLE]" -Level "SUCCESS"
        } else {
            throw "Not found"
        }
    }
    catch {
        $dependencies["Node.js"] = @{
            Version = "Not Found"
            Status = "MISSING"
            Required = $true
        }
        Write-StatusLog "Node.js: [MISSING - CRITICAL]" -Level "ERROR"
    }

    # TypeScript
    try {
        $tscVersion = & npx tsc --version 2>$null
        if ($tscVersion) {
            $dependencies["TypeScript"] = @{
                Version = $tscVersion
                Status = "AVAILABLE"
                Required = $true
            }
            Write-StatusLog "TypeScript: $tscVersion [AVAILABLE]" -Level "SUCCESS"
        } else {
            throw "Not found"
        }
    }
    catch {
        $dependencies["TypeScript"] = @{
            Version = "Not Found"
            Status = "MISSING"
            Required = $true
        }
        Write-StatusLog "TypeScript: [MISSING - CRITICAL]" -Level "ERROR"
    }

    # PowerShell
    $psVersion = $PSVersionTable.PSVersion
    $dependencies["PowerShell"] = @{
        Version = $psVersion.ToString()
        Status = if ($psVersion.Major -ge 5) { "AVAILABLE" } else { "OUTDATED" }
        Required = $true
    }

    if ($psVersion.Major -ge 5) {
        Write-StatusLog "PowerShell: $($psVersion.ToString()) [AVAILABLE]" -Level "SUCCESS"
    } else {
        Write-StatusLog "PowerShell: $($psVersion.ToString()) [OUTDATED]" -Level "WARN"
    }

    # .NET (optional)
    try {
        $dotnetVersion = & dotnet --version 2>$null
        if ($dotnetVersion) {
            $dependencies[".NET SDK"] = @{
                Version = $dotnetVersion
                Status = "AVAILABLE"
                Required = $false
            }
            Write-StatusLog ".NET SDK: $dotnetVersion [AVAILABLE]" -Level "SUCCESS"
        } else {
            throw "Not found"
        }
    }
    catch {
        $dependencies[".NET SDK"] = @{
            Version = "Not Found"
            Status = "OPTIONAL"
            Required = $false
        }
        Write-StatusLog ".NET SDK: [OPTIONAL - NOT INSTALLED]" -Level "WARN"
    }

    # Docker (optional)
    try {
        $dockerVersion = & docker --version 2>$null
        if ($dockerVersion) {
            $dependencies["Docker"] = @{
                Version = $dockerVersion
                Status = "AVAILABLE"
                Required = $false
            }
            Write-StatusLog "Docker: $dockerVersion [AVAILABLE]" -Level "SUCCESS"
        } else {
            throw "Not found"
        }
    }
    catch {
        $dependencies["Docker"] = @{
            Version = "Not Found"
            Status = "OPTIONAL"
            Required = $false
        }
        Write-StatusLog "Docker: [OPTIONAL - NOT INSTALLED]" -Level "WARN"
    }

    $global:TerraFusionStatus.Dependencies = $dependencies

    $criticalMissing = $dependencies.Values | Where-Object { $_.Required -and $_.Status -eq "MISSING" }
    return $criticalMissing.Count -eq 0
}

function Test-NodeModules {
    Write-StatusLog "Checking Node.js dependency installation..." -Level "INFO"

    if (!(Test-Path "package.json")) {
        Write-StatusLog "Package.json not found - skipping dependency check" -Level "WARN"
        return $true
    }

    if (!(Test-Path "node_modules")) {
        Write-StatusLog "Node modules not installed - run 'npm install'" -Level "ERROR"
        $global:TerraFusionStatus.Recommendations += "Run 'npm install' to install dependencies"
        return $false
    }

    try {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        $installedPackages = Get-ChildItem "node_modules" -Directory | Measure-Object

        Write-StatusLog "Node modules: $($installedPackages.Count) packages installed [HEALTHY]" -Level "SUCCESS"
        $global:TerraFusionStatus.Metrics["InstalledPackages"] = $installedPackages.Count

        # Check key dependencies
        $keyDeps = @("typescript", "eslint", "prettier", "jest", "@types/node")
        $missingKeyDeps = @()

        foreach ($dep in $keyDeps) {
            if (Test-Path "node_modules/$dep") {
                Write-StatusLog "Key dependency '$dep': [INSTALLED]" -Level "SUCCESS"
            } else {
                Write-StatusLog "Key dependency '$dep': [MISSING]" -Level "WARN"
                $missingKeyDeps += $dep
            }
        }

        if ($missingKeyDeps.Count -gt 0) {
            $global:TerraFusionStatus.Recommendations += "Install missing key dependencies: $($missingKeyDeps -join ', ')"
        }

        return $missingKeyDeps.Count -eq 0

    }
    catch {
        Write-StatusLog "Error checking node modules: $($_.Exception.Message)" -Level "ERROR"
        return $false
    }
}

function Test-SystemResources {
    if ($Quick) { return $true }

    Write-StatusLog "Analyzing system resources and performance..." -Level "INFO"

    try {
        # Memory usage
        $memory = Get-WmiObject -Class Win32_OperatingSystem
        $totalMemGB = [math]::Round($memory.TotalVisibleMemorySize / 1024 / 1024, 2)
        $freeMemGB = [math]::Round($memory.FreePhysicalMemory / 1024 / 1024, 2)
        $usedMemPercent = [math]::Round((($totalMemGB - $freeMemGB) / $totalMemGB) * 100, 1)

        $global:TerraFusionStatus.Metrics["TotalMemoryGB"] = $totalMemGB
        $global:TerraFusionStatus.Metrics["FreeMemoryGB"] = $freeMemGB
        $global:TerraFusionStatus.Metrics["MemoryUsagePercent"] = $usedMemPercent

        if ($usedMemPercent -lt 80) {
            Write-StatusLog "Memory: $freeMemGB GB free / $totalMemGB GB total ($usedMemPercent% used) [HEALTHY]" -Level "SUCCESS"
        } elseif ($usedMemPercent -lt 90) {
            Write-StatusLog "Memory: $freeMemGB GB free / $totalMemGB GB total ($usedMemPercent% used) [WARNING]" -Level "WARN"
        } else {
            Write-StatusLog "Memory: $freeMemGB GB free / $totalMemGB GB total ($usedMemPercent% used) [CRITICAL]" -Level "ERROR"
        }

        # Disk space
        $disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'"
        $totalDiskGB = [math]::Round($disk.Size / 1GB, 2)
        $freeDiskGB = [math]::Round($disk.FreeSpace / 1GB, 2)
        $usedDiskPercent = [math]::Round((($totalDiskGB - $freeDiskGB) / $totalDiskGB) * 100, 1)

        $global:TerraFusionStatus.Metrics["TotalDiskGB"] = $totalDiskGB
        $global:TerraFusionStatus.Metrics["FreeDiskGB"] = $freeDiskGB
        $global:TerraFusionStatus.Metrics["DiskUsagePercent"] = $usedDiskPercent

        if ($usedDiskPercent -lt 80) {
            Write-StatusLog "Disk Space: $freeDiskGB GB free / $totalDiskGB GB total ($usedDiskPercent% used) [HEALTHY]" -Level "SUCCESS"
        } elseif ($usedDiskPercent -lt 90) {
            Write-StatusLog "Disk Space: $freeDiskGB GB free / $totalDiskGB GB total ($usedDiskPercent% used) [WARNING]" -Level "WARN"
        } else {
            Write-StatusLog "Disk Space: $freeDiskGB GB free / $totalDiskGB GB total ($usedDiskPercent% used) [CRITICAL]" -Level "ERROR"
        }

        # CPU information
        $cpu = Get-WmiObject -Class Win32_Processor
        $cpuName = $cpu.Name
        $cpuCores = $cpu.NumberOfCores

        $global:TerraFusionStatus.Metrics["CPUName"] = $cpuName
        $global:TerraFusionStatus.Metrics["CPUCores"] = $cpuCores

        Write-StatusLog "CPU: $cpuName ($cpuCores cores) [AVAILABLE]" -Level "SUCCESS"

        return $true

    }
    catch {
        Write-StatusLog "Error analyzing system resources: $($_.Exception.Message)" -Level "ERROR"
        return $false
    }
}

function Test-NetworkConnectivity {
    if ($Quick) { return $true }

    Write-StatusLog "Testing network connectivity for TerraFusion services..." -Level "INFO"

    $endpoints = @{
        "GitHub" = "github.com"
        "NPM Registry" = "registry.npmjs.org"
        "Microsoft" = "microsoft.com"
        "Azure" = "azure.microsoft.com"
    }

    $connectivity = @{}

    foreach ($endpoint in $endpoints.GetEnumerator()) {
        try {
            $result = Test-NetConnection -ComputerName $endpoint.Value -Port 443 -InformationLevel Quiet -WarningAction SilentlyContinue
            if ($result) {
                $connectivity[$endpoint.Key] = "CONNECTED"
                Write-StatusLog "$($endpoint.Key): [CONNECTED]" -Level "SUCCESS"
            } else {
                $connectivity[$endpoint.Key] = "UNREACHABLE"
                Write-StatusLog "$($endpoint.Key): [UNREACHABLE]" -Level "WARN"
            }
        }
        catch {
            $connectivity[$endpoint.Key] = "ERROR"
            Write-StatusLog "$($endpoint.Key): [ERROR]" -Level "ERROR"
        }
    }

    $global:TerraFusionStatus.Connectivity = $connectivity

    $connectedEndpoints = $connectivity.Values | Where-Object { $_ -eq "CONNECTED" }
    return $connectedEndpoints.Count -gt 0
}

function Test-ComplianceReadiness {
    Write-StatusLog "Validating government compliance readiness..." -Level "INFO"

    $compliance = @{
        "FISMA_Ready" = $false
        "FedRAMP_Ready" = $false
        "Security_Controls" = @()
        "Audit_Logging" = $false
        "Data_Encryption" = $false
    }

    # Check environment configuration
    if (Test-Path ".env.development") {
        $envContent = Get-Content ".env.development" -Raw

        if ($envContent -match "FISMA_LEVEL=HIGH") {
            $compliance.FISMA_Ready = $true
            $compliance.Security_Controls += "FISMA-HIGH"
            Write-StatusLog "FISMA-HIGH compliance: [CONFIGURED]" -Level "SUCCESS"
        } else {
            Write-StatusLog "FISMA-HIGH compliance: [NOT CONFIGURED]" -Level "WARN"
        }

        if ($envContent -match "FEDRAMP_ENABLED=true") {
            $compliance.FedRAMP_Ready = $true
            $compliance.Security_Controls += "FedRAMP"
            Write-StatusLog "FedRAMP compliance: [ENABLED]" -Level "SUCCESS"
        } else {
            Write-StatusLog "FedRAMP compliance: [NOT ENABLED]" -Level "WARN"
        }

        if ($envContent -match "AUDIT_LOGGING=enabled") {
            $compliance.Audit_Logging = $true
            $compliance.Security_Controls += "Audit-Logging"
            Write-StatusLog "Audit logging: [ENABLED]" -Level "SUCCESS"
        } else {
            Write-StatusLog "Audit logging: [NOT ENABLED]" -Level "WARN"
        }

        if ($envContent -match "SECURITY_SCAN_ENABLED=true") {
            $compliance.Security_Controls += "Security-Scanning"
            Write-StatusLog "Security scanning: [ENABLED]" -Level "SUCCESS"
        } else {
            Write-StatusLog "Security scanning: [NOT ENABLED]" -Level "WARN"
        }
    } else {
        Write-StatusLog "Environment configuration not found - compliance status unknown" -Level "WARN"
    }

    $global:TerraFusionStatus.Compliance = $compliance

    return $compliance.FISMA_Ready -and $compliance.FedRAMP_Ready
}

function Get-OverallStatus {
    $components = $global:TerraFusionStatus.Components
    $healthyComponents = ($components.Values | Where-Object { $_.Status -eq "HEALTHY" }).Count
    $totalComponents = $components.Count

    if ($totalComponents -eq 0) {
        return "UNKNOWN"
    }

    $healthRatio = $healthyComponents / $totalComponents

    if ($healthRatio -eq 1.0) {
        return "EXCELLENT"
    } elseif ($healthRatio -ge 0.8) {
        return "GOOD"
    } elseif ($healthRatio -ge 0.6) {
        return "FAIR"
    } elseif ($healthRatio -ge 0.4) {
        return "POOR"
    } else {
        return "CRITICAL"
    }
}

function Show-StatusSummary {
    if ($JsonOutput) { return }

    $status = $global:TerraFusionStatus

    Write-Host ""
    Write-Host "🎊 TERRAFUSION ELITE GOVERNMENT OS AGENT STATUS" -ForegroundColor Green
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""

    # Overall status
    $overallStatus = Get-OverallStatus
    $statusColor = switch ($overallStatus) {
        "EXCELLENT" { "Green" }
        "GOOD" { "Yellow" }
        "FAIR" { "Yellow" }
        "POOR" { "Red" }
        "CRITICAL" { "Red" }
        default { "Gray" }
    }

    Write-Host "🏛️ OVERALL STATUS: " -ForegroundColor Cyan -NoNewline
    Write-Host $overallStatus -ForegroundColor $statusColor

    # Component health
    if ($status.Metrics.ComponentHealthRatio) {
        Write-Host "📊 COMPONENT HEALTH: " -ForegroundColor Cyan -NoNewline
        Write-Host "$($status.Metrics.ComponentHealthRatio)%" -ForegroundColor Green
    }

    # System metrics
    if ($status.Metrics.TotalMemoryGB) {
        Write-Host "💾 MEMORY: " -ForegroundColor Cyan -NoNewline
        Write-Host "$($status.Metrics.FreeMemoryGB) GB free / $($status.Metrics.TotalMemoryGB) GB total" -ForegroundColor White
    }

    if ($status.Metrics.FreeDiskGB) {
        Write-Host "💿 DISK: " -ForegroundColor Cyan -NoNewline
        Write-Host "$($status.Metrics.FreeDiskGB) GB free / $($status.Metrics.TotalDiskGB) GB total" -ForegroundColor White
    }

    # Compliance status
    if ($status.Compliance.FISMA_Ready -and $status.Compliance.FedRAMP_Ready) {
        Write-Host "🛡️ COMPLIANCE: " -ForegroundColor Cyan -NoNewline
        Write-Host "GOVERNMENT-READY" -ForegroundColor Green
    } elseif ($status.Compliance.FISMA_Ready -or $status.Compliance.FedRAMP_Ready) {
        Write-Host "🛡️ COMPLIANCE: " -ForegroundColor Cyan -NoNewline
        Write-Host "PARTIAL" -ForegroundColor Yellow
    } else {
        Write-Host "🛡️ COMPLIANCE: " -ForegroundColor Cyan -NoNewline
        Write-Host "NOT CONFIGURED" -ForegroundColor Red
    }

    # Recommendations
    if ($status.Recommendations.Count -gt 0) {
        Write-Host ""
        Write-Host "💡 RECOMMENDATIONS:" -ForegroundColor Yellow
        foreach ($rec in $status.Recommendations) {
            Write-Host "   • $rec" -ForegroundColor White
        }
    }

    Write-Host ""
    Write-Host "🏆 GOVERNMENT. TRANSCENDED." -ForegroundColor Green
    Write-Host "    Infrastructure Intelligence, Infinite Scale" -ForegroundColor Cyan
    Write-Host ""
}

# Main execution
try {
    Show-EliteStatusBanner

    # Run status checks
    $coreHealthy = Test-CoreComponents
    $depsHealthy = Test-Dependencies
    $modulesHealthy = Test-NodeModules
    $resourcesHealthy = Test-SystemResources
    $networkHealthy = Test-NetworkConnectivity
    $complianceReady = Test-ComplianceReadiness

    # Set overall status
    $global:TerraFusionStatus.OverallStatus = Get-OverallStatus

    # Generate recommendations
    if (!$coreHealthy) {
        $global:TerraFusionStatus.Recommendations += "Run .\init-elite-agent.ps1 to initialize missing components"
    }

    if (!$depsHealthy) {
        $global:TerraFusionStatus.Recommendations += "Install missing critical dependencies (Node.js, TypeScript)"
    }

    if (!$modulesHealthy) {
        $global:TerraFusionStatus.Recommendations += "Run 'npm install' to install Node.js dependencies"
    }

    if (!$complianceReady) {
        $global:TerraFusionStatus.Recommendations += "Configure government compliance settings in .env.development"
    }

    # Output results
    if ($JsonOutput) {
        $global:TerraFusionStatus | ConvertTo-Json -Depth 10
    } else {
        Show-StatusSummary
    }

}
catch {
    Write-StatusLog "Critical status check error: $($_.Exception.Message)" -Level "ERROR"
    if (!$JsonOutput) {
        Write-Host "❌ Status check failed" -ForegroundColor Red
    }
    exit 1
}

if (!$JsonOutput) {
    Write-Host "✅ Status check completed successfully" -ForegroundColor Green
}

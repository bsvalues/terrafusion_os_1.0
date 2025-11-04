# TerraFusion Preflight Validation - PowerShell Edition
# Hardware, OS, ports, DNS validation with JSON reporting

param(
    [Parameter(HelpMessage = "Environment to validate for")]
    [ValidateSet("dev", "stage", "prod")]
    [string]$Environment = "dev",

    [Parameter(HelpMessage = "Skip interactive prompts")]
    [switch]$Quiet,

    [Parameter(HelpMessage = "Enable detailed output")]
    [switch]$Verbose
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

# Global validation results
$script:ValidationResults = @{
    hardware = @{}
    os       = @{}
    ports    = @{}
    dns      = @{}
    storage  = @{}
    network  = @{}
}

# Hardware validation
function Test-Hardware {
    Write-Header "Hardware Validation"

    try {
        # Get system information
        $computer = Get-CimInstance -ClassName Win32_ComputerSystem
        $processor = Get-CimInstance -ClassName Win32_Processor
        $memory = Get-CimInstance -ClassName Win32_PhysicalMemory | Measure-Object -Property Capacity -Sum

        # CPU validation
        $cpuCores = $processor.NumberOfCores
        $cpuLogical = $processor.NumberOfLogicalProcessors

        $script:ValidationResults.hardware.cpu = @{
            cores              = $cpuCores
            logical_processors = $cpuLogical
            name               = $processor.Name
            status             = if ($cpuCores -ge 4) { "PASS" } else { "WARN" }
            message            = if ($cpuCores -ge 4) { "Sufficient CPU cores" } else { "Recommend 4+ CPU cores for optimal performance" }
        }

        if ($cpuCores -ge 4) {
            Write-Success "CPU: $cpuCores cores, $cpuLogical logical processors"
        }
        else {
            Write-Warning "CPU: $cpuCores cores (recommend 4+)"
        }

        # Memory validation
        $totalMemoryGB = [math]::Round($memory.Sum / 1GB, 2)

        $script:ValidationResults.hardware.memory = @{
            total_gb = $totalMemoryGB
            status   = if ($totalMemoryGB -ge 8) { "PASS" } else { "WARN" }
            message  = if ($totalMemoryGB -ge 8) { "Sufficient memory" } else { "Recommend 8+ GB RAM for optimal performance" }
        }

        if ($totalMemoryGB -ge 8) {
            Write-Success "Memory: $totalMemoryGB GB"
        }
        else {
            Write-Warning "Memory: $totalMemoryGB GB (recommend 8+ GB)"
        }

        # Overall hardware status
        $hardwareStatus = if ($cpuCores -ge 4 -and $totalMemoryGB -ge 8) { "PASS" } else { "WARN" }
        Write-Info "Hardware validation: $hardwareStatus"

        return $hardwareStatus -eq "PASS"

    }
    catch {
        Write-Error "Hardware validation failed: $($_.Exception.Message)"
        $script:ValidationResults.hardware.status = "ERROR"
        $script:ValidationResults.hardware.error = $_.Exception.Message
        return $false
    }
}

# Operating System validation
function Test-OperatingSystem {
    Write-Header "Operating System Validation"

    try {
        $os = Get-CimInstance -ClassName Win32_OperatingSystem
        $version = [System.Environment]::OSVersion

        $script:ValidationResults.os = @{
            name               = $os.Caption
            version            = $os.Version
            architecture       = $os.OSArchitecture
            build              = $version.Version.Build
            powershell_version = $PSVersionTable.PSVersion.ToString()
            status             = "PASS"
            message            = "Windows environment validated"
        }

        Write-Success "OS: $($os.Caption)"
        Write-Success "Version: $($os.Version) ($($os.OSArchitecture))"
        Write-Success "PowerShell: $($PSVersionTable.PSVersion)"

        # Check for WSL if needed
        try {
            $wslVersion = & wsl --version 2>$null
            if ($wslVersion) {
                Write-Success "WSL available"
                $script:ValidationResults.os.wsl_available = $true
            }
        }
        catch {
            Write-Info "WSL not available (optional)"
            $script:ValidationResults.os.wsl_available = $false
        }

        return $true

    }
    catch {
        Write-Error "OS validation failed: $($_.Exception.Message)"
        $script:ValidationResults.os.status = "ERROR"
        $script:ValidationResults.os.error = $_.Exception.Message
        return $false
    }
}

# Port availability validation
function Test-Ports {
    Write-Header "Port Availability Validation"

    # Environment-specific port requirements
    $portRequirements = @{
        dev   = @(3000, 3002, 3004, 5000, 8090, 5432, 6379)
        stage = @(3000, 3002, 3004, 5000, 8090, 5432, 6379, 9090, 3100)
        prod  = @(80, 443, 3002, 3004, 5000, 8090, 5432, 6379, 9090, 3100)
    }

    $requiredPorts = $portRequirements[$Environment]
    $portResults = @{}
    $allPortsAvailable = $true

    foreach ($port in $requiredPorts) {
        try {
            $connection = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue

            if ($connection) {
                Write-Warning "Port $port is in use"
                $portResults[$port] = @{
                    status  = "IN_USE"
                    message = "Port is currently occupied"
                }
                $allPortsAvailable = $false
            }
            else {
                Write-Success "Port $port is available"
                $portResults[$port] = @{
                    status  = "AVAILABLE"
                    message = "Port is free for use"
                }
            }
        }
        catch {
            Write-Info "Port $port status unknown"
            $portResults[$port] = @{
                status  = "UNKNOWN"
                message = "Could not determine port status"
            }
        }
    }

    $script:ValidationResults.ports = @{
        environment    = $Environment
        required_ports = $requiredPorts
        results        = $portResults
        status         = if ($allPortsAvailable) { "PASS" } else { "WARN" }
        message        = if ($allPortsAvailable) { "All required ports available" } else { "Some ports are in use" }
    }

    return $allPortsAvailable
}

# DNS and connectivity validation
function Test-DNS {
    Write-Header "DNS and Connectivity Validation"

    $dnsTargets = @(
        @{ Name = "Google DNS"; Host = "8.8.8.8" },
        @{ Name = "Cloudflare DNS"; Host = "1.1.1.1" },
        @{ Name = "GitHub"; Host = "github.com" },
        @{ Name = "Docker Hub"; Host = "hub.docker.com" }
    )

    $dnsResults = @{}
    $allDnsGood = $true

    foreach ($target in $dnsTargets) {
        try {
            $result = Test-NetConnection -ComputerName $target.Host -InformationLevel Quiet -WarningAction SilentlyContinue

            if ($result.PingSucceeded) {
                Write-Success "Connectivity to $($target.Name): OK"
                $dnsResults[$target.Name] = @{
                    host    = $target.Host
                    status  = "SUCCESS"
                    message = "Connection successful"
                }
            }
            else {
                Write-Warning "Connectivity to $($target.Name): FAILED"
                $dnsResults[$target.Name] = @{
                    host    = $target.Host
                    status  = "FAILED"
                    message = "Connection failed"
                }
                $allDnsGood = $false
            }
        }
        catch {
            Write-Warning "Connectivity to $($target.Name): ERROR"
            $dnsResults[$target.Name] = @{
                host    = $target.Host
                status  = "ERROR"
                message = $_.Exception.Message
            }
            $allDnsGood = $false
        }
    }

    $script:ValidationResults.dns = @{
        targets = $dnsResults
        status  = if ($allDnsGood) { "PASS" } else { "WARN" }
        message = if ($allDnsGood) { "All DNS/connectivity tests passed" } else { "Some connectivity issues detected" }
    }

    return $allDnsGood
}

# Storage validation
function Test-Storage {
    Write-Header "Storage Validation"

    try {
        $drives = Get-CimInstance -ClassName Win32_LogicalDisk | Where-Object { $_.DriveType -eq 3 }
        $storageResults = @{}
        $sufficientStorage = $true

        foreach ($drive in $drives) {
            $freeSpaceGB = [math]::Round($drive.FreeSpace / 1GB, 2)
            $totalSpaceGB = [math]::Round($drive.Size / 1GB, 2)
            $usedPercentage = [math]::Round((($drive.Size - $drive.FreeSpace) / $drive.Size) * 100, 1)

            $storageResults[$drive.DeviceID] = @{
                total_gb        = $totalSpaceGB
                free_gb         = $freeSpaceGB
                used_percentage = $usedPercentage
                status          = if ($freeSpaceGB -ge 10) { "PASS" } else { "WARN" }
                message         = if ($freeSpaceGB -ge 10) { "Sufficient space" } else { "Low disk space" }
            }

            if ($freeSpaceGB -ge 10) {
                Write-Success "Drive $($drive.DeviceID) $freeSpaceGB GB free ($totalSpaceGB GB total)"
            }
            else {
                Write-Warning "Drive $($drive.DeviceID) $freeSpaceGB GB free (low space)"
                $sufficientStorage = $false
            }
        }

        $script:ValidationResults.storage = @{
            drives  = $storageResults
            status  = if ($sufficientStorage) { "PASS" } else { "WARN" }
            message = if ($sufficientStorage) { "Sufficient storage available" } else { "Storage space concerns detected" }
        }

        return $sufficientStorage

    }
    catch {
        Write-Error "Storage validation failed: $($_.Exception.Message)"
        $script:ValidationResults.storage.status = "ERROR"
        $script:ValidationResults.storage.error = $_.Exception.Message
        return $false
    }
}

# Network configuration validation
function Test-Network {
    Write-Header "Network Configuration Validation"

    try {
        $adapters = Get-NetAdapter | Where-Object { $_.Status -eq "Up" }
        $networkResults = @{}
        $networkGood = $false

        foreach ($adapter in $adapters) {
            $ipConfig = Get-NetIPAddress -InterfaceIndex $adapter.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue

            if ($ipConfig) {
                $networkResults[$adapter.Name] = @{
                    status                = "UP"
                    ip_address            = $ipConfig.IPAddress
                    interface_description = $adapter.InterfaceDescription
                    link_speed            = $adapter.LinkSpeed
                }

                Write-Success "Network adapter: $($adapter.Name) ($($ipConfig.IPAddress))"
                $networkGood = $true
            }
        }

        $script:ValidationResults.network = @{
            adapters = $networkResults
            status   = if ($networkGood) { "PASS" } else { "ERROR" }
            message  = if ($networkGood) { "Network adapters configured" } else { "No active network adapters found" }
        }

        return $networkGood

    }
    catch {
        Write-Error "Network validation failed: $($_.Exception.Message)"
        $script:ValidationResults.network.status = "ERROR"
        $script:ValidationResults.network.error = $_.Exception.Message
        return $false
    }
}

# Generate validation report
function New-ValidationReport {
    param([bool]$OverallSuccess)

    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

    $report = @{
        meta            = @{
            generated_at    = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
            environment     = $Environment
            overall_status  = if ($OverallSuccess) { "PASS" } else { "WARN" }
            validation_type = "preflight"
        }
        results         = $script:ValidationResults
        summary         = @{
            hardware = $script:ValidationResults.hardware.status
            os       = $script:ValidationResults.os.status
            ports    = $script:ValidationResults.ports.status
            dns      = $script:ValidationResults.dns.status
            storage  = $script:ValidationResults.storage.status
            network  = $script:ValidationResults.network.status
        }
        recommendations = @()
    }

    # Add recommendations based on results
    if ($script:ValidationResults.hardware.status -ne "PASS") {
        $report.recommendations += "Consider upgrading hardware for optimal performance"
    }
    if ($script:ValidationResults.ports.status -ne "PASS") {
        $report.recommendations += "Free up required ports before deployment"
    }
    if ($script:ValidationResults.storage.status -ne "PASS") {
        $report.recommendations += "Free up disk space before deployment"
    }

    # Ensure reports directory exists
    if (!(Test-Path "reports")) {
        New-Item -ItemType Directory -Path "reports" -Force | Out-Null
    }

    $reportPath = "reports\preflight-validation-$timestamp.json"
    $report | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportPath -Encoding UTF8

    Write-Header "Validation Report Generated"
    Write-Info "Report saved to: $reportPath"

    return $reportPath
}

# Main validation function
function Invoke-PreflightValidation {
    Write-Header "TerraFusion Preflight Validation"
    Write-Info "Environment: $Environment"

    try {
        # Run all validation checks
        $hardwareOk = Test-Hardware
        $osOk = Test-OperatingSystem
        $portsOk = Test-Ports
        $dnsOk = Test-DNS
        $storageOk = Test-Storage
        $networkOk = Test-Network

        # Determine overall success
        $criticalChecks = $osOk -and $networkOk
        $warningChecks = $hardwareOk -and $portsOk -and $dnsOk -and $storageOk
        $overallSuccess = $criticalChecks -and $warningChecks

        # Generate report
        $reportPath = New-ValidationReport -OverallSuccess $overallSuccess

        # Final status
        Write-Header "Preflight Validation Complete"

        if ($criticalChecks) {
            if ($overallSuccess) {
                Write-Success "🚀 PREFLIGHT VALIDATION PASSED"
                Write-Success "System ready for TerraFusion OS deployment"
            }
            else {
                Write-Warning "⚠️  PREFLIGHT VALIDATION PASSED WITH WARNINGS"
                Write-Warning "System can deploy but may have performance issues"
            }
        }
        else {
            Write-Error "❌ PREFLIGHT VALIDATION FAILED"
            Write-Error "Critical issues must be resolved before deployment"
        }

        Write-Info "Detailed report: $reportPath"

        return $criticalChecks

    }
    catch {
        Write-Error "Preflight validation failed: $($_.Exception.Message)"
        if ($Verbose) {
            Write-Error $_.Exception.StackTrace
        }
        return $false
    }
}

# Execute main function if script is run directly
if ($MyInvocation.InvocationName -ne '.') {
    $result = Invoke-PreflightValidation
    exit $(if ($result) { 0 } else { 1 })
}

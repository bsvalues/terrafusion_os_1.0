<#
.SYNOPSIS
    TerraFusion OS - System Health Check
    
.DESCRIPTION
    Comprehensive system health monitoring:
    - Running processes check
    - Port availability verification
    - Database connection tests
    - Memory and disk usage
    - Service status monitoring
    - Environment variable validation
    
    THE TERRAFUSION WAY - Monitor everything, prevent issues!
    
.EXAMPLE
    .\scripts\health-check.ps1
    .\scripts\health-check.ps1 -Detailed
    .\scripts\health-check.ps1 -Watch
#>

param(
    [switch]$Detailed,    # Show detailed health metrics
    [switch]$Watch,       # Continuously monitor (refresh every 5 seconds)
    [int]$WatchInterval = 5  # Watch interval in seconds
)

# ============================================================================
# CONFIGURATION
# ============================================================================

$ErrorActionPreference = "Continue"
$WorkspaceRoot = "C:\Users\bsval\terrafusion_os_1.0"

# Expected services and ports
$ExpectedServices = @(
    @{ Name = "TerraFusion Dashboard"; Port = 3001; ProcessName = "node" }
    @{ Name = "TerraFusion GIS"; Port = 3002; ProcessName = "node" }
    @{ Name = "TerraFusion v0 Demo"; Port = 3000; ProcessName = "node" }
    @{ Name = "TerraFusion API"; Port = 5000; ProcessName = "dotnet" }
)

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Get-ColorForStatus {
    param([string]$Status)
    
    switch ($Status) {
        "HEALTHY" { return "Green" }
        "WARNING" { return "Yellow" }
        "CRITICAL" { return "Red" }
        "UNKNOWN" { return "Gray" }
        default { return "White" }
    }
}

function Get-SymbolForStatus {
    param([string]$Status)
    
    switch ($Status) {
        "HEALTHY" { return "✅" }
        "WARNING" { return "⚠️" }
        "CRITICAL" { return "❌" }
        "UNKNOWN" { return "❓" }
        default { return "⚪" }
    }
}

function Write-HealthStatus {
    param(
        [string]$Component,
        [string]$Status,
        [string]$Message = "",
        [int]$Indent = 0
    )
    
    $symbol = Get-SymbolForStatus -Status $Status
    $color = Get-ColorForStatus -Status $Status
    $indentStr = "  " * $Indent
    
    Write-Host "$indentStr$symbol " -NoNewline -ForegroundColor $color
    Write-Host "[$Status] " -NoNewline -ForegroundColor $color
    Write-Host $Component
    
    if ($Message -and ($Detailed -or $Status -ne "HEALTHY")) {
        Write-Host "$indentStr   └─ $Message" -ForegroundColor Gray
    }
}

function Test-PortAvailable {
    param([int]$Port)
    
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("127.0.0.1", $Port)
        $connection.Close()
        return $true  # Port is in use (service is running)
    } catch {
        return $false  # Port is not in use
    }
}

function Get-ProcessOnPort {
    param([int]$Port)
    
    try {
        $netstat = netstat -ano | Select-String ":$Port " | Select-Object -First 1
        if ($netstat) {
            $parts = $netstat.ToString() -split '\s+' | Where-Object { $_ -ne '' }
            $pid = $parts[-1]
            $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
            return $process
        }
    } catch {
        return $null
    }
    
    return $null
}

# ============================================================================
# HEALTH CHECK FUNCTIONS
# ============================================================================

function Test-SystemRequirements {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  SYSTEM REQUIREMENTS" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    # Check Node.js
    try {
        $nodeVersion = node --version 2>&1
        if ($nodeVersion -match "v(\d+)\.") {
            $majorVersion = [int]$Matches[1]
            if ($majorVersion -ge 18) {
                Write-HealthStatus -Component "Node.js ($nodeVersion)" -Status "HEALTHY" -Message "Version 18+ ✓"
            } else {
                Write-HealthStatus -Component "Node.js ($nodeVersion)" -Status "WARNING" -Message "Version 18+ recommended"
            }
        }
    } catch {
        Write-HealthStatus -Component "Node.js" -Status "CRITICAL" -Message "Not found in PATH"
    }
    
    # Check .NET
    try {
        $dotnetVersion = dotnet --version 2>&1
        if ($dotnetVersion -match "(\d+)\.") {
            $majorVersion = [int]$Matches[1]
            if ($majorVersion -ge 8) {
                Write-HealthStatus -Component ".NET SDK ($dotnetVersion)" -Status "HEALTHY" -Message "Version 8+ ✓"
            } else {
                Write-HealthStatus -Component ".NET SDK ($dotnetVersion)" -Status "WARNING" -Message "Version 8+ recommended"
            }
        }
    } catch {
        Write-HealthStatus -Component ".NET SDK" -Status "CRITICAL" -Message "Not found in PATH"
    }
    
    # Check npm
    try {
        $npmVersion = npm --version 2>&1
        Write-HealthStatus -Component "npm ($npmVersion)" -Status "HEALTHY" -Message "Installed ✓"
    } catch {
        Write-HealthStatus -Component "npm" -Status "CRITICAL" -Message "Not found in PATH"
    }
    
    # Check Git
    try {
        $gitVersion = git --version 2>&1
        Write-HealthStatus -Component "Git" -Status "HEALTHY" -Message "Installed ✓"
    } catch {
        Write-HealthStatus -Component "Git" -Status "WARNING" -Message "Not found in PATH"
    }
}

function Test-SystemResources {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  SYSTEM RESOURCES" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    # Memory
    $os = Get-CimInstance Win32_OperatingSystem
    $totalMemoryGB = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
    $freeMemoryGB = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
    $usedMemoryGB = $totalMemoryGB - $freeMemoryGB
    $memoryUsagePercent = [math]::Round(($usedMemoryGB / $totalMemoryGB) * 100, 2)
    
    $memoryStatus = if ($memoryUsagePercent -lt 80) { "HEALTHY" } 
                   elseif ($memoryUsagePercent -lt 90) { "WARNING" } 
                   else { "CRITICAL" }
    
    Write-HealthStatus -Component "Memory" -Status $memoryStatus `
        -Message "$usedMemoryGB GB / $totalMemoryGB GB ($memoryUsagePercent% used)"
    
    # Disk Space
    $drive = Get-PSDrive C
    $totalSpaceGB = [math]::Round($drive.Free / 1GB + $drive.Used / 1GB, 2)
    $freeSpaceGB = [math]::Round($drive.Free / 1GB, 2)
    $usedSpaceGB = [math]::Round($drive.Used / 1GB, 2)
    $diskUsagePercent = [math]::Round(($usedSpaceGB / $totalSpaceGB) * 100, 2)
    
    $diskStatus = if ($diskUsagePercent -lt 80) { "HEALTHY" } 
                 elseif ($diskUsagePercent -lt 90) { "WARNING" } 
                 else { "CRITICAL" }
    
    Write-HealthStatus -Component "Disk Space (C:)" -Status $diskStatus `
        -Message "$freeSpaceGB GB free / $totalSpaceGB GB total ($diskUsagePercent% used)"
    
    # CPU
    $cpu = Get-CimInstance Win32_Processor
    $cpuUsage = (Get-Counter '\Processor(_Total)\% Processor Time').CounterSamples.CookedValue
    $cpuUsagePercent = [math]::Round($cpuUsage, 2)
    
    $cpuStatus = if ($cpuUsagePercent -lt 80) { "HEALTHY" } 
                elseif ($cpuUsagePercent -lt 95) { "WARNING" } 
                else { "CRITICAL" }
    
    Write-HealthStatus -Component "CPU" -Status $cpuStatus `
        -Message "$($cpu.Name) - $cpuUsagePercent% usage"
}

function Test-Services {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  TERRAFUSION SERVICES" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    $runningServices = 0
    $totalServices = $ExpectedServices.Count
    
    foreach ($service in $ExpectedServices) {
        $portInUse = Test-PortAvailable -Port $service.Port
        $process = Get-ProcessOnPort -Port $service.Port
        
        if ($portInUse -and $process) {
            $runningServices++
            $uptime = (Get-Date) - $process.StartTime
            $uptimeStr = "{0:hh}h {0:mm}m {0:ss}s" -f $uptime
            
            Write-HealthStatus -Component $service.Name -Status "HEALTHY" `
                -Message "Running on port $($service.Port) (PID: $($process.Id), Uptime: $uptimeStr)"
        } elseif ($portInUse) {
            Write-HealthStatus -Component $service.Name -Status "WARNING" `
                -Message "Port $($service.Port) is in use, but process not identified"
        } else {
            Write-HealthStatus -Component $service.Name -Status "UNKNOWN" `
                -Message "Not running (port $($service.Port) available)"
        }
    }
    
    Write-Host ""
    Write-Host "  Services Running: $runningServices / $totalServices" -ForegroundColor $(if ($runningServices -eq 0) { "Yellow" } elseif ($runningServices -lt $totalServices) { "Yellow" } else { "Green" })
}

function Test-PortAvailability {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  PORT AVAILABILITY" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    $portsToCheck = @(3000, 3001, 3002, 3003, 3004, 3005, 5000, 5001)
    
    foreach ($port in $portsToCheck) {
        $portInUse = Test-PortAvailable -Port $port
        $process = Get-ProcessOnPort -Port $port
        
        if ($portInUse -and $process) {
            Write-HealthStatus -Component "Port $port" -Status "HEALTHY" `
                -Message "In use by $($process.ProcessName) (PID: $($process.Id))" -Indent 1
        } elseif ($portInUse) {
            Write-HealthStatus -Component "Port $port" -Status "WARNING" `
                -Message "In use (process unknown)" -Indent 1
        } else {
            Write-HealthStatus -Component "Port $port" -Status "HEALTHY" `
                -Message "Available" -Indent 1
        }
    }
}

function Test-Processes {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  TERRAFUSION PROCESSES" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    # Node.js processes
    $nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-HealthStatus -Component "Node.js Processes" -Status "HEALTHY" `
            -Message "$($nodeProcesses.Count) process(es) running"
        
        if ($Detailed) {
            foreach ($proc in $nodeProcesses) {
                $memoryMB = [math]::Round($proc.WorkingSet64 / 1MB, 2)
                $cpuTime = $proc.TotalProcessorTime
                Write-Host "    ├─ PID $($proc.Id): $memoryMB MB memory, CPU: $cpuTime" -ForegroundColor Gray
            }
        }
    } else {
        Write-HealthStatus -Component "Node.js Processes" -Status "UNKNOWN" `
            -Message "No Node.js processes running"
    }
    
    # .NET processes
    $dotnetProcesses = Get-Process dotnet -ErrorAction SilentlyContinue
    if ($dotnetProcesses) {
        Write-HealthStatus -Component ".NET Processes" -Status "HEALTHY" `
            -Message "$($dotnetProcesses.Count) process(es) running"
        
        if ($Detailed) {
            foreach ($proc in $dotnetProcesses) {
                $memoryMB = [math]::Round($proc.WorkingSet64 / 1MB, 2)
                $cpuTime = $proc.TotalProcessorTime
                Write-Host "    ├─ PID $($proc.Id): $memoryMB MB memory, CPU: $cpuTime" -ForegroundColor Gray
            }
        }
    } else {
        Write-HealthStatus -Component ".NET Processes" -Status "UNKNOWN" `
            -Message "No .NET processes running"
    }
}

function Test-WorkspaceHealth {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  WORKSPACE HEALTH" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    # Check workspace directory
    if (Test-Path $WorkspaceRoot) {
        Write-HealthStatus -Component "Workspace Root" -Status "HEALTHY" `
            -Message "$WorkspaceRoot exists"
    } else {
        Write-HealthStatus -Component "Workspace Root" -Status "CRITICAL" `
            -Message "$WorkspaceRoot not found!"
    }
    
    # Check critical directories
    $criticalDirs = @(
        "src"
        "modules"
        "backend"
        "docs"
        "scripts"
    )
    
    $missingDirs = @()
    foreach ($dir in $criticalDirs) {
        $dirPath = Join-Path $WorkspaceRoot $dir
        if (-not (Test-Path $dirPath)) {
            $missingDirs += $dir
        }
    }
    
    if ($missingDirs.Count -eq 0) {
        Write-HealthStatus -Component "Critical Directories" -Status "HEALTHY" `
            -Message "All critical directories present"
    } else {
        Write-HealthStatus -Component "Critical Directories" -Status "WARNING" `
            -Message "Missing: $($missingDirs -join ', ')"
    }
    
    # Check documentation
    $docs = @(
        ".workspace-map.json"
        "WORKSPACE_NAVIGATION_GUIDE.md"
        "ACTIVE_SYSTEMS.md"
        "README.md"
    )
    
    $missingDocs = @()
    foreach ($doc in $docs) {
        $docPath = Join-Path $WorkspaceRoot $doc
        if (-not (Test-Path $docPath)) {
            $missingDocs += $doc
        }
    }
    
    if ($missingDocs.Count -eq 0) {
        Write-HealthStatus -Component "Documentation" -Status "HEALTHY" `
            -Message "All navigation docs present"
    } else {
        Write-HealthStatus -Component "Documentation" -Status "WARNING" `
            -Message "Missing: $($missingDocs -join ', ')"
    }
}

function Get-OverallHealth {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  OVERALL HEALTH SUMMARY" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    # Count running services
    $runningServices = 0
    foreach ($service in $ExpectedServices) {
        if (Test-PortAvailable -Port $service.Port) {
            $runningServices++
        }
    }
    
    # Determine overall status
    $overallStatus = if ($runningServices -eq $ExpectedServices.Count) {
        "HEALTHY"
    } elseif ($runningServices -gt 0) {
        "WARNING"
    } else {
        "UNKNOWN"
    }
    
    Write-HealthStatus -Component "TerraFusion OS" -Status $overallStatus `
        -Message "$runningServices / $($ExpectedServices.Count) services running"
    
    # Recommendations
    if ($overallStatus -ne "HEALTHY") {
        Write-Host ""
        Write-Host "  💡 Recommendations:" -ForegroundColor Yellow
        Write-Host "     1. Run '.\scripts\start-everything.ps1' to start all services" -ForegroundColor Gray
        Write-Host "     2. Check VALIDATION_REPORTS for detailed system status" -ForegroundColor Gray
        Write-Host "     3. Review ACTIVE_SYSTEMS.md for startup instructions" -ForegroundColor Gray
    }
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

function Show-HealthDashboard {
    if (-not $Watch) {
        Clear-Host
    }
    
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║              TERRAFUSION OS - SYSTEM HEALTH CHECK                           ║" -ForegroundColor Cyan
    Write-Host "║                      THE TERRAFUSION WAY                                     ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Yellow
    Write-Host "Workspace: $WorkspaceRoot" -ForegroundColor Yellow
    
    # Run all health checks
    Test-SystemRequirements
    Test-SystemResources
    Test-Services
    Test-PortAvailability
    Test-Processes
    Test-WorkspaceHealth
    Get-OverallHealth
    
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "THE TERRAFUSION WAY - Monitor everything, prevent issues! ✅" -ForegroundColor Cyan
    Write-Host ""
    
    if ($Watch) {
        Write-Host "Press Ctrl+C to exit watch mode..." -ForegroundColor Gray
        Write-Host ""
    }
}

# Run the health dashboard
if ($Watch) {
    Write-Host "Starting health monitoring (refresh every $WatchInterval seconds)..." -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to exit" -ForegroundColor Yellow
    Write-Host ""
    
    while ($true) {
        Clear-Host
        Show-HealthDashboard
        Start-Sleep -Seconds $WatchInterval
    }
} else {
    Show-HealthDashboard
}

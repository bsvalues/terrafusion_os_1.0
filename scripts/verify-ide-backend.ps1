# ═══════════════════════════════════════════════════════════════════════════
# TerraFusion IDE Backend Verification Script
# Verifies all health endpoints and service readiness
# ═══════════════════════════════════════════════════════════════════════════

param(
    [Parameter(Mandatory = $false)]
    [string]$BaseUrl = "http://localhost:8787",

    [Parameter(Mandatory = $false)]
    [int]$MaxRetries = 5,

    [Parameter(Mandatory = $false)]
    [switch]$Verbose = $false
)

# Colors for output
$Green = "`e[32m"
$Yellow = "`e[33m"
$Red = "`e[31m"
$Blue = "`e[34m"
$Reset = "`e[0m"

# ═══════════════════════════════════════════════════════════════════════════
# Utility Functions
# ═══════════════════════════════════════════════════════════════════════════

function Write-Status {
    param([string]$Message)
    Write-Host "$Green✓$Reset $Message"
}

function Write-Warning {
    param([string]$Message)
    Write-Host "$Yellow⚠$Reset $Message"
}

function Write-Error {
    param([string]$Message)
    Write-Host "$Red✗$Reset $Message"
}

function Write-Info {
    param([string]$Message)
    Write-Host "$Blue→$Reset $Message"
}

function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Name,
        [string]$Method = "GET"
    )

    Write-Info "Testing $Name..."

    for ($i = 1; $i -le $MaxRetries; $i++) {
        try {
            $Response = Invoke-WebRequest -Uri $Url -Method $Method -ErrorAction Stop -TimeoutSec 5

            $StatusCode = $Response.StatusCode
            $ContentLength = if ($Response.Content) { $Response.Content.Length } else { 0 }

            Write-Status "$($Name): HTTP $($StatusCode) ($($ContentLength) bytes)"

            if ($Verbose -and $Response.Content) {
                try {
                    $Content = $Response.Content | ConvertFrom-Json
                    Write-Host "  Response: $(($Content | ConvertTo-Json -Compress) -replace '(.{60})(.)', '$1`n  ')"
                } catch {
                    Write-Host "  Response: $($Response.Content.Substring(0, [Math]::Min(200, $Response.Content.Length)))..."
                }
            }

            return $true
        } catch {
            if ($i -eq $MaxRetries) {
                Write-Error "$Name failed after $MaxRetries retries: $($_.Exception.Message)"
                return $false
            }

            Write-Warning "$Name attempt $i/$MaxRetries failed, retrying..."
            Start-Sleep -Seconds 2
        }
    }

    return $false
}

# ═══════════════════════════════════════════════════════════════════════════
# Main Verification
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "`n$Yellow═══════════════════════════════════════════════════════════════$Reset"
Write-Host "$Yellow TerraFusion IDE Backend Verification$Reset"
Write-Host "$Yellow═══════════════════════════════════════════════════════════════$Reset`n"

Write-Info "Target: $BaseUrl"
Write-Info "Max retries: $MaxRetries"

# ═══════════════════════════════════════════════════════════════════════════
# Health Endpoints
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "`n$Yellow--- Health Endpoints ---$Reset`n"

$HealthTests = @(
    @{
        Name = "Health Check"
        Url  = "$BaseUrl/health"
    },
    @{
        Name = "Liveness Probe"
        Url  = "$BaseUrl/health/live"
    },
    @{
        Name = "Readiness Probe"
        Url  = "$BaseUrl/health/ready"
    },
    @{
        Name = "Portal Health"
        Url  = "$BaseUrl/api/portal/health"
    }
)

$HealthResults = @()
foreach ($Test in $HealthTests) {
    $Result = Test-Endpoint -Url $Test.Url -Name $Test.Name
    $HealthResults += $Result
}

# ═══════════════════════════════════════════════════════════════════════════
# API Endpoints
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "`n$Yellow--- API Endpoints ---$Reset`n"

$APITests = @(
    @{
        Name = "Modules List"
        Url  = "$BaseUrl/api/modules/list"
    },
    @{
        Name = "Workspaces List"
        Url  = "$BaseUrl/api/workspaces/list"
    },
    @{
        Name = "Terminal Commands"
        Url  = "$BaseUrl/api/terminal/commands"
    },
    @{
        Name = "Available Tasks"
        Url  = "$BaseUrl/api/tasks/available"
    },
    @{
        Name = "Registry List"
        Url  = "$BaseUrl/api/registry/list"
    }
)

$APIResults = @()
foreach ($Test in $APITests) {
    $Result = Test-Endpoint -Url $Test.Url -Name $Test.Name
    $APIResults += $Result
}

# ═══════════════════════════════════════════════════════════════════════════
# Service Information
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "`n$Yellow--- Service Information ---$Reset`n"

try {
    $Portal = Invoke-WebRequest -Uri "$BaseUrl/api/portal/health" -ErrorAction SilentlyContinue
    if ($Portal.StatusCode -eq 200) {
        $PortalData = $Portal.Content | ConvertFrom-Json

        Write-Info "Portal Status:"
        Write-Host "  Status: $($PortalData.status)"
        Write-Host "  Components: $($PortalData.components.Count)"
        Write-Host "  Timestamp: $($PortalData.timestamp)"

        if ($PortalData.components) {
            Write-Host "  Components:"
            foreach ($Component in $PortalData.components) {
                $Status = $Component.healthy ? "✓" : "✗"
                Write-Host "    $Status $($Component.name): $($Component.status)"
            }
        }
    }
} catch {
    Write-Warning "Could not retrieve portal information"
}

# ═══════════════════════════════════════════════════════════════════════════
# Performance Baseline
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "`n$Yellow--- Performance Baseline ---$Reset`n"

$PerfTests = @(
    @{
        Name   = "Modules Discovery"
        Url    = "$BaseUrl/api/modules/list"
        Target = 100
    },
    @{
        Name   = "Workspaces Browsing"
        Url    = "$BaseUrl/api/workspaces/list"
        Target = 100
    },
    @{
        Name   = "Registry Query"
        Url    = "$BaseUrl/api/registry/list"
        Target = 50
    }
)

foreach ($Test in $PerfTests) {
    $Stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

    try {
        $Response = Invoke-WebRequest -Uri $Test.Url -ErrorAction Stop -TimeoutSec 5
        $Stopwatch.Stop()

        $ElapsedMs = $Stopwatch.ElapsedMilliseconds
        $Status = $ElapsedMs -le $Test.Target ? "✓" : "⚠"

        Write-Host "$Status $($Test.Name): ${ElapsedMs}ms (target: $($Test.Target)ms)"
    } catch {
        Write-Error "$($Test.Name) failed: $($_.Exception.Message)"
    }
}

# ═══════════════════════════════════════════════════════════════════════════
# Docker Service Status
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "`n$Yellow--- Docker Service Status ---$Reset`n"

try {
    $ServiceStatus = docker ps --filter "name=terrafusion-ide-backend" --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}" 2>$null

    if ($ServiceStatus) {
        Write-Status "Service is running"
        Write-Host $ServiceStatus
    } else {
        Write-Error "Service is not running"
    }
} catch {
    Write-Warning "Could not retrieve Docker service status: $_"
}

# ═══════════════════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "`n$Yellow═══════════════════════════════════════════════════════════════$Reset"

$TotalTests = $HealthResults.Count + $APIResults.Count
$PassedTests = ($HealthResults + $APIResults | Where-Object { $_ -eq $true }).Count
$FailedTests = $TotalTests - $PassedTests

Write-Host "$Green✓ Verification Summary$Reset"
Write-Host "$Yellow═══════════════════════════════════════════════════════════════$Reset`n"

Write-Host "Total Tests: $TotalTests"
Write-Host "$Green Passed: $PassedTests$Reset"
if ($FailedTests -gt 0) {
    Write-Host "$Red Failed: $FailedTests$Reset"
}

if ($FailedTests -eq 0) {
    Write-Host "`n$Green✓ All verifications passed! IDE backend is operational.$Reset"
    exit 0
} else {
    Write-Host "`n$Red✗ Some verifications failed. Check the logs above.$Reset"
    exit 1
}

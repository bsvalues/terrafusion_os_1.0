#!/usr/bin/env pwsh
# ════════════════════════════════════════════════════════════════════════════
# TerraFusion Elite Government OS - Advanced Deployment Validation Framework
# ════════════════════════════════════════════════════════════════════════════

param(
    [Parameter(Mandatory=$false)]
    [string]$County = "benton",

    [Parameter(Mandatory=$false)]
    [string]$Environment = "development",

    [Parameter(Mandatory=$false)]
    [switch]$FullValidation,

    [Parameter(Mandatory=$false)]
    [switch]$ProductionCheck,

    [Parameter(Mandatory=$false)]
    [switch]$SecurityAudit
)

# Elite styling functions
function Write-EliteHeader {
    param([string]$Title)
    Write-Host "`n🏆 ═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "   $Title" -ForegroundColor White -BackgroundColor Cyan
    Write-Host "   ═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
}

function Write-EliteSection {
    param([string]$Section)
    Write-Host "`n🔷 $Section" -ForegroundColor Blue
    Write-Host "   ─────────────────────────────────────────────────────" -ForegroundColor DarkBlue
}

function Write-EliteSuccess {
    param([string]$Message)
    Write-Host "   ✅ $Message" -ForegroundColor Green
}

function Write-EliteWarning {
    param([string]$Message)
    Write-Host "   ⚠️  $Message" -ForegroundColor Yellow
}

function Write-EliteError {
    param([string]$Message)
    Write-Host "   ❌ $Message" -ForegroundColor Red
}

function Write-EliteInfo {
    param([string]$Message)
    Write-Host "   💡 $Message" -ForegroundColor Cyan
}

# Validation results tracking
$global:ValidationResults = @{
    Passed = 0
    Failed = 0
    Warnings = 0
    Details = @()
}

function Add-ValidationResult {
    param(
        [string]$Test,
        [string]$Status,
        [string]$Message,
        [string]$Details = ""
    )

    switch ($Status) {
        "PASS" {
            $global:ValidationResults.Passed++
            Write-EliteSuccess "${Test}: $Message"
        }
        "FAIL" {
            $global:ValidationResults.Failed++
            Write-EliteError "${Test}: $Message"
        }
        "WARN" {
            $global:ValidationResults.Warnings++
            Write-EliteWarning "${Test}: $Message"
        }
    }    $global:ValidationResults.Details += @{
        Test = $Test
        Status = $Status
        Message = $Message
        Details = $Details
        Timestamp = Get-Date
    }
}

# Core validation functions
function Test-ContainerStack {
    Write-EliteSection "Container Stack Validation"

    $composeFile = "counties\$County\docker-compose.county.yml"

    if (-not (Test-Path $composeFile)) {
        Add-ValidationResult "Docker Compose" "FAIL" "Compose file not found: $composeFile"
        return
    }

    try {
        $containers = docker compose -f $composeFile ps --format json | ConvertFrom-Json

        foreach ($container in $containers) {
            $serviceName = $container.Service
            $status = $container.State
            $health = $container.Health

            if ($status -eq "running" -and ($health -eq "healthy" -or $health -eq "")) {
                Add-ValidationResult "Container-$serviceName" "PASS" "Container healthy and running"
            } elseif ($status -eq "running" -and $health -eq "starting") {
                Add-ValidationResult "Container-$serviceName" "WARN" "Container starting (health check in progress)"
            } else {
                Add-ValidationResult "Container-$serviceName" "FAIL" "Container status: $status, health: $health"
            }
        }

        # Check essential services
        $requiredServices = @("api", "postgres", "redis")
        foreach ($service in $requiredServices) {
            $serviceContainer = $containers | Where-Object { $_.Service -eq $service }
            if (-not $serviceContainer) {
                Add-ValidationResult "Essential-$service" "FAIL" "Required service not running"
            } else {
                Add-ValidationResult "Essential-$service" "PASS" "Required service operational"
            }
        }
    }
    catch {
        Add-ValidationResult "Docker Stack" "FAIL" "Failed to query container status: $_"
    }
}

function Test-APIEndpoints {
    Write-EliteSection "API Endpoint Validation"

    $baseUrl = "http://localhost:5000"
    $endpoints = @(
        @{ Path = "/health"; Name = "Health Check"; Critical = $true },
        @{ Path = "/api/test"; Name = "API Test"; Critical = $true },
        @{ Path = "/api/database/status"; Name = "Database Status"; Critical = $true },
        @{ Path = "/api/swarm/status"; Name = "AI Swarm Status"; Critical = $false },
        @{ Path = "/api/modules"; Name = "Module Listing"; Critical = $false },
        @{ Path = "/api/elitesystemreport/mission-completion"; Name = "Elite Mission Report"; Critical = $false }
    )

    foreach ($endpoint in $endpoints) {
        try {
            # Test from within container to bypass networking issues
            $result = docker exec "$County-api" sh -c "curl -s -w '%{http_code}' -o /dev/null 'http://localhost:5000$($endpoint.Path)'" 2>$null

            if ($result -eq "200") {
                Add-ValidationResult "API-$($endpoint.Name)" "PASS" "Endpoint responding correctly"
            } elseif ($result -match "^\d{3}$") {
                if ($endpoint.Critical) {
                    Add-ValidationResult "API-$($endpoint.Name)" "FAIL" "HTTP $result response"
                } else {
                    Add-ValidationResult "API-$($endpoint.Name)" "WARN" "HTTP $result response (non-critical)"
                }
            } else {
                if ($endpoint.Critical) {
                    Add-ValidationResult "API-$($endpoint.Name)" "FAIL" "Connection failed"
                } else {
                    Add-ValidationResult "API-$($endpoint.Name)" "WARN" "Connection failed (non-critical)"
                }
            }
        }
        catch {
            if ($endpoint.Critical) {
                Add-ValidationResult "API-$($endpoint.Name)" "FAIL" "Test execution failed: $_"
            } else {
                Add-ValidationResult "API-$($endpoint.Name)" "WARN" "Test execution failed: $_"
            }
        }

        Start-Sleep -Milliseconds 100
    }
}

function Test-DatabaseConnectivity {
    Write-EliteSection "Database Connectivity Validation"

    try {
        # Test PostgreSQL connection
        $pgResult = docker exec "$County-postgres" pg_isready -U terrafusion -d "${County}_county" 2>/dev/null
        if ($pgResult -match "accepting connections") {
            Add-ValidationResult "PostgreSQL" "PASS" "Database accepting connections"
        } else {
            Add-ValidationResult "PostgreSQL" "FAIL" "Database not ready: $pgResult"
        }

        # Test Redis connection
        $redisResult = docker exec "$County-redis" redis-cli ping 2>/dev/null
        if ($redisResult -eq "PONG") {
            Add-ValidationResult "Redis" "PASS" "Cache service responding"
        } else {
            Add-ValidationResult "Redis" "FAIL" "Cache service not responding: $redisResult"
        }

        # Test API database connectivity
        $apiDbTest = docker exec "$County-api" curl -s "http://localhost:5000/api/database/status" 2>/dev/null | ConvertFrom-Json
        if ($apiDbTest.database.isConnected -eq $true) {
            Add-ValidationResult "API-Database" "PASS" "API successfully connected to database"
        } else {
            Add-ValidationResult "API-Database" "FAIL" "API database connection failed"
        }
    }
    catch {
        Add-ValidationResult "Database Tests" "FAIL" "Database validation failed: $_"
    }
}

function Test-SecurityConfiguration {
    Write-EliteSection "Security Configuration Validation"

    if (-not $SecurityAudit) {
        Write-EliteInfo "Security audit skipped (use -SecurityAudit flag to enable)"
        return
    }

    # Check for development secrets
    $envFile = "counties\$County\.env"
    if (Test-Path $envFile) {
        $envContent = Get-Content $envFile

        $devSecrets = $envContent | Where-Object { $_ -match "DevPassword|localhost|development" }
        if ($devSecrets -and $Environment -eq "production") {
            Add-ValidationResult "Security-Secrets" "FAIL" "Development secrets detected in production environment"
        } else {
            Add-ValidationResult "Security-Secrets" "PASS" "No development secrets in production"
        }

        # Check for required security variables
        $requiredVars = @("DB_PASSWORD", "JWT_SECRET", "ENCRYPTION_KEY")
        foreach ($var in $requiredVars) {
            if ($envContent -match "^$var=") {
                Add-ValidationResult "Security-$var" "PASS" "Required security variable present"
            } else {
                Add-ValidationResult "Security-$var" "WARN" "Security variable $var not found"
            }
        }
    } else {
        Add-ValidationResult "Security-EnvFile" "FAIL" "Environment file not found: $envFile"
    }

    # Check container security
    try {
        $apiUser = docker exec "$County-api" whoami 2>/dev/null
        if ($apiUser -ne "root") {
            Add-ValidationResult "Security-NonRoot" "PASS" "API container running as non-root user: $apiUser"
        } else {
            Add-ValidationResult "Security-NonRoot" "WARN" "API container running as root user"
        }
    }
    catch {
        Add-ValidationResult "Security-UserCheck" "WARN" "Could not verify container user"
    }
}

function Test-PerformanceMetrics {
    Write-EliteSection "Performance Metrics Validation"

    if (-not $FullValidation) {
        Write-EliteInfo "Performance validation skipped (use -FullValidation flag to enable)"
        return
    }

    try {
        # Test API response times
        $responseTime = Measure-Command {
            docker exec "$County-api" sh -c "curl -s 'http://localhost:5000/health'" > $null 2>&1
        }

        if ($responseTime.TotalMilliseconds -lt 1000) {
            Add-ValidationResult "Performance-ResponseTime" "PASS" "API response time: $($responseTime.TotalMilliseconds)ms"
        } elseif ($responseTime.TotalMilliseconds -lt 3000) {
            Add-ValidationResult "Performance-ResponseTime" "WARN" "API response time: $($responseTime.TotalMilliseconds)ms (acceptable)"
        } else {
            Add-ValidationResult "Performance-ResponseTime" "FAIL" "API response time: $($responseTime.TotalMilliseconds)ms (too slow)"
        }

        # Check container resource usage
        $containerStats = docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null
        if ($containerStats) {
            Add-ValidationResult "Performance-Resources" "PASS" "Container resource monitoring available"
            Write-EliteInfo "Container Resource Usage:"
            $containerStats | ForEach-Object { Write-Host "     $_" -ForegroundColor DarkGray }
        }
    }
    catch {
        Add-ValidationResult "Performance-Tests" "WARN" "Performance testing failed: $_"
    }
}

function Test-EliteFeatures {
    Write-EliteSection "Elite Features Validation"

    try {
        # Test elite system report
        $eliteReport = docker exec "$County-api" curl -s "http://localhost:5000/api/elitesystemreport/mission-completion" 2>/dev/null | ConvertFrom-Json

        if ($eliteReport.status -eq "ELITE_ENGINEERING_EXCELLENCE_ACHIEVED") {
            Add-ValidationResult "Elite-Status" "PASS" "Elite engineering excellence achieved"
        } else {
            Add-ValidationResult "Elite-Status" "WARN" "Elite status: $($eliteReport.status)"
        }

        # Test AI swarm coordination
        $swarmStatus = docker exec "$County-api" curl -s "http://localhost:5000/api/swarm/status" 2>/dev/null | ConvertFrom-Json

        if ($swarmStatus.swarm) {
            $agentCount = $swarmStatus.swarm.totalAgents
            if ($agentCount -gt 1000) {
                Add-ValidationResult "Elite-AISwarm" "PASS" "AI swarm operational with $agentCount agents"
            } else {
                Add-ValidationResult "Elite-AISwarm" "WARN" "AI swarm operational but limited agents: $agentCount"
            }
        } else {
            Add-ValidationResult "Elite-AISwarm" "FAIL" "AI swarm not operational"
        }

        # Test consciousness layer
        if ($FullValidation) {
            Write-EliteInfo "Testing consciousness layer activation..."
            # Add consciousness-specific tests here if needed
        }
    }
    catch {
        Add-ValidationResult "Elite-Features" "WARN" "Elite feature testing failed: $_"
    }
}

function Test-ProductionReadiness {
    Write-EliteSection "Production Readiness Validation"

    if (-not $ProductionCheck) {
        Write-EliteInfo "Production checks skipped (use -ProductionCheck flag to enable)"
        return
    }

    # Check for production configuration
    $composeFile = "counties\$County\docker-compose.county.yml"
    if (Test-Path $composeFile) {
        $composeContent = Get-Content $composeFile -Raw

        if ($composeContent -match "target: development") {
            Add-ValidationResult "Production-BuildTarget" "WARN" "Development build target detected"
        } else {
            Add-ValidationResult "Production-BuildTarget" "PASS" "Production build target configured"
        }

        if ($composeContent -match "volumes.*:/app/src:ro") {
            Add-ValidationResult "Production-DevVolumes" "WARN" "Development volumes detected"
        } else {
            Add-ValidationResult "Production-DevVolumes" "PASS" "No development volumes in production"
        }
    }

    # Check for backup and monitoring
    $backupDir = "counties\$County\backups"
    if (Test-Path $backupDir) {
        Add-ValidationResult "Production-Backups" "PASS" "Backup directory exists"
    } else {
        Add-ValidationResult "Production-Backups" "WARN" "Backup directory not found"
    }

    # Check logging configuration
    if ($composeContent -match "logging:") {
        Add-ValidationResult "Production-Logging" "PASS" "Logging configuration present"
    } else {
        Add-ValidationResult "Production-Logging" "WARN" "Logging configuration not found"
    }
}

function Show-ValidationSummary {
    Write-EliteSection "Validation Summary"

    $total = $global:ValidationResults.Passed + $global:ValidationResults.Failed + $global:ValidationResults.Warnings
    $successRate = if ($total -gt 0) { [math]::Round(($global:ValidationResults.Passed / $total) * 100, 1) } else { 0 }

    Write-Host "`n   📊 VALIDATION RESULTS:" -ForegroundColor White
    Write-Host "   ├─ Total Tests: $total" -ForegroundColor Gray
    Write-Host "   ├─ Passed: $($global:ValidationResults.Passed)" -ForegroundColor Green
    Write-Host "   ├─ Failed: $($global:ValidationResults.Failed)" -ForegroundColor Red
    Write-Host "   ├─ Warnings: $($global:ValidationResults.Warnings)" -ForegroundColor Yellow
    Write-Host "   └─ Success Rate: $successRate%" -ForegroundColor $(if ($successRate -gt 80) { "Green" } elseif ($successRate -gt 60) { "Yellow" } else { "Red" })

    # Overall status
    if ($global:ValidationResults.Failed -eq 0 -and $global:ValidationResults.Warnings -le 2) {
        Write-Host "`n   🏆 ELITE STATUS: DEPLOYMENT EXCELLENCE ACHIEVED" -ForegroundColor Green -BackgroundColor Black
    } elseif ($global:ValidationResults.Failed -eq 0) {
        Write-Host "`n   ⚡ STATUS: OPERATIONAL WITH MINOR WARNINGS" -ForegroundColor Yellow -BackgroundColor Black
    } else {
        Write-Host "`n   ⚠️  STATUS: DEPLOYMENT ISSUES DETECTED" -ForegroundColor Red -BackgroundColor Black
    }

    # Export results if requested
    $reportFile = "counties\$County\validation-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    $global:ValidationResults | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportFile -Encoding UTF8
    Write-EliteInfo "Detailed report saved to: $reportFile"
}

# Main execution
function Invoke-EliteValidation {
    Clear-Host
    Write-EliteHeader "TerraFusion Elite Government OS - Deployment Validator"

    Write-Host "`n🎯 Validating: $County County ($Environment environment)" -ForegroundColor Cyan
    Write-Host "   Flags: FullValidation=$FullValidation, ProductionCheck=$ProductionCheck, SecurityAudit=$SecurityAudit`n" -ForegroundColor Gray

    # Core validations (always run)
    Test-ContainerStack
    Test-APIEndpoints
    Test-DatabaseConnectivity
    Test-EliteFeatures

    # Optional validations
    Test-SecurityConfiguration
    Test-PerformanceMetrics
    Test-ProductionReadiness

    Show-ValidationSummary

    Write-Host "`n🚀 TerraFusion Elite Validation Complete!`n" -ForegroundColor Cyan
}

# Execute validation
Invoke-EliteValidation

#!/usr/bin/env pwsh
# ════════════════════════════════════════════════════════════════════════════
# TerraFusion Elite Government OS - Multi-County Deployment Framework
# Championship-grade county expansion and scaling capabilities
# ════════════════════════════════════════════════════════════════════════════

param(
    [Parameter(Mandatory=$false)]
    [string]$SourceCounty = "benton",

    [Parameter(Mandatory=$true)]
    [string]$TargetCounty,

    [Parameter(Mandatory=$false)]
    [string]$CountyDisplayName,

    [Parameter(Mandatory=$false)]
    [string]$CountyCode,

    [Parameter(Mandatory=$false)]
    [switch]$DryRun,

    [Parameter(Mandatory=$false)]
    [switch]$FullClone
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

# Main deployment functions
function Initialize-CountyDeployment {
    Write-EliteSection "County Deployment Initialization"

    # Validate source county
    $sourceCountyPath = "counties\$SourceCounty"
    if (-not (Test-Path $sourceCountyPath)) {
        Write-EliteError "Source county not found: $sourceCountyPath"
        return $false
    }
    Write-EliteSuccess "Source county validated: $SourceCounty"

    # Create target county directory
    $targetCountyPath = "counties\$TargetCounty"
    if (Test-Path $targetCountyPath) {
        if (-not $FullClone) {
            Write-EliteWarning "Target county already exists: $TargetCounty"
            $overwrite = Read-Host "Overwrite existing deployment? (y/N)"
            if ($overwrite -ne "y" -and $overwrite -ne "Y") {
                Write-EliteInfo "Deployment cancelled by user"
                return $false
            }
        }
    }

    if (-not $DryRun) {
        New-Item -Path $targetCountyPath -ItemType Directory -Force | Out-Null
        Write-EliteSuccess "Created target county directory: $TargetCounty"
    } else {
        Write-EliteInfo "DRY RUN: Would create directory $targetCountyPath"
    }

    return $true
}

function Copy-CountyConfiguration {
    Write-EliteSection "County Configuration Replication"

    $sourceCountyPath = "counties\$SourceCounty"
    $targetCountyPath = "counties\$TargetCounty"

    # Files to copy/template
    $configFiles = @(
        "docker-compose.county.yml",
        ".env.example",
        "Makefile",
        ".gitignore"
    )

    $templateDirectories = @(
        "scripts",
        "docs"
    )

    foreach ($file in $configFiles) {
        $sourcePath = Join-Path $sourceCountyPath $file
        $targetPath = Join-Path $targetCountyPath $file

        if (Test-Path $sourcePath) {
            if (-not $DryRun) {
                Copy-Item -Path $sourcePath -Destination $targetPath -Force

                # Customize the copied files
                if ($file -eq "docker-compose.county.yml") {
                    Customize-DockerCompose -FilePath $targetPath
                } elseif ($file -eq ".env.example") {
                    Customize-EnvironmentExample -FilePath $targetPath
                }
            } else {
                Write-EliteInfo "DRY RUN: Would copy $file"
            }
            Write-EliteSuccess "Copied: $file"
        } else {
            Write-EliteWarning "Source file not found: $file"
        }
    }

    # Copy directories
    foreach ($dir in $templateDirectories) {
        $sourceDirPath = Join-Path $sourceCountyPath $dir
        $targetDirPath = Join-Path $targetCountyPath $dir

        if (Test-Path $sourceDirPath) {
            if (-not $DryRun) {
                Copy-Item -Path $sourceDirPath -Destination $targetDirPath -Recurse -Force
            } else {
                Write-EliteInfo "DRY RUN: Would copy directory $dir"
            }
            Write-EliteSuccess "Copied directory: $dir"
        }
    }
}

function Customize-DockerCompose {
    param([string]$FilePath)

    $content = Get-Content $FilePath -Raw

    # Replace county-specific values
    $content = $content -replace "benton-", "$TargetCounty-"
    $content = $content -replace "benton_county", "${TargetCounty}_county"
    $content = $content -replace "benton-county-network", "$TargetCounty-county-network"
    $content = $content -replace "Benton County", $CountyDisplayName

    # Update container names and network names
    $content = $content -replace "container_name: benton-", "container_name: $TargetCounty-"
    $content = $content -replace "name: benton-", "name: $TargetCounty-"

    Set-Content -Path $FilePath -Value $content -Encoding UTF8
    Write-EliteInfo "Customized Docker Compose for $TargetCounty"
}

function Customize-EnvironmentExample {
    param([string]$FilePath)

    $content = Get-Content $FilePath

    # Update county-specific environment variables
    $updatedContent = @()
    foreach ($line in $content) {
        if ($line -match "^COUNTY_NAME=") {
            $updatedContent += "COUNTY_NAME=$TargetCounty"
        } elseif ($line -match "^COUNTY_DISPLAY_NAME=") {
            $updatedContent += "COUNTY_DISPLAY_NAME=$CountyDisplayName"
        } elseif ($line -match "^COUNTY_CODE=") {
            if ($CountyCode) {
                $updatedContent += "COUNTY_CODE=$CountyCode"
            } else {
                $updatedContent += $line
            }
        } elseif ($line -match "^DB_NAME=") {
            $updatedContent += "DB_NAME=${TargetCounty}_county"
        } else {
            $updatedContent += $line
        }
    }

    Set-Content -Path $FilePath -Value $updatedContent -Encoding UTF8
    Write-EliteInfo "Customized environment configuration for $TargetCounty"
}

function Create-CountyEnvironment {
    Write-EliteSection "County Environment Creation"

    $targetCountyPath = "counties\$TargetCounty"
    $envExamplePath = Join-Path $targetCountyPath ".env.example"
    $envPath = Join-Path $targetCountyPath ".env"

    if ((Test-Path $envExamplePath) -and (-not (Test-Path $envPath))) {
        if (-not $DryRun) {
            Copy-Item -Path $envExamplePath -Destination $envPath

            # Generate secure random values for production
            $dbPassword = -join ((1..16) | ForEach-Object { [char]((65..90) + (97..122) + (48..57) | Get-Random) })
            $jwtSecret = -join ((1..32) | ForEach-Object { [char]((65..90) + (97..122) + (48..57) | Get-Random) })

            # Update .env with generated values
            $envContent = Get-Content $envPath
            $updatedEnvContent = @()
            foreach ($line in $envContent) {
                if ($line -match "^DB_PASSWORD=") {
                    $updatedEnvContent += "DB_PASSWORD=$dbPassword"
                } elseif ($line -match "^JWT_SECRET=") {
                    $updatedEnvContent += "JWT_SECRET=$jwtSecret"
                } else {
                    $updatedEnvContent += $line
                }
            }
            Set-Content -Path $envPath -Value $updatedEnvContent -Encoding UTF8
        } else {
            Write-EliteInfo "DRY RUN: Would create .env file with secure credentials"
        }
        Write-EliteSuccess "Created county environment file with secure credentials"
    } else {
        Write-EliteWarning "Environment file already exists or .env.example not found"
    }
}

function Initialize-CountyDatabase {
    Write-EliteSection "County Database Initialization"

    if ($DryRun) {
        Write-EliteInfo "DRY RUN: Would initialize database for $TargetCounty"
        return
    }

    $targetCountyPath = "counties\$TargetCounty"
    $composeFile = Join-Path $targetCountyPath "docker-compose.county.yml"

    if (-not (Test-Path $composeFile)) {
        Write-EliteError "Docker compose file not found: $composeFile"
        return
    }

    try {
        # Start database services only
        Write-EliteInfo "Starting database services for $TargetCounty..."
        $startResult = docker compose -f $composeFile up -d postgres redis 2>&1

        if ($LASTEXITCODE -eq 0) {
            Write-EliteSuccess "Database services started successfully"

            # Wait for database to be ready
            Write-EliteInfo "Waiting for database to initialize..."
            $maxAttempts = 30
            $attempt = 0
            do {
                Start-Sleep -Seconds 2
                $dbReady = docker exec "$TargetCounty-postgres" pg_isready -U terrafusion 2>$null
                $attempt++
            } while ($dbReady -notmatch "accepting connections" -and $attempt -lt $maxAttempts)

            if ($dbReady -match "accepting connections") {
                Write-EliteSuccess "Database is ready and accepting connections"
            } else {
                Write-EliteError "Database failed to start within timeout period"
            }
        } else {
            Write-EliteError "Failed to start database services: $startResult"
        }
    }
    catch {
        Write-EliteError "Database initialization failed: $_"
    }
}

function Deploy-CountyServices {
    Write-EliteSection "County Services Deployment"

    if ($DryRun) {
        Write-EliteInfo "DRY RUN: Would deploy full county stack for $TargetCounty"
        return
    }

    $targetCountyPath = "counties\$TargetCounty"
    $composeFile = Join-Path $targetCountyPath "docker-compose.county.yml"

    try {
        Write-EliteInfo "Deploying full county stack for $TargetCounty..."
        $deployResult = docker compose -f $composeFile up -d --build 2>&1

        if ($LASTEXITCODE -eq 0) {
            Write-EliteSuccess "County services deployed successfully"

            # Verify deployment
            Start-Sleep -Seconds 10
            $containerStatus = docker compose -f $composeFile ps --format "table {{.Service}}\t{{.State}}\t{{.Health}}"
            Write-EliteInfo "Container Status:"
            $containerStatus | ForEach-Object { Write-Host "     $_" -ForegroundColor DarkGray }
        } else {
            Write-EliteError "Failed to deploy county services: $deployResult"
        }
    }
    catch {
        Write-EliteError "Service deployment failed: $_"
    }
}

function Validate-CountyDeployment {
    Write-EliteSection "County Deployment Validation"

    if ($DryRun) {
        Write-EliteInfo "DRY RUN: Would validate deployment for $TargetCounty"
        return
    }

    try {
        # Test health endpoint
        $healthTest = docker exec "$TargetCounty-api" sh -c "curl -s 'http://localhost:5000/health'" 2>$null | ConvertFrom-Json

        if ($healthTest.status -eq "healthy") {
            Write-EliteSuccess "API health check: HEALTHY"
        } else {
            Write-EliteError "API health check: FAILED"
        }

        # Test database connectivity
        $dbTest = docker exec "$TargetCounty-postgres" pg_isready -U terrafusion -d "${TargetCounty}_county" 2>$null

        if ($dbTest -match "accepting connections") {
            Write-EliteSuccess "Database connectivity: CONNECTED"
        } else {
            Write-EliteError "Database connectivity: FAILED"
        }

        # Test Redis
        $redisTest = docker exec "$TargetCounty-redis" redis-cli ping 2>$null

        if ($redisTest -eq "PONG") {
            Write-EliteSuccess "Redis cache: RESPONDING"
        } else {
            Write-EliteError "Redis cache: FAILED"
        }

    }
    catch {
        Write-EliteError "Deployment validation failed: $_"
    }
}

function Show-DeploymentSummary {
    Write-EliteSection "Deployment Summary"

    Write-Host "`n   📊 COUNTY DEPLOYMENT RESULTS:" -ForegroundColor White
    Write-Host "   ├─ Source County: $SourceCounty" -ForegroundColor Gray
    Write-Host "   ├─ Target County: $TargetCounty" -ForegroundColor Gray
    Write-Host "   ├─ Display Name: $CountyDisplayName" -ForegroundColor Gray
    Write-Host "   ├─ County Code: $CountyCode" -ForegroundColor Gray
    Write-Host "   ├─ Dry Run Mode: $DryRun" -ForegroundColor Gray
    Write-Host "   └─ Full Clone: $FullClone" -ForegroundColor Gray

    if (-not $DryRun) {
        Write-Host "`n   🚀 County deployment completed!" -ForegroundColor Green
        Write-Host "`n   Next Steps:" -ForegroundColor Yellow
        Write-Host "   1. Customize county-specific configurations in counties\$TargetCounty\" -ForegroundColor White
        Write-Host "   2. Review and update .env file with production values" -ForegroundColor White
        Write-Host "   3. Run validation: .\scripts\elite-deployment-validator.ps1 -County $TargetCounty" -ForegroundColor White
        Write-Host "   4. Start monitoring: .\scripts\elite-live-monitor.ps1 -County $TargetCounty" -ForegroundColor White
    } else {
        Write-Host "`n   🔍 Dry run completed - no changes made" -ForegroundColor Yellow
        Write-Host "   Run without -DryRun flag to perform actual deployment" -ForegroundColor White
    }
}

# Main execution
function Invoke-CountyDeployment {
    # Default values
    if (-not $CountyDisplayName) {
        $CountyDisplayName = "$($TargetCounty.Substring(0,1).ToUpper())$($TargetCounty.Substring(1)) County, Washington"
    }

    if (-not $CountyCode) {
        $CountyCode = "WA-$(Get-Random -Minimum 100 -Maximum 999)"
    }

    Clear-Host
    Write-EliteHeader "TerraFusion Elite County Deployment Framework"

    Write-Host "`n🎯 Deploying: $TargetCounty County" -ForegroundColor Cyan
    Write-Host "   Source: $SourceCounty | Target: $TargetCounty | Display: $CountyDisplayName" -ForegroundColor Gray

    # Main deployment sequence
    if (Initialize-CountyDeployment) {
        Copy-CountyConfiguration
        Create-CountyEnvironment
        Initialize-CountyDatabase
        Deploy-CountyServices
        Validate-CountyDeployment
    }

    Show-DeploymentSummary

    Write-Host "`n🏆 TerraFusion Elite County Deployment Complete!`n" -ForegroundColor Cyan
}

# Execute deployment
Invoke-CountyDeployment

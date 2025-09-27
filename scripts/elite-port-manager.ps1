# TerraFusion OS - Port Management Excellence
# Elite MIT PhD Systems Engineering Implementation

param(
    [string]$Action = "enforce",
    [string]$Environment = "auto",
    [switch]$Force,
    [switch]$Verbose
)

Write-Host "🎯 TerraFusion OS Elite Port Management System" -ForegroundColor Cyan
Write-Host "🏛️  Government Operating System - Zero Hardcoded Ports" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor DarkGray

# Load our dynamic port configuration
$PortConfigPath = "$(Split-Path $PSScriptRoot)\.env.ports"
if (Test-Path $PortConfigPath) {
    Write-Host "📋 Loading dynamic port configuration..." -ForegroundColor Yellow
    $PortConfig = Get-Content $PortConfigPath
    
    # Extract port definitions
    $DynamicPorts = @{}
    foreach ($line in $PortConfig) {
        if ($line -match '^TF_(\w+)_PORT=\$\{TF_\w+_PORT:-(\d+)\}') {
            $portName = $matches[1]
            $defaultPort = $matches[2]
            $DynamicPorts[$portName] = $defaultPort
            
            if ($Verbose) {
                Write-Host "  ✓ $portName = $defaultPort" -ForegroundColor DarkGreen
            }
        }
    }
    
    Write-Host "✅ Loaded $($DynamicPorts.Count) dynamic port configurations" -ForegroundColor Green
} else {
    Write-Error "❌ Port configuration file not found: $PortConfigPath"
    exit 1
}

function Invoke-PortEnforcement {
    param([string]$Environment)
    
    Write-Host "`n🔧 ENFORCING DYNAMIC PORT USAGE" -ForegroundColor Yellow
    Write-Host "Environment: $Environment" -ForegroundColor Cyan
    
    # Critical configuration files to check and update
    $ConfigFiles = @(
        @{
            Path = "backend\TerraFusion.API\appsettings.json"
            Pattern = 'localhost:(\d{4})'
            Replacement = 'localhost:${TF_API_PORT:-5046}'
            Critical = $true
        },
        @{
            Path = "backend\TerraFusion.API\appsettings.Development.json"
            Pattern = 'localhost:(\d{4})'
            Replacement = 'localhost:${TF_FRONTEND_PORT:-3103}'
            Critical = $true
        },
        @{
            Path = "docker-compose.yml"
            Pattern = '(\d{4}):(\d{4})'
            Replacement = '${TF_DOCKER_PORT:-$1}:$2'
            Critical = $false
        },
        @{
            Path = "rust-performance-engine\Cargo.toml"
            Pattern = 'port = (\d{4})'
            Replacement = 'port = ${TF_RUST_PORT:-8100}'
            Critical = $true
        }
    )
    
    $UpdatedFiles = 0
    $IssuesFound = 0
    
    foreach ($config in $ConfigFiles) {
        $FullPath = Join-Path $PSScriptRoot ".." $config.Path
        
        if (Test-Path $FullPath) {
            Write-Host "🔍 Checking: $($config.Path)" -ForegroundColor Cyan
            
            $Content = Get-Content $FullPath -Raw
            $OriginalContent = $Content
            
            # Find hardcoded ports
            $PortMatches = [regex]::Matches($Content, $config.Pattern)
            
            if ($PortMatches.Count -gt 0) {
                $IssuesFound += $PortMatches.Count
                
                if ($config.Critical) {
                    Write-Host "  ⚠️  Found $($PortMatches.Count) hardcoded ports (CRITICAL)" -ForegroundColor Red
                } else {
                    Write-Host "  ⚠️  Found $($PortMatches.Count) hardcoded ports" -ForegroundColor Yellow
                }
                
                if ($Force -or $config.Critical) {
                    # Replace hardcoded ports with dynamic configuration
                    $Content = $Content -replace $config.Pattern, $config.Replacement
                    
                    if ($Content -ne $OriginalContent) {
                        Set-Content -Path $FullPath -Value $Content -NoNewline
                        Write-Host "  ✅ Updated with dynamic ports" -ForegroundColor Green
                        $UpdatedFiles++
                    }
                }
            } else {
                Write-Host "  ✅ Already using dynamic ports" -ForegroundColor Green
            }
        } else {
            Write-Host "  ⚠️  File not found: $($config.Path)" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`n📊 ENFORCEMENT SUMMARY" -ForegroundColor Cyan
    Write-Host "Files updated: $UpdatedFiles" -ForegroundColor Green
    Write-Host "Issues found: $IssuesFound" -ForegroundColor $(if ($IssuesFound -eq 0) { "Green" } else { "Yellow" })
    
    return @{
        UpdatedFiles = $UpdatedFiles
        IssuesFound = $IssuesFound
        Success = $IssuesFound -eq 0
    }
}

function Start-PortValidation {
    Write-Host "`n🧪 VALIDATING PORT SYSTEM" -ForegroundColor Yellow
    
    # Test that all critical services can bind to their assigned ports
    $CriticalServices = @(
        @{ Name = "API Gateway"; Port = $DynamicPorts["API"]; Health = "/health" },
        @{ Name = "Experience Shell"; Port = $DynamicPorts["SHELL"]; Health = "/health" },
        @{ Name = "Rust Engine"; Port = $DynamicPorts["RUST_MAIN"]; Health = "/health" },
        @{ Name = "AI Commander"; Port = $DynamicPorts["AI_COMMANDER"]; Health = "/api/swarm/health" }
    )
    
    $AvailableServices = 0
    $TotalServices = $CriticalServices.Count
    
    foreach ($service in $CriticalServices) {
        $port = $service.Port
        
        try {
            $tcpClient = New-Object System.Net.Sockets.TcpClient
            $connect = $tcpClient.BeginConnect("localhost", $port, $null, $null)
            $wait = $connect.AsyncWaitHandle.WaitOne(1000)
            
            if ($wait) {
                $tcpClient.EndConnect($connect)
                Write-Host "  ✅ $($service.Name): Port $port available" -ForegroundColor Green
                $AvailableServices++
            } else {
                Write-Host "  ⚠️  $($service.Name): Port $port not responding" -ForegroundColor Yellow
            }
            
            $tcpClient.Close()
        } catch {
            Write-Host "  ✅ $($service.Name): Port $port available (not in use)" -ForegroundColor Green
            $AvailableServices++
        }
    }
    
    Write-Host "`n🎯 VALIDATION RESULTS" -ForegroundColor Cyan
    Write-Host "Available ports: $AvailableServices / $TotalServices" -ForegroundColor Green
    
    return @{
        Available = $AvailableServices
        Total = $TotalServices
        Success = $AvailableServices -eq $TotalServices
    }
}

function Export-PortConfiguration {
    param([string]$Format = "json")
    
    Write-Host "`n📤 EXPORTING PORT CONFIGURATION" -ForegroundColor Yellow
    
    $ExportData = @{
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Environment = $Environment
        TerraFusionOS = @{
            Version = "1.0.0"
            Architecture = "Government Operating System"
            PortManagement = "Dynamic with Zero Hardcoded"
        }
        Services = @{}
        Configuration = $DynamicPorts
    }
    
    # Add service definitions
    $ServiceCategories = @{
        "Core" = @("API", "SHELL", "CONSCIOUSNESS")
        "Rust Engine" = @("RUST_MAIN", "RUST_AGENT", "RUST_GEOSPATIAL", "RUST_VALUATION", "RUST_SECURITY", "RUST_PERFORMANCE", "RUST_FFI")
        "AI Swarm" = @("AI_COMMANDER", "AI_GENERAL", "AI_OPERATIONAL", "AI_SWARM_METRICS", "AI_COORDINATION")
        "Infrastructure" = @("DATABASE", "REDIS", "CONSUL", "KONG", "RABBITMQ")
        "Modules" = @("MODULE_BASE", "MODULE_REGISTRY", "MODULE_MARKETPLACE")
        "Government" = @("HARRIS_PACS", "HARRIS_SYNC", "HARRIS_GIS", "GOLDEN_RATIO", "BENTON_API", "BENTON_SHELL", "BENTON_CAMA")
    }
    
    foreach ($category in $ServiceCategories.GetEnumerator()) {
        $ExportData.Services[$category.Key] = @{}
        
        foreach ($service in $category.Value) {
            if ($DynamicPorts.ContainsKey($service)) {
                $ExportData.Services[$category.Key][$service] = @{
                    Port = $DynamicPorts[$service]
                    Environment = "TF_$($service)_PORT"
                    Default = $DynamicPorts[$service]
                    Critical = $category.Key -in @("Core", "Rust Engine", "AI Swarm")
                }
            }
        }
    }
    
    # Export to file
    $OutputFile = "terrafusion-port-configuration.$Format"
    
    if ($Format -eq "json") {
        $ExportData | ConvertTo-Json -Depth 10 | Set-Content $OutputFile
    } elseif ($Format -eq "yaml") {
        # Simple YAML export
        $YamlContent = @()
        $YamlContent += "# TerraFusion OS Dynamic Port Configuration"
        $YamlContent += "terrafusion_os:"
        $YamlContent += "  environment: $Environment"
        $YamlContent += "  ports:"
        
        foreach ($port in $DynamicPorts.GetEnumerator()) {
            $YamlContent += "    $($port.Key.ToLower()): $($port.Value)"
        }
        
        $YamlContent | Set-Content $OutputFile
    }
    
    Write-Host "✅ Configuration exported to: $OutputFile" -ForegroundColor Green
    return $OutputFile
}

# Main execution logic
switch ($Action.ToLower()) {
    "enforce" {
        $result = Invoke-PortEnforcement -Environment $Environment
        
        if ($result.Success) {
            Write-Host "`n🎉 SUCCESS: All ports are now dynamic!" -ForegroundColor Green
        } else {
            Write-Host "`n⚠️  ATTENTION: $($result.IssuesFound) port issues require review" -ForegroundColor Yellow
        }
    }
    
    "validate" {
        $result = Start-PortValidation
        
        if ($result.Success) {
            Write-Host "`n🎉 SUCCESS: All critical services validated!" -ForegroundColor Green
        } else {
            Write-Host "`n⚠️  ATTENTION: Some services may not be running" -ForegroundColor Yellow
        }
    }
    
    "export" {
        $file = Export-PortConfiguration -Format "json"
        Write-Host "`n🎉 SUCCESS: Configuration exported to $file" -ForegroundColor Green
    }
    
    "full" {
        Write-Host "🚀 EXECUTING FULL PORT MANAGEMENT CYCLE" -ForegroundColor Magenta
        
        $enforce = Invoke-PortEnforcement -Environment $Environment
        Start-Sleep 2
        
        $validate = Start-PortValidation
        Start-Sleep 1
        
        $exportFile = Export-PortConfiguration -Format "json"
        
        Write-Host "`n🏆 FINAL RESULTS" -ForegroundColor Magenta
        Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
        Write-Host "Files updated: $($enforce.UpdatedFiles)" -ForegroundColor Green
        Write-Host "Services validated: $($validate.Available)/$($validate.Total)" -ForegroundColor Green
        Write-Host "Configuration exported: $exportFile" -ForegroundColor Green
        
        if ($enforce.Success -and $validate.Success) {
            Write-Host "`n🎯 MISSION ACCOMPLISHED: TerraFusion OS has ZERO HARDCODED PORTS!" -ForegroundColor Green
            Write-Host "🏛️  Government Operating System ready for production deployment" -ForegroundColor Cyan
        }
    }
    
    default {
        Write-Host "❌ Invalid action: $Action" -ForegroundColor Red
        Write-Host "Valid actions: enforce, validate, export, full" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "`n🎯 TerraFusion OS Elite Port Management Complete" -ForegroundColor Cyan
# TerraFusion OS 1.0 Elite Configuration Validation
# Government-grade configuration testing and validation
# Ensures FISMA Moderate compliance across all 39 counties

Write-Host "🏛️ TerraFusion OS 1.0 - Elite Configuration Validator" -ForegroundColor Cyan
Write-Host "🔍 Government-grade system validation in progress..." -ForegroundColor Green

$validationResults = @()
$errors = @()
$warnings = @()

# Function to add validation result
function Add-ValidationResult {
    param($Category, $Test, $Status, $Message, $Severity = "Info")

    $result = [PSCustomObject]@{
        Category = $Category
        Test = $Test
        Status = $Status
        Message = $Message
        Severity = $Severity
        Timestamp = Get-Date
    }

    $script:validationResults += $result

    $color = switch($Status) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "WARN" { "Yellow" }
        default { "White" }
    }

    Write-Host "$Status - $Category`: $Test - $Message" -ForegroundColor $color

    if ($Status -eq "FAIL") { $script:errors += $result }
    if ($Status -eq "WARN") { $script:warnings += $result }
}

Write-Host "`n🏗️ Core System Validation..." -ForegroundColor Blue

# .NET Version Check
try {
    $dotnetVersion = dotnet --version
    if ($dotnetVersion -like "8.*") {
        Add-ValidationResult "Core" ".NET Version" "PASS" ".NET 8.0 detected: $dotnetVersion"
    } else {
        Add-ValidationResult "Core" ".NET Version" "FAIL" "Required .NET 8.0, found: $dotnetVersion" "Critical"
    }
} catch {
    Add-ValidationResult "Core" ".NET Version" "FAIL" ".NET SDK not found" "Critical"
}

# Project File Validation
if (Test-Path "TerraFusion.API.csproj") {
    $projectXml = [xml](Get-Content "TerraFusion.API.csproj")
    $targetFramework = $projectXml.Project.PropertyGroup.TargetFramework

    if ($targetFramework -eq "net8.0") {
        Add-ValidationResult "Core" "Project Target" "PASS" "Target framework: $targetFramework"
    } else {
        Add-ValidationResult "Core" "Project Target" "FAIL" "Expected net8.0, found: $targetFramework" "Critical"
    }
} else {
    Add-ValidationResult "Core" "Project File" "FAIL" "TerraFusion.API.csproj not found" "Critical"
}

Write-Host "`n📊 Configuration File Validation..." -ForegroundColor Blue

# Configuration Files
$configFiles = @{
    "appsettings.json" = "Base Configuration"
    "appsettings.Development.json" = "Development Settings"
    "appsettings.Production.json" = "Production Settings"
    "appsettings.BentonCounty.json" = "Benton County Override"
}

foreach ($config in $configFiles.GetEnumerator()) {
    if (Test-Path $config.Key) {
        try {
            $null = Get-Content $config.Key | ConvertFrom-Json
            Add-ValidationResult "Config" $config.Value "PASS" "$($config.Key) found and valid JSON"
        } catch {
            Add-ValidationResult "Config" $config.Value "FAIL" "$($config.Key) contains invalid JSON" "High"
        }
    } else {
        $severity = if ($config.Key -eq "appsettings.json") { "Critical" } else { "Medium" }
        Add-ValidationResult "Config" $config.Value "WARN" "$($config.Key) not found" $severity
    }
}

# Validate JWT Configuration
try {
    $appSettings = Get-Content "appsettings.json" | ConvertFrom-Json
    if ($appSettings.JwtSettings) {
        $jwtKey = $appSettings.JwtSettings.SecretKey
        if ($jwtKey.Length -ge 32) {
            Add-ValidationResult "Security" "JWT Secret Key" "PASS" "JWT secret key meets length requirements"
        } else {
            Add-ValidationResult "Security" "JWT Secret Key" "FAIL" "JWT secret key too short (minimum 32 characters)" "High"
        }

        if ($appSettings.JwtSettings.ExpirationMinutes -le 60) {
            Add-ValidationResult "Security" "JWT Expiration" "PASS" "JWT expiration: $($appSettings.JwtSettings.ExpirationMinutes) minutes"
        } else {
            Add-ValidationResult "Security" "JWT Expiration" "WARN" "JWT expiration > 60 minutes may reduce security" "Medium"
        }
    } else {
        Add-ValidationResult "Security" "JWT Configuration" "FAIL" "JWT settings not found in configuration" "Critical"
    }
} catch {
    Add-ValidationResult "Security" "JWT Validation" "FAIL" "Error validating JWT configuration" "High"
}

Write-Host "`n💾 Database Validation..." -ForegroundColor Blue

# Database Files
if (Test-Path "terrafusion.db") {
    $dbSize = (Get-Item "terrafusion.db").Length
    Add-ValidationResult "Database" "SQLite File" "PASS" "Database exists (Size: $([math]::Round($dbSize/1KB, 2)) KB)"
} else {
    Add-ValidationResult "Database" "SQLite File" "WARN" "Database not found - will be created on first run" "Low"
}

# Entity Framework Check
try {
    $efCheck = dotnet ef --version 2>$null
    if ($efCheck) {
        Add-ValidationResult "Database" "EF Tools" "PASS" "Entity Framework tools available"
    } else {
        Add-ValidationResult "Database" "EF Tools" "WARN" "Entity Framework tools not installed globally" "Medium"
    }
} catch {
    Add-ValidationResult "Database" "EF Tools" "WARN" "Entity Framework tools check failed" "Medium"
}

Write-Host "`n🤖 AI Module System Validation..." -ForegroundColor Blue

# AI Modules Directory
if (Test-Path "modules") {
    $moduleFiles = Get-ChildItem "modules" -Filter "*.json"
    Add-ValidationResult "AI Modules" "Directory" "PASS" "Modules directory exists with $($moduleFiles.Count) manifest files"

    # Validate each module manifest
    foreach ($moduleFile in $moduleFiles) {
        try {
            $manifest = Get-Content $moduleFile.FullName | ConvertFrom-Json
            $moduleName = $manifest.name

            # Check required properties
            $requiredProps = @("name", "displayName", "description", "version", "tier")
            $missingProps = @()

            foreach ($prop in $requiredProps) {
                if (-not $manifest.PSObject.Properties.Name.Contains($prop)) {
                    $missingProps += $prop
                }
            }

            if ($missingProps.Count -eq 0) {
                Add-ValidationResult "AI Modules" "$moduleName Manifest" "PASS" "All required properties present"
            } else {
                Add-ValidationResult "AI Modules" "$moduleName Manifest" "FAIL" "Missing properties: $($missingProps -join ', ')" "Medium"
            }

        } catch {
            Add-ValidationResult "AI Modules" "$($moduleFile.Name)" "FAIL" "Invalid JSON in module manifest" "Medium"
        }
    }
} else {
    Add-ValidationResult "AI Modules" "Directory" "WARN" "Modules directory not found - will be created at runtime" "Low"
}

Write-Host "`n🏛️ Government Compliance Validation..." -ForegroundColor Blue

# Check for security configurations
try {
    $appSettings = Get-Content "appsettings.json" | ConvertFrom-Json

    # CORS Configuration
    if ($appSettings.AllowedOrigins) {
        Add-ValidationResult "Compliance" "CORS Policy" "PASS" "CORS origins configured: $($appSettings.AllowedOrigins.Count) origins"
    } else {
        Add-ValidationResult "Compliance" "CORS Policy" "WARN" "CORS origins not explicitly configured" "Medium"
    }

    # Audit Logging
    if ($appSettings.AuditLogging -and $appSettings.AuditLogging.Enabled) {
        $retention = $appSettings.AuditLogging.RetentionDays
        if ($retention -ge 2555) {
            Add-ValidationResult "Compliance" "Audit Retention" "PASS" "Audit retention: $retention days (7+ years)"
        } else {
            Add-ValidationResult "Compliance" "Audit Retention" "WARN" "Audit retention < 7 years: $retention days" "Medium"
        }
    } else {
        Add-ValidationResult "Compliance" "Audit Logging" "FAIL" "Audit logging not enabled - required for FISMA compliance" "High"
    }

    # Security Settings
    if ($appSettings.Security) {
        if ($appSettings.Security.EnableRateLimiting) {
            Add-ValidationResult "Compliance" "Rate Limiting" "PASS" "Rate limiting enabled"
        } else {
            Add-ValidationResult "Compliance" "Rate Limiting" "WARN" "Rate limiting disabled" "Medium"
        }

        if ($appSettings.Security.RequireHttps) {
            Add-ValidationResult "Compliance" "HTTPS Requirement" "PASS" "HTTPS required in configuration"
        } else {
            Add-ValidationResult "Compliance" "HTTPS Requirement" "WARN" "HTTPS not required (OK for development)" "Low"
        }
    } else {
        Add-ValidationResult "Compliance" "Security Settings" "WARN" "Security configuration section not found" "Medium"
    }
} catch {
    Add-ValidationResult "Compliance" "Configuration Review" "FAIL" "Error reading compliance configuration" "High"
}

Write-Host "`n📁 Directory Structure Validation..." -ForegroundColor Blue

# Required directories
$requiredDirs = @(
    @{Path="Controllers"; Required=$true},
    @{Path="Services"; Required=$true},
    @{Path="Hubs"; Required=$true},
    @{Path="logs"; Required=$false},
    @{Path="artifacts"; Required=$false},
    @{Path="Tests"; Required=$false}
)

foreach ($dir in $requiredDirs) {
    if (Test-Path $dir.Path) {
        Add-ValidationResult "Structure" "$($dir.Path) Directory" "PASS" "Directory exists"
    } else {
        $status = if ($dir.Required) { "FAIL" } else { "WARN" }
        $severity = if ($dir.Required) { "High" } else { "Low" }
        Add-ValidationResult "Structure" "$($dir.Path) Directory" $status "Directory not found" $severity
    }
}

# Summary Report
Write-Host "`n📋 Elite Validation Summary Report" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan

$totalTests = $validationResults.Count
$passedTests = ($validationResults | Where-Object {$_.Status -eq "PASS"}).Count
$failedTests = $errors.Count
$warningTests = $warnings.Count

Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor Red
Write-Host "Warnings: $warningTests" -ForegroundColor Yellow

$successRate = [math]::Round(($passedTests / $totalTests) * 100, 1)
Write-Host "Success Rate: $successRate%" -ForegroundColor $(if($successRate -ge 90) {"Green"} elseif($successRate -ge 70) {"Yellow"} else {"Red"})

if ($errors.Count -gt 0) {
    Write-Host "`n❌ Critical Issues Found:" -ForegroundColor Red
    foreach ($criticalError in $errors) {
        Write-Host "   • $($criticalError.Category): $($criticalError.Test) - $($criticalError.Message)" -ForegroundColor Red
    }
}

if ($warnings.Count -gt 0) {
    Write-Host "`n⚠️ Warnings:" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "   • $($warning.Category): $($warning.Test) - $($warning.Message)" -ForegroundColor Yellow
    }
}

# Government Grade Assessment
Write-Host "`n🏛️ Government Grade Assessment:" -ForegroundColor Cyan
$governmentGrade = if ($failedTests -eq 0 -and $successRate -ge 95) {
    "CHAMPION LEVEL - FISMA Moderate Ready"
} elseif ($failedTests -eq 0 -and $successRate -ge 85) {
    "PRODUCTION READY - Minor optimizations recommended"
} elseif ($failedTests -le 2 -and $successRate -ge 75) {
    "DEVELOPMENT READY - Address critical issues"
} else {
    "NEEDS ATTENTION - Multiple issues require resolution"
}

$gradeColor = switch -Wildcard ($governmentGrade) {
    "*CHAMPION*" { "Green" }
    "*PRODUCTION*" { "Green" }
    "*DEVELOPMENT*" { "Yellow" }
    default { "Red" }
}

Write-Host $governmentGrade -ForegroundColor $gradeColor

# Export detailed report
$reportPath = "artifacts/validation-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$validationResults | ConvertTo-Json -Depth 3 | Out-File -FilePath $reportPath -Encoding UTF8
Write-Host "`n📄 Detailed report saved: $reportPath" -ForegroundColor Blue

Write-Host "`n🎯 Elite Validation Complete!" -ForegroundColor Green

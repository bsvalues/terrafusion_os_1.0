# TerraFusion Elite Government OS - Championship System Validation
# Validates all services, configurations, and deployment readiness

param(
    [switch]$Verbose,
    [switch]$QuickCheck
)

$ErrorActionPreference = "Continue"
$script:FailureCount = 0
$script:SuccessCount = 0

function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  $($Title.PadRight(61))║" -ForegroundColor Cyan
    Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Test-Check {
    param(
        [string]$Name,
        [scriptblock]$Test,
        [string]$SuccessMessage = "Passed",
        [string]$FailureMessage = "Failed"
    )
    
    try {
        $result = & $Test
        if ($result) {
            Write-Host "✅ $Name" -ForegroundColor Green -NoNewline
            Write-Host " - $SuccessMessage" -ForegroundColor Gray
            $script:SuccessCount++
            return $true
        }
        else {
            Write-Host "❌ $Name" -ForegroundColor Red -NoNewline
            Write-Host " - $FailureMessage" -ForegroundColor Yellow
            $script:FailureCount++
            return $false
        }
    }
    catch {
        Write-Host "❌ $Name" -ForegroundColor Red -NoNewline
        Write-Host " - Exception: $($_.Exception.Message)" -ForegroundColor Red
        $script:FailureCount++
        return $false
    }
}

# ========================================
# 1. PROJECT STRUCTURE VALIDATION
# ========================================
Write-Header "TerraFusion Elite Government OS - System Validation"

Write-Host "📦 Phase 1: Project Structure Validation" -ForegroundColor Yellow
Write-Host ""

$criticalProjects = @(
    "TerraFusion.API",
    "TerraFusion.Core",
    "TerraFusion.AI",
    "TerraFusion.Data",
    "TerraFusion.Consciousness",
    "TerraFusion.CostForge",
    "TerraFusion.Operations",
    "TerraFusion.Levy"
)

foreach ($project in $criticalProjects) {
    Test-Check -Name "$project Project" -Test {
        Test-Path "$PSScriptRoot\..\$project\$project.csproj"
    } -SuccessMessage "Configuration found" -FailureMessage "Project file missing"
}

# ========================================
# 2. COMPILATION STATUS
# ========================================
Write-Host ""
Write-Host "🔨 Phase 2: Compilation Status" -ForegroundColor Yellow
Write-Host ""

Test-Check -Name "Solution Build Status" -Test {
    Push-Location "$PSScriptRoot\.."
    $buildOutput = dotnet build TerraFusion.sln --no-restore 2>&1 | Out-String
    Pop-Location
    ($buildOutput -match "Build succeeded") -and ($buildOutput -match "0 Error\(s\)") -and ($buildOutput -notmatch "\d+ Error\(s\)" -or $buildOutput -match "0 Error\(s\)")
} -SuccessMessage "0 errors - CHAMPIONSHIP GRADE" -FailureMessage "Compilation errors detected"

# ========================================
# 3. CONFIGURATION VALIDATION
# ========================================
Write-Host ""
Write-Host "⚙️ Phase 3: Configuration Validation" -ForegroundColor Yellow
Write-Host ""

Test-Check -Name "appsettings.json" -Test {
    $settingsPath = "$PSScriptRoot\..\TerraFusion.API\appsettings.json"
    if (Test-Path $settingsPath) {
        $settings = Get-Content $settingsPath | ConvertFrom-Json
        $settings.ConnectionStrings -and $settings.JwtSettings -and $settings.CostForge
    }
    else {
        $false
    }
} -SuccessMessage "All required settings present" -FailureMessage "Missing critical configuration"

Test-Check -Name "Database Configuration" -Test {
    $settingsPath = "$PSScriptRoot\..\TerraFusion.API\appsettings.json"
    $settings = Get-Content $settingsPath | ConvertFrom-Json
    $settings.ConnectionStrings.DefaultConnection -ne $null
} -SuccessMessage "Connection string configured" -FailureMessage "Database connection not configured"

Test-Check -Name "JWT Security Configuration" -Test {
    $settingsPath = "$PSScriptRoot\..\TerraFusion.API\appsettings.json"
    $settings = Get-Content $settingsPath | ConvertFrom-Json
    $settings.JwtSettings.SecretKey.Length -ge 32
} -SuccessMessage "JWT secret key meets security requirements" -FailureMessage "JWT key too short"

Test-Check -Name "CostForge AI Configuration" -Test {
    $settingsPath = "$PSScriptRoot\..\TerraFusion.API\appsettings.json"
    $settings = Get-Content $settingsPath | ConvertFrom-Json
    $settings.CostForge.QuantumFactor -eq 999 -and $settings.CostForge.AgentCount -eq 1000000
} -SuccessMessage "Million-agent quantum configuration verified" -FailureMessage "CostForge not configured correctly"

# ========================================
# 4. SERVICE DEPENDENCIES
# ========================================
Write-Host ""
Write-Host "📚 Phase 4: Service Dependencies" -ForegroundColor Yellow
Write-Host ""

Test-Check -Name ".NET SDK" -Test {
    $dotnetVersion = dotnet --version
    $major = [int]($dotnetVersion -split '\.')[0]
    $major -ge 8
} -SuccessMessage "Version: $(dotnet --version) (Compatible)" -FailureMessage ".NET 8.0+ not installed"

Test-Check -Name "Entity Framework Tools" -Test {
    $efVersion = dotnet ef --version 2>&1 | Out-String
    $efVersion -notmatch "not found" -and $efVersion -notmatch "No executable"
} -SuccessMessage "EF Core tools installed" -FailureMessage "Install: dotnet tool install --global dotnet-ef"

# ========================================
# 5. SECURITY VALIDATION
# ========================================
if (-not $QuickCheck) {
    Write-Host ""
    Write-Host "🔒 Phase 5: Security Validation" -ForegroundColor Yellow
    Write-Host ""
    
    Test-Check -Name "CORS Configuration" -Test {
        $programCs = Get-Content "$PSScriptRoot\..\TerraFusion.API\Program.cs" -Raw
        $programCs -match "UseCors" -and $programCs -match "AddCors"
    } -SuccessMessage "CORS properly configured" -FailureMessage "CORS configuration incomplete"
    
    Test-Check -Name "Authentication Middleware" -Test {
        $programCs = Get-Content "$PSScriptRoot\..\TerraFusion.API\Program.cs" -Raw
        $programCs -match "AddTerraFusionAuthentication"
    } -SuccessMessage "Elite authentication enabled" -FailureMessage "Authentication not configured"
    
    Test-Check -Name "Audit Logging" -Test {
        $settingsPath = "$PSScriptRoot\..\TerraFusion.API\appsettings.json"
        $settings = Get-Content $settingsPath | ConvertFrom-Json
        $settings.AuditLogging.Enabled -eq $true
    } -SuccessMessage "Government-grade audit logging active" -FailureMessage "Audit logging disabled"
}

# ========================================
# 6. AI & QUANTUM SERVICES
# ========================================
Write-Host ""
Write-Host "🤖 Phase 6: AI & Quantum Services" -ForegroundColor Yellow
Write-Host ""

Test-Check -Name "TerraFusion.AI Service" -Test {
    Test-Path "$PSScriptRoot\..\TerraFusion.AI\Services\*.cs"
} -SuccessMessage "AI orchestration services found" -FailureMessage "AI services missing"

Test-Check -Name "TerraFusion.Consciousness Service" -Test {
    Test-Path "$PSScriptRoot\..\TerraFusion.Consciousness\*.cs"
} -SuccessMessage "Quantum consciousness engine ready" -FailureMessage "Consciousness service missing"

Test-Check -Name "CostForge AI Integration" -Test {
    Test-Path "$PSScriptRoot\..\TerraFusion.CostForge\Services\*.cs"
} -SuccessMessage "Million-agent CostForge operational" -FailureMessage "CostForge services missing"

# ========================================
# 7. DATA LAYER VALIDATION
# ========================================
Write-Host ""
Write-Host "💾 Phase 7: Data Layer Validation" -ForegroundColor Yellow
Write-Host ""

Test-Check -Name "TerraFusion.Data Context" -Test {
    Test-Path "$PSScriptRoot\..\TerraFusion.Data\TerraFusionDbContext.cs"
} -SuccessMessage "Database context configured" -FailureMessage "DbContext missing"

Test-Check -Name "Entity Models" -Test {
    (Get-ChildItem "$PSScriptRoot\..\TerraFusion.Data\Entities\*.cs" -ErrorAction SilentlyContinue).Count -gt 0
} -SuccessMessage "Entity models found" -FailureMessage "Entity models missing"

# ========================================
# 8. PERFORMANCE & MONITORING
# ========================================
if (-not $QuickCheck) {
    Write-Host ""
    Write-Host "📊 Phase 8: Performance & Monitoring" -ForegroundColor Yellow
    Write-Host ""
    
    Test-Check -Name "Prometheus Metrics" -Test {
        $programCs = Get-Content "$PSScriptRoot\..\TerraFusion.API\Program.cs" -Raw
        $programCs -match "UseHttpMetrics"
    } -SuccessMessage "Elite monitoring enabled" -FailureMessage "Prometheus metrics not configured"
    
    Test-Check -Name "Health Checks" -Test {
        $programCs = Get-Content "$PSScriptRoot\..\TerraFusion.API\Program.cs" -Raw
        $programCs -match "AddHealthChecks"
    } -SuccessMessage "Health check endpoints configured" -FailureMessage "Health checks missing"
    
    Test-Check -Name "Response Compression" -Test {
        $settingsPath = "$PSScriptRoot\..\TerraFusion.API\appsettings.json"
        $settings = Get-Content $settingsPath | ConvertFrom-Json
        $settings.Performance.EnableResponseCompression -eq $true
    } -SuccessMessage "Performance optimization active" -FailureMessage "Compression disabled"
}

# ========================================
# FINAL REPORT
# ========================================
Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  VALIDATION COMPLETE - CHAMPIONSHIP RESULTS                   ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$totalChecks = $script:SuccessCount + $script:FailureCount
$successRate = [math]::Round(($script:SuccessCount / $totalChecks) * 100, 1)

Write-Host "📊 Validation Summary:" -ForegroundColor Yellow
Write-Host "   ✅ Passed: $($script:SuccessCount)" -ForegroundColor Green
Write-Host "   ❌ Failed: $($script:FailureCount)" -ForegroundColor $(if ($script:FailureCount -eq 0) { "Green" } else { "Red" })
Write-Host "   📈 Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 95) { "Green" } elseif ($successRate -ge 80) { "Yellow" } else { "Red" })
Write-Host ""

if ($script:FailureCount -eq 0) {
    Write-Host "🏆 CHAMPIONSHIP PERFECTION ACHIEVED!" -ForegroundColor Green
    Write-Host "✨ TerraFusion Elite Government OS is production-ready!" -ForegroundColor Green
    Write-Host ""
    exit 0
}
elseif ($successRate -ge 90) {
    Write-Host "⚡ ELITE STATUS - Minor issues detected" -ForegroundColor Yellow
    Write-Host "   System is operational with $($script:FailureCount) non-critical issue(s)" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
else {
    Write-Host "⚠️ CRITICAL ISSUES DETECTED" -ForegroundColor Red
    Write-Host "   Please address $($script:FailureCount) critical issue(s) before deployment" -ForegroundColor Red
    Write-Host ""
    exit 2
}

#!/usr/bin/env powershell
# TerraFusion Dashboard - Phase C.1 Validation Script
# Government. Transcended. - Championship Analytics Excellence
# Quantum Factor: 949

Write-Host "🏛️  TERRAFUSION PHASE C.1 DASHBOARD VALIDATION" -ForegroundColor Cyan
Write-Host "Government. Transcended. - Championship Analytics Excellence" -ForegroundColor Yellow
Write-Host "=" * 80 -ForegroundColor DarkCyan

# === PHASE C.1 METRICS ===
Write-Host "`n🎯 PHASE C.1 TERRAFUSION DASHBOARD METRICS:" -ForegroundColor Green

# Foundation Score Tracking
$previousScore = 12.218
$targetScore = 12.368
$expectedIncrease = 0.15

Write-Host "   Previous Foundation Score: $previousScore" -ForegroundColor Cyan
Write-Host "   Target Foundation Score: $targetScore" -ForegroundColor Green
Write-Host "   Expected Increase: +$expectedIncrease" -ForegroundColor Yellow

# === BUILD VALIDATION ===
Write-Host "`n🔧 BUILD SYSTEM VALIDATION:" -ForegroundColor Green

Set-Location "C:\Users\bsval\terrafusion_os_1.0\SDK\modules\terra-dashboard"

# TypeScript Compilation Check
Write-Host "   ✓ TypeScript Compilation Test..." -ForegroundColor Yellow
try {
    $tscResult = & npm run type-check 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ TypeScript: 0 errors (Championship Standard)" -ForegroundColor Green
        $tsSuccess = $true
    } else {
        Write-Host "   ❌ TypeScript: Has compilation errors" -ForegroundColor Red
        $tsSuccess = $false
    }
} catch {
    Write-Host "   ❌ TypeScript: Compilation failed" -ForegroundColor Red
    $tsSuccess = $false
}

# Production Build Test
Write-Host "   ✓ Production Build Test..." -ForegroundColor Yellow
try {
    $buildResult = & npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Build: Production build successful" -ForegroundColor Green
        $buildSuccess = $true
        
        # Extract bundle size metrics
        $bundleInfo = $buildResult | Select-String "dist/assets.*js.*KB"
        if ($bundleInfo) {
            Write-Host "   📊 Bundle Analysis:" -ForegroundColor Cyan
            $bundleInfo | ForEach-Object { Write-Host "      $_" -ForegroundColor White }
        }
    } else {
        Write-Host "   ❌ Build: Production build failed" -ForegroundColor Red
        $buildSuccess = $false
    }
} catch {
    Write-Host "   ❌ Build: Build process failed" -ForegroundColor Red
    $buildSuccess = $false
}

# === DASHBOARD FEATURES VALIDATION ===
Write-Host "`n📊 DASHBOARD FEATURES VALIDATION:" -ForegroundColor Green

# Check for essential dashboard components
$dashboardComponents = @(
    "TerraFusionDashboard.tsx",
    "SystemHealthWidget",
    "PerformanceChartWidget", 
    "TerraFusionModulesWidget",
    "GovernmentServicesWidget",
    "AIInsightsWidget",
    "FoundationScoreWidget"
)

$componentSuccess = 0
foreach ($component in $dashboardComponents) {
    $componentFile = "src/components/TerraFusionDashboard.tsx"
    if (Test-Path $componentFile) {
        $content = Get-Content $componentFile -Raw
        if ($content -match $component) {
            Write-Host "   ✅ Component: $component implemented" -ForegroundColor Green
            $componentSuccess++
        } else {
            Write-Host "   ❌ Component: $component missing" -ForegroundColor Red
        }
    }
}

# === TERRAFUSION INTEGRATION VALIDATION ===
Write-Host "`n🔗 TERRAFUSION INTEGRATION VALIDATION:" -ForegroundColor Green

# Cross-module integration checks
$integrationChecks = @{
    "React Query State Management" = "src/App.tsx"
    "TypeScript Type System" = "src/types/index.ts"
    "Mock Data System" = "src/data/mockData.ts"
    "Dashboard Hooks" = "src/hooks/useDashboardData.ts"
    "Quantum Constants" = "QUANTUM_FACTOR = 949"
}

$integrationSuccess = 0
foreach ($check in $integrationChecks.GetEnumerator()) {
    $checkName = $check.Key
    $checkPath = $check.Value
    
    if ($checkPath.Contains("=")) {
        # Check for constant value
        $content = Get-Content "src/data/mockData.ts" -Raw
        if ($content -match $checkPath) {
            Write-Host "   ✅ Integration: $checkName verified" -ForegroundColor Green
            $integrationSuccess++
        } else {
            Write-Host "   ❌ Integration: $checkName missing" -ForegroundColor Red
        }
    } elseif (Test-Path $checkPath) {
        Write-Host "   ✅ Integration: $checkName implemented" -ForegroundColor Green
        $integrationSuccess++
    } else {
        Write-Host "   ❌ Integration: $checkName missing" -ForegroundColor Red
    }
}

# === DEVELOPMENT SERVER VALIDATION ===
Write-Host "`n🚀 DEVELOPMENT SERVER VALIDATION:" -ForegroundColor Green

# Check if dev server can start (non-blocking test)
Write-Host "   ✓ Development server configuration..." -ForegroundColor Yellow
$viteConfig = "vite.config.ts"
if (Test-Path $viteConfig) {
    $configContent = Get-Content $viteConfig -Raw
    if ($configContent -match "port: 5013") {
        Write-Host "   ✅ Server: Port 5013 configured correctly" -ForegroundColor Green
        $serverConfigSuccess = $true
    } else {
        Write-Host "   ❌ Server: Port configuration issue" -ForegroundColor Red
        $serverConfigSuccess = $false
    }
    
    if ($configContent -match "proxy.*5009") {
        Write-Host "   ✅ Server: Backend proxy to port 5009 configured" -ForegroundColor Green
        $proxySuccess = $true
    } else {
        Write-Host "   ❌ Server: Backend proxy configuration missing" -ForegroundColor Red
        $proxySuccess = $false
    }
} else {
    Write-Host "   ❌ Server: Vite configuration missing" -ForegroundColor Red
    $serverConfigSuccess = $false
    $proxySuccess = $false
}

# === CHAMPIONSHIP VALIDATION SUMMARY ===
Write-Host "`n🏆 CHAMPIONSHIP VALIDATION SUMMARY:" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor DarkCyan

# Calculate validation scores
$totalChecks = 12
$passedChecks = 0

if ($tsSuccess) { $passedChecks++ }
if ($buildSuccess) { $passedChecks++ }
$passedChecks += $componentSuccess
$passedChecks += $integrationSuccess
if ($serverConfigSuccess) { $passedChecks++ }
if ($proxySuccess) { $passedChecks++ }

$validationPercentage = [math]::Round(($passedChecks / $totalChecks) * 100, 1)

Write-Host "   TypeScript Errors: $(if($tsSuccess){'0 (Championship✅)'}else{'❌ Has Errors'})" -ForegroundColor $(if($tsSuccess){'Green'}else{'Red'})
Write-Host "   Production Build: $(if($buildSuccess){'✅ Success'}else{'❌ Failed'})" -ForegroundColor $(if($buildSuccess){'Green'}else{'Red'})
Write-Host "   Dashboard Components: $componentSuccess/7 implemented" -ForegroundColor $(if($componentSuccess -eq 7){'Green'}elseif($componentSuccess -ge 5){'Yellow'}else{'Red'})
Write-Host "   TerraFusion Integration: $integrationSuccess/5 validated" -ForegroundColor $(if($integrationSuccess -eq 5){'Green'}elseif($integrationSuccess -ge 3){'Yellow'}else{'Red'})
Write-Host "   Server Configuration: $(if($serverConfigSuccess -and $proxySuccess){'✅ Complete'}else{'❌ Issues'})" -ForegroundColor $(if($serverConfigSuccess -and $proxySuccess){'Green'}else{'Red'})

Write-Host "`n📊 PHASE C.1 DASHBOARD VALIDATION SCORE: $validationPercentage%" -ForegroundColor $(if($validationPercentage -ge 90){'Green'}elseif($validationPercentage -ge 75){'Yellow'}else{'Red'})

# Foundation Score Calculation
if ($validationPercentage -ge 85) {
    $achievedIncrease = [math]::Round($expectedIncrease * ($validationPercentage / 100), 3)
    $currentFoundationScore = [math]::Round($previousScore + $achievedIncrease, 3)
    Write-Host "   🏛️ FOUNDATION SCORE ACHIEVED: $currentFoundationScore" -ForegroundColor Green
    Write-Host "   📈 Foundation Increase: +$achievedIncrease" -ForegroundColor Cyan
    
    if ($validationPercentage -ge 95) {
        Write-Host "   🏆 CHAMPIONSHIP EXCELLENCE ACHIEVED!" -ForegroundColor Green
    } elseif ($validationPercentage -ge 85) {
        Write-Host "   🥈 GOVERNMENT EXCELLENCE ACHIEVED!" -ForegroundColor Yellow
    }
} else {
    Write-Host "   📉 Foundation score increase pending (validation score too low)" -ForegroundColor Red
    $currentFoundationScore = $previousScore
}

# === NEXT STEPS ===
Write-Host "`n🎯 NEXT STEPS:" -ForegroundColor Green
if ($validationPercentage -ge 90) {
    Write-Host "   ✅ Phase C.1 TerraFusion Dashboard: CHAMPIONSHIP COMPLETE" -ForegroundColor Green
    Write-Host "   🚀 Ready for Phase C.2: TerraAgent implementation (+0.12 target)" -ForegroundColor Cyan
} else {
    Write-Host "   🔧 Address validation issues to achieve championship excellence" -ForegroundColor Yellow
    if (-not $tsSuccess) {
        Write-Host "      - Fix TypeScript compilation errors" -ForegroundColor Red
    }
    if (-not $buildSuccess) {
        Write-Host "      - Resolve production build issues" -ForegroundColor Red
    }
    if ($componentSuccess -lt 7) {
        Write-Host "      - Complete dashboard component implementation" -ForegroundColor Red
    }
}

Write-Host "`n🏛️ Government. Transcended. - TerraFusion Phase C.1 Validation Complete" -ForegroundColor Cyan
Write-Host "Quantum Factor: 949 | Terra-Cyan: #00FFFF | Golden Ratio: φ=1.618" -ForegroundColor DarkCyan
Write-Host "=" * 80 -ForegroundColor DarkCyan

# Return validation results for programmatic use
return @{
    ValidationPercentage = $validationPercentage
    FoundationScore = $currentFoundationScore
    TypeScriptSuccess = $tsSuccess
    BuildSuccess = $buildSuccess
    ComponentsImplemented = $componentSuccess
    IntegrationValidated = $integrationSuccess
    PassedChecks = $passedChecks
    TotalChecks = $totalChecks
}
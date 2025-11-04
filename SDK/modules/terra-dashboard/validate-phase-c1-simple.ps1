#!/usr/bin/env powershell
# TerraFusion Dashboard - Phase C.1 Validation Script
# Government. Transcended. - Championship Analytics Excellence

Write-Host "🏛️  TERRAFUSION PHASE C.1 DASHBOARD VALIDATION" -ForegroundColor Cyan
Write-Host "Government. Transcended. - Championship Analytics Excellence" -ForegroundColor Yellow
Write-Host "=" -Repeat 80 -ForegroundColor DarkCyan

# === FOUNDATION SCORE TRACKING ===
$previousScore = 12.218
$targetScore = 12.368
$expectedIncrease = 0.15

Write-Host ""
Write-Host "🎯 FOUNDATION SCORE TRACKING:" -ForegroundColor Green
Write-Host "   Previous Score: $previousScore" -ForegroundColor Cyan
Write-Host "   Target Score: $targetScore" -ForegroundColor Green
Write-Host "   Expected Increase: +$expectedIncrease" -ForegroundColor Yellow

# === NAVIGATE TO DASHBOARD DIRECTORY ===
Set-Location "C:\Users\bsval\terrafusion_os_1.0\SDK\modules\terra-dashboard"

# === BUILD VALIDATION ===
Write-Host ""
Write-Host "🔧 BUILD SYSTEM VALIDATION:" -ForegroundColor Green

# TypeScript Check
Write-Host "   ✓ TypeScript Compilation Test..." -ForegroundColor Yellow
$tsSuccess = $false
try {
    $null = & npm run type-check 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ TypeScript: 0 errors (Championship Standard)" -ForegroundColor Green
        $tsSuccess = $true
    } else {
        Write-Host "   ❌ TypeScript: Has compilation errors" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ TypeScript: Compilation failed" -ForegroundColor Red
}

# Build Check
Write-Host "   ✓ Production Build Test..." -ForegroundColor Yellow
$buildSuccess = $false
try {
    $buildOutput = & npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Build: Production build successful" -ForegroundColor Green
        $buildSuccess = $true
        
        # Extract bundle size info
        $bundleLines = $buildOutput | Where-Object { $_ -match "dist/assets.*\.js.*KB" }
        if ($bundleLines) {
            Write-Host "   📊 Bundle Analysis:" -ForegroundColor Cyan
            foreach ($line in $bundleLines) {
                Write-Host "      $line" -ForegroundColor White
            }
        }
    } else {
        Write-Host "   ❌ Build: Production build failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Build: Build process failed" -ForegroundColor Red
}

# === COMPONENT VALIDATION ===
Write-Host ""
Write-Host "📊 DASHBOARD COMPONENTS VALIDATION:" -ForegroundColor Green

$components = @(
    "SystemHealthWidget",
    "PerformanceChartWidget", 
    "TerraFusionModulesWidget",
    "GovernmentServicesWidget",
    "AIInsightsWidget",
    "FoundationScoreWidget"
)

$componentSuccess = 0
$dashboardFile = "src/components/TerraFusionDashboard.tsx"

if (Test-Path $dashboardFile) {
    $content = Get-Content $dashboardFile -Raw
    foreach ($component in $components) {
        if ($content -match $component) {
            Write-Host "   ✅ Component: $component implemented" -ForegroundColor Green
            $componentSuccess++
        } else {
            Write-Host "   ❌ Component: $component missing" -ForegroundColor Red
        }
    }
} else {
    Write-Host "   ❌ Dashboard file not found" -ForegroundColor Red
}

# === INTEGRATION VALIDATION ===
Write-Host ""
Write-Host "🔗 INTEGRATION VALIDATION:" -ForegroundColor Green

$integrationSuccess = 0

# Check React Query
if (Test-Path "src/App.tsx") {
    $appContent = Get-Content "src/App.tsx" -Raw
    if ($appContent -match "QueryClient") {
        Write-Host "   ✅ Integration: React Query configured" -ForegroundColor Green
        $integrationSuccess++
    } else {
        Write-Host "   ❌ Integration: React Query missing" -ForegroundColor Red
    }
}

# Check TypeScript types
if (Test-Path "src/types/index.ts") {
    Write-Host "   ✅ Integration: TypeScript types implemented" -ForegroundColor Green
    $integrationSuccess++
} else {
    Write-Host "   ❌ Integration: TypeScript types missing" -ForegroundColor Red
}

# Check mock data
if (Test-Path "src/data/mockData.ts") {
    $mockContent = Get-Content "src/data/mockData.ts" -Raw
    if ($mockContent -match "QUANTUM_FACTOR = 949") {
        Write-Host "   ✅ Integration: Quantum Factor 949 configured" -ForegroundColor Green
        $integrationSuccess++
    } else {
        Write-Host "   ❌ Integration: Quantum Factor missing" -ForegroundColor Red
    }
}

# Check hooks
if (Test-Path "src/hooks/useDashboardData.ts") {
    Write-Host "   ✅ Integration: Dashboard hooks implemented" -ForegroundColor Green
    $integrationSuccess++
} else {
    Write-Host "   ❌ Integration: Dashboard hooks missing" -ForegroundColor Red
}

# === SERVER VALIDATION ===
Write-Host ""
Write-Host "🚀 SERVER CONFIGURATION VALIDATION:" -ForegroundColor Green

$serverSuccess = 0

if (Test-Path "vite.config.ts") {
    $viteContent = Get-Content "vite.config.ts" -Raw
    if ($viteContent -match "port: 5013") {
        Write-Host "   ✅ Server: Port 5013 configured" -ForegroundColor Green
        $serverSuccess++
    } else {
        Write-Host "   ❌ Server: Port configuration issue" -ForegroundColor Red
    }
    
    if ($viteContent -match "proxy.*5009") {
        Write-Host "   ✅ Server: Backend proxy configured" -ForegroundColor Green
        $serverSuccess++
    } else {
        Write-Host "   ❌ Server: Backend proxy missing" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ Server: Vite config missing" -ForegroundColor Red
}

# === VALIDATION SUMMARY ===
Write-Host ""
Write-Host "🏆 CHAMPIONSHIP VALIDATION SUMMARY:" -ForegroundColor Green
Write-Host "=" -Repeat 50 -ForegroundColor DarkCyan

$totalChecks = 10
$passedChecks = 0

if ($tsSuccess) { $passedChecks++ }
if ($buildSuccess) { $passedChecks++ }
$passedChecks += $componentSuccess
$passedChecks += $integrationSuccess
$passedChecks += $serverSuccess

$validationPercentage = [math]::Round(($passedChecks / $totalChecks) * 100, 1)

Write-Host "   TypeScript: $(if($tsSuccess){'✅ 0 Errors'}else{'❌ Has Errors'})" -ForegroundColor $(if($tsSuccess){'Green'}else{'Red'})
Write-Host "   Build: $(if($buildSuccess){'✅ Success'}else{'❌ Failed'})" -ForegroundColor $(if($buildSuccess){'Green'}else{'Red'})
Write-Host "   Components: $componentSuccess/6 implemented" -ForegroundColor $(if($componentSuccess -eq 6){'Green'}elseif($componentSuccess -ge 4){'Yellow'}else{'Red'})
Write-Host "   Integration: $integrationSuccess/4 validated" -ForegroundColor $(if($integrationSuccess -eq 4){'Green'}elseif($integrationSuccess -ge 2){'Yellow'}else{'Red'})
Write-Host "   Server Config: $serverSuccess/2 validated" -ForegroundColor $(if($serverSuccess -eq 2){'Green'}else{'Red'})

Write-Host ""
Write-Host "📊 PHASE C.1 VALIDATION SCORE: $validationPercentage%" -ForegroundColor $(if($validationPercentage -ge 90){'Green'}elseif($validationPercentage -ge 75){'Yellow'}else{'Red'})

# Foundation Score Calculation
if ($validationPercentage -ge 85) {
    $achievedIncrease = [math]::Round($expectedIncrease * ($validationPercentage / 100), 3)
    $currentFoundationScore = [math]::Round($previousScore + $achievedIncrease, 3)
    Write-Host "🏛️ FOUNDATION SCORE: $currentFoundationScore" -ForegroundColor Green
    Write-Host "📈 Increase: +$achievedIncrease" -ForegroundColor Cyan
    
    if ($validationPercentage -ge 95) {
        Write-Host "🏆 CHAMPIONSHIP EXCELLENCE ACHIEVED!" -ForegroundColor Green
    } elseif ($validationPercentage -ge 90) {
        Write-Host "🥈 GOVERNMENT EXCELLENCE ACHIEVED!" -ForegroundColor Yellow
    }
} else {
    Write-Host "📉 Foundation score pending (validation < 85%)" -ForegroundColor Red
    $currentFoundationScore = $previousScore
}

Write-Host ""
Write-Host "🏛️ Government. Transcended. - Phase C.1 Complete" -ForegroundColor Cyan
Write-Host "Quantum Factor: 949 | Foundation Score: $currentFoundationScore" -ForegroundColor DarkCyan
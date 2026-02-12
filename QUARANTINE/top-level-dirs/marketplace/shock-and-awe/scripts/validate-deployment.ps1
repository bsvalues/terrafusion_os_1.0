# TerraFusion Elite Deployment Validator
# Ensures production readiness before deploying to terrafusionmarket.io

param(
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$script:Passed = 0
$script:Failed = 0
$script:Warnings = 0

function Write-Check {
    param($Message, $Status)
    $icon = switch ($Status) {
        "pass" { "✓"; $script:Passed++ }
        "fail" { "✗"; $script:Failed++ }
        "warn" { "⚠"; $script:Warnings++ }
    }
    $color = switch ($Status) {
        "pass" { "Green" }
        "fail" { "Red" }
        "warn" { "Yellow" }
    }
    Write-Host "  $icon $Message" -ForegroundColor $color
}

function Test-FileExists {
    param($Path, $Description)
    if (Test-Path $Path) {
        Write-Check "$Description exists" "pass"
        return $true
    } else {
        Write-Check "$Description missing" "fail"
        return $false
    }
}

Write-Host "`n🔍 TerraFusion Elite Deployment Validator" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# Test 1: Critical Files
Write-Host "`n📁 Critical Files Check" -ForegroundColor Yellow
$criticalFiles = @(
    @{ Path = "dist/index.html"; Desc = "Main HTML" }
    @{ Path = "dist/.htaccess"; Desc = "Apache config" }
    @{ Path = "dist/robots.txt"; Desc = "SEO robots" }
    @{ Path = "dist/sitemap.xml"; Desc = "Sitemap" }
    @{ Path = "dist/manifest.json"; Desc = "PWA manifest" }
    @{ Path = "deploy-hostinger.ps1"; Desc = "Deploy script" }
    @{ Path = "package.json"; Desc = "Package manifest" }
)

foreach ($file in $criticalFiles) {
    Test-FileExists -Path $file.Path -Description $file.Desc | Out-Null
}

# Test 2: Directory Structure
Write-Host "`n📂 Directory Structure" -ForegroundColor Yellow
$dirs = @("dist/assets", "dist/js", "dist/styles")
foreach ($dir in $dirs) {
    if (Test-Path $dir) {
        $count = (Get-ChildItem $dir -Recurse -File).Count
        Write-Check "$dir ($count files)" "pass"
    } else {
        Write-Check "$dir missing" "fail"
    }
}

# Test 3: Package.json Validation
Write-Host "`n📦 Package Configuration" -ForegroundColor Yellow
$pkg = Get-Content "package.json" | ConvertFrom-Json
$requiredScripts = @("build:production", "package:deployment", "deploy:hostinger:ps")
foreach ($script in $requiredScripts) {
    if ($pkg.scripts.$script) {
        Write-Check "Script '$script' defined" "pass"
    } else {
        Write-Check "Script '$script' missing" "fail"
    }
}

# Test 4: No Tauri References
Write-Host "`n🚫 Tauri Removal Validation" -ForegroundColor Yellow
$tauriInPackage = Select-String -Path "package.json" -Pattern "@tauri-apps" -Quiet
if (-not $tauriInPackage) {
    Write-Check "No Tauri in package.json" "pass"
} else {
    Write-Check "Tauri still in package.json" "fail"
}

$tauriInLock = Select-String -Path "package-lock.json" -Pattern "@tauri-apps" -Quiet
if (-not $tauriInLock) {
    Write-Check "No Tauri in lockfile" "pass"
} else {
    Write-Check "Tauri references in lockfile" "warn"
}

if (Test-Path "src-tauri") {
    Write-Check "src-tauri directory removed" "fail"
} else {
    Write-Check "src-tauri directory removed" "pass"
}

# Test 5: CSP Headers
Write-Host "`n🔒 Security Headers" -ForegroundColor Yellow
$indexHtml = Get-Content "dist/index.html" -Raw
if ($indexHtml -match 'Content-Security-Policy') {
    Write-Check "CSP header present in index.html" "pass"
    if ($indexHtml -match "default-src\s+'self'") {
        Write-Check "CSP default-src configured" "pass"
    }
    if ($indexHtml -notmatch 'tauri:|ipc\.localhost') {
        Write-Check "No Tauri CSP directives" "pass"
    } else {
        Write-Check "Tauri CSP directives found" "fail"
    }
} else {
    Write-Check "CSP header missing" "fail"
}

$htaccess = Get-Content "dist/.htaccess" -Raw
if ($htaccess -match 'RewriteEngine\s+On') {
    Write-Check "Rewrite rules enabled" "pass"
} else {
    Write-Check "Rewrite rules missing" "fail"
}

if ($htaccess -match 'HTTPS|https') {
    Write-Check "HTTPS redirect configured" "pass"
} else {
    Write-Check "HTTPS redirect missing" "warn"
}

# Test 6: Build Size
Write-Host "`n📊 Build Metrics" -ForegroundColor Yellow
$distSize = (Get-ChildItem dist -Recurse -File | Measure-Object -Property Length -Sum).Sum
$distSizeKB = [math]::Round($distSize / 1KB, 2)
Write-Check "Total build size: $distSizeKB KB" "pass"

if (Test-Path "terrafusion-deployment.tar.gz") {
    $tarSize = (Get-Item "terrafusion-deployment.tar.gz").Length
    $tarSizeKB = [math]::Round($tarSize / 1KB, 2)
    Write-Check "Deployment package: $tarSizeKB KB" "pass"

    if ($tarSizeKB -lt 200) {
        Write-Check "Package size optimal (<200 KB)" "pass"
    } else {
        Write-Check "Package size large (>200 KB)" "warn"
    }
} else {
    Write-Check "Deployment package not created" "warn"
    Write-Host "    Run: npm run package:deployment" -ForegroundColor Gray
}

# Test 7: Test Suite
Write-Host "`n🧪 Test Suite Status" -ForegroundColor Yellow
try {
    $testOutput = & npm test -- --run --reporter=verbose 2>&1 | Out-String
    if ($testOutput -match "(\d+)\s+passed") {
        $passedTests = $Matches[1]
        Write-Check "$passedTests tests passed" "pass"
    }
    if ($testOutput -notmatch "FAIL") {
        Write-Check "No test failures" "pass"
    } else {
        Write-Check "Some tests failed" "fail"
    }
} catch {
    Write-Check "Could not run tests" "warn"
}

# Test 8: Deploy Script Validation
Write-Host "`n🚀 Deploy Script Validation" -ForegroundColor Yellow
$deployScript = Get-Content "deploy-hostinger.ps1" -Raw
if ($deployScript -match 'Get-Credential') {
    Write-Check "Credential prompt implemented" "pass"
} else {
    Write-Check "Credential prompt missing" "fail"
}

if ($deployScript -match 'FtpWebRequest') {
    Write-Check "FTP implementation present" "pass"
} else {
    Write-Check "FTP implementation missing" "fail"
}

if ($deployScript -match 'EnableSsl.*true|Ftps') {
    Write-Check "FTPS support available" "pass"
} else {
    Write-Check "FTPS support missing" "warn"
}

# Summary
Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "📋 Validation Summary" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "  ✓ Passed:   $script:Passed" -ForegroundColor Green
Write-Host "  ⚠ Warnings: $script:Warnings" -ForegroundColor Yellow
Write-Host "  ✗ Failed:   $script:Failed" -ForegroundColor Red

if ($script:Failed -eq 0 -and $script:Warnings -eq 0) {
    Write-Host "`n✅ DEPLOYMENT VALIDATED - READY FOR PRODUCTION" -ForegroundColor Green
    Write-Host "   Execute: npm run deploy:hostinger:ps`n" -ForegroundColor Cyan
    exit 0
} elseif ($script:Failed -eq 0) {
    Write-Host "`n⚠️  DEPLOYMENT READY WITH WARNINGS" -ForegroundColor Yellow
    Write-Host "   Review warnings above before deploying`n" -ForegroundColor Gray
    exit 0
} else {
    Write-Host "`n❌ DEPLOYMENT BLOCKED - FIX FAILURES FIRST" -ForegroundColor Red
    Write-Host "   Address failed checks before deploying`n" -ForegroundColor Gray
    exit 1
}

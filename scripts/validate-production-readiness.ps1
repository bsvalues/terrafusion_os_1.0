#!/usr/bin/env pwsh
# TerraFusion OS - Production Readiness Validation
# THE TERRAFUSION WAY: Comprehensive pre-deployment checks

Write-Host ""
Write-Host "🚀 ================================================================" -ForegroundColor Cyan
Write-Host "   TerraFusion OS - Production Readiness Validation" -ForegroundColor Cyan
Write-Host "   Benton County, Washington - 89,247 Parcels" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$ErrorCount = 0
$WarningCount = 0
$PassCount = 0

function Test-Check {
    param(
        [string]$Category,
        [string]$Name,
        [scriptblock]$Test,
        [string]$Critical = "No"
    )
    
    Write-Host "[$Category] Testing: $Name..." -NoNewline
    
    try {
        $result = & $Test
        if ($result) {
            Write-Host " ✅ PASS" -ForegroundColor Green
            $script:PassCount++
            return $true
        } else {
            if ($Critical -eq "Yes") {
                Write-Host " ❌ FAIL (CRITICAL)" -ForegroundColor Red
                $script:ErrorCount++
            } else {
                Write-Host " ⚠️ WARNING" -ForegroundColor Yellow
                $script:WarningCount++
            }
            return $false
        }
    } catch {
        if ($Critical -eq "Yes") {
            Write-Host " ❌ ERROR: $_" -ForegroundColor Red
            $script:ErrorCount++
        } else {
            Write-Host " ⚠️ WARNING: $_" -ForegroundColor Yellow
            $script:WarningCount++
        }
        return $false
    }
}

Write-Host "🔍 Phase 1: Configuration Validation" -ForegroundColor Cyan
Write-Host "────────────────────────────────────" -ForegroundColor Cyan

# Check .env.benton exists
Test-Check "Config" ".env.benton file exists" {
    Test-Path ".env.benton"
} -Critical "Yes"

# Check critical environment variables
Test-Check "Config" "COUNTY_FIPS configured" {
    $content = Get-Content ".env.benton" -Raw
    $content -match "COUNTY_FIPS=53005"
} -Critical "Yes"

Test-Check "Config" "Production environment set" {
    $content = Get-Content ".env.benton" -Raw
    $content -match "TF_ENV=production"
} -Critical "Yes"

Test-Check "Config" "Harris PACS local mode enabled" {
    $content = Get-Content ".env.benton" -Raw
    $content -match "HARRIS_PACS_MODE=local"
} -Critical "Yes"

# Check no placeholder secrets (excluding comments)
Test-Check "Security" "No placeholder API keys" {
    $content = Get-Content ".env.benton" | Where-Object { $_ -notmatch "^#" }
    $nonCommentContent = $content -join "`n"
    -not ($nonCommentContent -match "PLACEHOLDER|YOUR_KEY_HERE|REPLACE_ME|REQUIRED_FOR_DEPLOYMENT|REPLACE_WITH")
} -Critical "Yes"

Write-Host ""
Write-Host "💾 Phase 2: Database Validation" -ForegroundColor Cyan
Write-Host "────────────────────────────────────" -ForegroundColor Cyan

# Check operational databases exist
Test-Check "Database" "Main database exists" {
    Test-Path "data/terrafusion.db"
} -Critical "Yes"

Test-Check "Database" "Harris PACS cache exists" {
    Test-Path "data/databases/harris_pacs_cache.db"
} -Critical "Yes"

Test-Check "Database" "Real PACS database exists" {
    Test-Path "data/databases/real_pacs.db"
} -Critical "Yes"

Test-Check "Database" "Levy chain database exists" {
    Test-Path "data/databases/levy_chain.db"
}

Test-Check "Database" "Trends chain database exists" {
    Test-Path "data/databases/trends_chain.db"
}

Test-Check "Database" "Analytics database exists" {
    Test-Path "data/databases/analytics.db"
}

# Count Benton County databases
$bentonDbCount = (Get-ChildItem -Path "data" -Filter "benton_*.db" -ErrorAction SilentlyContinue).Count
Test-Check "Database" "Benton County databases ($bentonDbCount/15)" {
    $bentonDbCount -ge 10
}

Write-Host ""
Write-Host "📁 Phase 3: Directory Structure" -ForegroundColor Cyan
Write-Host "────────────────────────────────────" -ForegroundColor Cyan

# Check critical directories
$criticalDirs = @(
    "data",
    "data/databases",
    "logs",
    "backups",
    "artifacts",
    "scripts"
)

foreach ($dir in $criticalDirs) {
    Test-Check "Directory" "$dir exists" {
        Test-Path $dir
    }
}

Write-Host ""
Write-Host "🔐 Phase 4: Security Validation" -ForegroundColor Cyan
Write-Host "────────────────────────────────────" -ForegroundColor Cyan

# Check .env.benton not in git
Test-Check "Security" ".env.benton not in git" {
    $gitIgnore = Get-Content ".gitignore" -ErrorAction SilentlyContinue
    $gitIgnore -match "\.env\.benton"
} -Critical "Yes"

# Check strong passwords (at least 40 chars)
Test-Check "Security" "Strong JWT secret (40+ chars)" {
    $content = Get-Content ".env.benton" -Raw
    if ($content -match 'JWT_SECRET=(.+)') {
        $secret = $matches[1].Trim()
        $secret.Length -ge 40
    } else { $false }
} -Critical "Yes"

Test-Check "Security" "Strong Postgres password (40+ chars)" {
    $content = Get-Content ".env.benton" -Raw
    if ($content -match 'POSTGRES_PASSWORD=(.+)') {
        $secret = $matches[1].Trim()
        $secret.Length -ge 40
    } else { $false }
} -Critical "Yes"

Write-Host ""
Write-Host "📦 Phase 5: Dependencies" -ForegroundColor Cyan
Write-Host "────────────────────────────────────" -ForegroundColor Cyan

# Check package.json
Test-Check "Dependencies" "package.json exists" {
    Test-Path "package.json"
} -Critical "Yes"

# Check node_modules
Test-Check "Dependencies" "node_modules installed" {
    Test-Path "node_modules"
}

# Check if npm packages are up to date
Test-Check "Dependencies" "package-lock.json exists" {
    Test-Path "package-lock.json"
}

Write-Host ""
Write-Host "🏗️ Phase 6: Project Structure" -ForegroundColor Cyan
Write-Host "────────────────────────────────────" -ForegroundColor Cyan

# Check core directories
$projectDirs = @(
    "backend",
    "frontend",
    "packages",
    "trust-fabric",
    "docs"
)

foreach ($dir in $projectDirs) {
    Test-Check "Structure" "$dir exists" {
        Test-Path $dir
    }
}

Write-Host ""
Write-Host "📚 Phase 7: Documentation" -ForegroundColor Cyan
Write-Host "────────────────────────────────────" -ForegroundColor Cyan

$docs = @(
    "README.md",
    "PRODUCTION_READINESS_GAP_ANALYSIS.md",
    "DATABASE_CLEANUP_SUCCESS.md",
    "REVISED_PRODUCTION_PLAN_LOCAL_DB.md"
)

foreach ($doc in $docs) {
    Test-Check "Documentation" "$doc exists" {
        Test-Path $doc
    }
}

Write-Host ""
Write-Host "🎯 Phase 8: Production Readiness Score" -ForegroundColor Cyan
Write-Host "────────────────────────────────────" -ForegroundColor Cyan

$totalChecks = $PassCount + $WarningCount + $ErrorCount
$passPercent = [math]::Round(($PassCount / $totalChecks) * 100, 1)

Write-Host ""
Write-Host "📊 Results Summary" -ForegroundColor Cyan
Write-Host "══════════════════" -ForegroundColor Cyan
Write-Host "✅ Passed:   $PassCount" -ForegroundColor Green
Write-Host "⚠️  Warnings: $WarningCount" -ForegroundColor Yellow
Write-Host "❌ Failed:   $ErrorCount" -ForegroundColor Red
Write-Host "───────────────────" -ForegroundColor Gray
Write-Host "📈 Total:    $totalChecks checks" -ForegroundColor White
Write-Host ""

# Production readiness score
Write-Host "🎯 Production Readiness Score: $passPercent%" -ForegroundColor $(if ($passPercent -ge 95) { "Green" } elseif ($passPercent -ge 90) { "Yellow" } else { "Red" })
Write-Host ""

# Determine overall status
if ($ErrorCount -eq 0) {
    Write-Host "✅ PRODUCTION READY!" -ForegroundColor Green
    Write-Host "   All critical checks passed." -ForegroundColor Green
    Write-Host "   System is ready for deployment!" -ForegroundColor Green
    
    if ($WarningCount -gt 0) {
        Write-Host ""
        Write-Host "ℹ️  Note: $WarningCount warnings detected (non-critical)" -ForegroundColor Yellow
        Write-Host "   Consider addressing these for optimal performance." -ForegroundColor Yellow
    }
    
    $exitCode = 0
} elseif ($ErrorCount -le 2) {
    Write-Host "⚠️  ALMOST READY" -ForegroundColor Yellow
    Write-Host "   $ErrorCount critical issue(s) remaining." -ForegroundColor Yellow
    Write-Host "   Fix these before deploying to production." -ForegroundColor Yellow
    $exitCode = 1
} else {
    Write-Host "❌ NOT PRODUCTION READY" -ForegroundColor Red
    Write-Host "   $ErrorCount critical issues detected." -ForegroundColor Red
    Write-Host "   Resolve all critical issues before deployment." -ForegroundColor Red
    $exitCode = 2
}

Write-Host ""
Write-Host "🚀 THE TERRAFUSION WAY - Quality First!" -ForegroundColor Magenta
Write-Host ""

# Create detailed report
$reportPath = "logs/production-readiness-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
$reportContent = @"
TerraFusion OS - Production Readiness Report
============================================
Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
County: Benton County, Washington (FIPS: 53005)
Parcels: 89,247

Results:
- Passed: $PassCount
- Warnings: $WarningCount
- Failed: $ErrorCount
- Total Checks: $totalChecks
- Score: $passPercent%

Status: $(if ($ErrorCount -eq 0) { "PRODUCTION READY ✅" } elseif ($ErrorCount -le 2) { "ALMOST READY ⚠️" } else { "NOT READY ❌" })

THE TERRAFUSION WAY - Enterprise-grade validation complete!
"@

New-Item -Path "logs" -ItemType Directory -Force | Out-Null
$reportContent | Out-File -FilePath $reportPath -Encoding UTF8

Write-Host "📝 Detailed report saved: $reportPath" -ForegroundColor Cyan
Write-Host ""

exit $exitCode

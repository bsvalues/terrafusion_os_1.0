#!/usr/bin/env pwsh
<#
.SYNOPSIS
    TerraFusion Elite Backend - Validation Script
.DESCRIPTION
    Comprehensive validation of TerraFusion backend build status
.EXAMPLE
    .\validate-backend.ps1
#>

$ErrorActionPreference = 'Stop'
$BackendPath = Split-Path -Parent $PSScriptRoot

Write-Host "`n╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   TERRAFUSION BACKEND VALIDATION                                 ║" -ForegroundColor Cyan
Write-Host "║   Championship Level Quality Assurance                           ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Push-Location $BackendPath

# Core projects to validate
$coreProjects = @(
    "TerraFusion.Abstractions",
    "TerraFusion.Core",
    "TerraFusion.AI",
    "TerraFusion.Data",
    "TerraFusion.API",
    "TerraFusion.Consciousness",
    "TerraFusion.CostForge",
    "TerraFusion.Operations"
)

$results = @()
$totalErrors = 0

Write-Host "🔍 Validating Core Projects..." -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════`n" -ForegroundColor Gray

foreach ($project in $coreProjects) {
    Write-Host "  Building $project..." -NoNewline

    $buildOutput = dotnet build "$project\$project.csproj" -c Release --no-restore 2>&1
    $errorCount = ($buildOutput | Select-String "error CS").Count
    $succeeded = $buildOutput | Select-String "Build succeeded"

    if ($succeeded -and $errorCount -eq 0) {
        Write-Host " ✅" -ForegroundColor Green
        $results += [PSCustomObject]@{
            Project = $project
            Status  = "PASS"
            Errors  = 0
        }
    }
    else {
        Write-Host " ❌" -ForegroundColor Red
        $totalErrors += $errorCount
        $results += [PSCustomObject]@{
            Project = $project
            Status  = "FAIL"
            Errors  = $errorCount
        }

        # Show first 3 errors
        $buildOutput | Select-String "error CS" | Select-Object -First 3 | ForEach-Object {
            Write-Host "    $_" -ForegroundColor Red
        }
    }
}

Write-Host "`n" + ("═" * 60) -ForegroundColor Gray
Write-Host "`n📊 VALIDATION RESULTS" -ForegroundColor Cyan

# Display summary table
$results | Format-Table -AutoSize

# Overall status
Write-Host "`n🎯 OVERALL STATUS" -ForegroundColor Cyan
if ($totalErrors -eq 0) {
    Write-Host "  ✅ ALL PROJECTS PASSED - PRODUCTION READY" -ForegroundColor Green
    Write-Host "  🏆 Championship Level Quality Achieved" -ForegroundColor Yellow
    $exitCode = 0
}
else {
    Write-Host "  ❌ VALIDATION FAILED - $totalErrors ERRORS" -ForegroundColor Red
    Write-Host "  ⚠️  Review errors and rebuild" -ForegroundColor Yellow
    $exitCode = 1
}

# Additional checks
Write-Host "`n🔍 Additional Checks:" -ForegroundColor Cyan

# Check for solution file
if (Test-Path "TerraFusion.sln") {
    Write-Host "  ✅ Solution file exists" -ForegroundColor Green
}
else {
    Write-Host "  ❌ Solution file missing" -ForegroundColor Red
}

# Check for deployment documentation
if (Test-Path "DEPLOYMENT.md") {
    Write-Host "  ✅ Deployment documentation exists" -ForegroundColor Green
}
else {
    Write-Host "  ⚠️  Deployment documentation missing" -ForegroundColor Yellow
}

# Check for configuration files
$configFiles = Get-ChildItem "TerraFusion.API\appsettings*.json" -ErrorAction SilentlyContinue
if ($configFiles.Count -gt 0) {
    Write-Host "  ✅ Configuration files: $($configFiles.Count) environments" -ForegroundColor Green
}
else {
    Write-Host "  ❌ No configuration files found" -ForegroundColor Red
}

Write-Host "`n" + ("═" * 60) -ForegroundColor Gray
Write-Host "Validation completed: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

Pop-Location
exit $exitCode

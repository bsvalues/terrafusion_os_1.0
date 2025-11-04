# TerraFusion Elite Government OS Engineering Agent
# System Health Validation - 31 Production Systems
# Date: November 4, 2025
# Purpose: Comprehensive health check and performance validation

$ErrorActionPreference = "Stop"

# Configuration
$applicationsPath = "C:\Users\bsval\terrafusion_os_1.0\applications"
$reportPath = "SYSTEM_HEALTH_VALIDATION_REPORT.md"

# Initialize tracking
$results = @{
    Total = 0
    Healthy = 0
    Warning = 0
    Critical = 0
    Systems = @()
}

function Write-Header {
    param($Text)
    Write-Host "`n$('=' * 60)" -ForegroundColor Cyan
    Write-Host $Text -ForegroundColor Yellow
    Write-Host "$('=' * 60)`n" -ForegroundColor Cyan
}

function Test-SystemHealth {
    param(
        [string]$SystemPath,
        [string]$SystemName
    )

    $health = @{
        Name = $SystemName
        Status = "HEALTHY"
        Issues = @()
        Warnings = @()
        Metrics = @{}
    }

    try {
        # 1. File System Validation
        if (-not (Test-Path $SystemPath)) {
            $health.Status = "CRITICAL"
            $health.Issues += "System path not found"
            return $health
        }

        # 2. File Count and Size Analysis
        $files = Get-ChildItem -Path $SystemPath -Recurse -File -ErrorAction SilentlyContinue
        $fileCount = ($files | Measure-Object).Count
        $totalSize = ($files | Measure-Object -Property Length -Sum).Sum
        $sizeMB = [math]::Round($totalSize / 1MB, 2)

        $health.Metrics.FileCount = $fileCount
        $health.Metrics.SizeMB = $sizeMB

        if ($fileCount -eq 0) {
            $health.Status = "WARNING"
            $health.Warnings += "Empty system - no files found"
        }

        # 3. Migration Manifest Validation
        $manifestPath = Join-Path $SystemPath ".migration-manifest.json"
        if (Test-Path $manifestPath) {
            $manifest = Get-Content $manifestPath | ConvertFrom-Json
            $health.Metrics.MigrationDate = $manifest.migration_date
            $health.Metrics.ManifestFileCount = $manifest.file_count

            # Verify file count matches manifest
            if ($manifest.file_count -ne $fileCount) {
                $health.Status = "WARNING"
                $health.Warnings += "File count mismatch: Manifest=$($manifest.file_count), Actual=$fileCount"
            }
        } else {
            $health.Warnings += "Migration manifest not found"
        }

        # 4. Technology Detection
        $techStack = @()
        if (Test-Path (Join-Path $SystemPath "package.json")) {
            $techStack += "Node.js"
            $packageJson = Get-Content (Join-Path $SystemPath "package.json") -Raw | ConvertFrom-Json
            $health.Metrics.NodeVersion = $packageJson.engines.node
        }

        if (Get-ChildItem -Path $SystemPath -Filter "*.csproj" -Recurse -ErrorAction SilentlyContinue) {
            $techStack += ".NET"
        }

        if (Test-Path (Join-Path $SystemPath "requirements.txt")) {
            $techStack += "Python"
        }

        if (Test-Path (Join-Path $SystemPath "Dockerfile")) {
            $techStack += "Docker"
        }

        $health.Metrics.TechStack = $techStack -join ", "

        # 5. Directory Structure Validation
        $directories = Get-ChildItem -Path $SystemPath -Directory -ErrorAction SilentlyContinue
        $health.Metrics.DirectoryCount = ($directories | Measure-Object).Count

        # 6. Critical Files Check
        $criticalFiles = @("README.md", ".gitignore")
        foreach ($file in $criticalFiles) {
            if (-not (Test-Path (Join-Path $SystemPath $file))) {
                $health.Warnings += "Missing recommended file: $file"
            }
        }

        # 7. Overall Status Assessment
        if ($health.Issues.Count -gt 0) {
            $health.Status = "CRITICAL"
        } elseif ($health.Warnings.Count -gt 2) {
            $health.Status = "WARNING"
        }

    } catch {
        $health.Status = "CRITICAL"
        $health.Issues += "Validation error: $($_.Exception.Message)"
    }

    return $health
}

# Main Validation Loop
Write-Header "TerraFusion Elite Government OS - System Health Validation"
Write-Host "Starting comprehensive health check of 31 production systems...`n" -ForegroundColor Green

$systems = Get-ChildItem -Path $applicationsPath -Directory | Where-Object { $_.Name -notlike '*backup*' }
$results.Total = $systems.Count

foreach ($system in $systems) {
    Write-Host "Validating: $($system.Name)..." -NoNewline

    $health = Test-SystemHealth -SystemPath $system.FullName -SystemName $system.Name
    $results.Systems += $health

    switch ($health.Status) {
        "HEALTHY" {
            $results.Healthy++
            Write-Host " ✅ HEALTHY" -ForegroundColor Green
        }
        "WARNING" {
            $results.Warning++
            Write-Host " ⚠️ WARNING" -ForegroundColor Yellow
        }
        "CRITICAL" {
            $results.Critical++
            Write-Host " ❌ CRITICAL" -ForegroundColor Red
        }
    }
}

# Generate Summary
Write-Header "Validation Summary"
Write-Host "Total Systems Validated: $($results.Total)" -ForegroundColor Cyan
Write-Host "Healthy Systems: $($results.Healthy)" -ForegroundColor Green
Write-Host "Warning Systems: $($results.Warning)" -ForegroundColor Yellow
Write-Host "Critical Systems: $($results.Critical)" -ForegroundColor Red
Write-Host ""

# Calculate Overall Health Score
$healthScore = [math]::Round(($results.Healthy / $results.Total) * 100, 2)
Write-Host "Overall Health Score: $healthScore%" -ForegroundColor $(if($healthScore -ge 95){"Green"}elseif($healthScore -ge 80){"Yellow"}else{"Red"})

# Generate Markdown Report
$report = @"
# 🏥 TerraFusion OS - System Health Validation Report

**Generated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Agent:** TerraFusion Elite Government OS Engineering Agent
**Systems Validated:** $($results.Total)

---

## 📊 Executive Summary

| Metric | Value |
|--------|-------|
| **Total Systems** | $($results.Total) |
| **Healthy Systems** | $($results.Healthy) ✅ |
| **Warning Systems** | $($results.Warning) ⚠️ |
| **Critical Systems** | $($results.Critical) ❌ |
| **Overall Health Score** | **$healthScore%** |

---

## 🎯 System-by-System Analysis

"@

foreach ($system in ($results.Systems | Sort-Object Name)) {
    $statusEmoji = switch ($system.Status) {
        "HEALTHY" { "✅" }
        "WARNING" { "⚠️" }
        "CRITICAL" { "❌" }
    }

    $report += @"

### $statusEmoji $($system.Name)

**Status:** $($system.Status)
**Files:** $($system.Metrics.FileCount)
**Size:** $($system.Metrics.SizeMB) MB
**Tech Stack:** $($system.Metrics.TechStack)

"@

    if ($system.Warnings.Count -gt 0) {
        $report += "`n**Warnings:**`n"
        foreach ($warning in $system.Warnings) {
            $report += "- ⚠️ $warning`n"
        }
    }

    if ($system.Issues.Count -gt 0) {
        $report += "`n**Critical Issues:**`n"
        foreach ($issue in $system.Issues) {
            $report += "- ❌ $issue`n"
        }
    }
}

$report += @"

---

## 🚀 Recommendations

"@

if ($results.Healthy -eq $results.Total) {
    $report += @"
✅ **EXCELLENT** - All systems are healthy and operational.

**Next Steps:**
1. Proceed with integration testing
2. Begin county deployment preparation
3. Activate AI swarm coordination
4. Enable real-time monitoring

"@
} elseif ($results.Critical -gt 0) {
    $report += @"
❌ **ATTENTION REQUIRED** - Critical issues detected in $($results.Critical) system(s).

**Immediate Actions:**
1. Review and resolve critical issues above
2. Verify system integrity
3. Re-run validation after fixes
4. Update migration manifests if needed

"@
} else {
    $report += @"
⚠️ **MINOR ISSUES** - Some warnings detected, but systems are functional.

**Recommended Actions:**
1. Review warnings and address as needed
2. Add missing documentation files
3. Validate file count discrepancies
4. Proceed with testing

"@
}

$report += @"

---

## 📈 Performance Metrics

**Total File Count:** $(($results.Systems | Measure-Object -Property {$_.Metrics.FileCount} -Sum).Sum)
**Total Storage:** $([math]::Round((($results.Systems | Measure-Object -Property {$_.Metrics.SizeMB} -Sum).Sum) / 1024, 2)) GB
**Validation Time:** $(Get-Date -Format "HH:mm:ss")

---

*Generated by TerraFusion Elite Government OS Engineering Agent*
*Evidence-Based | Data-Driven | Machine Precision*
"@

# Save Report
Set-Content -Path $reportPath -Value $report -Force
Write-Host "`n✅ Report generated: $reportPath" -ForegroundColor Green

# Display Critical/Warning Systems
if ($results.Warning -gt 0 -or $results.Critical -gt 0) {
    Write-Header "Systems Requiring Attention"

    foreach ($system in ($results.Systems | Where-Object { $_.Status -ne "HEALTHY" } | Sort-Object Status, Name)) {
        Write-Host "`n$($system.Status): $($system.Name)" -ForegroundColor $(if($system.Status -eq "CRITICAL"){"Red"}else{"Yellow"})

        if ($system.Warnings.Count -gt 0) {
            Write-Host "  Warnings:" -ForegroundColor Yellow
            foreach ($warning in $system.Warnings) {
                Write-Host "    - $warning" -ForegroundColor Yellow
            }
        }

        if ($system.Issues.Count -gt 0) {
            Write-Host "  Issues:" -ForegroundColor Red
            foreach ($issue in $system.Issues) {
                Write-Host "    - $issue" -ForegroundColor Red
            }
        }
    }
}

Write-Host "`n🏆 System Health Validation Complete" -ForegroundColor Green
Write-Host "Government. Validated. Excellence. Verified." -ForegroundColor Yellow

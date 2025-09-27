# TerraFusion OS - Hardcoding Detection and Prevention Script
# Scans entire codebase for hardcoded ports and agent counts

param(
    [switch]$Fix,
    [switch]$Strict
)

Write-Host "🔍 Scanning TerraFusion OS for hardcoded values..." -ForegroundColor Yellow

$hardcodingViolations = @()
$rootPath = "C:\Users\bsval\terrafusion_os_1.0"

# Define patterns to detect
$hardcodedPatterns = @{
    "Ports" = @(
        "localhost:5046", "localhost:3102", "localhost:3000", 
        "localhost:8080", ":5046", ":3102", ":3000", ":8080"
    )
    "AgentCounts" = @(
        "\b1008\b", "\b1,008\b", "1008 agents", "1,008 agents"
    )
    "URLs" = @(
        "http://localhost:5046", "http://localhost:3102", 
        "http://localhost:3000", "http://localhost:8080"
    )
}

# Files to scan (exclude documentation and generated files)
$filesToScan = @(
    "backend/**/*.cs",
    "frontend/**/*.tsx",
    "frontend/**/*.ts", 
    "frontend/**/*.js",
    "scripts/**/*.ps1",
    "package.json",
    "*.json",
    "*.js",
    "*.ts"
)

foreach ($pattern in $filesToScan) {
    $files = Get-ChildItem -Path $rootPath -Include $pattern -Recurse -File | 
             Where-Object { 
                $_.FullName -notmatch "node_modules|\.git|dist|build|temp|\.backup" 
             }

    foreach ($file in $files) {
        try {
            $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
            if ($content) {
                foreach ($category in $hardcodedPatterns.Keys) {
                    foreach ($hardcodedPattern in $hardcodedPatterns[$category]) {
                        if ($content -match $hardcodedPattern) {
                            $violation = @{
                                File = $file.FullName.Replace($rootPath, "")
                                Category = $category
                                Pattern = $hardcodedPattern
                                LineCount = ($content -split "`n" | Where-Object { $_ -match $hardcodedPattern }).Count
                            }
                            $hardcodingViolations += $violation
                            
                            Write-Host "❌ VIOLATION: $($violation.Category) in $($violation.File)" -ForegroundColor Red
                            Write-Host "   Pattern: $($violation.Pattern)" -ForegroundColor Yellow
                        }
                    }
                }
            }
        }
        catch {
            Write-Warning "Could not scan file: $($file.FullName)"
        }
    }
}

Write-Host "`n📊 SCAN RESULTS:" -ForegroundColor Magenta
Write-Host "Total violations found: $($hardcodingViolations.Count)" -ForegroundColor $(if ($hardcodingViolations.Count -eq 0) { "Green" } else { "Red" })

if ($hardcodingViolations.Count -gt 0) {
    $groupedViolations = $hardcodingViolations | Group-Object Category
    foreach ($group in $groupedViolations) {
        Write-Host "`n$($group.Name) violations: $($group.Count)" -ForegroundColor Yellow
        foreach ($violation in $group.Group) {
            Write-Host "  - $($violation.File) ($($violation.LineCount) occurrences)" -ForegroundColor Gray
        }
    }
    
    if ($Fix) {
        Write-Host "`n🔧 ATTEMPTING AUTOMATIC FIXES..." -ForegroundColor Cyan
        # Add automatic fixing logic here
        Write-Host "⚠️ Automatic fixing not implemented yet. Manual review required." -ForegroundColor Yellow
    }
    
    Write-Host "`n❌ CONFIGURATION ENFORCEMENT FAILED" -ForegroundColor Red
    Write-Host "Please fix hardcoded values before proceeding." -ForegroundColor Red
    
    if ($Strict) {
        exit 1
    }
} else {
    Write-Host "✅ NO HARDCODED VALUES DETECTED" -ForegroundColor Green
    Write-Host "✅ CONFIGURATION ENFORCEMENT PASSED" -ForegroundColor Green
}

Write-Host "`n📋 REMEMBER THE RULES:" -ForegroundColor Cyan
Write-Host "1. Use `$env:TF_API_PORT instead of hardcoded ports" -ForegroundColor White
Write-Host "2. Read agent count from configs/ai-swarm-config.json" -ForegroundColor White  
Write-Host "3. Use dynamic configuration system always" -ForegroundColor White
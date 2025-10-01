# TerraFusion OS - Azure PowerShell Migration Validator
# Ensures all scripts use modern Az module (not deprecated AzureRM)

param(
    [Parameter(Mandatory=$false)]
    [string]$Path = ".",
    
    [Parameter(Mandatory=$false)]
    [switch]$FixIssues,
    
    [Parameter(Mandatory=$false)]
    [switch]$Detailed
)

Write-Host "🔍 TerraFusion OS - Azure PowerShell Migration Validator" -ForegroundColor Cyan
Write-Host "🏛️ Ensuring modern Az module usage for Benton County deployment" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor DarkGray

# Legacy AzureRM patterns to detect
$legacyPatterns = @{
    "AzureRM Module Import" = @{
        Pattern = "Import-Module.*AzureRM"
        Replacement = "Import-Module Az"
        Severity = "Critical"
    }
    "AzureRM Installation" = @{
        Pattern = "Install-Module.*AzureRM"
        Replacement = "Install-Module Az"
        Severity = "Critical"
    }
    "Get-AzureRM Commands" = @{
        Pattern = "Get-AzureRM\w+"
        Replacement = "Get-Az"
        Severity = "High"
    }
    "New-AzureRM Commands" = @{
        Pattern = "New-AzureRM\w+"
        Replacement = "New-Az"
        Severity = "High"
    }
    "Set-AzureRM Commands" = @{
        Pattern = "Set-AzureRM\w+"
        Replacement = "Set-Az"
        Severity = "High"
    }
    "Remove-AzureRM Commands" = @{
        Pattern = "Remove-AzureRM\w+"
        Replacement = "Remove-Az"
        Severity = "High"
    }
    "Legacy Azure Login" = @{
        Pattern = "Login-AzureRmAccount"
        Replacement = "Connect-AzAccount"
        Severity = "Critical"
    }
    "Legacy Profile" = @{
        Pattern = "AzureRmProfile"
        Replacement = "AzProfile"
        Severity = "Medium"
    }
}

# Find PowerShell files
$psFiles = Get-ChildItem -Path $Path -Recurse -Include "*.ps1", "*.psm1", "*.psd1" | Where-Object { 
    $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*packages*" 
}

Write-Host "📁 Scanning $($psFiles.Count) PowerShell files..." -ForegroundColor Yellow

$totalIssues = 0
$filesWithIssues = @()
$migrationReport = @()

foreach ($file in $psFiles) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }
    
    $fileIssues = @()
    
    foreach ($patternName in $legacyPatterns.Keys) {
        $pattern = $legacyPatterns[$patternName]
        $matches = [regex]::Matches($content, $pattern.Pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        
        foreach ($match in $matches) {
            $lineNumber = ($content.Substring(0, $match.Index) -split "`n").Count
            
            $issue = @{
                File = $file.FullName
                Line = $lineNumber
                Pattern = $patternName
                MatchedText = $match.Value
                Replacement = $pattern.Replacement
                Severity = $pattern.Severity
            }
            
            $fileIssues += $issue
            $totalIssues++
        }
    }
    
    if ($fileIssues.Count -gt 0) {
        $filesWithIssues += $file.FullName
        $migrationReport += $fileIssues
        
        Write-Host "⚠️  Issues found in: $($file.FullName)" -ForegroundColor Yellow
        
        if ($Detailed) {
            foreach ($issue in $fileIssues) {
                $color = switch ($issue.Severity) {
                    "Critical" { "Red" }
                    "High" { "DarkRed" }
                    "Medium" { "Yellow" }
                    default { "Gray" }
                }
                Write-Host "   Line $($issue.Line): $($issue.Pattern) - $($issue.MatchedText)" -ForegroundColor $color
            }
        }
    }
}

# Display summary
Write-Host "`n📊 MIGRATION ANALYSIS SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor DarkGray

if ($totalIssues -eq 0) {
    Write-Host "✅ EXCELLENT: No legacy AzureRM usage found!" -ForegroundColor Green
    Write-Host "🎯 All PowerShell scripts are using modern Az module" -ForegroundColor Green
    Write-Host "🏛️ Ready for Benton County Azure Government Cloud deployment" -ForegroundColor Cyan
}
else {
    Write-Host "⚠️  Found $totalIssues legacy AzureRM issues in $($filesWithIssues.Count) files" -ForegroundColor Yellow
    
    # Group by severity
    $criticalIssues = $migrationReport | Where-Object { $_.Severity -eq "Critical" }
    $highIssues = $migrationReport | Where-Object { $_.Severity -eq "High" }
    $mediumIssues = $migrationReport | Where-Object { $_.Severity -eq "Medium" }
    
    if ($criticalIssues.Count -gt 0) {
        Write-Host "🚨 Critical issues: $($criticalIssues.Count) (Must fix before deployment)" -ForegroundColor Red
    }
    if ($highIssues.Count -gt 0) {
        Write-Host "⚠️  High priority: $($highIssues.Count) (Should fix)" -ForegroundColor DarkRed
    }
    if ($mediumIssues.Count -gt 0) {
        Write-Host "📋 Medium priority: $($mediumIssues.Count) (Consider fixing)" -ForegroundColor Yellow
    }
}

# Auto-fix option
if ($FixIssues -and $totalIssues -gt 0) {
    Write-Host "`n🔧 AUTO-FIXING LEGACY AZURERM USAGE..." -ForegroundColor Magenta
    
    $fixedFiles = 0
    $fixedIssues = 0
    
    foreach ($file in $filesWithIssues) {
        $content = Get-Content $file -Raw
        $originalContent = $content
        $fileFixed = $false
        
        foreach ($patternName in $legacyPatterns.Keys) {
            $pattern = $legacyPatterns[$patternName]
            if ($content -match $pattern.Pattern) {
                $content = $content -replace $pattern.Pattern, $pattern.Replacement
                $fileFixed = $true
                $fixedIssues++
            }
        }
        
        if ($fileFixed) {
            Set-Content -Path $file -Value $content -NoNewline
            Write-Host "✅ Fixed: $file" -ForegroundColor Green
            $fixedFiles++
        }
    }
    
    Write-Host "🎉 Fixed $fixedIssues issues in $fixedFiles files" -ForegroundColor Green
}

# Export detailed report
$reportData = @{
    Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    TerraFusionOS = @{
        Version = "1.0.0"
        County = "Benton County Washington"
        Purpose = "Azure PowerShell Migration Validation"
    }
    Summary = @{
        TotalFiles = $psFiles.Count
        FilesWithIssues = $filesWithIssues.Count
        TotalIssues = $totalIssues
        CriticalIssues = ($migrationReport | Where-Object { $_.Severity -eq "Critical" }).Count
        HighIssues = ($migrationReport | Where-Object { $_.Severity -eq "High" }).Count
        MediumIssues = ($migrationReport | Where-Object { $_.Severity -eq "Medium" }).Count
    }
    Issues = $migrationReport
    Recommendation = if ($totalIssues -eq 0) { 
        "Ready for Azure deployment with modern Az module" 
    } else { 
        "Migration to Az module required before production deployment" 
    }
}

$reportFile = "azure-powershell-migration-report.json"
$reportData | ConvertTo-Json -Depth 10 | Set-Content $reportFile

Write-Host "`n📋 Detailed report exported to: $reportFile" -ForegroundColor Cyan

# Final recommendations
Write-Host "`n🎯 RECOMMENDATIONS FOR BENTON COUNTY DEPLOYMENT" -ForegroundColor Magenta
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor DarkGray

if ($totalIssues -eq 0) {
    Write-Host "✅ PowerShell scripts are ready for Azure Government Cloud" -ForegroundColor Green
    Write-Host "✅ Modern Az module usage confirmed" -ForegroundColor Green
    Write-Host "✅ Can proceed with TerraFusion OS Azure deployment" -ForegroundColor Green
}
else {
    Write-Host "📋 Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Run with -FixIssues to auto-migrate legacy commands" -ForegroundColor Gray
    Write-Host "  2. Test all scripts after migration" -ForegroundColor Gray
    Write-Host "  3. Update any custom Azure authentication logic" -ForegroundColor Gray
    Write-Host "  4. Validate Azure Government Cloud compatibility" -ForegroundColor Gray
}

Write-Host "`n🏛️ TerraFusion OS Azure Migration Validation Complete" -ForegroundColor Cyan

return @{
    TotalIssues = $totalIssues
    FilesWithIssues = $filesWithIssues.Count
    ReportFile = $reportFile
    ReadyForDeployment = $totalIssues -eq 0
}
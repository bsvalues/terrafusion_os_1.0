# analyze-markdown-files.ps1
# THE TERRAFUSION WAY - Comprehensive Markdown Analysis
# Scans, categorizes, and analyzes all markdown files at workspace root

param(
    [string]$RootPath = "C:\Users\bsval\terrafusion_os_1.0",
    [string]$OutputPath = "C:\Users\bsval\terrafusion_os_1.0\workspace-optimization\phase1-audit"
)

Write-Host "🔍 THE TERRAFUSION WAY - Markdown Analysis Starting..." -ForegroundColor Cyan
Write-Host "Root Path: $RootPath" -ForegroundColor Gray
Write-Host "Output Path: $OutputPath" -ForegroundColor Gray
Write-Host ""

# Get all markdown files at root
$markdownFiles = Get-ChildItem -Path $RootPath -Filter "*.md" -File | Sort-Object Name

Write-Host "📊 Found $($markdownFiles.Count) markdown files at root" -ForegroundColor Green
Write-Host ""

# Category patterns for classification
$categories = @{
    "Architecture" = @("ARCHITECTURE", "ARCH_", "DESIGN", "STRUCTURE", "PATTERN")
    "Decisions" = @("DECISION", "ADR", "CHOICE", "RATIONALE")
    "Status" = @("STATUS", "STATE", "CURRENT", "PROGRESS", "SUMMARY", "REPORT")
    "Changelog" = @("CHANGELOG", "CHANGE", "HISTORY", "VERSION", "RELEASE")
    "Guides" = @("GUIDE", "TUTORIAL", "HOWTO", "HOW_TO", "WALKTHROUGH", "GETTING_STARTED")
    "Reference" = @("REFERENCE", "REF_", "API", "SPEC", "SPECIFICATION")
    "Implementation" = @("IMPLEMENTATION", "IMPL_", "COMPLETE", "DONE", "FINISHED")
    "Planning" = @("PLAN", "ROADMAP", "TODO", "BACKLOG", "PROPOSAL")
    "Documentation" = @("README", "DOC", "DOCS", "DOCUMENTATION")
    "Security" = @("SECURITY", "AUTH", "CERTIFICATE", "TRUST", "AUDIT")
    "Infrastructure" = @("INFRA", "DEPLOY", "OPS", "KUBERNETES", "K8S", "TERRAFORM")
    "AI" = @("AI_", "AGENT", "SWARM", "CONSCIOUSNESS", "ML_", "INTELLIGENCE")
    "Brand" = @("BRAND", "MARKETING", "TRANSCENDENCE", "VISION")
    "Integration" = @("INTEGRATION", "INTEGRATION_", "CONNECTOR")
    "Testing" = @("TEST", "TESTING", "QA", "QUALITY")
    "Build" = @("BUILD", "CI", "CD", "PIPELINE")
    "Session" = @("SESSION", "MEETING", "DISCUSSION")
    "Success" = @("SUCCESS", "VICTORY", "ACHIEVEMENT", "COMPLETE_SUCCESS")
    "Tools" = @("TOOL", "UTILITY", "HELPER", "CLI", "SDK")
    "Other" = @()
}

# Function to categorize a file based on name and content preview
function Get-FileCategory {
    param($file)
    
    $name = $file.Name.ToUpper()
    
    foreach ($category in $categories.Keys) {
        if ($category -eq "Other") { continue }
        
        foreach ($pattern in $categories[$category]) {
            if ($name -like "*$pattern*") {
                return $category
            }
        }
    }
    
    return "Other"
}

# Function to get first N lines of file
function Get-FilePreview {
    param($filePath, $lines = 20)
    
    try {
        $content = Get-Content -Path $filePath -First $lines -ErrorAction Stop
        return $content -join "`n"
    }
    catch {
        return "[Error reading file: $_]"
    }
}

# Function to count headers in markdown
function Get-HeaderCount {
    param($filePath)
    
    try {
        $content = Get-Content -Path $filePath -ErrorAction Stop
        $headers = $content | Where-Object { $_ -match '^#{1,6}\s+' }
        return $headers.Count
    }
    catch {
        return 0
    }
}

# Analyze each file
Write-Host "📝 Analyzing each file..." -ForegroundColor Cyan

$analysis = @()
$categoryStats = @{}

foreach ($file in $markdownFiles) {
    $category = Get-FileCategory -file $file
    $preview = Get-FilePreview -filePath $file.FullName -lines 20
    $headerCount = Get-HeaderCount -filePath $file.FullName
    
    # Count lines
    try {
        $lineCount = (Get-Content -Path $file.FullName).Count
    }
    catch {
        $lineCount = 0
    }
    
    # Update category stats
    if (-not $categoryStats.ContainsKey($category)) {
        $categoryStats[$category] = @{
            Count = 0
            TotalSize = 0
            Files = @()
        }
    }
    $categoryStats[$category].Count++
    $categoryStats[$category].TotalSize += $file.Length
    $categoryStats[$category].Files += $file.Name
    
    $analysis += [PSCustomObject]@{
        FileName = $file.Name
        Category = $category
        SizeKB = [math]::Round($file.Length / 1KB, 2)
        Lines = $lineCount
        Headers = $headerCount
        LastModified = $file.LastWriteTime
        Preview = $preview
    }
    
    Write-Host "  ✓ $($file.Name) → $category ($lineCount lines)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "💾 Exporting analysis..." -ForegroundColor Cyan

# Export detailed analysis
$analysis | Export-Csv -Path "$OutputPath\markdown-analysis-detailed.csv" -NoTypeInformation
Write-Host "  ✓ Saved: markdown-analysis-detailed.csv" -ForegroundColor Green

# Export category summary
$categorySummary = $categoryStats.Keys | ForEach-Object {
    [PSCustomObject]@{
        Category = $_
        FileCount = $categoryStats[$_].Count
        TotalSizeKB = [math]::Round($categoryStats[$_].TotalSize / 1KB, 2)
        AvgSizeKB = [math]::Round(($categoryStats[$_].TotalSize / $categoryStats[$_].Count) / 1KB, 2)
        Files = $categoryStats[$_].Files -join "; "
    }
} | Sort-Object -Property FileCount -Descending

$categorySummary | Export-Csv -Path "$OutputPath\markdown-categories.csv" -NoTypeInformation
Write-Host "  ✓ Saved: markdown-categories.csv" -ForegroundColor Green

# Export JSON for programmatic access
$jsonOutput = @{
    TotalFiles = $markdownFiles.Count
    AnalysisDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Categories = $categoryStats
    Files = $analysis
}

$jsonOutput | ConvertTo-Json -Depth 10 | Out-File -FilePath "$OutputPath\markdown-analysis.json" -Encoding UTF8
Write-Host "  ✓ Saved: markdown-analysis.json" -ForegroundColor Green

Write-Host ""
Write-Host "📊 CATEGORY SUMMARY" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host ""

foreach ($cat in $categorySummary) {
    $percentage = [math]::Round(($cat.FileCount / $markdownFiles.Count) * 100, 1)
    Write-Host "  $($cat.Category): $($cat.FileCount) files ($percentage%) - $($cat.TotalSizeKB) KB" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Analysis Complete!" -ForegroundColor Green
Write-Host "   Total Files: $($markdownFiles.Count)" -ForegroundColor White
Write-Host "   Total Size: $([math]::Round(($markdownFiles | Measure-Object -Property Length -Sum).Sum / 1MB, 2)) MB" -ForegroundColor White
Write-Host "   Categories: $($categorySummary.Count)" -ForegroundColor White
Write-Host ""
Write-Host "🎯 THE TERRAFUSION WAY - We know everything we touch!" -ForegroundColor Cyan

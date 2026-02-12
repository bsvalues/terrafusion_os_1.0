# TerraFusion Documentation Archival Script (FIXED VERSION)
# Phase 1.3.3: Archive historical documentation with PROPER error handling
# 
# This corrected version:
# - Uses absolute paths throughout
# - Validates paths before operations
# - Stops on first error
# - Provides clear feedback

param(
    [string]$RootPath = "C:\Users\bsval\terrafusion_os_1.0",
    [string]$ArchivePath = "C:\Users\bsval\terrafusion_os_1.0\workspace-optimization\knowledge-seed"
)

Write-Host "🔧 TerraFusion Documentation Archival (FIXED)" -ForegroundColor Cyan
Write-Host "=" -repeat 50 -ForegroundColor Cyan
Write-Host ""

# Statistics
$stats = @{
    Kept = 0
    Archived = 0
    Errors = 0
}

# Files to keep at root (our precious master documents!)
$filesToKeep = @(
    "README.md",
    "CONTRIBUTING.md",
    "ARCHITECTURE.md",
    "STATUS.md",
    "DECISIONS.md",
    "CHANGELOG.md",
    "FEATURES.md",
    "GUIDES.md",
    "ROADMAP.md"
)

# Categorization function
function Get-ArchiveCategory {
    param([string]$fileName)
    
    # Historical versions and iterations
    if ($fileName -match "V\d+|FINAL|CORRECTED|REVISED|UPDATED|OLD|LEGACY|ARCHIVE") {
        return "historical"
    }
    
    # Session and progress notes
    if ($fileName -match "WEEK_|DAY_|SESSION_|PROGRESS|NOTES|SUMMARY") {
        return "session-notes"
    }
    
    # Implementation completion records
    if ($fileName -match "_COMPLETE|_SUCCESS|_DONE|_FINISHED|_IMPLEMENTED") {
        return "implementation-logs"
    }
    
    # Planning and roadmap documents
    if ($fileName -match "_PLAN|_ROADMAP|_STRATEGY|PHASE_|TODO") {
        return "planning-archive"
    }
    
    # Default to historical
    return "historical"
}

# Verify archive structure exists
Write-Host "🔍 Validating archive structure..." -ForegroundColor Yellow
$requiredDirs = @("historical", "session-notes", "implementation-logs", "planning-archive")
foreach ($dir in $requiredDirs) {
    $fullPath = Join-Path $ArchivePath $dir
    if (!(Test-Path $fullPath)) {
        Write-Host "  ✗ ERROR: Archive directory missing: $fullPath" -ForegroundColor Red
        Write-Host "  Run the original setup script first!" -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✓ Found: $dir" -ForegroundColor Green
}
Write-Host ""

# Get all markdown files at root
Write-Host "📦 Archiving documentation files..." -ForegroundColor Cyan
$allMarkdownFiles = Get-ChildItem -Path $RootPath -Filter "*.md" | Where-Object { !$_.PSIsContainer }

$archiveIndex = @()

foreach ($file in $allMarkdownFiles) {
    $fileName = $file.Name
    
    # Skip files we want to keep at root
    if ($filesToKeep -contains $fileName) {
        Write-Host "  ⭐ Keeping at root: $fileName" -ForegroundColor Yellow
        $stats.Kept++
        continue
    }
    
    # Determine category
    $category = Get-ArchiveCategory -fileName $fileName
    
    # Build absolute paths
    $sourcePath = $file.FullName
    $destinationDir = Join-Path $ArchivePath $category
    $destinationPath = Join-Path $destinationDir $fileName
    
    # Validate source exists
    if (!(Test-Path $sourcePath)) {
        Write-Host "  ✗ ERROR: Source file not found: $sourcePath" -ForegroundColor Red
        $stats.Errors++
        continue
    }
    
    # Validate destination directory exists
    if (!(Test-Path $destinationDir)) {
        Write-Host "  ✗ ERROR: Destination directory not found: $destinationDir" -ForegroundColor Red
        $stats.Errors++
        continue
    }
    
    # Check if destination file already exists
    if (Test-Path $destinationPath) {
        Write-Host "  ⚠️  Skipping (already exists): $fileName → $category" -ForegroundColor Yellow
        $stats.Archived++
        
        # Add to index
        $archiveIndex += [PSCustomObject]@{
            FileName = $fileName
            Category = $category
            ArchivePath = $destinationPath
            SizeKB = [math]::Round($file.Length / 1KB, 2)
            LastModified = $file.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
            ArchivedDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            Status = "AlreadyExists"
        }
        continue
    }
    
    # Perform the move with error handling
    try {
        Move-Item -Path $sourcePath -Destination $destinationPath -Force -ErrorAction Stop
        Write-Host "  ✓ Archived to $category : $fileName" -ForegroundColor Green
        $stats.Archived++
        
        # Add to index
        $archiveIndex += [PSCustomObject]@{
            FileName = $fileName
            Category = $category
            ArchivePath = $destinationPath
            SizeKB = [math]::Round($file.Length / 1KB, 2)
            LastModified = $file.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
            ArchivedDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            Status = "Moved"
        }
    }
    catch {
        Write-Host "  ✗ ERROR archiving $fileName : $($_.Exception.Message)" -ForegroundColor Red
        $stats.Errors++
        
        # Stop on first error - THE TERRAFUSION WAY is to fix, not continue with errors!
        Write-Host ""
        Write-Host "❌ STOPPING: Encountered error during archival" -ForegroundColor Red
        Write-Host "   Fix the issue and run again." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""

# Update index.json
Write-Host "💾 Updating archive index..." -ForegroundColor Cyan
$indexPath = Join-Path $ArchivePath "index.json"
$archiveIndex | ConvertTo-Json -Depth 10 | Set-Content $indexPath
Write-Host "  ✓ Updated index.json with $($archiveIndex.Count) entries" -ForegroundColor Green

# Update categories summary
$categorySummary = $archiveIndex | Group-Object -Property Category | ForEach-Object {
    [PSCustomObject]@{
        Category = $_.Name
        FileCount = $_.Count
        TotalSizeKB = [math]::Round(($_.Group | Measure-Object -Property SizeKB -Sum).Sum, 2)
    }
}
$categoryPath = Join-Path $ArchivePath "categories.json"
$categorySummary | ConvertTo-Json -Depth 10 | Set-Content $categoryPath
Write-Host "  ✓ Updated categories.json" -ForegroundColor Green

Write-Host ""

# Final summary
Write-Host "📊 ARCHIVAL SUMMARY" -ForegroundColor Cyan
Write-Host "=" -repeat 50 -ForegroundColor Cyan
Write-Host ""
Write-Host "  Files Kept at Root: $($stats.Kept) (master documents + essential)"
Write-Host "  Files Archived: $($stats.Archived)"

if ($stats.Errors -gt 0) {
    Write-Host "  Errors: $($stats.Errors)" -ForegroundColor Red
} else {
    Write-Host "  Errors: 0" -ForegroundColor Green
}

Write-Host ""

# Show category breakdown
Write-Host "  Archive Breakdown:" -ForegroundColor Yellow
foreach ($cat in $categorySummary) {
    Write-Host "    - $($cat.Category): $($cat.FileCount) files ($($cat.TotalSizeKB) KB)"
}

Write-Host ""

if ($stats.Errors -eq 0) {
    Write-Host "✅ Archival Complete!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Archival completed with errors" -ForegroundColor Yellow
}

Write-Host ""

# Verify final state
$remainingFiles = Get-ChildItem -Path $RootPath -Filter "*.md" | Where-Object { !$_.PSIsContainer }
Write-Host "📁 Workspace Root Now Contains:" -ForegroundColor Cyan
Write-Host "  Total .md files at root: $($remainingFiles.Count)" -ForegroundColor $(if ($remainingFiles.Count -le 15) { "Green" } else { "Yellow" })
Write-Host ""

if ($remainingFiles.Count -le 15) {
    Write-Host "🎉 SUCCESS! Workspace root is clean!" -ForegroundColor Green
    Write-Host "   Only essential files remain." -ForegroundColor Green
} else {
    Write-Host "⚠️  Warning: More than 15 .md files at root" -ForegroundColor Yellow
    Write-Host "   Expected: $($filesToKeep.Count) files" -ForegroundColor Yellow
    Write-Host "   Actual: $($remainingFiles.Count) files" -ForegroundColor Yellow
}

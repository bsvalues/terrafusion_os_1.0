# archive-documentation.ps1
# THE TERRAFUSION WAY - Archive Original Documentation Files
# Move 293 files to knowledge-seed archive, delete 21 empty files

param(
    [string]$RootPath = "C:\Users\bsval\terrafusion_os_1.0",
    [string]$ArchivePath = "C:\Users\bsval\terrafusion_os_1.0\workspace-optimization\knowledge-seed"
)

Write-Host "📦 THE TERRAFUSION WAY - Documentation Archival Starting..." -ForegroundColor Cyan
Write-Host ""

# Load the markdown analysis to help with categorization
$analysisPath = Join-Path $RootPath "workspace-optimization\phase1-audit\markdown-analysis.json"
$analysis = Get-Content $analysisPath -Raw | ConvertFrom-Json

Write-Host "📊 Loaded analysis for $($analysis.TotalFiles) files" -ForegroundColor Green
Write-Host ""

# Get all markdown files at root
$allMarkdownFiles = Get-ChildItem -Path $RootPath -Filter "*.md" -File

# Define files to keep at root (master documents + essential files)
$keepAtRoot = @(
    "README.md",
    "CONTRIBUTING.md",
    "ARCHITECTURE.md",
    "STATUS.md",
    "DECISIONS.md",
    "CHANGELOG.md",
    "FEATURES.md",
    "GUIDES.md",
    "ROADMAP.md",
    "LICENSE.md"
)

# Define empty files to delete
$emptyFilesToDelete = @(
    "AI_AGENT_TRAINING_UPDATE_COMPLETE.md",
    "COMPREHENSIVE_SECURITY_AUDIT_COMPLETE.md",
    "COMPREHENSIVE_SECURITY_AUDIT_REPORT.md",
    "COMPREHENSIVE_SYSTEM_AUDIT_REPORT.md",
    "CRITICAL_SECURITY_FIXES_SUMMARY_FINAL.md",
    "FULL_BASIC_DEPLOYMENT_WHITE_GLOVE.md",
    "MIT_PHD_GITHUB_REPOSITORY_AUDIT_REPORT.md",
    "MIT_PHD_PHASE_2_COMPLETION_EXCELLENCE_REPORT.md",
    "MIT_PHD_PHASE_2_WORKFLOW_CONSOLIDATION_PLAN.md",
    "MIT_PHD_PHASE_3_ENTERPRISE_ENHANCEMENT_PLAN.md",
    "MIT_PHD_PHASE_3_ENTERPRISE_EXCELLENCE_COMPLETE.md",
    "NEXT_PHASE_PRODUCTION_DEPLOYMENT.md",
    "PRODUCTION_READINESS_VALIDATION_COMPLETE.md",
    "SECURE_CONFIGURATION_IMPLEMENTATION_COMPLETE.md",
    "SECURITY_AUDIT_FIXES_SUMMARY.md",
    "SECURITY_FIXES_COMPLETE_SUMMARY.md",
    "TERRAFUSION_AI_REVOLUTION_ENHANCEMENT_PLAN.md",
    "TERRAFUSION_AI_REVOLUTION_IMPLEMENTATION_SUMMARY.md",
    "TERRAFUSION_WORLD_CHANGING_ACTION_PLAN.md",
    "TERRAFUSION_WORLD_CHANGING_INITIATIVE.md",
    "WHITE_GLOVE_DEPLOYMENT_FINAL_STATUS.md"
)

# Categorization functions
function Get-ArchiveCategory {
    param($fileName)
    
    # Historical (version suffixes, superseded)
    if ($fileName -match "(V\d+|_V\d+|FINAL|CORRECTED|ACTUAL|REALITY)") {
        return "historical"
    }
    
    # Session notes (week/day summaries, session reports)
    if ($fileName -match "(WEEK_\d+|DAY_\d+|SESSION_|SUMMARY)") {
        return "session-notes"
    }
    
    # Implementation logs (complete markers, success reports)
    if ($fileName -match "(COMPLETE|SUCCESS|READY|FINISHED|DEPLOYED|WORKING|RUNNING)") {
        return "implementation-logs"
    }
    
    # Planning archive (plans, roadmaps, phases)
    if ($fileName -match "(PLAN|ROADMAP|PHASE|STRATEGY|TODO|ENHANCEMENT)") {
        return "planning-archive"
    }
    
    # Default to historical
    return "historical"
}

# Statistics
$stats = @{
    Kept = 0
    Deleted = 0
    Archived = 0
    Historical = 0
    SessionNotes = 0
    ImplementationLogs = 0
    PlanningArchive = 0
    Errors = 0
}

# Index for archive
$archiveIndex = @()

Write-Host "🗑️ Step 1: Deleting empty files..." -ForegroundColor Yellow
Write-Host ""

foreach ($emptyFile in $emptyFilesToDelete) {
    $filePath = Join-Path $RootPath $emptyFile
    if (Test-Path $filePath) {
        try {
            Remove-Item -Path $filePath -Force
            Write-Host "  ✓ Deleted: $emptyFile" -ForegroundColor Red
            $stats.Deleted++
        }
        catch {
            Write-Host "  ✗ Error deleting $emptyFile : $_" -ForegroundColor Red
            $stats.Errors++
        }
    }
    else {
        Write-Host "  ⊘ Not found (already deleted?): $emptyFile" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "📦 Step 2: Archiving documentation files..." -ForegroundColor Yellow
Write-Host ""

foreach ($file in $allMarkdownFiles) {
    # Skip if should be kept at root
    if ($keepAtRoot -contains $file.Name) {
        Write-Host "  ⭐ Keeping at root: $($file.Name)" -ForegroundColor Green
        $stats.Kept++
        continue
    }
    
    # Skip if already deleted (empty file)
    if ($emptyFilesToDelete -contains $file.Name) {
        continue
    }
    
    # Determine category
    $category = Get-ArchiveCategory -fileName $file.Name
    $destinationDir = Join-Path $ArchivePath $category
    $destinationPath = Join-Path $destinationDir $file.Name
    
    try {
        # Move file to archive
        Move-Item -Path $file.FullName -Destination $destinationPath -Force
        Write-Host "  ✓ Archived to $category : $($file.Name)" -ForegroundColor Gray
        
        # Update stats
        $stats.Archived++
        switch ($category) {
            "historical" { $stats.Historical++ }
            "session-notes" { $stats.SessionNotes++ }
            "implementation-logs" { $stats.ImplementationLogs++ }
            "planning-archive" { $stats.PlanningArchive++ }
        }
        
        # Add to index
        $archiveIndex += [PSCustomObject]@{
            FileName = $file.Name
            Category = $category
            OriginalPath = $file.FullName
            ArchivePath = $destinationPath
            SizeKB = [math]::Round($file.Length / 1KB, 2)
            LastModified = $file.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
            ArchivedDate = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        }
    }
    catch {
        Write-Host "  ✗ Error archiving $($file.Name): $_" -ForegroundColor Red
        $stats.Errors++
    }
}

Write-Host ""
Write-Host "💾 Step 3: Creating archive index..." -ForegroundColor Yellow

# Save index as JSON
$indexPath = Join-Path $ArchivePath "index.json"
$indexData = @{
    Created = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    TotalFilesArchived = $stats.Archived
    Categories = @{
        Historical = $stats.Historical
        SessionNotes = $stats.SessionNotes
        ImplementationLogs = $stats.ImplementationLogs
        PlanningArchive = $stats.PlanningArchive
    }
    Files = $archiveIndex
}

$indexData | ConvertTo-Json -Depth 10 | Out-File -FilePath $indexPath -Encoding UTF8
Write-Host "  ✓ Created index.json with $($archiveIndex.Count) entries" -ForegroundColor Green

# Create category summary
$categorySummaryPath = Join-Path $ArchivePath "categories.json"
$categorySummary = @{
    Historical = @{
        Count = $stats.Historical
        Description = "Old versions & superseded documents"
    }
    SessionNotes = @{
        Count = $stats.SessionNotes
        Description = "Session summaries & week reports"
    }
    ImplementationLogs = @{
        Count = $stats.ImplementationLogs
        Description = "Completion reports & status updates"
    }
    PlanningArchive = @{
        Count = $stats.PlanningArchive
        Description = "Old plans & superseded roadmaps"
    }
}

$categorySummary | ConvertTo-Json -Depth 10 | Out-File -FilePath $categorySummaryPath -Encoding UTF8
Write-Host "  ✓ Created categories.json" -ForegroundColor Green

Write-Host ""
Write-Host "📊 ARCHIVAL SUMMARY" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Files Kept at Root: $($stats.Kept) (master documents + essential)" -ForegroundColor Green
Write-Host "  Files Deleted: $($stats.Deleted) (empty files)" -ForegroundColor Red
Write-Host "  Files Archived: $($stats.Archived)" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Archive Breakdown:" -ForegroundColor Cyan
Write-Host "    - Historical: $($stats.Historical) files" -ForegroundColor Gray
Write-Host "    - Session Notes: $($stats.SessionNotes) files" -ForegroundColor Gray
Write-Host "    - Implementation Logs: $($stats.ImplementationLogs) files" -ForegroundColor Gray
Write-Host "    - Planning Archive: $($stats.PlanningArchive) files" -ForegroundColor Gray
Write-Host ""

if ($stats.Errors -gt 0) {
    Write-Host "  ⚠️ Errors: $($stats.Errors)" -ForegroundColor Red
}
else {
    Write-Host "  ✅ No Errors!" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Archival Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Workspace Root Now Contains:" -ForegroundColor Cyan
$rootFiles = Get-ChildItem -Path $RootPath -Filter "*.md" -File | Select-Object Name
Write-Host "  Total .md files at root: $($rootFiles.Count)" -ForegroundColor Yellow
$rootFiles | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Gray }

Write-Host ""
Write-Host "🎯 THE TERRAFUSION WAY - We know everything we touch!" -ForegroundColor Cyan
Write-Host "✅ Documentation consolidation complete!" -ForegroundColor Green

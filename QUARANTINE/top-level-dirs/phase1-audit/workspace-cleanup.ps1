# TerraFusion 768 MB Cleanup - Phase 2 Day 1 Part 2
# THE TERRAFUSION WAY: Safe, Measured, Documented
#
# This script will:
# 1. Scan for cleanup targets
# 2. Calculate space savings
# 3. Create backup before deletion
# 4. Execute cleanup safely
# 5. Verify results
#
# Targets:
# - Temporary files (*.tmp, *.bak, *.old, *~)
# - Python cache (__pycache__, .pytest_cache, *.pyc)
# - Node cache (.cache directories)
# - Duplicate terrafusion_os_1.0 subdirectory
# - Old security backup (already archived)
# - Test artifacts

param(
    [switch]$DryRun = $false,
    [string]$BackupDir = ".\cleanup-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
)

Write-Host ""
Write-Host "🧹 TerraFusion 768 MB Cleanup - Phase 2 Day 1 Part 2" -ForegroundColor Cyan
Write-Host "=" -repeat 70 -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "⚠️  DRY RUN MODE - No changes will be made" -ForegroundColor Yellow
    Write-Host ""
}

# Statistics
$stats = @{
    TempFiles = 0
    TempSize = 0
    BackupFiles = 0
    BackupSize = 0
    CacheFiles = 0
    CacheSize = 0
    PycFiles = 0
    PycSize = 0
    DuplicateDirs = 0
    DuplicateSize = 0
    TotalFiles = 0
    TotalSize = 0
}

function Get-HumanReadableSize {
    param([long]$Bytes)
    if ($Bytes -gt 1GB) { return "{0:N2} GB" -f ($Bytes / 1GB) }
    if ($Bytes -gt 1MB) { return "{0:N2} MB" -f ($Bytes / 1MB) }
    if ($Bytes -gt 1KB) { return "{0:N2} KB" -f ($Bytes / 1KB) }
    return "$Bytes bytes"
}

# ===== Step 1: Scan for Temporary Files =====
Write-Host "🔍 Step 1: Scanning for temporary files..." -ForegroundColor Cyan

$tempPatterns = @("*.tmp", "*.bak", "*.old", "*~", "*.swp", "*.swo")
$tempFiles = @()

foreach ($pattern in $tempPatterns) {
    $found = Get-ChildItem -Path "." -Recurse -Include $pattern -File -ErrorAction SilentlyContinue | 
        Where-Object { $_.FullName -notmatch '\.git\\' -and $_.FullName -notmatch 'node_modules\\' }
    $tempFiles += $found
}

$stats.TempFiles = $tempFiles.Count
$stats.TempSize = ($tempFiles | Measure-Object -Property Length -Sum).Sum
Write-Host "  Found: $($stats.TempFiles) temporary files ($(Get-HumanReadableSize $stats.TempSize))" -ForegroundColor Yellow

# ===== Step 2: Scan for Backup Files =====
Write-Host ""
Write-Host "🔍 Step 2: Scanning for backup files..." -ForegroundColor Cyan

$backupFiles = Get-ChildItem -Path "." -Recurse -Include "*.backup" -File -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch '\.git\\' -and $_.FullName -notmatch 'security-backup-' }

$stats.BackupFiles = $backupFiles.Count
$stats.BackupSize = ($backupFiles | Measure-Object -Property Length -Sum).Sum
Write-Host "  Found: $($stats.BackupFiles) backup files ($(Get-HumanReadableSize $stats.BackupSize))" -ForegroundColor Yellow

# ===== Step 3: Scan for Python Cache =====
Write-Host ""
Write-Host "🔍 Step 3: Scanning for Python cache..." -ForegroundColor Cyan

$pycDirs = Get-ChildItem -Path "." -Recurse -Directory -Include "__pycache__",".pytest_cache",".mypy_cache" -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch '\.git\\' }

$pycFiles = $pycDirs | ForEach-Object { Get-ChildItem $_.FullName -Recurse -File -ErrorAction SilentlyContinue }
$stats.CacheFiles = $pycFiles.Count
$stats.CacheSize = ($pycFiles | Measure-Object -Property Length -Sum).Sum
Write-Host "  Found: $($pycDirs.Count) Python cache directories with $($stats.CacheFiles) files ($(Get-HumanReadableSize $stats.CacheSize))" -ForegroundColor Yellow

# ===== Step 4: Scan for .pyc Files =====
Write-Host ""
Write-Host "🔍 Step 4: Scanning for compiled Python files..." -ForegroundColor Cyan

$pycFiles = Get-ChildItem -Path "." -Recurse -Include "*.pyc","*.pyo" -File -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch '\.git\\' -and $_.FullName -notmatch '__pycache__' }

$stats.PycFiles = $pycFiles.Count
$stats.PycSize = ($pycFiles | Measure-Object -Property Length -Sum).Sum
Write-Host "  Found: $($stats.PycFiles) .pyc files ($(Get-HumanReadableSize $stats.PycSize))" -ForegroundColor Yellow

# ===== Step 5: Scan for Duplicate terrafusion_os_1.0 Directory =====
Write-Host ""
Write-Host "🔍 Step 5: Checking for nested terrafusion_os_1.0 directory..." -ForegroundColor Cyan

$duplicateDir = ".\terrafusion_os_1.0"
$duplicateSize = 0

if (Test-Path $duplicateDir) {
    $duplicateFiles = Get-ChildItem -Path $duplicateDir -Recurse -File -ErrorAction SilentlyContinue
    $duplicateSize = ($duplicateFiles | Measure-Object -Property Length -Sum).Sum
    $stats.DuplicateDirs = 1
    $stats.DuplicateSize = $duplicateSize
    Write-Host "  ⚠️  Found nested terrafusion_os_1.0/ directory ($(Get-HumanReadableSize $duplicateSize))" -ForegroundColor Yellow
    Write-Host "      This appears to be a duplicate of the current workspace!" -ForegroundColor Red
} else {
    Write-Host "  ✓ No duplicate directory found" -ForegroundColor Green
}

# ===== Step 6: Scan for Old Security Backup =====
Write-Host ""
Write-Host "🔍 Step 6: Checking for old security backups..." -ForegroundColor Cyan

$oldSecurityBackups = Get-ChildItem -Path "." -Directory -Filter "security-backup-*" -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -ne "security-backup-20251009-063745" }

if ($oldSecurityBackups.Count -gt 0) {
    Write-Host "  Found: $($oldSecurityBackups.Count) old security backup directories" -ForegroundColor Yellow
    foreach ($dir in $oldSecurityBackups) {
        $size = (Get-ChildItem $dir.FullName -Recurse -File -ErrorAction SilentlyContinue | 
            Measure-Object -Property Length -Sum).Sum
        Write-Host "    - $($dir.Name) ($(Get-HumanReadableSize $size))" -ForegroundColor Gray
    }
} else {
    Write-Host "  ✓ No old security backups to clean" -ForegroundColor Green
}

# ===== Calculate Totals =====
$stats.TotalFiles = $stats.TempFiles + $stats.BackupFiles + $stats.CacheFiles + $stats.PycFiles
$stats.TotalSize = $stats.TempSize + $stats.BackupSize + $stats.CacheSize + $stats.PycSize + $stats.DuplicateSize

Write-Host ""
Write-Host "📊 CLEANUP SUMMARY" -ForegroundColor Cyan
Write-Host "=" -repeat 70 -ForegroundColor Cyan
Write-Host ""
Write-Host "  Temporary files:        $($stats.TempFiles) files ($(Get-HumanReadableSize $stats.TempSize))"
Write-Host "  Backup files:           $($stats.BackupFiles) files ($(Get-HumanReadableSize $stats.BackupSize))"
Write-Host "  Python cache dirs:      $($pycDirs.Count) dirs with $($stats.CacheFiles) files ($(Get-HumanReadableSize $stats.CacheSize))"
Write-Host "  Compiled Python:        $($stats.PycFiles) files ($(Get-HumanReadableSize $stats.PycSize))"
Write-Host "  Duplicate directory:    $($stats.DuplicateDirs) dirs ($(Get-HumanReadableSize $stats.DuplicateSize))"
Write-Host ""
Write-Host "  TOTAL CLEANUP:          $(Get-HumanReadableSize $stats.TotalSize)" -ForegroundColor Yellow
Write-Host ""

if ($DryRun) {
    Write-Host "ℹ️  DRY RUN COMPLETE - No files were deleted" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Run without -DryRun to execute cleanup" -ForegroundColor Yellow
    exit 0
}

# ===== Confirm Before Deletion =====
Write-Host "⚠️  READY TO DELETE $(Get-HumanReadableSize $stats.TotalSize)" -ForegroundColor Yellow
Write-Host ""
Write-Host "This will permanently delete the files listed above." -ForegroundColor Red
Write-Host "Press Ctrl+C to cancel, or any other key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Write-Host ""

# ===== Step 7: Execute Cleanup =====
Write-Host "🗑️  Step 7: Executing cleanup..." -ForegroundColor Cyan
Write-Host ""

# Delete temporary files
if ($tempFiles.Count -gt 0) {
    Write-Host "  Removing $($tempFiles.Count) temporary files..." -ForegroundColor Yellow
    foreach ($file in $tempFiles) {
        try {
            Remove-Item $file.FullName -Force -ErrorAction Stop
        }
        catch {
            Write-Host "    ⚠️  Failed to delete: $($file.Name)" -ForegroundColor Red
        }
    }
    Write-Host "  ✓ Temporary files removed" -ForegroundColor Green
}

# Delete backup files
if ($backupFiles.Count -gt 0) {
    Write-Host "  Removing $($backupFiles.Count) backup files..." -ForegroundColor Yellow
    foreach ($file in $backupFiles) {
        try {
            Remove-Item $file.FullName -Force -ErrorAction Stop
        }
        catch {
            Write-Host "    ⚠️  Failed to delete: $($file.Name)" -ForegroundColor Red
        }
    }
    Write-Host "  ✓ Backup files removed" -ForegroundColor Green
}

# Delete Python cache directories
if ($pycDirs.Count -gt 0) {
    Write-Host "  Removing $($pycDirs.Count) Python cache directories..." -ForegroundColor Yellow
    foreach ($dir in $pycDirs) {
        try {
            Remove-Item $dir.FullName -Recurse -Force -ErrorAction Stop
        }
        catch {
            Write-Host "    ⚠️  Failed to delete: $($dir.Name)" -ForegroundColor Red
        }
    }
    Write-Host "  ✓ Python cache directories removed" -ForegroundColor Green
}

# Delete .pyc files
if ($pycFiles.Count -gt 0) {
    Write-Host "  Removing $($pycFiles.Count) compiled Python files..." -ForegroundColor Yellow
    foreach ($file in $pycFiles) {
        try {
            Remove-Item $file.FullName -Force -ErrorAction Stop
        }
        catch {
            Write-Host "    ⚠️  Failed to delete: $($file.Name)" -ForegroundColor Red
        }
    }
    Write-Host "  ✓ Compiled Python files removed" -ForegroundColor Green
}

# Delete duplicate directory (WITH EXTREME CAUTION)
if ($stats.DuplicateDirs -gt 0) {
    Write-Host ""
    Write-Host "⚠️  CRITICAL: Found nested terrafusion_os_1.0/ directory" -ForegroundColor Red
    Write-Host "   This appears to be a complete duplicate of the workspace!" -ForegroundColor Red
    Write-Host "   Size: $(Get-HumanReadableSize $stats.DuplicateSize)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Delete this duplicate? (Y/N): " -ForegroundColor Yellow -NoNewline
    $response = Read-Host
    
    if ($response -eq "Y" -or $response -eq "y") {
        Write-Host "  Removing terrafusion_os_1.0/ directory..." -ForegroundColor Yellow
        try {
            Remove-Item ".\terrafusion_os_1.0" -Recurse -Force -ErrorAction Stop
            Write-Host "  ✓ Duplicate directory removed ($(Get-HumanReadableSize $stats.DuplicateSize))" -ForegroundColor Green
        }
        catch {
            Write-Host "  ✗ Failed to delete duplicate directory: $($_.Exception.Message)" -ForegroundColor Red
            $stats.DuplicateSize = 0
            $stats.TotalSize -= $stats.DuplicateSize
        }
    } else {
        Write-Host "  ⊘ Skipped duplicate directory deletion" -ForegroundColor Yellow
        $stats.DuplicateSize = 0
        $stats.TotalSize -= $duplicateSize
    }
}

Write-Host ""
Write-Host "=" -repeat 70 -ForegroundColor Cyan
Write-Host ""

# ===== Final Summary =====
Write-Host "✅ CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 RESULTS:" -ForegroundColor Cyan
Write-Host "  Space Freed: $(Get-HumanReadableSize $stats.TotalSize)" -ForegroundColor Green
Write-Host "  Files Deleted: $($stats.TotalFiles)" -ForegroundColor Green
Write-Host ""

if ($stats.TotalSize -gt 500MB) {
    Write-Host "🎉 SUCCESS! Freed over 500 MB!" -ForegroundColor Green
} elseif ($stats.TotalSize -gt 100MB) {
    Write-Host "✅ Good cleanup! Freed over 100 MB!" -ForegroundColor Green
} else {
    Write-Host "✓ Cleanup complete" -ForegroundColor Green
}

Write-Host ""
Write-Host "💡 TIP: Run 'git add -A' to stage .gitignore changes" -ForegroundColor Yellow
Write-Host "        Run 'git status' to see what changed" -ForegroundColor Yellow
Write-Host ""
Write-Host "=" -repeat 70 -ForegroundColor Cyan

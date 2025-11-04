$ErrorActionPreference = "Stop"

Write-Host "Starting workspace cleanup..."

$archiveDir = "archive"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$archiveTimestampDir = Join-Path $archiveDir $timestamp

function Create-ArchiveDirectory {
    if (-not (Test-Path $archiveDir)) {
        New-Item -ItemType Directory -Path $archiveDir | Out-Null
    }
    if (-not (Test-Path $archiveTimestampDir)) {
        New-Item -ItemType Directory -Path $archiveTimestampDir | Out-Null
    }
}

function Move-ToArchive {
    param (
        [string]$sourcePath,
        [string]$reason
    )
    
    if (Test-Path $sourcePath) {
        $fileName = Split-Path $sourcePath -Leaf
        $archivePath = Join-Path $archiveTimestampDir $fileName
        
        Write-Host "Moving $fileName to archive ($reason)"
        Move-Item -Path $sourcePath -Destination $archivePath -Force
    }
}

function Clean-TempFiles {
    $tempFiles = @(
        "*.log",
        "*.tmp",
        "*.temp",
        "*.cache",
        "*.tsbuildinfo"
    )
    
    foreach ($pattern in $tempFiles) {
        Get-ChildItem -Path . -Filter $pattern -Recurse | ForEach-Object {
            Write-Host "Removing temporary file: $($_.FullName)"
            Remove-Item $_.FullName -Force
        }
    }
}

function Clean-ErrorLogs {
    Get-ChildItem -Path . -Filter "errors*.txt" | ForEach-Object {
        Move-ToArchive $_.FullName "Error log file"
    }
}

function Clean-UnusedDirs {
    $unusedDirs = @(
        "cache",
        "logs",
        "tokens",
        "uploads"
    )
    
    foreach ($dir in $unusedDirs) {
        if (Test-Path $dir) {
            $archiveDirPath = Join-Path $archiveTimestampDir $dir
            Write-Host "Moving directory $dir to archive"
            Move-Item -Path $dir -Destination $archiveDirPath -Force
        }
    }
}

function Clean-DuplicateConfigs {
    $configFiles = @(
        ".cspell.json",
        "cspell.json"
    )
    
    foreach ($file in $configFiles) {
        if (Test-Path $file) {
            Move-ToArchive $file "Duplicate configuration file"
        }
    }
}

try {
    Create-ArchiveDirectory
    Clean-TempFiles
    Clean-ErrorLogs
    Clean-UnusedDirs
    Clean-DuplicateConfigs
    
    Write-Host "Workspace cleanup completed successfully!"
    Write-Host "Archived files can be found in: $archiveTimestampDir"
} catch {
    Write-Error "An error occurred during cleanup: $_"
    exit 1
} 
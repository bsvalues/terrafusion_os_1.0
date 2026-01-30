$SOLID_DEV_SHA = "9af5bb291d3d6c2bfc2907982531359de1476cea"
$rootPath = (Get-Location).Path

Write-Host "Analyzing changes since $SOLID_DEV_SHA..."

# 1. Enumerate ALL Node roots
$allRoots = Get-ChildItem -Recurse -Filter "package.json" | Where-Object { $_.FullName -notmatch "node_modules" } | ForEach-Object { $_.DirectoryName } | Sort-Object -Unique

# Convert to relative paths
$allRelative = $allRoots | ForEach-Object { 
    if ($_ -eq $rootPath) { "." } 
    else { $_.Substring($rootPath.Length + 1).Replace('\', '/') } 
}

# 2. Get touched files using git directly
$touchedFiles = git diff --name-only $SOLID_DEV_SHA HEAD
if ($LASTEXITCODE -ne 0) {
    Write-Error "Git command failed"
    exit
}

# 3. Filter interesting files (code/config)
$relevantFiles = $touchedFiles | Where-Object { 
    $_ -match "package\.json|pnpm-lock\.yaml|Dockerfile|docker-compose|vite\.config|\.ts$|\.tsx$|\.js$|\.py$|\.cs$|\.json$" 
}

# 4. Map touched files to their nearest package.json root
$candidates = @()

foreach ($root in $allRelative) {
    # If root is ".", check if any file is in root (has no slashes, or specifically tracked root files)
    if ($root -eq ".") {
        $hasRootFiles = $relevantFiles | Where-Object { $_ -notmatch "/" } | Select-Object -First 1
        if ($hasRootFiles) { $candidates += "." }
    } else {
        # Check if any touched file starts with "root/"
        $match = $relevantFiles | Where-Object { $_ -like "$root/*" } | Select-Object -First 1
        if ($match) { $candidates += $root }
    }
}

# 5. Output Classification Data
$candidates | ForEach-Object {
    $r = $_
    $fullPath = if ($r -eq ".") { $rootPath } else { Join-Path $rootPath $r }
    
    $hasPnpm = Test-Path (Join-Path $fullPath "pnpm-lock.yaml")
    $hasPkgLock = Test-Path (Join-Path $fullPath "package-lock.json")
    
    # Heuristic Classification
    $bucket = "LEGACY_QUARANTINE"
    
    if ($r -eq "." -or $r -match "^frontend" -or $r -match "^backend" -or $r -match "^native-shell" -or $r -match "^electron") {
        $bucket = "CORE_SOLIDIFIED_OS"
    } elseif ($r -match "^applications/" -or $r -match "^terraforge-suite" -or $r -match "^terrabuild-modernization") {
        $bucket = "GEN2_APPS"
    } elseif ($r -match "^apps/" -or $r -match "^packages/") {
         # Case by case?
         $bucket = "GEN2_APPS" # Tentative
    }
    
    [PSCustomObject]@{
        "Root" = $r
        "Bucket" = $bucket
        "Lockfile" = if ($hasPnpm) { "pnpm" } elseif ($hasPkgLock) { "npm" } else { "none" }
    }
} | Sort-Object Bucket, Root | Format-Table -AutoSize

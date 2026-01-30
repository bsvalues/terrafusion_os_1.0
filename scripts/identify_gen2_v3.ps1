$SOLID_DEV_SHA = "9af5bb291d3d6c2bfc2907982531359de1476cea"
$rootPath = (Get-Location).Path

Write-Host "Analyzing changes since $SOLID_DEV_SHA..."

# 1. Enumerate ALL Project roots (Node, Deno, Rust, Python, Dotnet)
# We look for specific markers
$markers = @("package.json", "deno.json", "Cargo.toml", "pyproject.toml", "requirements.txt", "*.sln")
$allRoots = @()

foreach ($m in $markers) {
    $found = Get-ChildItem -Recurse -Filter $m | Where-Object { $_.FullName -notmatch "node_modules" -and $_.FullName -notmatch "target" -and $_.FullName -notmatch "venv" } | ForEach-Object { $_.DirectoryName }
    $allRoots += $found
}
$allRoots = $allRoots | Sort-Object -Unique

# Convert to relative paths
$allRelative = $allRoots | ForEach-Object { 
    if ($_ -eq $rootPath) { "." } 
    else { $_.Substring($rootPath.Length + 1).Replace('\', '/') } 
}

# 2. Get touched files using git directly
$touchedFiles = git diff --name-only $SOLID_DEV_SHA HEAD
if ($LASTEXITCODE -ne 0) { Write-Error "Git command failed"; exit }

# 3. Filter interesting files (broader list)
$relevantFiles = $touchedFiles | Where-Object { 
    $_ -match "package\.json|pnpm-lock\.yaml|Dockerfile|docker-compose|vite\.config|\.ts$|\.tsx$|\.js$|\.py$|\.cs$|\.rs$|\.json$|\.toml$" 
}

# 4. Map touched files to their nearest Project root
$candidates = @()

foreach ($root in $allRelative) {
    if ($root -eq ".") {
        $hasRootFiles = $relevantFiles | Where-Object { $_ -notmatch "/" } | Select-Object -First 1
        if ($hasRootFiles) { $candidates += "." }
    } else {
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
    $bucket = "LEGACY_QUARANTINE" # Default
    
    # Core
    if ($r -eq "." -or $r -match "^frontend$" -or $r -match "^frontend/" -or $r -match "^backend" -or $r -match "^native-shell" -or $r -match "^electron") {
        $bucket = "CORE_SOLIDIFIED_OS"
    } 
    # Gen2 Pattern
    elseif ($r -match "^applications/" -or $r -match "^terraforge-suite" -or $r -match "^terrabuild-modernization") {
        $bucket = "GEN2_APPS"
    }
    # Explicit Gen2 from user prompting
    elseif ($r -match "terra-assessor-production" -or $r -match "terra-dossier" -or $r -match "terra-permit") {
        $bucket = "GEN2_APPS"
    }
    # Other workspaces might be Gen2?
    elseif ($r -match "^workspaces/") {
         if ($r -match "PACS" -or $r -match "AIDATACONNECT") { $bucket = "LEGACY_QUARANTINE" } # User hinted these are islands/legacy
         else { $bucket = "GEN2_APPS" }
    }
    
    [PSCustomObject]@{
        "Root" = $r
        "Bucket" = $bucket
        "Type" = if ($hasPnpm) { "pnpm" } elseif ($hasPkgLock) { "npm" } else { "other" }
    }
} | Sort-Object Bucket, Root | Format-Table -AutoSize

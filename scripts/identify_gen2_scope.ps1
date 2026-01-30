$SOLID_DEV_SHA = "9af5bb291d3d6c2bfc2907982531359de1476cea"

# 1. Enumerate ALL Node roots
$all = Get-ChildItem -Recurse -Filter "package.json" | Where-Object { $_.FullName -notmatch "node_modules" } | ForEach-Object { $_.DirectoryName } | Sort-Object -Unique

# Adjust paths to be relative to workspace root for comparison
$rootPath = Get-Location
$allRunRelative = $all | ForEach-Object { $_.Substring($rootPath.Path.Length + 1).Replace('\', '/') }

# 2. Touched since solidification (Gen2 Anchor)
$touchedFiles = git diff --name-only $SOLID_DEV_SHA..HEAD
$touchedRoots = $touchedFiles | Where-Object { 
    # Broaden the filter to capture ANY meaningful activity in a root, not just dependencies/docker
    $_ -match "package\.json|pnpm-lock\.yaml|Dockerfile|docker-compose|vite\.config|\.ts$|\.tsx$|\.js$|\.py$|\.cs$|\.json$" 
} | ForEach-Object { 
    $parent = Split-Path $_ -Parent
    # Walk up the path to find the nearest package.json root? 
    # Simplification: just return the parent and we'll match it against $allRunRelative later
    if ($parent -eq "") { "." } else { $parent.Replace('\', '/') }
} | Sort-Object -Unique

# 3. Match touched files to known package.json roots
$gen2Candidates = @()
foreach ($root in $allRunRelative) {
    if ($root -eq ".") { 
        if ($touchedRoots -contains ".") { $gen2Candidates += "." }
    } else {
        # If any touched file starts with this root path
        $isTouched = $touchedRoots | Where-Object { $_ -eq $root -or $_ -like "$root/*" } | Select-Object -First 1
        if ($isTouched) {
            $gen2Candidates += $root
        }
    }
}

Write-Host "--- GEN2 CANDIDATES (Touched since $SOLID_DEV_SHA) ---"
$gen2Candidates

# 4. Check for markers for bucket classification help
Write-Host "`n--- CLASSIFICATION DATA ---"
$gen2Candidates | ForEach-Object {
    $fullPath = if ($_ -eq ".") { $rootPath.Path } else { Join-Path $rootPath.Path $_ }
    $hasPnpm = Test-Path (Join-Path $fullPath "pnpm-lock.yaml")
    $hasPkgLock = Test-Path (Join-Path $fullPath "package-lock.json")
    $inApplications = $_ -match "^applications/"
    $inTerraforge = $_ -match "^terraforge-suite"
    
    [PSCustomObject]@{
        Root = $_
        HasPnpm = $hasPnpm
        HasPkgLock = $hasPkgLock
        Type = if ($_ -eq "." -or $_ -match "^frontend" -or $_ -match "^backend") { "CoreCandidate" }
               elseif ($inApplications -or $inTerraforge) { "AppCandidate" }
               else { "Other" }
    }
} | Format-Table -AutoSize

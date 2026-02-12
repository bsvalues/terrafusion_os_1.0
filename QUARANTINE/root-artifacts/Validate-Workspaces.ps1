# Workspace Validation Script
# THE TERRAFUSION WAY: Empirical Validation at Scale

param(
    [Parameter(Mandatory=$false)]
    [string]$WorkspacesDir = "workspaces",
    [Parameter(Mandatory=$false)]
    [switch]$Detailed
)

function Test-WorkspaceFile {
    param(
        [string]$FilePath
    )
    
    $result = @{
        File = $FilePath
        Valid = $false
        Errors = @()
        Warnings = @()
        FolderCount = 0
        HasSettings = $false
        HasExtensions = $false
        HasLaunch = $false
        HasTasks = $false
    }
    
    try {
        # Test JSON syntax
        $workspace = Get-Content $FilePath -Raw | ConvertFrom-Json
        $result.Valid = $true
        
        # Count folders
        if ($workspace.folders) {
            $result.FolderCount = $workspace.folders.Count
        }
        
        # Check for key sections
        $result.HasSettings = ($null -ne $workspace.settings)
        $result.HasExtensions = ($null -ne $workspace.extensions)
        $result.HasLaunch = ($null -ne $workspace.launch)
        $result.HasTasks = ($null -ne $workspace.tasks)
        
        # Validate folder paths exist
        foreach ($folder in $workspace.folders) {
            if ($folder.path) {
                $folderPath = Join-Path (Split-Path $FilePath) $folder.path
                $resolvedPath = Resolve-Path $folderPath -ErrorAction SilentlyContinue
                if (-not $resolvedPath) {
                    $result.Warnings += "Folder path does not exist: $($folder.path)"
                }
            }
        }
        
        # Check required settings
        if ($workspace.settings) {
            if (-not $workspace.settings."workbench.colorCustomizations") {
                $result.Warnings += "Missing title bar color customization"
            }
            if (-not $workspace.settings."files.exclude") {
                $result.Warnings += "Missing file exclusions"
            }
            if (-not $workspace.settings."editor.formatOnSave") {
                $result.Warnings += "Format on save not enabled"
            }
        }
        
    } catch {
        $result.Errors += "JSON Parse Error: $($_.Exception.Message)"
    }
    
    return $result
}

# Main validation
Write-Host "🔍 THE TERRAFUSION WAY - WORKSPACE VALIDATION" -ForegroundColor Green
Write-Host "Validating all workspace files..." -ForegroundColor Yellow
Write-Host ""

$workspaceFiles = Get-ChildItem -Path $WorkspacesDir -Recurse -Filter "*.code-workspace"
$totalFiles = $workspaceFiles.Count
$validFiles = 0
$filesWithWarnings = 0
$filesWithErrors = 0

$results = @()

foreach ($file in $workspaceFiles) {
    $result = Test-WorkspaceFile -FilePath $file.FullName
    $results += $result
    
    if ($result.Valid) {
        $validFiles++
        if ($result.Warnings.Count -gt 0) {
            $filesWithWarnings++
        }
    } else {
        $filesWithErrors++
    }
    
    # Display result
    $status = if ($result.Valid) { "✅" } else { "❌" }
    $warningIndicator = if ($result.Warnings.Count -gt 0) { "⚠️" } else { "" }
    
    $fileName = Split-Path $file.FullName -Leaf
    Write-Host "   $status $fileName ($($result.FolderCount) folders) $warningIndicator" -ForegroundColor $(if ($result.Valid) { "Green" } else { "Red" })
    
    if ($Detailed -and $result.Errors.Count -gt 0) {
        foreach ($error in $result.Errors) {
            Write-Host "      ❌ $error" -ForegroundColor Red
        }
    }
    
    if ($Detailed -and $result.Warnings.Count -gt 0) {
        foreach ($warning in $result.Warnings) {
            Write-Host "      ⚠️ $warning" -ForegroundColor Yellow
        }
    }
}

# Summary
Write-Host ""
Write-Host "📊 VALIDATION SUMMARY:" -ForegroundColor Cyan
Write-Host "   Total files: $totalFiles" -ForegroundColor White
Write-Host "   Valid files: $validFiles" -ForegroundColor Green
Write-Host "   Files with errors: $filesWithErrors" -ForegroundColor Red
Write-Host "   Files with warnings: $filesWithWarnings" -ForegroundColor Yellow

# Statistics
$totalFolders = ($results | Where-Object { $_.Valid } | Measure-Object -Property FolderCount -Sum).Sum
$withSettings = ($results | Where-Object { $_.HasSettings }).Count
$withExtensions = ($results | Where-Object { $_.HasExtensions }).Count
$withLaunch = ($results | Where-Object { $_.HasLaunch }).Count
$withTasks = ($results | Where-Object { $_.HasTasks }).Count

Write-Host ""
Write-Host "📈 STATISTICS:" -ForegroundColor Cyan
Write-Host "   Total folders across all workspaces: $totalFolders" -ForegroundColor White
Write-Host "   Workspaces with settings: $withSettings" -ForegroundColor White
Write-Host "   Workspaces with extensions: $withExtensions" -ForegroundColor White
Write-Host "   Workspaces with launch configs: $withLaunch" -ForegroundColor White
Write-Host "   Workspaces with tasks: $withTasks" -ForegroundColor White

# Tier breakdown
$tierCounts = @{
    "Master" = 0
    "Pillar" = 0
    "Portal" = 0
    "App" = 0
}

foreach ($file in $workspaceFiles) {
    $path = $file.FullName
    if ($path -match "workspaces[\\\/]master\.code-workspace") {
        $tierCounts["Master"]++
    } elseif ($path -match "workspaces[\\\/][^\\\/]+\.code-workspace$") {
        $tierCounts["Pillar"]++
    } elseif ($path -match "workspaces[\\\/]frontend[\\\/]") {
        $tierCounts["Portal"]++
    } elseif ($path -match "workspaces[\\\/]marketplace[\\\/]") {
        $tierCounts["App"]++
    }
}

Write-Host ""
Write-Host "🏗️ TIER BREAKDOWN:" -ForegroundColor Cyan
Write-Host "   Tier 1 (Master): $($tierCounts['Master'])" -ForegroundColor White
Write-Host "   Tier 2 (Pillars): $($tierCounts['Pillar'])" -ForegroundColor White
Write-Host "   Tier 3 (Portals): $($tierCounts['Portal'])" -ForegroundColor White
Write-Host "   Tier 4 (Apps): $($tierCounts['App'])" -ForegroundColor White

# Final result
$successRate = [math]::Round(($validFiles / $totalFiles) * 100, 1)
Write-Host ""
if ($filesWithErrors -eq 0) {
    Write-Host "🎉 SUCCESS: $successRate% validation pass rate!" -ForegroundColor Green
    Write-Host "✅ ALL WORKSPACES READY FOR USE!" -ForegroundColor Green
} else {
    Write-Host "⚠️ ISSUES FOUND: $successRate% validation pass rate" -ForegroundColor Yellow
    Write-Host "❌ $filesWithErrors files need fixing" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 THE TERRAFUSION WAY: Validated empirically at scale!" -ForegroundColor Green
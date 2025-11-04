# 🔧 WORKSPACE HEALTH CHECKER
# TerraFusion OS 1.0 - Workspace Health Monitoring Script

Write-Host "🚀 TerraFusion Workspace Health Check" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray

# Check if we're in the right directory
if (-not (Test-Path "workspaces")) {
    Write-Host "❌ Error: Not in TerraFusion root directory" -ForegroundColor Red
    Write-Host "   Navigate to C:\Users\bsval\terrafusion_os_1.0 first" -ForegroundColor Yellow
    exit 1
}

Write-Host "🏥 CHECKING WORKSPACE HEALTH..." -ForegroundColor Green

# Check workspace files
$workspaceFiles = Get-ChildItem -Path "workspaces" -Filter "*.code-workspace" -Recurse
$totalWorkspaces = $workspaceFiles.Count
$healthyWorkspaces = 0
$issues = @()

foreach ($workspace in $workspaceFiles) {
    Write-Host "   Checking: $($workspace.Name)" -ForegroundColor Gray
    
    try {
        # Test JSON syntax
        $content = Get-Content $workspace.FullName -Raw | ConvertFrom-Json
        
        # Check essential properties
        $hasSettings = $content.settings -ne $null
        $hasExtensions = $content.extensions -ne $null
        $hasFolders = $content.folders -ne $null -and $content.folders.Count -gt 0
        
        if ($hasSettings -and $hasExtensions -and $hasFolders) {
            $healthyWorkspaces++
            Write-Host "      ✅ Healthy" -ForegroundColor Green
        } else {
            $issues += "⚠️  $($workspace.Name): Missing essential properties"
            Write-Host "      ⚠️  Missing properties" -ForegroundColor Yellow
        }
    }
    catch {
        $issues += "❌ $($workspace.Name): JSON syntax error"
        Write-Host "      ❌ JSON error" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📊 HEALTH REPORT:" -ForegroundColor Cyan
Write-Host "   Total Workspaces: $totalWorkspaces" -ForegroundColor White
Write-Host "   Healthy: $healthyWorkspaces" -ForegroundColor Green
Write-Host "   Issues: $($issues.Count)" -ForegroundColor $(if ($issues.Count -eq 0) { "Green" } else { "Yellow" })

if ($issues.Count -gt 0) {
    Write-Host ""
    Write-Host "🔍 ISSUES FOUND:" -ForegroundColor Yellow
    foreach ($issue in $issues) {
        Write-Host "   $issue" -ForegroundColor Yellow
    }
}

# Check essential extensions
Write-Host ""
Write-Host "🔌 CHECKING ESSENTIAL EXTENSIONS..." -ForegroundColor Green

$essentialExtensions = @(
    "eamodio.gitlens",
    "gruntfuggly.todo-tree", 
    "ms-azuretools.vscode-docker",
    "usernamehw.errorlens",
    "zhuangtongfa.material-theme"
)

Write-Host "   Essential extensions status:" -ForegroundColor Gray
foreach ($ext in $essentialExtensions) {
    Write-Host "      $ext" -ForegroundColor White
}

# Check folder structure
Write-Host ""
Write-Host "📁 CHECKING FOLDER STRUCTURE..." -ForegroundColor Green

$criticalFolders = @("backend", "frontend", "marketplace", "platform")
$missingFolders = @()

foreach ($folder in $criticalFolders) {
    if (-not (Test-Path $folder)) {
        $missingFolders += $folder
    }
}

if ($missingFolders.Count -eq 0) {
    Write-Host "   ✅ All critical folders present" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Missing folders: $($missingFolders -join ', ')" -ForegroundColor Yellow
}

# Performance metrics
Write-Host ""
Write-Host "⚡ PERFORMANCE METRICS:" -ForegroundColor Green

$totalFiles = (Get-ChildItem -Recurse -File | Measure-Object).Count
$totalDirs = (Get-ChildItem -Recurse -Directory | Measure-Object).Count
$gitRepos = (Get-ChildItem -Directory -Filter ".git" -Recurse | Measure-Object).Count

Write-Host "   Total Files: $totalFiles" -ForegroundColor White
Write-Host "   Total Directories: $totalDirs" -ForegroundColor White  
Write-Host "   Git Repositories: $gitRepos" -ForegroundColor White

# Health score calculation
$healthScore = [Math]::Round(($healthyWorkspaces / $totalWorkspaces) * 100, 1)
Write-Host ""
Write-Host "🎯 OVERALL HEALTH SCORE: $healthScore%" -ForegroundColor $(
    if ($healthScore -eq 100) { "Green" }
    elseif ($healthScore -ge 90) { "Yellow" }
    else { "Red" }
)

if ($healthScore -eq 100) {
    Write-Host "🎊 PERFECT HEALTH! All workspaces are ready for team use!" -ForegroundColor Green
} elseif ($healthScore -ge 90) {
    Write-Host "👍 GOOD HEALTH! Minor issues can be addressed later." -ForegroundColor Yellow
} else {
    Write-Host "🚨 NEEDS ATTENTION! Please fix workspace issues." -ForegroundColor Red
}

Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Open VS Code: File → Open Workspace from File" -ForegroundColor White
Write-Host "   2. Select: workspaces\master.code-workspace" -ForegroundColor White
Write-Host "   3. Install recommended extensions when prompted" -ForegroundColor White
Write-Host "   4. Test launch configurations (F5)" -ForegroundColor White

Write-Host ""
Write-Host "THE TERRAFUSION WAY: Empirically validated workspace health! 🎯" -ForegroundColor Magenta
# 🔧 FIX WORKSPACE PATHS
# TerraFusion OS 1.0 - Fix incorrect folder paths in workspaces

Write-Host "🔧 Fixing Workspace Folder Paths..." -ForegroundColor Cyan

$fixes = 0
$workspaceFiles = Get-ChildItem -Path "workspaces" -Filter "*.code-workspace" -Recurse

foreach ($file in $workspaceFiles) {
    Write-Host "Checking: $($file.Name)" -ForegroundColor Gray
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Fix common path issues
    $content = $content -replace '"../platform/sdk"', '"../SDK"'
    $content = $content -replace '"../platform/"', '"../os-platform/"'
    $content = $content -replace '"../tests/platform"', '"../tests"'
    $content = $content -replace '"../tests/os-platform"', '"../tests"'
    $content = $content -replace '"../docs/platform"', '"../docs/architecture"'
    $content = $content -replace '"../docs/os-platform"', '"../docs/architecture"'
    
    # Fix marketplace paths
    $content = $content -replace '"../marketplace/infrastructure"', '"../marketplace"'
    
    # Fix frontend paths  
    $content = $content -replace '"../frontend/design-system"', '"../frontend/src/design-system"'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content
        Write-Host "   ✅ Fixed paths in: $($file.Name)" -ForegroundColor Green
        $fixes++
    } else {
        Write-Host "   ✓ No issues found" -ForegroundColor DarkGreen
    }
}

Write-Host ""
Write-Host "📊 PATH FIX SUMMARY:" -ForegroundColor Cyan
Write-Host "   Files checked: $($workspaceFiles.Count)" -ForegroundColor White
Write-Host "   Files fixed: $fixes" -ForegroundColor Green

if ($fixes -gt 0) {
    Write-Host ""
    Write-Host "✅ Workspace paths have been corrected!" -ForegroundColor Green
    Write-Host "🔄 Run validation to confirm all paths now exist:" -ForegroundColor Cyan
    Write-Host "   .\Validate-Workspaces.ps1" -ForegroundColor White
} else {
    Write-Host "✅ All workspace paths were already correct!" -ForegroundColor Green
}

Write-Host ""
Write-Host "THE TERRAFUSION WAY: Fix the root cause, not just symptoms! 🎯" -ForegroundColor Magenta
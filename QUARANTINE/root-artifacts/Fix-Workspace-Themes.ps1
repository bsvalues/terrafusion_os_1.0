# Fix workspace themes to use installed themes
$workspaceFiles = Get-ChildItem -Path "workspaces" -Filter "*.code-workspace" -Recurse

foreach ($file in $workspaceFiles) {
    Write-Host "Fixing theme in: $($file.FullName)"
    $content = Get-Content $file.FullName -Raw
    
    # Replace Material Theme Darker with One Dark Pro
    $content = $content -replace '"Material Theme Darker"', '"One Dark Pro"'
    
    # Replace other theme issues
    $content = $content -replace '"Material Theme"', '"One Dark Pro"'
    
    Set-Content -Path $file.FullName -Value $content
}

Write-Host "✅ All workspace themes updated to use One Dark Pro"

# Fix PackageReference versions in .csproj files for central package management
# This removes Version attributes from PackageReference items

Write-Host "Fixing PackageReference versions for central package management..." -ForegroundColor Cyan

$csprojFiles = Get-ChildItem -Path "$PSScriptRoot\..\..\backend" -Filter "*.csproj" -Recurse

foreach ($file in $csprojFiles) {
    Write-Host "Processing: $($file.Name)" -ForegroundColor Yellow
    
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Remove Version attribute from PackageReference elements
    # Pattern: <PackageReference Include="..." Version="..." />
    $content = $content -replace '<PackageReference\s+Include="([^"]+)"\s+Version="[^"]+"\s*/>', '<PackageReference Include="$1" />'
    
    # Also handle multi-line PackageReference elements
    $content = $content -replace '<PackageReference\s+Include="([^"]+)"\s+Version="[^"]+"\s*>', '<PackageReference Include="$1">'
    
    if ($content -ne $originalContent) {
        $content | Out-File -FilePath $file.FullName -Encoding UTF8 -NoNewline
        Write-Host "  [FIXED] Removed version attributes" -ForegroundColor Green
    } else {
        Write-Host "  [OK] No changes needed" -ForegroundColor Gray
    }
}

Write-Host "`nDone! Now updating Directory.Packages.props with all required packages..." -ForegroundColor Green

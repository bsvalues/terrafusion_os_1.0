# Fix JSON syntax errors in package.json files
# Convert invalid ${{VAR}} syntax to proper ${VAR} format

Write-Host "TerraFusion JSON Syntax Fixer" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

# Get all package.json files
$packageFiles = Get-ChildItem -Recurse -Filter "package.json" -File

$fixed = 0
$total = 0

foreach ($file in $packageFiles) {
    $total++
    
    try {
        # Read file content
        $content = Get-Content $file.FullName -Raw -ErrorAction Stop
        
        # Check if file contains invalid syntax
        if ($content -match '\\\$\{\{.*\}\}') {
            Write-Host "Processing: $($file.FullName)" -ForegroundColor Cyan
            
            # Replace invalid syntax with correct format
            $newContent = $content -replace '\\\$\{\{([^}]+)\}\}', '${$1}'
            
            # Write back to file
            $newContent | Set-Content $file.FullName -NoNewline
            
            Write-Host "  Fixed!" -ForegroundColor Green
            $fixed++
        }
    }
    catch {
        Write-Host "Error processing $($file.FullName): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "SUMMARY:" -ForegroundColor Green
Write-Host "Total package.json files: $total"
Write-Host "Files fixed: $fixed" -ForegroundColor Green

if ($fixed -gt 0) {
    Write-Host "Successfully fixed JSON syntax errors!" -ForegroundColor Green
}
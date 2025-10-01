# Fix JSON syntax errors in package.json files
# Convert invalid ${{VAR}} syntax to proper ${VAR} format

Write-Host "🔧 TerraFusion JSON Syntax Fixer" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

# Get all package.json files with the invalid syntax
$files = Get-ChildItem -Recurse -Name "package.json" | ForEach-Object {
    $fullPath = Join-Path $PWD $_
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw -ErrorAction SilentlyContinue
        if ($content -match '\$\{\{.*\}\}') {
            $fullPath
        }
    }
}

$totalFiles = $files.Count
Write-Host "📋 Found $totalFiles package.json files with invalid JSON syntax" -ForegroundColor Yellow
Write-Host ""

$fixed = 0
$errors = 0

foreach ($file in $files) {
    try {
        Write-Host "🔨 Processing: $file" -ForegroundColor Cyan
        
        # Read the file content
        $content = Get-Content $file -Raw
        
        # Replace the invalid syntax patterns
        $updated = $content -replace '\$\{\{([^}]+)\}\}', '${$1}'
        
        # Only write if changes were made
        if ($content -ne $updated) {
            $updated | Set-Content $file -NoNewline
            Write-Host "  ✅ Fixed environment variable syntax" -ForegroundColor Green
            $fixed++
        } else {
            Write-Host "  ℹ️  No changes needed" -ForegroundColor Gray
        }
    }
    catch {
        Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        $errors++
    }
}

Write-Host ""
Write-Host "📊 SUMMARY" -ForegroundColor Green
Write-Host "=========" -ForegroundColor Green
Write-Host "Total files processed: $totalFiles" -ForegroundColor White
Write-Host "Files fixed: $fixed" -ForegroundColor Green
Write-Host "Errors: $errors" -ForegroundColor $(if($errors -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($fixed -gt 0) {
    Write-Host "🎉 Successfully fixed JSON syntax in $fixed package.json files!" -ForegroundColor Green
    Write-Host "   All environment variables now use proper JSON-compatible format" -ForegroundColor Gray
    Write-Host "   Example: Invalid syntax converted to proper format" -ForegroundColor Gray
} else {
    Write-Host "ℹ️  No fixes were needed" -ForegroundColor Gray
}

if ($errors -gt 0) {
    Write-Host ""
    Write-Host "⚠️  Some files had errors. Please check them manually." -ForegroundColor Yellow
}
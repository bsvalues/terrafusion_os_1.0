# Fix shell-style string interpolation in C# files
Write-Host "🔧 Fixing shell-style string interpolation in C# files..."

$files = Get-ChildItem -Path "backend", "terrafusion" -Recurse -Include "*.cs" -ErrorAction SilentlyContinue

$totalFixed = 0

foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Raw -ErrorAction Stop
        
        if ($content -match '\$\{[^}]*\}') {
            # Replace ${VAR:DEFAULT} with static values or proper C# interpolation
            $newContent = $content
            
            # Fix specific patterns
            $newContent = $newContent -replace '\$\{TF_FRONTEND_PORT:-3102\}', '3102'
            $newContent = $newContent -replace '\$\{TF_PORT_5173:-5173\}', '5173'
            $newContent = $newContent -replace '\$\{TF_SERVICE_8001_PORT:-8001\}', '8001'
            $newContent = $newContent -replace '\$\{TF_PORT_6432:-6432\}', '6432'
            $newContent = $newContent -replace '\$\{TF_PORT_8200:-8200\}', '8200'
            $newContent = $newContent -replace '\$\{TF_STATIC_PORT:-8080\}', '8080'
            
            # Fix ${TotalRevenue:F2} -> {TotalRevenue:F2}
            $newContent = $newContent -replace '\$\{([^}]*)\}', '{$1}'
            
            if ($newContent -ne $content) {
                Set-Content -Path $file.FullName -Value $newContent
                Write-Host "✅ Fixed: $($file.FullName)"
                $totalFixed++
            }
        }
    }
    catch {
        Write-Host "⚠️ Error processing $($file.FullName): $($_.Exception.Message)"
    }
}

Write-Host "🎉 Fixed $totalFixed files with shell-style string interpolation issues"
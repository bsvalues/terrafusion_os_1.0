# Final JSX Formatting Fix Script
# Addresses remaining Prettier formatting issues

Write-Host "🚀 FINAL JSX FORMATTING REMEDIATION" -ForegroundColor Cyan

# Initialize counters
$totalFilesProcessed = 0
$totalFixesApplied = 0

# Simple but effective JSX formatting patterns
function Repair-JSXFile {
    param($FilePath)
    
    try {
        $content = Get-Content -Path $FilePath -Raw
        $originalContent = $content
        $fixCount = 0
        
        # Fix common JSX formatting issues
        
        # Fix JSX self-closing spacing
        $oldContent = $content
        $content = $content -replace '(<[^>]+?)\s+\/>', '$1 />'
        if ($content -ne $oldContent) { $fixCount++ }
        
        # Fix JSX attribute spacing  
        $oldContent = $content
        $content = $content -replace '(\w+)=\s*\{\s*([^}]+?)\s*\}', '$1={$2}'
        if ($content -ne $oldContent) { $fixCount++ }
        
        # Fix JSX expression spacing
        $oldContent = $content
        $content = $content -replace '\{\s+([^}]+?)\s+\}', '{$1}'
        if ($content -ne $oldContent) { $fixCount++ }
        
        # Fix JSX tag spacing
        $oldContent = $content
        $content = $content -replace '>\s+<', '><'
        if ($content -ne $oldContent) { $fixCount++ }
        
        # Fix JSX text spacing
        $oldContent = $content
        $content = $content -replace '>\s+([^\s<][^<]*?)\s+<', '>$1<'
        if ($content -ne $oldContent) { $fixCount++ }
        
        # Fix array map spacing
        $oldContent = $content
        $content = $content -replace '\.map\s*\(\s*\(', '.map(('
        if ($content -ne $oldContent) { $fixCount++ }
        
        # Fix arrow function spacing
        $oldContent = $content
        $content = $content -replace '\)\s*=>\s*\(', ') => ('
        if ($content -ne $oldContent) { $fixCount++ }
        
        # Save changes if any were made
        if ($content -ne $originalContent) {
            Set-Content -Path $FilePath -Value $content -NoNewline
            return $fixCount
        }
        
        return 0
        
    } catch {
        Write-Host "Error processing $FilePath`: $_" -ForegroundColor Red
        return 0
    }
}

# Get all TSX/JSX files
$tsxFiles = Get-ChildItem -Path "." -Recurse -Include "*.tsx", "*.jsx" | 
    Where-Object { 
        $_.FullName -notlike "*node_modules*" -and 
        $_.FullName -notlike "*.git*" -and
        $_.FullName -notlike "*dist*" -and
        $_.FullName -notlike "*build*"
    }

Write-Host "Found $($tsxFiles.Count) TSX/JSX files to process" -ForegroundColor Cyan

# Process each file
foreach ($file in $tsxFiles) {
    $totalFilesProcessed++
    $fixesApplied = Repair-JSXFile -FilePath $file.FullName
    
    if ($fixesApplied -gt 0) {
        $totalFixesApplied += $fixesApplied
        Write-Host "✅ $($file.Name): Applied $fixesApplied fixes" -ForegroundColor Green
    }
}

Write-Host "`n🏆 FORMATTING COMPLETE!" -ForegroundColor Green
Write-Host "Files Processed: $totalFilesProcessed" -ForegroundColor Yellow
Write-Host "Total Fixes Applied: $totalFixesApplied" -ForegroundColor Yellow

# Validate with TypeScript
Write-Host "`n🎯 Running TypeScript validation..." -ForegroundColor Yellow
$tscResult = npx tsc --noEmit 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ TypeScript compilation successful!" -ForegroundColor Green
} else {
    Write-Host "❌ TypeScript issues:" -ForegroundColor Red
    Write-Host $tscResult -ForegroundColor Yellow
}

Write-Host "🚀 Final formatting complete!" -ForegroundColor Green

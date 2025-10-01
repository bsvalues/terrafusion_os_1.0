# Enhanced JSX Final Formatting Fix Script
# Addresses remaining Prettier formatting issues in ~164 files
# MIT PhD-Level Systematic Approach

Write-Host "🚀 FINAL JSX FORMATTING REMEDIATION" -ForegroundColor Cyan
Write-Host "Target: Complete 100% Prettier compliance" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Cyan

# Initialize counters
$totalFilesProcessed = 0
$totalFixesApplied = 0
$processedFiles = @()

# Enhanced patterns for final formatting fixes
$formattingPatterns = @{
    # Fix JSX fragment formatting
    'ReactFragment_Spacing' = @{
        Pattern = '(<>)\s*\n\s*(<\/?>)'
        Replacement = '$1$2'
        Description = 'Fix React Fragment spacing'
    }
    
    # Fix JSX element self-closing spacing
    'SelfClosing_Spacing' = @{
        Pattern = '(<[^>]+?)\s+\/>'
        Replacement = '$1 />'
        Description = 'Standardize self-closing tag spacing'
    }
    
    # Fix JSX attribute formatting
    'Attribute_Spacing' = @{
        Pattern = '(\w+)=\s*\{\s*([^}]+?)\s*\}'
        Replacement = '$1={$2}'
        Description = 'Fix JSX attribute object spacing'
    }
    
    # Fix arrow function formatting in JSX
    'ArrowFunction_JSX' = @{
        Pattern = '\{\s*\(\s*([^)]*?)\s*\)\s*=>\s*\{'
        Replacement = '{($1) => {'
        Description = 'Fix arrow function formatting in JSX'
    }
    
    # Fix conditional rendering spacing
    'Conditional_Spacing' = @{
        Pattern = '\{\s*([^}]+?)\s*\?\s*\(\s*'
        Replacement = '{$1 ? ('
        Description = 'Fix conditional rendering spacing'
    }
    
    # Fix JSX expression spacing
    'Expression_Spacing' = @{
        Pattern = '\{\s*([^{}]+?)\s*\}'
        Replacement = '{$1}'
        Description = 'Fix JSX expression spacing'
    }
    
    # Fix multiline JSX props
    'Multiline_Props' = @{
        Pattern = '(\w+)=\{\s*\n\s*([^}]+?)\s*\n\s*\}'
        Replacement = '$1={$2}'
        Description = 'Fix multiline JSX props'
    }
    
    # Fix React component spacing
    'Component_Spacing' = @{
        Pattern = '<(\w+)\s+([^>]*?)>'
        Replacement = '<$1 $2>'
        Description = 'Fix React component prop spacing'
    }
    
    # Fix JSX text node spacing
    'TextNode_Spacing' = @{
        Pattern = '>\s+([^<\s][^<]*?)\s+<'
        Replacement = '>$1<'
        Description = 'Fix JSX text node spacing'
    }
    
    # Fix nested JSX formatting
    'Nested_JSX' = @{
        Pattern = '\{\s*\(\s*<'
        Replacement = '{(<'
        Description = 'Fix nested JSX expression formatting'
    }
}

function Fix-JSXFileFormatting {
    param($FilePath)
    
    try {
        $content = Get-Content -Path $FilePath -Raw -ErrorAction Stop
        $originalContent = $content
        $fixCount = 0
        
        foreach ($patternName in $formattingPatterns.Keys) {
            $pattern = $formattingPatterns[$patternName]
            $oldContent = $content
            
            # Apply the formatting fix
            $content = $content -replace $pattern.Pattern, $pattern.Replacement
            
            if ($content -ne $oldContent) {
                $fixCount++
                Write-Host "  ✅ Applied: $($pattern.Description)" -ForegroundColor Green
            }
        }
        
        # Additional specific fixes for common Prettier issues
        
        # Fix JSX closing tag formatting
        $content = $content -replace '>\s*\n\s*</', '></'
        
        # Fix JSX opening/closing same line
        $content = $content -replace '>\s*\n\s*([^<\n]+?)\s*\n\s*</', '>$1</'
        
        # Fix empty JSX elements
        $content = $content -replace '>\s*</', '></'
        
        # Fix JSX prop object formatting
        $content = $content -replace '=\s*\{\s*\{\s*', '={{'
        $content = $content -replace '\s*\}\s*\}', '}}'
        
        # Fix array map formatting in JSX
        $content = $content -replace '\.map\s*\(\s*\(', '.map(('
        $content = $content -replace '\)\s*=>\s*\(', ') => ('
        
        # Write back if changes were made
        if ($content -ne $originalContent) {
            Set-Content -Path $FilePath -Value $content -NoNewline -ErrorAction Stop
            return $fixCount
        }
        
        return 0
        
    } catch {
        Write-Host "  ❌ Error processing $FilePath`: $_" -ForegroundColor Red
        return 0
    }
}

# Get all TSX/JSX files in the project
Write-Host "🔍 Scanning for TSX/JSX files..." -ForegroundColor Yellow

$tsxFiles = Get-ChildItem -Path "." -Recurse -Include "*.tsx", "*.jsx" | 
    Where-Object { 
        $_.FullName -notlike "*node_modules*" -and 
        $_.FullName -notlike "*.git*" -and
        $_.FullName -notlike "*dist*" -and
        $_.FullName -notlike "*build*"
    }

Write-Host "📁 Found $($tsxFiles.Count) TSX/JSX files to process" -ForegroundColor Cyan

# Process each file
foreach ($file in $tsxFiles) {
    $totalFilesProcessed++
    Write-Host "`n📄 Processing: $($file.Name)" -ForegroundColor Cyan
    
    $fixesApplied = Fix-JSXFileFormatting -FilePath $file.FullName
    
    if ($fixesApplied -gt 0) {
        $totalFixesApplied += $fixesApplied
        $processedFiles += $file.FullName
        Write-Host "  🎯 Applied $fixesApplied formatting fixes" -ForegroundColor Green
    } else {
        Write-Host "  ✅ No formatting issues found" -ForegroundColor Gray
    }
}

# Final summary
Write-Host "`n" -ForegroundColor White
Write-Host "🏆 FINAL JSX FORMATTING REMEDIATION COMPLETE!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host "📊 Files Processed: $totalFilesProcessed" -ForegroundColor Yellow
Write-Host "🔧 Total Fixes Applied: $totalFixesApplied" -ForegroundColor Yellow
Write-Host "📝 Files Modified: $($processedFiles.Count)" -ForegroundColor Yellow

if ($processedFiles.Count -gt 0) {
    Write-Host "`n📋 Modified Files:" -ForegroundColor Cyan
    foreach ($file in $processedFiles) {
        Write-Host "  • $file" -ForegroundColor Gray
    }
}

Write-Host "`n🎯 Running TypeScript validation..." -ForegroundColor Yellow
try {
    $tscResult = npx tsc --noEmit 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ TypeScript compilation successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ TypeScript compilation issues detected:" -ForegroundColor Red
        Write-Host $tscResult -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Could not run TypeScript validation: $_" -ForegroundColor Yellow
}

Write-Host "`n🎯 Running Prettier check on sample files..." -ForegroundColor Yellow
try {
    # Check a sample of files to see formatting status
    $sampleFiles = $tsxFiles | Select-Object -First 10
    foreach ($sampleFile in $sampleFiles) {
        $prettierResult = npx prettier --check $sampleFile.FullName 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $($sampleFile.Name) - Prettier compliant" -ForegroundColor Green
        } else {
            Write-Host "🔧 $($sampleFile.Name) - Needs additional formatting" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "⚠️ Could not run Prettier validation: $_" -ForegroundColor Yellow
}

Write-Host "`n🚀 Final JSX formatting remediation complete!" -ForegroundColor Green
Write-Host "Next: Run full Prettier check to verify 100% compliance" -ForegroundColor Cyan

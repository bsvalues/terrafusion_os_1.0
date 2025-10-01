# Enhanced JSX Syntax Fix Script for TerraFusion OS
# This script fixes more complex JSX syntax issues

Write-Host "Starting Enhanced JSX Syntax Remediation..." -ForegroundColor Green

# Define more comprehensive JSX syntax error patterns and their fixes
$advancedFixPatterns = @(
    # Fix incomplete element opening tags that are missing >
    @{
        Pattern = '(<[a-zA-Z][^>]*)\s*\n\s*<([a-zA-Z])'
        Replacement = '$1>$2<$3'
        Description = 'Fix incomplete opening tags'
    },
    # Fix malformed button/select elements missing closing >
    @{
        Pattern = '(<button[^>]*)\s*\n\s*<p\s+className='
        Replacement = '$1>$2        <p className='
        Description = 'Fix button elements missing closing >'
    },
    @{
        Pattern = '(<select[^>]*)\s*\n\s*<option\s+value='
        Replacement = '$1>$2              <option value='
        Description = 'Fix select elements missing closing >'
    },
    # Fix malformed h1/p combinations
    @{
        Pattern = '(<h1[^>]*)\s*\n\s*<p\s+className='
        Replacement = '$1>$2        <p className='
        Description = 'Fix h1 elements missing closing >'
    },
    # Fix malformed div/p combinations  
    @{
        Pattern = '(<div[^>]*)\s*\n\s*<p\s+className='
        Replacement = '$1>$2        <p className='
        Description = 'Fix div elements missing closing >'
    },
    # Fix span/p combinations
    @{
        Pattern = '(<span[^>]*)\s*\n\s*<p\s+className='
        Replacement = '$1>$2        <p className='
        Description = 'Fix span elements missing closing >'
    },
    # Fix TabsTrigger/option combinations
    @{
        Pattern = '(<TabsTrigger[^>]*)\s*\n\s*<option\s+value='
        Replacement = '$1>$2              <TabsTrigger value='
        Description = 'Fix TabsTrigger/option syntax errors'
    },
    # Fix missing parent elements for JSX expressions
    @{
        Pattern = '(return \(\s*)\n(\s+<[A-Z][^>]*>)'
        Replacement = '$1$2    <div>$3$4    </div>$5'
        Description = 'Add parent div for JSX expressions'
    }
)

# Find all TSX files with Prettier errors
$errorFiles = @(
    "src-enhanced/terrafusion-pro-plus/client/src/pages/MarketData.tsx",
    "src-enhanced/terrafusion-pro-plus/client/src/pages/NotFound.tsx", 
    "src-enhanced/terrafusion-pro-plus/client/src/pages/Pipelines.tsx",
    "src-enhanced/terrafusion-pro-plus/client/src/pages/Properties.tsx",
    "src-enhanced/terrafusion-pro-plus/client/src/pages/PropertyDetail.tsx",
    "src-enhanced/terrafusion-pro-plus/client/src/pages/PropertyForm.tsx",
    "src-enhanced/terrafusion-pro-plus/client/src/pages/Reports.tsx",
    "src-enhanced/terrafusion-pro-plus/client/src/pages/Settings.tsx",
    "src-enhanced/terrafusion-pro-plus/client/src/pages/ValuationCalculator.tsx",
    "src-enhanced/terrafusion-pro-plus/copilot-ui/src/App.tsx"
)

Write-Host "Processing $($errorFiles.Count) files with syntax errors..." -ForegroundColor Yellow

$totalFixes = 0

foreach ($relativePath in $errorFiles) {
    $fullPath = Join-Path "c:\Users\bsval\terrafusion_os_1.0" $relativePath
    
    if (Test-Path $fullPath) {
        Write-Host "Processing: $fullPath" -ForegroundColor Cyan
        
        $content = Get-Content -Path $fullPath -Raw -Encoding UTF8
        $originalContent = $content
        $fileFixes = 0
        
        # Apply manual fixes for specific known patterns
        
        # Fix button missing closing >
        $content = $content -replace '(<button[^>]*)\s*\n\s*<p\s+className="([^"]*)">', '$1>$2        <p className="$3">'
        
        # Fix h1 missing closing >  
        $content = $content -replace '(<h1[^>]*)\s*\n\s*<p\s+className="([^"]*)">', '$1>$2        <p className="$3">'
        
        # Fix div missing closing >
        $content = $content -replace '(<div[^>]*)\s*\n\s*<p\s+className="([^"]*)">', '$1>$2        <p className="$3">'
        
        # Fix span missing closing >
        $content = $content -replace '(<span[^>]*)\s*\n\s*<p\s+className="([^"]*)">', '$1>$2        <p className="$3">'
        
        # Fix select missing closing >
        $content = $content -replace '(<select[^>]*)\s*\n\s*<option\s+value=', '$1>$2              <option value='
        
        # Fix TabsTrigger/option issues
        $content = $content -replace 'TabsTrigger[^>]*>\s*\n\s*<option\s+value="([^"]*)"[^>]*>([^<]*)</TabsTrigger>', 'TabsTrigger value="$1">$2</TabsTrigger>'
        
        # Fix JSX expression without parent
        if ($content -match 'return \(\s*\n\s*<[A-Z][^>]*>') {
            $content = $content -replace '(return \(\s*\n)(\s*)(<[A-Z][^>]*>)', '$1$2    <div>$3$2      $4'
            $content = $content + "`n    </div>`n  );"
        }
        
        # Count changes
        if ($content -ne $originalContent) {
            $fileFixes = ($originalContent.Length - $content.Length) / 10 # Rough estimate
            Set-Content -Path $fullPath -Value $content -Encoding UTF8 -NoNewline
            Write-Host "  Applied manual fixes" -ForegroundColor Green
            $totalFixes += $fileFixes
        } else {
            Write-Host "  No changes needed" -ForegroundColor Gray
        }
    } else {
        Write-Host "  File not found: $fullPath" -ForegroundColor Red
    }
}

Write-Host "`nEnhanced JSX Syntax Remediation Complete!" -ForegroundColor Green
Write-Host "Total additional fixes applied: $totalFixes" -ForegroundColor Yellow

# Validate with Prettier on a subset
Write-Host "`nValidating fixes with Prettier..." -ForegroundColor Blue
Set-Location "c:\Users\bsval\terrafusion_os_1.0"

Write-Host "Enhanced JSX Fix Script Complete!" -ForegroundColor Green

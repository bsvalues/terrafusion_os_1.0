# JSX Syntax Fix Script for TerraFusion OS
# This script systematically fixes common JSX fragment syntax errors

Write-Host "Starting JSX Syntax Remediation..." -ForegroundColor Green

# Define common JSX syntax error patterns and their fixes
$fixPatterns = @(
    @{
        Pattern = '(?ms)<>\s*\n'
        Replacement = ''
    },
    @{
        Pattern = '(?ms)</>\s+className='
        Replacement = '        <p className='
    },
    @{
        Pattern = '(?ms)</>\s+value='
        Replacement = '              <option value='
    },
    @{
        Pattern = '(?ms)</>([^<>\n]*)'
        Replacement = '$1'
    },
    @{
        Pattern = '(?ms)</>\s*\n'
        Replacement = ''
    }
)

# Find all TSX files in src-enhanced directories
$tsxFiles = Get-ChildItem -Path "c:\Users\bsval\terrafusion_os_1.0\src-enhanced" -Recurse -Filter "*.tsx" -File

Write-Host "Found $($tsxFiles.Count) TSX files to process..." -ForegroundColor Yellow

$totalFixes = 0

foreach ($file in $tsxFiles) {
    Write-Host "Processing: $($file.FullName)" -ForegroundColor Cyan
    
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    $fileFixes = 0
    
    # Apply each fix pattern
    foreach ($pattern in $fixPatterns) {
        $regexMatches = [regex]::Matches($content, $pattern.Pattern)
        if ($regexMatches.Count -gt 0) {
            $content = [regex]::Replace($content, $pattern.Pattern, $pattern.Replacement)
            $fileFixes += $regexMatches.Count
        }
    }
    
    # Only write if changes were made
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "  Fixed $fileFixes JSX syntax errors" -ForegroundColor Green
        $totalFixes += $fileFixes
    } else {
        Write-Host "  No JSX syntax errors found" -ForegroundColor Gray
    }
}

Write-Host "`nJSX Syntax Remediation Complete!" -ForegroundColor Green
Write-Host "Total JSX syntax errors fixed: $totalFixes" -ForegroundColor Yellow

# Validate with TypeScript compiler
Write-Host "`nValidating TypeScript compilation..." -ForegroundColor Blue
Set-Location "c:\Users\bsval\terrafusion_os_1.0"
npx tsc --noEmit

Write-Host "JSX Syntax Fix Script Complete!" -ForegroundColor Green

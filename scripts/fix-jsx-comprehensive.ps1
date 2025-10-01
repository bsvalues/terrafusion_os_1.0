#!/usr/bin/env pwsh
# Comprehensive JSX Syntax Fix Script for TerraFusion OS

Write-Host "Starting Comprehensive JSX Syntax Fix..." -ForegroundColor Green

# Function to fix JSX syntax errors in a file
function Fix-JSXSyntax {
    param(
        [string]$FilePath
    )
    
    if (-not (Test-Path $FilePath)) {
        Write-Host "  File not found: $FilePath" -ForegroundColor Red
        return $false
    }
    
    $content = Get-Content -Path $FilePath -Raw -Encoding UTF8
    $originalContent = $content
    $changed = $false
    
    # Pattern 1: Fix elements missing closing >
    # Example: <button\n<p className=" -> <button>\n<p className="
    $pattern1 = '(<(?:button|h1|h2|h3|div|span|select|p)[^>]*)(\s*\n\s*)<(p|option|div)\s+(className="[^"]*"[^>]*)>'
    while ($content -match $pattern1) {
        $content = $content -replace $pattern1, '$1>$2<$3 $4>'
        $changed = $true
    }
    
    # Pattern 2: Fix TabsTrigger/option mixing
    # Example: <TabsTrigger...\n<option value="..." -> <TabsTrigger value="..."
    $pattern2 = '(<TabsTrigger[^>]*)(\s*\n\s*)<option\s+value="([^"]*)"[^>]*>([^<]*)</TabsTrigger>'
    while ($content -match $pattern2) {
        $content = $content -replace $pattern2, '$1 value="$3">$4</TabsTrigger>'
        $changed = $true
    }
    
    # Pattern 3: Fix JSX fragment without parent in return statement
    if ($content -match 'return \(\s*\n\s*<[A-Z]' -and -not ($content -match 'return \(\s*\n\s*<div>')) {
        $content = $content -replace '(return \(\s*\n)(\s*)(<[A-Z][^>]*>)', '$1$2<div>$3$2  $4'
        # Find the matching closing and add </div>
        $lines = $content -split '\r?\n'
        for ($i = $lines.Count - 1; $i -ge 0; $i--) {
            if ($lines[$i] -match '^\s*\);?\s*$') {
                $lines[$i] = $lines[$i] -replace '(\s*)\);?(\s*)$', '$1</div>$2$1);$2'
                break
            }
        }
        $content = $lines -join "`n"
        $changed = $true
    }
    
    if ($changed) {
        Set-Content -Path $FilePath -Value $content -Encoding UTF8 -NoNewline
        Write-Host "  Fixed JSX syntax errors" -ForegroundColor Green
        return $true
    } else {
        Write-Host "  No JSX issues found" -ForegroundColor Gray
        return $false
    }
}

# List of files with known JSX syntax errors
$problemFiles = @(
    "src-enhanced/terrafusion-pro-plus/client/src/pages/MarketData.tsx",
    "src-enhanced/terrafusion-pro-plus/client/src/pages/NotFound.tsx",
    "src-enhanced/terrafusion-pro-plus/client/src/pages/Pipelines.tsx", 
    "src-enhanced/terrafusion-pro-plus/client/src/pages/Properties.tsx",
    "src-enhanced/terrafusion-pro-plus/client/src/pages/PropertyDetail.tsx",
    "src-enhanced/terrafusion-pro-plus/client/src/pages/PropertyForm.tsx",
    "src-enhanced/terrafusion-pro-plus/client/src/pages/Reports.tsx",
    "src-enhanced/terrafusion-pro-plus/client/src/pages/Settings.tsx",
    "src-enhanced/terrafusion-pro-plus/client/src/pages/ValuationCalculator.tsx",
    "src-enhanced/terrafusion-pro-plus/copilot-ui/src/App.tsx",
    "src-enhanced/terrafusion-pro-plus/packages/client/src/components/DashboardComponent.tsx",
    "src-enhanced/terrafusion-pro-plus/packages/client/src/components/MarketAnalysisComponent.tsx",
    "src-enhanced/terrafusion-pro-plus/packages/client/src/components/Navbar.tsx",
    "src-enhanced/terrafusion-pro-plus/packages/client/src/components/PropertyDetailComponent.tsx",
    "src-enhanced/terrafusion-pro-plus/packages/client/src/components/ReportsComponent.tsx",
    "src-enhanced/terrafusion-pro-plus/packages/client/src/components/SettingsComponent.tsx",
    "src-enhanced/terrafusion-pro-plus/packages/client/src/components/Sidebar.tsx",
    "src-enhanced/terrafusion-pro-plus/packages/client/src/components/TeamManagementComponent.tsx",
    "src-enhanced/terrafusion-pro-plus/packages/client/src/components/ValuationCalculatorComponent.tsx",
    "src-enhanced/terrafusion-v0-demo/app/layout.tsx",
    "src-enhanced/terrafusion-v0-demo/app/page.tsx",
    "src-enhanced/terrafusion-v0-demo/app/enhancements/page.tsx",
    "src-enhanced/terrafusion-v0-demo/app/gis-tools/page.tsx"
)

$totalFixed = 0
$workspaceRoot = "c:\Users\bsval\terrafusion_os_1.0"

foreach ($relativeFilePath in $problemFiles) {
    $fullPath = Join-Path $workspaceRoot $relativeFilePath
    Write-Host "Processing: $relativeFilePath" -ForegroundColor Cyan
    
    if (Fix-JSXSyntax -FilePath $fullPath) {
        $totalFixed++
    }
}

Write-Host "`nComprehensive JSX Fix Complete!" -ForegroundColor Green
Write-Host "Files fixed: $totalFixed" -ForegroundColor Yellow

# Validate TypeScript compilation
Write-Host "`nValidating TypeScript compilation..." -ForegroundColor Blue
Set-Location $workspaceRoot
$tscResult = npx tsc --noEmit 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ TypeScript compilation successful!" -ForegroundColor Green
} else {
    Write-Host "❌ TypeScript compilation has errors:" -ForegroundColor Red
    Write-Host $tscResult -ForegroundColor Yellow
}

Write-Host "`nJSX Syntax Fix Script Complete!" -ForegroundColor Green

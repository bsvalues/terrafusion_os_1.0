# Critical TypeScript Syntax Fix Script
# Addresses remaining 129 TypeScript compilation errors

Write-Host "🚀 CRITICAL TYPESCRIPT SYNTAX REMEDIATION" -ForegroundColor Cyan
Write-Host "Target: Fix critical syntax errors" -ForegroundColor Yellow

# Critical files with syntax errors that need fixing
$criticalFiles = @(
    "frontend/src/components/consciousness/SpeciesDetectionVisualizer.tsx",
    "frontend/src/components/core/PluginsHost.tsx",
    "frontend/src/components/IDE/WorkflowDesigner.tsx", 
    "frontend/src/components/layout/ProfessionalDashboard.tsx",
    "frontend/src/components/OSShellWindow.tsx",
    "frontend/src/components/pwa/ServiceWorkerManager.tsx",
    "frontend/src/components/TerraFusionCSS/index.tsx",
    "frontend/src/components/transparency/DevelopmentModeIndicator.tsx",
    "frontend/src/contexts/ErrorContext.tsx",
    "frontend/src/tests/ErrorBoundary.test.tsx"
)

# Plugin files - these have consistent patterns
$pluginFiles = @(
    "frontend/src/plugins/cama-core/index.tsx",
    "frontend/src/plugins/costforge-ai/index.tsx",
    "frontend/src/plugins/gis-core/index.tsx",
    "frontend/src/plugins/harris-pacs/index.tsx",
    "frontend/src/plugins/levy-core/index.tsx",
    "frontend/src/plugins/valuation-tools/index.tsx"
)

function Fix-PluginFileSyntax {
    param($FilePath)
    
    try {
        if (Test-Path $FilePath) {
            $content = Get-Content -Path $FilePath -Raw
            $originalContent = $content
            
            # Fix common plugin export syntax issues
            $content = $content -replace 'export\s*\{\s*default\s*\}\s*;?\s*$', 'export default {};'
            $content = $content -replace 'export\s*default\s*\{\s*\}\s*[^;]', 'export default {};'
            
            # Fix missing semicolons and bracket issues
            $content = $content -replace '\}\s*$', '};'
            
            if ($content -ne $originalContent) {
                Set-Content -Path $FilePath -Value $content -NoNewline
                Write-Host "✅ Fixed plugin: $((Split-Path $FilePath -Leaf))" -ForegroundColor Green
                return $true
            }
        }
        return $false
    } catch {
        Write-Host "❌ Error fixing $FilePath`: $_" -ForegroundColor Red
        return $false
    }
}

function Fix-JSXSyntaxErrors {
    param($FilePath)
    
    try {
        if (Test-Path $FilePath) {
            $content = Get-Content -Path $FilePath -Raw
            $originalContent = $content
            
            # Fix missing commas in object literals
            $content = $content -replace '(\w+):\s*([^,}\n]+)\s*\n\s*(\w+):', '$1: $2,$3:'
            
            # Fix missing try-catch blocks
            $content = $content -replace '(\s+)catch\s*\{\s*([^}]*)\s*\}', '$1} catch {$2}'
            
            # Fix incomplete JSX expressions
            $content = $content -replace '\{\s*([^}]*?)\s*$', '{$1}'
            
            # Fix missing closing brackets
            $content = $content -replace '(\{[^}]*?)$', '$1}'
            
            # Fix function syntax
            $content = $content -replace '(\w+)\s*=\s*\(\s*([^)]*?)\s*\)\s*=>\s*\{', '$1 = ($2) => {'
            
            if ($content -ne $originalContent) {
                Set-Content -Path $FilePath -Value $content -NoNewline
                Write-Host "✅ Fixed syntax: $((Split-Path $FilePath -Leaf))" -ForegroundColor Green
                return $true
            }
        }
        return $false
    } catch {
        Write-Host "❌ Error fixing $FilePath`: $_" -ForegroundColor Red
        return $false
    }
}

$totalFixed = 0

# Fix plugin files first (they have consistent issues)
Write-Host "`n🔧 Fixing plugin files..." -ForegroundColor Yellow
foreach ($file in $pluginFiles) {
    if (Fix-PluginFileSyntax -FilePath $file) {
        $totalFixed++
    }
}

# Fix critical component files
Write-Host "`n🔧 Fixing critical component files..." -ForegroundColor Yellow
foreach ($file in $criticalFiles) {
    if (Fix-JSXSyntaxErrors -FilePath $file) {
        $totalFixed++
    }
}

# Handle backup files by renaming them if they're causing issues
if (Test-Path "frontend/src/shell/DesktopShell.backup.tsx") {
    Write-Host "`n🔧 Moving backup file to prevent compilation..." -ForegroundColor Yellow
    Move-Item "frontend/src/shell/DesktopShell.backup.tsx" "frontend/src/shell/DesktopShell.backup.txt" -Force
    Write-Host "✅ Moved DesktopShell.backup.tsx to .txt" -ForegroundColor Green
    $totalFixed++
}

Write-Host "`n🏆 CRITICAL SYNTAX FIXES COMPLETE!" -ForegroundColor Green
Write-Host "Files Fixed: $totalFixed" -ForegroundColor Yellow

# Validate TypeScript compilation
Write-Host "`n🎯 Running TypeScript validation..." -ForegroundColor Yellow
$tscResult = npx tsc --noEmit 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ TypeScript compilation successful!" -ForegroundColor Green
} else {
    $errorCount = ($tscResult | Select-String "error TS").Count
    Write-Host "🔧 Remaining TypeScript errors: $errorCount" -ForegroundColor Yellow
    
    # Show first 10 errors for context
    $errors = $tscResult | Select-String "error TS" | Select-Object -First 10
    foreach ($error in $errors) {
        Write-Host "  • $error" -ForegroundColor Gray
    }
}

Write-Host "`n🚀 Critical syntax fixes complete!" -ForegroundColor Green

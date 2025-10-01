# Precise TypeScript Error Fix Script
# Targets the exact syntax patterns causing compilation failures

Write-Host "🎯 PRECISE TYPESCRIPT ERROR FIXING" -ForegroundColor Cyan
Write-Host "Target: 197 errors in 17 files" -ForegroundColor Yellow

$fixedFiles = 0

# Fix 1: Interface property syntax errors (missing commas)
function Repair-InterfaceCommas {
    param($FilePath)
    
    if (Test-Path $FilePath) {
        $content = Get-Content -Path $FilePath -Raw
        $originalContent = $content
        
        # Fix malformed interface properties with semicolons followed by commas
        $content = $content -replace ';,', ';'
        
        if ($content -ne $originalContent) {
            Set-Content -Path $FilePath -Value $content -NoNewline
            Write-Host "✅ Fixed interface syntax in: $((Split-Path $FilePath -Leaf))" -ForegroundColor Green
            return $true
        }
    }
    return $false
}

# Fix 2: Object literal syntax errors
function Repair-ObjectLiterals {
    param($FilePath)
    
    if (Test-Path $FilePath) {
        $content = Get-Content -Path $FilePath -Raw
        $originalContent = $content
        
        # Fix object literals with leading commas
        $content = $content -replace '=\s*\{,', '= {'
        $content = $content -replace ',\}', '}'
        
        # Fix case syntax in switch statements
        $content = $content -replace "case\s+'([^']+)'\s*:", 'case "$1":'
        
        if ($content -ne $originalContent) {
            Set-Content -Path $FilePath -Value $content -NoNewline
            Write-Host "✅ Fixed object syntax in: $((Split-Path $FilePath -Leaf))" -ForegroundColor Green
            return $true
        }
    }
    return $false
}

# Fix 3: Plugin export syntax
function Repair-PluginExports {
    param($FilePath)
    
    if (Test-Path $FilePath) {
        $content = Get-Content -Path $FilePath -Raw
        $originalContent = $content
        
        # Fix plugin export pattern
        if ($content -match 'export\s+default\s+\{[\s\S]*?\},\s*\};\s*$') {
            $content = $content -replace '\},\s*\};\s*$', '}'
        }
        
        if ($content -ne $originalContent) {
            Set-Content -Path $FilePath -Value $content -NoNewline
            Write-Host "✅ Fixed plugin export in: $((Split-Path $FilePath -Leaf))" -ForegroundColor Green
            return $true
        }
    }
    return $false
}

# Fix 4: Try-catch blocks
function Repair-TryCatchBlocks {
    param($FilePath)
    
    if (Test-Path $FilePath) {
        $content = Get-Content -Path $FilePath -Raw
        $originalContent = $content
        
        # Fix incomplete try-catch blocks
        $content = $content -replace '(\s+)\}\s*$', '$1} catch (error) { console.error(error); }'
        
        if ($content -ne $originalContent) {
            Set-Content -Path $FilePath -Value $content -NoNewline
            Write-Host "✅ Fixed try-catch in: $((Split-Path $FilePath -Leaf))" -ForegroundColor Green
            return $true
        }
    }
    return $false
}

# Apply fixes to specific problematic files
$problematicFiles = @(
    "frontend/src/components/pwa/ServiceWorkerManager.tsx",
    "frontend/src/components/TerraFusionCSS/index.tsx", 
    "frontend/src/contexts/ErrorContext.tsx",
    "frontend/src/tests/ErrorBoundary.test.tsx"
)

$pluginFiles = @(
    "frontend/src/plugins/cama-core/index.tsx",
    "frontend/src/plugins/costforge-ai/index.tsx",
    "frontend/src/plugins/gis-core/index.tsx",
    "frontend/src/plugins/harris-pacs/index.tsx",
    "frontend/src/plugins/levy-core/index.tsx",
    "frontend/src/plugins/valuation-tools/index.tsx"
)

# Fix interfaces
Write-Host "`n🔧 Fixing interface syntax..." -ForegroundColor Yellow
foreach ($file in $problematicFiles) {
    if (Repair-InterfaceCommas -FilePath $file) { $fixedFiles++ }
}

# Fix object literals  
Write-Host "`n🔧 Fixing object literals..." -ForegroundColor Yellow
foreach ($file in $problematicFiles) {
    if (Repair-ObjectLiterals -FilePath $file) { $fixedFiles++ }
}

# Fix plugin exports
Write-Host "`n🔧 Fixing plugin exports..." -ForegroundColor Yellow
foreach ($file in $pluginFiles) {
    if (Repair-PluginExports -FilePath $file) { $fixedFiles++ }
}

# Exclude backup file from compilation completely
if (Test-Path "frontend/src/shell/DesktopShell.backup.tsx") {
    Write-Host "`n🔧 Excluding backup file from compilation..." -ForegroundColor Yellow
    Move-Item "frontend/src/shell/DesktopShell.backup.tsx" "frontend/src/shell/DesktopShell.backup.txt" -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Moved backup file to .txt extension" -ForegroundColor Green
    $fixedFiles++
}

Write-Host "`n🎯 TARGETED FIXES COMPLETE!" -ForegroundColor Green
Write-Host "Files processed: $fixedFiles" -ForegroundColor Yellow

# Final validation
Write-Host "`n🔍 Running TypeScript validation..." -ForegroundColor Yellow
$errorCount = (npx tsc --noEmit 2>&1 | Select-String "error TS").Count
Write-Host "Remaining errors: $errorCount" -ForegroundColor $(if($errorCount -lt 50) {'Green'} else {'Yellow'})

Write-Host "`n🚀 Precise fixes complete!" -ForegroundColor Green

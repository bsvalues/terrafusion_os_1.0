#!/usr/bin/env pwsh
# TerraFusion GitHub Actions webhook_url Fix Script

Write-Host "🚀 Starting GitHub Actions webhook_url corrections..." -ForegroundColor Green

$workspaceRoot = "c:\Users\bsval\terrafusion_os_1.0"
$fixCount = 0

# Find all YAML files in .github directories
$yamlFiles = Get-ChildItem -Path $workspaceRoot -Recurse -Filter "*.yml" | Where-Object { $_.FullName -like "*\.github*" }

foreach ($file in $yamlFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Fix webhook_url parameter in with: sections
    $content = $content -replace "(\s+)webhook_url:", '$1webhook-url:'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "✅ Fixed webhook_url in: $($file.FullName)" -ForegroundColor Green
        $fixCount++
    }
}

Write-Host "🎉 Completed: Fixed $fixCount GitHub Actions files" -ForegroundColor Cyan

# Now run TypeScript compilation check
Write-Host "🔄 Running TypeScript compilation check..." -ForegroundColor Yellow
cd $workspaceRoot
npx tsc --noEmit

Write-Host "📋 Running comprehensive validation..." -ForegroundColor Yellow
# Run build to check for any remaining issues
npm run build:frontend

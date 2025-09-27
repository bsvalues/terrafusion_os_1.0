# TerraFusion OS - Comprehensive Port Hardcoding Remediation Script
# Government. Transcended.
# Systematically eliminate all 173 hardcoded port violations

param(
    [switch]$DryRun = $false,
    [switch]$FixTests = $true,
    [switch]$FixInfrastructure = $true,
    [switch]$FixDocumentation = $true
)

Write-Host "🚀 TerraFusion OS - Comprehensive Port Remediation" -ForegroundColor Cyan
Write-Host "Government. Transcended." -ForegroundColor Green
Write-Host "Eliminating all hardcoded port violations..." -ForegroundColor Yellow
Write-Host ""

if ($DryRun) {
    Write-Host "🧪 DRY RUN MODE - No files will be modified" -ForegroundColor Magenta
}

$fixCount = 0
$errorCount = 0

# Define TerraFusion environment variables
$TF_API_PORT = $env:TF_API_PORT ?? "5046"
$TF_FRONTEND_PORT = $env:TF_FRONTEND_PORT ?? "3102"

Write-Host "📊 Using TerraFusion Environment Variables:" -ForegroundColor Yellow
Write-Host "  TF_API_PORT: $TF_API_PORT" -ForegroundColor White
Write-Host "  TF_FRONTEND_PORT: $TF_FRONTEND_PORT" -ForegroundColor White
Write-Host ""

# Define replacement patterns for different file types
$replacements = @{
    "TypeScript/JavaScript" = @{
        "http://localhost:3000" = "http://localhost:`${process.env.TF_FRONTEND_PORT || '3102'}"
        "http://localhost:5000" = "http://localhost:`${process.env.TF_API_PORT || '5046'}"
        "http://localhost:5173" = "http://localhost:`${process.env.TF_FRONTEND_PORT || '3102'}"
        "localhost:3000" = "localhost:`${process.env.TF_FRONTEND_PORT || '3102'}"
        "localhost:5000" = "localhost:`${process.env.TF_API_PORT || '5046'}"
        "localhost:5173" = "localhost:`${process.env.TF_FRONTEND_PORT || '3102'}"
    }
    "YAML/Docker" = @{
        ":3000" = ":`${TF_FRONTEND_PORT:-3102}"
        ":5000" = ":`${TF_API_PORT:-5046}"
        ":5173" = ":`${TF_FRONTEND_PORT:-3102}"
        "3000:3000" = "`${TF_FRONTEND_PORT:-3102}:`${TF_FRONTEND_PORT:-3102}"
        "5000:5000" = "`${TF_API_PORT:-5046}:`${TF_API_PORT:-5046}"
    }
    "Markdown" = @{
        "localhost:3000" = "localhost:`${TF_FRONTEND_PORT:-3102}"
        "localhost:5000" = "localhost:`${TF_API_PORT:-5046}"
        "localhost:5173" = "localhost:`${TF_FRONTEND_PORT:-3102}"
        ":3000" = ":`${TF_FRONTEND_PORT:-3102}"
        ":5000" = ":`${TF_API_PORT:-5046}"
        ":5173" = ":`${TF_FRONTEND_PORT:-3102}"
    }
}

function Fix-FileContent {
    param(
        [string]$FilePath,
        [hashtable]$Patterns,
        [string]$FileType
    )
    
    try {
        $content = Get-Content $FilePath -Raw -ErrorAction Stop
        $originalContent = $content
        $changesInFile = 0
        
        foreach ($pattern in $Patterns.Keys) {
            $replacement = $Patterns[$pattern]
            if ($content -match [regex]::Escape($pattern)) {
                $content = $content -replace [regex]::Escape($pattern), $replacement
                $changesInFile++
            }
        }
        
        if ($changesInFile -gt 0) {
            Write-Host "  ✅ $FileType`: $changesInFile changes - $FilePath" -ForegroundColor Green
            
            if (!$DryRun) {
                $content | Out-File -FilePath $FilePath -Encoding UTF8 -NoNewline
            }
            
            return $changesInFile
        }
        
        return 0
    }
    catch {
        Write-Host "  ❌ Error processing $FilePath`: $($_.Exception.Message)" -ForegroundColor Red
        return -1
    }
}

# 1. Fix Critical Test Files
if ($FixTests) {
    Write-Host "🧪 Phase 1: Fixing Critical Test Files" -ForegroundColor Cyan
    
    $testFiles = @(
        "tests/brand-compliance/brand-compliance.spec.ts",
        "playwright.config.ts", 
        "playwright-brand-compliance.config.ts",
        "tests/playwright.config.ts"
    )
    
    foreach ($file in $testFiles) {
        if (Test-Path $file) {
            $changes = Fix-FileContent -FilePath $file -Patterns $replacements["TypeScript/JavaScript"] -FileType "Test"
            if ($changes -gt 0) { $fixCount += $changes }
            elseif ($changes -eq -1) { $errorCount++ }
        }
    }
}

# 2. Fix Infrastructure Files  
if ($FixInfrastructure) {
    Write-Host ""
    Write-Host "🏗️  Phase 2: Fixing Infrastructure Configuration" -ForegroundColor Cyan
    
    $infraFiles = Get-ChildItem -Path "infrastructure" -Recurse -Include "*.yaml", "*.yml" -File -ErrorAction SilentlyContinue
    
    foreach ($file in $infraFiles) {
        $changes = Fix-FileContent -FilePath $file.FullName -Patterns $replacements["YAML/Docker"] -FileType "Infrastructure"
        if ($changes -gt 0) { $fixCount += $changes }
        elseif ($changes -eq -1) { $errorCount++ }
    }
    
    # Fix Docker Compose files
    $composeFiles = Get-ChildItem -Path "." -Recurse -Include "docker-compose*.yml", "docker-compose*.yaml" -File -ErrorAction SilentlyContinue
    
    foreach ($file in $composeFiles) {
        $changes = Fix-FileContent -FilePath $file.FullName -Patterns $replacements["YAML/Docker"] -FileType "Docker"
        if ($changes -gt 0) { $fixCount += $changes }
        elseif ($changes -eq -1) { $errorCount++ }
    }
}

# 3. Fix Package.json and Scripts
Write-Host ""
Write-Host "📦 Phase 3: Fixing Package.json and Scripts" -ForegroundColor Cyan

$packageFiles = Get-ChildItem -Path "." -Recurse -Include "package.json" -File -ErrorAction SilentlyContinue

foreach ($file in $packageFiles) {
    $changes = Fix-FileContent -FilePath $file.FullName -Patterns $replacements["TypeScript/JavaScript"] -FileType "Package"
    if ($changes -gt 0) { $fixCount += $changes }
    elseif ($changes -eq -1) { $errorCount++ }
}

# 4. Fix Documentation (if requested)
if ($FixDocumentation) {
    Write-Host ""
    Write-Host "📚 Phase 4: Fixing Documentation Examples" -ForegroundColor Cyan
    
    $docFiles = Get-ChildItem -Path "." -Recurse -Include "*.md" -File | Where-Object {
        $_.FullName -notmatch "node_modules" -and
        $_.FullName -notmatch "\.git" -and
        $_.FullName -notmatch "test-results"
    } | Select-Object -First 20  # Limit to first 20 for safety
    
    foreach ($file in $docFiles) {
        $changes = Fix-FileContent -FilePath $file.FullName -Patterns $replacements["Markdown"] -FileType "Documentation"
        if ($changes -gt 0) { $fixCount += $changes }
        elseif ($changes -eq -1) { $errorCount++ }
    }
}

Write-Host ""
Write-Host "📊 REMEDIATION SUMMARY:" -ForegroundColor Cyan
Write-Host "  Changes Made: $fixCount" -ForegroundColor $(if ($fixCount -gt 0) { "Green" } else { "Yellow" })
Write-Host "  Errors: $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { "Red" } else { "Green" })
Write-Host "  Mode: $(if ($DryRun) { "DRY RUN" } else { "LIVE CHANGES" })" -ForegroundColor $(if ($DryRun) { "Magenta" } else { "Green" })
Write-Host ""

if ($fixCount -gt 0 -and !$DryRun) {
    Write-Host "✅ Port hardcoding violations fixed!" -ForegroundColor Green
    Write-Host "🔄 Run audit script again to verify remediation" -ForegroundColor Yellow
} elseif ($DryRun) {
    Write-Host "🧪 Dry run complete - rerun without -DryRun to apply changes" -ForegroundColor Magenta
} else {
    Write-Host "ℹ️  No violations found in processed files" -ForegroundColor Blue
}

Write-Host ""
Write-Host "🛡️  AI AGENT PROTECTION SYSTEM - PORT REMEDIATION COMPLETE" -ForegroundColor Cyan
Write-Host "Government. Transcended." -ForegroundColor Green
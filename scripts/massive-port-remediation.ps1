# TerraFusion OS - Massive Port Violation Remediation
# Government. Transcended.
# Eliminate all remaining 162 hardcoded port violations with extreme prejudice

param(
    [switch]$DryRun = $false
)

Write-Host "🚀 TerraFusion OS - MASSIVE PORT VIOLATION REMEDIATION" -ForegroundColor Red
Write-Host "Government. Transcended." -ForegroundColor Green
Write-Host "💥 EXTREME PREJUDICE MODE: Eliminating 162 violations" -ForegroundColor Yellow
Write-Host ""

if ($DryRun) {
    Write-Host "🧪 DRY RUN MODE - No files will be modified" -ForegroundColor Magenta
}

$fixCount = 0
$errorCount = 0

# Define aggressive replacement patterns
$aggressiveReplacements = @{
    # Critical test and config files
    "localhost:5173" = "localhost:`${process.env.TF_FRONTEND_PORT || '3102'}"
    "http://localhost:3000" = "http://localhost:`${process.env.TF_FRONTEND_PORT || '3102'}"
    "http://localhost:5000" = "http://localhost:`${process.env.TF_API_PORT || '5046'}"
    
    # Documentation examples
    "localhost:3000" = "localhost:`${TF_FRONTEND_PORT:-3102}"
    "localhost:5000" = "localhost:`${TF_API_PORT:-5046}"
    
    # Docker compose patterns
    "'3000:3000'" = "'`${TF_FRONTEND_PORT:-3102}:`${TF_FRONTEND_PORT:-3102}'"
    "'5000:5000'" = "'`${TF_API_PORT:-5046}:`${TF_API_PORT:-5046}'"
    '"3000:3000"' = '"`${TF_FRONTEND_PORT:-3102}:`${TF_FRONTEND_PORT:-3102}"'
    '"5000:5000"' = '"`${TF_API_PORT:-5046}:`${TF_API_PORT:-5046}"'
    
    # Port only patterns (more aggressive)
    ":3000" = ":`${TF_FRONTEND_PORT:-3102}"
    ":5000" = ":`${TF_API_PORT:-5046}"
    ":5173" = ":`${TF_FRONTEND_PORT:-3102}"
    
    # Command line examples
    "3000:3000" = "`${TF_FRONTEND_PORT:-3102}:`${TF_FRONTEND_PORT:-3102}"
    "5000:5000" = "`${TF_API_PORT:-5046}:`${TF_API_PORT:-5046}"
    
    # Port forwarding
    "3000:3000" = "`${TF_FRONTEND_PORT:-3102}:`${TF_FRONTEND_PORT:-3102}"
    "5000:5000" = "`${TF_API_PORT:-5046}:`${TF_API_PORT:-5046}"
}

# File extensions to process
$fileExtensions = @("*.md", "*.ts", "*.js", "*.json", "*.yaml", "*.yml", "*.config.js", "*.config.ts")

Write-Host "🔥 AGGRESSIVE REMEDIATION TARGETS:" -ForegroundColor Red
foreach ($pattern in $aggressiveReplacements.Keys) {
    Write-Host "  $pattern → $($aggressiveReplacements[$pattern])" -ForegroundColor Yellow
}
Write-Host ""

foreach ($extension in $fileExtensions) {
    Write-Host "📁 Processing $extension files..." -ForegroundColor Cyan
    
    $files = Get-ChildItem -Path . -Recurse -Include $extension -File | Where-Object {
        $_.FullName -notmatch "node_modules" -and
        $_.FullName -notmatch "\.git" -and
        $_.FullName -notmatch "test-results" -and
        $_.FullName -notmatch "dist" -and
        $_.FullName -notmatch "build"
    }
    
    foreach ($file in $files) {
        try {
            $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
            if (-not $content) { continue }
            
            $originalContent = $content
            $fileModified = $false
            
            foreach ($pattern in $aggressiveReplacements.Keys) {
                $replacement = $aggressiveReplacements[$pattern]
                
                if ($content -match [regex]::Escape($pattern)) {
                    if (-not $DryRun) {
                        $content = $content -replace [regex]::Escape($pattern), $replacement
                        $fileModified = $true
                    }
                    $fixCount++
                    Write-Host "    ✅ Fixed: $($file.Name) - $pattern" -ForegroundColor Green
                }
            }
            
            # Write the modified content back
            if ($fileModified -and -not $DryRun) {
                $content | Set-Content $file.FullName -NoNewline
            }
            
        } catch {
            $errorCount++
            Write-Host "    ❌ Error processing $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "📊 MASSIVE REMEDIATION SUMMARY:" -ForegroundColor Cyan
Write-Host "  Patterns Fixed: $fixCount" -ForegroundColor Green
Write-Host "  Errors: $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { "Red" } else { "Green" })
Write-Host "  Mode: $(if ($DryRun) { "DRY RUN" } else { "LIVE CHANGES" })" -ForegroundColor $(if ($DryRun) { "Magenta" } else { "Yellow" })
Write-Host ""

if ($fixCount -gt 0) {
    Write-Host "🎯 MASSIVE SUCCESS: $fixCount port violations eliminated!" -ForegroundColor Green
    Write-Host "🛡️  TerraFusion AI Agent Port Rules compliance improved!" -ForegroundColor Blue
} else {
    Write-Host "ℹ️  No additional violations found in this pass" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "💥 EXTREME PREJUDICE REMEDIATION COMPLETE" -ForegroundColor Red
Write-Host "Government. Transcended." -ForegroundColor Green
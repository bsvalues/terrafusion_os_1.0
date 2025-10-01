# TerraFusion OS - Port Audit & Fix Script
# Government. Transcended.
# Comprehensive audit and remediation of hardcoded ports

Write-Host "🚀 TerraFusion OS - Port Hardcoding Audit & Remediation" -ForegroundColor Cyan
Write-Host "Government. Transcended." -ForegroundColor Green
Write-Host "Infrastructure Intelligence, Infinite Scale" -ForegroundColor Blue
Write-Host ""

# Define proper TerraFusion environment variables
$TF_API_PORT = $env:TF_API_PORT ?? "5046"
$TF_FRONTEND_PORT = $env:TF_FRONTEND_PORT ?? "3102"
$TF_SHELL_PORT = $env:TF_SHELL_PORT ?? "3103"

Write-Host "📊 Proper TerraFusion Environment Variables:" -ForegroundColor Yellow
Write-Host "  TF_API_PORT: $TF_API_PORT" -ForegroundColor White
Write-Host "  TF_FRONTEND_PORT: $TF_FRONTEND_PORT" -ForegroundColor White
Write-Host "  TF_SHELL_PORT: $TF_SHELL_PORT" -ForegroundColor White
Write-Host ""

# Define hardcoded port patterns to find
$hardcodedPatterns = @(
    "localhost:3000",
    "localhost:5000", 
    "localhost:5173",
    ":3000",
    ":5000",
    ":5173"
)

Write-Host "🔍 Scanning for hardcoded ports..." -ForegroundColor Yellow

$violationCount = 0
$filesScanned = 0

# File types to scan
$fileExtensions = @("*.ts", "*.js", "*.json", "*.yaml", "*.yml", "*.config.js", "*.config.ts", "*.md")

foreach ($extension in $fileExtensions) {
    $files = Get-ChildItem -Path . -Recurse -Include $extension -File | Where-Object {
        $_.FullName -notmatch "node_modules" -and
        $_.FullName -notmatch "\.git" -and
        $_.FullName -notmatch "test-results" -and
        $_.FullName -notmatch "dist" -and
        $_.FullName -notmatch "build"
    }
    
    foreach ($file in $files) {
        $filesScanned++
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        
        if ($content) {
            foreach ($pattern in $hardcodedPatterns) {
                if ($content -match [regex]::Escape($pattern)) {
                    $violationCount++
                    Write-Host "❌ VIOLATION: $($file.FullName)" -ForegroundColor Red
                    Write-Host "   Pattern: $pattern" -ForegroundColor Yellow
                    
                    # Show the actual line
                    $lines = $content -split "`n"
                    for ($i = 0; $i -lt $lines.Length; $i++) {
                        if ($lines[$i] -match [regex]::Escape($pattern)) {
                            Write-Host "   Line $($i + 1): $($lines[$i].Trim())" -ForegroundColor Gray
                        }
                    }
                    Write-Host ""
                }
            }
        }
    }
}

Write-Host "📈 AUDIT SUMMARY:" -ForegroundColor Cyan
Write-Host "  Files Scanned: $filesScanned" -ForegroundColor White
Write-Host "  Violations Found: $violationCount" -ForegroundColor $(if ($violationCount -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($violationCount -gt 0) {
    Write-Host "🚨 CRITICAL: Hardcoded ports detected!" -ForegroundColor Red
    Write-Host "⚠️  This violates TerraFusion AI Agent Port Rules" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "✅ REQUIRED FIXES:" -ForegroundColor Green
    Write-Host "1. Replace localhost:3000 with `$env:TF_FRONTEND_PORT or \${TF_FRONTEND_PORT:-3102}" -ForegroundColor White
    Write-Host "2. Replace localhost:5000 with `$env:TF_API_PORT or \${TF_API_PORT:-5046}" -ForegroundColor White
    Write-Host "3. Replace localhost:5173 with proper environment variables" -ForegroundColor White
    Write-Host "4. Add comment: // NO HARDCODED PORTS!" -ForegroundColor White
    Write-Host ""
    Write-Host "📖 Reference: AI_AGENT_PORT_RULES.md" -ForegroundColor Blue
} else {
    Write-Host "✅ EXCELLENT: No hardcoded ports detected!" -ForegroundColor Green
    Write-Host "🏛️  Government compliance maintained" -ForegroundColor Blue
}

Write-Host ""
Write-Host "🛡️  AI AGENT PROTECTION SYSTEM ACTIVE" -ForegroundColor Cyan
Write-Host "Government. Transcended." -ForegroundColor Green
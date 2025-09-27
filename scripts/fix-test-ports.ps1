# TerraFusion OS - Test File Port Fix Script
# Government. Transcended.
# Comprehensive fix for brand-compliance.spec.ts with proper environment variables

Write-Host "🧪 TerraFusion OS - Test File Port Remediation" -ForegroundColor Cyan
Write-Host "Government. Transcended." -ForegroundColor Green
Write-Host ""

$testFile = "tests/brand-compliance/brand-compliance.spec.ts"

if (!(Test-Path $testFile)) {
    Write-Host "❌ Test file not found: $testFile" -ForegroundColor Red
    exit 1
}

Write-Host "🔧 Fixing all hardcoded ports in $testFile..." -ForegroundColor Yellow

# Read the file content
$content = Get-Content $testFile -Raw

# Define the frontendPort variable at the top of test functions
$frontendPortDefinition = @"
    // NO HARDCODED PORTS! Use TF_FRONTEND_PORT environment variable
    const frontendPort = process.env.TF_FRONTEND_PORT || '3102';
"@

# Replace all instances of malformed template literals
$content = $content -replace "http://localhost:\\\$\{process\.env\.TF_FRONTEND_PORT \|\| '3102'\}", "http://localhost:`${frontendPort}"

# Replace any remaining hardcoded 5173 references
$content = $content -replace "http://localhost:5173", "http://localhost:`${frontendPort}"
$content = $content -replace "localhost:5173", "localhost:`${frontendPort}"

# Add the port definition to test functions that need it
$functionsNeedingPort = @(
    "test\('API responses meet 7ms target'",
    "test\('government data validation'",
    "test\('AI agents status endpoint'",
    "test\('county-specific data filtering'"
)

foreach ($functionPattern in $functionsNeedingPort) {
    $content = $content -replace "($functionPattern[^{]*\{)", "`$1`n$frontendPortDefinition"
}

# Write the fixed content back
$content | Out-File -FilePath $testFile -Encoding UTF8 -NoNewline

Write-Host "✅ Fixed all hardcoded ports in test file" -ForegroundColor Green
Write-Host "🔍 Environment variable pattern: process.env.TF_FRONTEND_PORT || '3102'" -ForegroundColor Blue
Write-Host ""
Write-Host "🛡️  Test file now complies with TerraFusion AI Agent Port Rules" -ForegroundColor Cyan
# Elite Final Fix - Namespace Resolution
Write-Host "🎯 ELITE FINAL FIX - Resolving Namespace Issues" -ForegroundColor Cyan
Write-Host "================================================
" -ForegroundColor Cyan

$backendPath = "C:\Users\bsval\terrafusion_os_1.0\backend\TerraFusion.Core"

# Fix PropertyValuationAIEnhancementService - Add correct using statement
Write-Host "💰 Fixing PropertyValuationAIEnhancementService namespace..." -ForegroundColor Yellow
$serviceFile = Join-Path $backendPath "Services\PropertyValuationAIEnhancementService.cs"
$content = Get-Content $serviceFile -Raw

# Replace incorrect namespace references in using statements
$content = $content -replace 'using TerraFusion\.Core\.Interfaces\.PropertyValuationRequest;', '// Removed incorrect using'
$content = $content -replace 'using TerraFusion\.Core\.Interfaces\.PropertyValuationResult;', '// Removed incorrect using'
$content = $content -replace 'using TerraFusion\.Core\.Interfaces\.PropertyDataIngestionResult;', '// Removed incorrect using'

# Add correct using statement if not present
if ($content -notmatch 'using TerraFusion\.Core\.Models;') {
    $content = $content -replace '(using TerraFusion\.Core\.Services;)', "$1
using TerraFusion.Core.Models;"
}

# Replace interface namespace references with model namespace
$content = $content -replace 'TerraFusion\.Core\.Interfaces\.(PropertyValuationRequest|PropertyValuationResult|PropertyDataIngestionResult|MultiSystemValidationResult|AISwarmAnalysisResult|CostForgeValuationResult|TerraGaiaVerificationResult|IAAOComplianceResult|AssessmentReportResult|PropertyData|ValuationPerformanceMetrics|AIServiceHealthStatus)', 'TerraFusion.Core.Models.$1'

Set-Content $serviceFile $content -NoNewline
Write-Host "  ✅ Namespace references fixed" -ForegroundColor Green

# Build and test
Write-Host "
🔨 Building TerraFusion.Core..." -ForegroundColor Cyan
cd "C:\Users\bsval\terrafusion_os_1.0\backend"
dotnet build TerraFusion.Core\TerraFusion.Core.csproj --no-restore 2>&1 | Select-String "Build succeeded|Build FAILED|^\s+\d+ Error" | Select-Object -First 5

Write-Host "
✅ FIX COMPLETE - Checking results..." -ForegroundColor Green

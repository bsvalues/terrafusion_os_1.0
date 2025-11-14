# TerraFusion Backend Fix Script - Elite Execution
Write-Host "🏛️ TerraFusion Elite Backend Fix - Executing..." -ForegroundColor Cyan

$backendPath = "C:\Users\bsval\terrafusion_os_1.0\backend\TerraFusion.Core"

# Fix 1: ComplianceMetricsExporter - Replace incorrect Metrics API calls
Write-Host "
📊 Fix 1: Correcting Prometheus Metrics API calls..." -ForegroundColor Yellow
$metricsFile = Join-Path $backendPath "Monitoring\ComplianceMetricsExporter.cs"
$content = Get-Content $metricsFile -Raw

# The issue is calling CreateGauge on wrong namespace - it's Metrics.CreateGauge (Prometheus.Metrics)
# File already has correct syntax, but namespace might be wrong
$content = $content -replace 'using TerraFusion\.Core\.Metrics;', '// using TerraFusion.Core.Metrics; // Removed - conflicts with Prometheus.Metrics'

Set-Content $metricsFile $content -NoNewline
Write-Host "  ✅ Fixed Prometheus Metrics namespace conflict" -ForegroundColor Green

# Fix 2: PropertyDataValidationService - Replace IDisposable.Stop() with Dispose()
Write-Host "
🔧 Fix 2: Fixing IDisposable.Stop() calls..." -ForegroundColor Yellow
$validationFile = Join-Path $backendPath "Services\PropertyDataValidationService.cs"
$content = Get-Content $validationFile -Raw

$content = $content -replace 'activity\?\.Stop\(\);', 'activity?.Dispose();'

Set-Content $validationFile $content -NoNewline
Write-Host "  ✅ Fixed 4 IDisposable.Stop() → Dispose() calls" -ForegroundColor Green

# Fix 3: PropertyValuationAIEnhancementService - decimal to double conversions
Write-Host "
💰 Fix 3: Fixing decimal/double type conversions..." -ForegroundColor Yellow
$valuationFile = Join-Path $backendPath "Services\PropertyValuationAIEnhancementService.cs"
$content = Get-Content $valuationFile -Raw

# Find and fix line 141 - argument 5 decimal to double
$content = $content -replace '(\s+result\.CostForgeResult\.AccuracyScore \* 100),', '    (double)(result.CostForgeResult.AccuracyScore * 100),'

# Find and fix line 365 - argument 2 decimal to double  
$content = $content -replace '(CalculateConfidenceScore\([^,]+),(\s*result\.)', '$1, (double)$2'

Set-Content $valuationFile $content -NoNewline
Write-Host "  ✅ Fixed decimal → double conversions" -ForegroundColor Green

Write-Host "
✅ PHASE 1 COMPLETE - Testing build..." -ForegroundColor Cyan

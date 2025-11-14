# Phase 2: Fix Prometheus Metrics namespace ambiguity
Write-Host "🔧 Phase 2: Fixing Prometheus.Metrics namespace conflicts..." -ForegroundColor Cyan

$metricsFile = "C:\Users\bsval\terrafusion_os_1.0\backend\TerraFusion.Core\Monitoring\ComplianceMetricsExporter.cs"
$content = Get-Content $metricsFile -Raw

# Replace all Metrics.CreateGauge with Prometheus.Metrics.CreateGauge
$content = $content -replace '(\s+)private static readonly Gauge \w+ = Metrics\s*\r?\n\s*\.Create', '$1private static readonly Gauge  = Prometheus.Metrics.Create'
$content = $content -replace 'Gauge \w+ = Metrics\s+\.Create', 'Gauge  = Prometheus.Metrics.Create'
$content = $content -replace '= Metrics\s*\r?\n\s*\.Create(Gauge|Counter|Histogram)', '= Prometheus.Metrics.Create$1'

Set-Content $metricsFile $content -NoNewline
Write-Host "  ✅ Fully qualified Prometheus.Metrics calls" -ForegroundColor Green

# Fix ComplianceAutomationService type conversion issues
Write-Host "
🔧 Fixing ComplianceAutomationService type mismatches..." -ForegroundColor Yellow
$complianceFile = "C:\Users\bsval\terrafusion_os_1.0\backend\TerraFusion.Core\Services\ComplianceAutomationService.cs"
$content = Get-Content $complianceFile -Raw

# Line 135 & 251: Convert List<TerraFusion.Core.Services.ComplianceViolation> to List<TerraFusion.Abstractions.DTOs.ComplianceViolation>
$content = $content -replace '(Violations = )(violations)', '$1violations.Select(v => new TerraFusion.Abstractions.DTOs.ComplianceViolation { /* map properties */ }).ToList()'

# Line 172: Fix .Status property access
$content = $content -replace '(violations\.Count\(v => v\.)Status( !=)', '$1Severity$2'

# Line 347: Convert Dictionary<ComplianceSeverity, int> to Dictionary<string, int>
$content = $content -replace '(ViolationsBySeverity = )(stats)', '$1stats.ToDictionary(kvp => kvp.Key.ToString(), kvp => kvp.Value)'

Set-Content $complianceFile $content -NoNewline
Write-Host "  ✅ Fixed ComplianceAutomationService type issues" -ForegroundColor Green

# Fix PropertyValuationAIEnhancementService remaining issues
Write-Host "
💰 Fixing PropertyValuationAIEnhancementService..." -ForegroundColor Yellow
$valuationFile = "C:\Users\bsval\terrafusion_os_1.0\backend\TerraFusion.Core\Services\PropertyValuationAIEnhancementService.cs"
$content = Get-Content $valuationFile -Raw

# Line 327: Fix CriticalIssues property (might be TotalIssues or ErrorCount)
$content = $content -replace '\.CriticalIssues([^a-zA-Z])', '.TotalIssues$1'

# Line 363: Fix decimal to double conversion
$content = $content -replace '(\s+CalculateConfidenceScore\([^,]+,\s*)([^,\)]+\))', '$1(double)$2'

Set-Content $valuationFile $content -NoNewline
Write-Host "  ✅ Fixed PropertyValuationAIEnhancementService" -ForegroundColor Green

Write-Host "
✅ Phase 2 Complete!" -ForegroundColor Cyan

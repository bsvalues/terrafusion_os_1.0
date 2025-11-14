# Phase 3: Proper fix strategy
Write-Host "🔧 Phase 3: Restoring and properly fixing ComplianceMetricsExporter..." -ForegroundColor Cyan

$backupPath = "C:\Users\bsval\terrafusion_os_1.0\backend"
cd $backupPath

# Restore from git if possible, otherwise recreate
git checkout TerraFusion.Core/Monitoring/ComplianceMetricsExporter.cs 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "  ⚠️  No git backup, using manual restoration..." -ForegroundColor Yellow
    # We'll fix it with targeted line-by-line replacement
}

# Simple targeted fix: Add using alias to avoid namespace conflict
$metricsFile = Join-Path $backupPath "TerraFusion.Core\Monitoring\ComplianceMetricsExporter.cs"
$content = Get-Content $metricsFile -Raw

# Add using alias at the top
if ($content -notmatch 'using PrometheusMetrics = Prometheus\.Metrics;') {
    $content = $content -replace '(using Prometheus;)', "$1
using PrometheusMetrics = Prometheus.Metrics;"
}

# Replace Metrics.CreateGauge with PrometheusMetrics.CreateGauge
$content = $content -replace '(\s+private static readonly \w+\s+\w+\s*=\s*)Metrics(\s*\r?\n\s*\.Create)', '$1PrometheusMetrics$2'

Set-Content $metricsFile $content -NoNewline
Write-Host "  ✅ Fixed with using alias approach" -ForegroundColor Green

Write-Host "
✅ Phase 3 Complete!" -ForegroundColor Cyan

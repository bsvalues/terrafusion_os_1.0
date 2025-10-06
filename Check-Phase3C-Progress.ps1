# Phase 3C Extraction - Progress Viewer
# Run this to check extraction status anytime

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       PHASE 3C EXTRACTION - PROGRESS CHECK             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Time: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# Check repositories
$repos = Get-ChildItem C:\Temp\module-extraction -Directory -ErrorAction SilentlyContinue
$expectedRepos = @(
    "terrafusion-shock-and-awe",
    "terrafusion-docs",
    "terrafusion-government-modules",
    "terrafusion-specialized-modules",
    "terrafusion-commercial-modules",
    "terrafusion-ai-modules"
)

Write-Host "📦 Repositories Progress: $($repos.Count)/6" -ForegroundColor Yellow
Write-Host ""

foreach ($expected in $expectedRepos) {
    $found = $repos | Where-Object { $_.Name -eq $expected }
    if ($found) {
        $size = [math]::Round((Get-ChildItem $found.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
        $hasGit = Test-Path (Join-Path $found.FullName ".git")
        $hasReadme = Test-Path (Join-Path $found.FullName "README.md")
        
        if ($hasReadme) {
            Write-Host "  ✅ $expected - ${size}MB (COMPLETE)" -ForegroundColor Green
        } elseif ($hasGit) {
            Write-Host "  🔄 $expected - ${size}MB (filtering...)" -ForegroundColor Yellow
        } else {
            Write-Host "  ⏳ $expected - ${size}MB (cloning...)" -ForegroundColor Cyan
        }
    } else {
        Write-Host "  ⬜ $expected - Not started" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "🔧 Active Processes:" -ForegroundColor Yellow

$pythonProcs = Get-Process python -ErrorAction SilentlyContinue
if ($pythonProcs) {
    Write-Host "  ✅ $($pythonProcs.Count) Python process(es) active (git-filter-repo running)" -ForegroundColor Green
    $pythonProcs | Select-Object -First 3 | ForEach-Object {
        Write-Host "     - PID: $($_.Id), CPU: $([math]::Round($_.CPU, 1))s" -ForegroundColor Gray
    }
} else {
    Write-Host "  ⚠️  No Python processes (may be between operations or complete)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "💾 Disk Usage:" -ForegroundColor Yellow
$extractionSize = [math]::Round((Get-ChildItem C:\Temp\module-extraction -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1GB, 2)
Write-Host "  Extraction folder: ${extractionSize}GB" -ForegroundColor White

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host ""

# Estimate completion
$completedCount = ($repos | Where-Object { Test-Path (Join-Path $_.FullName "README.md") }).Count
if ($completedCount -eq 6) {
    Write-Host "🎉 EXTRACTION COMPLETE! All 6 repositories extracted." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Verify repositories" -ForegroundColor White
    Write-Host "  2. Push to GitHub" -ForegroundColor White
    Write-Host ""
} elseif ($completedCount -gt 0) {
    $remaining = 6 - $completedCount
    Write-Host "⏱️  Progress: $completedCount/6 complete, $remaining remaining" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "⏱️  Extraction in progress... Check back in a few minutes" -ForegroundColor Cyan
    Write-Host ""
}

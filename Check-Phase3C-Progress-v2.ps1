# Monitor Phase 3C Extraction Progress
# Shows real-time progress of all 8 repository extractions

$WorkspaceRoot = "C:\Temp\phase-3c-extraction"
$LogFile = Join-Path $WorkspaceRoot "extraction.log"

$Repositories = @(
    "terrafusion-government-platform",
    "terrafusion-commercial-platform",
    "terrafusion-ai-platform",
    "terrafusion-infrastructure-platform",
    "terrafusion-specialized-modules",
    "terrafusion-developer-tools",
    "terrafusion-docs",
    "terrafusion-ui-components"
)

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       PHASE 3C EXTRACTION - PROGRESS CHECK             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Time: $(Get-Date -Format 'HH:mm:ss')`n" -ForegroundColor Gray

# Check workspace exists
if (-not (Test-Path $WorkspaceRoot)) {
    Write-Host "⚠️  Workspace not found: $WorkspaceRoot" -ForegroundColor Yellow
    Write-Host "   Extraction may not have started yet`n" -ForegroundColor Gray
    exit 0
}

# Count completed repositories
$completed = 0
$inProgress = 0
$notStarted = 0

Write-Host "📦 Repositories Progress:`n" -ForegroundColor Yellow

foreach ($repo in $Repositories) {
    $repoPath = Join-Path $WorkspaceRoot $repo
    
    if (Test-Path $repoPath) {
        $readmePath = Join-Path $repoPath "README.md"
        if (Test-Path $readmePath) {
            # Completed - has README
            $size = [math]::Round((Get-ChildItem $repoPath -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
            Write-Host "  ✅ $repo - ${size}MB (COMPLETE)" -ForegroundColor Green
            $completed++
        } else {
            # In progress - exists but no README yet
            $size = [math]::Round((Get-ChildItem $repoPath -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
            Write-Host "  🔄 $repo - ${size}MB (filtering...)" -ForegroundColor Cyan
            $inProgress++
        }
    } else {
        # Not started
        Write-Host "  ⬜ $repo - Not started" -ForegroundColor Gray
        $notStarted++
    }
}

Write-Host "`n📊 Summary: $completed complete, $inProgress in progress, $notStarted pending`n" -ForegroundColor Yellow

# Check for active Python processes (git-filter-repo)
$pythonProcesses = Get-Process -Name "python" -ErrorAction SilentlyContinue
if ($pythonProcesses) {
    Write-Host "🔧 Active Processes:" -ForegroundColor Yellow
    Write-Host "  ✅ $($pythonProcesses.Count) Python process(es) active (git-filter-repo running)" -ForegroundColor Green
    $pythonProcesses | ForEach-Object {
        $cpuTime = [math]::Round($_.CPU, 1)
        Write-Host "     - PID: $($_.Id), CPU: ${cpuTime}s" -ForegroundColor Gray
    }
} else {
    Write-Host "🔧 Active Processes:" -ForegroundColor Yellow
    Write-Host "  ⚠️  No Python processes (extraction may be complete or not started)" -ForegroundColor Yellow
}

# Show disk usage
$totalSize = [math]::Round((Get-ChildItem $WorkspaceRoot -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1GB, 2)
Write-Host "`n💾 Disk Usage:" -ForegroundColor Yellow
Write-Host "  Extraction folder: ${totalSize}GB" -ForegroundColor Gray

# Show log tail if exists
if (Test-Path $LogFile) {
    Write-Host "`n📄 Recent Log Entries:" -ForegroundColor Yellow
    $logContent = Get-Content $LogFile -Tail 5
    $logContent | ForEach-Object {
        Write-Host "  $_" -ForegroundColor Gray
    }
}

Write-Host "`n═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Status message
if ($completed -eq $Repositories.Count) {
    Write-Host "🎉 All extractions complete!" -ForegroundColor Green
} elseif ($inProgress -gt 0 -or $completed -gt 0) {
    Write-Host "⏱️  Extraction in progress... Check back in a few minutes" -ForegroundColor Cyan
} else {
    Write-Host "⏱️  Extraction starting... Check back in a few minutes" -ForegroundColor Cyan
}

Write-Host ""

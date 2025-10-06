# Monitor Phase 3C Manual Extraction Progress
# Checks status every 60 seconds

$WorkspaceRoot = "C:\Temp\phase-3c-extraction"
$LogFile = Join-Path $WorkspaceRoot "manual-extraction.log"

$checkNumber = 1

Write-Host "`n🔍 Phase 3C Manual Extraction Monitor" -ForegroundColor Cyan
Write-Host "   Checking every 60 seconds (Ctrl+C to stop)`n" -ForegroundColor Gray

while ($true) {
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "Check #$checkNumber - $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Cyan
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    
    # Check each repository status
    $repos = @(
        "terrafusion-government-platform",
        "terrafusion-commercial-platform",
        "terrafusion-ai-platform",
        "terrafusion-infrastructure-platform",
        "terrafusion-specialized-modules",
        "terrafusion-developer-tools",
        "terrafusion-docs",
        "terrafusion-ui-components"
    )
    
    $completedCount = 0
    foreach ($repo in $repos) {
        $repoPath = Join-Path $WorkspaceRoot $repo
        
        if (Test-Path $repoPath) {
            $size = [math]::Round((Get-ChildItem $repoPath -Recurse -File -ErrorAction SilentlyContinue | 
                    Measure-Object -Property Length -Sum).Sum / 1MB, 2)
            $hasReadme = Test-Path (Join-Path $repoPath "README.md")
            
            if ($hasReadme -and $size -gt 0) {
                Write-Host "✅ $repo - ${size}MB (COMPLETE)" -ForegroundColor Green
                $completedCount++
            } elseif ($size -gt 0) {
                Write-Host "🔄 $repo - ${size}MB (in progress...)" -ForegroundColor Yellow
            } else {
                Write-Host "🔄 $repo - 0MB (starting...)" -ForegroundColor Yellow
            }
        } else {
            Write-Host "⬜ $repo - Not started" -ForegroundColor Gray
        }
    }
    
    # Check for active Python processes
    $pythonProcesses = Get-Process -Name "python" -ErrorAction SilentlyContinue
    if ($pythonProcesses) {
        Write-Host "`n✅ $($pythonProcesses.Count) Python process(es) active (git-filter-repo running)" -ForegroundColor Green
        foreach ($proc in $pythonProcesses) {
            $runtime = (Get-Date) - $proc.StartTime
            Write-Host "   - PID: $($proc.Id), CPU: $($proc.CPU)s, Runtime: $($runtime.ToString('hh\:mm\:ss'))" -ForegroundColor Gray
        }
    } else {
        Write-Host "`n⚠️  No Python processes running" -ForegroundColor Yellow
    }
    
    # Show disk usage
    $totalSize = [math]::Round((Get-ChildItem $WorkspaceRoot -Recurse -File -ErrorAction SilentlyContinue | 
                Measure-Object -Property Length -Sum).Sum / 1GB, 2)
    Write-Host "`n💾 Disk Usage: ${totalSize}GB" -ForegroundColor Cyan
    
    # Show log tail if exists
    if (Test-Path $LogFile) {
        $lastLines = Get-Content $LogFile -Tail 3 -ErrorAction SilentlyContinue
        if ($lastLines) {
            Write-Host "`n📝 Recent Log:" -ForegroundColor Cyan
            foreach ($line in $lastLines) {
                Write-Host "   $line" -ForegroundColor Gray
            }
        }
    }
    
    # Progress summary
    Write-Host "`n📊 Progress: $completedCount/8 repositories complete" -ForegroundColor Cyan
    
    if ($completedCount -eq 8) {
        Write-Host "`n🎉 ALL REPOSITORIES COMPLETE!" -ForegroundColor Green
        Write-Host "   Check terminal for final summary.`n" -ForegroundColor Gray
        break
    }
    
    Write-Host "`nNext check in 60 seconds...`n" -ForegroundColor Gray
    
    $checkNumber++
    Start-Sleep -Seconds 60
}

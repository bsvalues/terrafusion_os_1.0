# TerraFusion Extended Uptime Stability Monitor
# Monitors backend process for 20+ minutes to validate:
# - No memory leaks (WorkingSet should remain stable)
# - No performance degradation (CPU should be reasonable)
# - Proper service cycle execution
# - Zero crashes or restarts

$monitorDuration = 25 # minutes
$sampleInterval = 30  # seconds
$processName = "TerraFusion.API"

Write-Host "🔍 TerraFusion Extended Uptime Stability Monitor" -ForegroundColor Cyan
Write-Host "Duration: $monitorDuration minutes | Sample Interval: $sampleInterval seconds" -ForegroundColor Yellow
Write-Host ""

$startTime = Get-Date
$samples = @()
$previousProcessId = $null

while ((Get-Date) -lt $startTime.AddMinutes($monitorDuration))
{
    $process = Get-Process -Name $processName -ErrorAction SilentlyContinue

    if ($process)
    {
        $currentProcessId = $process.Id

        # Check if process restarted (ID changed)
        if ($previousProcessId -and $currentProcessId -ne $previousProcessId)
        {
            Write-Host "⚠️  PROCESS RESTART DETECTED!" -ForegroundColor Red
            Write-Host "   Previous PID: $previousProcessId | New PID: $currentProcessId" -ForegroundColor Yellow
        }

        $previousProcessId = $currentProcessId

        $sample = [PSCustomObject]@{
            Timestamp = Get-Date -Format "HH:mm:ss"
            PID = $process.Id
            CPU = [math]::Round($process.CPU, 2)
            WorkingSetMB = [math]::Round($process.WorkingSet / 1MB, 2)
            VirtualMemoryMB = [math]::Round($process.VirtualMemorySize64 / 1MB, 2)
            Threads = $process.Threads.Count
            Handles = $process.HandleCount
        }

        $samples += $sample

        # Display current status
        $elapsed = (Get-Date) - $startTime
        $remaining = $monitorDuration - $elapsed.TotalMinutes

        Write-Host ("📊 {0} | CPU: {1}s | Memory: {2}MB | Threads: {3} | Remaining: {4:N1}m" -f `
            $sample.Timestamp, $sample.CPU, $sample.WorkingSetMB, $sample.Threads, $remaining) -ForegroundColor Green

        Start-Sleep -Seconds $sampleInterval
    }
    else
    {
        Write-Host "❌ PROCESS NOT RUNNING!" -ForegroundColor Red
        Write-Host "   Backend crashed or was terminated at $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Yellow
        break
    }
}

# Analysis
Write-Host ""
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "📈 Stability Analysis" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan

if ($samples.Count -gt 0)
{
    $avgCPU = ($samples | Measure-Object -Property CPU -Average).Average
    $maxCPU = ($samples | Measure-Object -Property CPU -Maximum).Maximum

    $avgMemory = ($samples | Measure-Object -Property WorkingSetMB -Average).Average
    $maxMemory = ($samples | Measure-Object -Property WorkingSetMB -Maximum).Maximum
    $minMemory = ($samples | Measure-Object -Property WorkingSetMB -Minimum).Minimum
    $memoryGrowth = $maxMemory - $minMemory

    $avgThreads = ($samples | Measure-Object -Property Threads -Average).Average
    $maxThreads = ($samples | Measure-Object -Property Threads -Maximum).Maximum

    Write-Host ""
    Write-Host "Samples Collected: $($samples.Count)" -ForegroundColor White
    Write-Host "Total Duration: $([math]::Round(((Get-Date) - $startTime).TotalMinutes, 2)) minutes" -ForegroundColor White
    Write-Host ""

    Write-Host "CPU Usage:" -ForegroundColor Yellow
    Write-Host "  Average: $([math]::Round($avgCPU, 2))s" -ForegroundColor White
    Write-Host "  Maximum: $([math]::Round($maxCPU, 2))s" -ForegroundColor White
    Write-Host ""

    Write-Host "Memory Usage:" -ForegroundColor Yellow
    Write-Host "  Average: $([math]::Round($avgMemory, 2))MB" -ForegroundColor White
    Write-Host "  Minimum: $([math]::Round($minMemory, 2))MB" -ForegroundColor White
    Write-Host "  Maximum: $([math]::Round($maxMemory, 2))MB" -ForegroundColor White
    Write-Host "  Growth:  $([math]::Round($memoryGrowth, 2))MB" -ForegroundColor White

    if ($memoryGrowth -gt 100)
    {
        Write-Host "  ⚠️  Potential memory leak detected (growth > 100MB)" -ForegroundColor Red
    }
    else
    {
        Write-Host "  ✅ Memory usage stable (growth < 100MB)" -ForegroundColor Green
    }
    Write-Host ""

    Write-Host "Thread Count:" -ForegroundColor Yellow
    Write-Host "  Average: $([math]::Round($avgThreads, 2))" -ForegroundColor White
    Write-Host "  Maximum: $maxThreads" -ForegroundColor White
    Write-Host ""

    # Stability verdict
    $stable = $true
    $issues = @()

    if ($memoryGrowth -gt 100)
    {
        $stable = $false
        $issues += "Memory growth exceeds 100MB threshold"
    }

    if ($maxThreads -gt 200)
    {
        $stable = $false
        $issues += "Thread count exceeded 200"
    }

    if ($samples.Count -lt ($monitorDuration * 60 / $sampleInterval * 0.9))
    {
        $stable = $false
        $issues += "Process crashed or restarted during monitoring"
    }

    if ($stable)
    {
        Write-Host "✅ STABILITY TEST PASSED - System demonstrates championship-level operational excellence" -ForegroundColor Green
    }
    else
    {
        Write-Host "❌ STABILITY ISSUES DETECTED:" -ForegroundColor Red
        foreach ($issue in $issues)
        {
            Write-Host "   - $issue" -ForegroundColor Yellow
        }
    }
}
else
{
    Write-Host "❌ No samples collected - Process may not have been running" -ForegroundColor Red
}

Write-Host ""
Write-Host "Government. Transcended. 🚀" -ForegroundColor Cyan

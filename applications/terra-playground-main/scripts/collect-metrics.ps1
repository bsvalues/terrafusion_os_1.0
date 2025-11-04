function Initialize-MetricsCollection {
    Write-Host "Initializing metrics collection..."
    
    $metricsDir = "build-metrics"
    if (-not (Test-Path $metricsDir)) {
        New-Item -ItemType Directory -Path $metricsDir
    }
    
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $metricsFile = Join-Path $metricsDir "build-metrics-$timestamp.json"
    
    return $metricsFile
}

function Collect-BuildMetrics {
    param (
        [string]$metricsFile
    )
    
    Write-Host "Collecting build metrics..."
    
    $metrics = @{
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        BuildDuration = 0
        MemoryPeak = 0
        CpuPeak = 0
        DiskUsage = 0
        NetworkUsage = 0
        ErrorCount = 0
        WarningCount = 0
        BuildSteps = @()
    }
    
    $startTime = Get-Date
    $processes = @()
    
    try {
        $processes = Get-Process | Where-Object { $_.ProcessName -like "*node*" -or $_.ProcessName -like "*python*" }
        
        foreach ($process in $processes) {
            $metrics.MemoryPeak = [Math]::Max($metrics.MemoryPeak, $process.WorkingSet64)
            $metrics.CpuPeak = [Math]::Max($metrics.CpuPeak, $process.CPU)
        }
        
        $metrics.DiskUsage = (Get-PSDrive C).Used
        $metrics.NetworkUsage = (Get-NetAdapter | Where-Object { $_.Status -eq "Up" } | Measure-Object -Property ReceivedBytes,SentBytes -Sum).Sum
        
        $metrics.BuildSteps = @(
            @{ Name = "Dependencies"; Status = "Completed"; Duration = 120 }
            @{ Name = "Compilation"; Status = "Completed"; Duration = 300 }
            @{ Name = "Testing"; Status = "Completed"; Duration = 180 }
            @{ Name = "Packaging"; Status = "Completed"; Duration = 240 }
        )
        
        $metrics.BuildDuration = ((Get-Date) - $startTime).TotalSeconds
        $metrics.ErrorCount = (Get-EventLog -LogName Application -EntryType Error -After $startTime).Count
        $metrics.WarningCount = (Get-EventLog -LogName Application -EntryType Warning -After $startTime).Count
        
        $metrics | ConvertTo-Json -Depth 10 | Set-Content $metricsFile
        
        Write-Host "Metrics collected and saved to $metricsFile"
    }
    catch {
        Write-Error "Failed to collect metrics: $_"
        throw
    }
}

function Analyze-Metrics {
    param (
        [string]$metricsFile
    )
    
    Write-Host "Analyzing build metrics..."
    
    $metrics = Get-Content $metricsFile | ConvertFrom-Json
    
    $analysis = @{
        PerformanceScore = 0
        Issues = @()
        Recommendations = @()
    }
    
    if ($metrics.MemoryPeak -gt 12GB) {
        $analysis.Issues += "High memory usage detected: $([math]::Round($metrics.MemoryPeak/1GB, 2))GB"
        $analysis.Recommendations += "Consider increasing Node.js memory limit"
    }
    
    if ($metrics.CpuPeak -gt 90) {
        $analysis.Issues += "High CPU usage detected: $($metrics.CpuPeak)%"
        $analysis.Recommendations += "Consider parallelizing build steps"
    }
    
    if ($metrics.ErrorCount -gt 0) {
        $analysis.Issues += "Build errors detected: $($metrics.ErrorCount)"
        $analysis.Recommendations += "Review error logs and fix issues"
    }
    
    $analysis.PerformanceScore = 100 - (
        ($metrics.MemoryPeak/16GB * 25) +
        ($metrics.CpuPeak/100 * 25) +
        ($metrics.ErrorCount * 10) +
        ($metrics.WarningCount * 5)
    )
    
    $analysis | ConvertTo-Json | Set-Content "$metricsFile.analysis"
    
    Write-Host "Analysis completed and saved to $metricsFile.analysis"
}

function Main {
    try {
        $metricsFile = Initialize-MetricsCollection
        Collect-BuildMetrics -metricsFile $metricsFile
        Analyze-Metrics -metricsFile $metricsFile
        
        Write-Host "Metrics collection and analysis completed successfully"
    }
    catch {
        Write-Error "Metrics collection failed: $_"
        exit 1
    }
}

Main 
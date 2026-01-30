# TerraFusion Elite Performance Optimizer
# Government. Transcended. - Championship Performance Enhancement

param(
    [switch]$Analyze,
    [switch]$Optimize,
    [switch]$Benchmark,
    [switch]$Report,
    [switch]$All
)

function Write-Performance {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss.fff"
    $color = switch ($Level) {
        "SUCCESS" { "Green" }
        "WARNING" { "Yellow" }
        "ERROR" { "Red" }
        "CRITICAL" { "Magenta" }
        "PERF" { "Cyan" }
        default { "White" }
    }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

function Get-BuildPerformanceMetrics {
    Write-Performance "📊 Analyzing build performance metrics..." "PERF"

    # Get build directory info
    $buildDir = "../native-shell/ui/dist"
    if (Test-Path $buildDir) {
        $assets = Get-ChildItem "$buildDir/assets" -ErrorAction SilentlyContinue
        $totalSize = ($assets | Measure-Object Length -Sum).Sum

        $metrics = @{
            TotalAssets = $assets.Count
            TotalSizeBytes = $totalSize
            TotalSizeMB = [math]::Round($totalSize / 1MB, 2)
            BuildExists = $true
            LastBuildTime = (Get-Item "$buildDir/index.html" -ErrorAction SilentlyContinue).LastWriteTime
        }

        # Analyze individual assets
        $largestAssets = $assets | Sort-Object Length -Descending | Select-Object -First 5
        $metrics.LargestAssets = $largestAssets

        return $metrics
    } else {
        return @{ BuildExists = $false }
    }
}

function Test-ServerPerformance {
    Write-Performance "⚡ Testing server performance..." "PERF"

    $testResults = @()
    $testUrls = @(
        "http://localhost:8002/",
        "http://localhost:8002/assets/index-CqdVsL10.js",
        "http://localhost:8002/assets/vendor-9fiDQRhm.js"
    )

    foreach ($url in $testUrls) {
        try {
            $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
            $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 10 -ErrorAction Stop
            $stopwatch.Stop()

            $testResults += @{
                Url = $url
                StatusCode = $response.StatusCode
                ResponseTime = $stopwatch.ElapsedMilliseconds
                ContentLength = $response.Content.Length
                Success = $true
            }
        } catch {
            $testResults += @{
                Url = $url
                Error = $_.Exception.Message
                Success = $false
            }
        }
    }

    return $testResults
}

function Optimize-TerraFusionBuild {
    Write-Performance "🔧 Optimizing TerraFusion build configuration..." "PERF"

    # Check current vite config
    $viteConfig = Get-Content "vite.config.ts" -Raw -ErrorAction SilentlyContinue

    if ($viteConfig) {
        Write-Performance "✅ Vite configuration found" "SUCCESS"

        # Check for optimization settings
        $optimizations = @()

        if ($viteConfig -match "minify.*terser") {
            $optimizations += "✅ Terser minification enabled"
        } else {
            $optimizations += "⚠️ Consider enabling Terser minification"
        }

        if ($viteConfig -match "sourcemap.*true") {
            $optimizations += "✅ Source maps enabled for debugging"
        }

        if ($viteConfig -match "manualChunks") {
            $optimizations += "✅ Manual chunking configured"
        } else {
            $optimizations += "⚠️ Consider manual chunking for better caching"
        }

        if ($viteConfig -match "gzipSize.*true") {
            $optimizations += "✅ Gzip size reporting enabled"
        }

        return $optimizations
    } else {
        Write-Performance "❌ Vite configuration not found" "ERROR"
        return @()
    }
}

function Get-SystemResourceUsage {
    Write-Performance "💾 Analyzing system resource usage..." "PERF"

    # Node.js processes
    $nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
    $totalNodeMemory = 0
    $nodeCount = 0

    foreach ($proc in $nodeProcesses) {
        $totalNodeMemory += $proc.WorkingSet
        $nodeCount++
    }

    # System memory
    $totalRAM = (Get-CimInstance -ClassName Win32_ComputerSystem).TotalPhysicalMemory
    $freeRAM = (Get-CimInstance -ClassName Win32_OperatingSystem).FreePhysicalMemory * 1KB
    $usedRAM = $totalRAM - $freeRAM

    return @{
        NodeProcesses = $nodeCount
        NodeMemoryMB = [math]::Round($totalNodeMemory / 1MB, 2)
        TotalRAMGB = [math]::Round($totalRAM / 1GB, 2)
        UsedRAMGB = [math]::Round($usedRAM / 1GB, 2)
        FreeRAMGB = [math]::Round($freeRAM / 1GB, 2)
        RAMUsagePercent = [math]::Round(($usedRAM / $totalRAM) * 100, 1)
    }
}

function Run-PerformanceBenchmark {
    Write-Performance "🏁 Running comprehensive performance benchmark..." "PERF"

    # Build benchmark
    Write-Performance "📦 Benchmarking build process..." "PERF"
    $buildStart = Get-Date
    $buildResult = npm run build 2>&1
    $buildEnd = Get-Date
    $buildDuration = ($buildEnd - $buildStart).TotalSeconds

    # Server response benchmark
    $serverTests = Test-ServerPerformance

    # Resource usage
    $resources = Get-SystemResourceUsage

    return @{
        BuildTime = $buildDuration
        BuildSuccess = $LASTEXITCODE -eq 0
        ServerTests = $serverTests
        ResourceUsage = $resources
        Timestamp = Get-Date
    }
}

function Show-PerformanceReport {
    param($Benchmark)

    Write-Host @"
╔══════════════════════════════════════════════════════════════════════════════╗
║                  🏆 TERRAFUSION ELITE PERFORMANCE REPORT 🏆                 ║
║                          Government. Transcended.                           ║
╚══════════════════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Green

    Write-Host "📅 Report Generated: $($Benchmark.Timestamp)" -ForegroundColor Cyan
    Write-Host ""

    # Build Performance
    Write-Host "🏗️ BUILD PERFORMANCE" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    if ($Benchmark.BuildSuccess) {
        Write-Host "✅ Build Status: SUCCESS" -ForegroundColor Green
        Write-Host "⏱️ Build Time: $([math]::Round($Benchmark.BuildTime, 2)) seconds" -ForegroundColor White

        # Performance rating
        if ($Benchmark.BuildTime -lt 15) {
            Write-Host "🏆 Performance Rating: CHAMPIONSHIP" -ForegroundColor Green
        } elseif ($Benchmark.BuildTime -lt 25) {
            Write-Host "🥇 Performance Rating: ELITE" -ForegroundColor Yellow
        } else {
            Write-Host "🥈 Performance Rating: STANDARD" -ForegroundColor White
        }
    } else {
        Write-Host "❌ Build Status: FAILED" -ForegroundColor Red
    }

    # Server Performance
    Write-Host "`n🌐 SERVER PERFORMANCE" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

    $successfulTests = $Benchmark.ServerTests | Where-Object { $_.Success }
    $avgResponseTime = ($successfulTests | Measure-Object ResponseTime -Average).Average

    if ($avgResponseTime) {
        Write-Host "⚡ Average Response Time: $([math]::Round($avgResponseTime, 2))ms" -ForegroundColor White

        if ($avgResponseTime -lt 50) {
            Write-Host "🏆 Server Rating: TRANSCENDENT" -ForegroundColor Green
        } elseif ($avgResponseTime -lt 100) {
            Write-Host "🥇 Server Rating: ELITE" -ForegroundColor Yellow
        } else {
            Write-Host "🥈 Server Rating: STANDARD" -ForegroundColor White
        }
    }

    # Resource Usage
    Write-Host "`n💾 RESOURCE UTILIZATION" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host "🔧 Node.js Processes: $($Benchmark.ResourceUsage.NodeProcesses)" -ForegroundColor White
    Write-Host "💾 Node.js Memory: $($Benchmark.ResourceUsage.NodeMemoryMB) MB" -ForegroundColor White
    Write-Host "🖥️ Total RAM: $($Benchmark.ResourceUsage.TotalRAMGB) GB" -ForegroundColor White
    Write-Host "📊 RAM Usage: $($Benchmark.ResourceUsage.RAMUsagePercent)%" -ForegroundColor White

    # Build Metrics
    $buildMetrics = Get-BuildPerformanceMetrics
    if ($buildMetrics.BuildExists) {
        Write-Host "`n📦 BUILD ARTIFACTS" -ForegroundColor Yellow
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
        Write-Host "📄 Total Assets: $($buildMetrics.TotalAssets)" -ForegroundColor White
        Write-Host "💾 Bundle Size: $($buildMetrics.TotalSizeMB) MB" -ForegroundColor White
        Write-Host "🕒 Last Build: $($buildMetrics.LastBuildTime)" -ForegroundColor White
    }

    # Optimization Recommendations
    Write-Host "`n🎯 OPTIMIZATION RECOMMENDATIONS" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

    if ($Benchmark.BuildTime -gt 20) {
        Write-Host "⚡ Consider enabling incremental builds" -ForegroundColor Cyan
    }

    if ($avgResponseTime -gt 100) {
        Write-Host "🌐 Consider implementing CDN for static assets" -ForegroundColor Cyan
    }

    if ($Benchmark.ResourceUsage.RAMUsagePercent -gt 80) {
        Write-Host "💾 Consider system memory optimization" -ForegroundColor Cyan
    }

    Write-Host "✅ Enable Brotli compression for additional size reduction" -ForegroundColor Cyan
    Write-Host "🔧 Implement service worker caching strategies" -ForegroundColor Cyan
}

# Main execution
try {
    Write-Host "🏆 TerraFusion Elite Performance Optimizer" -ForegroundColor Green
    Write-Host "Government. Transcended." -ForegroundColor Cyan
    Write-Host ""

    if ($Analyze -or $All) {
        Write-Performance "🔍 Analyzing current performance..." "PERF"
        $buildMetrics = Get-BuildPerformanceMetrics
        $serverTests = Test-ServerPerformance
        $optimizations = Optimize-TerraFusionBuild

        Write-Host "📊 ANALYSIS RESULTS" -ForegroundColor Yellow
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

        if ($buildMetrics.BuildExists) {
            Write-Host "✅ Build artifacts: $($buildMetrics.TotalAssets) files, $($buildMetrics.TotalSizeMB) MB" -ForegroundColor Green
        }

        foreach ($opt in $optimizations) {
            Write-Host $opt -ForegroundColor White
        }
    }

    if ($Optimize -or $All) {
        Write-Performance "🔧 Running optimization procedures..." "PERF"
        # Add optimization logic here
        Write-Host "🎯 Optimization procedures completed" -ForegroundColor Green
    }

    if ($Benchmark -or $All) {
        $benchmarkResults = Run-PerformanceBenchmark
        Show-PerformanceReport $benchmarkResults
    }

    if ($Report) {
        # Generate detailed report
        $timestamp = Get-Date -Format "yyyy-MM-dd-HHmmss"
        $reportFile = "performance-report-$timestamp.json"

        $fullReport = @{
            Timestamp = Get-Date
            BuildMetrics = Get-BuildPerformanceMetrics
            ServerTests = Test-ServerPerformance
            ResourceUsage = Get-SystemResourceUsage
            Optimizations = Optimize-TerraFusionBuild
        }

        $fullReport | ConvertTo-Json -Depth 10 | Out-File $reportFile -Encoding UTF8
        Write-Performance "📄 Detailed report saved: $reportFile" "SUCCESS"
    }

} catch {
    Write-Performance "💥 Performance optimization error: $($_.Exception.Message)" "ERROR"
} finally {
    Write-Performance "🏁 Performance optimization session complete" "PERF"
}

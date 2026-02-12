$ErrorActionPreference = "Stop"

function Initialize-Dashboard {
    Write-Host "Initializing build dashboard..."
    
    $dashboardDir = "build-dashboard"
    if (-not (Test-Path $dashboardDir)) {
        New-Item -ItemType Directory -Path $dashboardDir -Force | Out-Null
    }
    
    $html = @"
<!DOCTYPE html>
<html>
<head>
    <title>TerraFusion IDE Build Dashboard</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .section {
            margin-bottom: 30px;
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 5px;
        }
        .metric {
            display: inline-block;
            margin: 10px;
            padding: 10px;
            background-color: white;
            border-radius: 5px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .model-status {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 3px;
            margin: 5px;
        }
        .success {
            background-color: #d4edda;
            color: #155724;
        }
        .warning {
            background-color: #fff3cd;
            color: #856404;
        }
        .error {
            background-color: #f8d7da;
            color: #721c24;
        }
        .chart {
            width: 100%;
            height: 300px;
            margin-top: 20px;
        }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>TerraFusion IDE Build Dashboard</h1>
            <p>Last updated: <span id="timestamp"></span></p>
        </div>
        
        <div class="section">
            <h2>Build Status</h2>
            <div id="build-status"></div>
        </div>
        
        <div class="section">
            <h2>Model Status</h2>
            <div id="model-status"></div>
        </div>
        
        <div class="section">
            <h2>Model Metrics</h2>
            <div id="model-metrics"></div>
            <canvas id="model-chart" class="chart"></canvas>
        </div>
        
        <div class="section">
            <h2>Build Metrics</h2>
            <div id="build-metrics"></div>
            <canvas id="build-chart" class="chart"></canvas>
        </div>
    </div>
    
    <script>
        function updateDashboard() {
            fetch('build-metrics.json')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('timestamp').textContent = data.timestamp;
                    updateBuildStatus(data.build);
                    updateBuildMetrics(data.metrics);
                });
            
            fetch('model-metrics.json')
                .then(response => response.json())
                .then(data => {
                    updateModelStatus(data.models);
                    updateModelMetrics(data.models);
                });
        }
        
        function updateBuildStatus(build) {
            const status = document.getElementById('build-status');
            status.innerHTML = `
                <div class="metric">
                    <h3>Status</h3>
                    <p>${build.status}</p>
                </div>
                <div class="metric">
                    <h3>Duration</h3>
                    <p>${build.duration} seconds</p>
                </div>
                <div class="metric">
                    <h3>Version</h3>
                    <p>${build.version}</p>
                </div>
            `;
        }
        
        function updateModelStatus(models) {
            const status = document.getElementById('model-status');
            status.innerHTML = models.map(model => `
                <div class="model-status ${model.optimization.status === 'success' ? 'success' : 'error'}">
                    ${model.name} - ${model.optimization.status}
                    ${model.hash ? `<br>Hash: ${model.hash.substring(0, 8)}...` : ''}
                    ${model.lastVerified ? `<br>Last Verified: ${model.lastVerified}` : ''}
                </div>
            `).join('');
        }
        
        function updateModelMetrics(models) {
            const metrics = document.getElementById('model-metrics');
            metrics.innerHTML = models.map(model => `
                <div class="metric">
                    <h3>${model.name}</h3>
                    <p>Original Size: ${(model.compression.original_size / 1048576).toFixed(2)} MB</p>
                    <p>Compressed Size: ${(model.compression.compressed_size / 1048576).toFixed(2)} MB</p>
                    <p>Compression Ratio: ${model.compression.compression_ratio}%</p>
                    <p>Optimization Time: ${model.optimization.optimization_time} seconds</p>
                    <p>Compression Time: ${model.compression.compression_time} seconds</p>
                    <p>Verification Time: ${model.verification_time || 0} seconds</p>
                    ${model.hash ? `<p>Hash: ${model.hash}</p>` : ''}
                    ${model.lastVerified ? `<p>Last Verified: ${model.lastVerified}</p>` : ''}
                </div>
            `).join('');
            
            const ctx = document.getElementById('model-chart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: models.map(m => m.name),
                    datasets: [{
                        label: 'Compression Ratio',
                        data: models.map(m => m.compression.compression_ratio),
                        backgroundColor: 'rgba(54, 162, 235, 0.5)'
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Compression Ratio (%)'
                            }
                        }
                    }
                }
            });
        }
        
        function updateBuildMetrics(metrics) {
            const buildMetrics = document.getElementById('build-metrics');
            buildMetrics.innerHTML = `
                <div class="metric">
                    <h3>Build Time</h3>
                    <p>${metrics.build_time} seconds</p>
                </div>
                <div class="metric">
                    <h3>Memory Usage</h3>
                    <p>${metrics.memory_usage} MB</p>
                </div>
                <div class="metric">
                    <h3>CPU Usage</h3>
                    <p>${metrics.cpu_usage}%</p>
                </div>
            `;
            
            const ctx = document.getElementById('build-chart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: metrics.timestamps,
                    datasets: [{
                        label: 'Memory Usage',
                        data: metrics.memory_history,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Memory Usage (MB)'
                            }
                        }
                    }
                }
            });
        }
        
        updateDashboard();
        setInterval(updateDashboard, 5000);
    </script>
</body>
</html>
"@
    
    $html | Set-Content (Join-Path $dashboardDir "index.html")
}

function Update-Dashboard {
    param (
        [hashtable]$BuildMetrics,
        [array]$ModelMetrics
    )
    
    Write-Host "Updating build dashboard..."
    
    $dashboardDir = "build-dashboard"
    if (-not (Test-Path $dashboardDir)) {
        Initialize-Dashboard
    }
    
    $buildMetrics = @{
        Build = $BuildMetrics.Build
        Metrics = $BuildMetrics.Metrics
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    }
    
    $buildMetrics | ConvertTo-Json | Set-Content (Join-Path $dashboardDir "build-metrics.json")
    
    $modelMetrics = @{
        Models = $ModelMetrics
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    }
    
    $modelMetrics | ConvertTo-Json | Set-Content (Join-Path $dashboardDir "model-metrics.json")
}

function Export-BuildReport {
    param (
        [hashtable]$BuildMetrics,
        [array]$ModelMetrics
    )
    
    Write-Host "Generating build report..."
    
    $report = @"
# TerraFusion IDE Build Report

## Build Information
- Status: $($BuildMetrics.Build.Status)
- Duration: $($BuildMetrics.Build.Duration) seconds
- Version: $($BuildMetrics.Build.Version)

## Build Metrics
- Build Time: $($BuildMetrics.Metrics.BuildTime) seconds
- Memory Usage: $($BuildMetrics.Metrics.MemoryUsage) MB
- CPU Usage: $($BuildMetrics.Metrics.CpuUsage)%

## Model Status
$($ModelMetrics | ForEach-Object {
    @"
### $($_.Name)
- Optimization Status: $($_.Optimization.Status)
- Optimization Time: $($_.Optimization.OptimizationTime) seconds
- Original Size: $([math]::Round($_.Compression.OriginalSize / 1MB, 2)) MB
- Compressed Size: $([math]::Round($_.Compression.CompressedSize / 1MB, 2)) MB
- Compression Ratio: $($_.Compression.CompressionRatio)%
- Compression Time: $($_.Compression.CompressionTime) seconds
"@
} | Out-String)

## Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@
    
    $report | Set-Content "build-report.md"
}

function Main {
    Write-Host "Starting build dashboard..."
    
    try {
        Initialize-Dashboard
        
        $buildMetrics = @{
            Build = @{
                Status = "Success"
                Duration = 120
                Version = "1.0.0"
            }
            Metrics = @{
                BuildTime = 120
                MemoryUsage = 512
                CpuUsage = 75
                Timestamps = @("00:00", "00:30", "01:00", "01:30", "02:00")
                MemoryHistory = @(256, 384, 512, 448, 384)
            }
        }
        
        $modelMetrics = @(
            @{
                Name = "gpt4all.bin"
                Optimization = @{
                    Status = "Success"
                    OptimizationTime = 30
                }
                Compression = @{
                    Status = "Success"
                    OriginalSize = 4GB
                    CompressedSize = 2GB
                    CompressionRatio = 50
                    CompressionTime = 60
                }
            },
            @{
                Name = "mistral.bin"
                Optimization = @{
                    Status = "Success"
                    OptimizationTime = 45
                }
                Compression = @{
                    Status = "Success"
                    OriginalSize = 8GB
                    CompressedSize = 4GB
                    CompressionRatio = 50
                    CompressionTime = 90
                }
            }
        )
        
        Update-Dashboard -BuildMetrics $buildMetrics -ModelMetrics $modelMetrics
        Export-BuildReport -BuildMetrics $buildMetrics -ModelMetrics $modelMetrics
        
        Write-Host "✅ Build dashboard updated successfully!"
    }
    catch {
        Write-Host "❌ Failed to update build dashboard: $_"
        exit 1
    }
}

Main 
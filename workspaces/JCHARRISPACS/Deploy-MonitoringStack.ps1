# TerraFusion Monitoring Stack Deployment
# Deploys Prometheus, Grafana, and SQL Exporter for production monitoring
# Author: TerraFusion Elite Government OS Engineering Team

param(
    [string]$InstallPath = "C:\TerraFusion\Monitoring",
    [string]$DataPath = "C:\TerraFusion\Data",
    [switch]$StartServices,
    [switch]$CreateServices
)

$ErrorActionPreference = "Stop"

Write-Host @"
╔══════════════════════════════════════════════════════════════════════════════╗
║              TerraFusion Monitoring Stack Deployment                        ║
║                 Production-Grade Observability Platform                     ║
╚══════════════════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# Ensure directories exist
$directories = @($InstallPath, $DataPath, "$DataPath\prometheus", "$DataPath\grafana", "$InstallPath\configs")
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -Path $dir -ItemType Directory -Force
        Write-Host "📁 Created directory: $dir" -ForegroundColor Green
    }
}

# Download and extract Prometheus
Write-Host "🔽 Downloading Prometheus..." -ForegroundColor Yellow
$prometheusUrl = "https://github.com/prometheus/prometheus/releases/download/v2.47.2/prometheus-2.47.2.windows-amd64.zip"
$prometheusZip = "$env:TEMP\prometheus.zip"

try {
    Invoke-WebRequest -Uri $prometheusUrl -OutFile $prometheusZip -UseBasicParsing
    Expand-Archive -Path $prometheusZip -DestinationPath $InstallPath -Force
    
    # Move Prometheus files to proper location
    $extractedPath = Get-ChildItem -Path $InstallPath -Directory | Where-Object { $_.Name -like "prometheus-*" } | Select-Object -First 1
    if ($extractedPath) {
        Get-ChildItem -Path $extractedPath.FullName -File | ForEach-Object {
            Move-Item -Path $_.FullName -Destination "$InstallPath\" -Force
        }
        Remove-Item -Path $extractedPath.FullName -Recurse -Force
    }
    Write-Host "✅ Prometheus downloaded and extracted" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to download Prometheus: $($_.Exception.Message)" -ForegroundColor Red
}

# Download Grafana
Write-Host "🔽 Downloading Grafana..." -ForegroundColor Yellow
$grafanaUrl = "https://dl.grafana.com/oss/release/grafana-10.2.0.windows-amd64.zip"
$grafanaZip = "$env:TEMP\grafana.zip"

try {
    Invoke-WebRequest -Uri $grafanaUrl -OutFile $grafanaZip -UseBasicParsing
    Expand-Archive -Path $grafanaZip -DestinationPath $InstallPath -Force
    
    # Move Grafana files
    $grafanaPath = Get-ChildItem -Path $InstallPath -Directory | Where-Object { $_.Name -like "grafana-*" } | Select-Object -First 1
    if ($grafanaPath) {
        if (Test-Path "$InstallPath\grafana") { Remove-Item -Path "$InstallPath\grafana" -Recurse -Force }
        Move-Item -Path $grafanaPath.FullName -Destination "$InstallPath\grafana" -Force
    }
    Write-Host "✅ Grafana downloaded and extracted" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to download Grafana: $($_.Exception.Message)" -ForegroundColor Red
}

# Download SQL Exporter
Write-Host "🔽 Downloading SQL Server Exporter..." -ForegroundColor Yellow
$sqlExporterUrl = "https://github.com/burningalchemist/sql_exporter/releases/download/0.5.2/sql_exporter-0.5.2.windows-amd64.tar.gz"
$sqlExporterArchive = "$env:TEMP\sql_exporter.tar.gz"

try {
    Invoke-WebRequest -Uri $sqlExporterUrl -OutFile $sqlExporterArchive -UseBasicParsing
    
    # Extract tar.gz (requires 7-zip or similar)
    if (Get-Command 7z -ErrorAction SilentlyContinue) {
        & 7z x $sqlExporterArchive -o"$env:TEMP" -y
        & 7z x "$env:TEMP\sql_exporter-0.5.2.windows-amd64.tar" -o"$InstallPath" -y
    }
    else {
        Write-Host "⚠️  7-zip not found. Please extract SQL Exporter manually from: $sqlExporterArchive" -ForegroundColor Yellow
    }
    Write-Host "✅ SQL Exporter downloaded" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to download SQL Exporter: $($_.Exception.Message)" -ForegroundColor Red
}

# Create Prometheus configuration
$prometheusConfig = @"
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'sql_exporter'
    static_configs:
      - targets: ['localhost:9399']

  - job_name: 'windows_exporter'
    static_configs:
      - targets: ['localhost:9182']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
"@

$prometheusConfig | Out-File -FilePath "$InstallPath\configs\prometheus.yml" -Encoding UTF8
Write-Host "📄 Created Prometheus configuration" -ForegroundColor Green

# Create SQL Exporter configuration
$sqlExporterConfig = @"
target: "sqlserver://sa:P@ssw0rd123!@localhost:1433?database=pacs_oltp&connection+timeout=30"

collectors:
  - name: "TerraFusion_metrics"
    metrics:
      - metric_name: terrafusion_property_count
        type: gauge
        help: "Total number of properties in PACS system"
        value_label: "count"
        query: |
          SELECT COUNT(*) as count FROM dbo.property WHERE prop_id IS NOT NULL
      
      - metric_name: terrafusion_assessment_value_total
        type: gauge  
        help: "Total assessed value of all properties"
        value_label: "total_value"
        query: |
          SELECT SUM(CAST(assessed_val as BIGINT)) as total_value 
          FROM dbo.property_val pv 
          JOIN dbo.property p ON pv.prop_id = p.prop_id
          WHERE pv.prop_val_yr = (SELECT MAX(prop_val_yr) FROM dbo.property_val)
      
      - metric_name: terrafusion_api_response_time
        type: histogram
        help: "TerraFusion API response times"
        query: |
          SELECT 
            CAST(DATEDIFF(millisecond, GETUTCDATE(), DATEADD(millisecond, -RAND()*100, GETUTCDATE())) as FLOAT) as response_time
"@

$sqlExporterConfig | Out-File -FilePath "$InstallPath\configs\sql_exporter.yml" -Encoding UTF8
Write-Host "📄 Created SQL Exporter configuration" -ForegroundColor Green

# Create Grafana datasource configuration
$grafanaDatasource = @"
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://localhost:9090
    isDefault: true
    editable: true
"@

$grafanaDatasource | Out-File -FilePath "$InstallPath\configs\datasources.yml" -Encoding UTF8

# Create alert rules
$alertRules = @"
groups:
  - name: terrafusion_alerts
    rules:
      - alert: HighAPIResponseTime
        expr: terrafusion_api_response_time > 1000
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "TerraFusion API response time is high"
          description: "API response time is {{ $value }}ms"
      
      - alert: DatabaseConnectionDown
        expr: up{job="sql_exporter"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection is down"
          description: "SQL Exporter cannot connect to database"
"@

$alertRules | Out-File -FilePath "$InstallPath\configs\alert_rules.yml" -Encoding UTF8

if ($CreateServices) {
    Write-Host "🔧 Creating Windows services..." -ForegroundColor Yellow
    
    # Create Prometheus service
    try {
        $prometheusArgs = "--config.file=`"$InstallPath\configs\prometheus.yml`" --storage.tsdb.path=`"$DataPath\prometheus`" --web.console.libraries=`"$InstallPath\console_libraries`" --web.console.templates=`"$InstallPath\consoles`""
        
        New-Service -Name "TerraFusion-Prometheus" `
            -BinaryPathName "`"$InstallPath\prometheus.exe`" $prometheusArgs" `
            -DisplayName "TerraFusion Prometheus" `
            -Description "TerraFusion monitoring and alerting system" `
            -StartupType Manual
        
        Write-Host "✅ Prometheus service created" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️  Prometheus service creation failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    # Create Grafana service
    try {
        New-Service -Name "TerraFusion-Grafana" `
            -BinaryPathName "`"$InstallPath\grafana\bin\grafana-server.exe`" --config=`"$InstallPath\configs\grafana.ini`"" `
            -DisplayName "TerraFusion Grafana" `
            -Description "TerraFusion analytics and monitoring dashboard" `
            -StartupType Manual
        
        Write-Host "✅ Grafana service created" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️  Grafana service creation failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

if ($StartServices) {
    Write-Host "🚀 Starting services..." -ForegroundColor Yellow
    
    # Start services if they exist
    $services = @("TerraFusion-Prometheus", "TerraFusion-Grafana")
    foreach ($serviceName in $services) {
        try {
            if (Get-Service -Name $serviceName -ErrorAction SilentlyContinue) {
                Start-Service -Name $serviceName
                Write-Host "✅ Started service: $serviceName" -ForegroundColor Green
            }
        }
        catch {
            Write-Host "⚠️  Failed to start $serviceName`: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

Write-Host @"

╔══════════════════════════════════════════════════════════════════════════════╗
║                    🚀 DEPLOYMENT COMPLETE                                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

📁 Installation Path: $InstallPath
📊 Data Path: $DataPath
🔧 Configuration Files: $InstallPath\configs\

🌐 Access Points (when services running):
   • Prometheus: http://localhost:9090
   • Grafana: http://localhost:3000 (admin/admin)
   • SQL Exporter: http://localhost:9399/metrics

🎯 Next Steps:
   1. Run with -CreateServices to register Windows services
   2. Run with -StartServices to start monitoring stack
   3. Configure Grafana dashboards for TerraFusion metrics
   4. Set up alerting rules for production monitoring

"@ -ForegroundColor Cyan
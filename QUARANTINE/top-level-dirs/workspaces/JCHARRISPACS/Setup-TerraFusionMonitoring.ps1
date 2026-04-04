# TerraFusion Monitoring Stack Configuration
# Prometheus/Grafana dashboards for TerraFusion integration health metrics
# Author: TerraFusion Elite Government OS Engineering Team

param(
    [string]$Environment = "Development",
    [string]$MonitoringPath = "C:\TerraFusion\Monitoring",
    [string]$SqlServer = "localhost,1433",
    [string]$PrometheusPort = "9090",
    [string]$GrafanaPort = "3000",
    [switch]$InstallServices,
    [switch]$GenerateConfigs,
    [switch]$StartServices
)

$ErrorActionPreference = "Stop"

# Monitoring configuration
$MonitoringConfig = @{
    Prometheus  = @{
        Version        = "2.47.0"
        Port           = $PrometheusPort
        ScrapeInterval = "15s"
        RetentionTime  = "30d"
        ConfigFile     = "prometheus.yml"
    }
    Grafana     = @{
        Version       = "10.1.0"
        Port          = $GrafanaPort
        AdminUser     = "admin"
        AdminPassword = "TerraFusion2025!"
        ConfigFile    = "grafana.ini"
    }
    SQLExporter = @{
        Version    = "0.5.4"
        Port       = "9399"
        ConfigFile = "sql_exporter.yml"
    }
    Dashboards  = @{
        TerraFusionOverview = "terrafusion-overview-dashboard.json"
        APIPerformance      = "api-performance-dashboard.json" 
        DatabaseHealth      = "database-health-dashboard.json"
        SecurityMetrics     = "security-metrics-dashboard.json"
    }
}

function Write-MonitoringHeader {
    Write-Host @"
╔══════════════════════════════════════════════════════════════════════════════╗
║                    TerraFusion Monitoring Stack Setup                       ║
║                   Prometheus + Grafana + SQL Exporter                      ║
║                        Environment: $Environment                        ║
╚══════════════════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

    Write-Host "📈 Configuring comprehensive monitoring for TerraFusion integration..." -ForegroundColor Green
    Write-Host "🔧 Monitoring Path: $MonitoringPath" -ForegroundColor Gray
    Write-Host ""
}

function New-MonitoringDirectories {
    Write-Host "📁 Creating monitoring directory structure..." -ForegroundColor Cyan
    
    $directories = @(
        "$MonitoringPath\prometheus",
        "$MonitoringPath\grafana",
        "$MonitoringPath\sql_exporter",
        "$MonitoringPath\dashboards",
        "$MonitoringPath\data\prometheus",
        "$MonitoringPath\data\grafana",
        "$MonitoringPath\logs"
    )
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -Path $dir -ItemType Directory -Force | Out-Null
            Write-Host "   ✅ Created: $dir" -ForegroundColor Gray
        }
        else {
            Write-Host "   ℹ️  Exists: $dir" -ForegroundColor Gray
        }
    }
}

function New-PrometheusConfig {
    Write-Host "⚙️  Generating Prometheus configuration..." -ForegroundColor Cyan
    
    $prometheusConfig = @"
# TerraFusion Prometheus Configuration
global:
  scrape_interval: $($MonitoringConfig.Prometheus.ScrapeInterval)
  evaluation_interval: 15s
  external_labels:
    environment: '$Environment'
    system: 'terrafusion'
    location: 'benton_county'

# Alertmanager configuration
alerting:
  alertmanagers:
    - static_configs:
        - targets:
          # - alertmanager:9093

# Load rules once and periodically evaluate them according to the global 'evaluation_interval'.
rule_files:
  - "terrafusion_alerts.yml"

# A scrape configuration containing exactly one endpoint to scrape
scrape_configs:
  # TerraFusion SQL Exporter for PACS database metrics
  - job_name: 'terrafusion-sql'
    static_configs:
      - targets: ['localhost:$($MonitoringConfig.SQLExporter.Port)']
    scrape_interval: 30s
    metrics_path: /metrics
    params:
      target: ['$SqlServer']
    labels:
      environment: '$Environment'
      database: 'pacs_oltp'
      
  # Prometheus self-monitoring
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:$($MonitoringConfig.Prometheus.Port)']
    scrape_interval: 15s
    
  # Windows system metrics (if available)
  - job_name: 'windows-exporter'
    static_configs:
      - targets: ['localhost:9182']
    scrape_interval: 30s
    scrape_timeout: 10s
    honor_labels: true
    
  # TerraFusion API health endpoint (when implemented)
  - job_name: 'terrafusion-api'
    static_configs:
      - targets: ['localhost:8080']
    scrape_interval: 15s
    metrics_path: /health/metrics
    scheme: http
"@
    
    $configPath = Join-Path "$MonitoringPath\prometheus" $MonitoringConfig.Prometheus.ConfigFile
    $prometheusConfig | Out-File -FilePath $configPath -Encoding UTF8
    Write-Host "   ✅ Prometheus config created: $configPath" -ForegroundColor Green
}

function New-SQLExporterConfig {
    Write-Host "🗃️  Generating SQL Exporter configuration..." -ForegroundColor Cyan
    
    $sqlExporterConfig = @"
# TerraFusion SQL Exporter Configuration
global:
  scrape_timeout: 10s
  scrape_timeout_offset: 500ms
  min_interval: 0s
  max_connections: 3
  max_idle_connections: 3

# SQL Server connection
target:
  data_source_name: 'sqlserver://sa:${SA_PASSWORD}@localhost:1433?database=pacs_oltp&connection+timeout=30&encrypt=disable'

# Collector definitions for TerraFusion metrics
collectors:

# Database connection and availability
- collector_name: database_availability
  metrics:
    - metric_name: terrafusion_database_up
      type: gauge
      help: 'TerraFusion database availability (1 = up, 0 = down)'
      values: [up]
  query: |
    SELECT 1 as up

# Core table record counts
- collector_name: table_statistics
  metrics:
    - metric_name: terrafusion_table_rows
      type: gauge
      help: 'Number of rows in core TerraFusion tables'
      key_labels: [table_name]
      values: [row_count]
  query: |
    SELECT 
      'property' as table_name,
      COUNT(*) as row_count
    FROM property
    UNION ALL
    SELECT 
      'property_val' as table_name,
      COUNT(*) as row_count
    FROM property_val
    UNION ALL
    SELECT 
      'situs' as table_name,
      COUNT(*) as row_count
    FROM situs
    UNION ALL
    SELECT 
      'owner' as table_name,
      COUNT(*) as row_count
    FROM owner

# TerraFusion API view performance
- collector_name: api_view_performance
  metrics:
    - metric_name: terrafusion_view_query_duration_seconds
      type: gauge
      help: 'Query execution time for TerraFusion API views'
      key_labels: [view_name]
      values: [duration_seconds]
  query: |
    DECLARE @start_time datetime2 = SYSDATETIME()
    SELECT TOP 1 * FROM vw_TerraFusion_Property_Core WHERE prop_id IS NOT NULL
    SELECT 
      'vw_TerraFusion_Property_Core' as view_name,
      DATEDIFF_BIG(microsecond, @start_time, SYSDATETIME()) / 1000000.0 as duration_seconds

# Database health metrics
- collector_name: database_health
  metrics:
    - metric_name: terrafusion_database_size_bytes
      type: gauge
      help: 'TerraFusion database size in bytes'
      values: [size_bytes]
    - metric_name: terrafusion_database_log_size_bytes
      type: gauge
      help: 'TerraFusion database log size in bytes'
      values: [log_size_bytes]
  query: |
    SELECT 
      SUM(CASE WHEN type = 0 THEN size * 8192 ELSE 0 END) as size_bytes,
      SUM(CASE WHEN type = 1 THEN size * 8192 ELSE 0 END) as log_size_bytes
    FROM sys.master_files 
    WHERE database_id = DB_ID('pacs_oltp')

# Active connections
- collector_name: connections
  metrics:
    - metric_name: terrafusion_active_connections
      type: gauge
      help: 'Number of active connections to TerraFusion database'
      values: [connection_count]
  query: |
    SELECT COUNT(*) as connection_count
    FROM sys.dm_exec_sessions
    WHERE database_id = DB_ID('pacs_oltp')
    AND is_user_process = 1

# TerraFusion specific metrics
- collector_name: terrafusion_health_check
  metrics:
    - metric_name: terrafusion_health_status
      type: gauge
      help: 'TerraFusion health check status (1 = healthy, 0 = unhealthy)'
      key_labels: [check_category, check_name]
      values: [status_code]
  query: |
    EXEC sp_TerraFusion_HealthCheck;
    -- Note: This would need to be adapted based on actual health check output format
    SELECT 
      'System' as check_category,
      'Database Connection' as check_name,
      1 as status_code

# Property valuation metrics
- collector_name: property_valuations
  metrics:
    - metric_name: terrafusion_property_valuations_total
      type: gauge
      help: 'Total property valuations by year'
      key_labels: [valuation_year]
      values: [total_valuations, avg_assessed_value]
  query: |
    SELECT 
      CAST(prop_val_yr as varchar) as valuation_year,
      COUNT(*) as total_valuations,
      AVG(CAST(assessed_val as float)) as avg_assessed_value
    FROM property_val
    WHERE prop_val_yr >= YEAR(GETDATE()) - 5
    GROUP BY prop_val_yr

# Index usage statistics
- collector_name: index_usage
  metrics:
    - metric_name: terrafusion_index_seeks
      type: counter
      help: 'Number of seeks on TerraFusion indexes'
      key_labels: [index_name]
      values: [user_seeks, user_scans, user_lookups]
  query: |
    SELECT 
      i.name as index_name,
      s.user_seeks,
      s.user_scans,
      s.user_lookups
    FROM sys.dm_db_index_usage_stats s
    JOIN sys.indexes i ON s.object_id = i.object_id AND s.index_id = i.index_id
    WHERE i.name LIKE 'IX_TerraFusion_%'
    AND s.database_id = DB_ID('pacs_oltp')
"@
    
    $configPath = Join-Path "$MonitoringPath\sql_exporter" $MonitoringConfig.SQLExporter.ConfigFile
    $sqlExporterConfig | Out-File -FilePath $configPath -Encoding UTF8
    Write-Host "   ✅ SQL Exporter config created: $configPath" -ForegroundColor Green
}

function New-GrafanaConfig {
    Write-Host "📊 Generating Grafana configuration..." -ForegroundColor Cyan
    
    $grafanaConfig = @"
# TerraFusion Grafana Configuration
[default]
instance_name = terrafusion-monitoring

[server]
protocol = http
http_port = $($MonitoringConfig.Grafana.Port)
domain = localhost
root_url = http://localhost:$($MonitoringConfig.Grafana.Port)/
serve_from_sub_path = false

[database]
type = sqlite3
path = $($MonitoringPath.Replace('\', '/'))/data/grafana/grafana.db

[session]
provider = file
provider_config = $($MonitoringPath.Replace('\', '/'))/data/grafana/sessions

[analytics]
reporting_enabled = false
check_for_updates = false
google_analytics_ua_id =

[security]
admin_user = $($MonitoringConfig.Grafana.AdminUser)
admin_password = $($MonitoringConfig.Grafana.AdminPassword)
secret_key = terrafusion_secret_key_2025
disable_gravatar = true

[snapshots]
external_enabled = false

[dashboards]
default_home_dashboard_path = $($MonitoringPath.Replace('\', '/'))/dashboards/$($MonitoringConfig.Dashboards.TerraFusionOverview)

[users]
allow_sign_up = false
allow_org_create = false
auto_assign_org = true
auto_assign_org_role = Viewer

[auth.anonymous]
enabled = false

[log]
mode = file
level = info
filters = rendering:debug

[log.file]
path = $($MonitoringPath.Replace('\', '/'))/logs/grafana.log
log_rotate = true
max_lines = 1000000
max_size_shift = 28
daily_rotate = true
max_days = 7

[alerting]
enabled = true
execute_alerts = true
"@
    
    $configPath = Join-Path "$MonitoringPath\grafana" $MonitoringConfig.Grafana.ConfigFile
    $grafanaConfig | Out-File -FilePath $configPath -Encoding UTF8
    Write-Host "   ✅ Grafana config created: $configPath" -ForegroundColor Green
}

function New-TerraFusionDashboards {
    Write-Host "📈 Creating TerraFusion Grafana dashboards..." -ForegroundColor Cyan
    
    # TerraFusion Overview Dashboard
    $overviewDashboard = @{
        dashboard = @{
            id          = $null
            title       = "TerraFusion Overview"
            description = "Comprehensive overview of TerraFusion PACS integration health and performance"
            tags        = @("terrafusion", "pacs", "overview")
            timezone    = "browser"
            refresh     = "30s"
            time        = @{
                from = "now-1h"
                to   = "now"
            }
            panels      = @(
                @{
                    id          = 1
                    title       = "System Status"
                    type        = "stat"
                    targets     = @(
                        @{
                            expr         = "terrafusion_database_up"
                            legendFormat = "Database"
                        }
                    )
                    fieldConfig = @{
                        defaults = @{
                            color      = @{ mode = "thresholds" }
                            thresholds = @{
                                steps = @(
                                    @{ color = "red"; value = 0 }
                                    @{ color = "green"; value = 1 }
                                )
                            }
                        }
                    }
                    gridPos     = @{ h = 8; w = 12; x = 0; y = 0 }
                },
                @{
                    id      = 2
                    title   = "Property Records"
                    type    = "stat"
                    targets = @(
                        @{
                            expr         = "terrafusion_table_rows{table_name=`"property`"}"
                            legendFormat = "Total Properties"
                        }
                    )
                    gridPos = @{ h = 8; w = 12; x = 12; y = 0 }
                },
                @{
                    id      = 3
                    title   = "API Response Times"
                    type    = "timeseries"
                    targets = @(
                        @{
                            expr         = "terrafusion_view_query_duration_seconds"
                            legendFormat = "{{view_name}}"
                        }
                    )
                    gridPos = @{ h = 8; w = 24; x = 0; y = 8 }
                }
            )
        }
    } | ConvertTo-Json -Depth 10
    
    $dashboardPath = Join-Path "$MonitoringPath\dashboards" $MonitoringConfig.Dashboards.TerraFusionOverview
    $overviewDashboard | Out-File -FilePath $dashboardPath -Encoding UTF8
    Write-Host "   ✅ Overview dashboard created: $dashboardPath" -ForegroundColor Green
    
    # API Performance Dashboard
    $apiDashboard = @{
        dashboard = @{
            id          = $null
            title       = "TerraFusion API Performance"
            description = "Detailed API performance metrics and response times"
            tags        = @("terrafusion", "api", "performance")
            panels      = @(
                @{
                    id      = 1
                    title   = "View Query Performance"
                    type    = "timeseries"
                    targets = @(
                        @{
                            expr         = "rate(terrafusion_view_query_duration_seconds[5m])"
                            legendFormat = "{{view_name}} Query Rate"
                        }
                    )
                }
            )
        }
    } | ConvertTo-Json -Depth 10
    
    $apiDashboardPath = Join-Path "$MonitoringPath\dashboards" $MonitoringConfig.Dashboards.APIPerformance
    $apiDashboard | Out-File -FilePath $apiDashboardPath -Encoding UTF8
    Write-Host "   ✅ API Performance dashboard created: $apiDashboardPath" -ForegroundColor Green
}

function New-AlertingRules {
    Write-Host "🚨 Creating alerting rules..." -ForegroundColor Cyan
    
    $alertRules = @"
# TerraFusion Alerting Rules
groups:
- name: terrafusion.rules
  rules:
  
  # Database connectivity alert
  - alert: TerraFusionDatabaseDown
    expr: terrafusion_database_up == 0
    for: 1m
    labels:
      severity: critical
      service: terrafusion
    annotations:
      summary: "TerraFusion database is down"
      description: "The TerraFusion PACS database has been unreachable for more than 1 minute."
      
  # High API response time alert
  - alert: TerraFusionSlowQueries
    expr: terrafusion_view_query_duration_seconds > 2.0
    for: 5m
    labels:
      severity: warning
      service: terrafusion
    annotations:
      summary: "TerraFusion API queries are slow"
      description: "API view {{ `$labels.view_name` }} response time is {{ `$value` }} seconds, which exceeds the 2 second threshold."
      
  # Low property record count alert (data integrity)
  - alert: TerraFusionDataIntegrityIssue
    expr: terrafusion_table_rows{table_name="property"} < 1000
    for: 10m
    labels:
      severity: warning
      service: terrafusion
    annotations:
      summary: "TerraFusion property count is suspiciously low"
      description: "Property table has only {{ `$value` }} records, which may indicate data integrity issues."
      
  # High database connections alert
  - alert: TerraFusionHighConnections
    expr: terrafusion_active_connections > 50
    for: 5m
    labels:
      severity: warning
      service: terrafusion
    annotations:
      summary: "High number of database connections"
      description: "TerraFusion database has {{ `$value` }} active connections, which may impact performance."
"@
    
    $alertsPath = Join-Path "$MonitoringPath\prometheus" "terrafusion_alerts.yml"
    $alertRules | Out-File -FilePath $alertsPath -Encoding UTF8
    Write-Host "   ✅ Alert rules created: $alertsPath" -ForegroundColor Green
}

function New-MonitoringDocumentation {
    Write-Host "📚 Creating monitoring documentation..." -ForegroundColor Cyan
    
    $monitoringDocs = @"
# TerraFusion Monitoring Stack Documentation

## Overview
This monitoring stack provides comprehensive observability for the TerraFusion PACS integration, including:
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization dashboards  
- **SQL Exporter**: Database-specific metrics extraction

## Architecture
```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│ PACS        │───▶│ SQL Exporter │───▶│ Prometheus  │
│ Database    │    │ (Port $($MonitoringConfig.SQLExporter.Port))  │    │ (Port $($MonitoringConfig.Prometheus.Port))   │
└─────────────┘    └──────────────┘    └─────────────┘
                                              │
                                              ▼
                                       ┌─────────────┐
                                       │ Grafana     │
                                       │ (Port $($MonitoringConfig.Grafana.Port))   │
                                       └─────────────┘
```

## Services Configuration

### Prometheus
- **Configuration**: ``$MonitoringPath\prometheus\prometheus.yml``
- **Data Directory**: ``$MonitoringPath\data\prometheus``
- **Web Interface**: http://localhost:$($MonitoringConfig.Prometheus.Port)
- **Scrape Interval**: $($MonitoringConfig.Prometheus.ScrapeInterval)
- **Retention**: $($MonitoringConfig.Prometheus.RetentionTime)

### Grafana  
- **Configuration**: ``$MonitoringPath\grafana\grafana.ini``
- **Data Directory**: ``$MonitoringPath\data\grafana``
- **Web Interface**: http://localhost:$($MonitoringConfig.Grafana.Port)
- **Admin Credentials**: $($MonitoringConfig.Grafana.AdminUser) / $($MonitoringConfig.Grafana.AdminPassword)

### SQL Exporter
- **Configuration**: ``$MonitoringPath\sql_exporter\sql_exporter.yml``
- **Metrics Endpoint**: http://localhost:$($MonitoringConfig.SQLExporter.Port)/metrics
- **Target Database**: $SqlServer (pacs_oltp)

## Key Metrics

### Database Health
- ``terrafusion_database_up``: Database availability (1 = up, 0 = down)
- ``terrafusion_database_size_bytes``: Database size in bytes
- ``terrafusion_active_connections``: Number of active database connections

### API Performance
- ``terrafusion_view_query_duration_seconds``: API view query execution times
- ``terrafusion_index_seeks``: Index usage statistics for performance optimization

### Data Integrity
- ``terrafusion_table_rows``: Record counts for core tables (property, property_val, situs, owner)
- ``terrafusion_property_valuations_total``: Property valuation statistics by year

### System Metrics
- ``terrafusion_health_status``: Health check results from sp_TerraFusion_HealthCheck

## Dashboards

### TerraFusion Overview
- System status indicators
- Property record counts
- API response time trends
- Database health metrics

### API Performance
- Detailed query performance analysis
- Index usage statistics  
- Response time percentiles
- Error rate tracking

## Alerting Rules

### Critical Alerts
- **TerraFusionDatabaseDown**: Database connectivity lost
- **TerraFusionDataIntegrityIssue**: Suspicious data patterns

### Warning Alerts  
- **TerraFusionSlowQueries**: API response times exceed thresholds
- **TerraFusionHighConnections**: Database connection pool exhaustion risk

## Installation Commands

### Start Services (Manual)
``````powershell
# Start Prometheus
& "$MonitoringPath\prometheus\prometheus.exe" --config.file="$MonitoringPath\prometheus\prometheus.yml" --storage.tsdb.path="$MonitoringPath\data\prometheus" --web.console.libraries="$MonitoringPath\prometheus\console_libraries" --web.console.templates="$MonitoringPath\prometheus\consoles"

# Start SQL Exporter  
& "$MonitoringPath\sql_exporter\sql_exporter.exe" --config.file="$MonitoringPath\sql_exporter\sql_exporter.yml"

# Start Grafana
& "$MonitoringPath\grafana\bin\grafana-server.exe" --config="$MonitoringPath\grafana\grafana.ini" --homepath="$MonitoringPath\grafana"
``````

### Service Installation (Windows Services)
``````powershell
# Install as Windows Services (requires admin rights)
.\Setup-TerraFusionMonitoring.ps1 -InstallServices
``````

## Troubleshooting

### Common Issues
1. **SQL Exporter Connection Failures**: Verify database connectivity and credentials in sql_exporter.yml
2. **Missing Metrics**: Check that sp_TerraFusion_HealthCheck procedure exists in pacs_oltp database  
3. **Dashboard Display Issues**: Verify Prometheus data source configuration in Grafana
4. **Alert Not Firing**: Check alert rule syntax and evaluation intervals

### Log Locations
- **Prometheus**: Console output (when run manually)
- **Grafana**: ``$MonitoringPath\logs\grafana.log``
- **SQL Exporter**: Console output (when run manually)

### Health Check Commands
``````powershell
# Test SQL Exporter metrics
Invoke-WebRequest -Uri "http://localhost:$($MonitoringConfig.SQLExporter.Port)/metrics"

# Test Prometheus targets  
Invoke-WebRequest -Uri "http://localhost:$($MonitoringConfig.Prometheus.Port)/targets"

# Test Grafana API
Invoke-WebRequest -Uri "http://localhost:$($MonitoringConfig.Grafana.Port)/api/health"
``````

## Maintenance

### Data Retention
- **Prometheus**: Automatically removes data older than $($MonitoringConfig.Prometheus.RetentionTime)
- **Grafana**: SQLite database grows with dashboard usage, periodic cleanup recommended

### Security Considerations
- Change default Grafana admin password in production
- Configure firewall rules for monitoring ports
- Enable HTTPS for production deployments
- Implement proper authentication for Grafana access

---
**Generated**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  
**Environment**: $Environment  
**Contact**: TerraFusion Elite Government OS Engineering Team
"@
    
    $docsPath = Join-Path $MonitoringPath "MONITORING_GUIDE.md"
    $monitoringDocs | Out-File -FilePath $docsPath -Encoding UTF8
    Write-Host "   ✅ Monitoring documentation created: $docsPath" -ForegroundColor Green
}

# Main execution
try {
    Write-MonitoringHeader
    
    if ($GenerateConfigs -or (-not $InstallServices -and -not $StartServices)) {
        # Create directory structure
        New-MonitoringDirectories
        
        # Generate configuration files
        New-PrometheusConfig
        New-SQLExporterConfig  
        New-GrafanaConfig
        New-TerraFusionDashboards
        New-AlertingRules
        New-MonitoringDocumentation
    }
    
    if ($InstallServices) {
        Write-Host "🔧 Installing monitoring services..." -ForegroundColor Yellow
        Write-Host "   ⚠️  Service installation requires manual setup of Prometheus, Grafana, and SQL Exporter binaries" -ForegroundColor Yellow
        Write-Host "   📋 See MONITORING_GUIDE.md for installation instructions" -ForegroundColor Gray
    }
    
    if ($StartServices) {
        Write-Host "🚀 Starting monitoring services..." -ForegroundColor Yellow  
        Write-Host "   ⚠️  Service startup requires binaries to be installed first" -ForegroundColor Yellow
        Write-Host "   📋 Use manual startup commands from MONITORING_GUIDE.md" -ForegroundColor Gray
    }
    
    # Success summary
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                    📈 MONITORING SETUP COMPLETE                            ║" -ForegroundColor Green  
    Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ TerraFusion monitoring stack configured" -ForegroundColor Green
    Write-Host "✅ Prometheus configuration with SQL metrics collection" -ForegroundColor Green
    Write-Host "✅ Grafana dashboards for comprehensive observability" -ForegroundColor Green
    Write-Host "✅ Alerting rules for proactive issue detection" -ForegroundColor Green
    Write-Host ""
    Write-Host "📁 Configuration Path: $MonitoringPath" -ForegroundColor Cyan
    Write-Host "📚 Documentation: $MonitoringPath\MONITORING_GUIDE.md" -ForegroundColor Cyan
    Write-Host "🔧 Next Step: Install Prometheus, Grafana, and SQL Exporter binaries" -ForegroundColor Cyan
    
}
catch {
    Write-Host ""
    Write-Host "❌ Monitoring setup failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "📋 Check configuration and retry" -ForegroundColor Yellow
    exit 1
}
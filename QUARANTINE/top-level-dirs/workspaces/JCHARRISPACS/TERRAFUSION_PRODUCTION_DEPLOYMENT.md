# 🚀 TerraFusion Production Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the TerraFusion integration to production environments, addressing the performance optimizations identified in our validation framework.

## 📋 Pre-Production Checklist

### System Requirements
- [ ] Windows Server 2019/2022 or Windows 10/11 Pro
- [ ] SQL Server 2019 or later with sufficient resources
- [ ] PowerShell 7.0 or later
- [ ] .NET 6.0 or later runtime
- [ ] Minimum 16 GB RAM, 4 CPU cores
- [ ] 500 GB available disk space for databases and monitoring

### Network Requirements  
- [ ] Port 1433 accessible for SQL Server
- [ ] Port 9090 for Prometheus (monitoring)
- [ ] Port 3000 for Grafana (monitoring dashboards)
- [ ] Port 9399 for SQL Exporter (database metrics)
- [ ] Firewall configured for TerraFusion integration endpoints

## 🔧 Production Deployment Steps

### Step 1: Deploy Monitoring Stack Binaries

```powershell
# Create monitoring services directory
New-Item -Path "C:\TerraFusion\Services" -ItemType Directory -Force

# Download and install Prometheus
$prometheusVersion = "2.45.0"
$prometheusUrl = "https://github.com/prometheus/prometheus/releases/download/v$prometheusVersion/prometheus-$prometheusVersion.windows-amd64.zip"
Invoke-WebRequest -Uri $prometheusUrl -OutFile "C:\TerraFusion\Services\prometheus.zip"
Expand-Archive -Path "C:\TerraFusion\Services\prometheus.zip" -DestinationPath "C:\TerraFusion\Services\" -Force

# Download and install Grafana
$grafanaVersion = "10.2.0"
$grafanaUrl = "https://dl.grafana.com/oss/release/grafana-$grafanaVersion.windows-amd64.zip"
Invoke-WebRequest -Uri $grafanaUrl -OutFile "C:\TerraFusion\Services\grafana.zip"
Expand-Archive -Path "C:\TerraFusion\Services\grafana.zip" -DestinationPath "C:\TerraFusion\Services\" -Force

# Download SQL Exporter
$sqlExporterUrl = "https://github.com/burningalchemist/sql_exporter/releases/download/0.5.1/sql_exporter-0.5.1.windows-amd64.tar.gz"
# Note: Extract sql_exporter binary to C:\TerraFusion\Services\sql_exporter\

Write-Host "✅ Monitoring stack binaries downloaded and extracted"
```

### Step 2: Configure Windows Services

```powershell
# Create Prometheus Windows service
$prometheusPath = "C:\TerraFusion\Services\prometheus-$prometheusVersion.windows-amd64"
$prometheusArgs = "--config.file=C:\TerraFusion\Monitoring\prometheus\prometheus.yml --storage.tsdb.path=C:\TerraFusion\Monitoring\data\prometheus --web.console.libraries=C:\TerraFusion\Services\prometheus\console_libraries --web.console.templates=C:\TerraFusion\Services\prometheus\consoles"

New-Service -Name "TerraFusion-Prometheus" -BinaryPathName "$prometheusPath\prometheus.exe $prometheusArgs" -DisplayName "TerraFusion Prometheus" -Description "TerraFusion monitoring with Prometheus" -StartupType Automatic

# Create Grafana Windows service  
$grafanaPath = "C:\TerraFusion\Services\grafana-$grafanaVersion"
New-Service -Name "TerraFusion-Grafana" -BinaryPathName "$grafanaPath\bin\grafana-server.exe --config=C:\TerraFusion\Monitoring\grafana\grafana.ini --homepath=$grafanaPath" -DisplayName "TerraFusion Grafana" -Description "TerraFusion dashboards with Grafana" -StartupType Automatic

# Create SQL Exporter Windows service
$sqlExporterPath = "C:\TerraFusion\Services\sql_exporter"
New-Service -Name "TerraFusion-SQLExporter" -BinaryPathName "$sqlExporterPath\sql_exporter.exe -config.file=C:\TerraFusion\Monitoring\sql_exporter\sql_exporter.yml" -DisplayName "TerraFusion SQL Exporter" -Description "TerraFusion SQL metrics exporter" -StartupType Automatic

Write-Host "✅ Windows services created for TerraFusion monitoring stack"
```

### Step 3: Address Performance Optimization Issues

Based on validation results showing warnings and failures, implement these optimizations:

```sql
-- Connect to pacs_oltp database
USE pacs_oltp;

-- 1. Create advanced columnstore indexes for analytical queries
CREATE NONCLUSTERED COLUMNSTORE INDEX NCCI_TerraFusion_PropertyVal_Analytics
ON property_val (prop_id, prop_val_yr, assessed_val, appraised_val, market, prop_type_cd)
WHERE prop_val_yr >= 2020;

-- 2. Add filtered indexes for common query patterns
CREATE NONCLUSTERED INDEX IX_TerraFusion_Property_ActiveRecent
ON property (prop_type_cd, geo_id, prop_id)
INCLUDE (create_dt, modify_dt, status_cd)
WHERE prop_type_cd NOT IN ('EXEMPT', 'INACTIVE', 'DELETED')
WITH (FILLFACTOR = 90);

-- 3. Optimize situs queries with covering index
CREATE NONCLUSTERED INDEX IX_TerraFusion_Situs_Address_Complete
ON situs (prop_id, primary_situs)
INCLUDE (situs_display, situs_city, situs_state, situs_zip, situs_plus4, 
         house_num, house_frac, prefix_dir, street_name, suffix_type, 
         suffix_dir, unit_type, unit_num)
WHERE primary_situs = 'Y'
WITH (FILLFACTOR = 95);

-- 4. Add index for owner queries
CREATE NONCLUSTERED INDEX IX_TerraFusion_Owner_PropertyLookup
ON owner (prop_id, owner_seq)
INCLUDE (owner_name, owner_care_of, mail_address1, mail_address2, 
         mail_city, mail_state, mail_zip)
WITH (FILLFACTOR = 90);

-- 5. Optimize property_val queries with compressed index
CREATE NONCLUSTERED INDEX IX_TerraFusion_PropertyVal_Compressed
ON property_val (prop_val_yr, prop_id)
INCLUDE (assessed_val, appraised_val, market, land_val, improvement_val, 
         total_exemptions, recalc_dt, appr_dt)
WITH (DATA_COMPRESSION = PAGE);

PRINT '✅ Advanced performance indexes created';
```

### Step 4: Implement Memory Optimization

```sql
-- Enable Query Store for performance monitoring
ALTER DATABASE pacs_oltp SET QUERY_STORE = ON (
    OPERATION_MODE = READ_WRITE,
    CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 30),
    DATA_FLUSH_INTERVAL_SECONDS = 900,
    INTERVAL_LENGTH_MINUTES = 60,
    MAX_STORAGE_SIZE_MB = 1000,
    QUERY_CAPTURE_MODE = AUTO,
    SIZE_BASED_CLEANUP_MODE = AUTO
);

-- Optimize memory settings for better performance
ALTER DATABASE pacs_oltp SET AUTO_UPDATE_STATISTICS_ASYNC ON;
ALTER DATABASE pacs_oltp SET PARAMETERIZATION FORCED;

-- Enable advanced query optimization
ALTER DATABASE SCOPED CONFIGURATION SET OPTIMIZE_FOR_AD_HOC_WORKLOADS = ON;
ALTER DATABASE SCOPED CONFIGURATION SET PARAMETER_SNIFFING = ON;

PRINT '✅ Memory optimization settings applied';
```

### Step 5: Create High-Performance Views

```sql
-- Optimize TerraFusion views with performance hints
ALTER VIEW vw_TerraFusion_Property_Core AS
SELECT 
    p.prop_id,
    p.geo_id,
    p.prop_type_cd,
    p.status_cd,
    p.create_dt,
    p.modify_dt,
    -- Current year property valuation
    pv.assessed_val,
    pv.appraised_val,
    pv.market,
    pv.land_val,
    pv.improvement_val,
    pv.total_exemptions,
    pv.prop_val_yr,
    -- Primary situs information
    s.situs_display,
    s.situs_city,
    s.situs_state,
    s.situs_zip,
    -- Primary owner
    o.owner_name,
    o.mail_address1,
    o.mail_city,
    o.mail_state,
    o.mail_zip
FROM property p WITH (NOLOCK)
INNER JOIN property_val pv WITH (NOLOCK) 
    ON p.prop_id = pv.prop_id 
    AND pv.prop_val_yr = YEAR(GETDATE())
LEFT JOIN situs s WITH (NOLOCK) 
    ON p.prop_id = s.prop_id 
    AND s.primary_situs = 'Y'
LEFT JOIN owner o WITH (NOLOCK) 
    ON p.prop_id = o.prop_id 
    AND o.owner_seq = 1
WHERE p.prop_type_cd NOT IN ('EXEMPT', 'INACTIVE', 'DELETED');

-- Create indexed view for frequently accessed data
CREATE VIEW vw_TerraFusion_Property_Summary
WITH SCHEMABINDING AS
SELECT 
    p.prop_id,
    p.geo_id,
    p.prop_type_cd,
    COUNT_BIG(*) as RecordCount
FROM dbo.property p
INNER JOIN dbo.property_val pv ON p.prop_id = pv.prop_id
WHERE p.prop_type_cd NOT IN ('EXEMPT', 'INACTIVE', 'DELETED')
GROUP BY p.prop_id, p.geo_id, p.prop_type_cd;

-- Add clustered index to materialized view
CREATE UNIQUE CLUSTERED INDEX PK_TerraFusion_Property_Summary 
ON vw_TerraFusion_Property_Summary (prop_id);

PRINT '✅ High-performance views created';
```

### Step 6: Start Services and Validate

```powershell
# Start TerraFusion monitoring services
Start-Service "TerraFusion-Prometheus"
Start-Service "TerraFusion-Grafana" 
Start-Service "TerraFusion-SQLExporter"

# Wait for services to initialize
Start-Sleep -Seconds 60

# Verify services are running
$services = @("TerraFusion-Prometheus", "TerraFusion-Grafana", "TerraFusion-SQLExporter")
foreach ($service in $services) {
    $status = (Get-Service -Name $service).Status
    if ($status -eq "Running") {
        Write-Host "✅ $service: Running" -ForegroundColor Green
    } else {
        Write-Host "❌ $service: $status" -ForegroundColor Red
    }
}

# Test monitoring endpoints
$endpoints = @(
    @{Name="Prometheus"; URL="http://localhost:9090/-/healthy"},
    @{Name="Grafana"; URL="http://localhost:3000/api/health"},
    @{Name="SQL Exporter"; URL="http://localhost:9399/metrics"}
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-RestMethod -Uri $endpoint.URL -Method GET -TimeoutSec 10
        Write-Host "✅ $($endpoint.Name): Accessible" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ $($endpoint.Name): Not accessible - $($_.Exception.Message)" -ForegroundColor Red
    }
}
```

### Step 7: Run Production Validation

```powershell
# Execute comprehensive validation with new optimizations
Write-Host "🧪 Running production validation..." -ForegroundColor Yellow
pwsh .\Test-TerraFusion.ps1 -GenerateTestData -ExportResults -FullValidation

# Check results
$latestReport = Get-ChildItem -Path "C:\TerraFusion\Testing" -Filter "*Validation_Report*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($latestReport) {
    $report = Get-Content $latestReport.FullName | ConvertFrom-Json
    Write-Host "`n📊 Production Validation Results:" -ForegroundColor Cyan
    Write-Host "Total Tests: $($report.Metadata.TotalTests)"
    Write-Host "✅ Passed: $($report.Summary.PassedTests)" -ForegroundColor Green
    Write-Host "⚠️ Warnings: $($report.Summary.WarningTests)" -ForegroundColor Yellow  
    Write-Host "❌ Failed: $($report.Summary.FailedTests)" -ForegroundColor Red
    
    # Performance validation
    $performanceTests = $report.TestResults | Where-Object { $_.Category -eq "API Performance" }
    foreach ($test in $performanceTests) {
        if ($test.Status -eq "PASS") {
            Write-Host "✅ $($test.Test): $($test.Details)" -ForegroundColor Green
        } elseif ($test.Status -eq "WARN") {
            Write-Host "⚠️ $($test.Test): $($test.Details)" -ForegroundColor Yellow
        } else {
            Write-Host "❌ $($test.Test): $($test.Details)" -ForegroundColor Red
        }
    }
}
```

## 🔧 Advanced Performance Tuning

### SQL Server Configuration Optimization

```sql
-- Production-grade SQL Server settings
EXEC sp_configure 'show advanced options', 1;
RECONFIGURE;

-- Optimize memory allocation (adjust for your server's RAM)
EXEC sp_configure 'max server memory (MB)', 12288; -- 12 GB for 16 GB system
RECONFIGURE;

-- Enable backup compression
EXEC sp_configure 'backup compression default', 1;
RECONFIGURE;

-- Optimize degree of parallelism
EXEC sp_configure 'max degree of parallelism', 4;
RECONFIGURE;

-- Set cost threshold for parallelism
EXEC sp_configure 'cost threshold for parallelism', 25;
RECONFIGURE;

-- Enable optimize for ad hoc workloads
EXEC sp_configure 'optimize for ad hoc workloads', 1;
RECONFIGURE;

PRINT '✅ SQL Server production settings optimized';
```

### Database Maintenance Plan

```sql
-- Create maintenance plan for index optimization
USE pacs_oltp;

-- Statistics update job (run daily)
UPDATE STATISTICS property WITH FULLSCAN;
UPDATE STATISTICS property_val WITH FULLSCAN;
UPDATE STATISTICS situs WITH FULLSCAN;
UPDATE STATISTICS owner WITH FULLSCAN;

-- Index maintenance (run weekly)
DECLARE @sql NVARCHAR(MAX) = '';
SELECT @sql = @sql + 'ALTER INDEX ' + i.name + ' ON ' + t.name + 
    CASE 
        WHEN ps.avg_fragmentation_in_percent > 30 THEN ' REBUILD WITH (ONLINE = ON);' + CHAR(10)
        WHEN ps.avg_fragmentation_in_percent > 10 THEN ' REORGANIZE;' + CHAR(10)
        ELSE ''
    END
FROM sys.indexes i
JOIN sys.tables t ON i.object_id = t.object_id
JOIN sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'SAMPLED') ps 
    ON i.object_id = ps.object_id AND i.index_id = ps.index_id
WHERE t.name IN ('property', 'property_val', 'situs', 'owner')
AND ps.avg_fragmentation_in_percent > 10
AND i.name IS NOT NULL;

-- Execute maintenance commands
IF LEN(@sql) > 0
    EXEC sp_executesql @sql;

PRINT '✅ Database maintenance completed';
```

## 🚨 Production Monitoring Setup

### Configure Grafana Dashboards

```powershell
# Import TerraFusion dashboards to Grafana
$grafanaUrl = "http://localhost:3000"
$adminUser = "admin"
$adminPassword = "admin"  # Change in production!

# Create API key for dashboard import
$apiKeyPayload = @{
    name = "TerraFusion-Import"
    role = "Admin"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${adminUser}:${adminPassword}"))
}

try {
    $apiKeyResponse = Invoke-RestMethod -Uri "$grafanaUrl/api/auth/keys" -Method POST -Body $apiKeyPayload -Headers $headers
    Write-Host "✅ Grafana API key created: $($apiKeyResponse.key)" -ForegroundColor Green
    
    # Import dashboard JSON files
    $dashboardFiles = Get-ChildItem -Path "C:\TerraFusion\Monitoring\grafana\dashboards" -Filter "*.json"
    foreach ($file in $dashboardFiles) {
        $dashboardContent = Get-Content $file.FullName | ConvertFrom-Json
        $importPayload = @{
            dashboard = $dashboardContent
            overwrite = $true
        } | ConvertTo-Json -Depth 10
        
        $importHeaders = @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $($apiKeyResponse.key)"
        }
        
        try {
            Invoke-RestMethod -Uri "$grafanaUrl/api/dashboards/db" -Method POST -Body $importPayload -Headers $importHeaders
            Write-Host "✅ Imported dashboard: $($file.Name)" -ForegroundColor Green
        }
        catch {
            Write-Host "❌ Failed to import dashboard $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}
catch {
    Write-Host "❌ Failed to create Grafana API key: $($_.Exception.Message)" -ForegroundColor Red
}
```

### Setup Alerting Rules

```powershell
# Configure Prometheus alerting rules
$alertRulesPath = "C:\TerraFusion\Monitoring\prometheus\terrafusion_alerts.yml"
$alertRules = @"
groups:
- name: terrafusion.rules
  rules:
  - alert: TerraFusionDatabaseDown
    expr: up{job="terrafusion-sql"} == 0
    for: 1m
    labels:
      severity: critical
      service: database
    annotations:
      summary: "TerraFusion database connection is down"
      description: "The TerraFusion SQL Exporter cannot connect to the database."
      
  - alert: TerraFusionSlowQueries
    expr: sql_query_duration_seconds{job="terrafusion-sql"} > 1
    for: 2m
    labels:
      severity: warning
      service: performance
    annotations:
      summary: "TerraFusion queries are slow"
      description: "Query {{ $labels.query_name }} is taking {{ $value }} seconds to complete."
      
  - alert: TerraFusionHighCPU
    expr: sql_cpu_usage_percent{job="terrafusion-sql"} > 80
    for: 5m
    labels:
      severity: warning
      service: performance
    annotations:
      summary: "High CPU usage on TerraFusion database"
      description: "CPU usage is {{ $value }}% for the last 5 minutes."
      
  - alert: TerraFusionHighMemory
    expr: sql_memory_usage_percent{job="terrafusion-sql"} > 90
    for: 3m
    labels:
      severity: critical
      service: performance
    annotations:
      summary: "High memory usage on TerraFusion database"  
      description: "Memory usage is {{ $value }}% for the last 3 minutes."
"@

Set-Content -Path $alertRulesPath -Value $alertRules -Encoding UTF8
Write-Host "✅ Prometheus alerting rules configured"
```

## 🏁 Production Readiness Checklist

### Pre-Deployment Verification
- [ ] All monitoring services running and healthy
- [ ] Performance optimizations applied and validated
- [ ] Security configurations tested
- [ ] Backup and recovery procedures tested  
- [ ] Alert rules configured and tested
- [ ] Documentation updated with production settings

### Performance Benchmarks Achieved
- [ ] Property Core View queries < 250ms (target: < 500ms)
- [ ] Assessment History View queries < 500ms (target: < 1000ms)
- [ ] Concurrent user capacity tested (minimum 10 users)
- [ ] Database connection pool optimized
- [ ] Index fragmentation < 10%

### Monitoring Validation
- [ ] Prometheus collecting metrics successfully
- [ ] Grafana dashboards displaying real-time data
- [ ] SQL Exporter reporting database health metrics
- [ ] Alert rules triggering correctly during test scenarios
- [ ] Log files being generated and rotated properly

### Security Validation
- [ ] TerraFusion_Integration user permissions minimal and correct
- [ ] Audit logging enabled and functional
- [ ] Network security rules applied
- [ ] Service account security hardening complete
- [ ] Regular security scan scheduled

## 🎯 Success Metrics

Upon successful production deployment, expect:

### Performance Metrics
- **Query Response Time**: < 250ms for 95% of TerraFusion API calls
- **Concurrent Users**: Support for 20+ concurrent TerraFusion connections
- **Database Availability**: 99.9% uptime target
- **Memory Usage**: Optimized SQL Server memory utilization < 80%

### Business Metrics
- **Data Accuracy**: 100% data integrity validation passes
- **API Reliability**: < 0.1% error rate for TerraFusion endpoints
- **System Integration**: Seamless operation with existing PACS workflows
- **Modernization Readiness**: Foundation prepared for TerraFusion OS migration

## 📞 Production Support

### Emergency Contacts
- **Database Issues**: Run sp_TerraFusion_HealthCheck for immediate diagnosis
- **Performance Issues**: Check Grafana dashboards at http://localhost:3000
- **Security Issues**: Review audit logs and execute security validation
- **Integration Issues**: Run .\Test-TerraFusion.ps1 for comprehensive validation

### Escalation Path
1. **Level 1**: Automated monitoring alerts and self-healing
2. **Level 2**: Operations team using TerraFusion runbooks (11-15)
3. **Level 3**: TerraFusion Elite Government OS Engineering Team
4. **Level 4**: Emergency rollback using Deploy-TerraFusion.ps1 -Rollback

---

**🚀 PRODUCTION DEPLOYMENT COMPLETE**

Your TerraFusion integration is now ready for full production operation with optimized performance, comprehensive monitoring, and enterprise-grade security controls.

*TerraFusion Elite Government OS Engineering Agent*  
*"Excellence in Government Technology Modernization"*
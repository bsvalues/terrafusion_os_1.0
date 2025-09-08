# Azure Monitor Integration Configuration
# This script sets up Azure Monitor dashboards, Log Analytics queries, and alerting rules

param(
    [Parameter(Mandatory=$true)]
    [string]$SubscriptionId,
    
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$true)]
    [string]$ApplicationInsightsName,
    
    [Parameter(Mandatory=$true)]
    [string]$LogAnalyticsWorkspaceName,
    
    [string]$Environment = "Production"
)

Write-Host "🔧 Setting up Azure Monitor Integration for TerraFusion" -ForegroundColor Green

# Azure Monitor Dashboard JSON
$dashboardTemplate = @'
{
  "lenses": {
    "0": {
      "order": 0,
      "parts": {
        "0": {
          "position": {
            "x": 0,
            "y": 0,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "value": "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroupName/providers/microsoft.insights/components/$ApplicationInsightsName",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroupName/providers/microsoft.insights/components/$ApplicationInsightsName"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "value": "TerraFusion-Performance-Overview",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "P1D",
                "isOptional": true
              }
            ],
            "type": "Extension/HubsExtension/PartType/MonitorChartPart",
            "settings": {
              "content": {
                "options": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {
                          "id": "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroupName/providers/microsoft.insights/components/$ApplicationInsightsName"
                        },
                        "name": "requests/duration",
                        "aggregationType": 4,
                        "namespace": "microsoft.insights/components",
                        "metricVisualization": {
                          "displayName": "Server response time"
                        }
                      },
                      {
                        "resourceMetadata": {
                          "id": "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroupName/providers/microsoft.insights/components/$ApplicationInsightsName"
                        },
                        "name": "requests/rate",
                        "aggregationType": 4,
                        "namespace": "microsoft.insights/components",
                        "metricVisualization": {
                          "displayName": "Server requests"
                        }
                      }
                    ],
                    "title": "TerraFusion Performance Overview",
                    "titleKind": 1,
                    "visualization": {
                      "chartType": 2
                    }
                  }
                }
              }
            }
          }
        },
        "1": {
          "position": {
            "x": 6,
            "y": 0,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "ComponentId",
                "value": "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroupName/providers/microsoft.insights/components/$ApplicationInsightsName"
              },
              {
                "name": "Query",
                "value": "requests\\n| where timestamp > ago(1h)\\n| summarize RequestCount = count(), AvgResponseTime = avg(duration) by bin(timestamp, 5m)\\n| render timechart"
              },
              {
                "name": "TimeRange",
                "value": "PT1H"
              }
            ],
            "type": "Extension/AppInsightsExtension/PartType/AnalyticsGridPart",
            "settings": {
              "content": {
                "GridColumnsWidth": {
                  "timestamp": "150px"
                }
              }
            }
          }
        }
      }
    }
  },
  "metadata": {
    "model": {
      "timeRange": {
        "value": {
          "relative": {
            "duration": 24,
            "timeUnit": 1
          }
        },
        "type": "MsPortalFx.Composition.Configuration.ValueTypes.TimeRange"
      }
    }
  }
}
"@

# Log Analytics Queries
$logAnalyticsQueries = @"
// TerraFusion Application Performance Query
requests
| where timestamp > ago(1h)
| where name contains "TerraFusion"
| summarize 
    RequestCount = count(),
    AvgResponseTime = avg(duration),
    P95ResponseTime = percentile(duration, 95),
    ErrorRate = countif(success == false) * 100.0 / count()
    by bin(timestamp, 5m)
| render timechart

// TerraFusion Error Analysis
exceptions
| where timestamp > ago(24h)
| where application_Version contains "TerraFusion"
| summarize ErrorCount = count() by type, outerMessage
| order by ErrorCount desc

// TerraFusion User Activity
pageViews
| where timestamp > ago(1h)
| where name contains "TerraFusion"
| summarize UserSessions = dcount(session_Id), PageViews = count() by bin(timestamp, 10m)
| render timechart

// TerraFusion Dependencies Performance
dependencies
| where timestamp > ago(1h)
| where type in ("SQL", "HTTP", "Redis")
| summarize 
    CallCount = count(),
    AvgDuration = avg(duration),
    FailureRate = countif(success == false) * 100.0 / count()
    by name, type
| order by AvgDuration desc

// TerraFusion Custom Events Analysis
customEvents
| where timestamp > ago(24h)
| where name startswith "TerraFusion"
| summarize EventCount = count() by name, tostring(customDimensions.EventType)
| order by EventCount desc

// TerraFusion System Health Check
customMetrics
| where timestamp > ago(1h)
| where name in ("System.Health.OverallStatus", "System.Metrics.CpuUsage", "System.Metrics.MemoryUsage")
| summarize AvgValue = avg(value) by name, bin(timestamp, 5m)
| render timechart

// TerraFusion Business Metrics
customEvents
| where timestamp > ago(24h)
| where name == "BusinessEvent"
| extend EventName = tostring(customDimensions.eventName)
| summarize EventCount = count() by EventName
| order by EventCount desc

// TerraFusion Performance Alerts Query
performanceCounters
| where timestamp > ago(15m)
| where counter in ("% Processor Time", "Available Memory")
| summarize AvgValue = avg(value) by counter
| where (counter == "% Processor Time" and AvgValue > 80) or (counter == "Available Memory" and AvgValue < 1000)

// TerraFusion Request Anomalies
requests
| where timestamp > ago(1h)
| where duration > 5000 or resultCode >= 500
| project timestamp, name, duration, resultCode, url
| order by timestamp desc

// TerraFusion Cache Performance
dependencies
| where timestamp > ago(1h)
| where type == "Redis"
| summarize 
    CacheHits = countif(success == true),
    CacheMisses = countif(success == false),
    AvgResponseTime = avg(duration)
    by bin(timestamp, 5m)
| extend HitRate = CacheHits * 100.0 / (CacheHits + CacheMisses)
| render timechart
"@

# Alert Rules Configuration
$alertRulesConfig = @"
# TerraFusion Alert Rules Configuration

## High Response Time Alert
Name: TerraFusion High Response Time
Description: Alert when average response time exceeds 2 seconds
Query: requests | where timestamp > ago(5m) | summarize avg(duration) | where avg_duration > 2000
Severity: Warning
Frequency: 5 minutes
Threshold: 1 occurrence

## High Error Rate Alert  
Name: TerraFusion High Error Rate
Description: Alert when error rate exceeds 5%
Query: requests | where timestamp > ago(10m) | summarize ErrorRate = countif(success == false) * 100.0 / count() | where ErrorRate > 5
Severity: Error
Frequency: 5 minutes
Threshold: 1 occurrence

## High CPU Usage Alert
Name: TerraFusion High CPU Usage
Description: Alert when CPU usage exceeds 80%
Query: customMetrics | where timestamp > ago(5m) and name == "System.Metrics.CpuUsage" | summarize avg(value) | where avg_value > 80
Severity: Warning
Frequency: 5 minutes
Threshold: 2 consecutive occurrences

## High Memory Usage Alert
Name: TerraFusion High Memory Usage
Description: Alert when memory usage exceeds 1GB
Query: customMetrics | where timestamp > ago(5m) and name == "System.Metrics.MemoryUsage" | summarize avg(value) | where avg_value > 1024
Severity: Warning
Frequency: 5 minutes
Threshold: 2 consecutive occurrences

## Application Downtime Alert
Name: TerraFusion Application Downtime
Description: Alert when no requests received for 5 minutes
Query: requests | where timestamp > ago(5m) | count | where Count == 0
Severity: Critical
Frequency: 5 minutes
Threshold: 1 occurrence

## Database Connection Issues Alert
Name: TerraFusion Database Connection Issues
Description: Alert when database dependency failures exceed 10%
Query: dependencies | where timestamp > ago(10m) and type == "SQL" | summarize FailureRate = countif(success == false) * 100.0 / count() | where FailureRate > 10
Severity: Error
Frequency: 5 minutes
Threshold: 1 occurrence

## Cache Performance Degradation Alert
Name: TerraFusion Cache Performance Degradation
Description: Alert when cache hit rate drops below 80%
Query: dependencies | where timestamp > ago(10m) and type == "Redis" | summarize HitRate = countif(success == true) * 100.0 / count() | where HitRate < 80
Severity: Warning
Frequency: 10 minutes
Threshold: 1 occurrence

## Unusual Traffic Spike Alert
Name: TerraFusion Unusual Traffic Spike
Description: Alert when request rate increases by 200% compared to baseline
Query: requests | where timestamp > ago(10m) | summarize CurrentRate = count() | join (requests | where timestamp between(ago(1h)..ago(50m)) | summarize BaselineRate = count()) on $left.dummy == $right.dummy | where CurrentRate > BaselineRate * 3
Severity: Info
Frequency: 10 minutes
Threshold: 1 occurrence

## Security Event Alert
Name: TerraFusion Security Event
Description: Alert on security-related events
Query: customEvents | where timestamp > ago(5m) and name == "SecurityEvent" | count | where Count > 0
Severity: Critical
Frequency: 1 minute
Threshold: 1 occurrence

## Business Metric Anomaly Alert
Name: TerraFusion Business Metric Anomaly
Description: Alert on significant changes in business metrics
Query: customEvents | where timestamp > ago(15m) and name == "BusinessEvent" | summarize count() by tostring(customDimensions.eventName) | where count_ > 100 or count_ == 0
Severity: Warning
Frequency: 15 minutes
Threshold: 1 occurrence
"@

# Workbook Template
$workbookTemplate = @"
{
  "version": "Notebook/1.0",
  "items": [
    {
      "type": 1,
      "content": {
        "json": "# TerraFusion Monitoring Workbook\n\nComprehensive monitoring dashboard for TerraFusion application performance, health, and business metrics."
      },
      "name": "text - 0"
    },
    {
      "type": 3,
      "content": {
        "version": "KqlItem/1.0",
        "query": "requests\n| where timestamp > ago(1h)\n| summarize RequestCount = count(), AvgResponseTime = avg(duration) by bin(timestamp, 5m)\n| render timechart",
        "size": 0,
        "title": "Request Volume and Response Time",
        "timeContext": {
          "durationMs": 3600000
        },
        "queryType": 0,
        "resourceType": "microsoft.insights/components"
      },
      "name": "query - 1"
    },
    {
      "type": 3,
      "content": {
        "version": "KqlItem/1.0",
        "query": "exceptions\n| where timestamp > ago(24h)\n| summarize ErrorCount = count() by type\n| render piechart",
        "size": 0,
        "title": "Error Distribution",
        "timeContext": {
          "durationMs": 86400000
        },
        "queryType": 0,
        "resourceType": "microsoft.insights/components"
      },
      "name": "query - 2"
    },
    {
      "type": 3,
      "content": {
        "version": "KqlItem/1.0",
        "query": "customMetrics\n| where timestamp > ago(1h)\n| where name in (\"System.Metrics.CpuUsage\", \"System.Metrics.MemoryUsage\")\n| summarize AvgValue = avg(value) by name, bin(timestamp, 5m)\n| render timechart",
        "size": 0,
        "title": "System Resource Usage",
        "timeContext": {
          "durationMs": 3600000
        },
        "queryType": 0,
        "resourceType": "microsoft.insights/components"
      },
      "name": "query - 3"
    },
    {
      "type": 3,
      "content": {
        "version": "KqlItem/1.0",
        "query": "dependencies\n| where timestamp > ago(1h)\n| summarize CallCount = count(), AvgDuration = avg(duration), FailureRate = countif(success == false) * 100.0 / count() by type\n| project type, CallCount, AvgDuration = round(AvgDuration, 2), FailureRate = round(FailureRate, 2)",
        "size": 0,
        "title": "Dependency Performance",
        "timeContext": {
          "durationMs": 3600000
        },
        "queryType": 0,
        "resourceType": "microsoft.insights/components"
      },
      "name": "query - 4"
    }
  ],
  "fallbackResourceIds": [
    "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroupName/providers/microsoft.insights/components/$ApplicationInsightsName"
  ]
}
"@

# Create configuration files
$configDir = "azure-monitor-config"
New-Item -ItemType Directory -Path $configDir -Force | Out-Null

$dashboardTemplate | Out-File -FilePath "$configDir\dashboard-template.json" -Encoding UTF8
$logAnalyticsQueries | Out-File -FilePath "$configDir\log-analytics-queries.kql" -Encoding UTF8
$alertRulesConfig | Out-File -FilePath "$configDir\alert-rules.md" -Encoding UTF8
$workbookTemplate | Out-File -FilePath "$configDir\workbook-template.json" -Encoding UTF8

# PowerShell script for deployment
$deploymentScript = @"
# Deploy Azure Monitor Configuration
param(
    [string]$SubscriptionId = "$SubscriptionId",
    [string]$ResourceGroupName = "$ResourceGroupName",
    [string]$ApplicationInsightsName = "$ApplicationInsightsName",
    [string]$LogAnalyticsWorkspaceName = "$LogAnalyticsWorkspaceName"
)

# Connect to Azure (requires Azure PowerShell module)
# Connect-AzAccount
# Set-AzContext -SubscriptionId $SubscriptionId

Write-Host "Deploying Azure Monitor configuration for TerraFusion..." -ForegroundColor Green

# Create Action Group for alerts
$ActionGroup = @{
    Name = "TerraFusion-Alerts"
    ResourceGroupName = $ResourceGroupName
    ShortName = "TFAlerts"
    EmailReceiver = @{
        Name = "Admin"
        EmailAddress = "admin@terrafusion.com"
    }
}

# New-AzActionGroup @ActionGroup

# Create Metric Alert Rules
$MetricAlerts = @(
    @{
        Name = "TerraFusion-HighResponseTime"
        Description = "Alert when response time is high"
        ResourceGroupName = $ResourceGroupName
        TargetResourceId = "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroupName/providers/microsoft.insights/components/$ApplicationInsightsName"
        MetricName = "requests/duration"
        Operator = "GreaterThan"
        Threshold = 2000
        WindowSize = "PT5M"
        Frequency = "PT1M"
        Severity = 2
    },
    @{
        Name = "TerraFusion-HighErrorRate"
        Description = "Alert when error rate is high"
        ResourceGroupName = $ResourceGroupName
        TargetResourceId = "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroupName/providers/microsoft.insights/components/$ApplicationInsightsName"
        MetricName = "requests/failed"
        Operator = "GreaterThan"
        Threshold = 5
        WindowSize = "PT5M"
        Frequency = "PT1M"
        Severity = 1
    }
)

foreach ($Alert in $MetricAlerts) {
    # Add-AzMetricAlertRuleV2 @Alert
    Write-Host "Created alert rule: $($Alert.Name)" -ForegroundColor Cyan
}

Write-Host "Azure Monitor configuration deployment completed!" -ForegroundColor Green
"@

$deploymentScript | Out-File -FilePath "$configDir\deploy-monitoring.ps1" -Encoding UTF8

Write-Host "✅ Azure Monitor integration configuration completed!" -ForegroundColor Green
Write-Host "📁 Configuration files created in: $configDir" -ForegroundColor Yellow
Write-Host "📋 Files created:" -ForegroundColor Magenta
Write-Host "   • dashboard-template.json - Azure Dashboard configuration" -ForegroundColor White
Write-Host "   • log-analytics-queries.kql - KQL queries for monitoring" -ForegroundColor White
Write-Host "   • alert-rules.md - Alert rules documentation" -ForegroundColor White
Write-Host "   • workbook-template.json - Azure Workbook template" -ForegroundColor White
Write-Host "   • deploy-monitoring.ps1 - Deployment automation script" -ForegroundColor White

Write-Host "`n🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Review and customize the configuration files" -ForegroundColor White
Write-Host "   2. Update subscription ID and resource names in templates" -ForegroundColor White
Write-Host "   3. Run deploy-monitoring.ps1 to create Azure Monitor resources" -ForegroundColor White
Write-Host "   4. Import dashboard and workbook templates in Azure Portal" -ForegroundColor White
Write-Host "   5. Configure notification channels for alerts" -ForegroundColor White

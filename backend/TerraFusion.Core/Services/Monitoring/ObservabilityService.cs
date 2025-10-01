using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Services.Monitoring;
using System.Text.Json;

namespace TerraFusion.Core.Services.Monitoring;

/// <summary>
/// Comprehensive observability service for monitoring application health and performance
/// </summary>
public interface IObservabilityService
{
    Task<ObservabilityReport> GenerateReportAsync();
    Task<SystemHealthStatus> GetSystemHealthAsync();
    Task<List<AlertRule>> GetActiveAlertsAsync();
    Task RecordCustomMetricAsync(string metricName, double value, Dictionary<string, string>? tags = null);
    Task<PerformanceSummary> GetPerformanceSummaryAsync(TimeSpan period);
    Task StartHealthMonitoringAsync();
    Task StopHealthMonitoringAsync();
}

public class ObservabilityService : IObservabilityService
{
    private readonly ITelemetryService _telemetryService;
    private readonly IHealthCheckService _healthCheckService;
    private readonly IMetricsCollectionService _metricsService;
    private readonly ILogger<ObservabilityService> _logger;
    // Timer for periodic health monitoring (removed to eliminate unused field warning)
    private bool _isMonitoring;

    public ObservabilityService(
        ITelemetryService telemetryService,
        IHealthCheckService healthCheckService,
        IMetricsCollectionService metricsService,
        ILogger<ObservabilityService> logger)
    {
        _telemetryService = telemetryService;
        _healthCheckService = healthCheckService;
        _metricsService = metricsService;
        _logger = logger;
    }

    public async Task<ObservabilityReport> GenerateReportAsync()
    {
        try
        {
            _logger.LogInformation("Generating observability report");

            var report = new ObservabilityReport
            {
                Timestamp = DateTimeOffset.UtcNow,
                SystemHealth = await GetSystemHealthAsync(),
                PerformanceSummary = await GetPerformanceSummaryAsync(TimeSpan.FromHours(1)),
                ActiveAlerts = await GetActiveAlertsAsync(),
                ResourceUtilization = await GetResourceUtilizationAsync(),
                ServiceDependencies = await GetServiceDependenciesAsync()
            };

            // Track report generation
            _telemetryService.TrackEvent("ObservabilityReportGenerated", new Dictionary<string, string>
            {
                ["ReportId"] = report.Id,
                ["SystemHealth"] = report.SystemHealth.OverallStatus.ToString(),
                ["AlertCount"] = report.ActiveAlerts.Count.ToString()
            });

            return report;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate observability report");
            _telemetryService.TrackException(ex);
            throw;
        }
    }

    public async Task<SystemHealthStatus> GetSystemHealthAsync()
    {
        try
        {
            var healthChecks = await _healthCheckService.GetHealthAsync();
            var metrics = await _metricsService.GetCurrentMetricsAsync();

            var systemHealth = new SystemHealthStatus
            {
                OverallStatus = DetermineOverallHealth(healthChecks),
                LastUpdated = DateTimeOffset.UtcNow,
                Components = healthChecks.Entries.Select(entry => new ComponentHealth
                {
                    Name = entry.Key,
                    Status = MapHealthStatus(entry.Value.Status),
                    Description = entry.Value.Description ?? "",
                    ResponseTime = entry.Value.Duration,
                    LastChecked = DateTimeOffset.UtcNow
                }).ToList(),
                Metrics = new SystemMetrics
                {
                    CpuUsage = metrics.CpuUsagePercent,
                    MemoryUsage = metrics.MemoryUsageMB,
                    DiskUsage = await GetDiskUsageAsync(),
                    NetworkLatency = await GetNetworkLatencyAsync(),
                    ActiveConnections = await GetActiveConnectionsAsync()
                }
            };

            return systemHealth;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get system health");
            _telemetryService.TrackException(ex);
            throw;
        }
    }

    public async Task<List<AlertRule>> GetActiveAlertsAsync()
    {
        // This would typically query your alerting system
        // For now, we'll simulate based on current metrics
        var alerts = new List<AlertRule>();
        
        try
        {
            var metrics = await _metricsService.GetCurrentMetricsAsync();
            var healthStatus = await _healthCheckService.GetHealthAsync();

            // Check for high CPU usage
            if (metrics.CpuUsagePercent > 80)
            {
                alerts.Add(new AlertRule
                {
                    Id = Guid.NewGuid().ToString(),
                    Name = "High CPU Usage",
                    Severity = AlertSeverity.Warning,
                    Description = $"CPU usage is at {metrics.CpuUsagePercent:F1}%",
                    Threshold = "80%",
                    CurrentValue = $"{metrics.CpuUsagePercent:F1}%",
                    TriggeredAt = DateTimeOffset.UtcNow,
                    IsActive = true
                });
            }

            // Check for high memory usage
            if (metrics.MemoryUsageMB > 1024)
            {
                alerts.Add(new AlertRule
                {
                    Id = Guid.NewGuid().ToString(),
                    Name = "High Memory Usage",
                    Severity = AlertSeverity.Warning,
                    Description = $"Memory usage is at {metrics.MemoryUsageMB} MB",
                    Threshold = "1024 MB",
                    CurrentValue = $"{metrics.MemoryUsageMB} MB",
                    TriggeredAt = DateTimeOffset.UtcNow,
                    IsActive = true
                });
            }

            // Check for unhealthy components
            foreach (var component in healthStatus.Entries.Where(e => e.Value.Status != Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Healthy))
            {
                alerts.Add(new AlertRule
                {
                    Id = Guid.NewGuid().ToString(),
                    Name = $"Component Health: {component.Key}",
                    Severity = component.Value.Status == Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Degraded ? AlertSeverity.Warning : AlertSeverity.Critical,
                    Description = $"Component {component.Key} is {component.Value.Status}",
                    Threshold = "Healthy",
                    CurrentValue = component.Value.Status.ToString(),
                    TriggeredAt = DateTimeOffset.UtcNow,
                    IsActive = true
                });
            }

            return alerts;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get active alerts");
            _telemetryService.TrackException(ex);
            return alerts;
        }
    }

    public async Task RecordCustomMetricAsync(string metricName, double value, Dictionary<string, string>? tags = null)
    {
        try
        {
            _telemetryService.TrackMetric(metricName, value, tags);
            await _metricsService.RecordMetricAsync(metricName, value, tags);
            
            _logger.LogDebug("Recorded custom metric: {MetricName} = {Value}", metricName, value);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to record custom metric: {MetricName}", metricName);
            _telemetryService.TrackException(ex);
        }
    }

    public async Task<PerformanceSummary> GetPerformanceSummaryAsync(TimeSpan period)
    {
        try
        {
            var metrics = await _metricsService.GetMetricsHistoryAsync(period);
            
            if (!metrics.Any())
            {
                return new PerformanceSummary
                {
                    Period = period,
                    DataPoints = 0,
                    StartTime = DateTimeOffset.UtcNow.Subtract(period),
                    EndTime = DateTimeOffset.UtcNow
                };
            }

            var summary = new PerformanceSummary
            {
                Period = period,
                DataPoints = metrics.Count,
                StartTime = metrics.Min(m => m.Timestamp),
                EndTime = metrics.Max(m => m.Timestamp),
                
                AverageResponseTime = CalculateAverage(metrics.Select(m => m.ResponseTime)),
                MinResponseTime = metrics.Min(m => m.ResponseTime),
                MaxResponseTime = metrics.Max(m => m.ResponseTime),
                
                AverageCpuUsage = CalculateAverage(metrics.Select(m => m.CpuUsage)),
                AverageMemoryUsage = CalculateAverage(metrics.Select(m => m.MemoryUsage)),
                
                TotalRequests = metrics.Sum(m => m.RequestCount),
                ErrorCount = metrics.Sum(m => m.ErrorCount),
                ErrorRate = CalculateErrorRate(metrics)
            };

            return summary;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get performance summary");
            _telemetryService.TrackException(ex);
            throw;
        }
    }

    public Task StartHealthMonitoringAsync()
    {
        if (_isMonitoring)
        {
            _logger.LogWarning("Health monitoring is already running");
            return Task.CompletedTask;
        }

        _logger.LogInformation("Starting health monitoring");
        _isMonitoring = true;

        // Start periodic health checks
        _ = Task.Run(async () =>
        {
            while (_isMonitoring)
            {
                try
                {
                    await PerformHealthCheckAsync();
                    await Task.Delay(TimeSpan.FromMinutes(1)); // Check every minute
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error during health monitoring");
                    _telemetryService.TrackException(ex);
                }
            }
        });

        _telemetryService.TrackEvent("HealthMonitoringStarted");
        
        return Task.CompletedTask;
    }

    public Task StopHealthMonitoringAsync()
    {
        _logger.LogInformation("Stopping health monitoring");
        _isMonitoring = false;
        
        _telemetryService.TrackEvent("HealthMonitoringStopped");
        
        return Task.CompletedTask;
    }

    private async Task PerformHealthCheckAsync()
    {
        var healthStatus = await GetSystemHealthAsync();
        
        // Track health metrics
        _telemetryService.TrackMetric("System.Health.OverallStatus", (int)healthStatus.OverallStatus);
        _telemetryService.TrackMetric("System.Health.ComponentCount", healthStatus.Components.Count);
        _telemetryService.TrackMetric("System.Metrics.CpuUsage", healthStatus.Metrics.CpuUsage);
        _telemetryService.TrackMetric("System.Metrics.MemoryUsage", healthStatus.Metrics.MemoryUsage);

        // Check for alerts
        var alerts = await GetActiveAlertsAsync();
        if (alerts.Any())
        {
            _telemetryService.TrackEvent("SystemAlertsTriggered", new Dictionary<string, string>
            {
                ["AlertCount"] = alerts.Count.ToString(),
                ["CriticalAlerts"] = alerts.Count(a => a.Severity == AlertSeverity.Critical).ToString(),
                ["WarningAlerts"] = alerts.Count(a => a.Severity == AlertSeverity.Warning).ToString()
            });
        }
    }

    private static HealthStatus DetermineOverallHealth(HealthReport healthReport)
    {
        if (healthReport.Status == Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Healthy)
            return HealthStatus.Healthy;
        if (healthReport.Status == Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Degraded)
            return HealthStatus.Degraded;
        return HealthStatus.Unhealthy;
    }

    private static HealthStatus MapHealthStatus(Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus status)
    {
        return status switch
        {
            Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Healthy => HealthStatus.Healthy,
            Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Degraded => HealthStatus.Degraded,
            Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Unhealthy => HealthStatus.Unhealthy,
            _ => HealthStatus.Unknown
        };
    }

    private static double CalculateAverage(IEnumerable<double> values)
    {
        var valueList = values.ToList();
        return valueList.Any() ? valueList.Average() : 0;
    }

    private static double CalculateErrorRate(List<MetricSnapshot> metrics)
    {
        var totalRequests = metrics.Sum(m => m.RequestCount);
        var totalErrors = metrics.Sum(m => m.ErrorCount);
        return totalRequests > 0 ? (double)totalErrors / totalRequests * 100 : 0;
    }

    private Task<double> GetDiskUsageAsync()
    {
        // Simplified disk usage calculation
        try
        {
            var drives = DriveInfo.GetDrives().Where(d => d.IsReady);
            var totalUsed = drives.Sum(d => d.TotalSize - d.TotalFreeSpace);
            var totalSize = drives.Sum(d => d.TotalSize);
            return Task.FromResult(totalSize > 0 ? (double)totalUsed / totalSize * 100 : 0);
        }
        catch
        {
            return Task.FromResult(0.0);
        }
    }

    private async Task<double> GetNetworkLatencyAsync()
    {
        // This would typically ping external services or measure internal latency
        await Task.Delay(1); // Simulate async work
        return Random.Shared.NextDouble() * 10; // Simulate 0-10ms latency
    }

    private async Task<int> GetActiveConnectionsAsync()
    {
        // This would query connection pool or network statistics
        await Task.Delay(1); // Simulate async work
        return Random.Shared.Next(10, 100); // Simulate 10-100 connections
    }

    private async Task<ResourceUtilization> GetResourceUtilizationAsync()
    {
        await Task.Delay(1); // Simulate async work
        return new ResourceUtilization
        {
            CpuCores = Environment.ProcessorCount,
            MemoryTotal = GC.GetTotalMemory(false),
            DiskTotal = DriveInfo.GetDrives().Where(d => d.IsReady).Sum(d => d.TotalSize),
            NetworkBandwidth = 1000 // Simulate 1Gbps
        };
    }

    private async Task<List<ServiceDependency>> GetServiceDependenciesAsync()
    {
        await Task.Delay(1); // Simulate async work
        return new List<ServiceDependency>
        {
            new() { Name = "Database", Status = HealthStatus.Healthy, ResponseTime = TimeSpan.FromMilliseconds(50) },
            new() { Name = "Redis Cache", Status = HealthStatus.Healthy, ResponseTime = TimeSpan.FromMilliseconds(10) },
            new() { Name = "External API", Status = HealthStatus.Healthy, ResponseTime = TimeSpan.FromMilliseconds(200) }
        };
    }
}

// Data models for observability
public class ObservabilityReport
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public DateTimeOffset Timestamp { get; set; }
    public SystemHealthStatus SystemHealth { get; set; } = new();
    public PerformanceSummary PerformanceSummary { get; set; } = new();
    public List<AlertRule> ActiveAlerts { get; set; } = new();
    public ResourceUtilization ResourceUtilization { get; set; } = new();
    public List<ServiceDependency> ServiceDependencies { get; set; } = new();
}

public class SystemHealthStatus
{
    public HealthStatus OverallStatus { get; set; }
    public DateTimeOffset LastUpdated { get; set; }
    public List<ComponentHealth> Components { get; set; } = new();
    public SystemMetrics Metrics { get; set; } = new();
}

public class ComponentHealth
{
    public string Name { get; set; } = string.Empty;
    public HealthStatus Status { get; set; }
    public string Description { get; set; } = string.Empty;
    public TimeSpan ResponseTime { get; set; }
    public DateTimeOffset LastChecked { get; set; }
}

public class SystemMetrics
{
    public double CpuUsage { get; set; }
    public long MemoryUsage { get; set; }
    public double DiskUsage { get; set; }
    public double NetworkLatency { get; set; }
    public int ActiveConnections { get; set; }
}

public class AlertRule
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public AlertSeverity Severity { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Threshold { get; set; } = string.Empty;
    public string CurrentValue { get; set; } = string.Empty;
    public DateTimeOffset TriggeredAt { get; set; }
    public bool IsActive { get; set; }
}

public class PerformanceSummary
{
    public TimeSpan Period { get; set; }
    public int DataPoints { get; set; }
    public DateTimeOffset StartTime { get; set; }
    public DateTimeOffset EndTime { get; set; }
    public double AverageResponseTime { get; set; }
    public double MinResponseTime { get; set; }
    public double MaxResponseTime { get; set; }
    public double AverageCpuUsage { get; set; }
    public double AverageMemoryUsage { get; set; }
    public long TotalRequests { get; set; }
    public long ErrorCount { get; set; }
    public double ErrorRate { get; set; }
}

public class ResourceUtilization
{
    public int CpuCores { get; set; }
    public long MemoryTotal { get; set; }
    public long DiskTotal { get; set; }
    public long NetworkBandwidth { get; set; }
}

public class ServiceDependency
{
    public string Name { get; set; } = string.Empty;
    public HealthStatus Status { get; set; }
    public TimeSpan ResponseTime { get; set; }
}

public class MetricSnapshot
{
    public DateTimeOffset Timestamp { get; set; }
    public double ResponseTime { get; set; }
    public double CpuUsage { get; set; }
    public double MemoryUsage { get; set; }
    public long RequestCount { get; set; }
    public long ErrorCount { get; set; }
}

public enum HealthStatus
{
    Unknown = 0,
    Healthy = 1,
    Degraded = 2,
    Unhealthy = 3
}

public enum AlertSeverity
{
    Info = 0,
    Warning = 1,
    Critical = 2
}

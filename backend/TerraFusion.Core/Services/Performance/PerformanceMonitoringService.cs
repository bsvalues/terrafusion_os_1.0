using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Diagnostics;

namespace TerraFusion.Core.Services.Performance;

/// <summary>
/// Performance monitoring service for tracking application metrics
/// </summary>
public interface IPerformanceMonitoringService
{
    Task<PerformanceMetrics> GetCurrentMetricsAsync();
    Task<List<PerformanceMetrics>> GetMetricsHistoryAsync(TimeSpan period);
    Task RecordApiCallAsync(string endpoint, TimeSpan duration, int statusCode);
    Task RecordDatabaseQueryAsync(string queryType, TimeSpan duration);
    Task RecordCacheOperationAsync(string operation, bool hit, TimeSpan duration);
    Task<HealthStatus> GetHealthStatusAsync();
}

public class PerformanceMonitoringService : IPerformanceMonitoringService
{
    private readonly ILogger<PerformanceMonitoringService> _logger;
    private readonly PerformanceOptions _options;
    private readonly List<PerformanceMetrics> _metricsHistory;
    private readonly object _lock = new();

    public PerformanceMonitoringService(
        ILogger<PerformanceMonitoringService> logger,
        IOptions<PerformanceOptions> options)
    {
        _logger = logger;
        _options = options.Value;
        _metricsHistory = new List<PerformanceMetrics>();
    }

    public async Task<PerformanceMetrics> GetCurrentMetricsAsync()
    {
        var process = Process.GetCurrentProcess();
        var metrics = new PerformanceMetrics
        {
            Timestamp = DateTime.UtcNow,
            CpuUsagePercent = await GetCpuUsageAsync(),
            MemoryUsageMB = process.WorkingSet64 / (1024 * 1024),
            ThreadCount = process.Threads.Count,
            HandleCount = process.HandleCount,
            GarbageCollections = new GarbageCollectionMetrics
            {
                Gen0Collections = GC.CollectionCount(0),
                Gen1Collections = GC.CollectionCount(1),
                Gen2Collections = GC.CollectionCount(2),
                TotalMemoryMB = GC.GetTotalMemory(false) / (1024 * 1024)
            }
        };

        lock (_lock)
        {
            _metricsHistory.Add(metrics);
            
            // Keep only recent metrics
            var cutoff = DateTime.UtcNow.Subtract(TimeSpan.FromHours(24));
            _metricsHistory.RemoveAll(m => m.Timestamp < cutoff);
        }

        return metrics;
    }

    public async Task<List<PerformanceMetrics>> GetMetricsHistoryAsync(TimeSpan period)
    {
        var cutoff = DateTime.UtcNow.Subtract(period);
        
        lock (_lock)
        {
            return _metricsHistory
                .Where(m => m.Timestamp >= cutoff)
                .OrderBy(m => m.Timestamp)
                .ToList();
        }
    }

    public async Task RecordApiCallAsync(string endpoint, TimeSpan duration, int statusCode)
    {
        var isError = statusCode >= 400;
        var isSlow = duration.TotalMilliseconds > _options.SlowRequestThresholdMs;

        if (isError || isSlow)
        {
            _logger.LogWarning(
                "API call performance: {Endpoint} took {Duration}ms with status {StatusCode}",
                endpoint, duration.TotalMilliseconds, statusCode);
        }

        // Store in metrics (implementation would depend on your metrics storage)
        await Task.CompletedTask;
    }

    public async Task RecordDatabaseQueryAsync(string queryType, TimeSpan duration)
    {
        var isSlow = duration.TotalMilliseconds > _options.SlowQueryThresholdMs;

        if (isSlow)
        {
            _logger.LogWarning(
                "Slow database query: {QueryType} took {Duration}ms",
                queryType, duration.TotalMilliseconds);
        }

        await Task.CompletedTask;
    }

    public async Task RecordCacheOperationAsync(string operation, bool hit, TimeSpan duration)
    {
        _logger.LogDebug(
            "Cache operation: {Operation} - {Result} in {Duration}ms",
            operation, hit ? "HIT" : "MISS", duration.TotalMilliseconds);

        await Task.CompletedTask;
    }

    public async Task<HealthStatus> GetHealthStatusAsync()
    {
        var metrics = await GetCurrentMetricsAsync();
        var status = new HealthStatus
        {
            IsHealthy = true,
            Timestamp = DateTime.UtcNow,
            Details = new Dictionary<string, object>()
        };

        // Check CPU usage
        if (metrics.CpuUsagePercent > _options.CpuThresholdPercent)
        {
            status.IsHealthy = false;
            status.Issues.Add($"High CPU usage: {metrics.CpuUsagePercent:F1}%");
        }

        // Check memory usage
        if (metrics.MemoryUsageMB > _options.MemoryThresholdMB)
        {
            status.IsHealthy = false;
            status.Issues.Add($"High memory usage: {metrics.MemoryUsageMB} MB");
        }

        // Check thread count
        if (metrics.ThreadCount > _options.ThreadCountThreshold)
        {
            status.IsHealthy = false;
            status.Issues.Add($"High thread count: {metrics.ThreadCount}");
        }

        status.Details["cpu"] = metrics.CpuUsagePercent;
        status.Details["memory"] = metrics.MemoryUsageMB;
        status.Details["threads"] = metrics.ThreadCount;
        status.Details["handles"] = metrics.HandleCount;

        return status;
    }

    private async Task<double> GetCpuUsageAsync()
    {
        // Simple CPU usage calculation
        var startTime = DateTime.UtcNow;
        var startCpuUsage = Process.GetCurrentProcess().TotalProcessorTime;
        
        await Task.Delay(500); // Wait 500ms
        
        var endTime = DateTime.UtcNow;
        var endCpuUsage = Process.GetCurrentProcess().TotalProcessorTime;
        
        var cpuUsedMs = (endCpuUsage - startCpuUsage).TotalMilliseconds;
        var totalMsPassed = (endTime - startTime).TotalMilliseconds;
        var cpuUsageTotal = cpuUsedMs / (Environment.ProcessorCount * totalMsPassed);
        
        return cpuUsageTotal * 100;
    }
}

public class PerformanceMetrics
{
    public DateTime Timestamp { get; set; }
    public double CpuUsagePercent { get; set; }
    public long MemoryUsageMB { get; set; }
    public int ThreadCount { get; set; }
    public int HandleCount { get; set; }
    public GarbageCollectionMetrics GarbageCollections { get; set; } = new();
}

public class GarbageCollectionMetrics
{
    public int Gen0Collections { get; set; }
    public int Gen1Collections { get; set; }
    public int Gen2Collections { get; set; }
    public long TotalMemoryMB { get; set; }
}

public class HealthStatus
{
    public bool IsHealthy { get; set; }
    public DateTime Timestamp { get; set; }
    public List<string> Issues { get; set; } = new();
    public Dictionary<string, object> Details { get; set; } = new();
}

public class PerformanceOptions
{
    public int SlowRequestThresholdMs { get; set; } = 1000;
    public int SlowQueryThresholdMs { get; set; } = 500;
    public double CpuThresholdPercent { get; set; } = 80;
    public long MemoryThresholdMB { get; set; } = 1024;
    public int ThreadCountThreshold { get; set; } = 100;
}

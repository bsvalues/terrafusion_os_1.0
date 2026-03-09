using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;
using System.Diagnostics;
using TerraFusion.Core.Services.Monitoring;

namespace TerraFusion.Core.Services.Monitoring;

/// <summary>
/// Service for collecting and managing application metrics
/// </summary>
public interface IMetricsCollectionService
{
    Task<CurrentMetrics> GetCurrentMetricsAsync();
    Task<List<MetricSnapshot>> GetMetricsHistoryAsync(TimeSpan period);
    Task RecordMetricAsync(string metricName, double value, Dictionary<string, string>? tags = null);
    Task RecordRequestMetricAsync(string endpoint, TimeSpan responseTime, bool isSuccess);
    Task<MetricsStatistics> GetMetricsStatisticsAsync();
    void StartPeriodicCollection();
    void StopPeriodicCollection();
}

public class MetricsCollectionService : IMetricsCollectionService
{
    private readonly ITelemetryService _telemetryService;
    private readonly ILogger<MetricsCollectionService> _logger;
    private readonly ConcurrentDictionary<string, List<MetricPoint>> _metricsHistory;
    private readonly ConcurrentDictionary<string, double> _currentMetrics;
    private readonly PerformanceCounter? _cpuCounter;
    private readonly PerformanceCounter? _memoryCounter;
    private bool _isCollecting;

    public MetricsCollectionService(
        ITelemetryService telemetryService,
        ILogger<MetricsCollectionService> logger)
    {
        _telemetryService = telemetryService;
        _logger = logger;
        _metricsHistory = new ConcurrentDictionary<string, List<MetricPoint>>();
        _currentMetrics = new ConcurrentDictionary<string, double>();

        if (OperatingSystem.IsWindows())
        {
            try
            {
                _cpuCounter = new PerformanceCounter("Processor", "% Processor Time", "_Total");
                _memoryCounter = new PerformanceCounter("Memory", "Available MBytes");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to initialize performance counters");
            }
        }
        else
        {
            _logger.LogDebug("Performance counters are only available on Windows");
        }
    }

    public async Task<CurrentMetrics> GetCurrentMetricsAsync()
    {
        try
        {
            var metrics = new CurrentMetrics
            {
                Timestamp = DateTimeOffset.UtcNow,
                CpuUsagePercent = await GetCpuUsageAsync(),
                MemoryUsageMB = await GetMemoryUsageAsync(),
                ProcessMetrics = await GetProcessMetricsAsync(),
                GarbageCollectionMetrics = GetGarbageCollectionMetrics(),
                RequestMetrics = GetRequestMetrics(),
                CustomMetrics = _currentMetrics.ToDictionary(kvp => kvp.Key, kvp => kvp.Value)
            };

            return metrics;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get current metrics");
            _telemetryService.TrackException(ex);
            throw;
        }
    }

    public Task<List<MetricSnapshot>> GetMetricsHistoryAsync(TimeSpan period)
    {
        try
        {
            var cutoffTime = DateTimeOffset.UtcNow.Subtract(period);
            var snapshots = new List<MetricSnapshot>();

            // Get historical data for core metrics
            var cpuHistory = GetMetricHistory("cpu_usage", cutoffTime);
            var memoryHistory = GetMetricHistory("memory_usage", cutoffTime);
            var responseTimeHistory = GetMetricHistory("response_time", cutoffTime);
            var requestCountHistory = GetMetricHistory("request_count", cutoffTime);
            var errorCountHistory = GetMetricHistory("error_count", cutoffTime);

            // Combine metrics by timestamp
            var allTimestamps = cpuHistory.Concat(memoryHistory)
                .Concat(responseTimeHistory)
                .Concat(requestCountHistory)
                .Concat(errorCountHistory)
                .Select(m => m.Timestamp)
                .Distinct()
                .OrderBy(t => t);

            foreach (var timestamp in allTimestamps)
            {
                snapshots.Add(new MetricSnapshot
                {
                    Timestamp = timestamp,
                    CpuUsage = GetMetricValueAtTime(cpuHistory, timestamp),
                    MemoryUsage = GetMetricValueAtTime(memoryHistory, timestamp),
                    ResponseTime = GetMetricValueAtTime(responseTimeHistory, timestamp),
                    RequestCount = (long)GetMetricValueAtTime(requestCountHistory, timestamp),
                    ErrorCount = (long)GetMetricValueAtTime(errorCountHistory, timestamp)
                });
            }

            return Task.FromResult(snapshots);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get metrics history for period: {Period}", period);
            _telemetryService.TrackException(ex);
            return Task.FromResult(new List<MetricSnapshot>());
        }
    }

    public async Task RecordMetricAsync(string metricName, double value, Dictionary<string, string>? tags = null)
    {
        try
        {
            // Update current metrics
            _currentMetrics.AddOrUpdate(metricName, value, (key, oldValue) => value);

            // Add to history
            var metricPoint = new MetricPoint
            {
                Timestamp = DateTimeOffset.UtcNow,
                Value = value,
                Tags = tags ?? new Dictionary<string, string>()
            };

            _metricsHistory.AddOrUpdate(
                metricName,
                new List<MetricPoint> { metricPoint },
                (key, existingList) =>
                {
                    existingList.Add(metricPoint);
                    
                    // Keep only last 24 hours of data
                    var cutoff = DateTimeOffset.UtcNow.AddHours(-24);
                    return existingList.Where(m => m.Timestamp > cutoff).ToList();
                });

            // Send to telemetry
            _telemetryService.TrackMetric(metricName, value, tags);

            _logger.LogDebug("Recorded metric: {MetricName} = {Value}", metricName, value);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to record metric: {MetricName}", metricName);
            _telemetryService.TrackException(ex);
        }

    }

    public async Task RecordRequestMetricAsync(string endpoint, TimeSpan responseTime, bool isSuccess)
    {
        try
        {
            var tags = new Dictionary<string, string>
            {
                ["endpoint"] = endpoint,
                ["success"] = isSuccess.ToString()
            };

            await RecordMetricAsync("response_time", responseTime.TotalMilliseconds, tags);
            await RecordMetricAsync("request_count", 1, tags);
            
            if (!isSuccess)
            {
                await RecordMetricAsync("error_count", 1, tags);
            }

            _logger.LogDebug("Recorded request metric: {Endpoint}, {ResponseTime}ms, Success: {IsSuccess}", 
                endpoint, responseTime.TotalMilliseconds, isSuccess);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to record request metric for endpoint: {Endpoint}", endpoint);
            _telemetryService.TrackException(ex);
        }
    }

    public Task<MetricsStatistics> GetMetricsStatisticsAsync()
    {
        try
        {
            var statistics = new MetricsStatistics();
            
            foreach (var metricGroup in _metricsHistory)
            {
                var metricName = metricGroup.Key;
                var values = metricGroup.Value.Select(m => m.Value).ToList();
                
                if (values.Any())
                {
                    statistics.MetricStats[metricName] = new MetricStatistic
                    {
                        Name = metricName,
                        Count = values.Count,
                        Average = values.Average(),
                        Minimum = values.Min(),
                        Maximum = values.Max(),
                        StandardDeviation = CalculateStandardDeviation(values)
                    };
                }
            }

            statistics.GeneratedAt = DateTimeOffset.UtcNow;
            statistics.TotalMetrics = _metricsHistory.Count;
            statistics.TotalDataPoints = _metricsHistory.Values.Sum(list => list.Count);
            
            return Task.FromResult(statistics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get metrics statistics");
            _telemetryService.TrackException(ex);
            throw;
        }
    }

    public void StartPeriodicCollection()
    {
        if (_isCollecting)
        {
            _logger.LogWarning("Metrics collection is already running");
            return;
        }

        _logger.LogInformation("Starting periodic metrics collection");
        _isCollecting = true;

        // Collect metrics every 30 seconds
        _ = Task.Run(async () =>
        {
            while (_isCollecting)
            {
                try
                {
                    await CollectSystemMetricsAsync();
                    await Task.Delay(TimeSpan.FromSeconds(30));
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error during periodic metrics collection");
                    _telemetryService.TrackException(ex);
                }
            }
        });

        _telemetryService.TrackEvent("MetricsCollectionStarted");
    }

    public void StopPeriodicCollection()
    {
        _logger.LogInformation("Stopping periodic metrics collection");
        _isCollecting = false;
        
        _telemetryService.TrackEvent("MetricsCollectionStopped");
    }

    private async Task CollectSystemMetricsAsync()
    {
        await RecordMetricAsync("cpu_usage", await GetCpuUsageAsync());
        await RecordMetricAsync("memory_usage", await GetMemoryUsageAsync());
        
        var processMetrics = await GetProcessMetricsAsync();
        await RecordMetricAsync("process_memory", processMetrics.WorkingSetMB);
        await RecordMetricAsync("process_cpu", processMetrics.CpuUsagePercent);
        await RecordMetricAsync("thread_count", processMetrics.ThreadCount);
        
        var gcMetrics = GetGarbageCollectionMetrics();
        await RecordMetricAsync("gc_gen0_collections", gcMetrics.Gen0Collections);
        await RecordMetricAsync("gc_gen1_collections", gcMetrics.Gen1Collections);
        await RecordMetricAsync("gc_gen2_collections", gcMetrics.Gen2Collections);
        await RecordMetricAsync("gc_total_memory", gcMetrics.TotalMemoryMB);
    }

    private async Task<double> GetCpuUsageAsync()
    {
        try
        {
            if (OperatingSystem.IsWindows() && _cpuCounter != null)
            {
                // First call returns 0, so call twice
                _cpuCounter.NextValue();
                await Task.Delay(100);
                return _cpuCounter.NextValue();
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Failed to get CPU usage from performance counter");
        }

        // Fallback: use Process.GetCurrentProcess()
        using var process = Process.GetCurrentProcess();
        return process.TotalProcessorTime.TotalMilliseconds / Environment.TickCount * 100;
    }

    private async Task<long> GetMemoryUsageAsync()
    {
        try
        {
            if (OperatingSystem.IsWindows() && _memoryCounter != null)
            {
                var availableMemoryMB = _memoryCounter.NextValue();
                // Estimate total memory (this is a simplified approach)
                var totalMemoryMB = 8192; // Assume 8GB, you might want to get this dynamically
                return (long)(totalMemoryMB - availableMemoryMB);
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Failed to get memory usage from performance counter");
        }

        // Fallback: use GC.GetTotalMemory
        return GC.GetTotalMemory(false) / (1024 * 1024); // Convert to MB
    }

    private async Task<ProcessMetrics> GetProcessMetricsAsync()
    {
        
        using var process = Process.GetCurrentProcess();
        return new ProcessMetrics
        {
            WorkingSetMB = process.WorkingSet64 / (1024 * 1024),
            CpuUsagePercent = 0, // Simplified for now
            ThreadCount = process.Threads.Count,
            HandleCount = process.HandleCount
        };
    }

    private GarbageCollectionMetrics GetGarbageCollectionMetrics()
    {
        return new GarbageCollectionMetrics
        {
            Gen0Collections = GC.CollectionCount(0),
            Gen1Collections = GC.CollectionCount(1),
            Gen2Collections = GC.CollectionCount(2),
            TotalMemoryMB = GC.GetTotalMemory(false) / (1024 * 1024)
        };
    }

    private RequestMetrics GetRequestMetrics()
    {
        var requestCount = GetCurrentMetricValue("request_count");
        var errorCount = GetCurrentMetricValue("error_count");
        
        return new RequestMetrics
        {
            TotalRequests = (long)requestCount,
            TotalErrors = (long)errorCount,
            ErrorRate = requestCount > 0 ? errorCount / requestCount * 100 : 0,
            AverageResponseTime = GetCurrentMetricValue("response_time")
        };
    }

    private double GetCurrentMetricValue(string metricName)
    {
        return _currentMetrics.TryGetValue(metricName, out var value) ? value : 0;
    }

    private List<MetricPoint> GetMetricHistory(string metricName, DateTimeOffset cutoffTime)
    {
        if (_metricsHistory.TryGetValue(metricName, out var history))
        {
            return history.Where(m => m.Timestamp >= cutoffTime).ToList();
        }
        return new List<MetricPoint>();
    }

    private static double GetMetricValueAtTime(List<MetricPoint> history, DateTimeOffset timestamp)
    {
        var exactMatch = history.FirstOrDefault(m => m.Timestamp == timestamp);
        if (exactMatch != null)
            return exactMatch.Value;

        // Find the closest value
        var closest = history.OrderBy(m => Math.Abs((m.Timestamp - timestamp).TotalMilliseconds)).FirstOrDefault();
        return closest?.Value ?? 0;
    }

    private static double CalculateStandardDeviation(List<double> values)
    {
        if (values.Count <= 1)
            return 0;

        var average = values.Average();
        var sumOfSquaresOfDifferences = values.Select(val => (val - average) * (val - average)).Sum();
        return Math.Sqrt(sumOfSquaresOfDifferences / values.Count);
    }

    public void Dispose()
    {
        StopPeriodicCollection();
        _cpuCounter?.Dispose();
        _memoryCounter?.Dispose();
    }
}

// Data models for metrics
public class CurrentMetrics
{
    public DateTimeOffset Timestamp { get; set; }
    public double CpuUsagePercent { get; set; }
    public long MemoryUsageMB { get; set; }
    public ProcessMetrics ProcessMetrics { get; set; } = new();
    public GarbageCollectionMetrics GarbageCollectionMetrics { get; set; } = new();
    public RequestMetrics RequestMetrics { get; set; } = new();
    public Dictionary<string, double> CustomMetrics { get; set; } = new();
}

public class ProcessMetrics
{
    public long WorkingSetMB { get; set; }
    public double CpuUsagePercent { get; set; }
    public int ThreadCount { get; set; }
    public int HandleCount { get; set; }
}

public class GarbageCollectionMetrics
{
    public int Gen0Collections { get; set; }
    public int Gen1Collections { get; set; }
    public int Gen2Collections { get; set; }
    public long TotalMemoryMB { get; set; }
}

public class RequestMetrics
{
    public long TotalRequests { get; set; }
    public long TotalErrors { get; set; }
    public double ErrorRate { get; set; }
    public double AverageResponseTime { get; set; }
}

public class MetricPoint
{
    public DateTimeOffset Timestamp { get; set; }
    public double Value { get; set; }
    public Dictionary<string, string> Tags { get; set; } = new();
}

public class MetricsStatistics
{
    public DateTimeOffset GeneratedAt { get; set; }
    public int TotalMetrics { get; set; }
    public int TotalDataPoints { get; set; }
    public Dictionary<string, MetricStatistic> MetricStats { get; set; } = new();
}

public class MetricStatistic
{
    public string Name { get; set; } = string.Empty;
    public int Count { get; set; }
    public double Average { get; set; }
    public double Minimum { get; set; }
    public double Maximum { get; set; }
    public double StandardDeviation { get; set; }
}

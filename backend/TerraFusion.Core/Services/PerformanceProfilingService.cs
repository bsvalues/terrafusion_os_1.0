using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System.Text.Json;
using System.Collections.Concurrent;
using System.Linq;

namespace TerraFusion.Core.Services
{
    public interface IPerformanceProfilingService
    {
        IDisposable StartProfiling(string operationName, Dictionary<string, object>? context = null);
        Task<ProfileResult> ProfileAsync<T>(string operationName, Func<Task<T>> operation, Dictionary<string, object>? context = null);
        Task<ProfileResult> ProfileAsync(string operationName, Func<Task> operation, Dictionary<string, object>? context = null);
        Task<PerformanceReport> GenerateReportAsync(DateTime? startTime = null, DateTime? endTime = null);
        Task<List<PerformanceMetric>> GetMetricsAsync(string? operationName = null, TimeSpan? timeWindow = null);
        Task<PerformanceBaseline> GetBaselineAsync(string operationName);
        Task SetBaselineAsync(string operationName, PerformanceBaseline baseline);
        Task<List<PerformanceAnomaly>> DetectAnomaliesAsync(TimeSpan? timeWindow = null);
    }

    public class ProfileResult
    {
        public string OperationName { get; set; }
        public TimeSpan Duration { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public long MemoryBefore { get; set; }
        public long MemoryAfter { get; set; }
        public long MemoryDelta => MemoryAfter - MemoryBefore;
        public int ThreadId { get; set; }
        public Dictionary<string, object> Context { get; set; } = new Dictionary<string, object>();
        public Dictionary<string, double> CustomMetrics { get; set; } = new Dictionary<string, double>();
        public bool IsSuccess { get; set; } = true;
        public string ErrorMessage { get; set; }
        public Exception Exception { get; set; }
    }

    public class PerformanceMetric
    {
        public string OperationName { get; set; }
        public DateTime Timestamp { get; set; }
        public TimeSpan Duration { get; set; }
        public long MemoryUsage { get; set; }
        public double CpuUsage { get; set; }
        public int ThreadCount { get; set; }
        public Dictionary<string, object> Context { get; set; } = new Dictionary<string, object>();
        public string Status { get; set; } = "success";
    }

    public class PerformanceReport
    {
        public DateTime GeneratedAt { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public int TotalOperations { get; set; }
        public Dictionary<string, OperationStats> OperationStatistics { get; set; } = new Dictionary<string, OperationStats>();
        public List<PerformanceAnomaly> Anomalies { get; set; } = new List<PerformanceAnomaly>();
        public SystemResourceStats SystemStats { get; set; }
        public List<string> Recommendations { get; set; } = new List<string>();
    }

    public class OperationStats
    {
        public string OperationName { get; set; }
        public int Count { get; set; }
        public TimeSpan TotalDuration { get; set; }
        public TimeSpan AverageDuration { get; set; }
        public TimeSpan MinDuration { get; set; }
        public TimeSpan MaxDuration { get; set; }
        public TimeSpan MedianDuration { get; set; }
        public TimeSpan P95Duration { get; set; }
        public TimeSpan P99Duration { get; set; }
        public double ErrorRate { get; set; }
        public long AverageMemoryUsage { get; set; }
        public double ThroughputPerSecond { get; set; }
    }

    public class PerformanceBaseline
    {
        public string OperationName { get; set; }
        public TimeSpan ExpectedDuration { get; set; }
        public TimeSpan MaxAcceptableDuration { get; set; }
        public long ExpectedMemoryUsage { get; set; }
        public double ExpectedThroughput { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastUpdated { get; set; }
    }

    public class PerformanceAnomaly
    {
        public string Id { get; set; }
        public string OperationName { get; set; }
        public DateTime DetectedAt { get; set; }
        public string AnomalyType { get; set; }
        public string Severity { get; set; }
        public string Description { get; set; }
        public Dictionary<string, object> Details { get; set; } = new Dictionary<string, object>();
        public double DeviationScore { get; set; }
    }

    public class SystemResourceStats
    {
        public double AverageCpuUsage { get; set; }
        public long AverageMemoryUsage { get; set; }
        public long PeakMemoryUsage { get; set; }
        public int AverageThreadCount { get; set; }
        public int PeakThreadCount { get; set; }
        public long TotalGcCollections { get; set; }
        public TimeSpan TotalGcTime { get; set; }
    }

    public class PerformanceProfilingService : IPerformanceProfilingService
    {
        private readonly ILogger<PerformanceProfilingService> _logger;
        private readonly IConfiguration _configuration;
        private readonly ConcurrentQueue<PerformanceMetric> _metrics;
        private readonly ConcurrentDictionary<string, PerformanceBaseline> _baselines;
        private readonly PerformanceCounter? _cpuCounter;
        private readonly Process _currentProcess;

        // Configuration
        private readonly bool _enableProfiling;
        private readonly int _maxMetricsRetention;
        private readonly TimeSpan _anomalyDetectionWindow;
        private readonly double _anomalyThreshold;

        public PerformanceProfilingService(
            ILogger<PerformanceProfilingService> logger,
            IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
            _metrics = new ConcurrentQueue<PerformanceMetric>();
            _baselines = new ConcurrentDictionary<string, PerformanceBaseline>();
            _currentProcess = Process.GetCurrentProcess();

            _enableProfiling = configuration.GetValue<bool>("Performance:EnableProfiling", true);
            _maxMetricsRetention = configuration.GetValue<int>("Performance:MaxMetricsRetention", 10000);
            _anomalyDetectionWindow = TimeSpan.FromMinutes(configuration.GetValue<int>("Performance:AnomalyDetectionWindowMinutes", 15));
            _anomalyThreshold = configuration.GetValue<double>("Performance:AnomalyThreshold", 2.0);

            try
            {
                if (OperatingSystem.IsWindows())
                {
                    _cpuCounter = new PerformanceCounter("Processor", "% Processor Time", "_Total");
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to initialize CPU performance counter");
            }
        }

        public IDisposable StartProfiling(string operationName, Dictionary<string, object>? context = null)
        {
            if (!_enableProfiling) return new NoOpDisposable();

            return new ProfilingScope(this, operationName, context);
        }

        public async Task<ProfileResult> ProfileAsync<T>(string operationName, Func<Task<T>> operation, Dictionary<string, object>? context = null)
        {
            if (!_enableProfiling)
            {
                await operation();
                return new ProfileResult { OperationName = operationName, IsSuccess = true };
            }

            var result = new ProfileResult
            {
                OperationName = operationName,
                StartTime = DateTime.UtcNow,
                ThreadId = Environment.CurrentManagedThreadId,
                Context = context ?? new Dictionary<string, object>()
            };

            var stopwatch = Stopwatch.StartNew();
            result.MemoryBefore = GC.GetTotalMemory(false);

            try
            {
                await operation();
                result.IsSuccess = true;
            }
            catch (Exception ex)
            {
                result.IsSuccess = false;
                result.Exception = ex;
                result.ErrorMessage = ex.Message;
                throw;
            }
            finally
            {
                stopwatch.Stop();
                result.Duration = stopwatch.Elapsed;
                result.EndTime = DateTime.UtcNow;
                result.MemoryAfter = GC.GetTotalMemory(false);

                await RecordMetricAsync(result);
            }

            return result;
        }

        public async Task<ProfileResult> ProfileAsync(string operationName, Func<Task> operation, Dictionary<string, object>? context = null)
        {
            return await ProfileAsync<object>(operationName, async () =>
            {
                await operation();
                return null;
            }, context);
        }

        public async Task<PerformanceReport> GenerateReportAsync(DateTime? startTime = null, DateTime? endTime = null)
        {
            var start = startTime ?? DateTime.UtcNow.AddHours(-24);
            var end = endTime ?? DateTime.UtcNow;

            var relevantMetrics = _metrics
                .Where(m => m.Timestamp >= start && m.Timestamp <= end)
                .ToList();

            var report = new PerformanceReport
            {
                GeneratedAt = DateTime.UtcNow,
                StartTime = start,
                EndTime = end,
                TotalOperations = relevantMetrics.Count
            };

            // Generate operation statistics
            var operationGroups = relevantMetrics.GroupBy(m => m.OperationName);
            foreach (var group in operationGroups)
            {
                var durations = group.Select(m => m.Duration).OrderBy(d => d).ToList();
                var errorCount = group.Count(m => m.Status != "success");

                var stats = new OperationStats
                {
                    OperationName = group.Key,
                    Count = group.Count(),
                    TotalDuration = TimeSpan.FromTicks(durations.Sum(d => d.Ticks)),
                    AverageDuration = TimeSpan.FromTicks((long)durations.Average(d => d.Ticks)),
                    MinDuration = durations.First(),
                    MaxDuration = durations.Last(),
                    MedianDuration = durations[durations.Count / 2],
                    P95Duration = durations[(int)(durations.Count * 0.95)],
                    P99Duration = durations[(int)(durations.Count * 0.99)],
                    ErrorRate = (double)errorCount / group.Count(),
                    AverageMemoryUsage = (long)group.Average(m => m.MemoryUsage),
                    ThroughputPerSecond = group.Count() / (end - start).TotalSeconds
                };

                report.OperationStatistics[group.Key] = stats;
            }

            // Generate system statistics
            report.SystemStats = new SystemResourceStats
            {
                AverageCpuUsage = relevantMetrics.Average(m => m.CpuUsage),
                AverageMemoryUsage = (long)relevantMetrics.Average(m => m.MemoryUsage),
                PeakMemoryUsage = relevantMetrics.Max(m => m.MemoryUsage),
                AverageThreadCount = (int)relevantMetrics.Average(m => m.ThreadCount),
                PeakThreadCount = relevantMetrics.Max(m => m.ThreadCount),
                TotalGcCollections = GC.CollectionCount(0) + GC.CollectionCount(1) + GC.CollectionCount(2)
            };

            // Detect anomalies
            report.Anomalies = await DetectAnomaliesAsync(end - start);

            // Generate recommendations
            report.Recommendations = GenerateRecommendations(report);

            return report;
        }

        public async Task<List<PerformanceMetric>> GetMetricsAsync(string? operationName = null, TimeSpan? timeWindow = null)
        {
            var cutoff = timeWindow.HasValue ? DateTime.UtcNow - timeWindow.Value : DateTime.MinValue;
            
            var filteredMetrics = _metrics
                .Where(m => m.Timestamp >= cutoff)
                .Where(m => string.IsNullOrEmpty(operationName) || m.OperationName == operationName)
                .OrderByDescending(m => m.Timestamp)
                .ToList();

            return filteredMetrics;
        }

        public async Task<PerformanceBaseline> GetBaselineAsync(string operationName)
        {
            if (_baselines.TryGetValue(operationName, out var baseline))
            {
                return baseline;
            }

            // Create a sensible default baseline to avoid null returns
            var now = DateTime.UtcNow;
            var defaultBaseline = new PerformanceBaseline
            {
                OperationName = operationName,
                ExpectedDuration = TimeSpan.FromMilliseconds(100),
                MaxAcceptableDuration = TimeSpan.FromMilliseconds(1000),
                ExpectedMemoryUsage = 0,
                ExpectedThroughput = 0,
                CreatedAt = now,
                LastUpdated = now
            };

            _baselines[operationName] = defaultBaseline;
            return defaultBaseline;
        }

        public async Task SetBaselineAsync(string operationName, PerformanceBaseline baseline)
        {
            baseline.LastUpdated = DateTime.UtcNow;
            _baselines[operationName] = baseline;
            
            _logger.LogInformation("Updated performance baseline for operation {OperationName}", operationName);
        }

        public async Task<List<PerformanceAnomaly>> DetectAnomaliesAsync(TimeSpan? timeWindow = null)
        {
            var window = timeWindow ?? _anomalyDetectionWindow;
            var cutoff = DateTime.UtcNow - window;
            var anomalies = new List<PerformanceAnomaly>();

            var recentMetrics = _metrics
                .Where(m => m.Timestamp >= cutoff)
                .GroupBy(m => m.OperationName)
                .ToList();

            foreach (var operationGroup in recentMetrics)
            {
                var operationName = operationGroup.Key;
                var metrics = operationGroup.ToList();

                if (metrics.Count < 10) continue; // Need sufficient data

                // Calculate statistical measures
                var durations = metrics.Select(m => m.Duration.TotalMilliseconds).ToList();
                var mean = durations.Average();
                var stdDev = Math.Sqrt(durations.Average(d => Math.Pow(d - mean, 2)));

                // Detect duration anomalies
                var durationAnomalies = metrics
                    .Where(m => Math.Abs(m.Duration.TotalMilliseconds - mean) > _anomalyThreshold * stdDev)
                    .Select(m => new PerformanceAnomaly
                    {
                        Id = Guid.NewGuid().ToString(),
                        OperationName = operationName,
                        DetectedAt = m.Timestamp,
                        AnomalyType = "duration",
                        Severity = GetAnomalySeverity(Math.Abs(m.Duration.TotalMilliseconds - mean) / stdDev),
                        Description = $"Operation duration ({m.Duration.TotalMilliseconds:F2}ms) significantly deviates from average ({mean:F2}ms)",
                        DeviationScore = Math.Abs(m.Duration.TotalMilliseconds - mean) / stdDev,
                        Details = new Dictionary<string, object>
                        {
                            ["actual_duration"] = m.Duration.TotalMilliseconds,
                            ["expected_duration"] = mean,
                            ["deviation_factor"] = Math.Abs(m.Duration.TotalMilliseconds - mean) / stdDev
                        }
                    });

                anomalies.AddRange(durationAnomalies);

                // Detect memory anomalies
                var memoryUsages = metrics.Select(m => (double)m.MemoryUsage).ToList();
                var memoryMean = memoryUsages.Average();
                var memoryStdDev = Math.Sqrt(memoryUsages.Average(m => Math.Pow(m - memoryMean, 2)));

                var memoryAnomalies = metrics
                    .Where(m => Math.Abs(m.MemoryUsage - memoryMean) > _anomalyThreshold * memoryStdDev)
                    .Select(m => new PerformanceAnomaly
                    {
                        Id = Guid.NewGuid().ToString(),
                        OperationName = operationName,
                        DetectedAt = m.Timestamp,
                        AnomalyType = "memory",
                        Severity = GetAnomalySeverity(Math.Abs(m.MemoryUsage - memoryMean) / memoryStdDev),
                        Description = $"Memory usage ({m.MemoryUsage:N0} bytes) significantly deviates from average ({memoryMean:N0} bytes)",
                        DeviationScore = Math.Abs(m.MemoryUsage - memoryMean) / memoryStdDev,
                        Details = new Dictionary<string, object>
                        {
                            ["actual_memory"] = m.MemoryUsage,
                            ["expected_memory"] = memoryMean,
                            ["deviation_factor"] = Math.Abs(m.MemoryUsage - memoryMean) / memoryStdDev
                        }
                    });

                anomalies.AddRange(memoryAnomalies);

                // Check against baselines if available
                if (_baselines.TryGetValue(operationName, out var baseline))
                {
                    var baselineViolations = metrics
                        .Where(m => m.Duration > baseline.MaxAcceptableDuration)
                        .Select(m => new PerformanceAnomaly
                        {
                            Id = Guid.NewGuid().ToString(),
                            OperationName = operationName,
                            DetectedAt = m.Timestamp,
                            AnomalyType = "baseline_violation",
                            Severity = "high",
                            Description = $"Operation exceeded baseline maximum duration ({baseline.MaxAcceptableDuration.TotalMilliseconds}ms)",
                            DeviationScore = m.Duration.TotalMilliseconds / baseline.MaxAcceptableDuration.TotalMilliseconds,
                            Details = new Dictionary<string, object>
                            {
                                ["actual_duration"] = m.Duration.TotalMilliseconds,
                                ["baseline_max"] = baseline.MaxAcceptableDuration.TotalMilliseconds,
                                ["baseline_expected"] = baseline.ExpectedDuration.TotalMilliseconds
                            }
                        });

                    anomalies.AddRange(baselineViolations);
                }
            }

            return anomalies.OrderByDescending(a => a.DeviationScore).ToList();
        }

        private async Task RecordMetricAsync(ProfileResult result)
        {
            var metric = new PerformanceMetric
            {
                OperationName = result.OperationName,
                Timestamp = result.StartTime,
                Duration = result.Duration,
                MemoryUsage = result.MemoryAfter,
                CpuUsage = GetCurrentCpuUsage(),
                ThreadCount = _currentProcess.Threads.Count,
                Context = result.Context,
                Status = result.IsSuccess ? "success" : "error"
            };

            _metrics.Enqueue(metric);

            // Maintain retention limit
            while (_metrics.Count > _maxMetricsRetention)
            {
                _metrics.TryDequeue(out _);
            }

            _logger.LogDebug("Recorded performance metric for {OperationName}: {Duration}ms",
                result.OperationName, result.Duration.TotalMilliseconds);
        }

        private double GetCurrentCpuUsage()
        {
            try
            {
                if (OperatingSystem.IsWindows())
                {
                    return _cpuCounter?.NextValue() ?? 0;
                }
                return 0;
            }
            catch
            {
                return 0;
            }
        }

        private string GetAnomalySeverity(double deviationFactor)
        {
            return deviationFactor switch
            {
                >= 5.0 => "critical",
                >= 3.0 => "high",
                >= 2.0 => "medium",
                _ => "low"
            };
        }

        private List<string> GenerateRecommendations(PerformanceReport report)
        {
            var recommendations = new List<string>();

            // Check for slow operations
            var slowOperations = report.OperationStatistics
                .Where(kvp => kvp.Value.P95Duration.TotalMilliseconds > 5000)
                .ToList();

            if (slowOperations.Any())
            {
                recommendations.Add($"Consider optimizing slow operations: {string.Join(", ", slowOperations.Select(op => op.Key))}");
            }

            // Check for high error rates
            var errorProneOperations = report.OperationStatistics
                .Where(kvp => kvp.Value.ErrorRate > 0.05)
                .ToList();

            if (errorProneOperations.Any())
            {
                recommendations.Add($"Investigate high error rates in: {string.Join(", ", errorProneOperations.Select(op => op.Key))}");
            }

            // Check memory usage
            if (report.SystemStats.PeakMemoryUsage > 1_000_000_000) // 1GB
            {
                recommendations.Add("Consider memory optimization - peak usage exceeded 1GB");
            }

            // Check GC pressure
            if (report.SystemStats.TotalGcCollections > 1000)
            {
                recommendations.Add("High GC activity detected - consider reducing object allocations");
            }

            return recommendations;
        }

        private class ProfilingScope : IDisposable
        {
            private readonly PerformanceProfilingService _service;
            private readonly ProfileResult _result;
            private readonly Stopwatch _stopwatch;

            public ProfilingScope(PerformanceProfilingService service, string operationName, Dictionary<string, object>? context)
            {
                _service = service;
                _result = new ProfileResult
                {
                    OperationName = operationName,
                    StartTime = DateTime.UtcNow,
                    ThreadId = Environment.CurrentManagedThreadId,
                    Context = context ?? new Dictionary<string, object>(),
                    MemoryBefore = GC.GetTotalMemory(false)
                };
                _stopwatch = Stopwatch.StartNew();
            }

            public void Dispose()
            {
                _stopwatch.Stop();
                _result.Duration = _stopwatch.Elapsed;
                _result.EndTime = DateTime.UtcNow;
                _result.MemoryAfter = GC.GetTotalMemory(false);

                Task.Run(async () => await _service.RecordMetricAsync(_result));
            }
        }

        private class NoOpDisposable : IDisposable
        {
            public void Dispose() { }
        }
    }
}

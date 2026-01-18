/**
 * MetricStreamingService
 *
 * Implementation of real-time metric streaming service.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 1.0.0 - Phase 1 Foundation
 */

using System.Collections.Concurrent;

namespace TerraFusion.StreamingAnalytics.Services;

/// <summary>
/// Service for streaming analytics metrics
/// </summary>
public class MetricStreamingService : IMetricStreamingService
{
    private readonly ILogger<MetricStreamingService> _logger;
    private readonly ConcurrentDictionary<string, Func<Task<object>>> _metricProviders = new();
    private readonly ConcurrentDictionary<string, CancellationTokenSource> _streamingTasks = new();

    public MetricStreamingService(ILogger<MetricStreamingService> logger)
    {
        _logger = logger;

        // Register default metrics
        RegisterDefaultMetrics();
    }

    /// <summary>
    /// Get current value of a metric
    /// </summary>
    public async Task<object> GetMetricAsync(string metricName)
    {
        if (_metricProviders.TryGetValue(metricName, out var provider))
        {
            return await provider();
        }

        _logger.LogWarning("Metric not found: {MetricName}", metricName);
        throw new KeyNotFoundException($"Metric '{metricName}' not found");
    }

    /// <summary>
    /// Register a new metric source
    /// </summary>
    public void RegisterMetric(string metricName, Func<Task<object>> metricProvider)
    {
        _metricProviders[metricName] = metricProvider;
        _logger.LogInformation("Registered metric: {MetricName}", metricName);
    }

    /// <summary>
    /// Start streaming a metric
    /// </summary>
    public Task StartStreamingAsync(string metricName, int intervalMs)
    {
        if (_streamingTasks.ContainsKey(metricName))
        {
            _logger.LogWarning("Metric already streaming: {MetricName}", metricName);
            return Task.CompletedTask;
        }

        var cts = new CancellationTokenSource();
        _streamingTasks[metricName] = cts;

        _ = Task.Run(async () =>
        {
            while (!cts.Token.IsCancellationRequested)
            {
                try
                {
                    var value = await GetMetricAsync(metricName);
                    // Broadcasting will be done by MetricBroadcastService
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error streaming metric: {MetricName}", metricName);
                }

                await Task.Delay(intervalMs, cts.Token);
            }
        }, cts.Token);

        _logger.LogInformation("Started streaming metric: {MetricName}, Interval={Interval}ms", metricName, intervalMs);
        return Task.CompletedTask;
    }

    /// <summary>
    /// Stop streaming a metric
    /// </summary>
    public Task StopStreamingAsync(string metricName)
    {
        if (_streamingTasks.TryRemove(metricName, out var cts))
        {
            cts.Cancel();
            cts.Dispose();
            _logger.LogInformation("Stopped streaming metric: {MetricName}", metricName);
        }

        return Task.CompletedTask;
    }

    /// <summary>
    /// Get all available metrics
    /// </summary>
    public Task<IEnumerable<string>> GetAvailableMetricsAsync()
    {
        return Task.FromResult<IEnumerable<string>>(_metricProviders.Keys.ToList());
    }

    /// <summary>
    /// Register default system metrics
    /// </summary>
    private void RegisterDefaultMetrics()
    {
        // Phase 1: Simulated metrics
        RegisterMetric("system.cpu", async () =>
        {
            await Task.Delay(1);
            return new
            {
                Value = 30 + Random.Shared.NextDouble() * 20,
                Unit = "percent",
                Timestamp = DateTime.UtcNow
            };
        });

        RegisterMetric("system.memory", async () =>
        {
            await Task.Delay(1);
            return new
            {
                Value = 50 + Random.Shared.NextDouble() * 20,
                Unit = "percent",
                Timestamp = DateTime.UtcNow
            };
        });

        RegisterMetric("agents.active", async () =>
        {
            await Task.Delay(1);
            return new
            {
                Value = 876 + Random.Shared.Next(-20, 20),
                Total = 1008,
                Timestamp = DateTime.UtcNow
            };
        });

        RegisterMetric("swarm.coherence", async () =>
        {
            await Task.Delay(1);
            return new
            {
                Value = 0.987 + (Random.Shared.NextDouble() - 0.5) * 0.02,
                Timestamp = DateTime.UtcNow
            };
        });

        _logger.LogInformation("Registered {Count} default metrics", _metricProviders.Count);
    }
}

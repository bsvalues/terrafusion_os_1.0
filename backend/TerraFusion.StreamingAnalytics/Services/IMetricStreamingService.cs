/**
 * IMetricStreamingService Interface
 *
 * Service interface for real-time metric streaming.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 1.0.0 - Phase 1 Foundation
 */

namespace TerraFusion.StreamingAnalytics.Services;

/// <summary>
/// Service for streaming analytics metrics
/// </summary>
public interface IMetricStreamingService
{
    /// <summary>
    /// Get current value of a named metric
    /// </summary>
    Task<object> GetMetricAsync(string metricName);

    /// <summary>
    /// Register a new metric source
    /// </summary>
    void RegisterMetric(string metricName, Func<Task<object>> metricProvider);

    /// <summary>
    /// Start streaming a metric to all subscribers
    /// </summary>
    Task StartStreamingAsync(string metricName, int intervalMs);

    /// <summary>
    /// Stop streaming a metric
    /// </summary>
    Task StopStreamingAsync(string metricName);

    /// <summary>
    /// Get all available metric names
    /// </summary>
    Task<IEnumerable<string>> GetAvailableMetricsAsync();
}

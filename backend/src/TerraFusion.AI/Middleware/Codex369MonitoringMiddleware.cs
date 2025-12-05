/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - CODEX 3-6-9 MONITORING MIDDLEWARE
 * Request/Response Performance Tracking for Divine Balance
 * Automatically Feeds Metrics into 3-6-9 Framework
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using TerraFusion.AI.Services;

namespace TerraFusion.AI.Middleware;

/// <summary>
/// Middleware to monitor all HTTP requests/responses and feed metrics into Codex 3-6-9
/// </summary>
public class Codex369MonitoringMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<Codex369MonitoringMiddleware> _logger;

    public Codex369MonitoringMiddleware(
        RequestDelegate next,
        ILogger<Codex369MonitoringMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(
        HttpContext context,
        ICodex369MetricsCollector metricsCollector)
    {
        var stopwatch = Stopwatch.StartNew();
        var path = context.Request.Path.Value ?? "unknown";
        var method = context.Request.Method;

        try
        {
            // Execute next middleware
            await _next(context);

            stopwatch.Stop();

            // Collect success metrics
            await metricsCollector.RecordRequestMetricAsync(new RequestMetric
            {
                Path = path,
                Method = method,
                StatusCode = context.Response.StatusCode,
                DurationMs = stopwatch.Elapsed.TotalMilliseconds,
                Success = context.Response.StatusCode < 400,
                Timestamp = DateTime.UtcNow
            });

            // Log slow requests
            if (stopwatch.ElapsedMilliseconds > 1000)
            {
                _logger.LogWarning("⚠️ Slow request detected: {Method} {Path} took {Ms}ms",
                    method, path, stopwatch.ElapsedMilliseconds);
            }
        }
        catch (Exception ex)
        {
            stopwatch.Stop();

            // Collect failure metrics
            await metricsCollector.RecordRequestMetricAsync(new RequestMetric
            {
                Path = path,
                Method = method,
                StatusCode = 500,
                DurationMs = stopwatch.Elapsed.TotalMilliseconds,
                Success = false,
                Error = ex.Message,
                Timestamp = DateTime.UtcNow
            });

            _logger.LogError(ex, "❌ Request failed: {Method} {Path}", method, path);
            throw;
        }
    }
}

/// <summary>
/// Request metric data
/// </summary>
public class RequestMetric
{
    public string Path { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public int StatusCode { get; set; }
    public double DurationMs { get; set; }
    public bool Success { get; set; }
    public string? Error { get; set; }
    public DateTime Timestamp { get; set; }
}

/// <summary>
/// Service to collect and aggregate metrics for Codex 3-6-9 framework
/// </summary>
public interface ICodex369MetricsCollector
{
    /// <summary>
    /// Record a request metric
    /// </summary>
    Task RecordRequestMetricAsync(RequestMetric metric);

    /// <summary>
    /// Get aggregated metrics for time window
    /// </summary>
    Task<AggregatedMetrics> GetAggregatedMetricsAsync(TimeSpan window);

    /// <summary>
    /// Get current foundation metrics from collected data
    /// </summary>
    Task<List<TerraFusion.AI.DTOs.FoundationMetric>> GetFoundationMetricsFromCollectedDataAsync();
}

public class Codex369MetricsCollector : ICodex369MetricsCollector
{
    private readonly ILogger<Codex369MetricsCollector> _logger;
    private readonly List<RequestMetric> _metrics = new();
    private readonly object _lock = new();
    private const int MAX_METRICS_TO_KEEP = 10000; // Keep last 10k requests

    public Codex369MetricsCollector(ILogger<Codex369MetricsCollector> logger)
    {
        _logger = logger;
    }

    public Task RecordRequestMetricAsync(RequestMetric metric)
    {
        lock (_lock)
        {
            _metrics.Add(metric);

            // Keep only recent metrics
            if (_metrics.Count > MAX_METRICS_TO_KEEP)
            {
                _metrics.RemoveRange(0, _metrics.Count - MAX_METRICS_TO_KEEP);
            }
        }

        return Task.CompletedTask;
    }

    public Task<AggregatedMetrics> GetAggregatedMetricsAsync(TimeSpan window)
    {
        var cutoff = DateTime.UtcNow - window;

        List<RequestMetric> recentMetrics;
        lock (_lock)
        {
            recentMetrics = _metrics.Where(m => m.Timestamp >= cutoff).ToList();
        }

        var aggregated = new AggregatedMetrics
        {
            TotalRequests = recentMetrics.Count,
            SuccessfulRequests = recentMetrics.Count(m => m.Success),
            FailedRequests = recentMetrics.Count(m => !m.Success),
            AverageResponseTimeMs = recentMetrics.Any() ? recentMetrics.Average(m => m.DurationMs) : 0,
            MedianResponseTimeMs = CalculateMedian(recentMetrics.Select(m => m.DurationMs).ToList()),
            P95ResponseTimeMs = CalculatePercentile(recentMetrics.Select(m => m.DurationMs).ToList(), 0.95),
            P99ResponseTimeMs = CalculatePercentile(recentMetrics.Select(m => m.DurationMs).ToList(), 0.99),
            RequestsPerSecond = recentMetrics.Any() ? recentMetrics.Count / window.TotalSeconds : 0,
            TimeWindow = window
        };

        return Task.FromResult(aggregated);
    }

    public async Task<List<TerraFusion.AI.DTOs.FoundationMetric>> GetFoundationMetricsFromCollectedDataAsync()
    {
        var metrics = await GetAggregatedMetricsAsync(TimeSpan.FromMinutes(5));
        var foundationMetrics = new List<TerraFusion.AI.DTOs.FoundationMetric>();

        // Response Time metric (lower is better, so invert)
        var responseTimeScore = CalculateInverseScore(metrics.AverageResponseTimeMs, 100.0, 12.0);
        foundationMetrics.Add(new TerraFusion.AI.DTOs.FoundationMetric
        {
            MetricId = "http-response-time",
            Name = "HTTP Response Time",
            RawValue = metrics.AverageResponseTimeMs,
            BaselineThreshold = 100.0, // 100ms baseline
            NormalizedValue = responseTimeScore,
            WithinBaseline = metrics.AverageResponseTimeMs <= 100.0,
            Category = TerraFusion.AI.DTOs.MetricCategory.ResponseTime,
            Weight = 1.0,
            MeasuredAt = DateTime.UtcNow
        });

        // Throughput metric (requests per second)
        var throughputScore = Math.Min((metrics.RequestsPerSecond / 100.0) * 12.0, 12.0);
        foundationMetrics.Add(new TerraFusion.AI.DTOs.FoundationMetric
        {
            MetricId = "http-throughput",
            Name = "HTTP Throughput (req/sec)",
            RawValue = metrics.RequestsPerSecond,
            BaselineThreshold = 100.0, // 100 req/sec baseline
            NormalizedValue = throughputScore,
            WithinBaseline = metrics.RequestsPerSecond >= 50.0,
            Category = TerraFusion.AI.DTOs.MetricCategory.Throughput,
            Weight = 1.0,
            MeasuredAt = DateTime.UtcNow
        });

        // Success Rate metric
        var successRate = metrics.TotalRequests > 0
            ? (double)metrics.SuccessfulRequests / metrics.TotalRequests * 100.0
            : 100.0;
        var successRateScore = (successRate / 100.0) * 12.0;

        foundationMetrics.Add(new TerraFusion.AI.DTOs.FoundationMetric
        {
            MetricId = "http-success-rate",
            Name = "HTTP Success Rate (%)",
            RawValue = successRate,
            BaselineThreshold = 100.0,
            NormalizedValue = successRateScore,
            WithinBaseline = successRate >= 99.0,
            Category = TerraFusion.AI.DTOs.MetricCategory.DataQuality,
            Weight = 1.5, // Higher weight for success rate
            MeasuredAt = DateTime.UtcNow
        });

        return foundationMetrics;
    }

    #region Helper Methods

    private double CalculateMedian(List<double> values)
    {
        if (!values.Any()) return 0;

        var sorted = values.OrderBy(v => v).ToList();
        var mid = sorted.Count / 2;

        return sorted.Count % 2 == 0
            ? (sorted[mid - 1] + sorted[mid]) / 2.0
            : sorted[mid];
    }

    private double CalculatePercentile(List<double> values, double percentile)
    {
        if (!values.Any()) return 0;

        var sorted = values.OrderBy(v => v).ToList();
        var index = (int)Math.Ceiling(percentile * sorted.Count) - 1;
        index = Math.Max(0, Math.Min(index, sorted.Count - 1));

        return sorted[index];
    }

    private double CalculateInverseScore(double value, double baseline, double maxScore)
    {
        // For metrics where lower is better (like response time)
        if (value >= baseline) return 0;

        var ratio = 1.0 - (value / baseline);
        return Math.Min(ratio * maxScore, maxScore);
    }

    #endregion
}

/// <summary>
/// Aggregated metrics over a time window
/// </summary>
public class AggregatedMetrics
{
    public int TotalRequests { get; set; }
    public int SuccessfulRequests { get; set; }
    public int FailedRequests { get; set; }
    public double AverageResponseTimeMs { get; set; }
    public double MedianResponseTimeMs { get; set; }
    public double P95ResponseTimeMs { get; set; }
    public double P99ResponseTimeMs { get; set; }
    public double RequestsPerSecond { get; set; }
    public TimeSpan TimeWindow { get; set; }
}

/// <summary>
/// Extension methods for middleware registration
/// </summary>
public static class Codex369MonitoringMiddlewareExtensions
{
    /// <summary>
    /// Add Codex 3-6-9 monitoring middleware to the pipeline
    /// </summary>
    public static IApplicationBuilder UseCodex369Monitoring(this IApplicationBuilder app)
    {
        return app.UseMiddleware<Codex369MonitoringMiddleware>();
    }
}

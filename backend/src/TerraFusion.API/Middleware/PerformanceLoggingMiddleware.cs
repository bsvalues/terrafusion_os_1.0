// TFT-090 — canon-observability: Request performance logging middleware
// TerraCanon domain — observability infrastructure. No valuation math.

using System.Collections.Concurrent;
using System.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace TerraFusion.API.Middleware;

/// <summary>
/// Per-endpoint aggregate performance statistics.
/// </summary>
public sealed class EndpointMetrics
{
    /// <summary>Normalized endpoint path (e.g. "/api/properties").</summary>
    public required string Endpoint { get; init; }

    /// <summary>Total number of requests observed.</summary>
    public long RequestCount { get; internal set; }

    /// <summary>Total accumulated duration across all requests.</summary>
    public TimeSpan TotalDuration { get; internal set; }

    /// <summary>Average request duration.</summary>
    public TimeSpan AverageDuration =>
        RequestCount == 0 ? TimeSpan.Zero : TotalDuration / RequestCount;

    /// <summary>Slowest observed request duration.</summary>
    public TimeSpan MaxDuration { get; internal set; }

    /// <summary>Number of requests that exceeded the slow-request threshold.</summary>
    public long SlowRequestCount { get; internal set; }
}

/// <summary>
/// Configuration options for <see cref="PerformanceLoggingMiddleware"/>.
/// </summary>
public sealed class PerformanceLoggingOptions
{
    /// <summary>
    /// Requests exceeding this duration are flagged as slow.
    /// Default: 500 ms.
    /// </summary>
    public TimeSpan SlowRequestThreshold { get; set; } = TimeSpan.FromMilliseconds(500);

    /// <summary>
    /// When true, the middleware adds an <c>X-Response-Time</c> header to every response.
    /// Default: true.
    /// </summary>
    public bool IncludeResponseHeader { get; set; } = true;

    /// <summary>
    /// Path prefixes to exclude from logging (e.g. "/health", "/favicon.ico").
    /// Comparisons are ordinal-ignore-case.
    /// </summary>
    public List<string> ExcludedPrefixes { get; set; } = ["/health", "/favicon.ico", "/_framework"];
}

/// <summary>
/// ASP.NET Core middleware that tracks request duration, detects slow requests,
/// and aggregates per-endpoint metrics in a thread-safe manner.
/// Produces Serilog-compatible structured log output.
/// </summary>
public sealed class PerformanceLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<PerformanceLoggingMiddleware> _logger;
    private readonly PerformanceLoggingOptions _options;

    private static readonly ConcurrentDictionary<string, EndpointMetrics> _endpointMetrics = new(StringComparer.OrdinalIgnoreCase);

    public PerformanceLoggingMiddleware(
        RequestDelegate next,
        ILogger<PerformanceLoggingMiddleware> logger,
        PerformanceLoggingOptions? options = null)
    {
        _next = next ?? throw new ArgumentNullException(nameof(next));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _options = options ?? new PerformanceLoggingOptions();
    }

    /// <summary>Process the request and record performance data.</summary>
    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? "/";

        // Skip excluded paths
        if (IsExcluded(path))
        {
            await _next(context);
            return;
        }

        var sw = Stopwatch.StartNew();

        try
        {
            await _next(context);
        }
        finally
        {
            sw.Stop();
            RecordRequest(context, path, sw.Elapsed);
        }
    }

    /// <summary>
    /// Retrieve a read-only snapshot of all collected endpoint metrics.
    /// </summary>
    public static IReadOnlyList<EndpointMetrics> GetEndpointMetrics()
    {
        return _endpointMetrics.Values
            .OrderByDescending(m => m.RequestCount)
            .ToList();
    }

    /// <summary>
    /// Reset all collected endpoint metrics. Useful for testing.
    /// </summary>
    public static void ResetMetrics()
    {
        _endpointMetrics.Clear();
    }

    // ── Private helpers ──────────────────────────────────────────────

    private void RecordRequest(HttpContext context, string path, TimeSpan duration)
    {
        var method = context.Request.Method;
        var statusCode = context.Response.StatusCode;
        var endpointKey = $"{method} {NormalizePath(path)}";

        // Optionally add response header
        if (_options.IncludeResponseHeader && !context.Response.HasStarted)
        {
            context.Response.Headers["X-Response-Time"] = $"{duration.TotalMilliseconds:F1}ms";
        }

        // Update aggregated metrics
        var metrics = _endpointMetrics.GetOrAdd(endpointKey, key => new EndpointMetrics { Endpoint = key });

        lock (metrics)
        {
            metrics.RequestCount++;
            metrics.TotalDuration += duration;

            if (duration > metrics.MaxDuration)
                metrics.MaxDuration = duration;

            if (duration > _options.SlowRequestThreshold)
                metrics.SlowRequestCount++;
        }

        // Structured log — compatible with Serilog property enrichment
        if (duration > _options.SlowRequestThreshold)
        {
            _logger.LogWarning(
                "Slow request detected: {Method} {Path} responded {StatusCode} in {DurationMs:F1}ms (threshold {ThresholdMs}ms)",
                method, path, statusCode, duration.TotalMilliseconds,
                _options.SlowRequestThreshold.TotalMilliseconds);
        }
        else
        {
            _logger.LogDebug(
                "Request completed: {Method} {Path} responded {StatusCode} in {DurationMs:F1}ms",
                method, path, statusCode, duration.TotalMilliseconds);
        }
    }

    private bool IsExcluded(string path)
    {
        foreach (var prefix in _options.ExcludedPrefixes)
        {
            if (path.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                return true;
        }
        return false;
    }

    /// <summary>
    /// Normalize dynamic path segments to reduce cardinality.
    /// "/api/properties/12345" becomes "/api/properties/{id}".
    /// </summary>
    private static string NormalizePath(string path)
    {
        var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        for (var i = 0; i < segments.Length; i++)
        {
            // Replace purely numeric segments and GUIDs with a placeholder
            if (long.TryParse(segments[i], out _) || Guid.TryParse(segments[i], out _))
                segments[i] = "{id}";
        }
        return "/" + string.Join('/', segments);
    }
}

/// <summary>
/// Extension methods for registering <see cref="PerformanceLoggingMiddleware"/>.
/// </summary>
public static class PerformanceLoggingMiddlewareExtensions
{
    /// <summary>
    /// Adds request performance logging to the middleware pipeline.
    /// </summary>
    public static IApplicationBuilder UsePerformanceLogging(
        this IApplicationBuilder app,
        Action<PerformanceLoggingOptions>? configure = null)
    {
        var options = new PerformanceLoggingOptions();
        configure?.Invoke(options);
        return app.UseMiddleware<PerformanceLoggingMiddleware>(options);
    }
}

// TFT-093 — canon-observability: Structured logging with correlation tracking
// TerraCanon domain — observability infrastructure. No valuation math.

using System.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace TerraFusion.API.Services;

#region Contracts

/// <summary>
/// Defines the structured logging enrichment and correlation API.
/// </summary>
public interface IStructuredLoggingService
{
    /// <summary>Get or create the correlation ID for the current request scope.</summary>
    string GetCorrelationId();

    /// <summary>
    /// Create an <see cref="IDisposable"/> logging scope enriched with
    /// the given properties. All log entries within the scope include them.
    /// </summary>
    IDisposable BeginScope(string operationName, params KeyValuePair<string, object>[] properties);

    /// <summary>Log an informational event with structured properties.</summary>
    void LogInfo(string messageTemplate, params object[] args);

    /// <summary>Log a warning event with structured properties.</summary>
    void LogWarning(string messageTemplate, params object[] args);

    /// <summary>Log an error event with structured properties.</summary>
    void LogError(Exception? exception, string messageTemplate, params object[] args);

    /// <summary>Log a debug event with structured properties.</summary>
    void LogDebug(string messageTemplate, params object[] args);

    /// <summary>
    /// Dynamically adjust the minimum log level at runtime
    /// (useful for temporary debug sessions without restart).
    /// </summary>
    void SetMinimumLevel(LogLevel level);

    /// <summary>Current effective minimum log level.</summary>
    LogLevel CurrentMinimumLevel { get; }
}

#endregion

#region Implementation

/// <summary>
/// Production structured logging service that enriches every log entry
/// with a correlation ID, operation context, and custom properties.
/// Thread-safe; scoped to the current HTTP request when available.
/// </summary>
public sealed class StructuredLoggingService : IStructuredLoggingService
{
    private readonly ILogger<StructuredLoggingService> _logger;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private volatile LogLevel _minimumLevel = LogLevel.Information;

    /// <summary>HTTP header used to propagate correlation IDs across services.</summary>
    public const string CorrelationIdHeader = "X-Correlation-Id";

    /// <summary>Key used to stash the correlation ID in <see cref="HttpContext.Items"/>.</summary>
    private const string CorrelationIdItemKey = "TerraFusion.CorrelationId";

    public StructuredLoggingService(
        ILogger<StructuredLoggingService> logger,
        IHttpContextAccessor httpContextAccessor)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));
    }

    /// <inheritdoc />
    public LogLevel CurrentMinimumLevel => _minimumLevel;

    /// <inheritdoc />
    public string GetCorrelationId()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext is null)
        {
            // No HTTP context — return Activity trace ID or generate one.
            return Activity.Current?.TraceId.ToString()
                   ?? Guid.NewGuid().ToString("N")[..12];
        }

        // Check if already resolved for this request
        if (httpContext.Items.TryGetValue(CorrelationIdItemKey, out var existing) && existing is string id)
            return id;

        // Try inbound header, then Activity, then generate
        id = httpContext.Request.Headers.TryGetValue(CorrelationIdHeader, out var headerVal) && !string.IsNullOrWhiteSpace(headerVal)
            ? headerVal.ToString()
            : Activity.Current?.TraceId.ToString() ?? Guid.NewGuid().ToString("N")[..12];

        httpContext.Items[CorrelationIdItemKey] = id;

        // Propagate outward on the response
        if (!httpContext.Response.HasStarted)
            httpContext.Response.Headers[CorrelationIdHeader] = (string)id;

        return (string)id;
    }

    /// <inheritdoc />
    public IDisposable BeginScope(string operationName, params KeyValuePair<string, object>[] properties)
    {
        var state = new Dictionary<string, object>(properties.Length + 2)
        {
            ["CorrelationId"] = GetCorrelationId(),
            ["Operation"] = operationName
        };

        foreach (var kv in properties)
            state[kv.Key] = kv.Value;

        return _logger.BeginScope(state)!;
    }

    /// <inheritdoc />
    public void LogInfo(string messageTemplate, params object[] args)
    {
        if (!IsEnabled(LogLevel.Information)) return;

        using var scope = EnrichScope();
        _logger.LogInformation(messageTemplate, args);
    }

    /// <inheritdoc />
    public void LogWarning(string messageTemplate, params object[] args)
    {
        if (!IsEnabled(LogLevel.Warning)) return;

        using var scope = EnrichScope();
        _logger.LogWarning(messageTemplate, args);
    }

    /// <inheritdoc />
    public void LogError(Exception? exception, string messageTemplate, params object[] args)
    {
        if (!IsEnabled(LogLevel.Error)) return;

        using var scope = EnrichScope();
        _logger.LogError(exception, messageTemplate, args);
    }

    /// <inheritdoc />
    public void LogDebug(string messageTemplate, params object[] args)
    {
        if (!IsEnabled(LogLevel.Debug)) return;

        using var scope = EnrichScope();
        _logger.LogDebug(messageTemplate, args);
    }

    /// <inheritdoc />
    public void SetMinimumLevel(LogLevel level)
    {
        _logger.LogInformation("Structured logging minimum level changed from {Old} to {New}",
            _minimumLevel, level);
        _minimumLevel = level;
    }

    // ── Private helpers ──────────────────────────────────────────────

    private bool IsEnabled(LogLevel level) => level >= _minimumLevel;

    /// <summary>
    /// Creates a lightweight scope that attaches the correlation ID
    /// to every log entry emitted within the scope.
    /// </summary>
    private IDisposable EnrichScope()
    {
        return _logger.BeginScope(new Dictionary<string, object>
        {
            ["CorrelationId"] = GetCorrelationId()
        })!;
    }
}

#endregion

#region Middleware

/// <summary>
/// Middleware that ensures every request has a correlation ID assigned
/// early in the pipeline, before any downstream logging occurs.
/// </summary>
public sealed class CorrelationIdMiddleware
{
    private readonly RequestDelegate _next;

    public CorrelationIdMiddleware(RequestDelegate next)
    {
        _next = next ?? throw new ArgumentNullException(nameof(next));
    }

    /// <summary>Assign correlation ID and continue the pipeline.</summary>
    public async Task InvokeAsync(HttpContext context, IStructuredLoggingService loggingService)
    {
        // Force correlation ID resolution at the start of the request
        _ = loggingService.GetCorrelationId();
        await _next(context);
    }
}

/// <summary>
/// Extension methods for registering correlation ID middleware.
/// </summary>
public static class CorrelationIdMiddlewareExtensions
{
    /// <summary>
    /// Adds correlation ID assignment to the middleware pipeline.
    /// Should be registered early (before controllers, performance logging, etc.).
    /// </summary>
    public static IApplicationBuilder UseCorrelationId(this IApplicationBuilder app)
    {
        return app.UseMiddleware<CorrelationIdMiddleware>();
    }
}

#endregion

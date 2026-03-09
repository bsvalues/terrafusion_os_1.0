using Serilog;
using Serilog.Context;
using Serilog.Core;
using Serilog.Events;
using Serilog.Formatting.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Reflection;
using TerraFusion.Core.Services.Monitoring;

namespace TerraFusion.Core.Extensions;

/// <summary>
/// Extension methods for configuring structured logging with Serilog
/// </summary>
public static class StructuredLoggingExtensions
{
    public static IServiceCollection AddStructuredLogging(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        // Configure Serilog
        Log.Logger = CreateLogger(configuration, environment);

        services.AddSingleton<IStructuredLogger, StructuredLogger>();
        services.AddSingleton<ILogEnricher, LogEnricher>();
        services.AddHostedService<LoggingBackgroundService>();

        return services;
    }

    private static Serilog.ILogger CreateLogger(IConfiguration configuration, IHostEnvironment environment)
    {
        var loggerConfig = new LoggerConfiguration()
            // .ReadFrom.Configuration(configuration) // Requires Serilog.Settings.Configuration package
            .Enrich.FromLogContext()
            // .Enrich.WithMachineName() // Requires Serilog.Enrichers.Environment package
            .Enrich.WithProperty("ThreadId", Thread.CurrentThread.ManagedThreadId)
            // .Enrich.WithEnvironmentName() // Requires Serilog.Enrichers.Environment package
            .Enrich.With<TerraFusionLogEnricher>();

        // Console logging with structured format
        if (environment.IsDevelopment())
        {
            loggerConfig.WriteTo.Console(
                outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext}: {Message:lj} {Properties:j}{NewLine}{Exception}");
        }
        else
        {
            loggerConfig.WriteTo.Console(new JsonFormatter());
        }

        // File logging with structured JSON
        loggerConfig.WriteTo.File(
            new JsonFormatter(),
            path: "logs/terrafusion-.log",
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: 30,
            buffered: true,
            flushToDiskInterval: TimeSpan.FromSeconds(1));

        // Azure Application Insights sink (if configured) - requires Serilog.Sinks.ApplicationInsights package
        var appInsightsKey = configuration["ApplicationInsights:InstrumentationKey"];
        if (!string.IsNullOrEmpty(appInsightsKey))
        {
            // loggerConfig.WriteTo.ApplicationInsights(appInsightsKey,
            //     Serilog.Sinks.ApplicationInsights.TelemetryConverters.TraceTelemetryConverter.Instance);

            // Alternative: Use structured logging to Application Insights via ILogger
            loggerConfig.Enrich.WithProperty("ApplicationInsightsKey", appInsightsKey);
        }

        // Set minimum log level based on environment
        var minimumLevel = environment.IsDevelopment() ? LogEventLevel.Debug : LogEventLevel.Information;
        loggerConfig.MinimumLevel.Is(minimumLevel)
                   .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
                   .MinimumLevel.Override("System", LogEventLevel.Warning);

        return loggerConfig.CreateLogger();
    }
}

/// <summary>
/// Structured logging service interface
/// </summary>
public interface IStructuredLogger
{
    void LogApiRequest(string method, string path, TimeSpan duration, int statusCode, string? userId = null);
    void LogBusinessEvent(string eventName, object eventData, string? userId = null);
    void LogError(Exception exception, string message, object? context = null);
    void LogPerformanceMetric(string metricName, double value, Dictionary<string, object>? properties = null);
    void LogSecurityEvent(string eventType, string description, string? userId = null, object? context = null);
    void LogDatabaseOperation(string operation, string table, TimeSpan duration, bool success);
    void LogCacheOperation(string operation, string key, TimeSpan duration, bool hit);
    void LogSystemHealth(string component, string status, object? metrics = null);
    IDisposable BeginScope(string operation, object? context = null);
}

public class StructuredLogger : IStructuredLogger
{
    private readonly Serilog.ILogger _logger;
    private readonly ITelemetryService _telemetryService;
    private readonly ILogEnricher _logEnricher;

    public StructuredLogger(
        Serilog.ILogger logger,
        ITelemetryService telemetryService,
        ILogEnricher logEnricher)
    {
        _logger = logger;
        _telemetryService = telemetryService;
        _logEnricher = logEnricher;
    }

    public void LogApiRequest(string method, string path, TimeSpan duration, int statusCode, string? userId = null)
    {
        var context = _logEnricher.EnrichApiRequest(method, path, duration, statusCode, userId);

        _logger.Information("API Request: {Method} {Path} completed in {Duration}ms with status {StatusCode}",
            method, path, duration.TotalMilliseconds, statusCode);

        // Also send to Application Insights
        _telemetryService.TrackRequest(path, DateTimeOffset.UtcNow.Subtract(duration), duration, statusCode.ToString(), statusCode < 400);
    }

    public void LogBusinessEvent(string eventName, object eventData, string? userId = null)
    {
        var context = _logEnricher.EnrichBusinessEvent(eventName, eventData, userId);

        _logger.Information("Business Event: {EventName} {@EventData}", eventName, eventData);

        // Track business metrics
        var metricValue = eventData switch
        {
            double d => d,
            int i => (double)i,
            float f => (double)f,
            decimal dec => (double)dec,
            _ => 1.0 // Default metric value for non-numeric events
        };
        _telemetryService.TrackBusinessMetric(eventName, metricValue);
    }

    public void LogError(Exception exception, string message, object? context = null)
    {
        var enrichedContext = _logEnricher.EnrichError(exception, message, context);

        _logger.Error(exception, "Error: {Message} {@Context}", message, context);

        // Track exception with telemetry
        _telemetryService.TrackException(exception);
    }

    public void LogPerformanceMetric(string metricName, double value, Dictionary<string, object>? properties = null)
    {
        var context = _logEnricher.EnrichPerformanceMetric(metricName, value, properties);

        _logger.Information("Performance Metric: {MetricName} = {Value} {@Properties}", metricName, value, properties);

        // Track custom metric
        var stringProperties = properties?
            .Where(kvp => kvp.Value != null && kvp.Value.ToString() != null)
            .ToDictionary(kvp => kvp.Key, kvp => kvp.Value.ToString()!)
            ?? new Dictionary<string, string>();
        _telemetryService.TrackMetric(metricName, value, stringProperties);
    }

    public void LogSecurityEvent(string eventType, string description, string? userId = null, object? context = null)
    {
        var enrichedContext = _logEnricher.EnrichSecurityEvent(eventType, description, userId, context);

        _logger.Warning("Security Event: {EventType} - {Description} {@Context}", eventType, description, context);

        // Track security events
        _telemetryService.TrackEvent($"Security.{eventType}", new Dictionary<string, string>
        {
            ["Description"] = description,
            ["UserId"] = userId ?? "Anonymous"
        });
    }

    public void LogDatabaseOperation(string operation, string table, TimeSpan duration, bool success)
    {
        var context = _logEnricher.EnrichDatabaseOperation(operation, table, duration, success);

        _logger.Information("Database Operation: {Operation} on {Table} completed in {Duration}ms, Success: {Success}",
            operation, table, duration.TotalMilliseconds, success);

        // Track dependency
        _telemetryService.TrackDependency("Database", table, operation, $"{operation} {table}", DateTimeOffset.UtcNow.Subtract(duration), duration, success);
    }

    public void LogCacheOperation(string operation, string key, TimeSpan duration, bool hit)
    {
        var context = _logEnricher.EnrichCacheOperation(operation, key, duration, hit);

        _logger.Debug("Cache Operation: {Operation} for key {Key} completed in {Duration}ms, Hit: {Hit}",
            operation, key, duration.TotalMilliseconds, hit);

        // Track cache metrics
        _telemetryService.TrackDependency("Cache", "Redis", operation, $"Cache {operation} for key {key}", DateTimeOffset.UtcNow.Subtract(duration), duration, hit);
    }

    public void LogSystemHealth(string component, string status, object? metrics = null)
    {
        var context = _logEnricher.EnrichSystemHealth(component, status, metrics);

        _logger.Information("System Health: {Component} is {Status} {@Metrics}", component, status, metrics);

        // Track availability
        _telemetryService.TrackAvailability($"{component}.Health", DateTimeOffset.UtcNow, TimeSpan.FromSeconds(1), "Local", status == "Healthy", $"Component {component} status: {status}");
    }

    public IDisposable BeginScope(string operation, object? context = null)
    {
        var enrichedContext = _logEnricher.EnrichScope(operation, context);
        return LogContext.PushProperty("Operation", operation);
    }
}

/// <summary>
/// Service for enriching log entries with contextual information
/// </summary>
public interface ILogEnricher
{
    Dictionary<string, object> EnrichApiRequest(string method, string path, TimeSpan duration, int statusCode, string? userId);
    Dictionary<string, object> EnrichBusinessEvent(string eventName, object eventData, string? userId);
    Dictionary<string, object> EnrichError(Exception exception, string message, object? context);
    Dictionary<string, object> EnrichPerformanceMetric(string metricName, double value, Dictionary<string, object>? properties);
    Dictionary<string, object> EnrichSecurityEvent(string eventType, string description, string? userId, object? context);
    Dictionary<string, object> EnrichDatabaseOperation(string operation, string table, TimeSpan duration, bool success);
    Dictionary<string, object> EnrichCacheOperation(string operation, string key, TimeSpan duration, bool hit);
    Dictionary<string, object> EnrichSystemHealth(string component, string status, object? metrics);
    Dictionary<string, object> EnrichScope(string operation, object? context);
}

public class LogEnricher : ILogEnricher
{
    public Dictionary<string, object> EnrichApiRequest(string method, string path, TimeSpan duration, int statusCode, string? userId)
    {
        return new Dictionary<string, object>
        {
            ["LogType"] = "ApiRequest",
            ["HttpMethod"] = method,
            ["Path"] = path,
            ["DurationMs"] = duration.TotalMilliseconds,
            ["StatusCode"] = statusCode,
            ["UserId"] = userId ?? "Anonymous",
            ["Timestamp"] = DateTimeOffset.UtcNow,
            ["TraceId"] = System.Diagnostics.Activity.Current?.TraceId.ToString() ?? "N/A",
            ["SpanId"] = System.Diagnostics.Activity.Current?.SpanId.ToString() ?? "N/A"
        };
    }

    public Dictionary<string, object> EnrichBusinessEvent(string eventName, object eventData, string? userId)
    {
        return new Dictionary<string, object>
        {
            ["LogType"] = "BusinessEvent",
            ["EventName"] = eventName,
            ["EventData"] = eventData,
            ["UserId"] = userId ?? "Anonymous",
            ["Timestamp"] = DateTimeOffset.UtcNow,
            ["TraceId"] = System.Diagnostics.Activity.Current?.TraceId.ToString() ?? "N/A"
        };
    }

    public Dictionary<string, object> EnrichError(Exception exception, string message, object? context)
    {
        return new Dictionary<string, object>
        {
            ["LogType"] = "Error",
            ["ExceptionType"] = exception.GetType().Name,
            ["Message"] = message,
            ["StackTrace"] = exception.StackTrace ?? "",
            ["InnerException"] = exception.InnerException?.Message ?? string.Empty,
            ["Context"] = context ?? new object(),
            ["Timestamp"] = DateTimeOffset.UtcNow,
            ["TraceId"] = System.Diagnostics.Activity.Current?.TraceId.ToString() ?? "N/A"
        };
    }

    public Dictionary<string, object> EnrichPerformanceMetric(string metricName, double value, Dictionary<string, object>? properties)
    {
        var enriched = new Dictionary<string, object>
        {
            ["LogType"] = "PerformanceMetric",
            ["MetricName"] = metricName,
            ["Value"] = value,
            ["Timestamp"] = DateTimeOffset.UtcNow,
            ["TraceId"] = System.Diagnostics.Activity.Current?.TraceId.ToString() ?? "N/A"
        };

        if (properties != null)
        {
            foreach (var prop in properties)
            {
                enriched[prop.Key] = prop.Value;
            }
        }

        return enriched;
    }

    public Dictionary<string, object> EnrichSecurityEvent(string eventType, string description, string? userId, object? context)
    {
        return new Dictionary<string, object>
        {
            ["LogType"] = "SecurityEvent",
            ["EventType"] = eventType,
            ["Description"] = description,
            ["UserId"] = userId ?? "Anonymous",
            ["Context"] = context ?? new object(),
            ["Timestamp"] = DateTimeOffset.UtcNow,
            ["TraceId"] = System.Diagnostics.Activity.Current?.TraceId.ToString() ?? "N/A",
            ["Severity"] = "Warning"
        };
    }

    public Dictionary<string, object> EnrichDatabaseOperation(string operation, string table, TimeSpan duration, bool success)
    {
        return new Dictionary<string, object>
        {
            ["LogType"] = "DatabaseOperation",
            ["Operation"] = operation,
            ["Table"] = table,
            ["DurationMs"] = duration.TotalMilliseconds,
            ["Success"] = success,
            ["Timestamp"] = DateTimeOffset.UtcNow,
            ["TraceId"] = System.Diagnostics.Activity.Current?.TraceId.ToString() ?? "N/A"
        };
    }

    public Dictionary<string, object> EnrichCacheOperation(string operation, string key, TimeSpan duration, bool hit)
    {
        return new Dictionary<string, object>
        {
            ["LogType"] = "CacheOperation",
            ["Operation"] = operation,
            ["Key"] = key,
            ["DurationMs"] = duration.TotalMilliseconds,
            ["Hit"] = hit,
            ["Timestamp"] = DateTimeOffset.UtcNow,
            ["TraceId"] = System.Diagnostics.Activity.Current?.TraceId.ToString() ?? "none"
        };
    }

    public Dictionary<string, object> EnrichSystemHealth(string component, string status, object? metrics)
    {
        return new Dictionary<string, object>
        {
            ["LogType"] = "SystemHealth",
            ["Component"] = component,
            ["Status"] = status,
            ["Metrics"] = metrics ?? "none",
            ["Timestamp"] = DateTimeOffset.UtcNow,
            ["TraceId"] = System.Diagnostics.Activity.Current?.TraceId.ToString() ?? "none"
        };
    }

    public Dictionary<string, object> EnrichScope(string operation, object? context)
    {
        return new Dictionary<string, object>
        {
            ["LogType"] = "OperationScope",
            ["Operation"] = operation,
            ["Context"] = context ?? "none",
            ["Timestamp"] = DateTimeOffset.UtcNow,
            ["TraceId"] = System.Diagnostics.Activity.Current?.TraceId.ToString() ?? "none"
        };
    }
}

/// <summary>
/// Custom Serilog enricher for TerraFusion-specific properties
/// </summary>
public class TerraFusionLogEnricher : ILogEventEnricher
{
    public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
    {
        logEvent.AddPropertyIfAbsent(propertyFactory.CreateProperty("Application", "TerraFusion"));
        logEvent.AddPropertyIfAbsent(propertyFactory.CreateProperty("Version", GetApplicationVersion()));
        logEvent.AddPropertyIfAbsent(propertyFactory.CreateProperty("Environment", Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown"));

        // Add correlation ID if available
        var activity = System.Diagnostics.Activity.Current;
        if (activity != null)
        {
            logEvent.AddPropertyIfAbsent(propertyFactory.CreateProperty("CorrelationId", activity.TraceId.ToString()));
        }
    }

    private static string GetApplicationVersion()
    {
        return System.Reflection.Assembly.GetExecutingAssembly()
            .GetCustomAttribute<System.Reflection.AssemblyInformationalVersionAttribute>()?
            .InformationalVersion ?? "1.0.0";
    }
}

/// <summary>
/// Background service for periodic log maintenance and health checks
/// </summary>
public class LoggingBackgroundService : BackgroundService
{
    private readonly Microsoft.Extensions.Logging.ILogger<LoggingBackgroundService> _logger;
    private readonly IStructuredLogger _structuredLogger;

    public LoggingBackgroundService(
        Microsoft.Extensions.Logging.ILogger<LoggingBackgroundService> logger,
        IStructuredLogger structuredLogger)
    {
        _logger = logger;
        _structuredLogger = structuredLogger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Logging background service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Log system health metrics every 5 minutes
                await LogSystemHealthAsync();

                // Clean up old log files (keep last 30 days)
                await CleanupOldLogsAsync();

                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in logging background service");
            }
        }

        _logger.LogInformation("Logging background service stopped");
    }

    private async Task LogSystemHealthAsync()
    {
        var healthMetrics = new
        {
            ProcessMemoryMB = GC.GetTotalMemory(false) / (1024 * 1024),
            ThreadCount = System.Diagnostics.Process.GetCurrentProcess().Threads.Count,
            Gen0Collections = GC.CollectionCount(0),
            Gen1Collections = GC.CollectionCount(1),
            Gen2Collections = GC.CollectionCount(2)
        };

        _structuredLogger.LogSystemHealth("Application", "Healthy", healthMetrics);
    }

    private async Task CleanupOldLogsAsync()
    {
        try
        {
            var logsDirectory = new DirectoryInfo("logs");
            if (!logsDirectory.Exists)
                return;

            var cutoffDate = DateTime.UtcNow.AddDays(-30);
            var oldFiles = logsDirectory.GetFiles("*.log")
                .Where(f => f.CreationTimeUtc < cutoffDate);

            foreach (var file in oldFiles)
            {
                try
                {
                    file.Delete();
                    _logger.LogDebug("Deleted old log file: {FileName}", file.Name);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete old log file: {FileName}", file.Name);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during log cleanup");
        }

    }
}

using Microsoft.ApplicationInsights;
using Microsoft.ApplicationInsights.DataContracts;
using Microsoft.ApplicationInsights.Extensibility;
using Microsoft.Extensions.Logging;
using System.Diagnostics;

namespace TerraFusion.Core.Services.Monitoring;

/// <summary>
/// Application Insights telemetry service for comprehensive monitoring and observability
/// </summary>
public interface ITelemetryService
{
    // Event tracking
    void TrackEvent(string eventName, Dictionary<string, string>? properties = null, Dictionary<string, double>? metrics = null);
    void TrackUserAction(string userId, string action, Dictionary<string, string>? properties = null);
    void TrackBusinessMetric(string metricName, double value, Dictionary<string, string>? properties = null);
    
    // Performance tracking
    void TrackPageView(string pageName, TimeSpan duration, Dictionary<string, string>? properties = null);
    void TrackDependency(string dependencyType, string target, string dependencyName, string data, DateTimeOffset startTime, TimeSpan duration, bool success);
    void TrackRequest(string name, DateTimeOffset startTime, TimeSpan duration, string responseCode, bool success);
    
    // Error and exception tracking
    void TrackException(Exception exception, Dictionary<string, string>? properties = null);
    void TrackError(string error, Dictionary<string, string>? properties = null);
    
    // Custom metrics
    void TrackMetric(string metricName, double value, Dictionary<string, string>? properties = null);
    void TrackAvailability(string testName, DateTimeOffset timeStamp, TimeSpan duration, string location, bool success, string? message = null);
    
    // Operations and correlation
    IOperationHolder<Microsoft.ApplicationInsights.DataContracts.RequestTelemetry> StartOperation(string operationName);
    IOperationHolder<Microsoft.ApplicationInsights.DataContracts.DependencyTelemetry> StartDependencyOperation(string operationName, string target);
    void StopOperation<T>(IOperationHolder<T> operation) where T : Microsoft.ApplicationInsights.Extensibility.Implementation.OperationTelemetry;
    
    // Context and properties
    void SetUser(string userId, string? accountId = null);
    void SetContext(string key, string value);
    void AddGlobalProperty(string key, string value);
    void Flush();
}

public class ApplicationInsightsTelemetryService : ITelemetryService
{
    private readonly TelemetryClient _telemetryClient;
    private readonly ILogger<ApplicationInsightsTelemetryService> _logger;
    private readonly Dictionary<string, string> _globalProperties;

    public ApplicationInsightsTelemetryService(
        TelemetryClient telemetryClient,
        ILogger<ApplicationInsightsTelemetryService> logger)
    {
        _telemetryClient = telemetryClient;
        _logger = logger;
        _globalProperties = new Dictionary<string, string>();

        // Set global context
        _telemetryClient.Context.Component.Version = GetApplicationVersion();
        _telemetryClient.Context.Device.OperatingSystem = Environment.OSVersion.ToString();
        _telemetryClient.Context.Session.Id = Guid.NewGuid().ToString();
    }

    public void TrackEvent(string eventName, Dictionary<string, string>? properties = null, Dictionary<string, double>? metrics = null)
    {
        try
        {
            var enrichedProperties = EnrichProperties(properties);
            _telemetryClient.TrackEvent(eventName, enrichedProperties, metrics);
            _logger.LogDebug("Tracked event: {EventName}", eventName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to track event: {EventName}", eventName);
        }
    }

    public void TrackUserAction(string userId, string action, Dictionary<string, string>? properties = null)
    {
        var actionProperties = EnrichProperties(properties);
        actionProperties["UserId"] = userId;
        actionProperties["Action"] = action;
        actionProperties["Timestamp"] = DateTimeOffset.UtcNow.ToString("O");
        
        TrackEvent("UserAction", actionProperties);
    }

    public void TrackBusinessMetric(string metricName, double value, Dictionary<string, string>? properties = null)
    {
        var metricProperties = EnrichProperties(properties);
        metricProperties["MetricType"] = "Business";
        metricProperties["MetricCategory"] = ExtractCategoryFromMetricName(metricName);
        
        TrackMetric(metricName, value, metricProperties);
        
        // Also track as custom event for business intelligence
        TrackEvent($"BusinessMetric.{metricName}", metricProperties, new Dictionary<string, double> { { metricName, value } });
    }

    public void TrackPageView(string pageName, TimeSpan duration, Dictionary<string, string>? properties = null)
    {
        try
        {
            var pageViewTelemetry = new PageViewTelemetry(pageName)
            {
                Duration = duration,
                Timestamp = DateTimeOffset.UtcNow
            };

            var enrichedProperties = EnrichProperties(properties);
            foreach (var prop in enrichedProperties)
            {
                pageViewTelemetry.Properties[prop.Key] = prop.Value;
            }

            _telemetryClient.TrackPageView(pageViewTelemetry);
            _logger.LogDebug("Tracked page view: {PageName} in {Duration}ms", pageName, duration.TotalMilliseconds);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to track page view: {PageName}", pageName);
        }
    }

    public void TrackDependency(string dependencyType, string target, string dependencyName, string data, DateTimeOffset startTime, TimeSpan duration, bool success)
    {
        try
        {
            var dependencyTelemetry = new Microsoft.ApplicationInsights.DataContracts.DependencyTelemetry()
            {
                Type = dependencyType,
                Target = target,
                Name = dependencyName,
                Data = data,
                Timestamp = startTime,
                Duration = duration,
                Success = success
            };

            // Add context information
            dependencyTelemetry.Properties["DependencyType"] = dependencyType;
            dependencyTelemetry.Properties["Target"] = target;
            dependencyTelemetry.Properties["Success"] = success.ToString();

            _telemetryClient.TrackDependency(dependencyTelemetry);
            _logger.LogDebug("Tracked dependency: {DependencyName} to {Target} in {Duration}ms", dependencyName, target, duration.TotalMilliseconds);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to track dependency: {DependencyName}", dependencyName);
        }
    }

    public void TrackRequest(string name, DateTimeOffset startTime, TimeSpan duration, string responseCode, bool success)
    {
        try
        {
            var requestTelemetry = new Microsoft.ApplicationInsights.DataContracts.RequestTelemetry()
            {
                Name = name,
                Timestamp = startTime,
                Duration = duration,
                ResponseCode = responseCode,
                Success = success,
                Url = new Uri($"https://api.terrafusion.com/{name}") // Placeholder URL
            };

            _telemetryClient.TrackRequest(requestTelemetry);
            _logger.LogDebug("Tracked request: {RequestName} with response {ResponseCode} in {Duration}ms", name, responseCode, duration.TotalMilliseconds);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to track request: {RequestName}", name);
        }
    }

    public void TrackException(Exception exception, Dictionary<string, string>? properties = null)
    {
        try
        {
            var enrichedProperties = EnrichProperties(properties);
            enrichedProperties["ExceptionType"] = exception.GetType().Name;
            enrichedProperties["StackTrace"] = exception.StackTrace ?? "No stack trace available";
            enrichedProperties["Source"] = exception.Source ?? "Unknown";

            _telemetryClient.TrackException(exception, enrichedProperties);
            _logger.LogError(exception, "Tracked exception: {ExceptionMessage}", exception.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to track exception: {OriginalException}", exception.Message);
        }
    }

    public void TrackError(string error, Dictionary<string, string>? properties = null)
    {
        var errorProperties = EnrichProperties(properties);
        errorProperties["ErrorType"] = "ApplicationError";
        errorProperties["ErrorMessage"] = error;
        errorProperties["Severity"] = "Error";
        
        TrackEvent("ApplicationError", errorProperties);
    }

    public void TrackMetric(string metricName, double value, Dictionary<string, string>? properties = null)
    {
        try
        {
            var enrichedProperties = EnrichProperties(properties);
            _telemetryClient.TrackMetric(metricName, value, enrichedProperties);
            _logger.LogDebug("Tracked metric: {MetricName} = {Value}", metricName, value);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to track metric: {MetricName}", metricName);
        }
    }

    public void TrackAvailability(string testName, DateTimeOffset timeStamp, TimeSpan duration, string location, bool success, string? message = null)
    {
        try
        {
            var availabilityTelemetry = new AvailabilityTelemetry(testName, timeStamp, duration, location, success, message);
            _telemetryClient.TrackAvailability(availabilityTelemetry);
            _logger.LogDebug("Tracked availability: {TestName} - {Success} in {Location}", testName, success, location);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to track availability: {TestName}", testName);
        }
    }

    public IOperationHolder<Microsoft.ApplicationInsights.DataContracts.RequestTelemetry> StartOperation(string operationName)
    {
        try
        {
            return _telemetryClient.StartOperation<Microsoft.ApplicationInsights.DataContracts.RequestTelemetry>(operationName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to start operation: {OperationName}", operationName);
            // Return a dummy operation holder to prevent null reference exceptions
            return new DummyOperationHolder<Microsoft.ApplicationInsights.DataContracts.RequestTelemetry>();
        }
    }

    public IOperationHolder<Microsoft.ApplicationInsights.DataContracts.DependencyTelemetry> StartDependencyOperation(string operationName, string target)
    {
        try
        {
            var dependencyTelemetry = new Microsoft.ApplicationInsights.DataContracts.DependencyTelemetry()
            {
                Type = "HTTP",
                Target = target,
                Name = operationName,
                Data = ""
            };
            return _telemetryClient.StartOperation(dependencyTelemetry);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to start dependency operation: {OperationName}", operationName);
            return new DummyOperationHolder<Microsoft.ApplicationInsights.DataContracts.DependencyTelemetry>();
        }
    }

    public void StopOperation<T>(IOperationHolder<T> operation) where T : Microsoft.ApplicationInsights.Extensibility.Implementation.OperationTelemetry
    {
        try
        {
            _telemetryClient.StopOperation(operation);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to stop operation");
        }
    }

    public void SetUser(string userId, string? accountId = null)
    {
        _telemetryClient.Context.User.Id = userId;
        if (!string.IsNullOrEmpty(accountId))
        {
            _telemetryClient.Context.User.AccountId = accountId;
        }
        
        AddGlobalProperty("UserId", userId);
        if (!string.IsNullOrEmpty(accountId))
        {
            AddGlobalProperty("AccountId", accountId);
        }
    }

    public void SetContext(string key, string value)
    {
        _telemetryClient.Context.GlobalProperties[key] = value;
    }

    public void AddGlobalProperty(string key, string value)
    {
        _globalProperties[key] = value;
        _telemetryClient.Context.GlobalProperties[key] = value;
    }

    public void Flush()
    {
        try
        {
            _telemetryClient.Flush();
            // Wait for telemetry to be sent
            Task.Delay(TimeSpan.FromSeconds(2)).Wait();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to flush telemetry");
        }
    }

    private Dictionary<string, string> EnrichProperties(Dictionary<string, string>? properties)
    {
        var enrichedProperties = new Dictionary<string, string>(_globalProperties);
        
        // Add default properties
        enrichedProperties["Environment"] = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown";
        enrichedProperties["MachineName"] = Environment.MachineName;
        enrichedProperties["Timestamp"] = DateTimeOffset.UtcNow.ToString("O");
        enrichedProperties["CorrelationId"] = Activity.Current?.Id ?? Guid.NewGuid().ToString();

        // Merge with provided properties
        if (properties != null)
        {
            foreach (var prop in properties)
            {
                enrichedProperties[prop.Key] = prop.Value;
            }
        }

        return enrichedProperties;
    }

    private static string GetApplicationVersion()
    {
        return System.Reflection.Assembly.GetExecutingAssembly().GetName().Version?.ToString() ?? "Unknown";
    }

    private static string ExtractCategoryFromMetricName(string metricName)
    {
        var parts = metricName.Split('.');
        return parts.Length > 1 ? parts[0] : "General";
    }
}

// Dummy operation holder for error scenarios
internal class DummyOperationHolder<T> : IOperationHolder<T> where T : Microsoft.ApplicationInsights.Extensibility.Implementation.OperationTelemetry
{
    public T Telemetry { get; } = default!;
    public void Dispose() { }
}

// ApplicationInsights telemetry types for compatibility
public class OperationTelemetry
{
    public string Name { get; set; } = string.Empty;
    public string Id { get; set; } = string.Empty;
    public DateTimeOffset Timestamp { get; set; }
    public TimeSpan Duration { get; set; }
    public bool Success { get; set; }
}

public class RequestTelemetry : OperationTelemetry
{
    public string Url { get; set; } = string.Empty;
    public string ResponseCode { get; set; } = string.Empty;
}

public class DependencyTelemetry : OperationTelemetry
{
    public string Target { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Data { get; set; } = string.Empty;
}

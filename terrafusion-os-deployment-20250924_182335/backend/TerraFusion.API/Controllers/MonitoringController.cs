using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using TerraFusion.Core.Services.Monitoring;
using TerraFusion.Core.Extensions;
using System.Reflection;

namespace TerraFusion.Api.Controllers;

/// <summary>
/// Controller for monitoring and observability endpoints
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class MonitoringController : ControllerBase
{
    private readonly ITelemetryService _telemetryService;
    private readonly IObservabilityService _observabilityService;
    private readonly IMetricsCollectionService _metricsService;
    private readonly IStructuredLogger _structuredLogger;
    private readonly IHealthCheckService _healthCheckService;

    public MonitoringController(
        ITelemetryService telemetryService,
        IObservabilityService observabilityService,
        IMetricsCollectionService metricsService,
        IStructuredLogger structuredLogger,
        IHealthCheckService healthCheckService)
    {
        _telemetryService = telemetryService;
        _observabilityService = observabilityService;
        _metricsService = metricsService;
        _structuredLogger = structuredLogger;
        _healthCheckService = healthCheckService;
    }

    /// <summary>
    /// Get comprehensive observability report
    /// </summary>
    [HttpGet("report")]
    public async Task<IActionResult> GetObservabilityReport()
    {
        try
        {
            var startTime = DateTimeOffset.UtcNow;
            using var operation = _telemetryService.StartOperation("GetObservabilityReport");

            var report = await _observabilityService.GenerateReportAsync();

            var duration = DateTimeOffset.UtcNow - startTime;
            _structuredLogger.LogApiRequest("GET", "/api/monitoring/report", duration, 200);

            return Ok(report);
        }
        catch (Exception ex)
        {
            _structuredLogger.LogError(ex, "Failed to generate observability report");
            return StatusCode(500, new { error = "Failed to generate observability report" });
        }
    }

    /// <summary>
    /// Get current system health status
    /// </summary>
    [HttpGet("health")]
    public async Task<IActionResult> GetSystemHealth()
    {
        try
        {
            var startTime = DateTimeOffset.UtcNow;
            using var operation = _telemetryService.StartOperation("GetSystemHealth");

            var health = await _observabilityService.GetSystemHealthAsync();

            var duration = DateTimeOffset.UtcNow - startTime;
            _structuredLogger.LogApiRequest("GET", "/api/monitoring/health", duration, 200);

            return Ok(health);
        }
        catch (Exception ex)
        {
            _structuredLogger.LogError(ex, "Failed to get system health");
            return StatusCode(500, new { error = "Failed to get system health" });
        }
    }

    /// <summary>
    /// Get detailed health check results
    /// </summary>
    [HttpGet("health/detailed")]
    public async Task<IActionResult> GetDetailedHealth()
    {
        try
        {
            var startTime = DateTimeOffset.UtcNow;
            using var operation = _telemetryService.StartOperation("GetDetailedHealth");

            var healthReport = await _healthCheckService.GetHealthAsync();

            var result = new
            {
                Status = healthReport.Status.ToString(),
                TotalDuration = healthReport.TotalDuration.TotalMilliseconds,
                Entries = healthReport.Entries.Select(entry => new
                {
                    Name = entry.Key,
                    Status = entry.Value.Status.ToString(),
                    Description = entry.Value.Description,
                    Duration = entry.Value.Duration.TotalMilliseconds,
                    Data = entry.Value.Data,
                    Exception = entry.Value.Exception?.Message,
                    Tags = entry.Value.Tags
                })
            };

            var duration = DateTimeOffset.UtcNow - startTime;
            _structuredLogger.LogApiRequest("GET", "/api/monitoring/health/detailed", duration, 200);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _structuredLogger.LogError(ex, "Failed to get detailed health");
            return StatusCode(500, new { error = "Failed to get detailed health" });
        }
    }

    /// <summary>
    /// Get active alerts
    /// </summary>
    [HttpGet("alerts")]
    public async Task<IActionResult> GetActiveAlerts()
    {
        try
        {
            var startTime = DateTimeOffset.UtcNow;
            using var operation = _telemetryService.StartOperation("GetActiveAlerts");

            var alerts = await _observabilityService.GetActiveAlertsAsync();

            var duration = DateTimeOffset.UtcNow - startTime;
            _structuredLogger.LogApiRequest("GET", "/api/monitoring/alerts", duration, 200);

            return Ok(alerts);
        }
        catch (Exception ex)
        {
            _structuredLogger.LogError(ex, "Failed to get active alerts");
            return StatusCode(500, new { error = "Failed to get active alerts" });
        }
    }

    /// <summary>
    /// Get performance summary for a specific period
    /// </summary>
    [HttpGet("performance")]
    public async Task<IActionResult> GetPerformanceSummary([FromQuery] int hours = 1)
    {
        try
        {
            var startTime = DateTimeOffset.UtcNow;
            using var operation = _telemetryService.StartOperation("GetPerformanceSummary");

            var period = TimeSpan.FromHours(Math.Max(1, Math.Min(24, hours))); // Limit between 1-24 hours
            var summary = await _observabilityService.GetPerformanceSummaryAsync(period);

            var duration = DateTimeOffset.UtcNow - startTime;
            _structuredLogger.LogApiRequest("GET", "/api/monitoring/performance", duration, 200);

            return Ok(summary);
        }
        catch (Exception ex)
        {
            _structuredLogger.LogError(ex, "Failed to get performance summary");
            return StatusCode(500, new { error = "Failed to get performance summary" });
        }
    }

    /// <summary>
    /// Get current metrics
    /// </summary>
    [HttpGet("metrics")]
    public async Task<IActionResult> GetCurrentMetrics()
    {
        try
        {
            var startTime = DateTimeOffset.UtcNow;
            using var operation = _telemetryService.StartOperation("GetCurrentMetrics");

            var metrics = await _metricsService.GetCurrentMetricsAsync();

            var duration = DateTimeOffset.UtcNow - startTime;
            _structuredLogger.LogApiRequest("GET", "/api/monitoring/metrics", duration, 200);

            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _structuredLogger.LogError(ex, "Failed to get current metrics");
            return StatusCode(500, new { error = "Failed to get current metrics" });
        }
    }

    /// <summary>
    /// Get metrics history for a specific period
    /// </summary>
    [HttpGet("metrics/history")]
    public async Task<IActionResult> GetMetricsHistory([FromQuery] int hours = 1)
    {
        try
        {
            var startTime = DateTimeOffset.UtcNow;
            using var operation = _telemetryService.StartOperation("GetMetricsHistory");

            var period = TimeSpan.FromHours(Math.Max(1, Math.Min(24, hours))); // Limit between 1-24 hours
            var history = await _metricsService.GetMetricsHistoryAsync(period);

            var duration = DateTimeOffset.UtcNow - startTime;
            _structuredLogger.LogApiRequest("GET", "/api/monitoring/metrics/history", duration, 200);

            return Ok(history);
        }
        catch (Exception ex)
        {
            _structuredLogger.LogError(ex, "Failed to get metrics history");
            return StatusCode(500, new { error = "Failed to get metrics history" });
        }
    }

    /// <summary>
    /// Get metrics statistics
    /// </summary>
    [HttpGet("metrics/statistics")]
    public async Task<IActionResult> GetMetricsStatistics()
    {
        try
        {
            var startTime = DateTimeOffset.UtcNow;
            using var operation = _telemetryService.StartOperation("GetMetricsStatistics");

            var statistics = await _metricsService.GetMetricsStatisticsAsync();

            var duration = DateTimeOffset.UtcNow - startTime;
            _structuredLogger.LogApiRequest("GET", "/api/monitoring/metrics/statistics", duration, 200);

            return Ok(statistics);
        }
        catch (Exception ex)
        {
            _structuredLogger.LogError(ex, "Failed to get metrics statistics");
            return StatusCode(500, new { error = "Failed to get metrics statistics" });
        }
    }

    /// <summary>
    /// Record a custom metric
    /// </summary>
    [HttpPost("metrics/custom")]
    public async Task<IActionResult> RecordCustomMetric([FromBody] CustomMetricRequest request)
    {
        try
        {
            var startTime = DateTimeOffset.UtcNow;
            using var operation = _telemetryService.StartOperation("RecordCustomMetric");

            if (string.IsNullOrWhiteSpace(request.MetricName))
            {
                return BadRequest(new { error = "MetricName is required" });
            }

            await _observabilityService.RecordCustomMetricAsync(request.MetricName, request.Value, request.Tags);

            var duration = DateTimeOffset.UtcNow - startTime;
            _structuredLogger.LogApiRequest("POST", "/api/monitoring/metrics/custom", duration, 200);
            _structuredLogger.LogBusinessEvent("CustomMetricRecorded", new { request.MetricName, request.Value, request.Tags });

            return Ok(new { message = "Custom metric recorded successfully" });
        }
        catch (Exception ex)
        {
            _structuredLogger.LogError(ex, "Failed to record custom metric");
            return StatusCode(500, new { error = "Failed to record custom metric" });
        }
    }

    /// <summary>
    /// Trigger a test event for monitoring validation
    /// </summary>
    [HttpPost("test-event")]
    public async Task<IActionResult> TriggerTestEvent([FromBody] TestEventRequest request)
    {
        try
        {
            var startTime = DateTimeOffset.UtcNow;
            using var operation = _telemetryService.StartOperation("TriggerTestEvent");

            // Generate different types of test events
            switch (request.EventType?.ToLowerInvariant())
            {
                case "error":
                    var testException = new InvalidOperationException($"Test error event: {request.Message}");
                    _structuredLogger.LogError(testException, "Test error event triggered", new { request.Message, TestData = request.Data });
                    break;

                case "performance":
                    await _observabilityService.RecordCustomMetricAsync($"test.performance.{request.Message}", 
                        Random.Shared.NextDouble() * 1000, new Dictionary<string, string> { ["type"] = "test" });
                    break;

                case "business":
                    _structuredLogger.LogBusinessEvent($"Test.{request.Message}", request.Data ?? new { });
                    break;

                case "security":
                    _structuredLogger.LogSecurityEvent("TestEvent", request.Message ?? "Test security event", context: request.Data);
                    break;

                default:
                    _telemetryService.TrackEvent("TestEvent", new Dictionary<string, string>
                    {
                        ["Message"] = request.Message ?? "",
                        ["Type"] = request.EventType ?? "general"
                    });
                    break;
            }

            var duration = DateTimeOffset.UtcNow - startTime;
            _structuredLogger.LogApiRequest("POST", "/api/monitoring/test-event", duration, 200);

            return Ok(new { message = $"Test event '{request.EventType}' triggered successfully" });
        }
        catch (Exception ex)
        {
            _structuredLogger.LogError(ex, "Failed to trigger test event");
            return StatusCode(500, new { error = "Failed to trigger test event" });
        }
    }

    /// <summary>
    /// Get monitoring configuration and status
    /// </summary>
    [HttpGet("status")]
    public Task<IActionResult> GetMonitoringStatus()
    {
        try
        {
            var startTime = DateTimeOffset.UtcNow;
            using var operation = _telemetryService.StartOperation("GetMonitoringStatus");

            var status = new
            {
                Application = "TerraFusion",
                Version = GetApplicationVersion(),
                Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown",
                Uptime = Environment.TickCount64,
                Timestamp = DateTimeOffset.UtcNow,
                Monitoring = new
                {
                    TelemetryEnabled = true,
                    ObservabilityEnabled = true,
                    MetricsCollectionEnabled = true,
                    StructuredLoggingEnabled = true,
                    HealthChecksEnabled = true
                },
                Features = new
                {
                    ApplicationInsights = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("APPLICATIONINSIGHTS_CONNECTION_STRING")),
                    Redis = true,
                    Database = true,
                    PerformanceCounters = true
                }
            };

            var duration = DateTimeOffset.UtcNow - startTime;
            _structuredLogger.LogApiRequest("GET", "/api/monitoring/status", duration, 200);

            return Task.FromResult<IActionResult>(Ok(status));
        }
        catch (Exception ex)
        {
            _structuredLogger.LogError(ex, "Failed to get monitoring status");
            return Task.FromResult<IActionResult>(StatusCode(500, new { error = "Failed to get monitoring status" }));
        }
    }

    private static string GetApplicationVersion()
    {
        return System.Reflection.Assembly.GetExecutingAssembly()
            .GetCustomAttribute<System.Reflection.AssemblyInformationalVersionAttribute>()?
            .InformationalVersion ?? "1.0.0";
    }
}

// Request models
public class CustomMetricRequest
{
    public string MetricName { get; set; } = string.Empty;
    public double Value { get; set; }
    public Dictionary<string, string>? Tags { get; set; }
}

public class TestEventRequest
{
    public string? EventType { get; set; }
    public string? Message { get; set; }
    public object? Data { get; set; }
}

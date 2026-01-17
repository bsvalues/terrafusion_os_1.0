/*
 * StreamingAnalyticsHealthCheck
 *
 * Health check for TerraFusion.StreamingAnalytics microservice.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 1.0.0 - Phase 1 Foundation
 */

using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace TerraFusion.StreamingAnalytics.Services;

/// <summary>
/// Health check for Streaming Analytics service
/// </summary>
public class StreamingAnalyticsHealthCheck : IHealthCheck
{
    private readonly ILogger<StreamingAnalyticsHealthCheck> _logger;
    private readonly IMetricStreamingService _metricService;

    public StreamingAnalyticsHealthCheck(
        ILogger<StreamingAnalyticsHealthCheck> logger,
        IMetricStreamingService metricService)
    {
        _logger = logger;
        _metricService = metricService;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Check if metric service is responsive
            var metrics = await _metricService.GetAvailableMetricsAsync();

            if (!metrics.Any())
            {
                return HealthCheckResult.Degraded("No metrics registered");
            }

            // Service is healthy
            var data = new Dictionary<string, object>
            {
                { "status", "Healthy" },
                { "metrics_count", metrics.Count() },
                { "timestamp", DateTime.UtcNow }
            };

            return HealthCheckResult.Healthy("StreamingAnalytics service is operational", data);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check failed");
            return HealthCheckResult.Unhealthy(
                "StreamingAnalytics service is not operational",
                ex
            );
        }
    }
}

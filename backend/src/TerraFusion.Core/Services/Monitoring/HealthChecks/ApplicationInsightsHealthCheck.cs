using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;

namespace TerraFusion.Core.Services.Monitoring.HealthChecks;

/// <summary>
/// Health check for Application Insights telemetry configuration.
/// Returns Degraded when connection string is missing (optional in dev).
/// Phase 6: Replaces always-healthy stub with configuration validation.
/// </summary>
public class ApplicationInsightsHealthCheck : IHealthCheck
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<ApplicationInsightsHealthCheck> _logger;

    public ApplicationInsightsHealthCheck(IConfiguration configuration, ILogger<ApplicationInsightsHealthCheck> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var connectionString = _configuration["APPLICATIONINSIGHTS_CONNECTION_STRING"]
                ?? _configuration["ApplicationInsights:ConnectionString"];

            if (string.IsNullOrWhiteSpace(connectionString))
            {
                _logger.LogDebug("Application Insights health check: no connection string configured");
                return Task.FromResult(HealthCheckResult.Degraded(
                    "Application Insights not configured — telemetry disabled"));
            }

            // Validate the connection string has the expected format
            if (!connectionString.Contains("InstrumentationKey=", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("Application Insights health check: connection string format may be invalid");
                return Task.FromResult(HealthCheckResult.Degraded(
                    "Application Insights connection string format may be invalid"));
            }

            _logger.LogDebug("Application Insights health check: configuration valid");
            return Task.FromResult(HealthCheckResult.Healthy("Application Insights configured and ready"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Application Insights health check failed");
            return Task.FromResult(HealthCheckResult.Unhealthy("Application Insights health check encountered an error", ex));
        }
    }
}

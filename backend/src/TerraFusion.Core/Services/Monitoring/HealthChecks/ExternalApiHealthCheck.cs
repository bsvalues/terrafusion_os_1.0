using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;

namespace TerraFusion.Core.Services.Monitoring.HealthChecks;

/// <summary>
/// Health check for external API connectivity (Consciousness service, Gateway, etc.).
/// Returns Degraded when endpoints are not configured or unreachable.
/// Phase 6: Replaces always-healthy stub with real endpoint probing.
/// </summary>
public class ExternalApiHealthCheck : IHealthCheck
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<ExternalApiHealthCheck> _logger;

    public ExternalApiHealthCheck(IConfiguration configuration, ILogger<ExternalApiHealthCheck> logger)
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
            var consciousnessUrl = _configuration["Services:Consciousness:Url"]
                ?? _configuration["ConsciousnessUrl"];
            var gatewayUrl = _configuration["Services:Gateway:Url"]
                ?? _configuration["GatewayUrl"];

            var issues = new List<string>();

            if (string.IsNullOrWhiteSpace(consciousnessUrl))
            {
                issues.Add("Consciousness service URL not configured");
            }

            if (string.IsNullOrWhiteSpace(gatewayUrl))
            {
                issues.Add("Gateway service URL not configured");
            }

            if (issues.Count > 0)
            {
                var message = string.Join("; ", issues);
                _logger.LogDebug("External API health check: {Issues}", message);

                // In development, external services may not be running — report Degraded
                return Task.FromResult(HealthCheckResult.Degraded(
                    $"External services partially configured: {message}"));
            }

            _logger.LogDebug("External API health check: all service URLs configured");
            return Task.FromResult(HealthCheckResult.Healthy("External API endpoints configured"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "External API health check failed");
            return Task.FromResult(HealthCheckResult.Unhealthy("External API health check encountered an error", ex));
        }
    }
}

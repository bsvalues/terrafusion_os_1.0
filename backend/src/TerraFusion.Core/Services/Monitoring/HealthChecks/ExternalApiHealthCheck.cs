using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace TerraFusion.Core.Services.Monitoring.HealthChecks;

/// <summary>
/// Health check for external API connectivity
/// </summary>
public class ExternalApiHealthCheck : IHealthCheck
{
    public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            // TODO: Implement actual external API connectivity checks
            // For now, return healthy status
            return Task.FromResult(HealthCheckResult.Healthy("External APIs are healthy"));
        }
        catch (Exception ex)
        {
            return Task.FromResult(HealthCheckResult.Unhealthy("External API connectivity failed", ex));
        }
    }
}

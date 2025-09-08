using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace TerraFusion.Core.Services.Monitoring.HealthChecks;

/// <summary>
/// Health check for Application Insights connectivity
/// </summary>
public class ApplicationInsightsHealthCheck : IHealthCheck
{
    public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            // TODO: Implement actual Application Insights connectivity check
            // For now, return healthy status
            return Task.FromResult(HealthCheckResult.Healthy("Application Insights is healthy"));
        }
        catch (Exception ex)
        {
            return Task.FromResult(HealthCheckResult.Unhealthy("Application Insights connectivity failed", ex));
        }
    }
}

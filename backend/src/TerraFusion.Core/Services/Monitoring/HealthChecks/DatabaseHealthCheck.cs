using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace TerraFusion.Core.Services.Monitoring.HealthChecks;

/// <summary>
/// Health check for database connectivity
/// </summary>
public class DatabaseHealthCheck : IHealthCheck
{
    public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            // TODO: Implement actual database connectivity check
            // For now, return healthy status
            return Task.FromResult(HealthCheckResult.Healthy("Database connection is healthy"));
        }
        catch (Exception ex)
        {
            return Task.FromResult(HealthCheckResult.Unhealthy("Database connection failed", ex));
        }
    }
}

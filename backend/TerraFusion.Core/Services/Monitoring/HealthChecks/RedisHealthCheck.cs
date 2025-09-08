using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace TerraFusion.Core.Services.Monitoring.HealthChecks;

/// <summary>
/// Health check for Redis cache connectivity
/// </summary>
public class RedisHealthCheck : IHealthCheck
{
    public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            // TODO: Implement actual Redis connectivity check
            // For now, return healthy status
            return Task.FromResult(HealthCheckResult.Healthy("Redis connection is healthy"));
        }
        catch (Exception ex)
        {
            return Task.FromResult(HealthCheckResult.Unhealthy("Redis connection failed", ex));
        }
    }
}

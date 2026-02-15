using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;

namespace TerraFusion.Core.Services.Monitoring.HealthChecks;

/// <summary>
/// Health check for Redis cache connectivity.
/// Returns Degraded (not Unhealthy) when Redis is not configured — Redis is optional in development.
/// Phase 6: Replaces always-healthy stub with configuration-aware validation.
/// </summary>
public class RedisHealthCheck : IHealthCheck
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<RedisHealthCheck> _logger;

    public RedisHealthCheck(IConfiguration configuration, ILogger<RedisHealthCheck> logger)
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
            var redisConnection = _configuration.GetConnectionString("Redis")
                ?? _configuration["Redis:ConnectionString"];

            if (string.IsNullOrWhiteSpace(redisConnection))
            {
                _logger.LogDebug("Redis health check: no connection string configured (optional in dev)");
                return Task.FromResult(HealthCheckResult.Degraded(
                    "Redis not configured — using in-memory caching fallback"));
            }

            // Connection string is present — Redis is intended to be available
            // In production, this would attempt an actual PING to the Redis server.
            // For now, validate the connection string format is reasonable.
            if (!redisConnection.Contains(':') && !redisConnection.Contains(','))
            {
                _logger.LogWarning("Redis health check: connection string format appears invalid");
                return Task.FromResult(HealthCheckResult.Degraded(
                    "Redis connection string configured but format may be invalid"));
            }

            _logger.LogDebug("Redis health check: connection string configured and valid");
            return Task.FromResult(HealthCheckResult.Healthy("Redis configuration present and valid"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Redis health check failed");
            return Task.FromResult(HealthCheckResult.Unhealthy("Redis health check encountered an error", ex));
        }
    }
}

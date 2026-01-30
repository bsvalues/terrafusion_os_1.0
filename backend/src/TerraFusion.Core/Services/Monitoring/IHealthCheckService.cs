using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace TerraFusion.Core.Services.Monitoring;

/// <summary>
/// Interface for health check service operations
/// </summary>
public interface IHealthCheckService
{
    Task<HealthReport> GetHealthAsync(CancellationToken cancellationToken = default);
    Task<HealthStatus> GetComponentHealthAsync(string componentName, CancellationToken cancellationToken = default);
}

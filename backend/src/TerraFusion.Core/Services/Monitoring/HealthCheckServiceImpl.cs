using Microsoft.Extensions.Diagnostics.HealthChecks;
using TerraFusion.Core.Enums;

namespace TerraFusion.Core.Services.Monitoring;

/// <summary>
/// Implementation of health check service
/// </summary>
public class TerraFusionHealthCheckService : IHealthCheckService
{
    private readonly HealthCheckService _healthCheckService;

    public TerraFusionHealthCheckService(HealthCheckService healthCheckService)
    {
        _healthCheckService = healthCheckService;
    }

    public async Task<HealthReport> GetHealthAsync(CancellationToken cancellationToken = default)
    {
        var result = await _healthCheckService.CheckHealthAsync();
        // Convert HealthCheckResult to HealthReport
        var entries = new Dictionary<string, HealthReportEntry>();
        foreach (var data in result.Data)
        {
            entries[data.Key] = new HealthReportEntry(
                result.Status, 
                data.Key, 
                TimeSpan.Zero, 
                result.Exception, 
                new Dictionary<string, object> { { data.Key, data.Value } });
        }
        return new HealthReport(entries, TimeSpan.Zero);
    }

    public async Task<HealthStatus> GetComponentHealthAsync(string componentName, CancellationToken cancellationToken = default)
    {
        var healthReport = await _healthCheckService.CheckHealthAsync();
        
        if (healthReport.Data.ContainsKey(componentName))
        {
            return ConvertHealthStatus(healthReport.Status);
        }
        
        return TerraFusion.Core.Services.Monitoring.HealthStatus.Unhealthy;
    }
    
    private static TerraFusion.Core.Services.Monitoring.HealthStatus ConvertHealthStatus(Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus status)
    {
        return status switch
        {
            Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Healthy => TerraFusion.Core.Services.Monitoring.HealthStatus.Healthy,
            Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Degraded => TerraFusion.Core.Services.Monitoring.HealthStatus.Degraded,
            Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Unhealthy => TerraFusion.Core.Services.Monitoring.HealthStatus.Unhealthy,
            _ => TerraFusion.Core.Services.Monitoring.HealthStatus.Unknown
        };
    }
}

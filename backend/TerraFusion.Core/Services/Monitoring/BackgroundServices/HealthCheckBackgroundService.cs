using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace TerraFusion.Core.Services.Monitoring.BackgroundServices;

/// <summary>
/// Background service for periodic health checks
/// </summary>
public class HealthCheckBackgroundService : BackgroundService
{
    private readonly ILogger<HealthCheckBackgroundService> _logger;
    private readonly HealthCheckService _healthCheckService;
    private readonly ITelemetryService _telemetryService;

    public HealthCheckBackgroundService(
        ILogger<HealthCheckBackgroundService> logger,
        HealthCheckService healthCheckService,
        ITelemetryService telemetryService)
    {
        _logger = logger;
        _healthCheckService = healthCheckService;
        _telemetryService = telemetryService;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Run health checks
                await RunHealthChecks();
                
                // Wait 1 minute before next health check
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while running health checks");
                await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);
            }
        }
    }

    private async Task RunHealthChecks()
    {
        try
        {
            var healthReport = await _healthCheckService.CheckHealthAsync();
            
            _logger.LogInformation("Health check completed with status: {Status}", healthReport.Status);
            
            // Report health status to telemetry
            foreach (var check in healthReport.Data)
            {
                var isHealthy = healthReport.Status == Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Healthy;
                var entry = check.Value as HealthReportEntry? ?? new HealthReportEntry(Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Unhealthy, null, TimeSpan.Zero, null, null);
                _telemetryService.TrackAvailability(
                    $"health.{check.Key}",
                    DateTimeOffset.UtcNow,
                    entry.Duration,
                    "Local",
                    isHealthy,
                    entry.Description);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to run health checks");
        }
    }
}

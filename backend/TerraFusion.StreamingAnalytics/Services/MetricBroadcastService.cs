/*
 * MetricBroadcastService
 *
 * Background service that periodically broadcasts metrics to all SignalR clients.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 1.0.0 - Phase 1 Foundation
 */

using Microsoft.AspNetCore.SignalR;
using TerraFusion.StreamingAnalytics.Hubs;

namespace TerraFusion.StreamingAnalytics.Services;

/// <summary>
/// Background service for broadcasting metrics to SignalR clients
/// </summary>
public class MetricBroadcastService : BackgroundService
{
    private readonly ILogger<MetricBroadcastService> _logger;
    private readonly IServiceProvider _serviceProvider;

    public MetricBroadcastService(
        ILogger<MetricBroadcastService> logger,
        IServiceProvider serviceProvider)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("MetricBroadcastService started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<StreamingHub>>();
                var telemetryHubContext = scope.ServiceProvider.GetRequiredService<IHubContext<TelemetryHub>>();
                var metricService = scope.ServiceProvider.GetRequiredService<IMetricStreamingService>();
                var telemetryService = scope.ServiceProvider.GetRequiredService<IAgentTelemetryService>();

                // Broadcast system metrics every 2 seconds
                var systemMetrics = new
                {
                    Cpu = await metricService.GetMetricAsync("system.cpu"),
                    Memory = await metricService.GetMetricAsync("system.memory"),
                    Timestamp = DateTime.UtcNow
                };

                await hubContext.Clients.All.SendAsync("SystemMetrics", systemMetrics, stoppingToken);

                // Broadcast swarm telemetry every 2 seconds
                var swarmTelemetry = await telemetryService.GetSwarmTelemetryAsync();
                await telemetryHubContext.Clients.Group("swarm:all").SendAsync(
                    "SwarmTelemetryUpdate",
                    swarmTelemetry,
                    stoppingToken
                );

                await Task.Delay(2000, stoppingToken); // Broadcast every 2 seconds
            }
            catch (OperationCanceledException)
            {
                // Expected when stopping
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting metrics");
                await Task.Delay(5000, stoppingToken); // Wait before retrying
            }
        }

        _logger.LogInformation("MetricBroadcastService stopped");
    }
}

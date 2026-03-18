// TMR-110: Monitoring Background Service - Periodic health checks
using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace TerraFusion.DataMining.Monitoring
{
    /// <summary>
    /// Background service that periodically collects system and database metrics
    /// and raises alerts when thresholds are exceeded.
    /// </summary>
    public class MonitoringBackgroundService : BackgroundService
    {
        private readonly ILogger<MonitoringBackgroundService> _logger;
        private readonly SystemMonitor _systemMonitor;
        private readonly DatabaseMetricsCollector _dbMetrics;
        private readonly AlertManager _alertManager;
        private readonly TimeSpan _interval;

        public MonitoringBackgroundService(
            ILogger<MonitoringBackgroundService> logger,
            SystemMonitor systemMonitor,
            DatabaseMetricsCollector dbMetrics,
            AlertManager alertManager,
            IConfiguration configuration)
        {
            _logger = logger;
            _systemMonitor = systemMonitor;
            _dbMetrics = dbMetrics;
            _alertManager = alertManager;
            _interval = TimeSpan.FromSeconds(
                configuration.GetValue("Monitoring:IntervalSeconds", 60));
        }

        /// <summary>
        /// Runs the monitoring loop, collecting metrics at the configured interval.
        /// </summary>
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Monitoring background service started, interval={IntervalSec}s",
                _interval.TotalSeconds);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await RunHealthCheckAsync(stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Monitoring cycle failed");
                }

                await Task.Delay(_interval, stoppingToken);
            }

            _logger.LogInformation("Monitoring background service stopped");
        }

        /// <summary>
        /// Performs a single health check cycle.
        /// </summary>
        public async Task RunHealthCheckAsync(CancellationToken cancellationToken = default)
        {
            var sysMetrics = await _systemMonitor.CollectMetricsAsync();

            if (_systemMonitor.IsUnderPressure(sysMetrics))
            {
                await _alertManager.CreateAlertAsync(
                    "SystemMonitor",
                    $"System under pressure: Memory={sysMetrics.MemoryUsagePercent:F1}%, Disk={sysMetrics.DiskUsagePercent:F1}%",
                    AlertSeverity.Warning);
            }

            var dbMetrics = await _dbMetrics.CollectAsync(cancellationToken);
            if (!dbMetrics.IsHealthy)
            {
                await _alertManager.CreateAlertAsync(
                    "DatabaseMetrics",
                    "Database health probe failed",
                    AlertSeverity.Critical);
            }

            _logger.LogDebug("Health check complete. Active alerts: {Count}", _alertManager.ActiveAlertCount);
        }
    }
}

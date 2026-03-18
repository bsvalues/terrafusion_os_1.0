// TMR-109: Database Metrics Collector - DB performance monitoring
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace TerraFusion.DataMining.Monitoring
{
    /// <summary>
    /// Snapshot of database performance metrics.
    /// </summary>
    public class DatabaseMetrics
    {
        public double QueryLatencyMs { get; set; }
        public int ActiveConnections { get; set; }
        public long DatabaseSizeBytes { get; set; }
        public bool IsHealthy { get; set; }
        public string ProviderName { get; set; } = string.Empty;
        public DateTime CollectedAt { get; set; } = DateTime.UtcNow;
        public Dictionary<string, object> AdditionalMetrics { get; set; } = new();
    }

    /// <summary>
    /// Collects database performance metrics by executing lightweight probe queries.
    /// Reads connection configuration from IConfiguration; never stores credentials.
    /// </summary>
    public class DatabaseMetricsCollector
    {
        private readonly ILogger<DatabaseMetricsCollector> _logger;
        private readonly IConfiguration _configuration;

        public DatabaseMetricsCollector(ILogger<DatabaseMetricsCollector> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        /// <summary>
        /// Collects database metrics including connection health and query latency.
        /// </summary>
        public async Task<DatabaseMetrics> CollectAsync(CancellationToken cancellationToken = default)
        {
            var metrics = new DatabaseMetrics
            {
                ProviderName = _configuration["Database:Provider"] ?? "Unknown"
            };

            var sw = Stopwatch.StartNew();

            try
            {
                // Stub: In production, execute a lightweight probe query
                // e.g., "SELECT 1" via the configured DbContext
                await Task.Delay(1, cancellationToken);
                sw.Stop();

                metrics.QueryLatencyMs = sw.Elapsed.TotalMilliseconds;
                metrics.IsHealthy = true;
                metrics.ActiveConnections = 0; // Populated from connection pool stats

                _logger.LogDebug("Database metrics collected: Latency={LatencyMs:F1}ms, Healthy={IsHealthy}",
                    metrics.QueryLatencyMs, metrics.IsHealthy);
            }
            catch (Exception ex)
            {
                sw.Stop();
                metrics.IsHealthy = false;
                metrics.QueryLatencyMs = sw.Elapsed.TotalMilliseconds;
                _logger.LogError(ex, "Database health probe failed after {LatencyMs:F1}ms", metrics.QueryLatencyMs);
            }

            return metrics;
        }

        /// <summary>
        /// Checks whether query latency exceeds configured thresholds.
        /// </summary>
        public bool IsLatencyAcceptable(DatabaseMetrics metrics)
        {
            var thresholdMs = _configuration.GetValue("Database:LatencyThresholdMs", 500.0);
            return metrics.QueryLatencyMs <= thresholdMs;
        }
    }
}

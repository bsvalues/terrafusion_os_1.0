// TMR-107: System Monitor - CPU, memory, disk metrics collection
using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace TerraFusion.DataMining.Monitoring
{
    /// <summary>
    /// Snapshot of system resource metrics.
    /// </summary>
    public class SystemMetrics
    {
        public double CpuUsagePercent { get; set; }
        public long MemoryUsedBytes { get; set; }
        public long MemoryTotalBytes { get; set; }
        public double MemoryUsagePercent { get; set; }
        public long DiskUsedBytes { get; set; }
        public long DiskTotalBytes { get; set; }
        public double DiskUsagePercent { get; set; }
        public DateTime CollectedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Collects system-level metrics including CPU, memory, and disk usage.
    /// </summary>
    public class SystemMonitor
    {
        private readonly ILogger<SystemMonitor> _logger;

        public SystemMonitor(ILogger<SystemMonitor> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Collects current system metrics.
        /// </summary>
        public Task<SystemMetrics> CollectMetricsAsync()
        {
            var process = Process.GetCurrentProcess();
            var metrics = new SystemMetrics
            {
                MemoryUsedBytes = process.WorkingSet64,
                MemoryTotalBytes = GC.GetGCMemoryInfo().TotalAvailableMemoryBytes,
                CollectedAt = DateTime.UtcNow
            };

            if (metrics.MemoryTotalBytes > 0)
                metrics.MemoryUsagePercent = (double)metrics.MemoryUsedBytes / metrics.MemoryTotalBytes * 100;

            try
            {
                var drive = new DriveInfo(Path.GetPathRoot(AppContext.BaseDirectory) ?? "/");
                metrics.DiskTotalBytes = drive.TotalSize;
                metrics.DiskUsedBytes = drive.TotalSize - drive.AvailableFreeSpace;
                if (drive.TotalSize > 0)
                    metrics.DiskUsagePercent = (double)metrics.DiskUsedBytes / drive.TotalSize * 100;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to collect disk metrics");
            }

            // CPU estimation via process total processor time
            metrics.CpuUsagePercent = EstimateCpuUsage(process);

            _logger.LogDebug("System metrics collected: Mem={MemPct:F1}%, Disk={DiskPct:F1}%",
                metrics.MemoryUsagePercent, metrics.DiskUsagePercent);

            return Task.FromResult(metrics);
        }

        /// <summary>
        /// Checks if any metric exceeds warning thresholds.
        /// </summary>
        public bool IsUnderPressure(SystemMetrics metrics, double memoryThreshold = 85, double diskThreshold = 90)
        {
            return metrics.MemoryUsagePercent > memoryThreshold || metrics.DiskUsagePercent > diskThreshold;
        }

        private static double EstimateCpuUsage(Process process)
        {
            try
            {
                var cpuTime = process.TotalProcessorTime;
                var uptime = DateTime.UtcNow - process.StartTime.ToUniversalTime();
                int cpuCount = Environment.ProcessorCount;
                if (uptime.TotalMilliseconds > 0 && cpuCount > 0)
                    return cpuTime.TotalMilliseconds / uptime.TotalMilliseconds / cpuCount * 100;
            }
            catch
            {
                // Process timing not available on all platforms
            }
            return 0;
        }
    }
}

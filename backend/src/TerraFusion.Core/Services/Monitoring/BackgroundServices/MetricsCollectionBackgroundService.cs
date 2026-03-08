using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace TerraFusion.Core.Services.Monitoring.BackgroundServices;

/// <summary>
/// Background service for collecting and reporting metrics
/// </summary>
public class MetricsCollectionBackgroundService : BackgroundService
{
    private readonly ILogger<MetricsCollectionBackgroundService> _logger;
    private readonly ITelemetryService _telemetryService;

    public MetricsCollectionBackgroundService(
        ILogger<MetricsCollectionBackgroundService> logger,
        ITelemetryService telemetryService)
    {
        _logger = logger;
        _telemetryService = telemetryService;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Collect and report metrics
                await CollectSystemMetrics();
                
                // Wait 30 seconds before next collection
                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while collecting metrics");
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }
    }

    private Task CollectSystemMetrics()
    {
        _logger.LogDebug("Collecting system metrics");

        var process = System.Diagnostics.Process.GetCurrentProcess();

        // Memory metrics
        var gcMemory = GC.GetTotalMemory(forceFullCollection: false);
        var workingSet = process.WorkingSet64;
        _telemetryService.TrackBusinessMetric("system.memory.gc_bytes", gcMemory);
        _telemetryService.TrackBusinessMetric("system.memory.working_set_bytes", workingSet);

        // GC generation counts
        _telemetryService.TrackBusinessMetric("system.gc.gen0_collections", GC.CollectionCount(0));
        _telemetryService.TrackBusinessMetric("system.gc.gen1_collections", GC.CollectionCount(1));
        _telemetryService.TrackBusinessMetric("system.gc.gen2_collections", GC.CollectionCount(2));

        // Thread pool metrics
        System.Threading.ThreadPool.GetAvailableThreads(out var workerThreads, out var ioThreads);
        _telemetryService.TrackBusinessMetric("system.threadpool.worker_available", workerThreads);
        _telemetryService.TrackBusinessMetric("system.threadpool.io_available", ioThreads);

        // Process metrics
        _telemetryService.TrackBusinessMetric("system.process.threads", process.Threads.Count);
        _telemetryService.TrackBusinessMetric("system.process.handles", process.HandleCount);

        // CPU time (total since process start)
        _telemetryService.TrackBusinessMetric("system.cpu.total_ms", process.TotalProcessorTime.TotalMilliseconds);

        _logger.LogDebug(
            "Metrics collected: WorkingSet={WorkingSet}MB, GC={GC}MB, Threads={Threads}",
            workingSet / (1024 * 1024),
            gcMemory / (1024 * 1024),
            process.Threads.Count);

        return Task.CompletedTask;
    }
}

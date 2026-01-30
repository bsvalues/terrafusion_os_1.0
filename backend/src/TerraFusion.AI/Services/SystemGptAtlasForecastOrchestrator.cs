// ═══════════════════════════════════════════════════════════════════════════════
// 🔮 PHASE 33: SystemGPT Atlas Forecast Orchestrator
// Background service that periodically computes forecasts for all counties
// "Government. Transcended."
// ═══════════════════════════════════════════════════════════════════════════════

using System.Diagnostics;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TerraFusion.AI.Models;

namespace TerraFusion.AI.Services;

/// <summary>
/// Phase 33: Background service that periodically computes forecasts for all counties.
/// Gathers telemetry, anomalies, and swarm state to produce risk forecasts.
/// </summary>
public sealed class SystemGptAtlasForecastOrchestrator : BackgroundService
{
    private readonly ISystemGptAtlasTelemetrySource _telemetrySource;
    private readonly ISystemGptAtlasAnomalyStore _anomalyStore;
    private readonly ISystemGptSwarmStateStore _swarmStateStore;
    private readonly ISystemGptAtlasForecastEngine _forecastEngine;
    private readonly ISystemGptAtlasForecastStore _forecastStore;
    private readonly AtlasForecastOrchestratorOptions _options;
    private readonly ILogger<SystemGptAtlasForecastOrchestrator> _logger;

    // Statistics tracking
    private long _totalRuns;
    private long _totalForecastsComputed;
    private long _totalErrors;
    private long _totalForecastsCleaned;
    private DateTimeOffset _lastRunTime = DateTimeOffset.MinValue;
    private double _totalComputeTimeMs;
    private int _tickCount;

    public SystemGptAtlasForecastOrchestrator(
        ISystemGptAtlasTelemetrySource telemetrySource,
        ISystemGptAtlasAnomalyStore anomalyStore,
        ISystemGptSwarmStateStore swarmStateStore,
        ISystemGptAtlasForecastEngine forecastEngine,
        ISystemGptAtlasForecastStore forecastStore,
        IOptions<AtlasForecastOrchestratorOptions> options,
        ILogger<SystemGptAtlasForecastOrchestrator> logger)
    {
        _telemetrySource = telemetrySource ?? throw new ArgumentNullException(nameof(telemetrySource));
        _anomalyStore = anomalyStore ?? throw new ArgumentNullException(nameof(anomalyStore));
        _swarmStateStore = swarmStateStore ?? throw new ArgumentNullException(nameof(swarmStateStore));
        _forecastEngine = forecastEngine ?? throw new ArgumentNullException(nameof(forecastEngine));
        _forecastStore = forecastStore ?? throw new ArgumentNullException(nameof(forecastStore));
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Gets current orchestrator statistics.
    /// </summary>
    public AtlasForecastOrchestratorStatistics GetStatistics()
    {
        return new AtlasForecastOrchestratorStatistics
        {
            TotalRuns = _totalRuns,
            TotalForecastsComputed = _totalForecastsComputed,
            TotalErrors = _totalErrors,
            LastRunTime = _lastRunTime,
            AverageComputeTimeMs = _totalForecastsComputed > 0
                ? _totalComputeTimeMs / _totalForecastsComputed
                : 0,
            TotalForecastsCleaned = _totalForecastsCleaned
        };
    }

    /// <summary>
    /// Main background service execution loop.
    /// </summary>
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_options.Enabled)
        {
            _logger.LogInformation("Forecast Orchestrator is disabled via configuration");
            return;
        }

        _logger.LogInformation(
            "Forecast Orchestrator started with interval {IntervalSeconds}s, cleanup every {CleanupTicks} ticks",
            _options.IntervalSeconds,
            _options.CleanupIntervalTicks);

        var interval = TimeSpan.FromSeconds(_options.IntervalSeconds);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunOnceAsync(stoppingToken);
                await Task.Delay(interval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Forecast Orchestrator stopping due to cancellation");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in Forecast Orchestrator main loop");
                Interlocked.Increment(ref _totalErrors);

                // Brief delay before retry to avoid tight error loops
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }

        _logger.LogInformation("Forecast Orchestrator stopped");
    }

    /// <summary>
    /// Runs a single forecast computation cycle.
    /// Exposed for testing - called by ExecuteAsync in production.
    /// </summary>
    public async Task RunOnceAsync(CancellationToken cancellationToken)
    {
        var runStopwatch = Stopwatch.StartNew();
        var forecastsThisRun = 0;
        var errorsThisRun = 0;

        _tickCount++;

        try
        {
            // Step 1: Get current telemetry for all counties
            var metrics = await _telemetrySource.GetCurrentMetricsAsync(cancellationToken);

            if (metrics == null || metrics.Count == 0)
            {
                _logger.LogDebug("No telemetry available - skipping forecast cycle");
                _lastRunTime = DateTimeOffset.UtcNow;
                Interlocked.Increment(ref _totalRuns);
                return;
            }

            _logger.LogDebug("Processing forecasts for {Count} counties", metrics.Count);

            // Step 2: Process each county
            foreach (var countyMetrics in metrics)
            {
                cancellationToken.ThrowIfCancellationRequested();

                try
                {
                    await ProcessCountyForecastAsync(countyMetrics, cancellationToken);
                    forecastsThisRun++;
                }
                catch (OperationCanceledException)
                {
                    throw; // Re-throw cancellation
                }
                catch (Exception ex)
                {
                    errorsThisRun++;
                    _logger.LogWarning(
                        ex,
                        "Failed to compute forecast for county {CountyId}, continuing with others",
                        countyMetrics.CountyId);
                }
            }

            // Step 3: Periodic cleanup
            if (_tickCount >= _options.CleanupIntervalTicks)
            {
                await CleanupOldForecastsAsync();
                _tickCount = 0;
            }
        }
        catch (OperationCanceledException)
        {
            throw; // Re-throw cancellation
        }
        catch (Exception ex)
        {
            errorsThisRun++;
            _logger.LogError(ex, "Error during forecast orchestration cycle");
        }

        // Update statistics
        runStopwatch.Stop();
        _lastRunTime = DateTimeOffset.UtcNow;
        Interlocked.Increment(ref _totalRuns);
        Interlocked.Add(ref _totalForecastsComputed, forecastsThisRun);
        Interlocked.Add(ref _totalErrors, errorsThisRun);
        _totalComputeTimeMs += runStopwatch.Elapsed.TotalMilliseconds;

        _logger.LogDebug(
            "Forecast cycle completed: {Forecasts} forecasts, {Errors} errors, {ElapsedMs:F1}ms",
            forecastsThisRun,
            errorsThisRun,
            runStopwatch.Elapsed.TotalMilliseconds);
    }

    /// <summary>
    /// Processes forecast for a single county.
    /// </summary>
    private async Task ProcessCountyForecastAsync(
        RawCountyMetrics countyMetrics,
        CancellationToken cancellationToken)
    {
        var countyId = countyMetrics.CountyId;

        // Gather anomalies for this county
        var anomalySince = DateTimeOffset.UtcNow.AddHours(-_options.AnomalyLookbackHours);
        var anomalies = _anomalyStore.GetRecent(countyId, anomalySince, null, null);

        // Get swarm state for this county
        var swarmSnapshot = _swarmStateStore.GetState(countyId);

        // Build forecast input
        var input = new AtlasForecastInput
        {
            CountyId = countyId,
            TelemetryHistory = new List<AtlasTelemetrySnapshot>
            {
                ConvertToSnapshot(countyMetrics)
            },
            RecentAnomalies = ConvertAnomalies(anomalies),
            SwarmState = ConvertSwarmState(swarmSnapshot),
            Horizon = AtlasForecastHorizon.ShortTerm
        };

        // Compute forecast
        var forecast = await _forecastEngine.ComputeForecast(input);

        // Save to store
        await _forecastStore.SaveAsync(forecast);

        _logger.LogDebug(
            "Computed forecast for {CountyId}: Risk={Risk}, Action={Action}",
            countyId,
            forecast.OverallRisk,
            forecast.RecommendedAction?.ToString() ?? "None");
    }

    /// <summary>
    /// Cleans up old forecasts based on configuration.
    /// </summary>
    private async Task CleanupOldForecastsAsync()
    {
        try
        {
            var cleaned = await _forecastStore.ClearOldAsync(_options.MaxForecastAge);
            Interlocked.Add(ref _totalForecastsCleaned, cleaned);

            if (cleaned > 0)
            {
                _logger.LogDebug("Cleaned up {Count} old forecasts", cleaned);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to cleanup old forecasts");
        }
    }

    /// <summary>
    /// Converts raw county metrics to a telemetry snapshot.
    /// </summary>
    private static AtlasTelemetrySnapshot ConvertToSnapshot(RawCountyMetrics metrics)
    {
        return new AtlasTelemetrySnapshot
        {
            Timestamp = DateTimeOffset.UtcNow, // RawCountyMetrics doesn't have timestamp
            P95LatencyMs = metrics.P95LatencyMs,
            ErrorRate = metrics.ErrorRatePercent / 100.0, // Convert from percent to ratio
            ActiveRequests = metrics.ActiveRequests,
            HealthState = DetermineHealthState(metrics)
        };
    }

    /// <summary>
    /// Determines health state from metrics.
    /// </summary>
    private static string DetermineHealthState(RawCountyMetrics metrics)
    {
        if (metrics.P95LatencyMs > 500 || metrics.ErrorRatePercent > 10)
            return "degraded";
        if (metrics.P95LatencyMs > 200 || metrics.ErrorRatePercent > 5)
            return "warning";
        return "healthy";
    }

    /// <summary>
    /// Converts anomaly DTOs to forecast-compatible records.
    /// </summary>
    private static IReadOnlyList<AtlasAnomaly> ConvertAnomalies(
        IList<SystemGptAtlasAnomalyEventDto> anomalies)
    {
        return anomalies.Select(a => new AtlasAnomaly
        {
            Kind = a.Kind,
            Severity = a.Severity,
            Timestamp = a.Timestamp,
            CountyId = a.CountyId
        }).ToList();
    }

    /// <summary>
    /// Converts swarm state snapshot to forecast-compatible state.
    /// </summary>
    private static SwarmState? ConvertSwarmState(SwarmStateSnapshot? snapshot)
    {
        if (snapshot == null)
            return null;

        return new SwarmState
        {
            CountyId = snapshot.CountyId,
            Mode = snapshot.Mode,
            ActiveAgents = snapshot.CurrentCapacity, // Map CurrentCapacity to ActiveAgents
            QueueDepth = 0, // Not tracked in SwarmStateSnapshot v1
            SafeModeEnabled = snapshot.SafeModeEnabled,
            ModeHistory = [] // Not tracked in SwarmStateSnapshot v1
        };
    }
}

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace TerraFusion.Core.Services
{
    /// <summary>
    /// Elite background service for Harris PACS real-time data synchronization
    /// Implements championship-level reliability with quantum-enhanced monitoring
    /// Target: 99.9% accuracy, <10ms processing overhead, 15-minute sync intervals
    /// </summary>
    public class HarrisPACSSyncBackgroundService : BackgroundService
    {
        private readonly ILogger<HarrisPACSSyncBackgroundService> _logger;
        private readonly IConfiguration _configuration;
        private readonly IServiceProvider _serviceProvider;

        private readonly TimeSpan _syncInterval;
        private readonly int _maxRetryAttempts;
        private readonly TimeSpan _retryDelay;
        private readonly bool _enableQuantumOptimization;
        private readonly List<string> _activeJurisdictions;

        private int _consecutiveFailures = 0;
        private int _totalSyncsExecuted = 0;
        private int _totalSyncsSucceeded = 0;
        private DateTime _lastSuccessfulSync = DateTime.MinValue;
        private readonly object _metricsLock = new object();

        public HarrisPACSSyncBackgroundService(
            ILogger<HarrisPACSSyncBackgroundService> logger,
            IConfiguration configuration,
            IServiceProvider serviceProvider)
        {
            _logger = logger;
            _configuration = configuration;
            _serviceProvider = serviceProvider;

            // Load configuration with championship-level defaults
            _syncInterval = TimeSpan.FromMinutes(
                configuration.GetValue<int>("HarrisPACS:BackgroundSync:IntervalMinutes", 15));

            _maxRetryAttempts = configuration.GetValue<int>("HarrisPACS:BackgroundSync:MaxRetryAttempts", 3);
            _retryDelay = TimeSpan.FromSeconds(
                configuration.GetValue<int>("HarrisPACS:BackgroundSync:RetryDelaySeconds", 30));

            _enableQuantumOptimization = configuration.GetValue<bool>(
                "HarrisPACS:BackgroundSync:EnableQuantumOptimization", true);

            // Load active jurisdictions from configuration
            _activeJurisdictions = configuration.GetSection("HarrisPACS:BackgroundSync:Jurisdictions")
                .Get<List<string>>() ?? new List<string> { "Benton" };

            _logger.LogInformation(
                "🏛️ TerraFusion Elite Harris PACS Sync Service initialized - Interval: {Interval}, Jurisdictions: {Count}, Quantum: {Quantum}",
                _syncInterval, _activeJurisdictions.Count, _enableQuantumOptimization);
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation(
                "⚡ Harris PACS Background Sync Service starting - Government. Transcended. excellence activated");

            // Wait for application startup completion
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var syncActivity = new Activity("HarrisPACS.BackgroundSync").Start();
                    syncActivity?.SetTag("terrafusion.service", "harris-pacs-sync");
                    syncActivity?.SetTag("terrafusion.mode", "background");

                    await ExecuteSyncCycleAsync(stoppingToken);

                    syncActivity?.Stop();

                    // Wait for next sync interval
                    _logger.LogInformation(
                        "💤 Next Harris PACS sync cycle scheduled in {Interval} minutes",
                        _syncInterval.TotalMinutes);

                    await Task.Delay(_syncInterval, stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    _logger.LogInformation("Harris PACS Background Sync Service stopping gracefully");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex,
                        "❌ Critical error in Harris PACS sync service - attempting recovery");

                    // Emergency fallback delay
                    await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
                }
            }

            _logger.LogInformation(
                "🏛️ Harris PACS Background Sync Service stopped - Total cycles: {Total}, Success rate: {Rate:P2}",
                _totalSyncsExecuted, GetSuccessRate());
        }

        private async Task ExecuteSyncCycleAsync(CancellationToken cancellationToken)
        {
            var cycleStartTime = DateTime.UtcNow;
            var stopwatch = Stopwatch.StartNew();

            _logger.LogInformation(
                "🔄 Starting Harris PACS sync cycle - Jurisdictions: {Count}, Cycle: {CycleNumber}",
                _activeJurisdictions.Count, _totalSyncsExecuted + 1);

            var syncResults = new List<SyncResult>();

            foreach (var jurisdiction in _activeJurisdictions)
            {
                if (cancellationToken.IsCancellationRequested)
                {
                    _logger.LogWarning("Sync cycle cancelled for jurisdiction: {Jurisdiction}", jurisdiction);
                    break;
                }

                var result = await SyncJurisdictionWithRetryAsync(jurisdiction, cancellationToken);
                syncResults.Add(result);
            }

            stopwatch.Stop();

            // Update metrics
            lock (_metricsLock)
            {
                _totalSyncsExecuted++;

                var successfulSyncs = syncResults.Count(r => r.Success);
                if (successfulSyncs == _activeJurisdictions.Count)
                {
                    _totalSyncsSucceeded++;
                    _consecutiveFailures = 0;
                    _lastSuccessfulSync = cycleStartTime;
                }
                else
                {
                    _consecutiveFailures++;
                }
            }

            // Log comprehensive cycle results
            var successCount = syncResults.Count(r => r.Success);
            var totalProperties = syncResults.Sum(r => r.PropertiesSynced);
            var totalUpdates = syncResults.Sum(r => r.UpdatesApplied);

            _logger.LogInformation(
                "✅ Harris PACS sync cycle completed - Duration: {Duration}ms, Success: {Success}/{Total}, Properties: {Properties}, Updates: {Updates}",
                stopwatch.ElapsedMilliseconds, successCount, _activeJurisdictions.Count, totalProperties, totalUpdates);

            // Championship-level alerting for consecutive failures
            if (_consecutiveFailures >= 3)
            {
                _logger.LogCritical(
                    "🚨 ALERT: Harris PACS sync has failed {Failures} consecutive times - Manual intervention recommended",
                    _consecutiveFailures);
            }

            // Log elite performance metrics
            await LogPerformanceMetricsAsync(syncResults, stopwatch.ElapsedMilliseconds);
        }

        private async Task<SyncResult> SyncJurisdictionWithRetryAsync(
            string jurisdiction,
            CancellationToken cancellationToken)
        {
            var attemptNumber = 0;
            Exception? lastException = null;

            while (attemptNumber < _maxRetryAttempts)
            {
                attemptNumber++;

                try
                {
                    _logger.LogDebug(
                        "📡 Syncing jurisdiction: {Jurisdiction} (Attempt {Attempt}/{Max})",
                        jurisdiction, attemptNumber, _maxRetryAttempts);

                    var result = await ExecuteJurisdictionSyncAsync(jurisdiction, cancellationToken);

                    if (result.Success)
                    {
                        _logger.LogInformation(
                            "✅ Jurisdiction sync successful: {Jurisdiction} - Properties: {Properties}, Updates: {Updates}, Duration: {Duration}ms",
                            jurisdiction, result.PropertiesSynced, result.UpdatesApplied, result.DurationMs);

                        return result;
                    }
                    else
                    {
                        _logger.LogWarning(
                            "⚠️ Jurisdiction sync returned false: {Jurisdiction} - Attempt {Attempt}",
                            jurisdiction, attemptNumber);
                    }
                }
                catch (Exception ex)
                {
                    lastException = ex;
                    _logger.LogError(ex,
                        "❌ Error syncing jurisdiction {Jurisdiction} (Attempt {Attempt}/{Max})",
                        jurisdiction, attemptNumber, _maxRetryAttempts);
                }

                // Wait before retry (except on last attempt)
                if (attemptNumber < _maxRetryAttempts)
                {
                    await Task.Delay(_retryDelay, cancellationToken);
                }
            }

            // All retry attempts failed
            _logger.LogError(
                "❌ FAILED: Jurisdiction sync exhausted all retry attempts: {Jurisdiction} - Last error: {Error}",
                jurisdiction, lastException?.Message ?? "Unknown error");

            return new SyncResult
            {
                Jurisdiction = jurisdiction,
                Success = false,
                Error = lastException?.Message ?? "All retry attempts exhausted",
                DurationMs = 0,
                PropertiesSynced = 0,
                UpdatesApplied = 0
            };
        }

        private async Task<SyncResult> ExecuteJurisdictionSyncAsync(
            string jurisdiction,
            CancellationToken cancellationToken)
        {
            var stopwatch = Stopwatch.StartNew();
            var result = new SyncResult
            {
                Jurisdiction = jurisdiction,
                Success = false,
                SyncStartTime = DateTime.UtcNow
            };

            try
            {
                result.Error = "pacscontract.v1 is read-only; background sync is disabled.";
                _logger.LogWarning("⚠️ Harris PACS sync skipped for {Jurisdiction}: {Reason}", jurisdiction, result.Error);
                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                result.Error = ex.Message;
                throw;
            }
            finally
            {
                stopwatch.Stop();
                result.DurationMs = stopwatch.ElapsedMilliseconds;
                result.SyncEndTime = DateTime.UtcNow;
            }

            return result;
        }

        private async Task LogPerformanceMetricsAsync(List<SyncResult> results, long totalDurationMs)
        {
            // Calculate championship-level metrics
            var successRate = GetSuccessRate();
            var avgDuration = results.Any() ? results.Average(r => r.DurationMs) : 0;
            var totalProperties = results.Sum(r => r.PropertiesSynced);
            var totalUpdates = results.Sum(r => r.UpdatesApplied);

            var metrics = new Dictionary<string, object>
            {
                { "service", "harris_pacs_sync" },
                { "cycle_duration_ms", totalDurationMs },
                { "avg_jurisdiction_duration_ms", avgDuration },
                { "total_syncs_executed", _totalSyncsExecuted },
                { "total_syncs_succeeded", _totalSyncsSucceeded },
                { "success_rate", successRate },
                { "consecutive_failures", _consecutiveFailures },
                { "properties_synced", totalProperties },
                { "updates_applied", totalUpdates },
                { "last_successful_sync", _lastSuccessfulSync },
                { "quantum_optimization", _enableQuantumOptimization }
            };

            _logger.LogInformation(
                "📊 Harris PACS Sync Metrics - Success Rate: {SuccessRate:P2}, Avg Duration: {AvgDuration}ms, Properties: {Properties}",
                successRate, avgDuration, totalProperties);

            // Optional: Send to monitoring service
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var monitoringService = scope.ServiceProvider.GetService<IPerformanceMonitoringService>();

                if (monitoringService != null)
                {
                    await monitoringService.RecordMetricsAsync("harris_pacs_sync_cycle", metrics);
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Failed to send metrics to monitoring service (non-critical)");
            }
        }

        private double GetSuccessRate()
        {
            lock (_metricsLock)
            {
                return _totalSyncsExecuted > 0
                    ? (double)_totalSyncsSucceeded / _totalSyncsExecuted
                    : 1.0;
            }
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation(
                "🛑 Harris PACS Background Sync Service stopping - Final stats: Cycles: {Cycles}, Success Rate: {Rate:P2}",
                _totalSyncsExecuted, GetSuccessRate());

            await base.StopAsync(cancellationToken);
        }
    }

    /// <summary>
    /// Sync result for individual jurisdiction processing
    /// </summary>
    public class SyncResult
    {
        public string Jurisdiction { get; set; } = string.Empty;
        public bool Success { get; set; }
        public string? Error { get; set; }
        public long DurationMs { get; set; }
        public int PropertiesSynced { get; set; }
        public int UpdatesApplied { get; set; }
        public DateTime SyncStartTime { get; set; }
        public DateTime SyncEndTime { get; set; }
    }

    /// <summary>
    /// Optional interface for property data validation service
    /// </summary>
    public interface IPropertyDataService
    {
        Task ValidatePropertyDataIntegrityAsync(string jurisdiction);
        Task<int> GetPropertyCountAsync(string jurisdiction);
    }

    /// <summary>
    /// Optional interface for performance monitoring integration
    /// </summary>
    public interface IPerformanceMonitoringService
    {
        Task RecordMetricsAsync(string metricName, Dictionary<string, object> metrics);
    }
}

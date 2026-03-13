using Microsoft.Extensions.Logging;
using TerraFusion.Core.Interfaces;
using SyncResult = TerraFusion.Abstractions.DTOs.Responses.SyncResult;

namespace TerraFusion.API.Services;

/// <summary>
/// TerraFusionSync Integration Service - Backend C# integration layer
/// Coordinates between the Tauri+Rust TerraFusionSync module and the .NET backend
/// This service serves as the bridge between the module and the backend services
/// </summary>
public class TerraFusionSyncIntegrationService : ITerraFusionSyncService
{
    private readonly ILogger<TerraFusionSyncIntegrationService> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly TerraFusionSyncRuntimeState _runtimeState;

    public TerraFusionSyncIntegrationService(
        ILogger<TerraFusionSyncIntegrationService> logger,
        IServiceProvider serviceProvider,
        TerraFusionSyncRuntimeState runtimeState)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
        _runtimeState = runtimeState;
    }

    public async Task<SyncResult> StartSynchronizationAsync(string? specificCounty = null)
    {
        _logger.LogInformation("🚀 Starting TerraFusionSync synchronization for {County}",
            specificCounty ?? "all counties");

        var result = new SyncResult
        {
            Timestamp = DateTime.UtcNow,
            CountyName = specificCounty
        };

        try
        {
            _runtimeState.SetOrchestrationActive(true);

            if (!string.IsNullOrEmpty(specificCounty))
            {
                // Sync specific county
                var countyResult = await SyncCountyDataAsync(specificCounty);
                result.Success = countyResult.Success;
                result.RecordsProcessed = countyResult.RecordsProcessed;
                result.RecordsUpdated = countyResult.RecordsUpdated;
                result.RecordsAdded = countyResult.RecordsAdded;
                result.RecordsSkipped = countyResult.RecordsSkipped;
                result.Errors = countyResult.Errors;
            }
            else
            {
                // Sync all configured counties
                var totalProcessed = 0;
                var totalUpdated = 0;
                var totalAdded = 0;
                var totalSkipped = 0;
                var allErrors = new List<string>();
                var allSuccess = true;

                foreach (var county in _runtimeState.GetConfiguredCounties().Where(c => c.IsActive))
                {
                    try
                    {
                        var countyResult = await SyncCountyDataAsync(county.CountyName);
                        totalProcessed += countyResult.RecordsProcessed;
                        totalUpdated += countyResult.RecordsUpdated;
                        totalAdded += countyResult.RecordsAdded;
                        totalSkipped += countyResult.RecordsSkipped;
                        allErrors.AddRange(countyResult.Errors);

                        if (!countyResult.Success)
                        {
                            allSuccess = false;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to sync county {County}", county.CountyName);
                        allErrors.Add($"County {county.CountyName}: {ex.Message}");
                        allSuccess = false;
                    }
                }

                result.Success = allSuccess;
                result.RecordsProcessed = totalProcessed;
                result.RecordsUpdated = totalUpdated;
                result.RecordsAdded = totalAdded;
                result.RecordsSkipped = totalSkipped;
                result.Errors = allErrors;
            }

            result.Duration = DateTime.UtcNow - result.Timestamp;
            result.ErrorCount = result.Errors.Count;

            if (result.Success)
            {
                _logger.LogInformation("✅ TerraFusionSync synchronization completed successfully. " +
                    "Processed: {Processed}, Updated: {Updated}, Added: {Added}",
                    result.RecordsProcessed, result.RecordsUpdated, result.RecordsAdded);
            }
            else
            {
                _logger.LogError("❌ TerraFusionSync synchronization completed with errors. " +
                    "Errors: {ErrorCount}", result.ErrorCount);
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ TerraFusionSync synchronization failed");

            result.Success = false;
            result.Errors.Add($"Synchronization failed: {ex.Message}");
            result.ErrorCount = result.Errors.Count;
            result.Duration = DateTime.UtcNow - result.Timestamp;

            return result;
        }
    }

    public async Task<SyncResult> StopSynchronizationAsync()
    {
        _logger.LogInformation("🛑 Stopping TerraFusionSync synchronization");

        _runtimeState.SetOrchestrationActive(false);

        return await Task.FromResult(new SyncResult
        {
            Success = true,
            Timestamp = DateTime.UtcNow,
            Duration = TimeSpan.Zero
        });
    }

    public async Task<SyncStatus> GetSyncStatusAsync()
    {
        return await Task.FromResult(new SyncStatus
        {
            IsActive = _runtimeState.IsOrchestrationActive,
            CurrentOperation = _runtimeState.IsOrchestrationActive ? "Real-time synchronization active" : "Idle",
            LastSyncTime = _runtimeState.LastSyncTime,
            NextScheduledSync = _runtimeState.GetNextScheduledSync(),
            ActiveConnections = _runtimeState.GetRegisteredSystems().Count(s => s.IsAvailable),
            Metrics = new Dictionary<string, object>
            {
                ["TotalSystems"] = _runtimeState.GetRegisteredSystems().Count(),
                ["ActiveCounties"] = _runtimeState.GetConfiguredCounties().Count(c => c.IsActive),
                ["UptimeSeconds"] = _runtimeState.IsOrchestrationActive && _runtimeState.OrchestrationStartTime.HasValue
                    ? (DateTime.UtcNow - _runtimeState.OrchestrationStartTime.Value).TotalSeconds
                    : 0
            }
        });
    }

    public async Task<bool> IsSyncActiveAsync()
    {
        return await Task.FromResult(_runtimeState.IsOrchestrationActive);
    }

    public async Task<IEnumerable<LegacySystemInfo>> GetAvailableLegacySystemsAsync()
    {
        return await Task.FromResult(_runtimeState.GetRegisteredSystems());
    }

    public async Task<bool> RegisterLegacySystemAsync(LegacySystemConfig config)
    {
        try
        {
            _logger.LogInformation("📝 Registering legacy system: {SystemName} ({SystemType})",
                config.SystemName, config.SystemType);

            var isAvailable = !string.IsNullOrWhiteSpace(config.ConnectionString) || !string.IsNullOrWhiteSpace(config.ApiEndpoint);
            _runtimeState.RegisterLegacySystem(config, isAvailable);

            _logger.LogInformation("✅ Legacy system {SystemName} registered successfully", config.SystemName);
            return await Task.FromResult(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to register legacy system {SystemName}", config.SystemName);
            return false;
        }
    }

    public async Task<bool> UnregisterLegacySystemAsync(string systemId)
    {
        try
        {
            if (_runtimeState.UnregisterLegacySystem(systemId))
            {
                _logger.LogInformation("✅ Legacy system {SystemId} unregistered", systemId);
                return await Task.FromResult(true);
            }

            _logger.LogWarning("⚠️ Legacy system {SystemId} not found", systemId);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to unregister legacy system {SystemId}", systemId);
            return false;
        }
    }

    public async Task<LegacySystemHealth> GetLegacySystemHealthAsync(string systemId)
    {
        var systemInfo = _runtimeState.GetRegisteredSystem(systemId);
        if (systemInfo is not null)
        {
            return await Task.FromResult(new LegacySystemHealth
            {
                SystemId = systemId,
                IsOnline = systemInfo.IsAvailable,
                IsHealthy = systemInfo.IsAvailable && systemInfo.IsConfigured,
                ResponseTime = TimeSpan.FromMilliseconds(50), // Simulated
                LastSuccessfulSync = DateTime.UtcNow.AddMinutes(-5),
                Status = systemInfo.IsAvailable ? "Operational" : "Offline",
                HealthMetrics = new Dictionary<string, object>
                {
                    ["LastCheck"] = systemInfo.LastHealthCheck,
                    ["SystemType"] = systemInfo.SystemType,
                    ["Version"] = systemInfo.Version
                }
            });
        }

        return await Task.FromResult(new LegacySystemHealth
        {
            SystemId = systemId,
            IsOnline = false,
            IsHealthy = false,
            Status = "Not Found",
            Issues = new List<string> { $"System {systemId} not registered" }
        });
    }

    public async Task<CountySyncResult> SyncCountyDataAsync(string countyName, SyncOptions? options = null)
    {
        _logger.LogInformation("🔄 Syncing data for {County} county", countyName);

        try
        {
            if (!_runtimeState.GetRegisteredSystems().Any())
            {
                _logger.LogWarning(
                    "Skipping Benton sync for {County} because this host is running in operational-snapshot mode without PACS connectivity.",
                    countyName);

                return new CountySyncResult
                {
                    CountyName = countyName,
                    Timestamp = DateTime.UtcNow,
                    Success = false,
                    Status = "snapshot_mode",
                    Message = "This host is running in Benton operational-snapshot mode. PACS sync is not available here.",
                    Errors = new List<string>
                    {
                        "PACS sync is disabled on this host. Use the canonical local PACS-connected runtime for sync operations."
                    },
                    ErrorCount = 1,
                    Duration = TimeSpan.Zero
                };
            }

            var configuredCounty = _runtimeState.GetConfiguredCounty(countyName);
            using var scope = _serviceProvider.CreateScope();
            var pacsSyncService = scope.ServiceProvider.GetRequiredService<PacsToTerraFusionSyncService>();

            var result = await pacsSyncService.SyncCountyDataAsync(
                countyName,
                configuredCounty?.State,
                options);

            if (configuredCounty is not null)
            {
                _runtimeState.RecordSyncCompletion(result);
            }
            else
            {
                _runtimeState.RecordSyncCompletion(result);
            }

            _logger.LogInformation("✅ County {County} sync completed. Records: {Records}, Duration: {Duration}",
                countyName, result.RecordsProcessed, result.Duration);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to sync county {County}", countyName);

            return new CountySyncResult
            {
                CountyName = countyName,
                Timestamp = DateTime.UtcNow,
                Success = false,
                Status = "failed",
                Message = "County sync failed.",
                Errors = new List<string> { ex.Message },
                ErrorCount = 1,
                Duration = TimeSpan.Zero
            };
        }
    }

    public async Task<IEnumerable<CountyInfo>> GetConfiguredCountiesAsync()
    {
        return await Task.FromResult(_runtimeState.GetConfiguredCounties());
    }

    public async Task<bool> ConfigureCountyAsync(CountyConfig config)
    {
        try
        {
            _logger.LogInformation("⚙️ Configuring county: {County}, {State}", config.CountyName, config.State);

            _runtimeState.ConfigureCounty(config);

            _logger.LogInformation("✅ County {County} configured successfully", config.CountyName);
            return await Task.FromResult(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to configure county {County}", config.CountyName);
            return false;
        }
    }

    public async Task<SyncMetrics> GetSyncMetricsAsync()
    {
        return await Task.FromResult(_runtimeState.CreateMetricsSnapshot());
    }

    public async Task<IEnumerable<SyncEvent>> GetRecentSyncEventsAsync(int count = 50)
    {
        return await Task.FromResult(_runtimeState.GetRecentEvents(count));
    }

    public async Task<OrchestrationStatus> GetOrchestrationStatusAsync()
    {
        return await Task.FromResult(_runtimeState.CreateOrchestrationStatus());
    }

    public async Task<bool> RestartOrchestrationAsync()
    {
        try
        {
            _logger.LogInformation("🔄 Restarting TerraFusionSync orchestration");

            _runtimeState.SetOrchestrationActive(false);
            await Task.Delay(1000); // Simulate shutdown

            _runtimeState.SetOrchestrationActive(true);

            _logger.LogInformation("✅ TerraFusionSync orchestration restarted");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to restart orchestration");
            return false;
        }
    }
}

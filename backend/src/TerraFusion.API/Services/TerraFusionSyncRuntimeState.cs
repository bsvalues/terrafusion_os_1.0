using System.Collections.Concurrent;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.API.Services;

/// <summary>
/// Shared TerraFusionSync runtime state.
/// Keeps deployed status truthful across requests and only advertises Benton
/// runtime readiness when canonical PACS configuration is actually present.
/// </summary>
public sealed class TerraFusionSyncRuntimeState
{
    private const int MaxRecentEvents = 50;

    private readonly ILogger<TerraFusionSyncRuntimeState> _logger;
    private readonly ConcurrentDictionary<string, LegacySystemInfo> _registeredSystems =
        new(StringComparer.OrdinalIgnoreCase);
    private readonly ConcurrentDictionary<string, CountyInfo> _configuredCounties =
        new(StringComparer.OrdinalIgnoreCase);
    private readonly ConcurrentQueue<SyncEvent> _recentEvents = new();
    private readonly object _syncRoot = new();

    private bool _isOrchestrationActive;
    private DateTime? _orchestrationStartTime;
    private DateTime? _lastSyncTime;
    private int _totalSyncOperations;
    private int _successfulSyncs;
    private int _failedSyncs;
    private int _totalRecordsProcessed;

    public TerraFusionSyncRuntimeState(
        IConfiguration configuration,
        ILogger<TerraFusionSyncRuntimeState> logger)
    {
        _logger = logger;
        InitializeFromConfiguration(configuration);
    }

    public bool IsOrchestrationActive
    {
        get
        {
            lock (_syncRoot)
            {
                return _isOrchestrationActive;
            }
        }
    }

    public DateTime? OrchestrationStartTime
    {
        get
        {
            lock (_syncRoot)
            {
                return _orchestrationStartTime;
            }
        }
    }

    public DateTime? LastSyncTime
    {
        get
        {
            lock (_syncRoot)
            {
                return _lastSyncTime;
            }
        }
    }

    public IEnumerable<LegacySystemInfo> GetRegisteredSystems() =>
        _registeredSystems.Values
            .OrderBy(system => system.SystemName, StringComparer.OrdinalIgnoreCase)
            .ToList();

    public IEnumerable<CountyInfo> GetConfiguredCounties() =>
        _configuredCounties.Values
            .OrderBy(county => county.CountyName, StringComparer.OrdinalIgnoreCase)
            .ToList();

    public LegacySystemInfo? GetRegisteredSystem(string systemId) =>
        _registeredSystems.TryGetValue(systemId, out var systemInfo) ? systemInfo : null;

    public CountyInfo? GetConfiguredCounty(string countyName) =>
        _configuredCounties.TryGetValue(countyName, out var countyInfo) ? countyInfo : null;

    public void SetOrchestrationActive(bool active)
    {
        lock (_syncRoot)
        {
            _isOrchestrationActive = active;
            _orchestrationStartTime = active ? DateTime.UtcNow : null;
        }

        AppendEvent(new SyncEvent
        {
            EventType = active ? "OrchestrationStarted" : "OrchestrationStopped",
            CountyName = string.Empty,
            LegacySystem = "TerraFusionSync",
            Message = active ? "TerraFusionSync orchestration activated" : "TerraFusionSync orchestration stopped"
        });
    }

    public LegacySystemInfo RegisterLegacySystem(LegacySystemConfig config, bool isAvailable)
    {
        var systemInfo = new LegacySystemInfo
        {
            SystemId = config.SystemId,
            SystemName = config.SystemName,
            SystemType = config.SystemType,
            Version = "configured",
            IsAvailable = isAvailable,
            IsConfigured = true,
            LastHealthCheck = DateTime.UtcNow,
            Capabilities = new Dictionary<string, object>
            {
                ["AutoSync"] = config.EnableAutoSync,
                ["SyncIntervalMinutes"] = config.SyncInterval.TotalMinutes,
                ["HasApiEndpoint"] = !string.IsNullOrWhiteSpace(config.ApiEndpoint),
                ["HasConnectionString"] = !string.IsNullOrWhiteSpace(config.ConnectionString)
            }
        };

        _registeredSystems[config.SystemId] = systemInfo;

        AppendEvent(new SyncEvent
        {
            EventType = "SystemRegistered",
            LegacySystem = config.SystemName,
            Message = $"Legacy system {config.SystemName} registered",
            Details = new Dictionary<string, object>
            {
                ["systemId"] = config.SystemId,
                ["available"] = isAvailable
            }
        });

        return systemInfo;
    }

    public bool UnregisterLegacySystem(string systemId)
    {
        var removed = _registeredSystems.TryRemove(systemId, out var removedSystem);
        if (removed)
        {
            AppendEvent(new SyncEvent
            {
                EventType = "SystemUnregistered",
                LegacySystem = removedSystem?.SystemName ?? systemId,
                Message = $"Legacy system {systemId} unregistered"
            });
        }

        return removed;
    }

    public CountyInfo ConfigureCounty(CountyConfig config)
    {
        var legacySystem = GetRegisteredSystem(config.LegacySystemId);

        var countyInfo = new CountyInfo
        {
            CountyName = config.CountyName,
            State = config.State,
            LegacySystemId = config.LegacySystemId,
            LegacySystemType = legacySystem?.SystemType ?? "Unknown",
            IsConfigured = true,
            IsActive = config.EnableAutoSync,
            Configuration = new Dictionary<string, object>
            {
                ["SyncIntervalMinutes"] = config.SyncInterval.TotalMinutes,
                ["EnableAutoSync"] = config.EnableAutoSync,
                ["ConnectionSettings"] = config.ConnectionSettings,
                ["DefaultSyncOptions"] = config.DefaultSyncOptions?.DataTypes ?? new List<string>()
            }
        };

        _configuredCounties[config.CountyName] = countyInfo;

        AppendEvent(new SyncEvent
        {
            EventType = "CountyConfigured",
            CountyName = config.CountyName,
            LegacySystem = config.LegacySystemId,
            Message = $"County {config.CountyName} configured",
            Details = new Dictionary<string, object>
            {
                ["state"] = config.State,
                ["autoSync"] = config.EnableAutoSync
            }
        });

        return countyInfo;
    }

    public void RecordSyncCompletion(CountySyncResult result)
    {
        lock (_syncRoot)
        {
            _lastSyncTime = result.Timestamp;
            _totalSyncOperations++;
            _totalRecordsProcessed += result.RecordsProcessed;

            if (result.Success)
            {
                _successfulSyncs++;
            }
            else
            {
                _failedSyncs++;
            }
        }

        if (_configuredCounties.TryGetValue(result.CountyName, out var county))
        {
            county.LastSync = result.Timestamp;
            county.TotalParcels = result.TotalParcels;
        }

        AppendEvent(new SyncEvent
        {
            EventType = result.Success ? "Completed" : "Error",
            CountyName = result.CountyName,
            LegacySystem = result.LegacySystemType,
            Message = result.Success
                ? $"County sync completed: {result.RecordsProcessed} records processed"
                : $"County sync failed: {string.Join("; ", result.Errors)}",
            Details = new Dictionary<string, object>
            {
                ["recordsProcessed"] = result.RecordsProcessed,
                ["recordsAdded"] = result.RecordsAdded,
                ["recordsUpdated"] = result.RecordsUpdated,
                ["recordsSkipped"] = result.RecordsSkipped,
                ["errorCount"] = result.ErrorCount
            }
        });
    }

    public SyncMetrics CreateMetricsSnapshot()
    {
        lock (_syncRoot)
        {
            return new SyncMetrics
            {
                Timestamp = DateTime.UtcNow,
                TotalSyncOperations = _totalSyncOperations,
                SuccessfulSyncs = _successfulSyncs,
                FailedSyncs = _failedSyncs,
                AverageResponseTime = 0,
                TotalRecordsProcessed = _totalRecordsProcessed,
                CountyMetrics = _configuredCounties.ToDictionary(
                    county => county.Key,
                    county => county.Value.TotalParcels),
                SystemMetrics = _registeredSystems.ToDictionary(
                    system => system.Key,
                    system => system.Value.IsAvailable ? 1 : 0),
                RecentErrors = _recentEvents
                    .Where(evt => string.Equals(evt.EventType, "Error", StringComparison.OrdinalIgnoreCase))
                    .Take(10)
                    .Select(evt => evt.Message)
                    .ToList()
            };
        }
    }

    public IEnumerable<SyncEvent> GetRecentEvents(int count) =>
        _recentEvents
            .ToArray()
            .OrderByDescending(evt => evt.Timestamp)
            .Take(Math.Max(0, count))
            .ToList();

    public OrchestrationStatus CreateOrchestrationStatus()
    {
        lock (_syncRoot)
        {
            return new OrchestrationStatus
            {
                IsRunning = _isOrchestrationActive,
                StartTime = _orchestrationStartTime ?? DateTime.MinValue,
                ActiveSyncOperations = _isOrchestrationActive ? 1 : 0,
                QueuedOperations = 0,
                SystemStatus = _registeredSystems.ToDictionary(
                    system => system.Key,
                    system => system.Value.IsAvailable),
                PerformanceMetrics = new Dictionary<string, object>
                {
                    ["ConfiguredSystems"] = _registeredSystems.Count,
                    ["ConfiguredCounties"] = _configuredCounties.Count,
                    ["LastSyncTime"] = _lastSyncTime?.ToString("O") ?? string.Empty
                }
            };
        }
    }

    public DateTime? GetNextScheduledSync()
    {
        var intervals = _configuredCounties.Values
            .Select(county => county.Configuration.TryGetValue("SyncIntervalMinutes", out var value)
                ? value
                : null)
            .OfType<double>()
            .Where(value => value > 0)
            .Select(TimeSpan.FromMinutes)
            .ToList();

        if (intervals.Count == 0)
        {
            return null;
        }

        var anchor = LastSyncTime ?? DateTime.UtcNow;
        return anchor.Add(intervals.Min());
    }

    private void InitializeFromConfiguration(IConfiguration configuration)
    {
        var pacsConnection = configuration.GetConnectionString("PacsConnection")
            ?? configuration["PACS:ConnectionString"];
        var pacsSalesConnection = configuration.GetConnectionString("PacsSalesConnection")
            ?? configuration["PACS:SalesConnectionString"];

        var hasPrimaryPacs = !string.IsNullOrWhiteSpace(pacsConnection);
        var hasSalesPacs = !string.IsNullOrWhiteSpace(pacsSalesConnection);
        var hasCanonicalPacs = hasPrimaryPacs;
        var isEnabled = ResolveEnabledFlag(configuration, hasCanonicalPacs);

        if (!hasCanonicalPacs)
        {
            _logger.LogInformation("TerraFusionSync runtime started without canonical PACS configuration; no default Benton systems/counties registered.");
            return;
        }

        var systemId = "harris_pacs_canonical";
        RegisterLegacySystem(
            new LegacySystemConfig
            {
                SystemId = systemId,
                SystemName = "Harris PACS Canonical Boundary",
                SystemType = "harris_pacs",
                ConnectionString = pacsConnection!,
                EnableAutoSync = isEnabled,
                SyncInterval = ResolveSyncInterval(configuration)
            },
            isEnabled);

        var countyName = configuration["County:Name"] ?? "Benton";
        var state = configuration["County:State"] ?? "WA";
        var countyCode = configuration["County:Code"]
            ?? configuration["DefaultCounty:Code"]
            ?? "benton";
        var countyFips = configuration["County:FipsCode"] ?? "53005";

        ConfigureCounty(new CountyConfig
        {
            CountyName = NormalizeCountyName(countyName),
            State = state,
            LegacySystemId = systemId,
            EnableAutoSync = isEnabled,
            SyncInterval = ResolveSyncInterval(configuration),
            ConnectionSettings = new Dictionary<string, string>
            {
                ["CountyCode"] = countyCode,
                ["CountyFipsCode"] = countyFips,
                ["PacsConnectionConfigured"] = hasPrimaryPacs.ToString(),
                ["PacsSalesConnectionConfigured"] = hasSalesPacs.ToString()
            },
            DefaultSyncOptions = new SyncOptions
            {
                DataTypes = new List<string> { "Properties", "Assessments", "Sales", "Owners" },
                ValidateData = true,
                BatchSize = 1000
            }
        });
    }

    private static bool ResolveEnabledFlag(IConfiguration configuration, bool defaultValue)
    {
        var raw = configuration["HarrisPACS:Enabled"];
        if (bool.TryParse(raw, out var parsed))
        {
            return parsed;
        }

        return defaultValue;
    }

    private static TimeSpan ResolveSyncInterval(IConfiguration configuration)
    {
        if (int.TryParse(configuration["BentonCounty:SyncIntervalMinutes"], out var bentonMinutes) &&
            bentonMinutes > 0)
        {
            return TimeSpan.FromMinutes(bentonMinutes);
        }

        if (int.TryParse(configuration["HarrisPACS:SyncIntervalMinutes"], out var pacsMinutes) &&
            pacsMinutes > 0)
        {
            return TimeSpan.FromMinutes(pacsMinutes);
        }

        return TimeSpan.FromMinutes(15);
    }

    private static string NormalizeCountyName(string countyName) =>
        countyName.EndsWith(" County", StringComparison.OrdinalIgnoreCase)
            ? countyName[..^" County".Length]
            : countyName;

    private void AppendEvent(SyncEvent syncEvent)
    {
        syncEvent.Timestamp = syncEvent.Timestamp == default ? DateTime.UtcNow : syncEvent.Timestamp;
        _recentEvents.Enqueue(syncEvent);

        while (_recentEvents.Count > MaxRecentEvents && _recentEvents.TryDequeue(out _))
        {
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔍 PHASE 31: SystemGPT Atlas Anomaly Store Service
// In-memory store for anomaly events with query and cleanup operations
// "Government. Transcended."
// ═══════════════════════════════════════════════════════════════════════════════

using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Models;

namespace TerraFusion.AI.Services;

/// <summary>
/// Interface for storing and querying anomaly events.
/// </summary>
public interface ISystemGptAtlasAnomalyStore
{
    /// <summary>
    /// Saves an anomaly event to the store.
    /// </summary>
    void Save(SystemGptAtlasAnomalyEventDto anomaly);

    /// <summary>
    /// Saves multiple anomaly events to the store.
    /// </summary>
    void SaveBatch(IEnumerable<SystemGptAtlasAnomalyEventDto> anomalies);

    /// <summary>
    /// Retrieves recent anomalies with optional filters.
    /// </summary>
    IList<SystemGptAtlasAnomalyEventDto> GetRecent(
        string? countyId = null,
        DateTimeOffset? since = null,
        AtlasAnomalySeverity? minSeverity = null,
        int? limit = null);

    /// <summary>
    /// Gets summary statistics grouped by county.
    /// </summary>
    IList<SystemGptAtlasAnomalySummaryDto> GetSummary(DateTimeOffset? since = null);

    /// <summary>
    /// Gets summary for a specific county.
    /// </summary>
    SystemGptAtlasAnomalySummaryDto GetSummaryByCounty(string countyId);

    /// <summary>
    /// Removes anomalies older than specified age.
    /// </summary>
    /// <returns>Number of anomalies removed.</returns>
    int ClearOld(TimeSpan maxAge);

    /// <summary>
    /// Clears all anomalies from the store.
    /// </summary>
    void Clear();
}

/// <summary>
/// Thread-safe in-memory store for anomaly events.
/// </summary>
public class SystemGptAtlasAnomalyStore : ISystemGptAtlasAnomalyStore
{
    private readonly ILogger<SystemGptAtlasAnomalyStore> _logger;
    private readonly ConcurrentDictionary<Guid, SystemGptAtlasAnomalyEventDto> _anomalies = new();

    public SystemGptAtlasAnomalyStore(ILogger<SystemGptAtlasAnomalyStore> logger)
    {
        _logger = logger;
    }

    /// <inheritdoc />
    public void Save(SystemGptAtlasAnomalyEventDto anomaly)
    {
        _anomalies.AddOrUpdate(anomaly.Id, anomaly, (_, _) => anomaly);
        _logger.LogDebug(
            "Saved anomaly {Id} ({Kind}) for county {CountyId}",
            anomaly.Id, anomaly.Kind, anomaly.CountyId);
    }

    /// <inheritdoc />
    public void SaveBatch(IEnumerable<SystemGptAtlasAnomalyEventDto> anomalies)
    {
        var count = 0;
        foreach (var anomaly in anomalies)
        {
            Save(anomaly);
            count++;
        }
        _logger.LogDebug("Saved {Count} anomalies in batch", count);
    }

    /// <inheritdoc />
    public IList<SystemGptAtlasAnomalyEventDto> GetRecent(
        string? countyId = null,
        DateTimeOffset? since = null,
        AtlasAnomalySeverity? minSeverity = null,
        int? limit = null)
    {
        var query = _anomalies.Values.AsEnumerable();

        // Apply filters
        if (!string.IsNullOrEmpty(countyId))
        {
            query = query.Where(a => string.Equals(a.CountyId, countyId, StringComparison.OrdinalIgnoreCase));
        }

        if (since.HasValue)
        {
            query = query.Where(a => a.Timestamp >= since.Value);
        }

        if (minSeverity.HasValue)
        {
            query = query.Where(a => a.Severity >= minSeverity.Value);
        }

        // Sort by timestamp descending (newest first)
        query = query.OrderByDescending(a => a.Timestamp);

        // Apply limit
        if (limit.HasValue)
        {
            query = query.Take(limit.Value);
        }

        return query.ToList();
    }

    /// <inheritdoc />
    public IList<SystemGptAtlasAnomalySummaryDto> GetSummary(DateTimeOffset? since = null)
    {
        var query = _anomalies.Values.AsEnumerable();

        if (since.HasValue)
        {
            query = query.Where(a => a.Timestamp >= since.Value);
        }

        return query
            .GroupBy(a => a.CountyId, StringComparer.OrdinalIgnoreCase)
            .Select(g => CreateSummary(g.Key, g.ToList()))
            .OrderBy(s => s.CountyId)
            .ToList();
    }

    /// <inheritdoc />
    public SystemGptAtlasAnomalySummaryDto GetSummaryByCounty(string countyId)
    {
        var anomalies = _anomalies.Values
            .Where(a => string.Equals(a.CountyId, countyId, StringComparison.OrdinalIgnoreCase))
            .ToList();

        return CreateSummary(countyId, anomalies);
    }

    /// <inheritdoc />
    public int ClearOld(TimeSpan maxAge)
    {
        var cutoff = DateTimeOffset.UtcNow - maxAge;
        var toRemove = _anomalies.Values
            .Where(a => a.Timestamp < cutoff)
            .Select(a => a.Id)
            .ToList();

        var removed = 0;
        foreach (var id in toRemove)
        {
            if (_anomalies.TryRemove(id, out _))
                removed++;
        }

        if (removed > 0)
        {
            _logger.LogInformation("Cleared {Count} old anomalies (older than {MaxAge})", removed, maxAge);
        }

        return removed;
    }

    /// <inheritdoc />
    public void Clear()
    {
        var count = _anomalies.Count;
        _anomalies.Clear();
        _logger.LogInformation("Cleared all {Count} anomalies from store", count);
    }

    #region Helper Methods

    private static SystemGptAtlasAnomalySummaryDto CreateSummary(
        string countyId,
        IList<SystemGptAtlasAnomalyEventDto> anomalies)
    {
        var latest = anomalies
            .OrderByDescending(a => a.Timestamp)
            .FirstOrDefault();

        return new SystemGptAtlasAnomalySummaryDto
        {
            CountyId = countyId,
            TotalCount = anomalies.Count,
            InfoCount = anomalies.Count(a => a.Severity == AtlasAnomalySeverity.Info),
            WarningCount = anomalies.Count(a => a.Severity == AtlasAnomalySeverity.Warning),
            CriticalCount = anomalies.Count(a => a.Severity == AtlasAnomalySeverity.Critical),
            LatestTimestamp = latest?.Timestamp,
            LatestKind = latest?.Kind
        };
    }

    #endregion
}

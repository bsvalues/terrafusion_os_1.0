// ═══════════════════════════════════════════════════════════════════════════════
// 🔮 PHASE 32: SystemGPT Atlas Forecast Store
// Thread-safe in-memory storage for forecast records
// "Government. Transcended."
// ═══════════════════════════════════════════════════════════════════════════════

using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Models;

namespace TerraFusion.AI.Services;

/// <summary>
/// Interface for the Atlas Forecast Store.
/// </summary>
public interface ISystemGptAtlasForecastStore
{
    /// <summary>Saves a forecast record.</summary>
    Task SaveAsync(AtlasForecastRecord forecast);

    /// <summary>Saves multiple forecast records.</summary>
    Task SaveBatchAsync(IEnumerable<AtlasForecastRecord> forecasts);

    /// <summary>Gets recent forecasts with optional filters.</summary>
    Task<IReadOnlyList<AtlasForecastRecord>> GetRecentAsync(
        string? countyId = null,
        DateTimeOffset? since = null,
        int limit = 100);

    /// <summary>Gets a summary of the latest forecast per county.</summary>
    Task<IReadOnlyList<AtlasForecastSummary>> GetSummaryAsync();

    /// <summary>Removes forecasts older than the specified age.</summary>
    Task<int> ClearOldAsync(TimeSpan maxAge);

    /// <summary>Clears all forecasts.</summary>
    Task ClearAsync();
}

/// <summary>
/// Phase 32: Thread-safe in-memory store for forecast records.
/// Provides query capabilities with filtering and summarization.
/// </summary>
public sealed class SystemGptAtlasForecastStore : ISystemGptAtlasForecastStore
{
    private readonly ConcurrentDictionary<Guid, AtlasForecastRecord> _forecasts = new();
    private readonly ILogger<SystemGptAtlasForecastStore> _logger;
    private readonly object _writeLock = new();

    public SystemGptAtlasForecastStore(ILogger<SystemGptAtlasForecastStore> logger)
    {
        _logger = logger;
    }

    /// <inheritdoc />
    public Task SaveAsync(AtlasForecastRecord forecast)
    {
        _forecasts[forecast.Id] = forecast;
        _logger.LogDebug("Saved forecast {Id} for county {CountyId}", forecast.Id, forecast.CountyId);
        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task SaveBatchAsync(IEnumerable<AtlasForecastRecord> forecasts)
    {
        foreach (var forecast in forecasts)
        {
            _forecasts[forecast.Id] = forecast;
        }
        _logger.LogDebug("Saved batch of forecasts");
        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<AtlasForecastRecord>> GetRecentAsync(
        string? countyId = null,
        DateTimeOffset? since = null,
        int limit = 100)
    {
        var query = _forecasts.Values.AsEnumerable();

        // Apply county filter
        if (!string.IsNullOrEmpty(countyId))
        {
            query = query.Where(f => f.CountyId == countyId);
        }

        // Apply time filter
        if (since.HasValue)
        {
            query = query.Where(f => f.Timestamp >= since.Value);
        }

        // Sort by timestamp descending (newest first) and limit
        var result = query
            .OrderByDescending(f => f.Timestamp)
            .Take(limit)
            .ToList();

        return Task.FromResult<IReadOnlyList<AtlasForecastRecord>>(result);
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<AtlasForecastSummary>> GetSummaryAsync()
    {
        // Group forecasts by county, get the latest for each
        var summaries = _forecasts.Values
            .GroupBy(f => f.CountyId)
            .Select(g =>
            {
                var latest = g.OrderByDescending(f => f.Timestamp).First();
                var highestDimension = GetHighestDimension(latest.DimensionRisks);

                return new AtlasForecastSummary
                {
                    CountyId = g.Key,
                    LatestOverallRisk = latest.OverallRisk,
                    HighestDimension = highestDimension,
                    LastUpdated = latest.Timestamp,
                    ForecastCount = g.Count(),
                    RecommendedAction = latest.RecommendedAction
                };
            })
            .ToList();

        return Task.FromResult<IReadOnlyList<AtlasForecastSummary>>(summaries);
    }

    /// <inheritdoc />
    public Task<int> ClearOldAsync(TimeSpan maxAge)
    {
        var cutoff = DateTimeOffset.UtcNow - maxAge;
        var toRemove = _forecasts
            .Where(kv => kv.Value.Timestamp < cutoff)
            .Select(kv => kv.Key)
            .ToList();

        int removed = 0;
        foreach (var id in toRemove)
        {
            if (_forecasts.TryRemove(id, out _))
                removed++;
        }

        _logger.LogInformation("Cleared {Count} forecasts older than {MaxAge}", removed, maxAge);
        return Task.FromResult(removed);
    }

    /// <inheritdoc />
    public Task ClearAsync()
    {
        _forecasts.Clear();
        _logger.LogInformation("Cleared all forecasts");
        return Task.CompletedTask;
    }

    #region Helper Methods

    private static AtlasRiskDimension GetHighestDimension(
        Dictionary<AtlasRiskDimension, AtlasRiskLevel> dimensionRisks)
    {
        return dimensionRisks
            .OrderByDescending(kv => (int)kv.Value)
            .ThenBy(kv => kv.Key) // Deterministic ordering
            .First()
            .Key;
    }

    #endregion
}

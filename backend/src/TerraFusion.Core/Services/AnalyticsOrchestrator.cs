using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace TerraFusion.Core.Services;

/// <summary>
/// Snapshot of the current market state for a county.
/// </summary>
public sealed class MarketSnapshot
{
    public string CountyId { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    public decimal MedianSalePrice { get; set; }
    public decimal MeanSalePrice { get; set; }
    public int TotalActiveListing { get; set; }
    public int SalesLast30Days { get; set; }
    public int SalesLast90Days { get; set; }
    public decimal MedianDaysOnMarket { get; set; }
    public decimal AbsorptionRateMonths { get; set; }
    public string MarketCondition { get; set; } = "Normal";
    public decimal InventoryMonths { get; set; }
    public Dictionary<string, decimal> MetricsByPropertyType { get; set; } = new();
    public List<string> Alerts { get; set; } = new();
    public DataSourceStatus DataSources { get; set; } = new();
}

/// <summary>
/// Availability status of external data sources.
/// </summary>
public sealed class DataSourceStatus
{
    public bool MarketDataAvailable { get; set; }
    public bool CensusDataAvailable { get; set; }
    public bool WeatherDataAvailable { get; set; }
    public DateTime? MarketDataAsOf { get; set; }
    public DateTime? CensusDataAsOf { get; set; }
    public DateTime? WeatherDataAsOf { get; set; }
}

/// <summary>
/// Contract for the analytics orchestrator that coordinates connectors, validators,
/// enrichers, and monitors into a unified analysis pipeline.
/// Absorbed from BIV-005, TFT-066.
/// </summary>
public interface IAnalyticsOrchestrator
{
    /// <summary>
    /// Generates a comprehensive market snapshot for a county by pulling data from all
    /// connected subsystems (market connector, census connector, weather connector, market monitor).
    /// Results are cached for the specified duration.
    /// </summary>
    Task<MarketSnapshot> GenerateMarketSnapshotAsync(string countyId, CancellationToken ct = default);

    /// <summary>
    /// Forces a refresh of cached data for a county, bypassing cache.
    /// </summary>
    Task<MarketSnapshot> RefreshMarketSnapshotAsync(string countyId, CancellationToken ct = default);

    /// <summary>
    /// Returns the timestamp of the most recent cached snapshot for a county, or null if none exists.
    /// </summary>
    Task<DateTime?> GetLastSnapshotTimeAsync(string countyId);
}

/// <summary>
/// Orchestrates analytics subsystems: market connectors, census connectors, weather connectors,
/// and market monitors. Caches assembled snapshots to avoid redundant external calls.
/// Lineage: BIV-005, TFT-066.
/// </summary>
public sealed class AnalyticsOrchestrator : IAnalyticsOrchestrator
{
    private readonly ILogger<AnalyticsOrchestrator> _logger;
    private readonly IMemoryCache _cache;
    private static readonly TimeSpan DefaultCacheDuration = TimeSpan.FromMinutes(30);

    public AnalyticsOrchestrator(ILogger<AnalyticsOrchestrator> logger, IMemoryCache cache)
    {
        _logger = logger;
        _cache = cache;
    }

    /// <inheritdoc />
    public async Task<MarketSnapshot> GenerateMarketSnapshotAsync(
        string countyId, CancellationToken ct = default)
    {
        string cacheKey = $"MarketSnapshot:{countyId}";

        if (_cache.TryGetValue<MarketSnapshot>(cacheKey, out var cached) && cached is not null)
        {
            _logger.LogDebug("Returning cached market snapshot for {CountyId}", countyId);
            return cached;
        }

        return await BuildAndCacheSnapshotAsync(countyId, cacheKey, ct);
    }

    /// <inheritdoc />
    public async Task<MarketSnapshot> RefreshMarketSnapshotAsync(
        string countyId, CancellationToken ct = default)
    {
        string cacheKey = $"MarketSnapshot:{countyId}";
        _cache.Remove(cacheKey);
        _logger.LogInformation("Cache cleared for {CountyId}, rebuilding snapshot", countyId);
        return await BuildAndCacheSnapshotAsync(countyId, cacheKey, ct);
    }

    /// <inheritdoc />
    public Task<DateTime?> GetLastSnapshotTimeAsync(string countyId)
    {
        string cacheKey = $"MarketSnapshot:{countyId}";
        if (_cache.TryGetValue<MarketSnapshot>(cacheKey, out var cached) && cached is not null)
        {
            return Task.FromResult<DateTime?>(cached.GeneratedAt);
        }
        return Task.FromResult<DateTime?>(null);
    }

    // ──────────────────────────────────────────────────────────────
    // Internal assembly pipeline
    // ──────────────────────────────────────────────────────────────

    private async Task<MarketSnapshot> BuildAndCacheSnapshotAsync(
        string countyId, string cacheKey, CancellationToken ct)
    {
        _logger.LogInformation("Building market snapshot for {CountyId}", countyId);
        var sw = System.Diagnostics.Stopwatch.StartNew();

        var snapshot = new MarketSnapshot { CountyId = countyId };
        var alerts = new List<string>();

        // ── Pull market data ──
        try
        {
            // In production, inject IMarketConnector and call SearchListingsAsync
            var marketData = await FetchMarketDataAsync(countyId, ct);
            snapshot.MedianSalePrice = marketData.MedianPrice;
            snapshot.MeanSalePrice = marketData.MeanPrice;
            snapshot.TotalActiveListing = marketData.ActiveListings;
            snapshot.SalesLast30Days = marketData.RecentSales30;
            snapshot.SalesLast90Days = marketData.RecentSales90;
            snapshot.MedianDaysOnMarket = marketData.MedianDOM;
            snapshot.DataSources.MarketDataAvailable = true;
            snapshot.DataSources.MarketDataAsOf = DateTime.UtcNow;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Market data unavailable for {CountyId}", countyId);
            alerts.Add("Market data source temporarily unavailable.");
            snapshot.DataSources.MarketDataAvailable = false;
        }

        // ── Compute derived metrics ──
        if (snapshot.SalesLast30Days > 0 && snapshot.TotalActiveListing > 0)
        {
            snapshot.AbsorptionRateMonths = Math.Round(
                (decimal)snapshot.TotalActiveListing / snapshot.SalesLast30Days, 2);
            snapshot.InventoryMonths = snapshot.AbsorptionRateMonths;
        }

        // ── Determine market condition ──
        snapshot.MarketCondition = snapshot.AbsorptionRateMonths switch
        {
            < 3m => "Hot",      // Seller's market
            < 6m => "Normal",   // Balanced market
            _ => "Cold",        // Buyer's market
        };

        if (snapshot.MarketCondition == "Hot")
            alerts.Add("Hot market detected: absorption rate below 3 months.");
        if (snapshot.MarketCondition == "Cold")
            alerts.Add("Cold market detected: absorption rate above 6 months.");

        // ── Pull census enrichment data ──
        try
        {
            // In production, inject ICensusConnector
            snapshot.DataSources.CensusDataAvailable = true;
            snapshot.DataSources.CensusDataAsOf = DateTime.UtcNow.AddDays(-30); // ACS data lags
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Census data unavailable for {CountyId}", countyId);
            snapshot.DataSources.CensusDataAvailable = false;
        }

        // ── Pull weather context ──
        try
        {
            snapshot.DataSources.WeatherDataAvailable = true;
            snapshot.DataSources.WeatherDataAsOf = DateTime.UtcNow;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Weather data unavailable for {CountyId}", countyId);
            snapshot.DataSources.WeatherDataAvailable = false;
        }

        snapshot.Alerts = alerts;
        sw.Stop();

        _logger.LogInformation(
            "Market snapshot built for {CountyId} in {Elapsed}ms: median={MedianPrice:C0}, condition={Condition}",
            countyId, sw.ElapsedMilliseconds, snapshot.MedianSalePrice, snapshot.MarketCondition);

        // Cache the result
        _cache.Set(cacheKey, snapshot, DefaultCacheDuration);

        return snapshot;
    }

    // ──────────────────────────────────────────────────────────────
    // Simulated data fetchers (replaced by injected connectors in production)
    // ──────────────────────────────────────────────────────────────

    private static Task<(decimal MedianPrice, decimal MeanPrice, int ActiveListings, int RecentSales30, int RecentSales90, decimal MedianDOM)>
        FetchMarketDataAsync(string countyId, CancellationToken ct)
    {
        var rng = new Random(countyId.GetHashCode());
        return Task.FromResult((
            MedianPrice: 320000m + rng.Next(-40000, 60000),
            MeanPrice: 355000m + rng.Next(-30000, 70000),
            ActiveListings: rng.Next(200, 800),
            RecentSales30: rng.Next(40, 150),
            RecentSales90: rng.Next(120, 400),
            MedianDOM: 15m + rng.Next(0, 45)
        ));
    }
}

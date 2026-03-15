using Microsoft.Extensions.Logging;

namespace TerraFusion.Core.Services;

/// <summary>
/// Current market condition classification.
/// </summary>
public enum MarketConditionType
{
    Hot,
    Normal,
    Cold
}

/// <summary>
/// A point-in-time capture of key market health metrics.
/// </summary>
public sealed class MarketMetricSnapshot
{
    public string CountyId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public decimal MedianSalePrice { get; set; }
    public decimal MeanSalePrice { get; set; }
    public decimal MedianDaysOnMarket { get; set; }
    public int ActiveInventory { get; set; }
    public decimal AbsorptionRateMonths { get; set; }
    public decimal ListToSaleRatio { get; set; }
    public int NewListings30Days { get; set; }
    public int ClosedSales30Days { get; set; }
    public int PendingSales { get; set; }
    public decimal MedianPricePerSqFt { get; set; }
    public MarketConditionType Condition { get; set; } = MarketConditionType.Normal;
}

/// <summary>
/// An alert generated when a market metric crosses a threshold.
/// </summary>
public sealed class MarketAlert
{
    public string AlertId { get; set; } = Guid.NewGuid().ToString("N")[..12];
    public string CountyId { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    public string MetricName { get; set; } = string.Empty;
    public decimal CurrentValue { get; set; }
    public decimal ThresholdValue { get; set; }
    public string Direction { get; set; } = string.Empty; // "Above" or "Below"
    public string Severity { get; set; } = "Info";        // Info, Warning, Critical
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// Market trend analysis result.
/// </summary>
public sealed class MarketTrendAnalysis
{
    public string CountyId { get; set; } = string.Empty;
    public string TrendDirection { get; set; } = "Stable";
    public decimal MonthOverMonthChange { get; set; }
    public decimal YearOverYearChange { get; set; }
    public decimal AnnualizedAppreciation { get; set; }
    public int ConsecutiveMonthsInTrend { get; set; }
    public List<MarketMetricSnapshot> RecentSnapshots { get; set; } = new();
    public List<MarketAlert> ActiveAlerts { get; set; } = new();
}

/// <summary>
/// Contract for market condition monitoring and alert generation.
/// Absorbed from BIV-020.
/// </summary>
public interface IMarketMonitor
{
    /// <summary>
    /// Captures a current snapshot of market metrics for a county.
    /// </summary>
    Task<MarketMetricSnapshot> CaptureSnapshotAsync(string countyId, CancellationToken ct = default);

    /// <summary>
    /// Analyzes market trends over the specified lookback period.
    /// </summary>
    Task<MarketTrendAnalysis> AnalyzeTrendsAsync(string countyId, int lookbackMonths = 12, CancellationToken ct = default);

    /// <summary>
    /// Evaluates current metrics against alert thresholds and returns any triggered alerts.
    /// </summary>
    Task<List<MarketAlert>> CheckAlertsAsync(string countyId, CancellationToken ct = default);

    /// <summary>
    /// Returns the current market condition classification (hot/normal/cold).
    /// </summary>
    Task<MarketConditionType> GetMarketConditionAsync(string countyId, CancellationToken ct = default);
}

/// <summary>
/// Monitors market conditions by tracking key metrics (median price, DOM, inventory,
/// absorption rate) and generating alerts when thresholds are crossed. Used by assessor
/// offices to detect market shifts that may trigger revaluation cycles.
/// Lineage: BIV-020.
/// </summary>
public sealed class MarketMonitor : IMarketMonitor
{
    private readonly ILogger<MarketMonitor> _logger;

    // Alert threshold configuration (would come from IConfiguration in production)
    private static readonly Dictionary<string, (decimal Low, decimal High, string Severity)> Thresholds = new()
    {
        ["AbsorptionRateMonths"] = (2.0m, 8.0m, "Warning"),
        ["MedianDaysOnMarket"] = (7m, 90m, "Warning"),
        ["ListToSaleRatio"] = (0.90m, 1.05m, "Info"),
        ["MedianPricePerSqFt"] = (80m, 500m, "Info"),
        ["YearOverYearPriceChange"] = (-0.10m, 0.20m, "Critical"),
    };

    // In-memory snapshot history (in production, persisted to database)
    private readonly List<MarketMetricSnapshot> _snapshotHistory = new();
    private readonly object _historyLock = new();

    public MarketMonitor(ILogger<MarketMonitor> logger)
    {
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<MarketMetricSnapshot> CaptureSnapshotAsync(
        string countyId, CancellationToken ct = default)
    {
        _logger.LogInformation("Capturing market snapshot for {CountyId}", countyId);

        // In production, pull from IMarketConnector and local sales database
        var rng = new Random(HashCode.Combine(countyId, DateTime.UtcNow.Date));

        int closedSales = rng.Next(50, 160);
        int activeInventory = rng.Next(200, 700);

        var snapshot = new MarketMetricSnapshot
        {
            CountyId = countyId,
            MedianSalePrice = 310000m + rng.Next(-30000, 50000),
            MeanSalePrice = 345000m + rng.Next(-25000, 60000),
            MedianDaysOnMarket = 18m + rng.Next(0, 40),
            ActiveInventory = activeInventory,
            AbsorptionRateMonths = closedSales > 0 ? Math.Round((decimal)activeInventory / closedSales, 2) : 99m,
            ListToSaleRatio = 0.95m + (decimal)(rng.NextDouble() * 0.08 - 0.02),
            NewListings30Days = rng.Next(60, 200),
            ClosedSales30Days = closedSales,
            PendingSales = rng.Next(30, 120),
            MedianPricePerSqFt = 160m + rng.Next(-30, 60),
        };

        snapshot.Condition = ClassifyCondition(snapshot.AbsorptionRateMonths, snapshot.MedianDaysOnMarket);

        lock (_historyLock)
        {
            _snapshotHistory.Add(snapshot);
            // Keep last 36 months of snapshots
            if (_snapshotHistory.Count > 36)
                _snapshotHistory.RemoveRange(0, _snapshotHistory.Count - 36);
        }

        _logger.LogInformation(
            "Snapshot captured for {CountyId}: median={Median:C0}, DOM={DOM}, condition={Condition}",
            countyId, snapshot.MedianSalePrice, snapshot.MedianDaysOnMarket, snapshot.Condition);

        return await Task.FromResult(snapshot);
    }

    /// <inheritdoc />
    public async Task<MarketTrendAnalysis> AnalyzeTrendsAsync(
        string countyId, int lookbackMonths = 12, CancellationToken ct = default)
    {
        _logger.LogInformation("Analyzing trends for {CountyId} over {Months} months", countyId, lookbackMonths);

        // Ensure we have recent snapshots
        List<MarketMetricSnapshot> history;
        lock (_historyLock)
        {
            history = _snapshotHistory
                .Where(s => s.CountyId == countyId)
                .OrderByDescending(s => s.Timestamp)
                .Take(lookbackMonths)
                .OrderBy(s => s.Timestamp)
                .ToList();
        }

        // If insufficient history, generate some
        if (history.Count < 3)
        {
            for (int i = 0; i < lookbackMonths; i++)
            {
                var snap = await CaptureSnapshotAsync(countyId, ct);
                snap.Timestamp = DateTime.UtcNow.AddMonths(-lookbackMonths + i);
            }
            lock (_historyLock)
            {
                history = _snapshotHistory
                    .Where(s => s.CountyId == countyId)
                    .OrderBy(s => s.Timestamp)
                    .ToList();
            }
        }

        decimal momChange = 0m, yoyChange = 0m;
        if (history.Count >= 2)
        {
            var latest = history.Last();
            var prevMonth = history[^2];
            momChange = prevMonth.MedianSalePrice > 0
                ? (latest.MedianSalePrice - prevMonth.MedianSalePrice) / prevMonth.MedianSalePrice
                : 0m;

            if (history.Count >= 12)
            {
                var yearAgo = history[^12];
                yoyChange = yearAgo.MedianSalePrice > 0
                    ? (latest.MedianSalePrice - yearAgo.MedianSalePrice) / yearAgo.MedianSalePrice
                    : 0m;
            }
        }

        // Count consecutive months in same direction
        int consecutiveMonths = 1;
        if (history.Count >= 2)
        {
            bool lastWasUp = history[^1].MedianSalePrice > history[^2].MedianSalePrice;
            for (int i = history.Count - 2; i >= 1; i--)
            {
                bool isUp = history[i].MedianSalePrice > history[i - 1].MedianSalePrice;
                if (isUp == lastWasUp) consecutiveMonths++;
                else break;
            }
        }

        string trendDirection = momChange switch
        {
            > 0.005m => "Appreciating",
            < -0.005m => "Declining",
            _ => "Stable",
        };

        var alerts = await CheckAlertsAsync(countyId, ct);

        return new MarketTrendAnalysis
        {
            CountyId = countyId,
            TrendDirection = trendDirection,
            MonthOverMonthChange = Math.Round(momChange, 4),
            YearOverYearChange = Math.Round(yoyChange, 4),
            AnnualizedAppreciation = Math.Round(momChange * 12m, 4),
            ConsecutiveMonthsInTrend = consecutiveMonths,
            RecentSnapshots = history.TakeLast(6).ToList(),
            ActiveAlerts = alerts,
        };
    }

    /// <inheritdoc />
    public async Task<List<MarketAlert>> CheckAlertsAsync(
        string countyId, CancellationToken ct = default)
    {
        var alerts = new List<MarketAlert>();
        MarketMetricSnapshot? latest;

        lock (_historyLock)
        {
            latest = _snapshotHistory
                .Where(s => s.CountyId == countyId)
                .OrderByDescending(s => s.Timestamp)
                .FirstOrDefault();
        }

        if (latest is null) return alerts;

        // Check absorption rate
        CheckThreshold(alerts, countyId, "AbsorptionRateMonths", latest.AbsorptionRateMonths);

        // Check days on market
        CheckThreshold(alerts, countyId, "MedianDaysOnMarket", latest.MedianDaysOnMarket);

        // Check list-to-sale ratio
        CheckThreshold(alerts, countyId, "ListToSaleRatio", latest.ListToSaleRatio);

        // Check price per sq ft
        CheckThreshold(alerts, countyId, "MedianPricePerSqFt", latest.MedianPricePerSqFt);

        if (alerts.Count > 0)
        {
            _logger.LogWarning("{AlertCount} market alerts triggered for {CountyId}", alerts.Count, countyId);
        }

        return await Task.FromResult(alerts);
    }

    /// <inheritdoc />
    public async Task<MarketConditionType> GetMarketConditionAsync(
        string countyId, CancellationToken ct = default)
    {
        MarketMetricSnapshot? latest;
        lock (_historyLock)
        {
            latest = _snapshotHistory
                .Where(s => s.CountyId == countyId)
                .OrderByDescending(s => s.Timestamp)
                .FirstOrDefault();
        }

        if (latest is null)
        {
            latest = await CaptureSnapshotAsync(countyId, ct);
        }

        return latest.Condition;
    }

    // ──────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────

    private static MarketConditionType ClassifyCondition(decimal absorptionRate, decimal medianDOM)
    {
        // IAAO/NAR classification rubric
        if (absorptionRate < 3m || medianDOM < 14m)
            return MarketConditionType.Hot;
        if (absorptionRate > 6m || medianDOM > 60m)
            return MarketConditionType.Cold;
        return MarketConditionType.Normal;
    }

    private static void CheckThreshold(
        List<MarketAlert> alerts, string countyId, string metricName, decimal currentValue)
    {
        if (!Thresholds.TryGetValue(metricName, out var threshold)) return;

        if (currentValue < threshold.Low)
        {
            alerts.Add(new MarketAlert
            {
                CountyId = countyId,
                MetricName = metricName,
                CurrentValue = currentValue,
                ThresholdValue = threshold.Low,
                Direction = "Below",
                Severity = threshold.Severity,
                Message = $"{metricName} ({currentValue:F2}) is below threshold ({threshold.Low:F2}).",
            });
        }
        else if (currentValue > threshold.High)
        {
            alerts.Add(new MarketAlert
            {
                CountyId = countyId,
                MetricName = metricName,
                CurrentValue = currentValue,
                ThresholdValue = threshold.High,
                Direction = "Above",
                Severity = threshold.Severity,
                Message = $"{metricName} ({currentValue:F2}) exceeds threshold ({threshold.High:F2}).",
            });
        }
    }
}

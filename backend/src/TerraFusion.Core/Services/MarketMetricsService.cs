using Microsoft.Extensions.Logging;

namespace TerraFusion.Core.Services;

/// <summary>
/// Computed market metrics for a property segment.
/// </summary>
public sealed class MarketMetrics
{
    public string CountyId { get; set; } = string.Empty;
    public string? NeighborhoodCode { get; set; }
    public string PropertyType { get; set; } = "Residential";
    public DateTime ComputedAt { get; set; } = DateTime.UtcNow;
    public int SampleSize { get; set; }

    // Central tendency
    public decimal Median { get; set; }
    public decimal Mean { get; set; }
    public decimal TrimmedMean { get; set; }

    // Dispersion
    public decimal StandardDeviation { get; set; }
    public decimal CoefficientOfVariation { get; set; }
    public decimal InterquartileRange { get; set; }
    public decimal Percentile25 { get; set; }
    public decimal Percentile75 { get; set; }
    public decimal Percentile90 { get; set; }

    // Range
    public decimal Minimum { get; set; }
    public decimal Maximum { get; set; }

    // Trend
    public string TrendDirection { get; set; } = "Stable";
    public decimal TrendSlope { get; set; }
    public decimal MonthOverMonthChange { get; set; }
    public decimal YearOverYearChange { get; set; }
}

/// <summary>
/// Trend detection result.
/// </summary>
public sealed class TrendResult
{
    public string TrendDirection { get; set; } = "Stable";
    public decimal Slope { get; set; }
    public decimal RSquared { get; set; }
    public int DataPoints { get; set; }
    public decimal ConfidenceLevel { get; set; }
    public string Interpretation { get; set; } = string.Empty;
}

/// <summary>
/// Contract for market metrics computation and trend detection.
/// Absorbed from BIV-070, TFT-184.
/// </summary>
public interface IMarketMetricsService
{
    /// <summary>
    /// Computes descriptive statistics (median, mean, std dev, quartiles, CV) for sale
    /// prices in the specified segment.
    /// </summary>
    Task<MarketMetrics> ComputeMetricsAsync(
        string countyId,
        string propertyType = "Residential",
        string? neighborhoodCode = null,
        int lookbackDays = 365,
        CancellationToken ct = default);

    /// <summary>
    /// Detects the predominant price trend (appreciating, stable, or declining) using
    /// linear regression on time-series data.
    /// </summary>
    Task<TrendResult> DetectTrendAsync(
        string countyId,
        string propertyType = "Residential",
        string? neighborhoodCode = null,
        int lookbackMonths = 12,
        CancellationToken ct = default);

    /// <summary>
    /// Computes the predicted median price for a future date based on current trend.
    /// </summary>
    Task<decimal> PredictMedianPriceAsync(
        string countyId,
        string propertyType,
        int monthsAhead,
        CancellationToken ct = default);
}

/// <summary>
/// Computes descriptive statistics, trend detection, and simple forward predictions
/// for market sale prices. Designed for assessor offices needing quantitative market
/// analysis for valuation support and appeal defense.
/// Lineage: BIV-070, TFT-184.
/// </summary>
public sealed class MarketMetricsService : IMarketMetricsService
{
    private readonly ILogger<MarketMetricsService> _logger;

    public MarketMetricsService(ILogger<MarketMetricsService> logger)
    {
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<MarketMetrics> ComputeMetricsAsync(
        string countyId,
        string propertyType = "Residential",
        string? neighborhoodCode = null,
        int lookbackDays = 365,
        CancellationToken ct = default)
    {
        _logger.LogInformation(
            "Computing market metrics for {CountyId}/{PropertyType}/{Neighborhood}, lookback {Days}d",
            countyId, propertyType, neighborhoodCode ?? "ALL", lookbackDays);

        // In production, query recent arm's-length sales from TerraFusionDbContext
        var salePrices = GenerateSampleSalePrices(countyId, propertyType, neighborhoodCode, lookbackDays);

        if (salePrices.Count == 0)
        {
            _logger.LogWarning("No sales data available for {CountyId}/{PropertyType}", countyId, propertyType);
            return new MarketMetrics { CountyId = countyId, PropertyType = propertyType, SampleSize = 0 };
        }

        salePrices.Sort();
        int n = salePrices.Count;

        decimal median = Percentile(salePrices, 0.50);
        decimal mean = salePrices.Average();
        decimal trimmedMean = ComputeTrimmedMean(salePrices, 0.10m);

        decimal variance = salePrices.Average(p => (p - mean) * (p - mean));
        decimal stdDev = (decimal)Math.Sqrt((double)variance);
        decimal cv = mean > 0 ? stdDev / mean * 100m : 0m;

        decimal p25 = Percentile(salePrices, 0.25);
        decimal p75 = Percentile(salePrices, 0.75);
        decimal p90 = Percentile(salePrices, 0.90);

        // Rough trend from first half vs. second half medians
        var firstHalf = salePrices.Take(n / 2).ToList();
        var secondHalf = salePrices.Skip(n / 2).ToList();
        decimal firstMedian = firstHalf.Count > 0 ? Percentile(firstHalf, 0.50) : 0;
        decimal secondMedian = secondHalf.Count > 0 ? Percentile(secondHalf, 0.50) : 0;
        decimal momChange = firstMedian > 0 ? (secondMedian - firstMedian) / firstMedian : 0;

        string trendDir = momChange switch
        {
            > 0.02m => "Appreciating",
            < -0.02m => "Declining",
            _ => "Stable",
        };

        var metrics = new MarketMetrics
        {
            CountyId = countyId,
            NeighborhoodCode = neighborhoodCode,
            PropertyType = propertyType,
            SampleSize = n,
            Median = Math.Round(median, 2),
            Mean = Math.Round(mean, 2),
            TrimmedMean = Math.Round(trimmedMean, 2),
            StandardDeviation = Math.Round(stdDev, 2),
            CoefficientOfVariation = Math.Round(cv, 2),
            InterquartileRange = Math.Round(p75 - p25, 2),
            Percentile25 = Math.Round(p25, 2),
            Percentile75 = Math.Round(p75, 2),
            Percentile90 = Math.Round(p90, 2),
            Minimum = salePrices.First(),
            Maximum = salePrices.Last(),
            TrendDirection = trendDir,
            TrendSlope = Math.Round(momChange, 4),
            MonthOverMonthChange = Math.Round(momChange, 4),
        };

        _logger.LogInformation(
            "Metrics computed: n={N}, median={Median:C0}, CV={CV:F1}%, trend={Trend}",
            n, metrics.Median, metrics.CoefficientOfVariation, metrics.TrendDirection);

        return await Task.FromResult(metrics);
    }

    /// <inheritdoc />
    public async Task<TrendResult> DetectTrendAsync(
        string countyId,
        string propertyType = "Residential",
        string? neighborhoodCode = null,
        int lookbackMonths = 12,
        CancellationToken ct = default)
    {
        _logger.LogInformation(
            "Detecting trend for {CountyId}/{PropertyType} over {Months} months",
            countyId, propertyType, lookbackMonths);

        // Generate monthly median prices for regression
        var monthlyMedians = GenerateMonthlyMedians(countyId, propertyType, neighborhoodCode, lookbackMonths);
        int n = monthlyMedians.Count;

        if (n < 3)
        {
            return new TrendResult
            {
                DataPoints = n,
                Interpretation = "Insufficient data for trend detection (need at least 3 months).",
            };
        }

        // Simple linear regression: y = slope * x + intercept
        double[] x = Enumerable.Range(0, n).Select(i => (double)i).ToArray();
        double[] y = monthlyMedians.Select(p => (double)p).ToArray();

        double xMean = x.Average();
        double yMean = y.Average();
        double ssXY = x.Zip(y, (xi, yi) => (xi - xMean) * (yi - yMean)).Sum();
        double ssXX = x.Sum(xi => (xi - xMean) * (xi - xMean));
        double slope = ssXX > 0 ? ssXY / ssXX : 0;
        double intercept = yMean - slope * xMean;

        // R-squared
        double ssTot = y.Sum(yi => (yi - yMean) * (yi - yMean));
        double ssRes = x.Zip(y, (xi, yi) => Math.Pow(yi - (slope * xi + intercept), 2)).Sum();
        double rSquared = ssTot > 0 ? 1.0 - ssRes / ssTot : 0;

        decimal decimalSlope = (decimal)slope;
        decimal lastValue = monthlyMedians.Last();
        decimal monthlyPctChange = lastValue > 0 ? decimalSlope / lastValue : 0;

        string direction = monthlyPctChange switch
        {
            > 0.003m => "Appreciating",
            < -0.003m => "Declining",
            _ => "Stable",
        };

        string interpretation = direction switch
        {
            "Appreciating" => $"Market is appreciating at approximately {monthlyPctChange * 12:P1} annually (R²={rSquared:F3}).",
            "Declining" => $"Market is declining at approximately {Math.Abs(monthlyPctChange * 12):P1} annually (R²={rSquared:F3}).",
            _ => $"Market is stable with minimal price movement (R²={rSquared:F3}).",
        };

        var result = new TrendResult
        {
            TrendDirection = direction,
            Slope = Math.Round(decimalSlope, 2),
            RSquared = Math.Round((decimal)rSquared, 4),
            DataPoints = n,
            ConfidenceLevel = Math.Round((decimal)Math.Min(rSquared + 0.5, 1.0), 4),
            Interpretation = interpretation,
        };

        _logger.LogInformation("Trend detected: {Direction}, slope={Slope:F2}/month, R²={R2:F3}",
            direction, slope, rSquared);

        return await Task.FromResult(result);
    }

    /// <inheritdoc />
    public async Task<decimal> PredictMedianPriceAsync(
        string countyId, string propertyType, int monthsAhead, CancellationToken ct = default)
    {
        var trend = await DetectTrendAsync(countyId, propertyType, lookbackMonths: 12, ct: ct);
        var metrics = await ComputeMetricsAsync(countyId, propertyType, ct: ct);

        decimal predicted = metrics.Median + trend.Slope * monthsAhead;
        return Math.Round(Math.Max(predicted, 0), 2);
    }

    // ──────────────────────────────────────────────────────────────
    // Statistical helpers
    // ──────────────────────────────────────────────────────────────

    private static decimal Percentile(List<decimal> sorted, double p)
    {
        if (sorted.Count == 0) return 0;
        double rank = p * (sorted.Count - 1);
        int lower = (int)Math.Floor(rank);
        int upper = Math.Min(lower + 1, sorted.Count - 1);
        decimal frac = (decimal)(rank - lower);
        return sorted[lower] + frac * (sorted[upper] - sorted[lower]);
    }

    private static decimal ComputeTrimmedMean(List<decimal> sorted, decimal trimPct)
    {
        int trimCount = (int)(sorted.Count * trimPct);
        if (trimCount * 2 >= sorted.Count) return sorted.Average();
        var trimmed = sorted.Skip(trimCount).Take(sorted.Count - 2 * trimCount).ToList();
        return trimmed.Count > 0 ? trimmed.Average() : sorted.Average();
    }

    // ──────────────────────────────────────────────────────────────
    // Sample data generators (replaced by DB queries in production)
    // ──────────────────────────────────────────────────────────────

    private static List<decimal> GenerateSampleSalePrices(
        string countyId, string propertyType, string? neighborhoodCode, int lookbackDays)
    {
        var rng = new Random(HashCode.Combine(countyId, propertyType, neighborhoodCode ?? ""));
        decimal basePrice = propertyType switch
        {
            "Commercial" => 480000m,
            "MultiFamily" => 390000m,
            "Agricultural" => 250000m,
            _ => 320000m,
        };

        int count = Math.Max(lookbackDays / 3, 30); // ~1 sale every 3 days
        return Enumerable.Range(0, count)
            .Select(_ =>
            {
                decimal noise = basePrice * (decimal)(rng.NextDouble() * 0.60 - 0.30);
                return Math.Round(Math.Max(basePrice + noise, 50000m), 2);
            })
            .ToList();
    }

    private static List<decimal> GenerateMonthlyMedians(
        string countyId, string propertyType, string? neighborhoodCode, int months)
    {
        var rng = new Random(HashCode.Combine(countyId, propertyType, neighborhoodCode ?? "", months));
        decimal basePrice = propertyType switch
        {
            "Commercial" => 460000m,
            _ => 310000m,
        };

        decimal trend = basePrice * 0.004m; // ~4.8% annual appreciation
        return Enumerable.Range(0, months)
            .Select(m =>
            {
                decimal seasonal = basePrice * 0.015m * (decimal)Math.Sin(2 * Math.PI * m / 12.0);
                decimal noise = basePrice * (decimal)(rng.NextDouble() * 0.03 - 0.015);
                return Math.Round(basePrice + trend * m + seasonal + noise, 2);
            })
            .ToList();
    }
}

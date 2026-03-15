using Microsoft.Extensions.Logging;

namespace TerraFusion.AI.Services;

/// <summary>
/// A market prediction with confidence intervals.
/// </summary>
public sealed class MarketPrediction
{
    public string CountyId { get; set; } = string.Empty;
    public string? NeighborhoodCode { get; set; }
    public string PropertyType { get; set; } = "Residential";
    public DateTime PredictionDate { get; set; } = DateTime.UtcNow;
    public int HorizonMonths { get; set; }
    public List<PredictionPoint> ForecastPoints { get; set; } = new();
    public decimal AnnualizedAppreciationRate { get; set; }
    public string TrendDirection { get; set; } = "Stable";
    public decimal OverallConfidence { get; set; }
    public string Methodology { get; set; } = string.Empty;
}

/// <summary>
/// A single point on the forecast timeline.
/// </summary>
public sealed class PredictionPoint
{
    public DateTime Date { get; set; }
    public decimal PredictedMedianPrice { get; set; }
    public decimal LowerBound { get; set; }
    public decimal UpperBound { get; set; }
    public decimal ConfidenceLevel { get; set; }
}

/// <summary>
/// Contract for market prediction operations.
/// Absorbed from TFT-184.
/// </summary>
public interface IMarketPredictorService
{
    /// <summary>
    /// Generates a market forecast for the specified county and property type over the given horizon.
    /// Uses exponential smoothing with trend extrapolation and computes confidence intervals.
    /// </summary>
    Task<MarketPrediction> PredictMarketAsync(
        string countyId,
        string propertyType = "Residential",
        int horizonMonths = 12,
        string? neighborhoodCode = null,
        CancellationToken ct = default);
}

/// <summary>
/// Market prediction service using exponential smoothing with trend extrapolation.
/// Generates forward-looking price forecasts with widening confidence intervals
/// for county assessor offices planning revaluation cycles.
/// Lineage: TFT-184.
/// </summary>
public sealed class MarketPredictorService : IMarketPredictorService
{
    private readonly ILogger<MarketPredictorService> _logger;

    // Smoothing parameters
    private const double Alpha = 0.3;  // Level smoothing
    private const double Beta = 0.1;   // Trend smoothing
    private const double BaseConfidence = 0.90;

    public MarketPredictorService(ILogger<MarketPredictorService> logger)
    {
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<MarketPrediction> PredictMarketAsync(
        string countyId,
        string propertyType = "Residential",
        int horizonMonths = 12,
        string? neighborhoodCode = null,
        CancellationToken ct = default)
    {
        _logger.LogInformation(
            "Generating {Horizon}-month market prediction for {CountyId} ({PropertyType})",
            horizonMonths, countyId, propertyType);

        // In production, pull historical median sale prices from the database.
        var historicalPrices = GenerateHistoricalPrices(countyId, propertyType, neighborhoodCode);

        // Double exponential smoothing (Holt's method)
        var (level, trend, residualStdDev) = FitHoltModel(historicalPrices);

        // Generate forecast points with widening confidence intervals
        var forecastPoints = new List<PredictionPoint>();
        DateTime startDate = DateTime.UtcNow;

        for (int m = 1; m <= horizonMonths; m++)
        {
            ct.ThrowIfCancellationRequested();

            decimal predicted = (decimal)(level + trend * m);
            predicted = Math.Max(predicted, 0);

            // Confidence interval widens with forecast horizon
            double intervalWidth = residualStdDev * 1.96 * Math.Sqrt(m);
            decimal lower = (decimal)Math.Max((double)predicted - intervalWidth, 0);
            decimal upper = (decimal)((double)predicted + intervalWidth);

            // Confidence decreases with horizon
            decimal confidence = (decimal)(BaseConfidence * Math.Exp(-0.02 * m));

            forecastPoints.Add(new PredictionPoint
            {
                Date = startDate.AddMonths(m),
                PredictedMedianPrice = Math.Round(predicted, 2),
                LowerBound = Math.Round(lower, 2),
                UpperBound = Math.Round(upper, 2),
                ConfidenceLevel = Math.Round(confidence, 4),
            });
        }

        // Compute annualized appreciation from the trend
        decimal lastHistorical = historicalPrices.Last();
        decimal annualizedRate = lastHistorical > 0
            ? (decimal)(trend * 12.0) / lastHistorical
            : 0m;

        string trendDirection = annualizedRate switch
        {
            > 0.03m => "Appreciating",
            < -0.03m => "Declining",
            _ => "Stable",
        };

        var prediction = new MarketPrediction
        {
            CountyId = countyId,
            NeighborhoodCode = neighborhoodCode,
            PropertyType = propertyType,
            HorizonMonths = horizonMonths,
            ForecastPoints = forecastPoints,
            AnnualizedAppreciationRate = Math.Round(annualizedRate, 4),
            TrendDirection = trendDirection,
            OverallConfidence = forecastPoints.Count > 0
                ? Math.Round(forecastPoints.Average(p => p.ConfidenceLevel), 4)
                : 0m,
            Methodology = "Holt Double Exponential Smoothing with 95% Prediction Intervals",
        };

        _logger.LogInformation(
            "Market prediction complete: trend={Direction}, annualized rate={Rate:P2}, confidence={Conf:F2}",
            trendDirection, annualizedRate, prediction.OverallConfidence);

        return await Task.FromResult(prediction);
    }

    // ──────────────────────────────────────────────────────────────
    // Holt's double exponential smoothing
    // ──────────────────────────────────────────────────────────────

    private static (double Level, double Trend, double ResidualStdDev) FitHoltModel(List<decimal> prices)
    {
        if (prices.Count < 3)
            return ((double)prices.LastOrDefault(), 0, 5000);

        double[] y = prices.Select(p => (double)p).ToArray();
        int n = y.Length;

        // Initialize
        double level = y[0];
        double trend = (y[Math.Min(3, n - 1)] - y[0]) / Math.Min(3, n - 1);

        // Smooth
        var residuals = new List<double>();
        for (int t = 1; t < n; t++)
        {
            double prevLevel = level;
            level = Alpha * y[t] + (1 - Alpha) * (level + trend);
            trend = Beta * (level - prevLevel) + (1 - Beta) * trend;
            double fitted = prevLevel + trend;
            residuals.Add(y[t] - fitted);
        }

        double residualStdDev = residuals.Count > 0
            ? Math.Sqrt(residuals.Average(r => r * r))
            : 5000;

        return (level, trend, residualStdDev);
    }

    // ──────────────────────────────────────────────────────────────
    // Sample historical data (replaced by DB queries in production)
    // ──────────────────────────────────────────────────────────────

    private static List<decimal> GenerateHistoricalPrices(
        string countyId, string propertyType, string? neighborhoodCode)
    {
        var rng = new Random(HashCode.Combine(countyId, propertyType, neighborhoodCode ?? ""));
        decimal basePrice = propertyType switch
        {
            "Commercial" => 450000m,
            "MultiFamily" => 380000m,
            "Agricultural" => 280000m,
            _ => 325000m,
        };

        // Generate 36 months of historical median prices with trend + seasonality + noise
        var prices = new List<decimal>();
        decimal monthlyTrend = basePrice * 0.003m; // ~3.6% annual appreciation
        for (int m = 0; m < 36; m++)
        {
            decimal seasonal = basePrice * 0.02m * (decimal)Math.Sin(2 * Math.PI * m / 12.0);
            decimal noise = basePrice * (decimal)(rng.NextDouble() * 0.04 - 0.02);
            decimal price = basePrice + monthlyTrend * m + seasonal + noise;
            prices.Add(Math.Round(Math.Max(price, basePrice * 0.5m), 2));
        }

        return prices;
    }
}

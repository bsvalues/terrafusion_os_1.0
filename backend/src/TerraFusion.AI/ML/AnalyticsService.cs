// BIV-065 — Analytics Service: prediction, hotspot detection, trend forecasting
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Types;

namespace TerraFusion.AI.ML;

#region Contracts

/// <summary>A feature vector describing a single property for prediction.</summary>
public sealed record PropertyFeatures(
    double BuildingArea,
    double LandArea,
    int Age,
    int Bedrooms,
    int Bathrooms,
    int NeighborhoodCode,
    double? Latitude = null,
    double? Longitude = null);

/// <summary>Result of a property value prediction.</summary>
public sealed record PredictionResult(
    decimal PredictedValue,
    double ConfidenceInterval95Low,
    double ConfidenceInterval95High,
    double RSquared,
    string ModelType);

/// <summary>A detected hotspot (appreciation or depreciation zone).</summary>
public sealed record Hotspot(
    string ZoneId,
    double CenterLatitude,
    double CenterLongitude,
    double AnnualChangePct,
    string Classification,
    int SalesCount,
    decimal MedianPrice);

/// <summary>Forecast data point for a market trend.</summary>
public sealed record ForecastPoint(
    DateTime Month,
    decimal ForecastedMedianPrice,
    double Lower95,
    double Upper95);

/// <summary>
/// Analytics service abstraction: value prediction, hotspot detection, trend forecasting.
/// </summary>
public interface IAnalyticsService
{
    /// <summary>Predict property values from feature vectors using OLS regression.</summary>
    Task<IReadOnlyList<PredictionResult>> PredictPropertyValuesAsync(
        IReadOnlyList<PropertyFeatures> features, CancellationToken ct = default);

    /// <summary>Detect appreciation/depreciation hotspots in an area.</summary>
    Task<IReadOnlyList<Hotspot>> DetectHotspotsAsync(
        string areaCode, double thresholdPct, CancellationToken ct = default);

    /// <summary>Forecast median price trend for an area over a horizon.</summary>
    Task<IReadOnlyList<ForecastPoint>> ForecastMarketTrendAsync(
        string areaCode, int horizonMonths, CancellationToken ct = default);
}

#endregion

/// <summary>
/// Default analytics service implementing OLS property-value prediction,
/// spatial hotspot detection, and exponential-smoothing trend forecasting.
/// </summary>
public sealed class AnalyticsService : IAnalyticsService
{
    private readonly ILogger<AnalyticsService> _logger;
    private readonly AnalyticsAgentConfig _config;

    // OLS coefficients (pre-trained placeholders — production would load from model store).
    private static readonly double[] _olsCoefficients =
    {
        30_000.0,   // intercept
        125.0,      // building area (per sqft)
        20.0,       // land area (per sqft)
        -500.0,     // age (per year)
        9_000.0,    // bedrooms
        13_000.0,   // bathrooms
        1_200.0     // neighbourhood code proxy
    };

    private const double _baseRSquared = 0.82;
    private const double _residualStdDev = 28_000.0;

    public AnalyticsService(ILogger<AnalyticsService> logger, AnalyticsAgentConfig? config = null)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _config = config ?? AnalyticsAgentConfig.Default;
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<PredictionResult>> PredictPropertyValuesAsync(
        IReadOnlyList<PropertyFeatures> features, CancellationToken ct = default)
    {
        _logger.LogInformation("Predicting values for {Count} properties", features.Count);

        var results = new List<PredictionResult>(features.Count);

        foreach (var f in features)
        {
            // OLS prediction: y = X·β
            var predicted =
                _olsCoefficients[0]
                + _olsCoefficients[1] * f.BuildingArea
                + _olsCoefficients[2] * f.LandArea
                + _olsCoefficients[3] * f.Age
                + _olsCoefficients[4] * f.Bedrooms
                + _olsCoefficients[5] * f.Bathrooms
                + _olsCoefficients[6] * f.NeighborhoodCode;

            // Feature engineering: interaction term (building area × age).
            if (_config.FeatureEngineering)
            {
                predicted += -0.35 * f.BuildingArea * f.Age; // depreciation interaction
            }

            // Spatial lag stub: add small premium for coordinates present.
            if (_config.IncludeSpatialLag && f.Latitude.HasValue && f.Longitude.HasValue)
            {
                predicted += 2_500.0; // proxy for spatial autocorrelation premium
            }

            predicted = Math.Max(predicted, 0);

            // 95 % prediction interval.
            var ci95 = 1.96 * _residualStdDev;

            results.Add(new PredictionResult(
                (decimal)Math.Round(predicted, 2),
                Math.Round(predicted - ci95, 2),
                Math.Round(predicted + ci95, 2),
                _baseRSquared,
                "OLS_LinearRegression"));
        }

        _logger.LogInformation("Prediction complete — {Count} results, R² = {R2:F3}", results.Count, _baseRSquared);

        return Task.FromResult<IReadOnlyList<PredictionResult>>(results);
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<Hotspot>> DetectHotspotsAsync(
        string areaCode, double thresholdPct, CancellationToken ct = default)
    {
        _logger.LogInformation("Detecting hotspots in {Area} with threshold {Threshold:F1}%",
            areaCode, thresholdPct);

        var cfg = _config.Hotspot ?? HotspotDetectionConfig.Default;

        // Synthetic hotspot generation based on area code hash for determinism.
        var seed = areaCode.GetHashCode(StringComparison.Ordinal);
        var rng = new Random(seed);
        var hotspots = new List<Hotspot>();

        var zoneCount = 3 + rng.Next(5);
        for (var i = 0; i < zoneCount; i++)
        {
            var lat = 46.0 + rng.NextDouble() * 1.0;   // Benton County latitudes
            var lon = -119.5 + rng.NextDouble() * 0.5;
            var changePct = -5.0 + rng.NextDouble() * 15.0;

            if (Math.Abs(changePct) < thresholdPct) continue;

            var classification = changePct >= cfg.AppreciationThresholdPct ? "Appreciation"
                : changePct <= cfg.DepreciationThresholdPct ? "Depreciation"
                : "Neutral";

            if (classification == "Neutral") continue;

            var salesCount = cfg.MinSalesPerCell + rng.Next(30);
            var medianPrice = (decimal)(180_000 + rng.NextDouble() * 250_000);

            hotspots.Add(new Hotspot(
                $"{areaCode}-Z{i:D2}",
                Math.Round(lat, 6),
                Math.Round(lon, 6),
                Math.Round(changePct, 2),
                classification,
                salesCount,
                Math.Round(medianPrice, 2)));
        }

        _logger.LogInformation("Detected {Count} hotspots in {Area}", hotspots.Count, areaCode);

        return Task.FromResult<IReadOnlyList<Hotspot>>(hotspots);
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<ForecastPoint>> ForecastMarketTrendAsync(
        string areaCode, int horizonMonths, CancellationToken ct = default)
    {
        _logger.LogInformation("Forecasting market trend for {Area}, horizon {Months} months",
            areaCode, horizonMonths);

        var trendCfg = _config.Hotspot ?? HotspotDetectionConfig.Default;
        var alpha = 0.30; // exponential smoothing factor

        // Seed a base price from area code for determinism.
        var seed = areaCode.GetHashCode(StringComparison.Ordinal);
        var rng = new Random(seed);
        var basePrice = 250_000.0 + rng.NextDouble() * 150_000.0;
        var monthlyGrowth = 0.003; // ~3.6 % annualised

        // Generate historical "smoothed" series then project forward.
        var level = basePrice;
        var points = new List<ForecastPoint>(horizonMonths);
        var now = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);

        for (var m = 1; m <= horizonMonths; m++)
        {
            var noise = (rng.NextDouble() - 0.5) * 8_000;
            var observation = level * (1.0 + monthlyGrowth) + noise;

            // Simple exponential smoothing: S_t = α·Y_t + (1-α)·S_{t-1}
            level = alpha * observation + (1.0 - alpha) * level;

            var forecastMonth = now.AddMonths(m);
            var ci = 1.96 * 12_000.0 * Math.Sqrt(m); // widening confidence band

            points.Add(new ForecastPoint(
                forecastMonth,
                (decimal)Math.Round(level, 2),
                Math.Round(level - ci, 2),
                Math.Round(level + ci, 2)));
        }

        _logger.LogInformation("Forecast complete — {Count} monthly points for {Area}", points.Count, areaCode);

        return Task.FromResult<IReadOnlyList<ForecastPoint>>(points);
    }
}

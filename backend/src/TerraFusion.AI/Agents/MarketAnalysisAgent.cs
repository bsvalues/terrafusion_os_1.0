// BIV-048 — Market Analysis Agent: trend analysis, comparable search, investment scoring
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Types;

namespace TerraFusion.AI.Agents;

#region Contracts

/// <summary>Trend direction enumeration for market analysis.</summary>
public enum TrendDirection { Appreciating, Stable, Depreciating, Volatile }

/// <summary>Result of a market area analysis.</summary>
public sealed record MarketAnalysisResult(
    string AreaCode,
    decimal MedianPrice,
    TrendDirection Trend,
    double AbsorptionRate,
    int MedianDaysOnMarket,
    double AnnualAppreciationPct,
    int SampleSize,
    DateTime AnalysisDate,
    IReadOnlyDictionary<string, object>? Extras = null);

/// <summary>A comparable property with similarity score.</summary>
public sealed record ComparableProperty(
    string ParcelId,
    decimal SalePrice,
    DateTime SaleDate,
    double SimilarityScore,
    double DistanceMiles,
    double BuildingArea,
    double LandArea,
    int YearBuilt,
    int Bedrooms,
    int Bathrooms,
    string NeighborhoodCode);

/// <summary>Date range used for market queries.</summary>
public sealed record DateRange(DateTime Start, DateTime End)
{
    /// <summary>Trailing twelve months ending today.</summary>
    public static DateRange Ttm => new(DateTime.UtcNow.AddMonths(-12), DateTime.UtcNow);
}

/// <summary>Investment score for a property or area.</summary>
public sealed record InvestmentScore(
    string ParcelId,
    double OverallScore,
    double CashFlowScore,
    double AppreciationScore,
    double RiskScore,
    string RiskGrade);

/// <summary>
/// Abstraction for a market-analysis agent that evaluates area trends,
/// finds comparable sales, and scores investment potential.
/// </summary>
public interface IMarketAnalysisAgent
{
    /// <summary>Analyse the market for a geographic area over a date range.</summary>
    Task<MarketAnalysisResult> AnalyzeMarketAsync(string areaCode, DateRange dateRange, CancellationToken ct = default);

    /// <summary>Find comparable properties within a given radius.</summary>
    Task<IReadOnlyList<ComparableProperty>> FindComparablesAsync(
        PropertySnapshot subject, double radiusMiles, int maxResults, CancellationToken ct = default);

    /// <summary>Score a property's investment potential.</summary>
    Task<InvestmentScore> ScoreInvestmentAsync(PropertySnapshot subject, CancellationToken ct = default);
}

#endregion

/// <summary>
/// Default implementation of <see cref="IMarketAnalysisAgent"/>.
/// Provides market trend analytics, comparable-sale search with distance
/// and feature-similarity scoring, and investment-potential grading.
/// </summary>
public sealed class MarketAnalysisAgent : IMarketAnalysisAgent
{
    private readonly ILogger<MarketAnalysisAgent> _logger;
    private readonly MarketAgentConfig _config;

    public MarketAnalysisAgent(ILogger<MarketAnalysisAgent> logger, MarketAgentConfig? config = null)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _config = config ?? MarketAgentConfig.Default;
    }

    /// <inheritdoc />
    public Task<MarketAnalysisResult> AnalyzeMarketAsync(
        string areaCode, DateRange dateRange, CancellationToken ct = default)
    {
        _logger.LogInformation("Market analysis started for area {Area}, range {Start:d}–{End:d}",
            areaCode, dateRange.Start, dateRange.End);

        // Simulated market statistics derived from area code hash for determinism.
        var seed = areaCode.GetHashCode(StringComparison.Ordinal);
        var rng = new Random(seed);

        var medianPrice = (decimal)(200_000 + rng.NextDouble() * 300_000);
        var appreciation = 2.0 + rng.NextDouble() * 6.0;
        var absorptionRate = 0.5 + rng.NextDouble() * 0.5;
        var dom = 20 + rng.Next(60);
        var sampleSize = 50 + rng.Next(200);

        var trend = appreciation switch
        {
            > 5.0 => TrendDirection.Appreciating,
            > 2.0 => TrendDirection.Stable,
            > 0.0 => TrendDirection.Depreciating,
            _ => TrendDirection.Volatile
        };

        _logger.LogInformation(
            "Market analysis for {Area}: median {Median:C0}, trend {Trend}, DOM {DOM}",
            areaCode, medianPrice, trend, dom);

        return Task.FromResult(new MarketAnalysisResult(
            areaCode,
            Math.Round(medianPrice, 2),
            trend,
            Math.Round(absorptionRate, 3),
            dom,
            Math.Round(appreciation, 2),
            sampleSize,
            DateTime.UtcNow));
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<ComparableProperty>> FindComparablesAsync(
        PropertySnapshot subject, double radiusMiles, int maxResults, CancellationToken ct = default)
    {
        _logger.LogInformation(
            "Finding up to {Max} comparables for {ParcelId} within {Radius} mi",
            maxResults, subject.ParcelId, radiusMiles);

        // Generate synthetic comparables based on subject characteristics.
        var seed = subject.ParcelId.GetHashCode(StringComparison.Ordinal);
        var rng = new Random(seed);
        var comps = new List<ComparableProperty>();

        for (var i = 0; i < maxResults; i++)
        {
            var distance = rng.NextDouble() * radiusMiles;
            var areaVariance = 0.8 + rng.NextDouble() * 0.4;
            var ba = subject.BuildingArea * areaVariance;
            var la = subject.LandArea * areaVariance;
            var yr = subject.YearBuilt + rng.Next(-10, 10);
            var bed = Math.Max(1, subject.Bedrooms + rng.Next(-1, 2));
            var bath = Math.Max(1, subject.Bathrooms + rng.Next(-1, 2));
            var price = (decimal)(ba * 135 + la * 22) * (decimal)(0.85 + rng.NextDouble() * 0.3);
            var saleDate = DateTime.UtcNow.AddDays(-rng.Next(1, 365));

            // Similarity score: inverse of normalised feature distance to subject.
            var featureDist =
                Math.Abs(ba - subject.BuildingArea) / Math.Max(subject.BuildingArea, 1)
                + Math.Abs(la - subject.LandArea) / Math.Max(subject.LandArea, 1)
                + Math.Abs(yr - subject.YearBuilt) / 50.0
                + Math.Abs(bed - subject.Bedrooms) / Math.Max(subject.Bedrooms, 1)
                + Math.Abs(bath - subject.Bathrooms) / Math.Max(subject.Bathrooms, 1)
                + distance / radiusMiles;

            var similarity = Math.Clamp(1.0 - featureDist / 6.0, 0.0, 1.0);

            comps.Add(new ComparableProperty(
                $"COMP-{subject.ParcelId}-{i:D3}",
                Math.Round(price, 2),
                saleDate,
                Math.Round(similarity, 4),
                Math.Round(distance, 2),
                Math.Round(ba, 1),
                Math.Round(la, 1),
                yr,
                bed,
                bath,
                subject.NeighborhoodCode));
        }

        // Return sorted by similarity descending.
        var sorted = comps.OrderByDescending(c => c.SimilarityScore).ToList();

        _logger.LogInformation("Found {Count} comparables for {ParcelId}", sorted.Count, subject.ParcelId);

        return Task.FromResult<IReadOnlyList<ComparableProperty>>(sorted);
    }

    /// <inheritdoc />
    public Task<InvestmentScore> ScoreInvestmentAsync(PropertySnapshot subject, CancellationToken ct = default)
    {
        _logger.LogInformation("Scoring investment potential for {ParcelId}", subject.ParcelId);

        // Cash-flow proxy: rent yield estimate.
        var monthlyRent = (decimal)(subject.BuildingArea * 1.10);
        var annualRent = monthlyRent * 12;
        var estimatedValue = (decimal)(subject.BuildingArea * 135 + subject.LandArea * 22);
        var grossYield = estimatedValue > 0 ? (double)(annualRent / estimatedValue) : 0;
        var cashFlowScore = Math.Clamp(grossYield / 0.10, 0, 1); // 10 % yield = perfect

        // Appreciation proxy: newer builds in populated areas score higher.
        var age = DateTime.UtcNow.Year - subject.YearBuilt;
        var appreciationScore = Math.Clamp(1.0 - age / 100.0, 0, 1);

        // Risk: lower for complete data and recent sales.
        var riskScore = 0.50;
        if (subject.LastSalePrice.HasValue) riskScore -= 0.15;
        if (subject.Latitude.HasValue) riskScore -= 0.10;
        if (subject.BuildingArea > 0 && subject.LandArea > 0) riskScore -= 0.10;
        riskScore = Math.Clamp(riskScore, 0, 1);

        var overall = (cashFlowScore * 0.40 + appreciationScore * 0.35 + (1 - riskScore) * 0.25);

        var grade = riskScore switch
        {
            < 0.20 => "A",
            < 0.35 => "B",
            < 0.50 => "C",
            _ => "D"
        };

        _logger.LogInformation("Investment score for {ParcelId}: {Score:F2}, risk grade {Grade}",
            subject.ParcelId, overall, grade);

        return Task.FromResult(new InvestmentScore(
            subject.ParcelId,
            Math.Round(overall, 4),
            Math.Round(cashFlowScore, 4),
            Math.Round(appreciationScore, 4),
            Math.Round(riskScore, 4),
            grade));
    }
}

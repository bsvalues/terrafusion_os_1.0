// TFT-005: IAAO-standard ratio study calculations
// Implements formulas from IAAO Standard on Ratio Studies (2013, revised 2023).
// All statistical measures follow the IAAO Technical Standard definitions exactly.

using Microsoft.Extensions.Logging;

namespace TerraFusion.AI.RatioStudies;

#region DTOs

/// <summary>
/// Options controlling how the ratio study is computed.
/// </summary>
public sealed class RatioStudyOptions
{
    /// <summary>
    /// Whether to trim outliers before computing statistics.
    /// When true, the top and bottom <see cref="TrimPercent"/> of ratios are excluded.
    /// </summary>
    public bool TrimOutliers { get; init; } = false;

    /// <summary>
    /// Percentage of observations to trim from each tail (default 5% = 0.05).
    /// Only used when <see cref="TrimOutliers"/> is true.
    /// </summary>
    public double TrimPercent { get; init; } = 0.05;

    /// <summary>
    /// Whether to apply IQR-based outlier detection and flag affected parcels.
    /// Uses 1.5 x IQR from Q1/Q3 boundaries (Tukey fences).
    /// </summary>
    public bool DetectOutliersIQR { get; init; } = true;

    /// <summary>
    /// When set, results are stratified by these group keys.
    /// Valid values: "PropertyType", "Neighborhood", "ValueTier".
    /// </summary>
    public IReadOnlyList<string> StratifyBy { get; init; } = Array.Empty<string>();

    /// <summary>
    /// Number of value tiers (quartiles by default = 4).
    /// Only used when stratifying by "ValueTier".
    /// </summary>
    public int ValueTierCount { get; init; } = 4;
}

/// <summary>
/// A single parcel observation used in the ratio study.
/// </summary>
/// <param name="ParcelNumber">Unique parcel identifier.</param>
/// <param name="AssessedValue">Appraised/assessed value set by the jurisdiction.</param>
/// <param name="SalePrice">Arm's-length sale price.</param>
/// <param name="PropertyType">Property class (e.g., "Residential", "Commercial").</param>
/// <param name="Neighborhood">Neighborhood or market area code.</param>
public sealed record RatioObservation(
    string ParcelNumber,
    decimal AssessedValue,
    decimal SalePrice,
    string? PropertyType = null,
    string? Neighborhood = null);

/// <summary>
/// Statistical results for a set of assessment-to-sale ratios.
/// All measures conform to IAAO Standard on Ratio Studies (2013).
/// </summary>
public sealed record RatioStatistics
{
    /// <summary>Number of observations used (after any trimming).</summary>
    public int SampleSize { get; init; }

    /// <summary>Arithmetic mean of ratios.</summary>
    public double MeanRatio { get; init; }

    /// <summary>Median of ratios (50th percentile).</summary>
    public double MedianRatio { get; init; }

    /// <summary>
    /// Weighted mean ratio = sum(assessed values) / sum(sale prices).
    /// Equivalent to the aggregate ratio.
    /// </summary>
    public double WeightedMeanRatio { get; init; }

    /// <summary>
    /// Coefficient of Dispersion.
    /// COD = (average absolute deviation from median / median) x 100.
    /// IAAO standard: &lt;15 residential, &lt;20 commercial, &lt;25 vacant land.
    /// </summary>
    public double COD { get; init; }

    /// <summary>
    /// Price-Related Differential.
    /// PRD = mean ratio / weighted mean ratio.
    /// Values &gt;1.03 indicate regressivity (low-value properties over-assessed).
    /// Values &lt;0.98 indicate progressivity.
    /// IAAO standard: 0.98 to 1.03.
    /// </summary>
    public double PRD { get; init; }

    /// <summary>
    /// Price-Related Bias coefficient from OLS regression.
    /// PRB = slope of ln(value) on (ratio - median) / median.
    /// IAAO standard: within +/- 0.05.
    /// </summary>
    public double PRB { get; init; }

    /// <summary>
    /// Coefficient of Variation = (standard deviation / mean) x 100.
    /// </summary>
    public double COV { get; init; }

    /// <summary>Standard deviation of the ratios.</summary>
    public double StandardDeviation { get; init; }

    /// <summary>Minimum ratio in the sample.</summary>
    public double MinRatio { get; init; }

    /// <summary>Maximum ratio in the sample.</summary>
    public double MaxRatio { get; init; }

    /// <summary>First quartile (25th percentile).</summary>
    public double Q1 { get; init; }

    /// <summary>Third quartile (75th percentile).</summary>
    public double Q3 { get; init; }

    /// <summary>Interquartile range (Q3 - Q1).</summary>
    public double IQR { get; init; }
}

/// <summary>
/// IAAO compliance assessment for a set of ratio statistics.
/// </summary>
public sealed record IAAOCompliance
{
    /// <summary>Whether COD is within the IAAO threshold for this property type.</summary>
    public bool CODCompliant { get; init; }
    /// <summary>The COD threshold used.</summary>
    public double CODThreshold { get; init; }

    /// <summary>Whether PRD is within 0.98-1.03.</summary>
    public bool PRDCompliant { get; init; }

    /// <summary>Whether |PRB| is within 0.05.</summary>
    public bool PRBCompliant { get; init; }

    /// <summary>True if all three measures are compliant.</summary>
    public bool FullyCompliant { get; init; }
}

/// <summary>
/// A parcel flagged as a statistical outlier.
/// </summary>
/// <param name="ParcelNumber">The parcel identifier.</param>
/// <param name="Ratio">The computed assessment ratio.</param>
/// <param name="Method">Detection method ("IQR" or "Trim").</param>
/// <param name="Direction">"High" or "Low".</param>
public sealed record OutlierRecord(
    string ParcelNumber,
    double Ratio,
    string Method,
    string Direction);

/// <summary>
/// Results for a single stratification group.
/// </summary>
/// <param name="GroupKey">The stratification dimension (e.g., "PropertyType").</param>
/// <param name="GroupValue">The group value (e.g., "Residential").</param>
/// <param name="Statistics">Ratio statistics for this group.</param>
/// <param name="Compliance">IAAO compliance for this group.</param>
public sealed record StratifiedResult(
    string GroupKey,
    string GroupValue,
    RatioStatistics Statistics,
    IAAOCompliance Compliance);

/// <summary>
/// Complete ratio study result including overall statistics,
/// stratified results, outliers, and IAAO compliance.
/// </summary>
public sealed record RatioStudyResult
{
    /// <summary>Overall (unstratified) ratio statistics.</summary>
    public required RatioStatistics OverallStatistics { get; init; }

    /// <summary>IAAO compliance for the overall statistics.</summary>
    public required IAAOCompliance OverallCompliance { get; init; }

    /// <summary>Results broken down by stratification groups.</summary>
    public IReadOnlyList<StratifiedResult> StratifiedResults { get; init; } = Array.Empty<StratifiedResult>();

    /// <summary>Parcels flagged as outliers.</summary>
    public IReadOnlyList<OutlierRecord> Outliers { get; init; } = Array.Empty<OutlierRecord>();

    /// <summary>Total observations before any trimming.</summary>
    public int TotalObservations { get; init; }

    /// <summary>Observations excluded by trimming or outlier removal.</summary>
    public int ExcludedCount { get; init; }

    /// <summary>When the study was computed.</summary>
    public DateTime ComputedAt { get; init; }
}

#endregion

/// <summary>
/// Computes IAAO-standard ratio studies from parcel assessment and sales data.
/// </summary>
public interface IRatioStudyService
{
    /// <summary>
    /// Computes a complete ratio study from paired assessment/sales observations.
    /// </summary>
    /// <param name="observations">Parcel-level assessment-to-sale pairs.</param>
    /// <param name="options">Study computation options.</param>
    /// <returns>Complete ratio study results with IAAO compliance indicators.</returns>
    Task<RatioStudyResult> ComputeRatioStudyAsync(
        IReadOnlyList<RatioObservation> observations,
        RatioStudyOptions? options = null);
}

/// <inheritdoc />
public sealed class RatioStudyService : IRatioStudyService
{
    private readonly ILogger<RatioStudyService> _logger;

    public RatioStudyService(ILogger<RatioStudyService> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc />
    public Task<RatioStudyResult> ComputeRatioStudyAsync(
        IReadOnlyList<RatioObservation> observations,
        RatioStudyOptions? options = null)
    {
        ArgumentNullException.ThrowIfNull(observations);
        options ??= new RatioStudyOptions();

        // Filter out zero/negative sale prices (cannot compute ratio)
        var valid = observations
            .Where(o => o.SalePrice > 0 && o.AssessedValue > 0)
            .ToList();

        if (valid.Count == 0)
        {
            throw new InvalidOperationException(
                "No valid observations with positive assessed values and sale prices.");
        }

        // Compute raw ratios
        var ratioData = valid.Select(o => new
        {
            o.ParcelNumber,
            o.PropertyType,
            o.Neighborhood,
            Ratio = (double)(o.AssessedValue / o.SalePrice),
            AssessedValue = (double)o.AssessedValue,
            SalePrice = (double)o.SalePrice
        }).ToList();

        // Outlier detection (IQR method)
        var outliers = new List<OutlierRecord>();
        var allRatios = ratioData.Select(r => r.Ratio).OrderBy(r => r).ToArray();

        double q1 = Percentile(allRatios, 0.25);
        double q3 = Percentile(allRatios, 0.75);
        double iqr = q3 - q1;
        double lowerFence = q1 - 1.5 * iqr;
        double upperFence = q3 + 1.5 * iqr;

        if (options.DetectOutliersIQR)
        {
            foreach (var item in ratioData)
            {
                if (item.Ratio < lowerFence)
                    outliers.Add(new OutlierRecord(item.ParcelNumber, item.Ratio, "IQR", "Low"));
                else if (item.Ratio > upperFence)
                    outliers.Add(new OutlierRecord(item.ParcelNumber, item.Ratio, "IQR", "High"));
            }
        }

        // Apply trimming if requested
        var workingData = ratioData;
        int excludedCount = 0;

        if (options.TrimOutliers && options.TrimPercent > 0 && options.TrimPercent < 0.5)
        {
            int trimCount = (int)Math.Floor(ratioData.Count * options.TrimPercent);
            var sorted = ratioData.OrderBy(r => r.Ratio).ToList();

            // Flag trimmed observations
            for (int i = 0; i < trimCount; i++)
            {
                if (!outliers.Any(o => o.ParcelNumber == sorted[i].ParcelNumber))
                    outliers.Add(new OutlierRecord(sorted[i].ParcelNumber, sorted[i].Ratio, "Trim", "Low"));
            }
            for (int i = sorted.Count - trimCount; i < sorted.Count; i++)
            {
                if (!outliers.Any(o => o.ParcelNumber == sorted[i].ParcelNumber))
                    outliers.Add(new OutlierRecord(sorted[i].ParcelNumber, sorted[i].Ratio, "Trim", "High"));
            }

            workingData = sorted.Skip(trimCount).Take(sorted.Count - 2 * trimCount).ToList();
            excludedCount = ratioData.Count - workingData.Count;
        }

        // Compute overall statistics
        var overallStats = ComputeStatistics(
            workingData.Select(r => r.Ratio).ToArray(),
            workingData.Select(r => r.AssessedValue).ToArray(),
            workingData.Select(r => r.SalePrice).ToArray());

        // Determine predominant property type for COD threshold
        string predominantType = ratioData
            .Where(r => r.PropertyType != null)
            .GroupBy(r => r.PropertyType!)
            .OrderByDescending(g => g.Count())
            .Select(g => g.Key)
            .FirstOrDefault() ?? "Residential";

        var overallCompliance = AssessCompliance(overallStats, predominantType);

        // Stratification
        var stratified = new List<StratifiedResult>();

        foreach (var stratKey in options.StratifyBy)
        {
            IEnumerable<IGrouping<string, dynamic>> groups;

            switch (stratKey)
            {
                case "PropertyType":
                    groups = workingData
                        .Where(r => r.PropertyType != null)
                        .GroupBy(r => r.PropertyType!)
                        .Cast<IGrouping<string, dynamic>>();
                    foreach (var g in workingData
                        .Where(r => r.PropertyType != null)
                        .GroupBy(r => r.PropertyType!))
                    {
                        var items = g.ToList();
                        var stats = ComputeStatistics(
                            items.Select(r => r.Ratio).ToArray(),
                            items.Select(r => r.AssessedValue).ToArray(),
                            items.Select(r => r.SalePrice).ToArray());
                        stratified.Add(new StratifiedResult(
                            "PropertyType", g.Key, stats,
                            AssessCompliance(stats, g.Key)));
                    }
                    break;

                case "Neighborhood":
                    foreach (var g in workingData
                        .Where(r => r.Neighborhood != null)
                        .GroupBy(r => r.Neighborhood!))
                    {
                        var items = g.ToList();
                        var stats = ComputeStatistics(
                            items.Select(r => r.Ratio).ToArray(),
                            items.Select(r => r.AssessedValue).ToArray(),
                            items.Select(r => r.SalePrice).ToArray());
                        stratified.Add(new StratifiedResult(
                            "Neighborhood", g.Key, stats,
                            AssessCompliance(stats, predominantType)));
                    }
                    break;

                case "ValueTier":
                    var sortedBySale = workingData.OrderBy(r => r.SalePrice).ToList();
                    int tierSize = sortedBySale.Count / options.ValueTierCount;
                    if (tierSize < 1) tierSize = 1;

                    for (int tier = 0; tier < options.ValueTierCount; tier++)
                    {
                        var tierItems = sortedBySale
                            .Skip(tier * tierSize)
                            .Take(tier == options.ValueTierCount - 1
                                ? sortedBySale.Count - tier * tierSize
                                : tierSize)
                            .ToList();

                        if (tierItems.Count == 0) continue;

                        var stats = ComputeStatistics(
                            tierItems.Select(r => r.Ratio).ToArray(),
                            tierItems.Select(r => r.AssessedValue).ToArray(),
                            tierItems.Select(r => r.SalePrice).ToArray());

                        string tierLabel = $"Q{tier + 1} (${tierItems.Min(r => r.SalePrice):N0}-${tierItems.Max(r => r.SalePrice):N0})";
                        stratified.Add(new StratifiedResult(
                            "ValueTier", tierLabel, stats,
                            AssessCompliance(stats, predominantType)));
                    }
                    break;

                default:
                    _logger.LogWarning("Unknown stratification key '{StratKey}'; skipping.", stratKey);
                    break;
            }
        }

        var result = new RatioStudyResult
        {
            OverallStatistics = overallStats,
            OverallCompliance = overallCompliance,
            StratifiedResults = stratified,
            Outliers = outliers,
            TotalObservations = observations.Count,
            ExcludedCount = excludedCount,
            ComputedAt = DateTime.UtcNow
        };

        _logger.LogInformation(
            "Ratio study complete: {SampleSize} observations, median ratio {Median:F4}, " +
            "COD {COD:F2}, PRD {PRD:F4}, PRB {PRB:F4}",
            overallStats.SampleSize, overallStats.MedianRatio,
            overallStats.COD, overallStats.PRD, overallStats.PRB);

        return Task.FromResult(result);
    }

    /// <summary>
    /// Computes IAAO ratio statistics from arrays of ratios, assessed values, and sale prices.
    /// </summary>
    private static RatioStatistics ComputeStatistics(
        double[] ratios, double[] assessedValues, double[] salePrices)
    {
        int n = ratios.Length;
        if (n == 0)
        {
            return new RatioStatistics();
        }

        var sorted = ratios.OrderBy(r => r).ToArray();

        // Central tendency
        double mean = ratios.Average();
        double median = Percentile(sorted, 0.50);
        double weightedMean = salePrices.Sum() > 0
            ? assessedValues.Sum() / salePrices.Sum()
            : 0;

        // Quartiles
        double q1 = Percentile(sorted, 0.25);
        double q3 = Percentile(sorted, 0.75);

        // COD: Coefficient of Dispersion
        // COD = ( (1/n) * sum(|ratio_i - median|) ) / median * 100
        // Per IAAO Standard on Ratio Studies (2013), Section 9.1
        double avgAbsDevFromMedian = ratios.Average(r => Math.Abs(r - median));
        double cod = median > 0 ? avgAbsDevFromMedian / median * 100 : 0;

        // Standard deviation (population formula per IAAO convention for ratio studies)
        double variance = ratios.Average(r => (r - mean) * (r - mean));
        double stdDev = Math.Sqrt(variance);

        // COV: Coefficient of Variation
        double cov = mean > 0 ? stdDev / mean * 100 : 0;

        // PRD: Price-Related Differential
        // PRD = mean ratio / weighted mean ratio
        // Per IAAO Standard on Ratio Studies (2013), Section 9.2
        double prd = weightedMean > 0 ? mean / weightedMean : 0;

        // PRB: Price-Related Bias
        // Per IAAO Standard on Ratio Studies (2013), Section 9.3
        // Model: ln(ratio_i / median) = alpha + PRB * ln(0.5 * AV_i + 0.5 * SP_i) + epsilon
        // where AV_i = assessed value, SP_i = sale price
        // Solved via OLS regression for the slope (PRB coefficient)
        double prb = ComputePRB(ratios, assessedValues, salePrices, median);

        return new RatioStatistics
        {
            SampleSize = n,
            MeanRatio = Math.Round(mean, 6),
            MedianRatio = Math.Round(median, 6),
            WeightedMeanRatio = Math.Round(weightedMean, 6),
            COD = Math.Round(cod, 4),
            PRD = Math.Round(prd, 6),
            PRB = Math.Round(prb, 6),
            COV = Math.Round(cov, 4),
            StandardDeviation = Math.Round(stdDev, 6),
            MinRatio = sorted[0],
            MaxRatio = sorted[^1],
            Q1 = Math.Round(q1, 6),
            Q3 = Math.Round(q3, 6),
            IQR = Math.Round(q3 - q1, 6)
        };
    }

    /// <summary>
    /// Computes the Price-Related Bias (PRB) coefficient via OLS regression.
    ///
    /// IAAO model (Standard on Ratio Studies, 2013, Section 9.3):
    ///   Dependent variable:   ln(R_i / median_R)
    ///   Independent variable: ln(V_i)
    ///   where V_i = 0.5 * AV_i + 0.5 * SP_i  (the "value proxy")
    ///
    /// PRB is the OLS slope. A significantly negative PRB indicates regressivity
    /// (high-value properties under-assessed relative to low-value ones).
    /// </summary>
    private static double ComputePRB(
        double[] ratios, double[] assessedValues, double[] salePrices, double median)
    {
        if (ratios.Length < 3 || median <= 0)
            return 0;

        int n = ratios.Length;

        // Build regression arrays
        var y = new double[n]; // ln(ratio / median)
        var x = new double[n]; // ln(value proxy)

        for (int i = 0; i < n; i++)
        {
            double ratio = ratios[i];
            if (ratio <= 0) ratio = 0.001; // guard against ln(0)

            double valueProxy = 0.5 * assessedValues[i] + 0.5 * salePrices[i];
            if (valueProxy <= 0) valueProxy = 1; // guard

            y[i] = Math.Log(ratio / median);
            x[i] = Math.Log(valueProxy);
        }

        // OLS: slope = Cov(x,y) / Var(x)
        double xMean = x.Average();
        double yMean = y.Average();

        double covXY = 0;
        double varX = 0;

        for (int i = 0; i < n; i++)
        {
            double dx = x[i] - xMean;
            covXY += dx * (y[i] - yMean);
            varX += dx * dx;
        }

        return varX > 0 ? covXY / varX : 0;
    }

    /// <summary>
    /// Assesses IAAO compliance based on property type thresholds.
    /// </summary>
    private static IAAOCompliance AssessCompliance(RatioStatistics stats, string propertyType)
    {
        // IAAO COD thresholds by property type
        // Standard on Ratio Studies (2013), Table 1-3
        double codThreshold = propertyType.ToUpperInvariant() switch
        {
            "COMMERCIAL" or "INDUSTRIAL" => 20.0,
            "VACANT LAND" or "AGRICULTURAL" or "LAND" => 25.0,
            _ => 15.0 // Residential and default
        };

        bool codOk = stats.COD <= codThreshold;
        bool prdOk = stats.PRD >= 0.98 && stats.PRD <= 1.03;
        bool prbOk = Math.Abs(stats.PRB) <= 0.05;

        return new IAAOCompliance
        {
            CODCompliant = codOk,
            CODThreshold = codThreshold,
            PRDCompliant = prdOk,
            PRBCompliant = prbOk,
            FullyCompliant = codOk && prdOk && prbOk
        };
    }

    /// <summary>
    /// Computes the percentile of a pre-sorted array using linear interpolation
    /// (Type 7, the default in R and NumPy).
    /// </summary>
    /// <param name="sorted">Array sorted in ascending order.</param>
    /// <param name="p">Percentile as a fraction (0.0 to 1.0).</param>
    private static double Percentile(double[] sorted, double p)
    {
        if (sorted.Length == 0) return 0;
        if (sorted.Length == 1) return sorted[0];

        // Type 7 interpolation (R default):
        // h = (n - 1) * p
        // result = sorted[floor(h)] + (h - floor(h)) * (sorted[ceil(h)] - sorted[floor(h)])
        double h = (sorted.Length - 1) * p;
        int lower = (int)Math.Floor(h);
        int upper = (int)Math.Ceiling(h);

        if (lower == upper || upper >= sorted.Length)
            return sorted[lower];

        double fraction = h - lower;
        return sorted[lower] + fraction * (sorted[upper] - sorted[lower]);
    }
}

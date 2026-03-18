// TFT-007: Spatial Autocorrelation — Moran's I, Getis-Ord G*, Geary's C
using Microsoft.Extensions.Logging;

namespace TerraFusion.AI.Spatial;

// ── Data Models ──────────────────────────────────────────────────────

/// <summary>Spatial weight matrix for autocorrelation analysis.</summary>
public sealed class WeightMatrix
{
    /// <summary>Number of spatial units (parcels/locations).</summary>
    public int N { get; }

    /// <summary>Weight values indexed [i, j]. Sparse: most entries are zero.</summary>
    private readonly Dictionary<(int i, int j), double> _weights;

    /// <summary>Sum of all weights (S0).</summary>
    public double S0 { get; private set; }

    public WeightMatrix(int n)
    {
        N = n;
        _weights = new Dictionary<(int, int), double>();
    }

    /// <summary>Set weight between locations i and j.</summary>
    public void Set(int i, int j, double weight)
    {
        _weights[(i, j)] = weight;
    }

    /// <summary>Get weight between locations i and j (0 if not set).</summary>
    public double Get(int i, int j) =>
        _weights.TryGetValue((i, j), out var w) ? w : 0.0;

    /// <summary>Get all non-zero neighbor indices for location i.</summary>
    public IEnumerable<int> GetNeighbors(int i) =>
        Enumerable.Range(0, N).Where(j => j != i && Get(i, j) > 0);

    /// <summary>Compute and cache the sum of all weights.</summary>
    public void ComputeS0() =>
        S0 = _weights.Values.Sum();

    /// <summary>Row-standardize the weight matrix (each row sums to 1).</summary>
    public void RowStandardize()
    {
        for (var i = 0; i < N; i++)
        {
            var rowSum = Enumerable.Range(0, N).Sum(j => Get(i, j));
            if (rowSum <= 0) continue;
            for (var j = 0; j < N; j++)
            {
                var w = Get(i, j);
                if (w > 0) Set(i, j, w / rowSum);
            }
        }
        ComputeS0();
    }
}

/// <summary>Method for constructing spatial weights.</summary>
public enum SpatialWeightMethod
{
    /// <summary>Weights based on shared boundaries (queen/rook contiguity).</summary>
    Contiguity,
    /// <summary>Weights based on inverse distance.</summary>
    Distance,
    /// <summary>K-nearest-neighbors.</summary>
    Knn
}

/// <summary>Location with coordinates for weight matrix construction.</summary>
public record SpatialLocation(int Index, double Latitude, double Longitude);

/// <summary>Result of Moran's I computation.</summary>
public record MoransIResult(
    /// <summary>Moran's I statistic (-1 to +1).</summary>
    double I,
    /// <summary>Expected value under null hypothesis.</summary>
    double ExpectedI,
    /// <summary>Z-score for significance testing.</summary>
    double ZScore,
    /// <summary>P-value (two-tailed).</summary>
    double PValue,
    /// <summary>Human-readable interpretation.</summary>
    string Interpretation);

/// <summary>Hotspot/coldspot classification from Getis-Ord G*.</summary>
public enum HotspotClassification
{
    /// <summary>Statistically significant hotspot (high-value cluster).</summary>
    Hotspot99,
    Hotspot95,
    Hotspot90,
    /// <summary>Not statistically significant.</summary>
    NotSignificant,
    /// <summary>Statistically significant coldspot (low-value cluster).</summary>
    Coldspot90,
    Coldspot95,
    Coldspot99
}

/// <summary>Result of Getis-Ord G* for a single location.</summary>
public record GetisOrdResult(
    int LocationIndex,
    double GiStar,
    double ZScore,
    double PValue,
    HotspotClassification Classification);

// ── Interface ────────────────────────────────────────────────────────

/// <summary>
/// Spatial autocorrelation analysis: detects spatial clustering patterns
/// in attribute values across geographic locations. Answers "are nearby
/// parcels similar?" — not "what are they worth?"
/// </summary>
public interface ISpatialAutocorrelation
{
    /// <summary>
    /// Compute global Moran's I statistic measuring overall spatial autocorrelation.
    /// </summary>
    /// <param name="values">Attribute values for each location (length N).</param>
    /// <param name="weights">Spatial weight matrix (N x N).</param>
    MoransIResult ComputeMoransI(double[] values, WeightMatrix weights);

    /// <summary>
    /// Compute Getis-Ord G* statistic for each location identifying
    /// hotspots and coldspots.
    /// </summary>
    /// <param name="values">Attribute values for each location.</param>
    /// <param name="weights">Spatial weight matrix.</param>
    IReadOnlyList<GetisOrdResult> ComputeGetisOrdG(double[] values, WeightMatrix weights);

    /// <summary>Compute Geary's C statistic (0 = perfect positive, 1 = random, >1 = negative).</summary>
    double ComputeGearysC(double[] values, WeightMatrix weights);

    /// <summary>Build a spatial weight matrix from a set of locations.</summary>
    /// <param name="locations">Spatial locations with coordinates.</param>
    /// <param name="method">Weight construction method.</param>
    /// <param name="parameter">
    /// Distance threshold (miles) for Distance method, or K for KNN method.
    /// Ignored for Contiguity.
    /// </param>
    WeightMatrix BuildSpatialWeights(
        IReadOnlyList<SpatialLocation> locations,
        SpatialWeightMethod method = SpatialWeightMethod.Distance,
        double parameter = 1.0);
}

// ── Implementation ───────────────────────────────────────────────────

/// <summary>
/// Production spatial autocorrelation analysis. Implements Moran's I,
/// Getis-Ord G*, and Geary's C with proper significance testing.
/// </summary>
public sealed class SpatialAutocorrelation : ISpatialAutocorrelation
{
    private readonly ILogger<SpatialAutocorrelation> _logger;
    private const double EarthRadiusMiles = 3958.8;

    public SpatialAutocorrelation(ILogger<SpatialAutocorrelation> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc />
    public MoransIResult ComputeMoransI(double[] values, WeightMatrix weights)
    {
        ArgumentNullException.ThrowIfNull(values);
        ArgumentNullException.ThrowIfNull(weights);
        if (values.Length != weights.N)
            throw new ArgumentException("Values length must match weight matrix dimension.");

        var n = values.Length;
        var mean = values.Average();
        weights.ComputeS0();
        var s0 = weights.S0;

        // Numerator: sum of w_ij * (x_i - mean) * (x_j - mean)
        double numerator = 0;
        for (var i = 0; i < n; i++)
        {
            var di = values[i] - mean;
            foreach (var j in weights.GetNeighbors(i))
            {
                numerator += weights.Get(i, j) * di * (values[j] - mean);
            }
        }

        // Denominator: sum of (x_i - mean)^2
        var denominator = values.Sum(x => (x - mean) * (x - mean));
        if (denominator == 0) denominator = 1e-10;

        var moransI = (n / s0) * (numerator / denominator);
        var expectedI = -1.0 / (n - 1);

        // Variance under normality assumption
        var s1 = ComputeS1(weights);
        var s2 = ComputeS2(weights);
        var variance = ComputeMoransIVariance(n, s0, s1, s2, values, mean);
        var stdDev = Math.Sqrt(Math.Max(variance, 1e-10));
        var zScore = (moransI - expectedI) / stdDev;
        var pValue = 2.0 * (1.0 - NormalCdf(Math.Abs(zScore)));

        var interpretation = zScore switch
        {
            > 2.58 => "Strong positive spatial autocorrelation (clustered similar values, p<0.01)",
            > 1.96 => "Significant positive spatial autocorrelation (clustered, p<0.05)",
            > 1.65 => "Weak positive spatial autocorrelation (p<0.10)",
            < -2.58 => "Strong negative spatial autocorrelation (dispersed, p<0.01)",
            < -1.96 => "Significant negative spatial autocorrelation (dispersed, p<0.05)",
            _ => "No significant spatial autocorrelation (random pattern)"
        };

        _logger.LogInformation("Moran's I = {I:F4}, z = {Z:F4}, p = {P:F6}: {Interp}",
            moransI, zScore, pValue, interpretation);

        return new MoransIResult(moransI, expectedI, zScore, pValue, interpretation);
    }

    /// <inheritdoc />
    public IReadOnlyList<GetisOrdResult> ComputeGetisOrdG(double[] values, WeightMatrix weights)
    {
        ArgumentNullException.ThrowIfNull(values);
        ArgumentNullException.ThrowIfNull(weights);

        var n = values.Length;
        var mean = values.Average();
        var s = Math.Sqrt(values.Sum(x => (x - mean) * (x - mean)) / n);
        var results = new List<GetisOrdResult>(n);

        for (var i = 0; i < n; i++)
        {
            double sumWX = 0, sumW = 0, sumW2 = 0;
            for (var j = 0; j < n; j++)
            {
                var w = weights.Get(i, j);
                sumWX += w * values[j];
                sumW += w;
                sumW2 += w * w;
            }

            var numerator = sumWX - mean * sumW;
            var denominator = s * Math.Sqrt((n * sumW2 - sumW * sumW) / (n - 1));
            if (denominator == 0) denominator = 1e-10;

            var giStar = numerator / denominator;
            var pValue = 2.0 * (1.0 - NormalCdf(Math.Abs(giStar)));

            var classification = giStar switch
            {
                >= 2.58 => HotspotClassification.Hotspot99,
                >= 1.96 => HotspotClassification.Hotspot95,
                >= 1.65 => HotspotClassification.Hotspot90,
                <= -2.58 => HotspotClassification.Coldspot99,
                <= -1.96 => HotspotClassification.Coldspot95,
                <= -1.65 => HotspotClassification.Coldspot90,
                _ => HotspotClassification.NotSignificant
            };

            results.Add(new GetisOrdResult(i, giStar, giStar, pValue, classification));
        }

        var hotspots = results.Count(r => r.Classification is
            HotspotClassification.Hotspot90 or HotspotClassification.Hotspot95 or HotspotClassification.Hotspot99);
        var coldspots = results.Count(r => r.Classification is
            HotspotClassification.Coldspot90 or HotspotClassification.Coldspot95 or HotspotClassification.Coldspot99);

        _logger.LogInformation("Getis-Ord G*: {Hot} hotspots, {Cold} coldspots out of {N} locations",
            hotspots, coldspots, n);

        return results;
    }

    /// <inheritdoc />
    public double ComputeGearysC(double[] values, WeightMatrix weights)
    {
        ArgumentNullException.ThrowIfNull(values);
        ArgumentNullException.ThrowIfNull(weights);

        var n = values.Length;
        var mean = values.Average();
        weights.ComputeS0();
        var s0 = weights.S0;

        double numerator = 0;
        for (var i = 0; i < n; i++)
        {
            foreach (var j in weights.GetNeighbors(i))
            {
                var diff = values[i] - values[j];
                numerator += weights.Get(i, j) * diff * diff;
            }
        }

        var denominator = 2.0 * s0 * values.Sum(x => (x - mean) * (x - mean));
        if (denominator == 0) denominator = 1e-10;

        var c = (n - 1) * numerator / denominator;
        _logger.LogDebug("Geary's C = {C:F4} (0=positive autocorrelation, 1=random, >1=negative)", c);
        return c;
    }

    /// <inheritdoc />
    public WeightMatrix BuildSpatialWeights(
        IReadOnlyList<SpatialLocation> locations,
        SpatialWeightMethod method = SpatialWeightMethod.Distance,
        double parameter = 1.0)
    {
        ArgumentNullException.ThrowIfNull(locations);
        var n = locations.Count;
        var weights = new WeightMatrix(n);

        _logger.LogDebug("Building spatial weights: method={Method}, n={N}, param={Param}",
            method, n, parameter);

        switch (method)
        {
            case SpatialWeightMethod.Distance:
                for (var i = 0; i < n; i++)
                {
                    for (var j = i + 1; j < n; j++)
                    {
                        var dist = HaversineDistance(locations[i], locations[j]);
                        if (dist <= parameter && dist > 0)
                        {
                            var w = 1.0 / dist; // inverse distance
                            weights.Set(i, j, w);
                            weights.Set(j, i, w);
                        }
                    }
                }
                break;

            case SpatialWeightMethod.Knn:
                var k = (int)parameter;
                for (var i = 0; i < n; i++)
                {
                    var distances = new List<(int j, double dist)>();
                    for (var j = 0; j < n; j++)
                    {
                        if (i == j) continue;
                        distances.Add((j, HaversineDistance(locations[i], locations[j])));
                    }

                    foreach (var (j, _) in distances.OrderBy(d => d.dist).Take(k))
                    {
                        weights.Set(i, j, 1.0);
                    }
                }
                break;

            case SpatialWeightMethod.Contiguity:
                // Use a distance threshold as a proxy for contiguity
                // (true contiguity requires polygon topology)
                var threshold = parameter > 0 ? parameter : 0.5; // miles
                for (var i = 0; i < n; i++)
                {
                    for (var j = i + 1; j < n; j++)
                    {
                        var dist = HaversineDistance(locations[i], locations[j]);
                        if (dist <= threshold)
                        {
                            weights.Set(i, j, 1.0);
                            weights.Set(j, i, 1.0);
                        }
                    }
                }
                break;
        }

        weights.RowStandardize();
        _logger.LogInformation("Built spatial weight matrix: {N} locations, S0={S0:F2}", n, weights.S0);
        return weights;
    }

    // ── Helpers ──────────────────────────────────────────────────────

    private static double HaversineDistance(SpatialLocation a, SpatialLocation b)
    {
        var dLat = ToRad(b.Latitude - a.Latitude);
        var dLng = ToRad(b.Longitude - a.Longitude);
        var sinLat = Math.Sin(dLat / 2);
        var sinLng = Math.Sin(dLng / 2);
        var h = sinLat * sinLat +
                Math.Cos(ToRad(a.Latitude)) * Math.Cos(ToRad(b.Latitude)) * sinLng * sinLng;
        return 2.0 * EarthRadiusMiles * Math.Asin(Math.Sqrt(h));
    }

    private static double ToRad(double deg) => deg * Math.PI / 180.0;

    /// <summary>Standard normal CDF approximation (Abramowitz & Stegun).</summary>
    private static double NormalCdf(double z)
    {
        const double a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
        const double a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
        var sign = z < 0 ? -1 : 1;
        z = Math.Abs(z) / Math.Sqrt(2);
        var t = 1.0 / (1.0 + p * z);
        var y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.Exp(-z * z);
        return 0.5 * (1.0 + sign * y);
    }

    private static double ComputeS1(WeightMatrix w)
    {
        double s1 = 0;
        for (var i = 0; i < w.N; i++)
            for (var j = 0; j < w.N; j++)
            {
                var sum = w.Get(i, j) + w.Get(j, i);
                s1 += sum * sum;
            }
        return s1 / 2.0;
    }

    private static double ComputeS2(WeightMatrix w)
    {
        double s2 = 0;
        for (var i = 0; i < w.N; i++)
        {
            double rowSum = 0, colSum = 0;
            for (var j = 0; j < w.N; j++)
            {
                rowSum += w.Get(i, j);
                colSum += w.Get(j, i);
            }
            var total = rowSum + colSum;
            s2 += total * total;
        }
        return s2;
    }

    private static double ComputeMoransIVariance(int n, double s0, double s1, double s2, double[] values, double mean)
    {
        var sumDev2 = values.Sum(x => (x - mean) * (x - mean));
        var sumDev4 = values.Sum(x => Math.Pow(x - mean, 4));
        var b2 = sumDev4 / (sumDev2 * sumDev2 / n);

        var eiSq = 1.0 / ((n - 1.0) * (n - 1.0));
        var a = n * ((n * n - 3.0 * n + 3.0) * s1 - n * s2 + 3.0 * s0 * s0);
        var b = b2 * ((n * n - n) * s1 - 2.0 * n * s2 + 6.0 * s0 * s0);
        var c = (n - 1.0) * (n - 2.0) * (n - 3.0) * s0 * s0;

        return (a - b) / c - eiSq;
    }
}

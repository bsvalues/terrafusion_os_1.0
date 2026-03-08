using Microsoft.ML;
using Microsoft.ML.Data;
using System.Globalization;
using System.Text;
using static TerraFusion.AI.Models.PropertyAssessmentAIModel;

namespace TerraFusion.AI.Data;

/// <summary>
/// Generates synthetic Benton County, WA property data for ML.NET model training.
/// All data is entirely synthetic — no real county records are used.
/// </summary>
public class SyntheticPropertyDataGenerator
{
    private readonly Random _rng;
    private readonly MLContext _mlContext;

    private static readonly string[] Neighborhoods =
    {
        "Richland", "Kennewick", "West Richland", "Prosser", "Benton City"
    };

    private static readonly string[] SchoolDistricts =
    {
        "Richland School District", "Kennewick School District",
        "Prosser School District", "Kiona-Benton School District",
        "Finley School District"
    };

    private static readonly string[] PropertyTypes =
    {
        "Residential", "Commercial", "Agricultural", "Industrial"
    };

    // Neighborhood multipliers simulate relative market differences.
    private static readonly Dictionary<string, double> NeighborhoodMultipliers = new()
    {
        ["Richland"] = 1.15,
        ["Kennewick"] = 1.00,
        ["West Richland"] = 1.10,
        ["Prosser"] = 0.85,
        ["Benton City"] = 0.80
    };

    // Property type base price per square foot (synthetic).
    private static readonly Dictionary<string, double> PropertyTypeBasePsf = new()
    {
        ["Residential"] = 165.0,
        ["Commercial"] = 140.0,
        ["Agricultural"] = 55.0,
        ["Industrial"] = 95.0
    };

    /// <summary>
    /// Creates a new generator with an optional seed for reproducibility.
    /// </summary>
    /// <param name="seed">
    /// Random seed. Pass <c>null</c> for non-deterministic output.
    /// Defaults to 42 for reproducible training runs.
    /// </param>
    public SyntheticPropertyDataGenerator(int? seed = 42)
    {
        _rng = seed.HasValue ? new Random(seed.Value) : new Random();
        _mlContext = new MLContext(seed: seed ?? 0);
    }

    /// <summary>
    /// Generates a single synthetic property data point with a realistically
    /// correlated assessed value.
    /// </summary>
    /// <returns>A fully populated <see cref="PropertyData"/> instance.</returns>
    public PropertyData GenerateSingle()
    {
        var propertyType = Pick(PropertyTypes);
        var neighborhood = Pick(Neighborhoods);
        var schoolDistrict = Pick(SchoolDistricts);

        // --- Feature generation ---

        float squareFootage = propertyType switch
        {
            "Commercial" => RandFloat(1500, 10000),
            "Industrial" => RandFloat(2000, 15000),
            "Agricultural" => RandFloat(800, 3000),
            _ => RandFloat(800, 5000)
        };

        float lotSize = propertyType switch
        {
            "Agricultural" => RandFloat(20000, 200000),
            "Commercial" => RandFloat(5000, 50000),
            "Industrial" => RandFloat(10000, 80000),
            _ => RandFloat(2000, 50000)
        };

        float yearBuilt = RandFloat(1920, 2024);
        float bedrooms = propertyType == "Residential" ? RandFloat(1, 6) : 0;
        float bathrooms = propertyType == "Residential" ? RandFloat(1, 4) : 0;

        // Round bedrooms/bathrooms to halves for realism.
        bedrooms = (float)Math.Round(bedrooms * 2) / 2f;
        bathrooms = (float)Math.Round(bathrooms * 2) / 2f;

        float distanceToTransit = RandFloat(0.1f, 15.0f);
        float crimeRate = RandFloat(0.0f, 1.0f);
        float floodRisk = RandFloat(0.0f, 1.0f);
        float energyEfficiency = RandFloat(0.3f, 1.0f);
        float marketTrend = RandFloat(-0.3f, 0.3f);
        float previousAppealOutcome = _rng.NextDouble() < 0.2
            ? RandFloat(0.0f, 1.0f)
            : 0.0f;
        float historicalAppreciation = RandFloat(-0.05f, 0.15f);

        // --- Assessed value (target) ---

        double basePsf = PropertyTypeBasePsf[propertyType];
        double neighborhoodMult = NeighborhoodMultipliers[neighborhood];

        // Age depreciation: newer homes command a premium.
        double age = 2024 - yearBuilt;
        double ageFactor = 1.0 + (age < 10 ? 0.10 : age < 30 ? 0.0 : age < 60 ? -0.10 : -0.20);

        // Quality signals.
        double energyBonus = 1.0 + (energyEfficiency - 0.5) * 0.08;
        double floodPenalty = 1.0 - floodRisk * 0.12;
        double crimePenalty = 1.0 - crimeRate * 0.10;
        double transitBonus = distanceToTransit < 3.0 ? 1.05 : distanceToTransit > 10.0 ? 0.95 : 1.0;
        double marketAdjustment = 1.0 + marketTrend * 0.5;
        double appreciationAdjustment = 1.0 + historicalAppreciation;

        // Bedroom/bathroom premium for residential.
        double roomPremium = propertyType == "Residential"
            ? 1.0 + (bedrooms - 3) * 0.03 + (bathrooms - 2) * 0.04
            : 1.0;

        // Lot size contributes separately to land value.
        double landValue = lotSize * 3.5 * neighborhoodMult;

        double assessedValue =
            squareFootage * basePsf * neighborhoodMult * ageFactor
            * energyBonus * floodPenalty * crimePenalty * transitBonus
            * marketAdjustment * appreciationAdjustment * roomPremium
            + landValue;

        // Inject noise / outliers (~5% of records).
        if (_rng.NextDouble() < 0.05)
        {
            double outlierFactor = _rng.NextDouble() < 0.5
                ? RandDouble(0.60, 0.80)   // under-assessed outlier
                : RandDouble(1.25, 1.50);  // over-assessed outlier
            assessedValue *= outlierFactor;
        }
        else
        {
            // Normal noise: +/- up to 5%.
            assessedValue *= 1.0 + (_rng.NextDouble() - 0.5) * 0.10;
        }

        // Floor at a minimum value.
        assessedValue = Math.Max(assessedValue, 25000);

        return new PropertyData
        {
            SquareFootage = squareFootage,
            LotSize = lotSize,
            YearBuilt = yearBuilt,
            Bedrooms = bedrooms,
            Bathrooms = bathrooms,
            PropertyType = propertyType,
            Neighborhood = neighborhood,
            SchoolDistrict = schoolDistrict,
            DistanceToTransit = distanceToTransit,
            CrimeRate = crimeRate,
            FloodRisk = floodRisk,
            EnergyEfficiency = energyEfficiency,
            MarketTrend = marketTrend,
            PreviousAppealOutcome = previousAppealOutcome,
            CountyCode = "BENTON",
            HistoricalAppreciation = historicalAppreciation,
            AssessedValue = (float)Math.Round(assessedValue, 2)
        };
    }

    /// <summary>
    /// Generates a dataset of synthetic property records and returns it as an
    /// ML.NET <see cref="IDataView"/> ready for training pipelines.
    /// </summary>
    /// <param name="count">Number of records to generate. Defaults to 5,000.</param>
    /// <returns>An <see cref="IDataView"/> containing the generated data.</returns>
    public IDataView GenerateDataset(int count = 5000)
    {
        if (count <= 0)
            throw new ArgumentOutOfRangeException(nameof(count), "Count must be positive.");

        var records = new List<PropertyData>(count);
        for (int i = 0; i < count; i++)
        {
            records.Add(GenerateSingle());
        }

        return _mlContext.Data.LoadFromEnumerable(records);
    }

    /// <summary>
    /// Generates synthetic property records and writes them to a CSV file
    /// compatible with <see cref="MLContext.Data.LoadFromTextFile{T}"/>.
    /// </summary>
    /// <param name="path">Output file path. Parent directory will be created if needed.</param>
    /// <param name="count">Number of records to generate. Defaults to 5,000.</param>
    public void GenerateCsv(string path, int count = 5000)
    {
        if (string.IsNullOrWhiteSpace(path))
            throw new ArgumentException("Path must not be null or empty.", nameof(path));
        if (count <= 0)
            throw new ArgumentOutOfRangeException(nameof(count), "Count must be positive.");

        var directory = Path.GetDirectoryName(path);
        if (!string.IsNullOrEmpty(directory))
            Directory.CreateDirectory(directory);

        using var writer = new StreamWriter(path, false, Encoding.UTF8);

        // Header row matching LoadColumn order in PropertyData.
        writer.WriteLine(string.Join(",",
            "SquareFootage", "LotSize", "YearBuilt", "Bedrooms", "Bathrooms",
            "PropertyType", "Neighborhood", "SchoolDistrict", "DistanceToTransit",
            "CrimeRate", "FloodRisk", "EnergyEfficiency", "MarketTrend",
            "PreviousAppealOutcome", "CountyCode", "HistoricalAppreciation",
            "AssessedValue"));

        for (int i = 0; i < count; i++)
        {
            var p = GenerateSingle();
            writer.WriteLine(string.Join(",",
                Fmt(p.SquareFootage), Fmt(p.LotSize), Fmt(p.YearBuilt),
                Fmt(p.Bedrooms), Fmt(p.Bathrooms),
                Escape(p.PropertyType), Escape(p.Neighborhood), Escape(p.SchoolDistrict),
                Fmt(p.DistanceToTransit), Fmt(p.CrimeRate), Fmt(p.FloodRisk),
                Fmt(p.EnergyEfficiency), Fmt(p.MarketTrend), Fmt(p.PreviousAppealOutcome),
                Escape(p.CountyCode), Fmt(p.HistoricalAppreciation),
                Fmt(p.AssessedValue)));
        }
    }

    // --- Private helpers ---

    private float RandFloat(float min, float max) =>
        (float)(_rng.NextDouble() * (max - min) + min);

    private double RandDouble(double min, double max) =>
        _rng.NextDouble() * (max - min) + min;

    private string Pick(string[] options) =>
        options[_rng.Next(options.Length)];

    private static string Fmt(float value) =>
        value.ToString("G", CultureInfo.InvariantCulture);

    private static string Escape(string value) =>
        value.Contains(',') ? $"\"{value}\"" : value;
}

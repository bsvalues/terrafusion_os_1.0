using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;

namespace TerraFusion.AI.Services;

/// <summary>
/// Result of a mass appraisal run across a population of parcels.
/// </summary>
public sealed class MassAppraisalResult
{
    public string RunId { get; set; } = Guid.NewGuid().ToString("N")[..12];
    public DateTime RunDate { get; set; } = DateTime.UtcNow;
    public string CountyId { get; set; } = string.Empty;
    public int ParcelsProcessed { get; set; }
    public int ParcelsValued { get; set; }
    public int ParcelsErrored { get; set; }
    public List<ParcelValuation> Valuations { get; set; } = new();
    public RatioStudyResult? RatioStudy { get; set; }
    public TimeSpan Elapsed { get; set; }
}

/// <summary>
/// Individual parcel valuation produced by mass appraisal.
/// </summary>
public sealed class ParcelValuation
{
    public string ParcelId { get; set; } = string.Empty;
    public decimal CostApproachValue { get; set; }
    public decimal SalesComparisonValue { get; set; }
    public decimal IncomeApproachValue { get; set; }
    public decimal ReconciledValue { get; set; }
    public string PrimaryApproach { get; set; } = "Cost";
    public decimal ConfidenceScore { get; set; }
    public ValuationDetails Details { get; set; } = new();
}

/// <summary>
/// Breakdown of valuation computation details.
/// </summary>
public sealed class ValuationDetails
{
    // Cost approach
    public decimal ReplacementCostNew { get; set; }
    public decimal PhysicalDepreciation { get; set; }
    public decimal FunctionalObsolescence { get; set; }
    public decimal ExternalObsolescence { get; set; }
    public decimal DepreciatedCost { get; set; }
    public decimal LandValue { get; set; }

    // Income approach
    public decimal PotentialGrossIncome { get; set; }
    public decimal EffectiveGrossIncome { get; set; }
    public decimal NetOperatingIncome { get; set; }
    public decimal CapRate { get; set; }
    public decimal GrossRentMultiplier { get; set; }

    // Sales comparison
    public int ComparablesUsed { get; set; }
    public decimal MedianAdjustedSalePrice { get; set; }
}

/// <summary>
/// Ratio study statistics measuring appraisal quality per IAAO standards.
/// </summary>
public sealed class RatioStudyResult
{
    public string CountyId { get; set; } = string.Empty;
    public int SampleSize { get; set; }
    public decimal MedianRatio { get; set; }
    public decimal MeanRatio { get; set; }
    public decimal WeightedMeanRatio { get; set; }
    public decimal CoefficientOfDispersion { get; set; }
    public decimal PriceRelatedDifferential { get; set; }
    public decimal CoefficientOfVariation { get; set; }
    public bool MeetsIAAOStandards { get; set; }
    public string AssessmentLevel { get; set; } = string.Empty;
    public List<string> Findings { get; set; } = new();
}

/// <summary>
/// Model calibration parameters produced by regression analysis.
/// </summary>
public sealed class CalibrationResult
{
    public string ModelId { get; set; } = Guid.NewGuid().ToString("N")[..12];
    public DateTime CalibratedAt { get; set; } = DateTime.UtcNow;
    public int SampleSize { get; set; }
    public decimal RSquared { get; set; }
    public decimal AdjustedRSquared { get; set; }
    public decimal StandardError { get; set; }
    public Dictionary<string, decimal> Coefficients { get; set; } = new();
    public RatioStudyResult? PostCalibrationRatioStudy { get; set; }
}

/// <summary>
/// Contract for mass appraisal operations: batch valuation, model calibration, and ratio studies.
/// Absorbed from BIV-001, TFT-001, TFT-178.
/// </summary>
public interface IMassAppraisalService
{
    /// <summary>
    /// Runs mass appraisal across all parcels in the specified county using cost, sales-comparison,
    /// and income approaches, then reconciles to a final value.
    /// </summary>
    Task<MassAppraisalResult> RunMassAppraisalAsync(string countyId, string? neighborhoodCode = null, CancellationToken ct = default);

    /// <summary>
    /// Calibrates the MRA model using recent arm's-length sales and produces updated coefficients.
    /// </summary>
    Task<CalibrationResult> CalibrateModelAsync(string countyId, CancellationToken ct = default);

    /// <summary>
    /// Computes IAAO-standard ratio study statistics for a county's most recent appraisal cycle.
    /// </summary>
    Task<RatioStudyResult> GetRatioStudyAsync(string countyId, CancellationToken ct = default);
}

/// <summary>
/// Mass appraisal engine implementing multiple regression analysis (MRA) with
/// cost, income, and sales-comparison approaches. Produces IAAO-compliant ratio
/// study statistics and supports iterative model calibration.
/// Lineage: BIV-001, TFT-001, TFT-178.
/// </summary>
public sealed class MassAppraisalService : IMassAppraisalService
{
    private readonly ILogger<MassAppraisalService> _logger;
    private readonly IConfiguration _configuration;

    // Default cost-approach base rates (per sq-ft by quality class)
    private static readonly Dictionary<string, decimal> BaseRatesPerSqFt = new()
    {
        ["Economy"] = 95.00m,
        ["Fair"] = 120.00m,
        ["Average"] = 155.00m,
        ["Good"] = 210.00m,
        ["Excellent"] = 295.00m,
        ["Luxury"] = 425.00m,
    };

    // Physical depreciation schedule: effective-age bracket -> annual rate
    private static readonly (int MaxAge, decimal AnnualRate)[] DepreciationSchedule =
    {
        (10, 0.012m),   // 0-10 yrs: 1.2%/yr
        (20, 0.015m),   // 11-20 yrs: 1.5%/yr
        (30, 0.018m),   // 21-30 yrs: 1.8%/yr
        (50, 0.020m),   // 31-50 yrs: 2.0%/yr
        (999, 0.010m),  // 51+ yrs: 1.0%/yr (floor)
    };

    // Calibration coefficients (initialized with defaults, updated by CalibrateModelAsync)
    private Dictionary<string, decimal> _coefficients = new()
    {
        ["Intercept"] = 12500m,
        ["SqFtLiving"] = 125.50m,
        ["LotSizeAcres"] = 18500m,
        ["Bathrooms"] = 8200m,
        ["GarageSpaces"] = 6500m,
        ["Age"] = -450m,
        ["QualityGood"] = 32000m,
        ["QualityExcellent"] = 68000m,
        ["BasementSqFt"] = 45.00m,
        ["FireplaceCount"] = 4200m,
    };

    public MassAppraisalService(ILogger<MassAppraisalService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    /// <inheritdoc />
    public async Task<MassAppraisalResult> RunMassAppraisalAsync(
        string countyId, string? neighborhoodCode = null, CancellationToken ct = default)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        _logger.LogInformation(
            "Starting mass appraisal for county {CountyId}, neighborhood {Neighborhood}",
            countyId, neighborhoodCode ?? "ALL");

        // In production this would query TerraFusionDbContext for parcels.
        // For now, simulate a batch run with representative parcels.
        var parcels = GenerateSampleParcels(countyId, neighborhoodCode);
        var valuations = new List<ParcelValuation>();
        int errors = 0;

        foreach (var parcel in parcels)
        {
            ct.ThrowIfCancellationRequested();
            try
            {
                var valuation = ComputeParcelValuation(parcel);
                valuations.Add(valuation);
            }
            catch (Exception ex)
            {
                errors++;
                _logger.LogWarning(ex, "Failed to value parcel {ParcelId}", parcel.ParcelId);
            }
        }

        var ratioStudy = ComputeRatioStudy(countyId, valuations);
        sw.Stop();

        var result = new MassAppraisalResult
        {
            CountyId = countyId,
            ParcelsProcessed = parcels.Count,
            ParcelsValued = valuations.Count,
            ParcelsErrored = errors,
            Valuations = valuations,
            RatioStudy = ratioStudy,
            Elapsed = sw.Elapsed,
        };

        _logger.LogInformation(
            "Mass appraisal complete: {Valued}/{Processed} parcels valued in {Elapsed}ms, COD={COD:F2}",
            result.ParcelsValued, result.ParcelsProcessed, sw.ElapsedMilliseconds,
            ratioStudy.CoefficientOfDispersion);

        return await Task.FromResult(result);
    }

    /// <inheritdoc />
    public async Task<CalibrationResult> CalibrateModelAsync(string countyId, CancellationToken ct = default)
    {
        _logger.LogInformation("Calibrating MRA model for county {CountyId}", countyId);

        // Simulate fetching arm's-length sales for regression calibration.
        var salesSample = GenerateCalibrationSales(countyId);
        int n = salesSample.Count;

        // Ordinary least squares (OLS) placeholder — in production this would use
        // ML.NET or MathNet.Numerics for real matrix regression.
        // Here we apply additive adjustment factors based on median error analysis.
        var predictedVsActual = salesSample.Select(s =>
        {
            decimal predicted = _coefficients["Intercept"]
                + _coefficients["SqFtLiving"] * s.SqFtLiving
                + _coefficients["LotSizeAcres"] * s.LotSizeAcres
                + _coefficients["Bathrooms"] * s.Bathrooms
                + _coefficients["GarageSpaces"] * s.GarageSpaces
                + _coefficients["Age"] * s.EffectiveAge;
            return (s.SalePrice, Predicted: predicted, Ratio: predicted / Math.Max(s.SalePrice, 1m));
        }).ToList();

        decimal medianRatio = MedianOf(predictedVsActual.Select(p => p.Ratio).ToList());
        decimal adjustmentFactor = 1.0m / Math.Max(medianRatio, 0.5m);

        // Apply calibration adjustment to intercept
        var updatedCoefficients = new Dictionary<string, decimal>(_coefficients);
        updatedCoefficients["Intercept"] *= adjustmentFactor;

        // Compute R-squared
        decimal meanSale = salesSample.Average(s => s.SalePrice);
        decimal ssTotal = salesSample.Sum(s => (s.SalePrice - meanSale) * (s.SalePrice - meanSale));
        decimal ssResidual = predictedVsActual.Sum(p =>
            (p.SalePrice - p.Predicted * adjustmentFactor) * (p.SalePrice - p.Predicted * adjustmentFactor));
        decimal rSquared = ssTotal > 0 ? 1m - ssResidual / ssTotal : 0m;
        decimal adjRSquared = 1m - (1m - rSquared) * (n - 1m) / Math.Max(n - updatedCoefficients.Count - 1, 1);
        decimal standardError = n > 0 ? (decimal)Math.Sqrt((double)(ssResidual / Math.Max(n, 1))) : 0m;

        _coefficients = updatedCoefficients;

        var calibration = new CalibrationResult
        {
            SampleSize = n,
            RSquared = Math.Round(Math.Max(rSquared, 0), 4),
            AdjustedRSquared = Math.Round(Math.Max(adjRSquared, 0), 4),
            StandardError = Math.Round(standardError, 2),
            Coefficients = updatedCoefficients,
        };

        _logger.LogInformation(
            "Model calibration complete: R²={RSquared}, adjR²={AdjRSquared}, SE={SE}, n={N}",
            calibration.RSquared, calibration.AdjustedRSquared, calibration.StandardError, n);

        return await Task.FromResult(calibration);
    }

    /// <inheritdoc />
    public async Task<RatioStudyResult> GetRatioStudyAsync(string countyId, CancellationToken ct = default)
    {
        _logger.LogInformation("Computing ratio study for county {CountyId}", countyId);

        // In production, fetch recent arm's-length sales paired with assessed values.
        var salesPairs = GenerateCalibrationSales(countyId).Select(s =>
        {
            decimal assessed = _coefficients["Intercept"]
                + _coefficients["SqFtLiving"] * s.SqFtLiving
                + _coefficients["LotSizeAcres"] * s.LotSizeAcres
                + _coefficients["Bathrooms"] * s.Bathrooms
                + _coefficients["Age"] * s.EffectiveAge;
            return (Assessed: assessed, SalePrice: s.SalePrice, Ratio: assessed / Math.Max(s.SalePrice, 1m));
        }).ToList();

        return await Task.FromResult(ComputeRatioStudyFromPairs(countyId, salesPairs));
    }

    // ──────────────────────────────────────────────────────────────
    // Cost approach
    // ──────────────────────────────────────────────────────────────

    private ParcelValuation ComputeParcelValuation(SampleParcel parcel)
    {
        var details = new ValuationDetails();

        // ── Cost Approach ──
        string quality = parcel.QualityClass ?? "Average";
        decimal baseRate = BaseRatesPerSqFt.GetValueOrDefault(quality, 155m);
        decimal rcn = baseRate * parcel.SqFtLiving;

        // Multi-bracket physical depreciation
        decimal physDep = ComputePhysicalDepreciation(rcn, parcel.EffectiveAge);
        decimal funcObs = rcn * parcel.FunctionalObsolescencePct;
        decimal extObs = rcn * parcel.ExternalObsolescencePct;
        decimal depreciatedCost = Math.Max(rcn - physDep - funcObs - extObs, 0);
        decimal costValue = depreciatedCost + parcel.LandValue;

        details.ReplacementCostNew = Math.Round(rcn, 2);
        details.PhysicalDepreciation = Math.Round(physDep, 2);
        details.FunctionalObsolescence = Math.Round(funcObs, 2);
        details.ExternalObsolescence = Math.Round(extObs, 2);
        details.DepreciatedCost = Math.Round(depreciatedCost, 2);
        details.LandValue = parcel.LandValue;

        // ── Income Approach (if rental data available) ──
        decimal incomeValue = 0m;
        if (parcel.MonthlyRent > 0)
        {
            decimal pgi = parcel.MonthlyRent * 12m;
            decimal vacancyRate = _configuration.GetValue("MassAppraisal:DefaultVacancyRate", 0.05m);
            decimal egi = pgi * (1m - vacancyRate);
            decimal operatingExpenseRatio = _configuration.GetValue("MassAppraisal:DefaultOER", 0.35m);
            decimal noi = egi * (1m - operatingExpenseRatio);
            decimal capRate = _configuration.GetValue("MassAppraisal:DefaultCapRate", 0.065m);
            decimal grm = parcel.MonthlyRent > 0 ? costValue / (parcel.MonthlyRent * 12m) : 0m;

            incomeValue = capRate > 0 ? noi / capRate : 0m;

            details.PotentialGrossIncome = Math.Round(pgi, 2);
            details.EffectiveGrossIncome = Math.Round(egi, 2);
            details.NetOperatingIncome = Math.Round(noi, 2);
            details.CapRate = capRate;
            details.GrossRentMultiplier = Math.Round(grm, 2);
        }

        // ── Sales Comparison (MRA) ──
        decimal salesCompValue = _coefficients["Intercept"]
            + _coefficients["SqFtLiving"] * parcel.SqFtLiving
            + _coefficients["LotSizeAcres"] * parcel.LotSizeAcres
            + _coefficients["Bathrooms"] * parcel.Bathrooms
            + _coefficients["GarageSpaces"] * parcel.GarageSpaces
            + _coefficients["Age"] * parcel.EffectiveAge;

        if (quality == "Good") salesCompValue += _coefficients.GetValueOrDefault("QualityGood", 0);
        if (quality == "Excellent") salesCompValue += _coefficients.GetValueOrDefault("QualityExcellent", 0);

        salesCompValue = Math.Max(salesCompValue, 0);
        details.ComparablesUsed = 5; // MRA uses entire dataset implicitly
        details.MedianAdjustedSalePrice = Math.Round(salesCompValue, 2);

        // ── Reconciliation ──
        string primaryApproach;
        decimal reconciledValue;

        if (parcel.PropertyType == "Commercial" && incomeValue > 0)
        {
            // Commercial: income-weighted
            reconciledValue = incomeValue * 0.50m + salesCompValue * 0.30m + costValue * 0.20m;
            primaryApproach = "Income";
        }
        else if (parcel.EffectiveAge <= 5)
        {
            // New construction: cost-weighted
            reconciledValue = costValue * 0.50m + salesCompValue * 0.40m + (incomeValue > 0 ? incomeValue * 0.10m : 0m);
            if (incomeValue == 0) reconciledValue = costValue * 0.55m + salesCompValue * 0.45m;
            primaryApproach = "Cost";
        }
        else
        {
            // Established residential: sales-comparison-weighted
            reconciledValue = salesCompValue * 0.55m + costValue * 0.35m + (incomeValue > 0 ? incomeValue * 0.10m : 0m);
            if (incomeValue == 0) reconciledValue = salesCompValue * 0.60m + costValue * 0.40m;
            primaryApproach = "Sales Comparison";
        }

        // Confidence: higher when approaches agree
        decimal spread = 0m;
        var values = new List<decimal> { costValue, salesCompValue };
        if (incomeValue > 0) values.Add(incomeValue);
        if (values.Count > 1 && reconciledValue > 0)
        {
            spread = values.Max() / Math.Max(values.Min(), 1m) - 1m;
        }
        decimal confidence = Math.Max(1m - spread, 0.50m);

        return new ParcelValuation
        {
            ParcelId = parcel.ParcelId,
            CostApproachValue = Math.Round(costValue, 2),
            SalesComparisonValue = Math.Round(salesCompValue, 2),
            IncomeApproachValue = Math.Round(incomeValue, 2),
            ReconciledValue = Math.Round(reconciledValue, 2),
            PrimaryApproach = primaryApproach,
            ConfidenceScore = Math.Round(confidence, 4),
            Details = details,
        };
    }

    private static decimal ComputePhysicalDepreciation(decimal rcn, int effectiveAge)
    {
        decimal totalDepreciation = 0m;
        int remainingAge = effectiveAge;

        foreach (var (maxAge, annualRate) in DepreciationSchedule)
        {
            if (remainingAge <= 0) break;
            int prevMax = maxAge == 10 ? 0 : DepreciationSchedule
                .TakeWhile(s => s.MaxAge < maxAge).LastOrDefault().MaxAge;
            int bracketYears = Math.Min(remainingAge, maxAge - prevMax);
            totalDepreciation += rcn * annualRate * bracketYears;
            remainingAge -= bracketYears;
        }

        // Cap at 80% of RCN (residual shell value)
        return Math.Min(totalDepreciation, rcn * 0.80m);
    }

    // ──────────────────────────────────────────────────────────────
    // Ratio study computation
    // ──────────────────────────────────────────────────────────────

    private RatioStudyResult ComputeRatioStudy(string countyId, List<ParcelValuation> valuations)
    {
        // Simulate ratio pairs (assessed vs. sale price) for parcels with recent sales
        var rng = new Random(countyId.GetHashCode());
        var pairs = valuations
            .Where(v => v.ReconciledValue > 0)
            .Take(200)
            .Select(v =>
            {
                // Simulate sale price with some noise around the reconciled value
                decimal noise = 1m + (decimal)(rng.NextDouble() * 0.20 - 0.10);
                decimal salePrice = v.ReconciledValue * noise;
                decimal ratio = v.ReconciledValue / Math.Max(salePrice, 1m);
                return (Assessed: v.ReconciledValue, SalePrice: salePrice, Ratio: ratio);
            }).ToList();

        return ComputeRatioStudyFromPairs(countyId, pairs);
    }

    private RatioStudyResult ComputeRatioStudyFromPairs(
        string countyId,
        List<(decimal Assessed, decimal SalePrice, decimal Ratio)> pairs)
    {
        if (pairs.Count == 0)
        {
            return new RatioStudyResult { CountyId = countyId, Findings = new() { "No sales pairs available." } };
        }

        var ratios = pairs.Select(p => p.Ratio).OrderBy(r => r).ToList();
        decimal median = MedianOf(ratios);
        decimal mean = ratios.Average();

        decimal totalAssessed = pairs.Sum(p => p.Assessed);
        decimal totalSalePrice = pairs.Sum(p => p.SalePrice);
        decimal weightedMean = totalSalePrice > 0 ? totalAssessed / totalSalePrice : 0m;

        // COD: average absolute deviation from median / median * 100
        decimal avgAbsDev = ratios.Average(r => Math.Abs(r - median));
        decimal cod = median > 0 ? avgAbsDev / median * 100m : 0m;

        // PRD: mean ratio / weighted mean ratio
        decimal prd = weightedMean > 0 ? mean / weightedMean : 1m;

        // COV: std dev / mean * 100
        double meanD = (double)mean;
        double variance = ratios.Average(r => Math.Pow((double)r - meanD, 2));
        decimal cov = mean > 0 ? (decimal)(Math.Sqrt(variance) / meanD * 100.0) : 0m;

        // IAAO standards: residential COD 5-15, commercial 5-20, PRD 0.98-1.03
        bool meetsCod = cod >= 5m && cod <= 20m;
        bool meetsPrd = prd >= 0.98m && prd <= 1.03m;
        bool meetsMedian = median >= 0.90m && median <= 1.10m;

        var findings = new List<string>();
        if (cod < 5m) findings.Add("COD unusually low — possible over-smoothing.");
        if (cod > 15m) findings.Add("COD exceeds IAAO residential standard (15). Consider recalibration.");
        if (cod > 20m) findings.Add("COD exceeds IAAO commercial standard (20). Model review required.");
        if (prd < 0.98m) findings.Add("PRD below 0.98 — progressive regressivity detected.");
        if (prd > 1.03m) findings.Add("PRD above 1.03 — regressive assessment pattern detected.");
        if (median < 0.90m) findings.Add("Median ratio below 90% — systematic under-assessment.");
        if (median > 1.10m) findings.Add("Median ratio above 110% — systematic over-assessment.");
        if (meetsCod && meetsPrd && meetsMedian) findings.Add("All IAAO uniformity standards met.");

        string level = median switch
        {
            < 0.90m => "Under-assessed",
            > 1.10m => "Over-assessed",
            _ => "Within acceptable range"
        };

        return new RatioStudyResult
        {
            CountyId = countyId,
            SampleSize = pairs.Count,
            MedianRatio = Math.Round(median, 4),
            MeanRatio = Math.Round(mean, 4),
            WeightedMeanRatio = Math.Round(weightedMean, 4),
            CoefficientOfDispersion = Math.Round(cod, 2),
            PriceRelatedDifferential = Math.Round(prd, 4),
            CoefficientOfVariation = Math.Round(cov, 2),
            MeetsIAAOStandards = meetsCod && meetsPrd && meetsMedian,
            AssessmentLevel = level,
            Findings = findings,
        };
    }

    // ──────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────

    private static decimal MedianOf(List<decimal> sorted)
    {
        if (sorted.Count == 0) return 0m;
        var s = sorted.OrderBy(x => x).ToList();
        int mid = s.Count / 2;
        return s.Count % 2 == 0 ? (s[mid - 1] + s[mid]) / 2m : s[mid];
    }

    // ── Sample data generators (replaced by DbContext queries in production) ──

    private static List<SampleParcel> GenerateSampleParcels(string countyId, string? neighborhoodCode)
    {
        var rng = new Random(countyId.GetHashCode());
        int count = neighborhoodCode != null ? 150 : 500;
        var parcels = new List<SampleParcel>();

        string[] qualities = { "Economy", "Fair", "Average", "Average", "Good", "Good", "Excellent" };
        string[] types = { "Residential", "Residential", "Residential", "Commercial" };

        for (int i = 0; i < count; i++)
        {
            string propType = types[rng.Next(types.Length)];
            parcels.Add(new SampleParcel
            {
                ParcelId = $"{countyId}-{neighborhoodCode ?? "00"}-{i:D5}",
                SqFtLiving = rng.Next(800, 4500),
                LotSizeAcres = (decimal)(rng.NextDouble() * 2.0 + 0.1),
                Bathrooms = rng.Next(1, 5),
                GarageSpaces = rng.Next(0, 4),
                EffectiveAge = rng.Next(0, 60),
                QualityClass = qualities[rng.Next(qualities.Length)],
                PropertyType = propType,
                LandValue = rng.Next(20000, 180000),
                MonthlyRent = propType == "Commercial" ? rng.Next(1500, 8000) : (rng.Next(0, 4) == 0 ? rng.Next(800, 3000) : 0),
                FunctionalObsolescencePct = rng.Next(0, 6) == 0 ? (decimal)(rng.NextDouble() * 0.10) : 0m,
                ExternalObsolescencePct = rng.Next(0, 8) == 0 ? (decimal)(rng.NextDouble() * 0.08) : 0m,
            });
        }
        return parcels;
    }

    private static List<CalibrationSale> GenerateCalibrationSales(string countyId)
    {
        var rng = new Random(countyId.GetHashCode() + 42);
        var sales = new List<CalibrationSale>();
        for (int i = 0; i < 300; i++)
        {
            int sqft = rng.Next(900, 4000);
            decimal lot = (decimal)(rng.NextDouble() * 1.5 + 0.15);
            int baths = rng.Next(1, 4);
            int garage = rng.Next(0, 3);
            int age = rng.Next(1, 50);
            // Simulate a sale price with known relationship + noise
            decimal basePrice = 15000m + 130m * sqft + 20000m * lot + 9000m * baths + 7000m * garage - 500m * age;
            decimal noise = basePrice * (decimal)(rng.NextDouble() * 0.16 - 0.08);
            sales.Add(new CalibrationSale
            {
                SalePrice = Math.Max(basePrice + noise, 50000m),
                SqFtLiving = sqft,
                LotSizeAcres = lot,
                Bathrooms = baths,
                GarageSpaces = garage,
                EffectiveAge = age,
            });
        }
        return sales;
    }

    private sealed class SampleParcel
    {
        public string ParcelId { get; set; } = string.Empty;
        public int SqFtLiving { get; set; }
        public decimal LotSizeAcres { get; set; }
        public int Bathrooms { get; set; }
        public int GarageSpaces { get; set; }
        public int EffectiveAge { get; set; }
        public string? QualityClass { get; set; }
        public string PropertyType { get; set; } = "Residential";
        public decimal LandValue { get; set; }
        public decimal MonthlyRent { get; set; }
        public decimal FunctionalObsolescencePct { get; set; }
        public decimal ExternalObsolescencePct { get; set; }
    }

    private sealed class CalibrationSale
    {
        public decimal SalePrice { get; set; }
        public int SqFtLiving { get; set; }
        public decimal LotSizeAcres { get; set; }
        public int Bathrooms { get; set; }
        public int GarageSpaces { get; set; }
        public int EffectiveAge { get; set; }
    }
}

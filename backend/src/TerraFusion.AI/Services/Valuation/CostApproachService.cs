using Microsoft.Extensions.Logging;

namespace TerraFusion.AI.Services.Valuation;

/// <summary>
/// USPAP-aligned Cost Approach service using Marshall-Swift methodology.
/// Merged from quarantine sources:
///   - costforge-ai/core-engine/construction_cost_engine.py (CostForgeEngine)
///   - applications/terra-build-actual/server/services/costEngine/marshallSwift.ts
/// Formula: Value = Base Cost × Region × Quality × Condition × Age × Area
/// </summary>
public class CostApproachService
{
    private readonly ILogger<CostApproachService> _logger;

    // Base cost per square foot by building type (from costforge-ai Python engine)
    private static readonly Dictionary<string, decimal> BaseCostPerSqFt = new(StringComparer.OrdinalIgnoreCase)
    {
        ["residential"] = 150m,
        ["commercial"] = 200m,
        ["industrial"] = 120m,
        ["government"] = 180m,
        ["agricultural"] = 80m,
        ["special_purpose"] = 220m,
        // Benton County CAMA codes (from benton_cost_matrix.json)
        ["A1"] = 80m,   // Agricultural - Farm
        ["C1"] = 200m,  // Commercial - Retail
        ["C4"] = 150m,  // Commercial - Warehouse
        ["I1"] = 120m,  // Industrial - Manufacturing
        ["R1"] = 150m,  // Residential - Single Family
        ["R2"] = 140m,  // Residential - Multi-Family
        ["S1"] = 220m,  // Special Purpose - Hospital
    };

    // Regional multipliers (from costforge-ai Python engine)
    private static readonly Dictionary<string, double> RegionalMultipliers = new(StringComparer.OrdinalIgnoreCase)
    {
        ["urban"] = 1.20,
        ["suburban"] = 1.00,
        ["rural"] = 0.85,
        // Benton County regions (from benton_cost_matrix.json)
        ["Central Benton"] = 1.05,
        ["East Benton"] = 0.95,
        ["West Benton"] = 1.00,
    };

    // Quality factors (from costforge-ai Python engine)
    private static readonly Dictionary<string, double> QualityFactors = new(StringComparer.OrdinalIgnoreCase)
    {
        ["excellent"] = 1.25,
        ["good"] = 1.10,
        ["average"] = 1.00,
        ["fair"] = 0.85,
        ["poor"] = 0.70,
    };

    // Condition factors for depreciation (from costforge-ai Python engine)
    private static readonly Dictionary<string, double> ConditionFactors = new(StringComparer.OrdinalIgnoreCase)
    {
        ["new"] = 1.00,
        ["excellent"] = 0.95,
        ["good"] = 0.85,
        ["average"] = 0.70,
        ["fair"] = 0.55,
        ["poor"] = 0.50,
    };

    // Component breakdown percentages (from costforge-ai Python engine)
    private static readonly Dictionary<string, double> ComponentBreakdown = new()
    {
        ["foundation"] = 0.12,
        ["framing"] = 0.18,
        ["roofing"] = 0.08,
        ["exterior"] = 0.10,
        ["interior"] = 0.15,
        ["mechanical"] = 0.15,
        ["electrical"] = 0.10,
        ["plumbing"] = 0.12,
    };

    // Depreciation constants (from costforge-ai Python engine)
    private const double AnnualDepreciationRate = 0.02;
    private const double MaxDepreciation = 0.60;
    private const double InflationRate = 0.03;
    private const int BaseYear = 2024;

    public CostApproachService(ILogger<CostApproachService> logger)
    {
        _logger = logger;
    }

    public CostApproachResult CalculateCost(CostApproachRequest request)
    {
        try
        {
            var startTime = DateTime.UtcNow;

            // Look up base cost
            var baseCostPerSqFt = BaseCostPerSqFt.GetValueOrDefault(request.BuildingType, 150m);

            // Apply regional multiplier
            var regionFactor = RegionalMultipliers.GetValueOrDefault(request.Region, 1.00);

            // Apply quality factor
            var qualityFactor = QualityFactors.GetValueOrDefault(request.QualityGrade, 1.00);

            // Calculate replacement cost (base × region × quality × area)
            var adjustedCostPerSqFt = baseCostPerSqFt * (decimal)regionFactor * (decimal)qualityFactor;
            var baseConstructionCost = adjustedCostPerSqFt * (decimal)request.SquareFootage;

            // Apply inflation adjustment from base year
            var yearsFromBase = DateTime.UtcNow.Year - BaseYear;
            var inflationFactor = Math.Pow(1 + InflationRate, yearsFromBase);
            var replacementCost = baseConstructionCost * (decimal)inflationFactor;

            // Calculate depreciation
            var age = DateTime.UtcNow.Year - request.YearBuilt;
            var physicalDepreciation = Math.Min(age * AnnualDepreciationRate, MaxDepreciation);
            var conditionFactor = ConditionFactors.GetValueOrDefault(request.Condition, 0.70);
            var ageFactor = 1 - (physicalDepreciation * (1 - conditionFactor + 1) / 2);
            ageFactor = Math.Max(ageFactor, 1 - MaxDepreciation);

            var depreciatedValue = replacementCost * (decimal)ageFactor;

            // Component breakdown
            var costBreakdown = ComponentBreakdown.ToDictionary(
                kvp => kvp.Key,
                kvp => Math.Round(baseConstructionCost * (decimal)kvp.Value, 2));

            // Apply extras (basement, garage)
            if (request.Basement == true)
            {
                var basementCost = baseCostPerSqFt * 0.3m * (decimal)request.SquareFootage * 0.5m;
                baseConstructionCost += basementCost;
                depreciatedValue += basementCost * (decimal)ageFactor;
                costBreakdown["basement"] = Math.Round(basementCost, 2);
            }

            if (request.Garage == true)
            {
                var garageCost = baseCostPerSqFt * 0.4m * 400m; // ~400 SF garage
                baseConstructionCost += garageCost;
                depreciatedValue += garageCost * (decimal)ageFactor;
                costBreakdown["garage"] = Math.Round(garageCost, 2);
            }

            // Stories multiplier
            if (request.Stories.HasValue && request.Stories.Value > 1)
            {
                var storiesMultiplier = 1.0m + (request.Stories.Value - 1) * 0.15m;
                baseConstructionCost *= storiesMultiplier;
                depreciatedValue *= storiesMultiplier;
            }

            // Confidence score based on data completeness
            var confidence = CalculateConfidence(request);
            var processingTime = (DateTime.UtcNow - startTime).TotalMilliseconds;

            var result = new CostApproachResult
            {
                ParcelId = request.ParcelId,
                BaseConstructionCost = Math.Round(baseConstructionCost, 2),
                ReplacementCost = Math.Round(replacementCost, 2),
                DepreciatedValue = Math.Round(depreciatedValue, 2),
                CostPerSqFt = Math.Round(adjustedCostPerSqFt, 2),
                RegionalFactor = regionFactor,
                QualityFactor = qualityFactor,
                AgeFactor = Math.Round(ageFactor, 4),
                ConfidenceScore = confidence,
                ProcessingTimeMs = processingTime,
                CostBreakdown = costBreakdown,
                Explanation = GenerateExplanation(request, baseConstructionCost, replacementCost, depreciatedValue,
                    regionFactor, qualityFactor, ageFactor, age),
            };

            _logger.LogInformation(
                "Cost approach completed for parcel {ParcelId}: Base={BaseCost:N0}, Depreciated={DepValue:N0}, Confidence={Conf:P0}",
                request.ParcelId, baseConstructionCost, depreciatedValue, confidence);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Cost approach failed for parcel {ParcelId}", request.ParcelId);
            throw;
        }
    }

    /// <summary>
    /// Get the age-bracket factor for Marshall-Swift depreciation.
    /// Based on terra-build-actual/marshallSwift.ts age brackets.
    /// </summary>
    public static double GetAgeBracketFactor(int yearBuilt)
    {
        var age = DateTime.UtcNow.Year - yearBuilt;
        return age switch
        {
            <= 5 => 0.98,
            <= 10 => 0.94,
            <= 20 => 0.85,
            <= 30 => 0.75,
            <= 40 => 0.65,
            <= 50 => 0.55,
            <= 75 => 0.45,
            _ => 0.40,
        };
    }

    private static double CalculateConfidence(CostApproachRequest request)
    {
        var score = 0.5; // Base confidence
        if (!string.IsNullOrEmpty(request.BuildingType)) score += 0.1;
        if (!string.IsNullOrEmpty(request.Region)) score += 0.1;
        if (!string.IsNullOrEmpty(request.QualityGrade)) score += 0.1;
        if (!string.IsNullOrEmpty(request.Condition)) score += 0.1;
        if (request.SquareFootage > 0) score += 0.1;
        return Math.Min(score, 1.0);
    }

    private static string GenerateExplanation(
        CostApproachRequest request, decimal baseCost, decimal replacementCost,
        decimal depreciatedValue, double regionFactor, double qualityFactor,
        double ageFactor, int age)
    {
        return $"Cost Approach Analysis for parcel {request.ParcelId}:\n" +
               $"Building type: {request.BuildingType}, {request.SquareFootage:N0} SF, built {request.YearBuilt} (age {age})\n" +
               $"Quality: {request.QualityGrade}, Condition: {request.Condition}, Region: {request.Region}\n\n" +
               $"Base construction cost: ${baseCost:N0}\n" +
               $"  Regional factor: {regionFactor:F2}x\n" +
               $"  Quality factor: {qualityFactor:F2}x\n" +
               $"Replacement cost (inflation-adjusted): ${replacementCost:N0}\n" +
               $"  Age factor (depreciation): {ageFactor:F4}\n" +
               $"Depreciated value: ${depreciatedValue:N0}";
    }
}

// ============================================================
// DTOs
// ============================================================

public class CostApproachRequest
{
    public string ParcelId { get; set; } = string.Empty;
    public string BuildingType { get; set; } = "residential";
    public double SquareFootage { get; set; }
    public int YearBuilt { get; set; }
    public string QualityGrade { get; set; } = "average";
    public string Region { get; set; } = "suburban";
    public string Condition { get; set; } = "average";
    public int? Stories { get; set; }
    public bool? Basement { get; set; }
    public bool? Garage { get; set; }
}

public class CostApproachResult
{
    public string ParcelId { get; set; } = string.Empty;
    public decimal BaseConstructionCost { get; set; }
    public decimal ReplacementCost { get; set; }
    public decimal DepreciatedValue { get; set; }
    public decimal CostPerSqFt { get; set; }
    public double RegionalFactor { get; set; }
    public double QualityFactor { get; set; }
    public double AgeFactor { get; set; }
    public double ConfidenceScore { get; set; }
    public double ProcessingTimeMs { get; set; }
    public Dictionary<string, decimal> CostBreakdown { get; set; } = new();
    public string Explanation { get; set; } = string.Empty;
}

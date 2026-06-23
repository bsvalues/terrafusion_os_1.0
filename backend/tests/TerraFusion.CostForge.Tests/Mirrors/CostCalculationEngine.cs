// Mirror of CostForgeController's core calculation logic.
// MUST stay in sync with backend/src/TerraFusion.API/Controllers/CostForgeController.cs
// Lines 4031-4119 (ComputeCostEstimate, GetDepreciationFactor, BankersRound)
// Lines 4801-4940 (BentonCostData static class)

namespace TerraFusion.CostForge.Tests.Mirrors;

/// <summary>
/// Standalone cost calculation engine mirroring the production CostForgeController.
/// Enables unit testing without referencing the full API project (which OOMs).
/// </summary>
public static class CostCalculationEngine
{
    public static CostEstimateResult? ComputeCostEstimate(
        string buildingType, string revalArea, decimal squareFeet,
        int yearBuilt, string qualityGrade, string conditionGrade, string complexityGrade)
    {
        var entry = BentonCostData.CostMatrix.FirstOrDefault(e =>
            e.BuildingType.Equals(buildingType, StringComparison.OrdinalIgnoreCase) &&
            e.Region.Equals(revalArea, StringComparison.OrdinalIgnoreCase));

        if (entry is null) return null;

        var revalAreaFactor = BentonCostData.RegionFactors
            .GetValueOrDefault(revalArea, 1.0m);
        var qualityFactor = BentonCostData.QualityFactors
            .GetValueOrDefault(qualityGrade.ToUpperInvariant(), 1.0m);
        var conditionFactor = BentonCostData.ConditionFactors
            .GetValueOrDefault(conditionGrade.ToUpperInvariant(), 1.0m);
        var complexityFactor = BentonCostData.ComplexityFactors
            .GetValueOrDefault(complexityGrade.ToUpperInvariant(), 1.0m);

        int age = DateTime.UtcNow.Year - yearBuilt;
        if (age < 0) age = 0;

        bool isResidential = buildingType.StartsWith("R", StringComparison.OrdinalIgnoreCase)
                          || buildingType.StartsWith("A", StringComparison.OrdinalIgnoreCase);
        var depreciationFactor = GetDepreciationFactor(age, isResidential);

        // Step 1: RCN per sqft — base rate adjusted for reval area, quality, complexity
        var rcnPerSqft = BankersRound(
            entry.BaseCostPerSqft * revalAreaFactor * qualityFactor * complexityFactor);

        // Step 2: RCND per sqft — physical depreciation applied
        var rcndPerSqft = BankersRound(rcnPerSqft * depreciationFactor);

        // Step 3: RCNLD per sqft — condition applied post-depreciation (IAAO / Benton Method)
        var adjustedCostPerSqft = BankersRound(rcndPerSqft * conditionFactor);

        var totalCost = BankersRound(adjustedCostPerSqft * squareFeet);

        // Benton County assessment ratio (RCW 84.40.030 — 100% true & fair value)
        const decimal assessmentRatio = 1.00m;
        var assessedValue = BankersRound(totalCost * assessmentRatio);

        return new CostEstimateResult
        {
            BuildingType = entry.BuildingType,
            BuildingTypeLabel = entry.BuildingTypeLabel,
            RevalArea = entry.Region,
            SquareFeet = squareFeet,
            YearBuilt = yearBuilt,
            Age = age,
            BaseCostPerSqft = entry.BaseCostPerSqft,
            RevalAreaFactor = revalAreaFactor,
            QualityGrade = qualityGrade.ToUpperInvariant(),
            QualityFactor = qualityFactor,
            ConditionGrade = conditionGrade.ToUpperInvariant(),
            ConditionFactor = conditionFactor,
            ComplexityGrade = complexityGrade.ToUpperInvariant(),
            ComplexityFactor = complexityFactor,
            DepreciationFactor = depreciationFactor,
            RcnPerSqft = rcnPerSqft,
            RcndPerSqft = rcndPerSqft,
            AdjustedCostPerSqft = adjustedCostPerSqft,
            TotalCost = totalCost,
            AssessmentRatio = assessmentRatio,
            AssessedValue = assessedValue,
            MatrixYear = 2025,
            Source = "Benton County Assessor – Cost Matrix 2025",
        };
    }

    public static decimal GetDepreciationFactor(int age, bool isResidential)
    {
        var brackets = isResidential
            ? BentonCostData.ResidentialDepreciation
            : BentonCostData.CommercialDepreciation;

        foreach (var b in brackets)
        {
            if (age >= b.MinAge && age <= b.MaxAge)
                return b.Factor;
        }

        return brackets[^1].Factor;
    }

    public static decimal BankersRound(decimal value)
        => Math.Round(value, 2, MidpointRounding.ToEven);

    /// <summary>
    /// Calculate depreciation breakdown (mirrors CalculateDepreciation endpoint logic).
    /// </summary>
    public static DepreciationResult CalculateDepreciation(
        int effectiveAge, string? condition, decimal replacementCostNew)
    {
        effectiveAge = Math.Max(0, effectiveAge);
        var physicalFactor = GetDepreciationFactor(effectiveAge, isResidential: true);
        var physicalDepreciation = BankersRound((1m - physicalFactor) * 100m);

        var functionalObsolescence = condition?.ToLowerInvariant() switch
        {
            "poor" => 5.0m,
            "fair" => 3.0m,
            _ => 0.0m,
        };

        const decimal externalObsolescence = 0.0m;
        var totalDepreciation = physicalDepreciation + functionalObsolescence + externalObsolescence;
        var depreciatedValue = BankersRound(replacementCostNew * (1m - totalDepreciation / 100m));

        return new DepreciationResult
        {
            PhysicalDepreciation = physicalDepreciation,
            FunctionalObsolescence = functionalObsolescence,
            ExternalObsolescence = externalObsolescence,
            TotalDepreciation = totalDepreciation,
            DepreciatedValue = depreciatedValue,
        };
    }

    /// <summary>
    /// Normalize reval area string (mirrors NormalizeExplicitRevalArea).
    /// </summary>
    public static string? NormalizeExplicitRevalArea(string? region)
    {
        if (string.IsNullOrWhiteSpace(region))
            return null;

        var trimmed = region.Trim();
        var exactMatch = BentonCostData.RegionFactors.Keys
            .FirstOrDefault(key => key.Equals(trimmed, StringComparison.OrdinalIgnoreCase));
        if (exactMatch is not null)
            return exactMatch;

        if (int.TryParse(trimmed, out var numericReval)
            && BentonCostData.RegionFactors.ContainsKey($"Reval {numericReval}"))
        {
            return $"Reval {numericReval}";
        }

        if (trimmed.StartsWith("REVAL", StringComparison.OrdinalIgnoreCase))
        {
            var digits = new string(trimmed.Where(char.IsDigit).ToArray());
            if (int.TryParse(digits, out numericReval)
                && BentonCostData.RegionFactors.ContainsKey($"Reval {numericReval}"))
            {
                return $"Reval {numericReval}";
            }
        }

        return null;
    }
}

// ─── Result Types ─────────────────────────────────────────────────────────────

public sealed class CostEstimateResult
{
    public string BuildingType { get; init; } = "";
    public string BuildingTypeLabel { get; init; } = "";
    public string RevalArea { get; init; } = "";
    public decimal SquareFeet { get; init; }
    public int YearBuilt { get; init; }
    public int Age { get; init; }
    public decimal BaseCostPerSqft { get; init; }
    public decimal RevalAreaFactor { get; init; }
    public string QualityGrade { get; init; } = "";
    public decimal QualityFactor { get; init; }
    public string ConditionGrade { get; init; } = "";
    public decimal ConditionFactor { get; init; }
    public string ComplexityGrade { get; init; } = "";
    public decimal ComplexityFactor { get; init; }
    public decimal DepreciationFactor { get; init; }
    public decimal RcnPerSqft { get; init; }
    public decimal RcndPerSqft { get; init; }
    public decimal AdjustedCostPerSqft { get; init; }
    public decimal TotalCost { get; init; }
    public decimal AssessmentRatio { get; init; }
    public decimal AssessedValue { get; init; }
    public int MatrixYear { get; init; }
    public string Source { get; init; } = "";
}

public sealed class DepreciationResult
{
    public decimal PhysicalDepreciation { get; init; }
    public decimal FunctionalObsolescence { get; init; }
    public decimal ExternalObsolescence { get; init; }
    public decimal TotalDepreciation { get; init; }
    public decimal DepreciatedValue { get; init; }
}

// ─── Benton County Cost Data (mirror of production static class) ──────────────

public static class BentonCostData
{
    public static readonly CostMatrixEntry[] CostMatrix =
    [
        // Reval 1 — Kennewick (Urban Core)
        new("R1", "Single Family Residential", "Reval 1", 127.50m),
        new("R2", "Multi-Family Residential", "Reval 1", 115.75m),
        new("C1", "Commercial Retail", "Reval 1", 138.90m),
        new("C2", "Office", "Reval 1", 152.30m),
        new("C3", "Restaurant", "Reval 1", 164.75m),
        new("C4", "Warehouse", "Reval 1", 54.28m),
        new("A1", "Farm", "Reval 1", 92.50m),
        new("A2", "Ranch", "Reval 1", 88.15m),
        new("I1", "Industrial", "Reval 1", 105.03m),
        new("S1", "Hospital", "Reval 1", 196.46m),
        new("S2", "School", "Reval 1", 149.32m),
        // Reval 2 — West Richland / Badger Mountain
        new("R1", "Single Family Residential", "Reval 2", 133.88m),
        new("R2", "Multi-Family Residential", "Reval 2", 121.54m),
        new("C1", "Commercial Retail", "Reval 2", 145.85m),
        new("C2", "Office", "Reval 2", 159.92m),
        new("C3", "Restaurant", "Reval 2", 172.99m),
        new("C4", "Warehouse", "Reval 2", 56.99m),
        new("A1", "Farm", "Reval 2", 97.13m),
        new("A2", "Ranch", "Reval 2", 92.56m),
        new("I1", "Industrial", "Reval 2", 110.28m),
        new("S1", "Hospital", "Reval 2", 206.28m),
        new("S2", "School", "Reval 2", 156.79m),
        // Reval 3 — North Richland / Horn Rapids
        new("R1", "Single Family Residential", "Reval 3", 140.25m),
        new("R2", "Multi-Family Residential", "Reval 3", 127.33m),
        new("C1", "Commercial Retail", "Reval 3", 152.79m),
        new("C2", "Office", "Reval 3", 167.53m),
        new("C3", "Restaurant", "Reval 3", 181.23m),
        new("C4", "Warehouse", "Reval 3", 59.71m),
        new("A1", "Farm", "Reval 3", 101.75m),
        new("A2", "Ranch", "Reval 3", 96.97m),
        new("I1", "Industrial", "Reval 3", 115.53m),
        new("S1", "Hospital", "Reval 3", 216.11m),
        new("S2", "School", "Reval 3", 164.25m),
        // Reval 4 — East Benton / Benton City
        new("R1", "Single Family Residential", "Reval 4", 121.13m),
        new("R2", "Multi-Family Residential", "Reval 4", 109.96m),
        new("C1", "Commercial Retail", "Reval 4", 131.96m),
        new("C2", "Office", "Reval 4", 144.69m),
        new("C3", "Restaurant", "Reval 4", 156.51m),
        new("C4", "Warehouse", "Reval 4", 51.57m),
        new("A1", "Farm", "Reval 4", 87.88m),
        new("A2", "Ranch", "Reval 4", 83.74m),
        new("I1", "Industrial", "Reval 4", 99.78m),
        new("S1", "Hospital", "Reval 4", 186.64m),
        new("S2", "School", "Reval 4", 141.85m),
        // Reval 5 — Prosser / Wine Country
        new("R1", "Single Family Residential", "Reval 5", 114.75m),
        new("R2", "Multi-Family Residential", "Reval 5", 104.18m),
        new("C1", "Commercial Retail", "Reval 5", 125.01m),
        new("C2", "Office", "Reval 5", 137.07m),
        new("C3", "Restaurant", "Reval 5", 148.28m),
        new("C4", "Warehouse", "Reval 5", 48.85m),
        new("A1", "Farm", "Reval 5", 83.25m),
        new("A2", "Ranch", "Reval 5", 79.34m),
        new("I1", "Industrial", "Reval 5", 94.53m),
        new("S1", "Hospital", "Reval 5", 176.81m),
        new("S2", "School", "Reval 5", 134.39m),
        // Reval 6 — Rural / Agricultural Lands
        new("R1", "Single Family Residential", "Reval 6", 104.55m),
        new("R2", "Multi-Family Residential", "Reval 6", 94.92m),
        new("C1", "Commercial Retail", "Reval 6", 113.90m),
        new("C2", "Office", "Reval 6", 124.89m),
        new("C3", "Restaurant", "Reval 6", 135.10m),
        new("C4", "Warehouse", "Reval 6", 44.51m),
        new("A1", "Farm", "Reval 6", 75.85m),
        new("A2", "Ranch", "Reval 6", 72.28m),
        new("I1", "Industrial", "Reval 6", 86.12m),
        new("S1", "Hospital", "Reval 6", 161.10m),
        new("S2", "School", "Reval 6", 122.44m),
    ];

    public static readonly Dictionary<string, decimal> RegionFactors = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Reval 1"] = 1.00m,
        ["Reval 2"] = 1.05m,
        ["Reval 3"] = 1.10m,
        ["Reval 4"] = 0.95m,
        ["Reval 5"] = 0.90m,
        ["Reval 6"] = 0.82m,
    };

    public static readonly Dictionary<string, decimal> QualityFactors = new(StringComparer.OrdinalIgnoreCase)
    {
        ["ECONOMY"] = 0.75m,
        ["STANDARD"] = 1.00m,
        ["CUSTOM"] = 1.12m,
        ["PREMIUM"] = 1.30m,
        ["LUXURY"] = 1.55m,
    };

    public static readonly Dictionary<string, decimal> ConditionFactors = new(StringComparer.OrdinalIgnoreCase)
    {
        ["POOR"] = 0.65m,
        ["FAIR"] = 0.80m,
        ["GOOD"] = 1.00m,
        ["EXCELLENT"] = 1.10m,
    };

    public static readonly Dictionary<string, decimal> ComplexityFactors = new(StringComparer.OrdinalIgnoreCase)
    {
        ["SIMPLE"] = 0.90m,
        ["STANDARD"] = 1.00m,
        ["COMPLEX"] = 1.10m,
        ["HIGHLY_COMPLEX"] = 1.20m,
    };

    public static readonly DepreciationBracket[] ResidentialDepreciation =
    [
        new(0, 5, 0.95m),
        new(6, 15, 0.87m),
        new(16, 25, 0.70m),
        new(26, 40, 0.50m),
        new(41, 999, 0.35m),
    ];

    public static readonly DepreciationBracket[] CommercialDepreciation =
    [
        new(0, 5, 0.97m),
        new(6, 15, 0.85m),
        new(16, 25, 0.65m),
        new(26, 35, 0.40m),
        new(36, 999, 0.25m),
    ];
}

public sealed record CostMatrixEntry(string BuildingType, string BuildingTypeLabel, string Region, decimal BaseCostPerSqft);
public sealed record DepreciationBracket(int MinAge, int MaxAge, decimal Factor);

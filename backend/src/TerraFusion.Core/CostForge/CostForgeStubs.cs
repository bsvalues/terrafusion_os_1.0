// ---------------------------------------------------------------------------
// COMPILE STUBS — TerraFusion.Core.CostForge
// ---------------------------------------------------------------------------
// The TerraFusion.Core.CostForge namespace was previously a separate module.
// Controllers still reference it via `using TerraFusion.Core.CostForge;`.
// This file provides minimal compile-time stubs so the API project builds.
// Real implementations should be placed here in a future CostForge domain pass.
// ---------------------------------------------------------------------------
using TerraFusion.Core.Entities;

namespace TerraFusion.Core.CostForge;

/// <summary>Age-life depreciation bracket resolved from the cost matrix.</summary>
public sealed class CostForgeDepreciationBracket
{
    public int MinAge { get; init; }
    public int MaxAge { get; init; }
    /// <summary>Decimal depreciation factor for this bracket (0–1 scale).</summary>
    public decimal Factor { get; init; }
    public decimal DepreciationFactor { get; init; }
    public string Category { get; init; } = string.Empty;
}

/// <summary>Adjustment profile extracted from a cost matrix row.</summary>
public sealed class CostForgeAdjustmentProfile
{
    public decimal LocalMultiplier { get; init; } = 1.0m;
    public decimal EntrepreneurialIncentive { get; init; } = 1.0m;
    public string DepreciationCategory { get; init; } = "residential";
    public decimal EconomicLifeByType { get; init; } = 50m;
    public IReadOnlyList<string> FunctionalObsolescenceFactors { get; init; } = Array.Empty<string>();
    public IReadOnlyList<string> ExternalObsolescenceFactors { get; init; } = Array.Empty<string>();

    // Depreciation reference fields
    public decimal RegionFactor { get; init; } = 1.0m;
    public int UsefulLifeYears { get; init; } = 50;
    public decimal DepreciationRate { get; init; } = 0.02m;
    public IReadOnlyList<CostForgeDepreciationBracket> DepreciationBrackets { get; init; } = Array.Empty<CostForgeDepreciationBracket>();

    // Factor lookup tables (grade code → multiplier)
    public IReadOnlyDictionary<string, decimal> QualityFactors { get; init; } = new Dictionary<string, decimal>();
    public IReadOnlyDictionary<string, decimal> ConditionFactors { get; init; } = new Dictionary<string, decimal>();
}

/// <summary>Land rate schedule entry for a zone.</summary>
public sealed class CostForgeLandRate
{
    public string Zone { get; init; } = string.Empty;
    public decimal BaseRatePerSqft { get; init; }
}

/// <summary>Site / yard improvement schedule entry.</summary>
public sealed class CostForgeSiteImprovement
{
    public string Code { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public decimal ValuePerUnit { get; init; }
    public decimal UnitCost { get; init; }
}

/// <summary>
/// Static helper that resolves valuation reference data from a CostMatrix row.
/// Stub implementation — methods return identity multipliers and empty collections.
/// Replace with real extraction logic when CostMatrix data is fully seeded.
/// </summary>
public static class CostForgeReferenceData
{
    public static decimal ResolveRegionFactor(CostMatrix row)
        => row.AdjustmentFactor;

    public static decimal ResolveQualityFactor(CostMatrix row, string? qualityGrade)
        => 1.0m;

    public static decimal ResolveConditionFactor(CostMatrix row, string? conditionGrade)
        => 1.0m;

    public static decimal ResolveComplexityFactor(CostMatrix row, string? complexityGrade)
        => 1.0m;

    public static CostForgeDepreciationBracket ResolveDepreciationBracket(CostMatrix row, int age)
        => new()
        {
            MinAge = 0,
            MaxAge = 200,
            Factor = row.DepreciationRate ?? 0m,
            DepreciationFactor = row.DepreciationRate ?? 0m,
            Category = "residential"
        };

    public static decimal ResolveDepreciationFactor(CostMatrix row, int age)
        => row.DepreciationRate ?? 0m;

    /// <summary>
    /// Returns the default depreciation factor when no cost matrix rows are available.
    /// Simple straight-line age-life model with 85% cap.
    /// </summary>
    public static decimal GetDefaultDepreciationFactor(int age, bool isResidential)
    {
        var economicLife = isResidential ? 50m : 40m;
        return Math.Max(0m, 1m - Math.Min((decimal)age / economicLife, 0.85m));
    }

    public static CostForgeAdjustmentProfile GetAdjustmentProfile(CostMatrix row)
        => new();

    public static IReadOnlyList<CostForgeLandRate> GetLandRates(CostMatrix row)
        => Array.Empty<CostForgeLandRate>();

    public static IReadOnlyList<CostForgeSiteImprovement> GetSiteImprovements(CostMatrix row)
        => Array.Empty<CostForgeSiteImprovement>();

    public static int ResolveEconomicLifeYears(CostMatrix row, string? buildingType)
        => 50;

    public static CostForgeLandRate? FindLandRate(CostMatrix row, string zone)
        => null;

    public static CostForgeSiteImprovement? FindSiteImprovement(CostMatrix row, string code)
        => null;

    // ---------------------------------------------------------------------------
    // Canonical reference factor tables
    // ---------------------------------------------------------------------------

    public static IReadOnlyList<string> GetNormalizedBuildingTypeCandidates(string buildingType)
    {
        if (string.IsNullOrWhiteSpace(buildingType))
            return Array.Empty<string>();
        return new[] { buildingType.Trim().ToUpperInvariant(), buildingType.Trim() };
    }

    public static IReadOnlyDictionary<string, decimal> GetCanonicalQualityFactors()
        => new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);

    public static IReadOnlyDictionary<string, decimal> GetCanonicalConditionFactors()
        => new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);

    public static IReadOnlyDictionary<string, decimal> GetCanonicalComplexityFactors()
        => new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);

    public static IReadOnlyDictionary<string, decimal> GetCanonicalRegionFactors()
        => new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);

    public static IReadOnlyList<CostForgeDepreciationBracket> GetDefaultDepreciationBrackets(
        bool isResidential = true)
        => Array.Empty<CostForgeDepreciationBracket>();

    public static string BuildCanonicalAdjustmentFactorsJson(string? region, string? buildingType, decimal? depreciationRate)
        => System.Text.Json.JsonSerializer.Serialize(new
        {
            region,
            buildingType,
            depreciationRate,
            source = "stub"
        });
}

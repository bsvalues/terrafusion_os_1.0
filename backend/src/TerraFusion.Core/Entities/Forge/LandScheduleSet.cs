using TerraFusion.Core.Entities;

namespace TerraFusion.Core.Entities.Forge;

/// <summary>Result of resolving a land rate; a miss is explicit (no silent default).</summary>
public readonly record struct LandRateResolution(bool Found, decimal MarketUnitValue, decimal? CurrentUseUnitValue, string Explanation);

/// <summary>A TF-owned land rate for a neighborhood: market unit value and optional WA current-use unit value.</summary>
public sealed class LandRate
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LandScheduleSetId { get; set; }

    /// <summary>Neighborhood code (maps to parcel/land neighborhood).</summary>
    public required string Neighborhood { get; set; }

    /// <summary>TF-owned market unit value (per land unit, e.g. per sq ft).</summary>
    public decimal MarketUnitValue { get; set; }

    /// <summary>TF-owned WA current-use/ag reduced unit value; null when current-use is not applicable.</summary>
    public decimal? CurrentUseUnitValue { get; set; }
}

/// <summary>
/// WS-1 — TF-native, county-scoped, versioned land schedule (D-VAL-1). Same provenance/versioning/
/// audit contract as <see cref="CostFactorSet"/>; deterministic neighborhood lookup. Current-use/ag
/// (WA RCW 84.34) is an explicit reduced-value path, never a silent fallback.
/// </summary>
public sealed class LandScheduleSet : IAuditableEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CountyId { get; set; }
    public int EffectiveYear { get; set; }
    public string? RevalCycle { get; set; }
    public string Version { get; set; } = string.Empty;
    public ReferenceDataOrigin Origin { get; set; } = ReferenceDataOrigin.TerraFusionOwned;
    public string ProvenanceAuthor { get; set; } = string.Empty;
    public List<LandRate> Rates { get; set; } = new();

    public bool IsVendorDependent => false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "system";
    public string? UpdatedBy { get; set; }

    public void EnsureTfProvenance()
    {
        if (string.IsNullOrWhiteSpace(Version))
            throw new InvalidOperationException("LandScheduleSet provenance incomplete: Version is required (D-VAL-1).");
        if (string.IsNullOrWhiteSpace(ProvenanceAuthor))
            throw new InvalidOperationException("LandScheduleSet provenance incomplete: ProvenanceAuthor is required (D-VAL-1).");
        if (EffectiveYear <= 0)
            throw new InvalidOperationException("LandScheduleSet provenance incomplete: EffectiveYear is required (D-VAL-1).");
    }

    /// <summary>Deterministically resolves the land rate for a neighborhood; explicit on miss.</summary>
    public LandRateResolution ResolveRate(string neighborhood)
    {
        var rate = Rates
            .Where(r => string.Equals(r.Neighborhood, neighborhood, StringComparison.OrdinalIgnoreCase))
            .OrderBy(r => r.Id)
            .FirstOrDefault();

        if (rate is null)
            return new LandRateResolution(false, 0m, null,
                $"No TF land rate for neighborhood '{neighborhood}' in schedule '{Version}' (county {CountyId}, year {EffectiveYear}).");

        return new LandRateResolution(true, rate.MarketUnitValue, rate.CurrentUseUnitValue,
            $"TF land rate market {rate.MarketUnitValue}/unit (current-use {(rate.CurrentUseUnitValue?.ToString() ?? "n/a")}) for '{neighborhood}' (set '{Version}').");
    }
}

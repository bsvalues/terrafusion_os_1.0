using TerraFusion.Core.Entities;

namespace TerraFusion.Core.Entities.Forge;

/// <summary>Result of resolving physical depreciation; a miss is explicit (no silent default).</summary>
public readonly record struct DepreciationResolution(bool Found, decimal Fraction, string Explanation);

/// <summary>A TF-owned physical-depreciation line item: an effective-age band → depreciation fraction (0..1).</summary>
public sealed class DepreciationFactor
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DepreciationScheduleId { get; set; }

    /// <summary>Inclusive lower bound of the effective-age band (years).</summary>
    public int AgeMinYears { get; set; }

    /// <summary>Inclusive upper bound of the effective-age band (years).</summary>
    public int AgeMaxYears { get; set; }

    /// <summary>Physical depreciation fraction (0..1) for this age band.</summary>
    public decimal DepreciationFraction { get; set; }
}

/// <summary>
/// WS-1 — TF-native, county-scoped, versioned physical-depreciation schedule (D-VAL-1). Same
/// provenance/versioning/audit contract as <see cref="CostFactorSet"/>; deterministic age→fraction
/// lookup. No vendor depreciation table.
/// </summary>
public sealed class DepreciationSchedule : IAuditableEntity, IReferenceDataSet
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CountyId { get; set; }
    public int EffectiveYear { get; set; }
    public string? RevalCycle { get; set; }
    public string Version { get; set; } = string.Empty;
    public ReferenceDataOrigin Origin { get; set; } = ReferenceDataOrigin.TerraFusionOwned;
    public string ProvenanceAuthor { get; set; } = string.Empty;
    public List<DepreciationFactor> Factors { get; set; } = new();

    public bool IsVendorDependent => false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "system";
    public string? UpdatedBy { get; set; }

    public void EnsureTfProvenance()
    {
        if (string.IsNullOrWhiteSpace(Version))
            throw new InvalidOperationException("DepreciationSchedule provenance incomplete: Version is required (D-VAL-1).");
        if (string.IsNullOrWhiteSpace(ProvenanceAuthor))
            throw new InvalidOperationException("DepreciationSchedule provenance incomplete: ProvenanceAuthor is required (D-VAL-1).");
        if (EffectiveYear <= 0)
            throw new InvalidOperationException("DepreciationSchedule provenance incomplete: EffectiveYear is required (D-VAL-1).");
    }

    /// <summary>
    /// Deterministically resolves physical depreciation for an effective age. Prefers the
    /// narrowest matching age band; an unmatched age is an explicit, explained miss.
    /// </summary>
    public DepreciationResolution ResolveDepreciation(int effectiveAgeYears)
    {
        var match = Factors
            .Where(f => effectiveAgeYears >= f.AgeMinYears && effectiveAgeYears <= f.AgeMaxYears)
            .OrderBy(f => (long)f.AgeMaxYears - f.AgeMinYears)
            .ThenBy(f => f.Id)
            .FirstOrDefault();

        if (match is null)
            return new DepreciationResolution(false, 0m,
                $"No TF depreciation band for effective age {effectiveAgeYears} in schedule '{Version}' (county {CountyId}, year {EffectiveYear}).");

        return new DepreciationResolution(true, match.DepreciationFraction,
            $"TF physical depreciation {match.DepreciationFraction} for effective age {effectiveAgeYears} (band {match.AgeMinYears}-{match.AgeMaxYears}, set '{Version}').");
    }
}

using TerraFusion.Core.Entities;

namespace TerraFusion.Core.Entities.Forge;

/// <summary>
/// Result of resolving a unit cost from a <see cref="CostFactorSet"/>. A miss is explicit
/// (<see cref="Found"/> = false) with an <see cref="Explanation"/> — never a silent default value.
/// </summary>
public readonly record struct CostFactorResolution(
    bool Found,
    decimal UnitCostPerSqFt,
    string? ClassCode,
    string Explanation);

/// <summary>
/// WS-1 / 1f — TF-native, county-scoped, versioned cost-factor reference set (D-VAL-1).
/// Owns its provenance (TerraFusion-owned, never a vendor cost basis) and a deterministic factor
/// lookup. Implements <see cref="IAuditableEntity"/> so writes inherit WS-3 audit stamping; there
/// is no separate audit path. Honors county isolation via <see cref="CountyId"/>.
/// </summary>
public sealed class CostFactorSet : IAuditableEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Sovereign-county isolation.</summary>
    public Guid CountyId { get; set; }

    /// <summary>Assessment/effective year the set applies to.</summary>
    public int EffectiveYear { get; set; }

    /// <summary>Reval cycle label (e.g. "2025-2030").</summary>
    public string? RevalCycle { get; set; }

    /// <summary>TF-owned version identifier (part of provenance; enables pinned, repeatable lookups).</summary>
    public string Version { get; set; } = string.Empty;

    /// <summary>TF-owned provenance origin (no vendor origin is representable).</summary>
    public ReferenceDataOrigin Origin { get; set; } = ReferenceDataOrigin.TerraFusionOwned;

    /// <summary>TF authoring/citation for provenance completeness.</summary>
    public string ProvenanceAuthor { get; set; } = string.Empty;

    public List<CostFactor> Factors { get; set; } = new();

    /// <summary>D-VAL-1: this reference data is never vendor/third-party dependent.</summary>
    public bool IsVendorDependent => false;

    // WS-3 audit fields (IAuditableEntity) — stamped automatically by AuditableEntityInterceptor.
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "system";
    public string? UpdatedBy { get; set; }

    /// <summary>
    /// Validates TF provenance completeness (D-VAL-1 / EI-2). Throws when version, author, or
    /// effective year is missing — incomplete provenance is not runtime-legal.
    /// </summary>
    public void EnsureTfProvenance()
    {
        if (string.IsNullOrWhiteSpace(Version))
            throw new InvalidOperationException("CostFactorSet provenance incomplete: Version is required (D-VAL-1).");
        if (string.IsNullOrWhiteSpace(ProvenanceAuthor))
            throw new InvalidOperationException("CostFactorSet provenance incomplete: ProvenanceAuthor is required (D-VAL-1).");
        if (EffectiveYear <= 0)
            throw new InvalidOperationException("CostFactorSet provenance incomplete: EffectiveYear is required (D-VAL-1).");
    }

    /// <summary>
    /// Deterministically resolves the unit cost for an improvement class + size. Prefers the most
    /// specific (narrowest) size band that contains the size; unbanded factors are the fallback.
    /// A miss returns an explicit, explained <see cref="CostFactorResolution"/> — never a silent value.
    /// </summary>
    public CostFactorResolution ResolveUnitCost(string improvementClassCode, int sizeSqFt)
    {
        var candidate = Factors
            .Where(f => string.Equals(f.ImprovementClassCode, improvementClassCode, StringComparison.OrdinalIgnoreCase))
            .Where(f => (f.SizeBandMinSqFt is null || sizeSqFt >= f.SizeBandMinSqFt)
                     && (f.SizeBandMaxSqFt is null || sizeSqFt <= f.SizeBandMaxSqFt))
            .OrderBy(f => BandWidth(f)) // narrowest band first; unbanded = widest
            .ThenBy(f => f.Id)          // stable tie-break
            .FirstOrDefault();

        if (candidate is null)
            return new CostFactorResolution(false, 0m, null,
                $"No TF cost factor for class '{improvementClassCode}' size {sizeSqFt} sqft in set '{Version}' (county {CountyId}, year {EffectiveYear}).");

        return new CostFactorResolution(true, candidate.UnitCostPerSqFt, candidate.ImprovementClassCode,
            $"TF cost factor {candidate.UnitCostPerSqFt}/sqft for class '{candidate.ImprovementClassCode}' (set '{Version}', year {EffectiveYear}).");
    }

    private static long BandWidth(CostFactor f)
        => f.SizeBandMinSqFt is int min && f.SizeBandMaxSqFt is int max
            ? (long)max - min
            : long.MaxValue;
}

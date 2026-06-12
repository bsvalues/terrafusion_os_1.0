using TerraFusion.Core.Entities;

namespace TerraFusion.Core.Entities.Forge;

/// <summary>Result of resolving a capitalization rate; a miss/invalid rate is explicit.</summary>
public readonly record struct CapRateResolution(bool Found, decimal CapitalizationRate, string Explanation);

/// <summary>A TF-owned capitalization rate for an income property class.</summary>
public sealed class CapRate
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CapRateSetId { get; set; }

    /// <summary>Income property class (e.g. APT, RETAIL, OFFICE).</summary>
    public required string IncomePropertyClass { get; set; }

    /// <summary>TF-owned capitalization rate (fraction, e.g. 0.08).</summary>
    public decimal CapitalizationRate { get; set; }
}

/// <summary>
/// WS-1 — TF-native, county-scoped, versioned capitalization-rate set (D-VAL-1). Same provenance/
/// versioning/audit contract as the other reference sets; deterministic class lookup. A non-positive
/// rate is treated as invalid (explicit miss) — never a divide-by-zero or silent value.
/// </summary>
public sealed class CapRateSet : IAuditableEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CountyId { get; set; }
    public int EffectiveYear { get; set; }
    public string? RevalCycle { get; set; }
    public string Version { get; set; } = string.Empty;
    public ReferenceDataOrigin Origin { get; set; } = ReferenceDataOrigin.TerraFusionOwned;
    public string ProvenanceAuthor { get; set; } = string.Empty;
    public List<CapRate> Rates { get; set; } = new();

    public bool IsVendorDependent => false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "system";
    public string? UpdatedBy { get; set; }

    public void EnsureTfProvenance()
    {
        if (string.IsNullOrWhiteSpace(Version))
            throw new InvalidOperationException("CapRateSet provenance incomplete: Version is required (D-VAL-1).");
        if (string.IsNullOrWhiteSpace(ProvenanceAuthor))
            throw new InvalidOperationException("CapRateSet provenance incomplete: ProvenanceAuthor is required (D-VAL-1).");
        if (EffectiveYear <= 0)
            throw new InvalidOperationException("CapRateSet provenance incomplete: EffectiveYear is required (D-VAL-1).");
    }

    /// <summary>Deterministically resolves a positive cap rate for the class; explicit on miss/invalid.</summary>
    public CapRateResolution ResolveCapRate(string incomePropertyClass)
    {
        var match = Rates
            .Where(r => string.Equals(r.IncomePropertyClass, incomePropertyClass, StringComparison.OrdinalIgnoreCase))
            .OrderBy(r => r.Id)
            .FirstOrDefault();

        if (match is null)
            return new CapRateResolution(false, 0m,
                $"No TF cap rate for income class '{incomePropertyClass}' in set '{Version}' (county {CountyId}, year {EffectiveYear}).");

        if (match.CapitalizationRate <= 0m)
            return new CapRateResolution(false, match.CapitalizationRate,
                $"TF cap rate for income class '{incomePropertyClass}' is non-positive ({match.CapitalizationRate}); invalid for direct capitalization.");

        return new CapRateResolution(true, match.CapitalizationRate,
            $"TF cap rate {match.CapitalizationRate} for income class '{incomePropertyClass}' (set '{Version}').");
    }
}

namespace TerraFusion.Core.Entities.Forge;

/// <summary>
/// TF-native selection over cost-factor reference sets. County-scoped and version-pinned:
/// it returns the set for an exact (county, effective year) — no cross-county fallback and no
/// nearest-year guessing. A miss returns null (the caller decides; never a silent default set).
/// </summary>
public static class CostFactorCatalog
{
    /// <summary>Selects the TF cost-factor set for an exact county + effective year. STUB (red phase).</summary>
    public static CostFactorSet? Select(IEnumerable<CostFactorSet> sets, Guid countyId, int effectiveYear)
    {
        return sets
            .Where(s => s.CountyId == countyId && s.EffectiveYear == effectiveYear)
            .OrderByDescending(s => s.Version, StringComparer.Ordinal) // deterministic if multiple share a year
            .FirstOrDefault();
    }
}

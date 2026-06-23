namespace TerraFusion.Core.Entities.Forge;

/// <summary>Common shape of a county-scoped, versioned TF reference-data set (selectable by year).</summary>
public interface IReferenceDataSet
{
    Guid CountyId { get; }
    int EffectiveYear { get; }
    string Version { get; }
}

/// <summary>
/// County-scoped, effective-year-pinned selection over any TF reference-data set. No cross-county
/// fallback and no nearest-year guessing; a miss returns null.
/// </summary>
public static class ReferenceCatalog
{
    public static T? Select<T>(IEnumerable<T> sets, Guid countyId, int effectiveYear) where T : class, IReferenceDataSet
        => sets
            .Where(s => s.CountyId == countyId && s.EffectiveYear == effectiveYear)
            .OrderByDescending(s => s.Version, StringComparer.Ordinal)
            .FirstOrDefault();
}

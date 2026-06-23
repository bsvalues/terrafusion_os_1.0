namespace TerraFusion.Core.Entities.Forge;

/// <summary>Sovereign-county isolation guard for Forge valuation (pack V10).</summary>
public static class ForgeCountyGuard
{
    /// <summary>Throws when a reference/source county does not match the parcel's county.</summary>
    public static void EnsureSameCounty(Guid parcelCountyId, Guid referenceCountyId)
    {
        if (parcelCountyId != referenceCountyId)
            throw new InvalidOperationException(
                $"Cross-county reference rejected: parcel county {parcelCountyId} != reference county {referenceCountyId} (sovereign-county isolation).");
    }
}

/// <summary>
/// Forge write-lane discipline (pack V11): Forge writes ONLY valuation columns. Supplement/notice/
/// appeal columns belong to Dais and must never be written by Forge.
/// </summary>
public static class ForgeWriteLane
{
    /// <summary>Valuation columns Forge is allowed to write.</summary>
    public static readonly IReadOnlySet<string> AllowedValuationColumns = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        "AssessedValue", "MarketValue", "LandValue", "ImprovementValue", "AssessmentMethod", "AssessorNotes",
    };

    /// <summary>Throws if any column is outside Forge's valuation write-lane.</summary>
    public static void EnsureValuationColumnsOnly(IEnumerable<string> columns)
    {
        var offending = columns.Where(c => !AllowedValuationColumns.Contains(c)).ToList();
        if (offending.Count > 0)
            throw new InvalidOperationException(
                $"Forge write-lane violation: columns outside the valuation lane (belong to Dais/Dossier): {string.Join(", ", offending)}.");
    }
}

using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.Doctrine;

/// <summary>
/// SYNC-DOCTRINE-4: per-universe imprv_attr code dictionary. Replaces
/// the global <see cref="TerraFusion.Core.Sync.PacsImprvAttr.IImprvAttrDictionary"/>
/// for universe-aware lookups.
///
/// <para>A code is "known" if and only if it appears in
/// <c>doctrine_tf.tf_doctrine_attribute_dictionary</c> for THE row's
/// universe + county + year window. Quarantine semantics become
/// per-universe: <c>UNKNOWN_FOR_UNIVERSE_DICTIONARY</c> only fires
/// when the code is missing from THAT row's universe — not from any
/// other universe's dictionary.</para>
/// </summary>
public interface IPerUniverseAttributeDictionary
{
    /// <summary>
    /// Look up an imprv_attr code under a specific universe.
    /// </summary>
    /// <param name="county">Lowercase-hyphenated county slug.</param>
    /// <param name="universeCode">
    /// One of <see cref="UniverseCodes"/>. Calling with
    /// <c>UNKNOWN</c> always returns
    /// <see cref="DictionaryLookupResult.NotEvaluated"/>.
    /// </param>
    /// <param name="year">PropValYr for effective-window matching.</param>
    /// <param name="imprvAttrId">PACS imprv_attr_id (column id).</param>
    /// <param name="iAttrValCd">PACS i_attr_val_cd (the value being recognized).</param>
    Task<DictionaryLookupResult> LookupAsync(
        string county,
        string universeCode,
        int year,
        string imprvAttrId,
        string iAttrValCd,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns the number of dictionary rows currently loaded for
    /// <paramref name="county"/> + <paramref name="universeCode"/>.
    /// Used by the gate writer to record per-universe dictionary
    /// load state.
    /// </summary>
    Task<int> CountForUniverseAsync(
        string county,
        string universeCode,
        CancellationToken cancellationToken = default);

    /// <summary>Drop the cached entries for the given county (or all when null).</summary>
    void InvalidateCache(string? county = null);
}

/// <summary>
/// Outcome of <see cref="IPerUniverseAttributeDictionary.LookupAsync"/>.
/// </summary>
public enum DictionaryLookupOutcome
{
    /// <summary>The code is present in the per-universe dictionary.</summary>
    Known = 1,

    /// <summary>The universe is loaded; the code is genuinely absent.</summary>
    UnknownForUniverse = 2,

    /// <summary>The universe has zero active dictionary rows; cannot evaluate.</summary>
    DictionaryNotLoaded = 3,

    /// <summary>The universe was UNKNOWN at the call site; no lookup attempted.</summary>
    UniverseNotEvaluated = 4,
}

/// <summary>
/// Result of <see cref="IPerUniverseAttributeDictionary.LookupAsync"/>.
/// </summary>
/// <param name="Outcome">Categorical outcome (see <see cref="DictionaryLookupOutcome"/>).</param>
/// <param name="MatchedRowId">
/// The matching dictionary row's id when
/// <see cref="Outcome"/> = <see cref="DictionaryLookupOutcome.Known"/>;
/// NULL otherwise.
/// </param>
/// <param name="QuarantineReason">
/// The reason to write on a quarantine row when
/// <see cref="Outcome"/> != <see cref="DictionaryLookupOutcome.Known"/>.
/// One of <see cref="UniverseQuarantineReasons"/>. NULL when known.
/// </param>
public sealed record DictionaryLookupResult(
    DictionaryLookupOutcome Outcome,
    Guid? MatchedRowId,
    string? QuarantineReason)
{
    /// <summary>True iff the code resolved successfully.</summary>
    public bool IsKnown => Outcome == DictionaryLookupOutcome.Known;

    public static DictionaryLookupResult Known(Guid rowId)
        => new(DictionaryLookupOutcome.Known, rowId, null);

    public static DictionaryLookupResult UnknownForUniverse()
        => new(DictionaryLookupOutcome.UnknownForUniverse, null,
               UniverseQuarantineReasons.UnknownForUniverseDictionary);

    public static DictionaryLookupResult DictionaryNotLoaded()
        => new(DictionaryLookupOutcome.DictionaryNotLoaded, null,
               UniverseQuarantineReasons.DictionaryNotLoadedForUniverse);

    public static DictionaryLookupResult NotEvaluated()
        => new(DictionaryLookupOutcome.UniverseNotEvaluated, null,
               UniverseQuarantineReasons.UniverseNotEvaluated);
}

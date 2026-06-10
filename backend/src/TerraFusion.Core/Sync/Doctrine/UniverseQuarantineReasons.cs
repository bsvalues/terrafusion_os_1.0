using System.Collections.Generic;

namespace TerraFusion.Core.Sync.Doctrine;

/// <summary>
/// SYNC-DOCTRINE-4: closed vocabulary for the
/// <c>QuarantineReasonDetail</c> column on
/// <c>legacy_tf_unproven.imprv_attr</c>. Replaces the single muddy
/// <c>UNKNOWN_I_ATTR_VAL_CD</c> / <c>UNKNOWN_ATTRIBUTE</c> bucket
/// with five named reasons that tell the operator WHICH stage of the
/// pipeline failed.
///
/// <para>This vocabulary is orthogonal to the legacy
/// <see cref="TerraFusion.Core.Entities.SyncBridge.QuarantineReasons"/>
/// (NoParcelXref / NoOwnerXref / BothMissing / UnknownAttribute) which
/// remain in use for canonical-layer parcel-xref failures. The
/// universe-aware reasons here surface only on attribute-side
/// quarantines.</para>
///
/// <para>See <c>docs/sync/sync-doctrine-4-improvement-universe-design.md</c>
/// §"Quarantine reason taxonomy".</para>
/// </summary>
public static class UniverseQuarantineReasons
{
    /// <summary>
    /// Universe classification ran but no rule matched. The row's
    /// universe is <c>UNKNOWN</c> and there is nothing to look up
    /// in the per-universe dictionary. Operator action: review the
    /// universe rule set; either a new rule is needed or an existing
    /// rule's predicates need widening.
    /// </summary>
    public const string UnknownUniverse = "UNKNOWN_UNIVERSE";

    /// <summary>
    /// Universe was classified successfully but the imprv_attr code
    /// is missing from THAT universe's dictionary entries. Operator
    /// action: add the code to the per-universe dictionary, or
    /// confirm the row is genuinely outside the dictionary.
    /// </summary>
    public const string UnknownForUniverseDictionary = "UNKNOWN_FOR_UNIVERSE_DICTIONARY";

    /// <summary>
    /// Defensive: the classifier did not run for this row at all.
    /// Should be rare; emitted when the property-level signals
    /// (prop_type_cd, property_use_cd, ag_apply) couldn't be loaded
    /// (e.g. raw property table missing the prop_id). Operator
    /// action: ensure SYNC-POP-4a property landing has run for this
    /// batch's prop_ids.
    /// </summary>
    public const string UniverseNotEvaluated = "UNIVERSE_NOT_EVALUATED";

    /// <summary>
    /// Universe was classified, but the per-universe dictionary
    /// table contains zero active rows for that universe. Operator
    /// action: run the attribute-dictionary refresh / seeder for
    /// that universe before re-draining.
    /// </summary>
    public const string DictionaryNotLoadedForUniverse = "DICTIONARY_NOT_LOADED_FOR_UNIVERSE";

    /// <summary>
    /// CONVERSION_LEGACY rule fired but the legacy marker is weak
    /// evidence (e.g. missing PropCreateDt; deduced rather than
    /// explicit). Operator action: review the legacy marker logic
    /// and either tighten the rule or accept the deduced
    /// classification.
    /// </summary>
    public const string LegacyClassificationUncertain = "LEGACY_CLASSIFICATION_UNCERTAIN";

    /// <summary>All five recognized universe-aware quarantine reasons.</summary>
    public static IReadOnlySet<string> All { get; } = new HashSet<string>
    {
        UnknownUniverse,
        UnknownForUniverseDictionary,
        UniverseNotEvaluated,
        DictionaryNotLoadedForUniverse,
        LegacyClassificationUncertain,
    };

    /// <summary>True iff <paramref name="value"/> is a recognized universe-aware quarantine reason.</summary>
    public static bool IsKnown(string? value) =>
        !string.IsNullOrEmpty(value) && All.Contains(value);
}

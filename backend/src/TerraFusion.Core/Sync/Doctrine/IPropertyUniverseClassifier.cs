using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.Doctrine;

/// <summary>
/// SYNC-DOCTRINE-4: classify an improvement row's property-level
/// signals into one of the seven universe codes
/// (<see cref="UniverseCodes"/>).
///
/// <para>The classifier is the doctrine layer between raw PACS
/// fields and the per-universe attribute dictionary. Implementations
/// load rules from <c>doctrine_tf.tf_doctrine_property_universe</c>
/// scoped by county, walk them ordered by
/// <c>Precedence ASC</c>, and return the first match. If no rule
/// fires the result is <see cref="UniverseCodes.Unknown"/> with a
/// reason citing the input tuple.</para>
///
/// <para>The classifier is pure with respect to the input
/// signals — same input always yields the same output for a given
/// county + rule snapshot. Cache invalidation happens via
/// <see cref="InvalidateCache"/> after a re-seed.</para>
/// </summary>
public interface IPropertyUniverseClassifier
{
    /// <summary>
    /// Classify a single improvement row. <paramref name="input"/>
    /// carries the property-level signals already joined from raw
    /// PACS; the classifier never reads from the raw tables itself.
    /// </summary>
    Task<UniverseClassification> ClassifyAsync(
        UniverseClassifierInput input,
        CancellationToken cancellationToken = default);

    /// <summary>Drop the cached rule list for the given county.</summary>
    void InvalidateCache(string? county = null);
}

/// <summary>
/// Inputs to <see cref="IPropertyUniverseClassifier.ClassifyAsync"/>.
/// </summary>
/// <param name="County">Lowercase-hyphenated county slug.</param>
/// <param name="PropValYr">Year axis used for effective-window matching.</param>
/// <param name="PropTypeCd">PACS <c>dbo.property.prop_type_cd</c>. NULL allowed.</param>
/// <param name="PropertyUseCd">PACS <c>dbo.property_val.property_use_cd</c>. NULL allowed.</param>
/// <param name="AgApply">PACS <c>dbo.land_detail.ag_apply</c> ('T'/'F'). NULL allowed.</param>
/// <param name="AgUseCd">PACS <c>dbo.land_detail.ag_use_cd</c>. NULL allowed.</param>
/// <param name="HasLegacyMarker">
/// True iff the calling promoter has confirmed an explicit legacy
/// marker on the row (e.g. <c>property.prop_create_dt &lt; 2017-01-01</c>).
/// Only consulted by rules with <c>RequiresLegacyMarker = true</c>.
/// </param>
public sealed record UniverseClassifierInput(
    string County,
    int PropValYr,
    string? PropTypeCd,
    string? PropertyUseCd,
    string? AgApply,
    string? AgUseCd,
    bool HasLegacyMarker);

/// <summary>
/// Result of <see cref="IPropertyUniverseClassifier.ClassifyAsync"/>.
/// </summary>
/// <param name="UniverseCode">
/// One of <see cref="UniverseCodes"/>. <c>UNKNOWN</c> when no rule
/// matched.
/// </param>
/// <param name="RuleId">
/// The matching rule's id, or NULL when no rule fired.
/// </param>
/// <param name="Confidence">The matching rule's confidence, or "LOW" for UNKNOWN.</param>
/// <param name="Reason">
/// Free-text explanation copied from the matching rule, or a
/// generated "no rule matched (...)" string for UNKNOWN. Operator-
/// readable.
/// </param>
/// <param name="QuarantineReasonHint">
/// Hint for the caller: when <see cref="UniverseCode"/> is
/// <c>UNKNOWN</c>, set to <see cref="UniverseQuarantineReasons.UnknownUniverse"/>.
/// When CONVERSION_LEGACY fires on a weak marker, set to
/// <see cref="UniverseQuarantineReasons.LegacyClassificationUncertain"/>.
/// NULL otherwise (no quarantine implication).
/// </param>
public sealed record UniverseClassification(
    string UniverseCode,
    Guid? RuleId,
    string Confidence,
    string Reason,
    string? QuarantineReasonHint);

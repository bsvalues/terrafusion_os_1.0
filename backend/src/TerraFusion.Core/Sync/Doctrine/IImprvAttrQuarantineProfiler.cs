using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.Doctrine;

/// <summary>
/// SYNC-DOCTRINE-4-IMPL-V7: read-only profiler for the
/// canonical-layer imprv_attr quarantine cohort.
///
/// <para>The 1,584+ rows in
/// <c>legacy_tf_unproven.unresolved_imprv_attr</c> with
/// <c>QuarantineReason = UNKNOWN_ATTRIBUTE</c> were quarantined
/// because their PACS i_attr_val_id had no matching
/// <c>canonical_tf.attribute_definition</c> entry. Post-V4, each
/// quarantine row also carries the parent improvement's
/// <c>UniverseCode</c> + <c>QuarantineReasonDetail</c>.</para>
///
/// <para>This profiler aggregates that cohort into a histogram
/// keyed by <c>(UniverseCode, ImprvAttrId, IAttrValCd)</c> with
/// counts and sample row ids. Operator inspects and decides which
/// codes are real (add to <c>attribute_definition</c>) vs noise
/// (leave quarantined). V7 produces evidence — it doesn't auto-
/// seed any dictionary.</para>
/// </summary>
public interface IImprvAttrQuarantineProfiler
{
    Task<ImprvAttrQuarantineProfileResult> ProfileAsync(
        ImprvAttrQuarantineProfileRequest request,
        CancellationToken cancellationToken = default);
}

/// <summary>SYNC-DOCTRINE-4-IMPL-V7: profile request.</summary>
/// <param name="UniverseFilter">
/// Optional universe code to scope the profile (e.g.
/// <c>"REAL_RESIDENTIAL"</c>). NULL = all universes including
/// rows with NULL universe.
/// </param>
/// <param name="ReasonFilter">
/// Optional <c>QuarantineReason</c> to scope the profile. Two
/// recognized reasons:
/// <list type="bullet">
///   <item><c>"UNKNOWN_I_ATTR_VAL_CD"</c> — landing-layer reason
///   from <c>PacsImprvAttrLandingService</c>. Most rows in
///   production carry this reason; landed before canonical
///   projection so they have NULL UniverseCode.</item>
///   <item><c>"UNKNOWN_ATTRIBUTE"</c> — canonical-layer reason
///   from <c>PacsImprvCanonicalProjector</c>. Rows that made it
///   past landing but failed canonical AttributeDefinition lookup;
///   carry universe context.</item>
/// </list>
/// NULL = profile both layers.
/// </param>
/// <param name="MaxCells">Hard cap on histogram cells returned.</param>
public sealed record ImprvAttrQuarantineProfileRequest(
    string? UniverseFilter = null,
    string? ReasonFilter = null,
    int? MaxCells = null);

/// <summary>SYNC-DOCTRINE-4-IMPL-V7: profile result.</summary>
public sealed record ImprvAttrQuarantineProfileResult
{
    public required string Status { get; init; }
    public required int TotalQuarantineRows { get; init; }
    public required int RowsScopedByFilter { get; init; }
    public required int DistinctUniverses { get; init; }
    public required int DistinctCodes { get; init; }

    /// <summary>
    /// Rollup by <c>QuarantineReason</c> across the FULL cohort
    /// (independent of <see cref="ImprvAttrQuarantineProfileRequest.ReasonFilter"/>).
    /// </summary>
    public required IReadOnlyList<ReasonRollup> ReasonSummary { get; init; }

    /// <summary>
    /// Histogram cells, ordered by descending count.
    /// </summary>
    public required IReadOnlyList<ImprvAttrQuarantineProfileCell> Cells { get; init; }

    /// <summary>
    /// Universe → row count rollup, ordered by descending count.
    /// </summary>
    public required IReadOnlyList<UniverseRollup> UniverseSummary { get; init; }

    public string? ErrorSummary { get; init; }
}

/// <summary>One histogram cell.</summary>
/// <param name="UniverseCode">
/// Parent improvement's UniverseCode at quarantine time. May be NULL
/// for rows quarantined before SYNC-DOCTRINE-4-IMPL-V4.
/// </param>
/// <param name="ImprvAttrId">PACS imprv_attr_id (the i_attr_val_id integer, stringified).</param>
/// <param name="IAttrValCd">PACS i_attr_val_cd (the value-code string).</param>
/// <param name="Count">Number of quarantine rows matching this triple.</param>
/// <param name="SampleUnprovenRowId">One example UnprovenRowId for operator drill-down.</param>
public sealed record ImprvAttrQuarantineProfileCell(
    string? UniverseCode,
    string ImprvAttrId,
    string IAttrValCd,
    int Count,
    System.Guid SampleUnprovenRowId);

/// <summary>Per-universe rollup.</summary>
public sealed record UniverseRollup(
    string? UniverseCode,
    int Count);

/// <summary>Per-reason rollup.</summary>
public sealed record ReasonRollup(
    string QuarantineReason,
    int Count);

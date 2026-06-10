using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.ImprovementFieldCheck;

/// <summary>
/// Block F3: read-only canonical-equivalent of the operator's
/// "improvements that need a physical re-verification visit"
/// triage queue.
///
/// <para>Per <c>docs/pacs/blocks-d-through-h-design.md</c> §"F3":
/// surfaces improvements from <c>canonical_tf.tf_improvement</c> that
/// the assessor's office needs to look at — most usefully the rows
/// where SYNC-DOCTRINE-4 has classified the universe but the per-
/// component features (<c>tf_improvement_feature</c>) are still
/// blank or do not yet carry an <c>AttributeId</c> linkage. Those
/// are the rows where the data quality gap is between the cabinet
/// and the field.</para>
///
/// <para>v1 simplifications:
/// <list type="bullet">
///   <item>County-scoped (single county per call) — sovereign
///   isolation enforced at controller via <c>countyId</c> claim,
///   belt-and-suspenders enforced again here.</item>
///   <item>Aggregate-only output: returns
///   <see cref="ImprovementFieldCheckItem"/> rows that already
///   carry the parcel + universe + feature counts the queue panel
///   needs. Per-feature drill-down stays on the existing
///   improvement/feature controllers.</item>
///   <item>Era filter mirrors G3 doctrine — defaults to
///   <see cref="TerraFusion.Core.Entities.TruthPacs.ConversionEras.PostConversion"/>;
///   <see cref="EraAll"/> bypasses; pre-G2 NULL-era rows fall back
///   to no-era-classification (NULL-only included under
///   <see cref="EraAll"/>).</item>
///   <item>Universe filter accepts any value in
///   <see cref="TerraFusion.Core.Sync.Doctrine.UniverseCodes.AllIncludingUnknown"/>;
///   null skips the filter.</item>
///   <item><c>missingFeaturesOnly = true</c> excludes any improvement
///   that has at least one <c>tf_improvement_feature</c> row with a
///   non-null <c>AttributeId</c> — the dictionary-resolved features.
///   Improvements with only un-resolved feature rows still surface as
///   "missing" because the field hasn't told us what those features
///   actually are.</item>
/// </list>
/// </para>
///
/// <para>Read-only by contract: no DbContext writes, no audit-table
/// mutations, no PII surfaced. Empty datasets return an empty list
/// (operator gets a clean "queue is empty" view, not a 404).</para>
/// </summary>
public interface IImprovementFieldCheckReader
{
    /// <summary>
    /// Default page size when the caller omits <c>maxResults</c>. The
    /// queue panel renders one row at a time so this is sized to fit
    /// "what an appraiser will pull up to triage in a session" rather
    /// than "everything that's broken".
    /// </summary>
    public const int DefaultMaxResults = 200;

    /// <summary>
    /// Hard ceiling on <c>maxResults</c>. Anything above this is
    /// clamped down to <see cref="MaxAllowedResults"/>; the read
    /// surface refuses to materialize an arbitrarily large list.
    /// </summary>
    public const int MaxAllowedResults = 1000;

    /// <summary>
    /// G3-style sentinel that bypasses the era filter entirely.
    /// Mirrors <c>ISalesRatioStudyReader.EraAll</c> so callers can
    /// audit cross-era field-check backlogs.
    /// </summary>
    public const string EraAll = "ALL";

    /// <summary>
    /// F3: read the field-check queue for a county.
    /// </summary>
    /// <param name="countyId">Sovereign-county scope.</param>
    /// <param name="universeCode">
    /// Optional universe filter. When non-null, must be a value in
    /// <see cref="TerraFusion.Core.Sync.Doctrine.UniverseCodes.AllIncludingUnknown"/>;
    /// invalid values throw <see cref="ArgumentException"/>.
    /// Controller validates first and returns 400 before invoking
    /// the reader, but the reader keeps a defensive throw to honor
    /// the contract on direct callers.
    /// </param>
    /// <param name="era">
    /// Conversion-era filter per Block-C contract v1.12 §2. Null
    /// resolves to <see cref="TerraFusion.Core.Entities.TruthPacs.ConversionEras.PostConversion"/>.
    /// Recognized values: <c>POST_CONVERSION</c>, <c>PRE_CONVERSION_2017</c>,
    /// <c>UNKNOWN</c>, <see cref="EraAll"/>. Unknown values throw
    /// <see cref="ArgumentException"/>.
    /// </param>
    /// <param name="missingFeaturesOnly">
    /// When true, return only improvements with NO
    /// <c>tf_improvement_feature</c> row whose <c>AttributeId</c> is
    /// non-null — the true-gap rows the assessor needs eyes on.
    /// </param>
    /// <param name="minYearBuilt">
    /// Optional lower bound on <c>YearBuilt</c> (inclusive).
    /// </param>
    /// <param name="maxYearBuilt">
    /// Optional upper bound on <c>YearBuilt</c> (inclusive).
    /// </param>
    /// <param name="maxResults">
    /// Page size; defaults to <see cref="DefaultMaxResults"/>; clamped
    /// to <see cref="MaxAllowedResults"/>; values &lt; 1 are rounded
    /// up to 1.
    /// </param>
    Task<IReadOnlyList<ImprovementFieldCheckItem>> GetFieldCheckQueueAsync(
        Guid countyId,
        string? universeCode = null,
        string? era = null,
        bool missingFeaturesOnly = false,
        short? minYearBuilt = null,
        short? maxYearBuilt = null,
        int? maxResults = null,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Block F3: a single row in the field-check queue. Carries the
/// minimum the operator panel needs to render and rank — universe
/// classification, parcel linkage, age, and the feature-coverage
/// counters that explain WHY the row is in the queue.
/// </summary>
public sealed record ImprovementFieldCheckItem
{
    /// <summary>Canonical improvement identity (TF-native).</summary>
    public required Guid TfImprovementId { get; init; }

    /// <summary>Canonical parcel FK.</summary>
    public required Guid TfParcelId { get; init; }

    /// <summary>
    /// SYNC-DOCTRINE-4 universe classification, forwarded from
    /// truth. Null only on improvements promoted before D4-IMPL.
    /// </summary>
    public required string? UniverseCode { get; init; }

    /// <summary>PACS improvement type code (R, MH, C, etc).</summary>
    public required string? ImprvTypeCd { get; init; }

    /// <summary>Free-form description from PACS.</summary>
    public required string? ImprvDesc { get; init; }

    /// <summary>Construction year-built (chronological).</summary>
    public required short? YearBuilt { get; init; }

    /// <summary>
    /// PACS effective year-built — adjusted for major renovations.
    /// Often the more useful number for triage.
    /// </summary>
    public required short? EffectiveYearBuilt { get; init; }

    /// <summary>
    /// Total <c>tf_improvement_feature</c> rows attached to this
    /// improvement (any AttributeId state).
    /// </summary>
    public required int FeatureCount { get; init; }

    /// <summary>
    /// <c>tf_improvement_feature</c> rows with a non-null
    /// <c>AttributeId</c>. Below <see cref="FeatureCount"/> means
    /// some features have not yet been linked to the canonical
    /// dictionary.
    /// </summary>
    public required int AttributedFeatureCount { get; init; }

    /// <summary>
    /// Short human-readable hint of why the row is in the queue.
    /// One of: <c>NO_FEATURES</c> (zero feature rows),
    /// <c>NO_ATTRIBUTED_FEATURES</c> (rows exist but none resolve to
    /// AttributeId), <c>PARTIAL_ATTRIBUTION</c> (some rows resolved,
    /// some not), <c>FULLY_ATTRIBUTED</c> (every row resolved — only
    /// surfaced when <c>missingFeaturesOnly = false</c>).
    /// </summary>
    public required string ReviewReason { get; init; }
}

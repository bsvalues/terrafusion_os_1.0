using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.PacsImprvCanonical;

/// <summary>
/// Slice C3: orchestrator for truth → canonical projection of PACS
/// improvements.
///
/// <para>Input: a completed C2 truth_pacs.imprv_current promotion
/// batch.</para>
///
/// <para>Output: rows in <c>canonical_tf.tf_improvement</c> for
/// every truth-pacs improvement whose <c>prop_id</c> resolves to a
/// <c>tf_parcel</c> via <c>source_xref</c>; child rows in
/// <c>canonical_tf.tf_improvement_feature</c> per matching
/// <c>legacy_pacs_raw.imprv_detail</c> row; rows whose parcel
/// cannot be resolved are quarantined to
/// <c>legacy_tf_unproven.imprv_current</c>. Each projected
/// <c>tf_improvement</c> writes a <c>source_xref</c> entry with
/// <c>TfEntityType="improvement"</c>.</para>
///
/// <para>Idempotent by truth promotion batch: re-running deletes
/// any prior canonical rows produced from the same truth batch
/// (improvements + features + xrefs + quarantine) before inserting
/// new ones.</para>
/// </summary>
public interface IPacsImprvCanonicalProjector
{
    Task<PacsImprvCanonicalResult> ProjectAsync(
        Guid truthPromotionLoadBatchId,
        string operatorName,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Slice C3: outcome of one projection run.
///
/// <para>v1.5 (E4b): added attribute-resolution counters
/// (<see cref="AttributesConsidered"/>,
/// <see cref="AttributesResolved"/>,
/// <see cref="AttributesQuarantined"/>,
/// <see cref="PriorAttrQuarantineRowsRemoved"/>). See
/// <c>docs/pacs/block-c-contract-v1.5.md</c>.</para>
/// </summary>
public sealed record PacsImprvCanonicalResult
{
    public required Guid PromotionLoadBatchId { get; init; }

    /// <summary>'COMPLETED' | 'FAILED' | 'REFUSED'.</summary>
    public required string Status { get; init; }

    public required int TruthRowsConsidered { get; init; }
    public required int ImprovementsProjected { get; init; }
    public required int FeaturesProjected { get; init; }
    public required int RowsQuarantined { get; init; }

    public required int PriorImprovementsRemoved { get; init; }
    public required int PriorFeaturesRemoved { get; init; }
    public required int PriorQuarantineRowsRemoved { get; init; }

    // ── v1.5 (E4b) attribute-resolution counters ─────────────────
    /// <summary>
    /// Raw <c>imprv_attr</c> rows that were in scope for
    /// resolution (i.e. their 4-key parent improvement was
    /// successfully projected to <c>tf_improvement</c>).
    /// </summary>
    public required int AttributesConsidered { get; init; }

    /// <summary>
    /// Attributes whose <c>i_attr_val_id</c> resolved to a
    /// <c>canonical_tf.attribute_definition</c> row in the same
    /// county and produced a <c>tf_improvement_feature</c> row
    /// with non-null <c>AttributeId</c>.
    /// </summary>
    public required int AttributesResolved { get; init; }

    /// <summary>
    /// Attributes that did not resolve and were quarantined to
    /// <c>legacy_tf_unproven.imprv_attr</c> with
    /// <c>QuarantineReasons.UnknownAttribute</c>.
    /// </summary>
    public required int AttributesQuarantined { get; init; }

    /// <summary>
    /// Prior canonical-layer <c>legacy_tf_unproven.imprv_attr</c>
    /// rows removed by the idempotency cleanup at the start of
    /// this run. Distinct from landing-layer quarantine rows
    /// (which use a different <c>QuarantineReason</c>).
    /// </summary>
    public required int PriorAttrQuarantineRowsRemoved { get; init; }

    public string? ErrorSummary { get; init; }
}

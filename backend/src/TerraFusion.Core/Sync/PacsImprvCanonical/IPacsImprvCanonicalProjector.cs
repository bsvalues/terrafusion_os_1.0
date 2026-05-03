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

/// <summary>Slice C3: outcome of one projection run.</summary>
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

    public string? ErrorSummary { get; init; }
}

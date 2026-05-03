using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.PacsSaleCanonical;

/// <summary>
/// Slice S3: orchestrator for truth → canonical projection of PACS
/// sales.
///
/// <para>Input: a completed <c>truth_pacs.sale</c> promotion batch
/// (the S2-B output).
///
/// Output: rows in <c>canonical_tf.tf_sale</c> for every truth-pacs
/// sale whose underlying <c>prop_id</c> resolves to a
/// <c>canonical_tf.tf_parcel</c> via <c>source_xref</c>; rows whose
/// parcel cannot be resolved are quarantined to
/// <c>legacy_tf_unproven.sale</c> (preserved, not discarded — a
/// future slice that closes the parcel-side gap can re-promote).</para>
///
/// <para>Idempotent by <c>truthPromotionLoadBatchId</c>: re-running
/// deletes any prior canonical rows produced by that batch (and
/// their <c>source_xref</c> entries) before inserting new ones.</para>
/// </summary>
public interface IPacsSaleCanonicalProjector
{
    Task<PacsSaleCanonicalResult> ProjectAsync(
        Guid truthPromotionLoadBatchId,
        string operatorName,
        CancellationToken cancellationToken = default);
}

/// <summary>Slice S3: outcome of one projection run.</summary>
public sealed record PacsSaleCanonicalResult
{
    public required Guid PromotionLoadBatchId { get; init; }

    /// <summary>'COMPLETED' | 'FAILED' | 'REFUSED'.</summary>
    public required string Status { get; init; }

    /// <summary>Truth-pacs sales considered.</summary>
    public required int TruthSalesConsidered { get; init; }

    /// <summary>Sales projected into <c>canonical_tf.tf_sale</c>.</summary>
    public required int SalesProjected { get; init; }

    /// <summary>
    /// Sales quarantined to <c>legacy_tf_unproven.sale</c> because
    /// no parcel xref resolved. Doctrine: preserved, not discarded.
    /// </summary>
    public required int SalesQuarantined { get; init; }

    /// <summary>
    /// How many prior canonical rows were removed before this run
    /// (idempotency proof).
    /// </summary>
    public required int PriorCanonicalRowsRemoved { get; init; }

    /// <summary>How many prior quarantine rows were removed before this run.</summary>
    public required int PriorQuarantineRowsRemoved { get; init; }

    public string? ErrorSummary { get; init; }
}

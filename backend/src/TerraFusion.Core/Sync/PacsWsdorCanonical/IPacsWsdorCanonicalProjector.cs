using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.PacsWsdorCanonical;

/// <summary>
/// Slice B4: orchestrator for truth → canonical projection of PACS
/// WSDOR-grade per-owner values.
///
/// <para>Input: a completed B2-B
/// <c>truth_pacs.wash_prop_owner_val</c> promotion batch.</para>
///
/// <para>Output: rows in
/// <c>canonical_tf.tf_assessment_wsdor</c> for every truth-pacs row
/// whose <c>prop_id</c> resolves to a <c>tf_parcel</c> AND whose
/// <c>owner_id</c> (== <c>acct_id</c> in PACS) resolves to a
/// <c>tf_owner</c>; rows whose either link cannot be resolved are
/// quarantined to <c>legacy_tf_unproven.wash_prop_owner_val</c>.
/// Each projected row writes a <c>source_xref</c> entry with
/// <c>TfEntityType="assessment_wsdor"</c>.</para>
///
/// <para>Idempotent by truth promotion batch: re-running deletes
/// any prior canonical rows produced from the same truth batch
/// (rows + their xrefs + quarantine) before inserting new ones.</para>
/// </summary>
public interface IPacsWsdorCanonicalProjector
{
    Task<PacsWsdorCanonicalResult> ProjectAsync(
        Guid truthPromotionLoadBatchId,
        string operatorName,
        CancellationToken cancellationToken = default);
}

/// <summary>Slice B4: outcome of one projection run.</summary>
public sealed record PacsWsdorCanonicalResult
{
    public required Guid PromotionLoadBatchId { get; init; }

    /// <summary>'COMPLETED' | 'FAILED' | 'REFUSED'.</summary>
    public required string Status { get; init; }

    public required int TruthRowsConsidered { get; init; }
    public required int RowsProjected { get; init; }
    public required int RowsQuarantined { get; init; }

    public required int RejectedNoParcelXref { get; init; }
    public required int RejectedNoOwnerXref { get; init; }
    public required int RejectedBothMissing { get; init; }

    public required int PriorRowsRemoved { get; init; }
    public required int PriorQuarantineRowsRemoved { get; init; }

    public string? ErrorSummary { get; init; }
}

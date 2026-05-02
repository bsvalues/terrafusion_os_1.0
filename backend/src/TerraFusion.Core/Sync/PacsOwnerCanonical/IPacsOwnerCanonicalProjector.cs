using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.PacsOwnerCanonical;

/// <summary>
/// Slice B3: orchestrator for truth → canonical projection of PACS
/// owners.
///
/// <para>Input: a completed B2-A
/// <c>truth_pacs.owner_current</c> promotion batch.</para>
///
/// <para>Output: rows in <c>canonical_tf.tf_owner</c> (one per
/// unique <c>acct_id</c> in the batch) +
/// <c>canonical_tf.tf_parcel_owner_link</c> (one per truth row whose
/// parcel resolves) + <c>source_xref</c> entries
/// (<c>TfEntityType="owner"</c>) + quarantine to
/// <c>legacy_tf_unproven.owner_current</c> for unresolvable parcels.</para>
///
/// <para>PII redaction is the load-bearing invariant: any TfOwner
/// row whose source has <c>ConfidentialFlag = true</c> MUST have
/// <c>DisplayName = "[Confidential]"</c> and PII fields nulled.
/// The <c>canonical-owner-pii-redaction-policy</c> gate verifies
/// this from the database itself.</para>
///
/// <para>Idempotent by truth promotion batch: re-running deletes
/// any prior canonical rows produced from the same truth batch
/// (TfOwners + their xrefs + links + quarantine) before inserting
/// new ones.</para>
/// </summary>
public interface IPacsOwnerCanonicalProjector
{
    Task<PacsOwnerCanonicalResult> ProjectAsync(
        Guid truthPromotionLoadBatchId,
        string operatorName,
        CancellationToken cancellationToken = default);
}

/// <summary>Slice B3: outcome of one projection run.</summary>
public sealed record PacsOwnerCanonicalResult
{
    public required Guid PromotionLoadBatchId { get; init; }

    /// <summary>'COMPLETED' | 'FAILED' | 'REFUSED'.</summary>
    public required string Status { get; init; }

    public required int TruthRowsConsidered { get; init; }
    public required int OwnersProjected { get; init; }
    public required int LinksProjected { get; init; }
    public required int RowsQuarantined { get; init; }

    public required int PriorOwnersRemoved { get; init; }
    public required int PriorLinksRemoved { get; init; }
    public required int PriorQuarantineRowsRemoved { get; init; }

    public string? ErrorSummary { get; init; }
}

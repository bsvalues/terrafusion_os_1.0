using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.PacsParcelCanonical;

/// <summary>
/// Slice S3 (SYNC-POP-4c): truth → canonical projector for PACS
/// parcels.
///
/// <para>Inputs: a completed truth-pacs parcel-spine promotion batch
/// + a county id. Output: rows in <c>canonical_tf.tf_parcel</c> with
/// matching <c>sync_bridge.source_xref(TfEntityType="parcel")</c>
/// entries. Every projected parcel gets a fresh
/// <see cref="TerraFusion.Core.Entities.CanonicalTf.TfParcel.TfParcelId"/>;
/// the PACS <c>prop_id</c> lives in the xref's
/// <c>SourceKeyJson</c> as lineage, not as identity.</para>
///
/// <para>Idempotent by construction: re-running the same truth
/// promotion batch deletes any prior <c>tf_parcel</c> +
/// <c>source_xref</c> rows produced from the same source spine
/// (matched by <c>SourceKeyJson.prop_id</c>) before inserting new
/// ones.</para>
///
/// <para>This is the slice that unblocks <c>canonical_tf.tf_sale &gt; 0</c>:
/// the existing <see cref="TerraFusion.Core.Sync.PacsSaleCanonical.IPacsSaleCanonicalProjector"/>
/// resolves <c>source_xref</c> via <c>tf_parcel.tf_parcel_id</c>, and
/// has been quarantining sales because no parcel xrefs existed.</para>
/// </summary>
public interface IPacsParcelCanonicalProjector
{
    Task<PacsParcelCanonicalResult> ProjectAsync(
        Guid spineTruthPromotionLoadBatchId,
        Guid countyId,
        string operatorName,
        CancellationToken cancellationToken = default);
}

/// <summary>Slice S3 (SYNC-POP-4c): outcome of one parcel projection run.</summary>
public sealed record PacsParcelCanonicalResult
{
    public required Guid PromotionLoadBatchId { get; init; }

    /// <summary>'COMPLETED' | 'FAILED' | 'REFUSED'.</summary>
    public required string Status { get; init; }

    /// <summary>Truth-spine rows considered.</summary>
    public required int TruthParcelsConsidered { get; init; }

    /// <summary>Parcels projected into <c>canonical_tf.tf_parcel</c>.</summary>
    public required int ParcelsProjected { get; init; }

    /// <summary>
    /// How many <c>tf_parcel</c> rows were deleted from a prior
    /// projection of the same truth spine batch (idempotency proof).
    /// </summary>
    public required int PriorCanonicalRowsRemoved { get; init; }

    /// <summary>
    /// How many <c>source_xref(TfEntityType="parcel")</c> rows were
    /// deleted from the prior projection.
    /// </summary>
    public required int PriorXrefRowsRemoved { get; init; }

    public string? ErrorSummary { get; init; }
}

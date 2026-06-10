using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.PacsParcelTruth;

/// <summary>
/// Slice S2-B (SYNC-POP-4b): orchestrator for raw → truth promotion
/// of PACS parcels.
///
/// <para>Input: a completed S1 property-landing batch. Output: rows
/// in <c>truth_pacs.parcel_spine</c> for every parcel that carries
/// <c>prop_type_cd = 'R'</c>.</para>
///
/// <para>Idempotent by construction: re-running the same property
/// batch deletes any prior spine rows whose
/// <see cref="TerraFusion.Core.Entities.TruthPacs.TruthPacsParcelSpine.PropertyLoadBatchId"/>
/// matches before inserting new ones.</para>
///
/// <para>Doctrine simplifications relative to <c>IPacsSaleTruthPromoter</c>:
/// no second batch (no supp pointer needed at the master-identity
/// layer); no defense-in-depth stale-axis gate (the parcel type
/// vocabulary is closed and modern).</para>
/// </summary>
public interface IPacsParcelSpineTruthPromoter
{
    Task<PacsParcelSpineTruthPromotionResult> PromoteAsync(
        Guid propertyLoadBatchId,
        string operatorName,
        CancellationToken cancellationToken = default);
}

/// <summary>Slice S2-B (SYNC-POP-4b): outcome of one parcel-spine promotion.</summary>
public sealed record PacsParcelSpineTruthPromotionResult
{
    public required Guid PromotionLoadBatchId { get; init; }

    /// <summary>'COMPLETED' | 'FAILED' | 'REFUSED'.</summary>
    public required string Status { get; init; }

    /// <summary>Parcels considered from the source S1 batch.</summary>
    public required int ParcelsConsidered { get; init; }

    /// <summary>Parcels promoted into <c>truth_pacs.parcel_spine</c>.</summary>
    public required int ParcelsPromoted { get; init; }

    /// <summary>Parcels rejected because <c>prop_type_cd != 'R'</c>.</summary>
    public required int RejectedNotRealProperty { get; init; }

    /// <summary>
    /// Parcels rejected because they share a <c>prop_id</c> with
    /// another parcel already promoted in this batch. Doctrine: zero.
    /// A non-zero value means the upstream landing batch failed its
    /// uniqueness gate.
    /// </summary>
    public required int RejectedDuplicatePropId { get; init; }

    /// <summary>
    /// How many rows were deleted from a prior promotion of this
    /// PropertyLoadBatchId (idempotency proof).
    /// </summary>
    public required int PriorRowsRemoved { get; init; }

    public string? ErrorSummary { get; init; }
}

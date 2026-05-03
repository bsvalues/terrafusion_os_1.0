using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.PacsSaleTruth;

/// <summary>
/// Slice S2-B: orchestrator for raw → truth promotion of PACS sales.
///
/// <para>Inputs: a completed S1 sale-landing batch + a completed S2-A
/// prop_supp_assoc-landing batch. Output: rows in
/// <c>truth_pacs.sale</c> for every sale that (a) carries
/// <c>sl_county_ratio_cd = '100'</c>, (b) has a matching
/// <c>(prop_id, prop_val_yr)</c> in the supp pointer batch, and
/// (c) the sale's <c>sup_num</c> matches the supp pointer's
/// <c>sup_num</c>.</para>
///
/// <para>Idempotent by construction: re-running the same
/// (saleBatch, suppBatch) pair deletes any prior truth rows whose
/// <see cref="TerraFusion.Core.Entities.TruthPacs.TruthPacsSale.SaleLoadBatchId"/>
/// matches before inserting new ones.</para>
/// </summary>
public interface IPacsSaleTruthPromoter
{
    Task<PacsSaleTruthPromotionResult> PromoteAsync(
        Guid saleLoadBatchId,
        Guid suppAssocLoadBatchId,
        string operatorName,
        CancellationToken cancellationToken = default);
}

/// <summary>Slice S2-B: outcome of one promotion run.</summary>
public sealed record PacsSaleTruthPromotionResult
{
    public required Guid PromotionLoadBatchId { get; init; }

    /// <summary>'COMPLETED' | 'FAILED' | 'REFUSED'.</summary>
    public required string Status { get; init; }

    /// <summary>Sales considered from the source S1 batch.</summary>
    public required int SalesConsidered { get; init; }

    /// <summary>Sales promoted into <c>truth_pacs.sale</c>.</summary>
    public required int SalesPromoted { get; init; }

    /// <summary>Sales rejected because <c>sl_county_ratio_cd != '100'</c>.</summary>
    public required int RejectedNotQualified { get; init; }

    /// <summary>
    /// Sales rejected because no supp pointer existed for
    /// <c>(prop_id, prop_val_yr)</c> in the supp batch.
    /// </summary>
    public required int RejectedNoSuppPointer { get; init; }

    /// <summary>
    /// Sales rejected because the sale's <c>sup_num</c> did not
    /// match the supp pointer's <c>sup_num</c> (sale points at a
    /// non-current supplement).
    /// </summary>
    public required int RejectedStaleSupNum { get; init; }

    /// <summary>
    /// Sales rejected at the truth layer because they carried
    /// stale legacy codes (<c>'01'</c>/<c>'02'</c>) — defense-in-
    /// depth even though the S1 gate should have caught them.
    /// </summary>
    public required int RejectedStaleAxis { get; init; }

    /// <summary>
    /// How many rows were deleted from a prior promotion of this
    /// SaleLoadBatchId (idempotency proof).
    /// </summary>
    public required int PriorRowsRemoved { get; init; }

    public string? ErrorSummary { get; init; }
}

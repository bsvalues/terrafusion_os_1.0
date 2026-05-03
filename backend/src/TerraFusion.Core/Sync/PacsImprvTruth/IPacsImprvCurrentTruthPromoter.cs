using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.PacsImprvTruth;

/// <summary>
/// Slice C2: orchestrator for raw → truth promotion of PACS
/// improvement parent rows.
///
/// <para>Inputs: a completed C1-A imprv-landing batch + a completed
/// S2-A prop_supp_assoc-landing batch. Output: rows in
/// <c>truth_pacs.imprv_current</c> for every imprv row whose
/// <c>(prop_id, prop_val_yr)</c> resolves to a supp pointer AND
/// whose <c>sup_num</c> matches the active supplement.</para>
///
/// <para>Idempotent by <c>imprvLoadBatchId</c>: re-running deletes
/// any prior <c>truth_pacs.imprv_current</c> rows whose
/// <c>ImprvLoadBatchId</c> matches before inserting new ones.</para>
///
/// <para>Note: imprv_detail and imprv_attr are projected at the
/// canonical layer (C3 — tf_improvement_feature). At the truth
/// layer this slice promotes only the parent imprv row.</para>
/// </summary>
public interface IPacsImprvCurrentTruthPromoter
{
    Task<PacsImprvCurrentTruthResult> PromoteAsync(
        Guid imprvLoadBatchId,
        Guid suppAssocLoadBatchId,
        string operatorName,
        CancellationToken cancellationToken = default);
}

/// <summary>Slice C2: outcome of one promotion run.</summary>
public sealed record PacsImprvCurrentTruthResult
{
    public required Guid PromotionLoadBatchId { get; init; }

    /// <summary>'COMPLETED' | 'FAILED' | 'REFUSED'.</summary>
    public required string Status { get; init; }

    public required int ImprvsConsidered { get; init; }
    public required int ImprvsPromoted { get; init; }

    public required int RejectedNoSuppPointer { get; init; }
    public required int RejectedStaleSupNum { get; init; }

    /// <summary>Aggregate sum of promoted-row <c>ImprvVal</c> values.</summary>
    public required decimal ImprvValSum { get; init; }

    /// <summary>How many prior truth rows were removed (idempotency proof).</summary>
    public required int PriorRowsRemoved { get; init; }

    public string? ErrorSummary { get; init; }
}

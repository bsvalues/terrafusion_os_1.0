using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.PacsWashPropOwnerValTruth;

/// <summary>
/// Slice B2-B: orchestrator for raw → truth promotion of PACS
/// <c>wash_prop_owner_val</c> rows.
///
/// <para>Inputs: a completed B1-C wash_prop_owner_val landing batch
/// + a completed S2-A prop_supp_assoc landing batch.
/// Output: rows in <c>truth_pacs.wash_prop_owner_val</c> for every
/// raw row whose <c>(prop_id, prop_val_yr)</c> resolves to a supp
/// pointer AND whose <c>sup_num</c> matches the active supplement.</para>
///
/// <para>Idempotent by <c>wpovLoadBatchId</c>: re-running deletes
/// any prior <c>truth_pacs.wash_prop_owner_val</c> rows whose
/// <c>WpovLoadBatchId</c> matches before inserting new ones.</para>
/// </summary>
public interface IPacsWashPropOwnerValTruthPromoter
{
    Task<PacsWashPropOwnerValTruthResult> PromoteAsync(
        Guid wpovLoadBatchId,
        Guid suppAssocLoadBatchId,
        string operatorName,
        CancellationToken cancellationToken = default);
}

/// <summary>Slice B2-B: outcome of one promotion run.</summary>
public sealed record PacsWashPropOwnerValTruthResult
{
    public required Guid PromotionLoadBatchId { get; init; }

    /// <summary>'COMPLETED' | 'FAILED' | 'REFUSED'.</summary>
    public required string Status { get; init; }

    public required int RowsConsidered { get; init; }
    public required int RowsPromoted { get; init; }

    public required int RejectedNoSuppPointer { get; init; }
    public required int RejectedStaleSupNum { get; init; }

    /// <summary>Aggregate sum of promoted-row <c>AssessedVal</c> values.</summary>
    public required decimal AssessedValSum { get; init; }

    /// <summary>Aggregate sum of promoted-row <c>MarketVal</c> values.</summary>
    public required decimal MarketValSum { get; init; }

    /// <summary>How many prior truth rows were removed (idempotency proof).</summary>
    public required int PriorRowsRemoved { get; init; }

    public string? ErrorSummary { get; init; }
}

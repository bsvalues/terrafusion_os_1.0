using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.PacsLandTruth;

/// <summary>
/// Slice L2: orchestrator for raw → truth promotion of PACS land
/// segments.
///
/// <para>Inputs: a completed L1 land_detail-landing batch + a
/// completed S2-A prop_supp_assoc-landing batch. Output: rows in
/// <c>truth_pacs.land_current</c> for every land_detail row whose
/// <c>(prop_id, prop_val_yr)</c> resolves to a supp pointer AND
/// whose <c>sup_num</c> matches the active supplement.</para>
///
/// <para>Idempotent by <c>landLoadBatchId</c>: re-running deletes
/// any prior <c>truth_pacs.land_current</c> rows whose
/// <c>LandLoadBatchId</c> matches before inserting new ones.</para>
///
/// <para>Doctrine: this promoter does NOT normalize land-use codes,
/// run ag-schedule math, or apply Benton Method calibration.
/// Those are canonical-layer concerns (L3).</para>
/// </summary>
public interface IPacsLandCurrentTruthPromoter
{
    Task<PacsLandCurrentTruthResult> PromoteAsync(
        Guid landLoadBatchId,
        Guid suppAssocLoadBatchId,
        string operatorName,
        CancellationToken cancellationToken = default);
}

/// <summary>Slice L2: outcome of one promotion run.</summary>
public sealed record PacsLandCurrentTruthResult
{
    public required Guid PromotionLoadBatchId { get; init; }

    /// <summary>'COMPLETED' | 'FAILED' | 'REFUSED'.</summary>
    public required string Status { get; init; }

    public required int LandSegsConsidered { get; init; }
    public required int LandSegsPromoted { get; init; }

    public required int RejectedNoSuppPointer { get; init; }
    public required int RejectedStaleSupNum { get; init; }

    /// <summary>Aggregate sum of promoted-row <c>SizeAcres</c> values.</summary>
    public required decimal SizeAcresSum { get; init; }

    /// <summary>Aggregate sum of promoted-row <c>LandSegMarketVal</c> values.</summary>
    public required decimal LandSegMarketValSum { get; init; }

    /// <summary>How many prior truth rows were removed (idempotency proof).</summary>
    public required int PriorRowsRemoved { get; init; }

    public string? ErrorSummary { get; init; }
}

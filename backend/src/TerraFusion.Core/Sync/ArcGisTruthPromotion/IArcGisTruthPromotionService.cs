using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.ArcGisTruthPromotion;

/// <summary>
/// Slice D2: orchestrator for raw → truth promotion of ArcGIS
/// parcel polygons.
///
/// <para>Per <c>docs/pacs/block-d-execution-plan.md</c> §3.2:
/// collapses <c>legacy_arcgis_raw.parcel_geom</c> to
/// latest-per-<c>(CountyId, ArcGisObjectId)</c>, applies the
/// geometry validity gate, and writes the surviving rows to
/// <c>truth_arcgis.parcel_geom_current</c> with full lineage.</para>
///
/// <para>Idempotent by <paramref name="countyId"/>: re-running
/// for the same county clears prior truth rows for that county
/// and re-promotes from current raw state. Old promotion batches
/// stay in <c>sync_bridge.load_batch</c> for audit; only the
/// latest one's rows are present in
/// <c>truth_arcgis.parcel_geom_current</c>.</para>
/// </summary>
public interface IArcGisTruthPromotionService
{
    Task<ArcGisTruthPromotionResult> PromoteCountyAsync(
        Guid countyId,
        string operatorName,
        CancellationToken cancellationToken = default);
}

/// <summary>Slice D2: outcome of one promotion run.</summary>
public sealed record ArcGisTruthPromotionResult
{
    public required Guid PromotionLoadBatchId { get; init; }

    /// <summary>'COMPLETED' | 'FAILED' | 'REFUSED'.</summary>
    public required string Status { get; init; }

    /// <summary>Distinct (CountyId, ArcGisObjectId) tuples found in raw.</summary>
    public required int TuplesConsidered { get; init; }

    /// <summary>
    /// Rows promoted to <c>truth_arcgis.parcel_geom_current</c>
    /// (latest-per-tuple AND valid geometry).
    /// </summary>
    public required int RowsPromoted { get; init; }

    /// <summary>
    /// Rows skipped because their geometry failed validation.
    /// Raw rows stay in place for audit; the validity gate
    /// records the count.
    /// </summary>
    public required int InvalidGeometrySkipped { get; init; }

    /// <summary>
    /// Prior truth rows for this county that were removed before
    /// re-promote (idempotency proof).
    /// </summary>
    public required int PriorTruthRowsRemoved { get; init; }

    /// <summary>Sum of <c>AreaSqFt</c> across promoted rows.</summary>
    public required double AreaSqFtSum { get; init; }

    public string? ErrorSummary { get; init; }
}

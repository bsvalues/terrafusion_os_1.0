using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.ArcGisCanonical;

/// <summary>
/// Slice D3: orchestrator for truth → canonical projection of
/// ArcGIS parcel polygons.
///
/// <para>Input: a completed D2
/// <c>truth_arcgis.parcel_geom_current</c> promotion batch (or
/// equivalently, a CountyId whose latest D2 truth state should
/// project).</para>
///
/// <para>Output: rows in <c>gis_tf.tf_parcel_geom</c> for every
/// truth row whose <c>ArcGisApn</c> resolves to a
/// <c>canonical_tf.tf_parcel.ParcelNumber</c> via the APN
/// crosswalk; rows whose APN is null OR fails to crosswalk are
/// recorded by the coverage gate but still land in
/// <c>tf_parcel_geom</c> with <c>TfParcelId = null</c> (the
/// existing schema permits crosswalk-pending rows). Each
/// projected row writes a <c>source_xref</c> entry with
/// <c>TfEntityType="geom_parcel"</c>.</para>
///
/// <para>Idempotent by county: re-running deletes any prior
/// canonical rows whose <c>(CountyId, ArcGisObjectId)</c>
/// matches the truth batch's tuples (and their xrefs) before
/// inserting new ones.</para>
/// </summary>
public interface IArcGisCanonicalProjector
{
    Task<ArcGisCanonicalResult> ProjectCountyAsync(
        Guid countyId,
        string operatorName,
        CancellationToken cancellationToken = default);
}

/// <summary>Slice D3: outcome of one projection run.</summary>
public sealed record ArcGisCanonicalResult
{
    public required Guid PromotionLoadBatchId { get; init; }

    /// <summary>'COMPLETED' | 'FAILED' | 'REFUSED'.</summary>
    public required string Status { get; init; }

    public required int TruthRowsConsidered { get; init; }
    public required int RowsProjected { get; init; }

    /// <summary>
    /// Projected rows whose <c>ArcGisApn</c> matched a
    /// <c>tf_parcel.ParcelNumber</c> in the same county
    /// (TfParcelId populated).
    /// </summary>
    public required int ApnCrosswalkResolved { get; init; }

    /// <summary>
    /// Projected rows whose <c>ArcGisApn</c> did NOT match
    /// (TfParcelId left null — pending future crosswalk pass).
    /// </summary>
    public required int ApnCrosswalkUnresolved { get; init; }

    /// <summary>
    /// Prior canonical rows removed before re-insert
    /// (idempotency proof).
    /// </summary>
    public required int PriorCanonicalRowsRemoved { get; init; }

    /// <summary>Sum of <c>AreaSqFt</c> across projected rows.</summary>
    public required double AreaSqFtSum { get; init; }

    public string? ErrorSummary { get; init; }
}

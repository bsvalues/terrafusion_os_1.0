using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.GIS.ArcGisRest;

/// <summary>
/// Slice G1-D-1: persistence orchestrator for the ArcGIS REST adapter.
///
/// <para>Per <c>docs/plans/terrafusion-90-day-execution-plan.md</c>
/// §4 Block D: combines <see cref="IArcGisFeatureServiceClient"/>'s
/// read with canonical persistence under the
/// <c>sync_bridge</c> doctrine — every <c>gis_tf.tf_parcel_geom</c>
/// row gets a <c>source_xref</c> entry, every run gets a
/// <c>load_batch</c>, and the run closes with a
/// <c>promotion_gate_result</c>.</para>
///
/// <para>v1 (this slice) runs only when invoked. The hosted-service /
/// nightly schedule is G1-D-2.</para>
/// </summary>
public interface IArcGisSyncService
{
    /// <summary>
    /// Runs one full pull-and-persist cycle for the county identified by
    /// <paramref name="fipsCode"/> (config key) and <paramref name="countyId"/>
    /// (DB row identity): fetch every parcel polygon from the configured
    /// feature service, upsert into <c>gis_tf.tf_parcel_geom</c>,
    /// soft-delete absent features, write provenance, and close the load batch.
    /// </summary>
    Task<ArcGisSyncResult> SyncCountyAsync(
        string fipsCode,
        Guid countyId,
        string operatorName,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Slice G1-D-1: outcome of a sync run. Used for inline assertions
/// and test verification; G1-E will surface a richer view through
/// the read API.
/// </summary>
public sealed record ArcGisSyncResult
{
    public required Guid LoadBatchId { get; init; }
    public required Guid CountyId { get; init; }

    /// <summary>'COMPLETED' | 'FAILED'.</summary>
    public required string Status { get; init; }

    public required int FeaturesFetched { get; init; }
    public required int FeaturesUpserted { get; init; }
    public required int FeaturesSoftDeleted { get; init; }

    public string? ErrorSummary { get; init; }
}

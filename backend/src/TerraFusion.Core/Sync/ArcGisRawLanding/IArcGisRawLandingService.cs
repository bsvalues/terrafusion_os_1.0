using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.ArcGisRawLanding;

/// <summary>
/// Slice D1: orchestrator for raw ArcGIS feature-service landing.
///
/// <para>Per <c>docs/pacs/block-d-execution-plan.md</c> §3.1:
/// invokes the existing G1-C
/// <c>IArcGisFeatureServiceClient</c> for the requested
/// <paramref name="countyId"/>, writes each returned feature
/// verbatim to <c>legacy_arcgis_raw.parcel_geom</c> with full
/// provenance, and emits the four R-* gates of the doctrine
/// pattern.</para>
///
/// <para>v1 simplifications:
/// <list type="bullet">
///   <item>Single full-county pull per call (no incremental
///   sync; that's a future slice's concern).</item>
///   <item>Idempotent by <c>LoadBatchId</c>: re-running with the
///   same <paramref name="countyId"/> creates a new LoadBatch
///   (with a fresh GUID) and lands fresh rows; old batches stay
///   in place and become D2's "promote latest" responsibility.</item>
///   <item>No retry / backoff / cache fallback in v1; transport
///   failures bubble up via the G1-C client's
///   <c>ArcGisFeatureServiceTransportException</c>.</item>
/// </list>
/// </para>
/// </summary>
public interface IArcGisRawLandingService
{
    Task<ArcGisRawLandingResult> LandParcelGeomsAsync(
        string fipsCode,
        Guid countyId,
        string operatorName,
        int? topN,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// GEOM-011: paged variant — uses ArcGIS resultOffset pagination to
    /// land more features than the server's single-request maxRecordCount.
    /// Routes to this method when FullCorpus=true or topN &gt; pageSize.
    /// </summary>
    Task<ArcGisRawLandingResult> LandParcelGeomsPagedAsync(
        string fipsCode,
        Guid countyId,
        string operatorName,
        int pageSize,
        int? topN,
        CancellationToken cancellationToken = default);
}

/// <summary>Slice D1: outcome of one landing run.</summary>
public sealed record ArcGisRawLandingResult
{
    public required Guid LoadBatchId { get; init; }

    /// <summary>'COMPLETED' | 'FAILED' | 'REFUSED'.</summary>
    public required string Status { get; init; }

    /// <summary>Features returned by the FeatureService client.</summary>
    public required int FeaturesConsidered { get; init; }

    /// <summary>Features written to <c>legacy_arcgis_raw.parcel_geom</c>.</summary>
    public required int FeaturesLanded { get; init; }

    /// <summary>
    /// How many <c>(CountyId, ArcGisObjectId)</c> tuples appeared
    /// more than once in the FeatureService response (the
    /// key-uniqueness gate's input). Should be zero for a healthy
    /// service.
    /// </summary>
    public required int DuplicateObjectIds { get; init; }

    /// <summary>Sum of <c>AreaSqFt</c> across landed rows.</summary>
    public required double AreaSqFtSum { get; init; }

    public string? ErrorSummary { get; init; }

    /// <summary>GEOM-011: total pages fetched (0 for non-paged runs).</summary>
    public int TotalPages { get; init; }

    /// <summary>GEOM-011: true when LandParcelGeomsPagedAsync was used.</summary>
    public bool PaginatedMode { get; init; }
}

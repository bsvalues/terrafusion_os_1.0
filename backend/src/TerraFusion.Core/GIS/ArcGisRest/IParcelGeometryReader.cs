using System;
using System.Threading;
using System.Threading.Tasks;
using TerraFusion.Abstractions.DTOs.GisTf;

namespace TerraFusion.Core.GIS.ArcGisRest;

/// <summary>
/// Slice G1-E-2: read-only projection of <c>gis_tf.tf_parcel_geom</c>
/// for the parcel-geometry HTTP endpoint. Returns the active geometry
/// for a TerraFusion canonical parcel id, paired with the parcel's
/// CountyId so the caller can run a county-isolation check before
/// returning the payload.
/// </summary>
public interface IParcelGeometryReader
{
    /// <summary>
    /// Returns <see cref="ParcelGeometryLookup.NotFound"/> when no
    /// <c>tf_parcel</c> matches; <see cref="ParcelGeometryLookup.NoGeometry"/>
    /// when the parcel exists but has no active <c>tf_parcel_geom</c>;
    /// or <see cref="ParcelGeometryLookup.Found"/> with the projection.
    /// </summary>
    Task<ParcelGeometryLookup> GetGeometryAsync(
        Guid tfParcelId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Slice D4-Neighbors: returns parcels in the same county as the
    /// anchor whose stored centroids fall within
    /// <paramref name="radiusFeet"/> of the anchor's centroid, ordered
    /// by ascending great-circle distance and capped at
    /// <paramref name="maxResults"/>.
    ///
    /// <para>Mirrors the three-state lookup of
    /// <see cref="GetGeometryAsync"/>: <c>NotFound</c> when the anchor
    /// parcel is absent, <c>NoGeometry</c> when it exists with no
    /// active <c>tf_parcel_geom</c>, <c>Found</c> with the neighbor
    /// list (possibly empty) otherwise. The implementation MUST
    /// enforce sovereign-county isolation — a parcel in
    /// <c>CountyB</c> can NEVER appear when the anchor is in
    /// <c>CountyA</c>.</para>
    /// </summary>
    Task<ParcelNeighborLookup> GetNeighborsAsync(
        Guid tfParcelId,
        double radiusFeet,
        int maxResults,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Three-state result discriminating "parcel doesn't exist" from
/// "parcel exists but has no active geometry." The controller maps
/// both to 404 in v1, but distinguishing them lets the controller
/// emit accurate <c>logger.LogInformation</c> entries and lets a
/// future endpoint (e.g. GIS audit) treat them differently without
/// changing this contract.
/// </summary>
public sealed record ParcelGeometryLookup
{
    public required ParcelGeometryLookupKind Kind { get; init; }

    /// <summary>Set when <see cref="Kind"/> is <c>NoGeometry</c> or <c>Found</c>.</summary>
    public Guid? CountyId { get; init; }

    /// <summary>Set only when <see cref="Kind"/> is <c>Found</c>.</summary>
    public ParcelGeometryResponse? Payload { get; init; }

    public static ParcelGeometryLookup NotFound() =>
        new() { Kind = ParcelGeometryLookupKind.NotFound };

    public static ParcelGeometryLookup NoGeometry(Guid countyId) =>
        new() { Kind = ParcelGeometryLookupKind.NoGeometry, CountyId = countyId };

    public static ParcelGeometryLookup Found(Guid countyId, ParcelGeometryResponse payload) =>
        new()
        {
            Kind = ParcelGeometryLookupKind.Found,
            CountyId = countyId,
            Payload = payload,
        };
}

public enum ParcelGeometryLookupKind
{
    NotFound = 0,
    NoGeometry = 1,
    Found = 2,
}

/// <summary>
/// Slice D4-Neighbors: three-state result for the neighbor-lookup
/// path. Mirrors <see cref="ParcelGeometryLookup"/>'s shape so the
/// controller can reuse the same NotFound/NoGeometry/Found mapping
/// (and the same cross-county "look like a 404" doctrine).
/// </summary>
public sealed record ParcelNeighborLookup
{
    public required ParcelGeometryLookupKind Kind { get; init; }

    /// <summary>Anchor's CountyId — set when <see cref="Kind"/> is <c>NoGeometry</c> or <c>Found</c>.</summary>
    public Guid? CountyId { get; init; }

    /// <summary>Set only when <see cref="Kind"/> is <c>Found</c>.</summary>
    public ParcelNeighborResponse? Payload { get; init; }

    public static ParcelNeighborLookup NotFound() =>
        new() { Kind = ParcelGeometryLookupKind.NotFound };

    public static ParcelNeighborLookup NoGeometry(Guid countyId) =>
        new() { Kind = ParcelGeometryLookupKind.NoGeometry, CountyId = countyId };

    public static ParcelNeighborLookup Found(Guid countyId, ParcelNeighborResponse payload) =>
        new()
        {
            Kind = ParcelGeometryLookupKind.Found,
            CountyId = countyId,
            Payload = payload,
        };
}

using System;
using System.Collections.Generic;

namespace TerraFusion.Core.DTOs.GisTf;

/// <summary>
/// Slice D4-Neighbors: response payload for
/// <c>GET /api/parcels/{tfParcelId}/neighbors</c>.
///
/// <para>Doctrine: PII-free. Returns a list of canonical-parcel ids
/// whose stored centroids fall within the requested radius of the
/// anchor parcel's centroid, ordered by ascending great-circle
/// distance and capped by <c>maxResults</c>. Distance is computed
/// in-memory using the haversine formula on stored
/// <see cref="ParcelNeighbor.CentroidLat"/> /
/// <see cref="ParcelNeighbor.CentroidLon"/> values — PostGIS is NOT
/// required.</para>
///
/// <para>The anchor parcel itself is never included in the result
/// list.</para>
/// </summary>
public sealed record ParcelNeighborResponse
{
    public required Guid AnchorTfParcelId { get; init; }
    public required Guid CountyId { get; init; }

    /// <summary>Anchor centroid latitude (WGS84) — echoed for client convenience.</summary>
    public required double AnchorCentroidLat { get; init; }

    /// <summary>Anchor centroid longitude (WGS84) — echoed for client convenience.</summary>
    public required double AnchorCentroidLon { get; init; }

    /// <summary>Effective radius in feet used for the lookup (post clamp).</summary>
    public required double RadiusFeet { get; init; }

    /// <summary>Effective max-results cap used for the lookup (post clamp).</summary>
    public required int MaxResults { get; init; }

    /// <summary>
    /// Neighbors ordered by ascending <see cref="ParcelNeighbor.DistanceFeet"/>.
    /// Empty list when no parcel falls within the radius.
    /// </summary>
    public required IReadOnlyList<ParcelNeighbor> Neighbors { get; init; }
}

/// <summary>
/// One neighbor entry in <see cref="ParcelNeighborResponse"/>. PII-free
/// by construction; no owner, address, or value fields are surfaced.
/// </summary>
public sealed record ParcelNeighbor
{
    public required Guid TfParcelId { get; init; }
    public required string GeomWkt { get; init; }
    public required double CentroidLat { get; init; }
    public required double CentroidLon { get; init; }

    /// <summary>Great-circle distance from the anchor centroid, in feet.</summary>
    public required double DistanceFeet { get; init; }
}

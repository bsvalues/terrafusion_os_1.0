using System;

namespace TerraFusion.Abstractions.DTOs.GisTf;

/// <summary>
/// Slice G1-E-2: response payload for
/// <c>GET /api/parcels/{tfParcelId}/geometry</c>.
///
/// <para>Doctrine: PII-free. <c>TfParcelId</c> is the canonical
/// identity; <c>CountyId</c> is included so a downstream consumer
/// can verify county isolation client-side without re-resolving the
/// parcel. All other fields are public-safe geometry + provenance.</para>
/// </summary>
public sealed record ParcelGeometryResponse
{
    public required Guid TfParcelId { get; init; }
    public required Guid CountyId { get; init; }

    /// <summary>Polygon as Well-Known Text (WGS84).</summary>
    public required string GeomWkt { get; init; }

    public required double CentroidLat { get; init; }
    public required double CentroidLon { get; init; }
    public required double AreaSqFt { get; init; }

    public required DateTime LastSyncedAt { get; init; }
    public required string SourceServiceUrl { get; init; }

    /// <summary>
    /// Always <c>true</c> for a 200 response — the controller filters
    /// out soft-deleted geometry. Surfaced for client-side
    /// invariant checks.
    /// </summary>
    public required bool IsActive { get; init; }
}

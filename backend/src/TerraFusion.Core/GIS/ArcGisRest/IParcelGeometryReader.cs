using System;
using System.Threading;
using System.Threading.Tasks;
using TerraFusion.Core.DTOs.GisTf;

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

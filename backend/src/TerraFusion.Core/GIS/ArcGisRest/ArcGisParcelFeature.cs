using System;

namespace TerraFusion.Core.GIS.ArcGisRest;

/// <summary>
/// Slice G1-C: canonical-tf-shaped projection of a single ArcGIS
/// parcel feature. Consumers (G1-D nightly sync) map this directly
/// onto <see cref="TerraFusion.Core.Entities.GisTf.TfParcelGeom"/>.
///
/// <para>Pre-computed centroid + area columns are derived from the
/// polygon at parse time so downstream proximity queries don't need
/// to re-parse WKT on every read.</para>
///
/// <para>The adapter does not concern itself with crosswalk to
/// <c>tf_parcel</c>: <see cref="ArcGisApn"/> carries the county-readable
/// parcel number and crosswalk closure happens in G1-D against
/// <c>canonical_tf.tf_parcel.parcel_number</c>.</para>
/// </summary>
public sealed record ArcGisParcelFeature
{
    /// <summary>The county whose feature service produced this row.</summary>
    public required Guid CountyId { get; init; }

    /// <summary>ArcGIS feature primary key (OBJECTID).</summary>
    public required long ArcGisObjectId { get; init; }

    /// <summary>County-readable parcel number (APN). May be null
    /// if the feature service omitted it on this row.</summary>
    public string? ArcGisApn { get; init; }

    /// <summary>Polygon geometry as Well-Known Text (WGS84).</summary>
    public required string GeomWkt { get; init; }

    /// <summary>Centroid latitude (mean of the exterior ring vertices).</summary>
    public required double CentroidLat { get; init; }

    /// <summary>Centroid longitude (mean of the exterior ring vertices).</summary>
    public required double CentroidLon { get; init; }

    /// <summary>
    /// Polygon area in square feet, taken from the
    /// <c>Shape__Area</c> attribute when present, else 0. Computing
    /// area client-side from WGS84 polygons is non-trivial; deferring
    /// to ArcGIS server-side area is the v1 simplification.
    /// </summary>
    public required double AreaSqFt { get; init; }

    /// <summary>The feature service URL this row was sourced from.</summary>
    public required string SourceServiceUrl { get; init; }
}

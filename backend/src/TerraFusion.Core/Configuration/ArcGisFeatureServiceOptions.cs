using System;
using System.Collections.Generic;

namespace TerraFusion.Core.Configuration;

/// <summary>
/// Slice G1-B: per-county ArcGIS REST feature-service configuration.
///
/// <para>Per <c>docs/plans/terrafusion-90-day-execution-plan.md</c> §4
/// (Block D / GIS sub-block): TerraFusion consumes county ArcGIS REST
/// feature services rather than rolling its own shapefile parser.
/// Each county's parcel feature service URL + attribute names live
/// here, keyed by <see cref="Guid"/> county identity.</para>
///
/// <para>v1 (this slice) lands the binding only; the actual REST
/// adapter and nightly sync are slices G1-C / G1-D.</para>
///
/// <para>Bound from configuration section <see cref="SectionName"/>.</para>
/// </summary>
public sealed class ArcGisFeatureServiceOptions
{
    /// <summary>Configuration section name: <c>ArcGisFeatureServices</c>.</summary>
    public const string SectionName = "ArcGisFeatureServices";

    /// <summary>
    /// Per-county feature service definitions, keyed by the canonical
    /// Guid string form of the CountyId. String keys (rather than
    /// <see cref="Guid"/>) are required because
    /// <c>Microsoft.Extensions.Configuration</c> only binds
    /// dictionaries with string keys natively.
    /// </summary>
    public IDictionary<string, CountyArcGisOptions> Counties { get; set; }
        = new Dictionary<string, CountyArcGisOptions>();

    /// <summary>
    /// Type-safe lookup: returns the <see cref="CountyArcGisOptions"/>
    /// for the given <paramref name="fipsCode"/>, or <c>null</c> if
    /// no configuration was bound for that FIPS code. Performs a
    /// case-insensitive string match so appsettings key casing does
    /// not matter.
    /// </summary>
    public CountyArcGisOptions? GetForCounty(string fipsCode)
    {
        foreach (var kvp in Counties)
        {
            if (string.Equals(kvp.Key, fipsCode, StringComparison.OrdinalIgnoreCase))
            {
                return kvp.Value;
            }
        }
        return null;
    }
}

/// <summary>
/// Slice G1-B: ArcGIS feature-service settings for a single county.
/// </summary>
public sealed class CountyArcGisOptions
{
    /// <summary>
    /// Full URL to the parcel feature service layer. Example:
    /// <c>https://services.arcgis.com/abc123/arcgis/rest/services/Parcels/FeatureServer/0</c>.
    /// </summary>
    public string ParcelFeatureServiceUrl { get; set; } = string.Empty;

    /// <summary>
    /// Attribute name carrying the county-readable parcel number on
    /// the ArcGIS feature. Defaults to <c>"APN"</c>; override per
    /// county if their service uses a different attribute name.
    /// </summary>
    public string ApnAttributeName { get; set; } = "APN";

    /// <summary>
    /// Attribute name for the ArcGIS feature primary key. Almost
    /// always <c>"OBJECTID"</c>.
    /// </summary>
    public string ObjectIdAttributeName { get; set; } = "OBJECTID";

    /// <summary>
    /// EPSG code of the spatial reference to request from the service.
    /// Defaults to <c>4326</c> (WGS84 lat/lon), the canonical TF storage
    /// projection.
    /// </summary>
    public int OutSpatialReferenceEpsg { get; set; } = 4326;

    /// <summary>
    /// HTTP timeout for a single feature-service request, in seconds.
    /// Defaults to <c>30</c>.
    /// </summary>
    public int RequestTimeoutSeconds { get; set; } = 30;

    /// <summary>
    /// Optional bearer token for authenticated feature services.
    /// Most county ArcGIS endpoints are public read; leave empty if
    /// no token is required.
    /// </summary>
    public string? BearerToken { get; set; }

    /// <summary>
    /// TerraFusion DB county row GUID for this FIPS entry. Required
    /// by the nightly sync hosted service to stamp geometry rows;
    /// optional for the raw landing path (which uses FIPS only for
    /// config resolution and accepts the countyId as a caller argument).
    /// </summary>
    public Guid? CountyId { get; set; }
}

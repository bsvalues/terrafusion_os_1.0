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
    /// Per-county feature service definitions, keyed by FIPS code (e.g. "53005"
    /// for Benton County WA). FIPS codes are immutable across DB provisioning;
    /// County.Id GUIDs are not. String keys are required because
    /// <c>Microsoft.Extensions.Configuration</c> only binds dictionaries with
    /// string keys natively.
    /// </summary>
    public IDictionary<string, CountyArcGisOptions> Counties { get; set; }
        = new Dictionary<string, CountyArcGisOptions>();

    /// <summary>
    /// GEOM-005: type-safe lookup by FIPS code. Returns the
    /// <see cref="CountyArcGisOptions"/> for the given
    /// <paramref name="fipsCode"/>, or <c>null</c> if no configuration
    /// was bound for that FIPS code. Case-insensitive.
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
    /// GEOM-005: optional DB identity of this county. Used by the nightly
    /// sync hosted service to resolve which row to stamp geometry against
    /// when iterating FIPS-keyed config entries. Not required by the drain
    /// controller (it resolves CountyId from the DB via FipsCode).
    /// </summary>
    public Guid? CountyId { get; set; }

    /// <summary>
    /// GEOM-011: number of features to request per page when using ArcGIS
    /// pagination (resultOffset + resultRecordCount). Defaults to 1000.
    /// Must not exceed the ArcGIS server's maxRecordCount (~2000 for Benton).
    /// </summary>
    public int PageSize { get; set; } = 1000;
}

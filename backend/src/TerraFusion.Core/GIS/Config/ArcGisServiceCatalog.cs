// BIV-079: ArcGIS Service Catalog — Benton County layer definitions
namespace TerraFusion.Core.GIS.Config;

/// <summary>
/// Static catalog of Benton County ArcGIS REST service endpoints.
/// Contains layer definitions, service URLs, layer IDs, and field names
/// for all spatial data consumed by the TerraAtlas subsystem.
/// </summary>
public static class ArcGisServiceCatalog
{
    // ── Base URLs ────────────────────────────────────────────────────

    /// <summary>Benton County GIS portal base URL.</summary>
    public const string BentonCountyBaseUrl =
        "https://gis.co.benton.wa.us/arcgis/rest/services";

    /// <summary>Benton County map service root.</summary>
    public const string MapServiceRoot =
        $"{BentonCountyBaseUrl}/Public/BentonCounty/MapServer";

    /// <summary>Benton County geocode service.</summary>
    public const string GeocodeServiceUrl =
        $"{BentonCountyBaseUrl}/Locators/BentonCounty/GeocodeServer";

    // ── Layer Definitions ────────────────────────────────────────────

    /// <summary>Describes a single ArcGIS map service layer.</summary>
    public sealed record LayerDefinition(
        /// <summary>Layer ID within the map service.</summary>
        int LayerId,
        /// <summary>Human-readable layer name.</summary>
        string Name,
        /// <summary>Full query URL for this layer.</summary>
        string QueryUrl,
        /// <summary>Primary key field name in the layer.</summary>
        string PrimaryKeyField,
        /// <summary>Display/label field name.</summary>
        string DisplayField,
        /// <summary>Key attribute fields available on this layer.</summary>
        IReadOnlyList<string> Fields);

    /// <summary>Parcel boundaries — the core assessment layer (89,247 parcels).</summary>
    public static readonly LayerDefinition Parcels = new(
        LayerId: 0,
        Name: "Parcels",
        QueryUrl: $"{MapServiceRoot}/0/query",
        PrimaryKeyField: "PARCEL_ID",
        DisplayField: "PARCEL_ID",
        Fields: new[]
        {
            "OBJECTID", "PARCEL_ID", "SITUS_ADDR", "SITUS_CITY",
            "SITUS_ZIP", "OWNER_NAME", "LEGAL_DESC", "ACRES",
            "USE_CODE", "TOWNSHIP", "RANGE", "SECTION"
        });

    /// <summary>Zoning districts — land use regulatory boundaries.</summary>
    public static readonly LayerDefinition Zoning = new(
        LayerId: 1,
        Name: "Zoning",
        QueryUrl: $"{MapServiceRoot}/1/query",
        PrimaryKeyField: "ZONE_ID",
        DisplayField: "ZONE_DESC",
        Fields: new[]
        {
            "OBJECTID", "ZONE_ID", "ZONE_CODE", "ZONE_DESC",
            "JURISDICTION", "EFFECTIVE_DATE"
        });

    /// <summary>FEMA flood zone boundaries.</summary>
    public static readonly LayerDefinition FloodZones = new(
        LayerId: 2,
        Name: "FloodZones",
        QueryUrl: $"{MapServiceRoot}/2/query",
        PrimaryKeyField: "FLD_ZONE",
        DisplayField: "FLD_ZONE",
        Fields: new[]
        {
            "OBJECTID", "FLD_ZONE", "FLD_AR_ID", "ZONE_SUBTY",
            "SFHA_TF", "FIRM_PAN", "STATIC_BFE"
        });

    /// <summary>Assessment neighborhoods for comparable analysis.</summary>
    public static readonly LayerDefinition Neighborhoods = new(
        LayerId: 3,
        Name: "Neighborhoods",
        QueryUrl: $"{MapServiceRoot}/3/query",
        PrimaryKeyField: "NEIGHBORHOOD_CODE",
        DisplayField: "NEIGHBORHOOD_NAME",
        Fields: new[]
        {
            "OBJECTID", "NEIGHBORHOOD_CODE", "NEIGHBORHOOD_NAME",
            "MARKET_AREA", "LAND_CLASS"
        });

    /// <summary>School district boundaries.</summary>
    public static readonly LayerDefinition SchoolDistricts = new(
        LayerId: 4,
        Name: "SchoolDistricts",
        QueryUrl: $"{MapServiceRoot}/4/query",
        PrimaryKeyField: "DISTRICT_ID",
        DisplayField: "DISTRICT_NAME",
        Fields: new[]
        {
            "OBJECTID", "DISTRICT_ID", "DISTRICT_NAME",
            "DISTRICT_NUMBER", "COUNTY"
        });

    /// <summary>Road centerlines and right-of-way.</summary>
    public static readonly LayerDefinition Roads = new(
        LayerId: 5,
        Name: "Roads",
        QueryUrl: $"{MapServiceRoot}/5/query",
        PrimaryKeyField: "ROAD_ID",
        DisplayField: "ROAD_NAME",
        Fields: new[]
        {
            "OBJECTID", "ROAD_ID", "ROAD_NAME", "ROAD_CLASS",
            "SURFACE_TYPE", "SPEED_LIMIT", "LANES"
        });

    /// <summary>Aerial/orthoimagery service endpoint.</summary>
    public static readonly LayerDefinition Aerial = new(
        LayerId: 6,
        Name: "Aerial",
        QueryUrl: $"{BentonCountyBaseUrl}/Imagery/BentonCounty/ImageServer",
        PrimaryKeyField: "OBJECTID",
        DisplayField: "Name",
        Fields: new[] { "OBJECTID", "Name", "AcquisitionDate", "Resolution" });

    // ── Layer Registry ───────────────────────────────────────────────

    /// <summary>All registered layers indexed by name.</summary>
    public static readonly IReadOnlyDictionary<string, LayerDefinition> AllLayers =
        new Dictionary<string, LayerDefinition>(StringComparer.OrdinalIgnoreCase)
        {
            [Parcels.Name] = Parcels,
            [Zoning.Name] = Zoning,
            [FloodZones.Name] = FloodZones,
            [Neighborhoods.Name] = Neighborhoods,
            [SchoolDistricts.Name] = SchoolDistricts,
            [Roads.Name] = Roads,
            [Aerial.Name] = Aerial,
        };

    /// <summary>Try to resolve a layer definition by name (case-insensitive).</summary>
    public static bool TryGetLayer(string name, out LayerDefinition? layer) =>
        AllLayers.TryGetValue(name, out layer);

    /// <summary>
    /// Build the full query URL for a layer with standard ArcGIS parameters.
    /// </summary>
    public static string BuildQueryUrl(
        LayerDefinition layer,
        string where = "1=1",
        string? geometry = null,
        string geometryType = "esriGeometryEnvelope",
        bool returnGeometry = true,
        int resultRecordCount = 1000)
    {
        var url = $"{layer.QueryUrl}?where={Uri.EscapeDataString(where)}" +
                  $"&outFields={string.Join(",", layer.Fields)}" +
                  $"&returnGeometry={returnGeometry.ToString().ToLowerInvariant()}" +
                  $"&resultRecordCount={resultRecordCount}" +
                  "&f=json";

        if (!string.IsNullOrWhiteSpace(geometry))
        {
            url += $"&geometry={Uri.EscapeDataString(geometry)}" +
                   $"&geometryType={geometryType}" +
                   "&spatialRel=esriSpatialRelIntersects" +
                   "&inSR=4326&outSR=4326";
        }

        return url;
    }
}

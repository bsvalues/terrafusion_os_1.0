using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace TerraFusion.Core.GIS.ArcGisRest;

/// <summary>
/// Slice G1-C: minimal GeoJSON FeatureCollection DTOs covering only
/// the shape we ask the ArcGIS REST endpoint to return
/// (<c>?f=geojson</c>). Field set is deliberately narrow — we want
/// an OBJECTID, an APN, an optional area, and a Polygon ring. Anything
/// richer than that is parsed lazily as <see cref="JsonElement"/>-style
/// generic <c>Dictionary&lt;string, object&gt;</c> on
/// <see cref="ArcGisGeoJsonProperties.AdditionalAttributes"/> so the
/// adapter doesn't break if the service returns unexpected fields.
/// </summary>
internal sealed class ArcGisGeoJsonFeatureCollection
{
    [JsonPropertyName("type")]
    public string? Type { get; set; }

    [JsonPropertyName("features")]
    public List<ArcGisGeoJsonFeature> Features { get; set; } = new();

    // GEOMETRY-PAGING (2026-06-04): ArcGIS geojson responses carry a top-level
    // "properties": { "exceededTransferLimit": true } when more rows remain past
    // the page. Used (alongside short-page detection) to terminate the paging loop.
    [JsonPropertyName("properties")]
    public ArcGisGeoJsonCollectionProperties? Properties { get; set; }
}

internal sealed class ArcGisGeoJsonCollectionProperties
{
    [JsonPropertyName("exceededTransferLimit")]
    public bool? ExceededTransferLimit { get; set; }
}

internal sealed class ArcGisGeoJsonFeature
{
    [JsonPropertyName("type")]
    public string? Type { get; set; }

    [JsonPropertyName("properties")]
    public Dictionary<string, System.Text.Json.JsonElement>? Properties { get; set; }

    [JsonPropertyName("geometry")]
    public ArcGisGeoJsonGeometry? Geometry { get; set; }
}

internal sealed class ArcGisGeoJsonGeometry
{
    [JsonPropertyName("type")]
    public string? Type { get; set; }

    /// <summary>
    /// For Polygon: <c>double[ring][vertex][lng,lat]</c>.
    /// For MultiPolygon: one extra outer level. The adapter only
    /// supports Polygon in v1; MultiPolygon support is a future
    /// extension.
    /// </summary>
    [JsonPropertyName("coordinates")]
    public System.Text.Json.JsonElement Coordinates { get; set; }
}

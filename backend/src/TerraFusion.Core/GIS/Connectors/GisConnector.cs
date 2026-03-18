// BIV-008: GIS Connector — multi-provider spatial data access
using System.Collections.Concurrent;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace TerraFusion.Core.GIS.Connectors;

// ── Data Models ──────────────────────────────────────────────────────

/// <summary>Latitude/longitude coordinate with optional altitude.</summary>
public record GeoPoint(double Latitude, double Longitude, double? Altitude = null);

/// <summary>A closed ring of coordinates forming a polygon boundary.</summary>
public record Polygon(IReadOnlyList<GeoPoint> ExteriorRing);

/// <summary>Single GIS feature with geometry and attribute bag.</summary>
public record GisFeature(
    string Id,
    string GeometryType,
    IReadOnlyList<GeoPoint> Coordinates,
    IReadOnlyDictionary<string, object?> Attributes);

/// <summary>Collection of GIS features returned from a spatial query.</summary>
public record FeatureCollection(
    IReadOnlyList<GisFeature> Features,
    int TotalCount,
    string? Crs = "EPSG:4326");

/// <summary>Bounding box for spatial queries: (minLng, minLat, maxLng, maxLat).</summary>
public record BoundingBox(double MinLng, double MinLat, double MaxLng, double MaxLat);

/// <summary>Geocode result with confidence score.</summary>
public record GeocodeResult(GeoPoint Point, double Confidence, string MatchedAddress);

/// <summary>Configuration for a single GIS provider endpoint.</summary>
public class GisProviderOptions
{
    /// <summary>Provider type: ArcGIS, Mapbox, WFS, WMS.</summary>
    public string ProviderType { get; set; } = "ArcGIS";

    /// <summary>Base URL for the service endpoint.</summary>
    public string BaseUrl { get; set; } = string.Empty;

    /// <summary>API key or token (optional for public services).</summary>
    public string? ApiKey { get; set; }

    /// <summary>Request timeout in seconds.</summary>
    public int TimeoutSeconds { get; set; } = 30;
}

// ── Interface ────────────────────────────────────────────────────────

/// <summary>
/// Multi-provider GIS connector. Supports ArcGIS REST, Mapbox, and
/// generic WFS/WMS services for geocoding, feature queries, and
/// parcel boundary retrieval.
/// </summary>
public interface IGisConnector
{
    /// <summary>Geocode a street address to a geographic point.</summary>
    /// <param name="address">Full street address string.</param>
    /// <returns>Geocode result with lat/lng and confidence.</returns>
    Task<GeocodeResult> GeocodeAddressAsync(string address, CancellationToken ct = default);

    /// <summary>Query features from a named layer within a bounding box.</summary>
    /// <param name="layerName">Layer name or ID in the GIS service.</param>
    /// <param name="bbox">Spatial extent to query.</param>
    /// <param name="filter">Optional attribute filter (SQL WHERE clause).</param>
    Task<FeatureCollection> QueryFeaturesAsync(string layerName, BoundingBox bbox, string? filter = null, CancellationToken ct = default);

    /// <summary>Retrieve the boundary polygon for a specific parcel.</summary>
    /// <param name="parcelId">County parcel identifier.</param>
    Task<Polygon?> GetParcelBoundaryAsync(string parcelId, CancellationToken ct = default);

    /// <summary>List available layers from the configured GIS service.</summary>
    Task<IReadOnlyList<string>> ListLayersAsync(CancellationToken ct = default);
}

// ── Implementation ───────────────────────────────────────────────────

/// <summary>
/// Production GIS connector supporting ArcGIS REST API, Mapbox Geocoding,
/// and generic OGC WFS/WMS endpoints. Provider is selected via configuration.
/// </summary>
public sealed class GisConnector : IGisConnector, IDisposable
{
    private readonly HttpClient _http;
    private readonly GisProviderOptions _options;
    private readonly ILogger<GisConnector> _logger;

    public GisConnector(
        HttpClient httpClient,
        IOptions<GisProviderOptions> options,
        ILogger<GisConnector> logger)
    {
        _http = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        if (!string.IsNullOrWhiteSpace(_options.BaseUrl))
            _http.BaseAddress = new Uri(_options.BaseUrl.TrimEnd('/') + "/");

        _http.Timeout = TimeSpan.FromSeconds(_options.TimeoutSeconds);
    }

    /// <inheritdoc />
    public async Task<GeocodeResult> GeocodeAddressAsync(string address, CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(address);
        _logger.LogDebug("Geocoding address via {Provider}: {Address}", _options.ProviderType, address);

        return _options.ProviderType switch
        {
            "ArcGIS" => await GeocodeViaArcGisAsync(address, ct),
            "Mapbox" => await GeocodeViaMapboxAsync(address, ct),
            _ => await GeocodeViaArcGisAsync(address, ct) // default fallback
        };
    }

    /// <inheritdoc />
    public async Task<FeatureCollection> QueryFeaturesAsync(
        string layerName, BoundingBox bbox, string? filter = null, CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(layerName);
        _logger.LogDebug("Querying features from layer {Layer} within bbox", layerName);

        return _options.ProviderType switch
        {
            "ArcGIS" => await QueryViaArcGisAsync(layerName, bbox, filter, ct),
            "WFS" => await QueryViaWfsAsync(layerName, bbox, filter, ct),
            _ => await QueryViaArcGisAsync(layerName, bbox, filter, ct)
        };
    }

    /// <inheritdoc />
    public async Task<Polygon?> GetParcelBoundaryAsync(string parcelId, CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(parcelId);
        _logger.LogDebug("Retrieving parcel boundary for {ParcelId}", parcelId);

        // Query parcels layer with parcel ID filter
        var filter = $"PARCEL_ID='{parcelId}'";
        var bbox = new BoundingBox(-180, -90, 180, 90); // full extent; filter narrows
        var features = await QueryFeaturesAsync("Parcels", bbox, filter, ct);

        if (features.Features.Count == 0)
        {
            _logger.LogWarning("No boundary found for parcel {ParcelId}", parcelId);
            return null;
        }

        var ring = features.Features[0].Coordinates;
        return new Polygon(ring);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<string>> ListLayersAsync(CancellationToken ct = default)
    {
        _logger.LogDebug("Listing available layers from {Provider}", _options.ProviderType);

        try
        {
            if (_options.ProviderType == "ArcGIS")
            {
                var url = "?f=json";
                if (!string.IsNullOrWhiteSpace(_options.ApiKey))
                    url += $"&token={_options.ApiKey}";

                var doc = await _http.GetFromJsonAsync<JsonElement>(url, ct);
                var layers = new List<string>();

                if (doc.TryGetProperty("layers", out var arr))
                {
                    foreach (var layer in arr.EnumerateArray())
                    {
                        if (layer.TryGetProperty("name", out var name))
                            layers.Add(name.GetString() ?? "");
                    }
                }
                return layers;
            }

            // WFS GetCapabilities fallback
            return Array.Empty<string>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to list layers from {Provider}", _options.ProviderType);
            return Array.Empty<string>();
        }
    }

    // ── ArcGIS REST Helpers ──────────────────────────────────────────

    private async Task<GeocodeResult> GeocodeViaArcGisAsync(string address, CancellationToken ct)
    {
        var url = $"findAddressCandidates?SingleLine={Uri.EscapeDataString(address)}&f=json&outFields=*&maxLocations=1";
        if (!string.IsNullOrWhiteSpace(_options.ApiKey))
            url += $"&token={_options.ApiKey}";

        var doc = await _http.GetFromJsonAsync<JsonElement>(url, ct);

        if (doc.TryGetProperty("candidates", out var candidates) && candidates.GetArrayLength() > 0)
        {
            var best = candidates[0];
            var loc = best.GetProperty("location");
            var x = loc.GetProperty("x").GetDouble();
            var y = loc.GetProperty("y").GetDouble();
            var score = best.GetProperty("score").GetDouble() / 100.0;
            var matched = best.TryGetProperty("address", out var addr) ? addr.GetString() ?? address : address;

            return new GeocodeResult(new GeoPoint(y, x), score, matched);
        }

        throw new InvalidOperationException($"Geocode failed for address: {address}");
    }

    private async Task<GeocodeResult> GeocodeViaMapboxAsync(string address, CancellationToken ct)
    {
        var url = $"geocoding/v5/mapbox.places/{Uri.EscapeDataString(address)}.json?access_token={_options.ApiKey}&limit=1";
        var doc = await _http.GetFromJsonAsync<JsonElement>(url, ct);

        if (doc.TryGetProperty("features", out var features) && features.GetArrayLength() > 0)
        {
            var best = features[0];
            var coords = best.GetProperty("center");
            var lng = coords[0].GetDouble();
            var lat = coords[1].GetDouble();
            var relevance = best.GetProperty("relevance").GetDouble();
            var placeName = best.TryGetProperty("place_name", out var pn) ? pn.GetString() ?? address : address;

            return new GeocodeResult(new GeoPoint(lat, lng), relevance, placeName);
        }

        throw new InvalidOperationException($"Mapbox geocode failed for address: {address}");
    }

    private async Task<FeatureCollection> QueryViaArcGisAsync(
        string layerName, BoundingBox bbox, string? filter, CancellationToken ct)
    {
        var envelope = $"{bbox.MinLng},{bbox.MinLat},{bbox.MaxLng},{bbox.MaxLat}";
        var where = string.IsNullOrWhiteSpace(filter) ? "1=1" : filter;
        var url = $"{Uri.EscapeDataString(layerName)}/query?geometry={envelope}" +
                  $"&geometryType=esriGeometryEnvelope&spatialRel=esriSpatialRelIntersects" +
                  $"&where={Uri.EscapeDataString(where)}&outFields=*&f=json&returnGeometry=true";

        if (!string.IsNullOrWhiteSpace(_options.ApiKey))
            url += $"&token={_options.ApiKey}";

        var doc = await _http.GetFromJsonAsync<JsonElement>(url, ct);
        return ParseArcGisFeatures(doc);
    }

    private async Task<FeatureCollection> QueryViaWfsAsync(
        string layerName, BoundingBox bbox, string? filter, CancellationToken ct)
    {
        var bboxStr = $"{bbox.MinLat},{bbox.MinLng},{bbox.MaxLat},{bbox.MaxLng}";
        var url = $"?service=WFS&version=2.0.0&request=GetFeature&typeName={Uri.EscapeDataString(layerName)}" +
                  $"&bbox={bboxStr}&outputFormat=application/json&count=1000";

        if (!string.IsNullOrWhiteSpace(filter))
            url += $"&CQL_FILTER={Uri.EscapeDataString(filter)}";

        var doc = await _http.GetFromJsonAsync<JsonElement>(url, ct);
        return ParseGeoJsonFeatures(doc);
    }

    // ── Response Parsers ─────────────────────────────────────────────

    private static FeatureCollection ParseArcGisFeatures(JsonElement doc)
    {
        var results = new List<GisFeature>();

        if (!doc.TryGetProperty("features", out var features))
            return new FeatureCollection(results, 0);

        foreach (var f in features.EnumerateArray())
        {
            var attrs = new Dictionary<string, object?>();
            if (f.TryGetProperty("attributes", out var attrObj))
            {
                foreach (var prop in attrObj.EnumerateObject())
                    attrs[prop.Name] = prop.Value.ValueKind switch
                    {
                        JsonValueKind.String => prop.Value.GetString(),
                        JsonValueKind.Number => prop.Value.GetDouble(),
                        JsonValueKind.True => true,
                        JsonValueKind.False => false,
                        _ => null
                    };
            }

            var coordinates = new List<GeoPoint>();
            var geomType = "Point";
            if (f.TryGetProperty("geometry", out var geom))
            {
                if (geom.TryGetProperty("rings", out var rings))
                {
                    geomType = "Polygon";
                    foreach (var ring in rings.EnumerateArray())
                        foreach (var coord in ring.EnumerateArray())
                            coordinates.Add(new GeoPoint(coord[1].GetDouble(), coord[0].GetDouble()));
                }
                else if (geom.TryGetProperty("x", out var x))
                {
                    coordinates.Add(new GeoPoint(geom.GetProperty("y").GetDouble(), x.GetDouble()));
                }
            }

            var id = attrs.TryGetValue("OBJECTID", out var oid) ? oid?.ToString() ?? "" : Guid.NewGuid().ToString();
            results.Add(new GisFeature(id, geomType, coordinates, attrs));
        }

        return new FeatureCollection(results, results.Count);
    }

    private static FeatureCollection ParseGeoJsonFeatures(JsonElement doc)
    {
        var results = new List<GisFeature>();

        if (!doc.TryGetProperty("features", out var features))
            return new FeatureCollection(results, 0);

        foreach (var f in features.EnumerateArray())
        {
            var attrs = new Dictionary<string, object?>();
            if (f.TryGetProperty("properties", out var props))
            {
                foreach (var prop in props.EnumerateObject())
                    attrs[prop.Name] = prop.Value.ValueKind switch
                    {
                        JsonValueKind.String => prop.Value.GetString(),
                        JsonValueKind.Number => prop.Value.GetDouble(),
                        _ => null
                    };
            }

            var coordinates = new List<GeoPoint>();
            var geomType = "Unknown";
            if (f.TryGetProperty("geometry", out var geom))
            {
                geomType = geom.TryGetProperty("type", out var t) ? t.GetString() ?? "Unknown" : "Unknown";
                if (geom.TryGetProperty("coordinates", out var coords))
                    ParseGeoJsonCoordinates(coords, geomType, coordinates);
            }

            var id = f.TryGetProperty("id", out var fid) ? fid.ToString() : Guid.NewGuid().ToString();
            results.Add(new GisFeature(id, geomType, coordinates, attrs));
        }

        return new FeatureCollection(results, results.Count);
    }

    private static void ParseGeoJsonCoordinates(JsonElement coords, string geomType, List<GeoPoint> output)
    {
        switch (geomType)
        {
            case "Point":
                output.Add(new GeoPoint(coords[1].GetDouble(), coords[0].GetDouble()));
                break;

            case "Polygon":
            case "MultiPolygon":
                foreach (var ring in coords.EnumerateArray())
                {
                    if (geomType == "MultiPolygon")
                    {
                        foreach (var innerRing in ring.EnumerateArray())
                            foreach (var c in innerRing.EnumerateArray())
                                output.Add(new GeoPoint(c[1].GetDouble(), c[0].GetDouble()));
                    }
                    else
                    {
                        foreach (var c in ring.EnumerateArray())
                            output.Add(new GeoPoint(c[1].GetDouble(), c[0].GetDouble()));
                    }
                }
                break;

            case "LineString":
                foreach (var c in coords.EnumerateArray())
                    output.Add(new GeoPoint(c[1].GetDouble(), c[0].GetDouble()));
                break;
        }
    }

    public void Dispose() => _http.Dispose();
}

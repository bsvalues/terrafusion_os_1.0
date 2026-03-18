// BIV-018: Geospatial Enricher — spatial context enrichment for parcels
using Microsoft.Extensions.Logging;
using TerraFusion.Core.GIS.Connectors;

namespace TerraFusion.Core.GIS;

// ── Data Models ──────────────────────────────────────────────────────

/// <summary>A nearby geographic feature with distance from the query point.</summary>
public record NearbyFeature(
    string FeatureType,
    string Name,
    double DistanceMiles,
    GeoPoint Location);

/// <summary>FEMA flood zone classification for a geographic point.</summary>
public record FloodZoneInfo(
    string ZoneCode,
    string ZoneDescription,
    bool IsSpecialFloodHazardArea,
    string? PanelNumber,
    DateTimeOffset? EffectiveDate);

/// <summary>Result of an overlay layer intersection at a point.</summary>
public record OverlayResult(
    string LayerName,
    bool Intersects,
    IReadOnlyDictionary<string, object?> Attributes);

/// <summary>Geocode enrichment result with confidence scoring.</summary>
public record GeoEnrichmentResult(
    double Latitude,
    double Longitude,
    double Confidence,
    string MatchedAddress,
    string GeocodeSource);

// ── Interface ────────────────────────────────────────────────────────

/// <summary>
/// Enriches property records with spatial context: geocoding, proximity
/// analysis, flood zone lookups, and overlay intersections. This is a
/// "where is it?" service — no valuation math.
/// </summary>
public interface IGeospatialEnricher
{
    /// <summary>Geocode an address and return lat/lng with confidence.</summary>
    /// <param name="address">Full street address.</param>
    Task<GeoEnrichmentResult> EnrichWithGeocodeAsync(string address, CancellationToken ct = default);

    /// <summary>Find nearby features of specified types within a radius.</summary>
    /// <param name="point">Center point for proximity search.</param>
    /// <param name="featureTypes">Types to search (e.g., "school", "park", "fire_station").</param>
    /// <param name="radiusMiles">Search radius in miles (default 5).</param>
    Task<IReadOnlyList<NearbyFeature>> EnrichWithProximityAsync(
        GeoPoint point,
        IReadOnlyList<string> featureTypes,
        double radiusMiles = 5.0,
        CancellationToken ct = default);

    /// <summary>Determine the FEMA flood zone for a geographic point.</summary>
    /// <param name="point">Location to check.</param>
    Task<FloodZoneInfo> EnrichWithFloodZoneAsync(GeoPoint point, CancellationToken ct = default);

    /// <summary>
    /// Intersect a point against one or more overlay layers (zoning,
    /// school districts, fire districts, etc.) and return attributes.
    /// </summary>
    /// <param name="point">Location to intersect.</param>
    /// <param name="overlayLayers">Layer names to check.</param>
    Task<IReadOnlyList<OverlayResult>> EnrichWithOverlaysAsync(
        GeoPoint point,
        IReadOnlyList<string> overlayLayers,
        CancellationToken ct = default);
}

// ── Implementation ───────────────────────────────────────────────────

/// <summary>
/// Production geospatial enricher. Delegates to <see cref="IGisConnector"/>
/// for data retrieval and applies spatial logic to produce enrichment results.
/// </summary>
public sealed class GeospatialEnricher : IGeospatialEnricher
{
    private readonly IGisConnector _connector;
    private readonly ILogger<GeospatialEnricher> _logger;

    /// <summary>Earth radius in miles for distance calculations.</summary>
    private const double EarthRadiusMiles = 3958.8;

    public GeospatialEnricher(IGisConnector connector, ILogger<GeospatialEnricher> logger)
    {
        _connector = connector ?? throw new ArgumentNullException(nameof(connector));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc />
    public async Task<GeoEnrichmentResult> EnrichWithGeocodeAsync(string address, CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(address);
        _logger.LogInformation("Enriching geocode for address: {Address}", address);

        var result = await _connector.GeocodeAddressAsync(address, ct);

        return new GeoEnrichmentResult(
            result.Point.Latitude,
            result.Point.Longitude,
            result.Confidence,
            result.MatchedAddress,
            "GisConnector");
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<NearbyFeature>> EnrichWithProximityAsync(
        GeoPoint point,
        IReadOnlyList<string> featureTypes,
        double radiusMiles = 5.0,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(point);
        ArgumentNullException.ThrowIfNull(featureTypes);
        _logger.LogDebug("Proximity search at ({Lat}, {Lng}) radius {Radius}mi for {Types}",
            point.Latitude, point.Longitude, radiusMiles, string.Join(",", featureTypes));

        var results = new List<NearbyFeature>();

        // Convert radius to approximate degree offset for bbox
        var degreeOffset = radiusMiles / 69.0; // ~69 miles per degree latitude
        var bbox = new BoundingBox(
            point.Longitude - degreeOffset,
            point.Latitude - degreeOffset,
            point.Longitude + degreeOffset,
            point.Latitude + degreeOffset);

        foreach (var featureType in featureTypes)
        {
            try
            {
                var features = await _connector.QueryFeaturesAsync(featureType, bbox, null, ct);

                foreach (var feature in features.Features)
                {
                    if (feature.Coordinates.Count == 0) continue;

                    var featurePoint = feature.Coordinates[0];
                    var distance = HaversineDistance(point, featurePoint);

                    if (distance <= radiusMiles)
                    {
                        var name = feature.Attributes.TryGetValue("NAME", out var n)
                            ? n?.ToString() ?? featureType
                            : featureType;

                        results.Add(new NearbyFeature(featureType, name, Math.Round(distance, 3), featurePoint));
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to query proximity features for type {FeatureType}", featureType);
            }
        }

        return results.OrderBy(f => f.DistanceMiles).ToList();
    }

    /// <inheritdoc />
    public async Task<FloodZoneInfo> EnrichWithFloodZoneAsync(GeoPoint point, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(point);
        _logger.LogDebug("Flood zone lookup at ({Lat}, {Lng})", point.Latitude, point.Longitude);

        // Query flood zone layer at a tight bbox around the point
        var offset = 0.0005; // ~50m
        var bbox = new BoundingBox(
            point.Longitude - offset, point.Latitude - offset,
            point.Longitude + offset, point.Latitude + offset);

        try
        {
            var features = await _connector.QueryFeaturesAsync("FloodZones", bbox, null, ct);

            if (features.Features.Count == 0)
            {
                return new FloodZoneInfo("X", "Area of Minimal Flood Hazard", false, null, null);
            }

            var zone = features.Features[0];
            var zoneCode = zone.Attributes.TryGetValue("FLD_ZONE", out var zc)
                ? zc?.ToString() ?? "X"
                : "X";

            var isSfha = zoneCode is "A" or "AE" or "AH" or "AO" or "AR"
                or "A99" or "V" or "VE" or "V1-30";

            var description = GetFloodZoneDescription(zoneCode);
            var panel = zone.Attributes.TryGetValue("FIRM_PAN", out var p) ? p?.ToString() : null;

            return new FloodZoneInfo(zoneCode, description, isSfha, panel, null);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Flood zone lookup failed, defaulting to Zone X");
            return new FloodZoneInfo("X", "Area of Minimal Flood Hazard (lookup failed)", false, null, null);
        }
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<OverlayResult>> EnrichWithOverlaysAsync(
        GeoPoint point,
        IReadOnlyList<string> overlayLayers,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(point);
        ArgumentNullException.ThrowIfNull(overlayLayers);
        _logger.LogDebug("Overlay intersection at ({Lat}, {Lng}) for {LayerCount} layers",
            point.Latitude, point.Longitude, overlayLayers.Count);

        var results = new List<OverlayResult>();
        var offset = 0.0001; // tight bbox for point-in-polygon
        var bbox = new BoundingBox(
            point.Longitude - offset, point.Latitude - offset,
            point.Longitude + offset, point.Latitude + offset);

        foreach (var layer in overlayLayers)
        {
            try
            {
                var features = await _connector.QueryFeaturesAsync(layer, bbox, null, ct);
                var intersects = features.Features.Count > 0;
                var attrs = intersects
                    ? features.Features[0].Attributes
                    : new Dictionary<string, object?>() as IReadOnlyDictionary<string, object?>;

                results.Add(new OverlayResult(layer, intersects, attrs));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Overlay query failed for layer {Layer}", layer);
                results.Add(new OverlayResult(layer, false, new Dictionary<string, object?>()));
            }
        }

        return results;
    }

    // ── Helpers ──────────────────────────────────────────────────────

    /// <summary>Haversine formula — distance in miles between two points.</summary>
    internal static double HaversineDistance(GeoPoint a, GeoPoint b)
    {
        var dLat = ToRadians(b.Latitude - a.Latitude);
        var dLng = ToRadians(b.Longitude - a.Longitude);
        var sinLat = Math.Sin(dLat / 2);
        var sinLng = Math.Sin(dLng / 2);
        var h = sinLat * sinLat +
                Math.Cos(ToRadians(a.Latitude)) * Math.Cos(ToRadians(b.Latitude)) *
                sinLng * sinLng;
        return 2.0 * EarthRadiusMiles * Math.Asin(Math.Sqrt(h));
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180.0;

    private static string GetFloodZoneDescription(string zoneCode) => zoneCode switch
    {
        "A" => "100-year Floodplain (no BFE)",
        "AE" => "100-year Floodplain (with BFE)",
        "AH" => "100-year Shallow Flooding (ponding)",
        "AO" => "100-year Shallow Flooding (sheet flow)",
        "AR" => "100-year Floodplain (temporarily increased risk)",
        "A99" => "100-year Floodplain (federal flood protection)",
        "V" => "Coastal High Hazard (no BFE)",
        "VE" => "Coastal High Hazard (with BFE)",
        "X" => "Area of Minimal Flood Hazard",
        "B" => "Moderate Flood Hazard (0.2% annual chance)",
        "C" => "Minimal Flood Hazard",
        "D" => "Undetermined Flood Hazard",
        _ => $"Flood Zone {zoneCode}"
    };
}

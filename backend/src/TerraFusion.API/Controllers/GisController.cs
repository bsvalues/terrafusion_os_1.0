// BIV-036: GIS Controller — geocoding, spatial queries, parcel boundaries
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraFusion.Core.GIS;
using TerraFusion.Core.GIS.Connectors;
using TerraFusion.Core.GIS.Config;

namespace TerraFusion.API.Controllers;

/// <summary>
/// TerraAtlas GIS endpoints: geocoding, parcel boundary retrieval,
/// layer listing, and proximity searches. All spatial — no valuation.
/// </summary>
[ApiController]
[Route("api/gis")]
[Authorize]
public class GisController : ControllerBase
{
    private readonly IGisConnector _connector;
    private readonly IGeospatialEnricher _enricher;
    private readonly ISpatialAnalysisService _spatial;
    private readonly ILogger<GisController> _logger;

    public GisController(
        IGisConnector connector,
        IGeospatialEnricher enricher,
        ISpatialAnalysisService spatial,
        ILogger<GisController> logger)
    {
        _connector = connector;
        _enricher = enricher;
        _spatial = spatial;
        _logger = logger;
    }

    /// <summary>Geocode a street address to lat/lng coordinates.</summary>
    /// <param name="address">Full street address to geocode.</param>
    /// <returns>Geocode result with coordinates and confidence score.</returns>
    /// <param name="ct">Request cancellation token.</param>
    [HttpGet("geocode")]
    [ProducesResponseType(typeof(GeoEnrichmentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Geocode(
        [FromQuery] string address,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(address))
            return BadRequest(new { error = "Address is required." });

        _logger.LogInformation("Geocode request: {Address}", address);

        try
        {
            var result = await _enricher.EnrichWithGeocodeAsync(address, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Geocode failed for {Address}", address);
            return NotFound(new { error = $"Could not geocode address: {address}" });
        }
    }

    /// <summary>Query parcels within a bounding box with optional attribute filter.</summary>
    /// <param name="bbox">Bounding box as "minLng,minLat,maxLng,maxLat".</param>
    /// <param name="filter">Optional attribute filter (SQL WHERE clause).</param>
    /// <param name="ct">Request cancellation token.</param>
    [HttpGet("parcels/spatial")]
    [ProducesResponseType(typeof(FeatureCollection), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> QueryParcelsSpatial(
        [FromQuery] string bbox,
        [FromQuery] string? filter,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(bbox))
            return BadRequest(new { error = "Bounding box (bbox) is required. Format: minLng,minLat,maxLng,maxLat" });

        var parts = bbox.Split(',');
        if (parts.Length != 4 ||
            !double.TryParse(parts[0], out var minLng) ||
            !double.TryParse(parts[1], out var minLat) ||
            !double.TryParse(parts[2], out var maxLng) ||
            !double.TryParse(parts[3], out var maxLat))
        {
            return BadRequest(new { error = "Invalid bbox format. Expected: minLng,minLat,maxLng,maxLat" });
        }

        _logger.LogInformation("Spatial parcel query: bbox=({MinLng},{MinLat},{MaxLng},{MaxLat}), filter={Filter}",
            minLng, minLat, maxLng, maxLat, filter);

        var bboxObj = new BoundingBox(minLng, minLat, maxLng, maxLat);
        var result = await _connector.QueryFeaturesAsync("Parcels", bboxObj, filter, ct);
        return Ok(result);
    }

    /// <summary>Get the boundary polygon for a specific parcel.</summary>
    /// <param name="id">Parcel ID.</param>
    /// <param name="ct">Request cancellation token.</param>
    [HttpGet("parcels/{id}/boundary")]
    [ProducesResponseType(typeof(Polygon), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetParcelBoundary(
        string id,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(id))
            return BadRequest(new { error = "Parcel ID is required." });

        _logger.LogInformation("Parcel boundary request: {ParcelId}", id);

        var boundary = await _connector.GetParcelBoundaryAsync(id, ct);
        if (boundary is null)
            return NotFound(new { error = $"No boundary found for parcel {id}" });

        return Ok(boundary);
    }

    /// <summary>List available GIS layers from the configured service.</summary>
    [HttpGet("layers")]
    [ProducesResponseType(typeof(LayerListResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListLayers(CancellationToken ct)
    {
        _logger.LogDebug("Listing available GIS layers");

        var dynamicLayers = await _connector.ListLayersAsync(ct);

        // Merge with static catalog
        var catalogLayers = ArcGisServiceCatalog.AllLayers.Keys.ToList();
        var allLayers = catalogLayers
            .Union(dynamicLayers, StringComparer.OrdinalIgnoreCase)
            .OrderBy(l => l)
            .ToList();

        return Ok(new LayerListResponse(allLayers, allLayers.Count));
    }

    /// <summary>Find parcels and features near a geographic point.</summary>
    /// <param name="lat">Latitude of the center point.</param>
    /// <param name="lng">Longitude of the center point.</param>
    /// <param name="radius">Search radius in miles (default 1).</param>
    /// <param name="ct">Request cancellation token.</param>
    [HttpGet("proximity")]
    [ProducesResponseType(typeof(ProximityResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ProximitySearch(
        [FromQuery] double lat,
        [FromQuery] double lng,
        [FromQuery] double radius = 1.0,
        CancellationToken ct = default)
    {
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180)
            return BadRequest(new { error = "Invalid coordinates. Lat: -90 to 90, Lng: -180 to 180." });

        if (radius <= 0 || radius > 50)
            return BadRequest(new { error = "Radius must be between 0 and 50 miles." });

        _logger.LogInformation("Proximity search: ({Lat},{Lng}) radius={Radius}mi", lat, lng, radius);

        var center = new GeoPoint(lat, lng);

        var parcels = await _spatial.FindParcelsInRadiusAsync(center, radius, ct);

        var nearbyFeatures = await _enricher.EnrichWithProximityAsync(
            center,
            new[] { "Schools", "Parks", "Roads" },
            radius,
            ct);

        var floodZone = await _enricher.EnrichWithFloodZoneAsync(center, ct);

        return Ok(new ProximityResponse(
            Center: center,
            RadiusMiles: radius,
            ParcelIds: parcels,
            NearbyFeatures: nearbyFeatures,
            FloodZone: floodZone));
    }

    // ── Response DTOs ────────────────────────────────────────────────

    /// <summary>Response for the layers endpoint.</summary>
    public record LayerListResponse(IReadOnlyList<string> Layers, int Count);

    /// <summary>Response for the proximity search endpoint.</summary>
    public record ProximityResponse(
        GeoPoint Center,
        double RadiusMiles,
        IReadOnlyList<string> ParcelIds,
        IReadOnlyList<NearbyFeature> NearbyFeatures,
        FloodZoneInfo FloodZone);
}

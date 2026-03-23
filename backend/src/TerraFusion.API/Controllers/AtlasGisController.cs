// TFT-034: Atlas GIS Controller — geocoding, spatial queries, shapefile upload
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraFusion.Core.GIS;
using TerraFusion.Core.GIS.Connectors;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Extended Atlas GIS endpoints for spatial queries, layer feature
/// retrieval, and shapefile/GeoJSON/KML upload. Complements
/// <see cref="GisController"/> with additional spatial query patterns.
/// </summary>
[ApiController]
[Route("api/atlas/gis")]
[Authorize]
public class AtlasGisController : ControllerBase
{
    private readonly IGisConnector _connector;
    private readonly IGeospatialEnricher _enricher;
    private readonly IGisParseService _parser;
    private readonly IGisSyncService _sync;
    private readonly IGisDataService _gisData;
    private readonly ILogger<AtlasGisController> _logger;

    public AtlasGisController(
        IGisConnector connector,
        IGeospatialEnricher enricher,
        IGisParseService parser,
        IGisSyncService sync,
        IGisDataService gisData,
        ILogger<AtlasGisController> logger)
    {
        _connector = connector;
        _enricher = enricher;
        _parser = parser;
        _sync = sync;
        _gisData = gisData;
        _logger = logger;
    }

    /// <summary>Geocode an address via the Atlas GIS pipeline.</summary>
    /// <param name="address">Street address to geocode.</param>
    [HttpGet("geocode")]
    [ProducesResponseType(typeof(GeocodeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Geocode(
        [FromQuery] string address,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(address))
            return BadRequest(new { error = "Address query parameter is required." });

        _logger.LogInformation("Atlas geocode: {Address}", address);

        try
        {
            var result = await _enricher.EnrichWithGeocodeAsync(address, ct);
            return Ok(new GeocodeResponse(
                result.Latitude,
                result.Longitude,
                result.Confidence,
                result.MatchedAddress,
                result.GeocodeSource));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Execute a spatial query against the configured GIS service.
    /// </summary>
    /// <param name="layer">Layer name to query (default "Parcels").</param>
    /// <param name="bbox">Bounding box as "minLng,minLat,maxLng,maxLat".</param>
    /// <param name="filter">Optional attribute filter.</param>
    /// <param name="limit">Maximum features to return (default 500).</param>
    [HttpGet("spatial-query")]
    [ProducesResponseType(typeof(SpatialQueryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SpatialQuery(
        [FromQuery] string? layer,
        [FromQuery] string bbox,
        [FromQuery] string? filter,
        [FromQuery] int limit = 500,
        CancellationToken ct = default)
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

        var layerName = string.IsNullOrWhiteSpace(layer) ? "Parcels" : layer;
        _logger.LogInformation("Atlas spatial query: layer={Layer}, bbox=({MinLng},{MinLat},{MaxLng},{MaxLat})",
            layerName, minLng, minLat, maxLng, maxLat);

        var bboxObj = new BoundingBox(minLng, minLat, maxLng, maxLat);
        var result = await _connector.QueryFeaturesAsync(layerName, bboxObj, filter, ct);

        // Apply client-side limit
        var limited = result.Features.Count > limit
            ? new FeatureCollection(result.Features.Take(limit).ToList(), result.TotalCount)
            : result;

        return Ok(new SpatialQueryResponse(
            layerName,
            limited.Features,
            limited.Features.Count,
            result.TotalCount,
            result.TotalCount > limit));
    }

    /// <summary>Query features from a specific named layer.</summary>
    /// <param name="layerName">Layer name (e.g., Parcels, Zoning, FloodZones).</param>
    /// <param name="bbox">Optional bounding box filter.</param>
    /// <param name="filter">Optional attribute filter.</param>
    [HttpGet("layers/{layerName}/features")]
    [ProducesResponseType(typeof(FeatureCollection), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetLayerFeatures(
        string layerName,
        [FromQuery] string? bbox,
        [FromQuery] string? filter,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(layerName))
            return BadRequest(new { error = "Layer name is required." });

        _logger.LogInformation("Layer feature query: {Layer}", layerName);

        BoundingBox bboxObj;
        if (!string.IsNullOrWhiteSpace(bbox))
        {
            var parts = bbox.Split(',');
            if (parts.Length == 4 &&
                double.TryParse(parts[0], out var minLng) &&
                double.TryParse(parts[1], out var minLat) &&
                double.TryParse(parts[2], out var maxLng) &&
                double.TryParse(parts[3], out var maxLat))
            {
                bboxObj = new BoundingBox(minLng, minLat, maxLng, maxLat);
            }
            else
            {
                return BadRequest(new { error = "Invalid bbox format." });
            }
        }
        else
        {
            // Default to Benton County approximate extent
            bboxObj = new BoundingBox(-119.90, 45.90, -119.00, 46.60);
        }

        try
        {
            var result = await _connector.QueryFeaturesAsync(layerName, bboxObj, filter, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to query layer {Layer}", layerName);
            return NotFound(new { error = $"Layer '{layerName}' not found or query failed." });
        }
    }

    /// <summary>
    /// Upload a spatial data file (Shapefile ZIP, GeoJSON, or KML/KMZ)
    /// and parse it into features. Optionally imports the polygons into
    /// the local geometry store.
    /// </summary>
    /// <param name="file">Spatial data file.</param>
    /// <param name="import">If true, import parsed polygons into the store (default false).</param>
    [HttpPost("upload-shapefile")]
    [ProducesResponseType(typeof(UploadResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [RequestSizeLimit(100_000_000)] // 100 MB
    public async Task<IActionResult> UploadShapefile(
        IFormFile file,
        [FromQuery] bool import = false,
        CancellationToken ct = default)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "A spatial data file is required." });

        _logger.LogInformation("Shapefile upload: {FileName}, {Size} bytes, import={Import}",
            file.FileName, file.Length, import);

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        await using var stream = file.OpenReadStream();

        FeatureCollection features;
        try
        {
            features = extension switch
            {
                ".zip" or ".shp" => await _parser.ParseShapefileAsync(stream, ct),
                ".json" or ".geojson" => await _parser.ParseGeoJsonAsync(stream, ct),
                ".kml" or ".kmz" => await _parser.ParseKmlAsync(stream, ct),
                _ => throw new InvalidOperationException(
                    $"Unsupported file type: {extension}. Supported: .zip, .geojson, .json, .kml, .kmz")
            };
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }

        ImportResult? importResult = null;
        if (import && features.Features.Count > 0)
        {
            importResult = await _sync.ImportPolygonsAsync(features, ct);
        }

        var boundaries = _parser.ExtractBoundaries(features, Path.GetFileNameWithoutExtension(file.FileName));

        return Ok(new UploadResponse(
            FileName: file.FileName,
            FileSize: file.Length,
            FeatureCount: features.Features.Count,
            BoundaryCount: boundaries.Boundaries.Count,
            GeometryTypes: features.Features
                .Select(f => f.GeometryType)
                .Distinct()
                .ToList(),
            ImportResult: importResult));
    }

    // ── PACS-Sourced Parcel Data ─────────────────────────────────────

    /// <summary>
    /// Return a parcel boundary approximation from PACS situs + land_detail data.
    /// Includes centroid, lot dimensions, and area.
    /// </summary>
    /// <param name="parcelId">GeoId or SimpleGeoId of the parcel.</param>
    [HttpGet("parcels/{parcelId}/boundary")]
    [ProducesResponseType(typeof(ParcelBoundaryResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetParcelBoundary(string parcelId, CancellationToken ct)
    {
        _logger.LogInformation("Atlas parcel boundary: {ParcelId}", parcelId);
        var result = await _gisData.GetParcelBoundaryAsync(parcelId, ct);

        if (result.Source == "fallback" && result.Centroid is null)
            return NotFound(new { error = $"Parcel '{parcelId}' not found in PACS mirror." });

        return Ok(result);
    }

    /// <summary>
    /// Return GIS layer data (zoning, flood zone, tax area, land classification)
    /// for a parcel from PACS tables.
    /// </summary>
    /// <param name="parcelId">GeoId or SimpleGeoId of the parcel.</param>
    [HttpGet("parcels/{parcelId}/layers")]
    [ProducesResponseType(typeof(ParcelLayersResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetParcelLayers(string parcelId, CancellationToken ct)
    {
        _logger.LogInformation("Atlas parcel layers: {ParcelId}", parcelId);
        var result = await _gisData.GetParcelLayersAsync(parcelId, ct);
        return Ok(result);
    }

    // ── Response DTOs ────────────────────────────────────────────────

    /// <summary>Geocode response.</summary>
    public record GeocodeResponse(
        double Latitude,
        double Longitude,
        double Confidence,
        string MatchedAddress,
        string Source);

    /// <summary>Spatial query response with pagination info.</summary>
    public record SpatialQueryResponse(
        string Layer,
        IReadOnlyList<GisFeature> Features,
        int ReturnedCount,
        int TotalCount,
        bool Truncated);

    /// <summary>Upload/parse response.</summary>
    public record UploadResponse(
        string FileName,
        long FileSize,
        int FeatureCount,
        int BoundaryCount,
        IReadOnlyList<string> GeometryTypes,
        ImportResult? ImportResult);
}

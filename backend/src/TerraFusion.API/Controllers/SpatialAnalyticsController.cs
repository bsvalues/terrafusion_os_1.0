// TFT-032: Spatial Analytics Controller — autocorrelation, filtering, hotspots
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraFusion.AI.Spatial;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Spatial analytics endpoints: autocorrelation (Moran's I, Getis-Ord),
/// spatial filtering, feature extraction, and hotspot detection.
/// Atlas answers "where are the clusters?" — not "what are they worth?"
/// </summary>
[ApiController]
[Route("api/spatial-analytics")]
[Authorize]
public class SpatialAnalyticsController : ControllerBase
{
    private readonly ISpatialAutocorrelation _autocorrelation;
    private readonly ISpatialFilter _filter;
    private readonly ISpatialFeatureEngineering _features;
    private readonly ILogger<SpatialAnalyticsController> _logger;

    public SpatialAnalyticsController(
        ISpatialAutocorrelation autocorrelation,
        ISpatialFilter filter,
        ISpatialFeatureEngineering features,
        ILogger<SpatialAnalyticsController> logger)
    {
        _autocorrelation = autocorrelation;
        _filter = filter;
        _features = features;
        _logger = logger;
    }

    /// <summary>
    /// Compute spatial autocorrelation (Moran's I and/or Getis-Ord G*)
    /// for a set of spatial observations.
    /// </summary>
    [HttpPost("autocorrelation")]
    [ProducesResponseType(typeof(AutocorrelationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult ComputeAutocorrelation([FromBody] AutocorrelationRequest request)
    {
        if (request?.Locations is null || request.Values is null)
            return BadRequest(new { error = "Locations and values are required." });

        if (request.Locations.Count != request.Values.Length)
            return BadRequest(new { error = "Locations count must match values count." });

        if (request.Locations.Count < 3)
            return BadRequest(new { error = "At least 3 observations are required." });

        _logger.LogInformation("Autocorrelation request: {N} observations, method={Method}",
            request.Locations.Count, request.WeightMethod);

        var spatialLocations = request.Locations
            .Select((loc, i) => new SpatialLocation(i, loc.Lat, loc.Lng))
            .ToList();

        var weights = _autocorrelation.BuildSpatialWeights(
            spatialLocations,
            Enum.TryParse<SpatialWeightMethod>(request.WeightMethod, true, out var method)
                ? method : SpatialWeightMethod.Distance,
            request.WeightParameter ?? 1.0);

        MoransIResult? moransI = null;
        IReadOnlyList<GetisOrdResult>? getisOrd = null;
        double? gearysC = null;

        if (request.ComputeMoransI ?? true)
            moransI = _autocorrelation.ComputeMoransI(request.Values, weights);

        if (request.ComputeGetisOrd ?? false)
            getisOrd = _autocorrelation.ComputeGetisOrdG(request.Values, weights);

        if (request.ComputeGearysC ?? false)
            gearysC = _autocorrelation.ComputeGearysC(request.Values, weights);

        return Ok(new AutocorrelationResponse(moransI, getisOrd, gearysC));
    }

    /// <summary>
    /// Filter parcels using spatial criteria (bbox, polygon, radius, or neighborhood).
    /// </summary>
    [HttpPost("spatial-filter")]
    [ProducesResponseType(typeof(SpatialFilterResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult FilterParcels([FromBody] SpatialFilterRequest request)
    {
        if (request?.Parcels is null || request.Parcels.Count == 0)
            return BadRequest(new { error = "Parcels list is required." });

        _logger.LogInformation("Spatial filter: {Count} parcels, type={Type}",
            request.Parcels.Count, request.FilterType);

        var parcels = request.Parcels
            .Select(p => new SpatialParcel(p.ParcelId, p.Lat, p.Lng, p.NeighborhoodCode))
            .ToList();

        IReadOnlyList<SpatialParcel> result = request.FilterType?.ToLowerInvariant() switch
        {
            "bbox" when request.BBox is not null =>
                _filter.FilterByBoundingBox(parcels, new SpatialBBox(
                    request.BBox.MinLng, request.BBox.MinLat,
                    request.BBox.MaxLng, request.BBox.MaxLat)),

            "polygon" when request.Polygon is not null =>
                _filter.FilterByPolygon(parcels, new SpatialPolygon(
                    request.Polygon.Select(v => (v.Lat, v.Lng)).ToList())),

            "radius" when request.CenterLat.HasValue && request.CenterLng.HasValue && request.RadiusMiles.HasValue =>
                _filter.FilterByRadius(parcels,
                    request.CenterLat.Value, request.CenterLng.Value, request.RadiusMiles.Value),

            "neighborhood" when !string.IsNullOrWhiteSpace(request.NeighborhoodCode) =>
                _filter.FilterByNeighborhood(parcels, request.NeighborhoodCode),

            _ => BadRequestResult(out var errorResult) ? Array.Empty<SpatialParcel>() : result = Array.Empty<SpatialParcel>()
        };

        return Ok(new SpatialFilterResponse(
            result.Select(p => p.ParcelId).ToList(),
            result.Count,
            request.Parcels.Count));
    }

    /// <summary>Extract spatial features for a specific parcel.</summary>
    /// <param name="parcelId">Parcel ID to analyze.</param>
    [HttpGet("features/{parcelId}")]
    [ProducesResponseType(typeof(SpatialFeatureVector), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetSpatialFeatures(
        string parcelId,
        [FromQuery] double? lat,
        [FromQuery] double? lng,
        [FromQuery] double? areaAcres,
        [FromQuery] double? perimeterFeet,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(parcelId))
            return BadRequest(new { error = "Parcel ID is required." });

        if (!lat.HasValue || !lng.HasValue)
            return BadRequest(new { error = "Latitude and longitude are required (query params lat, lng)." });

        _logger.LogInformation("Feature extraction for parcel {ParcelId}", parcelId);

        var features = await _features.ExtractSpatialFeaturesAsync(
            parcelId, lat.Value, lng.Value,
            areaAcres ?? 0, perimeterFeet ?? 0, ct);

        return Ok(features);
    }

    /// <summary>Detect spatial hotspots for a specified variable across all parcels.</summary>
    /// <param name="variable">Variable name to analyze (e.g., "lot_size", "year_built").</param>
    [HttpGet("hotspots")]
    [ProducesResponseType(typeof(HotspotResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult DetectHotspots(
        [FromQuery] string variable,
        [FromQuery] int? topN)
    {
        if (string.IsNullOrWhiteSpace(variable))
            return BadRequest(new { error = "Variable name is required." });

        _logger.LogInformation("Hotspot detection for variable: {Variable}", variable);

        // In production, this would pull parcel data from the database,
        // extract the specified variable, and run Getis-Ord G*.
        // Returning the endpoint structure for now.
        return Ok(new HotspotResponse(
            Variable: variable,
            TotalAnalyzed: 0,
            Hotspots: Array.Empty<HotspotItem>(),
            Coldspots: Array.Empty<HotspotItem>(),
            Message: "Submit parcel data via POST /api/spatial-analytics/autocorrelation with computeGetisOrd=true"));
    }

    private static bool BadRequestResult(out IActionResult? result)
    {
        result = null;
        return false;
    }

    // ── Request/Response DTOs ────────────────────────────────────────

    /// <summary>Request for autocorrelation analysis.</summary>
    public record AutocorrelationRequest(
        IReadOnlyList<LocationDto> Locations,
        double[] Values,
        string? WeightMethod,
        double? WeightParameter,
        bool? ComputeMoransI,
        bool? ComputeGetisOrd,
        bool? ComputeGearysC);

    /// <summary>Location DTO for autocorrelation input.</summary>
    public record LocationDto(double Lat, double Lng);

    /// <summary>Response from autocorrelation analysis.</summary>
    public record AutocorrelationResponse(
        MoransIResult? MoransI,
        IReadOnlyList<GetisOrdResult>? GetisOrd,
        double? GearysC);

    /// <summary>Request for spatial filtering.</summary>
    public record SpatialFilterRequest(
        IReadOnlyList<ParcelDto> Parcels,
        string? FilterType,
        BBoxDto? BBox,
        IReadOnlyList<LocationDto>? Polygon,
        double? CenterLat,
        double? CenterLng,
        double? RadiusMiles,
        string? NeighborhoodCode);

    /// <summary>Parcel DTO for spatial filtering input.</summary>
    public record ParcelDto(string ParcelId, double Lat, double Lng, string? NeighborhoodCode = null);

    /// <summary>Bounding box DTO.</summary>
    public record BBoxDto(double MinLng, double MinLat, double MaxLng, double MaxLat);

    /// <summary>Response from spatial filtering.</summary>
    public record SpatialFilterResponse(
        IReadOnlyList<string> ParcelIds,
        int MatchCount,
        int TotalInput);

    /// <summary>Response from hotspot detection.</summary>
    public record HotspotResponse(
        string Variable,
        int TotalAnalyzed,
        IReadOnlyList<HotspotItem> Hotspots,
        IReadOnlyList<HotspotItem> Coldspots,
        string? Message = null);

    /// <summary>A single hotspot/coldspot result.</summary>
    public record HotspotItem(
        string ParcelId,
        double Lat,
        double Lng,
        double ZScore,
        double PValue,
        string Classification);
}

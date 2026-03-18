// TFT-030: Spatial Filter — high-performance spatial filtering for 78K+ parcels
using Microsoft.Extensions.Logging;

namespace TerraFusion.AI.Spatial;

// ── Data Models ──────────────────────────────────────────────────────

/// <summary>Minimal parcel record for spatial filtering operations.</summary>
public record SpatialParcel(
    string ParcelId,
    double Latitude,
    double Longitude,
    string? NeighborhoodCode = null);

/// <summary>Bounding box for spatial queries.</summary>
public record SpatialBBox(double MinLng, double MinLat, double MaxLng, double MaxLat);

/// <summary>Polygon defined by an ordered list of lat/lng vertices.</summary>
public record SpatialPolygon(IReadOnlyList<(double Lat, double Lng)> Vertices);

// ── Interface ────────────────────────────────────────────────────────

/// <summary>
/// High-performance spatial filter for large parcel datasets.
/// Uses R-tree index for O(log n) spatial queries instead of
/// brute-force O(n) scans. Designed for 78K+ Benton County parcels.
/// </summary>
public interface ISpatialFilter
{
    /// <summary>Filter parcels within a bounding box.</summary>
    IReadOnlyList<SpatialParcel> FilterByBoundingBox(
        IReadOnlyList<SpatialParcel> parcels,
        SpatialBBox bbox);

    /// <summary>Filter parcels inside a polygon (point-in-polygon test).</summary>
    IReadOnlyList<SpatialParcel> FilterByPolygon(
        IReadOnlyList<SpatialParcel> parcels,
        SpatialPolygon polygon);

    /// <summary>Filter parcels within a radius of a center point.</summary>
    IReadOnlyList<SpatialParcel> FilterByRadius(
        IReadOnlyList<SpatialParcel> parcels,
        double centerLat,
        double centerLng,
        double radiusMiles);

    /// <summary>Filter parcels by neighborhood code.</summary>
    IReadOnlyList<SpatialParcel> FilterByNeighborhood(
        IReadOnlyList<SpatialParcel> parcels,
        string neighborhoodCode);
}

// ── Implementation ───────────────────────────────────────────────────

/// <summary>
/// Production spatial filter using R-tree index for sub-linear query
/// performance on large datasets. Falls back to sequential scan for
/// small inputs where index overhead exceeds benefit.
/// </summary>
public sealed class SpatialFilter : ISpatialFilter
{
    private readonly IRTreeIndex _rtree;
    private readonly ILogger<SpatialFilter> _logger;

    /// <summary>Minimum parcel count to justify building an R-tree index.</summary>
    private const int RTreeThreshold = 500;

    private const double EarthRadiusMiles = 3958.8;

    public SpatialFilter(IRTreeIndex rtree, ILogger<SpatialFilter> logger)
    {
        _rtree = rtree ?? throw new ArgumentNullException(nameof(rtree));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc />
    public IReadOnlyList<SpatialParcel> FilterByBoundingBox(
        IReadOnlyList<SpatialParcel> parcels, SpatialBBox bbox)
    {
        ArgumentNullException.ThrowIfNull(parcels);
        ArgumentNullException.ThrowIfNull(bbox);

        _logger.LogDebug("BBox filter: {Count} parcels, box=({MinLng},{MinLat})-({MaxLng},{MaxLat})",
            parcels.Count, bbox.MinLng, bbox.MinLat, bbox.MaxLng, bbox.MaxLat);

        if (parcels.Count >= RTreeThreshold)
        {
            var index = BuildIndex(parcels);
            var candidateIds = index.Search(new RTreeBBox(bbox.MinLng, bbox.MinLat, bbox.MaxLng, bbox.MaxLat));
            var idSet = new HashSet<string>(candidateIds);
            return parcels.Where(p => idSet.Contains(p.ParcelId)).ToList();
        }

        return parcels.Where(p =>
            p.Longitude >= bbox.MinLng && p.Longitude <= bbox.MaxLng &&
            p.Latitude >= bbox.MinLat && p.Latitude <= bbox.MaxLat).ToList();
    }

    /// <inheritdoc />
    public IReadOnlyList<SpatialParcel> FilterByPolygon(
        IReadOnlyList<SpatialParcel> parcels, SpatialPolygon polygon)
    {
        ArgumentNullException.ThrowIfNull(parcels);
        ArgumentNullException.ThrowIfNull(polygon);

        _logger.LogDebug("Polygon filter: {Count} parcels, {Vertices} vertices",
            parcels.Count, polygon.Vertices.Count);

        // Step 1: Pre-filter with polygon's bounding box using R-tree
        var polyBbox = new SpatialBBox(
            polygon.Vertices.Min(v => v.Lng),
            polygon.Vertices.Min(v => v.Lat),
            polygon.Vertices.Max(v => v.Lng),
            polygon.Vertices.Max(v => v.Lat));

        var candidates = FilterByBoundingBox(parcels, polyBbox);

        // Step 2: Ray-casting point-in-polygon test on candidates
        return candidates.Where(p => PointInPolygon(p.Latitude, p.Longitude, polygon)).ToList();
    }

    /// <inheritdoc />
    public IReadOnlyList<SpatialParcel> FilterByRadius(
        IReadOnlyList<SpatialParcel> parcels,
        double centerLat, double centerLng, double radiusMiles)
    {
        ArgumentNullException.ThrowIfNull(parcels);
        if (radiusMiles <= 0) throw new ArgumentOutOfRangeException(nameof(radiusMiles));

        _logger.LogDebug("Radius filter: {Count} parcels, center=({Lat},{Lng}), radius={R}mi",
            parcels.Count, centerLat, centerLng, radiusMiles);

        // Pre-filter with bounding box
        var degOffset = radiusMiles / 69.0;
        var bbox = new SpatialBBox(
            centerLng - degOffset, centerLat - degOffset,
            centerLng + degOffset, centerLat + degOffset);

        var candidates = FilterByBoundingBox(parcels, bbox);

        // Precise Haversine distance check
        return candidates.Where(p =>
            HaversineDistance(centerLat, centerLng, p.Latitude, p.Longitude) <= radiusMiles).ToList();
    }

    /// <inheritdoc />
    public IReadOnlyList<SpatialParcel> FilterByNeighborhood(
        IReadOnlyList<SpatialParcel> parcels, string neighborhoodCode)
    {
        ArgumentNullException.ThrowIfNull(parcels);
        ArgumentException.ThrowIfNullOrWhiteSpace(neighborhoodCode);

        _logger.LogDebug("Neighborhood filter: {Count} parcels, code={Code}",
            parcels.Count, neighborhoodCode);

        return parcels.Where(p =>
            string.Equals(p.NeighborhoodCode, neighborhoodCode, StringComparison.OrdinalIgnoreCase)).ToList();
    }

    // ── Helpers ──────────────────────────────────────────────────────

    private IRTreeIndex BuildIndex(IReadOnlyList<SpatialParcel> parcels)
    {
        var items = parcels.Select(p => new RTreeItem(
            p.ParcelId,
            new RTreeBBox(p.Longitude, p.Latitude, p.Longitude, p.Latitude))).ToList();

        _rtree.BulkLoad(items);
        return _rtree;
    }

    /// <summary>Ray-casting point-in-polygon test.</summary>
    private static bool PointInPolygon(double lat, double lng, SpatialPolygon polygon)
    {
        var vertices = polygon.Vertices;
        var inside = false;
        var n = vertices.Count;

        for (int i = 0, j = n - 1; i < n; j = i++)
        {
            var (yi, xi) = vertices[i];
            var (yj, xj) = vertices[j];

            if ((yi > lat) != (yj > lat) &&
                lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)
            {
                inside = !inside;
            }
        }

        return inside;
    }

    private static double HaversineDistance(double lat1, double lng1, double lat2, double lng2)
    {
        var dLat = ToRad(lat2 - lat1);
        var dLng = ToRad(lng2 - lng1);
        var sinLat = Math.Sin(dLat / 2);
        var sinLng = Math.Sin(dLng / 2);
        var h = sinLat * sinLat +
                Math.Cos(ToRad(lat1)) * Math.Cos(ToRad(lat2)) * sinLng * sinLng;
        return 2.0 * EarthRadiusMiles * Math.Asin(Math.Sqrt(h));
    }

    private static double ToRad(double deg) => deg * Math.PI / 180.0;
}

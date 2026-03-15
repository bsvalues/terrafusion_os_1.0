// BIV-071: Spatial Analysis Service — geometry operations and distance calculations
using Microsoft.Extensions.Logging;
using TerraFusion.Core.GIS.Connectors;

namespace TerraFusion.Core.GIS;

// ── Data Models ──────────────────────────────────────────────────────

/// <summary>Distance from a reference point to a target.</summary>
public record DistanceResult(string TargetId, double DistanceMiles, GeoPoint TargetLocation);

/// <summary>Geometry representation for buffer and hull operations.</summary>
public record Geometry(string Type, IReadOnlyList<GeoPoint> Coordinates);

// ── Interface ────────────────────────────────────────────────────────

/// <summary>
/// Pure spatial analysis: distances, radius searches, convex hull,
/// area calculations, and geometry buffering. No valuation math.
/// </summary>
public interface ISpatialAnalysisService
{
    /// <summary>Calculate distances from a point to a set of targets.</summary>
    /// <param name="origin">Reference point.</param>
    /// <param name="targets">Target points keyed by identifier.</param>
    Task<IReadOnlyList<DistanceResult>> CalculateDistancesAsync(
        GeoPoint origin,
        IReadOnlyDictionary<string, GeoPoint> targets,
        CancellationToken ct = default);

    /// <summary>Find all parcel IDs within a radius of a center point.</summary>
    /// <param name="center">Center of search circle.</param>
    /// <param name="radiusMiles">Search radius in miles.</param>
    Task<IReadOnlyList<string>> FindParcelsInRadiusAsync(
        GeoPoint center,
        double radiusMiles,
        CancellationToken ct = default);

    /// <summary>Compute the convex hull enclosing a set of points.</summary>
    /// <param name="points">Input points.</param>
    Polygon ComputeConvexHull(IReadOnlyList<GeoPoint> points);

    /// <summary>Calculate the area of a polygon in acres.</summary>
    /// <param name="polygon">Polygon to measure.</param>
    double CalculateAreaAcres(Polygon polygon);

    /// <summary>Create a buffer polygon around a geometry at a given distance.</summary>
    /// <param name="geometry">Source geometry.</param>
    /// <param name="distanceMiles">Buffer distance in miles.</param>
    /// <param name="segments">Number of segments for circular approximation (default 36).</param>
    Geometry BufferGeometry(Geometry geometry, double distanceMiles, int segments = 36);
}

// ── Implementation ───────────────────────────────────────────────────

/// <summary>
/// Production spatial analysis service. All distance calculations use
/// Haversine on WGS84 coordinates. Area uses the Shoelace formula with
/// degree-to-meter conversion at the polygon's centroid latitude.
/// </summary>
public sealed class SpatialAnalysisService : ISpatialAnalysisService
{
    private readonly IGisConnector _connector;
    private readonly ILogger<SpatialAnalysisService> _logger;

    private const double EarthRadiusMiles = 3958.8;
    private const double SqMetersPerAcre = 4046.8564224;

    public SpatialAnalysisService(IGisConnector connector, ILogger<SpatialAnalysisService> logger)
    {
        _connector = connector ?? throw new ArgumentNullException(nameof(connector));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<DistanceResult>> CalculateDistancesAsync(
        GeoPoint origin,
        IReadOnlyDictionary<string, GeoPoint> targets,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(origin);
        ArgumentNullException.ThrowIfNull(targets);

        var results = targets
            .Select(kvp => new DistanceResult(
                kvp.Key,
                GeospatialEnricher.HaversineDistance(origin, kvp.Value),
                kvp.Value))
            .OrderBy(d => d.DistanceMiles)
            .ToList();

        _logger.LogDebug("Calculated distances from origin to {Count} targets", targets.Count);
        return Task.FromResult<IReadOnlyList<DistanceResult>>(results);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<string>> FindParcelsInRadiusAsync(
        GeoPoint center, double radiusMiles, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(center);
        if (radiusMiles <= 0) throw new ArgumentOutOfRangeException(nameof(radiusMiles));

        _logger.LogInformation("Finding parcels within {Radius}mi of ({Lat}, {Lng})",
            radiusMiles, center.Latitude, center.Longitude);

        var degreeOffset = radiusMiles / 69.0;
        var bbox = new BoundingBox(
            center.Longitude - degreeOffset,
            center.Latitude - degreeOffset,
            center.Longitude + degreeOffset,
            center.Latitude + degreeOffset);

        var features = await _connector.QueryFeaturesAsync("Parcels", bbox, null, ct);

        // Filter to actual radius (bbox is an approximation)
        var parcelIds = new List<string>();
        foreach (var feature in features.Features)
        {
            if (feature.Coordinates.Count == 0) continue;

            // Use centroid of polygon or first point
            var centroid = ComputeCentroid(feature.Coordinates);
            var dist = GeospatialEnricher.HaversineDistance(center, centroid);

            if (dist <= radiusMiles)
            {
                var pid = feature.Attributes.TryGetValue("PARCEL_ID", out var id)
                    ? id?.ToString()
                    : feature.Id;
                if (!string.IsNullOrEmpty(pid))
                    parcelIds.Add(pid);
            }
        }

        _logger.LogInformation("Found {Count} parcels within {Radius}mi radius", parcelIds.Count, radiusMiles);
        return parcelIds;
    }

    /// <inheritdoc />
    public Polygon ComputeConvexHull(IReadOnlyList<GeoPoint> points)
    {
        ArgumentNullException.ThrowIfNull(points);
        if (points.Count < 3)
            throw new ArgumentException("Convex hull requires at least 3 points.", nameof(points));

        // Andrew's monotone chain algorithm
        var sorted = points.OrderBy(p => p.Longitude).ThenBy(p => p.Latitude).ToList();
        var n = sorted.Count;
        var hull = new GeoPoint[2 * n];
        var k = 0;

        // Lower hull
        for (var i = 0; i < n; i++)
        {
            while (k >= 2 && Cross(hull[k - 2], hull[k - 1], sorted[i]) <= 0) k--;
            hull[k++] = sorted[i];
        }

        // Upper hull
        var lower = k + 1;
        for (var i = n - 2; i >= 0; i--)
        {
            while (k >= lower && Cross(hull[k - 2], hull[k - 1], sorted[i]) <= 0) k--;
            hull[k++] = sorted[i];
        }

        var result = hull.Take(k - 1).ToList(); // exclude last (duplicate of first)
        result.Add(result[0]); // close the ring
        return new Polygon(result);
    }

    /// <inheritdoc />
    public double CalculateAreaAcres(Polygon polygon)
    {
        ArgumentNullException.ThrowIfNull(polygon);
        if (polygon.ExteriorRing.Count < 4)
            throw new ArgumentException("Polygon must have at least 3 vertices plus closing point.");

        var ring = polygon.ExteriorRing;
        var centroidLat = ring.Average(p => p.Latitude);

        // Meters per degree at the centroid latitude
        var metersPerDegreeLat = 111_132.92;
        var metersPerDegreeLng = 111_132.92 * Math.Cos(centroidLat * Math.PI / 180.0);

        // Shoelace formula in projected meters
        double areaSqMeters = 0;
        for (var i = 0; i < ring.Count - 1; i++)
        {
            var x1 = ring[i].Longitude * metersPerDegreeLng;
            var y1 = ring[i].Latitude * metersPerDegreeLat;
            var x2 = ring[i + 1].Longitude * metersPerDegreeLng;
            var y2 = ring[i + 1].Latitude * metersPerDegreeLat;
            areaSqMeters += (x1 * y2) - (x2 * y1);
        }

        areaSqMeters = Math.Abs(areaSqMeters) / 2.0;
        return areaSqMeters / SqMetersPerAcre;
    }

    /// <inheritdoc />
    public Geometry BufferGeometry(Geometry geometry, double distanceMiles, int segments = 36)
    {
        ArgumentNullException.ThrowIfNull(geometry);
        if (distanceMiles <= 0) throw new ArgumentOutOfRangeException(nameof(distanceMiles));

        if (geometry.Type == "Point" && geometry.Coordinates.Count == 1)
        {
            // Circle buffer around a point
            var center = geometry.Coordinates[0];
            var points = new List<GeoPoint>();
            var degreeOffset = distanceMiles / 69.0;

            for (var i = 0; i <= segments; i++)
            {
                var angle = 2.0 * Math.PI * i / segments;
                var lat = center.Latitude + degreeOffset * Math.Sin(angle);
                var lngOffset = degreeOffset / Math.Cos(center.Latitude * Math.PI / 180.0);
                var lng = center.Longitude + lngOffset * Math.Cos(angle);
                points.Add(new GeoPoint(lat, lng));
            }

            return new Geometry("Polygon", points);
        }

        // For polygons: offset each edge outward by the buffer distance
        // Simplified: expand bbox-style by shifting each point outward from centroid
        var centroid = ComputeCentroid(geometry.Coordinates);
        var buffered = new List<GeoPoint>();

        foreach (var pt in geometry.Coordinates)
        {
            var bearing = Math.Atan2(
                pt.Longitude - centroid.Longitude,
                pt.Latitude - centroid.Latitude);

            var offsetLat = (distanceMiles / 69.0) * Math.Cos(bearing);
            var offsetLng = (distanceMiles / (69.0 * Math.Cos(pt.Latitude * Math.PI / 180.0))) * Math.Sin(bearing);

            buffered.Add(new GeoPoint(pt.Latitude + offsetLat, pt.Longitude + offsetLng));
        }

        return new Geometry("Polygon", buffered);
    }

    // ── Helpers ──────────────────────────────────────────────────────

    /// <summary>Cross product for convex hull orientation test.</summary>
    private static double Cross(GeoPoint o, GeoPoint a, GeoPoint b) =>
        (a.Longitude - o.Longitude) * (b.Latitude - o.Latitude) -
        (a.Latitude - o.Latitude) * (b.Longitude - o.Longitude);

    /// <summary>Compute the centroid of a set of points.</summary>
    internal static GeoPoint ComputeCentroid(IReadOnlyList<GeoPoint> points)
    {
        var lat = points.Average(p => p.Latitude);
        var lng = points.Average(p => p.Longitude);
        return new GeoPoint(lat, lng);
    }
}

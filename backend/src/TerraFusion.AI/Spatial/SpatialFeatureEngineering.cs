// TFT-036: Spatial Feature Engineering — geometry-derived spatial features
// Atlas computes geometry; Forge consumes the features for valuation.
using Microsoft.Extensions.Logging;

namespace TerraFusion.AI.Spatial;

// ── Data Models ──────────────────────────────────────────────────────

/// <summary>Network centrality score for a parcel's position in the road/parcel graph.</summary>
public record CentralityScore(
    /// <summary>Betweenness centrality (0-1 scale).</summary>
    double Betweenness,
    /// <summary>Closeness centrality (0-1 scale).</summary>
    double Closeness,
    /// <summary>Degree centrality (number of connections / max possible).</summary>
    double Degree);

/// <summary>Elevation grid for viewshed and slope analysis.</summary>
public record ElevationGrid(
    /// <summary>Elevation values in meters, row-major [row][col].</summary>
    double[][] Values,
    /// <summary>Grid origin latitude (top-left).</summary>
    double OriginLat,
    /// <summary>Grid origin longitude (top-left).</summary>
    double OriginLng,
    /// <summary>Cell size in degrees.</summary>
    double CellSize);

/// <summary>Viewshed analysis result.</summary>
public record VisibleArea(
    /// <summary>Number of visible cells.</summary>
    int VisibleCells,
    /// <summary>Total cells analyzed.</summary>
    int TotalCells,
    /// <summary>Visibility ratio (0-1).</summary>
    double VisibilityRatio,
    /// <summary>Maximum visible distance in miles.</summary>
    double MaxVisibleDistanceMiles);

/// <summary>Terrain slope and aspect at a point.</summary>
public record SlopeAspectResult(
    /// <summary>Slope in degrees (0=flat, 90=vertical).</summary>
    double SlopeDegrees,
    /// <summary>Slope as percentage (rise/run * 100).</summary>
    double SlopePercent,
    /// <summary>Aspect in degrees (0=N, 90=E, 180=S, 270=W).</summary>
    double AspectDegrees,
    /// <summary>Cardinal direction.</summary>
    string AspectDirection);

/// <summary>Simple graph for network analysis.</summary>
public record SpatialGraph(
    /// <summary>Node IDs.</summary>
    IReadOnlyList<string> Nodes,
    /// <summary>Edges as (from, to, weight) tuples.</summary>
    IReadOnlyList<(string From, string To, double Weight)> Edges);

/// <summary>
/// Vector of spatial features computed for a parcel. These are SPATIAL
/// features — distances, geometry metrics, accessibility. Atlas computes
/// them; Forge may consume them for valuation models.
/// </summary>
public record SpatialFeatureVector(
    string ParcelId,
    /// <summary>Distance to central business district in miles.</summary>
    double DistanceToCbdMiles,
    /// <summary>Distance to nearest arterial road in miles.</summary>
    double DistanceToArterialMiles,
    /// <summary>Road frontage in feet (0 if not computed).</summary>
    double RoadFrontageFeet,
    /// <summary>Distance to nearest lake/river in miles.</summary>
    double DistanceToWaterMiles,
    /// <summary>Distance to nearest park in miles.</summary>
    double DistanceToParkMiles,
    /// <summary>Distance to nearest school in miles.</summary>
    double DistanceToSchoolMiles,
    /// <summary>Number of parcels within 0.25 mile radius.</summary>
    int NearbyParcelCount,
    /// <summary>Parcel area in acres.</summary>
    double AreaAcres,
    /// <summary>Perimeter in feet.</summary>
    double PerimeterFeet,
    /// <summary>Shape compactness ratio (4*pi*area / perimeter^2). Circle=1.</summary>
    double CompactnessRatio,
    /// <summary>Elevation in feet above sea level.</summary>
    double? ElevationFeet,
    /// <summary>Slope in degrees.</summary>
    double? SlopeDegrees,
    /// <summary>Aspect direction (N/S/E/W/NE/NW/SE/SW).</summary>
    string? AspectDirection);

// ── Interface ────────────────────────────────────────────────────────

/// <summary>
/// Spatial feature engineering: extracts geometry-derived features from
/// parcel locations. These are spatial/geometric properties, not value
/// estimates. Atlas answers "where is it and what's around it?" — Forge
/// decides what those spatial facts mean for value.
/// </summary>
public interface ISpatialFeatureEngineering
{
    /// <summary>Compute network centrality for a parcel in a spatial graph.</summary>
    /// <param name="parcelId">Target parcel.</param>
    /// <param name="graph">Spatial network graph (road/parcel adjacency).</param>
    CentralityScore ComputeNetworkCentrality(string parcelId, SpatialGraph graph);

    /// <summary>Compute viewshed from a point on an elevation grid.</summary>
    /// <param name="lat">Observer latitude.</param>
    /// <param name="lng">Observer longitude.</param>
    /// <param name="elevationGrid">DEM elevation data.</param>
    /// <param name="observerHeight">Observer height above ground in meters (default 1.8).</param>
    VisibleArea ComputeViewshed(double lat, double lng, ElevationGrid elevationGrid, double observerHeight = 1.8);

    /// <summary>Compute slope and aspect at a point from an elevation grid.</summary>
    SlopeAspectResult ComputeSlopeAspect(double lat, double lng, ElevationGrid elevationGrid);

    /// <summary>
    /// Extract the full spatial feature vector for a parcel.
    /// Combines distance calculations, shape metrics, and terrain analysis.
    /// </summary>
    /// <param name="parcelId">Parcel to analyze.</param>
    /// <param name="parcelLat">Parcel centroid latitude.</param>
    /// <param name="parcelLng">Parcel centroid longitude.</param>
    /// <param name="areaAcres">Parcel area in acres (pre-computed).</param>
    /// <param name="perimeterFeet">Parcel perimeter in feet (pre-computed).</param>
    Task<SpatialFeatureVector> ExtractSpatialFeaturesAsync(
        string parcelId,
        double parcelLat,
        double parcelLng,
        double areaAcres = 0,
        double perimeterFeet = 0,
        CancellationToken ct = default);
}

// ── Implementation ───────────────────────────────────────────────────

/// <summary>
/// Production spatial feature engineering. Computes purely geometric and
/// locational features. No valuation logic — that belongs in CostForge.
/// </summary>
public sealed class SpatialFeatureEngineering : ISpatialFeatureEngineering
{
    private readonly ILogger<SpatialFeatureEngineering> _logger;

    private const double EarthRadiusMiles = 3958.8;
    private const double FeetPerMile = 5280.0;

    // Benton County CBD approximate centroid (Kennewick downtown)
    private const double CbdLat = 46.2112;
    private const double CbdLng = -119.1372;

    public SpatialFeatureEngineering(ILogger<SpatialFeatureEngineering> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc />
    public CentralityScore ComputeNetworkCentrality(string parcelId, SpatialGraph graph)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(parcelId);
        ArgumentNullException.ThrowIfNull(graph);

        var nodeIndex = graph.Nodes.ToList().IndexOf(parcelId);
        if (nodeIndex < 0)
            return new CentralityScore(0, 0, 0);

        var n = graph.Nodes.Count;
        if (n <= 1) return new CentralityScore(0, 0, 0);

        // Build adjacency for BFS
        var adj = new Dictionary<string, List<(string To, double Weight)>>();
        foreach (var node in graph.Nodes)
            adj[node] = new List<(string, double)>();

        foreach (var (from, to, weight) in graph.Edges)
        {
            if (adj.ContainsKey(from)) adj[from].Add((to, weight));
            if (adj.ContainsKey(to)) adj[to].Add((from, weight));
        }

        // Degree centrality
        var degree = (double)adj[parcelId].Count / (n - 1);

        // Closeness centrality via BFS shortest paths
        var distances = BfsDistances(parcelId, adj);
        var totalDist = distances.Values.Where(d => d < double.MaxValue).Sum();
        var reachable = distances.Values.Count(d => d < double.MaxValue && d > 0);
        var closeness = reachable > 0 ? reachable / totalDist : 0;

        // Betweenness: simplified — fraction of shortest paths through this node
        var betweenness = ComputeBetweenness(parcelId, graph.Nodes, adj);

        _logger.LogDebug("Centrality for {Parcel}: degree={D:F3}, closeness={C:F3}, betweenness={B:F3}",
            parcelId, degree, closeness, betweenness);

        return new CentralityScore(betweenness, closeness, degree);
    }

    /// <inheritdoc />
    public VisibleArea ComputeViewshed(double lat, double lng, ElevationGrid grid, double observerHeight = 1.8)
    {
        ArgumentNullException.ThrowIfNull(grid);

        // Find observer cell
        var obsRow = (int)((grid.OriginLat - lat) / grid.CellSize);
        var obsCol = (int)((lng - grid.OriginLng) / grid.CellSize);
        var rows = grid.Values.Length;
        var cols = rows > 0 ? grid.Values[0].Length : 0;

        if (obsRow < 0 || obsRow >= rows || obsCol < 0 || obsCol >= cols)
            return new VisibleArea(0, rows * cols, 0, 0);

        var obsElev = grid.Values[obsRow][obsCol] + observerHeight;
        var visible = 0;
        var total = 0;
        var maxDist = 0.0;

        // Line-of-sight check to every cell
        for (var r = 0; r < rows; r++)
        {
            for (var c = 0; c < cols; c++)
            {
                if (r == obsRow && c == obsCol) continue;
                total++;

                if (IsVisible(obsRow, obsCol, obsElev, r, c, grid))
                {
                    visible++;
                    var cellLat = grid.OriginLat - r * grid.CellSize;
                    var cellLng = grid.OriginLng + c * grid.CellSize;
                    var dist = HaversineDistance(lat, lng, cellLat, cellLng);
                    maxDist = Math.Max(maxDist, dist);
                }
            }
        }

        return new VisibleArea(visible, total, total > 0 ? (double)visible / total : 0, maxDist);
    }

    /// <inheritdoc />
    public SlopeAspectResult ComputeSlopeAspect(double lat, double lng, ElevationGrid grid)
    {
        ArgumentNullException.ThrowIfNull(grid);

        var row = (int)((grid.OriginLat - lat) / grid.CellSize);
        var col = (int)((lng - grid.OriginLng) / grid.CellSize);
        var rows = grid.Values.Length;
        var cols = rows > 0 ? grid.Values[0].Length : 0;

        // Need 3x3 neighborhood
        if (row < 1 || row >= rows - 1 || col < 1 || col >= cols - 1)
            return new SlopeAspectResult(0, 0, 0, "Flat");

        // Cell size in meters (approximate)
        var cellMeters = grid.CellSize * 111_132.92;

        // Horn's method for slope and aspect
        var z = grid.Values;
        var dzdx = ((z[row - 1][col + 1] + 2 * z[row][col + 1] + z[row + 1][col + 1]) -
                    (z[row - 1][col - 1] + 2 * z[row][col - 1] + z[row + 1][col - 1])) / (8 * cellMeters);

        var dzdy = ((z[row + 1][col - 1] + 2 * z[row + 1][col] + z[row + 1][col + 1]) -
                    (z[row - 1][col - 1] + 2 * z[row - 1][col] + z[row - 1][col + 1])) / (8 * cellMeters);

        var slopeRad = Math.Atan(Math.Sqrt(dzdx * dzdx + dzdy * dzdy));
        var slopeDeg = slopeRad * 180.0 / Math.PI;
        var slopePct = Math.Tan(slopeRad) * 100.0;

        var aspectRad = Math.Atan2(-dzdy, dzdx);
        var aspectDeg = (aspectRad * 180.0 / Math.PI + 360) % 360;

        // Convert mathematical angle to compass bearing
        aspectDeg = (450 - aspectDeg) % 360;

        var direction = aspectDeg switch
        {
            >= 337.5 or < 22.5 => "N",
            >= 22.5 and < 67.5 => "NE",
            >= 67.5 and < 112.5 => "E",
            >= 112.5 and < 157.5 => "SE",
            >= 157.5 and < 202.5 => "S",
            >= 202.5 and < 247.5 => "SW",
            >= 247.5 and < 292.5 => "W",
            _ => "NW"
        };

        return new SlopeAspectResult(
            Math.Round(slopeDeg, 2),
            Math.Round(slopePct, 2),
            Math.Round(aspectDeg, 1),
            direction);
    }

    /// <inheritdoc />
    public Task<SpatialFeatureVector> ExtractSpatialFeaturesAsync(
        string parcelId,
        double parcelLat,
        double parcelLng,
        double areaAcres = 0,
        double perimeterFeet = 0,
        CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(parcelId);

        _logger.LogDebug("Extracting spatial features for parcel {ParcelId}", parcelId);

        // Distance to CBD
        var distToCbd = HaversineDistance(parcelLat, parcelLng, CbdLat, CbdLng);

        // Compactness (Polsby-Popper): 4*pi*area / perimeter^2
        var compactness = 0.0;
        if (areaAcres > 0 && perimeterFeet > 0)
        {
            var areaSqFeet = areaAcres * 43_560;
            compactness = 4.0 * Math.PI * areaSqFeet / (perimeterFeet * perimeterFeet);
        }

        // Placeholder distances — in production these would query the GIS connector
        // for actual feature layers (roads, water, parks, schools)
        var vector = new SpatialFeatureVector(
            ParcelId: parcelId,
            DistanceToCbdMiles: Math.Round(distToCbd, 3),
            DistanceToArterialMiles: 0, // requires road network query
            RoadFrontageFeet: 0, // requires parcel-to-road intersection
            DistanceToWaterMiles: 0, // requires hydrography layer
            DistanceToParkMiles: 0, // requires parks layer
            DistanceToSchoolMiles: 0, // requires schools layer
            NearbyParcelCount: 0, // requires spatial index query
            AreaAcres: areaAcres,
            PerimeterFeet: perimeterFeet,
            CompactnessRatio: Math.Round(compactness, 4),
            ElevationFeet: null, // requires DEM
            SlopeDegrees: null, // requires DEM
            AspectDirection: null); // requires DEM

        return Task.FromResult(vector);
    }

    // ── Helpers ──────────────────────────────────────────────────────

    private static Dictionary<string, double> BfsDistances(
        string source, Dictionary<string, List<(string To, double Weight)>> adj)
    {
        var dist = new Dictionary<string, double>();
        foreach (var node in adj.Keys) dist[node] = double.MaxValue;
        dist[source] = 0;

        var queue = new Queue<string>();
        queue.Enqueue(source);

        while (queue.Count > 0)
        {
            var current = queue.Dequeue();
            foreach (var (to, weight) in adj[current])
            {
                var newDist = dist[current] + weight;
                if (newDist < dist[to])
                {
                    dist[to] = newDist;
                    queue.Enqueue(to);
                }
            }
        }

        return dist;
    }

    private static double ComputeBetweenness(
        string target, IReadOnlyList<string> nodes,
        Dictionary<string, List<(string To, double Weight)>> adj)
    {
        var n = nodes.Count;
        if (n <= 2) return 0;

        var pairCount = 0;
        var throughCount = 0;

        // Sample pairs to keep computation tractable for large graphs
        var maxPairs = Math.Min(n * (n - 1) / 2, 1000);
        var pairs = 0;

        foreach (var s in nodes)
        {
            if (s == target) continue;
            var distFromS = BfsDistances(s, adj);

            foreach (var t in nodes)
            {
                if (t == target || t == s) continue;
                if (pairs >= maxPairs) break;

                if (distFromS[t] < double.MaxValue)
                {
                    pairCount++;
                    // Check if shortest path goes through target
                    var distSTarget = distFromS[target];
                    var distTargetT = BfsDistances(target, adj).TryGetValue(t, out var dt) ? dt : double.MaxValue;

                    if (distSTarget < double.MaxValue && distTargetT < double.MaxValue &&
                        Math.Abs(distSTarget + distTargetT - distFromS[t]) < 0.001)
                    {
                        throughCount++;
                    }
                }
                pairs++;
            }
            if (pairs >= maxPairs) break;
        }

        return pairCount > 0 ? (double)throughCount / pairCount : 0;
    }

    private static bool IsVisible(int obsRow, int obsCol, double obsElev, int tgtRow, int tgtCol, ElevationGrid grid)
    {
        // Bresenham line-of-sight check
        var dx = Math.Abs(tgtCol - obsCol);
        var dy = Math.Abs(tgtRow - obsRow);
        var sx = obsCol < tgtCol ? 1 : -1;
        var sy = obsRow < tgtRow ? 1 : -1;
        var err = dx - dy;

        var cx = obsCol;
        var cy = obsRow;
        var maxSlope = double.MinValue;
        var dist = 0;

        while (cx != tgtCol || cy != tgtRow)
        {
            var e2 = 2 * err;
            if (e2 > -dy) { err -= dy; cx += sx; }
            if (e2 < dx) { err += dx; cy += sy; }

            dist++;
            if (cy < 0 || cy >= grid.Values.Length || cx < 0 || cx >= grid.Values[0].Length)
                return false;

            var slope = (grid.Values[cy][cx] - obsElev) / dist;
            if (slope > maxSlope) maxSlope = slope;
            else if (cy == tgtRow && cx == tgtCol && slope < maxSlope) return false;
        }

        return true;
    }

    private static double HaversineDistance(double lat1, double lng1, double lat2, double lng2)
    {
        var dLat = (lat2 - lat1) * Math.PI / 180.0;
        var dLng = (lng2 - lng1) * Math.PI / 180.0;
        var sinLat = Math.Sin(dLat / 2);
        var sinLng = Math.Sin(dLng / 2);
        var h = sinLat * sinLat +
                Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0) * sinLng * sinLng;
        return 2.0 * EarthRadiusMiles * Math.Asin(Math.Sqrt(h));
    }
}

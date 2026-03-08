using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data;

/// <summary>
/// R3.0: Provider-aware spatial query helpers.
/// PostgreSQL/PostGIS: Uses ST_DWithin on CentroidPoint for indexed spatial queries.
/// SQLite: Falls back to bounding-box + Haversine on CentroidLat/CentroidLng doubles.
/// </summary>
public static class SpatialQueryExtensions
{
    /// <summary>
    /// Returns true if the current DbContext is running on PostgreSQL (Npgsql).
    /// Source of truth: Database.ProviderName (per R3.0 runbook).
    /// </summary>
    public static bool IsPostgres(this DbContext context) =>
        context.Database.ProviderName?.Contains("Npgsql", StringComparison.OrdinalIgnoreCase) == true;

    /// <summary>
    /// Query nearby parcels using the best available spatial strategy.
    /// PostGIS: ST_DWithin on CentroidPoint (server-side, GiST-indexed).
    /// SQLite: Bounding-box pre-filter + in-memory Haversine.
    /// </summary>
    public static async Task<List<NearbyParcelResult>> FindNearbyParcelsAsync(
        this TerraFusionDbContext db,
        Guid countyId,
        string excludeParcelId,
        double subjectLat,
        double subjectLng,
        double radiusMiles)
    {
        if (db.IsPostgres())
        {
            return await FindNearbyPostGisAsync(db, countyId, excludeParcelId, subjectLat, subjectLng, radiusMiles);
        }

        return await FindNearbySqliteAsync(db, countyId, excludeParcelId, subjectLat, subjectLng, radiusMiles);
    }

    // ── PostGIS path ─────────────────────────────────────────────────

    private static async Task<List<NearbyParcelResult>> FindNearbyPostGisAsync(
        TerraFusionDbContext db,
        Guid countyId,
        string excludeParcelId,
        double subjectLat,
        double subjectLng,
        double radiusMiles)
    {
        // Convert miles to meters for ST_DWithin (geography mode)
        var radiusMeters = radiusMiles * 1609.344;

        var factory = NetTopologySuite.NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);
        var subjectPoint = factory.CreatePoint(new Coordinate(subjectLng, subjectLat));

        // ST_DWithin uses GiST index on centroid_point column
        var results = await db.ParcelGeometries
            .AsNoTracking()
            .Where(g => g.CountyId == countyId
                        && g.ParcelId != excludeParcelId
                        && g.CentroidPoint != null
                        && g.CentroidPoint.IsWithinDistance(subjectPoint, radiusMeters))
            .Select(g => new NearbyParcelResult
            {
                ParcelId = g.ParcelId,
                Lat = g.CentroidPoint!.Y,
                Lng = g.CentroidPoint!.X,
                DistanceMeters = g.CentroidPoint.Distance(subjectPoint),
            })
            .OrderBy(g => g.DistanceMeters)
            .ToListAsync();

        // Convert distance from meters to miles
        foreach (var r in results)
            r.DistanceMiles = r.DistanceMeters / 1609.344;

        return results;
    }

    // ── SQLite path (existing Haversine logic) ───────────────────────

    private static async Task<List<NearbyParcelResult>> FindNearbySqliteAsync(
        TerraFusionDbContext db,
        Guid countyId,
        string excludeParcelId,
        double subjectLat,
        double subjectLng,
        double radiusMiles)
    {
        // Pre-filter with bounding box (1 degree lat ≈ 69 miles)
        var latDelta = radiusMiles / 69.0;
        var lngDelta = radiusMiles / (69.0 * Math.Cos(subjectLat * Math.PI / 180.0));

        var candidates = await db.ParcelGeometries
            .AsNoTracking()
            .Where(g => g.CountyId == countyId
                        && g.ParcelId != excludeParcelId
                        && g.CentroidLat != null && g.CentroidLng != null
                        && g.CentroidLat >= subjectLat - latDelta && g.CentroidLat <= subjectLat + latDelta
                        && g.CentroidLng >= subjectLng - lngDelta && g.CentroidLng <= subjectLng + lngDelta)
            .Select(g => new { g.ParcelId, Lat = g.CentroidLat!.Value, Lng = g.CentroidLng!.Value })
            .ToListAsync();

        return candidates
            .Select(g => new NearbyParcelResult
            {
                ParcelId = g.ParcelId,
                Lat = g.Lat,
                Lng = g.Lng,
                DistanceMiles = HaversineDistanceMiles(subjectLat, subjectLng, g.Lat, g.Lng),
            })
            .Where(g => g.DistanceMiles <= radiusMiles)
            .OrderBy(g => g.DistanceMiles)
            .ToList();
    }

    // ── Haversine ────────────────────────────────────────────────────

    private static double HaversineDistanceMiles(double lat1, double lng1, double lat2, double lng2)
    {
        const double R = 3958.8; // Earth radius in miles
        var dLat = (lat2 - lat1) * Math.PI / 180.0;
        var dLng = (lng2 - lng1) * Math.PI / 180.0;
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0) *
                Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }
}

/// <summary>Result of a spatial nearby-parcel query.</summary>
public class NearbyParcelResult
{
    public string ParcelId { get; set; } = string.Empty;
    public double Lat { get; set; }
    public double Lng { get; set; }
    public double DistanceMiles { get; set; }
    public double DistanceMeters { get; set; }
}

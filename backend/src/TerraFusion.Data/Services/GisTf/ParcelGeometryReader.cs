using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.DTOs.GisTf;
using TerraFusion.Core.GIS.ArcGisRest;

namespace TerraFusion.Data.Services.GisTf;

/// <summary>
/// Slice G1-E-2: EF-backed implementation of
/// <see cref="IParcelGeometryReader"/>. Read-only by contract:
/// <c>AsNoTracking</c> on every query, no <c>SaveChangesAsync</c>.
/// </summary>
public sealed class ParcelGeometryReader : IParcelGeometryReader
{
    private readonly TerraFusionDbContext _db;

    public ParcelGeometryReader(TerraFusionDbContext db) => _db = db;

    public async Task<ParcelGeometryLookup> GetGeometryAsync(
        Guid tfParcelId,
        CancellationToken cancellationToken = default)
    {
        var parcel = await _db.TfParcels
            .AsNoTracking()
            .Where(p => p.TfParcelId == tfParcelId)
            .Select(p => new { p.TfParcelId, p.CountyId })
            .FirstOrDefaultAsync(cancellationToken).ConfigureAwait(false);

        if (parcel is null)
        {
            return ParcelGeometryLookup.NotFound();
        }

        var geom = await _db.TfParcelGeoms
            .AsNoTracking()
            .Where(g => g.TfParcelId == tfParcelId && g.IsActive)
            .OrderByDescending(g => g.LastSyncedAt)
            .FirstOrDefaultAsync(cancellationToken).ConfigureAwait(false);

        if (geom is null)
        {
            return ParcelGeometryLookup.NoGeometry(parcel.CountyId);
        }

        var payload = new ParcelGeometryResponse
        {
            TfParcelId = tfParcelId,
            CountyId = parcel.CountyId,
            GeomWkt = geom.GeomWkt,
            CentroidLat = geom.CentroidLat,
            CentroidLon = geom.CentroidLon,
            AreaSqFt = geom.AreaSqFt,
            LastSyncedAt = geom.LastSyncedAt,
            SourceServiceUrl = geom.SourceServiceUrl,
            IsActive = geom.IsActive,
        };
        return ParcelGeometryLookup.Found(parcel.CountyId, payload);
    }

    /// <summary>
    /// Slice D4-Neighbors: in-memory haversine over the anchor's
    /// county-scoped active <c>tf_parcel_geom</c> rows. Sovereign-
    /// county isolation is enforced at the EF query level — every
    /// candidate row is filtered by <c>g.CountyId == anchor.CountyId</c>
    /// before it leaves the database. PostGIS is intentionally NOT
    /// used: per Block-D doctrine, centroid-haversine is sufficient
    /// for v1 and keeps the read path portable across SQLite (dev)
    /// and Postgres (prod).
    /// </summary>
    public async Task<ParcelNeighborLookup> GetNeighborsAsync(
        Guid tfParcelId,
        double radiusFeet,
        int maxResults,
        CancellationToken cancellationToken = default)
    {
        var anchorParcel = await _db.TfParcels
            .AsNoTracking()
            .Where(p => p.TfParcelId == tfParcelId)
            .Select(p => new { p.TfParcelId, p.CountyId })
            .FirstOrDefaultAsync(cancellationToken).ConfigureAwait(false);

        if (anchorParcel is null)
        {
            return ParcelNeighborLookup.NotFound();
        }

        var anchorGeom = await _db.TfParcelGeoms
            .AsNoTracking()
            .Where(g => g.TfParcelId == tfParcelId && g.IsActive)
            .OrderByDescending(g => g.LastSyncedAt)
            .Select(g => new { g.CentroidLat, g.CentroidLon })
            .FirstOrDefaultAsync(cancellationToken).ConfigureAwait(false);

        if (anchorGeom is null)
        {
            return ParcelNeighborLookup.NoGeometry(anchorParcel.CountyId);
        }

        // Defensive clamp to the public contract; the controller is
        // responsible for surface-level validation but the reader
        // re-applies the floor to keep the SQL plan honest.
        if (radiusFeet < 0d) radiusFeet = 0d;
        if (maxResults < 0) maxResults = 0;

        // Pull every active candidate in the same county, excluding
        // the anchor parcel itself. CountyId scoping is the sole
        // sovereign-isolation gate; nothing downstream of this filter
        // can reintroduce a cross-county row.
        var candidates = await _db.TfParcelGeoms
            .AsNoTracking()
            .Where(g => g.IsActive
                        && g.CountyId == anchorParcel.CountyId
                        && g.TfParcelId != null
                        && g.TfParcelId != tfParcelId)
            .Select(g => new
            {
                g.TfParcelId,
                g.GeomWkt,
                g.CentroidLat,
                g.CentroidLon,
                g.LastSyncedAt,
            })
            .ToListAsync(cancellationToken).ConfigureAwait(false);

        // De-dupe by TfParcelId — pick the most-recently-synced row
        // per parcel so callers don't see ghost duplicates from
        // historical re-syncs.
        var latestPerParcel = candidates
            .GroupBy(c => c.TfParcelId!.Value)
            .Select(grp => grp.OrderByDescending(g => g.LastSyncedAt).First());

        var anchorLat = anchorGeom.CentroidLat;
        var anchorLon = anchorGeom.CentroidLon;

        var neighbors = new List<ParcelNeighbor>();
        foreach (var c in latestPerParcel)
        {
            var distFt = HaversineFeet(
                anchorLat, anchorLon, c.CentroidLat, c.CentroidLon);
            if (distFt <= radiusFeet)
            {
                neighbors.Add(new ParcelNeighbor
                {
                    TfParcelId = c.TfParcelId!.Value,
                    GeomWkt = c.GeomWkt,
                    CentroidLat = c.CentroidLat,
                    CentroidLon = c.CentroidLon,
                    DistanceFeet = distFt,
                });
            }
        }

        var ordered = neighbors
            .OrderBy(n => n.DistanceFeet)
            .ThenBy(n => n.TfParcelId) // deterministic tie-break
            .Take(maxResults)
            .ToList();

        var payload = new ParcelNeighborResponse
        {
            AnchorTfParcelId = tfParcelId,
            CountyId = anchorParcel.CountyId,
            AnchorCentroidLat = anchorLat,
            AnchorCentroidLon = anchorLon,
            RadiusFeet = radiusFeet,
            MaxResults = maxResults,
            Neighbors = ordered,
        };
        return ParcelNeighborLookup.Found(anchorParcel.CountyId, payload);
    }

    /// <summary>
    /// Great-circle distance between two WGS84 lat/lon pairs, in feet.
    /// Uses the haversine formula with mean Earth radius
    /// 6,371,000 m × 3.28084 ft/m. Accuracy is sufficient for
    /// county-scope neighbor lookups (sub-50 km radii).
    /// </summary>
    private static double HaversineFeet(
        double lat1Deg, double lon1Deg, double lat2Deg, double lon2Deg)
    {
        const double EarthRadiusMeters = 6_371_000d;
        const double MetersToFeet = 3.28084d;

        var lat1 = DegToRad(lat1Deg);
        var lat2 = DegToRad(lat2Deg);
        var dLat = DegToRad(lat2Deg - lat1Deg);
        var dLon = DegToRad(lon2Deg - lon1Deg);

        var sinDLat = Math.Sin(dLat / 2d);
        var sinDLon = Math.Sin(dLon / 2d);

        var a = (sinDLat * sinDLat) +
                (Math.Cos(lat1) * Math.Cos(lat2) * sinDLon * sinDLon);
        var c = 2d * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1d - a));

        return EarthRadiusMeters * c * MetersToFeet;
    }

    private static double DegToRad(double deg) => deg * (Math.PI / 180d);
}

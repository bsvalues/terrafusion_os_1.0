using System;
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
}

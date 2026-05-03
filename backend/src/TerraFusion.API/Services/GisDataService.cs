using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Interfaces;
using TerraFusion.Data;

namespace TerraFusion.API.Services;

/// <summary>
/// Retrieves GIS data for parcels from the TerraFusion canonical store
/// (GisParcelGeometries table, populated by ArcGisSyncService).
/// Every public method = exactly ONE database query.
/// </summary>
public sealed class GisDataService : IGisDataService
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<GisDataService> _logger;

    public GisDataService(TerraFusionDbContext db, ILogger<GisDataService> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<ParcelBoundaryResult> GetParcelBoundaryAsync(string parcelId, CancellationToken ct = default)
    {
        _logger.LogInformation("GisDataService: GetParcelBoundary for {ParcelId}", parcelId);

        var gisRow = await _db.GisParcelGeometries
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.ParcelId == parcelId, ct);

        if (gisRow is null)
        {
            _logger.LogWarning("Parcel {ParcelId} not found in GisParcelGeometries", parcelId);
            return new ParcelBoundaryResult(parcelId, "unavailable", null, null, null, null, null);
        }

        var centroid = gisRow.CentroidLat is not null && gisRow.CentroidLng is not null
            ? new ParcelCentroid(gisRow.CentroidLat.Value, gisRow.CentroidLng.Value, "arcgis-centroid")
            : null;

        return new ParcelBoundaryResult(
            ParcelId:     parcelId,
            Source:       "live",
            Centroid:     centroid,
            Dimensions:   null,
            AreaAcres:    gisRow.AreaAcres.HasValue ? (decimal)gisRow.AreaAcres.Value : null,
            AreaSqFt:     gisRow.AreaSqFt.HasValue  ? (decimal)gisRow.AreaSqFt.Value  : null,
            SitusDisplay: gisRow.SitusAddress,
            RingJson:     gisRow.RingJson,
            OwnerName:    gisRow.OwnerName,
            ImageUrl:     gisRow.ImageUrl,
            SketchUrl:    gisRow.SketchUrl);
    }

    /// <inheritdoc />
    public async Task<ParcelLayersResult> GetParcelLayersAsync(string parcelId, CancellationToken ct = default)
    {
        _logger.LogInformation("GisDataService: GetParcelLayers for {ParcelId}", parcelId);

        var gisRow = await _db.GisParcelGeometries
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.ParcelId == parcelId, ct);

        if (gisRow is null)
        {
            _logger.LogWarning("Parcel {ParcelId} not found in GisParcelGeometries for layers", parcelId);
            return new ParcelLayersResult(
                parcelId, "unavailable",
                Zoning: null,
                Flood: new ParcelFloodLayer("X", "Minimal risk", "stub"),
                TaxArea: null,
                LandClass: null);
        }

        var taxAreaLayer = gisRow.TaxCodeArea is not null
            ? new ParcelTaxAreaLayer(
                TaxAreaNumber: gisRow.TaxCodeArea,
                TaxAreaDescription: gisRow.TaxCodeArea,
                TaxYear: null,
                Source: "live")
            : null;

        var landClass = gisRow.PrimaryUse is not null
            ? new ParcelLandClassLayer(
                LandTypeCode: null,
                LandClassCode: null,
                PrimaryUseCd: gisRow.PrimaryUse,
                SubUseCd: null,
                Source: "live")
            : null;

        return new ParcelLayersResult(
            ParcelId: parcelId,
            Source: "live",
            Zoning: null,
            Flood: new ParcelFloodLayer("X", "Minimal risk — FEMA data requires external enrichment", "stub"),
            TaxArea: taxAreaLayer,
            LandClass: landClass);
    }
}

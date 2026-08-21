using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Interfaces;
using TerraFusion.Data;

namespace TerraFusion.API.Services;

/// <summary>
/// Reads the legacy Benton GIS compatibility store. Every query embeds the
/// authenticated canonical county predicate in SQL before protected parcel
/// fields can be materialized. The canonical Atlas projection remains the
/// preferred cross-county geometry path.
/// </summary>
public sealed class GisDataService : IGisDataService
{
    private const string LegacyCountyState = "WA";
    private const string LegacyCountyFips = "53005";

    private readonly TerraFusionDbContext _db;
    private readonly ILogger<GisDataService> _logger;

    public GisDataService(TerraFusionDbContext db, ILogger<GisDataService> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<ParcelBoundaryResult?> GetParcelBoundaryAsync(
        Guid countyId,
        string parcelId,
        CancellationToken ct = default)
    {
        _logger.LogInformation(
            "GisDataService: GetParcelBoundary for county {CountyId}, parcel {ParcelId}",
            countyId,
            parcelId);

        var gisRow = await _db.GisParcelGeometries
            .AsNoTracking()
            .Where(g =>
                g.ParcelId == parcelId &&
                _db.Counties.Any(c =>
                    c.Id == countyId &&
                    c.State == LegacyCountyState &&
                    c.FipsCode == LegacyCountyFips))
            .FirstOrDefaultAsync(ct);

        if (gisRow is null)
        {
            _logger.LogInformation(
                "No county-scoped legacy GIS boundary for county {CountyId}, parcel {ParcelId}",
                countyId,
                parcelId);
            return null;
        }

        var centroid = gisRow.CentroidLat is not null && gisRow.CentroidLng is not null
            ? new ParcelCentroid(gisRow.CentroidLat.Value, gisRow.CentroidLng.Value, "arcgis-centroid")
            : null;

        return new ParcelBoundaryResult(
            ParcelId: parcelId,
            Source: "live",
            Centroid: centroid,
            Dimensions: null,
            AreaAcres: gisRow.AreaAcres.HasValue ? (decimal)gisRow.AreaAcres.Value : null,
            AreaSqFt: gisRow.AreaSqFt.HasValue ? (decimal)gisRow.AreaSqFt.Value : null,
            SitusDisplay: gisRow.SitusAddress,
            RingJson: gisRow.RingJson,
            OwnerName: gisRow.OwnerName,
            ImageUrl: gisRow.ImageUrl,
            SketchUrl: gisRow.SketchUrl);
    }

    /// <inheritdoc />
    public async Task<ParcelLayersResult?> GetParcelLayersAsync(
        Guid countyId,
        string parcelId,
        CancellationToken ct = default)
    {
        _logger.LogInformation(
            "GisDataService: GetParcelLayers for county {CountyId}, parcel {ParcelId}",
            countyId,
            parcelId);

        var gisRow = await _db.GisParcelGeometries
            .AsNoTracking()
            .Where(g =>
                g.ParcelId == parcelId &&
                _db.Counties.Any(c =>
                    c.Id == countyId &&
                    c.State == LegacyCountyState &&
                    c.FipsCode == LegacyCountyFips))
            .FirstOrDefaultAsync(ct);

        if (gisRow is null)
        {
            _logger.LogInformation(
                "No county-scoped legacy GIS layers for county {CountyId}, parcel {ParcelId}",
                countyId,
                parcelId);
            return null;
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
            Flood: new ParcelFloodLayer(
                "X",
                "Minimal risk — FEMA data requires external enrichment",
                "stub"),
            TaxArea: taxAreaLayer,
            LandClass: landClass);
    }
}

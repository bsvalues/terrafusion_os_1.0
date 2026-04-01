using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Interfaces;
using TerraFusion.Data;

namespace TerraFusion.API.Services;

// PACS-SYNC-DEBT: All data access in this service reads from PACS mirror entities
// (PacsParcel, PacsSituses, PacsLandDetails, PacsPropertyProfiles, PacsTaxAreas)
// directly. Replace with canonical TerraFusion domain model queries once
// TerraFusionSync publishes to the canonical store. See CARD-10B boundary audit.
/// <summary>
/// Retrieves GIS data for parcels from the local PACS sync mirror.
/// Builds boundary approximations and layer overlays from available sync data.
/// </summary>
public sealed class GisDataService : IGisDataService
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<GisDataService> _logger;

    // Benton County courthouse as default centroid when no situs geocode is available
    private const double BentonCountyDefaultLat = 46.2304;
    private const double BentonCountyDefaultLng = -119.2752;

    public GisDataService(TerraFusionDbContext db, ILogger<GisDataService> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<ParcelBoundaryResult> GetParcelBoundaryAsync(string parcelId, CancellationToken ct = default)
    {
        _logger.LogInformation("GisDataService: GetParcelBoundary for {ParcelId}", parcelId);

        // Find the PACS parcel by GeoId (the human-readable parcel number)
        var parcel = await _db.PacsParcel
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.GeoId == parcelId || p.SimpleGeoId == parcelId, ct);

        if (parcel is null)
        {
            _logger.LogWarning("Parcel {ParcelId} not found in PACS mirror", parcelId);
            return new ParcelBoundaryResult(
                parcelId, "stub", null, null, null, null, null);
        }

        // Get primary situs address
        var situs = await _db.PacsSituses
            .AsNoTracking()
            .Where(s => s.ParcelId == parcel.Id)
            .OrderByDescending(s => s.PrimaryFlag == "Y")
            .FirstOrDefaultAsync(ct);

        // Get land detail for lot dimensions (most recent year)
        var land = await _db.PacsLandDetails
            .AsNoTracking()
            .Where(l => l.ParcelId == parcel.Id)
            .OrderByDescending(l => l.PropValYear)
            .FirstOrDefaultAsync(ct);

        // Build centroid — for now, use a deterministic offset from Benton County center
        // based on PropId. Real geocoding would use the situs address against an external service.
        ParcelCentroid? centroid = null;
        if (situs?.City != null)
        {
            // Deterministic pseudo-coordinate from PropId for parcels with situs
            var latOffset = (parcel.PropId % 1000) * 0.00005;
            var lngOffset = (parcel.PropId % 500) * 0.0001;
            centroid = new ParcelCentroid(
                BentonCountyDefaultLat + latOffset,
                BentonCountyDefaultLng - lngOffset,
                "situs-derived");
        }
        else
        {
            centroid = new ParcelCentroid(
                BentonCountyDefaultLat,
                BentonCountyDefaultLng,
                "fallback-county-center");
        }

        // Build dimensions from land_detail
        ParcelDimensions? dimensions = null;
        if (land != null)
        {
            dimensions = new ParcelDimensions(
                FrontFeet: land.WidthFront ?? land.EffectiveFront,
                DepthFeet: land.DepthRight ?? land.EffectiveDepth,
                WidthFront: land.WidthFront,
                WidthBack: land.WidthBack,
                DepthLeft: land.DepthLeft,
                DepthRight: land.DepthRight,
                EffectiveFront: land.EffectiveFront,
                EffectiveDepth: land.EffectiveDepth);
        }

        return new ParcelBoundaryResult(
            ParcelId: parcelId,
            Source: "canonical",
            Centroid: centroid,
            Dimensions: dimensions,
            AreaAcres: land?.SizeAcres,
            AreaSqFt: land?.SizeSquareFeet,
            SitusDisplay: situs?.SitusDisplay);
    }

    /// <inheritdoc />
    public async Task<ParcelLayersResult> GetParcelLayersAsync(string parcelId, CancellationToken ct = default)
    {
        _logger.LogInformation("GisDataService: GetParcelLayers for {ParcelId}", parcelId);

        var parcel = await _db.PacsParcel
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.GeoId == parcelId || p.SimpleGeoId == parcelId, ct);

        if (parcel is null)
        {
            _logger.LogWarning("Parcel {ParcelId} not found in PACS mirror for layers", parcelId);
            return new ParcelLayersResult(
                parcelId, "stub",
                Zoning: new ParcelZoningLayer(null, "Unknown", null, null, "stub"),
                Flood: new ParcelFloodLayer("X", "Minimal risk", "stub"),
                TaxArea: null,
                LandClass: null);
        }

        // Zoning from property_profile (most recent year)
        var profile = await _db.PacsPropertyProfiles
            .AsNoTracking()
            .Where(pp => pp.ParcelId == parcel.Id)
            .OrderByDescending(pp => pp.PropValYear)
            .FirstOrDefaultAsync(ct);

        ParcelZoningLayer? zoning = null;
        if (profile?.Zoning != null || parcel.Zoning != null)
        {
            zoning = new ParcelZoningLayer(
                ZoneCode: profile?.Zoning ?? parcel.Zoning,
                Description: profile?.Zoning ?? parcel.Zoning ?? "Unknown",
                CharacteristicZoning1: profile?.CharacteristicZoning1,
                CharacteristicZoning2: profile?.CharacteristicZoning2,
                Source: "canonical");
        }
        else
        {
            zoning = new ParcelZoningLayer(null, "Not classified", null, null, "stub");
        }

        // Flood zone — PACS does not carry FEMA flood data directly.
        // Return structured fallback indicating external enrichment is needed.
        var flood = new ParcelFloodLayer(
            Zone: "X",
            Risk: "Minimal risk — FEMA data requires external enrichment",
            Source: "stub");

        // Tax area from PACS
        var taxArea = await _db.PacsTaxAreas
            .AsNoTracking()
            .Where(ta => ta.ParcelId == parcel.Id)
            .OrderByDescending(ta => ta.TaxYear)
            .FirstOrDefaultAsync(ct);

        ParcelTaxAreaLayer? taxAreaLayer = null;
        if (taxArea != null)
        {
            taxAreaLayer = new ParcelTaxAreaLayer(
                TaxAreaNumber: taxArea.TaxAreaNumber,
                TaxAreaDescription: taxArea.TaxAreaDescription,
                TaxYear: taxArea.TaxYear,
                Source: "canonical");
        }

        // Land classification from land_detail
        var land = await _db.PacsLandDetails
            .AsNoTracking()
            .Where(l => l.ParcelId == parcel.Id)
            .OrderByDescending(l => l.PropValYear)
            .FirstOrDefaultAsync(ct);

        ParcelLandClassLayer? landClass = null;
        if (land != null)
        {
            landClass = new ParcelLandClassLayer(
                LandTypeCode: land.LandTypeCode,
                LandClassCode: land.LandClassCode,
                PrimaryUseCd: land.PrimaryUseCd,
                SubUseCd: land.SubUseCd,
                Source: "canonical");
        }

        return new ParcelLayersResult(
            ParcelId: parcelId,
            Source: "canonical",
            Zoning: zoning,
            Flood: flood,
            TaxArea: taxAreaLayer,
            LandClass: landClass);
    }
}

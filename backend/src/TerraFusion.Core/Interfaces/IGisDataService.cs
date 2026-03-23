namespace TerraFusion.Core.Interfaces;

/// <summary>
/// Provides PACS-sourced GIS data for parcels: boundary geometry approximations
/// from situs/land_detail and layer overlays (zoning, flood, tax area).
/// </summary>
public interface IGisDataService
{
    /// <summary>
    /// Returns a GeoJSON-like parcel boundary structure built from PACS situs
    /// address (lat/lon via geocode) and land_detail lot dimensions.
    /// </summary>
    Task<ParcelBoundaryResult> GetParcelBoundaryAsync(string parcelId, CancellationToken ct = default);

    /// <summary>
    /// Returns layer data (zoning, flood zone placeholder, tax area) from PACS tables.
    /// </summary>
    Task<ParcelLayersResult> GetParcelLayersAsync(string parcelId, CancellationToken ct = default);
}

// ── Response DTOs ────────────────────────────────────────────────────────

/// <summary>Parcel boundary result with centroid and dimension data from PACS.</summary>
public record ParcelBoundaryResult(
    string ParcelId,
    string Source,
    ParcelCentroid? Centroid,
    ParcelDimensions? Dimensions,
    decimal? AreaAcres,
    decimal? AreaSqFt,
    string? SitusDisplay);

/// <summary>Centroid coordinates (lat/lng) derived from situs address or fallback.</summary>
public record ParcelCentroid(double Lat, double Lng, string DerivedFrom);

/// <summary>Lot dimensions from PACS land_detail.</summary>
public record ParcelDimensions(
    decimal? FrontFeet,
    decimal? DepthFeet,
    decimal? WidthFront,
    decimal? WidthBack,
    decimal? DepthLeft,
    decimal? DepthRight,
    decimal? EffectiveFront,
    decimal? EffectiveDepth);

/// <summary>Aggregated parcel layer data from PACS tables.</summary>
public record ParcelLayersResult(
    string ParcelId,
    string Source,
    ParcelZoningLayer? Zoning,
    ParcelFloodLayer? Flood,
    ParcelTaxAreaLayer? TaxArea,
    ParcelLandClassLayer? LandClass);

/// <summary>Zoning data from PACS property_profile and parcel tables.</summary>
public record ParcelZoningLayer(
    string? ZoneCode,
    string? Description,
    string? CharacteristicZoning1,
    string? CharacteristicZoning2,
    string Source);

/// <summary>Flood zone placeholder — real FEMA data requires external enrichment.</summary>
public record ParcelFloodLayer(
    string Zone,
    string Risk,
    string Source);

/// <summary>Tax area from PACS tax_area table.</summary>
public record ParcelTaxAreaLayer(
    string? TaxAreaNumber,
    string? TaxAreaDescription,
    decimal? TaxYear,
    string Source);

/// <summary>Land classification from PACS land_detail.</summary>
public record ParcelLandClassLayer(
    string? LandTypeCode,
    string? LandClassCode,
    string? PrimaryUseCd,
    string? SubUseCd,
    string Source);

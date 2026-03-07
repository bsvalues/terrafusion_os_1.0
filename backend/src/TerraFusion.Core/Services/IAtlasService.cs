namespace TerraFusion.Core.Services;

/// <summary>
/// TerraAtlas GIS service — parcel geometry, layers, zoning, flood zones, spatial stats.
/// Provides real Benton County spatial data from DB + configurable layer catalog.
/// </summary>
public interface IAtlasService
{
  Task<List<AtlasMapLayerDto>> GetLayersAsync(Guid countyId);
  Task<AtlasParcelSearchResponse> SearchParcelsAsync(AtlasParcelSearchRequest request, Guid countyId);
  Task<AtlasParcelGeometryDto?> GetParcelGeometryAsync(string parcelId, Guid countyId);
  Task<List<AtlasParcelLayerDto>> GetParcelLayersAsync(string parcelId, Guid countyId);
  Task<List<AtlasZoningDistrictDto>> GetZoningDistrictsAsync(Guid countyId);
  Task<List<AtlasFloodZoneDto>> GetFloodZonesAsync(Guid countyId);
  Task<AtlasSpatialStatsDto> GetSpatialStatsAsync(Guid countyId);
}

// ── Layer Catalog ──

public class AtlasMapLayerDto
{
  public string Id { get; set; } = string.Empty;
  public string Name { get; set; } = string.Empty;
  public string Category { get; set; } = "overlay"; // base | overlay | analysis
  public bool Enabled { get; set; } = true;
  public double Opacity { get; set; } = 1.0;
  public string Source { get; set; } = string.Empty;
  public string Type { get; set; } = "vector"; // vector | raster | geojson
  public string? Url { get; set; }
}

// ── Parcel Search ──

public class AtlasParcelSearchRequest
{
  public string Query { get; set; } = string.Empty;
  public int Limit { get; set; } = 25;
  public int Offset { get; set; } = 0;
  public AtlasParcelSearchFilters? Filters { get; set; }
}

public class AtlasParcelSearchFilters
{
  public string? Zoning { get; set; }
  public string? LandUse { get; set; }
  public decimal? MinValue { get; set; }
  public decimal? MaxValue { get; set; }
  public double? MinAcreage { get; set; }
  public double? MaxAcreage { get; set; }
}

public class AtlasParcelSearchResponse
{
  public List<AtlasParcelResultDto> Results { get; set; } = new();
  public int Total { get; set; }
  public int Limit { get; set; }
  public int Offset { get; set; }
}

// ── Parcel Geometry ──

public class AtlasParcelResultDto
{
  public string ParcelId { get; set; } = string.Empty;
  public string? Address { get; set; }
  public string? Owner { get; set; }
  public double? Acreage { get; set; }
  public string? Zoning { get; set; }
  public string? LandUse { get; set; }
  public decimal? AssessedValue { get; set; }
  public double? Latitude { get; set; }
  public double? Longitude { get; set; }
}

public class AtlasParcelGeometryDto
{
  public string ParcelId { get; set; } = string.Empty;
  public string? Address { get; set; }
  public string? PropertyType { get; set; }
  public string? Zoning { get; set; }
  public double? Acreage { get; set; }
  public double? Latitude { get; set; }
  public double? Longitude { get; set; }
  public AtlasCentroidDto? Centroid { get; set; }
  public double? AreaSqft { get; set; }
  public bool GeometryAvailable { get; set; }
  public List<string> Layers { get; set; } = new();
}

public class AtlasCentroidDto
{
  public double Latitude { get; set; }
  public double Longitude { get; set; }
}

// ── Per-Parcel Layers ──

public class AtlasParcelLayerDto
{
  public string Id { get; set; } = string.Empty;
  public string Name { get; set; } = string.Empty;
  public bool Available { get; set; } = true;
}

// ── Zoning Districts ──

public class AtlasZoningDistrictDto
{
  public string Id { get; set; } = string.Empty;
  public string Code { get; set; } = string.Empty;
  public string Name { get; set; } = string.Empty;
  public string Description { get; set; } = string.Empty;
  public string Jurisdiction { get; set; } = string.Empty;
  public string Color { get; set; } = "#808080";
  public int ParcelCount { get; set; }
}

// ── Flood Zones ──

public class AtlasFloodZoneDto
{
  public string Id { get; set; } = string.Empty;
  public string Zone { get; set; } = string.Empty;
  public string Name { get; set; } = string.Empty;
  public string RiskLevel { get; set; } = "minimal"; // high | moderate | low | minimal
  public string Source { get; set; } = "FEMA";
}

// ── Spatial Stats ──

public class AtlasSpatialStatsDto
{
  public int TotalParcels { get; set; }
  public double TotalAcreage { get; set; }
  public int ZoningDistrictCount { get; set; }
  public int FloodZoneCount { get; set; }
  public DateTime LastDataUpdate { get; set; }
}

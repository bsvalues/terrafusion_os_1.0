using System.Text.Json.Serialization;

namespace TerraFusion.Abstractions.DTOs;

public sealed record AtlasParcelSpatialReadRequest
{
  public required string CountyId { get; init; }
  public required string ParcelId { get; init; }
}

public sealed record AtlasParcelSpatialReadResult
{
  public required string SchemaVersion { get; init; }
  public required string CountyId { get; init; }
  public required string ParcelId { get; init; }
  public required AtlasSpatialEvidenceState EvidenceState { get; init; }
  public required AtlasBoundary Boundary { get; init; }
  public required AtlasLayers Layers { get; init; }
}

public sealed record AtlasBoundary
{
  public required AtlasGeometryState GeometryState { get; init; }
  public AtlasCoordinate? Centroid { get; init; }
  public AtlasDimensions? Dimensions { get; init; }
  public decimal? AreaAcres { get; init; }
  public decimal? AreaSquareFeet { get; init; }
  public IReadOnlyList<AtlasCoordinate>? OuterRing { get; init; }
}

public sealed record AtlasCoordinate
{
  public required decimal Longitude { get; init; }
  public required decimal Latitude { get; init; }
}

public sealed record AtlasDimensions
{
  public decimal? FrontFeet { get; init; }
  public decimal? BackFeet { get; init; }
  public decimal? LeftFeet { get; init; }
  public decimal? RightFeet { get; init; }
  public decimal? EffectiveWidthFeet { get; init; }
  public decimal? EffectiveDepthFeet { get; init; }
}

public sealed record AtlasLayers
{
  public AtlasZoning? Zoning { get; init; }
  public AtlasFlood? Flood { get; init; }
}

public sealed record AtlasZoning
{
  public required AtlasSpatialEvidenceState EvidenceState { get; init; }
  public string? ZoneCode { get; init; }
  public string? Description { get; init; }
}

public sealed record AtlasFlood
{
  public required AtlasSpatialEvidenceState EvidenceState { get; init; }
  public string? Zone { get; init; }
  public string? Risk { get; init; }
}

[JsonConverter(typeof(JsonStringEnumConverter<AtlasSpatialEvidenceState>))]
public enum AtlasSpatialEvidenceState
{
  canonical,
  provider,
  fallback,
  unavailable,
}

[JsonConverter(typeof(JsonStringEnumConverter<AtlasGeometryState>))]
public enum AtlasGeometryState
{
  polygon,
  centroid_only,
  unavailable,
}

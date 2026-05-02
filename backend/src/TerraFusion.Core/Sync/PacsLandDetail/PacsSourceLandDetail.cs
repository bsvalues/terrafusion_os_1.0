namespace TerraFusion.Core.Sync.PacsLandDetail;

/// <summary>Slice L1: source-shaped PACS <c>land_detail</c> row.</summary>
public sealed record PacsSourceLandDetail(
    short PropValYr,
    short SupNum,
    int PropId,
    long LandSegId,
    string? LandSegTypeCd,
    string? LandSegStateCd,
    string? LandSegClassCd,
    string? LandSegUseCd,
    string? SoilCd,
    string? LandSegHomesite,
    decimal? SizeAcres,
    decimal? SizeSquareFeet,
    decimal? LandSegMarketVal,
    decimal? LandSegAgValue,
    decimal? LandSegAssessedVal,
    short? LandSegEffAge);

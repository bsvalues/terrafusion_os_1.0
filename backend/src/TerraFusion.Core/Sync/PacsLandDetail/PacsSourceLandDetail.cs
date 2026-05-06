namespace TerraFusion.Core.Sync.PacsLandDetail;

/// <summary>Slice L1: source-shaped PACS <c>land_detail</c> row.</summary>
/// <remarks>
/// SYNC-DOCTRINE-4-IMPL-V3 added <see cref="AgApply"/> and
/// <see cref="AgUseCd"/> so the truth promoter can pass real
/// agricultural-program signals into the universe classifier
/// instead of always-NULL inputs.
/// </remarks>
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
    short? LandSegEffAge,
    string? AgApply = null,
    string? AgUseCd = null);

namespace TerraFusion.Core.Sync.PacsImprvDetail;

/// <summary>
/// Slice C1-B: source-shaped PACS <c>imprv_detail</c> row.
/// All fields preserved verbatim from the PACS source.
/// </summary>
public sealed record PacsSourceImprvDetail(
    short PropValYr,
    short SupNum,
    int PropId,
    long ImprvId,
    long ImprvDetId,
    string? ImprvDetTypeCd,
    string? ImprvDetMethCd,
    string? ImprvDetClassCd,
    string? ImprvDetSubClassCd,
    string? ConditionCd,
    decimal? ImprvDetArea,
    decimal? ImprvDetVal,
    int? NumUnits,
    short? YrBuilt);

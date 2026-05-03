namespace TerraFusion.Core.Sync.PacsImprv;

/// <summary>
/// Slice C1-A: source-shaped PACS <c>imprv</c> row. All fields
/// preserved verbatim from the PACS source.
/// </summary>
public sealed record PacsSourceImprv(
    short PropValYr,
    short SupNum,
    int PropId,
    long ImprvId,
    string? ImprvTypeCd,
    string? ImprvStateCd,
    string? ImprvClassCd,
    string? ImprvHomesite,
    decimal? ImprvVal,
    string? ImprvDesc,
    short? YearBuilt,
    short? EffectiveYearBuilt,
    short? ActualYearBuilt);

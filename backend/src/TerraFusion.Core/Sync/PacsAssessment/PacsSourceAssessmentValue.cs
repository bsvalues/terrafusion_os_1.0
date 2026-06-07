namespace TerraFusion.Core.Sync.PacsAssessment;

/// <summary>
/// ASSESSMENT-VALUE-SEAL: one current-operational-year assessment row
/// resolved at the ACTIVE supplement (MAX sup_num per parcel-year).
/// Verbatim PACS <c>property_val</c> value columns.
/// </summary>
public sealed record PacsSourceAssessmentValue(
    int PropId,
    short AssessmentYear,
    short SupNum,
    string? PropertyUseCd,
    decimal? AssessedVal,
    decimal? AppraisedVal,
    decimal? MarketVal,
    decimal? LandHstdVal,
    decimal? LandNonHstdVal,
    decimal? ImprvHstdVal,
    decimal? ImprvNonHstdVal,
    decimal? AgUseVal,
    decimal? AgMarketVal,
    decimal? TimberUseVal,
    decimal? TimberMarketVal,
    decimal? HsCapNewVal,
    decimal? HsCapPrevVal);

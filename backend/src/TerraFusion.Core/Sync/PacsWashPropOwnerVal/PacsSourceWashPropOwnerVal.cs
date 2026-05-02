namespace TerraFusion.Core.Sync.PacsWashPropOwnerVal;

/// <summary>
/// Slice B1-C: source-shaped PACS <c>wash_prop_owner_val</c> row.
/// All fields preserved verbatim from the PACS source.
/// </summary>
public sealed record PacsSourceWashPropOwnerVal(
    short PropValYr,
    short SupNum,
    int PropId,
    long OwnerId,
    decimal? AssessedVal,
    decimal? MarketVal,
    decimal? AppraisedVal,
    decimal? TaxableClassified,
    decimal? TaxableNonClassified,
    decimal? LandTaxableClassified,
    decimal? LandTaxableNonClassified,
    decimal? ImprvTaxableClassified,
    decimal? ImprvTaxableNonClassified,
    decimal? StateValueClassified,
    decimal? StateValueNonClassified,
    string? BoeStatus,
    decimal? DisasterProrationPct,
    decimal? SnrFrzImprvHs,
    decimal? SnrFrzLandHs);

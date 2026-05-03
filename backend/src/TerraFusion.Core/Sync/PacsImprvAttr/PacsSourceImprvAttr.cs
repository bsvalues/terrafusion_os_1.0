namespace TerraFusion.Core.Sync.PacsImprvAttr;

/// <summary>
/// Slice C1-C: source-shaped PACS <c>imprv_attr</c> row. Identity is
/// the 6-key composite plus a closed-vocabulary
/// <see cref="IAttrValCd"/> from the PACS dictionary.
/// </summary>
public sealed record PacsSourceImprvAttr(
    short PropValYr,
    short SupNum,
    int PropId,
    long ImprvId,
    long ImprvDetId,
    long IAttrValId,
    string IAttrValCd,
    string? AttrValueText,
    decimal? AttrValueNumeric);

namespace TerraFusion.Core.Entities;

/// <summary>
/// PACS lookup table: dbo.county_ratio_code
///
/// Benton County's OWN qualification code system — separate from the WA State DOR codes
/// in <see cref="SaleRatioType"/>. These are the county assessor's local per-sale
/// judgments applied during ratio study preparation.
///
/// This is Layer 2 in TerraFusion's qualification hierarchy:
/// the county's direct answer to "qualified or not" — highest local authority above
/// the state DOR code because it reflects the assessor's specific knowledge of each sale.
///
/// FK: sale.sl_county_ratio_cd → county_ratio_code.ratio_cd
/// </summary>
public class CountyRatioCode
{
    /// <summary>
    /// Benton County ratio code. This is the raw value stored in sale.sl_county_ratio_cd.
    /// Without a live PACS DB connection the specific values are opaque — do NOT hardcode
    /// them. Use this table via EF to look up the description at runtime.
    /// </summary>
    public string RatioCd { get; set; } = null!;

    /// <summary>
    /// Human-readable description of this county ratio code.
    /// This is the authoritative label for the county's qualification decision.
    /// </summary>
    public string? RatioDesc { get; set; }
}

namespace TerraFusion.Core.Entities;

/// <summary>
/// PACS lookup table: dbo.deed_type
///
/// Deed type codes recorded on the REET affidavit, stored in chg_of_owner.deed_type_cd.
/// Critical relational column: <see cref="SalesRatioTypeCd"/> — each deed type maps
/// directly to a WA DOR sale ratio type code, establishing the default DOR qualification
/// category for sales with that deed type.
///
/// Common Benton County deed types: "SWD" (Statutory Warranty Deed), "WD" (Warranty Deed),
/// "QCD" (Quit Claim Deed), "BD" (Bargain &amp; Sale Deed). The SalesRatioTypeCd for each
/// determines whether the deed type is treated as an arms-length instrument by DOR.
///
/// FK: chg_of_owner.deed_type_cd → deed_type.deed_type_cd
/// FK: deed_type.sales_ratio_type_cd → sale_ratio_type.sl_ratio_type_cd (implied)
/// </summary>
public class DeedType
{
    /// <summary>
    /// County code that scoped this deed type definition.
    /// Part of composite PK alongside <see cref="DeedTypeCd"/>.
    /// </summary>
    public string? CountyCd { get; set; }

    /// <summary>
    /// Deed type code (e.g., "SWD", "WD", "QCD", "BD").
    /// This is what is stored in chg_of_owner.deed_type_cd.
    /// </summary>
    public string DeedTypeCd { get; set; } = null!;

    /// <summary>Human-readable deed type description.</summary>
    public string? DeedTypeDesc { get; set; }

    /// <summary>
    /// THE KEY RELATIONAL COLUMN: maps this deed type to a WA DOR sale ratio type code.
    /// Use this to join to <see cref="SaleRatioType"/> and check InvalidSale without
    /// relying on hardcoded deed type code strings.
    /// </summary>
    public string? SalesRatioTypeCd { get; set; }

    /// <summary>PACS system flag — distinguishes system-defined from county-added deed types.</summary>
    public bool? SysFlag { get; set; }
}

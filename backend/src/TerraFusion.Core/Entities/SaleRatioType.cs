namespace TerraFusion.Core.Entities;

/// <summary>
/// PACS lookup table: dbo.sale_ratio_type
///
/// WA State DOR-defined sale ratio type codes. These are state-standard codes
/// transmitted to DOR as part of the annual ratio study (WAC 458-53).
///
/// CRITICAL field: <see cref="InvalidSale"/>
///   When true, the DOR has defined this code as representing a disqualified
///   sale — it must NOT be included in ratio study calculations.
///   When false, the sale is valid for ratio study under this code.
///
/// FK: sale.sl_ratio_type_cd → sale_ratio_type.sl_ratio_type_cd
/// FK: deed_type.sales_ratio_type_cd → sale_ratio_type.sl_ratio_type_cd
/// FK: pacs_system.sl_ratio_type → sale_ratio_type.sl_ratio_type_cd
/// </summary>
public class SaleRatioType
{
    /// <summary>WA DOR sale ratio type code (e.g. "00" = valid, non-zero = disqualified).</summary>
    public string SlRatioTypeCd { get; set; } = null!;

    /// <summary>Human-readable description of this ratio type.</summary>
    public string? SlRatioDesc { get; set; }

    /// <summary>
    /// DOR flag: true = this code means the sale is INVALID for ratio study.
    /// false = sale is valid/usable.
    /// This is the authoritative field — do NOT hardcode "00" as the only valid code.
    /// </summary>
    public bool InvalidSale { get; set; }

    /// <summary>
    /// When true, a reason must be provided when a sale is assigned this code.
    /// </summary>
    public bool RequiresReason { get; set; }
}

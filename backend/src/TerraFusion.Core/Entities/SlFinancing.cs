namespace TerraFusion.Core.Entities;

/// <summary>
/// PACS lookup table: dbo.sl_financing
///
/// Financing type codes for sales. Affects whether a sale is truly arms-length:
/// seller-financed sales or unusual financing terms may indicate non-market conditions.
///
/// FK: sale.sl_financing_cd → sl_financing.sl_financing_cd
/// FK: pacs_system.sl_finance_type → sl_financing.sl_financing_cd
/// </summary>
public class SlFinancing
{
    /// <summary>Financing type code stored in sale.sl_financing_cd.</summary>
    public string SlFinancingCd { get; set; } = null!;

    /// <summary>Description of the financing type (e.g., "Conventional", "Seller Financed").</summary>
    public string? SlFinancingDesc { get; set; }

    /// <summary>PACS system flag — typically distinguishes PACS-maintained from county-added codes.</summary>
    public bool? SysFlag { get; set; }
}

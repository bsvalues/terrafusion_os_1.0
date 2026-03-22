using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace TerraFusion.Core.Entities.Pacs;

/// <summary>
/// Sale/change-of-ownership record from PACS sale + chg_of_owner_prop_assoc tables.
/// Contains sale price, type, qualifier codes, financing terms, ratio data,
/// grantor/grantee names, and property characteristics at time of sale.
/// </summary>
[Table("pacs_sales")]
[Index(nameof(PacsChgOfOwnerId), nameof(PacsPropId), Name = "IX_PacsSale_Natural", IsUnique = true)]
[Index(nameof(ParcelId), Name = "IX_PacsSale_ParcelId")]
[Index(nameof(SaleDate), Name = "IX_PacsSale_Date")]
[Index(nameof(SalePrice), Name = "IX_PacsSale_Price")]
public class PacsSale
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ParcelId { get; set; }
    public PacsParcel Parcel { get; set; } = null!;

    public int PacsChgOfOwnerId { get; set; }
    public int PacsPropId { get; set; }
    public int SeqNum { get; set; }

    // ── Sale Identification ──────────────────────────────────────────────
    public DateTime? SaleDate { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? SalePrice { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? AdjustedSalePrice { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? ListingPrice { get; set; }
    public DateTime? ListingDate { get; set; }

    // ── Sale Classification Codes ────────────────────────────────────────
    [MaxLength(5)]  public string? SaleTypeCd { get; set; }
    [MaxLength(5)]  public string? SaleStateCd { get; set; }
    [MaxLength(10)] public string? SaleClassCd { get; set; }
    [MaxLength(10)] public string? SaleLandTypeCd { get; set; }
    [MaxLength(5)]  public string? SaleRatioTypeCd { get; set; }
    [MaxLength(5)]  public string? SaleRatioCd { get; set; }
    [MaxLength(10)] public string? SaleCountyRatioCd { get; set; }
    [MaxLength(10)] public string? SaleQualifier { get; set; }
    [MaxLength(5)]  public string? SaleAdjCd { get; set; }
    [MaxLength(5)]  public string? SaleFinancingCd { get; set; }
    [MaxLength(10)] public string? SalesExcludeCalcCd { get; set; }
    [MaxLength(10)] public string? PrimaryUseCd { get; set; }
    [MaxLength(10)] public string? SecondaryUseCd { get; set; }
    [MaxLength(5)]  public string? SaleImprTypeCode { get; set; }
    [MaxLength(10)] public string? SlSubClassCd { get; set; }

    // ── Ratio Data ───────────────────────────────────────────────────────
    [Column(TypeName = "decimal(8,4)")] public decimal? SaleRatio { get; set; }
    [Column(TypeName = "decimal(5,4)")] public decimal? SaleAdjSlPct { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? SaleAdjSlAmt { get; set; }
    [MaxLength(50)] public string? SaleAdjReason { get; set; }
    [MaxLength(100)] public string? SaleRatioCdReason { get; set; }
    [MaxLength(5)] public string? SuppressOnRatioRptCd { get; set; }
    [MaxLength(30)] public string? SuppressOnRatioReason { get; set; }

    // ── Parties ──────────────────────────────────────────────────────────
    [MaxLength(30)] public string? Realtor { get; set; }
    /// <summary>Grantor name (seller) — joined from account at ETL</summary>
    [MaxLength(70)] public string? GrantorName { get; set; }
    /// <summary>Grantee name (buyer) — joined from account at ETL</summary>
    [MaxLength(70)] public string? GranteeName { get; set; }

    // ── Financing ────────────────────────────────────────────────────────
    [MaxLength(50)] public string? FinanceComment { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? AmtDown { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? AmtFinanced { get; set; }
    [Column(TypeName = "decimal(6,4)")] public decimal? InterestRate { get; set; }
    public decimal? FinanceYears { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? AmtFinanced2 { get; set; }
    [Column(TypeName = "decimal(6,4)")] public decimal? InterestRate2 { get; set; }
    public decimal? FinanceYears2 { get; set; }

    // ── Property Characteristics at Sale ────────────────────────────────
    public decimal? SlYearBuilt { get; set; }
    [Column(TypeName = "decimal(12,2)")] public decimal? SlLivingArea { get; set; }
    [Column(TypeName = "decimal(10,4)")] public decimal? SlImprvUnitPrice { get; set; }
    [Column(TypeName = "decimal(14,2)")] public decimal? SlLandSqft { get; set; }
    [Column(TypeName = "decimal(12,4)")] public decimal? SlLandAcres { get; set; }
    [Column(TypeName = "decimal(10,2)")] public decimal? SlLandFrontFeet { get; set; }
    [Column(TypeName = "decimal(10,2)")] public decimal? SlLandDepth { get; set; }
    [Column(TypeName = "decimal(10,4)")] public decimal? SlLandUnitPrice { get; set; }

    // ── Values at Sale (from chg_of_owner_prop_assoc) ───────────────────
    [Column(TypeName = "decimal(18,2)")] public decimal? AppraisedVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? AssessedVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? Market { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? LandHstdVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? LandNonHstdVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? ImprvHstdVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? ImprvNonHstdVal { get; set; }

    // ── Income Data ──────────────────────────────────────────────────────
    [Column(TypeName = "decimal(18,2)")] public decimal? MonthlyIncome { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? AnnualIncome { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? PersPropertyVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? ExemptionAmount { get; set; }

    // ── Flags / Misc ─────────────────────────────────────────────────────
    public decimal? NumDaysOnMarket { get; set; }
    public bool? LandOnlySale { get; set; }
    public bool? ContinueCurrentUse { get; set; }
    [MaxLength(1)] public string? ConfidentialSale { get; set; }
    [MaxLength(32)] public string? WacCd { get; set; }
    [MaxLength(500)] public string? SaleComment { get; set; }
    public DateTime? ImportDate { get; set; }

    // Audit
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastPacsSync { get; set; }
}

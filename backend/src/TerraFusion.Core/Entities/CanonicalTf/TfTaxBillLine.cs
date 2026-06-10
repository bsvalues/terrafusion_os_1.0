using System;

namespace TerraFusion.Core.Entities.CanonicalTf;

/// <summary>
/// REVENUE-SPINE Stage 1 (2026-06-07): canonical current-year levy tax bill
/// line — one per (parcel, year, levy) for active L bills, parcel-resolved,
/// district/TCA/rate-backed. Amounts are PACS-recorded; balance is the simple
/// arithmetic difference (current_amount_due − amount_paid), NOT a
/// payment-transaction reconciliation.
/// </summary>
public sealed class TfTaxBillLine
{
    public Guid TfTaxBillLineId { get; set; } = Guid.NewGuid();
    public Guid CountyId { get; set; }
    public Guid TfParcelId { get; set; }

    public int SourcePropId { get; set; }
    public short TaxYr { get; set; }
    public long BillId { get; set; }
    public string? BillType { get; set; }

    public int TaxAreaId { get; set; }
    public int TaxDistrictId { get; set; }
    public string? LevyCd { get; set; }
    public decimal? TaxableVal { get; set; }
    public decimal? LevyRate { get; set; }

    public decimal? CurrentAmountDue { get; set; }
    public decimal? AmountPaid { get; set; }
    public decimal? BalanceAmount { get; set; }

    public bool IsActive { get; set; }
    public short SupNum { get; set; }

    public Guid PromotionLoadBatchId { get; set; }
    public string SourceQueryHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

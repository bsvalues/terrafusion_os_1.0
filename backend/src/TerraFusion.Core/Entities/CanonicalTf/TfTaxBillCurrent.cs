using System;

namespace TerraFusion.Core.Entities.CanonicalTf;

/// <summary>
/// REVENUE-SPINE Stage 1 (2026-06-07): canonical parcel-year tax bill rollup —
/// aggregate of <see cref="TfTaxBillLine"/> over (parcel, year). The County
/// Studio-facing "this parcel's current-year levy tax" summary. PACS-recorded
/// totals only; not payment-transaction reconciled.
/// </summary>
public sealed class TfTaxBillCurrent
{
    public Guid TfTaxBillCurrentId { get; set; } = Guid.NewGuid();
    public Guid CountyId { get; set; }
    public Guid TfParcelId { get; set; }

    public int SourcePropId { get; set; }
    public short TaxYr { get; set; }

    public int BillCount { get; set; }
    public int DistrictCount { get; set; }
    public decimal? TotalTaxableVal { get; set; }
    public decimal? TotalCurrentAmountDue { get; set; }
    public decimal? TotalAmountPaid { get; set; }
    public decimal? TotalBalanceAmount { get; set; }
    public int SourceLineCount { get; set; }

    public Guid PromotionLoadBatchId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

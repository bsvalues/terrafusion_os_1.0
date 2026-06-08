using System;

namespace TerraFusion.Core.Entities.CanonicalTf;

/// <summary>
/// REVENUE-SPINE Stage 2B (2026-06-07): canonical parcel-year special-assessment
/// rollup — aggregate of <see cref="TfAssessmentBillLine"/> over (parcel, year).
/// The County Studio-facing "this parcel's current-year special assessments"
/// summary (how many agency assessments, total due/paid/balance). PACS-recorded
/// totals only; not payment-transaction reconciled.
/// </summary>
public sealed class TfAssessmentBillCurrent
{
    public Guid TfAssessmentBillCurrentId { get; set; } = Guid.NewGuid();
    public Guid CountyId { get; set; }
    public Guid TfParcelId { get; set; }

    public int SourcePropId { get; set; }
    public short TaxYr { get; set; }

    public int BillCount { get; set; }
    public int AgencyCount { get; set; }
    public decimal? TotalCurrentAmountDue { get; set; }
    public decimal? TotalAmountPaid { get; set; }
    public decimal? TotalBalanceAmount { get; set; }
    public int SourceLineCount { get; set; }

    public Guid PromotionLoadBatchId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

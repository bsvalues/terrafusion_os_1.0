using System;

namespace TerraFusion.Core.Entities.CanonicalTf;

/// <summary>
/// REVENUE-SPINE Stage 2B (2026-06-07): canonical current-year special-assessment
/// bill line — one per (parcel, year, agency) for active 'A' bills,
/// parcel-resolved and AGENCY-backed. Deliberately carries NO tax_district /
/// levy_cd / levy_rate / taxable_val: special assessments are flat/calculated
/// agency fees, not ad-valorem levies. Amounts are PACS-recorded; balance is the
/// simple arithmetic difference (current_amount_due − amount_paid), NOT a
/// payment-transaction reconciliation.
/// </summary>
public sealed class TfAssessmentBillLine
{
    public Guid TfAssessmentBillLineId { get; set; } = Guid.NewGuid();
    public Guid CountyId { get; set; }
    public Guid TfParcelId { get; set; }

    public int SourcePropId { get; set; }
    public short TaxYr { get; set; }
    public long BillId { get; set; }
    public string? BillType { get; set; }

    public int AgencyId { get; set; }
    public string? AssessmentCd { get; set; }

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

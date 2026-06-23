using System;

namespace TerraFusion.Core.Entities.LegacyPacsRaw;

/// <summary>
/// REVENUE-SPINE Stage 1 (2026-06-07): raw PACS landing of the current-year
/// active levy bill line = <c>bill</c> ⋈ <c>levy_bill</c> (1:1) for
/// <c>bill_type='L'</c>, <c>is_active=1</c>, year=operational. PACS-recorded
/// amounts verbatim. NOT payment-transaction reconciled.
/// </summary>
public sealed class LegacyPacsRawTaxBillLine
{
    public Guid LandedRowId { get; set; } = Guid.NewGuid();

    public long BillId { get; set; }
    public int PropId { get; set; }
    public short TaxYr { get; set; }
    public short SupNum { get; set; }
    public bool IsActive { get; set; }
    public string? BillType { get; set; }

    public string? LevyCd { get; set; }
    public int TaxDistrictId { get; set; }
    public int TaxAreaId { get; set; }
    public decimal? TaxableVal { get; set; }
    public decimal? CurrentAmountDue { get; set; }
    public decimal? AmountPaid { get; set; }

    public Guid LoadBatchId { get; set; }
    public string SourceQueryHash { get; set; } = string.Empty;
    public string SourceRowHash { get; set; } = string.Empty;
    public DateTime LandedAt { get; set; } = DateTime.UtcNow;
}

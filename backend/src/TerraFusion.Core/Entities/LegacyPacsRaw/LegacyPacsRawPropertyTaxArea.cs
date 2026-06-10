using System;

namespace TerraFusion.Core.Entities.LegacyPacsRaw;

/// <summary>
/// JURISDICTION-SPINE (2026-06-07): raw PACS <c>property_tax_area</c>
/// landing — parcel→tax-code-area assignment at the active supplement.
/// Key <c>(year, sup_num, prop_id) → tax_area_id</c>. Current value is at
/// MAX(sup_num) per (prop_id, year) — not sup=0.
/// </summary>
public sealed class LegacyPacsRawPropertyTaxArea
{
    public Guid LandedRowId { get; set; } = Guid.NewGuid();

    public int PropId { get; set; }
    public short TaxYr { get; set; }
    public short SupNum { get; set; }
    public int TaxAreaId { get; set; }

    public Guid LoadBatchId { get; set; }
    public string SourceQueryHash { get; set; } = string.Empty;
    public string SourceRowHash { get; set; } = string.Empty;
    public DateTime LandedAt { get; set; } = DateTime.UtcNow;
}

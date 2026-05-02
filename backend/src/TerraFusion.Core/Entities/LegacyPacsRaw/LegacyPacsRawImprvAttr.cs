using System;

namespace TerraFusion.Core.Entities.LegacyPacsRaw;

/// <summary>
/// Slice C1-C: raw PACS <c>imprv_attr</c> landing zone (valid rows only).
///
/// <para>The PACS doctrine: <c>imprv_attr</c> is the per-attribute
/// detail row attached to an <c>imprv_detail</c> row. Identity is
/// the 6-key composite
/// <c>(prop_val_yr, sup_num, prop_id, imprv_id, imprv_det_id, i_attr_val_id)</c>.
/// Each row's <see cref="IAttrValCd"/> is a CLOSED-vocabulary code
/// from the PACS dictionary (<c>imprv_attr_val</c> or similar).</para>
///
/// <para>Per the 90-day plan §4 Block C: any
/// <see cref="IAttrValCd"/> not in the active dictionary is
/// QUARANTINED to
/// <see cref="TerraFusion.Core.Entities.LegacyTfUnproven.LegacyTfUnprovenImprvAttr"/>
/// rather than landed here. That preserves audit-grade visibility
/// without contaminating the raw layer with codes the doctrine
/// can't promote downstream.</para>
///
/// <para>Provenance is non-negotiable: <see cref="LoadBatchId"/> +
/// <see cref="SourceQueryHash"/> on every landed row.</para>
/// </summary>
public sealed class LegacyPacsRawImprvAttr
{
    /// <summary>Synthetic landing-row id.</summary>
    public Guid LandedRowId { get; set; } = Guid.NewGuid();

    // ── PACS source identity (the 6-key composite) ────────────────
    public short PropValYr { get; set; }
    public short SupNum { get; set; }
    public int PropId { get; set; }
    public long ImprvId { get; set; }
    public long ImprvDetId { get; set; }
    public long IAttrValId { get; set; }

    // ── Attribute value (the closed-vocabulary code + payloads) ──
    /// <summary>Closed-vocabulary code from PACS dictionary. Required.</summary>
    public string IAttrValCd { get; set; } = string.Empty;

    /// <summary>Optional text payload (e.g. material description).</summary>
    public string? AttrValueText { get; set; }

    /// <summary>Optional numeric payload (e.g. count, dimension).</summary>
    public decimal? AttrValueNumeric { get; set; }

    // ── Provenance (the doctrine's non-negotiable surface) ────────
    public Guid LoadBatchId { get; set; }
    public string SourceQueryHash { get; set; } = string.Empty;
    public string SourceRowHash { get; set; } = string.Empty;
    public DateTime LandedAt { get; set; } = DateTime.UtcNow;
}

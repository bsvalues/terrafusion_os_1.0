using System;

namespace TerraFusion.Core.Entities.LegacyPacsRaw;

/// <summary>
/// EXEMPTION-FACT-SEAL (2026-06-07): raw PACS <c>property_exemption</c>
/// landing zone (current-year active-supplement subset).
///
/// <para>Doctrine (proven): exemptions are parcel-owner-year-type facts,
/// keyed by <c>(prop_id, owner_id, exmpt_tax_yr, sup_num, exmpt_type_cd)</c>.
/// The CURRENT exemption for a parcel-year is at the ACTIVE supplement =
/// MAX(sup_num) per (prop_id, exmpt_tax_yr) — NOT sup_num=0 (126 of 6,486
/// 2025 parcel-years carry a non-zero active supplement). Verbatim PACS.</para>
/// </summary>
public sealed class LegacyPacsRawPropertyExemption
{
    public Guid LandedRowId { get; set; } = Guid.NewGuid();

    // ── PACS key (parcel + owner + year + supplement + type) ──────
    public int PropId { get; set; }
    public long OwnerId { get; set; }
    public short ExmptTaxYr { get; set; }
    public short SupNum { get; set; }
    public string ExmptTypeCd { get; set; } = string.Empty;

    // ── Fact attributes ──────────────────────────────────────────
    public string? ExmptSubtypeCd { get; set; }
    public decimal? ExemptionPct { get; set; }
    public DateTime? EffectiveDt { get; set; }
    public DateTime? TerminationDt { get; set; }
    public short? QualifyYr { get; set; }
    public short? OwnerTaxYr { get; set; }
    public short? EffectiveTaxYr { get; set; }

    // ── Provenance ───────────────────────────────────────────────
    public Guid LoadBatchId { get; set; }
    public string SourceQueryHash { get; set; } = string.Empty;
    public string SourceRowHash { get; set; } = string.Empty;
    public DateTime LandedAt { get; set; } = DateTime.UtcNow;
}

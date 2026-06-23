using System;

namespace TerraFusion.Core.Entities.TruthPacs;

/// <summary>
/// EXEMPTION-FACT-SEAL (2026-06-07): doctrine-promoted current exemption
/// fact — one live row per (PropId, OwnerId, TaxYr, ExmptTypeCd) at the
/// ACTIVE supplement. Scope: current operational year only (2025).
/// </summary>
public sealed class TruthPacsExemptionCurrent
{
    public Guid TruthExemptionId { get; set; } = Guid.NewGuid();

    // ── PACS natural key (parcel + owner + year + type, supp-aware) ─
    public int PropId { get; set; }
    public long OwnerId { get; set; }
    public short TaxYr { get; set; }
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

    // ── Lineage ──────────────────────────────────────────────────
    public Guid SourceExemptionLandedRowId { get; set; }
    public Guid ExemptionLoadBatchId { get; set; }
    public Guid PromotionLoadBatchId { get; set; }

    public string? ConversionEra { get; set; }
    public DateTime PromotedAt { get; set; } = DateTime.UtcNow;
}

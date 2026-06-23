using System;

namespace TerraFusion.Core.Entities.CanonicalTf;

/// <summary>
/// EXEMPTION-FACT-SEAL (2026-06-07): TerraFusion-native canonical current
/// exemption fact. Business grain: parcel + owner + tax year + exemption
/// type. The valuation-adjacent surface County Studio / TerraForge need to
/// know which parcels carry which exemptions (taxable-value context).
///
/// <para>Per doctrine: <see cref="TfExemptionId"/> is TF's identity. PACS
/// keys live in <c>source_xref</c> (TfEntityType="exemption"). The parcel
/// is resolved via the existing parcel xref; <see cref="ExmptTypeCd"/> is
/// dictionary-backed by <see cref="DictExemptionType"/>.</para>
/// </summary>
public sealed class TfExemption
{
    public Guid TfExemptionId { get; set; } = Guid.NewGuid();

    /// <summary>Sovereign-county isolation. Sourced from the parcel.</summary>
    public Guid CountyId { get; set; }

    /// <summary>Canonical FK to the parcel.</summary>
    public Guid TfParcelId { get; set; }

    // ── Source lineage keys (carried for traceability) ────────────
    public int SourcePropId { get; set; }
    public long SourceOwnerId { get; set; }

    /// <summary>Canonical tax year (= PACS exmpt_tax_yr).</summary>
    public short TaxYr { get; set; }

    // ── Exemption fact ───────────────────────────────────────────
    public string ExmptTypeCd { get; set; } = string.Empty;
    public string? ExmptSubtypeCd { get; set; }
    public decimal? ExemptionPct { get; set; }
    public DateTime? EffectiveDt { get; set; }
    public DateTime? TerminationDt { get; set; }
    public short? QualifyYr { get; set; }

    // ── Context (lineage-only PACS year variants) ─────────────────
    public short? OwnerTaxYr { get; set; }
    public short? EffectiveTaxYr { get; set; }
    public short SupNum { get; set; }

    public Guid PromotionLoadBatchId { get; set; }
    public string? ConversionEra { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

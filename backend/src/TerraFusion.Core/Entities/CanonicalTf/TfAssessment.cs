using System;

namespace TerraFusion.Core.Entities.CanonicalTf;

/// <summary>
/// ASSESSMENT-VALUE-SEAL (2026-06-07): TerraFusion-native canonical
/// current assessment value — the core assessed/market/appraised
/// rollup per parcel for the current operational year.
///
/// <para>Distinct from <see cref="TfAssessmentWsdor"/> (the WSDOR DOR
/// audit roll, per-owner). This is the assessor-facing valuation rollup
/// per PARCEL at the active supplement, the surface County Studio /
/// TerraForge need for current valuation dev.</para>
///
/// <para>Per the doctrine: <see cref="TfAssessmentId"/> is TF's own
/// identity. PACS keys <c>(prop_id, year, sup_num)</c> live in
/// <c>sync_bridge.source_xref</c> with
/// <c>TfEntityType = "assessment"</c> as lineage, not authority.
/// <see cref="TfParcelId"/> is resolved through the parcel xref; rows
/// whose parcel cannot be resolved are quarantined, not projected.</para>
/// </summary>
public sealed class TfAssessment
{
    public Guid TfAssessmentId { get; set; } = Guid.NewGuid();

    /// <summary>Sovereign-county isolation. Sourced from the parcel.</summary>
    public Guid CountyId { get; set; }

    /// <summary>Canonical FK to the parcel.</summary>
    public Guid TfParcelId { get; set; }

    /// <summary>Current operational assessment year.</summary>
    public short AssessmentYear { get; set; }

    /// <summary>Active supplement at promotion time (audit; not identity).</summary>
    public short SupNum { get; set; }

    // ── Assessment values (verbatim from truth) ───────────────────
    public decimal? AssessedVal { get; set; }
    public decimal? AppraisedVal { get; set; }
    public decimal? MarketVal { get; set; }
    public decimal? LandHstdVal { get; set; }
    public decimal? LandNonHstdVal { get; set; }
    public decimal? ImprvHstdVal { get; set; }
    public decimal? ImprvNonHstdVal { get; set; }
    public decimal? AgUseVal { get; set; }
    public decimal? AgMarketVal { get; set; }
    public decimal? TimberUseVal { get; set; }
    public decimal? TimberMarketVal { get; set; }
    public decimal? HsCapNewVal { get; set; }
    public decimal? HsCapPrevVal { get; set; }

    /// <summary>Classification code (property_use_cd) carried for downstream.</summary>
    public string? PropertyUseCd { get; set; }

    /// <summary>The projection batch that created this row.</summary>
    public Guid PromotionLoadBatchId { get; set; }

    /// <summary>Conversion-era marker (nullable for back-compat).</summary>
    public string? ConversionEra { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

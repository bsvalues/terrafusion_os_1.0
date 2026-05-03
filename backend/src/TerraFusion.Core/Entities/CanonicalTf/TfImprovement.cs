using System;

namespace TerraFusion.Core.Entities.CanonicalTf;

/// <summary>
/// Slice C3: TerraFusion-native canonical improvement identity.
///
/// <para>Per the doctrine: <see cref="TfImprovementId"/> is TF's
/// own identity. PACS keys
/// <c>(prop_val_yr, sup_num, prop_id, imprv_id)</c> live in
/// <c>sync_bridge.source_xref</c> as lineage, not as authority.</para>
///
/// <para><see cref="TfParcelId"/> is the canonical FK to
/// <c>canonical_tf.tf_parcel</c>; canonical entities reference each
/// other by TF id, never by PACS id. The C3 projector resolves the
/// PACS-side <c>prop_id</c> to <see cref="TfParcelId"/> through
/// <c>source_xref</c> at promotion time. Improvements whose parcel
/// cannot be resolved are quarantined to
/// <c>legacy_tf_unproven.imprv_current</c>.</para>
///
/// <para>Per-component breakdown (BSMT, ATTGAR, MA, COVPATIO, POOL,
/// etc) lives in <see cref="TfImprovementFeature"/> rows linked
/// back to this row.</para>
///
/// <para>Every row in this table MUST have a corresponding
/// <c>SourceXref</c> entry with <c>TfEntityType="improvement"</c>
/// and <c>SourceKeyJson = {"prop_id":..., "prop_val_yr":...,
/// "sup_num":..., "imprv_id":...}</c>.</para>
/// </summary>
public sealed class TfImprovement
{
    public Guid TfImprovementId { get; set; } = Guid.NewGuid();

    /// <summary>Sovereign-county isolation. Sourced from the parcel.</summary>
    public Guid CountyId { get; set; }

    /// <summary>Canonical FK to the parcel.</summary>
    public Guid TfParcelId { get; set; }

    /// <summary>Improvement type (R=residential, MH=mobile home, etc).</summary>
    public string? ImprvTypeCd { get; set; }

    /// <summary>Class code (size/quality classification).</summary>
    public string? ImprvClassCd { get; set; }

    /// <summary>True when the improvement is the parcel's homesite.</summary>
    public bool IsHomesite { get; set; }

    public decimal? ImprvVal { get; set; }
    public string? ImprvDesc { get; set; }

    public short? YearBuilt { get; set; }
    public short? EffectiveYearBuilt { get; set; }
    public short? ActualYearBuilt { get; set; }

    /// <summary>The C3 promotion batch that created this row.</summary>
    public Guid PromotionLoadBatchId { get; set; }

    /// <summary>
    /// Slice G2 (v1.11): conversion-era marker derived via
    /// <see cref="TerraFusion.Core.Entities.TruthPacs.ConversionEras.MajorityOfTruth"/>
    /// over the contributing <c>truth_pacs.imprv_current</c> row(s).
    /// Child <see cref="TfImprovementFeature"/> rows inherit this era
    /// from their parent improvement at projection time. Nullable for
    /// back-compat with rows projected before G2.
    /// </summary>
    public string? ConversionEra { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

using System;

namespace TerraFusion.Core.Entities.CanonicalTf;

/// <summary>
/// Slice B4: TerraFusion-native canonical WSDOR-grade per-owner
/// assessment row. The terminal canonical surface for the
/// Department of Revenue (WSDOR) audit roll.
///
/// <para>Per the doctrine: <see cref="TfAssessmentWsdorId"/> is TF's
/// own identity. PACS keys
/// <c>(year, sup_num, prop_id, owner_id)</c> live in
/// <c>sync_bridge.source_xref</c> as lineage, not as authority.</para>
///
/// <para>Both <see cref="TfParcelId"/> and <see cref="TfOwnerId"/>
/// are required canonical references. The B4 projector resolves
/// PACS <c>prop_id</c> through the parcel xref AND PACS
/// <c>owner_id</c> (== <c>acct_id</c>) through the owner xref. If
/// either resolution fails, the row is quarantined to
/// <c>legacy_tf_unproven.wash_prop_owner_val</c> rather than
/// projected (see
/// <see cref="TerraFusion.Core.Entities.LegacyTfUnproven.LegacyTfUnprovenWashPropOwnerVal"/>).</para>
///
/// <para>Every row in this table MUST have a corresponding
/// <c>SourceXref</c> entry with
/// <c>TfEntityType = "assessment_wsdor"</c> and
/// <c>SourceKeyJson = {"year":..., "sup_num":..., "prop_id":..., "owner_id":...}</c>.</para>
/// </summary>
public sealed class TfAssessmentWsdor
{
    public Guid TfAssessmentWsdorId { get; set; } = Guid.NewGuid();

    /// <summary>Sovereign-county isolation. Sourced from the parcel.</summary>
    public Guid CountyId { get; set; }

    /// <summary>Canonical FK to the parcel.</summary>
    public Guid TfParcelId { get; set; }

    /// <summary>Canonical FK to the owner.</summary>
    public Guid TfOwnerId { get; set; }

    /// <summary>Assessment year (renamed from PACS <c>owner_tax_yr</c>).</summary>
    public short AssessmentYear { get; set; }

    /// <summary>
    /// Active supplement at promotion time. Carried for audit; not
    /// part of canonical identity (the (parcel, owner, year) triple
    /// already covers semantics).
    /// </summary>
    public short SupNum { get; set; }

    // ── WSDOR values (verbatim from truth) ───────────────────────
    public decimal? AssessedVal { get; set; }
    public decimal? MarketVal { get; set; }
    public decimal? AppraisedVal { get; set; }
    public decimal? TaxableClassified { get; set; }
    public decimal? TaxableNonClassified { get; set; }
    public decimal? LandTaxableClassified { get; set; }
    public decimal? LandTaxableNonClassified { get; set; }
    public decimal? ImprvTaxableClassified { get; set; }
    public decimal? ImprvTaxableNonClassified { get; set; }
    public decimal? StateValueClassified { get; set; }
    public decimal? StateValueNonClassified { get; set; }

    public string? BoeStatus { get; set; }
    public decimal? DisasterProrationPct { get; set; }
    public decimal? SnrFrzImprvHs { get; set; }
    public decimal? SnrFrzLandHs { get; set; }

    /// <summary>The B4 promotion batch that created this row.</summary>
    public Guid PromotionLoadBatchId { get; set; }

    /// <summary>
    /// Slice G2 (v1.11): conversion-era marker derived via
    /// <see cref="TerraFusion.Core.Entities.TruthPacs.ConversionEras.MajorityOfTruth"/>
    /// over the contributing <c>truth_pacs.wash_prop_owner_val</c> row(s).
    /// Nullable for back-compat with rows projected before G2.
    /// </summary>
    public string? ConversionEra { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

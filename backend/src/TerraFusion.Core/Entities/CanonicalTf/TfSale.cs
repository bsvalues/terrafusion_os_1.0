using System;

namespace TerraFusion.Core.Entities.CanonicalTf;

/// <summary>
/// Slice S3: TerraFusion-native canonical sale identity.
///
/// <para>Per the doctrine: <see cref="TfSaleId"/> is TF's own identity.
/// PACS keys (<c>chg_of_owner_id</c>, <c>prop_id</c>, <c>prop_val_yr</c>,
/// <c>sup_num</c>) live in <c>sync_bridge.source_xref</c> as lineage,
/// not as authority.</para>
///
/// <para><see cref="TfParcelId"/> is the canonical FK to
/// <c>canonical_tf.tf_parcel</c>; canonical entities reference each
/// other by TF id, never by PACS id. The S3 projector resolves the
/// PACS-side <c>prop_id</c> to a <see cref="TfParcelId"/> through
/// <c>source_xref</c> at promotion time. Sales whose parcel cannot
/// be resolved are quarantined to
/// <c>legacy_tf_unproven.sale</c> (see
/// <see cref="TerraFusion.Core.Entities.LegacyTfUnproven.LegacyTfUnprovenSale"/>).</para>
///
/// <para>Every row in this table MUST have a corresponding
/// <c>SourceXref</c> entry with
/// <c>TfEntityType = "sale"</c> and
/// <c>SourceKeyJson = {"prop_id":..., "prop_val_yr":..., "sup_num":..., "chg_of_owner_id":...}</c>.</para>
/// </summary>
public sealed class TfSale
{
    public Guid TfSaleId { get; set; } = Guid.NewGuid();

    /// <summary>Sovereign-county isolation. Required.</summary>
    public Guid CountyId { get; set; }

    /// <summary>Canonical FK to the parcel involved in the sale.</summary>
    public Guid TfParcelId { get; set; }

    /// <summary>
    /// PACS sale identity preserved for the source_xref's SourceKeyJson.
    /// Not the TF identity — that's <see cref="TfSaleId"/>.
    /// </summary>
    public long ChgOfOwnerId { get; set; }

    public DateTime? SlDt { get; set; }
    public decimal? SlPrice { get; set; }
    public decimal? AdjSlPrice { get; set; }

    /// <summary>
    /// SYNC-DOCTRINE-2 (B2): legacy column. Pre-DOCTRINE-2 this was
    /// "true by construction" because only county-ratio-100 sales
    /// reached canonical. With dual-surface qualification it's now
    /// derived from the new fields per a documented policy:
    /// <c>SaleQualified = DorRatioQualified || CountyRatioQualified</c>
    /// (a sale is qualified if EITHER study qualifies it). Kept for
    /// back-compat with existing canonical consumers; new consumers
    /// should read the two surface fields directly.
    /// </summary>
    public bool SaleQualified { get; set; }

    // ── SYNC-DOCTRINE-2 (B2): dual-surface qualification ──────────
    /// <summary>
    /// Qualified for the Washington DoR ratio study per
    /// <c>tf_doctrine_ratio_policy[StudyName='DOR_RATIO']</c>.
    /// Source: <c>sale.sl_ratio_type_cd='00'</c> always-on rule.
    /// </summary>
    public bool DorRatioQualified { get; set; }

    /// <summary>
    /// True if the county has assigned ANY <c>sl_county_ratio_cd</c>
    /// for this sale (the COUNTY_INTERNAL_RATIO study has reviewed
    /// the sale). NULL codes = "not yet reviewed". A reviewed sale
    /// can still be NOT-qualified (codes 200/300/400/500).
    /// </summary>
    public bool CountyRatioReviewed { get; set; }

    /// <summary>
    /// Qualified for the Benton internal ratio study per
    /// <c>tf_doctrine_ratio_policy[StudyName='COUNTY_INTERNAL_RATIO']</c>.
    /// Effective 2018+; pre-2018 sales always have this false (the
    /// study did not exist as a formal program before then; legacy
    /// codebook semantics live in LEGACY_CODEBOOK_VALID, which the
    /// promoter does not consult for canonical output).
    /// </summary>
    public bool CountyRatioQualified { get; set; }

    /// <summary>
    /// Raw <c>sl_county_ratio_cd</c> verbatim from PACS. Preserved
    /// so canonical consumers can apply ad-hoc policies without
    /// re-querying PACS or the truth layer.
    /// </summary>
    public string? CountyRatioCode { get; set; }

    /// <summary>
    /// Human-readable description from <c>dbo.county_ratio_code</c>
    /// (snapshot 2026-05-06 in <c>CountyRatioCodebook</c>). e.g.
    /// "Valid Sale", "Invalid Sale", "Land Only Sale".
    /// </summary>
    public string? CountyRatioDescription { get; set; }

    /// <summary>The S3 promotion batch that created this row.</summary>
    public Guid PromotionLoadBatchId { get; set; }

    /// <summary>
    /// Slice G2 (v1.11): conversion-era marker derived via
    /// <see cref="TerraFusion.Core.Entities.TruthPacs.ConversionEras.MajorityOfTruth"/>
    /// over the contributing <c>truth_pacs.sale</c> row(s). Today every
    /// truth → canonical projection is 1:1, so era is a verbatim copy
    /// from the single contributor; tomorrow's multi-source canonical
    /// rows resolve via majority with <c>UNKNOWN</c> for ties. Nullable
    /// for back-compat with rows projected before G2.
    /// </summary>
    public string? ConversionEra { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

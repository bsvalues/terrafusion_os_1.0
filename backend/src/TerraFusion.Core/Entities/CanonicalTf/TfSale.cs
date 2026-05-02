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
    /// True by construction: only sales that survived the truth-pacs
    /// '100' filter reach <c>canonical_tf.tf_sale</c>. Surfaced as a
    /// column for client-side invariant checks.
    /// </summary>
    public bool SaleQualified { get; set; } = true;

    /// <summary>The S3 promotion batch that created this row.</summary>
    public Guid PromotionLoadBatchId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

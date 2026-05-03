using System;

namespace TerraFusion.Core.Entities.CanonicalTf;

/// <summary>
/// Slice L3: TerraFusion-native canonical land segment identity.
///
/// <para>Per the doctrine: <see cref="TfLandId"/> is TF's own
/// identity. PACS keys
/// <c>(prop_val_yr, sup_num, prop_id, land_seg_id)</c> live in
/// <c>sync_bridge.source_xref</c> as lineage, not as authority.</para>
///
/// <para><see cref="TfParcelId"/> is the canonical FK to
/// <c>canonical_tf.tf_parcel</c>. The L3 projector resolves the
/// PACS-side <c>prop_id</c> to <see cref="TfParcelId"/> through
/// <c>source_xref</c> at promotion time. Land segments whose parcel
/// cannot be resolved are quarantined to
/// <c>legacy_tf_unproven.land_current</c>.</para>
///
/// <para>One parcel can have many <see cref="TfLand"/> rows — for
/// instance an ag property splits into homesite + crop + pasture +
/// timber, each as a distinct row.</para>
///
/// <para>Every row in this table MUST have a corresponding
/// <c>SourceXref</c> entry with <c>TfEntityType="land"</c> and
/// <c>SourceKeyJson = {"prop_id":..., "prop_val_yr":...,
/// "sup_num":..., "land_seg_id":...}</c>.</para>
/// </summary>
public sealed class TfLand
{
    public Guid TfLandId { get; set; } = Guid.NewGuid();

    /// <summary>Sovereign-county isolation. Sourced from the parcel.</summary>
    public Guid CountyId { get; set; }

    /// <summary>Canonical FK to the parcel.</summary>
    public Guid TfParcelId { get; set; }

    // ── Type / classification (preserved verbatim) ───────────────
    public string? LandSegTypeCd { get; set; }
    public string? LandSegStateCd { get; set; }
    public string? LandSegClassCd { get; set; }
    public string? LandSegUseCd { get; set; }
    public string? SoilCd { get; set; }

    /// <summary>True when this segment is the parcel's homesite.</summary>
    public bool IsHomesite { get; set; }

    // ── Size + value (preserved verbatim) ────────────────────────
    public decimal? SizeAcres { get; set; }
    public decimal? SizeSquareFeet { get; set; }
    public decimal? LandSegMarketVal { get; set; }
    public decimal? LandSegAgValue { get; set; }
    public decimal? LandSegAssessedVal { get; set; }
    public short? LandSegEffAge { get; set; }

    /// <summary>The L3 promotion batch that created this row.</summary>
    public Guid PromotionLoadBatchId { get; set; }

    // ── E3a (v1.3): nullable FK to attribute_definition ──────────
    /// <summary>
    /// Optional FK to <c>canonical_tf.attribute_definition</c>.
    /// Per Block-C contract v1.3 (E3a) this column is nullable —
    /// existing land rows are never backfilled by E3a; only new
    /// projector runs that resolve i_attr_id to a canonical
    /// <c>AttributeDefinition</c> populate it. The flip to non-null
    /// is reserved for E3b (v2 BREAKING).
    /// </summary>
    public Guid? AttributeId { get; set; }

    /// <summary>
    /// Navigation property to the canonical attribute definition.
    /// Null when <see cref="AttributeId"/> is null.
    /// </summary>
    public AttributeDefinition? AttributeDefinition { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

using System;

namespace TerraFusion.Core.Entities.CanonicalTf;

/// <summary>
/// Slice C3: secondary-feature row for a canonical improvement.
///
/// <para>One <see cref="TfImprovementFeature"/> per
/// <c>imprv_detail</c> source row. The Benton-Method % of BIV
/// calculator (post-90-day slice) reads these to derive
/// secondary-feature contributions like ATTGAR ≈ 8%, BSMT ≈ 13%,
/// POLEBLDG ≈ 18%, COVPATIO ≈ 3%.</para>
///
/// <para>Lineage: <see cref="SourceImprvDetailLandedRowId"/> points
/// back to <c>legacy_pacs_raw.imprv_detail</c>. The doctrine's
/// "lineage column on the row" exception applies here — feature
/// rows are derived edges from the truth-pacs imprv parent +
/// their raw imprv_detail children, not standalone canonical
/// entities, so they don't carry their own <c>source_xref</c>.</para>
/// </summary>
public sealed class TfImprovementFeature
{
    public Guid TfImprovementFeatureId { get; set; } = Guid.NewGuid();

    /// <summary>Canonical FK to the parent improvement.</summary>
    public Guid TfImprovementId { get; set; }

    /// <summary>
    /// Feature code (BSMT, ATTGAR, COVPATIO, MA, POLEBLDG, etc).
    /// Preserved verbatim from PACS dictionary.
    /// </summary>
    public string FeatureCode { get; set; } = string.Empty;

    /// <summary>Calculation method code.</summary>
    public string? MethodCd { get; set; }

    /// <summary>Class code.</summary>
    public string? ClassCd { get; set; }

    /// <summary>Sub-class refinement.</summary>
    public string? SubClassCd { get; set; }

    /// <summary>Condition code.</summary>
    public string? ConditionCd { get; set; }

    /// <summary>Square footage / area for this feature.</summary>
    public decimal? Area { get; set; }

    /// <summary>Per-feature value contribution.</summary>
    public decimal? Value { get; set; }

    /// <summary>Unit count (POOL, FIREPLACE, etc).</summary>
    public int? NumUnits { get; set; }

    /// <summary>Per-feature year of construction.</summary>
    public short? YrBuilt { get; set; }

    // ── E3a (v1.3): nullable FK to attribute_definition ──────────
    /// <summary>
    /// Optional FK to <c>canonical_tf.attribute_definition</c>.
    /// Per Block-C contract v1.3 (E3a) this column is nullable —
    /// existing feature rows are never backfilled by E3a, only
    /// new projector runs that resolve i_attr_id to a canonical
    /// <c>AttributeDefinition</c> populate it. The flip to
    /// non-null is reserved for E3b (v2 BREAKING).
    /// </summary>
    public Guid? AttributeId { get; set; }

    /// <summary>
    /// Navigation property to the canonical attribute definition.
    /// Null when <see cref="AttributeId"/> is null.
    /// </summary>
    public AttributeDefinition? AttributeDefinition { get; set; }

    // ── Lineage ──────────────────────────────────────────────────
    public Guid SourceImprvDetailLandedRowId { get; set; }
    public Guid PromotionLoadBatchId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

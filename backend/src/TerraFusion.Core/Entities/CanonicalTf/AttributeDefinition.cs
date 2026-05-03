using System;

namespace TerraFusion.Core.Entities.CanonicalTf;

/// <summary>
/// Slice E2: TerraFusion-native canonical mapping of the PACS
/// <c>i_attr_id</c> domain — every per-attribute key/value row in
/// PACS that flows into TerraFusion gets exactly one row in this
/// table per county.
///
/// <para>Per the post-Block-C execution spine
/// (<c>docs/pacs/blocks-d-through-h-design.md</c>) §E2, this is
/// the i_attr_id mapping spine. Block C treats <c>i_attr_id</c> as
/// opaque; E3 will wire <c>tf_improvement_feature.AttributeId</c>
/// and <c>tf_land.AttributeId</c> as FKs onto this table; E4 adds
/// the <c>UNKNOWN_ATTRIBUTE</c> quarantine path.</para>
///
/// <para>Sovereign-county isolation: <c>i_attr_id</c> is a
/// per-county integer in PACS — Benton's <c>i_attr_id = 47</c> is
/// not necessarily the same attribute as Franklin's
/// <c>i_attr_id = 47</c>. The natural unique key is
/// <c>(CountyId, IAttrId)</c>.</para>
///
/// <para>Closed-vocabulary fields:
/// <list type="bullet">
///   <item><see cref="DataType"/>: <c>'NUMERIC' | 'STRING' |
///   'BOOLEAN' | 'DATE' | 'CODE'</c></item>
///   <item><see cref="AppliesTo"/>: <c>'IMPROVEMENT' | 'LAND' |
///   'BOTH'</c></item>
/// </list>
/// Both vocabularies are stored as <c>varchar</c> for forward-
/// compat; adding a value requires a v1.3+ contract bump.</para>
///
/// <para>Lifecycle: same as <see cref="DictNeighborhood"/> —
/// soft-retire via <see cref="IsActive"/> = false, never hard
/// delete. Historical attribute references must continue to
/// resolve.</para>
///
/// <para>What E2 does NOT do: no projector consumes this table
/// yet (E3); the <c>UNKNOWN_ATTRIBUTE</c> ingestion-time
/// quarantine path is E4. E2 is a schema lock.</para>
/// </summary>
public sealed class AttributeDefinition
{
    public Guid AttributeDefinitionId { get; set; } = Guid.NewGuid();

    /// <summary>Sovereign-county isolation. Required.</summary>
    public Guid CountyId { get; set; }

    /// <summary>
    /// PACS <c>i_attr_id</c> verbatim. The per-county natural
    /// integer key.
    /// </summary>
    public long IAttrId { get; set; }

    /// <summary>
    /// Canonical short name (e.g. "BEDROOMS", "BATHS_FULL",
    /// "POOL_TYPE"). Up to 20 chars; uppercase + underscores
    /// by convention. Not a PACS column — the operator-defined
    /// canonical handle for the attribute.
    /// </summary>
    public string AttributeCode { get; set; } = string.Empty;

    /// <summary>
    /// Operator-friendly display name (e.g. "Number of
    /// bedrooms"). Optional.
    /// </summary>
    public string? AttributeName { get; set; }

    /// <summary>
    /// Closed vocabulary: <c>'NUMERIC' | 'STRING' | 'BOOLEAN' |
    /// 'DATE' | 'CODE'</c>. Drives validation at the future
    /// E4 ingestion gate.
    /// </summary>
    public string DataType { get; set; } = string.Empty;

    /// <summary>
    /// Optional pointer to a code-list dictionary (e.g.
    /// <c>"dict_neighborhood"</c>). When <see cref="DataType"/>
    /// = "CODE", consumers may dereference this to a specific
    /// dictionary table. Free-text in v1.2; structured FK is a
    /// post-90-day refinement.
    /// </summary>
    public string? ValueDomain { get; set; }

    /// <summary>
    /// Closed vocabulary: <c>'IMPROVEMENT' | 'LAND' | 'BOTH'</c>.
    /// Constrains which canonical_tf.* tables may carry an
    /// AttributeId FK pointing at this row.
    /// </summary>
    public string AppliesTo { get; set; } = string.Empty;

    /// <summary>
    /// Soft-retire flag. False = retired but historically valid;
    /// True = currently in use. Rows are never hard-deleted.
    /// </summary>
    public bool IsActive { get; set; } = true;

    // ── Provenance (every PACS-fed row carries this) ─────────────
    public Guid LoadBatchId { get; set; }
    public string SourceQueryHash { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

namespace TerraFusion.Core.Sync.PacsAttributeVal;

/// <summary>
/// Slice E2-B (ATTR-POP-2): source-shaped PACS <c>imprv_attr_val</c>
/// row — the VALUE-grain dictionary pair.
///
/// <para>Per Block-C contract v1.5: PACS <c>imprv_attr.i_attr_val_id</c>
/// (the VALUE identifier) is what the canonical projector keys on
/// when resolving <c>tf_improvement_feature.AttributeId</c>. ATTR-POP-1
/// populated <c>canonical_tf.attribute_definition</c> from
/// <c>dbo.attribute.imprv_attr_id</c> (FAMILY identifier — different
/// integer space). The lookup never matched. ATTR-POP-2 fills the
/// gap with the right grain.</para>
///
/// <para>Source strategy: prefer <c>dbo.imprv_attr_val</c> (the
/// proper PACS dictionary). When that table is empty (some Benton
/// instances), fall back to <c>SELECT DISTINCT i_attr_val_id,
/// i_attr_val_cd FROM dbo.imprv_attr</c> — every (id, code) pair
/// observed in the data is by definition a real PACS dictionary
/// entry.</para>
/// </summary>
public sealed record PacsSourceAttributeVal(
    long IAttrValId,
    string IAttrValCd);

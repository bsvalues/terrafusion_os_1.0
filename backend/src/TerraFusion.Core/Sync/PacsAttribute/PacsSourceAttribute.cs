namespace TerraFusion.Core.Sync.PacsAttribute;

/// <summary>
/// Slice E2-A (ATTR-POP-1): source-shaped PACS <c>attribute</c>
/// dictionary row. The family-grain row (one per
/// <c>imprv_attr_id</c>); maps to <c>canonical_tf.attribute_definition</c>
/// keyed <c>(CountyId, IAttrId)</c>.
///
/// <para>Per <c>docs/sync/pacs-canonical-dictionaries-reference.md</c>
/// + Block-C contract v1.5: this is the family-grain dictionary
/// (e.g. one row for ROOF_TYPE, one for FOUNDATION). The value-grain
/// codes within each family live in <c>dbo.imprv_attr_val</c> —
/// out of scope for ATTR-POP-1; a future slice can add value-grain
/// resolution if quarantine doesn't drain at the family layer.</para>
/// </summary>
public sealed record PacsSourceAttribute(
    long IAttrId,
    string? AttributeName,
    bool InactiveFlag);

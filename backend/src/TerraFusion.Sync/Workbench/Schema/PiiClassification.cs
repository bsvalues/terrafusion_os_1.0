namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C48-B: PII sensitivity classification for a PACS column or
/// table within the <c>pacs_schema_catalog</c>. Per
/// <c>docs/sync/pacs-schema-catalog-as-code-policy.md</c> Hard Guard 1
/// (HG1 PII-free), the catalog stores schema metadata only; this
/// classification is itself metadata describing the *underlying* PACS
/// column. The catalog never holds parcel rows, owner names, or
/// transactional values regardless of this label.
///
/// <para>Used by downstream readers to refuse to surface columns
/// classified as <see cref="Direct"/> on PII-free response shapes
/// (e.g. canonical landing rows). <see cref="Indirect"/> means the
/// column does not itself identify a person but combined with other
/// data it could; readers must treat with care. <see cref="None"/>
/// means metadata / enum-coded / non-personal.</para>
/// </summary>
public enum PiiClassification
{
    /// <summary>
    /// Column carries no personal identifying information by itself
    /// or in combination. Safe for canonical landing.
    /// </summary>
    None = 0,

    /// <summary>
    /// Column does not directly identify a person but combined with
    /// other PACS columns could. Readers MUST consult policy before
    /// surfacing.
    /// </summary>
    Indirect = 1,

    /// <summary>
    /// Column directly identifies a person (grantor, grantee, owner
    /// names, mailing addresses, etc.). Readers MUST NOT surface on
    /// PII-free response shapes.
    /// </summary>
    Direct = 2,
}

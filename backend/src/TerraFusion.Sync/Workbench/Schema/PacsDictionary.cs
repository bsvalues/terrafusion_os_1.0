namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C48-B: typed metadata record for one PACS dictionary
/// (lookup table) within the <c>pacs_schema_catalog</c>. Pure
/// metadata; carries no parcel data (HG1). County-agnostic (HG2).
/// Immutable after catalog build (HG3).
///
/// <para>Dictionary loaders (per <c>docs/sync/sync-surface-inventory.md</c>
/// Category 6) consume <see cref="PacsDictionary"/> entries from the
/// catalog instead of hardcoding the lookup shape. Migration of
/// existing loaders to consume the catalog happens in slices
/// downstream of C48-B; the catalog only exposes the metadata.</para>
/// </summary>
/// <param name="DictionaryName">
/// Verbatim dictionary table name from the Tyler schema (e.g.
/// <c>hood_cd_lookup</c>, <c>i_attr_lookup</c>,
/// <c>imprv_det_type_cd_lookup</c>).
/// </param>
/// <param name="KeyColumn">
/// The column that holds the dictionary key (e.g. <c>hood_cd</c>,
/// <c>i_attr_id</c>). Joins to local-table FK columns.
/// </param>
/// <param name="DescriptionColumn">
/// The column that holds the human-readable description for each
/// key (e.g. <c>hood_descr</c>, <c>i_attr_descr</c>).
/// </param>
/// <param name="ValueDomainSize">
/// Declared cardinality of the dictionary if Tyler provides one;
/// <c>null</c> otherwise. Used by readers as a sanity check on
/// loader output (catalog declares 200, loader produced 12 →
/// suspect).
/// </param>
/// <param name="ConversionEra">
/// Aggregate conversion-era flag for the dictionary as a whole.
/// </param>
/// <param name="ProvenancePath">
/// Source schema file path that declared this dictionary. Required
/// by HG6.
/// </param>
public sealed record PacsDictionary(
    string DictionaryName,
    string KeyColumn,
    string DescriptionColumn,
    int? ValueDomainSize,
    PacsConversionEra ConversionEra,
    string ProvenancePath);

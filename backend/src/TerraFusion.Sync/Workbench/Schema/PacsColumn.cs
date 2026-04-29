namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C48-B: typed metadata record for one PACS column within the
/// <c>pacs_schema_catalog</c>. Pure metadata; carries no parcel data
/// (HG1 PII-free). County-agnostic (HG2). Immutable after catalog
/// build (HG3).
///
/// <para>Per <c>docs/sync/pacs-schema-catalog-as-code-policy.md</c>
/// every column carries its declared type, nullability, conversion
/// era (HG5), optional dictionary reference, PII classification, and
/// provenance line back to the source schema file (HG6
/// source-traceable).</para>
///
/// <para>Readers that consult this record MUST branch on
/// <see cref="ConversionEra"/> when their data spans the 2017
/// conversion cut. Readers that surface column data on PII-free
/// canonical landing rows MUST refuse columns classified as
/// <see cref="PiiClassification.Direct"/>.</para>
/// </summary>
/// <param name="TableName">
/// PACS table this column belongs to. Pairs with <see cref="ColumnName"/>
/// to form the catalog's column lookup key.
/// </param>
/// <param name="ColumnName">
/// Verbatim column name from the PACS schema declaration (e.g.
/// <c>chg_of_owner_id</c>, <c>hood_cd</c>, <c>imprv_det_type_cd</c>).
/// </param>
/// <param name="DeclaredType">
/// PACS-typed declaration as it appears in the schema source
/// (e.g. <c>varchar(10)</c>, <c>numeric(14,2)</c>, <c>datetime</c>,
/// <c>int</c>). Verbatim. The catalog does not normalize across
/// dialects.
/// </param>
/// <param name="Nullable">
/// Whether the column is declared NULLable in the source schema.
/// </param>
/// <param name="ConversionEra">
/// Per-column conversion-era flag. <see cref="PacsConversionEra.Unknown"/>
/// when the conversion manifest does not declare this column.
/// </param>
/// <param name="DictionaryRef">
/// Dictionary the column foreign-keys into, if any. <c>null</c> for
/// columns that are not enum-coded.
/// </param>
/// <param name="PiiClassification">
/// Per-column PII sensitivity. Authoritative for this column.
/// </param>
/// <param name="ProvenanceLine">
/// Source schema file path plus line/section identifier that
/// declared this column. Required by HG6.
/// </param>
/// <param name="Notes">
/// Operator-readable note (verbatim from PACS vendor documentation
/// if present). May be empty. The catalog does not synthesize
/// notes.
/// </param>
public sealed record PacsColumn(
    string TableName,
    string ColumnName,
    string DeclaredType,
    bool Nullable,
    PacsConversionEra ConversionEra,
    PacsDictionaryReference? DictionaryRef,
    PiiClassification PiiClassification,
    string ProvenanceLine,
    string Notes);

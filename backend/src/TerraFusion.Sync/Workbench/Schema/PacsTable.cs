using System.Collections.Generic;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C48-B: typed metadata record for one PACS table within the
/// <c>pacs_schema_catalog</c>. Pure metadata; carries no parcel data
/// (HG1 PII-free). County-agnostic (HG2 — no <c>CountyId</c> field).
/// Constructed at catalog build time from the parsed PACS schema
/// files (Harris PACS in the operator's environment; the catalog is
/// vendor-agnostic by design). Immutable thereafter (HG3 read-only
/// at runtime).
///
/// <para>Per <c>docs/sync/pacs-schema-catalog-as-code-policy.md</c>
/// the table record exposes its identity tuple, dictionary
/// references, conversion era, PII classification, and provenance
/// path back to the source schema file (HG6 source-traceable).</para>
/// </summary>
/// <param name="TableName">
/// PACS table name (e.g. <c>imprv</c>, <c>sale</c>,
/// <c>chg_of_owner</c>). Verbatim from the PACS schema file.
/// </param>
/// <param name="IdentityTuple">
/// Ordered list of column names that uniquely identify a row in this
/// table. May be a single column or a composite. Used by canonical
/// transforms to produce stable canonical-row keys.
/// </param>
/// <param name="ConversionEra">
/// Aggregate conversion-era flag for the table as a whole. Individual
/// columns may carry their own (more specific) era; this is the
/// table-level summary derived from the conversion manifest.
/// </param>
/// <param name="DictionaryReferences">
/// Foreign-key relationships from columns on this table into PACS
/// dictionary tables. Each reference names the local column, the
/// dictionary table, and the dictionary key column.
/// </param>
/// <param name="PiiClassification">
/// Aggregate PII sensitivity for the table as a whole. Per-column
/// classifications on <see cref="PacsColumn"/> are authoritative for
/// individual columns; this is the table-level summary.
/// </param>
/// <param name="ProvenancePath">
/// Source schema file path (and optional section identifier) that
/// declared this table. Required by HG6.
/// </param>
/// <param name="ForeignKeys">
/// Slice C49-FK-B: foreign-key edges whose <c>SourceTable</c>
/// matches this table's name. Empty when the table declares no FKs;
/// never null. Each element carries an explicit
/// <see cref="PacsForeignKey.Confidence"/> level so consumers can
/// distinguish engine-declared edges from advisory-only inferred
/// ones (HG-FK-1 / HG-FK-2 from the C49-FK-A policy).
/// </param>
public sealed record PacsTable(
    string TableName,
    IReadOnlyList<string> IdentityTuple,
    PacsConversionEra ConversionEra,
    IReadOnlyList<PacsDictionaryReference> DictionaryReferences,
    PiiClassification PiiClassification,
    string ProvenancePath,
    IReadOnlyList<PacsForeignKey> ForeignKeys);

/// <summary>
/// Slice C48-B: foreign-key relationship from a local PACS column
/// into a PACS dictionary table. Used by readers to mechanically
/// decode enum-coded columns (e.g. <c>hood_cd</c> →
/// <c>hood_cd_lookup</c>) without hardcoding the lookup shape.
/// </summary>
/// <param name="LocalColumn">
/// The column on the local table that holds the dictionary key.
/// </param>
/// <param name="DictionaryTable">
/// The dictionary table name (e.g. <c>hood_cd_lookup</c>).
/// </param>
/// <param name="DictionaryKeyColumn">
/// The key column on the dictionary table (typically matches
/// <see cref="LocalColumn"/> by name; explicitly declared so the
/// catalog does not infer).
/// </param>
public sealed record PacsDictionaryReference(
    string LocalColumn,
    string DictionaryTable,
    string DictionaryKeyColumn);

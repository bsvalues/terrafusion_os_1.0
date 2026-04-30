using System.Collections.Generic;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C49-FK-B: typed metadata record for one foreign-key edge in
/// the <c>pacs_schema_catalog</c>. Pure metadata; carries no parcel
/// data (HG1 PII-free). County-agnostic (HG2). Immutable after
/// catalog build (HG3).
///
/// <para>Per <c>docs/sync/pacs-schema-foreign-key-inference-policy.md</c>:
/// composite-aware via ordinal-stable <see cref="SourceColumns"/> /
/// <see cref="TargetColumns"/> lists; every record carries an
/// explicit <see cref="Confidence"/> level so consumers can refuse
/// inferred edges where referential correctness matters
/// (HG-FK-2 advisory-only rule).</para>
/// </summary>
/// <param name="ConstraintName">
/// Verbatim FK constraint name from the source. <c>null</c> for
/// <see cref="PacsForeignKeyConfidence.InferredByName"/> edges (no
/// engine-side constraint to name).
/// </param>
/// <param name="SourceTable">
/// Table holding the FK column(s). Must reference an existing
/// <see cref="PacsTable"/>; the catalog refuses to build with
/// dangling source-table references (HG7 + the dangling-table
/// guard in C49-FK-A).
/// </param>
/// <param name="SourceColumns">
/// Ordered list of column names on <see cref="SourceTable"/> that
/// participate in the FK. Single-column for typical edges;
/// composite for multi-column FKs. Order matches
/// <see cref="TargetColumns"/> by position. Every column MUST
/// reference an existing <see cref="PacsColumn"/> on
/// <see cref="SourceTable"/>; dangling-column references are
/// refused at catalog construction.
/// </param>
/// <param name="TargetTable">
/// Table this FK references. Must reference an existing
/// <see cref="PacsTable"/>; same dangling-table guard as
/// <see cref="SourceTable"/>.
/// </param>
/// <param name="TargetColumns">
/// Ordered list of column names on <see cref="TargetTable"/>.
/// Same arity as <see cref="SourceColumns"/>; mismatch is rejected
/// at catalog construction.
/// </param>
/// <param name="ProvenanceSource">
/// Where the FK record came from. Drives confidence level and the
/// <c>TryGetDeclaredForeignKeysFor</c> filter.
/// </param>
/// <param name="ProvenancePath">
/// Source identifier (e.g. SQL-Server live introspection key,
/// export-file path, heuristic descriptor). Required to be
/// non-empty by HG6 (source-traceable) and the C49-FK-A policy.
/// </param>
/// <param name="Confidence">
/// One of <see cref="PacsForeignKeyConfidence"/>. Determines whether
/// downstream readers may rely on this FK for referential
/// correctness.
/// </param>
/// <param name="ConversionEra">
/// Conversion-era flag for the FK as a whole. Defaults to
/// <see cref="PacsConversionEra.Both"/>; the C50 conversion
/// manifest may override per-FK in a future slice.
/// </param>
public sealed record PacsForeignKey(
    string? ConstraintName,
    string SourceTable,
    IReadOnlyList<string> SourceColumns,
    string TargetTable,
    IReadOnlyList<string> TargetColumns,
    PacsForeignKeySource ProvenanceSource,
    string ProvenancePath,
    PacsForeignKeyConfidence Confidence,
    PacsConversionEra ConversionEra);

/// <summary>
/// Slice C49-FK-B: confidence level for a <see cref="PacsForeignKey"/>.
/// Per the C49-FK-A policy doc:
/// <list type="bullet">
/// <item><see cref="Declared"/> — engine-enforced FK
/// (<c>INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS</c> or
/// <c>sys.foreign_keys</c>). Joining is referentially correct.</item>
/// <item><see cref="Exported"/> — operator-supplied artifact
/// (export file). Authoritative documentation but the live engine
/// does not enforce it.</item>
/// <item><see cref="InferredByName"/> — name-matching heuristic
/// derived from the C48-F dictionary inference + C48-P column-name
/// rules. Advisory only. Per HG-FK-2: no transform, dictionary
/// loader, canonical writer, or comp consumer may take a runtime
/// decision based on an InferredByName edge unless explicitly
/// promoted via the C49-FK-PROMOTE-* path.</item>
/// </list>
/// </summary>
public enum PacsForeignKeyConfidence
{
    InferredByName = 0,
    Exported       = 1,
    Declared       = 2,
}

/// <summary>
/// Slice C49-FK-B: where the FK record came from. Tracked alongside
/// <see cref="PacsForeignKeyConfidence"/> so diagnostic surfaces can
/// surface the underlying source independently of the trust level
/// it implies.
/// </summary>
public enum PacsForeignKeySource
{
    /// <summary>
    /// Read from <c>INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS</c> +
    /// <c>KEY_COLUMN_USAGE</c>. Cross-engine portable. Implies
    /// <see cref="PacsForeignKeyConfidence.Declared"/>.
    /// </summary>
    InformationSchema = 0,

    /// <summary>
    /// Read from <c>sys.foreign_keys</c> + <c>sys.foreign_key_columns</c>.
    /// SQL Server specific. Implies
    /// <see cref="PacsForeignKeyConfidence.Declared"/>.
    /// </summary>
    SysCatalog = 1,

    /// <summary>
    /// Read from an operator-supplied export file. Implies
    /// <see cref="PacsForeignKeyConfidence.Exported"/>.
    /// </summary>
    ExportFile = 2,

    /// <summary>
    /// Produced by the C49-FK-B name-matching pass against the
    /// C48-F dictionary list. Implies
    /// <see cref="PacsForeignKeyConfidence.InferredByName"/>.
    /// </summary>
    Heuristic = 3,
}

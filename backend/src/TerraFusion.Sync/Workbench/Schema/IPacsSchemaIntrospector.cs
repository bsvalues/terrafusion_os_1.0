using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C48-C: low-level abstraction that reads raw schema metadata
/// from a connected database. Produces flat introspected-row records;
/// translation into typed <see cref="PacsTable"/> /
/// <see cref="PacsColumn"/> records is the responsibility of
/// <see cref="LivePacsSchemaSource"/>.
///
/// <para>The split exists so the SQL-dialect-specific layer
/// (<see cref="SqlInformationSchemaIntrospector"/> for SQL Server
/// today; potentially Postgres / SQLite / other CAMA-vendor dialects
/// in the future) can be swapped without touching the catalog
/// translation logic. Tests of the live source use a fake
/// introspector and never need a real database connection.</para>
///
/// <para>Per the C48-A "Source / target model (binding)" section,
/// this interface implementations MUST read from the **legacy
/// source database** (Harris PACS 9.0 in Benton's environment) —
/// never from TerraFusion DB. PACS is the source; TerraFusion DB
/// is the destination. Confusing the two would invert the
/// conversion arrow.</para>
/// </summary>
public interface IPacsSchemaIntrospector
{
    /// <summary>
    /// Reads tables, columns, and primary-key membership from the
    /// connected legacy source database. Implementations MUST honor
    /// the catalog's downstream hard guards even at the introspection
    /// layer:
    /// <list type="bullet">
    /// <item>HG1 PII-free: do not load any row data, only schema
    /// metadata (table names, column names, types, nullability,
    /// PK membership).</item>
    /// <item>HG2 county-agnostic: PACS schema is the same across
    /// installs; do not embed any per-county filter beyond schema
    /// scoping (e.g. <c>dbo</c>).</item>
    /// </list>
    /// </summary>
    Task<PacsSchemaIntrospectionResult> ReadAsync(CancellationToken ct);
}

/// <summary>
/// Slice C48-C: snapshot returned by <see cref="IPacsSchemaIntrospector.ReadAsync"/>.
/// Three flat lists; <see cref="LivePacsSchemaSource"/> joins them
/// by table name to produce typed catalog records.
/// </summary>
/// <param name="Tables">All base tables in the introspected schema.</param>
/// <param name="Columns">All columns across those tables.</param>
/// <param name="PrimaryKeys">Primary-key column membership (one row per (table, pk-column) pair, in ordinal order).</param>
/// <param name="ForeignKeys">
/// Slice C49-FK-B: foreign-key column membership (one row per
/// (constraint, source-column, target-column) tuple, in ordinal
/// order). Implementations producing engine-declared FKs MUST
/// populate this; implementations that don't introspect FKs
/// (e.g. fixture-only or pre-C49 sources) leave it empty. The
/// catalog's FK pass tolerates an empty list.
/// </param>
public sealed record PacsSchemaIntrospectionResult(
    IReadOnlyList<IntrospectedTable> Tables,
    IReadOnlyList<IntrospectedColumn> Columns,
    IReadOnlyList<IntrospectedPrimaryKeyMember> PrimaryKeys,
    IReadOnlyList<IntrospectedForeignKeyMember> ForeignKeys);

/// <summary>
/// Slice C49-FK-B: one (constraint, source-column → target-column)
/// pair from a foreign-key introspection. Composite FKs produce
/// multiple rows for the same constraint with distinct
/// <see cref="OrdinalPosition"/> values, allowing the catalog to
/// reconstruct the ordered column lists per
/// <see cref="PacsForeignKey"/>.
/// </summary>
/// <param name="ConstraintName">
/// FK constraint name from the source. Required (engine-declared
/// FKs always carry a name).
/// </param>
/// <param name="SourceTable">Table holding the FK column.</param>
/// <param name="SourceColumn">Column on the source table participating in the FK.</param>
/// <param name="TargetTable">Referenced table.</param>
/// <param name="TargetColumn">Referenced column on the target table.</param>
/// <param name="OrdinalPosition">1-based position within a composite key; 1 for single-column FKs.</param>
public sealed record IntrospectedForeignKeyMember(
    string ConstraintName,
    string SourceTable,
    string SourceColumn,
    string TargetTable,
    string TargetColumn,
    int OrdinalPosition);

/// <summary>
/// Slice C48-C: one base table observed by the introspector.
/// </summary>
/// <param name="TableName">Verbatim table name from the source DB.</param>
public sealed record IntrospectedTable(string TableName);

/// <summary>
/// Slice C48-C: one column observed by the introspector. Mirrors the
/// SQL Server <c>INFORMATION_SCHEMA.COLUMNS</c> shape (with
/// equivalent Postgres / SQLite mappings as future dialects land).
/// </summary>
/// <param name="TableName">Owning table.</param>
/// <param name="ColumnName">Verbatim column name.</param>
/// <param name="DataType">Verbatim data type as declared in the source schema (e.g. <c>varchar</c>, <c>numeric</c>, <c>datetime</c>).</param>
/// <param name="Nullable">Whether the column is declared NULLable.</param>
/// <param name="OrdinalPosition">1-based ordinal position from the source schema; used to preserve declaration order.</param>
public sealed record IntrospectedColumn(
    string TableName,
    string ColumnName,
    string DataType,
    bool Nullable,
    int OrdinalPosition);

/// <summary>
/// Slice C48-C: one (table, pk-column) pair, ordered. Composite
/// primary keys produce multiple rows for the same table with
/// distinct <see cref="OrdinalPosition"/> values.
/// </summary>
/// <param name="TableName">Owning table.</param>
/// <param name="ColumnName">Column participating in the primary key.</param>
/// <param name="OrdinalPosition">1-based position within the composite key.</param>
public sealed record IntrospectedPrimaryKeyMember(
    string TableName,
    string ColumnName,
    int OrdinalPosition);

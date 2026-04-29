using System.Collections.Generic;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C48-B: read-only metadata surface for the
/// <c>pacs_schema_catalog</c>. Per
/// <c>docs/sync/pacs-schema-catalog-as-code-policy.md</c> the catalog
/// is constructed once at startup from an
/// <see cref="IPacsSchemaSource"/>, registered as a DI singleton,
/// and consumed by Sync readers / transforms / dictionary loaders.
///
/// <para>Hard guards encoded at this interface layer:</para>
/// <list type="bullet">
/// <item>HG3 read-only at runtime: no mutation methods.</item>
/// <item>HG4 versioned: <see cref="Version"/> uniquely identifies
/// the materialized catalog.</item>
/// <item>HG7 failure surfaces explicitly: lookup methods return
/// <see cref="PacsSchemaLookupResult{T}"/>, never <c>null</c>.</item>
/// </list>
/// </summary>
public interface IPacsSchemaCatalog
{
    /// <summary>
    /// Version stamp uniquely identifying this materialized catalog.
    /// Stable for the lifetime of the catalog instance (HG3).
    /// </summary>
    PacsSchemaVersion Version { get; }

    /// <summary>
    /// Coverage summary: counts of tables, columns, and dictionaries
    /// the catalog holds. Used by the health-check coverage gate
    /// (per the C48-A C48-B contract preview point 7) to surface a
    /// quantitative signal that startup parsing succeeded.
    /// </summary>
    PacsSchemaCatalogCoverage Coverage { get; }

    /// <summary>
    /// All tables in the catalog. Read-only; safe to enumerate
    /// concurrently. Order is stable across calls but not
    /// guaranteed to match source-file declaration order — callers
    /// requiring deterministic ordering MUST sort by
    /// <see cref="PacsTable.TableName"/>.
    /// </summary>
    IReadOnlyCollection<PacsTable> Tables { get; }

    /// <summary>
    /// All columns in the catalog. Read-only.
    /// </summary>
    IReadOnlyCollection<PacsColumn> Columns { get; }

    /// <summary>
    /// All dictionaries in the catalog. Read-only.
    /// </summary>
    IReadOnlyCollection<PacsDictionary> Dictionaries { get; }

    /// <summary>
    /// Looks up a single PACS table by name. Returns a typed
    /// not-found result on miss (HG7), never <c>null</c>.
    /// </summary>
    /// <param name="tableName">
    /// PACS table name. Case-sensitive — PACS schema names are
    /// lower_snake_case and the catalog reflects that verbatim.
    /// </param>
    PacsSchemaLookupResult<PacsTable> TryGetTable(string tableName);

    /// <summary>
    /// Looks up a single PACS column by (table, column) pair.
    /// Returns a typed not-found result on miss (HG7).
    /// </summary>
    /// <param name="tableName">PACS table name.</param>
    /// <param name="columnName">PACS column name.</param>
    PacsSchemaLookupResult<PacsColumn> TryGetColumn(string tableName, string columnName);

    /// <summary>
    /// Looks up a single PACS column by (table, column) pair, with
    /// a caller-declared <c>RequireEra</c> assertion. Returns a
    /// typed mismatch result if the column's recorded era is
    /// incompatible with the requirement (HG5 + HG7). The
    /// <see cref="PacsConversionEra.Both"/> column always satisfies
    /// any requirement.
    /// </summary>
    /// <param name="tableName">PACS table name.</param>
    /// <param name="columnName">PACS column name.</param>
    /// <param name="requireEra">
    /// The era the caller is operating in (e.g. a reader processing
    /// post-2017 sales data passes <see cref="PacsConversionEra.Post2017"/>).
    /// </param>
    PacsSchemaLookupResult<PacsColumn> TryGetColumnForEra(
        string tableName,
        string columnName,
        PacsConversionEra requireEra);

    /// <summary>
    /// Looks up a single PACS dictionary by name. Returns a typed
    /// not-found result on miss (HG7).
    /// </summary>
    /// <param name="dictionaryName">Dictionary table name.</param>
    PacsSchemaLookupResult<PacsDictionary> TryGetDictionary(string dictionaryName);
}

/// <summary>
/// Slice C48-B: coverage summary for an <see cref="IPacsSchemaCatalog"/>.
/// Quantitative signal used by the health-check coverage gate.
/// </summary>
/// <param name="TableCount">Number of tables in the catalog.</param>
/// <param name="ColumnCount">Number of columns in the catalog.</param>
/// <param name="DictionaryCount">Number of dictionaries in the catalog.</param>
public readonly record struct PacsSchemaCatalogCoverage(
    int TableCount,
    int ColumnCount,
    int DictionaryCount);

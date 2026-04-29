using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C48-B: in-process implementation of
/// <see cref="IPacsSchemaCatalog"/>. Constructed once at startup via
/// <see cref="BuildAsync"/>, registered as a DI singleton, never
/// mutated thereafter (HG3 read-only at runtime).
///
/// <para>The catalog wraps four indexed views over the parsed
/// source data: a table index keyed by <c>TableName</c>, a column
/// index keyed by <c>(TableName, ColumnName)</c>, a dictionary index
/// keyed by <c>DictionaryName</c>, and a flat list of each. All
/// indexes are <see cref="IReadOnlyDictionary{TKey, TValue}"/> /
/// <see cref="IReadOnlyCollection{T}"/> so the public surface
/// cannot be mutated through downcast.</para>
///
/// <para>Construction-time validation enforces:</para>
/// <list type="bullet">
/// <item>HG6: every record carries a non-empty provenance path /
/// line. A blank provenance triggers
/// <see cref="InvalidOperationException"/>.</item>
/// <item>Internal integrity: every <see cref="PacsColumn.TableName"/>
/// references an existing <see cref="PacsTable"/>. Dangling columns
/// triggers <see cref="InvalidOperationException"/>.</item>
/// <item>HG7: empty source produces an explicit empty-coverage
/// catalog rather than a silent partial one. Callers detect this
/// via the health-check coverage gate.</item>
/// </list>
/// </summary>
public sealed class PacsSchemaCatalog : IPacsSchemaCatalog
{
    private readonly IReadOnlyDictionary<string, PacsTable> _tablesByName;
    private readonly IReadOnlyDictionary<(string TableName, string ColumnName), PacsColumn> _columnsByKey;
    private readonly IReadOnlyDictionary<string, PacsDictionary> _dictionariesByName;

    private PacsSchemaCatalog(
        IReadOnlyDictionary<string, PacsTable> tablesByName,
        IReadOnlyDictionary<(string, string), PacsColumn> columnsByKey,
        IReadOnlyDictionary<string, PacsDictionary> dictionariesByName,
        PacsSchemaVersion version)
    {
        _tablesByName = tablesByName;
        _columnsByKey = columnsByKey;
        _dictionariesByName = dictionariesByName;
        Version = version;
    }

    /// <inheritdoc />
    public PacsSchemaVersion Version { get; }

    /// <inheritdoc />
    public PacsSchemaCatalogCoverage Coverage => new(
        TableCount: _tablesByName.Count,
        ColumnCount: _columnsByKey.Count,
        DictionaryCount: _dictionariesByName.Count);

    /// <inheritdoc />
    public IReadOnlyCollection<PacsTable> Tables => (IReadOnlyCollection<PacsTable>)_tablesByName.Values;

    /// <inheritdoc />
    public IReadOnlyCollection<PacsColumn> Columns => (IReadOnlyCollection<PacsColumn>)_columnsByKey.Values;

    /// <inheritdoc />
    public IReadOnlyCollection<PacsDictionary> Dictionaries => (IReadOnlyCollection<PacsDictionary>)_dictionariesByName.Values;

    /// <inheritdoc />
    public PacsSchemaLookupResult<PacsTable> TryGetTable(string tableName)
    {
        if (string.IsNullOrEmpty(tableName))
        {
            return PacsSchemaLookupResult<PacsTable>.Miss(PacsSchemaLookupResult<PacsTable>.ReasonNotFound);
        }

        return _tablesByName.TryGetValue(tableName, out var table)
            ? PacsSchemaLookupResult<PacsTable>.Found(table)
            : PacsSchemaLookupResult<PacsTable>.Miss(PacsSchemaLookupResult<PacsTable>.ReasonNotFound);
    }

    /// <inheritdoc />
    public PacsSchemaLookupResult<PacsColumn> TryGetColumn(string tableName, string columnName)
    {
        if (string.IsNullOrEmpty(tableName) || string.IsNullOrEmpty(columnName))
        {
            return PacsSchemaLookupResult<PacsColumn>.Miss(PacsSchemaLookupResult<PacsColumn>.ReasonNotFound);
        }

        return _columnsByKey.TryGetValue((tableName, columnName), out var column)
            ? PacsSchemaLookupResult<PacsColumn>.Found(column)
            : PacsSchemaLookupResult<PacsColumn>.Miss(PacsSchemaLookupResult<PacsColumn>.ReasonNotFound);
    }

    /// <inheritdoc />
    public PacsSchemaLookupResult<PacsColumn> TryGetColumnForEra(
        string tableName,
        string columnName,
        PacsConversionEra requireEra)
    {
        var hit = TryGetColumn(tableName, columnName);
        if (!hit.HasValue || hit.Value is null)
        {
            return hit;
        }

        var column = hit.Value;

        // Both is universally compatible.
        if (column.ConversionEra == PacsConversionEra.Both)
        {
            return hit;
        }

        // Unknown is ambiguous — caller cannot satisfy era requirement.
        if (column.ConversionEra == PacsConversionEra.Unknown)
        {
            return PacsSchemaLookupResult<PacsColumn>.Miss(
                PacsSchemaLookupResult<PacsColumn>.ReasonAmbiguousConversionEra);
        }

        // Pre2017 caller cannot read Post2017-only column, and vice versa.
        if (column.ConversionEra != requireEra)
        {
            return PacsSchemaLookupResult<PacsColumn>.Miss(
                PacsSchemaLookupResult<PacsColumn>.ReasonConversionEraMismatch);
        }

        return hit;
    }

    /// <inheritdoc />
    public PacsSchemaLookupResult<PacsDictionary> TryGetDictionary(string dictionaryName)
    {
        if (string.IsNullOrEmpty(dictionaryName))
        {
            return PacsSchemaLookupResult<PacsDictionary>.Miss(PacsSchemaLookupResult<PacsDictionary>.ReasonNotFound);
        }

        return _dictionariesByName.TryGetValue(dictionaryName, out var dict)
            ? PacsSchemaLookupResult<PacsDictionary>.Found(dict)
            : PacsSchemaLookupResult<PacsDictionary>.Miss(PacsSchemaLookupResult<PacsDictionary>.ReasonNotFound);
    }

    /// <summary>
    /// Constructs the catalog from a source. Performs construction-
    /// time validation per the class-level summary; throws
    /// <see cref="InvalidOperationException"/> on validation failure.
    /// Throws <see cref="ArgumentNullException"/> if
    /// <paramref name="source"/> is null.
    /// </summary>
    public static async Task<PacsSchemaCatalog> BuildAsync(IPacsSchemaSource source, CancellationToken ct)
    {
        if (source is null)
        {
            throw new ArgumentNullException(nameof(source));
        }

        var data = await source.ReadAsync(ct).ConfigureAwait(false);
        if (data is null)
        {
            throw new InvalidOperationException(
                "[PacsSchemaCatalog] Source returned null PacsSchemaSourceData; refusing to build a silently empty catalog (HG7).");
        }

        // HG6: enforce non-empty provenance on every record.
        ValidateProvenance(data);

        // Internal integrity: every column references an existing table.
        var tableNameSet = new HashSet<string>(data.Tables.Select(t => t.TableName), StringComparer.Ordinal);
        var dangling = data.Columns.FirstOrDefault(c => !tableNameSet.Contains(c.TableName));
        if (dangling is not null)
        {
            throw new InvalidOperationException(
                $"[PacsSchemaCatalog] Column '{dangling.TableName}.{dangling.ColumnName}' references a table not declared by the source. " +
                "Catalog refuses to build with dangling column references.");
        }

        // Build indexes. ToDictionary throws on duplicate keys, which we want — duplicates indicate source corruption.
        IReadOnlyDictionary<string, PacsTable> tablesByName;
        try
        {
            tablesByName = data.Tables.ToDictionary(t => t.TableName, StringComparer.Ordinal);
        }
        catch (ArgumentException ex)
        {
            throw new InvalidOperationException(
                "[PacsSchemaCatalog] Duplicate table names in source. Catalog refuses to build with duplicate keys.",
                ex);
        }

        IReadOnlyDictionary<(string, string), PacsColumn> columnsByKey;
        try
        {
            columnsByKey = data.Columns.ToDictionary(
                c => (c.TableName, c.ColumnName));
        }
        catch (ArgumentException ex)
        {
            throw new InvalidOperationException(
                "[PacsSchemaCatalog] Duplicate (table, column) pairs in source. Catalog refuses to build with duplicate keys.",
                ex);
        }

        IReadOnlyDictionary<string, PacsDictionary> dictionariesByName;
        try
        {
            dictionariesByName = data.Dictionaries.ToDictionary(d => d.DictionaryName, StringComparer.Ordinal);
        }
        catch (ArgumentException ex)
        {
            throw new InvalidOperationException(
                "[PacsSchemaCatalog] Duplicate dictionary names in source. Catalog refuses to build with duplicate keys.",
                ex);
        }

        return new PacsSchemaCatalog(tablesByName, columnsByKey, dictionariesByName, data.Version);
    }

    private static void ValidateProvenance(PacsSchemaSourceData data)
    {
        foreach (var table in data.Tables)
        {
            if (string.IsNullOrWhiteSpace(table.ProvenancePath))
            {
                throw new InvalidOperationException(
                    $"[PacsSchemaCatalog] Table '{table.TableName}' is missing ProvenancePath (HG6). Catalog refuses to build without source traceability.");
            }
        }

        foreach (var column in data.Columns)
        {
            if (string.IsNullOrWhiteSpace(column.ProvenanceLine))
            {
                throw new InvalidOperationException(
                    $"[PacsSchemaCatalog] Column '{column.TableName}.{column.ColumnName}' is missing ProvenanceLine (HG6). Catalog refuses to build without source traceability.");
            }
        }

        foreach (var dict in data.Dictionaries)
        {
            if (string.IsNullOrWhiteSpace(dict.ProvenancePath))
            {
                throw new InvalidOperationException(
                    $"[PacsSchemaCatalog] Dictionary '{dict.DictionaryName}' is missing ProvenancePath (HG6). Catalog refuses to build without source traceability.");
            }
        }
    }
}

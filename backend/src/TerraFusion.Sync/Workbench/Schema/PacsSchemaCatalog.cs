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
    private readonly IReadOnlySet<string> _piiExhaustiveTables;
    private readonly bool _piiManifestEngaged;

    private PacsSchemaCatalog(
        IReadOnlyDictionary<string, PacsTable> tablesByName,
        IReadOnlyDictionary<(string, string), PacsColumn> columnsByKey,
        IReadOnlyDictionary<string, PacsDictionary> dictionariesByName,
        PacsSchemaVersion version,
        bool piiManifestEngaged,
        IReadOnlySet<string> piiExhaustiveTables)
    {
        _tablesByName = tablesByName;
        _columnsByKey = columnsByKey;
        _dictionariesByName = dictionariesByName;
        Version = version;
        _piiManifestEngaged = piiManifestEngaged;
        _piiExhaustiveTables = piiExhaustiveTables;
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

    /// <inheritdoc />
    public PacsSchemaLookupResult<IReadOnlyList<PacsForeignKey>> TryGetDeclaredForeignKeysFor(string tableName)
    {
        var all = TryGetAllForeignKeysFor(tableName);
        if (!all.HasValue || all.Value is null)
        {
            return all;
        }

        // Filter to declared + exported only (HG-FK-1).
        var declared = all.Value
            .Where(fk => fk.Confidence != PacsForeignKeyConfidence.InferredByName)
            .ToList();
        return PacsSchemaLookupResult<IReadOnlyList<PacsForeignKey>>.Found(declared);
    }

    /// <inheritdoc />
    public PacsSchemaLookupResult<IReadOnlyList<PacsForeignKey>> TryGetAllForeignKeysFor(string tableName)
    {
        if (string.IsNullOrEmpty(tableName))
        {
            return PacsSchemaLookupResult<IReadOnlyList<PacsForeignKey>>.Miss(
                PacsSchemaLookupResult<IReadOnlyList<PacsForeignKey>>.ReasonNotFound);
        }

        if (!_tablesByName.TryGetValue(tableName, out var table))
        {
            return PacsSchemaLookupResult<IReadOnlyList<PacsForeignKey>>.Miss(
                PacsSchemaLookupResult<IReadOnlyList<PacsForeignKey>>.ReasonNotFound);
        }

        return PacsSchemaLookupResult<IReadOnlyList<PacsForeignKey>>.Found(table.ForeignKeys);
    }

    /// <inheritdoc />
    public bool PiiManifestEngaged => _piiManifestEngaged;

    /// <inheritdoc />
    public bool IsTableExhaustivelyClassified(string tableName)
    {
        if (!_piiManifestEngaged) return false;
        if (string.IsNullOrEmpty(tableName)) return false;
        return _piiExhaustiveTables.Contains(tableName);
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

        // Slice C49-FK-B integrity: every FK on every PacsTable
        // references an existing source/target table AND every FK
        // column references an existing column on the named table.
        // Refuses dangling FK references at construction.
        var columnsByTableSet = new Dictionary<string, HashSet<string>>(StringComparer.Ordinal);
        foreach (var c in data.Columns)
        {
            if (!columnsByTableSet.TryGetValue(c.TableName, out var set))
            {
                set = new HashSet<string>(StringComparer.Ordinal);
                columnsByTableSet[c.TableName] = set;
            }
            set.Add(c.ColumnName);
        }
        foreach (var table in data.Tables)
        {
            foreach (var fk in table.ForeignKeys)
            {
                if (!tableNameSet.Contains(fk.SourceTable))
                {
                    throw new InvalidOperationException(
                        $"[PacsSchemaCatalog] Foreign key '{fk.ConstraintName ?? "(inferred)"}' on table '{table.TableName}' references a source table '{fk.SourceTable}' not declared by the source. " +
                        "Catalog refuses to build with dangling FK source-table references (C49-FK-A HG-FK).");
                }
                if (!tableNameSet.Contains(fk.TargetTable))
                {
                    throw new InvalidOperationException(
                        $"[PacsSchemaCatalog] Foreign key '{fk.ConstraintName ?? "(inferred)"}' on table '{table.TableName}' references a target table '{fk.TargetTable}' not declared by the source. " +
                        "Catalog refuses to build with dangling FK target-table references (C49-FK-A HG-FK).");
                }
                if (fk.SourceColumns.Count != fk.TargetColumns.Count)
                {
                    throw new InvalidOperationException(
                        $"[PacsSchemaCatalog] Foreign key '{fk.ConstraintName ?? "(inferred)"}' on table '{table.TableName}' has mismatched column arity: " +
                        $"{fk.SourceColumns.Count} source vs {fk.TargetColumns.Count} target. Composite FKs MUST have matching arity.");
                }
                if (columnsByTableSet.TryGetValue(fk.SourceTable, out var srcSet))
                {
                    foreach (var col in fk.SourceColumns)
                    {
                        if (!srcSet.Contains(col))
                        {
                            throw new InvalidOperationException(
                                $"[PacsSchemaCatalog] Foreign key '{fk.ConstraintName ?? "(inferred)"}' references source column '{fk.SourceTable}.{col}' which is not declared. " +
                                "Catalog refuses to build with dangling FK source-column references (C49-FK-A HG-FK).");
                        }
                    }
                }
                if (columnsByTableSet.TryGetValue(fk.TargetTable, out var tgtSet))
                {
                    foreach (var col in fk.TargetColumns)
                    {
                        if (!tgtSet.Contains(col))
                        {
                            throw new InvalidOperationException(
                                $"[PacsSchemaCatalog] Foreign key '{fk.ConstraintName ?? "(inferred)"}' references target column '{fk.TargetTable}.{col}' which is not declared. " +
                                "Catalog refuses to build with dangling FK target-column references (C49-FK-A HG-FK).");
                        }
                    }
                }
            }
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

        // Slice C51-PII-D: derive PII engagement state from the
        // PiiManifest reference passed through PacsSchemaSourceData.
        // null manifest → engaged=false (C51-PII-B legacy bridge);
        // non-null manifest → engaged=true and the exhaustive-flag
        // set is carried verbatim for IsTableExhaustivelyClassified.
        var piiManifestEngaged = data.PiiManifest is not null;
        var piiExhaustiveTables = data.PiiManifest?.TableExhaustiveFlags
            ?? (IReadOnlySet<string>)new HashSet<string>(System.StringComparer.Ordinal);

        return new PacsSchemaCatalog(
            tablesByName, columnsByKey, dictionariesByName, data.Version,
            piiManifestEngaged, piiExhaustiveTables);
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

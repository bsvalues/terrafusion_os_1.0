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
        IReadOnlySet<string> piiExhaustiveTables,
        PacsSchemaInvariantReport invariantReport)
    {
        _tablesByName = tablesByName;
        _columnsByKey = columnsByKey;
        _dictionariesByName = dictionariesByName;
        Version = version;
        _piiManifestEngaged = piiManifestEngaged;
        _piiExhaustiveTables = piiExhaustiveTables;
        InvariantReport = invariantReport;
    }

    /// <summary>
    /// Slice C53-CONS-B: report of invariant evaluation results from
    /// the catalog build. Per the C53-CONS-A policy, this property
    /// is always populated; on a clean catalog the report has zero
    /// Error rows. (When Errors fire, BuildAsync throws before this
    /// instance is returned, so callers reading this property always
    /// see a no-Error report.)
    /// </summary>
    public PacsSchemaInvariantReport InvariantReport { get; }

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

        // Slice C53-CONS-C consolidation: the per-slice integrity
        // checks that previously lived here (C48-B dangling-column,
        // C48-B/HG6 ValidateProvenance, C49-FK-B FK source/target/
        // column / arity checks) have been absorbed into the
        // PacsSchemaInvariantEngine. The engine produces a unified
        // report with stable invariant codes (TBL-003, COL-002,
        // COL-004, FK-002, FK-003, FK-004, DICT-007, etc.) and is
        // the single authority for cross-record consistency.
        //
        // The engine runs FIRST so its unified Error message is the
        // one consumers see when the source is corrupted. The
        // ToDictionary calls below remain as defense-in-depth — they
        // would only fire on duplicate keys the engine somehow missed,
        // and producing a clear error in that path is still valuable.

        // Slice C51-PII-D: derive PII engagement state up-front so
        // it's available for both the engine call and the catalog
        // ctor.
        var piiManifestEngaged = data.PiiManifest is not null;
        var piiExhaustiveTables = data.PiiManifest?.TableExhaustiveFlags
            ?? (IReadOnlySet<string>)new HashSet<string>(System.StringComparer.Ordinal);

        var engine = new PacsSchemaInvariantEngine();
        var report = engine.Evaluate(data.Tables, data.Columns, data.Dictionaries, data.SuppressInvariants);
        if (!report.IsClean)
        {
            var errorList = string.Join(
                "\n  - ",
                report.Errors.Select(e => $"[{e.Code}] {e.Message} (provenance: {e.Provenance})"));
            throw new InvalidOperationException(
                $"[PacsSchemaCatalog] Invariant engine reported {report.Errors.Count()} Error row(s) " +
                $"(invariant set version {report.InvariantSetVersion}). HG7: refusing to build catalog. Errors:\n  - {errorList}");
        }

        // Build indexes. ToDictionary throws on duplicate keys, which
        // would only happen if the engine's TBL-002/COL-003/DICT-002
        // invariants somehow missed them — defense-in-depth.
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

        // C53-CONS-C: piiManifestEngaged / piiExhaustiveTables /
        // engine call were lifted to the top of BuildAsync (see the
        // consolidated block above). The catalog ctor receives the
        // already-computed report.
        return new PacsSchemaCatalog(
            tablesByName, columnsByKey, dictionariesByName, data.Version,
            piiManifestEngaged, piiExhaustiveTables, report);
    }

    // C53-CONS-C: the former private static ValidateProvenance method
    // and the per-slice dangling-column / FK validation blocks were
    // removed in this slice. Their checks are centralized in
    // PacsSchemaInvariantEngine (TBL-003, COL-002, COL-004, FK-002,
    // FK-003, FK-004, DICT-007). The engine now runs at the top of
    // BuildAsync and is the single authority for cross-record
    // catalog consistency.
}

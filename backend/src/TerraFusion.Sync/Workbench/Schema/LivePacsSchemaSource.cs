using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C48-C: <see cref="IPacsSchemaSource"/> implementation that
/// reads schema metadata from the connected legacy source database
/// (Harris PACS 9.0 in Benton's environment) via an
/// <see cref="IPacsSchemaIntrospector"/>, then translates the flat
/// introspection result into typed <see cref="PacsTable"/> /
/// <see cref="PacsColumn"/> records suitable for catalog
/// construction.
///
/// <para>This is the "live" counterpart to
/// <see cref="InMemoryPacsSchemaSource"/>. The split between
/// introspector and source means:</para>
/// <list type="bullet">
/// <item>The introspector handles SQL-dialect-specific I/O.</item>
/// <item>This class handles the translation logic: identity-tuple
/// composition from primary-key rows, default era / PII /
/// dictionary classifications, provenance stamping, ordering.</item>
/// <item>Tests of the translation logic use a fake introspector and
/// require no live DB connection.</item>
/// </list>
///
/// <para>Defaults applied in this slice (future slices may layer
/// inference on top):</para>
/// <list type="bullet">
/// <item><see cref="PacsConversionEra.Both"/> on every record. The
/// 2017 conversion manifest, when supplied by the operator in a
/// future slice, will override per-column.</item>
/// <item><see cref="PiiClassification.None"/> on every record.
/// Operator-supplied PII rules in a future slice will reclassify
/// known sensitive columns (e.g. <c>grantor_cv</c>,
/// <c>owner_addr</c>).</item>
/// <item>Empty <see cref="PacsTable.DictionaryReferences"/> on
/// every <see cref="PacsTable"/>. FK-edge inference (which dictionary
/// table backs which arbitrary FK column) is a separate, harder
/// problem deferred to a future slice — INFORMATION_SCHEMA does not
/// declare these foreign keys explicitly in Harris PACS, so an
/// inference pass needs to walk every <c>*_cd</c> column and try to
/// match it to a same-named code in the inferred dictionary set.
/// Catalog still lists the dictionaries themselves; consumers can
/// resolve FK edges client-side or a future slice can centralize
/// it here.</item>
/// </list>
///
/// <para>Slice C48-F: <see cref="PacsDictionary"/> inference IS
/// applied as of this slice. The heuristic is grounded in real
/// Harris PACS table shapes and is intentionally conservative: a
/// table is inferred as a dictionary if and only if its first
/// column ends in <c>_cd</c> and its second column ends in
/// <c>_desc</c> or <c>_dsc</c>. False-negatives (richer entities
/// with code+desc plus extra columns, like <c>neighborhood</c>)
/// stay un-classified rather than risk false-positives that would
/// have downstream loaders consult bogus dictionaries. Operator
/// overrides for borderline cases are deferred to a future slice.
/// See the
/// <see cref="LivePacsSchemaSourceOptions.InferDictionaries"/>
/// flag.</para>
///
/// <para>Per the C48-A "Source / target model (binding)" section,
/// this source MUST read from the legacy source DB (Harris PACS),
/// never from TerraFusion DB. PACS is the source; TerraFusion DB is
/// the destination.</para>
/// </summary>
public sealed class LivePacsSchemaSource : IPacsSchemaSource
{
    private readonly IPacsSchemaIntrospector _introspector;
    private readonly LivePacsSchemaSourceOptions _options;

    public LivePacsSchemaSource(
        IPacsSchemaIntrospector introspector,
        LivePacsSchemaSourceOptions options)
    {
        _introspector = introspector ?? throw new ArgumentNullException(nameof(introspector));
        _options = options ?? throw new ArgumentNullException(nameof(options));
    }

    /// <inheritdoc />
    public async Task<PacsSchemaSourceData> ReadAsync(CancellationToken ct)
    {
        var introspection = await _introspector.ReadAsync(ct).ConfigureAwait(false);
        if (introspection is null)
        {
            throw new InvalidOperationException(
                "[LivePacsSchemaSource] Introspector returned null result; refusing to build catalog from missing introspection (HG7).");
        }

        // Build column lookup keyed by table name for downstream tuple assembly.
        var columnsByTable = introspection.Columns
            .GroupBy(c => c.TableName, StringComparer.Ordinal)
            .ToDictionary(g => g.Key, g => g.OrderBy(c => c.OrdinalPosition).ToList(), StringComparer.Ordinal);

        // Build primary-key tuples in ordinal order.
        var pkTuplesByTable = introspection.PrimaryKeys
            .GroupBy(pk => pk.TableName, StringComparer.Ordinal)
            .ToDictionary(
                g => g.Key,
                g => (IReadOnlyList<string>)g.OrderBy(pk => pk.OrdinalPosition).Select(pk => pk.ColumnName).ToList(),
                StringComparer.Ordinal);

        // Translate tables.
        var tables = new List<PacsTable>(introspection.Tables.Count);
        foreach (var t in introspection.Tables)
        {
            // Identity tuple: prefer declared PK; fallback to single-column heuristic
            // (a column matching <table_name>_id, otherwise empty).
            IReadOnlyList<string> identityTuple;
            if (pkTuplesByTable.TryGetValue(t.TableName, out var pkTuple) && pkTuple.Count > 0)
            {
                identityTuple = pkTuple;
            }
            else
            {
                var fallback = ResolveFallbackIdentityColumn(t.TableName, columnsByTable);
                identityTuple = fallback is null ? Array.Empty<string>() : new[] { fallback };
            }

            tables.Add(new PacsTable(
                TableName: t.TableName,
                IdentityTuple: identityTuple,
                ConversionEra: PacsConversionEra.Both,
                DictionaryReferences: Array.Empty<PacsDictionaryReference>(),
                PiiClassification: PiiClassification.None,
                ProvenancePath: BuildTableProvenance(t.TableName)));
        }

        // Translate columns.
        var columns = new List<PacsColumn>(introspection.Columns.Count);
        foreach (var c in introspection.Columns)
        {
            columns.Add(new PacsColumn(
                TableName: c.TableName,
                ColumnName: c.ColumnName,
                DeclaredType: c.DataType,
                Nullable: c.Nullable,
                ConversionEra: PacsConversionEra.Both,
                DictionaryRef: null,
                PiiClassification: PiiClassification.None,
                ProvenanceLine: BuildColumnProvenance(c.TableName, c.ColumnName, c.OrdinalPosition),
                Notes: string.Empty));
        }

        // Slice C48-F: dictionary inference. Heuristic grounded in
        // observed Harris PACS shape — see the class-level summary
        // for the full rule. Operator can disable via the
        // InferDictionaries flag if a deployment needs the catalog
        // dictionary list to come exclusively from a future
        // operator-supplied manifest.
        IReadOnlyList<PacsDictionary> dictionaries = _options.InferDictionaries
            ? InferDictionaries(introspection.Tables, columnsByTable)
            : Array.Empty<PacsDictionary>();

        // Version: synthesized from the live snapshot. Source-file
        // hashes are not applicable for live introspection; we record
        // the connection identifier (operator-supplied label) and
        // ingest moment instead.
        var version = new PacsSchemaVersion(
            PacsRelease: _options.PacsReleaseLabel,
            SourceFileHashes: new Dictionary<string, string>
            {
                [BuildSourceLabel()] = "live-introspection-no-hash",
            },
            IngestedAt: DateTime.UtcNow,
            ConversionManifestHash: "no-conversion-manifest-supplied");

        return new PacsSchemaSourceData(tables, columns, dictionaries, version);
    }

    private static string? ResolveFallbackIdentityColumn(
        string tableName,
        IReadOnlyDictionary<string, List<IntrospectedColumn>> columnsByTable)
    {
        if (!columnsByTable.TryGetValue(tableName, out var cols))
        {
            return null;
        }

        // Heuristic: a non-null int column named <table>_id wins.
        // This is a rough fallback for cases where the PK was not
        // declared in the source schema; it is documented as a best-
        // effort guess, not a guarantee.
        var conventional = $"{tableName}_id";
        var match = cols.FirstOrDefault(c =>
            string.Equals(c.ColumnName, conventional, StringComparison.Ordinal));
        return match?.ColumnName;
    }

    private string BuildTableProvenance(string tableName) =>
        $"live-introspection://{_options.SourceLabel}/{_options.SchemaName}/{tableName}";

    private string BuildColumnProvenance(string tableName, string columnName, int ordinal) =>
        $"live-introspection://{_options.SourceLabel}/{_options.SchemaName}/{tableName}.{columnName}@{ordinal}";

    private string BuildSourceLabel() =>
        $"live-introspection://{_options.SourceLabel}/{_options.SchemaName}";

    /// <summary>
    /// Slice C48-F: dictionary-table inference. Walks the
    /// introspected tables and produces a <see cref="PacsDictionary"/>
    /// record for every table that matches the conservative
    /// classic-dictionary shape: first column ends in <c>_cd</c>
    /// AND second column ends in <c>_desc</c> or <c>_dsc</c>.
    /// Heuristic grounded in observed Harris PACS shape (e.g.
    /// <c>imprv_det_class</c> → <c>imprv_det_class_cd</c> +
    /// <c>imprv_det_cls_desc</c>).
    /// <para>Conservative on purpose: rich entities like
    /// <c>neighborhood</c> (which carries a code column plus year /
    /// name / percent columns) deliberately do NOT match. Better to
    /// miss a borderline dictionary than to mis-classify a richer
    /// table and have downstream loaders consult bogus
    /// dictionaries. Operator overrides for borderline cases are
    /// deferred to a future slice.</para>
    /// </summary>
    private IReadOnlyList<PacsDictionary> InferDictionaries(
        IReadOnlyList<IntrospectedTable> tables,
        IReadOnlyDictionary<string, List<IntrospectedColumn>> columnsByTable)
    {
        var result = new List<PacsDictionary>();
        foreach (var t in tables)
        {
            if (!columnsByTable.TryGetValue(t.TableName, out var cols) || cols.Count < 2)
            {
                continue;
            }

            var first = cols[0];
            var second = cols[1];

            if (!IsCodeColumnName(first.ColumnName))
            {
                continue;
            }

            if (!IsDescriptionColumnName(second.ColumnName))
            {
                continue;
            }

            result.Add(new PacsDictionary(
                DictionaryName: t.TableName,
                KeyColumn: first.ColumnName,
                DescriptionColumn: second.ColumnName,
                ValueDomainSize: null,
                ConversionEra: PacsConversionEra.Both,
                ProvenancePath: BuildTableProvenance(t.TableName)));
        }
        return result;
    }

    private static bool IsCodeColumnName(string columnName) =>
        columnName.EndsWith("_cd", StringComparison.OrdinalIgnoreCase);

    private static bool IsDescriptionColumnName(string columnName) =>
        columnName.EndsWith("_desc", StringComparison.OrdinalIgnoreCase) ||
        columnName.EndsWith("_dsc", StringComparison.OrdinalIgnoreCase);
}

/// <summary>
/// Slice C48-C: configuration for <see cref="LivePacsSchemaSource"/>.
/// The label fields are PII-free and operator-tunable; they only
/// influence the generated provenance strings (HG6) and the
/// version-stamp release identifier (HG4).
/// </summary>
/// <param name="SourceLabel">
/// Short operator-friendly label identifying the source DB (e.g.
/// <c>"benton-pacs-prod"</c>). Surfaces in provenance strings on
/// every catalog record. MUST NOT contain credentials.
/// </param>
/// <param name="SchemaName">
/// SQL schema scope (e.g. <c>"dbo"</c> for SQL Server / Harris
/// PACS). Surfaces in provenance strings.
/// </param>
/// <param name="PacsReleaseLabel">
/// Optional human label for the PACS release at the time of
/// introspection (e.g. <c>"Harris PACS 9.0.4.2"</c>); <c>null</c>
/// when not declared by the operator. Surfaces in
/// <see cref="PacsSchemaVersion.PacsRelease"/>.
/// </param>
/// <param name="InferDictionaries">
/// Slice C48-F: when <c>true</c> (default), the live source applies
/// the conservative dictionary-table inference heuristic (first
/// column ends in <c>_cd</c> AND second column ends in <c>_desc</c>
/// or <c>_dsc</c>) to populate <see cref="PacsSchemaSourceData.Dictionaries"/>.
/// When <c>false</c>, the dictionary list is empty and dictionaries
/// must be supplied by a future operator-config or manifest layer.
/// </param>
public sealed record LivePacsSchemaSourceOptions(
    string SourceLabel,
    string SchemaName,
    string? PacsReleaseLabel,
    bool InferDictionaries = true)
{
    /// <summary>
    /// Sensible default for SQL Server / Harris PACS:
    /// <c>SchemaName = "dbo"</c>, with caller-supplied label.
    /// Dictionary inference enabled by default.
    /// </summary>
    public static LivePacsSchemaSourceOptions ForBentonHarrisPacs(string sourceLabel) =>
        new(sourceLabel, "dbo", PacsReleaseLabel: null, InferDictionaries: true);
}

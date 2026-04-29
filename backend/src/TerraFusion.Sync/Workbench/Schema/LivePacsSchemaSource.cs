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
/// <item>Empty <see cref="PacsTable.DictionaryReferences"/>; no
/// dictionaries produced. Dictionary inference (which lookup
/// tables back which FK columns) is a future slice that will
/// consult naming conventions or operator config.</item>
/// </list>
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

        // Dictionaries: empty in this slice; inference deferred.
        var dictionaries = (IReadOnlyList<PacsDictionary>)Array.Empty<PacsDictionary>();

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
public sealed record LivePacsSchemaSourceOptions(
    string SourceLabel,
    string SchemaName,
    string? PacsReleaseLabel)
{
    /// <summary>
    /// Sensible default for SQL Server / Harris PACS:
    /// <c>SchemaName = "dbo"</c>, with caller-supplied label.
    /// </summary>
    public static LivePacsSchemaSourceOptions ForBentonHarrisPacs(string sourceLabel) =>
        new(sourceLabel, "dbo", PacsReleaseLabel: null);
}

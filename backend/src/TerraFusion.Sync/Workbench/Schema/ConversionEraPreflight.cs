using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C50-CONV-D: default <see cref="IConversionEraPreflight"/>
/// implementation. Pure function over the catalog state — no I/O,
/// no caching, no logging. The caller is responsible for translating
/// <see cref="ConversionEraPreflightOutcome.Fail"/> into a thrown
/// exception per the C50-CONV-C policy.
///
/// <para>Hard guards observed:</para>
/// <list type="bullet">
/// <item>HG-CONV-2: <see cref="PacsConversionEra.Unknown"/> is treated
/// as a sentinel; never silently aliased to Both / Post2017 /
/// Pre2017.</item>
/// <item>HG-CONV-3: stance is required, no default; the enum has no
/// Unspecified sentinel and zero / undefined values are rejected at
/// entry.</item>
/// <item>The result type carries the matched era and provenance so
/// the caller can re-emit them verbatim in throws / logs.</item>
/// </list>
///
/// <para>Era resolution: the catalog's
/// <see cref="PacsTable.ConversionEra"/> and
/// <see cref="PacsColumn.ConversionEra"/> are already populated by
/// <see cref="LivePacsSchemaSource"/> from the C50-CONV-B manifest
/// (when engaged) or from the C48-B Both legacy default (when not).
/// The preflight reads those fields and applies the stance × era
/// mapping table from the C50-CONV-C policy.</para>
///
/// <para>Provenance resolution is best-effort: the catalog records
/// the era but not the manifest-source per record. The preflight
/// distinguishes the four C50-CONV-C provenance cases by combining
/// (a) the catalog's <see cref="PacsSchemaVersion.ConversionManifestHash"/>
/// stamp set by C50-CONV-B (literal
/// <c>"no-conversion-manifest-supplied"</c> means manifest not
/// engaged), (b) whether a column lookup succeeded, and (c) whether
/// the resolved era is Unknown. The four cases are documented on
/// <see cref="ConversionEraPreflightProvenance"/>.</para>
/// </summary>
public sealed class ConversionEraPreflight : IConversionEraPreflight
{
    private const string NoManifestStamp = "no-conversion-manifest-supplied";

    /// <inheritdoc />
    public Task<ConversionEraPreflightResult> ValidateAsync(
        IPacsSchemaCatalog catalog,
        string tableName,
        IReadOnlyList<string> columnNames,
        ConversionEraPreflightStance stance,
        CancellationToken ct)
    {
        if (catalog is null)
        {
            throw new ArgumentNullException(nameof(catalog));
        }
        if (string.IsNullOrWhiteSpace(tableName))
        {
            throw new ArgumentException("Table name must be non-empty.", nameof(tableName));
        }
        if (columnNames is null)
        {
            throw new ArgumentNullException(nameof(columnNames));
        }
        if (columnNames.Count == 0)
        {
            throw new ArgumentException("At least one column name is required.", nameof(columnNames));
        }
        if (!Enum.IsDefined(typeof(ConversionEraPreflightStance), stance) || (int)stance == 0)
        {
            // HG-CONV-3: stance must be explicit. Reject 0 / undefined.
            throw new ArgumentException(
                $"Era preflight stance must be explicitly RequirePost2017OrBoth, AllowPre2017, or AllowAny; got '{stance}'. " +
                "Default-on-omission is forbidden by HG-CONV-3.",
                nameof(stance));
        }

        var manifestEngaged = !string.Equals(
            catalog.Version.ConversionManifestHash,
            NoManifestStamp,
            StringComparison.Ordinal);

        // Validate column name shape up front so the worst-era seeding
        // below is safe.
        foreach (var columnName in columnNames)
        {
            if (string.IsNullOrWhiteSpace(columnName))
            {
                throw new ArgumentException("Column names must be non-empty.", nameof(columnNames));
            }
        }

        // Resolve the worst-era cell across all named columns. C50-CONV-C
        // binds the result to a "single combined result that picks the
        // worst era" — Unknown beats Pre2017 beats Both/Post2017.
        // Seed with the first column's resolution so the provenance
        // reflects the actual catalog state, not a default sentinel.
        var (firstEra, firstProvenance) = ResolveEra(catalog, tableName, columnNames[0], manifestEngaged);
        PacsConversionEra worstEra = firstEra;
        ConversionEraPreflightProvenance worstProvenance = firstProvenance;
        string worstColumn = columnNames[0];

        for (int i = 1; i < columnNames.Count; i++)
        {
            var columnName = columnNames[i];
            var (era, provenance) = ResolveEra(catalog, tableName, columnName, manifestEngaged);
            if (IsWorseThan(era, worstEra))
            {
                worstEra = era;
                worstProvenance = provenance;
                worstColumn = columnName;
            }
        }

        // Apply stance × era → outcome per the C50-CONV-C binding table.
        var (outcomeKind, reasonNote) = MapStanceEraToOutcome(stance, worstEra);

        var message = outcomeKind == ConversionEraPreflightOutcome.Pass
            ? string.Empty
            : BuildMessage(outcomeKind, tableName, columnNames, worstColumn, stance, worstEra, worstProvenance, reasonNote);

        var result = outcomeKind switch
        {
            ConversionEraPreflightOutcome.Pass => ConversionEraPreflightResult.Pass(worstEra, worstProvenance),
            ConversionEraPreflightOutcome.Warn => ConversionEraPreflightResult.Warn(message, worstEra, worstProvenance),
            ConversionEraPreflightOutcome.Fail => ConversionEraPreflightResult.Fail(message, worstEra, worstProvenance),
            _ => throw new InvalidOperationException($"Unhandled outcome kind '{outcomeKind}'."),
        };

        return Task.FromResult(result);
    }

    /// <summary>
    /// Resolve era + provenance for one column. Order:
    /// column-lookup first (if found, use its era); otherwise
    /// table-lookup; otherwise Unknown with appropriate provenance.
    /// </summary>
    private static (PacsConversionEra era, ConversionEraPreflightProvenance provenance) ResolveEra(
        IPacsSchemaCatalog catalog,
        string tableName,
        string columnName,
        bool manifestEngaged)
    {
        var columnLookup = catalog.TryGetColumn(tableName, columnName);
        if (columnLookup.HasValue && columnLookup.Value is not null)
        {
            var era = columnLookup.Value.ConversionEra;
            var provenance = !manifestEngaged
                ? ConversionEraPreflightProvenance.ManifestNotEngaged
                : era == PacsConversionEra.Unknown
                    ? ConversionEraPreflightProvenance.ManifestEngagedNoEntry
                    // We cannot distinguish ColumnEntry from
                    // TableEntryInherited from the catalog alone
                    // without adding a per-record provenance field.
                    // The preflight reports ColumnEntry as the more
                    // specific guess; downstream surfaces that need
                    // exact provenance can consult the manifest
                    // directly.
                    : ConversionEraPreflightProvenance.ColumnEntry;
            return (era, provenance);
        }

        // Column not in catalog: fall back to the table's recorded era
        // if available. This is honest about the lookup miss but lets
        // the preflight still produce a result (rather than throwing
        // on every "I asked about a column that doesn't exist" case,
        // which a malformed call site would hit).
        var tableLookup = catalog.TryGetTable(tableName);
        if (tableLookup.HasValue && tableLookup.Value is not null)
        {
            var era = tableLookup.Value.ConversionEra;
            var provenance = !manifestEngaged
                ? ConversionEraPreflightProvenance.ManifestNotEngaged
                : era == PacsConversionEra.Unknown
                    ? ConversionEraPreflightProvenance.ManifestEngagedNoEntry
                    : ConversionEraPreflightProvenance.TableEntryInherited;
            return (era, provenance);
        }

        // Neither column nor table is in the catalog. Report Unknown
        // with the appropriate provenance flag.
        return manifestEngaged
            ? (PacsConversionEra.Unknown, ConversionEraPreflightProvenance.ManifestEngagedNoEntry)
            : (PacsConversionEra.Both, ConversionEraPreflightProvenance.ManifestNotEngaged);
    }

    /// <summary>
    /// Pick the worse of two eras for the "single combined result"
    /// composite case. Worst-to-best ordering: Unknown > Pre2017 >
    /// (Post2017 == Both). Pre2017 is "worse" than Post2017/Both for
    /// RequirePost2017OrBoth callers, but Pre2017 is fine under
    /// AllowPre2017; the worst-era pick is stance-independent and
    /// the stance map sorts it out.
    /// </summary>
    private static bool IsWorseThan(PacsConversionEra candidate, PacsConversionEra current) =>
        EraSeverity(candidate) > EraSeverity(current);

    private static int EraSeverity(PacsConversionEra era) => era switch
    {
        PacsConversionEra.Unknown  => 3,
        PacsConversionEra.Pre2017  => 2,
        PacsConversionEra.Post2017 => 1,
        PacsConversionEra.Both     => 0,
        _ => 0,
    };

    /// <summary>
    /// Apply the C50-CONV-C stance × era → outcome binding table.
    /// </summary>
    private static (ConversionEraPreflightOutcome outcome, string reason) MapStanceEraToOutcome(
        ConversionEraPreflightStance stance,
        PacsConversionEra era)
    {
        return (stance, era) switch
        {
            // RequirePost2017OrBoth row of the binding table:
            (ConversionEraPreflightStance.RequirePost2017OrBoth, PacsConversionEra.Both)     => (ConversionEraPreflightOutcome.Pass, ""),
            (ConversionEraPreflightStance.RequirePost2017OrBoth, PacsConversionEra.Post2017) => (ConversionEraPreflightOutcome.Pass, ""),
            (ConversionEraPreflightStance.RequirePost2017OrBoth, PacsConversionEra.Pre2017)  => (
                ConversionEraPreflightOutcome.Fail,
                "stance requires Post2017 or Both; column is Pre2017 (conversion-only data, not maintained by current PACS workflow)"),
            (ConversionEraPreflightStance.RequirePost2017OrBoth, PacsConversionEra.Unknown)  => (
                ConversionEraPreflightOutcome.Fail,
                "stance requires Post2017 or Both; era is Unknown (no manifest engagement for this catalog item; HG-CONV-2 forbids silent aliasing)"),

            // AllowPre2017 row:
            (ConversionEraPreflightStance.AllowPre2017, PacsConversionEra.Both)     => (ConversionEraPreflightOutcome.Pass, ""),
            (ConversionEraPreflightStance.AllowPre2017, PacsConversionEra.Post2017) => (ConversionEraPreflightOutcome.Pass, ""),
            (ConversionEraPreflightStance.AllowPre2017, PacsConversionEra.Pre2017)  => (ConversionEraPreflightOutcome.Pass, ""),
            (ConversionEraPreflightStance.AllowPre2017, PacsConversionEra.Unknown)  => (
                ConversionEraPreflightOutcome.Fail,
                "stance allows any annotated era; era is Unknown (no manifest engagement for this catalog item)"),

            // AllowAny row: every era passes including Unknown.
            (ConversionEraPreflightStance.AllowAny, _) => (ConversionEraPreflightOutcome.Pass, ""),

            _ => (ConversionEraPreflightOutcome.Pass, ""),
        };
    }

    /// <summary>
    /// Build the structured message per the C50-CONV-C binding format:
    /// <c>[ConversionEraPreflight] &lt;Outcome&gt; for '&lt;table&gt;(&lt;columns&gt;)'
    /// under &lt;stance&gt;: matched era &lt;Era&gt; from &lt;provenance&gt;. &lt;reason&gt;</c>
    /// </summary>
    private static string BuildMessage(
        ConversionEraPreflightOutcome outcome,
        string tableName,
        IReadOnlyList<string> columnNames,
        string offendingColumn,
        ConversionEraPreflightStance stance,
        PacsConversionEra era,
        ConversionEraPreflightProvenance provenance,
        string reasonNote)
    {
        var columnsJoined = string.Join(", ", columnNames);
        var provenanceLabel = provenance switch
        {
            ConversionEraPreflightProvenance.ColumnEntry            => "column-entry",
            ConversionEraPreflightProvenance.TableEntryInherited    => "table-entry-inherited",
            ConversionEraPreflightProvenance.ManifestEngagedNoEntry => "manifest-engaged-no-entry",
            ConversionEraPreflightProvenance.ManifestNotEngaged     => "manifest-not-engaged",
            _ => provenance.ToString(),
        };
        var offendingNote = columnNames.Count > 1
            ? $" (offending column: '{offendingColumn}')"
            : string.Empty;
        return $"[ConversionEraPreflight] {outcome} for '{tableName}({columnsJoined})'{offendingNote} under {stance}: " +
               $"matched era {era} from {provenanceLabel}. {reasonNote}";
    }
}

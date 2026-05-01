using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice BENTON-SYNC-2: pure-function reporter that summarizes the
/// state of an <see cref="IPacsSchemaCatalog"/> for operator health
/// inspection. Produces a structured
/// <see cref="PacsSchemaCatalogHealthReport"/> record AND a
/// human-readable rendering. No I/O beyond the optional
/// <see cref="TextWriter"/> the caller supplies for rendering.
///
/// <para>Used by the SyncAtlas <c>schema-catalog-health</c>
/// subcommand to give the operator a one-shot pre-loader health
/// check: catalog identity, coverage counts, manifest engagement
/// state, invariant report summary, and FK confidence breakdown.
/// All data is read from already-built catalog surfaces; no new
/// queries against PACS run.</para>
/// </summary>
public static class PacsSchemaCatalogHealthReporter
{
    /// <summary>
    /// Build a structured health report from a catalog. No I/O.
    /// </summary>
    public static PacsSchemaCatalogHealthReport BuildReport(IPacsSchemaCatalog catalog)
    {
        if (catalog is null) throw new ArgumentNullException(nameof(catalog));

        // FK confidence breakdown: walk every table's FKs once and
        // count by Confidence enum value.
        int declared = 0, exported = 0, inferred = 0;
        foreach (var table in catalog.Tables)
        {
            foreach (var fk in table.ForeignKeys)
            {
                switch (fk.Confidence)
                {
                    case PacsForeignKeyConfidence.Declared:        declared++; break;
                    case PacsForeignKeyConfidence.Exported:        exported++; break;
                    case PacsForeignKeyConfidence.InferredByName:  inferred++; break;
                }
            }
        }

        // Manifest engagement: derived from existing catalog surfaces.
        // Conversion manifest engagement is signaled by the catalog
        // version's hash NOT equaling the well-known
        // 'no-conversion-manifest-supplied' sentinel.
        var conversionEngaged = !string.Equals(
            catalog.Version.ConversionManifestHash,
            "no-conversion-manifest-supplied",
            StringComparison.Ordinal);
        var piiEngaged = catalog.PiiManifestEngaged;
        // Exported FK engagement is signaled by the version's
        // SourceFileHashes carrying an 'exported-fk-manifest@...' key
        // (set by C52-OVR-B's wiring).
        var exportedFkEngaged = catalog.Version.SourceFileHashes.Keys
            .Any(k => k.StartsWith("exported-fk-manifest@", StringComparison.Ordinal));

        // Invariant report summary by code (top 5 most common
        // codes per severity).
        var report = catalog.InvariantReport;
        var warningBreakdown = SummarizeByCode(report.Warnings);
        var advisoryBreakdown = SummarizeByCode(report.Advisories);

        return new PacsSchemaCatalogHealthReport(
            PacsRelease:               catalog.Version.PacsRelease,
            IngestedAtUtc:             catalog.Version.IngestedAt,
            TableCount:                catalog.Coverage.TableCount,
            ColumnCount:               catalog.Coverage.ColumnCount,
            DictionaryCount:           catalog.Coverage.DictionaryCount,
            InvariantSetVersion:       report.InvariantSetVersion,
            ErrorCount:                report.Errors.Count(),
            WarningCount:              report.Warnings.Count(),
            AdvisoryCount:             report.Advisories.Count(),
            IsClean:                   report.IsClean,
            WarningCodeBreakdown:      warningBreakdown,
            AdvisoryCodeBreakdown:     advisoryBreakdown,
            DeclaredFkCount:           declared,
            ExportedFkCount:           exported,
            InferredByNameFkCount:     inferred,
            ConversionManifestEngaged: conversionEngaged,
            PiiManifestEngaged:        piiEngaged,
            ExportedFkManifestEngaged: exportedFkEngaged);
    }

    /// <summary>
    /// Render the report to a human-readable text format suitable
    /// for SyncAtlas stdout. Identity components are caller-
    /// supplied (the catalog itself doesn't carry them per HG2
    /// record-level county-agnostic).
    /// </summary>
    /// <param name="writer">Destination writer; not closed by this method.</param>
    /// <param name="report">The structured report.</param>
    /// <param name="countyId">
    /// Operator-supplied county identifier. Pass empty string when
    /// not known.
    /// </param>
    /// <param name="sourceConnectionId">
    /// Operator-supplied source-connection identifier. Pass empty
    /// string when not known.
    /// </param>
    public static void Render(
        TextWriter writer,
        PacsSchemaCatalogHealthReport report,
        string countyId,
        string sourceConnectionId)
    {
        if (writer is null) throw new ArgumentNullException(nameof(writer));
        if (report is null) throw new ArgumentNullException(nameof(report));

        writer.WriteLine("[sync-atlas] Schema catalog health");
        writer.WriteLine($"  CountyId / SourceConnectionId : ({countyId}, {sourceConnectionId})");
        writer.WriteLine($"  PacsRelease                   : {report.PacsRelease ?? "(not declared)"}");
        writer.WriteLine($"  Coverage                      : {report.TableCount} tables, {report.ColumnCount} columns, {report.DictionaryCount} dictionaries");
        writer.WriteLine($"  IngestedAtUtc                 : {report.IngestedAtUtc:O}");
        writer.WriteLine();

        writer.WriteLine("[sync-atlas] Invariant report");
        writer.WriteLine($"  Set version                   : {report.InvariantSetVersion}");
        writer.WriteLine($"  Errors                        : {report.ErrorCount}");
        writer.WriteLine($"  Warnings                      : {report.WarningCount}{FormatBreakdown(report.WarningCodeBreakdown)}");
        writer.WriteLine($"  Advisories                    : {report.AdvisoryCount}{FormatBreakdown(report.AdvisoryCodeBreakdown)}");
        writer.WriteLine($"  IsClean                       : {report.IsClean.ToString().ToLowerInvariant()}");
        writer.WriteLine();

        writer.WriteLine("[sync-atlas] FK confidence breakdown");
        writer.WriteLine($"  Declared                      : {report.DeclaredFkCount}");
        writer.WriteLine($"  Exported                      : {report.ExportedFkCount}{(report.ExportedFkManifestEngaged ? "" : "    (no exported FK manifest engaged)")}");
        writer.WriteLine($"  InferredByName                : {report.InferredByNameFkCount}");
        writer.WriteLine();

        writer.WriteLine("[sync-atlas] Manifest engagement");
        writer.WriteLine($"  Conversion manifest           : {EngagementLabel(report.ConversionManifestEngaged)}");
        writer.WriteLine($"  PII manifest                  : {EngagementLabel(report.PiiManifestEngaged)}");
        writer.WriteLine($"  Exported FK manifest          : {EngagementLabel(report.ExportedFkManifestEngaged)}");
    }

    private static IReadOnlyList<PacsSchemaInvariantCodeCount> SummarizeByCode(
        IEnumerable<PacsSchemaInvariantResult> rows) =>
        rows.GroupBy(r => r.Code, StringComparer.Ordinal)
            .Select(g => new PacsSchemaInvariantCodeCount(g.Key, g.Count()))
            .OrderByDescending(c => c.Count)
            .ThenBy(c => c.Code, StringComparer.Ordinal)
            .ToList();

    private static string FormatBreakdown(IReadOnlyList<PacsSchemaInvariantCodeCount> breakdown)
    {
        if (breakdown.Count == 0) return string.Empty;
        var top = breakdown.Take(5).Select(c => $"{c.Code} × {c.Count}");
        var suffix = breakdown.Count > 5 ? $", +{breakdown.Count - 5} more codes" : string.Empty;
        return $"   ({string.Join(", ", top)}{suffix})";
    }

    private static string EngagementLabel(bool engaged) => engaged ? "engaged" : "not engaged";
}

/// <summary>
/// Slice BENTON-SYNC-2: structured health report for an
/// <see cref="IPacsSchemaCatalog"/>. Pure data; no behavior.
/// Mirrors the conceptual shape sketched in
/// <c>docs/sync/benton-core-sync-next-need.md</c>.
/// </summary>
public sealed record PacsSchemaCatalogHealthReport(
    string? PacsRelease,
    DateTime IngestedAtUtc,
    int TableCount,
    int ColumnCount,
    int DictionaryCount,
    string InvariantSetVersion,
    int ErrorCount,
    int WarningCount,
    int AdvisoryCount,
    bool IsClean,
    IReadOnlyList<PacsSchemaInvariantCodeCount> WarningCodeBreakdown,
    IReadOnlyList<PacsSchemaInvariantCodeCount> AdvisoryCodeBreakdown,
    int DeclaredFkCount,
    int ExportedFkCount,
    int InferredByNameFkCount,
    bool ConversionManifestEngaged,
    bool PiiManifestEngaged,
    bool ExportedFkManifestEngaged);

/// <summary>
/// Slice BENTON-SYNC-2: one (Code, Count) pair in a health-report
/// breakdown. Used for warning / advisory summaries.
/// </summary>
public sealed record PacsSchemaInvariantCodeCount(string Code, int Count);

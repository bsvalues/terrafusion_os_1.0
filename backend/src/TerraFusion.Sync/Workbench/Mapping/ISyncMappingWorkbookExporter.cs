using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Mapping;

/// <summary>
/// Slice C5: produces sanitized review-safe artifacts (CSV + Markdown)
/// from a county-scoped <c>SyncMappingWorkbook</c> so an assessor can
/// review lanes, candidate columns, source values, canonical targets,
/// exclusion flags, and notes offline.
///
/// <para>What this exporter does:
/// <list type="bullet">
/// <item>Reads the named workbook + its columns + code values.</item>
/// <item>Writes <c>mapping-workbook-columns.csv</c> and
/// <c>mapping-workbook-code-values.csv</c> when the format requests CSV.</item>
/// <item>Writes <c>mapping-workbook-review.md</c> when the format requests
/// Markdown — a human-friendly review packet ordered by the C1 priority
/// lanes plus a long-tail summary.</item>
/// </list>
/// </para>
///
/// <para>What this exporter does NOT do:
/// <list type="bullet">
/// <item>Mutate the workbook, columns, or code values. Status stays
/// <c>Draft</c>; no audit fields are bumped.</item>
/// <item>Apply mappings, transform PACS rows, or touch canonical
/// landing tables. Slice C-later owns transform consumption.</item>
/// <item>Emit secrets, PII, or audit fields. The CSV columns are
/// strictly the review-safe set documented on
/// <see cref="SyncMappingWorkbookExportResult"/>.</item>
/// </list>
/// </para>
/// </summary>
public interface ISyncMappingWorkbookExporter
{
    Task<SyncMappingWorkbookExportResult> ExportAsync(
        Guid countyId,
        Guid workbookId,
        SyncMappingWorkbookExportOptions options,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Caller-supplied policy for an export run.
///
/// <para><see cref="OutputDirectory"/> is created if it doesn't exist;
/// existing files are overwritten without warning (this is an idempotent
/// re-export, not a versioned writer).</para>
///
/// <para><see cref="Format"/> values:
/// <list type="bullet">
/// <item><c>"csv"</c> — write the two CSVs only.</item>
/// <item><c>"md"</c> — write the Markdown review packet only.</item>
/// <item><c>"both"</c> — write all three. Default.</item>
/// </list>
/// </para>
/// </summary>
public sealed record SyncMappingWorkbookExportOptions(
    string OutputDirectory,
    string Format = "both")
{
    public bool WriteCsv => string.Equals(Format, "csv", StringComparison.OrdinalIgnoreCase)
                         || string.Equals(Format, "both", StringComparison.OrdinalIgnoreCase);

    public bool WriteMarkdown => string.Equals(Format, "md", StringComparison.OrdinalIgnoreCase)
                              || string.Equals(Format, "both", StringComparison.OrdinalIgnoreCase);

    public static IReadOnlySet<string> ValidFormats { get; } =
        new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "csv", "md", "both" };
}

/// <summary>
/// Per-call summary the exporter returns so the operator-facing CLI can
/// echo what was written.
/// </summary>
public sealed record SyncMappingWorkbookExportResult(
    Guid WorkbookId,
    string WorkbookName,
    string WorkbookStatus,
    int    Columns,
    int    CodeValues,
    IReadOnlyList<string> FilesWritten);

using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities.Sync.Mapping;
using TerraFusion.Data;

namespace TerraFusion.Sync.Workbench.Mapping;

/// <summary>
/// Slice C5 implementation. Reads a county-scoped Mapping Workbook +
/// its columns + code values and writes review-safe CSV/Markdown
/// artifacts to the operator-supplied output directory.
///
/// See <see cref="ISyncMappingWorkbookExporter"/> for the contract.
/// </summary>
public sealed class SyncMappingWorkbookExporter : ISyncMappingWorkbookExporter
{
    /// <summary>
    /// CSV column order for <c>mapping-workbook-columns.csv</c>. Pinned
    /// here so a future "let's add another field" change is visible in
    /// one place.
    /// </summary>
    public static IReadOnlyList<string> ColumnsCsvHeader { get; } = new[]
    {
        "workbook_id",
        "mapping_column_id",
        "mapping_lane",
        "source_schema",
        "source_table",
        "source_column",
        "canonical_target",
        "distinct_count",
        "distinct_ratio",
        "review_status",
        "notes",
    };

    /// <summary>CSV column order for <c>mapping-workbook-code-values.csv</c>.</summary>
    public static IReadOnlyList<string> CodeValuesCsvHeader { get; } = new[]
    {
        "workbook_id",
        "mapping_column_id",
        "code_value_id",
        "mapping_lane",
        "source_schema",
        "source_table",
        "source_column",
        "source_value",
        "source_label",
        "observed_count",
        "canonical_value",
        "review_status",
        "is_excluded",
        "notes",
    };

    /// <summary>
    /// C1 priority lane order — used by the Markdown review packet so
    /// the assessor sees the most important lanes first.
    /// </summary>
    public static IReadOnlyList<string> PriorityLaneOrder { get; } = new[]
    {
        "Valuation",
        "Sales",
        "Improvement",
        "Land",
        "Neighborhood",
        "Other",
    };

    public const string ColumnsCsvFileName    = "mapping-workbook-columns.csv";
    public const string CodeValuesCsvFileName = "mapping-workbook-code-values.csv";
    public const string MarkdownFileName      = "mapping-workbook-review.md";

    private readonly TerraFusionDbContext _db;

    public SyncMappingWorkbookExporter(TerraFusionDbContext db)
    {
        ArgumentNullException.ThrowIfNull(db);
        _db = db;
    }

    public async Task<SyncMappingWorkbookExportResult> ExportAsync(
        Guid countyId,
        Guid workbookId,
        SyncMappingWorkbookExportOptions options,
        CancellationToken cancellationToken = default)
    {
        if (countyId == Guid.Empty)
            throw new ArgumentException("CountyId is required.", nameof(countyId));
        if (workbookId == Guid.Empty)
            throw new ArgumentException("WorkbookId is required.", nameof(workbookId));
        ArgumentNullException.ThrowIfNull(options);
        if (string.IsNullOrWhiteSpace(options.OutputDirectory))
            throw new ArgumentException("Options.OutputDirectory must be non-empty.", nameof(options));
        if (!SyncMappingWorkbookExportOptions.ValidFormats.Contains(options.Format))
            throw new ArgumentException(
                $"Options.Format must be one of: {string.Join(", ", SyncMappingWorkbookExportOptions.ValidFormats)}.",
                nameof(options));
        if (!options.WriteCsv && !options.WriteMarkdown)
        {
            // Defensive: WriteCsv/WriteMarkdown derive from Format, so this
            // shouldn't happen — but if a future format string slips
            // through ValidFormats and renders nothing, fail loudly.
            throw new ArgumentException(
                "Options.Format produced no output formats.", nameof(options));
        }

        // 1. County-scoped workbook lookup. Refuse cross-county.
        var workbook = await _db.SyncMappingWorkbooks
            .FirstOrDefaultAsync(
                w => w.Id == workbookId && w.CountyId == countyId,
                cancellationToken);
        if (workbook is null)
        {
            throw new InvalidOperationException(
                $"Mapping workbook {workbookId} not found for county {countyId}.");
        }

        // 2. Pull the column + value rows in one shot, deterministically
        //    ordered for stable diffs across re-exports.
        var columns = await _db.SyncMappingColumns
            .Where(c => c.WorkbookId == workbookId)
            .OrderBy(c => c.MappingLane)
            .ThenBy(c => c.SourceSchema)
            .ThenBy(c => c.SourceTable)
            .ThenBy(c => c.SourceColumn)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var columnIds = columns.Select(c => c.Id).ToList();

        var codeValues = await _db.SyncMappingCodeValues
            .Where(v => columnIds.Contains(v.MappingColumnId))
            .OrderBy(v => v.MappingColumnId)
            .ThenByDescending(v => v.ObservedCount)
            .ThenBy(v => v.SourceValue)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var codeValuesByColumn = codeValues
            .GroupBy(v => v.MappingColumnId)
            .ToDictionary(g => g.Key, g => g.ToList());

        // 3. Ensure the output directory exists.
        Directory.CreateDirectory(options.OutputDirectory);

        var filesWritten = new List<string>();

        // 4. CSV writers.
        if (options.WriteCsv)
        {
            var columnsPath = Path.Combine(options.OutputDirectory, ColumnsCsvFileName);
            await File.WriteAllTextAsync(columnsPath,
                BuildColumnsCsv(workbook, columns), cancellationToken);
            filesWritten.Add(columnsPath);

            var codeValuesPath = Path.Combine(options.OutputDirectory, CodeValuesCsvFileName);
            await File.WriteAllTextAsync(codeValuesPath,
                BuildCodeValuesCsv(workbook, columns, codeValuesByColumn), cancellationToken);
            filesWritten.Add(codeValuesPath);
        }

        // 5. Markdown review packet.
        if (options.WriteMarkdown)
        {
            var mdPath = Path.Combine(options.OutputDirectory, MarkdownFileName);
            await File.WriteAllTextAsync(mdPath,
                BuildMarkdown(workbook, columns, codeValuesByColumn), cancellationToken);
            filesWritten.Add(mdPath);
        }

        return new SyncMappingWorkbookExportResult(
            WorkbookId:     workbook.Id,
            WorkbookName:   workbook.Name,
            WorkbookStatus: workbook.Status,
            Columns:        columns.Count,
            CodeValues:     codeValues.Count,
            FilesWritten:   filesWritten);
    }

    // ── CSV builders ─────────────────────────────────────────────────────

    /// <summary>Public for unit tests; pure function (no I/O).</summary>
    public static string BuildColumnsCsv(
        SyncMappingWorkbook workbook,
        IReadOnlyList<SyncMappingColumn> columns)
    {
        ArgumentNullException.ThrowIfNull(workbook);
        ArgumentNullException.ThrowIfNull(columns);

        var sb = new StringBuilder();
        sb.AppendLine(string.Join(",", ColumnsCsvHeader));
        foreach (var column in columns)
        {
            sb.AppendLine(string.Join(",", new[]
            {
                CsvEscape(workbook.Id.ToString()),
                CsvEscape(column.Id.ToString()),
                CsvEscape(column.MappingLane),
                CsvEscape(column.SourceSchema),
                CsvEscape(column.SourceTable),
                CsvEscape(column.SourceColumn),
                CsvEscape(column.CanonicalTarget),
                CsvEscape(column.DistinctCount?.ToString(CultureInfo.InvariantCulture)),
                CsvEscape(column.DistinctRatio?.ToString("0.######", CultureInfo.InvariantCulture)),
                CsvEscape(column.ReviewStatus),
                CsvEscape(column.Notes),
            }));
        }
        return sb.ToString();
    }

    /// <summary>Public for unit tests; pure function (no I/O).</summary>
    public static string BuildCodeValuesCsv(
        SyncMappingWorkbook workbook,
        IReadOnlyList<SyncMappingColumn> columns,
        IReadOnlyDictionary<Guid, List<SyncMappingCodeValue>> codeValuesByColumn)
    {
        ArgumentNullException.ThrowIfNull(workbook);
        ArgumentNullException.ThrowIfNull(columns);
        ArgumentNullException.ThrowIfNull(codeValuesByColumn);

        var sb = new StringBuilder();
        sb.AppendLine(string.Join(",", CodeValuesCsvHeader));
        foreach (var column in columns)
        {
            if (!codeValuesByColumn.TryGetValue(column.Id, out var values))
            {
                continue;
            }

            foreach (var value in values)
            {
                sb.AppendLine(string.Join(",", new[]
                {
                    CsvEscape(workbook.Id.ToString()),
                    CsvEscape(column.Id.ToString()),
                    CsvEscape(value.Id.ToString()),
                    CsvEscape(column.MappingLane),
                    CsvEscape(column.SourceSchema),
                    CsvEscape(column.SourceTable),
                    CsvEscape(column.SourceColumn),
                    CsvEscape(value.SourceValue),
                    CsvEscape(value.SourceLabel),
                    CsvEscape(value.ObservedCount?.ToString(CultureInfo.InvariantCulture)),
                    CsvEscape(value.CanonicalValue),
                    CsvEscape(value.ReviewStatus),
                    CsvEscape(value.IsExcluded ? "true" : "false"),
                    CsvEscape(value.Notes),
                }));
            }
        }
        return sb.ToString();
    }

    /// <summary>
    /// RFC 4180-ish CSV escape: enclose a value in double quotes when it
    /// contains a comma, quote, or line terminator, and double-up any
    /// inner quotes. Null/empty becomes the bare empty cell.
    /// </summary>
    public static string CsvEscape(string? raw)
    {
        if (string.IsNullOrEmpty(raw)) return string.Empty;

        var needsQuoting = raw.IndexOfAny(new[] { ',', '"', '\n', '\r' }) >= 0;
        if (!needsQuoting)
        {
            return raw;
        }

        var doubled = raw.Replace("\"", "\"\"");
        return "\"" + doubled + "\"";
    }

    // ── Markdown review packet ───────────────────────────────────────────

    /// <summary>Public for unit tests; pure function (no I/O).</summary>
    public static string BuildMarkdown(
        SyncMappingWorkbook workbook,
        IReadOnlyList<SyncMappingColumn> columns,
        IReadOnlyDictionary<Guid, List<SyncMappingCodeValue>> codeValuesByColumn)
    {
        ArgumentNullException.ThrowIfNull(workbook);
        ArgumentNullException.ThrowIfNull(columns);
        ArgumentNullException.ThrowIfNull(codeValuesByColumn);

        var totalCodeValues = codeValuesByColumn.Values.Sum(v => v.Count);

        var sb = new StringBuilder();
        sb.AppendLine("# Mapping Workbook Review");
        sb.AppendLine();
        sb.Append("> Slice C5 — sanitized review packet exported from a county-scoped ");
        sb.AppendLine("Mapping Workbook. No DB rows were modified by this export.");
        sb.AppendLine();
        sb.AppendLine("## Workbook");
        sb.AppendLine();
        sb.AppendLine($"- **Workbook Id:** `{workbook.Id}`");
        sb.AppendLine($"- **Name:** {workbook.Name}");
        sb.AppendLine($"- **County Id:** `{workbook.CountyId}`");
        sb.AppendLine($"- **Source Connection Id:** `{workbook.SourceConnectionId}`");
        sb.AppendLine($"- **Profile Batch Id:** `{workbook.ProfileBatchId}`");
        sb.AppendLine($"- **Status:** {workbook.Status}");
        sb.AppendLine($"- **Columns:** {columns.Count}");
        sb.AppendLine($"- **Code Values:** {totalCodeValues}");
        sb.AppendLine();

        // Group columns by lane in C1 priority order for the review packet.
        var columnsByLane = columns
            .GroupBy(c => c.MappingLane)
            .ToDictionary(g => g.Key, g => g.OrderBy(c => c.SourceTable).ThenBy(c => c.SourceColumn).ToList());

        sb.AppendLine("## Priority Review");
        sb.AppendLine();
        sb.AppendLine("Lanes are ordered by C1 priority. Each section lists the lane's");
        sb.AppendLine("columns plus the top 5 source values per column. WAC and ratio");
        sb.AppendLine("codes are surfaced for review — none are auto-excluded.");
        sb.AppendLine();

        var orderedLanes = PriorityLaneOrder
            .Where(columnsByLane.ContainsKey)
            .Concat(columnsByLane.Keys.Where(k => !PriorityLaneOrder.Contains(k)).OrderBy(k => k))
            .ToList();

        foreach (var lane in orderedLanes)
        {
            var laneColumns = columnsByLane[lane];
            sb.AppendLine($"### Lane: {lane}  ({laneColumns.Count} column{(laneColumns.Count == 1 ? string.Empty : "s")})");
            sb.AppendLine();

            foreach (var column in laneColumns)
            {
                sb.Append("- **");
                sb.Append(column.SourceSchema);
                sb.Append('.');
                sb.Append(column.SourceTable);
                sb.Append('.');
                sb.Append(column.SourceColumn);
                sb.Append("** — distinct: ");
                sb.Append(column.DistinctCount?.ToString(CultureInfo.InvariantCulture) ?? "—");
                sb.Append(", ratio: ");
                sb.Append(column.DistinctRatio?.ToString("0.0000", CultureInfo.InvariantCulture) ?? "—");
                sb.Append(", review: ");
                sb.AppendLine(column.ReviewStatus);

                if (!codeValuesByColumn.TryGetValue(column.Id, out var values) || values.Count == 0)
                {
                    sb.AppendLine("    - _no observed values_");
                    continue;
                }

                foreach (var value in values.Take(5))
                {
                    sb.Append("    - `");
                    sb.Append(value.SourceValue);
                    sb.Append("` — count: ");
                    sb.Append(value.ObservedCount?.ToString(CultureInfo.InvariantCulture) ?? "—");
                    sb.Append(", review: ");
                    sb.Append(value.ReviewStatus);
                    sb.Append(", excluded: ");
                    sb.AppendLine(value.IsExcluded ? "yes" : "no");
                }
                if (values.Count > 5)
                {
                    sb.AppendLine($"    - … and {values.Count - 5} more value(s)");
                }
            }
            sb.AppendLine();
        }

        // Summary by lane.
        sb.AppendLine("## Lane Summary");
        sb.AppendLine();
        sb.AppendLine("| Lane | Columns | Code Values |");
        sb.AppendLine("|------|---------|-------------|");
        foreach (var lane in orderedLanes)
        {
            var laneColumns = columnsByLane[lane];
            var laneValues  = laneColumns.Sum(c =>
                codeValuesByColumn.TryGetValue(c.Id, out var v) ? v.Count : 0);
            sb.AppendLine($"| {lane} | {laneColumns.Count} | {laneValues} |");
        }
        sb.AppendLine();

        sb.AppendLine("## Notes for the Reviewer");
        sb.AppendLine();
        sb.AppendLine("- This packet is a snapshot. Re-export against the same workbook for fresh state.");
        sb.AppendLine("- Decisions made offline must be applied via the eventual review tooling — ");
        sb.AppendLine("  no transform consumes mappings yet.");
        sb.AppendLine("- WAC codes (`sale.wac_cd`) are surfaced for human decision; the loader and ");
        sb.AppendLine("  exporter intentionally do not auto-exclude them.");
        sb.AppendLine();

        return sb.ToString();
    }
}

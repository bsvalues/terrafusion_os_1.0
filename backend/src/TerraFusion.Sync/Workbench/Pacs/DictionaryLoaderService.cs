using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Data;

namespace TerraFusion.Sync.Workbench.Pacs;

/// <summary>
/// Slice C22-B / C23-B implementation of
/// <see cref="IDictionaryLoaderService"/>. See the policy docs
/// (<c>docs/sync/property-use-dictionary-loader-policy.md</c> for
/// C22-A and <c>docs/sync/imprv-det-class-dictionary-loader-policy.md</c>
/// for C23-A) for the full contract. The service is target-agnostic;
/// the workbook column tuple, the PACS dictionary table, and the
/// canonical-target vocabulary all arrive as a
/// <see cref="DictionaryLoaderTargetConfig"/> parameter so each
/// future dictionary lane is a Program.cs config branch, not a new
/// service class.
///
/// <para>This service is read-only end-to-end:
/// <list type="number">
/// <item>Reads workbook code-value rows for the configured workbook
///   source triple using <see cref="DbContext.AsNoTracking"/>.</item>
/// <item>Reads PACS via <see cref="IPacsDictionaryReader"/> (the
///   abstraction that lets tests stub the SQL Server side).</item>
/// <item>Applies the M1-M5 classification rules in memory.</item>
/// <item>Returns the proposed CSV rows + counts. NEVER calls
///   <see cref="DbContext.SaveChangesAsync"/>.</item>
/// </list>
/// </para>
/// </summary>
public sealed class DictionaryLoaderService : IDictionaryLoaderService
{
    private readonly TerraFusionDbContext _db;
    private readonly IPacsDictionaryReader _pacs;

    public DictionaryLoaderService(
        TerraFusionDbContext db,
        IPacsDictionaryReader pacs)
    {
        ArgumentNullException.ThrowIfNull(db);
        ArgumentNullException.ThrowIfNull(pacs);
        _db = db;
        _pacs = pacs;
    }

    public async Task<DictionaryLoaderResult> ProposeReviewCsvAsync(
        Guid countyId,
        Guid workbookId,
        DictionaryLoaderTargetConfig target,
        DictionaryColumnConfig dictionaryColumns,
        CancellationToken cancellationToken = default)
    {
        if (countyId == Guid.Empty)
            throw new ArgumentException("CountyId is required.", nameof(countyId));
        if (workbookId == Guid.Empty)
            throw new ArgumentException("WorkbookId is required.", nameof(workbookId));
        ArgumentNullException.ThrowIfNull(target);
        ArgumentNullException.ThrowIfNull(dictionaryColumns);
        if (string.IsNullOrWhiteSpace(target.WorkbookSourceSchema))
            throw new ArgumentException("Target.WorkbookSourceSchema is required.", nameof(target));
        if (string.IsNullOrWhiteSpace(target.WorkbookSourceTable))
            throw new ArgumentException("Target.WorkbookSourceTable is required.", nameof(target));
        if (string.IsNullOrWhiteSpace(target.WorkbookSourceColumn))
            throw new ArgumentException("Target.WorkbookSourceColumn is required.", nameof(target));
        if (string.IsNullOrWhiteSpace(target.PacsDictionarySchema))
            throw new ArgumentException("Target.PacsDictionarySchema is required.", nameof(target));
        if (string.IsNullOrWhiteSpace(target.PacsDictionaryTable))
            throw new ArgumentException("Target.PacsDictionaryTable is required.", nameof(target));
        if (string.IsNullOrWhiteSpace(target.CanonicalTargetName))
            throw new ArgumentException("Target.CanonicalTargetName is required.", nameof(target));
        if (string.IsNullOrWhiteSpace(dictionaryColumns.CodeColumn))
            throw new ArgumentException(
                "DictionaryColumns.CodeColumn is required (per C22-A / C23-A live-inspection gate).",
                nameof(dictionaryColumns));

        // ── Step 1: workbook county-scoped lookup (read-only) ─────────────
        var workbook = await _db.SyncMappingWorkbooks
            .AsNoTracking()
            .FirstOrDefaultAsync(
                w => w.Id == workbookId && w.CountyId == countyId,
                cancellationToken);
        if (workbook is null)
        {
            throw new InvalidOperationException(
                $"Mapping workbook {workbookId} not found for county {countyId}.");
        }

        // ── Step 2: locate the configured workbook source-column row ─────
        var column = await _db.SyncMappingColumns
            .AsNoTracking()
            .FirstOrDefaultAsync(
                c => c.WorkbookId == workbookId
                  && c.SourceSchema == target.WorkbookSourceSchema
                  && c.SourceTable == target.WorkbookSourceTable
                  && c.SourceColumn == target.WorkbookSourceColumn,
                cancellationToken);
        if (column is null)
        {
            throw new InvalidOperationException(
                $"Workbook {workbookId} does not contain a column for " +
                $"{target.WorkbookSourceSchema}.{target.WorkbookSourceTable}.{target.WorkbookSourceColumn}; " +
                "dictionary loader cannot run.");
        }

        // ── Step 3: load all Deferred code-values for the column. The
        //   service does not hardcode a count; whatever is Deferred at
        //   the moment of the run is what gets proposed. ─────────────────
        var deferredRows = await _db.SyncMappingCodeValues
            .AsNoTracking()
            .Where(v => v.MappingColumnId == column.Id
                     && v.ReviewStatus == "Deferred")
            .ToListAsync(cancellationToken);

        // ── Step 4: read the PACS dictionary table (read-only) ────────────
        var dict = await _pacs.ReadDictionaryAsync(
            target.PacsDictionarySchema,
            target.PacsDictionaryTable,
            cancellationToken);

        // ── Step 5: bucket dictionary rows by trimmed code (for M3
        //   ambiguity detection) ─────────────────────────────────────────
        var dictByCode = new Dictionary<string, List<PacsDictionaryRow>>(StringComparer.OrdinalIgnoreCase);
        foreach (var row in dict.Rows)
        {
            var code = row.GetTrimmedString(dictionaryColumns.CodeColumn);
            if (code is null) continue;
            if (!dictByCode.TryGetValue(code, out var list))
            {
                list = new List<PacsDictionaryRow>();
                dictByCode[code] = list;
            }
            list.Add(row);
        }

        // ── Step 6: classify each Deferred workbook row per M1-M5 ────────
        var proposed = new List<ProposedReviewCsvRow>(deferredRows.Count);
        int m1 = 0, m3 = 0, m4 = 0, m5 = 0;

        foreach (var wbRow in deferredRows)
        {
            var sourceValueRaw = wbRow.SourceValue ?? string.Empty;
            var sourceValueTrimmed = sourceValueRaw.Trim();

            if (!dictByCode.TryGetValue(sourceValueTrimmed, out var matches))
            {
                // M1 — workbook code missing from dictionary
                m1++;
                proposed.Add(BuildDeferredRow(
                    target,
                    sourceValueRaw,
                    notes: $"Code '{sourceValueTrimmed}' observed in workbook " +
                           $"but missing from PACS {target.PacsDictionaryTable} dictionary; " +
                           "data-integrity issue or pre-2017 conversion artifact. " +
                           "Operator review required.",
                    classification: DictionaryRowClassification.WorkbookCodeMissingFromDictionary));
                continue;
            }

            if (matches.Count > 1)
            {
                // M3 — duplicate dictionary code
                m3++;
                var summaries = matches
                    .Select(r => SummarizeRow(r, dictionaryColumns))
                    .ToList();
                proposed.Add(BuildDeferredRow(
                    target,
                    sourceValueRaw,
                    notes: $"Code '{sourceValueTrimmed}' has multiple dictionary rows: " +
                           $"[{string.Join("; ", summaries)}]. " +
                           "Cannot unambiguously map. Operator review required.",
                    classification: DictionaryRowClassification.DuplicateDictionaryCode));
                continue;
            }

            var only = matches[0];
            if (!IsRowActive(only, dictionaryColumns))
            {
                // M4 — inactive dictionary row
                m4++;
                proposed.Add(BuildDeferredRow(
                    target,
                    sourceValueRaw,
                    notes: $"Code '{sourceValueTrimmed}' matches an INACTIVE PACS " +
                           $"{target.PacsDictionaryTable} dictionary row " +
                           $"[{SummarizeRow(only, dictionaryColumns)}]. May represent legacy " +
                           "or pre-conversion data. Operator review required.",
                    classification: DictionaryRowClassification.InactiveDictionaryRow));
                continue;
            }

            // M5 — clean active unambiguous match → proposed Mapped
            m5++;
            var canonical = ResolveProposedCanonicalValue(
                only, dictionaryColumns, target, sourceValueTrimmed);
            proposed.Add(BuildMappedRow(
                target,
                sourceValueRaw,
                canonicalValue: canonical,
                notes: $"Dictionary-matched: [{SummarizeRow(only, dictionaryColumns)}]; " +
                       "reviewed via dictionary loader policy. " +
                       "Mapping reflects current dictionary semantics; pre-2017 records " +
                       "may carry different intent — operator confirms."));
        }

        return new DictionaryLoaderResult(
            WorkbookId:                              workbookId,
            WorkbookDeferredRows:                    deferredRows.Count,
            DictionaryRowsRead:                      dict.Rows.Count,
            M1WorkbookCodeMissingFromDictionary:     m1,
            M2DictionaryCodeUnobservedInWorkbook:    ComputeM2(dictByCode, deferredRows),
            M3DuplicateDictionaryCode:               m3,
            M4InactiveDictionaryRow:                 m4,
            M5CleanMatch:                            m5,
            ProposedRows:                            proposed);
    }

    // ── Helpers ────────────────────────────────────────────────────────

    private static int ComputeM2(
        IReadOnlyDictionary<string, List<PacsDictionaryRow>> dictByCode,
        IReadOnlyList<Core.Entities.Sync.Mapping.SyncMappingCodeValue> workbookDeferred)
    {
        // M2 — dictionary code present, workbook code absent. Per C22-A
        // / C23-A policies these rows are NOT included in the CSV; the
        // count is returned for the classification-summary output.
        var workbookCodes = new HashSet<string>(
            workbookDeferred.Select(v => (v.SourceValue ?? string.Empty).Trim()),
            StringComparer.OrdinalIgnoreCase);
        var m2 = 0;
        foreach (var dictCode in dictByCode.Keys)
        {
            if (!workbookCodes.Contains(dictCode)) m2++;
        }
        return m2;
    }

    private static ProposedReviewCsvRow BuildDeferredRow(
        DictionaryLoaderTargetConfig target,
        string sourceValue,
        string notes,
        DictionaryRowClassification classification)
        => new(
            Scope:              "code_value",
            SourceSchema:       target.WorkbookSourceSchema,
            SourceTable:        target.WorkbookSourceTable,
            SourceColumn:       target.WorkbookSourceColumn,
            SourceValue:        sourceValue,
            ReviewStatus:       "Deferred",
            CanonicalTarget:    null,
            CanonicalValue:     null,
            CanonicalValueNull: true,
            IsExcluded:         false,
            Notes:              notes,
            Classification:     classification);

    private static ProposedReviewCsvRow BuildMappedRow(
        DictionaryLoaderTargetConfig target,
        string sourceValue,
        string canonicalValue,
        string notes)
        => new(
            Scope:              "code_value",
            SourceSchema:       target.WorkbookSourceSchema,
            SourceTable:        target.WorkbookSourceTable,
            SourceColumn:       target.WorkbookSourceColumn,
            SourceValue:        sourceValue,
            ReviewStatus:       "Mapped",
            CanonicalTarget:    null,                  // column-row already carries canonical_target
            CanonicalValue:     canonicalValue,
            CanonicalValueNull: null,
            IsExcluded:         false,
            Notes:              notes,
            Classification:     DictionaryRowClassification.CleanMatch);

    /// <summary>
    /// Picks the canonical_value to propose for an M5 row. Prefers the
    /// dictionary's description column when available; falls back to
    /// <c>"{CanonicalTargetName}:{code}"</c> when no description column
    /// was configured. The operator can always rephrase during the
    /// C22-C / C23-C apply pass.
    /// </summary>
    private static string ResolveProposedCanonicalValue(
        PacsDictionaryRow row,
        DictionaryColumnConfig cols,
        DictionaryLoaderTargetConfig target,
        string trimmedCode)
    {
        if (cols.DescriptionColumn is { } descCol)
        {
            var desc = row.GetTrimmedString(descCol);
            if (!string.IsNullOrEmpty(desc)) return desc;
        }
        return $"{target.CanonicalTargetName}:{trimmedCode}";
    }

    /// <summary>
    /// Builds a short human-readable summary of a dictionary row for
    /// inclusion in the proposed CSV's <c>notes</c> cell. Picks the
    /// configured code + description columns and a couple of small
    /// other columns to give the operator context without dumping
    /// the entire row.
    /// </summary>
    private static string SummarizeRow(
        PacsDictionaryRow row,
        DictionaryColumnConfig cols)
    {
        var parts = new List<string>();
        var code = row.GetTrimmedString(cols.CodeColumn);
        if (code is not null) parts.Add($"code={code}");
        if (cols.DescriptionColumn is { } descCol)
        {
            var desc = row.GetTrimmedString(descCol);
            if (desc is not null) parts.Add($"desc={desc}");
        }
        if (cols.YearColumn is { } yearCol)
        {
            var yr = row.GetTrimmedString(yearCol);
            if (yr is not null) parts.Add($"yr={yr}");
        }
        if (cols.ActiveFlagColumn is { } activeCol)
        {
            var fl = row.GetTrimmedString(activeCol);
            if (fl is not null) parts.Add($"active={fl}");
        }
        return parts.Count == 0 ? "(no columns)" : string.Join(",", parts);
    }

    /// <summary>
    /// Evaluates whether a dictionary row is active per the
    /// operator-supplied predicate. Supports the simple grammar
    /// <c>&lt;column&gt; IS NULL</c>, <c>&lt;column&gt; IS NOT NULL</c>,
    /// <c>&lt;column&gt; = '&lt;literal&gt;'</c>, and
    /// <c>&lt;column&gt; &lt;&gt; '&lt;literal&gt;'</c>. Returns
    /// <c>true</c> by default when no predicate is configured (no
    /// active flag = all rows are considered active = M4 cannot fire).
    /// </summary>
    private static bool IsRowActive(
        PacsDictionaryRow row,
        DictionaryColumnConfig cols)
    {
        if (string.IsNullOrWhiteSpace(cols.ActiveFlagPredicate)) return true;

        var pred = cols.ActiveFlagPredicate.Trim();

        // <col> IS NULL
        var mNull = Regex.Match(pred, @"^(?<col>\w+)\s+IS\s+NULL$", RegexOptions.IgnoreCase);
        if (mNull.Success)
        {
            var col = mNull.Groups["col"].Value;
            return row.GetTrimmedString(col) is null;
        }

        // <col> IS NOT NULL
        var mNotNull = Regex.Match(pred, @"^(?<col>\w+)\s+IS\s+NOT\s+NULL$", RegexOptions.IgnoreCase);
        if (mNotNull.Success)
        {
            var col = mNotNull.Groups["col"].Value;
            return row.GetTrimmedString(col) is not null;
        }

        // <col> = '<literal>'
        var mEq = Regex.Match(pred, @"^(?<col>\w+)\s*=\s*'(?<lit>[^']*)'$", RegexOptions.IgnoreCase);
        if (mEq.Success)
        {
            var col = mEq.Groups["col"].Value;
            var lit = mEq.Groups["lit"].Value;
            var val = row.GetTrimmedString(col) ?? string.Empty;
            return string.Equals(val, lit, StringComparison.OrdinalIgnoreCase);
        }

        // <col> <> '<literal>'
        var mNeq = Regex.Match(pred, @"^(?<col>\w+)\s*<>\s*'(?<lit>[^']*)'$", RegexOptions.IgnoreCase);
        if (mNeq.Success)
        {
            var col = mNeq.Groups["col"].Value;
            var lit = mNeq.Groups["lit"].Value;
            var val = row.GetTrimmedString(col) ?? string.Empty;
            return !string.Equals(val, lit, StringComparison.OrdinalIgnoreCase);
        }

        // Unrecognized predicate shape — fail safe (treat as active so
        // we don't silently mark the entire dictionary inactive). The
        // operator should fix the predicate; the loader's classification
        // summary surfaces the unrecognized predicate as a separate
        // diagnostic in the CLI dispatcher.
        return true;
    }
}

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
/// Slice C22-B implementation of
/// <see cref="IPropertyUseDictionaryLoaderService"/>. See the policy
/// doc (<c>docs/sync/property-use-dictionary-loader-policy.md</c>)
/// for the full contract.
///
/// <para>This service is read-only end-to-end:
/// <list type="number">
/// <item>Reads workbook code-value rows for
///   <c>dbo.property_val.property_use_cd</c> using
///   <see cref="DbContext.AsNoTracking"/>.</item>
/// <item>Reads PACS via <see cref="IPacsDictionaryReader"/> (the
///   abstraction that lets tests stub the SQL Server side).</item>
/// <item>Applies the M1-M5 classification rules in memory.</item>
/// <item>Returns the proposed CSV rows + counts. NEVER calls
///   <see cref="DbContext.SaveChangesAsync"/>.</item>
/// </list>
/// </para>
/// </summary>
public sealed class PropertyUseDictionaryLoaderService : IPropertyUseDictionaryLoaderService
{
    private const string PropertySchema = "dbo";
    private const string PropertyValTable = "property_val";
    private const string PropertyUseCdColumn = "property_use_cd";
    private const string PacsDictionarySchema = "dbo";
    private const string PacsDictionaryTable = "property_use";
    private const string CanonicalTarget = "PropertyUse";

    private readonly TerraFusionDbContext _db;
    private readonly IPacsDictionaryReader _pacs;

    public PropertyUseDictionaryLoaderService(
        TerraFusionDbContext db,
        IPacsDictionaryReader pacs)
    {
        ArgumentNullException.ThrowIfNull(db);
        ArgumentNullException.ThrowIfNull(pacs);
        _db = db;
        _pacs = pacs;
    }

    public async Task<PropertyUseDictionaryLoaderResult> ProposeReviewCsvAsync(
        Guid countyId,
        Guid workbookId,
        PropertyUseDictionaryColumnConfig dictionaryColumns,
        CancellationToken cancellationToken = default)
    {
        if (countyId == Guid.Empty)
            throw new ArgumentException("CountyId is required.", nameof(countyId));
        if (workbookId == Guid.Empty)
            throw new ArgumentException("WorkbookId is required.", nameof(workbookId));
        ArgumentNullException.ThrowIfNull(dictionaryColumns);
        if (string.IsNullOrWhiteSpace(dictionaryColumns.CodeColumn))
            throw new ArgumentException(
                "DictionaryColumns.CodeColumn is required (per C22-A live-inspection gate).",
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

        // ── Step 2: locate the property_val.property_use_cd column row ────
        var column = await _db.SyncMappingColumns
            .AsNoTracking()
            .FirstOrDefaultAsync(
                c => c.WorkbookId == workbookId
                  && c.SourceSchema == PropertySchema
                  && c.SourceTable == PropertyValTable
                  && c.SourceColumn == PropertyUseCdColumn,
                cancellationToken);
        if (column is null)
        {
            throw new InvalidOperationException(
                $"Workbook {workbookId} does not contain a column for " +
                $"{PropertySchema}.{PropertyValTable}.{PropertyUseCdColumn}; " +
                "C22-B cannot run.");
        }

        // ── Step 3: load all Deferred code-values for the column (the
        //   C16-D scope: 62 rows in Benton, but the service does not
        //   hardcode the count). ───────────────────────────────────────────
        var deferredRows = await _db.SyncMappingCodeValues
            .AsNoTracking()
            .Where(v => v.MappingColumnId == column.Id
                     && v.ReviewStatus == "Deferred")
            .ToListAsync(cancellationToken);

        // ── Step 4: read the PACS dictionary table (read-only) ────────────
        var dict = await _pacs.ReadDictionaryAsync(
            PacsDictionarySchema, PacsDictionaryTable, cancellationToken);

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
                    sourceValueRaw,
                    notes: $"Code '{sourceValueTrimmed}' observed in workbook " +
                           "but missing from PACS property_use dictionary; " +
                           "data-integrity issue or pre-2017 conversion artifact. " +
                           "Operator review required.",
                    classification: PropertyUseClassification.WorkbookCodeMissingFromDictionary));
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
                    sourceValueRaw,
                    notes: $"Code '{sourceValueTrimmed}' has multiple dictionary rows: " +
                           $"[{string.Join("; ", summaries)}]. " +
                           "Cannot unambiguously map. Operator review required.",
                    classification: PropertyUseClassification.DuplicateDictionaryCode));
                continue;
            }

            var only = matches[0];
            if (!IsRowActive(only, dictionaryColumns))
            {
                // M4 — inactive dictionary row
                m4++;
                proposed.Add(BuildDeferredRow(
                    sourceValueRaw,
                    notes: $"Code '{sourceValueTrimmed}' matches an INACTIVE PACS " +
                           "property_use dictionary row " +
                           $"[{SummarizeRow(only, dictionaryColumns)}]. May represent legacy " +
                           "or pre-conversion data. Operator review required.",
                    classification: PropertyUseClassification.InactiveDictionaryRow));
                continue;
            }

            // M5 — clean active unambiguous match → proposed Mapped
            m5++;
            var canonical = ResolveProposedCanonicalValue(only, dictionaryColumns, sourceValueTrimmed);
            proposed.Add(BuildMappedRow(
                sourceValueRaw,
                canonicalValue: canonical,
                notes: $"Dictionary-matched: [{SummarizeRow(only, dictionaryColumns)}]; " +
                       "reviewed via C22-A policy. " +
                       "Mapping reflects current dictionary semantics; pre-2017 records " +
                       "may carry different intent — operator confirms."));
        }

        return new PropertyUseDictionaryLoaderResult(
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
        // policy these rows are NOT included in the CSV; the count is
        // returned for the classification-summary.txt output.
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
        string sourceValue,
        string notes,
        PropertyUseClassification classification)
        => new(
            Scope:              "code_value",
            SourceSchema:       PropertySchema,
            SourceTable:        PropertyValTable,
            SourceColumn:       PropertyUseCdColumn,
            SourceValue:        sourceValue,
            ReviewStatus:       "Deferred",
            CanonicalTarget:    null,
            CanonicalValue:     null,
            CanonicalValueNull: true,
            IsExcluded:         false,
            Notes:              notes,
            Classification:     classification);

    private static ProposedReviewCsvRow BuildMappedRow(
        string sourceValue,
        string canonicalValue,
        string notes)
        => new(
            Scope:              "code_value",
            SourceSchema:       PropertySchema,
            SourceTable:        PropertyValTable,
            SourceColumn:       PropertyUseCdColumn,
            SourceValue:        sourceValue,
            ReviewStatus:       "Mapped",
            CanonicalTarget:    null,                  // column-row already has canonical_target=PropertyUse
            CanonicalValue:     canonicalValue,
            CanonicalValueNull: null,
            IsExcluded:         false,
            Notes:              notes,
            Classification:     PropertyUseClassification.CleanMatch);

    /// <summary>
    /// Picks the canonical_value to propose for an M5 row. Prefers the
    /// dictionary's description column when available; falls back to
    /// the canonical-target string when no description column was
    /// configured. The operator can always rephrase during the C22-C
    /// review pass.
    /// </summary>
    private static string ResolveProposedCanonicalValue(
        PacsDictionaryRow row,
        PropertyUseDictionaryColumnConfig cols,
        string trimmedCode)
    {
        if (cols.DescriptionColumn is { } descCol)
        {
            var desc = row.GetTrimmedString(descCol);
            if (!string.IsNullOrEmpty(desc)) return desc;
        }
        // Fallback: the operator-defined CanonicalTarget vocabulary,
        // suffixed with the code so each row has a unique canonical
        // label even without descriptions. Operator rephrases at C22-C.
        return $"{CanonicalTarget}:{trimmedCode}";
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
        PropertyUseDictionaryColumnConfig cols)
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
        PropertyUseDictionaryColumnConfig cols)
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

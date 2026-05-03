using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities.Sync.Mapping;
using TerraFusion.Data;

namespace TerraFusion.Sync.Workbench.Mapping;

/// <summary>
/// Slice C11-B implementation of
/// <see cref="ISyncMappingWorkbookBatchEditService"/>. See the policy
/// doc (<c>docs/sync/mapping-workbook-batch-edit-policy.md</c>) for
/// the full contract.
///
/// <para>Architecture:
/// <list type="number">
/// <item>Workbook lookup (county-scoped, Status='Draft' only).</item>
/// <item>Load all columns + code-values for the workbook into memory.
/// Per-workbook bounds (≤ 200 columns, ≤ ~2k code-values) make the
/// in-memory footprint trivial; this also lets validation use the
/// same case-insensitive identity rules across EF providers
/// (Postgres + InMemory) without provider-specific SQL.</item>
/// <item>Validate every CSV row. Collect errors instead of throwing on
/// the first one — operators get the full report in one pass.</item>
/// <item>If any row failed validation: return ValidationFailed; never
/// mutate, regardless of mode.</item>
/// <item>If dry-run: return DryRunValidated.</item>
/// <item>If apply: re-read workbook Status (concurrency check),
/// apply mutations in memory, bump workbook UpdatedAt once,
/// SaveChangesAsync (atomic), return Applied.</item>
/// </list>
/// </para>
///
/// <para>WacCd preservation: the service touches a code-value's
/// <c>IsExcluded</c> field only when the CSV row supplies
/// <c>is_excluded</c>. There is no pattern-matching against
/// <c>SourceValue</c>, no statute prefix logic, no inference from
/// <c>canonical_value</c>. The
/// <see cref="BatchEdit_DoesNotAutoExcludeWacCodes"/> test pins this.</para>
/// </summary>
public sealed class SyncMappingWorkbookBatchEditService : ISyncMappingWorkbookBatchEditService
{
    /// <summary>The only Status from which batch edits proceed.</summary>
    public const string DraftStatus = "Draft";

    /// <summary>
    /// Closed set of valid review-status values, mirroring the C9-A
    /// policy and the C9-B single-row edit service. Identical
    /// vocabulary across all edit paths so a CSV-fed batch can do
    /// anything a single-row CLI invocation can.
    /// </summary>
    public static IReadOnlySet<string> ValidReviewStatuses { get; } =
        new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "NeedsReview",
            "InProgress",
            "Mapped",
            "Excluded",
            "Deferred",
        };

    private readonly TerraFusionDbContext _db;

    public SyncMappingWorkbookBatchEditService(TerraFusionDbContext db)
    {
        ArgumentNullException.ThrowIfNull(db);
        _db = db;
    }

    public async Task<SyncMappingWorkbookBatchEditResult> ApplyAsync(
        Guid countyId,
        Guid workbookId,
        IReadOnlyList<BatchEditCsvRow> rows,
        SyncMappingWorkbookBatchEditMode mode,
        CancellationToken cancellationToken = default)
    {
        if (countyId == Guid.Empty)
            throw new ArgumentException("CountyId is required.", nameof(countyId));
        if (workbookId == Guid.Empty)
            throw new ArgumentException("WorkbookId is required.", nameof(workbookId));
        ArgumentNullException.ThrowIfNull(rows);

        // Hard Guard #1 + #2 — Status='Draft' AND county scope.
        var workbook = await _db.SyncMappingWorkbooks
            .FirstOrDefaultAsync(
                w => w.Id == workbookId && w.CountyId == countyId,
                cancellationToken);
        if (workbook is null)
        {
            throw new InvalidOperationException(
                $"Mapping workbook {workbookId} not found for county {countyId}.");
        }
        if (!string.Equals(workbook.Status, DraftStatus, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"Mapping workbook {workbookId} has Status='{workbook.Status}'. " +
                $"Only workbooks with Status='{DraftStatus}' can be batch-edited.");
        }

        // Load workbook entities for in-memory validation. Bounded by
        // workbook size (≤ 200 columns × ~10 code-values per column for
        // the Benton corpus); the in-memory cost is dwarfed by the
        // network round-trips we save by not querying per row.
        var columns = await _db.SyncMappingColumns
            .Where(c => c.WorkbookId == workbookId)
            .ToListAsync(cancellationToken);
        var columnIds = columns.Select(c => c.Id).ToList();
        var codeValues = await _db.SyncMappingCodeValues
            .Where(v => columnIds.Contains(v.MappingColumnId))
            .ToListAsync(cancellationToken);

        // Validate every row. Collect resolved targets so apply can
        // mutate without re-resolving. ValidationFailed is the only
        // outcome when ANY row has an error — half-applied is not a
        // legal state.
        var (resolvedRows, errors) = ValidateRows(rows, columns, codeValues);

        if (errors.Count > 0)
        {
            return new SyncMappingWorkbookBatchEditResult(
                WorkbookId:        workbookId,
                Mode:              mode,
                Outcome:           SyncMappingWorkbookBatchEditOutcome.ValidationFailed,
                RowsValidated:     rows.Count,
                RowsToMutate:      0,
                ColumnRowCount:    0,
                CodeValueRowCount: 0,
                MappedCount:       0,
                ExcludedCount:     0,
                DeferredCount:     0,
                InProgressCount:   0,
                NeedsReviewCount:  0,
                Errors:            errors);
        }

        // Per-scope and per-status summaries computed from the resolved
        // rows. Same shape regardless of dry-run / apply.
        var columnRowCount    = resolvedRows.Count(r => r.IsCodeValueScope == false);
        var codeValueRowCount = resolvedRows.Count(r => r.IsCodeValueScope);
        var mapped     = resolvedRows.Count(r => string.Equals(r.Row.ReviewStatus, "Mapped",      StringComparison.OrdinalIgnoreCase));
        var excluded   = resolvedRows.Count(r => string.Equals(r.Row.ReviewStatus, "Excluded",    StringComparison.OrdinalIgnoreCase));
        var deferred   = resolvedRows.Count(r => string.Equals(r.Row.ReviewStatus, "Deferred",    StringComparison.OrdinalIgnoreCase));
        var inProgress = resolvedRows.Count(r => string.Equals(r.Row.ReviewStatus, "InProgress",  StringComparison.OrdinalIgnoreCase));
        var needsRev   = resolvedRows.Count(r => string.Equals(r.Row.ReviewStatus, "NeedsReview", StringComparison.OrdinalIgnoreCase));

        if (mode == SyncMappingWorkbookBatchEditMode.DryRun)
        {
            return new SyncMappingWorkbookBatchEditResult(
                WorkbookId:        workbookId,
                Mode:              mode,
                Outcome:           SyncMappingWorkbookBatchEditOutcome.DryRunValidated,
                RowsValidated:     rows.Count,
                RowsToMutate:      resolvedRows.Count,
                ColumnRowCount:    columnRowCount,
                CodeValueRowCount: codeValueRowCount,
                MappedCount:       mapped,
                ExcludedCount:     excluded,
                DeferredCount:     deferred,
                InProgressCount:   inProgress,
                NeedsReviewCount:  needsRev,
                Errors:            Array.Empty<BatchEditValidationError>());
        }

        // ── Apply phase ────────────────────────────────────────────────
        // Re-read workbook Status to catch concurrent locks / status
        // flips that landed between validation and apply. Cheap: a
        // single tracked-entity refresh.
        await _db.Entry(workbook).ReloadAsync(cancellationToken);
        if (!string.Equals(workbook.Status, DraftStatus, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"Concurrent modification detected: workbook {workbookId} Status changed " +
                $"to '{workbook.Status}' between validation and apply. Batch refused; " +
                $"no mutations applied.");
        }

        // Apply mutations in memory; SaveChangesAsync will batch them
        // into a single transaction. Every touched entity gets its own
        // UpdatedAt bump; the workbook gets exactly one bump for the
        // whole batch (we set it once below, regardless of row count).
        var now = DateTime.UtcNow;
        foreach (var resolved in resolvedRows)
        {
            if (resolved.IsCodeValueScope)
            {
                ApplyCodeValueMutations(resolved.CodeValue!, resolved.Row);
                resolved.CodeValue!.UpdatedAt = now;
            }
            else
            {
                ApplyColumnMutations(resolved.Column!, resolved.Row);
                resolved.Column!.UpdatedAt = now;
            }
        }

        // Single workbook audit-stamp bump per batch (policy guard).
        workbook.UpdatedAt = now;

        await _db.SaveChangesAsync(cancellationToken);

        return new SyncMappingWorkbookBatchEditResult(
            WorkbookId:        workbookId,
            Mode:              mode,
            Outcome:           SyncMappingWorkbookBatchEditOutcome.Applied,
            RowsValidated:     rows.Count,
            RowsToMutate:      resolvedRows.Count,
            ColumnRowCount:    columnRowCount,
            CodeValueRowCount: codeValueRowCount,
            MappedCount:       mapped,
            ExcludedCount:     excluded,
            DeferredCount:     deferred,
            InProgressCount:   inProgress,
            NeedsReviewCount:  needsRev,
            Errors:            Array.Empty<BatchEditValidationError>());
    }

    // ── Validation pipeline ────────────────────────────────────────────

    /// <summary>
    /// One CSV row resolved against the workbook's columns + code-values.
    /// On successful validation we cache the matched entity here so the
    /// apply phase doesn't re-query.
    /// </summary>
    private sealed record ResolvedRow(
        BatchEditCsvRow Row,
        bool IsCodeValueScope,
        SyncMappingColumn? Column,
        SyncMappingCodeValue? CodeValue);

    private static (IReadOnlyList<ResolvedRow> Resolved, IReadOnlyList<BatchEditValidationError> Errors)
        ValidateRows(
            IReadOnlyList<BatchEditCsvRow> rows,
            IReadOnlyList<SyncMappingColumn> columns,
            IReadOnlyList<SyncMappingCodeValue> codeValues)
    {
        var errors = new List<BatchEditValidationError>();
        var resolved = new List<ResolvedRow>(rows.Count);

        // Track resolved targets to detect duplicates across the batch.
        var seenColumnTargets    = new HashSet<Guid>();
        var seenCodeValueTargets = new HashSet<Guid>();

        foreach (var row in rows)
        {
            var sourceLabel = BuildSourceLabel(row);

            // 1. Identity columns must be non-empty.
            if (string.IsNullOrEmpty(row.Scope))
            {
                errors.Add(new BatchEditValidationError(row.LineNumber, row.Scope, sourceLabel, "scope is required."));
                continue;
            }
            if (!BatchEditCsvParser.ValidScopes.Contains(row.Scope))
            {
                errors.Add(new BatchEditValidationError(row.LineNumber, row.Scope, sourceLabel,
                    $"scope '{row.Scope}' is not 'column' or 'code_value'."));
                continue;
            }
            if (string.IsNullOrEmpty(row.SourceSchema) ||
                string.IsNullOrEmpty(row.SourceTable) ||
                string.IsNullOrEmpty(row.SourceColumn))
            {
                errors.Add(new BatchEditValidationError(row.LineNumber, row.Scope, sourceLabel,
                    "source_schema / source_table / source_column are all required."));
                continue;
            }

            var isCodeValueScope = string.Equals(row.Scope, "code_value", StringComparison.OrdinalIgnoreCase);

            // 2. Scope-correct presence of source_value.
            if (isCodeValueScope)
            {
                if (string.IsNullOrEmpty(row.SourceValue))
                {
                    errors.Add(new BatchEditValidationError(row.LineNumber, row.Scope, sourceLabel,
                        "source_value is required when scope=code_value."));
                    continue;
                }
            }
            else
            {
                if (!string.IsNullOrEmpty(row.SourceValue))
                {
                    errors.Add(new BatchEditValidationError(row.LineNumber, row.Scope, sourceLabel,
                        "source_value must be empty when scope=column."));
                    continue;
                }
            }

            // 3. Review status from the closed vocabulary.
            if (string.IsNullOrEmpty(row.ReviewStatus))
            {
                errors.Add(new BatchEditValidationError(row.LineNumber, row.Scope, sourceLabel,
                    "review_status is required."));
                continue;
            }
            if (!ValidReviewStatuses.Contains(row.ReviewStatus))
            {
                errors.Add(new BatchEditValidationError(row.LineNumber, row.Scope, sourceLabel,
                    $"review_status '{row.ReviewStatus}' is not one of: " +
                    $"{string.Join(", ", ValidReviewStatuses)}."));
                continue;
            }

            // 4. Scope-correct mutation fields.
            if (isCodeValueScope)
            {
                if (row.CanonicalTarget is not null)
                {
                    errors.Add(new BatchEditValidationError(row.LineNumber, row.Scope, sourceLabel,
                        "canonical_target is column-scope only and cannot be combined with scope=code_value."));
                    continue;
                }
            }
            else
            {
                if (row.CanonicalValue is not null)
                {
                    errors.Add(new BatchEditValidationError(row.LineNumber, row.Scope, sourceLabel,
                        "canonical_value is code-value-scope only — set scope=code_value or remove this field."));
                    continue;
                }
                if (row.CanonicalValueNullRaw is not null)
                {
                    errors.Add(new BatchEditValidationError(row.LineNumber, row.Scope, sourceLabel,
                        "canonical_value_null is code-value-scope only — set scope=code_value or remove this field."));
                    continue;
                }
                if (row.IsExcludedRaw is not null)
                {
                    errors.Add(new BatchEditValidationError(row.LineNumber, row.Scope, sourceLabel,
                        "is_excluded is code-value-scope only — set scope=code_value or remove this field."));
                    continue;
                }
            }

            // 5. canonical_value vs canonical_value_null mutex.
            if (row.CanonicalValue is not null && row.CanonicalValueNullRaw is not null)
            {
                errors.Add(new BatchEditValidationError(row.LineNumber, row.Scope, sourceLabel,
                    "canonical_value and canonical_value_null are mutually exclusive — supply one or the other."));
                continue;
            }

            // 6. canonical_value_null and is_excluded shape (must be 'true' / 'false' / empty).
            if (row.CanonicalValueNullRaw is not null &&
                !string.Equals(row.CanonicalValueNullRaw.Trim(), "true", StringComparison.OrdinalIgnoreCase))
            {
                errors.Add(new BatchEditValidationError(row.LineNumber, row.Scope, sourceLabel,
                    $"canonical_value_null must be 'true' or empty. Got '{row.CanonicalValueNullRaw}'."));
                continue;
            }
            bool? isExcluded = null;
            if (row.IsExcludedRaw is not null)
            {
                var trimmed = row.IsExcludedRaw.Trim();
                if (string.Equals(trimmed, "true", StringComparison.OrdinalIgnoreCase))      isExcluded = true;
                else if (string.Equals(trimmed, "false", StringComparison.OrdinalIgnoreCase)) isExcluded = false;
                else
                {
                    errors.Add(new BatchEditValidationError(row.LineNumber, row.Scope, sourceLabel,
                        $"is_excluded must be 'true' or 'false'. Got '{row.IsExcludedRaw}'."));
                    continue;
                }
            }

            // 7. At-least-one mutation. review_status counts as a mutation
            // because it always lands a value; the policy explicitly
            // allows "rolling back to NeedsReview / InProgress" as a
            // legitimate review action.
            // (review_status was already validated as non-empty above, so
            // every successfully-validated row has at least review_status.)

            // 8. Identity must resolve to exactly one row in the
            // workbook. Schema/table/column are case-insensitive;
            // source_value is exact-after-trim per the C9-B contract.
            var matchedColumn = columns.FirstOrDefault(c =>
                string.Equals(c.SourceSchema, row.SourceSchema, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(c.SourceTable,  row.SourceTable,  StringComparison.OrdinalIgnoreCase) &&
                string.Equals(c.SourceColumn, row.SourceColumn, StringComparison.OrdinalIgnoreCase));

            if (matchedColumn is null)
            {
                errors.Add(new BatchEditValidationError(row.LineNumber, row.Scope, sourceLabel,
                    $"no matching column in workbook for {row.SourceSchema}.{row.SourceTable}.{row.SourceColumn}."));
                continue;
            }

            if (isCodeValueScope)
            {
                // Slice C12: trim-on-both-sides match. PACS char(N)
                // codes arrive padded ("00   "); the operator types
                // "00". Both must match. See MappingSourceValueMatcher.
                var operatorValue = row.SourceValue!;
                var matchesForRow = codeValues
                    .Where(v => v.MappingColumnId == matchedColumn.Id
                             && MappingSourceValueMatcher.MatchesAfterTrim(v.SourceValue, operatorValue))
                    .ToList();

                if (matchesForRow.Count == 0)
                {
                    errors.Add(new BatchEditValidationError(row.LineNumber, row.Scope, sourceLabel,
                        $"no matching code value '{operatorValue.Trim()}' under " +
                        $"{row.SourceSchema}.{row.SourceTable}.{row.SourceColumn}."));
                    continue;
                }
                if (matchesForRow.Count > 1)
                {
                    errors.Add(new BatchEditValidationError(row.LineNumber, row.Scope, sourceLabel,
                        MappingSourceValueMatcher.BuildAmbiguousMatchMessage(
                            row.SourceSchema, row.SourceTable, row.SourceColumn,
                            operatorValue, matchesForRow.Select(m => (string?)m.SourceValue))));
                    continue;
                }

                var matchedCodeValue = matchesForRow[0];

                // 9. Duplicate-target detection.
                if (!seenCodeValueTargets.Add(matchedCodeValue.Id))
                {
                    errors.Add(new BatchEditValidationError(row.LineNumber, row.Scope, sourceLabel,
                        "duplicate target — another row in this CSV already targets the same code value."));
                    continue;
                }

                resolved.Add(new ResolvedRow(row, true, matchedColumn, matchedCodeValue));
            }
            else
            {
                if (!seenColumnTargets.Add(matchedColumn.Id))
                {
                    errors.Add(new BatchEditValidationError(row.LineNumber, row.Scope, sourceLabel,
                        "duplicate target — another row in this CSV already targets the same column."));
                    continue;
                }
                resolved.Add(new ResolvedRow(row, false, matchedColumn, null));
            }

            // Note: isExcluded is captured per-row via IsExcludedRaw and
            // read back during apply via the same parsing helper. We do
            // not persist it on ResolvedRow because keeping the parsed
            // bool out of the apply phase would require a second pass.
        }

        return (resolved, errors);
    }

    private static string BuildSourceLabel(BatchEditCsvRow row)
    {
        var triple = $"{row.SourceSchema}.{row.SourceTable}.{row.SourceColumn}";
        return string.IsNullOrEmpty(row.SourceValue) ? triple : $"{triple} / {row.SourceValue}";
    }

    // ── Mutation appliers ──────────────────────────────────────────────
    //
    // Applied in-memory only; SaveChangesAsync runs once at the end of
    // ApplyAsync. Every row supplies review_status (validated above) so
    // it always lands. canonical_target / canonical_value / notes only
    // land when the CSV row supplies them; an empty cell is "do not
    // touch" (the C9-A contract verbatim).

    private static void ApplyColumnMutations(SyncMappingColumn column, BatchEditCsvRow row)
    {
        column.ReviewStatus = row.ReviewStatus;
        if (row.CanonicalTarget is not null) column.CanonicalTarget = row.CanonicalTarget;
        if (row.Notes           is not null) column.Notes           = row.Notes;
    }

    private static void ApplyCodeValueMutations(SyncMappingCodeValue codeValue, BatchEditCsvRow row)
    {
        codeValue.ReviewStatus = row.ReviewStatus;

        if (row.CanonicalValue is not null)
        {
            codeValue.CanonicalValue = row.CanonicalValue;
        }
        else if (row.CanonicalValueNullRaw is not null)
        {
            // Already validated as 'true' or empty.
            codeValue.CanonicalValue = null;
        }

        if (row.IsExcludedRaw is not null)
        {
            // Already validated as 'true' or 'false'.
            var trimmed = row.IsExcludedRaw.Trim();
            codeValue.IsExcluded = string.Equals(trimmed, "true", StringComparison.OrdinalIgnoreCase);
        }

        if (row.Notes is not null) codeValue.Notes = row.Notes;
    }
}

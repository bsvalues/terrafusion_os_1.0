using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities.Sync.Mapping;
using TerraFusion.Data;

namespace TerraFusion.Sync.Workbench.Mapping;

/// <summary>
/// Slice C9-B implementation of
/// <see cref="ISyncMappingWorkbookEditService"/>. See the policy doc
/// (<c>docs/sync/mapping-workbook-edit-cli-policy.md</c>) for the full
/// contract.
///
/// <para>Architecture: a single <see cref="EditAsync"/> method validates
/// the request, looks up the target row (column or code-value),
/// captures pre-edit state, applies only the supplied mutations, bumps
/// audit stamps, and returns a <see cref="SyncMappingWorkbookEditResult"/>
/// with both pre and post snapshots so the CLI display layer can render
/// a diff panel without re-querying.</para>
///
/// <para>Defense-in-depth: even though the CLI parser enforces the six
/// Hard Guards from C9-A, the service repeats every check so a future
/// programmatic caller (test, batch tool, internal API) cannot bypass
/// them by constructing a malformed request directly.</para>
/// </summary>
public sealed class SyncMappingWorkbookEditService : ISyncMappingWorkbookEditService
{
    /// <summary>The only Status from which edits can proceed.</summary>
    public const string DraftStatus = "Draft";

    /// <summary>
    /// Closed set of valid review-status values, mirroring the C9-A
    /// policy. Locking (C6) further restricts to a subset for terminal-
    /// for-lock state, but edit accepts any of the five so an operator
    /// can roll a row back to NeedsReview / InProgress mid-review.
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

    /// <summary>Scope label for a column-row edit. Returned in <see cref="SyncMappingWorkbookEditResult.Scope"/>.</summary>
    public const string ColumnScope = "column";

    /// <summary>Scope label for a code-value-row edit.</summary>
    public const string CodeValueScope = "code value";

    private readonly TerraFusionDbContext _db;

    public SyncMappingWorkbookEditService(TerraFusionDbContext db)
    {
        ArgumentNullException.ThrowIfNull(db);
        _db = db;
    }

    public async Task<SyncMappingWorkbookEditResult> EditAsync(
        Guid countyId,
        Guid workbookId,
        SyncMappingWorkbookEditRequest request,
        CancellationToken cancellationToken = default)
    {
        if (countyId == Guid.Empty)
            throw new ArgumentException("CountyId is required.", nameof(countyId));
        if (workbookId == Guid.Empty)
            throw new ArgumentException("WorkbookId is required.", nameof(workbookId));
        ArgumentNullException.ThrowIfNull(request);
        if (string.IsNullOrWhiteSpace(request.SourceSchema))
            throw new ArgumentException("Request.SourceSchema must be non-empty.", nameof(request));
        if (string.IsNullOrWhiteSpace(request.SourceTable))
            throw new ArgumentException("Request.SourceTable must be non-empty.", nameof(request));
        if (string.IsNullOrWhiteSpace(request.SourceColumn))
            throw new ArgumentException("Request.SourceColumn must be non-empty.", nameof(request));

        var isCodeValueScope = request.SourceValue is not null;

        // Hard Guard #5 — scope-correct fields.
        ValidateScopeCorrectFields(request, isCodeValueScope);

        // Hard Guard #4 — at-least-one mutation supplied.
        if (!HasAnyMutation(request))
        {
            throw new ArgumentException(
                "Request must supply at least one mutation field " +
                "(canonical-target / canonical-value / canonical-value-null / " +
                "review-status / is-excluded / notes).",
                nameof(request));
        }

        // Hard Guard #6 — review-status from closed vocabulary.
        if (request.ReviewStatus is not null &&
            !ValidReviewStatuses.Contains(request.ReviewStatus))
        {
            throw new ArgumentException(
                $"Request.ReviewStatus '{request.ReviewStatus}' is not one of: " +
                $"{string.Join(", ", ValidReviewStatuses)}.",
                nameof(request));
        }

        // CanonicalValue + CanonicalValueNull are mutex.
        if (request.CanonicalValueNull && request.CanonicalValue is not null)
        {
            throw new ArgumentException(
                "Request.CanonicalValue and Request.CanonicalValueNull are mutually exclusive " +
                "— supply one or the other, not both.",
                nameof(request));
        }

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
                $"Only workbooks with Status='{DraftStatus}' can be edited.");
        }

        // Hard Guard #3 — exact source-row identity.
        // Column lookup is case-insensitive on (schema, table, column).
        // Pull all of the workbook's columns and filter client-side —
        // the case-insensitive comparison must work uniformly across
        // EF Core providers (Postgres, InMemory for tests). Per-workbook
        // column counts are bounded (typically <= 200), so the in-memory
        // filter is cheap.
        var workbookColumns = await _db.SyncMappingColumns
            .Where(c => c.WorkbookId == workbookId)
            .ToListAsync(cancellationToken);

        var column = workbookColumns.FirstOrDefault(c =>
            string.Equals(c.SourceSchema, request.SourceSchema, StringComparison.OrdinalIgnoreCase) &&
            string.Equals(c.SourceTable,  request.SourceTable,  StringComparison.OrdinalIgnoreCase) &&
            string.Equals(c.SourceColumn, request.SourceColumn, StringComparison.OrdinalIgnoreCase));

        if (column is null)
        {
            throw new InvalidOperationException(
                $"Source column {request.SourceSchema}.{request.SourceTable}.{request.SourceColumn} " +
                $"not found in workbook {workbookId}.");
        }

        return isCodeValueScope
            ? await EditCodeValueAsync(workbook, column, request, cancellationToken)
            : await EditColumnAsync(workbook, column, request, cancellationToken);
    }

    // ── Scope validation ────────────────────────────────────────────────

    private static void ValidateScopeCorrectFields(
        SyncMappingWorkbookEditRequest request,
        bool isCodeValueScope)
    {
        if (isCodeValueScope)
        {
            // Code-value scope: CanonicalTarget is column-only.
            if (request.CanonicalTarget is not null)
            {
                throw new ArgumentException(
                    "Request.CanonicalTarget is column-scope only and cannot be supplied " +
                    "with Request.SourceValue.",
                    nameof(request));
            }
        }
        else
        {
            // Column scope: CanonicalValue / CanonicalValueNull / IsExcluded
            // are code-value-only.
            if (request.CanonicalValue is not null)
            {
                throw new ArgumentException(
                    "Request.CanonicalValue is code-value-scope only — supply " +
                    "Request.SourceValue alongside it.",
                    nameof(request));
            }
            if (request.CanonicalValueNull)
            {
                throw new ArgumentException(
                    "Request.CanonicalValueNull is code-value-scope only — supply " +
                    "Request.SourceValue alongside it.",
                    nameof(request));
            }
            if (request.IsExcluded.HasValue)
            {
                throw new ArgumentException(
                    "Request.IsExcluded is code-value-scope only — supply " +
                    "Request.SourceValue alongside it.",
                    nameof(request));
            }
        }
    }

    private static bool HasAnyMutation(SyncMappingWorkbookEditRequest r)
    {
        return r.CanonicalTarget is not null
            || r.CanonicalValue is not null
            || r.CanonicalValueNull
            || r.ReviewStatus is not null
            || r.IsExcluded.HasValue
            || r.Notes is not null;
    }

    // ── Column-scope edit ───────────────────────────────────────────────

    private async Task<SyncMappingWorkbookEditResult> EditColumnAsync(
        SyncMappingWorkbook workbook,
        SyncMappingColumn column,
        SyncMappingWorkbookEditRequest request,
        CancellationToken cancellationToken)
    {
        var before = ColumnFields(column);

        if (request.CanonicalTarget is not null) column.CanonicalTarget = request.CanonicalTarget;
        if (request.ReviewStatus    is not null) column.ReviewStatus    = request.ReviewStatus;
        if (request.Notes           is not null) column.Notes           = request.Notes;

        var now = DateTime.UtcNow;
        column.UpdatedAt   = now;
        workbook.UpdatedAt = now;

        await _db.SaveChangesAsync(cancellationToken);

        var after = ColumnFields(column);

        return new SyncMappingWorkbookEditResult(
            WorkbookId:  workbook.Id,
            EditedRowId: column.Id,
            Scope:       ColumnScope,
            Before:      before,
            After:       after,
            Changed:     AnyDifferent(before, after));
    }

    private static IReadOnlyDictionary<string, string?> ColumnFields(SyncMappingColumn c)
        => new Dictionary<string, string?>
        {
            ["canonical_target"] = c.CanonicalTarget,
            ["review_status"]    = c.ReviewStatus,
            ["notes"]            = c.Notes,
        };

    // ── Code-value-scope edit ───────────────────────────────────────────

    private async Task<SyncMappingWorkbookEditResult> EditCodeValueAsync(
        SyncMappingWorkbook workbook,
        SyncMappingColumn column,
        SyncMappingWorkbookEditRequest request,
        CancellationToken cancellationToken)
    {
        // SourceValue match (Slice C12): exact-after-trim on BOTH
        // sides. PACS char(N) sources arrive padded ("00   "); the
        // operator's natural input ("00") must match without forcing
        // them to type invisible spaces. The stored value is never
        // rewritten — see MappingSourceValueMatcher for the contract.
        //
        // We pull all of the column's code-values into memory and
        // filter client-side. Per-column code-value counts are
        // bounded (typically <= a few hundred), and the matcher's
        // semantics (case-significant, no internal-whitespace
        // collapse, ambiguity detection) are easier to verify in
        // memory than across EF providers.
        var operatorValue = request.SourceValue!;
        var allValues = await _db.SyncMappingCodeValues
            .Where(v => v.MappingColumnId == column.Id)
            .ToListAsync(cancellationToken);

        var matches = allValues
            .Where(v => MappingSourceValueMatcher.MatchesAfterTrim(v.SourceValue, operatorValue))
            .ToList();

        if (matches.Count == 0)
        {
            throw new InvalidOperationException(
                $"Source value '{operatorValue.Trim()}' not found in column " +
                $"{request.SourceSchema}.{request.SourceTable}.{request.SourceColumn} " +
                $"of workbook {workbook.Id}.");
        }
        if (matches.Count > 1)
        {
            throw new InvalidOperationException(
                MappingSourceValueMatcher.BuildAmbiguousMatchMessage(
                    request.SourceSchema, request.SourceTable, request.SourceColumn,
                    operatorValue, matches.Select(m => (string?)m.SourceValue)));
        }

        var codeValue = matches[0];

        var before = CodeValueFields(codeValue);

        if (request.CanonicalValue     is not null) codeValue.CanonicalValue = request.CanonicalValue;
        if (request.CanonicalValueNull)             codeValue.CanonicalValue = null;
        if (request.ReviewStatus       is not null) codeValue.ReviewStatus   = request.ReviewStatus;
        if (request.IsExcluded.HasValue)            codeValue.IsExcluded     = request.IsExcluded.Value;
        if (request.Notes              is not null) codeValue.Notes          = request.Notes;

        var now = DateTime.UtcNow;
        codeValue.UpdatedAt = now;
        workbook.UpdatedAt  = now;

        await _db.SaveChangesAsync(cancellationToken);

        var after = CodeValueFields(codeValue);

        return new SyncMappingWorkbookEditResult(
            WorkbookId:  workbook.Id,
            EditedRowId: codeValue.Id,
            Scope:       CodeValueScope,
            Before:      before,
            After:       after,
            Changed:     AnyDifferent(before, after));
    }

    private static IReadOnlyDictionary<string, string?> CodeValueFields(SyncMappingCodeValue v)
        => new Dictionary<string, string?>
        {
            ["canonical_value"] = v.CanonicalValue,
            ["review_status"]   = v.ReviewStatus,
            ["is_excluded"]     = v.IsExcluded ? "true" : "false",
            ["notes"]           = v.Notes,
        };

    // ── Diff helper ─────────────────────────────────────────────────────

    private static bool AnyDifferent(
        IReadOnlyDictionary<string, string?> before,
        IReadOnlyDictionary<string, string?> after)
    {
        foreach (var kvp in before)
        {
            if (!after.TryGetValue(kvp.Key, out var afterValue)) return true;
            if (!string.Equals(kvp.Value, afterValue, StringComparison.Ordinal)) return true;
        }
        return false;
    }
}

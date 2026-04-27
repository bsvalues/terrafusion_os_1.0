using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Mapping;

/// <summary>
/// Slice C3: turns a B2.7 deep-profile batch's
/// <c>SyncProfileCodeCandidate</c> rows into draft Mapping Workbook rows
/// (<c>SyncMappingWorkbook</c> / <c>SyncMappingColumn</c> /
/// <c>SyncMappingCodeValue</c>) ready for assessor review.
///
/// <para>The loader is the bridge between evidence (Slice B2) and review
/// (Slice C2). It does NOT consume mappings — Slice C3 is intentionally
/// narrow:
/// <list type="bullet">
/// <item>It reads <c>SyncProfileCodeCandidate</c> rows for the requested
/// <paramref name="countyId" /> + <paramref name="profileBatchId" /> scope.</item>
/// <item>It creates one workbook with one column per qualifying candidate
/// and one code-value row per top-N entry from the candidate's
/// <c>CandidateCodesJson</c>.</item>
/// <item>It infers a <see cref="SyncMappingColumn.MappingLane"/> from the
/// (table, column) pair using the C1 priority list — see
/// <see cref="SyncMappingWorkbookDraftLoader.InferLane"/> for the rules.</item>
/// <item>It is idempotent against existing <c>Draft</c> workbooks for the
/// same key — see <see cref="SyncMappingWorkbookDraftOptions.ReplaceExistingDraft"/>
/// for the replace/no-replace switch — and refuses to touch a workbook
/// whose <c>Status</c> has graduated past <c>Draft</c>.</item>
/// </list>
/// </para>
///
/// <para>What this loader does NOT do:
/// <list type="bullet">
/// <item>Apply mappings to PACS rows / canonical landing tables /
/// valuation artifacts / GIS artifacts. Slice C4+ owns consumption.</item>
/// <item>Auto-decide <c>IsExcluded</c>. Even known sales-exclusion
/// candidates like <c>sale.wac_cd</c> exempt-transfer codes are surfaced
/// as <c>NeedsReview</c> with <c>IsExcluded=false</c> — the workbook is
/// for HUMAN decisions, not silent filtering.</item>
/// <item>Mutate <c>SyncProfileCodeCandidate</c> rows. The profile is the
/// source of truth; the workbook is a downstream copy.</item>
/// </list>
/// </para>
/// </summary>
public interface ISyncMappingWorkbookDraftLoader
{
    Task<SyncMappingWorkbookDraftResult> CreateDraftAsync(
        Guid countyId,
        Guid profileBatchId,
        SyncMappingWorkbookDraftOptions options,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Caller-supplied policy for a draft-load. All fields are optional except
/// <see cref="WorkbookName"/>; the rest preserve C1-seed defaults if left
/// unset.
/// </summary>
public sealed record SyncMappingWorkbookDraftOptions(
    string WorkbookName,
    bool ReplaceExistingDraft = false,
    int? MaxCandidates = null,
    IReadOnlySet<string>? IncludeQualifiedColumns = null)
{
    /// <summary>True when <paramref name="schema"/>.<paramref name="table"/>.<paramref name="column"/> matches the include allowlist (or no allowlist set).</summary>
    public bool MatchesInclude(string schema, string table, string column)
    {
        if (IncludeQualifiedColumns is null || IncludeQualifiedColumns.Count == 0)
        {
            return true;
        }

        var qualified = $"{schema}.{table}.{column}";
        return IncludeQualifiedColumns.Contains(qualified);
    }
}

/// <summary>
/// Per-call summary the loader returns to the operator. Counts split
/// "what we created on this call" vs "what we skipped" so the outcome of
/// an idempotent re-run is legible.
/// </summary>
public sealed record SyncMappingWorkbookDraftResult(
    Guid WorkbookId,
    int  ColumnsCreated,
    int  CodeValuesCreated,
    int  CandidatesSkipped,
    bool ReusedExistingDraft);

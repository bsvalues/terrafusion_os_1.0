using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Mapping;

/// <summary>
/// Slice C9-B: edits one Mapping Workbook column or code-value row per
/// invocation while the workbook is <c>Status='Draft'</c>.
///
/// <para>See <c>docs/sync/mapping-workbook-edit-cli-policy.md</c>
/// (Slice C9-A) for the full safety contract — this interface implements
/// only what that policy specified. The six Hard Guards from the policy
/// are enforced here as defense-in-depth (the parser also enforces them
/// at the CLI surface):
/// <list type="number">
/// <item>Workbook <c>Status='Draft'</c> only.</item>
/// <item>County scope (workbook's <c>CountyId</c> matches caller).</item>
/// <item>Exact source-row identity — no wildcards, no fuzzy match.</item>
/// <item>At-least-one mutation field supplied; bare requests rejected.</item>
/// <item>Scope-correct fields (column-only vs. code-value-only).</item>
/// <item>Valid review status from the closed C2 vocabulary.</item>
/// </list>
/// </para>
///
/// <para>What this service does NOT do:
/// <list type="bullet">
/// <item>Auto-exclude WAC codes (memory-flagged directive). The
/// operator's explicit <c>IsExcluded=true</c> is the only path to
/// exclusion.</item>
/// <item>Lock the workbook. Reaching all-terminal review-status state
/// does not trigger Draft → Mapped; that's a separate slice.</item>
/// <item>Mutate <c>SyncProfileCodeCandidate</c>, PACS, canonical
/// landing tables, Forge / TerraAtlas / Studio / Dais artifacts.</item>
/// <item>Edit Mapped / Approved / Archived workbooks. Locked review
/// work is the audit trail; rolling back requires a new workbook
/// (Slice C3 loader), not in-place edit.</item>
/// </list>
/// </para>
/// </summary>
public interface ISyncMappingWorkbookEditService
{
    Task<SyncMappingWorkbookEditResult> EditAsync(
        Guid countyId,
        Guid workbookId,
        SyncMappingWorkbookEditRequest request,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Per-call edit input. Source identity (<see cref="SourceSchema"/> /
/// <see cref="SourceTable"/> / <see cref="SourceColumn"/>) is required;
/// <see cref="SourceValue"/> presence determines column vs. code-value
/// scope.
///
/// <para>For mutating fields, <c>null</c> means "operator did not
/// supply this flag" (don't touch the underlying field). Setting
/// <c>CanonicalValue</c> to the explicit <c>null</c> value (cleared)
/// uses <see cref="CanonicalValueNull"/>=<c>true</c>, which is mutex
/// with a non-null <see cref="CanonicalValue"/>.</para>
/// </summary>
public sealed record SyncMappingWorkbookEditRequest(
    string SourceSchema,
    string SourceTable,
    string SourceColumn,
    string? SourceValue,
    string? CanonicalTarget,    // column-scope only
    string? CanonicalValue,     // code-value-scope only; mutex with CanonicalValueNull
    bool   CanonicalValueNull,  // code-value-scope only
    string? ReviewStatus,       // either scope
    bool?  IsExcluded,          // code-value-scope only
    string? Notes);             // either scope

/// <summary>
/// Per-call edit result.
///
/// <para><see cref="Scope"/> is <c>"column"</c> or <c>"code value"</c>.</para>
///
/// <para><see cref="Before"/> / <see cref="After"/> dictionaries hold
/// every editable field for the scope, even ones the operator didn't
/// touch — so a CLI display layer can read "(unchanged)" by comparing
/// the two dicts pair-wise. Null values in the dicts mean the
/// underlying entity field is null.</para>
///
/// <para><see cref="Changed"/> is <c>true</c> iff at least one field
/// differs between <see cref="Before"/> and <see cref="After"/>. Audit
/// stamps (<c>UpdatedAt</c>, <c>UpdatedBy</c>) bump on every successful
/// edit regardless of <see cref="Changed"/> — operator confirmation is
/// itself an auditable event per the C9-A policy.</para>
/// </summary>
public sealed record SyncMappingWorkbookEditResult(
    Guid WorkbookId,
    Guid EditedRowId,
    string Scope,
    IReadOnlyDictionary<string, string?> Before,
    IReadOnlyDictionary<string, string?> After,
    bool Changed);

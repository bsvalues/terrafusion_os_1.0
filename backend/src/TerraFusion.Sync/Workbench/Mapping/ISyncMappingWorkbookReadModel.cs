using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Mapping;

/// <summary>
/// Slice C7: read-only loader for locked Mapping Workbooks. Future
/// transform consumers (Slice C8+) call this service to fetch a
/// county-scoped <see cref="SyncMappingWorkbookSnapshot"/> they can
/// translate PACS code values against.
///
/// <para>Status guard: only <c>Status='Mapped'</c> workbooks load.
/// <c>Draft</c> / <c>InProgress</c> / <c>Approved</c> / <c>Archived</c>
/// (or anything else) all throw — the read model exists specifically
/// to keep transform machinery from accidentally running against
/// unfinished review work.</para>
///
/// <para>Comparison policy:
/// <list type="bullet">
/// <item>Source schema, table, and column names match
/// case-insensitively (PACS schema casing varies).</item>
/// <item>Source values match exactly after trim (preserves PACS code
/// semantics — <c>"R"</c> vs. <c>"r"</c> is real, but
/// <c>"R "</c> vs. <c>"R"</c> is padded varchar noise).</item>
/// </list>
/// </para>
///
/// <para>What this service does NOT do:
/// <list type="bullet">
/// <item>Apply mappings to PACS rows or canonical landing tables.
/// Slice C8+ owns transform consumption.</item>
/// <item>Mutate workbook rows. Pure read.</item>
/// <item>Surface Draft/InProgress/Approved/Archived workbook contents.
/// Caller cannot bypass the Status gate.</item>
/// </list>
/// </para>
/// </summary>
public interface ISyncMappingWorkbookReadModel
{
    /// <summary>
    /// Load a county-scoped, locked workbook snapshot. Throws
    /// <see cref="InvalidOperationException"/> on cross-county /
    /// not-found / non-Mapped status.
    /// </summary>
    Task<SyncMappingWorkbookSnapshot> LoadMappedAsync(
        Guid countyId,
        Guid workbookId,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Immutable snapshot of a locked Mapping Workbook. The
/// <see cref="Columns"/> list is read-only, and each
/// <see cref="SyncMappingColumnDecision"/>'s
/// <see cref="SyncMappingColumnDecision.CodeValues"/> dictionary is
/// keyed by the trimmed <c>SourceValue</c> for O(1) per-column lookup.
///
/// <para><see cref="TryResolveCode"/> is the consumer-facing
/// translate-this-PACS-code helper. Its policy: case-insensitive
/// match on (schema, table, column); exact-after-trim match on the
/// source value. Returns <c>false</c> for unknown columns or unknown
/// values (i.e. PACS data that wasn't surfaced as a candidate at
/// profile time).</para>
/// </summary>
public sealed record SyncMappingWorkbookSnapshot(
    Guid WorkbookId,
    Guid CountyId,
    Guid ProfileBatchId,
    string Name,
    IReadOnlyList<SyncMappingColumnDecision> Columns,
    DateTime UpdatedAt = default)
{
    /// <summary>
    /// Look up the operator's decision for a specific source value in
    /// a specific source column. Returns <c>true</c> when the value
    /// appears in the snapshot, <c>false</c> otherwise (unknown column
    /// OR unknown value — both are <c>false</c> with <paramref name="decision"/>
    /// set to <c>null</c>; the caller can disambiguate by walking
    /// <see cref="Columns"/>).
    /// </summary>
    public bool TryResolveCode(
        string sourceSchema,
        string sourceTable,
        string sourceColumn,
        string? sourceValue,
        [NotNullWhen(true)] out SyncMappingCodeDecision? decision)
    {
        decision = null;

        if (string.IsNullOrEmpty(sourceSchema) ||
            string.IsNullOrEmpty(sourceTable)  ||
            string.IsNullOrEmpty(sourceColumn) ||
            sourceValue is null)
        {
            return false;
        }

        // Linear scan over Columns is bounded — typical workbooks have
        // ≤ a few hundred columns; the per-column dictionary lookup is
        // O(1). Building a (schema, table, column) → column index would
        // shave the constant but isn't necessary for the scale this
        // operates at today.
        foreach (var column in Columns)
        {
            if (!string.Equals(column.SourceSchema, sourceSchema, StringComparison.OrdinalIgnoreCase)) continue;
            if (!string.Equals(column.SourceTable,  sourceTable,  StringComparison.OrdinalIgnoreCase)) continue;
            if (!string.Equals(column.SourceColumn, sourceColumn, StringComparison.OrdinalIgnoreCase)) continue;

            var trimmed = sourceValue.Trim();
            if (column.CodeValues.TryGetValue(trimmed, out var found))
            {
                decision = found;
                return true;
            }
            return false;
        }
        return false;
    }
}

/// <summary>
/// One column's worth of mapping decisions inside a locked workbook.
/// </summary>
public sealed record SyncMappingColumnDecision(
    Guid MappingColumnId,
    string MappingLane,
    string SourceSchema,
    string SourceTable,
    string SourceColumn,
    string? CanonicalTarget,
    string ReviewStatus,
    IReadOnlyDictionary<string, SyncMappingCodeDecision> CodeValues);

/// <summary>
/// One source-value's worth of decision for a column.
/// <see cref="IsExcluded"/> + <see cref="CanonicalValue"/> are the
/// transform-relevant fields; <see cref="ReviewStatus"/> records
/// review provenance.
/// </summary>
public sealed record SyncMappingCodeDecision(
    Guid CodeValueId,
    string SourceValue,
    string? SourceLabel,
    long? ObservedCount,
    string? CanonicalValue,
    string ReviewStatus,
    bool IsExcluded);

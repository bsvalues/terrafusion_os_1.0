using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Transforms.Sales;

/// <summary>
/// Slice C8-C: read-only operational runner for the Slice C8-B sales
/// qualification transform. Loads a county-scoped, locked
/// (<c>Status='Mapped'</c>) Mapping Workbook, reads a bounded number
/// of sale rows from PACS, qualifies each, and returns aggregate
/// counts plus per-row decisions.
///
/// <para>Strictly read-only:
/// <list type="bullet">
/// <item>No PACS writes (the reader issues a bare TOP-N SELECT).</item>
/// <item>No canonical landing writes (Slice C8-D+ owns that surface).</item>
/// <item>No workbook mutation (read model is AsNoTracking).</item>
/// <item>No Forge / TerraAtlas / Studio / Dais artifact mutation.</item>
/// </list>
/// </para>
///
/// <para>Fail-closed on Draft workbooks: the runner loads the workbook
/// before reading any sale rows, so a Draft / InProgress / Approved /
/// Archived workbook surfaces as <see cref="InvalidOperationException"/>
/// without ever issuing a SQL query against PACS.</para>
/// </summary>
public interface ISalesQualificationSampleRunner
{
    Task<SalesQualificationSampleResult> RunAsync(
        Guid countyId,
        Guid workbookId,
        Guid sourceConnectionId,
        int maxSales,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Per-call summary the sample runner returns. Counts mirror the C8-B
/// <see cref="SalesQualificationDecisionStatus"/> values; <see cref="Sample"/>
/// preserves the per-row decision detail in source-table read order
/// (deterministic via <see cref="SqlServerSalesRowReader"/>'s
/// <c>ORDER BY chg_of_owner_id</c>).
/// </summary>
public sealed record SalesQualificationSampleResult(
    Guid WorkbookId,
    Guid SourceConnectionId,
    int RowsRead,
    int QualifiedCount,
    int ExcludedCount,
    int DeferredCount,
    int UnknownCount,
    int MissingCodeCount,
    IReadOnlyList<SalesQualificationSampleEntry> Sample);

/// <summary>
/// One row's worth of qualification decision, paired with the raw
/// source values it was derived from. Exists for log / CSV-style
/// output; the runner never persists these.
/// </summary>
public sealed record SalesQualificationSampleEntry(
    string? SaleIdentifier,
    string? WacCode,
    string? SaleRatioTypeCode,
    SalesQualificationDecisionStatus Status,
    bool IsExcludedFromComps,
    string? CanonicalValue,
    IReadOnlyList<string> Reasons);

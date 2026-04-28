using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Transforms.Sales;

/// <summary>
/// Slice C36: write-side operational runner. Loads a county-scoped
/// locked workbook (Status='Mapped'), reads a bounded number of sale
/// rows from PACS, qualifies each through the C8-B transform, and
/// **persists** each decision to the C35-B canonical landing table
/// (<c>CanonicalSaleQualifications</c>).
///
/// <para>Distinguished from the read-only
/// <see cref="ISalesQualificationSampleRunner"/> (C8-C) by the
/// persistence step. The sample runner returns aggregate counts +
/// per-row decisions for log/audit. This runner does that AND
/// upserts each decision row to the canonical table for downstream
/// consumer queries.</para>
///
/// <para>Hard guards (per C35-A + C8-A):
/// <list type="bullet">
/// <item>Locked-workbook-only writes — workbook load via
///   <c>LoadMappedAsync</c> at Status='Mapped' guard fails closed
///   before any PACS query OR canonical write.</item>
/// <item>Per-sale upsert — idempotent re-write per
///   <c>(CountyId, ChgOfOwnerId)</c>.</item>
/// <item>Skip rules — rows with null <c>ChgOfOwnerId</c> are
///   counted as <see cref="SalesQualificationCanonicalRunResult.SkippedNoIdentifierCount"/>
///   and NOT persisted (cannot satisfy the canonical landing PK).</item>
/// <item>Read-only PACS — the runner never writes to the source
///   database.</item>
/// </list>
/// </para>
/// </summary>
public interface ISalesQualificationCanonicalRunner
{
    /// <summary>
    /// Run the read → decide → persist pipeline.
    ///
    /// <para>Order of operations:
    /// <list type="number">
    /// <item>Validate args.</item>
    /// <item>Look up the source connection (county-scoped); refuse
    ///   missing or inactive.</item>
    /// <item>Load the workbook via <c>LoadMappedAsync</c>. Throws
    ///   before any PACS query OR canonical write if the workbook
    ///   isn't <c>Mapped</c>.</item>
    /// <item>Read up to <c>maxSales</c> rows from PACS via the row
    ///   reader.</item>
    /// <item>For each row: qualify via the C8-B transform; if the
    ///   row has a non-null <c>ChgOfOwnerId</c>, upsert to
    ///   <c>CanonicalSaleQualifications</c>; otherwise skip
    ///   (counted, not persisted).</item>
    /// <item>Aggregate counts + return.</item>
    /// </list>
    /// </para>
    /// </summary>
    Task<SalesQualificationCanonicalRunResult> RunAsync(
        Guid countyId,
        Guid workbookId,
        Guid sourceConnectionId,
        int maxSales,
        string operatorId,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Per-call summary of the C36 canonical-write run.
///
/// <para>Counts mirror the C35-B canonical landing table's three
/// status states (Qualified / Excluded / Inconclusive) plus a
/// "skipped" bucket for rows that couldn't be persisted (null
/// <c>ChgOfOwnerId</c>).</para>
/// </summary>
public sealed record SalesQualificationCanonicalRunResult(
    Guid WorkbookId,
    Guid SourceConnectionId,
    int RowsRead,
    int QualifiedCount,
    int ExcludedCount,
    int InconclusiveCount,
    int SkippedNoIdentifierCount,
    int RowsPersisted,
    IReadOnlyList<SalesQualificationCanonicalRunEntry> Entries);

/// <summary>
/// Per-row record of what the runner did with each PACS sale.
/// Mirrors <see cref="SalesQualificationSampleEntry"/> + adds the
/// canonical-side outcome (persisted vs skipped).
/// </summary>
public sealed record SalesQualificationCanonicalRunEntry(
    int? ChgOfOwnerId,
    string? WacCode,
    string? SaleRatioTypeCode,
    SalesQualificationDecisionStatus TransformStatus,
    bool Persisted,
    string? SkipReason);

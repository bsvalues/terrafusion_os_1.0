using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using TerraFusion.Core.Entities.Sync;

namespace TerraFusion.Sync.Workbench.Transforms.Sales;

/// <summary>
/// Slice C8-C: bounded read of sale-qualification source columns from
/// PACS. Production implementation
/// (<see cref="SqlServerSalesRowReader"/>) issues a TOP-N SELECT
/// against <c>dbo.sale</c> on the source SQL Server using the same
/// secret-resolver wiring as the structural / deep-profile readers
/// (B1.6.5). Tests substitute a fake reader so the runner stays
/// unit-testable without Docker.
///
/// <para>Contract: read-only. The reader never writes to PACS, never
/// mutates anything, and is bounded by <paramref name="maxRows"/>
/// regardless of the underlying table size.</para>
/// </summary>
public interface ISalesRowReader
{
    Task<IReadOnlyList<SalesRow>> ReadAsync(
        SyncSourceConnection connection,
        int maxRows,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// One sale's worth of qualification-relevant source data.
/// <see cref="SaleIdentifier"/> is the PACS-side row identifier
/// (typically <c>chg_of_owner_id</c>) — captured for log/audit
/// purposes only; the transform doesn't read it.
/// </summary>
public sealed record SalesRow(
    string? SaleIdentifier,
    string? WacCode,
    string? SaleRatioTypeCode);

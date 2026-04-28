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
///
/// <para><see cref="SaleIdentifier"/> is the PACS-side row identifier
/// (typically <c>chg_of_owner_id</c>) as a string — captured for
/// log/audit purposes only; the C8-B transform doesn't read it.</para>
///
/// <para><see cref="ChgOfOwnerId"/> (added at C36) is the same value
/// typed as <c>int</c> for the canonical landing write path. Per
/// D0-D's PACS canonical sale identity policy, this is the primary
/// key axis (with <c>CountyId</c>) for
/// <c>CanonicalSaleQualifications</c>. <c>null</c> when the source
/// row had a non-int / null sale id; rows with null
/// <c>ChgOfOwnerId</c> are skipped by the canonical-write runner
/// (logged, not persisted) — the transform decision is still
/// computed for the sample-runner audit surface.</para>
///
/// <para><see cref="SaleDate"/> and <see cref="SalePrice"/> are
/// optional read-time snapshots for the canonical landing row. They
/// are not used by the qualification decision engine.</para>
/// </summary>
public sealed record SalesRow(
    string? SaleIdentifier,
    string? WacCode,
    string? SaleRatioTypeCode,
    int? ChgOfOwnerId = null,
    DateTime? SaleDate = null,
    decimal? SalePrice = null);

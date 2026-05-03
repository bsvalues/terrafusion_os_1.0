using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Mapping;

/// <summary>
/// Slice C41-B: per-county active-workbook pointer service per the
/// C41-A policy. Provides operator-driven SET / GET / Clear over
/// <c>SyncCountyActiveWorkbooks</c>.
///
/// <para>Hard guards (per C41-A):
/// <list type="bullet">
/// <item>Singleton per county (PK = CountyId).</item>
/// <item>Target must be a Mapped workbook in the same county.</item>
/// <item>SET is idempotent — re-setting the same workbook is a
///   no-op (no <c>UpdatedAt</c> bump, no audit-log noise).</item>
/// <item>SET / Clear / GET do NOT trigger C36 / canonical writes /
///   PACS reads. Pure metadata.</item>
/// <item>GET is read-only (<c>AsNoTracking</c>).</item>
/// <item>County-isolated (CLAUDE.md sovereign-county invariant).</item>
/// <item>Pointer is advisory — the C39 endpoint's behavior is
///   unchanged; consumers that ignore the pointer continue to
///   work.</item>
/// </list>
/// </para>
///
/// <para>Empty-result semantics: <see cref="GetAsync"/> returns
/// <c>null</c> when no pointer row exists for the county (Hard
/// Guard 9). Consumers MUST handle that case.</para>
/// </summary>
public interface ISyncCountyActiveWorkbookService
{
    /// <summary>
    /// Read the active workbook pointer for a county. Returns
    /// <c>null</c> when no pointer exists.
    /// </summary>
    Task<SyncCountyActiveWorkbookSnapshot?> GetAsync(
        Guid countyId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Promote a Mapped workbook to active for the county.
    /// Validates the target workbook is <c>Status='Mapped'</c> AND
    /// in the same county before any state change. Idempotent —
    /// re-setting the same workbook returns the existing snapshot
    /// without bumping audit fields.
    /// </summary>
    Task<SyncCountyActiveWorkbookSnapshot> SetAsync(
        Guid countyId,
        Guid workbookId,
        string operatorId,
        string? reason,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Clear the pointer (county returns to "no active workbook"
    /// state per Hard Guard 9). Idempotent — clearing a county
    /// with no pointer is a no-op.
    /// </summary>
    Task ClearAsync(
        Guid countyId,
        string operatorId,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Read-side projection of a <c>SyncCountyActiveWorkbook</c> row.
/// PII-free; no audit-only fields surfaced (those live in
/// <c>AuditLogs</c> per CLAUDE.md).
/// </summary>
public sealed record SyncCountyActiveWorkbookSnapshot(
    Guid     CountyId,
    Guid     ActiveWorkbookId,
    DateTime SetAt,
    string   SetBy,
    string?  SetReason);

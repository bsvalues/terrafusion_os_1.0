using System;

namespace TerraFusion.Core.DTOs.Sync;

/// <summary>
/// Slice C41-C canonical wire shape for the active-workbook pointer
/// returned by <c>GET /api/sync/active-workbook</c>. Mirrors the
/// service-side <c>SyncCountyActiveWorkbookSnapshot</c> field-for-
/// field; PII-free by construction (the pointer carries metadata
/// only — no grantor, no grantee, no parcel data).
/// </summary>
/// <param name="CountyId">
/// Sovereign-county scope. Echoes the requested county.
/// </param>
/// <param name="ActiveWorkbookId">
/// The Mapped <c>SyncMappingWorkbook</c> the operator currently
/// treats as authoritative for the county.
/// </param>
/// <param name="SetAt">
/// Business timestamp of the most recent promotion. Distinct from
/// audit's <c>UpdatedAt</c>: <see cref="SetAt"/> only changes when
/// the pointer actually rotates.
/// </param>
/// <param name="SetBy">
/// Operator id who promoted the workbook.
/// </param>
/// <param name="SetReason">
/// Optional human note recorded at promotion time.
/// </param>
public sealed record ActiveWorkbookSnapshotDto(
    Guid     CountyId,
    Guid     ActiveWorkbookId,
    DateTime SetAt,
    string   SetBy,
    string?  SetReason);

/// <summary>
/// Slice C41-C request body for
/// <c>PUT /api/sync/active-workbook?countyId=&amp;workbookId=</c>.
/// Carries optional human-readable rationale; the controller is
/// responsible for the operator-id stamp (from the principal) so
/// the body cannot impersonate.
/// </summary>
/// <param name="Reason">
/// Optional note explaining the promotion. Persisted as
/// <c>SetReason</c> on the pointer row. Max 1000 chars per the
/// C41-A policy.
/// </param>
public sealed record ActiveWorkbookSetRequest(
    string? Reason);

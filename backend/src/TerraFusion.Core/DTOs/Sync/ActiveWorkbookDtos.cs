using System;

namespace TerraFusion.Core.DTOs.Sync;

/// <summary>
/// Slice C41-C canonical wire shape for the active-workbook pointer
/// returned by <c>GET /api/sync/active-workbook</c>. Mirrors the
/// service-side <c>SyncCountyActiveWorkbookSnapshot</c> field-for-
/// field; PII-free by construction (the pointer carries metadata
/// only — no grantor, no grantee, no parcel data).
///
/// <para>Slice C47-A: adds <see cref="ActiveWorkbookName"/>
/// (nullable) — the operator-typed <c>SyncMappingWorkbook.Name</c>
/// of the pointed-to workbook. Symmetric to C46-B's enrichment on
/// the stale-summary endpoint. Inherits the C46-A guards:
/// county-scoped controller-side lookup; <c>null</c> on missing /
/// cross-county / lookup failure; verbatim emission with no
/// sanitization; cache-key invariance preserved (the C45-B ETag
/// seed does NOT include the name).</para>
/// </summary>
/// <param name="CountyId">
/// Sovereign-county scope. Echoes the requested county.
/// </param>
/// <param name="ActiveWorkbookId">
/// The Mapped <c>SyncMappingWorkbook</c> the operator currently
/// treats as authoritative for the county.
/// </param>
/// <param name="ActiveWorkbookName">
/// Operator-typed name of the pointed-to workbook (slice C47-A).
/// <c>null</c> when the workbook row was deleted, the id is
/// cross-county (defense in depth), or the lookup failed
/// transiently. Consumers MUST handle null gracefully (typically
/// by falling back to the Guid display).
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
    string?  ActiveWorkbookName,
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

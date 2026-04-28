using System.Collections.Generic;

namespace TerraFusion.Core.DTOs.Sync;

/// <summary>
/// Slice C39-B canonical wire shape for a paginated comp-eligibility
/// response, returned by the
/// <c>GET /api/sync/comps/eligible</c> endpoint.
///
/// <para>Wraps a page of <see cref="CompEligibleSaleDto"/> with
/// offset/limit pagination metadata per the C39-A policy. All
/// metadata fields are required on every successful response — no
/// optional or nullable counts — so consumer deserialization stays
/// trivial.</para>
///
/// <para>Replaces the C38-B bare-array response shape. This is a
/// breaking change called out in the C39-B commit message; no
/// frontend / Forge / Studio / Dais consumer is wired to the bare
/// shape yet (per the operator's "Still parked" save state).</para>
///
/// <para>Empty pool / past-the-end requests return this same shape
/// with <see cref="Items"/> empty and the metadata fields populated
/// accurately so the client can recognize the condition without a
/// 404.</para>
/// </summary>
/// <param name="Items">
/// The page of comp-eligible sales. Empty when the page is past
/// the end OR when the comp pool itself is empty.
/// </param>
/// <param name="Page">
/// Effective 1-based page index after server-side default
/// application (omitted query param → 1).
/// </param>
/// <param name="PageSize">
/// Effective rows-per-page after server-side default application
/// (omitted query param → 100). Server-bounded to ≤ 500.
/// </param>
/// <param name="TotalCount">
/// Exact number of matching rows (county + optional workbook pin
/// + Qualified-only). Per C39-A Hard Guard 7, this MUST be exact —
/// no approximation.
/// </param>
/// <param name="TotalPages">
/// <c>ceil(TotalCount / PageSize)</c>. Zero when
/// <see cref="TotalCount"/> is zero.
/// </param>
/// <param name="HasNextPage">
/// <c>Page &lt; TotalPages</c>. False on past-the-end and
/// empty-pool responses.
/// </param>
/// <param name="HasPreviousPage">
/// <c>Page &gt; 1</c>. True even when the requested page is past
/// the end (so the client can detect overshooting).
/// </param>
public sealed record PagedCompEligibleSalesDto(
    IReadOnlyList<CompEligibleSaleDto> Items,
    int  Page,
    int  PageSize,
    int  TotalCount,
    int  TotalPages,
    bool HasNextPage,
    bool HasPreviousPage);

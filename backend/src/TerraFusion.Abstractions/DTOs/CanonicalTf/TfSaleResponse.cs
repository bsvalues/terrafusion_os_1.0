using System;
using System.Collections.Generic;

namespace TerraFusion.Abstractions.DTOs.CanonicalTf;

/// <summary>
/// Slice S4: response payload for one canonical sale row.
///
/// <para>Doctrine: PII-free. <see cref="TfSaleId"/> is the canonical
/// identity; <see cref="TfParcelId"/> is the canonical parcel
/// reference. <see cref="ChgOfOwnerId"/> is preserved for operator
/// recognition (it's the assessor's day-to-day sale identifier) but
/// the upstream JSON lineage in <c>source_xref</c> is the audit
/// anchor, not this column.</para>
/// </summary>
public sealed record TfSaleResponse
{
    public required Guid TfSaleId { get; init; }
    public required Guid CountyId { get; init; }
    public required Guid TfParcelId { get; init; }
    public required long ChgOfOwnerId { get; init; }
    public DateTime? SlDt { get; init; }
    public decimal? SlPrice { get; init; }
    public decimal? AdjSlPrice { get; init; }
    public required bool SaleQualified { get; init; }
}

/// <summary>
/// Slice S4: paginated envelope for
/// <c>GET /api/sales</c>. Mirrors the C39-A pagination contract.
/// </summary>
public sealed record PagedTfSaleResponse
{
    public required IReadOnlyList<TfSaleResponse> Items { get; init; }
    public required int Page { get; init; }
    public required int PageSize { get; init; }
    public required int TotalCount { get; init; }
    public required int TotalPages { get; init; }
    public required bool HasNextPage { get; init; }
    public required bool HasPreviousPage { get; init; }
}

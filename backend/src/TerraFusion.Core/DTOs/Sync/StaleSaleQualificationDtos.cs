using System;
using System.Collections.Generic;

namespace TerraFusion.Core.DTOs.Sync;

/// <summary>
/// Slice C43-B per-row shape for stale canonical sale rows
/// returned by <c>GET /api/sync/comps/stale</c>. Per the C43-A
/// policy: PII-free; carries the canonical row's stale-relevant
/// fields plus <see cref="SourceWorkbookId"/> /
/// <see cref="SourceWorkbookLockedAt"/> so the consumer can reason
/// about provenance vs the baseline.
///
/// <para><see cref="ComputedDecision"/> is serialized as the
/// enum's string name (<c>"Qualified"</c> / <c>"Excluded"</c> /
/// <c>"Inconclusive"</c>) for wire stability across enum-int
/// reordering.</para>
/// </summary>
public sealed record StaleSaleQualificationDto(
    int       ChgOfOwnerId,
    string    ComputedDecision,
    string?   WacCdSourceValue,
    string?   WacCdCanonicalValue,
    string?   SlRatioTypeCdSourceValue,
    string?   SlRatioTypeCdCanonicalValue,
    DateTime? SaleDate,
    decimal?  SalePrice,
    Guid      SourceWorkbookId,
    DateTime  SourceWorkbookLockedAt);

/// <summary>
/// Slice C43-B paginated envelope for the stale-row diagnostic
/// endpoint. Mirrors <see cref="PagedCompEligibleSalesDto"/> shape
/// and adds <see cref="BaselineWorkbookId"/> /
/// <see cref="BaselineSource"/> so the consumer can audit which
/// workbook id served as the staleness baseline.
///
/// <para>Per C43-A all metadata fields are required on every
/// successful response. <see cref="BaselineSource"/> is locked to
/// one of two string values:
/// <list type="bullet">
/// <item><c>"explicit-query-param"</c> — operator passed
///   <c>?workbookId=</c> on the URL.</item>
/// <item><c>"active-workbook-pointer"</c> — the baseline came from
///   the C41-B active-workbook pointer for the county.</item>
/// </list>
/// </para>
/// </summary>
public sealed record PagedStaleSaleQualificationsDto(
    IReadOnlyList<StaleSaleQualificationDto> Items,
    int    Page,
    int    PageSize,
    int    TotalCount,
    int    TotalPages,
    bool   HasNextPage,
    bool   HasPreviousPage,
    Guid   BaselineWorkbookId,
    string BaselineSource);

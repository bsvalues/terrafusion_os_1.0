using System;

namespace TerraFusion.Core.DTOs.Sync;

/// <summary>
/// Slice C38-B canonical wire shape for one comp-eligible sale,
/// returned by the <c>GET /api/sync/comps/eligible</c> endpoint.
///
/// <para>Mirrors the C37-B <c>CompEligibleSale</c> reader record
/// field-for-field. This DTO is the API contract: renaming or
/// removing fields is a breaking change requiring its own slice.
/// Per C38-A Hard Guard 5, the shape is intentionally PII-free —
/// no grantor, no grantee, no address, no owner identity. The
/// endpoint exposes only the C8-A qualification axes plus the
/// sale snapshot (date / price) and workbook provenance.</para>
///
/// <para>Field order matches <c>CompEligibleSale</c> for trivial
/// 1:1 mapping in the controller.</para>
/// </summary>
public sealed record CompEligibleSaleDto(
    int       ChgOfOwnerId,
    string?   WacCdSourceValue,
    string?   WacCdCanonicalValue,
    string?   SlRatioTypeCdSourceValue,
    string?   SlRatioTypeCdCanonicalValue,
    DateTime? SaleDate,
    decimal?  SalePrice,
    Guid      SourceWorkbookId,
    DateTime  SourceWorkbookLockedAt);

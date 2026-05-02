using System;
using System.Collections.Generic;

namespace TerraFusion.Core.DTOs.CanonicalTf;

/// <summary>
/// Slice B5: response payload for
/// <c>GET /api/parcels/{tfParcelId}/owner-current?taxYear=...</c>.
///
/// <para>Carries the list of owners for one parcel/year pair. Each
/// entry's <see cref="ParcelOwnerEntry.DisplayName"/> already
/// reflects the canonical PII redaction policy (confidential rows
/// show <c>"[Confidential]"</c>). The reader does NOT re-redact —
/// the canonical layer is the redaction surface.</para>
///
/// <para><see cref="ParcelOwnerEntry.WebSuppression"/> is surfaced
/// but NOT honored at this layer; downstream public-facing services
/// must filter on it before serving anonymous consumers.</para>
/// </summary>
public sealed record ParcelOwnerCurrentResponse
{
    public required Guid TfParcelId { get; init; }
    public required Guid CountyId { get; init; }
    public required short TaxYear { get; init; }
    public required IReadOnlyList<ParcelOwnerEntry> Owners { get; init; }
}

/// <summary>Slice B5: one owner of record for a parcel/year.</summary>
public sealed record ParcelOwnerEntry
{
    public required Guid TfOwnerId { get; init; }
    public required long AcctId { get; init; }
    public required string DisplayName { get; init; }
    public decimal? PctOwnership { get; init; }
    public required bool IsPrimary { get; init; }
    public required bool ConfidentialFlag { get; init; }
    public required bool WebSuppression { get; init; }
}

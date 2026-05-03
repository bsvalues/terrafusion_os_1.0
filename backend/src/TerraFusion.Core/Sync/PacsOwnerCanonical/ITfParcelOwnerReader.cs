using System;
using System.Threading;
using System.Threading.Tasks;
using TerraFusion.Core.DTOs.CanonicalTf;

namespace TerraFusion.Core.Sync.PacsOwnerCanonical;

/// <summary>
/// Slice B5: read-only projection of <c>canonical_tf.tf_parcel_owner_link</c>
/// joined to <c>canonical_tf.tf_owner</c> for the parcel-owner HTTP
/// endpoint.
///
/// <para>Returns a three-state lookup (mirrors G1-E-2's pattern):
/// <c>NotFound</c> when no parcel matches; <c>NoOwners</c> when the
/// parcel exists but has no link rows for the requested tax year;
/// <c>Found</c> with the projection otherwise. The controller maps
/// both <c>NotFound</c> and <c>NoOwners</c> to 404 in v1.</para>
///
/// <para>Read-only: <c>AsNoTracking</c>; no <c>SaveChangesAsync</c>;
/// no audit-table writes.</para>
/// </summary>
public interface ITfParcelOwnerReader
{
    Task<ParcelOwnerLookup> GetOwnersAsync(
        Guid tfParcelId,
        short taxYear,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Three-state result. The controller distinguishes "no parcel" from
/// "no link rows" for accurate logging without changing the HTTP
/// contract (both → 404).
/// </summary>
public sealed record ParcelOwnerLookup
{
    public required ParcelOwnerLookupKind Kind { get; init; }

    /// <summary>Set when <see cref="Kind"/> is NoOwners or Found.</summary>
    public Guid? CountyId { get; init; }

    /// <summary>Set only when <see cref="Kind"/> is Found.</summary>
    public ParcelOwnerCurrentResponse? Payload { get; init; }

    public static ParcelOwnerLookup NotFound() =>
        new() { Kind = ParcelOwnerLookupKind.NotFound };

    public static ParcelOwnerLookup NoOwners(Guid countyId) =>
        new() { Kind = ParcelOwnerLookupKind.NoOwners, CountyId = countyId };

    public static ParcelOwnerLookup Found(Guid countyId, ParcelOwnerCurrentResponse payload) =>
        new()
        {
            Kind = ParcelOwnerLookupKind.Found,
            CountyId = countyId,
            Payload = payload,
        };
}

public enum ParcelOwnerLookupKind
{
    NotFound = 0,
    NoOwners = 1,
    Found = 2,
}

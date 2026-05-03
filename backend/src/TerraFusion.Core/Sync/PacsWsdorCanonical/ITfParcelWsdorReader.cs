using System;
using System.Threading;
using System.Threading.Tasks;
using TerraFusion.Core.DTOs.CanonicalTf;

namespace TerraFusion.Core.Sync.PacsWsdorCanonical;

/// <summary>
/// Slice B5': read-only projection of
/// <c>canonical_tf.tf_assessment_wsdor</c> joined to
/// <c>canonical_tf.tf_owner</c> for the parcel-WSDOR HTTP endpoint.
///
/// <para>Returns a three-state lookup (mirrors B5's pattern):
/// <c>NotFound</c> when no parcel matches; <c>NoEntries</c> when
/// the parcel exists but has no WSDOR rows for the requested year;
/// <c>Found</c> with the projection otherwise. The controller maps
/// both <c>NotFound</c> and <c>NoEntries</c> to 404 in v1.</para>
///
/// <para>Read-only by contract: <c>AsNoTracking</c>; no
/// <c>SaveChangesAsync</c>; no audit-table writes.</para>
/// </summary>
public interface ITfParcelWsdorReader
{
    Task<ParcelWsdorLookup> GetWsdorRollAsync(
        Guid tfParcelId,
        short taxYear,
        CancellationToken cancellationToken = default);
}

/// <summary>Three-state result. Same pattern as B5's owner reader.</summary>
public sealed record ParcelWsdorLookup
{
    public required ParcelWsdorLookupKind Kind { get; init; }

    /// <summary>Set when <see cref="Kind"/> is NoEntries or Found.</summary>
    public Guid? CountyId { get; init; }

    /// <summary>Set only when <see cref="Kind"/> is Found.</summary>
    public ParcelWsdorRollResponse? Payload { get; init; }

    public static ParcelWsdorLookup NotFound() =>
        new() { Kind = ParcelWsdorLookupKind.NotFound };

    public static ParcelWsdorLookup NoEntries(Guid countyId) =>
        new() { Kind = ParcelWsdorLookupKind.NoEntries, CountyId = countyId };

    public static ParcelWsdorLookup Found(Guid countyId, ParcelWsdorRollResponse payload) =>
        new()
        {
            Kind = ParcelWsdorLookupKind.Found,
            CountyId = countyId,
            Payload = payload,
        };
}

public enum ParcelWsdorLookupKind
{
    NotFound = 0,
    NoEntries = 1,
    Found = 2,
}

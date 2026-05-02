using System;
using System.Threading;
using System.Threading.Tasks;
using TerraFusion.Core.DTOs.CanonicalTf;

namespace TerraFusion.Core.Sync.PacsSaleCanonical;

/// <summary>
/// Slice S4: read-only projection of <c>canonical_tf.tf_sale</c> for
/// the canonical sales HTTP endpoint. County-isolated by parameter
/// (the controller has already verified the principal's claim).
/// Deterministic ordering by <c>(SlDt DESC, ChgOfOwnerId DESC)</c>
/// so paging is stable across requests.
/// </summary>
public interface ITfSaleReader
{
    /// <summary>
    /// Returns the requested page of qualifying canonical sales for
    /// <paramref name="countyId"/>, plus the total count for the
    /// envelope's pagination metadata.
    /// </summary>
    Task<PagedTfSaleResponse> ReadAsync(
        Guid countyId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
}

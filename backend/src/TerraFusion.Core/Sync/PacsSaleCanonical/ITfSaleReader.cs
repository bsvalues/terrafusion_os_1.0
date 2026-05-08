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
///
/// <para>Slice G3 (v1.12): the read accepts an <c>era</c> filter so
/// callers can constrain results to a single conversion era. Null
/// resolves to <c>POST_CONVERSION</c> per the v1.10 default.</para>
/// </summary>
public interface ITfSaleReader
{
    /// <summary>
    /// Returns the requested page of qualifying canonical sales for
    /// <paramref name="countyId"/>, plus the total count for the
    /// envelope's pagination metadata.
    /// </summary>
    /// <param name="era">
    /// Slice G3 (v1.12): conversion-era filter per Block-C contract
    /// v1.12. Null resolves to <c>POST_CONVERSION</c>. Recognized
    /// values: <c>POST_CONVERSION</c>, <c>PRE_CONVERSION_2017</c>,
    /// <c>UNKNOWN</c>, and the special
    /// <c>TerraFusion.Core.Sync.SalesRatioStudy.ISalesRatioStudyReader.EraAll</c>
    /// (bypasses the era filter). Unknown values throw
    /// <see cref="System.ArgumentException"/>.
    /// </param>
    Task<PagedTfSaleResponse> ReadAsync(
        Guid countyId,
        int page,
        int pageSize,
        string? era = null,
        CancellationToken cancellationToken = default);
}

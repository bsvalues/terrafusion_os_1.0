using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.GIS.ArcGisRest;

/// <summary>
/// Slice G1-C: read-only ArcGIS REST feature-service adapter.
///
/// <para>Per <c>docs/plans/terrafusion-90-day-execution-plan.md</c>
/// §4 (Block D / GIS sub-block), this is the locked source of parcel
/// polygons. No shapefile parsing. The adapter is read-only by
/// contract and consumes the per-county configuration bound by
/// <see cref="TerraFusion.Core.Configuration.ArcGisFeatureServiceOptions"/>.</para>
///
/// <para>v1 (this slice) returns a single full-county pull. Paging,
/// retry, backoff, and incremental sync are deferred to G1-D.</para>
/// </summary>
public interface IArcGisFeatureServiceClient
{
    /// <summary>
    /// Fetches every active parcel polygon from the configured
    /// feature service for <paramref name="countyId"/>.
    /// </summary>
    /// <exception cref="ArcGisFeatureServiceConfigurationException">
    /// Thrown when no feature-service configuration is bound for
    /// <paramref name="countyId"/>, or when the bound URL is empty.
    /// </exception>
    /// <exception cref="ArcGisFeatureServiceTransportException">
    /// Thrown on HTTP transport failure (timeout, non-success status,
    /// invalid JSON).
    /// </exception>
    Task<IReadOnlyList<ArcGisParcelFeature>> FetchParcelsAsync(
        Guid countyId,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Slice G1-C: thrown when the requested county lacks bound
/// feature-service configuration. Distinct from transport failure so
/// callers can surface a "configure this county first" message
/// without retry.
/// </summary>
public sealed class ArcGisFeatureServiceConfigurationException : Exception
{
    public ArcGisFeatureServiceConfigurationException(string message) : base(message) { }
}

/// <summary>
/// Slice G1-C: thrown when the feature-service request fails
/// (timeout, non-2xx response, malformed JSON). G1-D will wrap this
/// in retry / cached-snapshot fallback logic.
/// </summary>
public sealed class ArcGisFeatureServiceTransportException : Exception
{
    public ArcGisFeatureServiceTransportException(string message) : base(message) { }
    public ArcGisFeatureServiceTransportException(string message, Exception inner)
        : base(message, inner) { }
}

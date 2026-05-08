using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using TerraFusion.Core.DTOs.CanonicalTf;

namespace TerraFusion.Core.Sync.OpenWork;

/// <summary>
/// Slice F1: read-only projection that surfaces parcels needing the
/// assessor's attention for a given <c>(countyId, assessmentYear)</c>.
///
/// <para>F1 MVP: a parcel is "open-work" if it has NO
/// <c>canonical_tf.tf_assessment_wsdor</c> row for the requested year.
/// That's the primary morning-dashboard signal in Benton: every
/// active parcel must have a WSDOR row before the roll closes.</para>
///
/// <para>Read-only by contract: <c>AsNoTracking</c>; no
/// <c>SaveChangesAsync</c>; no audit-table writes. Bounded by the
/// caller's <c>maxResults</c> — the reader returns one extra row
/// internally so the caller can detect a truncated backlog.</para>
///
/// <para>County isolation: the reader filters by
/// <see cref="TerraFusion.Core.Entities.CanonicalTf.TfParcel.CountyId"/>
/// directly. There's no cross-county leakage path in F1: the controller
/// can only pass its own resolved claim.</para>
/// </summary>
public interface IOpenWorkReader
{
    /// <summary>
    /// Returns up to <paramref name="maxResults"/> open-work parcels for
    /// the <paramref name="countyId"/> at <paramref name="year"/>,
    /// ordered by <c>ParcelNumber</c> (a.k.a. GeoId) ascending.
    /// NULL ParcelNumber sorts last so the assessor sees the
    /// well-identified backlog first.
    /// </summary>
    /// <param name="countyId">Caller's resolved sovereign-county claim.</param>
    /// <param name="year">Assessment year (e.g. 2026).</param>
    /// <param name="maxResults">Hard cap on result count.</param>
    /// <param name="cancellationToken">Standard cancellation hook.</param>
    /// <returns>An <see cref="OpenWorkResult"/> with the items + a
    /// <c>Truncated</c> signal indicating that more pending parcels
    /// exist than were returned.</returns>
    Task<OpenWorkResult> GetOpenWorkAsync(
        Guid countyId,
        short year,
        int maxResults,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// F1 result envelope. Structured so the controller can map
/// <c>Truncated</c> straight into the response without a second query.
/// </summary>
public sealed record OpenWorkResult
{
    public required IReadOnlyList<OpenWorkItem> Items { get; init; }

    /// <summary>True iff the underlying query produced more rows
    /// than <c>maxResults</c>. The reader returns the first
    /// <c>maxResults</c> items in <see cref="Items"/>.</summary>
    public required bool Truncated { get; init; }

    public static OpenWorkResult Empty { get; } = new()
    {
        Items = Array.Empty<OpenWorkItem>(),
        Truncated = false,
    };
}

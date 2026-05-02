using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.GIS.ArcGisRest;

/// <summary>
/// Slice G1-E-1: closes the APN crosswalk between
/// <c>gis_tf.tf_parcel_geom</c> (sourced from ArcGIS) and
/// <c>canonical_tf.tf_parcel</c> (sourced from PACS).
///
/// <para>The crosswalk-pending state is permitted by design — an
/// ArcGIS row may land before its PACS counterpart is provisioned
/// (or vice versa). This service walks the unlinked active rows and
/// closes the link by APN match (case-insensitive, county-isolated).
/// Misses stay unlinked and are surfaced via the
/// <c>gis-tf:crosswalk-closure</c> gate.</para>
///
/// <para>Doctrine guarantee: this service NEVER overwrites a
/// non-null <c>TfParcelId</c>. Once a crosswalk is closed, it stays
/// closed unless explicitly broken (out-of-scope for v1).</para>
/// </summary>
public interface IArcGisCrosswalkService
{
    /// <summary>
    /// Closes the APN crosswalk for every active
    /// <c>tf_parcel_geom</c> row in <paramref name="countyId"/> that
    /// has a NULL <c>TfParcelId</c>. Returns a summary; never throws
    /// for ambiguity or missing matches (those are recorded, not
    /// raised).
    /// </summary>
    Task<ArcGisCrosswalkResult> CloseCrosswalkAsync(
        Guid countyId,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Slice G1-E-1: outcome of one crosswalk-closure pass for a county.
/// </summary>
public sealed record ArcGisCrosswalkResult
{
    public required Guid CountyId { get; init; }

    /// <summary>How many active geom rows were considered.</summary>
    public required int Considered { get; init; }

    /// <summary>How many rows were already crosswalked (no-op).</summary>
    public required int AlreadyClosed { get; init; }

    /// <summary>How many rows had their crosswalk closed in this pass.</summary>
    public required int NewlyClosed { get; init; }

    /// <summary>How many rows had no APN match in this county.</summary>
    public required int NoMatch { get; init; }

    /// <summary>
    /// How many rows had ambiguous APN matches (more than one
    /// <c>tf_parcel</c> with the same parcel_number in the same
    /// county). Doctrine: ambiguous = unresolvable; left unlinked
    /// and counted here.
    /// </summary>
    public required int Ambiguous { get; init; }

    /// <summary>How many rows had a NULL or empty ArcGIS APN.</summary>
    public required int MissingApn { get; init; }
}

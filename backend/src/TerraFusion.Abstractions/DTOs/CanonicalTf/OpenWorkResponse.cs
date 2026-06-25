using System;
using System.Collections.Generic;

namespace TerraFusion.Abstractions.DTOs.CanonicalTf;

/// <summary>
/// Slice F1: read-model envelope for the open-work / pending-appraisal
/// queue.
///
/// <para>An "open-work" parcel for a given assessment year is one that
/// has NO matching <c>canonical_tf.tf_assessment_wsdor</c> row for the
/// caller's county at that year. These are the parcels the assessor
/// still needs to touch before the WSDOR roll is closed for the year.</para>
///
/// <para>Read-only by contract: no PII, no audit-table mutations. The
/// reader populates ParcelNumber as <c>GeoId</c> (PACS terminology
/// the assessor recognizes — "geo_id" / "parcel number" are the same
/// label in Benton's morning workflow).</para>
/// </summary>
public sealed class OpenWorkResponse
{
    /// <summary>The county the queue was scoped to (caller's claim).</summary>
    public Guid CountyId { get; set; }

    /// <summary>The assessment year requested by the caller.</summary>
    public short AssessmentYear { get; set; }

    /// <summary>
    /// Number of items returned in <see cref="Items"/>. NOT the total
    /// open-work count for the county — the reader caps the result at
    /// the controller's <c>maxResults</c>. Use <see cref="Truncated"/>
    /// to detect when the cap was hit.
    /// </summary>
    public int Count { get; set; }

    /// <summary>
    /// True if the underlying query produced more rows than
    /// <see cref="Count"/>. The caller should narrow the year or
    /// raise <c>maxResults</c> to see the full backlog.
    /// </summary>
    public bool Truncated { get; set; }

    /// <summary>The pending-appraisal parcels, ordered by GeoId asc.</summary>
    public IReadOnlyList<OpenWorkItem> Items { get; set; } = Array.Empty<OpenWorkItem>();
}

/// <summary>
/// A single parcel that's open for appraisal at the requested year.
/// </summary>
public sealed class OpenWorkItem
{
    /// <summary>Canonical TF parcel identity.</summary>
    public Guid TfParcelId { get; set; }

    /// <summary>
    /// Operator-facing parcel number (a.k.a. <c>geo_id</c> in PACS).
    /// May be null if the underlying canonical row never had one set.
    /// </summary>
    public string? GeoId { get; set; }

    /// <summary>
    /// Why this parcel is in the open-work queue. F1 only emits one
    /// reason today; the field is structured so future blocks (F2/F3)
    /// can layer additional pending categories without breaking the
    /// envelope.
    /// </summary>
    public string PendingReason { get; set; } = "MISSING_WSDOR_FOR_YEAR";
}

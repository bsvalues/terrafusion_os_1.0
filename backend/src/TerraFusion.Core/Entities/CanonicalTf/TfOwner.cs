using System;

namespace TerraFusion.Core.Entities.CanonicalTf;

/// <summary>
/// Slice B3: TerraFusion-native canonical owner identity.
///
/// <para>Per the doctrine: <see cref="TfOwnerId"/> is TF's own
/// identity. PACS keys (<c>acct_id</c>, <c>owner_id</c>) live in
/// <c>sync_bridge.source_xref</c> as lineage, not as authority.</para>
///
/// <para><b>PII redaction is the load-bearing invariant of this layer.</b>
/// When <see cref="ConfidentialFlag"/> is <c>true</c>, the projector
/// MUST set:
/// <list type="bullet">
///   <item><see cref="DisplayName"/> to <c>"[Confidential]"</c></item>
///   <item><see cref="FirstName"/> / <see cref="LastName"/> to <c>null</c></item>
///   <item><see cref="BirthDt"/> to <c>null</c></item>
/// </list>
/// The <c>canonical-owner-pii-redaction-policy</c> gate verifies
/// this from the database itself — defense-in-depth even if the
/// projector implementation drifts.</para>
///
/// <para><see cref="WebSuppression"/> is a separate (orthogonal)
/// flag: it does NOT redact at canonical layer; downstream
/// public-facing APIs / map surfaces must consult this flag and
/// hide the row when serving public consumers.</para>
///
/// <para>Every row in this table MUST have a corresponding
/// <c>SourceXref</c> entry with
/// <c>TfEntityType = "owner"</c> and
/// <c>SourceKeyJson = {"acct_id":...}</c>. Within one projection
/// run, a given <c>acct_id</c> produces exactly one
/// <see cref="TfOwner"/> regardless of how many parcels reference
/// it; the parcel→owner edges live on
/// <see cref="TfParcelOwnerLink"/>.</para>
/// </summary>
public sealed class TfOwner
{
    public Guid TfOwnerId { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Sovereign-county isolation. Sourced from the first resolved
    /// parcel's <c>CountyId</c> within this projection run.
    /// </summary>
    public Guid CountyId { get; set; }

    /// <summary>
    /// PACS account id preserved for operator recognition. Not the
    /// canonical identity — that's <see cref="TfOwnerId"/>.
    /// </summary>
    public long AcctId { get; set; }

    /// <summary>
    /// Display name. <c>"[Confidential]"</c> when
    /// <see cref="ConfidentialFlag"/> is true; otherwise the source
    /// <c>file_as_name</c>.
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>NULL when <see cref="ConfidentialFlag"/> is true.</summary>
    public string? FirstName { get; set; }

    /// <summary>NULL when <see cref="ConfidentialFlag"/> is true.</summary>
    public string? LastName { get; set; }

    /// <summary>NULL when <see cref="ConfidentialFlag"/> is true.</summary>
    public DateTime? BirthDt { get; set; }

    /// <summary>
    /// Carried into canonical because downstream services may apply
    /// further policy (logging, audit). The redaction at this layer
    /// has already been performed if true.
    /// </summary>
    public bool ConfidentialFlag { get; set; }

    /// <summary>
    /// Carried for downstream public-facing surfaces. Does NOT
    /// trigger redaction at canonical layer.
    /// </summary>
    public bool WebSuppression { get; set; }

    /// <summary>Operator-side classification (e.g. <c>"I"</c>, <c>"C"</c>).</summary>
    public string? TypeOfOwner { get; set; }

    /// <summary>The B3 promotion batch that created this row.</summary>
    public Guid PromotionLoadBatchId { get; set; }

    /// <summary>
    /// Slice G2 (v1.11): conversion-era marker derived via
    /// <see cref="TerraFusion.Core.Entities.TruthPacs.ConversionEras.MajorityOfTruth"/>
    /// over the contributing <c>truth_pacs.owner_current</c> row(s).
    /// Nullable for back-compat with rows projected before G2.
    /// </summary>
    public string? ConversionEra { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

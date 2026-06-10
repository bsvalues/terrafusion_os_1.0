using System.Collections.Generic;

namespace TerraFusion.Core.Entities.LegacyPacsRaw;

/// <summary>
/// Slice v1.6: closed vocabulary for landing-layer quarantine
/// reasons. Distinct from
/// <see cref="TerraFusion.Core.Entities.SyncBridge.QuarantineReasons"/>,
/// which is the canonical-layer vocabulary.
///
/// <para><b>Two-layer quarantine model</b> (per Block-C contract
/// v1.6, <c>docs/pacs/block-c-contract-v1.6.md</c>):</para>
///
/// <list type="bullet">
///   <item>
///     <b>Landing-layer quarantine</b> (this class). A row is
///     rejected at <c>legacy_pacs_raw → legacy_tf_unproven.*</c>
///     because its closed-vocabulary code is not in the active
///     PACS dictionary at landing time. Emitted by services in
///     <c>TerraFusion.Data.Services.LegacyPacsRaw</c>.
///   </item>
///   <item>
///     <b>Canonical-layer quarantine</b>
///     (<see cref="TerraFusion.Core.Entities.SyncBridge.QuarantineReasons"/>).
///     A row is rejected at <c>truth_pacs → canonical_tf</c>
///     because a canonical TerraFusion entity (parcel, owner,
///     attribute_definition) cannot be resolved. Emitted by
///     services in
///     <c>TerraFusion.Data.Services.CanonicalTf</c>.
///   </item>
/// </list>
///
/// <para><b>Doctrine guarantees (v1.6 §3):</b>
/// <list type="number">
///   <item>The two vocabularies are <b>disjoint</b>. No string
///   appears in both <see cref="All"/> and
///   <c>QuarantineReasons.All</c>. The H2 contract test
///   asserts this invariant.</item>
///   <item>No canonical-layer projector emits a landing-layer
///   reason. No landing-layer service emits a canonical-layer
///   reason. The two cleanup paths are correspondingly
///   filtered: each layer's idempotency cleanup matches only
///   its own vocabulary (see e.g.
///   <c>PacsImprvCanonicalProjector</c> v1.5 §2.4
///   filter-by-reason).</item>
///   <item>Any row in <c>legacy_tf_unproven.imprv_attr</c> can
///   be classified by which layer produced it via
///   <see cref="IsKnown"/> + <c>QuarantineReasons.IsKnown</c>.</item>
/// </list>
/// </para>
///
/// <para>Adding a new landing-layer reason is intentionally a
/// code change — the vocabulary must be reviewed against the
/// provenance doctrine before it lands. There is no runtime
/// extensibility hook.</para>
/// </summary>
public static class LandingQuarantineReasons
{
    /// <summary>
    /// Slice C1-C: an <c>imprv_attr</c> row's
    /// <c>i_attr_val_cd</c> is not in the active PACS dictionary
    /// at landing time. Emitted by
    /// <c>PacsImprvAttrLandingService</c>; the row is preserved
    /// in <c>legacy_tf_unproven.imprv_attr</c> for audit so a
    /// future dictionary refresh can re-promote it.
    /// </summary>
    public const string UnknownIAttrValCd = "UNKNOWN_I_ATTR_VAL_CD";

    /// <summary>
    /// All currently-recognized landing-layer quarantine
    /// reasons. Any value outside this set is a doctrine
    /// violation when written to a
    /// <c>legacy_tf_unproven.*.QuarantineReason</c> column by a
    /// landing-layer service.
    /// </summary>
    public static IReadOnlySet<string> All { get; } = new HashSet<string>
    {
        UnknownIAttrValCd,
    };

    /// <summary>
    /// True iff <paramref name="value"/> is a recognized
    /// landing-layer quarantine reason. Use at the boundary of
    /// any landing-layer code that writes to
    /// <c>QuarantineReason</c>.
    /// </summary>
    public static bool IsKnown(string value) =>
        !string.IsNullOrEmpty(value) && All.Contains(value);
}

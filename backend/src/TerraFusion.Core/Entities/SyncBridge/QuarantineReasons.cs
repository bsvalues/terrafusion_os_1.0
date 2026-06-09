using System.Collections.Generic;

namespace TerraFusion.Core.Entities.SyncBridge;

/// <summary>
/// Slice E4a (v1.4): closed vocabulary for the
/// <c>QuarantineReason</c> column on every
/// <c>legacy_tf_unproven.*</c> table.
///
/// <para>The doctrine treats <c>QuarantineReason</c> as a closed
/// enum stored as varchar(50) for forward-compatibility. Values
/// are defined here as <c>const string</c> so producers reference
/// them by name rather than by literal — typos become compile
/// errors instead of bad data.</para>
///
/// <para>Pre-v1.4 history: NoParcelXref, NoOwnerXref, BothMissing
/// were already shipping in production projectors as
/// <c>private const string</c>s. The v1.0 doctrine doc only listed
/// NoParcelXref. Block-C contract v1.4
/// (<c>docs/pacs/block-c-contract-v1.4.md</c>) corrects that
/// omission cumulatively and adds UnknownAttribute as a new
/// reason.</para>
///
/// <para>Adding a new reason is intentionally a code change:
/// the vocabulary must be reviewed against the provenance
/// doctrine before it lands in <c>QuarantineReason</c>. There
/// is no runtime extensibility hook by design.</para>
/// </summary>
public static class QuarantineReasons
{
    /// <summary>
    /// Truth-pacs row carries a <c>prop_id</c> with no matching
    /// active <c>tf_parcel</c> via <c>source_xref</c>. Emitted by
    /// every canonical projector (S3, B3, B4, C3, L3).
    /// </summary>
    public const string NoParcelXref = "NO_PARCEL_XREF";

    /// <summary>
    /// Truth-pacs row carries an <c>owner_id</c> (== <c>acct_id</c>
    /// in PACS) with no matching active <c>tf_owner</c> via
    /// <c>source_xref</c>. Currently emitted only by B4
    /// (<c>PacsWsdorCanonicalProjector</c>) — the parcel resolved,
    /// the owner did not.
    /// </summary>
    public const string NoOwnerXref = "NO_OWNER_XREF";

    /// <summary>
    /// Truth-pacs row carries both a <c>prop_id</c> and an
    /// <c>owner_id</c> that fail to resolve. Currently emitted
    /// only by B4. Conceptually the union of
    /// <see cref="NoParcelXref"/> + <see cref="NoOwnerXref"/>;
    /// preserved as a distinct reason so the downstream backlog
    /// can prioritize the simpler single-side fix paths
    /// separately.
    /// </summary>
    public const string BothMissing = "BOTH_MISSING";

    /// <summary>
    /// Slice E4a (v1.4): truth-pacs row references a PACS
    /// <c>i_attr_id</c> that has no matching active
    /// <c>canonical_tf.attribute_definition</c> row for the
    /// same county. Reserved for the future projector slice
    /// (E4b) that wires i_attr_id resolution; declared here so
    /// the closed-vocab class is the single source of truth.
    /// </summary>
    public const string UnknownAttribute = "UNKNOWN_ATTRIBUTE";

    /// <summary>
    /// All currently-recognized quarantine reasons. Any value
    /// outside this set is a doctrine violation when written to
    /// a <c>legacy_tf_unproven.*.QuarantineReason</c> column.
    /// </summary>
    public static IReadOnlySet<string> All { get; } = new HashSet<string>
    {
        NoParcelXref,
        NoOwnerXref,
        BothMissing,
        UnknownAttribute,
    };

    /// <summary>
    /// True iff <paramref name="value"/> is a recognized
    /// quarantine reason. Use at the boundary of any code that
    /// writes to <c>QuarantineReason</c>.
    /// </summary>
    public static bool IsKnown(string value) =>
        !string.IsNullOrEmpty(value) && All.Contains(value);
}

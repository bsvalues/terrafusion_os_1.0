namespace TerraFusion.Core.Entities.Canonical;

/// <summary>
/// Slice C35-B: per-axis sales-qualification decision. Each of
/// <c>wac_cd</c> and <c>sl_ratio_type_cd</c> independently produces
/// one of these values; the combined
/// <see cref="CanonicalSaleQualificationDecision"/> is computed by
/// the C36 transform per C8-A's AND-logic.
///
/// <para>Closed enum. Stored as an integer in the database via
/// <c>HasConversion&lt;int&gt;()</c> in the EF configuration.</para>
/// </summary>
public enum CanonicalSaleAxisDecision
{
    /// <summary>
    /// The workbook has a Mapped canonical_value for this axis's
    /// source value AND the operator's mapping declares the value
    /// qualified for comp-pool inclusion.
    /// </summary>
    Qualified = 1,

    /// <summary>
    /// The workbook has a Mapped canonical_value for this axis's
    /// source value AND the operator's mapping declares the value
    /// excluded from comp-pool inclusion (e.g. WA REET exemption
    /// codes per C13-A's WacCd-bug containment).
    /// </summary>
    Excluded = 2,

    /// <summary>
    /// The workbook has no Mapped canonical_value for this axis's
    /// observed source value. Includes (a) source value not in the
    /// workbook's code-value rows at all, and (b) source value
    /// present but the workbook's row is in <c>Deferred</c> /
    /// <c>Excluded</c> review status (no canonical_value committed).
    /// The C8-A read-model already filters Excluded code-values
    /// from its snapshot; the transform sees them as <c>NotMapped</c>.
    /// </summary>
    NotMapped = 3,
}

namespace TerraFusion.Core.Entities.Canonical;

/// <summary>
/// Slice C35-B: combined sales-qualification decision per C8-A's
/// AND-logic exclusion rule. The C36 SalesQualificationTransform
/// computes this from the per-axis
/// <see cref="CanonicalSaleAxisDecision"/> values for
/// <c>wac_cd</c> and <c>sl_ratio_type_cd</c>.
///
/// <para>Closed enum. Stored as an integer in the database via
/// <c>HasConversion&lt;int&gt;()</c> in the EF configuration so the
/// vocabulary can extend forward without a string-rename
/// migration.</para>
/// </summary>
public enum CanonicalSaleQualificationDecision
{
    /// <summary>Both axes qualify; sale enters comp pool.</summary>
    Qualified = 1,

    /// <summary>Either axis excludes; sale rejected from comp pool.</summary>
    Excluded = 2,

    /// <summary>
    /// One or both axes have <see cref="CanonicalSaleAxisDecision.NotMapped"/>
    /// (workbook silent or Deferred-no-canonical_value on the
    /// source value). Consumer treats as not-yet-evaluated.
    /// </summary>
    Inconclusive = 3,
}

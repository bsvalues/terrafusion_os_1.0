namespace TerraFusion.Core.Sync.PacsImprvAttr;

/// <summary>
/// Slice C1-C: closed-vocabulary check for <c>i_attr_val_cd</c>.
///
/// <para>The doctrine: PACS <c>imprv_attr_val</c> (or equivalent) is
/// a CLOSED dictionary table. Any code in the source data that
/// isn't in the active dictionary is suspect — either a stale
/// dictionary or a corrupt source row. The C1-C landing service
/// consults this contract and quarantines unknown codes.</para>
///
/// <para>v1: a simple in-memory implementation backed by a
/// <c>HashSet&lt;string&gt;</c> serves both production and tests.
/// A future slice (D1 in the plan) will materialize the dictionary
/// as a canonical <c>canonical_tf.dim_imprv_attr_val</c> table; the
/// adapter then becomes a DB-backed reader.</para>
/// </summary>
public interface IImprvAttrDictionary
{
    /// <summary>Returns <c>true</c> iff <paramref name="code"/> is in the active dictionary.</summary>
    bool Contains(string code);

    /// <summary>
    /// The total recognized vocabulary count (informational, for
    /// distribution-gate detail).
    /// </summary>
    int Count { get; }
}

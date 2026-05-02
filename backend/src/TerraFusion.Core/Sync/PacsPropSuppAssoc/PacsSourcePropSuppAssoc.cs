namespace TerraFusion.Core.Sync.PacsPropSuppAssoc;

/// <summary>
/// Slice S2-A: source-shaped PACS <c>prop_supp_assoc</c> row.
/// PACS stores the columns as <c>(prop_val_yr, prop_id, sup_num)</c>;
/// the doctrine preserves the same shape during landing.
/// </summary>
public sealed record PacsSourcePropSuppAssoc(
    short PropValYr,
    int PropId,
    short SupNum);

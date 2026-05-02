using System;

namespace TerraFusion.Core.Entities.LegacyPacsRaw;

/// <summary>
/// Slice S2-A: raw <c>prop_supp_assoc</c> landing zone.
///
/// <para>The PACS doctrine: <c>prop_supp_assoc</c> is the supplement
/// pointer that turns "flat property" reads into versioned truth.
/// For each <c>(prop_val_yr, prop_id)</c> the table carries exactly
/// ONE row whose <c>sup_num</c> identifies the active supplement.
/// PACS enforces this with a UNIQUE constraint on
/// <c>(year, prop_id)</c> in addition to the composite PK on
/// <c>(year, prop_id, sup_num)</c>.</para>
///
/// <para>S2-B (the truth_pacs.sale promoter) cannot do its supp-aware
/// join without this table. Any sale row whose
/// <c>(prop_id, prop_val_yr, sup_num)</c> does not match the row
/// here is suspect — either stale or pointing at a non-current
/// supplement.</para>
///
/// <para>Provenance is non-negotiable: <see cref="LoadBatchId"/> and
/// <see cref="SourceQueryHash"/> must be present for every landed
/// row. The S2-A provenance gate verifies this from the database
/// itself.</para>
/// </summary>
public sealed class LegacyPacsRawPropSuppAssoc
{
    /// <summary>Synthetic landing-row id.</summary>
    public Guid LandedRowId { get; set; } = Guid.NewGuid();

    // ── PACS source identity ──────────────────────────────────────
    public short PropValYr { get; set; }
    public int PropId { get; set; }
    public short SupNum { get; set; }

    // ── Provenance (the doctrine's non-negotiable surface) ────────
    public Guid LoadBatchId { get; set; }
    public string SourceQueryHash { get; set; } = string.Empty;
    public string SourceRowHash { get; set; } = string.Empty;
    public DateTime LandedAt { get; set; } = DateTime.UtcNow;
}

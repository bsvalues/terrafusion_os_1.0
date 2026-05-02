using System;

namespace TerraFusion.Core.Entities.LegacyPacsRaw;

/// <summary>
/// Slice B1-B: raw PACS <c>owner</c> landing zone.
///
/// <para>The PACS doctrine: <c>owner</c> is the year-versioned link
/// table between a property and an account (party). Identity is the
/// 4-key composite
/// <c>(owner_tax_yr, sup_num, prop_id, owner_id)</c> — the same
/// shape as the WSDOR-grade <c>wash_prop_owner_val</c> table. The
/// link to the global identity record lives in <see cref="OwnerId"/>,
/// which is a foreign key to <c>account.acct_id</c>.</para>
///
/// <para>For each <c>(prop_id, owner_tax_yr, sup_num)</c>, the rows
/// here describe the ownership graph: zero rows is impossible (an
/// active parcel always has an owner-of-record), one row is the
/// common case, and N>1 rows describe co-ownership with
/// <see cref="PctOwnership"/> percentages summing to 100. The
/// <c>owner-pct-completeness</c> gate surfaces deviations as
/// informational signal without failing the batch — that's the
/// truth-pacs.owner_current promoter's job (B2-A).</para>
///
/// <para>PII surface here is narrower than <c>account</c>: only
/// <see cref="BirthDt"/>. Date of birth is preserved verbatim at this
/// layer; the canonical-layer projection redacts when the linked
/// account's confidential_flag is true.</para>
///
/// <para>Provenance is non-negotiable: <see cref="LoadBatchId"/> +
/// <see cref="SourceQueryHash"/> on every landed row.</para>
/// </summary>
public sealed class LegacyPacsRawOwner
{
    /// <summary>Synthetic landing-row id.</summary>
    public Guid LandedRowId { get; set; } = Guid.NewGuid();

    // ── PACS source identity (the 4-key composite) ────────────────
    public short OwnerTaxYr { get; set; }
    public short SupNum { get; set; }
    public int PropId { get; set; }
    /// <summary>FK to <c>account.acct_id</c>. Same column type (long).</summary>
    public long OwnerId { get; set; }

    // ── Ownership semantics ──────────────────────────────────────
    /// <summary>Percentage of ownership (0–100). Source preserves NULLs.</summary>
    public decimal? PctOwnership { get; set; }

    /// <summary>
    /// Source-side classification (e.g. <c>"I"</c> individual,
    /// <c>"C"</c> corporation, <c>"T"</c> trust). Closed vocabulary
    /// per PACS dictionary; preserved verbatim here.
    /// </summary>
    public string? TypeOfOwner { get; set; }

    /// <summary>
    /// Undivided-interest flag carried by PACS. Surfaced for audit;
    /// the canonical projection consumes it as part of co-ownership
    /// reconciliation (B2-A / B3).
    /// </summary>
    public string? UdiStatus { get; set; }

    // ── PII surface — preserved verbatim at this layer ────────────
    public DateTime? BirthDt { get; set; }

    // ── Provenance (the doctrine's non-negotiable surface) ────────
    public Guid LoadBatchId { get; set; }
    public string SourceQueryHash { get; set; } = string.Empty;
    public string SourceRowHash { get; set; } = string.Empty;
    public DateTime LandedAt { get; set; } = DateTime.UtcNow;
}

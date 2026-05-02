using System;

namespace TerraFusion.Core.Entities.LegacyPacsRaw;

/// <summary>
/// Slice B1-C: raw PACS <c>wash_prop_owner_val</c> landing zone.
///
/// <para>The PACS doctrine: <c>wash_prop_owner_val</c> is the
/// WSDOR-grade per-owner valuation snapshot. Identity is the
/// 4-key composite
/// <c>(year, sup_num, prop_id, owner_id)</c> — same shape as
/// <c>owner</c>. Each row carries the per-owner share of the
/// parcel's assessed/market/taxable values plus WSDOR-mandated
/// audit fields (BoE status, disaster proration, senior-freeze
/// homestead amounts).</para>
///
/// <para>v1 lands the load-bearing subset of the ~30-column source
/// table. Future slices may extend the column set; the doctrine
/// allows additive change without breaking existing consumers
/// (raw landing is opaque-bag-shaped, with promotion gates the only
/// observable contract).</para>
///
/// <para>Provenance is non-negotiable: <see cref="LoadBatchId"/> +
/// <see cref="SourceQueryHash"/> on every landed row.</para>
/// </summary>
public sealed class LegacyPacsRawWashPropOwnerVal
{
    /// <summary>Synthetic landing-row id.</summary>
    public Guid LandedRowId { get; set; } = Guid.NewGuid();

    // ── PACS source identity (the 4-key composite) ────────────────
    public short PropValYr { get; set; }
    public short SupNum { get; set; }
    public int PropId { get; set; }
    public long OwnerId { get; set; }

    // ── Core WSDOR values ─────────────────────────────────────────
    public decimal? AssessedVal { get; set; }
    public decimal? MarketVal { get; set; }
    public decimal? AppraisedVal { get; set; }

    public decimal? TaxableClassified { get; set; }
    public decimal? TaxableNonClassified { get; set; }
    public decimal? LandTaxableClassified { get; set; }
    public decimal? LandTaxableNonClassified { get; set; }
    public decimal? ImprvTaxableClassified { get; set; }
    public decimal? ImprvTaxableNonClassified { get; set; }

    public decimal? StateValueClassified { get; set; }
    public decimal? StateValueNonClassified { get; set; }

    // ── WSDOR audit signals ──────────────────────────────────────
    /// <summary>
    /// Board of Equalization status code (e.g. <c>"P"</c> pending,
    /// <c>"F"</c> final, <c>"A"</c> appeal). PACS dictionary; preserved verbatim.
    /// </summary>
    public string? BoeStatus { get; set; }

    /// <summary>
    /// Disaster proration percentage (0–100). NULL = no proration applied.
    /// </summary>
    public decimal? DisasterProrationPct { get; set; }

    /// <summary>Senior freeze improvement homestead amount.</summary>
    public decimal? SnrFrzImprvHs { get; set; }

    /// <summary>Senior freeze land homestead amount.</summary>
    public decimal? SnrFrzLandHs { get; set; }

    // ── Provenance (the doctrine's non-negotiable surface) ────────
    public Guid LoadBatchId { get; set; }
    public string SourceQueryHash { get; set; } = string.Empty;
    public string SourceRowHash { get; set; } = string.Empty;
    public DateTime LandedAt { get; set; } = DateTime.UtcNow;
}

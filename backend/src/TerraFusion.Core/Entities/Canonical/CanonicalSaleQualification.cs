using System;

namespace TerraFusion.Core.Entities.Canonical;

/// <summary>
/// Slice C35-B: canonical landing row for a sale's qualification
/// decision per C8-A (transform contract) and C35-A (schema policy).
/// One row per <c>(CountyId, ChgOfOwnerId)</c>. Written by the C36
/// SalesQualificationTransform after reading a Mapped Mapping
/// Workbook. Read by sales-comp / ratio-study / Forge consumers.
///
/// <para>Idempotent: re-evaluation of the same sale against a
/// re-locked workbook overwrites the row in place. Audit trail of
/// prior decisions lives in <c>AuditLogs</c> (FISMA-required) - NOT
/// in this table.</para>
///
/// <para>FIRST canonical landing table in TerraFusion - see
/// <c>docs/sync/canonical-sales-qualification-landing-schema-policy.md</c>
/// for the full contract.</para>
///
/// <para>Sovereign County isolation: the primary key is
/// <c>(CountyId, ChgOfOwnerId)</c>, so the same chg_of_owner_id from
/// two different counties (extremely unlikely in PACS but allowed in
/// principle) cannot collide.</para>
///
/// <para>No-PII safeguard: this row carries the qualification
/// decision + sale identity + a price/date snapshot. It does NOT
/// carry grantor/grantee names, addresses, or any other PII from the
/// PACS sale row. Downstream consumers requiring PII must read PACS
/// directly under their own access controls.</para>
/// </summary>
public sealed class CanonicalSaleQualification
{
    // Identity (PRIMARY KEY = (CountyId, ChgOfOwnerId))

    /// <summary>County the sale belongs to. Sovereign-county isolation.</summary>
    public Guid CountyId { get; set; }

    /// <summary>
    /// PACS canonical sale identity per D0-D
    /// (<c>dbo.sale.chg_of_owner_id</c>). Unique per sale event in
    /// PACS. Combined with <see cref="CountyId"/> forms the primary
    /// key.
    /// </summary>
    public int ChgOfOwnerId { get; set; }

    // Decision (per C8-A AND-logic exclusion)

    /// <summary>
    /// Combined decision per C8-A's AND-logic: <c>Qualified</c> iff
    /// both axis decisions are <c>Qualified</c>; <c>Excluded</c> iff
    /// either axis decision is <c>Excluded</c>; <c>Inconclusive</c>
    /// iff one or both axes have <c>NotMapped</c> (workbook is silent
    /// or Deferred-no-canonical_value on that source value).
    /// </summary>
    public CanonicalSaleQualificationDecision ComputedDecision { get; set; }

    // Per-axis evaluation (for explainability)

    /// <summary>The sale's <c>wac_cd</c> source value at evaluation time.</summary>
    public string? WacCdSourceValue { get; set; }

    /// <summary>
    /// The workbook's canonical_value for this <c>wac_cd</c>, or
    /// <c>null</c> if the workbook had no Mapped row for this source
    /// value.
    /// </summary>
    public string? WacCdCanonicalValue { get; set; }

    /// <summary>Per-axis decision for the wac_cd axis.</summary>
    public CanonicalSaleAxisDecision WacCdAxisDecision { get; set; }

    /// <summary>The sale's <c>sl_ratio_type_cd</c> source value at evaluation time.</summary>
    public string? SlRatioTypeCdSourceValue { get; set; }

    /// <summary>
    /// The workbook's canonical_value for this
    /// <c>sl_ratio_type_cd</c>, or <c>null</c> if the workbook had no
    /// Mapped row for this source value.
    /// </summary>
    public string? SlRatioTypeCdCanonicalValue { get; set; }

    /// <summary>Per-axis decision for the sl_ratio_type_cd axis.</summary>
    public CanonicalSaleAxisDecision SlRatioTypeCdAxisDecision { get; set; }

    // Workbook provenance

    /// <summary>
    /// The Mapping Workbook that produced this decision. Soft FK
    /// (Guid + audit timestamp); the workbook may be Archived /
    /// replaced over time but the historical decision row's integrity
    /// is preserved.
    /// </summary>
    public Guid SourceWorkbookId { get; set; }

    /// <summary>
    /// The workbook's <c>UpdatedAt</c> at lock time. Snapshot, not a
    /// live reference - if the workbook is later edited (cannot
    /// happen while Mapped, but archived workbooks can be replaced),
    /// this field still points to the lock-stamp at write time.
    /// </summary>
    public DateTime SourceWorkbookLockedAt { get; set; }

    // PACS sale snapshot (read-time, for ratio-study audit)

    /// <summary>The sale's <c>sl_dt</c> at evaluation time. Optional.</summary>
    public DateTime? SaleDate { get; set; }

    /// <summary>The sale's <c>sl_price</c> at evaluation time. Optional.</summary>
    public decimal? SalePrice { get; set; }

    // Audit (FISMA-HIGH per CLAUDE.md)

    /// <summary>Auto-set on insert.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Auto-set on update.</summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Operator id; "c36-transform" for transform-driven writes.</summary>
    public string? CreatedBy { get; set; }

    /// <summary>Operator id.</summary>
    public string? UpdatedBy { get; set; }
}

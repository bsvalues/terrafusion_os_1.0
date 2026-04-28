using System;
using System.Threading;
using System.Threading.Tasks;
using TerraFusion.Core.Entities.Canonical;

namespace TerraFusion.Sync.Workbench.Transforms.Sales;

/// <summary>
/// Slice C36: write-side abstraction for the C8-B sales qualification
/// transform. Persists one canonical decision row to
/// <c>CanonicalSaleQualifications</c> via the EF DbContext, idempotent
/// re-write per the C35-A policy: re-evaluation of the same sale
/// against a re-locked workbook overwrites the row in place.
///
/// <para>Identity: <c>(CountyId, ChgOfOwnerId)</c> per D0-D's PACS
/// canonical sale identity policy. Audit trail of prior decisions
/// lives in <c>AuditLogs</c> (FISMA-required), NOT in this table —
/// the writer overwrites rather than appends.</para>
///
/// <para>Hard guards (per C35-A):
/// <list type="bullet">
/// <item>Locked-workbook-only writes — caller must have validated
///   the source workbook is <c>Status='Mapped'</c> before calling
///   this writer (the C36 runner does this via
///   <c>ISyncMappingWorkbookReadModel.LoadMappedAsync</c> before any
///   writer invocation).</item>
/// <item>Per-sale-evaluation; no aggregations.</item>
/// <item>No PACS mutation; the writer touches only TerraFusion DB.</item>
/// <item>No PII — the persisted row carries decision + identity +
///   per-axis explanation + price/date snapshot; never grantor /
///   grantee names / addresses.</item>
/// </list>
/// </para>
/// </summary>
public interface ICanonicalSalesQualificationWriter
{
    /// <summary>
    /// Upsert one canonical decision row.
    ///
    /// <para>If a row with primary key <c>(CountyId, ChgOfOwnerId)</c>
    /// already exists, the writer updates its mutable fields in place
    /// (decision, per-axis values, workbook provenance, sale
    /// snapshot, audit-stamp). If it does not exist, the writer
    /// inserts a fresh row.</para>
    ///
    /// <para>Returns the entity post-save (with audit fields stamped
    /// by the DbContext layer) for runner-side counting / logging.</para>
    /// </summary>
    Task<CanonicalSaleQualification> UpsertAsync(
        CanonicalSalesQualificationWriteRequest request,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Per-sale upsert payload. Constructed by the C36 runner from the
/// SalesQualificationEvaluation + the originating SalesRow + workbook
/// provenance.
/// </summary>
/// <param name="CountyId">
/// Sovereign-county isolation; primary-key part 1.
/// </param>
/// <param name="ChgOfOwnerId">
/// PACS canonical sale identity (int per D0-D); primary-key part 2.
/// </param>
/// <param name="Evaluation">
/// The C8-B-computed decision and per-axis evaluation for this sale.
/// </param>
/// <param name="WacCdSourceValue">
/// The sale's <c>wac_cd</c> value at evaluation time.
/// </param>
/// <param name="SlRatioTypeCdSourceValue">
/// The sale's <c>sl_ratio_type_cd</c> value at evaluation time.
/// </param>
/// <param name="SourceWorkbookId">
/// The Mapped workbook that produced the decision.
/// </param>
/// <param name="SourceWorkbookLockedAt">
/// The workbook's <c>UpdatedAt</c> at lock time (snapshot).
/// </param>
/// <param name="SaleDate">
/// Optional <c>sale.sl_dt</c> snapshot.
/// </param>
/// <param name="SalePrice">
/// Optional <c>sale.sl_price</c> snapshot.
/// </param>
/// <param name="OperatorId">
/// Operator id for audit stamping (CreatedBy on insert; UpdatedBy on
/// update). Typical value: "c36-transform" for transform-driven runs.
/// </param>
public sealed record CanonicalSalesQualificationWriteRequest(
    Guid CountyId,
    int ChgOfOwnerId,
    SalesQualificationEvaluation Evaluation,
    string? WacCdSourceValue,
    string? SlRatioTypeCdSourceValue,
    Guid SourceWorkbookId,
    DateTime SourceWorkbookLockedAt,
    DateTime? SaleDate,
    decimal? SalePrice,
    string OperatorId);

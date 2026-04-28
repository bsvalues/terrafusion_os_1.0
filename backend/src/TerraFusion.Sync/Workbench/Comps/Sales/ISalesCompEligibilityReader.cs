using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Comps.Sales;

/// <summary>
/// Slice C37-B: read-side filter that surfaces comp-eligible sales
/// from the C35-B canonical landing table
/// (<c>CanonicalSaleQualifications</c>) per the C37-A policy.
///
/// <para>Single selection rule:
/// <c>ComputedDecision = Qualified</c>. Both <c>Excluded</c>
/// (operator-explicit) and <c>Inconclusive</c> (workbook-gap or
/// data-gap on at least one axis) are NOT comp-eligible. This is the
/// WacCd-bug containment per operator memory: pre-conversion /
/// problematic <c>wac_cd</c> codes land as Excluded (operator-tagged)
/// or Inconclusive (workbook-silent) and the filter rejects both.</para>
///
/// <para>Hard guards (per C37-A):
/// <list type="bullet">
/// <item>Read-only — pure SELECT projection; never mutates the
///   canonical landing or any other table.</item>
/// <item>County-scoped — <paramref name="countyId"/> is required;
///   no all-counties mode.</item>
/// <item>No workbook-side reads — does NOT call
///   <c>LoadMappedAsync</c>; the C36 writer enforces
///   <c>Status='Mapped'</c> upstream.</item>
/// <item>No PII — projects only the canonical row's PII-free fields.</item>
/// <item>Idempotent — same input ⇒ same output.</item>
/// <item>Workbook-pin opt-in — when
///   <paramref name="sourceWorkbookId"/> is supplied, results are
///   restricted to canonical rows produced by that exact workbook
///   lock-version. When omitted, all Qualified rows for the county
///   are returned.</item>
/// </list>
/// </para>
///
/// <para>Empty-result semantics: returns an empty list for unknown
/// county / no-Qualified-rows. Does NOT throw. Zero comps is a valid
/// state.</para>
/// </summary>
public interface ISalesCompEligibilityReader
{
    /// <summary>
    /// Return the comp-eligible sales for a county. Optionally pinned
    /// to a specific Mapped workbook id.
    /// </summary>
    /// <param name="countyId">Sovereign-county scope (required).</param>
    /// <param name="sourceWorkbookId">
    /// Optional workbook-pin. When supplied, only canonical rows
    /// produced by that exact workbook lock-version are returned.
    /// When <c>null</c>, all Qualified rows for the county are
    /// returned regardless of which workbook produced them.
    /// </param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>
    /// Comp-eligible sales in deterministic <c>ChgOfOwnerId</c>-asc
    /// order so re-runs produce identical evidence.
    /// </returns>
    Task<IReadOnlyList<CompEligibleSale>> ReadAsync(
        Guid countyId,
        Guid? sourceWorkbookId,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// One comp-eligible sale's projection from
/// <c>CanonicalSaleQualifications</c>. PII-free by construction —
/// the canonical landing table never carried grantor / grantee /
/// address fields, so neither does this projection.
/// </summary>
/// <param name="ChgOfOwnerId">
/// PACS canonical sale identity (the <c>chg_of_owner_id</c> int).
/// Combined with the calling county scope, this is the canonical
/// sale primary key.
/// </param>
/// <param name="WacCdSourceValue">
/// The sale's <c>wac_cd</c> at evaluation time.
/// </param>
/// <param name="WacCdCanonicalValue">
/// The workbook's canonical_value for that wac_cd. Non-null because
/// only Qualified rows are returned and Qualified means the wac axis
/// landed as operator-mapped with a canonical value.
/// </param>
/// <param name="SlRatioTypeCdSourceValue">
/// The sale's <c>sl_ratio_type_cd</c> at evaluation time.
/// </param>
/// <param name="SlRatioTypeCdCanonicalValue">
/// The workbook's canonical_value for that sl_ratio_type_cd. Non-null
/// for the same reason as the wac canonical value.
/// </param>
/// <param name="SaleDate">
/// Optional <c>sale.sl_dt</c> snapshot taken at evaluation time.
/// </param>
/// <param name="SalePrice">
/// Optional <c>sale.sl_price</c> snapshot taken at evaluation time.
/// </param>
/// <param name="SourceWorkbookId">
/// The Mapped workbook that produced this canonical row.
/// </param>
/// <param name="SourceWorkbookLockedAt">
/// The workbook's <c>UpdatedAt</c> at lock time.
/// </param>
public sealed record CompEligibleSale(
    int       ChgOfOwnerId,
    string?   WacCdSourceValue,
    string?   WacCdCanonicalValue,
    string?   SlRatioTypeCdSourceValue,
    string?   SlRatioTypeCdCanonicalValue,
    DateTime? SaleDate,
    decimal?  SalePrice,
    Guid      SourceWorkbookId,
    DateTime  SourceWorkbookLockedAt);

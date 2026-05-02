using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Transforms.Sales;

/// <summary>
/// Slice BENTON-SYNC-7-B: read-only coverage-continuity smoke per
/// the BENTON-SYNC-7-A policy at
/// <c>docs/sync/sales-qualification-coverage-continuity-smoke-policy.md</c>.
///
/// <para>Reads the universe of PACS sale rows under a defined scope,
/// runs the C8-B transform fresh against each, compares the fresh
/// decision to whatever sits in <c>CanonicalSaleQualifications</c>
/// for the same county / ChgOfOwnerId, and emits a verdict identifying
/// three gap classes: forward-coverage gaps, backward-traceability
/// gaps, and decision drift.</para>
///
/// <para>Hard guards (per BENTON-SYNC-7-A):</para>
/// <list type="bullet">
/// <item>HG3 read-only — never writes to <c>CanonicalSaleQualifications</c>,
/// PACS, or the workbook.</item>
/// <item>HG7 fail-closed — non-Mapped workbook throws via
/// <c>LoadMappedAsync</c> before any PACS / canonical read.</item>
/// <item>County-scoped — workbook's CountyId must match the supplied
/// CountyId; cross-county invocations fail closed.</item>
/// <item>No autoremediation — gaps are surfaced; the smoke does NOT
/// re-run the C36 canonical write path.</item>
/// </list>
/// </summary>
public interface ISalesQualificationCoverageRunner
{
    /// <summary>
    /// Run the coverage-continuity smoke. Returns a structured
    /// report; never persists.
    /// </summary>
    /// <param name="countyId">County scope; must match workbook's CountyId.</param>
    /// <param name="workbookId">Mapping workbook (Status='Mapped' enforced).</param>
    /// <param name="sourceConnectionId">PACS source connection.</param>
    /// <param name="maxSales">
    /// Optional upper bound on PACS rows scanned. <c>null</c> means
    /// "scan the row reader's natural maximum" (the
    /// <see cref="SqlServerSalesRowReader"/> uses TOP-N internally;
    /// <c>null</c> here passes <c>int.MaxValue</c> to the reader,
    /// which the reader interprets as "all rows" up to the
    /// county's PACS scope). Bounded runs mark the
    /// backward-traceability gap as inconclusive.
    /// </param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task<SalesQualificationCoverageReport> RunAsync(
        Guid countyId,
        Guid workbookId,
        Guid sourceConnectionId,
        int? maxSales,
        CancellationToken cancellationToken = default);
}

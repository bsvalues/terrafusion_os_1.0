using System;
using System.Threading;
using System.Threading.Tasks;
using TerraFusion.Sync.Workbench.Mapping;

namespace TerraFusion.Tools.SalesCompProof;

/// <summary>
/// Slice C42-A: resolves the workbook id the SalesCompProof tool
/// should run against, given the operator's CLI inputs and the
/// county active-workbook pointer.
///
/// <para>Resolution rules (locked):
/// <list type="number">
/// <item>Explicit <c>--workbook-id</c> takes precedence and bypasses
///   the pointer lookup.</item>
/// <item>When omitted, look up the C41-B active-workbook pointer for
///   the county.</item>
/// <item>When omitted AND no pointer exists, return <c>null</c> so
///   the caller can fail closed with the standard message:
///   <c>"No active Mapping Workbook is configured for county
///   &lt;countyId&gt;. Provide --workbook-id or set the county active
///   workbook."</c></item>
/// </list>
/// </para>
///
/// <para>Pure logic on top of <see cref="ISyncCountyActiveWorkbookService"/>;
/// no I/O, no logging, no console writes. The caller (Program.RunAsync)
/// owns operator messaging and exit codes.</para>
/// </summary>
public static class WorkbookIdResolver
{
    /// <summary>
    /// Standard fail-closed message when <c>--workbook-id</c> was
    /// omitted and the county has no active-workbook pointer. Kept
    /// as a public constant so tests can lock the exact wording the
    /// operator runbook depends on.
    /// </summary>
    public static string NoActiveWorkbookMessage(Guid countyId) =>
        $"No active Mapping Workbook is configured for county {countyId}. " +
        "Provide --workbook-id or set the county active workbook.";

    /// <summary>
    /// Resolve the effective workbook id. Returns <c>null</c> only
    /// when the operator omitted <c>--workbook-id</c> AND the county
    /// has no pointer; the caller maps that to a fail-closed exit
    /// (code 2) with <see cref="NoActiveWorkbookMessage"/>.
    /// </summary>
    public static async Task<Guid?> ResolveAsync(
        Guid countyId,
        Guid? explicitWorkbookId,
        ISyncCountyActiveWorkbookService pointerService,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(pointerService);

        if (explicitWorkbookId.HasValue && explicitWorkbookId.Value != Guid.Empty)
        {
            // Hard precedence: explicit --workbook-id bypasses the
            // pointer entirely. Operators retain the ability to
            // proof against an older workbook for diagnostic /
            // audit purposes without first re-pointing the county.
            return explicitWorkbookId.Value;
        }

        var ptr = await pointerService.GetAsync(countyId, cancellationToken);
        return ptr?.ActiveWorkbookId;
    }
}

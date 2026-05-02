using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.PacsOwnerTruth;

/// <summary>
/// Slice B2-A: orchestrator for raw → truth promotion of PACS
/// owners.
///
/// <para>Inputs: a completed B1-B owner-landing batch + a completed
/// B1-A account-landing batch + a completed S2-A
/// prop_supp_assoc-landing batch.
/// Output: rows in <c>truth_pacs.owner_current</c> for every owner
/// row that (a) has a matching <c>(prop_id, owner_tax_yr)</c> supp
/// pointer, (b) the owner's <c>sup_num</c> matches that pointer, and
/// (c) the owner's <c>OwnerId</c> resolves to a row in the account
/// batch.</para>
///
/// <para>The doctrine HARDENS at this layer:
/// the <c>truth-pacs-owner-pct-completeness</c> gate FAILs the batch
/// if any <c>(prop_id, owner_tax_yr)</c> group's pct values do not
/// sum to 100 (within tolerance). At raw layer this was
/// informational only; at truth, it's a hard gate.</para>
///
/// <para>Idempotent by <c>ownerLoadBatchId</c>: re-running deletes
/// any prior <c>truth_pacs.owner_current</c> rows whose
/// <c>OwnerLoadBatchId</c> matches before inserting new ones.</para>
/// </summary>
public interface IPacsOwnerCurrentTruthPromoter
{
    Task<PacsOwnerCurrentTruthResult> PromoteAsync(
        Guid ownerLoadBatchId,
        Guid accountLoadBatchId,
        Guid suppAssocLoadBatchId,
        string operatorName,
        CancellationToken cancellationToken = default);
}

/// <summary>Slice B2-A: outcome of one promotion run.</summary>
public sealed record PacsOwnerCurrentTruthResult
{
    public required Guid PromotionLoadBatchId { get; init; }

    /// <summary>'COMPLETED' | 'FAILED' | 'REFUSED'.</summary>
    public required string Status { get; init; }

    public required int OwnersConsidered { get; init; }
    public required int OwnersPromoted { get; init; }

    public required int RejectedNoSuppPointer { get; init; }
    public required int RejectedStaleSupNum { get; init; }
    public required int RejectedNoAccount { get; init; }

    /// <summary>
    /// Count of <c>(prop_id, owner_tax_yr)</c> groups whose pct sums
    /// did not equal 100 (within 0.01 tolerance) or whose rows
    /// contained NULL pct. The truth layer treats these as a hard
    /// gate FAIL.
    /// </summary>
    public required int PctCompletenessViolations { get; init; }

    /// <summary>How many prior truth rows were removed (idempotency proof).</summary>
    public required int PriorRowsRemoved { get; init; }

    public string? ErrorSummary { get; init; }
}

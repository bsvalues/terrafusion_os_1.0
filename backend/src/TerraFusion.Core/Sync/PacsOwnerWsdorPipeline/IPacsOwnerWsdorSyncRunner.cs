using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.PacsOwnerWsdorPipeline;

/// <summary>
/// Operator-trigger orchestrator for Block B's owner+WSDOR pipeline.
///
/// <para>Inputs: four already-landed source-batch ids
/// (B1-A account, B1-B owner, S2-A prop_supp_assoc, B1-C
/// wash_prop_owner_val). The runner chains four stages
/// sequentially:
/// <list type="number">
///   <item>B2-A truth promote owner_current</item>
///   <item>B2-B truth promote wash_prop_owner_val</item>
///   <item>B3 canonical project tf_owner + tf_parcel_owner_link</item>
///   <item>B4 canonical project tf_assessment_wsdor (depends on B3
///   for owner xref resolution)</item>
/// </list>
/// </para>
///
/// <para>Doctrine: stages do NOT chain past a non-COMPLETED
/// upstream. The WSDOR truth promotion runs only if the owner truth
/// promotion completes (defensive sequencing — they don't directly
/// depend on each other, but a failed half-pipeline is the worst
/// audit artifact). The canonical WSDOR projection runs only if the
/// canonical owner projection completes (B4's owner xref index
/// requires B3's xref writes).</para>
///
/// <para>The runner does NOT trigger raw landings. Those are
/// source-connection-dependent and have their own services. This is
/// the "promote-what-you-already-landed" trigger for Block B,
/// mirroring the Block A sales pipeline trigger.</para>
/// </summary>
public interface IPacsOwnerWsdorSyncRunner
{
    Task<PacsOwnerWsdorSyncRunResult> RunAsync(
        Guid ownerLoadBatchId,
        Guid accountLoadBatchId,
        Guid suppAssocLoadBatchId,
        Guid wpovLoadBatchId,
        string operatorName,
        CancellationToken cancellationToken = default);
}

/// <summary>Combined run result — Block B operator trigger.</summary>
public sealed record PacsOwnerWsdorSyncRunResult
{
    /// <summary>
    /// Top-level outcome:
    /// <c>COMPLETED</c> | <c>TRUTH_OWNER_REFUSED</c> |
    /// <c>TRUTH_OWNER_FAILED</c> | <c>TRUTH_WSDOR_REFUSED</c> |
    /// <c>TRUTH_WSDOR_FAILED</c> | <c>CANONICAL_OWNER_REFUSED</c> |
    /// <c>CANONICAL_OWNER_FAILED</c> | <c>CANONICAL_WSDOR_REFUSED</c> |
    /// <c>CANONICAL_WSDOR_FAILED</c>.
    /// </summary>
    public required string Status { get; init; }

    // ── Stage 1: B2-A owner truth promotion ───────────────────────
    public required Guid TruthOwnerLoadBatchId { get; init; }
    public required string TruthOwnerStatus { get; init; }
    public required int OwnersConsidered { get; init; }
    public required int OwnersPromoted { get; init; }
    public required int OwnerRejectedNoSuppPointer { get; init; }
    public required int OwnerRejectedStaleSupNum { get; init; }
    public required int OwnerRejectedNoAccount { get; init; }
    public required int OwnerPctCompletenessViolations { get; init; }

    // ── Stage 2: B2-B WSDOR truth promotion ──────────────────────
    /// <summary>Set when stage 2 ran (truth owner stage COMPLETED).</summary>
    public required Guid TruthWsdorLoadBatchId { get; init; }

    /// <summary>'NOT_RUN' | 'COMPLETED' | 'REFUSED' | 'FAILED'.</summary>
    public required string TruthWsdorStatus { get; init; }
    public required int WsdorRowsConsidered { get; init; }
    public required int WsdorRowsPromoted { get; init; }
    public required int WsdorRejectedNoSuppPointer { get; init; }
    public required int WsdorRejectedStaleSupNum { get; init; }

    // ── Stage 3: B3 canonical owner projection ───────────────────
    public required Guid CanonicalOwnerLoadBatchId { get; init; }

    /// <summary>'NOT_RUN' | 'COMPLETED' | 'REFUSED' | 'FAILED'.</summary>
    public required string CanonicalOwnerStatus { get; init; }
    public required int OwnersProjected { get; init; }
    public required int LinksProjected { get; init; }
    public required int OwnerRowsQuarantined { get; init; }

    // ── Stage 4: B4 canonical WSDOR projection ───────────────────
    public required Guid CanonicalWsdorLoadBatchId { get; init; }

    /// <summary>'NOT_RUN' | 'COMPLETED' | 'REFUSED' | 'FAILED'.</summary>
    public required string CanonicalWsdorStatus { get; init; }
    public required int WsdorRowsProjected { get; init; }
    public required int WsdorRowsQuarantined { get; init; }
    public required int WsdorRejectedNoParcelXref { get; init; }
    public required int WsdorRejectedNoOwnerXref { get; init; }
    public required int WsdorRejectedBothMissing { get; init; }

    public string? ErrorSummary { get; init; }
}

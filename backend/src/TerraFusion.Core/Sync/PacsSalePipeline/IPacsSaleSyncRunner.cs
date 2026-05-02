using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.PacsSalePipeline;

/// <summary>
/// Operator-trigger orchestrator for the Block A sales pipeline.
///
/// <para>Inputs: a completed S1 sale-landing batch id and a completed
/// S2-A prop_supp_assoc-landing batch id. The runner chains:
/// <list type="number">
///   <item>S2-B truth promotion (raw → truth_pacs)</item>
///   <item>S3 canonical projection (truth_pacs → canonical_tf, with
///   <c>legacy_tf_unproven.sale</c> quarantine)</item>
/// </list>
/// </para>
///
/// <para>Returns a combined view of the run: both promotion batch
/// ids, the doctrine-shaped row counts, and either a COMPLETED
/// status or the first stage that produced a non-COMPLETED result
/// (REFUSED / FAILED). Stages do NOT chain past a non-COMPLETED
/// upstream — the doctrine treats half-way runs as audit poison.</para>
///
/// <para>The runner does NOT trigger S1 or S2-A. Those are source-
/// connection-dependent and have their own controllers. This is the
/// "promote-what-you-already-landed" trigger.</para>
/// </summary>
public interface IPacsSaleSyncRunner
{
    Task<PacsSaleSyncRunResult> RunAsync(
        Guid saleLoadBatchId,
        Guid suppAssocLoadBatchId,
        string operatorName,
        CancellationToken cancellationToken = default);
}

/// <summary>Combined run result.</summary>
public sealed record PacsSaleSyncRunResult
{
    /// <summary>'COMPLETED' | 'TRUTH_REFUSED' | 'TRUTH_FAILED' | 'CANONICAL_REFUSED' | 'CANONICAL_FAILED'.</summary>
    public required string Status { get; init; }

    public required Guid TruthPromotionLoadBatchId { get; init; }
    public required string TruthStatus { get; init; }
    public required int SalesConsidered { get; init; }
    public required int SalesPromoted { get; init; }
    public required int RejectedNotQualified { get; init; }
    public required int RejectedNoSuppPointer { get; init; }
    public required int RejectedStaleSupNum { get; init; }
    public required int RejectedStaleAxis { get; init; }

    /// <summary>
    /// Set when the truth promotion succeeded; the canonical
    /// projection's batch id. <c>Guid.Empty</c> when truth refused
    /// or failed.
    /// </summary>
    public required Guid CanonicalPromotionLoadBatchId { get; init; }

    /// <summary>'NOT_RUN' | 'COMPLETED' | 'REFUSED' | 'FAILED'.</summary>
    public required string CanonicalStatus { get; init; }

    public required int SalesProjected { get; init; }
    public required int SalesQuarantined { get; init; }

    public string? ErrorSummary { get; init; }
}

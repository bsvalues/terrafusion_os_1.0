using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Sync.PacsOwnerCanonical;
using TerraFusion.Core.Sync.PacsOwnerTruth;
using TerraFusion.Core.Sync.PacsOwnerWsdorPipeline;
using TerraFusion.Core.Sync.PacsWsdorCanonical;
using TerraFusion.Core.Sync.PacsWashPropOwnerValTruth;

namespace TerraFusion.Data.Services.Pipeline;

/// <summary>
/// Default <see cref="IPacsOwnerWsdorSyncRunner"/>: sequences the
/// four Block B promotion stages and returns a combined result.
///
/// <para>Doctrine: short-circuits on any non-COMPLETED upstream.
/// Sequencing rules:
/// <list type="bullet">
///   <item>Truth WSDOR (stage 2) does not run unless truth Owner
///   (stage 1) COMPLETED. Defensive: a half-pipeline is audit poison.</item>
///   <item>Canonical Owner (stage 3) does not run unless truth WSDOR
///   (stage 2) COMPLETED. Same reasoning.</item>
///   <item>Canonical WSDOR (stage 4) does not run unless canonical
///   Owner (stage 3) COMPLETED. <b>Required</b>: B4's owner xref
///   index reads <c>source_xref</c> entries that B3 produces.</item>
/// </list>
/// </para>
/// </summary>
public sealed class PacsOwnerWsdorSyncRunner : IPacsOwnerWsdorSyncRunner
{
    private readonly IPacsOwnerCurrentTruthPromoter _ownerTruth;
    private readonly IPacsWashPropOwnerValTruthPromoter _wsdorTruth;
    private readonly IPacsOwnerCanonicalProjector _ownerCanonical;
    private readonly IPacsWsdorCanonicalProjector _wsdorCanonical;
    private readonly ILogger<PacsOwnerWsdorSyncRunner> _logger;

    public PacsOwnerWsdorSyncRunner(
        IPacsOwnerCurrentTruthPromoter ownerTruth,
        IPacsWashPropOwnerValTruthPromoter wsdorTruth,
        IPacsOwnerCanonicalProjector ownerCanonical,
        IPacsWsdorCanonicalProjector wsdorCanonical,
        ILogger<PacsOwnerWsdorSyncRunner> logger)
    {
        _ownerTruth = ownerTruth;
        _wsdorTruth = wsdorTruth;
        _ownerCanonical = ownerCanonical;
        _wsdorCanonical = wsdorCanonical;
        _logger = logger;
    }

    public async Task<PacsOwnerWsdorSyncRunResult> RunAsync(
        Guid ownerLoadBatchId,
        Guid accountLoadBatchId,
        Guid suppAssocLoadBatchId,
        Guid wpovLoadBatchId,
        string operatorName,
        CancellationToken cancellationToken = default)
    {
        // ── Stage 1: B2-A owner truth promotion. ──
        var ownerTruth = await _ownerTruth
            .PromoteAsync(ownerLoadBatchId, accountLoadBatchId, suppAssocLoadBatchId,
                operatorName, cancellationToken)
            .ConfigureAwait(false);

        _logger.LogInformation(
            "[OwnerWsdorRunner] stage 1 (truth owner) status={Status} promoted={Promoted} batch={BatchId}",
            ownerTruth.Status, ownerTruth.OwnersPromoted, ownerTruth.PromotionLoadBatchId);

        if (ownerTruth.Status != "COMPLETED")
        {
            return ShortCircuitAtTruthOwner(ownerTruth);
        }

        // ── Stage 2: B2-B WSDOR truth promotion. ──
        var wsdorTruth = await _wsdorTruth
            .PromoteAsync(wpovLoadBatchId, suppAssocLoadBatchId, operatorName, cancellationToken)
            .ConfigureAwait(false);

        _logger.LogInformation(
            "[OwnerWsdorRunner] stage 2 (truth wsdor) status={Status} promoted={Promoted} batch={BatchId}",
            wsdorTruth.Status, wsdorTruth.RowsPromoted, wsdorTruth.PromotionLoadBatchId);

        if (wsdorTruth.Status != "COMPLETED")
        {
            return ShortCircuitAtTruthWsdor(ownerTruth, wsdorTruth);
        }

        // ── Stage 3: B3 canonical owner projection. ──
        var ownerCanonical = await _ownerCanonical
            .ProjectAsync(ownerTruth.PromotionLoadBatchId, operatorName, cancellationToken)
            .ConfigureAwait(false);

        _logger.LogInformation(
            "[OwnerWsdorRunner] stage 3 (canonical owner) status={Status} owners={Owners} links={Links} batch={BatchId}",
            ownerCanonical.Status, ownerCanonical.OwnersProjected,
            ownerCanonical.LinksProjected, ownerCanonical.PromotionLoadBatchId);

        if (ownerCanonical.Status != "COMPLETED")
        {
            return ShortCircuitAtCanonicalOwner(ownerTruth, wsdorTruth, ownerCanonical);
        }

        // ── Stage 4: B4 canonical WSDOR projection.
        //    Note: depends on stage 3 for owner xref index. ──
        var wsdorCanonical = await _wsdorCanonical
            .ProjectAsync(wsdorTruth.PromotionLoadBatchId, operatorName, cancellationToken)
            .ConfigureAwait(false);

        _logger.LogInformation(
            "[OwnerWsdorRunner] stage 4 (canonical wsdor) status={Status} projected={Projected} quarantined={Quarantined} batch={BatchId}",
            wsdorCanonical.Status, wsdorCanonical.RowsProjected,
            wsdorCanonical.RowsQuarantined, wsdorCanonical.PromotionLoadBatchId);

        var combinedStatus = wsdorCanonical.Status switch
        {
            "COMPLETED" => "COMPLETED",
            "REFUSED" => "CANONICAL_WSDOR_REFUSED",
            _ => "CANONICAL_WSDOR_FAILED",
        };

        return new PacsOwnerWsdorSyncRunResult
        {
            Status = combinedStatus,
            TruthOwnerLoadBatchId = ownerTruth.PromotionLoadBatchId,
            TruthOwnerStatus = ownerTruth.Status,
            OwnersConsidered = ownerTruth.OwnersConsidered,
            OwnersPromoted = ownerTruth.OwnersPromoted,
            OwnerRejectedNoSuppPointer = ownerTruth.RejectedNoSuppPointer,
            OwnerRejectedStaleSupNum = ownerTruth.RejectedStaleSupNum,
            OwnerRejectedNoAccount = ownerTruth.RejectedNoAccount,
            OwnerPctCompletenessViolations = ownerTruth.PctCompletenessViolations,

            TruthWsdorLoadBatchId = wsdorTruth.PromotionLoadBatchId,
            TruthWsdorStatus = wsdorTruth.Status,
            WsdorRowsConsidered = wsdorTruth.RowsConsidered,
            WsdorRowsPromoted = wsdorTruth.RowsPromoted,
            WsdorRejectedNoSuppPointer = wsdorTruth.RejectedNoSuppPointer,
            WsdorRejectedStaleSupNum = wsdorTruth.RejectedStaleSupNum,

            CanonicalOwnerLoadBatchId = ownerCanonical.PromotionLoadBatchId,
            CanonicalOwnerStatus = ownerCanonical.Status,
            OwnersProjected = ownerCanonical.OwnersProjected,
            LinksProjected = ownerCanonical.LinksProjected,
            OwnerRowsQuarantined = ownerCanonical.RowsQuarantined,

            CanonicalWsdorLoadBatchId = wsdorCanonical.PromotionLoadBatchId,
            CanonicalWsdorStatus = wsdorCanonical.Status,
            WsdorRowsProjected = wsdorCanonical.RowsProjected,
            WsdorRowsQuarantined = wsdorCanonical.RowsQuarantined,
            WsdorRejectedNoParcelXref = wsdorCanonical.RejectedNoParcelXref,
            WsdorRejectedNoOwnerXref = wsdorCanonical.RejectedNoOwnerXref,
            WsdorRejectedBothMissing = wsdorCanonical.RejectedBothMissing,

            ErrorSummary = wsdorCanonical.ErrorSummary,
        };
    }

    // ── Short-circuit builders ─────────────────────────────────────

    private static PacsOwnerWsdorSyncRunResult ShortCircuitAtTruthOwner(
        PacsOwnerCurrentTruthResult ownerTruth)
        => new()
        {
            Status = ownerTruth.Status == "REFUSED"
                ? "TRUTH_OWNER_REFUSED" : "TRUTH_OWNER_FAILED",
            TruthOwnerLoadBatchId = ownerTruth.PromotionLoadBatchId,
            TruthOwnerStatus = ownerTruth.Status,
            OwnersConsidered = ownerTruth.OwnersConsidered,
            OwnersPromoted = ownerTruth.OwnersPromoted,
            OwnerRejectedNoSuppPointer = ownerTruth.RejectedNoSuppPointer,
            OwnerRejectedStaleSupNum = ownerTruth.RejectedStaleSupNum,
            OwnerRejectedNoAccount = ownerTruth.RejectedNoAccount,
            OwnerPctCompletenessViolations = ownerTruth.PctCompletenessViolations,

            TruthWsdorLoadBatchId = Guid.Empty,
            TruthWsdorStatus = "NOT_RUN",
            WsdorRowsConsidered = 0,
            WsdorRowsPromoted = 0,
            WsdorRejectedNoSuppPointer = 0,
            WsdorRejectedStaleSupNum = 0,

            CanonicalOwnerLoadBatchId = Guid.Empty,
            CanonicalOwnerStatus = "NOT_RUN",
            OwnersProjected = 0,
            LinksProjected = 0,
            OwnerRowsQuarantined = 0,

            CanonicalWsdorLoadBatchId = Guid.Empty,
            CanonicalWsdorStatus = "NOT_RUN",
            WsdorRowsProjected = 0,
            WsdorRowsQuarantined = 0,
            WsdorRejectedNoParcelXref = 0,
            WsdorRejectedNoOwnerXref = 0,
            WsdorRejectedBothMissing = 0,

            ErrorSummary = ownerTruth.ErrorSummary,
        };

    private static PacsOwnerWsdorSyncRunResult ShortCircuitAtTruthWsdor(
        PacsOwnerCurrentTruthResult ownerTruth,
        PacsWashPropOwnerValTruthResult wsdorTruth)
        => new()
        {
            Status = wsdorTruth.Status == "REFUSED"
                ? "TRUTH_WSDOR_REFUSED" : "TRUTH_WSDOR_FAILED",
            TruthOwnerLoadBatchId = ownerTruth.PromotionLoadBatchId,
            TruthOwnerStatus = ownerTruth.Status,
            OwnersConsidered = ownerTruth.OwnersConsidered,
            OwnersPromoted = ownerTruth.OwnersPromoted,
            OwnerRejectedNoSuppPointer = ownerTruth.RejectedNoSuppPointer,
            OwnerRejectedStaleSupNum = ownerTruth.RejectedStaleSupNum,
            OwnerRejectedNoAccount = ownerTruth.RejectedNoAccount,
            OwnerPctCompletenessViolations = ownerTruth.PctCompletenessViolations,

            TruthWsdorLoadBatchId = wsdorTruth.PromotionLoadBatchId,
            TruthWsdorStatus = wsdorTruth.Status,
            WsdorRowsConsidered = wsdorTruth.RowsConsidered,
            WsdorRowsPromoted = wsdorTruth.RowsPromoted,
            WsdorRejectedNoSuppPointer = wsdorTruth.RejectedNoSuppPointer,
            WsdorRejectedStaleSupNum = wsdorTruth.RejectedStaleSupNum,

            CanonicalOwnerLoadBatchId = Guid.Empty,
            CanonicalOwnerStatus = "NOT_RUN",
            OwnersProjected = 0,
            LinksProjected = 0,
            OwnerRowsQuarantined = 0,

            CanonicalWsdorLoadBatchId = Guid.Empty,
            CanonicalWsdorStatus = "NOT_RUN",
            WsdorRowsProjected = 0,
            WsdorRowsQuarantined = 0,
            WsdorRejectedNoParcelXref = 0,
            WsdorRejectedNoOwnerXref = 0,
            WsdorRejectedBothMissing = 0,

            ErrorSummary = wsdorTruth.ErrorSummary,
        };

    private static PacsOwnerWsdorSyncRunResult ShortCircuitAtCanonicalOwner(
        PacsOwnerCurrentTruthResult ownerTruth,
        PacsWashPropOwnerValTruthResult wsdorTruth,
        PacsOwnerCanonicalResult ownerCanonical)
        => new()
        {
            Status = ownerCanonical.Status == "REFUSED"
                ? "CANONICAL_OWNER_REFUSED" : "CANONICAL_OWNER_FAILED",
            TruthOwnerLoadBatchId = ownerTruth.PromotionLoadBatchId,
            TruthOwnerStatus = ownerTruth.Status,
            OwnersConsidered = ownerTruth.OwnersConsidered,
            OwnersPromoted = ownerTruth.OwnersPromoted,
            OwnerRejectedNoSuppPointer = ownerTruth.RejectedNoSuppPointer,
            OwnerRejectedStaleSupNum = ownerTruth.RejectedStaleSupNum,
            OwnerRejectedNoAccount = ownerTruth.RejectedNoAccount,
            OwnerPctCompletenessViolations = ownerTruth.PctCompletenessViolations,

            TruthWsdorLoadBatchId = wsdorTruth.PromotionLoadBatchId,
            TruthWsdorStatus = wsdorTruth.Status,
            WsdorRowsConsidered = wsdorTruth.RowsConsidered,
            WsdorRowsPromoted = wsdorTruth.RowsPromoted,
            WsdorRejectedNoSuppPointer = wsdorTruth.RejectedNoSuppPointer,
            WsdorRejectedStaleSupNum = wsdorTruth.RejectedStaleSupNum,

            CanonicalOwnerLoadBatchId = ownerCanonical.PromotionLoadBatchId,
            CanonicalOwnerStatus = ownerCanonical.Status,
            OwnersProjected = ownerCanonical.OwnersProjected,
            LinksProjected = ownerCanonical.LinksProjected,
            OwnerRowsQuarantined = ownerCanonical.RowsQuarantined,

            CanonicalWsdorLoadBatchId = Guid.Empty,
            CanonicalWsdorStatus = "NOT_RUN",
            WsdorRowsProjected = 0,
            WsdorRowsQuarantined = 0,
            WsdorRejectedNoParcelXref = 0,
            WsdorRejectedNoOwnerXref = 0,
            WsdorRejectedBothMissing = 0,

            ErrorSummary = ownerCanonical.ErrorSummary,
        };
}

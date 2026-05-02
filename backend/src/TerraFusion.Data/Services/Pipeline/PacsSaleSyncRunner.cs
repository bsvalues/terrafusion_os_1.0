using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Sync.PacsSaleCanonical;
using TerraFusion.Core.Sync.PacsSalePipeline;
using TerraFusion.Core.Sync.PacsSaleTruth;

namespace TerraFusion.Data.Services.Pipeline;

/// <summary>
/// Default <see cref="IPacsSaleSyncRunner"/>: sequences S2-B then S3
/// against a pair of already-landed source batches and returns a
/// combined result.
///
/// <para>Doctrine: short-circuits on any non-COMPLETED upstream. A
/// REFUSED truth promotion never feeds canonical (the canonical
/// stage stays NOT_RUN). A FAILED truth promotion never feeds
/// canonical either. The half-way run is the worst possible audit
/// artifact, so we don't produce one.</para>
/// </summary>
public sealed class PacsSaleSyncRunner : IPacsSaleSyncRunner
{
    private readonly IPacsSaleTruthPromoter _truthPromoter;
    private readonly IPacsSaleCanonicalProjector _canonicalProjector;
    private readonly ILogger<PacsSaleSyncRunner> _logger;

    public PacsSaleSyncRunner(
        IPacsSaleTruthPromoter truthPromoter,
        IPacsSaleCanonicalProjector canonicalProjector,
        ILogger<PacsSaleSyncRunner> logger)
    {
        _truthPromoter = truthPromoter;
        _canonicalProjector = canonicalProjector;
        _logger = logger;
    }

    public async Task<PacsSaleSyncRunResult> RunAsync(
        Guid saleLoadBatchId,
        Guid suppAssocLoadBatchId,
        string operatorName,
        CancellationToken cancellationToken = default)
    {
        var truth = await _truthPromoter
            .PromoteAsync(saleLoadBatchId, suppAssocLoadBatchId, operatorName, cancellationToken)
            .ConfigureAwait(false);

        _logger.LogInformation(
            "[SalesSyncRunner] truth stage status={Status} considered={Considered} promoted={Promoted} batch={BatchId}",
            truth.Status, truth.SalesConsidered, truth.SalesPromoted, truth.PromotionLoadBatchId);

        if (truth.Status != "COMPLETED")
        {
            return new PacsSaleSyncRunResult
            {
                Status = truth.Status == "REFUSED" ? "TRUTH_REFUSED" : "TRUTH_FAILED",
                TruthPromotionLoadBatchId = truth.PromotionLoadBatchId,
                TruthStatus = truth.Status,
                SalesConsidered = truth.SalesConsidered,
                SalesPromoted = truth.SalesPromoted,
                RejectedNotQualified = truth.RejectedNotQualified,
                RejectedNoSuppPointer = truth.RejectedNoSuppPointer,
                RejectedStaleSupNum = truth.RejectedStaleSupNum,
                RejectedStaleAxis = truth.RejectedStaleAxis,
                CanonicalPromotionLoadBatchId = Guid.Empty,
                CanonicalStatus = "NOT_RUN",
                SalesProjected = 0,
                SalesQuarantined = 0,
                ErrorSummary = truth.ErrorSummary,
            };
        }

        var canonical = await _canonicalProjector
            .ProjectAsync(truth.PromotionLoadBatchId, operatorName, cancellationToken)
            .ConfigureAwait(false);

        _logger.LogInformation(
            "[SalesSyncRunner] canonical stage status={Status} considered={Considered} projected={Projected} quarantined={Quarantined} batch={BatchId}",
            canonical.Status, canonical.TruthSalesConsidered, canonical.SalesProjected,
            canonical.SalesQuarantined, canonical.PromotionLoadBatchId);

        var combinedStatus = canonical.Status switch
        {
            "COMPLETED" => "COMPLETED",
            "REFUSED" => "CANONICAL_REFUSED",
            _ => "CANONICAL_FAILED",
        };

        return new PacsSaleSyncRunResult
        {
            Status = combinedStatus,
            TruthPromotionLoadBatchId = truth.PromotionLoadBatchId,
            TruthStatus = truth.Status,
            SalesConsidered = truth.SalesConsidered,
            SalesPromoted = truth.SalesPromoted,
            RejectedNotQualified = truth.RejectedNotQualified,
            RejectedNoSuppPointer = truth.RejectedNoSuppPointer,
            RejectedStaleSupNum = truth.RejectedStaleSupNum,
            RejectedStaleAxis = truth.RejectedStaleAxis,
            CanonicalPromotionLoadBatchId = canonical.PromotionLoadBatchId,
            CanonicalStatus = canonical.Status,
            SalesProjected = canonical.SalesProjected,
            SalesQuarantined = canonical.SalesQuarantined,
            ErrorSummary = canonical.ErrorSummary,
        };
    }
}
